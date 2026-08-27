// Motif vocabulary, ported from scripts/hofmann_studies.py. Each id maps to a
// canvas motif renderer in lib/motifs.ts.
export type MotifName =
  | "dot_gradient"
  | "circle_square"
  | "rhythmic_bars"
  | "quarter_circles";

// "auto" lets the seed pick the motif, matching the Python generator's
// rng.choice(sorted(MOTIFS)) behaviour.
export type MotifChoice = MotifName | "auto";

export type Palette = "mono" | "invert" | "blueprint" | "risograph";

export type AspectId = "3:4" | "1:1" | "4:3";

export interface Settings {
  // Eight-digit series id — doubles as the RNG seed (same id → same design).
  seriesId: string;
  motif: MotifChoice;
  palette: Palette;
  aspect: AspectId;
  margin: number; // outer margin as a fraction of the short edge (0–0.2)
  density: number; // element count / coverage multiplier (0.4–1.6)
  scale: number; // element size multiplier (0.5–1.6)
  showGrid: boolean;
  showLabel: boolean;
}

// Per-render knobs threaded into every motif so a locked motif can still be
// pushed into many distinct versions without changing the seed.
export interface MotifParams {
  density: number;
  scale: number;
}

export type OverlapMode = "xor" | "char" | "none";

// Chaotic Xerox (Ray Gun) generator — text-driven, ported from
// scripts/chaotic_xerox.py.
export interface XeroxSettings {
  seriesId: string;
  mainText: string;
  subText: string;
  mainSize: number; // headline base px
  subSize: number; // sub-heading base px
  sizeVar: number; // ± size fraction per glyph (0–0.6)
  rotation: number; // max abs rotation in degrees
  jitter: number; // max per-glyph offset px
  packing: number; // advance multiplier (<1 overlaps, >1 gaps)
  overlap: OverlapMode;
  overlapThreshold: number; // px, "char" mode only
  masks: number; // collage rectangle count
  maskInvert: boolean; // knock text through masks (visible, inverted) vs cover
  grit: number; // Gaussian noise scale
  threshold: number; // 1-bit cutoff 0–255
}

// A composition is one of the two generators, tagged for dispatch.
export type Composition =
  | { kind: "hofmann"; settings: Settings }
  | { kind: "xerox"; settings: XeroxSettings };

export type GeneratorKind = Composition["kind"];

export interface Swatch {
  ink: string;
  paper: string;
  accent: string;
}
