"use client";

import React, { useEffect, useRef, useState } from "react";
import { Draw, Shape, Tool } from "../../lib/draw";
import Toolbar from "./Toolbar";
import { Loader2, Minus, Plus, PowerOff, Sparkles } from "lucide-react";

function Canvas({ roomId, socket }: { roomId?: string; socket?: WebSocket }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draw, setDraw] = useState<Draw>();
  const [selectedTool, setSelectedTool] = useState<Tool | null>("rect");
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [scale, setScale] = useState(draw?.transform.scale || 1);
  const [editingText, setEditingText] = useState<{
    id: string;
    x: number;
    y: number;
    content: string;
  } | null>(null);
  const [prompt, setPrompt] = useState("");

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

  const handleGenerateShape = async () => {
    try {
      setIsGenerating(true);
      const response = await fetch("/api/generate-shape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const shapeData = await response.json();

      console.log(shapeData, shapeData.shapes, "shapes here");

      if (!shapeData.shapes || !Array.isArray(shapeData.shapes)) {
        console.error("Invalid shape data received:", shapeData);
        return;
      }

      // Send each shape separately via WebSocket
      shapeData.shapes.forEach((shape: Shape) => {
        console.log(shape, "shape in handleGenerateShape");
        draw?.addGeneratedShapes(shape);
        socket?.send(
          JSON.stringify({
            type: "NEW_MESSAGE",
            payload: {
              roomId: roomId,
              message: JSON.stringify(shape), // Send one shape at a time
            },
          })
        );
      });
    } catch (error) {
      console.log(error);
    } finally {
      setIsGenerating(false);
    }
  };

  console.log(selectedTool, "selectedTool in canvas.tsx");

  return (
    <>
      <canvas ref={canvasRef} className="w-full h-full bg-black" />
      <Toolbar selectedTool={selectedTool} setSelectedTool={setSelectedTool} />

      <div className="absolute top-4 right-4 flex items-center gap-4">
        <div className="bg-black/30 backdrop-blur-sm rounded-lg border border-white/10 p-3 shadow-lg">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your shape..."
              className="min-w-[200px] md:min-w-[300px] px-4 py-2 rounded-lg 
                       bg-white/5 border border-white/10 
                       text-white placeholder-white/50
                       focus:outline-none focus:ring-2 focus:ring-white/25
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200"
              disabled={isGenerating}
            />
            <button
              onClick={handleGenerateShape}
              disabled={isGenerating || !prompt.trim()}
              className="flex items-center justify-center gap-2 
                       px-4 py-2 rounded-lg
                       bg-white/10 hover:bg-white/20 
                       disabled:bg-white/5 disabled:cursor-not-allowed
                       border border-white/10
                       text-white font-medium
                       transition-all duration-200
                       focus:outline-none focus:ring-2 focus:ring-white/25"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate</span>
                </>
              )}
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowLeaveConfirmation(true)}
          className="px-4 py-2 rounded-lg
                   bg-red-500/80 hover:bg-red-500 
                   text-white text-sm font-medium
                   border border-red-400/30
                   transition-colors duration-200"
        >
          <PowerOff className="w-4 h-4" />
        </button>
      </div>

      {/* Leave Room Confirmation Modal */}
      {showLeaveConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div className="bg-zinc-900 border border-white/10 p-6 rounded-lg shadow-xl">
            <p className="mb-4 text-lg font-semibold text-white">
              Are you sure you want to leave the room?
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg
                      bg-white/10 hover:bg-white/20
                      text-white transition-colors"
                onClick={() => setShowLeaveConfirmation(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg
                      bg-red-500/80 hover:bg-red-500
                      text-white transition-colors"
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
      <div
        className="absolute bottom-5 right-5 flex items-center gap-2 
                    bg-black/30 backdrop-blur-sm rounded-lg 
                    border border-white/10 p-2 text-white"
      >
        <button
          onClick={() =>
            draw?.zoomOut((newScale: number) => setScale(newScale))
          }
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="min-w-[40px] text-center">
          {(scale || 1).toFixed(2)}
        </span>
        <button
          onClick={() => draw?.zoomIn((newScale: number) => setScale(newScale))}
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {/* <SettingsPanel handleShare={handleShare} /> */}
    </>
  );
}

export default Canvas;
