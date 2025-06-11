import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { SelectionManager } from './selectionManager';
import { eraseShape, isNearCircle, isNearDiamond, isNearPoint, isNearRectangle, isNearText, isPointNearLine } from './eraser';
import { prisma } from '@repo/db';
import { getAllShapes } from '@/actions';
import { loadShapesFromDB } from './indexDB';

export type Tool = 'rect' | 'circle' | 'pencil' | 'line' | 'text' | 'arrow' | 'diamond' | 'draw' | 'eraser' | 'select' | 'camera' | 'iframe' | 'hand';

export interface Shape {
  id: string;
  type: Tool;
  x: number;
  y: number;
  endX: number;
  endY: number;
  width?: number;
  height?: number;
  rotation?: number;
  size?: number;
  text?: string;
  path?: { x: number; y: number }[]; // For freehand drawing
  color: string;
  bgColor: string;
  strokeWidth: number;
  strokeStyle: string;
  opacity: number;

  url?: string;
}

export class Draw {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private socket: WebSocket | null;
  private allowAnonymous: boolean;
  private roomId: string;
  public shapes: Shape[] = [];
  private isDrawing = false;
  private x: number = 0;
  private y: number = 0;
  private isPanning = false;
  private panStartX = 0;
  private panStartY = 0;
  private redrawTimeout: NodeJS.Timeout | null = null;
  private currentTool: Tool = 'select';
  public selectedShape: Shape | null = null;
  private tempPath: { x: number; y: number }[] = [];
  public transform = { scale: 1, offsetX: 0, offsetY: 0 };
  public currColor: string = "white";
  public currBgColor: string = "#ffffff00";
  public currStrokeWidth: number = 2;
  public currStrokeStyle: string = "solid";
  public currOpacity: number = 1;
  private hoveredShapes: Shape[] = [];
  public selectionManager: SelectionManager;

  constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket, allowAnonymous: boolean = false) {
    this.canvas = canvas;
    this.roomId = roomId;
    this.socket = socket || null;
    this.allowAnonymous = allowAnonymous;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get canvas context');
    this.ctx = ctx;

    this.selectionManager = new SelectionManager(this.ctx, this.canvas);

    this.init();
    this.setupCanvas();
    this.setupEventListeners();
    this.setupSocketListeners();
  }

  async init() {
    const localShapes = await loadShapesFromDB();
    if (localShapes.length > 0) {
      this.shapes = localShapes;
      this.redraw();
    }

    if (!this.allowAnonymous) {
      const data = await this.fetchExistingShapes();
      console.log(data, "data in init");

      this.shapes = data.message;
      this.redraw();
    }
  }

  destroy() {
    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.canvas.removeEventListener("mouseup", this.handleMouseUp);
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    this.canvas.removeEventListener("wheel", this.handleWheel);
    this.canvas.removeEventListener("dblclick", this.handleDoubleClick);
  }

  setTool(tool: Tool) {
    this.currentTool = tool;
      if (tool === "hand") {
        this.canvas.style.cursor = 'grab';
    } 
    else if (tool !== "select") {
      this.selectedShape = null;
      this.selectionManager.setSelectedShape(null);
      this.redraw();
    }
  }

  setColor(color: string) {
    this.currColor = color;
  }

  setBgColor(color: string) {
    this.currBgColor = color;
  }

  setStrokeWidth(width: number) {
    this.currStrokeWidth = width;
  }

  setStrokeStyle(style: string) {
    this.currStrokeStyle = style;
  }

  setOpacity(opacity: number) {
    this.currOpacity = opacity;
  }

  private setupCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    window.addEventListener('resize', this.resizeCanvas);
  }

  private resizeCanvas = () => {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.redraw();
  };

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey) {
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      this.transform.scale *= zoomFactor;
    } else {
      this.transform.offsetX -= e.deltaX;
      this.transform.offsetY -= e.deltaY;
    }
    this.redraw();
  };

  private handleDoubleClick = (e: MouseEvent) => {
    e.preventDefault();
    // Only handle double-click for text tool or when selecting existing text
    if (this.currentTool === "text" ||
      (this.currentTool === "select" && this.shapes.some(shape =>
        shape.type === "text" &&
        this.isPointInShape(this.getCanvasPoint(e).x, this.getCanvasPoint(e).y, shape)
      ))) {
      const point = this.getCanvasPoint(e);
      const rect = this.canvas.getBoundingClientRect();

      // Convert canvas coordinates to screen coordinates
      const screenX = rect.left + this.transform.offsetX + (point.x * this.transform.scale);
      const screenY = rect.top + this.transform.offsetY + (point.y * this.transform.scale);

      // Check if we're clicking on existing text
      const clickedText = this.shapes.find(shape =>
        shape.type === "text" &&
        this.isPointInShape(point.x, point.y, shape)
      );

      if (clickedText) {
        // Edit existing text
        this.addInput(screenX, screenY, clickedText.text || '');
      } else if (this.currentTool === "text") {
        // Create new text
        this.addInput(screenX, screenY, '');
      }
      return;
    }
  };

  private async fetchExistingShapes(): Promise<{ id: Record<string, string>, message: Shape[] }> {
    try {
      // const response = await axios.get(`${process.env.NEXT_PUBLIC_HTTP_URL}/api/room/${this.roomId}/shapes`);
      const fetchedShapes = await getAllShapes(this.roomId);
      const message: Shape[] = [];
      const idMap: Record<string, string> = {};

      fetchedShapes.forEach((x: { id: string, message: string }, index: number) => {
        try {
          const parsedMessage = JSON.parse(x.message);
          // parsedMessage.id = x.id;
          message.push(parsedMessage);
          idMap[index.toString()] = x.id;
        } catch (error) {
          console.log('Invalid JSON in shape message:', x.message, error);
        }
      });

      return { id: idMap, message };
    } catch (error) {
      console.error('Failed to fetch shapes:', error);
      return { id: {}, message: [] };
    }
  }

  private setupEventListeners() {
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('wheel', this.handleWheel);

    //Small Screens Events
    this.canvas.addEventListener('touchstart', this.handleTouchStart);
    this.canvas.addEventListener('touchmove', this.handleTouchMove);
    this.canvas.addEventListener('touchend', this.handleTouchEnd);

    this.canvas.addEventListener('touchStart', (e) => e.preventDefault(), { passive: false });
    this.canvas.addEventListener('touchMove', (e) => e.preventDefault(), { passive: false });
  }

  private setupSocketListeners() {
    if (this.socket && !this.allowAnonymous) {
      this.socket.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'NEW_MESSAGE') {
            const shape = JSON.parse(message.payload.message);
            console.log(message.payload, "message.payload in NEW_MESSAGE");
            const existingIndex = this.shapes.findIndex((s) => s.id === shape.id);
            if (existingIndex === -1) {
              this.shapes.push(shape);
            } else {
              // Replace existing shape to avoid duplicates
              this.shapes[existingIndex] = shape;
            }
            if (this.selectedShape && this.selectedShape.id === shape.id) {
              this.selectedShape = shape;
              this.selectionManager.setSelectedShape(shape);
            }
            this.redraw();
          }

          if (message.type === 'DELETE_SHAPE') {
            this.shapes = this.shapes.filter((shape) => shape.id !== message.payload.shapeId);
            this.redraw();
          }

          if (message.type === 'SHAPE_UPDATED') {
            const updatedShape = JSON.parse(message.payload.shape);
            const index = this.shapes.findIndex((shape) => shape.id === updatedShape.id);
            if (index !== -1) {
              this.shapes[index] = updatedShape;
              this.redraw();
            }

          }
        } catch (error) {
          console.error('Failed to parse incoming message:', event.data, error);
        }
      });
    }

  }

  private addInput(x: number, y: number, initialText: string) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = initialText
    input.style.position = "fixed";
    input.style.left = `${x}px`;
    input.style.top = `${y}px`;
    input.style.background = "rgba(0, 0, 0, 0.8)";
    input.style.color = this.currColor;
    input.style.outline = "none";
    input.style.fontSize = `${24 * this.transform.scale}px`;
    input.style.fontFamily = "Bagel Fat One, cursive";
    input.style.maxWidth = "300px";
    input.style.padding = "4px 8px";
    input.style.borderRadius = "4px";
    input.style.zIndex = "1000";
    document.body.appendChild(input);

    if (initialText) {
      input.setSelectionRange(0, initialText.length)
    }

    setTimeout(() => {
      input.focus()
      if (initialText) input.select();
    }, 0);

    const cleanup = () => {
      // Remove all event listeners
      input.removeEventListener('keydown', handleKeyDown);
      input.removeEventListener('blur', handleBlur);
      document.removeEventListener('mousedown', handleClickOutside);

      // Only remove if still in DOM
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    };

    const handleSubmit = () => {
      if (input.value.trim() !== "") {
        const rect = this.canvas.getBoundingClientRect();

        // Convert screen coordinates back to canvas coordinates
        const canvasX = (x - rect.left - this.transform.offsetX) / this.transform.scale;
        const canvasY = (y - rect.top - this.transform.offsetY) / this.transform.scale;
        const metrics = this.ctx.measureText(input.value.trim());


        const newShape: Shape = {
          id: uuidv4(),
          type: "text",
          x: canvasX,
          y: canvasY,
          endX: canvasX + metrics.width,  // Properly set endX based on text width
          endY: canvasY + 24,
          text: input.value.trim(),
          color: this.currColor,
          bgColor: this.currBgColor,
          strokeWidth: this.currStrokeWidth,
          strokeStyle: this.currStrokeStyle,
          opacity: this.currOpacity
        }

        // Update existing shape if we were editing
        const existingIndex = this.shapes.findIndex(s => s.type === 'text' &&
          Math.abs(s.x - newShape.x) < 10 &&
          Math.abs(s.y - newShape.y) < 10);

        if (existingIndex >= 0) {
          this.shapes[existingIndex] = newShape;
          this.sendShapeUpdateToServer(newShape, newShape.id);
        } else {
          this.shapes.push(newShape);
          this.sendShapeToServer(newShape);
        }
        this.redraw();
      }
      cleanup()
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSubmit();
      }
      if (e.key === 'Escape') {
        cleanup();
      }
    }

    const handleBlur = () => {
      handleSubmit();
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!input.contains(event.target as Node)) {
        handleSubmit()
      }
    }


    input.addEventListener('keydown', handleKeyDown);
    input.addEventListener('blur', handleBlur);
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)
  }

  private handleTouchStart = (e: TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch?.clientX,
      clientY: touch?.clientY,
    })
    this.handleMouseDown(mouseEvent)
  }

  private handleTouchMove = (e: TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch?.clientX,
      clientY: touch?.clientY,
    })
    this.handleMouseMove(mouseEvent)
  }

  private handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault()
    const mouseEvent = new MouseEvent('mouseup', {})
    this.handleMouseUp(mouseEvent)
  }

  private handleMouseDown = (e: MouseEvent) => {
    const point = this.getCanvasPoint(e);
    this.x = point.x;
    this.y = point.y;


    if (this.currentTool === "hand") {
      this.isPanning = true;
      this.panStartX = e.clientX;
      this.panStartY = e.clientY;
      this.canvas.style.cursor = 'grabbing';
      return;
    }
    if (this.currentTool === "select") {

      if (this.selectedShape) {
        const bounds = this.selectionManager.getShapeBounds(this.selectedShape)
        const handle = this.selectionManager.getResizeHandleAtPoint(point.x, point.y, bounds)

        if (handle) {
          this.selectionManager.startResizing(point.x, point.y)
          return
        }
      }

      // Check shapes from top to bottom (reverse iteration)
      for (let i = this.shapes.length - 1; i >= 0; i--) {
        const shape = this.shapes[i];
        if (this.isPointInShape(point.x, point.y, shape as Shape)) {
          this.selectedShape = shape as Shape;
          this.selectionManager.setSelectedShape(shape as Shape);
          this.selectionManager.startDragging(point.x, point.y);
          this.redraw();
          return;
        }
      }

      this.selectedShape = null;
      this.selectionManager.setSelectedShape(null);

      // this.selectedShape = this.shapes.find((shape) => this.isPointInShape(point.x, point.y, shape)) || null;
      // this.selectionManager.setSelectedShape(this.selectedShape);

      // if (this.selectedShape) {
      //   this.selectionManager.startDragging(point.x, point.y)
      // }

      this.redraw();
      return;
    } else {
      let cursor = "crosshair";
      switch (this.currentTool) {
        case 'pencil': cursor = 'url(/pencil-icon.png), auto'; break;
        case 'eraser': cursor = 'url(/eraser-cursor.png) 0 24, auto'; break;
        case 'text': cursor = 'text'; break;
        default: cursor = 'crosshair';
      }
      this.canvas.style.cursor = cursor;
    }

    if (this.currentTool === "eraser" && this.hoveredShapes.length > 0) {
      this.sendShapeDeletionToServer(this.shapes?.find((shape) => this.isPointInShape(point.x, point.y, shape))?.id!); // Send deletion to server
      // this.shapes = eraseShape(this.shapes, point.x, point.y, 10, this.socket, this.roomId);
      const shapeToDelete = this.hoveredShapes[0];

      this.shapes = this.shapes.filter(s => s.id !== shapeToDelete?.id);
      this.socket?.send(JSON.stringify({
        type: "eraser",
        id: shapeToDelete?.id,
        roomId: this.roomId
      }));

      this.hoveredShapes = [];
      this.redraw();
      return;
    }

    if (this.currentTool === "text") {
      const rect = this.canvas.getBoundingClientRect();
      const canvasX = rect.left + this.transform.offsetX + (point.x * this.transform.scale);
      const canvasY = rect.top + this.transform.offsetY + (point.y * this.transform.scale);
      this.addInput(canvasX, canvasY, '');
      return;
    }

    this.isDrawing = true;

    if (this.currentTool === "pencil") {
      this.tempPath = [{ x: point.x, y: point.y }];
      this.ctx.beginPath();
      this.ctx.moveTo(point.x, point.y);
      this.ctx.strokeStyle = this.currColor;
      this.ctx.lineWidth = this.currStrokeWidth;
      this.ctx.globalAlpha = this.currOpacity;
      switch (this.currStrokeStyle) {
        case "solid": this.ctx.setLineDash([]); break;
        case "dotted": this.ctx.setLineDash([this.currStrokeWidth, this.currStrokeWidth * 2]); break;
        case "dashed": this.ctx.setLineDash([this.currStrokeWidth * 4, this.currStrokeWidth * 2]); break;
      }
    } else {
      this.selectedShape = {
        id: uuidv4(),
        type: this.currentTool,
        x: point.x,
        y: point.y,
        endX: point.x,
        endY: point.y,
        color: this.currColor,
        bgColor: this.currBgColor,
        strokeWidth: this.currStrokeWidth,
        strokeStyle: this.currStrokeStyle,
        opacity: this.currOpacity,
      };

      if (this.currentTool === "iframe") {
        const url = prompt("Enter website URL for the iframe:");
        if (url) {
          this.selectedShape.url = url;
        } else {
          // Cancel drawing if URL wasn't provided
          this.isDrawing = false;
          this.selectedShape = null;
          return;
        }
      }
    }

  };

  private handleMouseMove = (e: MouseEvent) => {
    const point = this.getCanvasPoint(e);

    if (this.currentTool === "hand" && this.isPanning) {
      const dx = e.clientX - this.panStartX;
      const dy = e.clientY - this.panStartY;
      this.transform.offsetX += dx;
      this.transform.offsetY += dy;
      this.panStartX = e.clientX;
      this.panStartY = e.clientY;
      this.redraw();
      return;
    }
    if (this.currentTool === "select") {
      if (this.selectionManager.isDraggingShape() || this.selectionManager.isResizingShape()) {
        if (this.selectionManager.isDraggingShape()) {
          this.selectionManager.updateDragging(point.x, point.y)
        } else if (this.selectionManager.isResizingShape()) {
          this.selectionManager.updateResizing(point.x, point.y)
        }
        this.redraw()
      } else if (this.selectedShape) {
        const bounds = this.selectionManager.getShapeBounds(this.selectedShape)
        const handle = this.selectionManager.getResizeHandleAtPoint(point.x, point.y, bounds)

        this.canvas.style.cursor = handle?.cursor || 'auto'
        if (this.selectedShape.type === "iframe") {
          this.selectedShape.width = Math.abs(point.x - this.selectedShape.x);
          this.selectedShape.height = Math.abs(point.y - this.selectedShape.y);
        }
      }
      return
    }


    if (this.isDrawing) {
      if (this.currentTool === "pencil") {
        this.tempPath.push({ x: point.x, y: point.y });
        this.drawPencilSegment(
          this.tempPath[this.tempPath.length - 2],
          this.tempPath[this.tempPath.length - 1]!
        );
      } else if (this.selectedShape) {
        this.selectedShape.endX = point.x;
        this.selectedShape.endY = point.y;
        // Calculate width and height for rectangles and diamonds
        if (this.selectedShape.type === "rect" || this.selectedShape.type === "diamond") {
          this.selectedShape.width = Math.abs(point.x - this.selectedShape.x);
          this.selectedShape.height = Math.abs(point.y - this.selectedShape.y);
        }
        this.redraw();
      }
    }

    if (this.currentTool === "eraser") {
      this.hoveredShapes = [...this.shapes].reverse().filter(shape =>
        this.isPointInShape(point.x, point.y, shape)
      );
      this.redraw();
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (this.currentTool === "hand" && this.isPanning) {
      this.isPanning = false;
      this.canvas.style.cursor = 'grab';
      return;
    }
    if (this.currentTool === "select") {
      if (this.selectionManager.isDraggingShape() || this.selectionManager.isResizingShape()) {
        if (this.selectionManager.isDraggingShape()) {
          this.selectionManager.stopDragging()
        } else {
          this.selectionManager.stopResizing()
        }

        if (this.selectedShape) {
          this.sendShapeUpdateToServer(this.selectedShape, this.selectedShape.id)
        }
        this.redraw()
      }
      return
    }

    if (this.isDrawing) {
      if (this.currentTool === "pencil" && this.tempPath.length > 1) {
        const newShape = {
          id: uuidv4(),
          type: "pencil" as Tool,
          x: 0,
          y: 0,
          endX: 0,
          endY: 0,
          path: [...this.tempPath],
          color: this.currColor,
          bgColor: this.currBgColor,
          strokeWidth: this.currStrokeWidth,
          strokeStyle: this.currStrokeStyle,
          opacity: this.currOpacity,
        };
        this.shapes.push(newShape);
        this.sendShapeToServer(newShape);
        this.tempPath = [];
      } else if (this.selectedShape) {
        // Ensure width and height are set for rectangles and diamonds
        if (this.selectedShape.type === "rect" || this.selectedShape.type === "diamond") {
          this.selectedShape.width = Math.abs(this.selectedShape.endX - this.selectedShape.x);
          this.selectedShape.height = Math.abs(this.selectedShape.endY - this.selectedShape.y);
        } else if (this.selectedShape.type === "circle") {
          this.selectedShape.width = Math.abs(this.selectedShape.endX - this.selectedShape.x);
          this.selectedShape.height = Math.abs(this.selectedShape.endY - this.selectedShape.y);
        }
        this.shapes.push(this.selectedShape);
        this.sendShapeToServer(this.selectedShape);
      }
      this.isDrawing = false;
      this.selectedShape = null;
      this.redraw();
    }
  };

  private async sendShapeToServer(shape: Shape) {
    console.log(this.socket, this?.socket?.OPEN, "this.socket.OPEN in sendShapeToServer");

    if (!this.allowAnonymous && this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: 'NEW_MESSAGE',
          payload: { message: JSON.stringify(shape), roomId: this.roomId },
        })
      );
    }
  }

  private sendShapeUpdateToServer(shape: Shape, shapeId: string) {
    console.log(shape, shapeId, "shape in sendShapeUpdateToServer");

    if (!this.allowAnonymous && this.socket) {
      this.socket.send(
        JSON.stringify({
          type: 'UPDATE_SHAPE',
          payload: { message: JSON.stringify(shape), roomId: this.roomId, shapeId: shapeId },
        })
      );
    }

  }

  private sendShapeDeletionToServer(shapeId: string) {
    console.log(shapeId, "shapeId in sendShapeDeletionToServer");

    if (!this.allowAnonymous && this.socket) {
      this.socket.send(
        JSON.stringify({
          type: 'DELETE_SHAPE',
          payload: { shapeId, roomId: this.roomId },
        })
      );
    }

  }

  private getCanvasPoint(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const scale = this.transform.scale;
    return {
      x: (e.clientX - rect.left - this.transform.offsetX) / scale,
      y: (e.clientY - rect.top - this.transform.offsetY) / scale,
    };
  }

  private drawPencilSegment(prevPoint: { x: number, y: number } | undefined, currentPoint: { x: number, y: number }) {
    if (!prevPoint) return

    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.moveTo(prevPoint.x, prevPoint.y)
    this.ctx.lineTo(currentPoint.x, currentPoint.y)

    this.ctx.strokeStyle = this.currColor
    this.ctx.lineWidth = this.currStrokeWidth
    this.ctx.globalAlpha = this.currOpacity


    switch (this.currStrokeStyle) {
      case "solid": this.ctx.setLineDash([]); break
      case "dotted": this.ctx.setLineDash([this.currStrokeWidth, this.currStrokeWidth * 2]); break
      case "dashed": this.ctx.setLineDash([this.currStrokeWidth * 4, this.currStrokeWidth * 2]); break
    }

    this.ctx.stroke()
    this.ctx.restore()
  }

  private drawTempPencilPath() {
    if (this.tempPath.length < 2) return

    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.moveTo(this.tempPath[0]?.x as number, this.tempPath[0]?.y as number)

    this.ctx.strokeStyle = this.currColor
    this.ctx.lineWidth = this.currStrokeWidth
    this.ctx.globalAlpha = this.currOpacity


    switch (this.currStrokeStyle) {
      case "solid": this.ctx.setLineDash([]); break
      case "dotted": this.ctx.setLineDash([this.currStrokeWidth, this.currStrokeWidth * 2]); break
      case "dashed": this.ctx.setLineDash([this.currStrokeWidth * 4, this.currStrokeWidth * 2]); break
    }

    for (let i = 1; i < this.tempPath.length; i++) {
      this.ctx.lineTo(this.tempPath?.[i]?.x as number, this.tempPath?.[i]?.y as number);
    }
    this.ctx.stroke()
    this.ctx.restore()
  }

  private redraw() {
    if (this.redrawTimeout) clearTimeout(this.redrawTimeout);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(this.transform.offsetX, this.transform.offsetY);
    this.ctx.scale(this.transform.scale, this.transform.scale);

    this.ctx.font = '24px Bagel Fat One, cursive';
    this.shapes.forEach((shape) => this.drawShape(shape));

    if (this.isDrawing && this.selectedShape && this.currentTool !== "pencil") {
      this.drawShape(this.selectedShape);
    }

    if (this.currentTool === "pencil" && this.tempPath.length > 0) {
      this.drawTempPencilPath()
    }

    // Draw selection box if a shape is selected
    if (this.selectedShape) {
      const bounds = this.selectionManager.getShapeBounds(this.selectedShape);
      this.selectionManager.drawSelectionBox(bounds);
    }

    // Draw all shapes
    this.shapes.forEach(shape => {
      this.drawShape(shape);

      // Highlight hovered shapes (most recent gets strongest highlight)
      const hoverIndex = this.hoveredShapes.findIndex(s => s.id === shape.id);
      if (hoverIndex >= 0) {
        this.ctx.save();

        // Stronger highlight for most recent hover (index 0)
        const opacity = 0.3 + (0.7 * (1 - (hoverIndex / this.hoveredShapes.length)));
        this.ctx.strokeStyle = `rgba(255, 0, 0, ${opacity})`;
        this.ctx.lineWidth = 2 + (2 * (1 - hoverIndex / this.hoveredShapes.length));
        this.ctx.setLineDash([5, 5]);

        const bounds = this.selectionManager.getShapeBounds(shape);
        this.ctx.strokeRect(
          bounds.x - 5,
          bounds.y - 5,
          bounds.width + 10,
          bounds.height + 10
        );

        // Add delete indicator for topmost shape
        if (hoverIndex === 0) {
          this.ctx.fillStyle = "red";
          this.ctx.font = "bold 16px Arial";
          this.ctx.fillText("×", bounds.x - 15, bounds.y - 5);
        }

        this.ctx.restore();
      }
    });

    // this.sendShapeUpdateToServer(this.selectedShape!, this.selectedShape?.id!);
    this.ctx.restore();
  }

  private drawShape(shape: Shape) {
    this.ctx.save();
    this.ctx.strokeStyle = shape.color;
    this.ctx.fillStyle = shape.bgColor;
    this.ctx.lineWidth = shape.strokeWidth;
    this.ctx.globalAlpha = shape.opacity || 1;

    switch (shape.strokeStyle) {
      case "solid":
        this.ctx.setLineDash([]);
        break;
      case "dotted":
        this.ctx.setLineDash([shape.strokeWidth, shape.strokeWidth * 2]);
        break;
      case "dashed":
        this.ctx.setLineDash([shape.strokeWidth * 4, shape.strokeWidth * 2]);
        break;
    }

    switch (shape.type) {
      case "rect":
        this.ctx.fillRect(shape.x, shape.y, shape.width || 0, shape.height || 0);
        this.ctx.strokeRect(shape.x, shape.y, shape.width || 0, shape.height || 0);
        break;

      case "circle":
        const radiusX = Math.abs(shape.endX - shape.x) / 2;
        const radiusY = Math.abs(shape.endY - shape.y) / 2;
        this.ctx.beginPath();
        this.ctx.ellipse(
          (shape.x + shape.endX) / 2,
          (shape.y + shape.endY) / 2,
          radiusX,
          radiusY,
          0,
          0,
          2 * Math.PI
        );
        this.ctx.fill();
        this.ctx.stroke();
        break;

      case "line":
      case "arrow":
        this.ctx.beginPath();
        this.ctx.moveTo(shape.x, shape.y);
        this.ctx.lineTo(shape.endX, shape.endY);
        this.ctx.stroke();

        if (shape.type === "arrow") {
          const angle = Math.atan2(shape.endY - shape.y, shape.endX - shape.x);
          const arrowLength = 10;
          this.ctx.beginPath();
          this.ctx.moveTo(shape.endX, shape.endY);
          this.ctx.lineTo(
            shape.endX - arrowLength * Math.cos(angle - Math.PI / 6),
            shape.endY - arrowLength * Math.sin(angle - Math.PI / 6)
          );
          this.ctx.moveTo(shape.endX, shape.endY);
          this.ctx.lineTo(
            shape.endX - arrowLength * Math.cos(angle + Math.PI / 6),
            shape.endY - arrowLength * Math.sin(angle + Math.PI / 6)
          );
          this.ctx.stroke();
        }
        break;

      case "pencil":
        if (shape.path && shape.path.length > 0) {
          this.ctx.beginPath();
          this.ctx.moveTo(shape.path[0]?.x as number, shape?.path[0]?.y as number);
          shape.path.forEach((point) => this.ctx.lineTo(point.x, point.y));
          this.ctx.stroke();
        }
        break;

      case "diamond":
        const centerX = (shape.x + shape.endX) / 2;
        const centerY = (shape.y + shape.endY) / 2;
        const width = shape.width || 0;
        const height = shape.height || 0;

        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY - height / 2); // Top
        this.ctx.lineTo(centerX + width / 2, centerY); // Right
        this.ctx.lineTo(centerX, centerY + height / 2); // Bottom
        this.ctx.lineTo(centerX - width / 2, centerY); // Left
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        break;

      case "iframe":
        this.ctx.fillRect(shape.x, shape.y, shape.width || 0, shape.height || 0);
        this.ctx.strokeRect(shape.x, shape.y, shape.width || 0, shape.height || 0);
        // Draw URL text
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(
          shape.url || 'No URL provided',
          shape.x + 5,
          shape.y + 15
        );
        break

      case "text":
        this.ctx.fillStyle = shape.color;
        this.ctx.font = '24px Bagel Fat One, cursive';
        this.ctx.fillText(shape.text || '', shape.x, shape.y);
        break;

      default:
        break;
    }

    this.ctx.restore();
  }

  private isPointInShape(x: number, y: number, shape: Shape): boolean {
    switch (shape.type) {
      case "rect":
        return x >= shape.x && x <= shape.x + (shape.width || 0) &&
          y >= shape.y && y <= shape.y + (shape.height || 0);

      case "circle":
        const centerX = (shape.x + shape.endX) / 2;
        const centerY = (shape.y + shape.endY) / 2;
        const radiusX = Math.abs(shape.endX - shape.x) / 2;
        const radiusY = Math.abs(shape.endY - shape.y) / 2;
        return Math.pow((x - centerX) / radiusX, 2) + Math.pow((y - centerY) / radiusY, 2) <= 1;

      case "line":
      case "arrow":
        return this.isPointNearLine(x, y, shape.x, shape.y, shape.endX, shape.endY, 10);

      case "diamond":
        return this.isPointInDiamond(x, y, shape);

      case "pencil":
        if (!shape.path) return false;
        for (let i = 0; i < shape.path.length - 1; i++) {
          const p1 = shape.path[i];
          const p2 = shape.path[i + 1];
          if (this.isPointNearLine(x, y, p1?.x as number, p1?.y as number, p2?.x as number, p2?.y as number, 5)) return true;
        }
        return false;

      case "text":
        this.ctx.font = '24px Bagel Fat One, cursive';
        const metrics = this.ctx.measureText(shape.text || "");
        return x >= shape.x && x <= shape.x + metrics.width &&
          y >= shape.y - 24 && y <= shape.y;

      case "iframe":
        return x >= shape.x &&
          x <= shape.x + (shape.width || 0) &&
          y >= shape.y &&
          y <= shape.y + (shape.height || 0);

      default:
        return false;
    }
  }


  private isPointNearLine(px: number, py: number, x1: number, y1: number, x2: number, y2: number, tolerance: number): boolean {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSq = dx * dx + dy * dy;
    if (lengthSq === 0) return Math.hypot(px - x1, py - y1) <= tolerance;

    const t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
    const tClamped = Math.max(0, Math.min(1, t));
    const nearestX = x1 + tClamped * dx;
    const nearestY = y1 + tClamped * dy;

    return Math.hypot(px - nearestX, py - nearestY) <= tolerance;
  }

  private isPointInDiamond(x: number, y: number, shape: Shape): boolean {
    const centerX = (shape.x + shape.endX) / 2;
    const centerY = (shape.y + shape.endY) / 2;
    const dx = Math.abs(x - centerX);
    const dy = Math.abs(y - centerY);
    const halfWidth = Math.abs(shape.endX - shape.x) / 2;
    const halfHeight = Math.abs(shape.endY - shape.y) / 2;

    return (dx / halfWidth) + (dy / halfHeight) <= 1;
  }

  // Additional Methods
  updateTextContent(id: string, content: string) {
    const shape = this.shapes.find((shape) => shape.id === id);
    if (shape && shape.type === "text") {
      shape.text = content;
      this.redraw();
    }
  }

  finalizeTextEdit(editingText: { id: string; x: number; y: number; content: string }) {
    const shape = this.shapes.find((shape) => shape.id === editingText.id);
    if (shape && shape.type === "text") {
      shape.text = editingText.content;
      this.sendShapeToServer(shape);
      this.redraw();
    }
  }

  addGeneratedShapes(shape: Shape) {
    this.shapes.push(shape);
    this.redraw();
  }

  updateShape(updatedProperties: Partial<Shape>) {
    if (!this.selectedShape) return
    console.log(this.selectedShape, "this.selectedShape in updateShape");

    const updatedShape = { ...this.selectedShape, ...updatedProperties }

    // this.shapes = this.shapes.map((shape) =>
    //   shape.id === updatedShape.id ? updatedShape : shape)
    const shapeIndex = this.shapes.findIndex((shape) => shape.id === updatedShape.id);
    if (shapeIndex !== -1) {
      this.shapes[shapeIndex] = updatedShape
    }

    this.selectedShape = updatedShape
    console.log(updatedShape, "updatedShape in updateShape");
    this.sendShapeUpdateToServer(updatedShape, updatedShape.id);
    this.redraw();
  }

  zoomIn(callback?: (scale: number) => void) {
    this.transform.scale *= 1.1;
    this.redraw();
    callback?.(this.transform.scale);
  }

  zoomOut(callback?: (scale: number) => void) {
    this.transform.scale /= 1.1;
    this.redraw();
    callback?.(this.transform.scale);
  }
}