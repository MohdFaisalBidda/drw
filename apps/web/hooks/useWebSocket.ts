// hooks/useWebSocket.ts
"use client";

import { webSocketManager } from "@/lib/websocket";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function useWebSocket(roomId?: string) {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.accessToken) {
      setError("Not authenticated");
      return;
    }

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}?token=${encodeURIComponent(session.accessToken)}`;

    const connect = async () => {
      try {
        await webSocketManager.connect(wsUrl);
        setIsConnected(true);
        setError(null);

        if (roomId) {
          webSocketManager.sendMessage("JOIN_ROOM", { roomId });
        }
      } catch (error: any) {
        setError(error.message);
        setIsConnected(false);
      }
    }

    connect();

    return () => {
      if (roomId) {
        webSocketManager.sendMessage("LEAVE_ROOM", { roomId });
      }
    };
  }, [session?.accessToken, roomId]);

  const sendMessage = (type: string, payload: any) => {
    webSocketManager.sendMessage(type, payload);
  }

  const addListener = (type: string, callback: Function) => {
    webSocketManager.addListener(type, callback);
    return () => webSocketManager.removeListener(type, callback);
  };

  return { isConnected, error, sendMessage, addListener, socket: webSocketManager.socket };
}