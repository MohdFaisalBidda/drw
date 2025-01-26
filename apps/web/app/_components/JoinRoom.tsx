"use client";

import { useState, useEffect } from "react";
import { useShapeStore } from "../../stores/shapeStore";
import { useRouter } from "next/navigation";

export default function JoinRoomPage() {
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  // Zustand store methods
  const initializeWebSocket = useShapeStore(
    (state) => state.initializeWebSocket
  );
  const isAuthenticated = useShapeStore((state) => state.isAuthenticated);
  const setIsAuthenticated = useShapeStore((state) => state.setIsAuthenticated);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleJoinRoom = async () => {
    if (!roomId.trim()) {
      setError("Please enter a valid Room ID");
      return;
    }

    if (!isAuthenticated) {
      setError("Please sign in to join a room");
      return;
    }

    try {
      // Get auth token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token not found");
        return;
      }

      // Initialize WebSocket and join room
      initializeWebSocket(token, roomId);

      // Redirect to canvas page
      router.push(`/draw/${roomId}`);
    } catch (err) {
      setError("Failed to join room. Please try again.");
      console.error(err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md">
        <div>
          <h1>Join Drawing Room</h1>
        </div>
        <div>
          <div className="space-y-4">
            <div>
              <label htmlFor="roomId">Room ID</label>
              <input
                id="roomId"
                placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => {
                  setRoomId(e.target.value);
                  setError("");
                }}
              />
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <button onClick={handleJoinRoom} className="w-full">
              Join Room
            </button>

            <div className="text-center text-sm text-gray-600">
              Don't have a Room ID?{" "}
              <a href="/create-room" className="text-blue-500 hover:underline">
                Create a New Room
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
