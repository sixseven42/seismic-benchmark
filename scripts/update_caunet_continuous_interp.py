#!/usr/bin/env python3
"""Update CAUNet (li2022_caunet_interpolation) continuous missing results
from the provided Excel and JSON source files (2026-09).

Only updates the three continuous missing variants:
  continuous 20tr -> segc3-interp-continuous20tr
  continuous 30tr -> segc3-interp-continuous30tr
  continuous 40tr -> segc3-interp-continuous40tr

PSNR is absent (marked "—") in the new Excel, so existing PSNR values are
preserved; all other available metrics are overwritten with the new mean ± std.
"""

import json
import re
from datetime import datetime
from pathlib import Path

import pandas as pd

DATA_DIR = Path("src/data")
EXCEL_PATH = Path(r"C:\Users\admin\Documents\WeChat Files\wxid_hvmr1h95e7jn22\FileStorage\File\2026-09\batch_evaluation_part.xlsx")
TODAY = datetime.now().strftime("%Y-%m-%d")

MODEL_ID = "li2022_caunet_interpolation"

BENCHMARK_MAP = {
    "continuous 20tr": "segc3-interp-continuous20tr",
    "continuous 30tr": "segc3-interp-continuous30tr",
    "continuous 40tr": "segc3-interp-continuous40tr",
}

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


def main():
    models = json.loads((DATA_DIR / "models.json").read_text(encoding="utf-8"))
    benchmarks = json.loads((DATA_DIR / "benchmarks.json").read_text(encoding="utf-8"))
    results = json.loads((DATA_DIR / "results.json").read_text(encoding="utf-8"))

    model = next((m for m in models if m["id"] == MODEL_ID), None)
    if not model:
        raise ValueError(f"Model {MODEL_ID} not found")

    results_index = {(r["model_id"], r["benchmark_id"]): r for r in results}
    updated = 0
    created = 0

    df = pd.read_excel(EXCEL_PATH, sheet_name="Interpolation")
    for _, row in df.iterrows():
        prefix, variant = parse_method(row["Method"])
        if prefix != "li2022_caunet" or variant not in BENCHMARK_MAP:
            continue
        benchmark_id = BENCHMARK_MAP[variant]
        key = (MODEL_ID, benchmark_id)
        if key in results_index:
            r = results_index[key]
            created_flag = False
        else:
            r = {
                "model_id": MODEL_ID,
                "benchmark_id": benchmark_id,
                "scores": {},
                "scores_std": {},
                "paper_url": model.get("paper_url"),
                "code_url": model.get("code_url"),
                "date_added": TODAY,
            }
            results.append(r)
            results_index[key] = r
            created_flag = True

        if "scores_std" not in r or r["scores_std"] is None:
            r["scores_std"] = {}

        for col, metric in COL_TO_METRIC.items():
            if col not in df.columns:
                continue
            mean, std = parse_value(row[col])
            if mean is None:
                # Preserve existing value if new source has no data (e.g. PSNR)
                continue
            r["scores"][metric] = mean
            if std is not None:
                r["scores_std"][metric] = std

        if created_flag:
            created += 1
        else:
            updated += 1

    # Recalc model_count for continuous interpolation benchmarks
    counts = {}
    for r in results:
        counts.setdefault(r["benchmark_id"], set()).add(r["model_id"])
    for b in benchmarks:
        if b["id"] in BENCHMARK_MAP.values():
            b["model_count"] = len(counts.get(b["id"], set()))

    (DATA_DIR / "benchmarks.json").write_text(
        json.dumps(benchmarks, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (DATA_DIR / "results.json").write_text(
        json.dumps(results, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    print(f"Updated {updated} existing results, created {created} new results for {MODEL_ID} continuous variants.")


if __name__ == "__main__":
    main()
