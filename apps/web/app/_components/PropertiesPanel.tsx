import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Draw, Shape, Tool } from "@/lib/draw";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Circle, CircleDashed, CircleDotDashed, CircleDotIcon } from "lucide-react";

//add more new colors
const colors = [
  "#000000",
  "#FF0000",
  "#0000FF",
  "#00FF00",
  "#FFA500",
  "#333333",
  "#FFFFFF",
  "#800080",
  "#FFC0CB",
  "#FFFF00",
  "#00FFFF",
  "#A52A2A",
];
// const sizes = [{"S":1}, {"M":2}, {"L":4}, {"XL":8}]
const sizes = [
  { name: "S", value: 1 },
  { name: "M", value: 2 },
  { name: "L", value: 4 },
  { name: "XL", value: 8 },
];

interface PropertiesPanelProps {
  onUpdateShape: (updatedShape: Shape) => void;
  className?: string;
  draw: Draw | undefined;
  selectedTool: Tool | null;
}

export function PropertiesPanel({
  onUpdateShape,
  className,
  draw,
  selectedTool,
}: PropertiesPanelProps) {
  const [activeColor, setActiveColor] = useState(draw?.currColor || "white");
  const [activeBgColor, setActiveBgColor] = useState(
    draw?.currBgColor || "#ffffff00"
  );
  const [activeStrokeWidth, setActiveStrokeWidth] = useState(
    draw?.currStrokeWidth || 2
  );
  const [activeStrokeStyle, setActiveStrokeStyle] = useState(
    draw?.currStrokeStyle || "solid"
  );
  const [url, setUrl] = useState("");

  const shouldShow =
    (selectedTool && selectedTool !== "camera" && selectedTool !== "eraser") ||
    draw?.selectedShape !== null;

  const handleStrokeColorChange = (color: string) => {
    setActiveColor(color);
    if (draw) {
      draw.setColor(color);
      if (draw.selectedShape) {
        const updatedShape = { ...draw.selectedShape, color };
        draw.updateShape(updatedShape);
        onUpdateShape(updatedShape);
      }
    }
  };

  const handleBgColorChange = (color: string) => {
    setActiveBgColor(color);
    draw?.setBgColor(color);
    if (draw?.selectedShape) {
      const updatedShape = { ...draw.selectedShape, bgColor: color };
      draw.updateShape(updatedShape);
      onUpdateShape(updatedShape);
    }
  };

  const handleStrokeWidthChange = (width: number) => {
    setActiveStrokeWidth(width);
    draw?.setStrokeWidth(width);
    if (draw?.selectedShape) {
      const updatedShape = { ...draw.selectedShape, strokeWidth: width };
      draw.updateShape(updatedShape);
      onUpdateShape(updatedShape);
    }
  };

  const handleStrokeStyleChange = (style: string) => {
    setActiveStrokeStyle(style);
    draw?.setStrokeStyle(style);
    if (draw?.selectedShape) {
      const updatedShape = { ...draw.selectedShape, strokeStyle: style };
      draw.updateShape(updatedShape);
      onUpdateShape(updatedShape);
    }
  };

  const handleOpacityChange = (opacity: number) => {
    if (draw?.selectedShape) {
      const updatedShape = {
        ...draw.selectedShape,
        opacity: opacity / 100,
      };
      onUpdateShape(updatedShape);
    }
  };

  useEffect(() => {
    if (draw) {
      setActiveColor(draw.currColor);
      setActiveBgColor(draw.currBgColor);
      setActiveStrokeWidth(draw.currStrokeWidth);
      setActiveStrokeStyle(draw.currStrokeStyle);
    }
  }, [
    draw?.currColor,
    draw?.currBgColor,
    draw?.currStrokeWidth,
    draw?.currStrokeStyle,
  ]);

  return (
    shouldShow && (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "w-60 lg:w-48 h-auto bg-darkbg p-4 flex flex-col gap-4 rounded-xl border border-white/10 shadow-lg",
            className
          )}
        >
          <div className="space-y-4">
            {/* Stroke Color */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/80">
                Stroke
              </label>
              <div className="grid grid-cols-6 gap-4">
                {colors.map((color) => (
                  <Button
                    key={color}
                    size="sm"
                    variant="outline"
                    className={`w-4 h-4 p-0 rounded-full transition-all ${activeColor === color ? "ring-1 ring-offset-1 ring-white" : "border-none"}`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleStrokeColorChange(color)}
                  />
                ))}
              </div>
            </div>

            {/* Background Color */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/80">
                Background
              </label>
              <div className="grid grid-cols-6 gap-4">
                {colors.map((color) => (
                  <Button
                    key={color}
                    size="sm"
                    variant="outline"
                    className={`w-4 h-4 p-0 rounded-full transition-all ${activeBgColor === color ? "ring-1 ring-offset-1 ring-white" : "border-none"}`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleBgColorChange(color)}
                  />
                ))}
              </div>
            </div>

            {/* Stroke Width */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/80">
                Stroke width
              </label>
              <div className="flex gap-4">
                {sizes.map((size) => (
                  <Button
                    key={size.name}
                    variant="secondary"
                    className={`w-7 h-7 p-0 transition-all ${activeStrokeWidth === size.value ? "" : "bg-white/50"}`}
                    onClick={() => handleStrokeWidthChange(size.value)}
                  >
                    {size.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Stroke Style */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/80">
                Stroke style
              </label>
              <div className="flex gap-4">
                <Button
                  onClick={() => handleStrokeStyleChange("solid")}
                  variant="secondary"
                  className={`w-7 h-7 p-0 transition-all ${activeStrokeStyle === "solid" ? "" : "bg-white/50"}`}
                >
                  <Circle className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => handleStrokeStyleChange("dashed")}
                  variant="secondary"
                  className={`w-7 h-7 p-0 transition-all ${activeStrokeStyle === "dashed" ? "" : "bg-white/50"}`}
                >
                  <CircleDashed className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => handleStrokeStyleChange("dotted")}
                  variant="secondary"
                  className={`w-7 h-7 p-0 transition-all ${activeStrokeStyle === "dotted" ? "" : "bg-white/50"}`}
                >
                  <CircleDotDashed className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Opacity */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/80">
                Opacity
              </label>
              <div className="px-2">
                <Slider
                  defaultValue={[100]}
                  max={100}
                  step={1}
                  onValueChange={(val) => {
                    if (!val) return;
                    handleOpacityChange(val[0] as number);
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-white/50">
                <span>0</span>
                <span>100</span>
              </div>
            </div>

            {/* Iframe URL input */}
            {selectedTool === "iframe" && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-white mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    onUpdateShape({
                      ...(draw?.selectedShape as any),
                      url: e.target.value,
                    });
                  }}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  placeholder="https://example.com"
                />
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    )
  );
}
