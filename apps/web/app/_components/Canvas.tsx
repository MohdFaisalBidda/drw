"use client";

import React, { useRef } from "react";
import { useShapeStore } from "../../stores/shapeStore";

function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shapes = useShapeStore((state) => state.shapes)
  const selectedTool = useShapeStore((state) => state.selectedTool)
  const selectedShapeId = useShapeStore((state) => state.selectedShapeId)
  const addShape = useShapeStore((state) => state.addShape)
  const updateShape = useShapeStore((state) => state.updateShape)
  const deleteShape = useShapeStore((state) => state.deleteShape)
  const setSelectedShape = useShapeStore((state) => state.setSelectedShape)
  return (
    <>
      {/* Add Tailwind css*/}
      <canvas ref={canvasRef} style={{
        width: "100%",
        height: "100%",
      }}
      onContextMenu={(e) => e.preventDefault()}
      />
    </>
  );
}

export default Canvas;
