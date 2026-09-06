#!/usr/bin/env python3
"""Normalize confused model ID/name variants to a single convention.

Fixes:
  - QUNet: q-unet-*/q_unet-* IDs and q_unet/QUNet names -> qunet-* IDs, "QUNet" name
  - unet_L-* (underscore + uppercase L) -> unet-L-*
  - res_unet-blending-* (underscore) -> res-unet-blending-*
  - resunet-* interpolation IDs -> res-unet-* for consistency with the rest
"""

from __future__ import annotations

import json
from pathlib import Path

DATA_DIR = Path("src/data")

ID_MAP = {
    # QUNet
    "q-unet-random-noise": "qunet-random-noise",
    "q-unet-random-noise-avo": "qunet-random-noise-avo",
    "q_unet-blending-noise": "qunet-blending-noise",
    "q_unet-blending-noise-avo": "qunet-blending-noise-avo",
    # unet_L -> unet-L
    "unet_L-blending-noise": "unet-L-blending-noise",
    "unet_L-blending-noise-avo": "unet-L-blending-noise-avo",
    "unet_L-random-noise": "unet-L-random-noise",
    "unet_L-random-noise-avo": "unet-L-random-noise-avo",
    # res_unet -> res-unet
    "res_unet-blending-noise": "res-unet-blending-noise",
    "res_unet-blending-noise-avo": "res-unet-blending-noise-avo",
    # resunet -> res-unet (interpolation family)
    "resunet-interpolation": "res-unet-interpolation",
    "resunet-L-interpolation": "res-unet-L-interpolation",
    "resunet-unpn-interpolation": "res-unet-unpn-interpolation",
    "avo-resunet-interpolation": "avo-res-unet-interpolation",
    "avo-resunet-L-interpolation": "avo-res-unet-L-interpolation",
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main():
    models = load_json(DATA_DIR / "models.json")
    benchmarks = load_json(DATA_DIR / "benchmarks.json")
    results = load_json(DATA_DIR / "results.json")

    renamed = 0
    for m in models:
        if m["id"] in ID_MAP:
            m["id"] = ID_MAP[m["id"]]
            renamed += 1
            if "qunet" in m["id"]:
                m["name"] = "QUNet"
                if "description" in m:
                    m["description"] = m["description"].replace("q_unet", "QUNet")

    for r in results:
        if r["model_id"] in ID_MAP:
            r["model_id"] = ID_MAP[r["model_id"]]

    counts = {}
    for r in results:
        counts.setdefault(r["benchmark_id"], set()).add(r["model_id"])
    for b in benchmarks:
        b["model_count"] = len(counts.get(b["id"], set()))

    save_json(DATA_DIR / "models.json", models)
    save_json(DATA_DIR / "benchmarks.json", benchmarks)
    save_json(DATA_DIR / "results.json", results)

    print(f"Renamed {renamed} models:")
    for old, new in ID_MAP.items():
        print(f"  {old} -> {new}")


if __name__ == "__main__":
    main()
