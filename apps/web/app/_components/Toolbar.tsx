import React from "react";
import { Square, CircleIcon, Minus, Type, Pencil, ArrowRight, Diamond, Eraser } from 'lucide-react'
import { useShapeStore } from "../../stores/shapeStore";
import { ShapeType } from "../../@types/shapeStore";

function Toolbar() {
  const selectedTool = useShapeStore((state) => state.selectedTool);
  const setSelectedTool = useShapeStore((state) => state.setSelectedTool);

  const tools: { type: ShapeType; icon: React.ReactNode }[] = [
    { type: "rect", icon: <Square className="h-4 w-4" /> },
    { type: "circle", icon: <CircleIcon className="h-4 w-4" /> },
    { type: "line", icon: <Minus className="h-4 w-4" /> },
    { type: "text", icon: <Type className="h-4 w-4" /> },
    { type: "draw", icon: <Pencil className="h-4 w-4" /> },
    { type: "arrow", icon: <ArrowRight className="h-4 w-4" /> },
    { type: "diamond", icon: <Diamond className="h-4 w-4" /> },
    { type: "eraser", icon: <Eraser className="h-4 w-4" /> },
  ];

  return (
    <div>
      {tools.map((tool) => (
        <button key={tool.type} onClick={() => setSelectedTool(tool.type)}>
          {tool.icon}
        </button>
      ))}
    </div>
  );
}

export default Toolbar;
