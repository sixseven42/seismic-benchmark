#!/usr/bin/env python3
"""Rename models with a `-plus` suffix to `-L` (large version).

This standardizes model IDs/names like:
  - unet-plus-groundroll          -> unet-L-groundroll
  - attention-unet-plus-multiples -> attention-unet-L-multiples
  - unet-first-break-plus         -> unet-first-break-L
  - dncnn-plus-interpolation      -> dncnn-L-interpolation

Legitimate UNet++ models (ids containing `plusplus`) are left unchanged.
"""

from __future__ import annotations

import json
from pathlib import Path

DATA_DIR = Path("src/data")


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def new_id_for(old_id: str) -> str | None:
    # Keep legitimate UNet++ models untouched.
    if "plusplus" in old_id:
        return None
    if "-plus-" in old_id or old_id.endswith("-plus"):
        return old_id.replace("-plus-", "-L-").replace("-plus", "-L")
    return None


def update_name(name: str) -> str:
    name = name.replace("UNet++", "UNet-L")
    name = name.replace("ResUNet++", "ResUNet-L")
    name = name.replace("Attention UNet++", "Attention UNet-L")
    # "UNet Plus" -> "UNet-L", "Attention UNet Plus" -> "Attention UNet-L"
    import re
    name = re.sub(r"\s+Plus$", "-L", name)
    name = name.replace("-Plus", "-L")
    return name


def update_description(text: str) -> str:
    text = text.replace("U-Net++", "U-Net-L")
    text = text.replace("U-Net-Plus", "U-Net-L")
    text = text.replace("UNet-Plus", "UNet-L")
    text = text.replace("UNet Plus", "UNet-L")
    text = text.replace("Attention UNet Plus", "Attention UNet-L")
    text = text.replace("ResUNet Plus", "ResUNet-L")
    text = text.replace("Attention UNet-Plus", "Attention UNet-L")
    text = text.replace("ResUNet-Plus", "ResUNet-L")
    text = text.replace("DnCNN-Plus", "DnCNN-L")
    return text


def main():
    models = load_json(DATA_DIR / "models.json")
    benchmarks = load_json(DATA_DIR / "benchmarks.json")
    results = load_json(DATA_DIR / "results.json")

    id_map = {}
    renamed = 0
    for m in models:
        new = new_id_for(m["id"])
        if new:
            id_map[m["id"]] = new
            m["id"] = new
            m["name"] = update_name(m["name"])
            if "description" in m:
                m["description"] = update_description(m["description"])
            renamed += 1

    # Update result model_ids
    for r in results:
        if r["model_id"] in id_map:
            r["model_id"] = id_map[r["model_id"]]

    # Recalculate model_count from actual results
    counts = {}
    for r in results:
        counts.setdefault(r["benchmark_id"], set()).add(r["model_id"])
    for b in benchmarks:
        b["model_count"] = len(counts.get(b["id"], set()))

    save_json(DATA_DIR / "models.json", models)
    save_json(DATA_DIR / "benchmarks.json", benchmarks)
    save_json(DATA_DIR / "results.json", results)

    print(f"Renamed {renamed} models:")
    for old, new in sorted(id_map.items()):
        print(f"  {old} -> {new}")


if __name__ == "__main__":
    main()
