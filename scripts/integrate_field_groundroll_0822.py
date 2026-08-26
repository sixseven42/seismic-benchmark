#!/usr/bin/env python3
"""Integrate field ground-roll results from batch_evaluation_all_0822.xlsx.

Creates a new field ground-roll benchmark (`field-groundroll-noise1`) and adds
10 result entries (one per model) with mean ± std for the 6 core metrics and
16 NE/SNR binned metrics. Also updates `parameters_m` for the models that
appear in the Excel.
"""

import json
import re
from datetime import datetime
from pathlib import Path

import pandas as pd

DATA_DIR = Path("src/data")
EXCEL_PATH = Path(r"C:\Users\admin\Documents\WeChat Files\wxid_hvmr1h95e7jn22\FileStorage\File\2026-08\batch_evaluation_all_0822.xlsx")
TODAY = datetime.now().strftime("%Y-%m-%d")

BENCHMARK_ID = "field-groundroll-noise1"
BENCHMARK_NAME = "Field Ground-Roll Noise 1.0"
BENCHMARK_GROUP = "Field Ground-Roll Noise"

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

METHOD_MAP = {
    "UNet": "unet-groundroll",
    "UNet-Plus": "unet-plus-groundroll",
    "ResUNet": "res-unet-groundroll",
    "ResUNet-Plus": "res-unet-plus-groundroll",
    "DnCNN": "dncnn-groundroll",
    "Attention UNet": "attention-unet-groundroll",
    "Attention UNet-Plus": "attention-unet-plus-groundroll",
    "SANet": "sanet-groundroll",
    "Physics CNN": "physics-cnn-groundroll",
    "Pix2Pix cGAN": "pix2pix-cgan-groundroll",
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


def parse_params(cell):
    if pd.isna(cell):
        return None
    text = str(cell).strip()
    if not text or text in ("-", "—"):
        return None
    try:
        return float(text)
    except ValueError:
        return None


def ensure_benchmark(benchmarks):
    for b in benchmarks:
        if b["id"] == BENCHMARK_ID:
            return False
    benchmark = {
        "id": BENCHMARK_ID,
        "name": BENCHMARK_NAME,
        "group_name": BENCHMARK_GROUP,
        "dataset_name": "Field Ground Roll",
        "task": "coherent_noise_suppression",
        "icon": "🌊",
        "description": "Field ground-roll attenuation benchmark with noise strength 1.0 on real seismic shot gathers.",
        "data_source": "field",
        "dimensions": "Field shot gathers",
        "primary_metric": "snr",
        "metrics": CORE_METRICS + BINNED_METRICS,
        "tags": ["Field", "Ground Roll", "Coherent Noise"],
        "citation": "",
        "download_url": "",
        "model_count": 0,
        "gallery": [],
    }
    benchmarks.append(benchmark)
    return True


def main():
    models = json.loads((DATA_DIR / "models.json").read_text(encoding="utf-8"))
    benchmarks = json.loads((DATA_DIR / "benchmarks.json").read_text(encoding="utf-8"))
    results = json.loads((DATA_DIR / "results.json").read_text(encoding="utf-8"))

    created = ensure_benchmark(benchmarks)
    print(f"Benchmark {'created' if created else 'already exists'}")

    # Build model lookup
    models_by_id = {m["id"]: m for m in models}

    # Remove any existing results for this benchmark to avoid duplicates
    results = [r for r in results if r["benchmark_id"] != BENCHMARK_ID]

    df = pd.read_excel(EXCEL_PATH, sheet_name="Noise 1.0")
    added = 0
    updated_params = 0
    skipped_methods = set()

    for _, row in df.iterrows():
        method = str(row.get("Method", "")).strip()
        if method in ("Raw (noisy)", "Raw", "Input"):
            continue
        model_id = METHOD_MAP.get(method)
        if not model_id:
            skipped_methods.add(method)
            continue

        model = models_by_id.get(model_id)
        if not model:
            skipped_methods.add(f"{method} -> {model_id} not found")
            continue

        # Update parameters_m from Excel
        params = parse_params(row.get("Parameters (M)"))
        if params is not None:
            model["parameters_m"] = params
            updated_params += 1

        result = {
            "model_id": model_id,
            "benchmark_id": BENCHMARK_ID,
            "scores": {},
            "scores_std": {},
            "paper_url": model.get("paper_url", ""),
            "code_url": model.get("code_url", ""),
            "date_added": TODAY,
        }
        for col, metric in COL_TO_METRIC.items():
            if col not in df.columns:
                continue
            mean, std = parse_value(row[col])
            if mean is None:
                continue
            result["scores"][metric] = mean
            if std is not None:
                result["scores_std"][metric] = std
        results.append(result)
        added += 1

    # Recalc model_count for the new benchmark
    count = len({r["model_id"] for r in results if r["benchmark_id"] == BENCHMARK_ID})
    for b in benchmarks:
        if b["id"] == BENCHMARK_ID:
            b["model_count"] = count

    (DATA_DIR / "models.json").write_text(
        json.dumps(models, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (DATA_DIR / "benchmarks.json").write_text(
        json.dumps(benchmarks, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (DATA_DIR / "results.json").write_text(
        json.dumps(results, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    print(f"Added {added} results for {BENCHMARK_ID}")
    print(f"Updated parameters_m for {updated_params} models")
    if skipped_methods:
        print(f"Skipped methods: {sorted(skipped_methods)}")


if __name__ == "__main__":
    main()
