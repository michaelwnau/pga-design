import { describe, expect, it } from "vitest";
import { MOTIF_NAMES } from "./motifs";
import { dimsFor, resolveMotif, swatchFor } from "./study";
import type { Settings } from "./types";

const base: Settings = {
  seriesId: "48291047",
  motif: "auto",
  palette: "mono",
  aspect: "3:4",
  margin: 0.08,
  density: 1,
  scale: 1,
  showGrid: false,
  showLabel: true,
};

describe("resolveMotif", () => {
  it("returns the explicit motif when one is set", () => {
    expect(resolveMotif({ ...base, motif: "rhythmic_bars" })).toBe("rhythmic_bars");
  });

  it("resolves 'auto' deterministically from the seed", () => {
    const a = resolveMotif(base);
    const b = resolveMotif(base);
    expect(a).toBe(b);
    expect(MOTIF_NAMES).toContain(a);
  });

  it("different seeds can select different motifs", () => {
    const picks = new Set(
      ["11111111", "22222222", "33333333", "44444444", "55555555"].map((id) =>
        resolveMotif({ ...base, seriesId: id }),
      ),
    );
    expect(picks.size).toBeGreaterThan(1);
  });
});

describe("dimsFor", () => {
  it("maps every aspect to a positive pixel size", () => {
    for (const a of ["3:4", "1:1", "4:3"] as const) {
      const [w, h] = dimsFor(a);
      expect(w).toBeGreaterThan(0);
      expect(h).toBeGreaterThan(0);
    }
  });

  it("orients portrait vs landscape correctly", () => {
    expect(dimsFor("3:4")[1]).toBeGreaterThan(dimsFor("3:4")[0]);
    expect(dimsFor("4:3")[0]).toBeGreaterThan(dimsFor("4:3")[1]);
    expect(dimsFor("1:1")[0]).toBe(dimsFor("1:1")[1]);
  });
});

describe("swatchFor", () => {
  it("gives distinct ink and paper for every palette", () => {
    for (const p of ["mono", "invert", "blueprint", "risograph"] as const) {
      const sw = swatchFor(p);
      expect(sw.ink).not.toBe(sw.paper);
    }
  });
});
