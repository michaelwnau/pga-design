// Canvas ports of the four motif generators in hofmann_studies.py. Each works
// in pixel space from a SwissGrid and draws with a two-tone ink/paper swatch.
import type { SwissGrid } from "./grid";
import type { Rng } from "./rng";
import type { MotifName, Swatch } from "./types";

type Ctx = CanvasRenderingContext2D;

function motifDotGradient(ctx: Ctx, grid: SwissGrid, rng: Rng, sw: Swatch) {
  // Dot matrix, radius modulated along a random axis — scale progression alone
  // creates direction (the Manual's point studies).
  const axis = rng.choice(["vertical", "horizontal", "diagonal", "radial"] as const);
  const invert = rng.random() < 0.5;
  const maxR = Math.min(grid.cellW, grid.cellH) * rng.uniform(0.42, 0.5);
  const minR = maxR * rng.uniform(0.04, 0.15);

  ctx.fillStyle = sw.ink;
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      let t: number;
      if (axis === "vertical") t = row / (grid.rows - 1);
      else if (axis === "horizontal") t = col / (grid.cols - 1);
      else if (axis === "diagonal") t = (row + col) / (grid.rows + grid.cols - 2);
      else {
        const dc = (col - grid.cols / 2 + 0.5) / (grid.cols / 2);
        const dr = (row - grid.rows / 2 + 0.5) / (grid.rows / 2);
        t = Math.min(1, Math.hypot(dc, dr));
      }
      if (invert) t = 1 - t;
      const r = minR + t * (maxR - minR);
      const rect = grid.cell(col, row);
      const cx = (rect.x0 + rect.x1) / 2;
      const cy = (rect.y0 + rect.y1) / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function motifCircleSquare(ctx: Ctx, grid: SwissGrid, rng: Rng, sw: Swatch) {
  // Figure/ground tension: a solid square field with a dominant circle
  // straddling its edge, so the circle reads paper over ink and ink over paper.
  const fieldCols = rng.randint(Math.floor(grid.cols / 2), grid.cols);
  const fieldRows = rng.randint(Math.floor(grid.rows / 2), grid.rows);
  const fieldCol = rng.randint(0, grid.cols - fieldCols);
  const fieldRow = rng.randint(0, grid.rows - fieldRows);
  const field = grid.cell(fieldCol, fieldRow, fieldCols, fieldRows);

  ctx.fillStyle = sw.ink;
  ctx.fillRect(field.x0, field.y0, field.x1 - field.x0, field.y1 - field.y0);

  const diamCells = rng.randint(
    Math.min(4, Math.floor(grid.cols / 2)),
    Math.min(8, grid.cols),
  );
  const diam = diamCells * Math.min(grid.cellW, grid.cellH);
  const edge = rng.choice(["left", "right", "top", "bottom"] as const);
  let cx: number;
  let cy: number;
  if (edge === "left") {
    cx = field.x0;
    cy = rng.uniform(field.y0 + diam / 2, field.y1 - diam / 2);
  } else if (edge === "right") {
    cx = field.x1;
    cy = rng.uniform(field.y0 + diam / 2, field.y1 - diam / 2);
  } else if (edge === "top") {
    cx = rng.uniform(field.x0 + diam / 2, field.x1 - diam / 2);
    cy = field.y0;
  } else {
    cx = rng.uniform(field.x0 + diam / 2, field.x1 - diam / 2);
    cy = field.y1;
  }

  // Keep the whole circle inside the grid area — margins stay clean.
  cx = Math.max(grid.x0 + diam / 2, Math.min(grid.x0 + grid.w - diam / 2, cx));
  cy = Math.max(grid.y0 + diam / 2, Math.min(grid.y0 + grid.h - diam / 2, cy));

  // Clip to the circle, then paint: outside-field → ink, inside-field → paper.
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, diam / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = sw.ink;
  ctx.fillRect(cx - diam / 2, cy - diam / 2, diam, diam);
  ctx.fillStyle = sw.paper;
  ctx.fillRect(field.x0, field.y0, field.x1 - field.x0, field.y1 - field.y0);
  ctx.restore();
}

function motifRhythmicBars(ctx: Ctx, grid: SwissGrid, rng: Rng, sw: Swatch) {
  // Vertical bars whose widths follow a rhythmic progression — interval and
  // tempo, the Manual's line studies.
  const progression = rng.choice(["linear", "geometric", "pendulum"] as const);
  const nBars = rng.randint(9, 18);
  const topRow = rng.randint(0, 2);
  const bottomRow = grid.rows - rng.randint(0, 2);
  const y0 = grid.y0 + topRow * grid.cellH;
  const y1 = grid.y0 + bottomRow * grid.cellH;

  const widths: number[] = [];
  for (let i = 0; i < nBars; i++) {
    const t = i / (nBars - 1);
    let w: number;
    if (progression === "linear") w = 0.15 + t;
    else if (progression === "geometric") w = 1.28 ** i * 0.2;
    else w = 0.2 + Math.abs(t - 0.5) * 2;
    widths.push(w);
  }
  if (rng.random() < 0.5) widths.reverse();

  const gap = grid.cellW * rng.uniform(0.25, 0.7);
  const totalGap = gap * (nBars - 1);
  const sum = widths.reduce((a, b) => a + b, 0);
  const scale = (grid.w - totalGap) / sum;

  ctx.fillStyle = sw.ink;
  let x = grid.x0;
  for (const w of widths) {
    const bw = w * scale;
    ctx.fillRect(x, y0, bw, y1 - y0);
    x += bw + gap;
  }
}

function motifQuarterCircles(ctx: Ctx, grid: SwissGrid, rng: Rng, sw: Swatch) {
  // Tiled quarter-circle arcs with pseudorandom orientation flips — the
  // Manual's curved/straight combinatorics.
  const tileSpan = rng.choice([2, 3, 4] as const);
  const cols = Math.floor(grid.cols / tileSpan);
  const rows = Math.floor(grid.rows / tileSpan);
  const density = rng.uniform(0.55, 0.9);

  ctx.fillStyle = sw.ink;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (rng.random() > density) continue;
      const rect = grid.cell(col * tileSpan, row * tileSpan, tileSpan, tileSpan);
      const { x0, y0, x1, y1 } = rect;
      const w = x1 - x0;
      const corner = rng.randint(0, 3);
      // Anchor a solid quarter-disc to one corner of the tile.
      let ax: number;
      let ay: number;
      let start: number;
      if (corner === 0) {
        ax = x1;
        ay = y1;
        start = Math.PI;
      } else if (corner === 1) {
        ax = x0;
        ay = y1;
        start = Math.PI * 1.5;
      } else if (corner === 2) {
        ax = x0;
        ay = y0;
        start = 0;
      } else {
        ax = x1;
        ay = y0;
        start = Math.PI * 0.5;
      }
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.arc(ax, ay, w, start, start + Math.PI / 2);
      ctx.closePath();
      ctx.fill();
    }
  }
}

export const MOTIFS: Record<
  MotifName,
  (ctx: Ctx, grid: SwissGrid, rng: Rng, sw: Swatch) => void
> = {
  circle_square: motifCircleSquare,
  dot_gradient: motifDotGradient,
  quarter_circles: motifQuarterCircles,
  rhythmic_bars: motifRhythmicBars,
};

// Sorted keys, matching the Python generator's rng.choice(sorted(MOTIFS)).
export const MOTIF_NAMES = Object.keys(MOTIFS).sort() as MotifName[];
