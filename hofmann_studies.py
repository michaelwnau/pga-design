"""Generative studies after Armin Hofmann's Graphic Design Manual (1965).

Each run picks a pseudorandom eight-digit series id. That id seeds the
composition, so every output is unique but fully reproducible: re-running
with the same id regenerates the identical design. A series label
("pga-XXXXXXXX") is set in a small sans-serif on the bottom-left grid margin,
Swiss-style.

Motif vocabulary (drawn from the Manual's exercises):
  * dot_gradient    - dot matrix with radius modulated across the grid
  * circle_square   - tension study between a dominant circle and square field
  * rhythmic_bars   - vertical bars in a rhythmic width/interval progression
  * quarter_circles - tiled quarter-circle arcs flipping orientation
"""

import os
import random
from PIL import Image, ImageDraw, ImageFont

# ---------------------------------------------------------------------------
# PARAMETRIC DESIGN CONTROLS
# ---------------------------------------------------------------------------
CANVAS_W, CANVAS_H = 1200, 1600
MARGIN = 100                # outer margin, all four sides
GRID_COLS, GRID_ROWS = 12, 16  # modular grid inside the margins

BLACK = 0
WHITE = 255

LABEL_PREFIX = "pga-"
LABEL_FONT_SIZE = 28
LABEL_FONT_CANDIDATES = [
    "Inter-Regular.ttf",
    "Inter.ttf",
    os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\Windows\Fonts\Inter-Regular.ttf"),
    "segoeui.ttf",   # closest neutral grotesque shipped with Windows
    "arial.ttf",
]

OUTPUT_DIR = "."  # prints are saved here as pga-<id>.png

# Force a specific composition by setting SERIES_ID to an 8-digit string,
# e.g. SERIES_ID = "48291047". Leave as None for a new design each run.
SERIES_ID = None


def resolve_label_font(size):
    for candidate in LABEL_FONT_CANDIDATES:
        try:
            return ImageFont.truetype(candidate, size)
        except IOError:
            continue
    return ImageFont.load_default()


class SwissGrid:
    """Modular grid: converts (col, row) cell coordinates to pixel rects."""

    def __init__(self, width, height, margin, cols, rows):
        self.x0, self.y0 = margin, margin
        self.w = width - 2 * margin
        self.h = height - 2 * margin
        self.cols, self.rows = cols, rows
        self.cell_w = self.w / cols
        self.cell_h = self.h / rows

    def cell(self, col, row, span_c=1, span_r=1):
        """Pixel rect [x0, y0, x1, y1] for a cell block."""
        x0 = self.x0 + col * self.cell_w
        y0 = self.y0 + row * self.cell_h
        return [x0, y0, x0 + span_c * self.cell_w, y0 + span_r * self.cell_h]


# ---------------------------------------------------------------------------
# MOTIF GENERATORS
# Each receives (draw, grid, rng) and works purely in grid coordinates.
# ---------------------------------------------------------------------------

def motif_dot_gradient(draw, grid, rng):
    """Dot matrix, radius modulated along a random axis - the Manual's
    point studies where scale progression alone creates direction."""
    axis = rng.choice(["vertical", "horizontal", "diagonal", "radial"])
    invert = rng.random() < 0.5
    max_r = min(grid.cell_w, grid.cell_h) * rng.uniform(0.42, 0.5)
    min_r = max_r * rng.uniform(0.04, 0.15)

    for row in range(grid.rows):
        for col in range(grid.cols):
            if axis == "vertical":
                t = row / (grid.rows - 1)
            elif axis == "horizontal":
                t = col / (grid.cols - 1)
            elif axis == "diagonal":
                t = (row + col) / (grid.rows + grid.cols - 2)
            else:  # radial from grid center
                dc = (col - grid.cols / 2 + 0.5) / (grid.cols / 2)
                dr = (row - grid.rows / 2 + 0.5) / (grid.rows / 2)
                t = min(1.0, (dc * dc + dr * dr) ** 0.5)
            if invert:
                t = 1.0 - t
            r = min_r + t * (max_r - min_r)
            rect = grid.cell(col, row)
            cx = (rect[0] + rect[2]) / 2
            cy = (rect[1] + rect[3]) / 2
            draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=BLACK)


