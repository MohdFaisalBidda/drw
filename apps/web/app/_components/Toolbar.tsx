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
import { Tool } from "../../lib/draw";

function Toolbar({
  selectedTool,
  setSelectedTool,
}: {
  selectedTool: Tool | null;
  setSelectedTool: (tool: Tool | null) => void;
}) {
  const tools: { type: Tool; icon: React.ReactNode }[] = [
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
    <div className="fixed inset-x-0 top-5 flex items-center justify-center">
      <div className="flex space-x-2 bg-gray-800 p-2 rounded-lg shadow-lg">
        {tools.map((tool) => (
          <button
            className={`${selectedTool === tool.type ? "bg-purple-600" : ""} rounded-lg p-2 text-white`}
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
