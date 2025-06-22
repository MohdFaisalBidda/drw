"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Paintbrush, PenTool, Plus, Users } from "lucide-react";
import { useUser } from "../../provider/UserProvider";
import { useSession } from "next-auth/react";
import { Room } from "@prisma/client";
import { getAllRooms } from "@/actions";

export default function JoinRoomPage({ allRooms }: { allRooms: Room[] }) {
  const [rooms, setRooms] = useState<Room[]>(allRooms);
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const { user } = useUser();

  useEffect(() => {
    console.log(session, "session in roomCanvas");
    localStorage.setItem("token", session?.accessToken as string);
  }, [session]);

  useEffect(() => {
    localStorage.setItem("token", session?.accessToken as string);

    const fetchRooms = async () => {
      try {
        const response = await getAllRooms();
        if (response.success && response.data?.rooms) {
          setRooms(response.data.rooms);
        }
      } catch (error) {
        console.error("Error fetching rooms:", error);
      }
    };

    // Initial fetch
    fetchRooms();

    // Set up interval for pooling (every 5 seconds)
    const intervalId = setInterval(fetchRooms, 3000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [session]);

  const handleJoinRoom = async () => {
    if (!roomId.trim()) {
      setError("Please enter a valid Room ID");
      return;
    }

    if (!user) {
      setError("Please sign in to join a room");
      return;
    }

    try {
      setIsLoading(true);
      router.push(`/draw/${roomId}`);
    } catch (err) {
      setError("Failed to join room. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen py-12 pt-28"
      style={{ backgroundColor: "#202025" }}
    >
      {/* Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-20 right-20 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Drawing Rooms
          </h1>
          <p className="text-lg text-gray-400">
            Join a room or create your own collaborative workspace
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Join Room Section */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <h2 className="text-xl font-semibold text-white mb-6">
              Join Existing Room
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="roomId"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Room ID
                </label>
                <input
                  id="roomId"
                  type="text"
                  value={roomId}
                  onChange={(e) => {
                    setRoomId(e.target.value);
                    setError("");
                  }}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter Room ID"
                />
              </div>

              {error && (
                <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg p-3">
                  {error}
                </div>
              )}

              <button
                onClick={handleJoinRoom}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Join Room</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Create Room Section */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <h2 className="text-xl font-semibold text-white mb-6">
              Create New Room
            </h2>

            <div className="space-y-4">
              <p className="text-gray-400 text-sm">
                Start a new collaborative session and invite your team members
                to join.
              </p>

              <button
                onClick={() => router.push("/create-room")}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-5 h-5" />
                <span>Create New Room</span>
              </button>
            </div>
          </div>
        </div>

        {/* Available Rooms */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6">
            Available Rooms
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room: any, index: number) => (
              <div
                key={room.id}
                onClick={() => setRoomId(room.id)}
                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-purple-500/30 transition-all duration-200 cursor-pointer transform hover:scale-[1.02] group"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: "fadeInUp 0.6s ease-out forwards",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors duration-200">
                      {room.slug}
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-3">ID: {room.id}</p>

                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>Active collaboration</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center">
          {rooms.length === 0 && (
            <button className="text-gray-400 hover:text-white transition-colors duration-200">
              Be the first to Create a Room
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
