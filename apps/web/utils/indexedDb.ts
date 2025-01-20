import { openDB } from "idb";
import { Shape } from "../@types/shapeStore";

export const DB_NAME = "shapesDB";
export const STORE_NAME = "shapes";

export async function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    },
  });
}

export async function saveShapesToIndexedDB(shapes: Shape[]) {
  const db = await getDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  await store.clear();
  shapes?.forEach((shape) => store.put(shape));
  await tx.done;
}

export async function loadShapesFromIndexedDB(): Promise<Shape[]> {
  const db = await getDb();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  return (await store.getAll()) as Shape[];
}
