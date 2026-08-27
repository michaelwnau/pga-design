// Canvas port of scripts/chaotic_xerox.py — the Ray Gun / punk headline
// generator. Characters are placed one at a time with per-glyph size, offset
// and rotation (hand-cut Letraset), overlapping ink inverts, random collage
// masks chop the field, then a Gaussian-grit + hard-threshold pass snaps
// everything to 1-bit xerox. Seeded by seriesId so a design is reproducible.
import { Rng } from "./rng";
import type { XeroxSettings } from "./types";

export const XEROX_DIMS: [number, number] = [1200, 1600];

// Box–Muller Gaussian from a seeded uniform source.
function gaussian(rng: Rng): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng.random();
  while (v === 0) v = rng.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

interface Layer {
  text: string;
  baseSize: number;
  x: number;
  y: number;
  packing: number;
  fill: number; // 0–255 grey
}

function drawLayer(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  ink: Uint8Array,
  rng: Rng,
  x: XeroxSettings,
  layer: Layer,
) {
  let penX = layer.x;
  const penY = layer.y;

  for (const ch of layer.text) {
    const mult = rng.uniform(1 - x.sizeVar, 1 + x.sizeVar);
    const size = Math.max(1, Math.round(layer.baseSize * mult));
    const font = `800 ${size}px Inter, system-ui, sans-serif`;

    ctx.font = font;
    const measured = ch.trim() ? ctx.measureText(ch).width : size * 0.4;

    // Render the glyph alpha onto a padded, rotated tile.
    const pad = Math.round(size * 0.6);
    const tileSize = Math.ceil(size * 1.8 + pad);
    const tile = document.createElement("canvas");
    tile.width = tileSize;
    tile.height = tileSize;
    const tctx = tile.getContext("2d");
    if (!tctx) continue;
    const angle = (rng.uniform(-x.rotation, x.rotation) * Math.PI) / 180;
    tctx.translate(tileSize / 2, tileSize / 2);
    tctx.rotate(angle);
    tctx.font = font;
    tctx.textAlign = "center";
    tctx.textBaseline = "middle";
    tctx.fillStyle = "#fff";
    tctx.fillText(ch, 0, 0);

    const tileData = tctx.getImageData(0, 0, tileSize, tileSize).data;

    const offX = rng.randint(-x.jitter, x.jitter);
    const offY = rng.randint(-x.jitter, x.jitter);
    // Place the tile centre near the pen position + a glyph's half-height.
    const pasteX = Math.round(penX + measured / 2 + offX - tileSize / 2);
    const pasteY = Math.round(penY + size / 2 + offY - tileSize / 2);

    // Clip the paste region to the canvas.
    const rx = Math.max(0, pasteX);
    const ry = Math.max(0, pasteY);
    const rx1 = Math.min(W, pasteX + tileSize);
    const ry1 = Math.min(H, pasteY + tileSize);
    const rw = rx1 - rx;
    const rh = ry1 - ry;
    if (rw <= 0 || rh <= 0) {
      penX += measured * layer.packing;
      continue;
    }

    // "char" mode needs the total overlap before painting.
    let charFill = layer.fill;
    if (x.overlap === "char") {
      let overlapPx = 0;
      for (let j = 0; j < rh; j++) {
        for (let i = 0; i < rw; i++) {
          const tIdx = ((ry + j - pasteY) * tileSize + (rx + i - pasteX)) * 4 + 3;
          if (tileData[tIdx] > 20 && ink[(ry + j) * W + (rx + i)]) overlapPx++;
        }
      }
      if (overlapPx > x.overlapThreshold) charFill = 255 - layer.fill;
    }

    const region = ctx.getImageData(rx, ry, rw, rh);
    const rd = region.data;
    for (let j = 0; j < rh; j++) {
      for (let i = 0; i < rw; i++) {
        const gx = rx + i;
        const gy = ry + j;
        const a = tileData[((gy - pasteY) * tileSize + (gx - pasteX)) * 4 + 3];
        if (a <= 20) continue;
        const rIdx = (j * rw + i) * 4;
        const inked = ink[gy * W + gx];
        if (x.overlap === "xor" && inked) {
          // Invert whatever is already there in the overlap zone.
          rd[rIdx] = 255 - rd[rIdx];
          rd[rIdx + 1] = 255 - rd[rIdx + 1];
          rd[rIdx + 2] = 255 - rd[rIdx + 2];
        } else {
          rd[rIdx] = charFill;
          rd[rIdx + 1] = charFill;
          rd[rIdx + 2] = charFill;
        }
        rd[rIdx + 3] = 255;
        ink[gy * W + gx] = 255;
      }
    }
    ctx.putImageData(region, rx, ry);

    penX += measured * layer.packing;
  }
}

export function renderXerox(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  x: XeroxSettings,
) {
  const rng = new Rng(x.seriesId);

  // Off-white ground.
  ctx.fillStyle = "rgb(240,240,240)";
  ctx.fillRect(0, 0, W, H);

  const ink = new Uint8Array(W * H);

  drawLayer(ctx, W, H, ink, rng, x, {
    text: x.mainText || " ",
    baseSize: x.mainSize,
    x: 120,
    y: 160,
    packing: x.packing,
    fill: 0,
  });
  drawLayer(ctx, W, H, ink, rng, x, {
    text: x.subText || " ",
    baseSize: x.subSize,
    x: 160,
    y: 520,
    packing: x.packing + 0.1,
    fill: 50,
  });

  // Cut-and-paste collage masks: high-contrast black/white blocks.
  for (let i = 0; i < x.masks; i++) {
    const mw = rng.randint(100, 600);
    const mh = rng.randint(50, 300);
    const mx = rng.randint(-50, W - Math.floor(mw / 2));
    const my = rng.randint(400, H - mh);
    ctx.fillStyle = rng.random() < 0.5 ? "#000" : "#fff";
    ctx.fillRect(mx, my, mw, mh);
  }

  // Xerox degradation: grayscale → Gaussian grit → hard 1-bit threshold.
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const noisy = gray + gaussian(rng) * x.grit;
    const v = noisy > x.threshold ? 255 : 0;
    d[i] = v;
    d[i + 1] = v;
    d[i + 2] = v;
    d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}
