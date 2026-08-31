#!/usr/bin/env python3
"""Integrate synthetic interpolation results from intrep_syn_czt0830.zip.

Reads the Interpolation sheet in batch_evaluation_part.xlsx (which contains
mean ± std), adds missing models from the zip's interpolation_model_*.json
files, updates model parameters_m, and updates/creates SEGC3 interpolation
result entries. Uniform 70%% rows are merged into the existing uniform75
benchmark; non-canonical / removed variants are ignored.
"""

import json
import re
from datetime import datetime
from pathlib import Path

import pandas as pd

DATA_DIR = Path("src/data")
ZIP_DIR = Path(r"C:\Code\benchmark\.tmp_intrep_syn\intrep_syn_czt0830")
TODAY = datetime.now().strftime("%Y-%m-%d")

CORE_METRICS = ["snr", "psnr", "ssim", "mae", "mse", "rmse"]
BINNED_METRICS = [
    "eb_wse_medium_40_70_ne", "eb_wse_medium_40_70_snr",
    "eb_wse_strong_70_100_ne", "eb_wse_strong_70_100_snr",
    "eb_wse_very_weak_5_20_ne", "eb_wse_very_weak_5_20_snr",
    "eb_wse_weak_20_40_ne", "eb_wse_weak_20_40_snr",
    "fb_fre_high_ne", "fb_fre_high_snr",
    "fb_fre_low_ne", "fb_fre_low_snr",
    "fb_fre_mid_ne", "fb_fre_mid_snr",
    "fb_fre_very_high_ne", "fb_fre_very_high_snr",
]
VALID_METRICS = set(CORE_METRICS + BINNED_METRICS)

COL_TO_METRIC = {
    "SNR": "snr", "PSNR": "psnr", "SSIM": "ssim", "MAE": "mae",
    "MSE": "mse", "RMSE": "rmse",
    "EB_WSE_MEDIUM_40_70_NE": "eb_wse_medium_40_70_ne",
    "EB_WSE_MEDIUM_40_70_SNR": "eb_wse_medium_40_70_snr",
    "EB_WSE_STRONG_70_100_NE": "eb_wse_strong_70_100_ne",
    "EB_WSE_STRONG_70_100_SNR": "eb_wse_strong_70_100_snr",
    "EB_WSE_VERY_WEAK_5_20_NE": "eb_wse_very_weak_5_20_ne",
    "EB_WSE_VERY_WEAK_5_20_SNR": "eb_wse_very_weak_5_20_snr",
    "EB_WSE_WEAK_20_40_NE": "eb_wse_weak_20_40_ne",
    "EB_WSE_WEAK_20_40_SNR": "eb_wse_weak_20_40_snr",
    "FB_FRE_HIGH_NE": "fb_fre_high_ne", "FB_FRE_HIGH_SNR": "fb_fre_high_snr",
    "FB_FRE_LOW_NE": "fb_fre_low_ne", "FB_FRE_LOW_SNR": "fb_fre_low_snr",
    "FB_FRE_MID_NE": "fb_fre_mid_ne", "FB_FRE_MID_SNR": "fb_fre_mid_snr",
    "FB_FRE_VERY_HIGH_NE": "fb_fre_very_high_ne",
    "FB_FRE_VERY_HIGH_SNR": "fb_fre_very_high_snr",
}

MODEL_MAP = {
    "chai2020_unet": "chai2020_unet_interpolation",
    "gated_transformer_v9": "gated_transformer_v9_interpolation",
    "li2022_caunet": "li2022_caunet_interpolation",
    "liu2022_wrdl": "liu2022_wrdl_interpolation",
    "pan2020_pconv_unet": "pan2020_pconv_unet_interpolation",
    "park2022_cfunet": "park2022_cfunet_interpolation",
    "yu2022_anet": "yu2022_anet_interpolation",
}

BENCHMARK_MAP = {
    "continuous 20tr": "segc3-interp-continuous20tr",
    "continuous 30tr": "segc3-interp-continuous30tr",
    "continuous 40tr": "segc3-interp-continuous40tr",
    "random 30": "segc3-interp-random30",
    "random 50": "segc3-interp-random50",
    "uniform 50": "segc3-interp-uniform50",
    "uniform 70": "segc3-interp-uniform75",
}


def parse_value(cell):
    if pd.isna(cell):
        return None, None
    text = str(cell).strip()
    if not text or text in ("-", "—"):
        return None, None
    parts = re.split(r"\s*[\xb1\u00b1]\s*|\s*\+-\s*", text)
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


def parse_method(text):
    m = re.match(r"^(.+?)\s*\((.+)\)\s*$", str(text).strip())
    if not m:
        return None, None
    return m.group(1).strip(), m.group(2).strip()


