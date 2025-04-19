"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { styles } from "../../styles/shared";
import {
  PaintbrushIcon as PaintBrush,
  Settings,
  Users,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { createRoom } from "../../actions";
import { useUser } from "../../provider/UserProvider";
import axios from "axios";

export default function CreateRoomPage() {
  const [roomName, setRoomName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState("10");
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
      console.log(user, "user in createRoom");
      const res = await axios.post("/api/room", {
        slug: roomName,
        adminId: user.id,
      });
      console.log(res, "res in createRoom");
      const roomId = res.data?.roomData.id;
      router.push(`/draw/${roomId}`);
    } catch (error) {
      console.log(error, "err");
    }

    // Demo implementation
  };

  return (
    <div className={styles.gradientBg}>
      <div className={styles.container}>
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 mb-4">
              <PaintBrush className="w-8 h-8 text-white" />
            </div>
            <h1>Create Drawing Room</h1>
            <p className={styles.subheading}>
              Set up your perfect drawing space
            </p>
          </div>

          {/* Create Room Form */}
          <div className={`${styles.card} p-8`}>
            <form onSubmit={handleCreateRoom} className="space-y-6">
              <div>
                <label htmlFor="roomName" className={styles.inputLabel}>
                  Room Name
                </label>
                <input
                  id="roomName"
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className={styles.input}
                  placeholder="e.g., Design Workshop"
                />
              </div>

              {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="maxParticipants"
                    className={styles.inputLabel}
                  >
                    Max Participants
                  </label>
                  <select
                    id="maxParticipants"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                    className={styles.input}
                  >
                    <option value="5">5 participants</option>
                    <option value="10">10 participants</option>
                    <option value="20">20 participants</option>
                    <option value="50">50 participants</option>
                  </select>
                </div>

                <div>
                  <label className={styles.inputLabel}>Room Privacy</label>
                  <div className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      id="isPrivate"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label
                      htmlFor="isPrivate"
                      className="ml-2 text-sm text-gray-700"
                    >
                      Make room private
                    </label>
                  </div>
                </div>
              </div> */}

              {error && <div className={styles.error}>{error}</div>}

              <button type="submit" className={styles.button.primary}>
                Create Room
              </button>
              <p className="text-center text-sm text-gray-600">
                want to join an existing room?{" "}
                <Link href="/" className={styles.link}>
                  Join room
                </Link>
              </p>
            </form>
          </div>

          {/* Features Grid */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-purple-600" />
                <h3 className="font-medium">Collaborative</h3>
              </div>
              <p className="text-sm text-gray-600">
                Draw together in real-time
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-purple-600" />
                <h3 className="font-medium">Private Rooms</h3>
              </div>
              <p className="text-sm text-gray-600">Control who can join</p>
            </div>
            <div className="p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-4 h-4 text-purple-600" />
                <h3 className="font-medium">Customizable</h3>
              </div>
              <p className="text-sm text-gray-600">Set your room preferences</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
