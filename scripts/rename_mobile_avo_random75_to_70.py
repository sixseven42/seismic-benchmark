#!/usr/bin/env python3
"""Rename mobile-avo-interp-random75 -> mobile-avo-interp-random70."""

import json
from pathlib import Path

DATA_DIR = Path("src/data")
OLD_ID = "mobile-avo-interp-random75"
NEW_ID = "mobile-avo-interp-random70"


def main():
    benchmarks = json.loads((DATA_DIR / "benchmarks.json").read_text(encoding="utf-8"))
    results = json.loads((DATA_DIR / "results.json").read_text(encoding="utf-8"))

    renamed = False
    for b in benchmarks:
        if b["id"] == OLD_ID:
            b["id"] = NEW_ID
            b["name"] = "Mobile AVO Random Missing 70%"
            b["description"] = b["description"].replace("75%", "70%")
            renamed = True
            print(f"Renamed benchmark: {OLD_ID} -> {NEW_ID}")

    count = 0
    for r in results:
        if r["benchmark_id"] == OLD_ID:
            r["benchmark_id"] = NEW_ID
            count += 1
    print(f"Updated {count} result entries")

    (DATA_DIR / "benchmarks.json").write_text(
        json.dumps(benchmarks, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (DATA_DIR / "results.json").write_text(
        json.dumps(results, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print("Done.")


if __name__ == "__main__":
    main()