def pooled_std(stds):
    """Combine standard deviations assuming equal sample sizes: sqrt(mean(var))."""
    if not stds:
        return None
    if len(stds) == 1:
        return stds[0]
    import math
    return math.sqrt(sum(s * s for s in stds) / len(stds))


def add_missing_models(models):
    existing_ids = {m["id"] for m in models}
    added = []
    for p in sorted(ZIP_DIR.glob("interpolation_model_*.json")):
        data = json.loads(p.read_text(encoding="utf-8"))
        mid = data.get("id")
        if not mid or mid in existing_ids:
            continue
        # Ensure required fields
        model = {
            "id": mid,
            "name": data.get("name", mid),
            "authors": data.get("authors", "Unknown"),
            "org": data.get("org", "Unknown"),
            "year": data.get("year", 2026),
            "emoji": "🔧",
            "type": data.get("type", "deep_learning"),
            "tasks": data.get("tasks", ["interpolation"]),
            "description": data.get("description", f"{data.get('name', mid)} for seismic interpolation."),
            "paper_url": data.get("paper_url"),
            "code_url": data.get("code_url"),
            "weights_url": data.get("weights_url"),
            "is_open_source": data.get("is_open_source", True),
            "parameters_m": data.get("parameters_m"),
        }
        models.append(model)
        added.append(mid)
    return added


def update_parameters(models, params_by_model):
    models_by_id = {m["id"]: m for m in models}
    updated = []
    for prefix, params in params_by_model.items():
        mid = MODEL_MAP.get(prefix)
        if not mid:
            continue
        m = models_by_id.get(mid)
        if m:
            m["parameters_m"] = round(params, 2)
            updated.append((mid, params))
    return updated


def main():
    models = json.loads((DATA_DIR / "models.json").read_text(encoding="utf-8"))
    benchmarks = json.loads((DATA_DIR / "benchmarks.json").read_text(encoding="utf-8"))
    results = json.loads((DATA_DIR / "results.json").read_text(encoding="utf-8"))

    added_models = add_missing_models(models)
    print(f"Added {len(added_models)} missing models: {added_models}")

    df = pd.read_excel(ZIP_DIR / "batch_evaluation_part.xlsx", sheet_name="Interpolation")

    # Collect parameters per model prefix
    params_by_model = {}
    rows = []
    for _, row in df.iterrows():
        prefix, variant = parse_method(row["Method"])
        if not prefix:
            continue
        params_by_model[prefix] = float(row["Parameters (M)"]) if not pd.isna(row["Parameters (M)"]) else None
        rows.append((prefix, variant, row))

    updated_params = update_parameters(models, params_by_model)
    print(f"Updated parameters_m for {len(updated_params)} models")

    results_index = {(r["model_id"], r["benchmark_id"]): r for r in results}
    updates = 0
    created = 0
    skipped = []

    # Group rows by (model_id, benchmark_id) to average duplicates
    grouped = {}
    for prefix, variant, row in rows:
        model_id = MODEL_MAP.get(prefix)
        benchmark_id = BENCHMARK_MAP.get(variant)
        if not model_id or not benchmark_id:
            skipped.append(f"{prefix} ({variant})")
            continue
        key = (model_id, benchmark_id)
        grouped.setdefault(key, []).append(row)

    for (model_id, benchmark_id), row_group in grouped.items():
        key = (model_id, benchmark_id)
        if key in results_index:
            r = results_index[key]
            created_flag = False
        else:
            model = next((m for m in models if m["id"] == model_id), None)
            r = {
                "model_id": model_id,
                "benchmark_id": benchmark_id,
                "scores": {},
                "scores_std": {},
                "paper_url": model.get("paper_url") if model else None,
                "code_url": model.get("code_url") if model else None,
                "date_added": TODAY,
            }
            results.append(r)
            results_index[key] = r
            created_flag = True

        for col, metric in COL_TO_METRIC.items():
            if col not in df.columns:
                continue
            values = []
            for row in row_group:
                mean, std = parse_value(row[col])
                if mean is not None:
                    values.append((mean, std))
            if not values:
                continue
            mean_avg = sum(v[0] for v in values) / len(values)
            stds = [v[1] for v in values if v[1] is not None]
            std_combined = pooled_std(stds) if stds else None
            r["scores"][metric] = mean_avg
            if std_combined is not None:
                r["scores_std"][metric] = std_combined

        if created_flag:
            created += 1
        else:
            updates += 1

    print(f"Updated {updates} existing results, created {created} new results")
    if skipped:
        print(f"Skipped non-canonical variants: {sorted(set(skipped))}")

    # Recalc model_count for SEGC3 interpolation benchmarks
    counts = {}
    for r in results:
        counts.setdefault(r["benchmark_id"], set()).add(r["model_id"])
    for b in benchmarks:
        if b["id"].startswith("segc3-interp-"):
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
    print("Done.")


if __name__ == "__main__":
    main()
