#!/usr/bin/env python3
"""Remove the 'AVO Random Noise' benchmark group, keeping only Mobile AVO.

Removes:
  - 6 benchmarks: random-noise-avo-{gaussian,poisson}-snr{neg5,0,5}
  - all results on those benchmarks
  - the 10 orphan *-random-noise-avo models (no results elsewhere)
"""
import json
from pathlib import Path

DATA = Path("src/data")

benchmarks = json.loads((DATA / "benchmarks.json").read_text(encoding="utf-8"))
results = json.loads((DATA / "results.json").read_text(encoding="utf-8"))
models = json.loads((DATA / "models.json").read_text(encoding="utf-8"))

REMOVE_BENCH_PREFIX = "random-noise-avo-"
remove_bench_ids = {b["id"] for b in benchmarks if b["id"].startswith(REMOVE_BENCH_PREFIX)}
print(f"benchmarks to remove: {len(remove_bench_ids)}")

removed_results = [r for r in results if r["benchmark_id"] in remove_bench_ids]
results = [r for r in results if r["benchmark_id"] not in remove_bench_ids]
print(f"results removed: {len(removed_results)}")

# find orphan models (no remaining results, tasks only random_noise_suppression)
remaining_models = {r["model_id"] for r in results}
orphans = [
    m for m in models
    if m["id"] not in remaining_models and m["id"].endswith("-random-noise-avo")
]
orphan_ids = {m["id"] for m in orphans}
for m in orphans:
    if set(m.get("tasks", [])) != {"random_noise_suppression"}:
        raise SystemExit(f"unexpected tasks on {m['id']}: {m.get('tasks')}")
models = [m for m in models if m["id"] not in orphan_ids]
print(f"orphan models removed: {len(orphans)}")
for m in orphans:
    print("  ", m["id"])

benchmarks = [b for b in benchmarks if b["id"] not in remove_bench_ids]

counts = {}
for r in results:
    counts.setdefault(r["benchmark_id"], set()).add(r["model_id"])
for b in benchmarks:
    b["model_count"] = len(counts.get(b["id"], set()))

(DATA / "benchmarks.json").write_text(json.dumps(benchmarks, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
(DATA / "results.json").write_text(json.dumps(results, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
(DATA / "models.json").write_text(json.dumps(models, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print("done")
