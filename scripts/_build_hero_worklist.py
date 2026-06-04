#!/usr/bin/env python3
"""Build a reconciled worklist for regenerating Lizzy Fusion mannequin heroes.

Combines:
  - unique hero basenames present in the Downloads canonical folder
  - filename -> original dress reference mapping extracted from agent transcripts

Outputs scripts/regenerate-heroes-worklist.json
"""
import json, os, re, glob

DOWNLOADS = "/Users/user/Downloads/Pictures/Lizzy Fusion"
ASSETS = "/Users/user/.cursor/projects/Users-user-Projects-lizzy-fusion/assets"
TRANSCRIPTS = "/Users/user/.cursor/projects/Users-user-Projects-lizzy-fusion/agent-transcripts"
OUT = "/Users/user/Projects/lizzy-fusion/scripts/regenerate-heroes-worklist.json"

# ---- 1. extract filename -> reference basename mapping from transcripts ----
def walk(content, out):
    if isinstance(content, dict):
        if content.get("type") == "tool_use" and content.get("name") == "GenerateImage":
            inp = content.get("input", {}) or {}
            fn = inp.get("filename")
            refs = inp.get("reference_image_paths")
            if fn and "mannequin" in str(fn):
                out.append((fn, refs))
        for v in content.values():
            walk(v, out)
    elif isinstance(content, list):
        for v in content:
            walk(v, out)

results = []
for path in glob.glob(os.path.join(TRANSCRIPTS, "**", "*.jsonl"), recursive=True):
    try:
        with open(path) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                except Exception:
                    continue
                walk(obj, results)
    except Exception:
        pass

fn2ref = {}
for fn, refs in results:
    if refs:
        fn2ref[fn] = [os.path.abspath(r) for r in refs]

# ---- 2. unique hero basenames in Downloads ----
heroes = []
for p in sorted(glob.glob(os.path.join(DOWNLOADS, "lizzy-fusion-*-mannequin-*.png"))):
    b = os.path.basename(p)
    if b.endswith("-orig.png") or b.endswith("-prewidthtrim.png"):
        continue
    heroes.append(b)

# ---- 3. group by "slug" (strip trailing -<timestamp>.png) to detect dup timestamps ----
def slug_of(b):
    return re.sub(r"-\d{8}-\d{6}\.png$", "", b)

def ts_of(b):
    m = re.search(r"-(\d{8}-\d{6})\.png$", b)
    return m.group(1) if m else ""

by_slug = {}
for b in heroes:
    by_slug.setdefault(slug_of(b), []).append(b)

def layout_of(slug):
    if "dual" in slug:
        return "dual"
    if "adult-child" in slug or "adult-short-child" in slug:
        return "dual-adult-child"
    if slug.endswith("-child") or "-child-" in slug:
        return "child-single"
    return "single"

worklist = []
for slug, variants in sorted(by_slug.items()):
    variants_sorted = sorted(variants, key=ts_of)
    latest = variants_sorted[-1]
    superseded = variants_sorted[:-1]
    # reference: try latest, then any variant that has a ref
    ref = fn2ref.get(latest)
    if not ref:
        for v in variants_sorted:
            if fn2ref.get(v):
                ref = fn2ref[v]
                break
    # was the latest already regenerated today at ~11:00 (the prior partial run)?
    already_fresh = ts_of(latest).startswith("20260603-11")
    ref_exists = bool(ref) and all(os.path.exists(r) for r in (ref or []))
    worklist.append({
        "slug": slug,
        "latest_basename": latest,
        "superseded": superseded,
        "layout": layout_of(slug),
        "reference": ref,
        "reference_exists": ref_exists,
        "already_fresh": already_fresh,
    })

with open(OUT, "w") as f:
    json.dump({"heroes": worklist}, f, indent=2)

need = [w for w in worklist if not w["already_fresh"]]
no_ref = [w for w in worklist if not w["reference_exists"]]
print(f"unique slugs: {len(worklist)}")
print(f"already fresh (11:00 run): {len(worklist)-len(need)}")
print(f"need regeneration: {len(need)}")
print(f"missing/unresolved reference: {len(no_ref)}")
for w in no_ref:
    print("  NO REF:", w["slug"])
print("\n--- need regeneration (alphabetical) ---")
for w in need:
    r = os.path.basename(w["reference"][0]) if w["reference"] else "(NO REF)"
    print(f"  [{w['layout']}] {w['slug']}  <-  {r}")
