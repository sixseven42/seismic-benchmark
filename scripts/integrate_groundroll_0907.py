#!/usr/bin/env python3
"""Integrate final confirmed SEGC3 ground-roll results (batch_evaluation_all_groundroll0907.xlsx).

- Sheets Noise 1.0..9.0 -> segc3-groundroll-noise1..9
- Method naming: UNet-Plus -> *-L-*, DDPM cDDPM -> cddpm-groundroll
- Updates 22 valid metrics (6 core + 16 binned NE/SNR) mean+std and parameters_m.
- The companion batch_evaluation_all_field_0822.xlsx (field-groundroll-noise1)
  was verified identical to the repo and needs no changes.
"""
import json
import re
from pathlib import Path
from datetime import datetime

import pandas as pd

DATA = Path("src/data")
EXCEL = Path(r"C:\论文\SeisBench\最终指标\面波\batch_evaluation_all_groundroll0907.xlsx")
TODAY = datetime.now().strftime("%Y-%m-%d")

METHOD_MAP = {
    "UNet": "unet-groundroll",
    "UNet-Plus": "unet-L-groundroll",
    "ResUNet": "res-unet-groundroll",
    "ResUNet-Plus": "res-unet-L-groundroll",
    "DnCNN": "dncnn-groundroll",
    "Attention UNet": "attention-unet-groundroll",
    "Attention UNet-Plus": "attention-unet-L-groundroll",
    "Enhanced Atten-UNet": "enhanced-atten-unet-groundroll",
    "SANet": "sanet-groundroll",
    "Physics CNN": "physics-cnn-groundroll",
    "Pix2Pix cGAN": "pix2pix-cgan-groundroll",
    "DDPM cDDPM": "cddpm-groundroll",
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
    s = str(cell).strip()
    parts = re.split(r"\s*±\s*", s)
    mean = float(parts[0])
    std = float(parts[1]) if len(parts) > 1 else None
    return mean, std


models = json.loads((DATA / "models.json").read_text(encoding="utf-8"))
results = json.loads((DATA / "results.json").read_text(encoding="utf-8"))
benchmarks = json.loads((DATA / "benchmarks.json").read_text(encoding="utf-8"))
models_by_id = {m["id"]: m for m in models}
results_index = {(r["model_id"], r["benchmark_id"]): r for r in results}

xl = pd.ExcelFile(EXCEL)
updated = created = 0
params_updates = {}
for sheet in xl.sheet_names:
    bench_id = "segc3-groundroll-noise" + sheet.split()[-1].replace(".0", "")
    df = pd.read_excel(xl, sheet_name=sheet)
    for _, row in df.iterrows():
        method = str(row["Method"]).strip()
        if method not in METHOD_MAP:
            continue
        model_id = METHOD_MAP[method]
        p = row.get("Parameters (M)")
        if pd.notna(p):
            params_updates[model_id] = float(p)
        r = results_index.get((model_id, bench_id))
        if r is None:
            r = {
                "model_id": model_id,
                "benchmark_id": bench_id,
                "scores": {},
                "scores_std": {},
                "paper_url": models_by_id[model_id].get("paper_url"),
                "code_url": models_by_id[model_id].get("code_url"),
                "date_added": TODAY,
            }
            results.append(r)
            results_index[(model_id, bench_id)] = r
            created += 1
        scores, stds = {}, {}
        for col, metric in COL_TO_METRIC.items():
            if col not in df.columns or pd.isna(row[col]):
                continue
            mean, std = parse_value(row[col])
            scores[metric] = mean
            if std is not None:
                stds[metric] = std
        r["scores"] = scores
        r["scores_std"] = stds
        r["date_added"] = TODAY
        updated += 1

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
print(f"updated {updated} result entries, created {created} new")
print("params updated:", params_updates)
