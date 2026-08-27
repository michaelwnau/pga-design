[![Made for Claude Code](https://img.shields.io/badge/Made%20for-Claude%20Code-blueviolet?style=flat-square&logo=anthropic)](https://docs.anthropic.com/en/docs/claude-code)
[![Figma MCP](https://img.shields.io/badge/Figma-MCP%20Server-ff7262?style=flat-square&logo=figma)](https://www.npmjs.com/package/@anthropic-ai/figma-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Live on Vercel](https://img.shields.io/badge/Live-pga--design.vercel.app-000?style=flat-square&logo=vercel)](https://pga-design.vercel.app)

# Programmatic Graphic Design

Programmatic graphic design experiments in pure Python — no diffusion models,
no AI image generation. Every pixel comes from math, typography, and
pseudorandomness, rendered with Pillow and NumPy.

The design brief lives in [system-role.md](system-role.md): recreate high-end
experimental graphic design aesthetics (90s collage, Swiss Grid,
procedural art) using only code.

## Generators

### `scripts/chaotic_xerox.py` — punk collage

Chaotic Letraset-style typography run through a photocopier-degradation
pipeline: per-character offset, rotation, and size variation, cut-and-paste
collage masks, Gaussian scanner grit, and a harsh 1-bit threshold.

Characters that overlap previously placed ink invert — three modes, set via
`OVERLAP_MODE` in the config block:

- `"xor"` — only the overlapping region inverts (difference blend), keeping
  words legible while collision zones flicker
- `"char"` — the whole character flips when overlap exceeds a pixel threshold
- `"none"` — overlaps stack unchanged

Run it and you'll be prompted for the headline and sub-heading text
(press Enter to accept the defaults):

```
python scripts/chaotic_xerox.py
```

Output: `output/render_output.png`

### `scripts/hofmann_studies.py` — Swiss geometric studies

Generative studies after Armin Hofmann's *Graphic Design Manual* (1965).
Each run picks one motif from the Manual's exercise vocabulary and composes
it on a strict 12×16 modular grid:

- `dot_gradient` — dot matrix with radius modulated along a random axis
- `circle_square` — figure/ground tension between a dominant circle and a solid field
- `rhythmic_bars` — vertical bars in linear / geometric / pendulum width progressions
- `quarter_circles` — tiled quarter-circle arcs with random orientation

Every print gets a series label (`pga-` + eight-digit id) set small on the
bottom-left grid margin. **The id is the RNG seed**: the same id always
regenerates the identical composition. To reprint a specific piece, set
`SERIES_ID` at the top of the script.

```
python scripts/hofmann_studies.py
```

Output: `output/pga-<id>.png`

## Web studio

An interactive frontend lives alongside the Python generators — a live,
client-side port of `hofmann_studies.py`. Pick a motif (or let the series id
choose), set format, palette and margin, and export a print-resolution PNG.
The **Archive** view browses the curated prints in `output/`.

**Live: [pga-design.vercel.app](https://pga-design.vercel.app)**

```
bun install
bun run dev      # http://localhost:3000
```

The studio is a Next.js 16 + React 19 + Tailwind v4 app (Bun toolchain),
deployed on Vercel. Same series id always regenerates the same design, exactly
like the Python script.

```
src/app/          Next.js app router (layout, page, styles)
src/components/    Studio, ControlRail, CanvasStage, Gallery
src/lib/           seeded RNG, Swiss grid, motif renderers, tests
public/gallery/    archived prints
```

CI (`bun run lint`, `typecheck`, `test`, `build`) runs on every push and PR.
`main` is branch-protected: the `build` check must pass before any merge.
Dependabot raises grouped minor/patch updates that auto-merge once CI passes;
major bumps are held for one human review.

## Layout

```
scripts/   Python generators
output/    rendered prints
src/       web studio (Next.js)
```

## Requirements

Python 3.10+ with `Pillow` and `numpy`:

```
pip install Pillow numpy
```

Fonts: the scripts prefer Inter for labels and fall back to Segoe UI / Arial
if it isn't installed. Swap `FONT_PATH` in `chaotic_xerox.py` for a heavy
brutalist face for maximum effect.
