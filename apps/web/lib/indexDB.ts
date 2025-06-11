import { appName } from "@/utils";
import { Shape } from "./draw";

// Initialize IndexedDB
export const initDB = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(appName, 1);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains("shapes")) {
        db.createObjectStore("shapes", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Save all shapes to IndexedDB
export const saveShapesToDB = async (shapes: Shape[]) => {
  try {
    const db = await initDB();
    const tx = db.transaction("shapes", "readwrite");
    const store = tx.objectStore("shapes");

    // Clear existing data
    await store.clear();

    // Add all shapes
    await Promise.all(shapes.map(shape => store.put(shape)));

    return new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
    });
  } catch (error) {
    console.error("Error saving shapes to DB:", error);
  }
};

// Add a single shape to IndexedDB
export const addShapeToDB = async (shape: Shape) => {
  try {
    const db = await initDB();
    const tx = db.transaction("shapes", "readwrite");
    const store = tx.objectStore("shapes");
    await store.put(shape);
  } catch (error) {
    console.error("Error adding shape to DB:", error);
  }
};

// Update a shape in IndexedDB
export const updateShapeInDB = async (shape: Shape) => {
  try {
    const db = await initDB();
    const tx = db.transaction("shapes", "readwrite");
    const store = tx.objectStore("shapes");
    await store.put(shape);
  } catch (error) {
    console.error("Error updating shape in DB:", error);
  }
};

// Remove a shape from IndexedDB
export const removeShapeFromDB = async (shapeId: string) => {
  try {
    const db = await initDB();
    const tx = db.transaction("shapes", "readwrite");
    const store = tx.objectStore("shapes");
    await store.delete(shapeId);
  } catch (error) {
    console.error("Error removing shape from DB:", error);
  }
};

// Load shapes from IndexedDB
export const loadShapesFromDB = async (): Promise<Shape[]> => {
  try {
    const db = await initDB();
    const tx = db.transaction("shapes", "readonly");
    const store = tx.objectStore("shapes");
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => resolve([]);
    });
  } catch (error) {
    console.error("Error loading shapes from DB:", error);
    return [];
  }
};