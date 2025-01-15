import { create, createStore } from "zustand";
import { Circle, Line, Rectangle, ShapeStore } from "../@types/shapeStore";

export const useShapeStore = create<ShapeStore>((set) => ({
  shapes: [],
  selectedShapeId: null,
  selectedTool: null,
  addShape: (shape) =>
    set((state) => ({
      shapes: [...state.shapes, shape]
    })),

  updateShape: (id, updates) =>
    set((state) => ({
      shapes: state.shapes.map((shape) => {
        if (shape.id === id) {
          if (shape.type === "rect") {
            return { ...shape, ...updates } as Rectangle
          }
          if (shape.type === "circle") {
            return { ...shape, ...updates } as Circle
          }
          if (shape.type === "line") {
            return { ...shape, ...updates } as Line
          }
        }
        return shape
      })
    })),

  deleteShape: (id) =>
    set((state) => ({
      shapes: state.shapes.filter((shape) => shape.id !== id)
    })),

  setSelectedShape: (id) => set({ selectedShapeId: id }),
  setSelectedTool: (tool) => set({ selectedTool: tool })
}))