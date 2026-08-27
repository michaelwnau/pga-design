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
