import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Draw, Shape, Tool } from "@/lib/draw";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
            "w-60 bg-gray-800 p-4 flex flex-col gap-4 rounded-xl border border-white/10 shadow-lg",
            className
          )}
        >
          <div className="space-y-4">
            {/* Stroke Color */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Stroke</label>
              <div className="flex gap-1">
                {[
                  "#000000",
                  "#FF0000",
                  "#0000FF",
                  "#00FF00",
                  "#FFA500",
                  "#333333",
                ].map((color) => (
                  <Button
                    key={color}
                    size="sm"
                    variant="outline"
                    className={`w-7 h-7 p-0 transition-all ${activeColor === color ? "ring-1 ring-offset-1 ring-white" : "border-none"}`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleStrokeColorChange(color)}
                  />
                ))}
              </div>
            </div>

            {/* Background Color */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Background</label>
              <div className="flex gap-1">
                {[
                  "#000000",
                  "#FF0000",
                  "#0000FF",
                  "#00FF00",
                  "#FFA500",
                  "#333333",
                ].map((color) => (
                  <Button
                    key={color}
                    size="sm"
                    variant="outline"
                    className={`w-7 h-7 p-0 transition-all ${activeBgColor === color ? "ring-1 ring-offset-1 ring-white" : "border-none"}`} 
                    style={{ backgroundColor: color }}
                    onClick={() => handleBgColorChange(color)}
                  />
                ))}
              </div>
            </div>

            {/* Stroke Width */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Stroke width</label>
              <div className="flex gap-1">
                {[1, 2, 4].map((width) => (
                  <Button
                    key={width}
                    variant="secondary"
                    className={`w-7 h-7 p-0 transition-all ${activeStrokeWidth === width ? "" : "bg-white/50"}`}
                    onClick={() => handleStrokeWidthChange(width)}
                  >
                    <div
                      className="w-4"
                      style={{
                        height: `${width}px`,
                        backgroundColor: "currentColor",
                      }}
                    />
                  </Button>
                ))}
              </div>
            </div>

            {/* Stroke Style */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Stroke style</label>
              <div className="flex gap-1">
                <Button
                  onClick={() => handleStrokeStyleChange("solid")}
                  variant="secondary"
                  className={`w-7 h-7 p-0 transition-all ${activeStrokeStyle === "solid" ? "" : "bg-white/50"}`}
                >
                  <div className="w-4 h-[2px] bg-foreground" />
                </Button>
                <Button
                  onClick={() => handleStrokeStyleChange("dashed")}
                  variant="secondary"
                  className={`w-7 h-7 p-0 transition-all ${activeStrokeStyle === "dashed" ? "" : "bg-white/50"}`}
                >
                  <div className="w-4 h-[2px] bg-foreground border-dashed border-t-2" />
                </Button>
                <Button
                  onClick={() => handleStrokeStyleChange("dotted")}
                  variant="secondary"
                  className={`w-7 h-7 p-0 transition-all ${activeStrokeStyle === "dotted" ? "" : "bg-white/50"}`}
                >
                  <div className="w-4 h-[2px] bg-foreground border-dotted border-t-2" />
                </Button>
              </div>
            </div>

            {/* Opacity */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Opacity</label>
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
                <label className="block text-sm font-medium text-white mb-2">
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