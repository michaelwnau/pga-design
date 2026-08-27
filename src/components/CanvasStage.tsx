"use client";

import { useEffect, useRef } from "react";
import { dimsFor, renderStudy } from "@/lib/study";
import type { Settings } from "@/lib/types";

// Draws the current study to a canvas at native print resolution and scales it
// down with CSS to fit the stage — so the on-screen preview matches an export.
export function CanvasStage({ settings }: { settings: Settings }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const [w, h] = dimsFor(settings.aspect);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderStudy(ctx, w, h, settings);
  }, [settings]);

  return (
    <div className="checker flex h-full w-full items-center justify-center p-6 md:p-10">
      <canvas
        ref={canvasRef}
        className="max-h-full max-w-full object-contain shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
        style={{ imageRendering: "auto" }}
      />
    </div>
  );
}
