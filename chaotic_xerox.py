import os
import random
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# ---------------------------------------------------------------------------
# PARAMETRIC DESIGN CONTROLS
# Tweak these to dial the chaos up or down without touching render logic.
# ---------------------------------------------------------------------------
FONT_PATH = "arial.ttf"  # swap for a local heavy/brutalist font file when available

MAIN_TEXT = "HERO"
MAIN_FONT_SIZE = 300
MAIN_START_POS = (150, 150)
MAIN_PACKING = 0.95  # * measured glyph width; <1.0 = deliberate overlap, >1.0 = gaps
MAIN_OFFSET_X_RANGE = (0, 0)
MAIN_OFFSET_Y_RANGE = (0, 0)
MAIN_ROTATION_RANGE = (0, 0)   # degrees, per hand-cut Letraset spec
MAIN_SIZE_VARIATION = (0.25, .25)  # multiplier applied to MAIN_FONT_SIZE per char

SUB_TEXT = "section"
SUB_FONT_SIZE = 100
SUB_START_POS = (200, 500)
SUB_PACKING = 1.05
SUB_OFFSET_X_RANGE = (0, 0)
SUB_OFFSET_Y_RANGE = (0, 0)
SUB_ROTATION_RANGE = (0, 0)
SUB_SIZE_VARIATION = (0.25, 0.25)


def render_distorted_text(img, text, font_path, base_size, start_pos, packing,
                           offset_x_range, offset_y_range, rotation_range, size_variation,
                           fill):
    """Draw text character-by-character with randomized offset, rotation, and
    size to simulate hand-placed Letraset. Each glyph is rendered on its own
    transparent layer so it can be rotated independently, then alpha-composited
    onto the base image. Advance is measured per-glyph so size variation
    doesn't collapse the word into an illegible pile."""
    x, y = start_pos
    for char in text:
        size = max(1, int(base_size * random.uniform(*size_variation)))
        try:
            font = ImageFont.truetype(font_path, size)
        except IOError:
            font = ImageFont.load_default()

        bbox = font.getbbox(char)
        char_width = bbox[2] - bbox[0] if char.strip() else size * 0.4

        # Render the glyph onto a padded transparent tile so rotation has
        # room to expand without clipping.
        pad = size
        tile = Image.new("RGBA", (size * 2 + pad, size * 2 + pad), (0, 0, 0, 0))
        tile_draw = ImageDraw.Draw(tile)
        tile_draw.text((pad // 2, pad // 2), char, fill=fill, font=font)

        angle = random.uniform(*rotation_range)
        rotated = tile.rotate(angle, resample=Image.BICUBIC, expand=True)

        offset_x = random.randint(*offset_x_range)
        offset_y = random.randint(*offset_y_range)
        img.paste(rotated, (int(x) + offset_x - pad // 2, y + offset_y - pad // 2), rotated)

        x += char_width * packing


def generate_chaotic_xerox(output_filename="render_output.png", main_text=MAIN_TEXT, sub_text=SUB_TEXT):
    # 1. Canvas Setup
    width, height = 1200, 1600
    # Start with a slightly off-white background
    img = Image.new('RGB', (width, height), (240, 240, 240))
    draw = ImageDraw.Draw(img)

    if not os.path.exists(FONT_PATH):
        try:
            ImageFont.truetype(FONT_PATH, 10)
        except IOError:
            print(f"Warning: {FONT_PATH} not found by name, PIL will fall back to default if it can't resolve it via system font search.")

    # 2. Chaotic Typography Generation
    render_distorted_text(
        img, main_text, FONT_PATH, MAIN_FONT_SIZE, MAIN_START_POS, MAIN_PACKING,
        MAIN_OFFSET_X_RANGE, MAIN_OFFSET_Y_RANGE, MAIN_ROTATION_RANGE, MAIN_SIZE_VARIATION,
        fill=(0, 0, 0, 255),
    )

    # Add a chaotic sub-heading
    render_distorted_text(
        img, sub_text, FONT_PATH, SUB_FONT_SIZE, SUB_START_POS, SUB_PACKING,
        SUB_OFFSET_X_RANGE, SUB_OFFSET_Y_RANGE, SUB_ROTATION_RANGE, SUB_SIZE_VARIATION,
        fill=(50, 50, 50, 255),
    )

    # 4. Obfuscation Masks (Cut & Paste Collage emulation)
    for _ in range(8):
        mask_w = random.randint(100, 600)
        mask_h = random.randint(50, 300)
        mask_x = random.randint(-50, width - int(mask_w / 2))
        mask_y = random.randint(400, height - mask_h)
        # Randomly choose black or white for high contrast overlap
        fill_color = random.choice([(0, 0, 0), (255, 255, 255)])
        draw.rectangle([mask_x, mask_y, mask_x + mask_w, mask_y + mask_h], fill=fill_color)

    # 5. The Xerox Degradation Effect
    # Convert image to grayscale array
    gray = img.convert("L")
    gray_arr = np.array(gray, dtype=np.float32)

    # Inject heavy Gaussian noise to simulate cheap scanner grit
    noise = np.random.normal(loc=0, scale=40, size=gray_arr.shape)
    noisy_arr = np.clip(gray_arr + noise, 0, 255)

    # Apply harsh binary threshold (snaps everything to pure black or pure white)
    threshold_value = 140
    xerox_arr = np.where(noisy_arr > threshold_value, 255, 0).astype(np.uint8)

    # 6. Save Output
    final_img = Image.fromarray(xerox_arr, mode="L")
    final_img.save(output_filename)
    print(f"Success: Chaotic xerox design generated at {output_filename}")

if __name__ == "__main__":
    main_input = input(f"Main headline text [{MAIN_TEXT}]: ").strip()
    sub_input = input(f"Sub-heading text [{SUB_TEXT}]: ").strip()

    generate_chaotic_xerox(
        main_text=main_input or MAIN_TEXT,
        sub_text=sub_input or SUB_TEXT,
    )
