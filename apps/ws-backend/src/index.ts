import { WebSocketServer, WebSocket } from 'ws';
import { prisma } from '@repo/db';
import jwt, { JwtPayload } from 'jsonwebtoken';

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

// Heartbeat interval
const interval = setInterval(() => {
  wss.clients.forEach((ws: any) => {
    if (ws.isAlive === false) {
      console.log(`Terminating inactive connection ${ws.userId}`);
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('connection', async (ws: Client, req) => {
  ws.isAlive = true;

  // Setup heartbeat pong handler
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    ws.terminate();
  });

  console.log('Client connected');

  const url = req.url;
  if (!url) {
    console.log('No URL provided');
    ws.close(4001, 'No URL provided');
    return;
  }

  const queryParams = new URLSearchParams(url.split('?')[1]);
  const token = queryParams.get('token') || "";

  try {
    console.log(url, token, "token in ws");

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    if (typeof decoded == "string") {
      console.error("Decoded token is a string, expected object");
      return null;
    }
    if (!decoded.id) {
      console.error("No valid user ID in token");
      return null;
    }

    console.log(decoded, "decoded in ws");
    ws.userId = decoded.id as string;
    ws.name = decoded.name as string;
  } catch (error) {
    console.error('JWT verification failed:', {
      error,
      token: token.substring(0, 10) + '...', // Log first part for debugging
      tokenLength: token.length
    });
    console.log('JWT verification failed:', error);
    ws.close(4003, 'Authentication failed');
    return;
  }

  ws.on('message', async (data) => {
    try {
      const parsedData = JSON.parse(data.toString());
      const { type, payload } = parsedData;

      switch (type) {
        case 'JOIN_ROOM':
          await joinRoom(ws, payload.roomId);
          break;
        case 'LEAVE_ROOM':
          await leaveRoom(ws);
          break;
        case 'NEW_MESSAGE':
          await broadcastMessage(ws, payload.message, payload.roomId);
          break;
        case 'UPDATE_SHAPE':
          await updateShape(ws, payload.message, payload.shapeId, payload.roomId);
          break;
        case 'DELETE_SHAPE':
          await deleteShape(ws, payload.shapeId, payload.roomId);
          break;
        default:
          console.log("Unknown message type received", type);
          break;
      }
    } catch (error) {
      console.log("Invalid message format received", error);
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Invalid message format' }
      }));
    }
  });

  ws.on('close', () => {
    console.log(`Client ${ws.userId} disconnected`);
    leaveRoom(ws);
  });
});

// Clean up interval when server closes
wss.on('close', () => {
  clearInterval(interval);
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

async function updateShape(ws: Client, message: string, shapeId: string, roomId: string) {
  try {
    console.log(message, shapeId, roomId, "message in updateShape");

    const updatedMessage = JSON.parse(message);

    const updatedShape = await prisma.shape.update({
      where: {
        id: shapeId
      },
      data: {
        message: JSON.stringify(updatedMessage)
      }
    })

    const room = rooms[roomId];
    if (room) {
      room.members.forEach((member) => {
        if (member.readyState === WebSocket.OPEN) {
          member.send(JSON.stringify({
            type: 'SHAPE_UPDATED',
            payload: {
              shape: updatedShape.message,
              shapeId: shapeId,
              roomId,
              updatedBy: ws.userId
            }
          }))
        }
      })
    }
  } catch (error) {
    console.log("Error updating shape", error);
  }
}


async function broadcastMessage(ws: Client, message: string, roomId: string) {
  console.log(ws.currentRoom, "ws.currentRoom");
  if (!rooms[roomId] || !ws.currentRoom) return;

  console.log(message, ws, roomId, "message in broadcastMessage");

  const shapeData = JSON.parse(message);

  const savedShape = await prisma.shape.create({
    data: {
      message: JSON.stringify({ ...shapeData, id: shapeData.id }),
      roomId,
      userId: ws.userId!,
    }
  })

  console.log(savedShape.id, "savedShape.id in broadcastMessage");

  const updateMessageShapeId = await prisma.shape.update({
    where: {
      id: savedShape.id
    },
    data: {
      message: JSON.stringify({ ...shapeData, id: savedShape.id })
    }
  })

  const updatedShapeData = { ...shapeData, id: savedShape.id };
  console.log(savedShape, updatedShapeData, "updatedShapeData in broadcastMessage");


  const room = rooms[roomId];

  const members = Array.from(room.members);
  members.forEach((member) => {
    if (member.readyState === WebSocket.OPEN && member.userId !== ws.userId) {
      member.send(JSON.stringify({
        type: 'NEW_MESSAGE',
        payload: {
          roomId,
          message: JSON.stringify(updateMessageShapeId),
          shape: JSON.stringify(updatedShapeData)
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