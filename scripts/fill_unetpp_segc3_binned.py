#!/usr/bin/env python3
"""Fill missing binned NE/SNR metrics for UNet++ SEGC3 random-noise results.

Source: batch_evaluation_unet_plusplus.xlsx (the UNet-Plus row in each
RN-SEGC3 sheet). Only the 16 binned metrics are added; existing core metrics
are left unchanged to avoid overwriting more precise values.
"""

from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path

import pandas as pd

DATA_DIR = Path("src/data")
SRC_XLSX = Path(r"C:\论文\SeisBench\seismic_bench可视化\random\batch_evaluation_unet_plusplus.xlsx")
MODEL_ID = "zhou2018unet_plusplus_denoise"
TODAY = datetime.now().strftime("%Y-%m-%d")

SHEET_MAP = {
    "RN-SEGC3 Gaussian -5dB": "segc3-random-noise-gaussian-snrneg5",
    "RN-SEGC3 Gaussian +0dB": "segc3-random-noise-gaussian-snr0",
    "RN-SEGC3 Gaussian +5dB": "segc3-random-noise-gaussian-snr5",
    "RN-SEGC3 Poisson -5dB": "segc3-random-noise-poisson-snrneg5",
    "RN-SEGC3 Poisson +0dB": "segc3-random-noise-poisson-snr0",
    "RN-SEGC3 Poisson +5dB": "segc3-random-noise-poisson-snr5",
}

BINNED_METRICS = [
    "eb_wse_medium_40_70_ne",
    "eb_wse_medium_40_70_snr",
    "eb_wse_strong_70_100_ne",
    "eb_wse_strong_70_100_snr",
    "eb_wse_very_weak_5_20_ne",
    "eb_wse_very_weak_5_20_snr",
    "eb_wse_weak_20_40_ne",
    "eb_wse_weak_20_40_snr",
    "fb_fre_high_ne",
    "fb_fre_high_snr",
    "fb_fre_low_ne",
    "fb_fre_low_snr",
    "fb_fre_mid_ne",
    "fb_fre_mid_snr",
    "fb_fre_very_high_ne",
    "fb_fre_very_high_snr",
]

COL_TO_METRIC = {
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


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main():
    results = load_json(DATA_DIR / "results.json")
    index = {(r["model_id"], r["benchmark_id"]): r for r in results}

    added = 0
    for sheet, benchmark_id in SHEET_MAP.items():
        df = pd.read_excel(SRC_XLSX, sheet_name=sheet)
        row = df[df["Method"].astype(str).str.strip() == "UNet-Plus"]
        if row.empty:
            print(f"Warning: no UNet-Plus row in {sheet}")
            continue
        row = row.iloc[0]
        key = (MODEL_ID, benchmark_id)
        if key not in index:
            print(f"Warning: no existing result for {benchmark_id}")
            continue
        r = index[key]
        if r.get("scores_std") is None:
            r["scores_std"] = {}
        for col, metric in COL_TO_METRIC.items():
            if metric in r["scores"]:
                continue  # keep existing
            mean, std = parse_value(row[col])
            if mean is None:
                continue
            r["scores"][metric] = mean
            if std is not None:
                r["scores_std"][metric] = std
            added += 1
        r["date_added"] = TODAY

    save_json(DATA_DIR / "results.json", results)
    print(f"Added {added} missing binned metric values for {MODEL_ID} on SEGC3 random-noise benchmarks.")


if __name__ == "__main__":
    main()
