import jwt, { JwtPayload } from 'jsonwebtoken';
import { WebSocketServer, WebSocket } from 'ws';
import { JWT_SECRET } from '@repo/backend-common/config';

interface Client extends WebSocket {
  userId?: string,
  currentRoom?: string,
}

interface Room {
  id: string;
  members: Set<Client>;
}

const wss = new WebSocketServer({ port: 8080 });

const rooms: Record<string, Room> = {};

wss.on('connection', (ws: Client, req) => {
  ws.on('error', console.error);

  const url = req.url;
  if (!url) {
    ws.close();
    return
  }

  const queryParams = new URLSearchParams(url.split('?')[1]);
  const token = queryParams.get('token') || "";

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (!decoded || !decoded.userId) {
      ws.close();
      return
    }

    ws.userId = decoded.userId;
  } catch (error) {
    ws.close();
    return
  }

  ws.on('message', (data) => {
    try {
      const parsedData = JSON.parse(data.toString());
      const { type, payload } = parsedData;

      switch (type) {
        case 'JOIN_ROOM': {
          const { roomId } = payload;
          joinRoom(ws, roomId);
          break;
        }

        case 'LEAVE_ROOM': {
          leaveRoom(ws);
          break;
        }

        case 'SEND_MESSAGE': {
          const { message, roomId } = payload;
          broadcastMessage(ws, message, roomId);
          break;
        }

        default:
          console.log("Unknown message type received", type);
          break;

      }
    } catch (error) {
      console.log(error, "Invalid message format received", error);
    }
  });

  ws.on('close', () => {
    console.log('Connection closed');
  });

});


function joinRoom(ws: Client, roomId: string) { }

function leaveRoom(ws: Client) { }


function broadcastMessage(ws: Client, message: string, roomId: string) { }