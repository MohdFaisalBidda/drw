import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface PropertiesPanelProps {
  className?: string;
}

export function PropertiesPanel({ className }: PropertiesPanelProps) {
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
          <Button
            size={"sm"}
            variant="outline"
            className="w-7 h-7 p-0 bg-black"
          />
          <Button
            size={"sm"}
            variant="outline"
            className="w-7 h-7 p-0 bg-red-500"
          />
          <Button
            size={"sm"}
            variant="outline"
            className="w-7 h-7 p-0 bg-blue-500"
          />
          <Button
            size={"sm"}
            variant="outline"
            className="w-7 h-7 p-0 bg-green-500"
          />
          <Button
            size={"sm"}
            variant="outline"
            className="w-7 h-7 p-0 bg-orange-500"
          />
          <Button
            size={"sm"}
            variant="outline"
            className="w-7 h-7 p-0 bg-zinc-900"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Background</label>
        <div className="flex gap-1">
          <Button
            size={"sm"}
            variant="outline"
            className="w-7 h-7 p-0 bg-black"
          />
          <Button
            size={"sm"}
            variant="outline"
            className="w-7 h-7 p-0 bg-red-500"
          />
          <Button
            size={"sm"}
            variant="outline"
            className="w-7 h-7 p-0 bg-blue-500"
          />
          <Button
            size={"sm"}
            variant="outline"
            className="w-7 h-7 p-0 bg-green-500"
          />
          <Button
            size={"sm"}
            variant="outline"
            className="w-7 h-7 p-0 bg-orange-500"
          />
          <Button
            size={"sm"}
            variant="outline"
            className="w-7 h-7 p-0 bg-zinc-900"
          />
        </div>
      </div>

      {/* Stroke Width */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Stroke width</label>
        <div className="flex gap-1">
          <Button variant="secondary" className="w-7 h-7 p-0">
            <div className="w-4 h-[2px] bg-foreground" />
          </Button>
          <Button variant="secondary" className="w-7 h-7 p-0">
            <div className="w-4 h-1 bg-foreground" />
          </Button>
          <Button variant="secondary" className="w-7 h-7 p-0">
            <div className="w-4 h-2 bg-foreground" />
          </Button>
        </div>
      </div>

      {/* Stroke Style */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Stroke style</label>
        <div className="flex gap-1">
          <Button variant="secondary" className="w-7 h-7 p-0">
            <div className="w-4 h-[2px] bg-foreground" />
          </Button>
          <Button variant="secondary" className="w-7 h-7 p-0">
            <div className="w-4 h-[2px] bg-foreground border-dashed border-t-2" />
          </Button>
          <Button variant="secondary" className="w-7 h-7 p-0">
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
          <Slider defaultValue={[100]} max={100} step={1} />
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
