import React from "react";
import {
  Square,
  CircleIcon,
  Minus,
  Type,
  Pencil,
  ArrowRight,
  Diamond,
  Eraser,
} from "lucide-react";
import { useShapeStore } from "../../stores/shapeStore";
import { ShapeType } from "../../@types/shapeStore";

function Toolbar() {
  const selectedTool = useShapeStore((state) => state.selectedTool);
  const setSelectedTool = useShapeStore((state) => state.setSelectedTool);

  const tools: { type: ShapeType; icon: React.ReactNode }[] = [
    { type: "rect", icon: <Square className="h-5 w-5" /> },
    { type: "circle", icon: <CircleIcon className="h-5 w-5" /> },
    { type: "line", icon: <Minus className="h-5 w-5" /> },
    { type: "text", icon: <Type className="h-5 w-5" /> },
    { type: "draw", icon: <Pencil className="h-5 w-5" /> },
    { type: "arrow", icon: <ArrowRight className="h-5 w-5" /> },
    { type: "diamond", icon: <Diamond className="h-5 w-5" /> },
    { type: "eraser", icon: <Eraser className="h-5 w-5" /> },
  ];

  return (
    <div className="relative">
      <div className="absolute w-fit inset-x-0 top-0">
        {tools.map((tool) => (
          <button
            className={`${selectedTool === tool.type ? "bg-blue-500" : ""} rounded-lg p-2`}
            key={tool.type}
            onClick={() =>
              setSelectedTool(tool.type === selectedTool ? null : tool.type)
            }
          >
            {tool.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Toolbar;
