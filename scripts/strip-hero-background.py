#!/usr/bin/env python3
"""Strip the background from Lizzy Fusion mannequin-hero images.

GenerateImage cannot be relied upon to emit a true alpha channel; it usually
paints a flat near-white / grey backdrop. This post-processing step turns the
generated heroes into genuine transparent PNGs (RGBA with real alpha).

Primary method: rembg (U^2-Net) subject cutout — high quality for a
mannequin + dress packshot.
Fallback method: a Pillow border flood-fill that converts the near-uniform
background colour to transparent (tolerance based), preserving the subject.

The script:
  * accepts one or more image paths and/or directories,
  * OVERWRITES each input in place with the transparent PNG (same filename) so
    the canonical Downloads copies become transparent,
  * keeps an untouched backup next to it with the suffix ``-orig.png``,
  * is idempotent — re-runs always operate on the ``-orig.png`` backup so the
    subject never degrades across repeated runs,
  * verifies the output has a real alpha channel with a meaningful number of
    fully-transparent pixels and prints a per-file transparency report.

Usage:
    python3 strip-hero-background.py <image-or-dir> [<image-or-dir> ...]
    python3 strip-hero-background.py --method floodfill <image>
    python3 strip-hero-background.py --tolerance 28 <dir>
"""

from __future__ import annotations

import argparse
import os
import sys
from collections import deque
from pathlib import Path

from PIL import Image

ORIG_SUFFIX = "-orig.png"
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp"}

# Cache a single rembg session so repeated files don't reload the model.
_REMBG_SESSION = None
_REMBG_TRIED = False


def _get_rembg_session():
    """Return a cached rembg session, or None if rembg is unavailable."""
    global _REMBG_SESSION, _REMBG_TRIED
    if _REMBG_TRIED:
        return _REMBG_SESSION
    _REMBG_TRIED = True
    try:
        from rembg import new_session  # type: ignore

        _REMBG_SESSION = new_session("u2net")
    except Exception as exc:  # pragma: no cover - depends on environment
        print(f"  ! rembg unavailable ({exc}); will use flood-fill fallback")
        _REMBG_SESSION = None
    return _REMBG_SESSION


def remove_bg_rembg(img: Image.Image) -> Image.Image | None:
    """High-quality U^2-Net cutout. Returns RGBA image or None on failure."""
    session = _get_rembg_session()
    if session is None:
        return None
    try:
        from rembg import remove  # type: ignore

        out = remove(
            img.convert("RGBA"),
            session=session,
            post_process_mask=True,
        )
        return out.convert("RGBA")
    except Exception as exc:  # pragma: no cover - depends on environment
        print(f"  ! rembg.remove failed ({exc}); falling back to flood-fill")
        return None


def remove_bg_floodfill(img: Image.Image, tolerance: int = 30) -> Image.Image:
    """Flood-fill from the image borders, clearing the near-uniform backdrop.

    Only pixels connected to the border whose colour is within ``tolerance`` of
    the sampled corner background become transparent, so an interior region of
    the subject that happens to match the background colour is preserved.
    """
    img = img.convert("RGBA")
    width, height = img.size
    px = img.load()

    # Sample background colour from the four corners (median-ish via average).
    corners = [
        px[0, 0],
        px[width - 1, 0],
        px[0, height - 1],
        px[width - 1, height - 1],
    ]
    bg_r = sum(c[0] for c in corners) // 4
    bg_g = sum(c[1] for c in corners) // 4
    bg_b = sum(c[2] for c in corners) // 4

    tol_sq = tolerance * tolerance * 3
    visited = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def matches_bg(x: int, y: int) -> bool:
        r, g, b, _ = px[x, y]
        dr, dg, db = r - bg_r, g - bg_g, b - bg_b
        return (dr * dr + dg * dg + db * db) <= tol_sq

    for x in range(width):
        for y in (0, height - 1):
            idx = y * width + x
            if not visited[idx] and matches_bg(x, y):
                visited[idx] = 1
                queue.append((x, y))
    for y in range(height):
        for x in (0, width - 1):
            idx = y * width + x
            if not visited[idx] and matches_bg(x, y):
                visited[idx] = 1
                queue.append((x, y))

    while queue:
        x, y = queue.popleft()
        px[x, y] = (px[x, y][0], px[x, y][1], px[x, y][2], 0)
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < width and 0 <= ny < height:
                idx = ny * width + nx
                if not visited[idx] and matches_bg(nx, ny):
                    visited[idx] = 1
                    queue.append((nx, ny))

    return img


