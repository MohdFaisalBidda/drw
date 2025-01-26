import { v4 as uuidv4 } from 'uuid';

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
  private transform = { scale: 1, offsetX: 0, offsetY: 0 };

  constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
    this.canvas = canvas;
    this.roomId = roomId;
    this.socket = socket;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get canvas context');
    this.ctx = ctx;

    this.setupCanvas();
    this.setupEventListeners();
    this.setupSocketListeners();
    this.fetchExistingShapes();
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

  private setupEventListeners() {
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('wheel', this.handleWheel);
  }

  private setupSocketListeners() {
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'NEW_MESSAGE') {
        console.log(message,"message in draw");
        
        const shape = JSON.parse(message.payload.message);
        this.shapes.push(shape);
        this.redraw();
      }
    });
  }

  private async fetchExistingShapes() {
    try {
      const response = await fetch(`/api/room/${this.roomId}/shapes`);
      const data = await response.json();
      this.shapes = data.shapes.map((x: { message: string }) => {
        try {
          return JSON.parse(x.message);
        } catch (error) {
          console.error('Error parsing shape:', error);
          return null;
        }
      }).filter(Boolean);
      this.redraw();
    } catch (error) {
      console.error('Failed to fetch existing shapes:', error);
    }
  }

  private handleMouseDown = (e: MouseEvent) => {
    const point = this.getCanvasPoint(e);
    this.startPoint = point;
    this.isDrawing = true;

    const baseShape: Partial<Shape> = {
      id: uuidv4(),
      strokeColor: '#ffffff',
      strokeWidth: 1,
      fillColor: 'transparent',
      x: point.x,
      y: point.y,
    };

    let newShape: Shape | null = null;

    switch (this.currentTool) {
      case 'rect':
        newShape = {
          ...baseShape,
          type: 'rect',
          details: { width: 100, height: 100 },
        } as Shape;
        break;
      case 'circle':
        newShape = {
          ...baseShape,
          type: 'circle',
          details: { radius: 0 },
        } as Shape;
        break;
      // Add other tool handlers similarly
    }

    if (newShape) {
      this.shapes.push(newShape);
      this.sendShapeToServer(newShape);
      this.redraw();
    }
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isDrawing || !this.startPoint) return;

    const currentPoint = this.getCanvasPoint(e);
    const lastShape = this.shapes[this.shapes.length - 1];

    switch (this.currentTool) {
      case 'rect':
      case 'circle':
        this.updateLastShape(lastShape, currentPoint);
        break;
    }

    this.redraw();
  };

  private handleMouseUp = () => {
    this.isDrawing = false;
    this.startPoint = null;
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

  private updateLastShape(shape: Shape, currentPoint: { x: number; y: number }) {
    switch (shape.type) {
      case 'rect':
        shape.details.width = currentPoint.x - shape.x;
        shape.details.height = currentPoint.y - shape.y;
        break;
      case 'circle':
        const radius = Math.sqrt(
          Math.pow(currentPoint.x - shape.x, 2) +
          Math.pow(currentPoint.y - shape.y, 2)
        );
        shape.details.radius = radius;
        break;
    }
  }

  private getCanvasPoint(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - this.transform.offsetX) / this.transform.scale,
      y: (e.clientY - rect.top - this.transform.offsetY) / this.transform.scale,
    };
  }

  private sendShapeToServer(shape: Shape) {
    this.socket.send(
      JSON.stringify({
        type: 'NEW_MESSAGE',
        payload: {
          message: JSON.stringify(shape),
          roomId: this.roomId,
        },
      })
    );
  }

  private redraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(this.transform.offsetX, this.transform.offsetY);
    this.ctx.scale(this.transform.scale, this.transform.scale);

    this.shapes.forEach(shape => this.drawShape(shape));

    this.ctx.restore();
  }

  private drawShape(shape: Shape) {
    this.ctx.strokeStyle = shape.strokeColor;
    this.ctx.lineWidth = shape.strokeWidth;
    this.ctx.fillStyle = shape.fillColor;

    switch (shape.type) {
      case 'rect':
        this.ctx.strokeRect(
          shape.x, 
          shape.y, 
          shape.details.width, 
          shape.details.height
        );
        break;
      case 'circle':
        this.ctx.beginPath();
        this.ctx.arc(
          shape.x, 
          shape.y, 
          shape.details.radius, 
          0, 
          Math.PI * 2
        );
        this.ctx.stroke();
        break;
    }
  }

  setTool(tool: Tool) {
    this.currentTool = tool;
  }

  destroy() {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('wheel', this.handleWheel);
    window.removeEventListener('resize', this.resizeCanvas);
  }
}