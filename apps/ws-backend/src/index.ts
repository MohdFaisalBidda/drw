import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { prisma } from '@repo/db';
import jwt, { JwtPayload } from 'jsonwebtoken';
import env from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

env.config()

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

const PORT = (process.env.PORT || 8080) as number;
const server = http.createServer();
const wss = new WebSocketServer({ server });
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
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
  console.log(queryParams, "queryParams in ws");

  const token = queryParams.get('token') || "";
  console.log(token, "token in ws");

  if (!token || token === "undefined") {
    console.log('No valid token provided');
    ws.close(4003, 'Authentication failed');
    return;
  }

  try {
    console.log(url, token, "token in ws");

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    if (typeof decoded == "string") {
      console.error("Decoded token is a string, expected object");
      return null;
    }

    if (!decoded.userId) {
      console.error("No valid user ID in token");
      return null;
    }
    ws.userId = decoded.userId as string;
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
        case 'CREATE_SHAPE':
          await handleCreateShape(ws, payload.message, payload.roomId);
          break;
        case 'UPDATE_SHAPE':
          await updateShape(ws, payload.message, payload.shapeId, payload.roomId);
          break;
        case 'DELETE_SHAPE':
          await deleteShape(ws, payload.shapeId, payload.roomId);
          break;
        case 'CURSOR_POSITION':
          await broadcastCursorPosition(ws, payload.userId, payload.roomId, payload.x, payload.y);
          break;
        case 'REQUEST_PRESENCE_UPDATE':
          await broadcastPresence(payload.roomId);
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
  ws.name = ws.name;
  ws.currentRoom = roomId;
  broadcastPresence(roomId)

  console.log("Current room", ws.currentRoom, roomId);
}

async function broadcastPresence(roomId: string) {
  const room = rooms[roomId];
  if (!room) return;

  const presenceData = {
    type: 'PRESENCE_UPDATE',
    payload: {
      users: Array.from(room.members).map(member => ({
        id: member.userId,
        name: member.name,
      }))
    }
  }

  room.members.forEach(member => {
    if (member.readyState === WebSocket.OPEN) {
      member.send(JSON.stringify(presenceData))
    }
  })
}

async function broadcastCursorPosition(ws: Client, userId: string, roomId: string, x: number, y: number) {
  const room = rooms[roomId];
  if (!room) return;

  rooms[roomId]?.members.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client.userId !== userId) {
      client.send(JSON.stringify({
        type: 'REMOTE_CURSOR_UPDATE',
        payload: {
          x,
          y,
          userId,
          roomId
        }
      }))
    }
  })

}

async function leaveRoom(ws: Client) {
  if (!ws.currentRoom || !rooms[ws.currentRoom] || !ws.userId) return;

  const room = rooms[ws.currentRoom];
  const userId = ws.userId;
  room?.members.delete(ws);

  broadcastUserLeft(ws.currentRoom, userId);

  if (room && room.members.size > 0) {
    broadcastPresence(ws.currentRoom);
  } else {
    const roomId = ws.currentRoom;
    console.log("Scheduled cleanup for empty room", roomId);

    setTimeout(async () => {
      try {
        if (rooms[roomId] && rooms[roomId].members.size === 0) {
          console.log("cleaning up room", roomId);

          await prisma.shape.deleteMany({
            where: {
              roomId: roomId
            }
          })

          await prisma.room.delete({
            where: {
              id: roomId
            }
          })

          console.log("Broadcasting ROOM_DELETED to", wss.clients.size, "clients");
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'ROOM_DELETED',
                payload: {
                  roomId,
                  deleted: true // Add confirmation flag
                }
              }));
              console.log("ROOM_DELETED sent to client", client);
            }
          });

          delete rooms[roomId];
          console.log("cleaned up room", roomId);
        } else {
          console.log("room not empty", roomId);
        }
      } catch (error) {
        console.log(error, "error in cleaning up room");
      }
    }, 3000);
  }

  ws.currentRoom = undefined;
}

function broadcastRoomDeleted(roomId: string) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: "ROOM_DELETED",
        payload: {
          roomId
        }
      }))
    }
  })
}

