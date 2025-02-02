"use client";

import React, { useEffect, useRef, useState } from "react";
import { Draw, Tool } from "../../lib/draw";
import Toolbar from "./Toolbar";

function Canvas({ roomId, socket }: { roomId?: string; socket?: WebSocket }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draw, setDraw] = useState<Draw>();
  const [selectedTool, setSelectedTool] = useState<Tool | null>("rect");
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);

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
    draw?.setTool(selectedTool as Tool);
  }, [selectedTool, draw]);

  const handleLeaveRoom = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      console.log("Sending LEAVE_ROOM message...");
      socket.send(
        JSON.stringify({
          type: "LEAVE_ROOM",
          payload: { roomId },
        })
      );
      socket.close();
    }
    window.location.href = "/"; // Redirect to the home or dashboard
  };

  console.log(selectedTool, "selectedTool in canvas.tsx");

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
      <canvas ref={canvasRef} className="w-full h-full bg-black" />
      <Toolbar selectedTool={selectedTool} setSelectedTool={setSelectedTool} />

      <div className="absolute top-4 right-4">
        <button
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          onClick={() => setShowLeaveConfirmation(true)}
        >
          Leave Room
        </button>
      </div>

      {/* Leave Room Confirmation Modal */}
      {showLeaveConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className="mb-4 text-lg font-semibold">
              Are you sure you want to leave the room?
            </p>
            <div className="flex justify-end">
              <button
                className="px-4 py-2 mr-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setShowLeaveConfirmation(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={handleLeaveRoom}
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
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
