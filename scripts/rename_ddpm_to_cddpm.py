#!/usr/bin/env python3
"""Unify DDPM / cDDPM model naming to cDDPM.

Renames model IDs and names:
  conditional-ddpm-groundroll -> cddpm-groundroll
  ddpm-random-noise           -> cddpm-random-noise
  ddpm-blending-noise         -> cddpm-blending-noise
  ddpm-blending-noise-avo     -> cddpm-blending-noise-avo
  ddpm-random-noise-avo       -> cddpm-random-noise-avo

All display names become "cDDPM". Updates results.json references and
recalculates model_count.
"""

from __future__ import annotations

import json
from pathlib import Path

DATA_DIR = Path("src/data")

ID_MAP = {
    "conditional-ddpm-groundroll": "cddpm-groundroll",
    "ddpm-random-noise": "cddpm-random-noise",
    "ddpm-blending-noise": "cddpm-blending-noise",
    "ddpm-blending-noise-avo": "cddpm-blending-noise-avo",
    "ddpm-random-noise-avo": "cddpm-random-noise-avo",
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
            m["name"] = "cDDPM"
            if "description" in m:
                m["description"] = m["description"].replace("DDPM", "cDDPM")
            renamed += 1

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
