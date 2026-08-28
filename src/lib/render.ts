// Dispatch layer over the two generators so stages, thumbnails and export all
// render a Composition through one entry point.
import { dimsFor, renderStudy, resolveMotif } from "./study";
import { XEROX_DIMS, renderXerox } from "./xerox";
import type { Composition } from "./types";

export function dimsForComp(comp: Composition): [number, number] {
  return comp.kind === "hofmann" ? dimsFor(comp.settings.aspect) : XEROX_DIMS;
}

export function renderComp(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  comp: Composition,
) {
  if (comp.kind === "hofmann") renderStudy(ctx, w, h, comp.settings);
  else renderXerox(ctx, w, h, comp.settings);
}

// Short human label for archive captions.
export function compLabel(comp: Composition): string {
  if (comp.kind === "hofmann") return resolveMotif(comp.settings);
  const t = comp.settings.mainText.trim();
  return t ? `“${t.slice(0, 14)}”` : "xerox";
}

export function compSeriesId(comp: Composition): string {
  return comp.settings.seriesId;
}

// Render a composition to a fresh canvas at native resolution.
function renderToCanvas(comp: Composition): HTMLCanvasElement {
  const [w, h] = dimsForComp(comp);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (ctx) renderComp(ctx, w, h, comp);
  return canvas;
}

export function renderDataUrl(comp: Composition): string {
  return renderToCanvas(comp).toDataURL("image/png");
}

export function renderBlob(comp: Composition): Promise<Blob | null> {
  return new Promise((resolve) => {
    renderToCanvas(comp).toBlob((b) => resolve(b), "image/png");
  });
}
