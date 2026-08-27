import { describe, expect, it } from "vitest";
import { Rng, hashSeed, randomSeriesId } from "./rng";

describe("Rng", () => {
  it("is deterministic for a given seed", () => {
    const a = new Rng("48291047");
    const b = new Rng("48291047");
    const seqA = Array.from({ length: 8 }, () => a.random());
    const seqB = Array.from({ length: 8 }, () => b.random());
    expect(seqA).toEqual(seqB);
  });

  it("produces different streams for different seeds", () => {
    const a = new Rng("00000001");
    const b = new Rng("00000002");
    expect(a.random()).not.toEqual(b.random());
  });

  it("keeps random() in [0, 1)", () => {
    const r = new Rng("seed");
    for (let i = 0; i < 1000; i++) {
      const v = r.random();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("randint is inclusive on both ends", () => {
    const r = new Rng("bounds");
    let lo = false;
    let hi = false;
    for (let i = 0; i < 2000; i++) {
      const v = r.randint(0, 3);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(3);
      if (v === 0) lo = true;
      if (v === 3) hi = true;
    }
    expect(lo && hi).toBe(true);
  });

  it("choice returns a member of the list", () => {
    const r = new Rng("pick");
    const items = ["a", "b", "c"] as const;
    for (let i = 0; i < 100; i++) {
      expect(items).toContain(r.choice(items));
    }
  });
});

describe("hashSeed", () => {
  it("is stable and returns an unsigned 32-bit int", () => {
    const h = hashSeed("48291047");
    expect(h).toBe(hashSeed("48291047"));
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(2 ** 32);
  });
});

describe("randomSeriesId", () => {
  it("is always eight digits", () => {
    expect(randomSeriesId(() => 0)).toBe("00000000");
    expect(randomSeriesId(() => 0.999999999)).toHaveLength(8);
    expect(randomSeriesId(() => 0.5)).toMatch(/^\d{8}$/);
  });
});
