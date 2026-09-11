#!/usr/bin/env python3
"""Integrate final Uniform 75% missing interpolation results.

Sources:
  - batch_evaluation_uniform75.xlsx     -> segc3-interp-uniform75
  - batch_evaluation_avo_uniform75.xlsx -> mobile-avo-interp-uniform75
Sheet: uniform_miss75 (summary). 9 methods, 20 metrics (no mae/rmse).
Replaces scores+scores_std for those 9 models; literature models
(chai2020/li2022/liu2022/park2022/yu2022) are untouched.
"""
import json
import re
from datetime import datetime
from pathlib import Path

import pandas as pd

DATA = Path("src/data")
TODAY = datetime.now().strftime("%Y-%m-%d")
BASE = Path(r"C:\Users\admin\Documents\WeChat Files\wxid_hvmr1h95e7jn22\FileStorage\File\2026-09")

FILES = [
    (BASE / "batch_evaluation_uniform75.xlsx", ""),
    (BASE / "batch_evaluation_avo_uniform75.xlsx", "avo-"),
]

COL_TO_METRIC = {
    "SNR": "snr", "PSNR": "psnr", "SSIM": "ssim", "MSE": "mse",
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


def method_map(prefix):
    return {
        "UNet": f"{prefix}unet-interpolation",
        "UNet-L": f"{prefix}unet-L-interpolation",
        "DnCNN": f"{prefix}dncnn-interpolation",
        "DnCNN-L": f"{prefix}dncnn-L-interpolation",
        "ResUNet": f"{prefix}res-unet-interpolation",
        "ResUNet-L": f"{prefix}res-unet-L-interpolation",
        "Attention UNet": f"{prefix}attention-unet-interpolation",
        "Attention UNet-L": f"{prefix}attention-unet-L-interpolation",
        "SPNet": f"{prefix}spnet-interpolation",
    }


def parse_value(cell):
    s = str(cell).strip()
    parts = re.split(r"\s*±\s*", s)
    mean = float(parts[0])
    std = float(parts[1]) if len(parts) > 1 else None
    return mean, std


def main():
    models = json.loads((DATA / "models.json").read_text(encoding="utf-8"))
    results = json.loads((DATA / "results.json").read_text(encoding="utf-8"))
    models_by_id = {m["id"]: m for m in models}
    by_key = {(r["model_id"], r["benchmark_id"]): r for r in results}

    updated = 0
    params_updates = {}
    for excel, prefix in FILES:
        bench_id = ("mobile-avo-interp-" if prefix else "segc3-interp-") + "uniform75"
        mmap = method_map(prefix)
        df = pd.read_excel(excel, sheet_name="uniform_miss75")
        for _, row in df.iterrows():
            method = str(row["Method"]).strip()
            if method not in mmap:
                continue
            mid = mmap[method]
            p = row.get("Parameters (M)")
            if pd.notna(p) and str(p).strip() not in ("-", "nan"):
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
            scores, stds = {}, {}
            for col, met in COL_TO_METRIC.items():
                if col not in df.columns or pd.isna(row[col]):
                    continue
                mean, std = parse_value(row[col])
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

    (DATA / "models.json").write_text(
        json.dumps(models, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (DATA / "results.json").write_text(
        json.dumps(results, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"updated {updated} entries; params: {params_updates}")


if __name__ == "__main__":
    main()
