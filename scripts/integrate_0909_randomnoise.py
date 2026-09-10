#!/usr/bin/env python3
"""Integrate 表格0909 final random-noise results + remove FFCNN.

Source: C:\\论文\\SeisBench\\最终指标\\表格0909\\表格0909\\random_noise_suppression_avo\\batch_evaluation_results.xlsx
- Authoritative for Mobile AVO Random Noise (6 benchmarks):
  * adds UNet-L / FBResNet entries (10 models total, was 8)
  * fills SCRN's missing binned EB_WSE metrics
Naming: q_unet -> qunet-*, unet_plusplus -> zhou2018unet_plusplus_denoise (UNet++).

Also removes FFCNN entirely (ffcnn-random-noise, ffcnn-blending-noise,
ffcnn-blending-noise-avo) since the final tables no longer include it,
then recalculates model_count.
"""
import json
import re
from datetime import datetime
from pathlib import Path

import pandas as pd

DATA = Path("src/data")
EXCEL = Path(r"C:\论文\SeisBench\最终指标\表格0909\表格0909\random_noise_suppression_avo\batch_evaluation_results.xlsx")
TODAY = datetime.now().strftime("%Y-%m-%d")

METHOD_MAP = {
    "UNet": "unet-random-noise",
    "UNet-L": "unet-L-random-noise",
    "DnCNN": "dncnn-random-noise",
    "ResUNet": "res-unet-random-noise",
    "Attention UNet": "attention-unet-random-noise",
    "DDPM": "cddpm-random-noise",
    "FBResNet": "fbresnet-random-noise",
    "SCRN": "scrn-random-noise",
    "q_unet": "qunet-random-noise",
    "unet_plusplus": "zhou2018unet_plusplus_denoise",
}

SHEET2BENCH = {
    "gaussian_-5dB": "mobile-avo-random-noise-gaussian-snrneg5",
    "gaussian_0dB": "mobile-avo-random-noise-gaussian-snr0",
    "gaussian_5dB": "mobile-avo-random-noise-gaussian-snr5",
    "poisson_-5dB": "mobile-avo-random-noise-poisson-snrneg5",
    "poisson_0dB": "mobile-avo-random-noise-poisson-snr0",
    "poisson_5dB": "mobile-avo-random-noise-poisson-snr5",
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

FFCNN_MODELS = {"ffcnn-random-noise", "ffcnn-blending-noise", "ffcnn-blending-noise-avo"}


def parse_value(cell):
    s = str(cell).strip()
    if s in ("-", "nan", ""):
        return None
    parts = re.split(r"\s*\+\-\s*", s)
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

    # ---- integrate Mobile AVO Random Noise final results ----
    xl = pd.ExcelFile(EXCEL)
    updated = created = 0
    params_updates = {}
    for sheet, bench_id in SHEET2BENCH.items():
        df = pd.read_excel(xl, sheet_name=sheet)
        for _, row in df.iterrows():
            method = str(row["Method"]).strip()
            if method not in METHOD_MAP:
                continue
            mid = METHOD_MAP[method]
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

    # ---- remove FFCNN ----
    n_results_before = len(results)
    results = [r for r in results if r["model_id"] not in FFCNN_MODELS]
    removed_results = n_results_before - len(results)
    models = [m for m in models if m["id"] not in FFCNN_MODELS]

    # ---- parameters ----
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
    print(f"mobile-avo entries updated: {updated}, created: {created}")
    print(f"FFCNN removed: {len(FFCNN_MODELS)} models, {removed_results} results")
    print("params:", params_updates)


if __name__ == "__main__":
    main()
