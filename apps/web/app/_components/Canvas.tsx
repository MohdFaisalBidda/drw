"use client";

import React, { useEffect, useRef, useState } from "react";
import { Draw, Shape, Tool } from "../../lib/draw";
import Toolbar from "./Toolbar";
import {
  Camera,
  ChevronDown,
  ChevronUp,
  LogOut,
  Minus,
  Plus,
  Share2,
  Sparkles,
} from "lucide-react";
import { PropertiesPanel } from "./PropertiesPanel";
import { motion } from "framer-motion";
import { saveShapesToDB } from "@/lib/indexDB";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface CanvasProps {
  roomId?: string;
  socket?: WebSocket;
  allowAnonymousDrawing?: boolean;
}

function Canvas({
  roomId,
  socket,
  allowAnonymousDrawing = false,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { data: session } = useSession();
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
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const router = useRouter();

  // In your Canvas component
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (draw) {
        saveShapesToDB(draw.shapes);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Clean up any remaining remote cursors when component unmounts
    };
  }, [draw]);

  useEffect(() => {
    if (canvasRef.current) {
      const drawInstance = new Draw(
        canvasRef.current,
        roomId!,
        socket!,
        allowAnonymousDrawing,
        session?.user?.id
      );
      setDraw(drawInstance);

      return () => {
        drawInstance.destroy();
        Object.values(drawInstance.remoteCursors).forEach((cursor) => {
          if (cursor.parentNode === document.body) {
            document.body.removeChild(cursor);
          }
        });
        // Clean up presence UI
        const presenceUI = document.getElementById("presence-ui-container");
        if (presenceUI) {
          presenceUI.remove();
        }
      };
    }
  }, [canvasRef, roomId, socket, session]);

  useEffect(() => {
    draw?.setTool(selectedTool as Tool);
  }, [selectedTool, draw]);

  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  const handleLeaveRoom = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "LEAVE_ROOM",
          payload: { roomId },
        })
      );
      socket.close();
    }
    router.push("/join");
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingText) {
      const newText = {
        ...editingText,
        content: e.target.value,
      };
      setEditingText(newText);
      draw?.updateTextContent(editingText.id, e.target.value);
    }
  };

  const handleTextBlur = () => {
    if (editingText) {
      draw?.finalizeTextEdit(editingText);
      setEditingText(null);
    }
  };

  const handleUpdateShape = (updatedShape: Shape) => {
    if (draw) {
      draw.updateShape(updatedShape);
    }
  };

  const handleScreenshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "canvas-screenshot.png";
    link.href = dataUrl;
    link.click();
  };

  return (
    <>
      <canvas ref={canvasRef} className="w-full h-full bg-black" />

      {/* Toolbar at bottom center */}
      <Toolbar
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}
        handleScreenshot={handleScreenshot}
      />

      {/* Properties panel and toggle button at bottom right */}
      <div className="flex items-end gap-2">
        {/* Properties Panel */}
        {/* Toggle Button */}
        <button
          onClick={togglePanel}
          className="md:hidden fixed bottom-20 right-5 md:bottom-6 bg-darkbg lg:right-[42rem] outline-none border-none p-2 lg:p-4 hover:bg-gray-700 rounded-lg"
        >
          <motion.div transition={{ duration: 0.2 }}>
            {isPanelOpen ? (
              <ChevronDown className="w-4 h-4 text-white" />
            ) : (
              <ChevronUp className="w-4 h-4 text-white" />
            )}
          </motion.div>
        </button>
        {isPanelOpen && (
          <div className="mb-2 absolute md:right-4 md:top-16 right-4 bottom-32"> 
            <PropertiesPanel
              onUpdateShape={handleUpdateShape}
              draw={draw}
              selectedTool={selectedTool}
            />
          </div>
        )}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-20 left-4 md:bottom-2 md:left-2 flex items-center gap-2 bg-darkbg backdrop-blur-sm rounded-lg border border-darkbg p-2 text-white"> 
        <button
          onClick={() =>
            draw?.zoomOut((newScale: number) => setScale(newScale))
          }
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="min-w-[40px] text-center text-xs">
          {(scale || 1).toFixed(2)}x
        </span>
        <button
          onClick={() => draw?.zoomIn((newScale: number) => setScale(newScale))}
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      <Share2 className="absolute top-4 left-4 lg:right-32 w-4 h-4 text-white hover:scale-110 transition-all ease-in-out duration-200 cursor-pointer" />
      {/* Leave button */}
      {session?.user ? (
        <button
          onClick={() => setShowLeaveConfirmation(true)}
          className="fixed top-2 right-2 px-4 py-2 rounded-lg bg-red-500/50 hover:bg-red-500 text-white text-xs font-medium border border-red-400/30 transition-colors duration-200 flex items-center gap-x-2"
        >
          <LogOut className="w-3 h-3 lg:w-4 lg:h-4" />
          Leave
        </button>
      ) : (
        <button
          onClick={() => router.push("/sign-in")}
          className="fixed top-2 right-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500/80 text-white text-xs font-medium border border-none transition-colors duration-200 flex gap-x-2"
        >
          Sign in
        </button>
      )}

      {/* Leave confirmation modal */}
      {showLeaveConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div className="bg-zinc-900 border border-white/10 p-6 rounded-lg shadow-xl">
            <p className="mb-4 text-lg font-semibold text-white">
              Are you sure you want to leave the room?
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                onClick={() => setShowLeaveConfirmation(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-red-500/80 hover:bg-red-500 text-white transition-colors"
                onClick={handleLeaveRoom}
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Text editing input */}
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

      {/* Iframe rendering */}
      {draw?.shapes.map((shape) => {
        if (shape.type === "iframe" && shape.url) {
          return (
            <iframe
              key={shape.id}
              src={shape.url}
              className="absolute"
              style={{
                left: shape.x * scale + (draw.transform.offsetX || 0),
                top: shape.y * scale + (draw.transform.offsetY || 0),
                width: (shape.width || 0) * scale,
                height: (shape.height || 0) * scale,
                pointerEvents: selectedTool === "iframe" ? "none" : "auto",
              }}
            />
          );
        }
        return null;
      })}
    </>
  );
}

export default Canvas;
