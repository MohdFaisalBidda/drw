"use client";

import React, { useEffect, useState } from "react";
import Canvas from "./Canvas";
import { WS_URL } from "../../config";
import Toolbar from "./Toolbar";

function RoomCanvas({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(
      `${WS_URL}?token=${localStorage.getItem("token")}`
    );

    ws.onopen = () => {
      setSocket(ws);
      const data = JSON.stringify({
        type: "JOIN_ROOM",
        payload: {
          roomId,
        },
      });
      console.log(data);
      ws.send(data);
    };
  }, []);

  if (!socket) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Toolbar />
      <Canvas roomId={roomId} socket={socket} />
    </>
  );
}

export default RoomCanvas;
