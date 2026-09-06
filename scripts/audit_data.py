#!/usr/bin/env python3
"""Comprehensive audit of models/benchmarks/results data."""
import json
from collections import defaultdict
from pathlib import Path

DATA = Path("src/data")
models = json.loads((DATA / "models.json").read_text(encoding="utf-8"))
benchmarks = json.loads((DATA / "benchmarks.json").read_text(encoding="utf-8"))
results = json.loads((DATA / "results.json").read_text(encoding="utf-8"))

out = []
def log(s=""):
    out.append(s)

m_by_id = {m["id"]: m for m in models}
b_by_id = {b["id"]: b for b in benchmarks}

log("=== 1. results 引用完整性 ===")
bad_model = defaultdict(int)
bad_bench = defaultdict(int)
for r in results:
    if r["model_id"] not in m_by_id:
        bad_model[r["model_id"]] += 1
    if r["benchmark_id"] not in b_by_id:
        bad_bench[r["benchmark_id"]] += 1
log(f"  引用不存在模型: {dict(bad_model) if bad_model else '无'}")
log(f"  引用不存在benchmark: {dict(bad_bench) if bad_bench else '无'}")

log("")
log("=== 2. 重复结果条目 (model_id, benchmark_id) ===")
seen = defaultdict(list)
for i, r in enumerate(results):
    seen[(r["model_id"], r["benchmark_id"])].append(i)
dups = {k: v for k, v in seen.items() if len(v) > 1}
if dups:
    for k, v in dups.items():
        log(f"  {k}: {len(v)} 条")
else:
    log("  无")

log("")
log("=== 3. model_count 校验 ===")
counts = defaultdict(set)
for r in results:
    counts[r["benchmark_id"]].add(r["model_id"])
for b in benchmarks:
    actual = len(counts.get(b["id"], set()))
    if b.get("model_count") != actual:
        log(f"  {b['id']}: model_count={b.get('model_count')} 实际={actual}")
log("  (无输出即全部一致)")

log("")
log("=== 4. 同名不同ID的模型 ===")
by_name = defaultdict(set)
for m in models:
    by_name[m["name"]].add(m["id"])
for name, ids in sorted(by_name.items()):
    if len(ids) > 1:
        log(f"  '{name}': {sorted(ids)}")

log("")
log("=== 5. 相似名(去掉大小写/连字符/下划线后相同) ===")
import re
def norm(s):
    return re.sub(r"[-_\s]", "", s).lower()
by_norm = defaultdict(set)
for m in models:
    by_norm[norm(m["name"])].add((m["id"], m["name"]))
for k, v in sorted(by_norm.items()):
    if len(v) > 1:
        log(f"  {sorted(v)}")

log("")
log("=== 6. 无结果的模型 (孤儿) ===")
has_results = {r["model_id"] for r in results}
for m in models:
    if m["id"] not in has_results:
        log(f"  {m['id']} ({m['name']})")

log("")
log("=== 7. 模型 tasks 字段 vs 实际结果 ===")
tasks_from_results = defaultdict(set)
for r in results:
    b = b_by_id.get(r["benchmark_id"])
    if b:
        tasks_from_results[r["model_id"]].add(b["task"])
for m in models:
    mid = m["id"]
    declared = set(m.get("tasks", []))
    actual = tasks_from_results.get(mid, set())
    missing_decl = actual - declared
    extra_decl = declared - actual
    if missing_decl:
        log(f"  {mid}: tasks 缺少 {sorted(missing_decl)}")
    if extra_decl:
        log(f"  {mid}: tasks 声明了但无结果 {sorted(extra_decl)}")

log("")
log("=== 8. 每个 benchmark 的模型覆盖矩阵 (找实验缺失) ===")
groups = defaultdict(dict)  # group -> bench -> set(models)
for b in benchmarks:
    groups[b.get("group_name", "(无组)")][b["id"]] = counts.get(b["id"], set())
for gname, benches in sorted(groups.items()):
    all_models = set().union(*benches.values()) if benches else set()
    if not all_models:
        continue
    log(f"  [{gname}] 共 {len(all_models)} 个模型, {len(benches)} 个 benchmark")
    # models missing from any benchmark in group
    for b_id, mset in sorted(benches.items()):
        missing = all_models - mset
        if missing and len(missing) <= 8:
            log(f"    {b_id} 缺: {sorted(missing)}")
        elif missing:
            log(f"    {b_id} 缺 {len(missing)} 个: {sorted(missing)[:8]}...")
    # single-model benchmarks
    for b_id, mset in sorted(benches.items()):
        if len(mset) <= 1:
            log(f"    !! {b_id} 只有 {len(mset)} 个模型")

log("")
log("=== 9. 每个模型在每组内的 benchmark 覆盖 (找模型缺失实验) ===")
for gname, benches in sorted(groups.items()):
    model_groups = defaultdict(set)
    for b_id, mset in benches.items():
        for mid in mset:
            model_groups[mid].add(b_id)
    full = set(benches.keys())
    for mid, covered in sorted(model_groups.items()):
        miss = full - covered
        if miss:
            log(f"  [{gname}] {mid} 缺 {len(miss)}/{len(full)}: {sorted(miss)}")

log("")
log("=== 10. 指标完整性 ===")
CORE = ["snr", "psnr", "ssim", "mae", "mse", "rmse"]
for b in benchmarks:
    declared = set(b.get("metrics", []))
    for r in results:
        if r["benchmark_id"] != b["id"]:
            continue
        extra = set(r.get("scores", {})) - declared
        missing_core = [c for c in CORE if c not in r.get("scores", {})]
        if extra:
            log(f"  {b['id']} / {r['model_id']}: 有未声明指标 {sorted(extra)}")
        if missing_core:
            log(f"  {b['id']} / {r['model_id']}: 缺核心指标 {missing_core}")
        stds = r.get("scores_std") or {}
        std_no_score = set(stds) - set(r.get("scores", {}))
        if std_no_score:
            log(f"  {b['id']} / {r['model_id']}: std 无对应 mean {sorted(std_no_score)}")

log("")
log("=== 11. 全大写/特殊字符/前导空格名称 ===")
for m in models:
    nm = m["name"]
    if nm != nm.strip():
        log(f"  {m['id']}: 名称有首尾空格 '{nm}'")
    if re.search(r"[^A-Za-z0-9+\- .()']", nm):
        log(f"  {m['id']}: 名称含特殊字符 '{nm}'")

log("")
log("=== 12. ID 规范性 (下划线/大写，排除引用风格) ===")
for m in models:
    mid = m["id"]
    if "_" in mid and not re.match(r"^[a-z]+\d{4}", mid):
        log(f"  {m['id']} 含下划线且非引用风格")

log("")
log("=== 13. parameters_m 异常 ===")
for m in models:
    p = m.get("parameters_m")
    if p is None:
        log(f"  {m['id']}: 无 parameters_m")
    elif not isinstance(p, (int, float)) or p <= 0:
        log(f"  {m['id']}: parameters_m={p}")

Path("/tmp/audit_out.txt").write_text("\n".join(out), encoding="utf-8")
print("done, lines:", len(out))
