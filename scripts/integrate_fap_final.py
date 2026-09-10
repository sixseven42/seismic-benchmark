#!/usr/bin/env python3
"""Integrate final first-arrival picking (FAP) metrics.

Source: C:\\论文\\SeisBench\\最终指标\\FAP\\初至拾取指标_all(1).xlsx
  - Sheet 旧指标: final version of the classic metric set (replaces repo values;
    adds dice, iou, mbe, gather_coverage) with mean±std.
  - Sheet paper重排: contributes ONLY rc_norm = 'MC-norm (shot macro)' with std.
Naming: *-Plus -> *-L-* model IDs.
Also fixes fbp benchmarks' dataset_name (was identical for 4 datasets).
"""
import json
import re
from datetime import datetime
from pathlib import Path

import pandas as pd

DATA = Path("src/data")
EXCEL = Path(r"C:\论文\SeisBench\最终指标\FAP\初至拾取指标_all(1).xlsx")
TODAY = datetime.now().strftime("%Y-%m-%d")

SCOPE_MAP = {
    "Mixed (4 datasets)": "fbp-geomseg-all",
    "Brunswick": "fbp-brunswick-valid",
    "Dongbei": "fbp-dongbei",
    "Halfmile": "fbp-halfmile-valid",
    "Lalor": "fbp-lalor-valid",
}

METHOD_MAP = {
    "UNet": "unet-first-break",
    "UNet-Plus": "unet-first-break-L",
    "ResUNet": "res-unet-first-break",
    "ResUNet-Plus": "res-unet-first-break-L",
    "DnCNN": "dncnn-seg-first-break",
    "Attention UNet": "attention-unet-first-break",
    "Attention UNet-Plus": "attention-unet-first-break-L",
    "DSU-Net": "wang2024dsunet_first_break_picking",
    "HUNet": "pu2024hu_net_first_arrival_accuracy",
    "STUNet": "jiang2023swin_transformer_first_break",
}

OLD_COL_TO_METRIC = {
    "dice": "dice",
    "iou": "iou",
    "f1": "f1",
    "HitRate1px": "hit_rate_1px",
    "HitRate3px": "hit_rate_3px",
    "HitRate5px": "hit_rate_5px",
    "HitRate7px": "hit_rate_7px",
    "HitRate9px": "hit_rate_9px",
    "MeanAbsoluteError": "mae",
    "RootMeanSquaredError": "rmse",
    "MeanBiasError": "mbe",
    "GatherCoverage": "gather_coverage",
}

FBP_METRICS = [
    "mae", "rmse", "hit_rate_1px", "hit_rate_3px", "hit_rate_5px",
    "hit_rate_7px", "hit_rate_9px", "f1",
    "dice", "iou", "mbe", "gather_coverage", "rc_norm",
]

DATASET_NAME = {
    "fbp-geomseg-all": "Brunswick + Dongbei + Halfmile + Lalor (Mixed)",
    "fbp-brunswick-valid": "Brunswick",
    "fbp-dongbei": "Dongbei",
    "fbp-halfmile-valid": "Halfmile",
    "fbp-lalor-valid": "Lalor",
}


def parse_value(cell):
    s = str(cell).strip()
    parts = re.split(r"\s*±\s*", s)
    mean = float(parts[0])
    std = float(parts[1]) if len(parts) > 1 else None
    return mean, std


models = json.loads((DATA / "models.json").read_text(encoding="utf-8"))
results = json.loads((DATA / "results.json").read_text(encoding="utf-8"))
benchmarks = json.loads((DATA / "benchmarks.json").read_text(encoding="utf-8"))
models_by_id = {m["id"]: m for m in models}
by_key = {(r["model_id"], r["benchmark_id"]): r for r in results}
benches_by_id = {b["id"]: b for b in benchmarks}

params_updates = {}

# ---- 旧指标 sheet ----
df = pd.read_excel(EXCEL, sheet_name="旧指标")
updated = 0
for _, row in df.iterrows():
    scope = str(row["Scope"]).strip()
    method = str(row["Method"]).strip()
    if scope not in SCOPE_MAP or method not in METHOD_MAP:
        continue
    bench_id = SCOPE_MAP[scope]
    mid = METHOD_MAP[method]
    if pd.notna(row.get("Parameters (M)")):
        params_updates[mid] = float(row["Parameters (M)"])
    r = by_key.get((mid, bench_id))
    if r is None:
        r = {
            "model_id": mid,
            "benchmark_id": bench_id,
            "scores": {},
            "scores_std": {},
            "paper_url": models_by_id[mid].get("paper_url"),
            "code_url": models_by_id[mid].get("code_url"),
            "date_added": TODAY,
        }
        results.append(r)
        by_key[(mid, bench_id)] = r
    scores, stds = {}, {}
    for col, met in OLD_COL_TO_METRIC.items():
        if pd.isna(row[col]):
            continue
        mean, std = parse_value(row[col])
        scores[met] = mean
        if std is not None:
            stds[met] = std
    r["scores"] = scores
    r["scores_std"] = stds
    r["date_added"] = TODAY
    updated += 1

# ---- paper重排 sheet: rc_norm = MC-norm (shot macro) ----
df3 = pd.read_excel(EXCEL, sheet_name="paper重排")
rc_updated = 0
for _, row in df3.iterrows():
    scope = str(row["Scope"]).strip()
    method = str(row["Method"]).strip()
    if scope not in SCOPE_MAP or method not in METHOD_MAP:
        continue
    r = by_key[(METHOD_MAP[method], SCOPE_MAP[scope])]
    mean, std = parse_value(row["MC-norm (shot macro)"])
    r["scores"]["rc_norm"] = mean
    if std is not None:
        r["scores_std"]["rc_norm"] = std
    rc_updated += 1

# ---- benchmark metric lists + dataset_name ----
for b in benchmarks:
    if b["id"] in DATASET_NAME:
        b["metrics"] = list(FBP_METRICS)
        b["dataset_name"] = DATASET_NAME[b["id"]]

# ---- parameters ----
for m in models:
    if m["id"] in params_updates:
        m["parameters_m"] = params_updates[m["id"]]

counts = {}
for r in results:
    counts.setdefault(r["benchmark_id"], set()).add(r["model_id"])
for b in benchmarks:
    b["model_count"] = len(counts.get(b["id"], set()))

(DATA / "models.json").write_text(json.dumps(models, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
(DATA / "results.json").write_text(json.dumps(results, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
(DATA / "benchmarks.json").write_text(json.dumps(benchmarks, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"old-metric entries updated: {updated}, rc_norm added: {rc_updated}")
print("params:", params_updates)
