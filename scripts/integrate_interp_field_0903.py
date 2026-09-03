#!/usr/bin/env python3
"""Integrate field interpolation results from interp_field_czt0903.zip.

Parses the `Interpolation` sheet of `batch_evaluation_part.xlsx`, maps each
`method (variant)` row to the repo interpolation model and Mobile AVO field
benchmark IDs, and updates/creates result entries with mean ± std.
"""

from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path

import pandas as pd

DATA_DIR = Path("src/data")
SRC_ROOT = Path("tmp/interp_field_0903/interp_field_czt0903")
TODAY = datetime.now().strftime("%Y-%m-%d")

VARIANT_MAP = {
    "continuous 20tr": "mobile-avo-interp-continuous20tr",
    "continuous 30tr": "mobile-avo-interp-continuous30tr",
    "continuous 40tr": "mobile-avo-interp-continuous40tr",
    "random 30": "mobile-avo-interp-random30",
    "random 50": "mobile-avo-interp-random50",
    "uniform 50": "mobile-avo-interp-uniform50",
    "uniform 70": "mobile-avo-interp-uniform75",
}

COL_TO_METRIC = {
    "SNR": "snr",
    "PSNR": "psnr",
    "SSIM": "ssim",
    "MAE": "mae",
    "MSE": "mse",
    "RMSE": "rmse",
    "EB_WSE_MEDIUM_40_70_NE": "eb_wse_medium_40_70_ne",
    "EB_WSE_MEDIUM_40_70_SNR": "eb_wse_medium_40_70_snr",
    "EB_WSE_STRONG_70_100_NE": "eb_wse_strong_70_100_ne",
    "EB_WSE_STRONG_70_100_SNR": "eb_wse_strong_70_100_snr",
    "EB_WSE_VERY_WEAK_5_20_NE": "eb_wse_very_weak_5_20_ne",
    "EB_WSE_VERY_WEAK_5_20_SNR": "eb_wse_very_weak_5_20_snr",
    "EB_WSE_WEAK_20_40_NE": "eb_wse_weak_20_40_ne",
    "EB_WSE_WEAK_20_40_SNR": "eb_wse_weak_20_40_snr",
    "FB_FRE_HIGH_NE": "fb_fre_high_ne",
    "FB_FRE_HIGH_SNR": "fb_fre_high_snr",
    "FB_FRE_LOW_NE": "fb_fre_low_ne",
    "FB_FRE_LOW_SNR": "fb_fre_low_snr",
    "FB_FRE_MID_NE": "fb_fre_mid_ne",
    "FB_FRE_MID_SNR": "fb_fre_mid_snr",
    "FB_FRE_VERY_HIGH_NE": "fb_fre_very_high_ne",
    "FB_FRE_VERY_HIGH_SNR": "fb_fre_very_high_snr",
}


def parse_value(cell):
    if pd.isna(cell):
        return None, None
    text = str(cell).strip()
    if not text or text in ("-", "—"):
        return None, None
    parts = re.split(r"\s*[\xb1±]\s*|\s*\+-\s*", text)
    try:
        mean = float(parts[0])
    except ValueError:
        mean = None
    std = None
    if len(parts) > 1:
        try:
            std = float(parts[1])
        except ValueError:
            std = None
    return mean, std


def parse_parameters(cell):
    if pd.isna(cell):
        return None
    text = str(cell).strip()
    if not text or text in ("-", "—"):
        return None
    try:
        return float(text)
    except ValueError:
        return None


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main():
    models = load_json(DATA_DIR / "models.json")
    benchmarks = load_json(DATA_DIR / "benchmarks.json")
    results = load_json(DATA_DIR / "results.json")

    models_by_id = {m["id"]: m for m in models}
    results_index = {(r["model_id"], r["benchmark_id"]): r for r in results}
    affected_benchmark_ids = set()
    param_updates = {}

    # ---- merge models from source JSONs ----
    for model_file in sorted((SRC_ROOT).glob("interpolation_model_*.json")):
        src_model = load_json(model_file)
        repo_id = src_model["id"]
        if repo_id in models_by_id:
            existing = models_by_id[repo_id]
            if "interpolation" not in existing.get("tasks", []):
                existing.setdefault("tasks", []).append("interpolation")
        else:
            new_model = dict(src_model)
            new_model["tasks"] = ["interpolation"]
            models.append(new_model)
            models_by_id[repo_id] = new_model

    # ---- parse Excel ----
    excel = SRC_ROOT / "batch_evaluation_part.xlsx"
    df = pd.read_excel(excel, sheet_name="Interpolation")
    for _, row in df.iterrows():
        text = str(row["Method"]).strip()
        m = re.match(r"^(.+?)\s*\((.+?)\)\s*$", text)
        if not m:
            continue
        method = m.group(1).strip()
        variant = m.group(2).strip()
        model_id = f"{method}_interpolation"
        benchmark_id = VARIANT_MAP.get(variant)
        if not benchmark_id:
            continue
        affected_benchmark_ids.add(benchmark_id)

        params = parse_parameters(row.get("Parameters (M)"))
        if params is not None:
            param_updates[model_id] = params

        key = (model_id, benchmark_id)
        if key in results_index:
            r = results_index[key]
        else:
            model = models_by_id.get(model_id, {})
            r = {
                "model_id": model_id,
                "benchmark_id": benchmark_id,
                "scores": {},
                "scores_std": {},
                "paper_url": model.get("paper_url"),
                "code_url": model.get("code_url"),
                "date_added": TODAY,
            }
            results.append(r)
            results_index[key] = r

        if "scores_std" not in r or r["scores_std"] is None:
            r["scores_std"] = {}

        for col, metric in COL_TO_METRIC.items():
            if col not in df.columns:
                continue
            mean, std = parse_value(row[col])
            if mean is None:
                continue
            r["scores"][metric] = mean
            if std is not None:
                r["scores_std"][metric] = std

        r["date_added"] = TODAY

    # Update parameters_m
    for model in models:
        if model["id"] in param_updates:
            model["parameters_m"] = round(param_updates[model["id"]], 2)

    # Recalc model_count for all interpolation benchmarks
    counts = {}
    for r in results:
        counts.setdefault(r["benchmark_id"], set()).add(r["model_id"])
    for b in benchmarks:
        if b["task"] == "interpolation":
            b["model_count"] = len(counts.get(b["id"], set()))

    save_json(DATA_DIR / "models.json", models)
    save_json(DATA_DIR / "benchmarks.json", benchmarks)
    save_json(DATA_DIR / "results.json", results)

    print(f"Updated models: {len(models)}")
    print(f"Updated benchmarks: {len(benchmarks)}")
    print(f"Updated results: {len(results)}")
    print(f"Affected benchmark ids: {sorted(affected_benchmark_ids)}")


if __name__ == "__main__":
    main()
