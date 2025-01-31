import { v4 as uuidv4 } from 'uuid';
import { HTTP_URL } from '../config';
import axios from 'axios';

export type Tool = 'rect' | 'circle' | 'pencil' | 'line' | 'text' | 'arrow' | 'diamond' | 'draw' | 'eraser';

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

export class Draw {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private socket: WebSocket;
  private roomId: string;
  private shapes: Shape[] = [];
  private currentTool: Tool = 'rect';
  private isDrawing = false;
  private startPoint: { x: number; y: number } | null = null;
  private drawPoints: { x: number, y: number }[] = [];
  private currentShape: Shape | null = null;
  private transform = { scale: 1, offsetX: 0, offsetY: 0 };
  private selectedTool: 'rect' | 'circle' | 'pencil' | 'line' | 'text' | 'arrow' | 'diamond' | 'draw' | 'eraser' = 'rect';

  constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
    this.canvas = canvas;
    this.roomId = roomId;
    this.socket = socket;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get canvas context');
    this.ctx = ctx;

    this.init();
    this.setupCanvas();
    this.setupEventListeners();
    this.setupSocketListeners();
  }

  async init() {
    this.shapes = await this.fetchExistingShapes();
    this.redraw();
  }

  destroy() {
    this.canvas.removeEventListener("mousedown", this.handleMouseDown)
    this.canvas.removeEventListener("mouseup", this.handleMouseUp)
    this.canvas.removeEventListener("mousemove", this.handleMouseMove)
    this.canvas.removeEventListener("wheel", this.handleWheel)
  }

  setTool(tool: "circle" | "pencil" | "rect") {
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

  private async fetchExistingShapes() {
    try {
      const response = await axios.get(`${HTTP_URL}/api/room/${this.roomId}/shapes`);
      console.log(response.data.shapes, "response in fetch");

      return response.data.shapes.map((x: { message: string }) => {
        try {
          return JSON.parse(x.message);
        } catch (error) {
          console.error('Invalid JSON in shape message:', x.message, error);
          return null;
        }
      }).filter(Boolean);
    } catch (error) {
      console.error('Failed to fetch shapes:', error);
      return [];
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
          console.log(shape, "shape in socket");

          this.shapes.push(shape);
          this.redraw();
        }
      } catch (error) {
        console.error('Failed to parse incoming message:', event.data, error);
      }
    });
  }

  private handleMouseDown = (e: MouseEvent) => {
    const point = this.getCanvasPoint(e);
    this.startPoint = point;
    this.isDrawing = true;
    this.currentTool = this.selectedTool;

    const templateShape = {
      id: uuidv4(),
      type: this.currentTool,
      strokeColor: '#ffffff',
      strokeWidth: 1,
      fillColor: 'transparent',
      x: point.x,
      y: point.y,
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
            content: "Text",
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

    this.shapes.push(this.currentShape);
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isDrawing || !this.currentShape || !this.startPoint) return;
    const currentPoint = this.getCanvasPoint(e);
    const dx = currentPoint.x - this.startPoint.x;
    const dy = currentPoint.y - this.startPoint.y;

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
        this.drawPoints.push(currentPoint)
        if (this.currentShape.details) {
          this.currentShape.details.points = [...this.drawPoints];
        }
        break;

      case "eraser":
        this.shapes = this.shapes.filter((shape) => !this.isPointInShape(currentPoint.x, currentPoint.y, shape, this.transform));
        break;

      case "line":
      case "arrow":
        this.currentShape.details.x2 = currentPoint.x;
        this.currentShape.details.y2 = currentPoint.y;
        break;

      default:
        break;
    }

    this.redraw();
  };

  private handleMouseUp = () => {
    if (!this.isDrawing || !this.currentShape) return;
    this.isDrawing = false;
    this.sendShapeToServer(this.currentShape);
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
    this.ctx.strokeStyle = shape.strokeColor;
    this.ctx.lineWidth = shape.strokeWidth;
    this.ctx.fillStyle = shape.fillColor;

    console.log(shape, "shape.type in drawShape");

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
