#!/usr/bin/env python3
"""Remove Transformer v9 models and all their results.

Removes:
  - gated_transformer_v9
  - gated_transformer_v9_interpolation

Deletes 21 result entries across the SEGC3 and Mobile AVO interpolation
benchmarks and recalculates model_count for affected benchmarks.
"""

from __future__ import annotations

import json
from pathlib import Path

DATA_DIR = Path("src/data")

MODEL_IDS = {
    "gated_transformer_v9",
    "gated_transformer_v9_interpolation",
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main():
    models = load_json(DATA_DIR / "models.json")
    benchmarks = load_json(DATA_DIR / "benchmarks.json")
    results = load_json(DATA_DIR / "results.json")

    removed_results = [r for r in results if r["model_id"] in MODEL_IDS]
    affected_benchmark_ids = {r["benchmark_id"] for r in removed_results}

    results = [r for r in results if r["model_id"] not in MODEL_IDS]
    removed_models = [m for m in models if m["id"] in MODEL_IDS]
    models = [m for m in models if m["id"] not in MODEL_IDS]

    counts = {}
    for r in results:
        counts.setdefault(r["benchmark_id"], set()).add(r["model_id"])
    for b in benchmarks:
        if b["id"] in affected_benchmark_ids:
            b["model_count"] = len(counts.get(b["id"], set()))

    save_json(DATA_DIR / "models.json", models)
    save_json(DATA_DIR / "benchmarks.json", benchmarks)
    save_json(DATA_DIR / "results.json", results)

    print(f"Removed {len(removed_models)} models: {[m['id'] for m in removed_models]}")
    print(f"Removed {len(removed_results)} result entries.")
    print(f"Affected benchmarks: {sorted(affected_benchmark_ids)}")


if __name__ == "__main__":
    main()
