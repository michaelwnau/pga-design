"use client";

import { useCallback, useRef, useState } from "react";
import { dimsFor, renderStudy, resolveMotif } from "@/lib/study";
import { Rng, randomSeriesId } from "@/lib/rng";
import { MOTIF_NAMES } from "@/lib/motifs";
import type { Palette, Settings } from "@/lib/types";
import { CanvasStage } from "./CanvasStage";
import { ControlRail } from "./ControlRail";
import { Archive, type ArchiveItem } from "./Archive";

type Mode = "studio" | "gallery";

const DEFAULT_SETTINGS: Settings = {
  seriesId: "48291047",
  motif: "auto",
  palette: "mono",
  aspect: "3:4",
  margin: 0.08,
  density: 1,
  scale: 1,
  showGrid: false,
  showLabel: true,
};

const ARCHIVE_CAP = 96;

function freshId(): string {
  const seed = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  const rng = new Rng(seed);
  return randomSeriesId(() => rng.random());
}

// Small offscreen render for an archive thumbnail.
function makeThumb(settings: Settings): string {
  const [w, h] = dimsFor(settings.aspect);
  const short = 360;
  const scale = short / Math.min(w, h);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.scale(canvas.width / w, canvas.height / h);
  renderStudy(ctx, w, h, settings);
  return canvas.toDataURL("image/png");
}

export function Studio() {
  const [mode, setMode] = useState<Mode>("studio");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  // Session-only — no persistence, so it resets on reload.
  const [archive, setArchive] = useState<ArchiveItem[]>([]);
  const counter = useRef(0);

  const snapshot = useCallback((s: Settings) => {
    const item: ArchiveItem = {
      id: `v${counter.current++}-${s.seriesId}`,
      settings: s,
      thumb: makeThumb(s),
      motif: resolveMotif(s),
    };
    setArchive((prev) => [item, ...prev].slice(0, ARCHIVE_CAP));
  }, []);

  // New version of the *current* motif: reseed, keep everything else, archive.
  // Side effects stay out of the state updater (StrictMode double-invokes it).
  const handleGenerate = useCallback(() => {
    const next = { ...settings, seriesId: freshId() };
    setSettings(next);
    snapshot(next);
  }, [settings, snapshot]);

  // Surprise: reseed and also reshuffle motif + palette off the new seed.
  const handleSurprise = useCallback(() => {
    const id = freshId();
    const r = new Rng(id);
    const palettes: Palette[] = ["mono", "invert", "blueprint", "risograph"];
    const next: Settings = {
      ...settings,
      seriesId: id,
      motif: r.random() < 0.5 ? "auto" : r.choice(MOTIF_NAMES),
      palette: r.choice(palettes),
    };
    setSettings(next);
    snapshot(next);
  }, [settings, snapshot]);

  const handleSnapshot = useCallback(() => snapshot(settings), [settings, snapshot]);

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

  const openFromArchive = useCallback((item: ArchiveItem) => {
    setSettings(item.settings);
    setMode("studio");
  }, []);

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-bg text-text">
      <div className="min-w-0 flex-1">
        {mode === "studio" ? (
          <CanvasStage settings={settings} />
        ) : (
          <Archive
            items={archive}
            onOpen={openFromArchive}
            onClear={() => setArchive([])}
          />
        )}
      </div>
      <aside className="w-[340px] shrink-0 border-l border-border">
        <ControlRail
          mode={mode}
          setMode={setMode}
          settings={settings}
          setSettings={setSettings}
          archiveCount={archive.length}
          onGenerate={handleGenerate}
          onSurprise={handleSurprise}
          onSnapshot={handleSnapshot}
          onExport={handleExport}
        />
      </aside>
    </main>
  );
}
