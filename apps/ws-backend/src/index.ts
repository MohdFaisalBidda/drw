import jwt, { JwtPayload } from 'jsonwebtoken';
import { WebSocketServer, WebSocket } from 'ws';
import { JWT_SECRET } from '@repo/backend-common/config';
import { prisma } from '@repo/db/prisma';

interface Client extends WebSocket {
  userId?: string,
  name: string,
  currentRoom?: string,
  isAlive?: boolean
}

interface Room {
  id: string;
  members: Set<Client>;
}

const wss = new WebSocketServer({ port: 8080 });
const rooms: Record<string, Room> = {};

const interval = setInterval(() => {
  wss.clients.forEach((ws: any) => {
    if (ws.isAlive === false) {
      return ws.terminate()
    }
    ws.isAlive = false
    ws.ping()
  })
}, 30000)

wss.on('connection', (ws: Client, req) => {
  ws.on('error', console.error);
  console.log('Client connected');

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
    ws.name = decoded.name;
  } catch (error) {
    ws.close();
    return
  }


  ws.on('message', async (data) => {
    try {
      const parsedData = JSON.parse(data.toString());
      const { type, payload } = parsedData;

      switch (type) {
        case 'JOIN_ROOM': {
          const { roomId } = payload;
          await joinRoom(ws, roomId);
          break
        }

        case
          'LEAVE_ROOM': {
            leaveRoom(ws);
            break;
          }

        case 'NEW_MESSAGE': {
          const { message, roomId } = payload;
          console.log(message, "message here in NEW_MESSAGE");
          await broadcastMessage(ws, message, roomId);
          break;
        }

        case "DELETE_SHAPE": {
          const { shapeId, roomId } = payload;
          console.log(shapeId, "shapeId in DELETE_SHAPE");
          await deleteShape(ws, shapeId, roomId);
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

  ws.on('close', (error) => {
    console.log('Connection closed', error);
    clearInterval(interval)
  });

  wss.on('close', () => {
    clearInterval(interval)
  })

});


async function joinRoom(ws: Client, roomId: string) {
  if (!rooms[roomId]) {
    rooms[roomId] = { id: roomId, members: new Set() };
  };

  rooms[roomId].members.add(ws);
  ws.currentRoom = roomId;
  console.log(ws.currentRoom, roomId, "join room here");
}

async function leaveRoom(ws: Client) {
  if (!ws.currentRoom || !rooms[ws.currentRoom]) return;

  const room = rooms[ws.currentRoom];
  room?.members.delete(ws);

  if (room?.members.size === 0) {
    delete rooms[ws.currentRoom];
    try {
      // await prisma.room.deleteMany({
      //   where: {
      //     id: ws.currentRoom
      //   }
      // })

      await prisma.shape.deleteMany({
        where: {
          roomId: ws.currentRoom
        }
      })
      
      await prisma.room.delete({
        where: {
          id: ws.currentRoom
        },
      })
    } catch (error) {
      console.log(error, "error in cleaning up room");

    }
  }

  ws.currentRoom = undefined;
}

async function deleteShape(ws: Client, shapeId: string, roomId: string) {
  try {
    console.log(shapeId, roomId, ws.userId, "shapeId in deleteShape");

    await prisma.shape.delete({
      where: {
        id: shapeId,
      }
    })

    const room = rooms[roomId];
    if (room) {
      room.members.forEach((member) => {
        if (member.readyState === WebSocket.OPEN && member.userId !== ws.userId) {
          member.send(JSON.stringify({
            type: 'DELETE_SHAPE',
            payload: {
              shapeId,
              roomId,
              userId: ws.userId
            }
          }))
        }
      })
    }
  } catch (error) {
    console.log(error, "error in deleteShape");

  }
}


async function broadcastMessage(ws: Client, message: string, roomId: string) {
  console.log(ws.currentRoom, "ws.currentRoom");
  if (!rooms[roomId] || !ws.currentRoom) return;

  console.log(message, ws, roomId, "message in broadcastMessage");

  const savedShape = await prisma.shape.create({
    data: {
      message,
      roomId,
      userId: ws.userId!,
    }
  })

  const room = rooms[roomId];
  console.log(rooms, roomId, "room in broadcastShape");

  const members = Array.from(room.members);
  members.forEach((member) => {
    if (member.readyState === WebSocket.OPEN && member.userId !== ws.userId) {
      member.send(JSON.stringify({
        type: 'NEW_MESSAGE',
        payload: {
          roomId,
          message,
          shape: savedShape
        }
      }))
    }
  })
}

const broadcastShape = (ws: Client, roomId: string, message: any) => {
  if (!rooms[roomId] || !ws.currentRoom) return;

  const room = rooms[roomId];
  room.members.forEach((member) => {
    if (member.readyState === WebSocket.OPEN && member.userId !== ws.userId) {
      member.send(JSON.stringify(message))
    }
  })
}

const createShape = async (ws: Client, roomId: string, shape: any) => {
  console.log(shape, "shape in createShape");

  const savedShape = await prisma.shape.create({
    data: {
      ...shape,
      roomId,
      createdBy: ws.userId
    }
  })
  return savedShape
}

const getShapesByRoomId = async (roomId: string) => {
  return await prisma.shape.findMany({
    where: {
      roomId: roomId
    }
  })
}