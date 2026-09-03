#!/usr/bin/env python3
"""Remove pan2020_pconv_unet_interpolation model and all its interpolation results."""

import json
from pathlib import Path

DATA_DIR = Path("src/data")
TARGET_ID = "pan2020_pconv_unet_interpolation"


def main():
    models = json.loads((DATA_DIR / "models.json").read_text(encoding="utf-8"))
    benchmarks = json.loads((DATA_DIR / "benchmarks.json").read_text(encoding="utf-8"))
    results = json.loads((DATA_DIR / "results.json").read_text(encoding="utf-8"))

    before_models = len(models)
    models = [m for m in models if m["id"] != TARGET_ID]
    removed_models = before_models - len(models)

    before_results = len(results)
    results = [r for r in results if r["model_id"] != TARGET_ID]
    removed_results = before_results - len(results)

    # Recalc model_count for all interpolation benchmarks
    counts = {}
    for r in results:
        counts.setdefault(r["benchmark_id"], set()).add(r["model_id"])
    for b in benchmarks:
        if b["task"] == "interpolation":
            b["model_count"] = len(counts.get(b["id"], set()))

    (DATA_DIR / "models.json").write_text(
        json.dumps(models, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (DATA_DIR / "benchmarks.json").write_text(
        json.dumps(benchmarks, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (DATA_DIR / "results.json").write_text(
        json.dumps(results, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    print(f"Removed {removed_models} model and {removed_results} result entries for {TARGET_ID}.")


if __name__ == "__main__":
    main()
