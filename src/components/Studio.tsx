"use client";

import { useCallback, useState } from "react";
import { dimsFor, renderStudy } from "@/lib/study";
import { Rng, randomSeriesId } from "@/lib/rng";
import { MOTIF_NAMES } from "@/lib/motifs";
import type { Palette, Settings } from "@/lib/types";
import { CanvasStage } from "./CanvasStage";
import { ControlRail } from "./ControlRail";
import { Gallery } from "./Gallery";

type Mode = "studio" | "gallery";

const DEFAULT_SETTINGS: Settings = {
  seriesId: "48291047",
  motif: "auto",
  palette: "mono",
  aspect: "3:4",
  margin: 0.08,
  showGrid: false,
  showLabel: true,
};

// A single [0,1) source seeded off the current time, used only for the
// "new series" button — the resulting id is what makes a design reproducible.
function freshId(): string {
  const seed = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  const rng = new Rng(seed);
  return randomSeriesId(() => rng.random());
}

export function Studio() {
  const [mode, setMode] = useState<Mode>("studio");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const handleRandomize = useCallback(() => {
    // Also reshuffle format/palette/motif for genuinely new prints, all
    // derived from the new id so the result stays reproducible from it.
    const id = freshId();
    const r = new Rng(id);
    const palettes: Palette[] = ["mono", "invert", "blueprint", "risograph"];
    setSettings((s) => ({
      ...s,
      seriesId: id,
      motif: r.random() < 0.5 ? "auto" : r.choice(MOTIF_NAMES),
      palette: r.random() < 0.35 ? r.choice(palettes) : s.palette,
    }));
  }, []);

  const handleExport = useCallback(() => {
    const [w, h] = dimsFor(settings.aspect);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderStudy(ctx, w, h, settings);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pga-${settings.seriesId}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [settings]);

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-bg text-text">
      <div className="min-w-0 flex-1">
        {mode === "studio" ? <CanvasStage settings={settings} /> : <Gallery />}
      </div>
      <aside className="w-[340px] shrink-0 border-l border-border">
        <ControlRail
          mode={mode}
          setMode={setMode}
          settings={settings}
          setSettings={setSettings}
          onRandomize={handleRandomize}
          onExport={handleExport}
        />
      </aside>
    </main>
  );
}
