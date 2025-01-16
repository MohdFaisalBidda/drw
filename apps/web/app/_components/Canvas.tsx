"use client";

import React, { useEffect, useRef, useState } from "react";
import { useShapeStore } from "../../stores/shapeStore";
import { drawShape, isPointInShape } from "../../utils/canvas";
import { v4 as uuidv4 } from "uuid";
import { Shape, Text } from "../../@types/shapeStore";

function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null
  );

  const [drawPoints, setDrawPoints] = useState<
    {
      x: number;
      y: number;
    }[]
  >([]);
  const [editingText, setEditingText] = useState<{
    id: string;
    x: number;
    y: number;
    content: string;
  } | null>(null);

  const [transform, setTransform] = useState({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });
  const shapes = useShapeStore((state) => state.shapes);
  const selectedTool = useShapeStore((state) => state.selectedTool);
  const selectedShapeId = useShapeStore((state) => state.selectedShapeId);
  const addShape = useShapeStore((state) => state.addShape);
  const updateShape = useShapeStore((state) => state.updateShape);
  const deleteShape = useShapeStore((state) => state.deleteShape);
  const setSelectedShape = useShapeStore((state) => state.setSelectedShape);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();

      ctx.translate(transform.offsetX, transform.offsetY);
      ctx.strokeStyle = "#ddd";
      ctx.lineWidth = 1;

      ctx.restore();

      //drawing shapes here
      shapes.forEach((shape) => {
        drawShape(ctx, shape, transform);
        if (shape.id === selectedShapeId) {
          ctx.strokeStyle = "blue";
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);

          switch (shape.type) {
            case "rect":
              ctx.strokeRect(
                shape.x * transform.scale + transform.offsetX,
                shape.y * transform.scale + transform.offsetY,
                shape.width * transform.scale,
                shape.height * transform.scale
              );
              break;

            case "circle":
              ctx.beginPath();
              ctx.arc(
                shape.x * transform.scale + transform.offsetX,
                shape.y * transform.scale + transform.offsetY,
                shape.radius * transform.scale,
                0,
                2 * Math.PI
              );
              ctx.stroke();
              break;
          }
          ctx.setLineDash([]);
        }
      });
    };

    let animatedFrameId: number;
    const animate = () => {
      draw();
      animatedFrameId = requestAnimationFrame(animate);
    };
    animate();

    console.log("Shapes in state:", shapes);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animatedFrameId);
    };
  }, [shapes, selectedShapeId, transform]);

  const getCanvasPoint = (e: React.MouseEvent | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - transform.offsetX) / transform.scale,
      y: (e.clientY - rect.top - transform.offsetY) / transform.scale,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2 || e.ctrlKey) {
      setIsPanning(true);
      setStartPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    if (!selectedTool) return;

    const point = getCanvasPoint(e);
    setStartPoint(point);
    setDrawing(true);

    const baseShape = {
      id: uuidv4(),
      strokeColor: "#000000",
      strokeWidth: 1,
      fillColor: "transparent",
      x: point.x,
      y: point.y,
    };

    if (selectedTool === "draw") {
      setDrawPoints([point]);
      addShape({
        ...baseShape,
        type: "draw",
        points: [point],
      });
    } else if (selectedTool === "text") {
      const newShape: Text = {
        ...baseShape,
        type: "text",
        content: "Text",
        fontSize: 20,
      };
      addShape(newShape);
      setEditingText({
        id: newShape.id,
        x: point.x,
        y: point.y,
        content: newShape.content,
      });
    } else {
      switch (selectedTool) {
        case "rect":
          addShape({
            ...baseShape,
            type: "rect",
            width: 0,
            height: 0,
          });
          break;

        case "circle":
          addShape({
            ...baseShape,
            type: "circle",
            radius: 0,
          });
          break;

        case "line":
          addShape({
            ...baseShape,
            type: "line",
            x1: point.x,
            y1: point.y,
            x2: point.x,
            y2: point.y,
          });
          break;

        case "arrow":
          addShape({
            ...baseShape,
            type: "arrow",
            x1: point.x,
            y1: point.y,
            x2: point.x,
            y2: point.y,
          });
          break;

        case "diamond":
          addShape({
            ...baseShape,
            type: "diamond",
            width: 0,
            height: 0,
          });
          break;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && startPoint) {
      const dx = e.clientX - startPoint.x;
      const dy = e.clientY - startPoint.y;
      setTransform((prev) => ({
        ...prev,
        offsetX: prev.offsetX + dx,
        offsetY: prev.offsetY + dy,
      }));
      setStartPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    if (!isDrawing || !startPoint || !selectedTool) return;

    const currentPoint = getCanvasPoint(e);
    const lastShape = shapes[shapes.length - 1]!;

    if (selectedTool === "draw") {
      const newPoints = [...drawPoints, currentPoint];
      setDrawPoints(newPoints);
      updateShape(lastShape?.id, { points: newPoints });
      return;
    }

    if (selectedTool === "eraser") {
      shapes.forEach((shape) => {
        if (!isPointInShape(currentPoint.x, currentPoint.y, shape, transform)) {
          deleteShape(shape.id);
        }
      });
      return;
    }

    switch (selectedTool) {
      case "rect":
      case "diamond":
        updateShape(lastShape.id, {
          width: currentPoint.x - startPoint.x,
          height: currentPoint.y - startPoint.y,
        });
        break;

      case "circle":
        const radius = Math.sqrt(
          Math.pow(currentPoint.x - startPoint.x, 2) +
            Math.pow(currentPoint.y - startPoint.y, 2)
        );
        updateShape(lastShape.id, { radius });
        break;

      case "line":
      case "arrow":
        updateShape(lastShape.id, { x2: currentPoint.x, y2: currentPoint.y });
        break;
    }
  };

  const handleMouseUp = () => {
    setDrawing(false);
    setIsPanning(false);
    setStartPoint(null);
    setDrawPoints([]);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey) {
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      setTransform((prev) => ({
        ...prev,
        scale: prev.scale * zoomFactor,
      }));
    } else {
      setTransform((prev) => ({
        ...prev,
        offsetX: prev.offsetX - e.deltaX,
        offsetY: prev.offsetY - e.deltaY,
      }));
    }
  };

  return (
    <>
      {/* Add Tailwind css*/}
      <canvas
        ref={canvasRef}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        className="w-full h-full"
        onContextMenu={(e) => e.preventDefault()}
      />
    </>
  );
}

export default Canvas;
