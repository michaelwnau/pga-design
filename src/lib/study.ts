// Composes a full Hofmann study onto a canvas context: background, chosen
// motif, and the Swiss-style plate caption. Pure given (ctx, dims, settings) —
// the same seriesId always paints the same design.
import { SwissGrid } from "./grid";
import { MOTIFS, MOTIF_NAMES } from "./motifs";
import { Rng } from "./rng";
import type { AspectId, ColorId, MotifName, Settings, Swatch } from "./types";

export const GRID_COLS = 12;
export const GRID_ROWS = 16;

// Hex for every selectable colour — neutrals plus bold primaries.
export const COLORS: Record<ColorId, string> = {
  paper: "#f4f2ec",
  white: "#ffffff",
  black: "#0a0a0a",
  red: "#e8291c",
  yellow: "#f4c400",
  blue: "#1a4cff",
};

const ASPECTS: Record<AspectId, [number, number]> = {
  "3:4": [1200, 1600],
  "1:1": [1400, 1400],
  "4:3": [1600, 1200],
};

export function colorHex(id: ColorId): string {
  return COLORS[id];
}

// Build the two-tone swatch from the chosen ink + paper. The grid-overlay
// accent stays red unless the ink is already red (then it flips to blue) so it
// always reads against the elements.
export function swatchFor(settings: Settings): Swatch {
  return {
    ink: COLORS[settings.ink],
    paper: COLORS[settings.paper],
    accent: settings.ink === "red" ? COLORS.blue : COLORS.red,
  };
}

export function dimsFor(aspect: AspectId): [number, number] {
  return ASPECTS[aspect];
}

/** Resolve "auto" to a concrete motif using the seed, as the Python does. */
export function resolveMotif(settings: Settings): MotifName {
  if (settings.motif !== "auto") return settings.motif;
  const rng = new Rng(settings.seriesId);
  return rng.choice(MOTIF_NAMES);
}

export function renderStudy(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: Settings,
) {
  const sw = swatchFor(settings);
  const rng = new Rng(settings.seriesId);

  // Ground.
  ctx.fillStyle = sw.paper;
  ctx.fillRect(0, 0, width, height);

  const margin = Math.round(Math.min(width, height) * settings.margin);
  const grid = new SwissGrid(width, height, margin, GRID_COLS, GRID_ROWS);

  // The motif is drawn from the same stream, so "auto" resolves identically
  // to resolveMotif() above.
  const motifName =
    settings.motif === "auto" ? rng.choice(MOTIF_NAMES) : settings.motif;

  if (settings.showGrid) drawGrid(ctx, grid, sw);

  MOTIFS[motifName](ctx, grid, rng, sw, {
    density: settings.density,
    scale: settings.scale,
  });

  if (settings.showLabel) drawLabel(ctx, grid, settings.seriesId, motifName, sw);
}

function drawGrid(ctx: CanvasRenderingContext2D, grid: SwissGrid, sw: Swatch) {
  ctx.save();
  ctx.strokeStyle = sw.accent;
  ctx.globalAlpha = 0.18;
  ctx.lineWidth = 1;
  for (let c = 0; c <= grid.cols; c++) {
    const x = grid.x0 + c * grid.cellW;
    ctx.beginPath();
    ctx.moveTo(x, grid.y0);
    ctx.lineTo(x, grid.y0 + grid.h);
    ctx.stroke();
  }
  for (let r = 0; r <= grid.rows; r++) {
    const y = grid.y0 + r * grid.cellH;
    ctx.beginPath();
    ctx.moveTo(grid.x0, y);
    ctx.lineTo(grid.x0 + grid.w, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  grid: SwissGrid,
  seriesId: string,
  motifName: string,
  sw: Swatch,
) {
  const size = Math.max(16, Math.round(grid.cellW * 0.42));
  const y = grid.y0 + grid.h + Math.max(24, (grid.y0 - size) / 2);
  ctx.save();
  ctx.textBaseline = "top";
  ctx.fillStyle = sw.ink;
  ctx.font = `500 ${size}px Inter, system-ui, sans-serif`;
  ctx.fillText(`pga-${seriesId}`, grid.x0, y);

  const small = Math.round(size * 0.75);
  ctx.font = `400 ${small}px "Geist Mono", ui-monospace, monospace`;
  ctx.globalAlpha = 0.55;
  const text = motifName;
  const w = ctx.measureText(text).width;
  ctx.fillText(text, grid.x0 + grid.w - w, y + 3);
  ctx.restore();
}
