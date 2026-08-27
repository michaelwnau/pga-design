// Modular grid, ported from the SwissGrid class in hofmann_studies.py.
// Converts (col, row) cell coordinates to pixel rects inside the margins.
export interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export class SwissGrid {
  readonly x0: number;
  readonly y0: number;
  readonly w: number;
  readonly h: number;
  readonly cellW: number;
  readonly cellH: number;

  constructor(
    width: number,
    height: number,
    margin: number,
    readonly cols: number,
    readonly rows: number,
  ) {
    this.x0 = margin;
    this.y0 = margin;
    this.w = width - 2 * margin;
    this.h = height - 2 * margin;
    this.cellW = this.w / cols;
    this.cellH = this.h / rows;
  }

  /** Pixel rect for a cell block spanning spanC×spanR cells. */
  cell(col: number, row: number, spanC = 1, spanR = 1): Rect {
    const x0 = this.x0 + col * this.cellW;
    const y0 = this.y0 + row * this.cellH;
    return { x0, y0, x1: x0 + spanC * this.cellW, y1: y0 + spanR * this.cellH };
  }
}
