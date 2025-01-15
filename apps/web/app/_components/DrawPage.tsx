"use client"

import Canvas from "./Canvas"
import Toolbar from "./Toolbar"

export default function DrawingApp() {
  return (
    <div className="relative h-screen w-full bg-gray-100">
      <Toolbar />
      {/* <PropertiesPanel /> */}
      <Canvas />
    </div>
  )
}

