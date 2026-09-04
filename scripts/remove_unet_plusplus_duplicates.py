#!/usr/bin/env python3
"""Remove duplicate unet-plusplus-random-noise models and migrate their results
to the canonical zhou2018unet_plusplus_denoise model.

The json0903 integration added:
  - unet-plusplus-random-noise
  - unet-plusplus-random-noise-avo

These duplicate the existing zhou2018unet_plusplus_denoise model. Their results
are migrated under the canonical model id; overlapping gaussian entries are
replaced with the newer values.
"""

from __future__ import annotations

import json
from pathlib import Path

DATA_DIR = Path("src/data")

DUPLICATE_IDS = {
    "unet-plusplus-random-noise",
    "unet-plusplus-random-noise-avo",
}
TARGET_ID = "zhou2018unet_plusplus_denoise"


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main():
    models = load_json(DATA_DIR / "models.json")
    benchmarks = load_json(DATA_DIR / "benchmarks.json")
    results = load_json(DATA_DIR / "results.json")

    target_model = next((m for m in models if m["id"] == TARGET_ID), None)
    if not target_model:
        raise ValueError(f"Target model {TARGET_ID} not found")

    # Build index keyed by benchmark_id for the duplicate model results
    duplicate_results = [r for r in results if r["model_id"] in DUPLICATE_IDS]
    target_index = {
        (r["model_id"], r["benchmark_id"]): r for r in results
    }

    migrated = 0
    replaced = 0
    for r in duplicate_results:
        benchmark_id = r["benchmark_id"]
        key = (TARGET_ID, benchmark_id)
        if key in target_index:
            existing = target_index[key]
            existing["scores"] = dict(r["scores"])
            existing["scores_std"] = dict(r.get("scores_std") or {})
            existing["date_added"] = r.get("date_added")
            replaced += 1
        else:
            new_r = {
                "model_id": TARGET_ID,
                "benchmark_id": benchmark_id,
                "scores": dict(r["scores"]),
                "scores_std": dict(r.get("scores_std") or {}),
                "paper_url": target_model.get("paper_url"),
                "code_url": target_model.get("code_url"),
                "date_added": r.get("date_added"),
            }
            results.append(new_r)
            target_index[key] = new_r
            migrated += 1

    # Remove duplicate results and models
    before_results = len(results)
    results = [r for r in results if r["model_id"] not in DUPLICATE_IDS]
    removed_results = before_results - len(results)

    before_models = len(models)
    models = [m for m in models if m["id"] not in DUPLICATE_IDS]
    removed_models = before_models - len(models)

    # Recalculate model_count for random_noise_suppression benchmarks
    counts = {}
    for r in results:
        counts.setdefault(r["benchmark_id"], set()).add(r["model_id"])
    for b in benchmarks:
        if b["task"] == "random_noise_suppression":
            b["model_count"] = len(counts.get(b["id"], set()))

    save_json(DATA_DIR / "models.json", models)
    save_json(DATA_DIR / "benchmarks.json", benchmarks)
    save_json(DATA_DIR / "results.json", results)

    print(f"Removed {removed_models} duplicate models and {removed_results} duplicate result entries.")
    print(f"Migrated {migrated} results to {TARGET_ID}, replaced {replaced} existing results.")


if __name__ == "__main__":
    main()
