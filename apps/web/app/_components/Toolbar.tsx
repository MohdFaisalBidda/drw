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
  BoxSelectIcon,
  Camera,
  Globe,
} from "lucide-react";
import { Tool } from "../../lib/draw";

const Selection = () => {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="c-hdkwsG c-hdkwsG-dvzWZT-size-medium c-hdkwsG-OzWqL-weight-normal c-hdkwsG-iPJLV-css w-5 h-5"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="m2 3.1782.0617.1675 6.8733 18.6544h2.0533l.0116-.002 1c0-6.0212 4.9769-10.998 10.9982-10.998l.0033-.0186v-2.0459l-18.6556-6.8738-.1674-.0617h-.1784l-1 1v.1782Zm7.6166 14.887-4.929-13.3777 13.3776 4.9291c-3.9883 1.2841-7.1645 4.4602-8.4486 8.4486Z"
        clipRule="evenodd"
      ></path>
      <path
        fill="currentColor"
        d="M21.998 10.0956c-6.5736 0-11.9025 5.3289-11.9025 11.9024l-7.139-19.0412 19.0415 7.1388Z"
      ></path>
    </svg>
  );
};

function Toolbar({
  selectedTool,
  setSelectedTool,
  handleScreenshot,
}: {
  selectedTool: Tool | null;
  setSelectedTool: (tool: Tool | null) => void;
  handleScreenshot: () => void;
}) {
  const tools: { type: Tool; icon: React.ReactNode }[] = [
    { type: "select", icon: <Selection /> },
    { type: "circle", icon: <CircleIcon className="h-5 w-5" /> },
    { type: "rect", icon: <Square className="h-5 w-5" /> },
    { type: "line", icon: <Minus className="h-5 w-5" /> },
    { type: "text", icon: <Type className="h-5 w-5" /> },
    {
      type: "pencil",
      icon: <img src="/pencil-icon.png" className="h-5 w-5" />,
    },
    { type: "arrow", icon: <ArrowRight className="h-5 w-5" /> },
    { type: "diamond", icon: <Diamond className="h-5 w-5" /> },
    { type: "eraser", icon: <Eraser className="h-5 w-5" /> },
    // {
    //   type: "camera",
    //   icon: <Camera className="w-5 h-5" onClick={handleScreenshot} />,
    // },
    // { type: "iframe", icon: <Globe className="h-5 w-5" /> },
  ];

  return (
    <div className="fixed inset-x-0 top-5 flex items-center justify-center">
      <div className="flex space-x-2 bg-gray-800 p-2 rounded-lg shadow-lg">
        {tools.map((tool) => (
          <button
            className={`${selectedTool === tool.type ? "bg-purple-600" : ""} rounded-lg p-2 text-white`}
            key={tool.type}
            onClick={() =>
              setSelectedTool(tool.type === selectedTool ? selectedTool : tool.type) 
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