def motif_circle_square(draw, grid, rng):
    """Tension study: a field of solid squares with one dominant circle
    knocked out or overlaid, exploring figure/ground reversal."""
    # Solid square field over a random block of the grid
    field_cols = rng.randint(grid.cols // 2, grid.cols)
    field_rows = rng.randint(grid.rows // 2, grid.rows)
    field_col = rng.randint(0, grid.cols - field_cols)
    field_row = rng.randint(0, grid.rows - field_rows)
    field = grid.cell(field_col, field_row, field_cols, field_rows)
    draw.rectangle(field, fill=BLACK)

    # Dominant circle: diameter snapped to whole grid cells, placed so it
    # straddles the field edge for figure/ground tension.
    diam_cells = rng.randint(min(4, grid.cols // 2), min(8, grid.cols))
    diam = diam_cells * min(grid.cell_w, grid.cell_h)
    edge = rng.choice(["left", "right", "top", "bottom"])
    if edge == "left":
        cx, cy = field[0], rng.uniform(field[1] + diam / 2, field[3] - diam / 2)
    elif edge == "right":
        cx, cy = field[2], rng.uniform(field[1] + diam / 2, field[3] - diam / 2)
    elif edge == "top":
        cx, cy = rng.uniform(field[0] + diam / 2, field[2] - diam / 2), field[1]
    else:
        cx, cy = rng.uniform(field[0] + diam / 2, field[2] - diam / 2), field[3]

    # Keep the whole circle inside the grid area - margins stay clean
    cx = max(grid.x0 + diam / 2, min(grid.x0 + grid.w - diam / 2, cx))
    cy = max(grid.y0 + diam / 2, min(grid.y0 + grid.h - diam / 2, cy))

    # The half of the circle over black reads white, and vice versa:
    # draw white circle clipped by the field via two-tone painting.
    circle = [cx - diam / 2, cy - diam / 2, cx + diam / 2, cy + diam / 2]
    # Paint the circle white where it overlaps the field, black outside.
    # Achieved by drawing white circle, then re-drawing the outside-field
    # portion black using a mask intersection.
    mask = Image.new("L", (CANVAS_W, CANVAS_H), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.ellipse(circle, fill=255)
    field_mask = Image.new("L", (CANVAS_W, CANVAS_H), 0)
    ImageDraw.Draw(field_mask).rectangle(field, fill=255)

    from PIL import ImageChops
    inside = ImageChops.multiply(mask, field_mask)          # circle ∩ field -> white
    outside = ImageChops.subtract(mask, field_mask)         # circle - field -> black
    base = draw._image
    base.paste(WHITE, (0, 0), inside)
    base.paste(BLACK, (0, 0), outside)


def motif_rhythmic_bars(draw, grid, rng):
    """Vertical bars whose widths follow a rhythmic progression - the
    Manual's line studies of interval and tempo."""
    progression = rng.choice(["linear", "geometric", "pendulum"])
    n_bars = rng.randint(9, 18)
    top_row = rng.randint(0, 2)
    bottom_row = grid.rows - rng.randint(0, 2)
    y0 = grid.y0 + top_row * grid.cell_h
    y1 = grid.y0 + bottom_row * grid.cell_h

    # Build relative widths
    widths = []
    for i in range(n_bars):
        t = i / (n_bars - 1)
        if progression == "linear":
            w = 0.15 + t
        elif progression == "geometric":
            w = 1.28 ** i * 0.2
        else:  # pendulum: thick-thin-thick
            w = 0.2 + abs(t - 0.5) * 2
        widths.append(w)
    if rng.random() < 0.5:
        widths.reverse()

    # Normalize: bars + equal gaps fill the grid width
    gap = grid.cell_w * rng.uniform(0.25, 0.7)
    total_gap = gap * (n_bars - 1)
    scale = (grid.w - total_gap) / sum(widths)
    x = grid.x0
    for w in widths:
        bw = w * scale
        draw.rectangle([x, y0, x + bw, y1], fill=BLACK)
        x += bw + gap


def motif_quarter_circles(draw, grid, rng):
    """Tiled quarter-circle arcs with pseudorandom orientation flips -
    the Manual's studies of curved/straight combinatorics."""
    # Work on a coarser tiling so the arcs read as bold shapes
    tile_span = rng.choice([2, 3, 4])
    cols = grid.cols // tile_span
    rows = grid.rows // tile_span
    density = rng.uniform(0.55, 0.9)   # chance a tile is drawn at all

    for row in range(rows):
        for col in range(cols):
            if rng.random() > density:
                continue
            rect = grid.cell(col * tile_span, row * tile_span, tile_span, tile_span)
            x0, y0, x1, y1 = rect
            w, h = x1 - x0, y1 - y0
            corner = rng.randint(0, 3)
            # Pie slice = solid quarter circle anchored to one corner
            if corner == 0:    # top-left
                bbox = [x0 - w, y0 - h, x1, y1]
                start, end = 0, 90
            elif corner == 1:  # top-right
                bbox = [x0, y0 - h, x1 + w, y1]
                start, end = 90, 180
            elif corner == 2:  # bottom-right
                bbox = [x0, y0, x1 + w, y1 + h]
                start, end = 180, 270
            else:              # bottom-left
                bbox = [x0 - w, y0, x1, y1 + h]
                start, end = 270, 360
            draw.pieslice(bbox, start, end, fill=BLACK)


MOTIFS = {
    "dot_gradient": motif_dot_gradient,
    "circle_square": motif_circle_square,
    "rhythmic_bars": motif_rhythmic_bars,
    "quarter_circles": motif_quarter_circles,
}


def render_series_label(draw, grid, series_id, motif_name):
    """Series label on the bottom-left margin, flush with the grid's left
    edge - standard Swiss placement for plate captions."""
    font = resolve_label_font(LABEL_FONT_SIZE)
    label = f"{LABEL_PREFIX}{series_id}"
    x = grid.x0
    y = grid.y0 + grid.h + (MARGIN - LABEL_FONT_SIZE) / 2
    draw.text((x, y), label, fill=BLACK, font=font)

    # Motif name set right-aligned on the same baseline, smaller and grey -
    # a quiet second caption column, as in the Manual's plate layouts.
    small = resolve_label_font(int(LABEL_FONT_SIZE * 0.75))
    bbox = draw.textbbox((0, 0), motif_name, font=small)
    draw.text((grid.x0 + grid.w - (bbox[2] - bbox[0]), y + 4), motif_name,
              fill=120, font=small)


def generate_hofmann_study(output_filename=None, series_id=None):
    # The eight-digit id doubles as the RNG seed: same id -> same design.
    if series_id is None:
        series_id = f"{random.randint(0, 99999999):08d}"
    if output_filename is None:
        output_filename = os.path.join(OUTPUT_DIR, f"{LABEL_PREFIX}{series_id}.png")
    rng = random.Random(series_id)

    img = Image.new("L", (CANVAS_W, CANVAS_H), WHITE)
    draw = ImageDraw.Draw(img)
    draw._image = img  # let motifs that need mask compositing reach the image

    grid = SwissGrid(CANVAS_W, CANVAS_H, MARGIN, GRID_COLS, GRID_ROWS)

    motif_name = rng.choice(sorted(MOTIFS))
    MOTIFS[motif_name](draw, grid, rng)

    render_series_label(draw, grid, series_id, motif_name)

    img.save(output_filename)
    print(f"Success: study {LABEL_PREFIX}{series_id} ({motif_name}) saved to {output_filename}")
    return series_id


if __name__ == "__main__":
    generate_hofmann_study(series_id=SERIES_ID)
