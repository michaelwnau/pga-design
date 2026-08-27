"use client";

import { useEffect, useRef } from "react";
import { dimsForComp, renderComp } from "@/lib/render";
import type { Composition } from "@/lib/types";

// Draws the current composition to a canvas at native print resolution and
// scales it down with CSS to fit the stage — so preview matches an export.
export function CanvasStage({ comp }: { comp: Composition }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const [w, h] = dimsForComp(comp);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderComp(ctx, w, h, comp);
  }, [comp]);

  return (
    <div className="checker flex h-full w-full items-center justify-center p-6 md:p-10">
      <canvas
        ref={canvasRef}
        className="max-h-full max-w-full object-contain shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
      />
    </div>
  );
}
