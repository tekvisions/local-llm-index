#!/usr/bin/env python3
"""Render og.png (1200x630) for The Local LLM Index — light blueprint card. Pillow only;
falls back gracefully if a font is missing."""
from __future__ import annotations

import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))


def _font(paths, size):
    from PIL import ImageFont
    for p in paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()


def main() -> int:
    try:
        from PIL import Image, ImageDraw
    except Exception:
        print("Pillow not available — skipping og.png")
        return 0
    try:
        data = json.load(open(os.path.join(HERE, "data.json"), encoding="utf-8"))
        count, cats = data.get("count", 0), len(data.get("categories", []))
    except Exception:
        count, cats = 0, 0

    W, H = 1200, 630
    bg, ink, blue, orange, muted = (234, 238, 244), (14, 26, 44), (31, 91, 255), (255, 106, 26), (81, 96, 122)
    img = Image.new("RGB", (W, H), bg)
    d = ImageDraw.Draw(img)
    for x in range(0, W, 32):
        d.line([(x, 0), (x, H)], fill=(220, 227, 238), width=1)
    for y in range(0, H, 32):
        d.line([(0, y), (W, y)], fill=(220, 227, 238), width=1)

    bold = ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/Library/Fonts/Arial Bold.ttf"]
    mono = ["/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
            "/System/Library/Fonts/Menlo.ttc", "/System/Library/Fonts/Monaco.ttf"]
    f_kick = _font(mono, 24)
    f_h1 = _font(bold, 86)
    f_stat = _font(mono, 28)

    d.rectangle([54, 64, 74, 84], outline=blue, width=2)
    d.text((92, 62), "THE LOCAL LLM INDEX", font=f_kick, fill=blue)
    d.text((60, 168), "Run the model on", font=f_h1, fill=ink)
    d.text((60, 268), "your", font=f_h1, fill=blue)
    w = d.textlength("your", font=f_h1)
    d.text((60 + w, 268), " hardware.", font=f_h1, fill=ink)
    # orange underline under "hardware."
    hx = 60 + w + d.textlength(" ", font=f_h1)
    d.line([hx, 360, hx + d.textlength("hardware.", font=f_h1), 360], fill=orange, width=6)

    d.line([60, 440, W - 60, 440], fill=(194, 205, 222), width=2)
    d.text((60, 468), f"{count} tools  ·  {cats} categories  ·  ranked daily by GitHub momentum",
           font=f_stat, fill=muted)
    img.save(os.path.join(HERE, "og.png"))
    print(f"wrote og.png ({count} tools)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
