// hooks/useWebSocket.ts
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function useWebSocket(roomId: string) {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.accessToken) {
      setError("Not authenticated");
      return;
    }

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}?token=${encodeURIComponent(session.accessToken)}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setSocket(ws);
      setIsConnected(true);
      setError(null);
      ws.send(JSON.stringify({ type: "JOIN_ROOM", payload: { roomId } }));
    };

    ws.onclose = () => {
      setSocket(null);
      setIsConnected(false);
      setError("Connection closed");
    };

    ws.onerror = () => {
      setSocket(null);
      setIsConnected(false);
      setError("Connection error");
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "LEAVE_ROOM", payload: { roomId } }));
        ws.close();
      }
    };
  }, [session?.accessToken, roomId]);

  const sendMessage = (type: string, payload: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type, payload }));
    }
  };

  return { socket, isConnected, error, sendMessage };
}