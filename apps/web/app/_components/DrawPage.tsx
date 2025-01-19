"use client";

import Canvas from "./Canvas";
import Toolbar from "./Toolbar";

export default function DrawingApp() {
  return (
    <div className="relative h-screen w-full">
      <Toolbar />
      {/* <PropertiesPanel /> */}
      <Canvas />
    </div>
  );
}
