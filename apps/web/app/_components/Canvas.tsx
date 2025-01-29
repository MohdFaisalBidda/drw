"use client";

import React, { useEffect, useRef, useState } from "react";
import { useShapeStore } from "../../stores/shapeStore";
import { drawShape, isPointInShape } from "../../utils/canvas";
import { v4 as uuidv4 } from "uuid";
import { Shape, Text } from "../../@types/shapeStore";
import SettingsPanel from "./SettingsPanel";
import axios from "axios";
import { Draw, Tool } from "../../lib/draw";
import Toolbar from "./Toolbar";

function Canvas({ roomId, socket }: { roomId?: string; socket?: WebSocket }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draw, setDraw] = useState<Draw>();
  const [selectedTool, setSelectedTool] = useState<Tool>("rect");

  useEffect(() => {
    if (canvasRef.current) {
      const drawInstance = new Draw(canvasRef.current, roomId!, socket!);
      setDraw(drawInstance);

      return () => {
        drawInstance.destroy();
      };
    }
  }, [canvasRef, roomId, socket]);

  useEffect(() => {
    draw?.setTool(selectedTool);
  }, [selectedTool, draw]);

  console.log(selectedTool, "selectedTool in canvas.tsx");
  
  // const canvasRef = useRef<HTMLCanvasElement>(null);
  // const [isDrawing, setDrawing] = useState(false);
  // const [isPanning, setIsPanning] = useState(false);
  // const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
  //   null
  // );

  // const [drawPoints, setDrawPoints] = useState<
  //   {
  //     x: number;
  //     y: number;
  //   }[]
  // >([]);
  // const [editingText, setEditingText] = useState<{
  //   id: string;
  //   x: number;
  //   y: number;
  //   content: string;
  // } | null>(null);

  // const [transform, setTransform] = useState({
  //   scale: 1,
  //   offsetX: 0,
  //   offsetY: 0,
  // });
  // const [showAuthModal, setShowAuthModal] = useState(false);

  // const isAuthenticated = useShapeStore((state) => state.isAuthenticated);
  // const shareRoom = useShapeStore((state) => state.shareRoom);
  // const shapes = useShapeStore((state) => state.shapes);
  // const setShapes = useShapeStore((state) => state.setShapes);
  // const selectedTool = useShapeStore((state) => state.selectedTool);
  // const selectedShapeId = useShapeStore((state) => state.selectedShapeId);
  // const addShape = useShapeStore((state) => state.addShape);
  // const updateShape = useShapeStore((state) => state.updateShape);
  // const deleteShape = useShapeStore((state) => state.deleteShape);
  // const setSelectedShape = useShapeStore((state) => state.setSelectedShape);

  // const handleShare = async () => {
  //   try {
  //     if (!isAuthenticated) {
  //       setShowAuthModal(true);
  //       return;
  //     }

  //     const roomId = await shareRoom({ slug: "test", adminId: "1" });
  //     // Show success message with shareable link
  //     console.log(
  //       `Canvas shared! Share this link: ${window.location.origin}/canvas/${roomId}`
  //     );
  //   } catch (error) {
  //     console.log("Failed to share canvas");
  //   }
  // };

  // useEffect(() => {
  //   async function fetchExistingShapes() {
  //     if (!roomId) return;
  //     try {
  //       const res = await axios.get(
  //         `http://localhost:8000/api/room/${roomId}/shapes`,
  //         {
  //           headers: {
  //             Authorization: `Bearer ${localStorage.getItem("token")}`,
  //           },
  //         }
  //       );
  //       const data = await res.data;
  //       const shapes = data.shapes
  //         .map((x: { message: string }) => {
  //           try {
  //             const messageData = JSON.parse(x.message);
  //             return messageData.shape;
  //           } catch (error) {
  //             console.error("Error parsing shape:", error);
  //             return null;
  //           }
  //         })
  //         .filter(Boolean);
  //       console.log(shapes, "shapes in canvas.tsx");

  //       setShapes(shapes);
  //     } catch (error) {
  //       console.error("Failed to fetch existing shapes:", error);
  //     }
  //   }

  //   fetchExistingShapes();
  // }, [roomId]);

  // // WebSocket message handling
  // useEffect(() => {
  //   if (!socket) return;

  //   const handleSocketMessage = (event: MessageEvent) => {
  //     const message = JSON.parse(event.data);

  //     if (message.type === "NEW_MESSAGE") {
  //       try {
  //         const parsedShape = JSON.parse(message.message);
  //         console.log(parsedShape, "parsedShape in canvas.tsx");

  //         setShapes([...shapes, parsedShape.shape]);
  //       } catch (error) {
  //         console.error("Error parsing socket message:", error);
  //       }
  //     }
  //   };

  //   socket.addEventListener("message", handleSocketMessage);
  //   return () => {
  //     socket.removeEventListener("message", handleSocketMessage);
  //   };
  // }, [socket]);

  // useEffect(() => {
  //   const canvas = canvasRef.current;
  //   if (!canvas) return;

  //   const ctx = canvas.getContext("2d");
  //   if (!ctx) return;

  //   const resizeCanvas = () => {
  //     canvas.width = window.innerWidth;
  //     canvas.height = window.innerHeight;
  //   };

  //   resizeCanvas();
  //   window.addEventListener("resize", resizeCanvas);

  //   const draw = () => {
  //     ctx.clearRect(0, 0, canvas.width, canvas.height);
  //     ctx.save();

  //     ctx.translate(transform.offsetX, transform.offsetY);
  //     ctx.fillStyle = "#ffffff";
  //     ctx.strokeStyle = "#ddd";
  //     ctx.lineWidth = 1;

  //     ctx.restore();

  //     shapes.forEach((shape) => {
  //       drawShape(ctx, shape, transform);
  //       if (shape.id === selectedShapeId) {
  //         ctx.strokeStyle = "blue";
  //         ctx.lineWidth = 2;
  //         ctx.fillStyle = "blue";
  //         ctx.setLineDash([5, 5]);

  //         switch (shape.type) {
  //           case "rect":
  //             ctx.strokeRect(
  //               shape.x * transform.scale + transform.offsetX,
  //               shape.y * transform.scale + transform.offsetY,
  //               shape.details?.width * transform.scale,
  //               shape.details?.height * transform.scale
  //             );
  //             break;

  //           case "circle":
  //             ctx.beginPath();
  //             ctx.arc(
  //               shape.x * transform.scale + transform.offsetX,
  //               shape.y * transform.scale + transform.offsetY,
  //               shape.details?.radius * transform.scale,
  //               0,
  //               2 * Math.PI
  //             );
  //             ctx.stroke();
  //             break;
  //         }
  //         ctx.setLineDash([]);
  //       }
  //     });
  //   };

  //   let animatedFrameId: number;
  //   const animate = () => {
  //     draw();
  //     animatedFrameId = requestAnimationFrame(animate);
  //   };
  //   animate();

  //   console.log("Shapes in state:", shapes);

  //   return () => {
  //     window.removeEventListener("resize", resizeCanvas);
  //     cancelAnimationFrame(animatedFrameId);
  //   };
  // }, [shapes, selectedShapeId, transform, socket]);

  // const getCanvasPoint = (e: React.MouseEvent | MouseEvent) => {
  //   const canvas = canvasRef.current;
  //   if (!canvas) return { x: 0, y: 0 };

  //   const rect = canvas.getBoundingClientRect();
  //   return {
  //     x: (e.clientX - rect.left - transform.offsetX) / transform.scale,
  //     y: (e.clientY - rect.top - transform.offsetY) / transform.scale,
  //   };
  // };

  // const handleMouseDown = (e: React.MouseEvent) => {
  //   let newShape: Shape | null = null;
  //   if (e.button === 1 || e.button === 2 || e.ctrlKey) {
  //     setIsPanning(true);
  //     setStartPoint({ x: e.clientX, y: e.clientY });
  //     return;
  //   }

  //   if (!selectedTool) return;

  //   const point = getCanvasPoint(e);

  //   const clickedShape = shapes.find((shape) =>
  //     isPointInShape(point.x, point.y, shape, transform)
  //   );
  //   if (clickedShape) {
  //     setSelectedShape(clickedShape.id);
  //     return;
  //   }
  //   setStartPoint(point);
  //   setDrawing(true);

  //   const baseShape = {
  //     id: uuidv4(),
  //     strokeColor: "#ffffff",
  //     strokeWidth: 1,
  //     fillColor: "transparent",
  //     x: point.x,
  //     y: point.y,
  //   };

  //   if (selectedTool === "draw") {
  //     newShape = {
  //       ...baseShape,
  //       type: "draw",
  //       details: {
  //         points: [point],
  //       },
  //     };
  //     setDrawPoints([point]);
  //     addShape(newShape);
  //   } else if (selectedTool === "text") {
  //     newShape = {
  //       ...baseShape,
  //       type: "text",
  //       details: {
  //         fontSize: 20,
  //         content: "Text",
  //       },
  //     };
  //     addShape(newShape);
  //     setEditingText({
  //       id: newShape.id,
  //       x: point.x,
  //       y: point.y,
  //       content: newShape.details,
  //     });
  //   } else {
  //     switch (selectedTool) {
  //       case "rect":
  //         newShape = {
  //           ...baseShape,
  //           type: "rect",
  //           details: {
  //             width: 10,
  //             height: 10,
  //           },
  //         };
  //         break;

  //       case "circle":
  //         newShape = {
  //           ...baseShape,
  //           type: "circle",
  //           details: {
  //             radius: 0,
  //           },
  //         };
  //         break;

  //       case "line":
  //         newShape = {
  //           ...baseShape,
  //           type: "line",
  //           details: {
  //             x1: point.x,
  //             y1: point.y,
  //             x2: point.x,
  //             y2: point.y,
  //           },
  //         };
  //         break;

  //       case "arrow":
  //         newShape = {
  //           ...baseShape,
  //           type: "arrow",
  //           details: {
  //             x1: point.x,
  //             y1: point.y,
  //             x2: point.x,
  //             y2: point.y,
  //           },
  //         };
  //         break;

  //       case "diamond":
  //         newShape = {
  //           ...baseShape,
  //           type: "diamond",
  //           details: {
  //             width: 10,
  //             height: 10,
  //           },
  //         };
  //         break;
  //     }
  //     if (newShape) {
  //       console.log("adding shape to db", newShape);

  //       addShape(newShape);
  //     }
  //   }

  //   // Send the new shape to other clients
  //   if (socket && newShape) {
  //     console.log("runned");

  //     socket.send(
  //       JSON.stringify({
  //         type: "NEW_MESSAGE",
  //         payload: {
  //           message: JSON.stringify(newShape),
  //           roomId,
  //         },
  //       })
  //     );
  //   }
  // };

  // const handleMouseMove = (e: React.MouseEvent) => {
  //   if (isPanning && startPoint) {
  //     const dx = e.clientX - startPoint.x;
  //     const dy = e.clientY - startPoint.y;
  //     setTransform((prev) => ({
  //       ...prev,
  //       offsetX: prev.offsetX + dx,
  //       offsetY: prev.offsetY + dy,
  //     }));
  //     setStartPoint({ x: e.clientX, y: e.clientY });
  //     return;
  //   }

  //   if (!isDrawing || !startPoint || !selectedTool) return;

  //   const currentPoint = getCanvasPoint(e);
  //   const lastShape = shapes[shapes.length - 1]!;
  //   let updates = {};

  //   if (selectedTool === "draw") {
  //     const newPoints = [...drawPoints, currentPoint];
  //     setDrawPoints(newPoints);
  //     updates = { points: newPoints };
  //     updateShape(lastShape.id, updates);
  //   } else if (selectedTool === "eraser") {
  //     shapes.forEach((shape) => {
  //       if (isPointInShape(currentPoint.x, currentPoint.y, shape, transform)) {
  //         deleteShape(shape.id);
  //         // Notify other clients about shape deletion
  //         socket?.send(
  //           JSON.stringify({
  //             type: "DELETE_SHAPE",
  //             payload: {
  //               shapeId: shape.id,
  //               roomId,
  //             },
  //           })
  //         );
  //       }
  //     });
  //     return;
  //   } else {
  //     switch (selectedTool) {
  //       case "rect":
  //       case "diamond":
  //         updates = {
  //           width: currentPoint.x - startPoint.x,
  //           height: currentPoint.y - startPoint.y,
  //         };
  //         break;

  //       case "circle":
  //         const radius = Math.sqrt(
  //           Math.pow(currentPoint.x - startPoint.x, 2) +
  //             Math.pow(currentPoint.y - startPoint.y, 2)
  //         );
  //         updates = { radius };
  //         break;

  //       case "line":
  //       case "arrow":
  //         updates = {
  //           x2: currentPoint.x,
  //           y2: currentPoint.y,
  //         };
  //         break;
  //     }
  //     updateShape(lastShape.id, updates);
  //   }

  //   // Send shape updates to other clients
  //   // if (socket && Object.keys(updates).length > 0) {
  //   //   socket.send(
  //   //     JSON.stringify({
  //   //       type: "UPDATE_SHAPE",
  //   //       payload: {
  //   //         shape: { ...updates, id: lastShape.id, type: lastShape.type },
  //   //         roomId: roomId,
  //   //       },
  //   //     })
  //   //   );
  //   // }
  // };

  // const handleMouseUp = () => {
  //   setDrawing(false);
  //   setIsPanning(false);
  //   setStartPoint(null);
  //   setDrawPoints([]);
  // };

  // const handleWheel = (e: React.WheelEvent) => {
  //   e.preventDefault();
  //   if (e.ctrlKey) {
  //     const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
  //     setTransform((prev) => ({
  //       ...prev,
  //       scale: prev.scale * zoomFactor,
  //     }));
  //   } else {
  //     setTransform((prev) => ({
  //       ...prev,
  //       offsetX: prev.offsetX - e.deltaX,
  //       offsetY: prev.offsetY - e.deltaY,
  //     }));
  //   }
  // };

  // const handleDoubleClick = (e: React.MouseEvent) => {
  //   const point = getCanvasPoint(e);
  //   const clickedShape = shapes.find((shape) =>
  //     isPointInShape(point.x, point.y, shape, transform)
  //   );

  //   if (clickedShape?.type === "text") {
  //     setEditingText({
  //       id: clickedShape.id,
  //       x: clickedShape.x,
  //       y: clickedShape.y,
  //       content: clickedShape.content,
  //     });
  //   }
  // };

  return (
    <>
      {/* Add Tailwind css*/}

      {/* {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Sign in to Share</h2>
            <p className="mb-4">
              Please sign in to share your canvas with others.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => (window.location.href = "/auth/signin")}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                Sign In
              </button>
              <button
                onClick={() => setShowAuthModal(false)}
                className="px-4 py-2 border border-gray-300 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )} */}
      <canvas ref={canvasRef} className="w-full h-full bg-black" />
      <Toolbar selectedTool={selectedTool} setSelectedTool={setSelectedTool} />

      {/* {editingText && (
        <div
          className="absolute"
          style={{
            left: editingText.x * transform.scale + transform.offsetX,
            top: editingText.y * transform.scale + transform.offsetY,
          }}
        >
          <input
            autoFocus
            value={editingText?.content}
            onChange={(e) => {
              setEditingText({ ...editingText, content: e.target.value });
              updateShape(editingText?.id, { content: e.target.value });
            }}
            onBlur={() => setEditingText(null)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setEditingText(null);
              }
            }}
          />
        </div>
      )} */}

      {/* <SettingsPanel handleShare={handleShare} /> */}
    </>
  );
}

export default Canvas;
