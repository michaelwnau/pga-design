import { describe, expect, it } from "vitest";
import { SwissGrid } from "./grid";

describe("SwissGrid", () => {
  const grid = new SwissGrid(1200, 1600, 100, 12, 16);

  it("insets the drawable area by the margin on all sides", () => {
    expect(grid.x0).toBe(100);
    expect(grid.y0).toBe(100);
    expect(grid.w).toBe(1000);
    expect(grid.h).toBe(1400);
  });

  it("computes square-ish cells", () => {
    expect(grid.cellW).toBeCloseTo(1000 / 12);
    expect(grid.cellH).toBeCloseTo(1400 / 16);
  });

  it("cell(0,0) starts at the grid origin", () => {
    const c = grid.cell(0, 0);
    expect(c.x0).toBe(100);
    expect(c.y0).toBe(100);
  });

  it("spans multiple cells", () => {
    const c = grid.cell(2, 3, 4, 5);
    expect(c.x1 - c.x0).toBeCloseTo(4 * grid.cellW);
    expect(c.y1 - c.y0).toBeCloseTo(5 * grid.cellH);
  });

  it("the last cell reaches the far grid edge", () => {
    const c = grid.cell(11, 15);
    expect(c.x1).toBeCloseTo(grid.x0 + grid.w);
    expect(c.y1).toBeCloseTo(grid.y0 + grid.h);
  });
});
