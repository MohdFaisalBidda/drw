import { v4 as uuidv4 } from 'uuid';
import { HTTP_URL } from '../config';
import axios from 'axios';
import { SelectionManager } from './selectionManager';
import { eraseShape } from './eraser';

export type Tool = 'rect' | 'circle' | 'pencil' | 'line' | 'text' | 'arrow' | 'diamond' | 'draw' | 'eraser' | 'select';

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
}

export class Draw {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private socket: WebSocket;
  private roomId: string;
  private shapes: Shape[] = [];
  private isDrawing = false;
  private startX: number = 0;
  private startY: number = 0;
  private currentTool: Tool = 'select';
  public selectedShape: Shape | null = null;
  private tempPath: { x: number; y: number }[] = [];
  public transform = { scale: 1, offsetX: 0, offsetY: 0 };
  private currColor: string = "white";
  private currBgColor: string = "#ffffff00";
  private currStrokeWidth: number = 2;
  private currStrokeStyle: string = "solid";
  private currOpacity: number = 1;
  private selectionManager: SelectionManager;

  constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
    this.canvas = canvas;
    this.roomId = roomId;
    this.socket = socket;

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
    const data = await this.fetchExistingShapes();
    this.shapes = data.message;
    this.redraw();
  }

  destroy() {
    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.canvas.removeEventListener("mouseup", this.handleMouseUp);
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    this.canvas.removeEventListener("wheel", this.handleWheel);
  }

  setTool(tool: Tool) {
    this.currentTool = tool;
    if (tool !== "select") {
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

  private async fetchExistingShapes(): Promise<{ id: Record<string, string>, message: Shape[] }> {
    try {
      const response = await axios.get(`${HTTP_URL}/api/room/${this.roomId}/shapes`);
      const message: Shape[] = [];
      const idMap: Record<string, string> = {};

      response.data.shapes.forEach((x: { id: string, message: string }, index: number) => {
        try {
          const parsedMessage = JSON.parse(x.message);
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
  }

  private setupSocketListeners() {
    this.socket.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'NEW_MESSAGE') {
          const shape = JSON.parse(message.payload.message);
          this.shapes.push(shape);
          this.redraw();
        }

        if (message.type === 'DELETE_SHAPE') {
          this.shapes = this.shapes.filter((shape) => shape.id !== message.payload.shapeId);
          this.redraw();
        }

        if (message.type === 'UPDATE_SHAPE') {
          const updatedShape = JSON.parse(message.payload.message);
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

  private handleMouseDown = (e: MouseEvent) => {
    const point = this.getCanvasPoint(e);
    this.startX = point.x;
    this.startY = point.y;

    if (this.currentTool === "select") {

      if (this.selectedShape) {
        const bounds = this.selectionManager.getShapeBounds(this.selectedShape)
        const handle = this.selectionManager.getResizeHandleAtPoint(point.x, point.y, bounds)

        if (handle) {
          this.selectionManager.startResizing(point.x, point.y)
          return
        }
      }

      this.selectedShape = this.shapes.find((shape) => this.isPointInShape(point.x, point.y, shape)) || null;
      this.selectionManager.setSelectedShape(this.selectedShape);

      if (this.selectedShape) {
        this.selectionManager.startDragging(point.x, point.y)
      }

      this.redraw();
      return;
    }

    if (this.currentTool === "eraser") {
      this.shapes = eraseShape(this.shapes, point.x, point.y, 10, this.socket, this.roomId);
      this.redraw();
      return;
    }

    this.isDrawing = true;

    if (this.currentTool === "pencil") {
      this.tempPath = [{ x: point.x, y: point.y }];
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
    }
  };

  private handleMouseMove = (e: MouseEvent) => {
    const point = this.getCanvasPoint(e);

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
      }
      return
    }

    if (this.isDrawing) {
      if (this.currentTool === "pencil") {
        this.tempPath.push({ x: point.x, y: point.y });
        this.redraw();
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
  };

  private handleMouseUp = () => {
    if (this.currentTool === "select") {
      if (this.selectionManager.isDraggingShape() || this.selectionManager.isResizingShape()) {
        if (this.selectionManager.isDraggingShape()) {
          this.selectionManager.stopDragging()
        } else {
          this.selectionManager.stopResizing()
        }

        if (this.selectedShape) {
          this.sendShapeToServer(this.selectedShape)
        }
        this.redraw()
      }
      return
    }

    if (this.isDrawing) {
      if (this.currentTool === "pencil" && this.tempPath.length > 1) {
        this.shapes.push({
          id: uuidv4(),
          type: "pencil",
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
        });
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
      this.redraw();
    }
  };

  private sendShapeToServer(shape: Shape) {
    this.socket.send(
      JSON.stringify({
        type: 'NEW_MESSAGE',
        payload: { message: JSON.stringify(shape), roomId: this.roomId },
      })
    );
  }

  private getCanvasPoint(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - this.transform.offsetX) / this.transform.scale,
      y: (e.clientY - rect.top - this.transform.offsetY) / this.transform.scale,
    };
  }

  private redraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(this.transform.offsetX, this.transform.offsetY);
    this.ctx.scale(this.transform.scale, this.transform.scale);

    this.ctx.font = '24px Comic Sans MS, cursive';
    this.shapes.forEach((shape) => this.drawShape(shape));

    if (this.isDrawing && this.selectedShape) {
      this.drawShape(this.selectedShape);
    }

    if (this.currentTool === "pencil" && this.tempPath.length > 0) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.tempPath[0].x, this.tempPath[0].y);
      this.tempPath.forEach((point) => this.ctx.lineTo(point.x, point.y));
      this.ctx.stroke();
    }

    // Draw selection box if a shape is selected
    if (this.selectedShape) {
      const bounds = this.selectionManager.getShapeBounds(this.selectedShape);
      this.selectionManager.drawSelectionBox(bounds);
    }

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
          this.ctx.moveTo(shape.path[0].x, shape.path[0].y);
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
          if (this.isPointNearLine(x, y, p1.x, p1.y, p2.x, p2.y, 5)) return true;
        }
        return false;

      case "text":
        this.ctx.font = '24px Comic Sans MS, cursive';
        const metrics = this.ctx.measureText(shape.text || "");
        return x >= shape.x && x <= shape.x + metrics.width &&
          y >= shape.y - 24 && y <= shape.y;

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

  updateShape(updatedShape: Shape) {
    const index = this.shapes.findIndex((shape) => shape.id === updatedShape.id);
    if (index !== -1) {
      this.shapes[index] = updatedShape;
      this.redraw();
    }
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