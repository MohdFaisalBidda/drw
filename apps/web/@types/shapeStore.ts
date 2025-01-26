export type ShapeType = "rect" | "circle" | "line" | "text" | "draw" | "arrow" | "diamond" | "eraser";

export interface Shape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
  details?: Record<string, any>;
  roomId?: string;
  // createdBy: string;
  isPersonal?: boolean;
}

export interface Rectangle extends Shape {
  type: "rect";
  details: {
    width: number;
    height: number;
  };
}

export interface Circle extends Shape {
  type: "circle";
  details: {
    radius: number;
  };
}

export interface Line extends Shape {
  type: "line";
  details: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

export interface Text extends Shape {
  type: "text";
  details: {
    content: string;
    fontSize: number;
  };
}

export interface Draw extends Shape {
  type: "draw";
  details: {
    points: { x: number; y: number }[];
  };
}

export interface Arrow extends Shape {
  type: "arrow";
  details: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

export interface Diamond extends Shape {
  type: "diamond";
  details: {
    width: number;
    height: number;
  };
}