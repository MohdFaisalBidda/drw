"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { styles } from "../../styles/shared";
import { Paintbrush, Plus } from "lucide-react";
import Link from "next/link";
import { useUser } from "../../provider/UserProvider";
import { getToken } from "next-auth/jwt";

export default function JoinRoomPage({ allRooms }: { allRooms: any }) {
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { user } = useUser();

  const handleJoinRoom = async () => {
    if (!roomId.trim()) {
      setError("Please enter a valid Room ID");
      return;
    }

    try {
      // Get auth token from localStorage

      // Initialize WebSocket and join room
      // Redirect to canvas page
      router.push(`/draw/${roomId}`);
    } catch (err) {
      setError("Failed to join room. Please try again.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className={styles.container}>
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 mb-4">
            <Paintbrush className="w-8 h-8 text-white" />
          </div>
          <h1>Drawing Rooms</h1>
          <p className={styles.subheading}>Join a room or create your own</p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="roomId" className={styles.inputLabel}>
              Room ID
            </label>
            <input
              id="roomId"
              placeholder="Enter Room ID"
              value={roomId}
              className={styles.input}
              onChange={(e) => {
                setRoomId(e.target.value);
                setError("");
              }}
            />
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <button
            onClick={handleJoinRoom}
            className={`${styles.button.primary}`}
          >
            Join Room
          </button>
          {/* Create Room Button */}
          <div className="mb-8">
            <Link href="/create-room">
              <button
                className={`${styles.button.secondary} !bg-green-600 hover:!bg-green-700`}
              >
                <span className="flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" />
                  Create New Room
                </span>
              </button>
            </Link>
          </div>
        </div>

        {error && <div className={`${styles.error} mb-8`}>{error}</div>}

        {/* Available Rooms Section */}
      </div>
      <div className={styles.container}>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Available Rooms
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allRooms.map((room: any) => (
            <div
              key={room.id}
              className="p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition duration-200 cursor-pointer"
              onClick={() => {
                setRoomId(room.id);
                setError("");
              }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <p className="font-medium text-gray-800">{room.name}</p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {room.participants}{" "}
                    {room.participants === 1 ? "user" : "users"}
                  </span>
                </div>
                <p className="text-sm text-gray-500">ID: {room.id}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
