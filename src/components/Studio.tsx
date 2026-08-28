"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { dimsForComp, renderComp } from "@/lib/render";
import { Rng, randomSeriesId } from "@/lib/rng";
import { MOTIF_NAMES } from "@/lib/motifs";
import type {
  ColorId,
  Composition,
  GeneratorKind,
  OverlapMode,
  Settings,
  XeroxSettings,
} from "@/lib/types";
import { CanvasStage } from "./CanvasStage";
import { ControlRail } from "./ControlRail";
import { Archive, type ArchiveItem } from "./Archive";

type Mode = "studio" | "archive";

const DEFAULT_HOFMANN: Settings = {
  seriesId: "48291047",
  motif: "auto",
  paper: "paper",
  ink: "black",
  aspect: "3:4",
  margin: 0.08,
  density: 1,
  scale: 1,
  showGrid: false,
  showLabel: true,
};

const DEFAULT_XEROX: XeroxSettings = {
  seriesId: "70481123",
  mainText: "RAYGUN",
  subText: "brutalist",
  mainSize: 300,
  subSize: 180,
  sizeVar: 0.22,
  rotation: 8,
  jitter: 6,
  packing: 0.95,
  overlap: "xor",
  overlapThreshold: 40,
  masks: 8,
  maskInvert: true,
  grit: 40,
  threshold: 140,
};

const ARCHIVE_CAP = 96;

function freshId(): string {
  const seed = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  const rng = new Rng(seed);
  return randomSeriesId(() => rng.random());
}

function makeThumb(comp: Composition): string {
  const [w, h] = dimsForComp(comp);
  const short = 360;
  const s = short / Math.min(w, h);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * s);
  canvas.height = Math.round(h * s);
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.scale(canvas.width / w, canvas.height / h);
  renderComp(ctx, w, h, comp);
  return canvas.toDataURL("image/png");
}

export function Studio() {
  const [mode, setMode] = useState<Mode>("studio");
  const [generator, setGenerator] = useState<GeneratorKind>("hofmann");
  const [hof, setHof] = useState<Settings>(DEFAULT_HOFMANN);
  const [xer, setXer] = useState<XeroxSettings>(DEFAULT_XEROX);
  // Session-only — no persistence, so it resets on reload.
  const [archive, setArchive] = useState<ArchiveItem[]>([]);
  const counter = useRef(0);

  const comp: Composition = useMemo(
    () =>
      generator === "hofmann"
        ? { kind: "hofmann", settings: hof }
        : { kind: "xerox", settings: xer },
    [generator, hof, xer],
  );

  const snapshot = useCallback((c: Composition) => {
    const item: ArchiveItem = {
      id: `v${counter.current++}-${c.settings.seriesId}`,
      comp: c,
      thumb: makeThumb(c),
    };
    setArchive((prev) => [item, ...prev].slice(0, ARCHIVE_CAP));
  }, []);

  // New version of the current generator: reseed, keep everything else, archive.
  const handleGenerate = useCallback(() => {
    const id = freshId();
    if (generator === "hofmann") {
      const next = { ...hof, seriesId: id };
      setHof(next);
      snapshot({ kind: "hofmann", settings: next });
    } else {
      const next = { ...xer, seriesId: id };
      setXer(next);
      snapshot({ kind: "xerox", settings: next });
    }
  }, [generator, hof, xer, snapshot]);

  // Surprise: reseed and reshuffle the generator's character off the new seed.
  const handleSurprise = useCallback(() => {
    const id = freshId();
    const r = new Rng(id);
    if (generator === "hofmann") {
      // Off-white or white ground, a contrasting ink that is often a primary.
      const papers: ColorId[] = ["paper", "white", "black"];
      const paper = r.choice(papers);
      const inkChoices: ColorId[] = (
        paper === "black" ? ["white", "red", "yellow", "blue"] : ["black", "red", "yellow", "blue"]
      ) as ColorId[];
      const next: Settings = {
        ...hof,
        seriesId: id,
        motif: r.random() < 0.5 ? "auto" : r.choice(MOTIF_NAMES),
        paper,
        ink: r.choice(inkChoices),
      };
      setHof(next);
      snapshot({ kind: "hofmann", settings: next });
    } else {
      const overlaps: OverlapMode[] = ["xor", "char", "none"];
      const next: XeroxSettings = {
        ...xer,
        seriesId: id,
        rotation: Math.round(r.uniform(0, 16)),
        jitter: Math.round(r.uniform(0, 18)),
        packing: Number(r.uniform(0.8, 1.1).toFixed(2)),
        overlap: r.choice(overlaps),
        masks: r.randint(2, 14),
        grit: Math.round(r.uniform(20, 60)),
      };
      setXer(next);
      snapshot({ kind: "xerox", settings: next });
    }
  }, [generator, hof, xer, snapshot]);

  const handleSnapshot = useCallback(() => snapshot(comp), [comp, snapshot]);

  const handleExport = useCallback(() => {
    const [w, h] = dimsForComp(comp);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderComp(ctx, w, h, comp);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pga-${comp.settings.seriesId}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [comp]);

  const openFromArchive = useCallback((item: ArchiveItem) => {
    if (item.comp.kind === "hofmann") {
      setGenerator("hofmann");
      setHof(item.comp.settings);
    } else {
      setGenerator("xerox");
      setXer(item.comp.settings);
    }
    setMode("studio");
  }, []);

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-bg text-text">
      <div className="min-w-0 flex-1">
        {mode === "studio" ? (
          <CanvasStage comp={comp} />
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
          generator={generator}
          setGenerator={setGenerator}
          hof={hof}
          setHof={setHof}
          xer={xer}
          setXer={setXer}
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
