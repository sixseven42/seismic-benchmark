#!/usr/bin/env python3
"""Integrate final interpolation results from interp_*_czt0909.zip.

Sources (xlsx sheet 'Interpolation' is authoritative, has mean+-std):
  - interp_segc3_czt0909.zip -> segc3-interp-* benchmarks
  - interp_field_czt0909.zip -> mobile-avo-interp-* (verified identical to repo, no-op)

Actions:
  1. Delete chai2020_unet_interpolation (model + 7 results) per user request.
     gated_transformer_v9 is not in the repo (nothing to delete); its rows
     in the files are skipped.
  2. Overwrite scores+scores_std for li2022_caunet / liu2022_wrdl /
     park2022_cfunet / yu2022_anet on the 7 mapped SEGC3 benchmarks
     (corrected PSNR etc.). Old-id mapping: uniform 70 -> uniform75.
  3. Add new model pan2020_pconv_unet_interpolation (PConv U-Net) with
     results on segc3-interp-random30/random50/uniform50.
  4. Skip park2022 'cfunet_random 50-88' (no matching repo benchmark).
"""
import json
import re
from datetime import datetime
from pathlib import Path

import pandas as pd

DATA = Path("src/data")
TMP = Path(r"C:\Users\admin\AppData\Local\Temp")
SEGC3_XLSX = TMP / "interp_segc3" / "interp_segc3_czt0909" / "batch_evaluation_part.xlsx"
TODAY = datetime.now().strftime("%Y-%m-%d")

CFG2SUFFIX = {
    "continuous 20tr": "continuous20tr",
    "continuous 30tr": "continuous30tr",
    "continuous 40tr": "continuous40tr",
    "random 30": "random30",
    "random 50": "random50",
    "uniform 50": "uniform50",
    "uniform 70": "uniform75",
}

KEEP_MODELS = {
    "li2022_caunet": "li2022_caunet_interpolation",
    "liu2022_wrdl": "liu2022_wrdl_interpolation",
    "park2022_cfunet": "park2022_cfunet_interpolation",
    "yu2022_anet": "yu2022_anet_interpolation",
}

PAN2020 = {
    "id": "pan2020_pconv_unet_interpolation",
    "name": "PConv U-Net",
    "authors": "Shulin Pan, Kai Chen, Jingyi Chen, Ziyu Qin, Qinghui Cui, Jing Li",
    "org": "Unknown",
    "year": 2020,
    "emoji": "🔧",
    "type": "deep_learning",
    "tasks": ["interpolation"],
    "description": "PConv U-Net for seismic interpolation.",
    "paper_url": "https://doi.org/10.1016/j.cageo.2020.104609",
    "code_url": "https://github.com/1eyan/seismic-benchmark-code_interp/blob/main/model/interpolation/pan2020_pconv_unet.py",
    "weights_url": None,
    "is_open_source": True,
    "parameters_m": 22.33,
}

COL_TO_METRIC = {
    "SNR": "snr", "PSNR": "psnr", "SSIM": "ssim", "MAE": "mae", "MSE": "mse", "RMSE": "rmse",
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

DELETE_MODELS = {"chai2020_unet_interpolation", "gated_transformer_v9_interpolation"}


def parse_value(cell):
    s = str(cell).strip()
    if s in ("-", "nan", "—", ""):
        return None
    parts = re.split(r"\s*±\s*", s)
    try:
        mean = float(parts[0])
        std = float(parts[1]) if len(parts) > 1 else None
        return mean, std
    except ValueError:
        return None


def main():
    models = json.loads((DATA / "models.json").read_text(encoding="utf-8"))
    results = json.loads((DATA / "results.json").read_text(encoding="utf-8"))
    benchmarks = json.loads((DATA / "benchmarks.json").read_text(encoding="utf-8"))
    models_by_id = {m["id"]: m for m in models}
    by_key = {(r["model_id"], r["benchmark_id"]): r for r in results}

    # ---- 1. delete chai2020 / gated transformer ----
    n0 = len(results)
    results = [r for r in results if r["model_id"] not in DELETE_MODELS]
    removed_results = n0 - len(results)
    models = [m for m in models if m["id"] not in DELETE_MODELS]
    print(f"deleted models: {DELETE_MODELS & set(models_by_id)}, results removed: {removed_results}")

    # ---- 2+3. integrate segc3 xlsx ----
    df = pd.read_excel(SEGC3_XLSX, sheet_name="Interpolation")
    updated = created = skipped = 0
    params_updates = {}
    for _, row in df.iterrows():
        m = re.match(r"(.+?) \((.+)\)", str(row["Method"]).strip())
        if not m:
            continue
        name, cfg = m.group(1), m.group(2)
        if name in ("chai2020_unet", "gated_transformer_v9"):
            skipped += 1
            continue
        if cfg not in CFG2SUFFIX:
            print(f"  skipped (no repo benchmark): {row['Method']}")
            skipped += 1
            continue
        bench_id = "segc3-interp-" + CFG2SUFFIX[cfg]
        if name == "pan2020_pconv_unet":
            mid = PAN2020["id"]
            if mid not in models_by_id:
                models.append(dict(PAN2020))
                models_by_id[mid] = models[-1]
                created += 1
        elif name in KEEP_MODELS:
            mid = KEEP_MODELS[name]
        else:
            print(f"  unknown method: {row['Method']}")
            continue
        p = row.get("Parameters (M)")
        if pd.notna(p) and str(p).strip() not in ("-", "nan", "—"):
            params_updates[mid] = float(p)
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
            created += 1
        scores, stds = {}, {}
        for col, met in COL_TO_METRIC.items():
            if col not in df.columns or pd.isna(row[col]):
                continue
            parsed = parse_value(row[col])
            if parsed is None:
                continue
            mean, std = parsed
            scores[met] = mean
            if std is not None:
                stds[met] = std
        r["scores"] = scores
        r["scores_std"] = stds
        r["date_added"] = TODAY
        updated += 1

    for m in models:
        if m["id"] in params_updates:
            m["parameters_m"] = params_updates[m["id"]]

    # ---- recalc model_count ----
    counts = {}
    for r in results:
        counts.setdefault(r["benchmark_id"], set()).add(r["model_id"])
    for b in benchmarks:
        b["model_count"] = len(counts.get(b["id"], set()))

    (DATA / "models.json").write_text(
        json.dumps(models, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (DATA / "results.json").write_text(
        json.dumps(results, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (DATA / "benchmarks.json").write_text(
        json.dumps(benchmarks, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"entries updated: {updated}, created(model+results): {created}, rows skipped: {skipped}")
    print("params:", params_updates)


if __name__ == "__main__":
    main()
