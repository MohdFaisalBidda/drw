export type ShapeType = "rect" | "circle" | "line" | "text" | "draw" | "arrow" | "diamond" | "eraser";

export interface BaseShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
}

export interface Rectangle extends BaseShape {
  type: "rect";
  width: number;
  height: number;
}

export interface Circle extends BaseShape {
  type: "circle";
  radius: number;
}

export interface Line extends BaseShape {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Text extends BaseShape {
  type: "text";
  content: string;
  fontSize: number;
}

export interface Draw extends BaseShape {
  type: "draw";
  points: { x: number; y: number }[];
}

export interface Arrow extends BaseShape {
  type: "arrow";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Diamond extends BaseShape {
  type: "diamond";
  width: number;
  height: number;
}

export type Shape = Rectangle | Circle | Line | Text | Draw | Arrow | Diamond;

export interface ShapeStore {
  shapes: Shape[];
  selectedShapeId: string | null;
  selectedTool: ShapeType | null;
  addShape: (shape: Shape) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  deleteShape: (id: string) => void;
  setSelectedShape: (id: string | null) => void;
  setSelectedTool: (tool: ShapeType | null) => void;
}

