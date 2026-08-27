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
  showGrid: boolean;
  showLabel: boolean;
}

export interface Swatch {
  ink: string;
  paper: string;
  accent: string;
}
