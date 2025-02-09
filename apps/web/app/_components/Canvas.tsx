"use client";

import React, { useEffect, useRef, useState } from "react";
import { Draw, Tool } from "../../lib/draw";
import Toolbar from "./Toolbar";
import { Minus, Plus } from "lucide-react";

function Canvas({ roomId, socket }: { roomId?: string; socket?: WebSocket }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draw, setDraw] = useState<Draw>();
  const [selectedTool, setSelectedTool] = useState<Tool | null>("rect");
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const [scale, setScale] = useState(draw?.transform.scale || 1);
  const [editingText, setEditingText] = useState<{
    id: string;
    x: number;
    y: number;
    content: string;
  } | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const drawInstance = new Draw(
        canvasRef.current,
        roomId!,
        socket!,
        (text) => {
          console.log("setEditingText called with:", text);
          setEditingText(text);
        }
      );
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

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingText) {
      const newText = {
        ...editingText,
        content: e.target.value,
      };
      console.log("Updating text to:", newText);
      setEditingText(newText);
      draw?.updateTextContent(editingText.id, e.target.value);
    }
  };

  const handleTextBlur = () => {
    console.log("handleTextBlur called");

    if (editingText) {
      draw?.finalizeTextEdit(editingText);
      setEditingText(null);
    }
  };

  console.log(selectedTool, "selectedTool in canvas.tsx");

  return (
    <>
      <canvas ref={canvasRef} className="w-full h-full bg-black" />
      <Toolbar selectedTool={selectedTool} setSelectedTool={setSelectedTool} />

      <div className="absolute top-4 right-4">
        <button
          className="text-sm px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
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
      {editingText && (
        <div
          className="absolute"
          style={{
            left: `${editingText.x}px`,
            top: `${editingText.y - 20}px`,
            zIndex: 1000,
          }}
        >
          <input
            autoFocus
            className="bg-transparent text-white border border-white px-2 py-1 outline-none"
            value={editingText.content}
            onChange={handleTextChange}
            onBlur={handleTextBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleTextBlur();
              }
            }}
          />
        </div>
      )}
      <div className="absolute bottom-5 right-5 text-white bg flex gap-x-4 bg-gray-800 p-2 rounded-lg shadow-lg">
        <button
          className=""
          onClick={() =>
            draw?.zoomOut((newScale: number) => setScale(newScale))
          }
        >
          <Minus className="w-4 h-4" />
        </button>
        <span>{draw?.transform.scale.toFixed(2)}</span>
        <button
          onClick={() => draw?.zoomIn((newScale: number) => setScale(newScale))}
        >
          <Plus className="w-5 h-4" />
        </button>
      </div>
      {/* <SettingsPanel handleShare={handleShare} /> */}
    </>
  );
}

export default Canvas;
