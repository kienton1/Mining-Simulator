from __future__ import annotations

import json
import re
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "assets" / "ui" / "miners"
DATABASE_PATH = ROOT / "src" / "Miner" / "MinerDatabase.ts"

SCALE = 8  # 16x16 -> 128x128
GRID = 16

RARITY_COLORS = {
    "Common": ("#b0b0b0", "#7a7a7a"),
    "Rare": ("#4aa3df", "#2e86de"),
    "Epic": ("#b084f5", "#8e44ad"),
    "Legendary": ("#f7d36a", "#f1c40f"),
    "Mythic": ("#f39c5a", "#e67e22"),
    "Exotic": ("#f26d6d", "#e74c3c"),
}


def parse_miners(path: Path) -> list[dict]:
    content = path.read_text(encoding="utf-8")
    miners = []
    pattern = re.compile(
        r"tier:\s*(\d+),\s*name:\s*'([^']+)'[\s\S]*?rarity:\s*'([^']+)'",
        re.MULTILINE,
    )
    for match in pattern.finditer(content):
        miners.append(
            {"tier": int(match.group(1)), "name": match.group(2), "rarity": match.group(3)}
        )
    return sorted(miners, key=lambda m: m["tier"])


def draw_pixel(draw: ImageDraw.ImageDraw, x: int, y: int, color: str) -> None:
    draw.rectangle([x, y, x, y], fill=color)


def draw_icon(rarity: str, seed: int) -> Image.Image:
    base, accent = RARITY_COLORS.get(rarity, RARITY_COLORS["Common"])
    img = Image.new("RGBA", (GRID, GRID), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background frame (subtle)
    frame = "#1c1f24"
    for x in range(GRID):
        draw_pixel(draw, x, 0, frame)
        draw_pixel(draw, x, GRID - 1, frame)
    for y in range(GRID):
        draw_pixel(draw, 0, y, frame)
        draw_pixel(draw, GRID - 1, y, frame)

    # Helmet
    for y in range(2, 7):
        for x in range(3, 13):
            draw_pixel(draw, x, y, base)

    # Helmet brim
    for x in range(4, 12):
        draw_pixel(draw, x, 7, accent)

    # Face
    skin = "#f2c9a0" if seed % 2 == 0 else "#e3b58a"
    for y in range(8, 12):
        for x in range(4, 12):
            draw_pixel(draw, x, y, skin)

    # Eyes
    eye = "#2b2b2b"
    draw_pixel(draw, 6, 9, eye)
    draw_pixel(draw, 9, 9, eye)

    # Mouth
    draw_pixel(draw, 7, 11, "#7a4b3a")
    draw_pixel(draw, 8, 11, "#7a4b3a")

    # Pickaxe handle (diagonal)
    handle = "#8b5a2b"
    for i in range(5):
        draw_pixel(draw, 10 + i, 10 + i, handle)

    # Pickaxe head
    for x in range(12, 15):
        draw_pixel(draw, x, 9, accent)
        draw_pixel(draw, x, 10, accent)

    # Accent stripe
    if seed % 3 == 0:
        for x in range(5, 11):
            draw_pixel(draw, x, 4, accent)

    return img.resize((GRID * SCALE, GRID * SCALE), Image.Resampling.NEAREST)


def main() -> None:
    miners = parse_miners(DATABASE_PATH)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for miner in miners:
        tier = miner["tier"]
        rarity = miner["rarity"]
        icon = draw_icon(rarity, tier)
        output = OUTPUT_DIR / f"tier-{tier}.png"
        icon.save(output)
        print(f"wrote {output}")

    manifest = {
        "size": GRID * SCALE,
        "count": len(miners),
        "path": "assets/ui/miners",
    }
    (OUTPUT_DIR / "manifest.json").write_text(
        json.dumps(manifest, indent=2), encoding="utf-8"
    )


if __name__ == "__main__":
    main()
