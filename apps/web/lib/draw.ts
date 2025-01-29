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
  private currentShape: Shape | null = null;
  private transform = { scale: 1, offsetX: 0, offsetY: 0 };
  private selectedTool: "circle" | "pencil" | "rect" = "rect";

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

    console.log("jere");

    this.currentShape = {
      id: uuidv4(),
      type: this.currentTool,
      strokeColor: '#ffffff',
      strokeWidth: 1,
      fillColor: 'transparent',
      x: point.x,
      y: point.y,
      details: this.currentTool === 'rect' ? { width: 0, height: 0 } : { radius: 0 },
    };
    this.shapes.push(this.currentShape);
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isDrawing || !this.currentShape || !this.startPoint) return;
    const currentPoint = this.getCanvasPoint(e);

    console.log("currentShape.type in handleMouseMove");

    if (this.currentShape.type === 'rect') {
      this.currentShape.details.width = currentPoint.x - this.startPoint.x;
      this.currentShape.details.height = currentPoint.y - this.startPoint.y;
    } else if (this.currentShape.type === 'circle') {
      this.currentShape.details.radius = Math.abs(currentPoint.x - this.startPoint.x) / 2;
      this.currentShape.x = this.startPoint.x;
      this.currentShape.y = this.startPoint.y;
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

    if (shape.type === 'rect') {
      this.ctx.strokeRect(
        shape.x,
        shape.y,
        shape.details.width,
        shape.details.height
      );
    } else if (shape.type === 'circle') {
      this.ctx.beginPath();
      this.ctx.arc(shape.x, shape.y, shape.details.radius, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }
}