async function broadcastUserLeft(roomId: string, userId: string) {
  const room = rooms[roomId];
  if (!room) return

  const message = JSON.stringify({
    type: 'USER_LEFT',
    payload: {
      userId,
      roomId
    }
  })

  room.members.forEach(member => {
    if (member.readyState === WebSocket.OPEN) {
      member.send(message)
    }
  })
}

async function deleteShape(ws: Client, shapeId: string, roomId: string) {
  try {
    console.log(shapeId, roomId, ws.userId, "shapeId in deleteShape");


    const room = rooms[roomId];
    if (!room || !room.members.has(ws)) {
      console.log("User not in room or room doesn't exist");
      return;
    }

    await prisma.shape.delete({
      where: {
        id: shapeId,
      }
    })

    room.members.forEach((member) => {
      if (member.readyState === WebSocket.OPEN && member.userId !== ws.userId) {
        member.send(JSON.stringify({
          type: 'DELETE_SHAPE',
          payload: {
            shapeId,
            roomId,
            userId: ws.userId,
            deletedBy: ws.userId
          }
        }))
      }
    })
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


async function handleCreateShape(ws: Client, message: string, roomId: string) {
  try {
    console.log(ws.currentRoom, "ws.currentRoom");
    if (!rooms[roomId] || !ws.currentRoom) return;

    console.log(message,roomId, "message in broadcastMessage");

    const shapeData = JSON.parse(message);

    const shapeWithClientId = {
      ...shapeData,
      id: shapeData.id || uuidv4() // Use client ID if provided
    };

    broadcastShapeCreation(roomId, shapeWithClientId, ws.userId);

    const savedShape = await prisma.shape.create({
      data: {
        message: JSON.stringify(shapeWithClientId),
        roomId,
        userId: ws.userId!,
      }
    })

    const updatedShape = {
      ...shapeData,
      id: savedShape.id
    };

    console.log(savedShape.id, "savedShape.id in broadcastMessage");

    await prisma.shape.update({
      where: {
        id: savedShape.id
      },
      data: {
        message: JSON.stringify(updatedShape)
      }
    })

    const updatedShapeData = { ...shapeData, id: savedShape.id };
    console.log(savedShape, updatedShapeData, "updatedShapeData in broadcastMessage");


    const room = rooms[roomId];
    if (room) {
      const members = Array.from(room.members);
      members.forEach((member) => {
        if (member.readyState === WebSocket.OPEN && member.userId !== ws.userId) {
          member.send(JSON.stringify({
            type: 'SHAPE_CREATED',
            payload: {
              roomId,
              shape: updatedShape,
              shapeId: savedShape.id
            }
          }))
        }
      })
    }

  } catch (error) {
    console.error('Error creating shape:', error);
    ws.send(JSON.stringify({
      type: 'ERROR',
      payload: {
        message: 'Failed to create shape'
      }
    }));
  }
}

function broadcastShapeCreation(roomId: string, shape: any, senderId?: string) {
  const room = rooms[roomId];
  if (!room) return;

  const message = JSON.stringify({
    type: 'CREATE_SHAPE',
    payload: {
      shape,
      roomId,
      senderId // Useful for ignoring echo on sender
    }
  });

  room.members.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// const broadcastShape = (ws: Client, roomId: string, message: any) => {
//   if (!rooms[roomId] || !ws.currentRoom) return;

//   const room = rooms[roomId];
//   room.members.forEach((member) => {
//     if (member.readyState === WebSocket.OPEN && member.userId !== ws.userId) {
//       member.send(JSON.stringify(message))
//     }
//   })
// }

// const createShape = async (ws: Client, roomId: string, shape: any) => {
//   console.log(shape, "shape in createShape");

//   const savedShape = await prisma.shape.create({
//     data: {
//       ...shape,
//       roomId,
//       createdBy: ws.userId
//     }
//   })
//   return savedShape
// }

// const getShapesByRoomId = async (roomId: string) => {
//   return await prisma.shape.findMany({
//     where: {
//       roomId: roomId
//     }
//   })
// }