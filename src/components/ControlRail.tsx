"use client";

import type {
  GeneratorKind,
  OverlapMode,
  Settings,
  XeroxSettings,
} from "@/lib/types";
import { resolveMotif } from "@/lib/study";
import { Button, Panel, Seg, Slider, Toggle } from "./ui";

type Mode = "studio" | "archive";

export function ControlRail({
  mode,
  setMode,
  generator,
  setGenerator,
  hof,
  setHof,
  xer,
  setXer,
  archiveCount,
  onGenerate,
  onSurprise,
  onSnapshot,
  onExport,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
  generator: GeneratorKind;
  setGenerator: (g: GeneratorKind) => void;
  hof: Settings;
  setHof: React.Dispatch<React.SetStateAction<Settings>>;
  xer: XeroxSettings;
  setXer: React.Dispatch<React.SetStateAction<XeroxSettings>>;
  archiveCount: number;
  onGenerate: () => void;
  onSurprise: () => void;
  onSnapshot: () => void;
  onExport: () => void;
}) {
  const patchHof = (p: Partial<Settings>) => setHof((s) => ({ ...s, ...p }));
  const patchXer = (p: Partial<XeroxSettings>) => setXer((s) => ({ ...s, ...p }));

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
            { label: `ARCHIVE${archiveCount ? ` · ${archiveCount}` : ""}`, value: "archive" },
          ]}
        />
      </Panel>

      {mode === "studio" && (
        <>
          {/* GENERATOR */}
          <Panel title="GENERATOR">
            <Seg<GeneratorKind>
              value={generator}
              onChange={setGenerator}
              options={[
                { label: "HOFMANN", value: "hofmann" },
                { label: "XEROX", value: "xerox" },
              ]}
            />
          </Panel>

          {/* GENERATE actions */}
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
              GENERATE reseeds a new version into the session archive. SURPRISE
              also reshuffles the look.
            </div>
          </Panel>

          {generator === "hofmann" ? (
            <HofmannControls hof={hof} patch={patchHof} />
          ) : (
            <XeroxControls xer={xer} patch={patchXer} />
          )}

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
        Pure math, no diffusion.
      </div>
    </div>
  );
}

function HofmannControls({
  hof,
  patch,
}: {
  hof: Settings;
  patch: (p: Partial<Settings>) => void;
}) {
  return (
    <>
      {/* MOTIF */}
      <Panel title="MOTIF">
        <Seg
          value={hof.motif}
          onChange={(v) => patch({ motif: v })}
          options={[
            { label: "AUTO", value: "auto" },
            { label: "DOTS", value: "dot_gradient" },
            { label: "C/S", value: "circle_square" },
            { label: "BARS", value: "rhythmic_bars" },
            { label: "ARCS", value: "quarter_circles" },
          ]}
        />
        {hof.motif === "auto" && (
          <div className="mt-2 text-[11px] text-text-faint">
            seed selects → {resolveMotif(hof)}
          </div>
        )}
      </Panel>

      {/* PARAMETERS */}
      <Panel title="PARAMETERS">
        <Slider
          label="Density"
          value={hof.density}
          min={0.4}
          max={1.6}
          step={0.02}
          onChange={(v) => patch({ density: v })}
          fmt={(v) => `${Math.round(v * 100)}%`}
        />
        <Slider
          label="Scale"
          value={hof.scale}
          min={0.5}
          max={1.6}
          step={0.02}
          onChange={(v) => patch({ scale: v })}
          fmt={(v) => `${v.toFixed(2)}×`}
        />
        <div className="mt-1 text-[11px] leading-relaxed text-text-faint">
          Density and scale reshape the motif without changing the seed.
        </div>
      </Panel>

      {/* COMPOSITION */}
      <Panel title="COMPOSITION" defaultOpen={false}>
        <div className="mb-2 text-[12px] text-text-dim">Format</div>
        <Seg
          value={hof.aspect}
          onChange={(v) => patch({ aspect: v })}
          options={[
            { label: "3:4", value: "3:4" },
            { label: "1:1", value: "1:1" },
            { label: "4:3", value: "4:3" },
          ]}
        />
        <div className="mt-3 mb-2 text-[12px] text-text-dim">Palette</div>
        <Seg
          value={hof.palette}
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
            value={hof.margin}
            min={0}
            max={0.2}
            step={0.005}
            onChange={(v) => patch({ margin: v })}
            fmt={(v) => `${Math.round(v * 100)}%`}
          />
        </div>
        <Toggle label="Show grid" value={hof.showGrid} onChange={(v) => patch({ showGrid: v })} />
        <Toggle
          label="Plate caption"
          value={hof.showLabel}
          onChange={(v) => patch({ showLabel: v })}
        />
      </Panel>

      {/* SERIES */}
      <Panel title="SERIES" defaultOpen={false}>
        <SeedInput value={hof.seriesId} onChange={(v) => patch({ seriesId: v })} />
      </Panel>
    </>
  );
}

