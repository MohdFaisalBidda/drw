import { v4 as uuidv4 } from 'uuid';
import { HTTP_URL } from '../config';
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
  details?: any;
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
}

interface TransformHandle {
  x: number;
  y: number;
  cursor: string;
  action: "rotate" | "resize" | "move";
}

export class Draw {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private socket: WebSocket;
  private roomId: string;
  private shapes: Shape[] = [];
  private selectedShapes: Shape[] = [];
  private selectionBox: SelectionBox | null = null;
  private currentTool: Tool = 'rect';
  private isDrawing = false;
  private startPoint: { x: number; y: number } | null = null;
  private drawPoints: { x: number, y: number }[] = [];
  private currentShape: Shape | null = null;
  public transform = { scale: 1, offsetX: 0, offsetY: 0 };
  private selectedTool: Tool = 'rect';
  private deletedShapeIds: Set<string> = new Set();
  private shapeIdMap: Map<string, string> = new Map();
  private setEditingText: (text: EditingText | null) => void;

  private isDragging = false;
  private isTransforming = false;
  private activeHandle: TransformHandle | null = null;
  private transformStart: { x: number; y: number } | null = null;

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


  private async fetchExistingShapes(): Promise<{ id: Record<string, string>, message: Shape[] }> {
    try {
      const response = await axios.get(`${HTTP_URL}/api/room/${this.roomId}/shapes`);
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

        if (message.type === 'NEW_MESSAGE') {
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

  private handleMouseDown = (e: MouseEvent) => {
    const point = this.getCanvasPoint(e);
    this.startPoint = point;
    this.isDrawing = true;
    this.currentTool = this.selectedTool;
    console.log(this.selectedShapes, "this.selectedShapes in handleMouseDown");


    const templateShape = {
      id: uuidv4(),
      type: this.currentTool,
      strokeColor: '#ffffff',
      strokeWidth: 1,
      fillColor: 'transparent',
      x: point.x,
      y: point.y,
    }

    if (this.currentShape) {
      this.shapes.push(this.currentShape);
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

      case 'select':
        const pt = this.getCanvasPoint(e);
        if (this.selectedShapes.length > 0) {
          const handles = this.getTransformHandles(this.selectedShapes[0]!)
          const clickedHandle = handles.find(handle => this.isPointNear(pt.x, pt.y, handle.x, handle.y, 10));

          if (clickedHandle) {
            this.isTransforming = true;
            this.activeHandle = clickedHandle;
            this.transformStart = pt
            return
          }
        }

        const clickedShape = this.shapes.find(shape => this.isPointInShape(pt.x, pt.y, shape, this.transform));

        if (clickedShape) {
          if (!e.shiftKey) {
            this.selectedShapes = [clickedShape];
          } else {
            this.selectedShapes.push(clickedShape);
          }
          this.isDragging = true;
        } else {
          this.selectionBox = {
            x: pt.x,
            y: pt.y,
            width: 0,
            height: 0
          }
          if (!e.shiftKey) {
            this.selectedShapes = [];
          }
        }
        this.redraw();
        break;

      default:
        this.currentShape = templateShape;
        break;
    }

    this.shapes.push(this.currentShape);
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
    if (!this.isDrawing || !this.currentShape || !this.startPoint || this.selectedTool !== 'select') return;
    const currentPoint = this.getCanvasPoint(e);
    const dx = currentPoint.x - this.startPoint.x;
    const dy = currentPoint.y - this.startPoint.y;

    console.log("currentShape.type in handleMouseMove");
    

    console.log("draggin");
    if (this.isDragging && this.selectedShapes.length > 0 && this.startPoint) {
      
      const dx = currentPoint.x - this.startPoint.x;
      const dy = currentPoint.y - this.startPoint.y;

      this.selectedShapes.forEach(shape => {
        shape.x += dx;
        shape.y += dy;
      });

      this.startPoint = currentPoint
      this.redraw();
      return
    }

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
        this.drawPoints.push(currentPoint)
        if (this.currentShape.details) {
          this.currentShape.details.points = [...this.drawPoints];
        }
        break;

      case "eraser":
        const shapesToKeep = this.shapes.filter((shape) => {
          let shouldDelete = false;
          if (shape.type === "draw") {
            shouldDelete = shape.details.points.some((point: { x: number; y: number }) =>
              this.isPointNear(point.x, point.y, currentPoint.x, currentPoint.y, 10) // Increase 10 for bigger eraser size
            );
          } else {
            // For all other shapes, use regular check
            shouldDelete = this.isPointInShape(currentPoint.x, currentPoint.y, shape, this.transform);
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
        this.currentShape.details.x2 = currentPoint.x;
        this.currentShape.details.y2 = currentPoint.y;
        break;

      case "select":
        // Handle selection box
        if (this.selectionBox && this.startPoint) {
          this.selectionBox.width = currentPoint.x - this.selectionBox.x;
          this.selectionBox.height = currentPoint.y - this.selectionBox.y;
          this.redraw();
        }

      default:
        break;
    }

    this.redraw();
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (this.selectionBox) {
      const shapes = this.shapes.filter(shape => this.isShapeInSelectionBox(shape, this.selectionBox!));
      if (!e.shiftKey) {
        this.selectedShapes = shapes;
      } else {
        this.selectedShapes = [...new Set([...this.selectedShapes, ...shapes])];
      }
    }

    if (!this.isDrawing || !this.currentShape) return;
    this.isDrawing = false;
    console.log("ruuned here while deleting", this.currentShape);

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
    this.isDrawing = false;
    this.isDragging = false;
    this.isTransforming = false;
    this.activeHandle = null;
    this.transformStart = null;
    this.selectionBox = null;
    this.redraw();
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

    this.shapes.forEach((shape) => this.drawShape(shape));
    this.ctx.restore();
  }

  private drawShape(shape: Shape) {
    if (!shape) return;
    this.ctx.strokeStyle = shape.strokeColor;
    this.ctx.lineWidth = shape.strokeWidth;
    this.ctx.fillStyle = shape.fillColor;

    console.log(shape, "shape.type in drawShape");

    if (this.selectedShapes.includes(shape)) {
      this.drawSelectionIndicators(shape);
    }


    switch (shape.type) {
      case "rect":
        this.ctx.strokeRect(
          shape.x,
          shape.y,
          shape.details.width,
          shape.details.height
        );
        break;

      case "circle":
        this.ctx.beginPath();
        this.ctx.arc(shape.x, shape.y, shape.details.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        break;

      case "line":
        if (!shape.details || shape.details.x1 === undefined) {
          console.warn("Line shape is missing details:", shape);
          return;
        }

        console.log(shape, "shape of line");

        this.ctx.beginPath();
        console.log(shape, "shape here");

        this.ctx.moveTo(shape.details.x1, shape.details.y1);
        this.ctx.lineTo(shape.details.x2, shape.details.y2);
        this.ctx.stroke();
        break;

      case "text":
        this.ctx.font = `${shape.details.fontSize}px sans-serif`;
        this.ctx.fillStyle = shape.strokeColor;
        this.ctx.fillText(shape.details.content, shape.x, shape.y);
        break;

      case "draw":
        if (shape.details.points && shape.details.points.length > 0) {
          this.ctx.beginPath();
          this.ctx.moveTo(shape.details.points[0].x, shape.details.points[0].y);
          shape.details.points.forEach((point: { x: number, y: number }) => {
            this.ctx.lineTo(point.x, point.y);
          });
          this.ctx.stroke();
        }
        break;

      case "arrow":
        const angle = Math.atan2(shape.details.y2 - shape.details.y1, shape.details.x2 - shape.details.x1);
        const arrowLength = 15;

        this.ctx.beginPath();
        this.ctx.moveTo(shape.details.x1, shape.details.y1);
        this.ctx.lineTo(shape.details.x2, shape.details.y2);
        this.ctx.lineTo(shape.details.x2 - arrowLength * Math.cos(angle - Math.PI / 6), shape.details.y2 - arrowLength * Math.sin(angle - Math.PI / 6));
        this.ctx.moveTo(shape.details.x2, shape.details.y2);
        this.ctx.lineTo(shape.details.x2 - arrowLength * Math.cos(angle + Math.PI / 6), shape.details.y2 - arrowLength * Math.sin(angle + Math.PI / 6));
        this.ctx.stroke();
        break;

      case "diamond":
        this.ctx.beginPath();
        this.ctx.moveTo(shape.x, shape.y - shape.details.height / 2);
        this.ctx.lineTo(shape.x + shape.details.width / 2, shape.y);
        this.ctx.lineTo(shape.x, shape.y + shape.details.height / 2);
        this.ctx.lineTo(shape.x - shape.details.width / 2, shape.y);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        break;

      default:
        break;
    }
  }

  private drawSelectionIndicators(shape: Shape) {
    this.ctx.strokeStyle = "blue";
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);

    const bounds = this.getShapeBounds(shape);
    this.ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    this.ctx.setLineDash([]);
  }

  private getTransformHandles(shape: Shape): TransformHandle[] {
    const bounds = this.getShapeBounds(shape);
    const handles: TransformHandle[] = [];

    const corners = [
      { x: bounds.x, y: bounds.y, cursor: "nw-resize", },
      { x: bounds.x + bounds.width, y: bounds.y, cursor: "ne-resize", },
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height, cursor: "se-resize", },
      { x: bounds.x, y: bounds.y + bounds.height, cursor: "sw-resize", },
    ]

    corners.forEach(corner => {
      handles.push({
        x: corner.x,
        y: corner.y,
        cursor: corner.cursor,
        action: "resize",
      })
    })

    handles.push({
      x: bounds.x + bounds.width / 2,
      y: bounds.y - 20,
      cursor: "grab",
      action: "rotate",
    })

    return handles;
  }

  private getShapeBounds(shape: Shape): SelectionBox {
    switch (shape.type) {
      case "rect":
      case "diamond":
        return {
          x: shape.x,
          y: shape.y,
          width: shape.details.width,
          height: shape.details.height
        };

      case "circle":
        return {
          x: shape.x - shape.details.radius,
          y: shape.y - shape.details.radius,
          width: shape.details.radius * 2,
          height: shape.details.radius * 2
        };

      default:
        return {
          x: shape.x,
          y: shape.y,
          width: 0,
          height: 0
        };
    }
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

  private getShapeCenter(shape: Shape) {
    const bounds = this.getShapeBounds(shape);
    return {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2
    }
  }

  private drawTransformHandles(shape: Shape) {
    const handles = this.getTransformHandles(shape);

    handles.forEach(handle => {
      this.ctx.beginPath();
      this.ctx.arc(handle.x, handle.y, 5, 0, 2 * Math.PI);
      this.ctx.fillStyle = "white";
      this.ctx.strokeStyle = "blue";
      this.ctx.fill();
      this.ctx.stroke();
    })
  }

  private isShapeInSelectionBox(shape: Shape, box: SelectionBox): boolean {
    const bounds = this.getShapeBounds(shape);
    return (
      bounds.x >= Math.min(box.x, box.x + box.width) &&
      bounds.y >= Math.min(box.y, box.y + box.height) &&
      bounds.x + bounds.width <= Math.max(box.x, box.x + box.width) &&
      bounds.y + bounds.height <= Math.max(box.y, box.y + box.height)
    )
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
