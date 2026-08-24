#!/usr/bin/env python3
"""Backfill mean ± std for interpolation results from the older field/synthetic zips.

Only touches results whose model_id/benchmark_id match the rows in
batch_evaluation_part.xlsx; everything else is left unchanged.
"""

import json
import re
from pathlib import Path

import pandas as pd

DATA_DIR = Path("src/data")

METRIC_MAP = {
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

FIELD_MODEL_MAP = {
    "chai2020_unet": "chai2020_unet",
    "gated_transformer_v9": "gated_transformer_v9",
    "li2022_caunet": "li2022_caunet",
    "liu2022_wrdl": "liu2022_wrdl",
    "park2022_cfunet": "park2022_cfunet",
    "yu2022_anet": "yu2022_anet",
}

FIELD_VARIANT_MAP = {
    "continuous 20tr": "mobile-avo-interp-continuous20tr",
    "continuous 30tr": "mobile-avo-interp-continuous30tr",
    "continuous 40tr": "mobile-avo-interp-continuous40tr",
    "random 30": "mobile-avo-interp-random30",
    "random 50": "mobile-avo-interp-random50",
    "uniform 50": "mobile-avo-interp-uniform50",
    "uniform 70": "mobile-avo-interp-uniform75",
}

SYN_MODEL_MAP = {
    "chai2020_unet": "chai2020_unet_interpolation",
    "gated_transformer_v9": "gated_transformer_v9_interpolation",
    "li2022_caunet": "li2022_caunet_interpolation",
    "liu2022_wrdl": "liu2022_wrdl_interpolation",
    "park2022_cfunet": "park2022_cfunet_interpolation",
    "pan2020_pconv_unet": "pan2020_pconv_unet_interpolation",
    "yu2022_anet": "yu2022_anet_interpolation",
}

SYN_VARIANT_MAP = {
    "continuous 20tr": "segc3-interp-continuous20tr",
    "continuous 30tr": "segc3-interp-continuous30tr",
    "continuous 40tr": "segc3-interp-continuous40tr",
    "random 30": "segc3-interp-random30",
    "random 50": "segc3-interp-random50",
    "random 10-30": None,  # benchmark was removed
    "uniform 50": "segc3-interp-uniform50",
    "uniform 70": "segc3-interp-uniform75",
}


def parse_value(cell):
    if pd.isna(cell):
        return None, None
    text = str(cell).strip()
    if not text:
        return None, None
    if "±" in text:
        a, b = text.split("±", 1)
        return float(a.strip()), float(b.strip())
    # plain number
    return float(text), None


def process_excel(path, model_map, variant_map, results_index):
    df = pd.read_excel(path, sheet_name="Interpolation")
    updated = 0
    skipped = 0
    for _, row in df.iterrows():
        method = str(row["Method"]).strip()
        if method.lower() == "raw (noisy)":
            continue
        m = re.match(r"^(.+?)\s*\((.+)\)\s*$", method)
        if not m:
            print(f"  unparsable method: {method}")
            skipped += 1
            continue
        model_key = m.group(1).strip()
        variant = m.group(2).strip()
        model_id = model_map.get(model_key)
        benchmark_id = variant_map.get(variant)
        if not model_id or not benchmark_id:
            skipped += 1
            continue
        key = (model_id, benchmark_id)
        if key not in results_index:
            skipped += 1
            continue
        r = results_index[key]
        if "scores_std" not in r or r["scores_std"] is None:
            r["scores_std"] = {}
        for col, metric in METRIC_MAP.items():
            if col not in df.columns:
                continue
            mean, std = parse_value(row[col])
            if mean is None:
                continue
            r["scores"][metric] = mean
            if std is not None:
                r["scores_std"][metric] = std
        updated += 1
    return updated, skipped


def main():
    results = json.loads((DATA_DIR / "results.json").read_text(encoding="utf-8"))
    results_index = {(r["model_id"], r["benchmark_id"]): r for r in results}

    field_path = Path(r"C:\Code\benchmark\.tmp_interp_zips\field\interp_field_czt0820\batch_evaluation_part.xlsx")
    syn_path = Path(r"C:\Code\benchmark\.tmp_interp_zips\syn\interp_syn_czt0822\batch_evaluation_part.xlsx")

    print("Processing field zip (Mobile AVO)...")
    u1, s1 = process_excel(field_path, FIELD_MODEL_MAP, FIELD_VARIANT_MAP, results_index)
    print(f"  updated {u1}, skipped {s1}")

    print("Processing synthetic zip (SEGC3)...")
    u2, s2 = process_excel(syn_path, SYN_MODEL_MAP, SYN_VARIANT_MAP, results_index)
    print(f"  updated {u2}, skipped {s2}")

    (DATA_DIR / "results.json").write_text(
        json.dumps(results, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print("Saved results.json")


if __name__ == "__main__":
    main()
