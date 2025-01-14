import {
  Arrow,
  Circle,
  Diamond,
  Draw,
  Line,
  Rectangle,
  Shape,
  Text,
} from "../../@types/shapeStore";

interface ShapeProps {
  shape: Shape;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDrag: (e: React.MouseEvent, id: string) => void;
}

export const RectangleComponent = ({
  shape,
  isSelected,
  onSelect,
  onDrag,
}: ShapeProps) => {
  const rect = shape as Rectangle;
  return (
    <rect
      x={shape.x}
      y={shape.y}
      width={rect.width}
      height={rect.height}
      fill={shape.fillColor}
      stroke={isSelected ? "blue" : "none"}
      onClick={() => onSelect(shape.id)}
      onMouseDown={(e) => onDrag(e, shape.id)}
    />
  );
};

export const CircleComponent = ({
  shape,
  isSelected,
  onSelect,
  onDrag,
}: ShapeProps) => {
  const circle = shape as Circle;
  return (
    <circle
      cx={shape.x}
      cy={shape.y}
      r={circle.radius}
      fill={shape.fillColor}
      stroke={isSelected ? "blue" : "none"}
      onClick={() => onSelect(shape.id)}
      onMouseDown={(e) => onDrag(e, shape.id)}
    />
  );
};

export const LineComponent = ({
  shape,
  isSelected,
  onSelect,
  onDrag,
}: ShapeProps) => {
  const line = shape as Line;
  return (
    <line
      x1={line.x1}
      y1={line.y1}
      x2={line.x2}
      y2={line.y2}
      stroke={shape.fillColor}
      strokeWidth={line.strokeWidth}
      onClick={() => onSelect(shape.id)}
      onMouseDown={(e) => onDrag(e, shape.id)}
    />
  );
};

export const TextComponent = ({
  shape,
  isSelected,
  onSelect,
  onDrag,
}: ShapeProps) => {
  const text = shape as Text;
  return (
    <text
      x={shape.x}
      y={shape.y}
      fill={shape.fillColor}
      fontSize={text.fontSize}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(shape.id);
      }}
      onMouseDown={(e) => onDrag(e, shape.id)}
    >
      {text.content}
    </text>
  );
};

export const DrawComponent = ({
  shape,
  isSelected,
  onSelect,
  onDrag,
}: ShapeProps) => {
  const draw = shape as Draw;

  const pathData = draw.points
    .map((pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `L ${pt.x} ${pt.y}`))
    .join(" ");
  return (
    <path
      d={pathData}
      fill="none"
      stroke={shape.strokeColor}
      strokeWidth={shape.strokeWidth}
      className="cursor-move"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(shape.id);
      }}
      onMouseDown={(e) => onDrag(e, shape.id)}
    />
  );
};

export const ArrowComponent = ({
  shape,
  isSelected,
  onSelect,
  onDrag,
}: ShapeProps) => {
  const arrow = shape as Arrow;
  const angle = Math.atan2(arrow.y2 - arrow.y1, arrow.x2 - arrow.x1);
  const arrowLength = 15;

  const x3 = arrow.x2 - arrowLength * Math.cos(angle - Math.PI / 6);
  const y3 = arrow.y2 - arrowLength * Math.sin(angle - Math.PI / 6);

  const x4 = arrow.x2 - arrowLength * Math.cos(angle + Math.PI / 6);
  const y4 = arrow.y2 - arrowLength * Math.sin(angle + Math.PI / 6);
  return (
    <g
      className="cursor-move"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(shape.id);
      }}
      onMouseDown={(e) => onDrag(e, shape.id)}
    >
      <line
        x1={arrow.x1}
        y1={arrow.y1}
        x2={arrow.x2}
        y2={arrow.y2}
        stroke={shape.fillColor}
        strokeWidth={arrow.strokeWidth}
      />
      <path
        d={`M ${arrow.x2} ${arrow.y2} L ${x3} ${y3} M ${arrow.x2} ${arrow.y2} L ${x4} ${y4}`}
        stroke={shape.fillColor}
        strokeWidth={arrow.strokeWidth}
        fill="none"
      />
    </g>
  );
};

export const DiamondComponent = ({
  shape,
  isSelected,
  onSelect,
  onDrag,
}: ShapeProps) => {
  const diamond = shape as Diamond;
  const points = [
    `${shape.x}.${shape.y - diamond.height / 2}`,
    `${shape.x + diamond.width / 2}.${shape.y}`,
    `${shape.x}.${shape.y - diamond.height / 2}`,
    `${shape.x - diamond.width / 2}.${shape.y}`,
  ].join(" ");

  return (
    <polygon
      points={points}
      fill={shape.fillColor}
      stroke={shape.strokeColor}
      strokeWidth={shape.strokeWidth}
      className="cursor-move"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(shape.id);
      }}
      onMouseDown={(e) => onDrag(e, shape.id)}
    />
  );
};