function XeroxControls({
  xer,
  patch,
}: {
  xer: XeroxSettings;
  patch: (p: Partial<XeroxSettings>) => void;
}) {
  return (
    <>
      {/* TEXT */}
      <Panel title="TEXT">
        <div className="mb-1 text-[12px] text-text-dim">Headline</div>
        <input
          value={xer.mainText}
          maxLength={20}
          aria-label="Headline text"
          onChange={(e) => patch({ mainText: e.target.value })}
          className="mb-3 w-full rounded-md border border-border-2 bg-panel-2 px-2 py-2 text-[15px] font-semibold text-text outline-none focus:border-text-dim"
        />
        <div className="mb-1 text-[12px] text-text-dim">Sub-heading</div>
        <input
          aria-label="Sub-heading text"
          value={xer.subText}
          maxLength={24}
          onChange={(e) => patch({ subText: e.target.value })}
          className="w-full rounded-md border border-border-2 bg-panel-2 px-2 py-2 text-[13px] text-text outline-none focus:border-text-dim"
        />
        <div className="mt-3">
          <Slider label="Headline size" value={xer.mainSize} min={120} max={460} onChange={(v) => patch({ mainSize: v })} unit="px" />
          <Slider label="Sub size" value={xer.subSize} min={80} max={300} onChange={(v) => patch({ subSize: v })} unit="px" />
        </div>
      </Panel>

      {/* LETRASET */}
      <Panel title="LETRASET">
        <Slider label="Rotation" value={xer.rotation} min={0} max={25} onChange={(v) => patch({ rotation: v })} unit="°" />
        <Slider label="Jitter" value={xer.jitter} min={0} max={40} onChange={(v) => patch({ jitter: v })} unit="px" />
        <Slider label="Size variation" value={xer.sizeVar} min={0} max={0.6} step={0.02} onChange={(v) => patch({ sizeVar: v })} fmt={(v) => `±${Math.round(v * 100)}%`} />
        <Slider label="Packing" value={xer.packing} min={0.6} max={1.3} step={0.01} onChange={(v) => patch({ packing: v })} fmt={(v) => `${v.toFixed(2)}×`} />
        <div className="mt-2 mb-2 text-[12px] text-text-dim">Overlap invert</div>
        <Seg<OverlapMode>
          value={xer.overlap}
          onChange={(v) => patch({ overlap: v })}
          options={[
            { label: "XOR", value: "xor" },
            { label: "CHAR", value: "char" },
            { label: "NONE", value: "none" },
          ]}
        />
      </Panel>

      {/* XEROX */}
      <Panel title="XEROX">
        <Slider label="Collage masks" value={xer.masks} min={0} max={16} onChange={(v) => patch({ masks: v })} />
        <Toggle
          label="Text knocks through masks"
          value={xer.maskInvert}
          onChange={(v) => patch({ maskInvert: v })}
        />
        <Slider label="Grit" value={xer.grit} min={0} max={80} onChange={(v) => patch({ grit: v })} />
        <Slider label="Threshold" value={xer.threshold} min={60} max={220} onChange={(v) => patch({ threshold: v })} />
      </Panel>

      {/* SERIES */}
      <Panel title="SERIES" defaultOpen={false}>
        <SeedInput value={xer.seriesId} onChange={(v) => patch({ seriesId: v })} />
      </Panel>
    </>
  );
}

function SeedInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <>
      <div className="mb-2 text-[12px] text-text-dim">
        Series id <span className="text-text-faint">(the RNG seed)</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="mono text-[12px] text-text-faint">pga-</span>
        <input
          value={value}
          inputMode="numeric"
          maxLength={8}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 8))}
          className="mono flex-1 rounded-md border border-border-2 bg-panel-2 px-2 py-2 text-[13px] text-text outline-none focus:border-text-dim"
        />
      </div>
    </>
  );
}
