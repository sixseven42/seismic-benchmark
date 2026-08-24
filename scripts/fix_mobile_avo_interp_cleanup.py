#!/usr/bin/env python3
"""Fix leftover Mobile AVO interpolation inconsistencies:
- Create the missing mobile-avo-interp-random75 benchmark.
- Merge mobile-avo-interp-uniform70 results into mobile-avo-interp-uniform75.
- Remove the obsolete mobile-avo-interp-uniform70 benchmark.
- Recalculate model_count for all benchmarks.
"""

import copy
import json
from pathlib import Path

DATA_DIR = Path("src/data")


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def save(path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def recalc_counts(benchmarks, results):
    counts = {}
    for r in results:
        counts.setdefault(r["benchmark_id"], set()).add(r["model_id"])
    for b in benchmarks:
        b["model_count"] = len(counts.get(b["id"], set()))


def main():
    benchmarks = load(DATA_DIR / "benchmarks.json")
    results = load(DATA_DIR / "results.json")

    # 1) Create mobile-avo-interp-random75 from random50
    random50 = next(b for b in benchmarks if b["id"] == "mobile-avo-interp-random50")
    random75 = copy.deepcopy(random50)
    random75["id"] = "mobile-avo-interp-random75"
    random75["name"] = "Mobile AVO Random Missing 75%"
    random75[
        "description"
    ] = "Mobile AVO Viking Graben Line 12 open-source 2D marine field dataset interpolation benchmark with random missing 75%."
    random75["model_count"] = 0
    # Insert right after random50
    idx = benchmarks.index(random50) + 1
    benchmarks.insert(idx, random75)

    # 2) Merge uniform70 results into uniform75 (keep existing 75 when duplicate model)
    existing_75_models = {
        r["model_id"]
        for r in results
        if r["benchmark_id"] == "mobile-avo-interp-uniform75"
    }
    for r in results:
        if r["benchmark_id"] == "mobile-avo-interp-uniform70":
            if r["model_id"] in existing_75_models:
                # drop the 70% duplicate
                r["benchmark_id"] = "__DROP__"
            else:
                r["benchmark_id"] = "mobile-avo-interp-uniform75"
    results = [r for r in results if r["benchmark_id"] != "__DROP__"]

    # 3) Remove uniform70 benchmark
    benchmarks = [b for b in benchmarks if b["id"] != "mobile-avo-interp-uniform70"]

    # 4) Recalc model_count
    recalc_counts(benchmarks, results)

    save(DATA_DIR / "benchmarks.json", benchmarks)
    save(DATA_DIR / "results.json", results)

    print("Done.")
    for bid in [
        "mobile-avo-interp-random30",
        "mobile-avo-interp-random50",
        "mobile-avo-interp-random75",
        "mobile-avo-interp-uniform50",
        "mobile-avo-interp-uniform75",
    ]:
        b = next((x for x in benchmarks if x["id"] == bid), None)
        cnt = len([r for r in results if r["benchmark_id"] == bid])
        print(f"  {bid}: model_count={b['model_count'] if b else 'MISSING'}, results={cnt}")


if __name__ == "__main__":
    main()
