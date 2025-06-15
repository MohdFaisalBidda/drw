import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

export type Tool = 'rect' | 'circle' | 'pencil' | 'line' | 'text' | 'arrow' | 'diamond' | 'draw' | 'eraser' | 'select';

export interface Shape {
  id: string;
  type: Tool;
  x: number;
  y: number;
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
  details: any;
}

export interface EditingText {
  id: string;
  x: number;
  y: number;
  content: string;
}

interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
  shapeId: string;
}

interface TransformHandle {
  x: number;
  y: number;
  cursor: string;
  action: "rotate" | "resize" | "move";
  position?: "top" | "bottom" | "left" | "right" | "topLeft" | "topRight" | "bottomLeft" | "bottomRight"
}

export class Draw {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private socket: WebSocket;
  private roomId: string;
  private shapes: Shape[] = [];
  private currentTool: Tool = 'select';
  //draw variables
  private isDrawing = false;
  private startPoint: { x: number; y: number } | null = null;
  private drawPoints: { x: number, y: number }[] = [];
  private currentShape: Shape | null = null;
  public transform = { scale: 1, offsetX: 0, offsetY: 0 };

  private selectedTool: Tool = 'select';
  private deletedShapeIds: Set<string> = new Set();
  private shapeIdMap: Map<string, string> = new Map();
  private setEditingText: (text: EditingText | null) => void;

  //Selection variables
  public selectionBox: SelectionBox | null = null;
  public selectedShape: Shape | null = null;
  private transformHandles: TransformHandle[] = [];
  private isTransforming = false;
  private activeHandle: TransformHandle | null = null;
  private transformStart: { x: number, y: number } | null = null;
  public onShapeSelected: (shape: Shape | null) => void = () => { };

  constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket, setEditingText: (text: EditingText | null) => void) {
    this.canvas = canvas;
    this.roomId = roomId;
    this.socket = socket;
    this.setEditingText = setEditingText;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get canvas context');
    this.ctx = ctx;

    this.init();
    this.setupCanvas();
    this.setupEventListeners();
    this.setupSocketListeners();
  }

  async init() {
    const data = await this.fetchExistingShapes();
    console.log(data, this.shapes, "data in init");
    this.shapes = data.message;
    this.shapeIdMap = new Map(this.shapes.map((shape, index) => [shape.id, data.id[index.toString()] as string]));
    console.log(this.shapeIdMap, "this.shapeIdMap in init");

    this.redraw();
  }

  destroy() {
    this.canvas.removeEventListener("mousedown", this.handleMouseDown)
    this.canvas.removeEventListener("mouseup", this.handleMouseUp)
    this.canvas.removeEventListener("mousemove", this.handleMouseMove)
    this.canvas.removeEventListener("wheel", this.handleWheel)
    this.canvas.removeEventListener("dblclick", this.handleDoubleClick)
  }

  setTool(tool: Tool) {
    this.selectedTool = tool;
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

  public zoomIn(callback?: (arg: any) => void) {
    this.transform.scale *= 1.1;
    this.redraw();
    callback?.(this.transform.scale);
  }

  public zoomOut(callback?: (arg: any) => void) {
    this.transform.scale /= 1.1;
    this.redraw();
    callback?.(this.transform.scale);
  }

  public addGeneratedShapes(shape: Shape) {
    this.shapes.push(shape);
    this.redraw();
  }

  public updateShape(updatedShape: Shape) {
    const index = this.shapes.findIndex((shape) => shape.id === updatedShape.id);
    if (index !== -1) {
      this.shapes[index] = updatedShape;
      this.redraw();
    }
  }


  private async fetchExistingShapes(): Promise<{ id: Record<string, string>, message: Shape[] }> {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_NEXT_PUBLIC_HTTP_URL}/api/room/${this.roomId}/shapes`);
      console.log(response.data.shapes, "response in fetch");

      const message: Shape[] = [];
      const idMap: Record<string, string> = {};

      response.data.shapes.forEach((x: { id: string, message: string }, index: number) => {
        try {
          const parsedMessage = JSON.parse(x.message);
          message.push(parsedMessage);
          idMap[index.toString()] = x.id; // Index as key, shape id as value
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
    this.canvas.addEventListener('dblclick', this.handleDoubleClick);
  }

  private setupSocketListeners() {
    this.socket.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'CREATE_SHAPE') {
          const shape = JSON.parse(message.payload.message);
          const dbShape = message.payload.shape;

          if (dbShape && dbShape.id) {
            this.shapeIdMap.set(shape.id, dbShape.id);
            shape.id = dbShape.id;
          }

          const existingShape = this.shapes.find((s) => s.id === shape.id);
          if (existingShape) {
            existingShape.details = shape.details;  // Update text content
          } else {
            this.shapes.push(shape);
          }

          if (!this.deletedShapeIds.has(shape.id)) {
            this.shapes.push(shape);
            this.redraw();
          }
        }

        if (message.type === 'DELETE_SHAPE') {
          this.shapes = this.shapes.filter((shape) => shape.id !== message.payload.shapeId);
          this.redraw();
        }
      } catch (error) {
        console.error('Failed to parse incoming message:', event.data, error);
      }
    });
  }

  private handleDoubleClick = (e: MouseEvent) => {
    const point = this.getCanvasPoint(e);
    const clickedShape = this.shapes.find((shape) =>
      this.isPointInShape(point.x, point.y, shape, this.transform)
    );
    console.log("Clicked Shape:", clickedShape);


    if (clickedShape?.type === "text") {
      console.log("Clicked Text Content:", clickedShape.details?.content);


      this.setEditingText({
        id: clickedShape.id,
        x: clickedShape.x,
        y: clickedShape.y,
        content: clickedShape.details.content,
      });
    }

    console.log("Clicked Text Content:", clickedShape?.details?.content);
  }

  public updateTextContent(id: string, content: string) {
    const shape = this.shapes.find((shape) => shape.id === id);
    if (shape && shape.type === "text") {
      // shape.details.content = content;
      this.redraw();
    }
  }

  public finalizeTextEdit(editingText: EditingText) {
    const shape = this.shapes.find((shape) => shape.id === editingText.id);
    if (shape && shape.type === "text") {
      shape.details.content = editingText.content;
      this.sendShapeToServer(shape);
      this.redraw();
    }
  }

  private calculateBoundingBox(shape: Shape): SelectionBox | null {
    const { x, y, details, type } = shape;
    let width = 0;
    let height = 0;

    switch (shape.type) {
      case "rect":
      case "diamond":
        width = shape.details.width || 0;
        height = shape.details.height || 0;
        break;

      case "circle":
        width = shape.details.radius * 2 || 0;
        height = shape.details.radius * 2 || 0;
        break;

      case "line":
      case "arrow":
        width = Math.abs(shape.details.x2 - x);
        height = Math.abs(shape.details.y2 - y);
        break;

      case "text":
        width = 100; // Approximate width for text
        height = shape.details.fontSize || 20;
        break;

      case "draw":
        if (shape.details.points && shape.details.points.length > 0) {
          const xs = shape.details.points.map((p: { x: number }) => p.x);
          const ys = shape.details.points.map((p: { y: number }) => p.y);
          width = Math.max(...xs) - Math.min(...xs);
          height = Math.max(...ys) - Math.min(...ys);
        }
        break;

      default:
        return null
    }

    return {
      x: shape.x,
      y: shape.y,
      width,
      height,
      shapeId: shape.id,
    };
  }

  private createTransformHandles() {
    if (!this.selectionBox) return;

    // const boundingBox = this.calculateBoundingBox(this.currentShape!);
    const { x, y, width, height } = this.selectionBox;
    const handleSize = 8;

    // const borderRect = boundingBox

    this.transformHandles = [
      // // Corner handles
      { x: x - handleSize, y: y - handleSize, cursor: "nw-resize", action: "resize", position: "topLeft" },
      { x: x + width, y: y - handleSize, cursor: "ne-resize", action: "resize", position: "topRight" },
      { x: x - handleSize, y: y + height, cursor: "sw-resize", action: "resize", position: "bottomLeft" },
      { x: x + width, y: y + height, cursor: "se-resize", action: "resize", position: "bottomRight" },
      // Edge handles
      { x: x + width / 2, y: y - handleSize, cursor: "n-resize", action: "resize", position: "top" },
      { x: x + width, y: y + height / 2, cursor: "e-resize", action: "resize", position: "right" },
      { x: x + width / 2, y: y + height, cursor: "s-resize", action: "resize", position: "bottom" },
      { x: x - handleSize, y: y + height / 2, cursor: "w-resize", action: "resize", position: "left" },
      // Rotation handle
      { x: x + width / 2, y: y - 30, cursor: "pointer", action: "rotate" },
      // Move handle (center)
      { x: x + width / 2, y: y + height / 2, cursor: "move", action: "move" },
    ]
  }

  private drawSelectionBox() {
    if (!this.selectionBox || !this.selectedShape) return;

    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeStyle = "blue";

    // Calculate selection box dimensions based on shape type
    let selectionX, selectionY, selectionWidth, selectionHeight;
    const padding = this.selectedShape.details.lineWidth || 5; // Use shape's line width or default

    if (this.selectedShape.type === "circle" || this.selectedShape.type === "diamond") {
      // For circle and diamond, use the existing calculation
      selectionX = this.selectionBox.x - this.selectionBox.width / 2;
      selectionY = this.selectionBox.y - this.selectionBox.height / 2;
      selectionWidth = this.selectionBox.width;
      selectionHeight = this.selectionBox.height;
    }
    else if (this.selectedShape.type === "line" ||
      this.selectedShape.type === "arrow" ||
      this.selectedShape.type === "draw") {

      // For line-based shapes, add padding to ensure the full shape is encompassed
      if (this.selectedShape.type === "draw" && Array.isArray(this.selectedShape.details.path)) {
        // For draw paths, calculate bounds based on all points in the path
        const points = this.selectedShape.details.path;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        // Find min/max coordinates from all points in the path
        points.forEach((point: { x: number; y: number }) => {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        });

        const startX = this.selectedShape.x;
        const startY = this.selectedShape.y;
        const endX = this.selectedShape.details.endX;
        const endY = this.selectedShape.details.endY;


        selectionX = Math.min(startX, endX) - padding;
        selectionY = Math.min(startY, endY) - padding;
        selectionWidth = Math.abs(endX - startX) + padding * 2;
        selectionHeight = Math.abs(endY - startY) + padding * 2;
      }
      else {
        // For line and arrow, add padding around start and end points
        const startX = Math.min(this.selectedShape.x, this.selectedShape.details.endX);
        const startY = Math.min(this.selectedShape.y, this.selectedShape.details.endY);
        const endX = Math.max(this.selectedShape.x, this.selectedShape.details.endX);
        const endY = Math.max(this.selectedShape.y, this.selectedShape.details.endY);

        // Add extra padding for arrow heads if needed
        const arrowPadding = this.selectedShape.type === "arrow" ? padding * 2 : padding;

        selectionX = startX - padding;
        selectionY = startY - padding;
        selectionWidth = (endX - startX) + (padding * 2);
        selectionHeight = (endY - startY) + (padding * 2);

        // For diagonal lines, ensure we have enough padding in all directions
        if (Math.abs(endY - startY) > 0 && Math.abs(endX - startX) > 0) {
          // Add a bit more padding for diagonal lines
          selectionX -= padding;
          selectionY -= padding;
          selectionWidth += padding * 2;
          selectionHeight += padding * 2;
        }
      }
    }
    else {
      // For other shapes (rectangles, text, etc.), use the existing calculation
      selectionX = this.selectionBox.x;
      selectionY = this.selectionBox.y;
      selectionWidth = this.selectionBox.width;
      selectionHeight = this.selectionBox.height;
    }

    // Draw the selection box with calculated dimensions
    this.ctx.strokeRect(
      selectionX * this.transform.scale + this.transform.offsetX,
      selectionY * this.transform.scale + this.transform.offsetY,
      selectionWidth * this.transform.scale,
      selectionHeight * this.transform.scale
    );

    // Calculate and draw transform handles based on shape type
    if (this.selectedShape.type === "circle" || this.selectedShape.type === "diamond") {
      this.transformHandles = [
        { x: selectionX, y: selectionY, cursor: "nwse-resize", action: "resize" }, // Top-left
        { x: selectionX + selectionWidth, y: selectionY, cursor: "nesw-resize", action: "resize" }, // Top-right
        { x: selectionX, y: selectionY + selectionHeight, cursor: "nesw-resize", action: "resize" }, // Bottom-left
        { x: selectionX + selectionWidth, y: selectionY + selectionHeight, cursor: "nwse-resize", action: "resize" }, // Bottom-right
        { x: selectionX + selectionWidth / 2, y: selectionY + selectionHeight / 2, cursor: "move", action: "move" }, // Center
        { x: selectionX + selectionWidth / 2, y: selectionY, cursor: "ns-resize", action: "resize" }, // Top center
        { x: selectionX + selectionWidth / 2, y: selectionY - 20, cursor: "rotate", action: "rotate" }, // Rotate
        { x: selectionX, y: selectionY + selectionHeight / 2, cursor: "ew-resize", action: "resize" }, // Left center
        { x: selectionX + selectionWidth, y: selectionY + selectionHeight / 2, cursor: "ew-resize", action: "resize" }, // Right center
        { x: selectionX + selectionWidth / 2, y: selectionY + selectionHeight, cursor: "ns-resize", action: "resize" }, // Bottom center
      ];
    }
    else if (this.selectedShape.type === "line" ||
      this.selectedShape.type === "arrow" ||
      this.selectedShape.type === "draw") {
      // For line-based shapes, use specific handles

    }
    else {
      // For other shapes, use standard resize handles
      this.transformHandles = [
        { x: selectionX, y: selectionY, cursor: "nwse-resize", action: "resize" }, // Top-left
        { x: selectionX + selectionWidth, y: selectionY, cursor: "nesw-resize", action: "resize" }, // Top-right
        { x: selectionX, y: selectionY + selectionHeight, cursor: "nesw-resize", action: "resize" }, // Bottom-left
        { x: selectionX + selectionWidth, y: selectionY + selectionHeight, cursor: "nwse-resize", action: "resize" }, // Bottom-right
        { x: selectionX + selectionWidth / 2, y: selectionY + selectionHeight / 2, cursor: "move", action: "move" }, // Center
        { x: selectionX + selectionWidth / 2, y: selectionY, cursor: "ns-resize", action: "resize" }, // Top center
        { x: selectionX, y: selectionY + selectionHeight / 2, cursor: "ew-resize", action: "resize" }, // Left center
        { x: selectionX + selectionWidth, y: selectionY + selectionHeight / 2, cursor: "ew-resize", action: "resize" }, // Right center
        { x: selectionX + selectionWidth / 2, y: selectionY + selectionHeight, cursor: "ns-resize", action: "resize" }, // Bottom center
      ];
    }

    // Draw all transform handles
    this.transformHandles.forEach((handle) => {
      this.ctx.fillStyle = "white";
      this.ctx.strokeStyle = "blue";
      const handleX = (handle.x * this.transform.scale) + this.transform.offsetX;
      const handleY = (handle.y * this.transform.scale) + this.transform.offsetY;
      this.ctx.fillRect(handleX - 4, handleY - 4, 8, 8);
      this.ctx.strokeRect(handleX - 4, handleY - 4, 8, 8);
    });

    this.ctx.setLineDash([]);
  }

  private handleMouseDown = (e: MouseEvent) => {
    const point = this.getCanvasPoint(e);

    if (this.transformHandles.length > 0) {
      // Check transform handles first, before clearing selection
      const clickedHandle = this.transformHandles.find(handle => {
        // Account for transform scale and offset in handle position check
        const handleX = (handle.x * this.transform.scale) + this.transform.offsetX;
        const handleY = (handle.y * this.transform.scale) + this.transform.offsetY;

        // Increase hit area for handles
        const handleHitArea = 8; // Pixels around handle that will register as a click

        return (
          point.x >= handleX - handleHitArea &&
          point.x <= handleX + handleHitArea &&
          point.y >= handleY - handleHitArea &&
          point.y <= handleY + handleHitArea
        );
      });

      if (clickedHandle) {
        console.log("Handle clicked:", clickedHandle);
        this.isTransforming = true;
        this.activeHandle = clickedHandle;
        this.transformStart = point;
        e.stopPropagation()
        return; // Exit early if handle is clicked
      }
    }

    this.startPoint = point;
    this.isDrawing = true;
    this.currentTool = this.selectedTool;

    if (this.currentTool === "select") {

      const clickedShape = this.shapes.find((shape) =>
        this.isPointInShape(point.x, point.y, shape, this.transform)
      );

      if (clickedShape) {
        console.log("Clicked shape:", clickedShape);
        this.selectedShape = clickedShape;
        this.selectionBox = this.calculateBoundingBox(clickedShape);
        this.createTransformHandles()
        this.redraw()
        this.onShapeSelected(clickedShape)
      } else {
        this.selectionBox = null;
        this.transformHandles = [];
        this.redraw();
        this.onShapeSelected(null)
      }
      return
    }


    const templateShape = {
      id: uuidv4(),
      type: this.currentTool,
      strokeColor: '#ffffff',
      strokeWidth: 1,
      fillColor: 'transparent',
      x: point.x,
      y: point.y,
      details: {},
    }

    switch (this.currentTool) {
      case 'rect':
        this.currentShape = {
          ...templateShape,
          details: { width: 0, height: 0 }
        };
        break;

      case 'circle':
        this.currentShape = {
          ...templateShape,
          details: { radius: 0 }
        }
        break;

      case 'pencil':
      case "line":
        this.currentShape = {
          ...templateShape,
          details: {
            x1: point.x,
            y1: point.y,
            x2: point.x,
            y2: point.y,
          }
        }
        break;

      case "arrow":
        this.currentShape = {
          ...templateShape,
          details: {
            x1: point.x,
            y1: point.y,
            x2: point.x,
            y2: point.y,
          }
        }
        break;

      case "text":
        this.currentShape = {
          ...templateShape,
          details: {
            fontSize: 20,
            content: "",
          }
        }
        break;

      case 'diamond':
        this.currentShape = {
          ...templateShape,
          details: { width: 0, height: 0 }
        }
        break;

      case 'draw':
        this.drawPoints = [point];
        this.currentShape = {
          ...templateShape,
          details: { points: [...this.drawPoints] }
        }
        break;

      default:
        this.currentShape = templateShape;
        break;
    }

    if (this.currentShape) {
      this.shapes.push(this.currentShape);
      this.redraw()
    }
  };

  private isPointNear(x1: number, y1: number, x2: number, y2: number, threshold: number): boolean {
    return Math.abs(x1 - x2) < threshold && Math.abs(y1 - y2) < threshold;
  }

  private sendDeleteRequest(shapeId: string) {
    console.log(shapeId, "shapeId in sendDeleteRequest");
    this.socket.send(
      JSON.stringify({
        type: 'DELETE_SHAPE',
        payload: { shapeId, roomId: this.roomId },
      })
    );
  }

  private handleMouseMove = (e: MouseEvent) => {
    const point = this.getCanvasPoint(e);

    if (this.isTransforming && this.activeHandle && this.selectionBox && this.transformStart) {
      const shape = this.shapes.find(s => s.id === this.selectionBox?.shapeId);
      if (!shape) return;

      const dx = point.x - this.transformStart.x;
      const dy = point.y - this.transformStart.y;

      console.log("Transform action:", {
        action: this.activeHandle.action,
        dx,
        dy,
        currentPos: { x: shape.x, y: shape.y },
      });

      if (this.activeHandle.action === "move") {
        // Update shape position
        shape.x += dx;
        shape.y += dy;

        // For specific shape types, update additional coordinates
        switch (shape.type) {
          case "line":
          case "arrow":
            shape.details.x1 += dx;
            shape.details.y1 += dy;
            shape.details.x2 += dx;
            shape.details.y2 += dy;
            break;

          case "draw":
            if (shape.details.points) {
              shape.details.points = shape.details.points.map((point: { x: number; y: number }) => ({
                x: point.x + dx,
                y: point.y + dy
              }));
            }
            break;
        }

        // Update selection box position
        this.selectionBox.x += dx;
        this.selectionBox.y += dy;

        // Update transform handles
        this.transformHandles = this.transformHandles.map(handle => ({
          ...handle,
          x: handle.x + dx,
          y: handle.y + dy
        }));

        console.log("After move:", {
          shapePos: { x: shape.x, y: shape.y },
          selectionBox: { x: this.selectionBox.x, y: this.selectionBox.y }
        });

        // Redraw and send update
        this.createTransformHandles();
      }

      if (this.activeHandle.action === "rotate") {
        const centerX = this.selectionBox.x + this.selectionBox.width / 2;
        const centerY = this.selectionBox.y + this.selectionBox.height / 2;

        const startAngle = Math.atan2(this.transformStart.y - centerY, this.transformStart.x - centerX);
        const currentAngle = Math.atan2(point.y - centerY, point.x - centerX);
        const rotation = (((currentAngle - startAngle) * 180) / Math.PI);

        shape.details.rotation = (shape.details.rotation || 0) + rotation;

        // Update the shape's position to rotate around the center
        const cos = Math.cos((rotation * Math.PI) / 180);
        const sin = Math.sin((rotation * Math.PI) / 180);
        const x = shape.x - centerX;
        const y = shape.y - centerY;
        shape.x = x * cos - y * sin + centerX;
        shape.y = x * sin + y * cos + centerY;

        this.createTransformHandles();
      }


      // Update transform start point for next movement
      this.redraw();
      this.transformStart = point;
      return;
    }

    if (this.isDrawing && this.currentShape && this.startPoint) {

      const dx = point.x - this.startPoint.x;
      const dy = point.y - this.startPoint.y;

      console.log("currentShape.type in handleMouseMove");

      switch (this.currentShape.type) {
        case "rect":
        case "diamond":
          this.currentShape.details.width = dx;
          this.currentShape.details.height = dy;
          break;

        case "circle":
          this.currentShape.details.radius = Math.abs(dx) / 2;
          this.currentShape.x = this.startPoint.x;
          this.currentShape.y = this.startPoint.y;
          break;

        case "draw":
          this.drawPoints.push(point)
          if (this.currentShape.details) {
            this.currentShape.details.points = [...this.drawPoints];
          }
          break;

        case "eraser":
          const shapesToKeep = this.shapes.filter((shape) => {
            let shouldDelete = false;
            if (shape.type === "draw") {
              shouldDelete = shape.details.points.some((point: { x: number; y: number }) =>
                this.isPointNear(point.x, point.y, point.x, point.y, 10) // Increase 10 for bigger eraser size
              );
            } else {
              // For all other shapes, use regular check
              shouldDelete = this.isPointInShape(point.x, point.y, shape, this.transform);
            }

            if (shouldDelete) {
              console.log(this.shapeIdMap, this.shapes, this.shapeIdMap.get(shape.id), "this.shapeIdMap.get(shape.id) in delete");
              this.sendDeleteRequest(this.shapeIdMap.get(shape.id)!);
              return false;
            }
            return true;
          });

          if (shapesToKeep.length !== this.shapes.length) {
            this.shapes = shapesToKeep;
            this.redraw();
          }

          break;

        case "line":
        case "arrow":
          this.currentShape.details.x2 = point.x;
          this.currentShape.details.y2 = point.y;
          break;

        default:
          break;
      }

      this.redraw();
      return
    }

    const hoveredShape = this.shapes.find((shape) =>
      this.isPointInShape(point.x, point.y, shape, this.transform)
    );

    this.canvas.style.cursor = hoveredShape ? "crosshair" : "default";

  };

  private handleMouseUp = () => {
    this.isTransforming = false;
    this.activeHandle = null;
    this.transformStart = null;

    if (this.selectionBox) {
      const shape = this.shapes.find((s) => s.id === this.selectionBox?.shapeId)
      if (shape) {
        shape.details = shape.details || {};
        shape.details.width = this.selectionBox.width;
        shape.details.height = this.selectionBox.height;
      }
    }


    if (!this.isDrawing || !this.currentShape) return;
    this.isDrawing = false;
    console.log("ruuned here while deleting", this.currentShape);

    if (this.currentShape) {
      this.currentShape.details = this.currentShape.details || {};
      const width = this.currentShape.details.width || this.currentShape.details.radius * 2 || 0;
      const height = this.currentShape.details.height || this.currentShape.details.radius * 2 || 0;

      this.selectionBox = {
        x: this.currentShape.x,
        y: this.currentShape.y,
        width: width,
        height: height,
        shapeId: this.currentShape.id
      }
      // this.createTransformHandles()
    }


    if (this.currentShape.type === "text") {
      this.setEditingText({
        id: this.currentShape.id,
        x: this.currentShape.x,
        y: this.currentShape.y,
        content: this.currentShape.details.content,
      })
    }


    if (this.selectedTool !== "eraser" && this.currentShape) {
      this.sendShapeToServer(this.currentShape);
    }

    this.deletedShapeIds.clear()
    this.currentShape = null;
    this.redraw();
  };

  private sendShapeToServer(shape: Shape) {
    this.socket.send(
      JSON.stringify({
        type: 'CREATE_SHAPE',
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
    console.log("Redrawing canvas"); // Debug log
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(this.transform.offsetX, this.transform.offsetY);
    this.ctx.scale(this.transform.scale, this.transform.scale);

    // Draw all shapes
    this.shapes.forEach((shape) => {
      console.log("Drawing shape:", shape); // Debug log
      this.drawShape(shape);
    });

    // Draw the selection box and transform handles
    if (this.selectionBox) {
      console.log("Drawing selection box:", this.selectionBox); // Debug log
      this.drawSelectionBox();
    }

    this.ctx.restore();
  }

  private drawShape(shape: Shape) {
    this.ctx.save();
    console.log("Drawing shape:", shape); // Debug log

    this.ctx.translate(shape.x, shape.y);
    if (shape.details.rotation) {
      this.ctx.rotate((shape.details.rotation * Math.PI) / 180);
    }

    if (shape.details.opacity) {
      this.ctx.globalAlpha = shape.details.opacity
    }

    if (shape.details.borderStyle) {
      this.ctx.setLineDash(
        shape.details.borderStyle === "dashed" ? [10, 5] :
          shape.details.borderStyle === "dotted" ? [2, 2] : []
      )
    }

    this.ctx.strokeStyle = shape.strokeColor;
    this.ctx.lineWidth = shape.strokeWidth;
    this.ctx.fillStyle = shape.fillColor || "transparent";

    switch (shape.type) {
      case "rect":
        this.ctx.beginPath();
        this.ctx.rect(0, 0, shape.details.width, shape.details.height);
        this.ctx.fill(); // Fill the circle
        this.ctx.stroke();
        break;

      case "circle":
        this.ctx.beginPath();
        this.ctx.arc(0, 0, shape.details.radius, 0, Math.PI * 2);
        this.ctx.fill(); // Fill the circle
        this.ctx.stroke();
        break;

      case "line":
      case "arrow":
        this.ctx.beginPath();
        this.ctx.moveTo(shape.details.x1 - shape.x, shape.details.y1 - shape.y);
        this.ctx.lineTo(shape.details.x2 - shape.x, shape.details.y2 - shape.y);
        this.ctx.stroke();

        if (shape.type === "arrow") {
          const angle = Math.atan2(
            shape.details.y2 - shape.details.y1,
            shape.details.x2 - shape.details.x1
          );
          const arrowLength = 15;

          this.ctx.beginPath();
          this.ctx.moveTo(
            shape.details.x2 - shape.x,
            shape.details.y2 - shape.y
          );
          this.ctx.lineTo(
            shape.details.x2 - shape.x - arrowLength * Math.cos(angle - Math.PI / 6),
            shape.details.y2 - shape.y - arrowLength * Math.sin(angle - Math.PI / 6)
          );
          this.ctx.moveTo(
            shape.details.x2 - shape.x,
            shape.details.y2 - shape.y
          );
          this.ctx.lineTo(
            shape.details.x2 - shape.x - arrowLength * Math.cos(angle + Math.PI / 6),
            shape.details.y2 - shape.y - arrowLength * Math.sin(angle + Math.PI / 6)
          );
          this.ctx.stroke();
        }
        break;

      case "draw":
        if (shape.details.points && shape.details.points.length > 0) {
          this.ctx.beginPath();
          const firstPoint = shape.details.points[0];
          this.ctx.moveTo(firstPoint.x - shape.x, firstPoint.y - shape.y);
          shape.details.points.forEach((point: { x: number; y: number }) => {
            this.ctx.lineTo(point.x - shape.x, point.y - shape.y);
          });
          this.ctx.stroke();
        }
        break;

      case "text":
        this.ctx.font = `${shape.details.fontSize}px sans-serif`;
        this.ctx.fillStyle = shape.strokeColor;
        this.ctx.fillText(shape.details.content, 0, 0);
        break;

      case "diamond":
        const halfWidth = shape.details.width / 2;
        const halfHeight = shape.details.height / 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -halfHeight);
        this.ctx.lineTo(halfWidth, 0);
        this.ctx.lineTo(0, halfHeight);
        this.ctx.lineTo(-halfWidth, 0);
        this.ctx.closePath();
        this.ctx.fill(); // Fill the circle
        this.ctx.stroke();
        break;

      default:
        break;
    }

    this.ctx.restore();
  }

  private pointToLineDistance(
    A: { x: number; y: number },
    B: { x: number; y: number },
    C: { x: number; y: number }
  ) {
    const numerator = Math.abs(
      (B.y - A.y) * C.x - (B.x - A.x) * C.y + B.x * A.y - B.y * A.x
    )
    const denominator = Math.sqrt(Math.pow(B.y - A.y, 2) + Math.pow(B.x - A.x, 2))
    return numerator / denominator
  }

  private isPointInShape(
    x: number,
    y: number,
    shape: Shape,
    transform: { scale: number; offsetX: number; offsetY: number }
  ): boolean {
    const { scale, offsetX, offsetY } = transform
    const tx = (x - offsetX) / scale
    const ty = (y - offsetY) / scale

    switch (shape.type) {
      case "rect":
        return (
          tx >= shape.x &&
          tx <= shape.x + shape.details.width &&
          ty >= shape.y &&
          ty <= shape.y + shape.details.height
        )

      case "circle":
        const dx = tx - shape.x
        const dy = ty - shape.y
        return Math.sqrt(dx * dx + dy * dy) <= shape.details.radius

      case "line":
      case "arrow":
        const threshold = 5
        const A = { x: shape.details.x1, y: shape.details.y1 }
        const B = { x: shape.details.x2, y: shape.details.y2 }
        const C = { x: tx, y: ty }
        return this.pointToLineDistance(A, B, C) <= threshold

      case "text":
        // Simplified text hit detection
        return (
          tx >= shape.x &&
          tx <= shape.x + 100 && // Approximate text width
          ty >= shape.y - shape.details.fontSize &&
          ty <= shape.y
        )

      case "diamond":
        // Simplified diamond hit detection
        return (
          tx >= shape.x - shape.details.width / 2 &&
          tx <= shape.x + shape.details.width / 2 &&
          ty >= shape.y - shape.details.height / 2 &&
          ty <= shape.y + shape.details.height / 2
        )

      default:
        return false
    }
  }
}
