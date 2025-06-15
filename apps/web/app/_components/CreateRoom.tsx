"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { styles } from "../../styles/shared";
import {
  PaintbrushIcon as PaintBrush,
  Settings,
  Users,
  Lock,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { createRoom } from "../../actions";
import { useUser } from "../../provider/UserProvider";
import axios from "axios";

export default function CreateRoomPage() {
  const [roomName, setRoomName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    console.log(user, "user in useEffect");
  }, [user]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName) {
      setError("Please enter a room name");
      return;
    }

    try {
      setIsLoading(true);
      console.log(user, "user in createRoom");
      const res = await createRoom({ slug: roomName });
      console.log(res, "res in createRoom");
      const roomId = res.data?.roomData.id;
      router.push(`/draw/${roomId}`);
    } catch (error) {
      console.log(error, "err");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12"
      style={{ backgroundColor: "#202025" }}
    >
      {/* Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto px-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-4 transform hover:scale-105 transition-transform duration-200">
              <Plus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Create New Room
            </h1>
            <p className="text-gray-400">Set up your collaborative workspace</p>
          </div>

          {/* Form */}
          <form onSubmit={handleCreateRoom} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Room Name *
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter room name"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Create Room</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push("join")}
              className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
            >
              ← Back to rooms
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
