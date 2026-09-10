#!/usr/bin/env python3
"""Integrate final confirmed multiples-attenuation results.

Source: C:\\论文\\SeisBench\\最终指标\\多次波\\batch_evaluation_all_multiples(1).xlsx (sheet Multiples)
Naming: UNet-Plus -> *-L-multiples.
Updates 22 valid metrics (6 core + 16 binned NE/SNR) mean+std and parameters_m
for the 9 models on benchmark `multiples-attenuation`.

Note: core 6 + eb_wse_* binned metrics were already identical to the repo;
only fb_fre_* binned metrics changed (recomputed band values).
"""
import json
from datetime import datetime
from pathlib import Path

import pandas as pd

DATA = Path("src/data")
EXCEL = Path(r"C:\论文\SeisBench\最终指标\多次波\batch_evaluation_all_multiples(1).xlsx")
TODAY = datetime.now().strftime("%Y-%m-%d")

METHOD_MAP = {
    "UNet": "unet-multiples",
    "UNet-Plus": "unet-L-multiples",
    "ResUNet": "res-unet-multiples",
    "ResUNet-Plus": "res-unet-L-multiples",
    "DnCNN": "dncnn-multiples",
    "Attention UNet": "attention-unet-multiples",
    "Attention UNet-Plus": "attention-unet-L-multiples",
    "SAGAN": "sagan-multiples",
    "DNNDAT": "dnndat-multiples",
}

COL_TO_METRIC = {
    "SNR": "snr", "PSNR": "psnr", "SSIM": "ssim", "MAE": "mae", "MSE": "mse", "RMSE": "rmse",
    "EB_WSE_MEDIUM_40_70_NE": "eb_wse_medium_40_70_ne", "EB_WSE_MEDIUM_40_70_SNR": "eb_wse_medium_40_70_snr",
    "EB_WSE_STRONG_70_100_NE": "eb_wse_strong_70_100_ne", "EB_WSE_STRONG_70_100_SNR": "eb_wse_strong_70_100_snr",
    "EB_WSE_VERY_WEAK_5_20_NE": "eb_wse_very_weak_5_20_ne", "EB_WSE_VERY_WEAK_5_20_SNR": "eb_wse_very_weak_5_20_snr",
    "EB_WSE_WEAK_20_40_NE": "eb_wse_weak_20_40_ne", "EB_WSE_WEAK_20_40_SNR": "eb_wse_weak_20_40_snr",
    "FB_FRE_HIGH_NE": "fb_fre_high_ne", "FB_FRE_HIGH_SNR": "fb_fre_high_snr",
    "FB_FRE_LOW_NE": "fb_fre_low_ne", "FB_FRE_LOW_SNR": "fb_fre_low_snr",
    "FB_FRE_MID_NE": "fb_fre_mid_ne", "FB_FRE_MID_SNR": "fb_fre_mid_snr",
    "FB_FRE_VERY_HIGH_NE": "fb_fre_very_high_ne", "FB_FRE_VERY_HIGH_SNR": "fb_fre_very_high_snr",
}


def main():
    models = json.loads((DATA / "models.json").read_text(encoding="utf-8"))
    results = json.loads((DATA / "results.json").read_text(encoding="utf-8"))
    models_by_id = {m["id"]: m for m in models}
    by_key = {(r["model_id"], r["benchmark_id"]): r for r in results}

    df = pd.read_excel(EXCEL, sheet_name="Multiples")
    params_updates = {}
    updated = 0
    for _, row in df.iterrows():
        method = str(row["Method"]).strip()
        if method not in METHOD_MAP:
            continue
        mid = METHOD_MAP[method]
        if pd.notna(row.get("Parameters (M)")):
            params_updates[mid] = float(row["Parameters (M)"])
        r = by_key[(mid, "multiples-attenuation")]
        scores, stds = {}, {}
        for col, met in COL_TO_METRIC.items():
            parts = str(row[col]).split("±")
            scores[met] = float(parts[0])
            if len(parts) > 1:
                stds[met] = float(parts[1])
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
