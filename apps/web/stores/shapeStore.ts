import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getDb, loadShapesFromIndexedDB, saveShapesToIndexedDB, STORE_NAME } from "../utils/indexedDb";
import { Shape, ShapeType } from "../@types/shapeStore";
import { createRoom, ICreateRoom } from "../actions";

interface ShapeState {
  shapes: Shape[];
  selectedShapeId: string | null;
  selectedTool: ShapeType | null;
  isAuthenticated: boolean;
  currentRoom: string | null;
  ws: WebSocket | null;
}


interface ShapeActions {
  setShapes: (shapes: Shape[]) => Promise<void>;
  addShape: (shape: Shape) => Promise<void>;
  updateShape: (id: string, updates: Partial<Shape>) => Promise<void>;
  deleteShape: (id: string) => Promise<void>;
  setSelectedShape: (id: string | null) => void;
  setSelectedTool: (tool: ShapeType | null) => void;

  initializeWebSocket: (token: string, roomId?: string) => void;
  handleWebSocketMessage: (event: MessageEvent) => void;
  syncWithServer: (roomId: string) => void;
  shareRoom: (data: ICreateRoom) => Promise<string>;
}

type ShapeStore = ShapeState & ShapeActions;

export const useShapeStore = create<ShapeStore>()(
  persist(
    (set, get) => ({
      // Initial state
      shapes: [],
      selectedShapeId: null,
      selectedTool: null,
      isAuthenticated: false,
      currentRoom: null,
      ws: null,


      initializeWebSocket: (token: string, roomId?: string) => {
        const ws = new WebSocket("ws://localhost:8080");

        ws.onopen = () => {
          console.log("WebSocket connection established");
          if (roomId) {
            ws.send(JSON.stringify({
              type: "JOIN_ROOM",
              payload: {
                roomId
              }
            })),
              get().syncWithServer(roomId);
          };

          ws.onmessage = (event) => {
            get().handleWebSocketMessage(event);
          }
          set({ ws });
        }
      },

      handleWebSocketMessage: (event: MessageEvent) => {
        const message = JSON.parse(event.data);
        const { type, shapes, shape, shapeId } = message;

        switch (type) {
          case "SYNC_SHAPES":
            set({ shapes });
            break;
          case "NEW_SHAPE":
            set(state => ({
              shapes: [...state.shapes, shape]
            }));
            break;
          case "UPDATE_SHAPE":
            set(state => ({
              shapes: state.shapes.map(s =>
                s.id === shape.id ? shape : s
              )
            }));
            break;
          case "DELETE_SHAPE":
            set(state => ({
              shapes: state.shapes.filter(s => s.id !== shapeId)
            }));
            break;
        }
      },

      syncWithServer: (roomId: string) => {
        const { ws } = get();
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: "GET_SHAPES",
            payload: { roomId }
          }));
        }
      },

      shareRoom: async (data) => {
        const { isAuthenticated } = get()

        if (!isAuthenticated) {
          return "Please sign in to share the room";
        }

        const response = await createRoom(data);
        if (!response.success || !response.data) {
          return "Failed to create room";
        }
        const roomId = response.data.roomId;

        return roomId;
      },

      // Actions
      setShapes: async (shapes) => {
        await saveShapesToIndexedDB(shapes);
        set({ shapes });
      },
      addShape: async (shape) => {
        const { ws, currentRoom, isAuthenticated } = get();
        const updatedShapes = [...get().shapes, shape];

        if (isAuthenticated && currentRoom && ws) {
          ws.send(JSON.stringify({
            type: 'CREATE_SHAPE',
            payload: { shape, roomId: currentRoom }
          }));
        } else {
          await saveShapesToIndexedDB(updatedShapes);
        }

        set({ shapes: updatedShapes });
      },
      updateShape: async (id, updates) => {
        const { ws, currentRoom, isAuthenticated } = get();
        const updatedShapes = get().shapes.map((shape) =>
          shape.id === id ? { ...shape, ...updates } : shape
        );

        if (isAuthenticated && currentRoom && ws) {
          ws.send(JSON.stringify({
            type: 'UPDATE_SHAPE',
            payload: { shape: updatedShapes[0], roomId: currentRoom }
          }));
        } else {
          await saveShapesToIndexedDB(updatedShapes as Shape[]);
        }
        set({ shapes: updatedShapes as Shape[] });
      },

      deleteShape: async (id) => {
        const { ws, currentRoom, isAuthenticated } = get();
        const updatedShapes = get().shapes.filter((shape) => shape.id !== id);

        if (isAuthenticated && currentRoom && ws) {
          ws.send(JSON.stringify({
            type: 'DELETE_SHAPE',
            payload: {
              shapeId: id,
              roomId: currentRoom
            }
          }))
        } else {
          await saveShapesToIndexedDB(updatedShapes);
        }

        set({ shapes: updatedShapes });
      },

      setSelectedShape: (id) => set({ selectedShapeId: id }),
      setSelectedTool: (tool) => set({ selectedTool: tool }),
    }),
    {
      name: "shape-storage",
      version: 1,
      storage: createJSONStorage(() => ({
        getItem: async (name: string) => {
          if (name === "shape-storage") {
            const shapes = await loadShapesFromIndexedDB();
            return {
              state: {
                shapes,
                selectedShapeId: null,
                selectedTool: null,
              },
              version: 1,
            };
          }
          return null;
        },
        setItem: async (name: string, value: unknown) => {
          if (name === "shape-storage" && typeof value === "object" && value !== null) {
            const { state } = value as { state: ShapeState };
            await saveShapesToIndexedDB(state.shapes);
          }
        },
        removeItem: async (name: string) => {
          if (name === "shape-storage") {
            const db = await getDb();
            const tx = db.transaction(STORE_NAME, "readwrite");
            await tx.objectStore(STORE_NAME).clear();
            await tx.done;
          }
        },
      })),
    }
  )
);