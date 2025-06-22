// components/RoomCanvas.tsx
"use client";

import React, { useEffect, useState } from "react";
import Canvas from "./Canvas";
import { useRouter } from "next/navigation";
import { useWebSocket } from "@/hooks/useWebSocket";
import { ArrowRight, Home, Search, Plus, AlertTriangle } from "lucide-react"; 
import Link from "next/link";
import { checkRoomExists } from "@/actions";

function RoomCanvas({ roomId }: { roomId: string }) {
  const router = useRouter();
  const { isConnected, error, addListener, socket } = useWebSocket(roomId);
  const [roomExists, setRoomExists] = useState<boolean | null>(null);
  const [connectionDetails, setConnectionDetails] = useState("");
  const [isCheckingRoom, setIsCheckingRoom] = useState(true);

  useEffect(() => {
    console.log(roomId, "roomId in RoomCanvas");

    const verifyRoom = async () => {
      try {
        setIsCheckingRoom(true);
        const exists = await checkRoomExists(roomId);
        setRoomExists(exists);
        console.log(exists, "exists in verifyRoom");

        if (!exists) {
          return;
        }
      } catch (err) {
        console.error("Error checking room existence:", err);
        setRoomExists(false);
      } finally {
        setIsCheckingRoom(false);
      }
    };

    verifyRoom();

    const cleanupRoomDeleted = addListener(
      "ROOM_DELETED",
      (payload: { roomId: string }) => {
        if (payload.roomId === roomId) {
          setRoomExists(false);
        }
      }
    );

    return () => {
      cleanupRoomDeleted();
    };
  }, [roomId]);

 if (isCheckingRoom) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#202025" }}
      >
        <div className="fixed inset-0 z-0">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 w-full max-w-md mx-auto px-6 text-center">
          <div className="animate-pulse flex justify-center mb-6">
            <div className="h-20 w-20 rounded-2xl bg-purple-600/20 flex items-center justify-center">
              <ArrowRight className="h-10 w-10 text-purple-600 animate-bounce" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Checking Room...</h2>
          <p className="text-gray-400">Verifying room existence</p>
        </div>
      </div>
    );
  }

  if (roomExists === false || error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#202025" }}
      >
        {/* Background Elements */}
        <div className="fixed inset-0 z-0">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 w-full max-w-md mx-auto px-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-600/20 rounded-2xl mb-6 transform hover:scale-105 transition-transform duration-200">
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>

            {/* Content */}
            <div className="space-y-4 mb-8">
              <h1 className="text-2xl font-bold text-white">
                {error ? "Connection Error" : "Room Not Found"}
              </h1>
              <p className="text-gray-400 leading-relaxed">
                {error
                  ? "Couldn't establish connection to the room."
                  : `The room may doesn't exist or may have been deleted.`}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-y-4">
              <Link href="/create-room" passHref>
                <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 transform hover:scale-[1.02] active:scale-[0.98]">
                  <Plus className="w-4 h-4" />
                  <span>Create New Room</span>
                </button>
              </Link>

              <Link href="/join" passHref>
                <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 transform hover:scale-[1.02] active:scale-[0.98]">
                  <Search className="w-4 h-4" />
                  <span>Browse Available Rooms</span>
                </button>
              </Link>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <button
                onClick={() => router.push("/")}
                className="text-gray-400 hover:text-white text-sm transition-colors duration-200 flex items-center justify-center space-x-1"
              >
                <Home className="w-4 h-4" />
                <span>Back to home</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#202025" }}
      >
        <div className="fixed inset-0 z-0">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 w-full max-w-md mx-auto px-6 text-center">
          <div className="animate-pulse flex justify-center mb-6">
            <div className="h-20 w-20 rounded-2xl bg-blue-600/20 flex items-center justify-center">
              <ArrowRight className="h-10 w-10 text-blue-400 animate-bounce" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Connecting to Room...
          </h2>
          <p className="text-gray-400 mb-6">
            Establishing connection to the canvas server
          </p>
          <div className="w-full bg-white/5 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full animate-progress"
              style={{ width: "60%" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return <Canvas roomId={roomId} socket={socket as WebSocket} />;
}

export default RoomCanvas;
