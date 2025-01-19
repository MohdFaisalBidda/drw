"use client";

import React from "react";
import { Shape } from "../../@types/shapeStore";
import { Button } from "@repo/ui/button";
import LZString from "lz-string";

const URL = "https://localhost:3000";

function SettingsPanel({ handleShare }: { handleShare: any }) {
  return (
    <Button
      onClick={handleShare}
      className="absolute top-5 right-5 text-black bg-white p-2 rounded-lg shadow-lg"
    >
      Share
    </Button>
  );
}

export default SettingsPanel;
