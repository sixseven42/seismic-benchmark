#!/usr/bin/env python3
"""Remove duplicate Mobile AVO interpolation models, keeping the better variant.

Duplicate pairs (same display name on Mobile AVO interpolation benchmarks):

  li2022_caunet          vs li2022_caunet_interpolation
  liu2022_wrdl           vs liu2022_wrdl_interpolation
  park2022_cfunet        vs park2022_cfunet_interpolation
  yu2022_anet            vs yu2022_anet_interpolation

The `*_interpolation` variants have higher mean SNR on Mobile AVO and also
cover the SEGC3 interpolation benchmarks, so they are kept. The base IDs only
had Mobile AVO results and are removed together with those results.
"""

from __future__ import annotations

import json
from pathlib import Path

DATA_DIR = Path("src/data")

REMOVE_MODEL_IDS = {
    "li2022_caunet",
    "liu2022_wrdl",
    "park2022_cfunet",
    "yu2022_anet",
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main():
    models = load_json(DATA_DIR / "models.json")
    benchmarks = load_json(DATA_DIR / "benchmarks.json")
    results = load_json(DATA_DIR / "results.json")

    removed_results = [r for r in results if r["model_id"] in REMOVE_MODEL_IDS]
    affected_benchmark_ids = {r["benchmark_id"] for r in removed_results}

    results = [r for r in results if r["model_id"] not in REMOVE_MODEL_IDS]
    removed_models = [m for m in models if m["id"] in REMOVE_MODEL_IDS]
    models = [m for m in models if m["id"] not in REMOVE_MODEL_IDS]

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
