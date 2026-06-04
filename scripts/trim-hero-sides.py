#!/usr/bin/env python3
"""Trim excess horizontal whitespace from Lizzy Fusion mannequin-hero images.

The generated heroes are landscape frames (typically 1536x1024) that contain a
vertical subject (mannequin + dress) floating in the middle of a near-uniform
studio backdrop. That leaves a lot of empty width on the left/right. This script
detects the subject, crops the excess side margins so the subject fills the
frame, and keeps a small, even, tasteful side padding while preserving the FULL
vertical extent (head to hem/feet/stand). Only width is trimmed.

Subject detection
  * RGBA images with real transparency  -> use the alpha bounding box.
  * Opaque studio images (white/grey bg) -> sample the border pixels for the
    background colour and find the content bounding box where pixels differ from
    the background beyond a tolerance.

Safety / reversibility
  * Only files matching ``lizzy-fusion-*-mannequin-*.png`` are touched.
  * ``-orig.png`` background backups and unrelated images are ignored.
  * Before first modifying a file, an untouched ``-prewidthtrim.png`` backup is
    written next to it. Re-runs always read from that backup, so the crop is
    deterministic and never compounds across runs (idempotent).
  * If a file is already tightly framed (side margins already small), it is left
    unchanged and no backup is created.
  * The main file is overwritten in place and the result is mirrored to every
    other input directory so the directories stay in sync.

Usage:
    python3 trim-hero-sides.py <dir-or-image> [<dir-or-image> ...]
    python3 trim-hero-sides.py --dry-run <dir>
    python3 trim-hero-sides.py --pad-frac 0.08 --tolerance 26 <dirA> <dirB>
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ORIG_SUFFIX = "-orig.png"
PRETRIM_SUFFIX = "-prewidthtrim.png"

# Tuned for Lizzy Fusion studio packshots (white or grey, sometimes gradient/
# vignette backdrops). Detection is by deviation from a heavily-blurred local
# background estimate (robust to smooth gradients) OR by chroma (catches a
# coloured garment that matches the background brightness).
RESIDUAL_TOL = 14  # min brightness deviation from blurred bg to count as subject
CHROMA_TOL = 22  # min colour spread (max-min RGB) to count as subject
BG_BLUR_RADIUS = 70  # gaussian radius for the smooth background estimate


def is_hero(name: str) -> bool:
    """Only Lizzy Fusion mannequin hero main files (not backups)."""
    return (
        name.startswith("lizzy-fusion-")
        and "-mannequin-" in name
        and name.endswith(".png")
        and not name.endswith(ORIG_SUFFIX)
        and not name.endswith(PRETRIM_SUFFIX)
    )


def _extent_from_columns(col_counts: np.ndarray, height: int) -> tuple[int, int] | None:
    """Pick the subject's left/right extent from per-column foreground counts.

    Uses a column-height threshold so that a thin full-width floor-shadow band
    (only a few rows tall) is rejected, while tall subject columns — including
    flared skirt tips — are kept.
    """
    peak = int(col_counts.max())
    if peak == 0:
        return None
    col_thr = max(0.07 * peak, 0.035 * height, 20.0)
    cols = np.where(col_counts >= col_thr)[0]
    if cols.size == 0:
        return None
    return int(cols[0]), int(cols[-1])


def subject_columns(img: Image.Image) -> tuple[int, int, int] | None:
    """Return (left, right, width) of the subject's horizontal extent.

    Returns None if no subject can be detected (treat as "leave alone").
    """
    width, height = img.size

    # --- Transparent images: use the alpha channel directly. ---
    if img.mode == "RGBA":
        alpha = np.asarray(img.getchannel("A"))
        if alpha.min() < 250:  # there is genuine transparency
            col_counts = (alpha > 16).sum(axis=0)
            extent = _extent_from_columns(col_counts, height)
            if extent is not None:
                return extent[0], extent[1], width

    # --- Opaque studio images (white/grey, possibly gradient backdrops). ---
    rgb = np.asarray(img.convert("RGB")).astype(np.float32)
    gray = rgb.mean(axis=2)
    # Smooth background estimate: a heavy blur flattens the subject into the
    # backdrop, so genuine subject pixels deviate from it even when the raw
    # backdrop has a vignette/gradient.
    blur = np.asarray(
        Image.fromarray(gray.astype(np.uint8)).filter(
            ImageFilter.GaussianBlur(radius=BG_BLUR_RADIUS)
        )
    ).astype(np.float32)
    residual = np.abs(gray - blur)
    chroma = rgb.max(axis=2) - rgb.min(axis=2)
    fg = (residual > RESIDUAL_TOL) | (chroma > CHROMA_TOL)
    col_counts = fg.sum(axis=0)
    extent = _extent_from_columns(col_counts, height)
    if extent is None:
        return None
    return extent[0], extent[1], width


def compute_crop(
    img: Image.Image, pad_frac: float, skip_margin_frac: float
) -> tuple[int, int] | None:
    """Return (new_left, new_right) inclusive column range, or None to skip.

    None means the image is already tightly framed (or has no detectable
    subject) and should be left unchanged.
    """
    found = subject_columns(img)
    if found is None:
        return None
    left, right, width = found
    subject_w = right - left + 1
    if subject_w <= 0:
        return None

    left_margin = left
    right_margin = (width - 1) - right
    # Already tight on both sides -> leave unchanged.
    if max(left_margin, right_margin) <= skip_margin_frac * subject_w:
        return None

    pad = int(round(pad_frac * subject_w))
    new_left = max(0, left - pad)
    new_right = min(width - 1, right + pad)
    if new_left == 0 and new_right == width - 1:
        return None  # nothing to trim
    return new_left, new_right


def gather_dirs(inputs: list[str]) -> tuple[list[Path], dict[str, list[Path]]]:
    """Return (dirs, filename -> list of hero paths across all dirs)."""
    dirs: list[Path] = []
    by_name: dict[str, list[Path]] = {}
    for raw in inputs:
        p = Path(raw).expanduser()
        if p.is_dir():
            dirs.append(p)
            for child in sorted(p.iterdir()):
                if child.is_file() and is_hero(child.name):
                    by_name.setdefault(child.name, []).append(child)
        elif p.is_file() and is_hero(p.name):
            if p.parent not in dirs:
                dirs.append(p.parent)
            by_name.setdefault(p.name, []).append(p)
        else:
            print(f"  ! skipping (not a hero file or dir): {p}")
    return dirs, by_name


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("inputs", nargs="+", help="hero image files and/or directories")
    parser.add_argument(
        "--pad-frac",
        type=float,
        default=0.08,
        help="side padding as a fraction of subject width (default: 0.08)",
    )
    parser.add_argument(
        "--skip-margin-frac",
        type=float,
        default=0.11,
        help="if both side margins are already <= this * subject width, skip "
        "(default: 0.11)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="report what would change without writing any files",
    )
    opts = parser.parse_args()

    dirs, by_name = gather_dirs(opts.inputs)
    if not by_name:
        print("No Lizzy Fusion mannequin hero files found.")
        return 1

    print(
        f"Scanning {len(by_name)} unique hero file(s) across "
        f"{len(dirs)} director(ies). pad={opts.pad_frac:.0%} "
        f"skip<= {opts.skip_margin_frac:.0%} of subject\n"
    )

    trimmed: list[dict] = []
    unchanged: list[str] = []

    for name in sorted(by_name):
        present = by_name[name]
        # Choose a deterministic source: prefer an existing -prewidthtrim backup
        # in any dir so re-runs never compound the crop.
        source: Path | None = None
        for path in present:
            backup = path.with_name(path.stem + PRETRIM_SUFFIX)
            if backup.exists():
                source = backup
                break
        if source is None:
            source = present[0]

        try:
            src_img = Image.open(source)
            src_img.load()
        except Exception as exc:
            print(f"- {name}\n    ! could not open source {source}: {exc}")
            continue

        crop = compute_crop(src_img, opts.pad_frac, opts.skip_margin_frac)
        orig_w, orig_h = src_img.size

        if crop is None:
            unchanged.append(name)
            print(f"- {name}\n    already tight / no subject -> unchanged ({orig_w}x{orig_h})")
            continue

        new_left, new_right = crop
        new_w = new_right - new_left + 1
        result = src_img.crop((new_left, 0, new_right + 1, orig_h))

        # Mirror to every directory: ensure the hero exists and is identical in
        # all input directories.
        targets: dict[Path, Path] = {}
        for d in dirs:
            targets[d / name] = (d / name).with_name(Path(name).stem + PRETRIM_SUFFIX)

        action = "DRY-RUN" if opts.dry_run else "trim"
        print(
            f"- {name}\n    {action}: {orig_w}x{orig_h} -> {new_w}x{orig_h} "
            f"(crop cols {new_left}..{new_right}, removed {orig_w - new_w}px width)"
        )

        if not opts.dry_run:
            for target, backup in targets.items():
                # Back up the current main file (once) before overwriting, so each
                # directory is independently reversible.
                if target.exists() and not backup.exists():
                    try:
                        Image.open(target).save(backup)
                    except Exception as exc:
                        print(f"    ! backup failed for {target}: {exc}")
                result.save(target, format="PNG")

        trimmed.append(
            {
                "name": name,
                "orig": (orig_w, orig_h),
                "new": (new_w, orig_h),
                "dirs": len(targets),
            }
        )

    print("\nSummary")
    print(f"  trimmed   : {len(trimmed)}")
    print(f"  unchanged : {len(unchanged)}")
    if trimmed:
        print("\n  Before -> After (width x height):")
        for r in trimmed:
            print(
                f"    {r['orig'][0]}x{r['orig'][1]} -> {r['new'][0]}x{r['new'][1]}"
                f"   ({r['dirs']} dirs)  {r['name']}"
            )
    print(
        f"\nDone{' (dry-run, nothing written)' if opts.dry_run else ''}: "
        f"{len(trimmed)} trimmed, {len(unchanged)} unchanged."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
