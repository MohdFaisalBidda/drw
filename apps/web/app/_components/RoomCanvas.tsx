"use client";

import React, { useCallback, useEffect, useState } from "react";
import Canvas from "./Canvas";
import { WS_URL } from "../../config";
import Toolbar from "./Toolbar";

// WebSocket close codes and their meanings
const WS_CLOSE_CODES = {
  1000: "Normal Closure",
  1001: "Going Away",
  1002: "Protocol Error",
  1003: "Unsupported Data",
  1004: "Reserved",
  1005: "No Status Received",
  1006: "Abnormal Closure",
  1007: "Invalid frame payload data",
  1008: "Policy Violation",
  1009: "Message too big",
  1010: "Missing Extension",
  1011: "Internal Error",
  1012: "Service Restart",
  1013: "Try Again Later",
  1014: "Bad Gateway",
  1015: "TLS Handshake",
};

function RoomCanvas({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<WebSocket>();
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionDetails, setConnectionDetails] = useState<string>("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let ws: WebSocket;
    let heartBeatInterval: NodeJS.Timeout | null = null;

    const connectWebSocket = () => {
      if (ws) {
        console.log("Closing existing connection before reconnecting");
        ws.close();
      }

      try {
        const token = localStorage.getItem("token");
        const wsUrl = `${WS_URL}?token=${token}`;
        console.log("Attempting to connect to:", wsUrl);

        ws = new WebSocket(wsUrl);

        ws.addEventListener("open", () => {
          console.log("WebSocket connection established successfully");
          setSocket(ws);
          setIsConnecting(false);
          setError(null);
          setConnectionDetails("Connected successfully");

          if (ws) {
            const joinMessage = {
              type: "JOIN_ROOM",
              payload: {
                roomId,
              },
            };
            console.log("Sending JOIN_ROOM message:", joinMessage);
            ws.send(JSON.stringify(joinMessage));
          }
        });

        ws.addEventListener("message", (e) => {
          const message = JSON.parse(e.data);
          console.log(message,"message in ws addEventlistenere");
          
        });

        ws.addEventListener("close", (event) => {
          clearInterval(heartBeatInterval!);
          const closeCode = event.code;
          const closeReason = event.reason || "No reason provided";
          const wasClean = event.wasClean;
          const closureDescription =
            WS_CLOSE_CODES[closeCode as keyof typeof WS_CLOSE_CODES] ||
            "Unknown Code";

          const closeDetails = `
            WebSocket closed:
            - Code: ${closeCode} (${closureDescription})
            - Reason: ${closeReason}
            - Clean Closure: ${wasClean}
            - Timestamp: ${new Date().toISOString()}
          `;

          // console.error(closeDetails);
          setConnectionDetails(closeDetails);

          setIsConnecting(false);
          // setError(
          //   `Connection closed: ${closureDescription}. Please refresh the page.`
          // );
        });

        ws.addEventListener("error", (event) => {
          clearInterval(heartBeatInterval!);
          const errorDetails = `
            WebSocket error occurred:
            - Timestamp: ${new Date().toISOString()}
            - Event: ${JSON.stringify(event)}
          `;

          console.log("WebSocket error:", errorDetails);
          setConnectionDetails(errorDetails);

          setIsConnecting(false);
          // setError("Connection error. Please refresh the page.");
        });
      } catch (err) {
        clearInterval(heartBeatInterval!);
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        const errorDetails = `
          Failed to create WebSocket connection:
          - Error: ${errorMsg}
          - Timestamp: ${new Date().toISOString()}
        `;

        console.error(errorDetails);
        setConnectionDetails(errorDetails);

        setIsConnecting(false);
        setError("Failed to establish connection. Please refresh the page.");
      }
    };

    connectWebSocket();

    return () => {
      clearInterval(heartBeatInterval!);

      if (ws) {
        if (ws.readyState === WebSocket.OPEN) {
          console.log("Sending LEAVE_ROOM message before cleanup");
          ws.send(
            JSON.stringify({
              type: "LEAVE_ROOM",
              payload: {
                roomId,
              },
            })
          );
        }
        ws.close();
      }
    };
  }, [roomId]);

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl">
          <p className="text-red-500 mb-4">{error}</p>
          <div className="bg-gray-100 p-4 rounded mb-4 whitespace-pre-wrap font-mono text-sm">
            {connectionDetails}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <span className="block mt-2">Connecting to canvas...</span>
          <div className="mt-4 text-sm text-gray-600">{connectionDetails}</div>
        </div>
      </div>
    );
  }

  if (!socket) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <p className="text-red-500 mb-4">
            Connection lost. Please refresh the page.
          </p>
          <div className="bg-gray-100 p-4 rounded mb-4 whitespace-pre-wrap font-mono text-sm">
            {connectionDetails}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Canvas roomId={roomId} socket={socket} />
    </>
  );
}

export default RoomCanvas;
