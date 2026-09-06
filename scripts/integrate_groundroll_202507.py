#!/usr/bin/env python3
"""Integrate latest SEGC3 ground-roll results from batch_evaluation_all_groundroll.xlsx.

The Excel contains 5 sheets (Noise 1.0 ... 9.0) with mean ± std for 12 methods
plus a raw baseline. This script updates the 12 repo ground-roll models on the
SEGC3 ground-roll benchmarks, keeping only the 6 core + 16 binned NE/SNR metrics
and ignoring energy-ratio/frequency-range columns.
"""

from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path

import pandas as pd

DATA_DIR = Path("src/data")
SRC_XLSX = Path(
    r"C:\Users\admin\Documents\WeChat Files\wxid_hvmr1h95e7jn22\FileStorage\File\2026-07\batch_evaluation_all_groundroll.xlsx"
)
TODAY = datetime.now().strftime("%Y-%m-%d")

SHEET_MAP = {
    "Noise 1.0": "segc3-groundroll-noise1",
    "Noise 3.0": "segc3-groundroll-noise3",
    "Noise 5.0": "segc3-groundroll-noise5",
    "Noise 7.0": "segc3-groundroll-noise7",
    "Noise 9.0": "segc3-groundroll-noise9",
}

METHOD_MAP = {
    "Attention UNet": "attention-unet-groundroll",
    "Attention UNet-Plus": "attention-unet-L-groundroll",
    "DDPM cDDPM": "cddpm-groundroll",
    "DnCNN": "dncnn-groundroll",
    "Enhanced Atten-UNet": "enhanced-atten-unet-groundroll",
    "Physics CNN": "physics-cnn-groundroll",
    "Pix2Pix cGAN": "pix2pix-cgan-groundroll",
    "ResUNet": "res-unet-groundroll",
    "ResUNet-Plus": "res-unet-L-groundroll",
    "SANet": "sanet-groundroll",
    "UNet": "unet-groundroll",
    "UNet-Plus": "unet-L-groundroll",
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
    param_updates = {}

    affected_benchmark_ids = set()
    updated = 0
    created = 0

    for sheet, benchmark_id in SHEET_MAP.items():
        affected_benchmark_ids.add(benchmark_id)
        df = pd.read_excel(SRC_XLSX, sheet_name=sheet)
        for _, row in df.iterrows():
            method = str(row["Method"]).strip()
            if method == "Raw (noisy)":
                continue
            model_id = METHOD_MAP.get(method)
            if not model_id:
                print(f"Warning: unmapped method '{method}' in {sheet}")
                continue

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
                created += 1

            if r.get("scores_std") is None:
                r["scores_std"] = {}

            for col, metric in COL_TO_METRIC.items():
                mean, std = parse_value(row[col])
                if mean is None:
                    continue
                r["scores"][metric] = mean
                if std is not None:
                    r["scores_std"][metric] = std
                else:
                    r["scores_std"].pop(metric, None)

            r["date_added"] = TODAY
            updated += 1

    # Update parameters_m
    for m in models:
        if m["id"] in param_updates:
            m["parameters_m"] = round(param_updates[m["id"]], 2)

    # Recalc model_count for affected benchmarks
    counts = {}
    for r in results:
        counts.setdefault(r["benchmark_id"], set()).add(r["model_id"])
    for b in benchmarks:
        if b["id"] in affected_benchmark_ids:
            b["model_count"] = len(counts.get(b["id"], set()))

    save_json(DATA_DIR / "models.json", models)
    save_json(DATA_DIR / "benchmarks.json", benchmarks)
    save_json(DATA_DIR / "results.json", results)

    print(f"Updated {updated} result entries, created {created} new entries.")
    print(f"Updated parameters for {len(param_updates)} models.")
    print(f"Affected benchmarks: {sorted(affected_benchmark_ids)}")


if __name__ == "__main__":
    main()
