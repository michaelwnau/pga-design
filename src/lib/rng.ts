// Deterministic seeded RNG. The eight-digit series id is hashed into a 32-bit
// seed, then mulberry32 produces the stream. Same id → same design, mirroring
// the Python generator's random.Random(series_id) contract (the number stream
// differs from CPython's Mersenne Twister, but reproducibility holds within
// this app, which is what makes a series id shareable).
export class Rng {
  private state: number;

  constructor(seed: string) {
    this.state = hashSeed(seed);
  }

  // mulberry32 — a compact, well-distributed 32-bit generator.
  private next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Float in [0, 1). */
  random(): number {
    return this.next();
  }

  /** Float in [min, max). */
  uniform(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Integer in [min, max], inclusive — matches Python's random.randint. */
  randint(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Uniformly pick one element. */
  choice<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)];
  }
}

export function hashSeed(seed: string): number {
  // FNV-1a 32-bit.
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** A fresh eight-digit series id, using the supplied [0,1) source. */
export function randomSeriesId(rand: () => number): string {
  return Math.floor(rand() * 100000000)
    .toString()
    .padStart(8, "0");
}
