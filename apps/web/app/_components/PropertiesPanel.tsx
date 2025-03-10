import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Draw, Shape } from "@/lib/draw";
import { cn } from "@/lib/utils";

interface PropertiesPanelProps {
  onUpdateShape: (updatedShape: Shape) => void;
  className?: string;
  draw: Draw | undefined;
}

export function PropertiesPanel({
  onUpdateShape,
  className,
  draw,
}: PropertiesPanelProps) {
  const handleStrokeColorChange = (color: string) => {
    if (draw?.selectedShape) {
      const updatedShape = { ...draw.selectedShape, color };
      draw.updateShape(updatedShape);
      onUpdateShape(updatedShape);
    }
  };

  const handleBgColorChange = (color: string) => {
    if (draw?.selectedShape) {
      const updatedShape = { ...draw.selectedShape, bgColor: color };
      draw.updateShape(updatedShape);
      onUpdateShape(updatedShape);
    }
  };

  const handleStrokeWidthChange = (width: number) => {
    if (draw?.selectedShape) {
      const updatedShape = { ...draw.selectedShape, strokeWidth: width };
      draw.updateShape(updatedShape);
      onUpdateShape(updatedShape);
    }
  };

  const handleStrokeStyleChange = (style: string) => {
    if (draw?.selectedShape) {
      const updatedShape = { ...draw.selectedShape, strokeStyle: style };
      draw.updateShape(updatedShape);
      onUpdateShape(updatedShape);
    }
  };

  const handleOpacityChange = (opacity: number) => {
    if (draw?.selectedShape) {
      const updateShape = {
        ...draw.selectedShape,
        opacity: opacity / 100,
      };
      onUpdateShape(updateShape);
    }
  };

  return (
    <div
      className={cn(
        "w-60 bg-background p-4 flex flex-col gap-4 rounded-xl",
        className
      )}
    >
      {/* Stroke Color */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Stroke</label>
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
              size={"sm"}
              variant="outline"
              className="w-7 h-7 p-0"
              style={{ backgroundColor: color }}
              onClick={() => handleStrokeColorChange(color)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Background</label>
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
              size={"sm"}
              variant="outline"
              className="w-7 h-7 p-0"
              style={{ backgroundColor: color }}
              onClick={() => handleBgColorChange(color)}
            />
          ))}
        </div>
      </div>

      {/* Stroke Width */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Stroke width</label>
        <div className="flex gap-1">
          {[1, 2, 4].map((width) => (
            <Button
              key={width}
              variant="secondary"
              className="w-7 h-7 p-0"
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
        <label className="text-sm font-medium">Stroke style</label>
        <div className="flex gap-1">
          <Button
            onClick={() => handleStrokeStyleChange("solid")}
            variant="secondary"
            className="w-7 h-7 p-0"
          >
            <div className="w-4 h-[2px] bg-foreground" />
          </Button>
          <Button
            onClick={() => handleStrokeStyleChange("dashed")}
            variant="secondary"
            className="w-7 h-7 p-0"
          >
            <div className="w-4 h-[2px] bg-foreground border-dashed border-t-2" />
          </Button>
          <Button
            onClick={() => handleStrokeStyleChange("dotted")}
            variant="secondary"
            className="w-7 h-7 p-0"
          >
            <div className="w-4 h-[2px] bg-foreground border-dotted border-t-2" />
          </Button>
        </div>
      </div>

      {/* Sloppiness */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Sloppiness</label>
        <div className="flex gap-1">
          <Button variant="secondary" className="w-7 h-7 p-0">
            ―
          </Button>
          <Button variant="secondary" className="w-7 h-7 p-0">
            ∿
          </Button>
          <Button variant="secondary" className="w-7 h-7 p-0">
            ≈
          </Button>
        </div>
      </div>

      {/* Arrow Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Arrow type</label>
        <div className="flex gap-1">
          <Button variant="secondary" className="w-7 h-7 p-0">
            →
          </Button>
          <Button variant="secondary" className="w-7 h-7 p-0">
            ⟶
          </Button>
          <Button variant="secondary" className="w-7 h-7 p-0">
            ⇢
          </Button>
        </div>
      </div>

      {/* Arrowheads */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Arrowheads</label>
        <div className="flex gap-1">
          <Button variant="secondary" className="w-7 h-7 p-0">
            ←
          </Button>
          <Button variant="secondary" className="w-7 h-7 p-0">
            →
          </Button>
        </div>
      </div>

      {/* Opacity */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Opacity</label>
        <div className="px-2">
          <Slider
            defaultValue={[100]}
            max={100}
            step={1}
            onValueChange={(val) => {
              console.log(val[0] / 100, val, "val");
              handleOpacityChange(val[0] as number);
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0</span>
          <span>100</span>
        </div>
      </div>

      {/* Layers */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Layers</label>
        <div className="flex gap-1">
          <Button variant="secondary" className="w-7 h-7 p-0">
            ↑
          </Button>
          <Button variant="secondary" className="w-7 h-7 p-0">
            ↓
          </Button>
          <Button variant="secondary" className="w-7 h-7 p-0">
            †
          </Button>
          <Button variant="secondary" className="w-7 h-7 p-0">
            ⊤
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Actions</label>
        <div className="flex gap-1">
          <Button variant="secondary" className="w-7 h-7 p-0">
            ↺
          </Button>
          <Button variant="secondary" className="w-7 h-7 p-0">
            ↻
          </Button>
          <Button variant="secondary" className="w-7 h-7 p-0">
            ⧉
          </Button>
          <Button variant="secondary" className="w-7 h-7 p-0">
            ⟲
          </Button>
        </div>
      </div>
    </div>
  );
}
