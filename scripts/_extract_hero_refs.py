#!/usr/bin/env python3
"""Extract GenerateImage filename -> reference_image_paths from agent transcripts."""
import json, os, glob, sys

ROOT = "/Users/user/.cursor/projects/Users-user-Projects-lizzy-fusion/agent-transcripts"

def walk_content(content, out):
    if isinstance(content, dict):
        if content.get("type") == "tool_use" and content.get("name") == "GenerateImage":
            inp = content.get("input", {}) or {}
            fn = inp.get("filename")
            refs = inp.get("reference_image_paths")
            if fn and "mannequin" in str(fn):
                out.append((fn, refs))
        for v in content.values():
            walk_content(v, out)
    elif isinstance(content, list):
        for v in content:
            walk_content(v, out)

results = []
for path in glob.glob(os.path.join(ROOT, "**", "*.jsonl"), recursive=True):
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
                walk_content(obj, results)
    except Exception as e:
        print(f"ERR {path}: {e}", file=sys.stderr)

# dedupe, keep last occurrence per filename
mapping = {}
for fn, refs in results:
    mapping[fn] = refs

for fn in sorted(mapping):
    refs = mapping[fn]
    refstr = ", ".join(os.path.basename(r) for r in refs) if refs else "(none)"
    print(f"{fn}\t{refstr}")

print(f"\nTOTAL unique filenames: {len(mapping)}", file=sys.stderr)
