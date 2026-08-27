"use client";

import type { Settings } from "@/lib/types";
import { resolveMotif } from "@/lib/study";
import { Button, Panel, Seg, Slider, Toggle } from "./ui";

type Mode = "studio" | "gallery";

export function ControlRail({
  mode,
  setMode,
  settings,
  setSettings,
  archiveCount,
  onGenerate,
  onSurprise,
  onSnapshot,
  onExport,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  archiveCount: number;
  onGenerate: () => void;
  onSurprise: () => void;
  onSnapshot: () => void;
  onExport: () => void;
}) {
  const patch = (p: Partial<Settings>) => setSettings((s) => ({ ...s, ...p }));

  return (
    <div className="rail flex h-full flex-col overflow-y-auto bg-panel">
      {/* MASTHEAD */}
      <div className="border-b border-border px-4 py-4">
        <div className="mono text-[13px] tracking-[0.22em] text-text">PGA · DESIGN</div>
        <div className="mt-1 text-[11px] text-text-faint">
          Programmatic graphic design studio
        </div>
      </div>

      {/* VIEW */}
      <Panel title="VIEW">
        <Seg<Mode>
          value={mode}
          onChange={setMode}
          options={[
            { label: "STUDIO", value: "studio" },
            { label: `ARCHIVE${archiveCount ? ` · ${archiveCount}` : ""}`, value: "gallery" },
          ]}
        />
      </Panel>

      {mode === "studio" && (
        <>
          {/* GENERATE */}
          <Panel title="GENERATE">
            <Button onClick={onGenerate}>⟳ GENERATE VERSION</Button>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button variant="ghost" onClick={onSurprise}>
                ✦ SURPRISE
              </Button>
              <Button variant="ghost" onClick={onSnapshot}>
                ＋ SNAPSHOT
              </Button>
            </div>
            <div className="mt-2 text-[11px] leading-relaxed text-text-faint">
              GENERATE reseeds the current motif into a new version and adds it to
              the session archive. SURPRISE also reshuffles motif + palette.
            </div>
          </Panel>

          {/* MOTIF */}
          <Panel title="MOTIF">
            <Seg
              value={settings.motif}
              onChange={(v) => patch({ motif: v })}
              options={[
                { label: "AUTO", value: "auto" },
                { label: "DOTS", value: "dot_gradient" },
                { label: "C/S", value: "circle_square" },
                { label: "BARS", value: "rhythmic_bars" },
                { label: "ARCS", value: "quarter_circles" },
              ]}
            />
            {settings.motif === "auto" && (
              <div className="mt-2 text-[11px] text-text-faint">
                seed selects → {resolveMotif(settings)}
              </div>
            )}
          </Panel>

          {/* PARAMETERS */}
          <Panel title="PARAMETERS">
            <Slider
              label="Density"
              value={settings.density}
              min={0.4}
              max={1.6}
              step={0.02}
              onChange={(v) => patch({ density: v })}
              fmt={(v) => `${Math.round(v * 100)}%`}
            />
            <Slider
              label="Scale"
              value={settings.scale}
              min={0.5}
              max={1.6}
              step={0.02}
              onChange={(v) => patch({ scale: v })}
              fmt={(v) => `${v.toFixed(2)}×`}
            />
            <div className="mt-1 text-[11px] leading-relaxed text-text-faint">
              Density and scale reshape the motif without changing the seed — the
              same id yields a family of versions.
            </div>
          </Panel>

          {/* COMPOSITION */}
          <Panel title="COMPOSITION" defaultOpen={false}>
            <div className="mb-2 text-[12px] text-text-dim">Format</div>
            <Seg
              value={settings.aspect}
              onChange={(v) => patch({ aspect: v })}
              options={[
                { label: "3:4", value: "3:4" },
                { label: "1:1", value: "1:1" },
                { label: "4:3", value: "4:3" },
              ]}
            />
            <div className="mt-3 mb-2 text-[12px] text-text-dim">Palette</div>
            <Seg
              value={settings.palette}
              onChange={(v) => patch({ palette: v })}
              options={[
                { label: "MONO", value: "mono" },
                { label: "INV", value: "invert" },
                { label: "BLUE", value: "blueprint" },
                { label: "RISO", value: "risograph" },
              ]}
            />
            <div className="mt-2">
              <Slider
                label="Margin"
                value={settings.margin}
                min={0}
                max={0.2}
                step={0.005}
                onChange={(v) => patch({ margin: v })}
                fmt={(v) => `${Math.round(v * 100)}%`}
              />
            </div>
            <Toggle
              label="Show grid"
              value={settings.showGrid}
              onChange={(v) => patch({ showGrid: v })}
            />
            <Toggle
              label="Plate caption"
              value={settings.showLabel}
              onChange={(v) => patch({ showLabel: v })}
            />
          </Panel>

          {/* SERIES */}
          <Panel title="SERIES" defaultOpen={false}>
            <div className="mb-2 text-[12px] text-text-dim">
              Series id <span className="text-text-faint">(the RNG seed)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="mono text-[12px] text-text-faint">pga-</span>
              <input
                value={settings.seriesId}
                inputMode="numeric"
                maxLength={8}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 8);
                  patch({ seriesId: v });
                }}
                className="mono flex-1 rounded-md border border-border-2 bg-panel-2 px-2 py-2 text-[13px] text-text outline-none focus:border-text-dim"
              />
            </div>
          </Panel>

          {/* EXPORT */}
          <Panel title="EXPORT" defaultOpen={false}>
            <Button onClick={onExport}>↓ PNG</Button>
            <div className="mt-2 text-[11px] text-text-faint">
              Renders at native print resolution.
            </div>
          </Panel>
        </>
      )}

      <div className="mt-auto border-t border-border px-4 py-4 text-[11px] leading-relaxed text-text-faint">
        Live port of{" "}
        <span className="mono text-text-dim">scripts/hofmann_studies.py</span> —
        Swiss modular grid, pure math, no diffusion.
      </div>
    </div>
  );
}