def alpha_stats(img: Image.Image) -> tuple[float, float]:
    """Return (% fully transparent, % at least partially transparent)."""
    if img.mode != "RGBA":
        return 0.0, 0.0
    alpha = img.getchannel("A")
    total = alpha.width * alpha.height
    if total == 0:
        return 0.0, 0.0
    hist = alpha.histogram()
    fully_transparent = hist[0]
    non_opaque = total - hist[255]
    return 100.0 * fully_transparent / total, 100.0 * non_opaque / total


def source_for(path: Path) -> Path:
    """Return the backup-or-self path that processing should read from."""
    backup = path.with_name(path.stem + ORIG_SUFFIX)
    return backup if backup.exists() else path


def process_file(path: Path, method: str, tolerance: int) -> dict | None:
    if path.name.endswith(ORIG_SUFFIX):
        return None  # never process a backup as if it were an input
    if path.suffix.lower() not in IMAGE_EXTS:
        return None

    backup = path.with_name(path.stem + ORIG_SUFFIX)
    src = source_for(path)

    try:
        original = Image.open(src).convert("RGBA")
    except Exception as exc:
        print(f"  ! could not open {src}: {exc}")
        return None

    # Make the untouched backup once (from the first, still-original file).
    if not backup.exists():
        Image.open(path).save(backup)

    result: Image.Image | None = None
    used = method
    if method in ("auto", "rembg"):
        result = remove_bg_rembg(original)
        if result is not None:
            used = "rembg"
    if result is None:
        result = remove_bg_floodfill(original, tolerance=tolerance)
        used = "floodfill"

    result.save(path, format="PNG")
    full_pct, any_pct = alpha_stats(result)
    return {
        "path": path,
        "backup": backup,
        "method": used,
        "full_pct": full_pct,
        "any_pct": any_pct,
        "size": result.size,
    }


def collect_inputs(args: list[str]) -> list[Path]:
    files: list[Path] = []
    for raw in args:
        p = Path(raw).expanduser()
        if p.is_dir():
            for child in sorted(p.iterdir()):
                if (
                    child.is_file()
                    and child.suffix.lower() in IMAGE_EXTS
                    and not child.name.endswith(ORIG_SUFFIX)
                ):
                    files.append(child)
        elif p.is_file():
            files.append(p)
        else:
            print(f"  ! skipping (not found): {p}")
    return files


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("inputs", nargs="+", help="image files and/or directories")
    parser.add_argument(
        "--method",
        choices=["auto", "rembg", "floodfill"],
        default="auto",
        help="background-removal method (default: auto = rembg, then flood-fill)",
    )
    parser.add_argument(
        "--tolerance",
        type=int,
        default=30,
        help="flood-fill colour tolerance per channel (default: 30)",
    )
    parser.add_argument(
        "--min-transparent",
        type=float,
        default=2.0,
        help="warn if fully-transparent %% is below this threshold (default: 2.0)",
    )
    opts = parser.parse_args()

    files = collect_inputs(opts.inputs)
    if not files:
        print("No image files to process.")
        return 1

    print(f"Processing {len(files)} image(s) with method='{opts.method}'\n")
    reports = []
    for path in files:
        print(f"- {path.name}")
        report = process_file(path, opts.method, opts.tolerance)
        if report is None:
            print("    skipped")
            continue
        reports.append(report)
        flag = "" if report["full_pct"] >= opts.min_transparent else "  <-- LOW, review"
        print(
            f"    method={report['method']}  size={report['size'][0]}x{report['size'][1]}  "
            f"transparent={report['full_pct']:.1f}%  (any-alpha={report['any_pct']:.1f}%){flag}"
        )

    print("\nSummary")
    low = [r for r in reports if r["full_pct"] < opts.min_transparent]
    for r in reports:
        print(f"  {r['full_pct']:5.1f}%  {r['method']:9s}  {r['path'].name}")
    if low:
        print(
            f"\n{len(low)} image(s) below {opts.min_transparent}% transparency — "
            "verify these manually:"
        )
        for r in low:
            print(f"  - {r['path'].name} ({r['full_pct']:.1f}%)")
    print(f"\nDone: {len(reports)} processed, {len(low)} need review.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
