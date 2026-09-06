#!/usr/bin/env python3
"""Integrate random-noise and deblending mean±std from json0824.rar.

- Updates existing SEGC3 random-noise results.
- Adds missing Mobile AVO random-noise results (same models as SEGC3).
- Replaces SEGC3 deblending results with the non-"-avo" model IDs from the rar
  (removing the previously incorrectly assigned -avo entries).
- Updates AVO deblending results.
- Recalculates model_count for affected benchmarks.
"""

import json
import re
from datetime import datetime
from pathlib import Path

import pandas as pd

DATA_DIR = Path("src/data")
RAR_DIR = Path(r"C:\Code\benchmark\.tmp_json0824\json0824")
TODAY = datetime.now().strftime("%Y-%m-%d")

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

RANDOM_NOISE_SEGC3_SHEETS = {
    "gaussian_-5dB": "segc3-random-noise-gaussian-snrneg5",
    "gaussian_0dB": "segc3-random-noise-gaussian-snr0",
    "gaussian_5dB": "segc3-random-noise-gaussian-snr5",
    "poisson_-5dB": "segc3-random-noise-poisson-snrneg5",
    "poisson_0dB": "segc3-random-noise-poisson-snr0",
    "poisson_5dB": "segc3-random-noise-poisson-snr5",
}

RANDOM_NOISE_AVO_SHEETS = {
    "gaussian_-5dB": "mobile-avo-random-noise-gaussian-snrneg5",
    "gaussian_0dB": "mobile-avo-random-noise-gaussian-snr0",
    "gaussian_5dB": "mobile-avo-random-noise-gaussian-snr5",
    "poisson_-5dB": "mobile-avo-random-noise-poisson-snrneg5",
    "poisson_0dB": "mobile-avo-random-noise-poisson-snr0",
    "poisson_5dB": "mobile-avo-random-noise-poisson-snr5",
}

RANDOM_NOISE_METHOD_MAP = {
    "UNet": "unet-random-noise",
    "DnCNN": "dncnn-random-noise",
    "ResUNet": "res-unet-random-noise",
    "Attention UNet": "attention-unet-random-noise",
    "DDPM": "cddpm-random-noise",
    "SCRN": "scrn-random-noise",
    "q_unet": "q-unet-random-noise",
    "UNet++": "zhou2018unet_plusplus_denoise",
    "CBDRDN": "cbdrdn-random-noise",
    "FBResNet": "fbresnet-random-noise",
    "FFCNN": "ffcnn-random-noise",
}

DEBLENDING_SEGC3_SHEETS = {
    "T02_mod": "blending-noise-T02_mod",
    "T02_comp": "blending-noise-T02_comp",
    "T02_simp": "blending-noise-T02_simp",
}

DEBLENDING_AVO_SHEETS = {
    "T03_avo_mod": "blending-noise-avo-T03_avo_mod",
}

DEBLENDING_SEGC3_METHOD_MAP = {
    "UNet": "unet-blending-noise",
    "DnCNN": "dncnn-blending-noise",
    "ResUNet": "res_unet-blending-noise",
    "Attention UNet": "attention-unet-blending-noise",
    "unet_L": "unet_L-blending-noise",
    "UNet++": "unet-plusplus-blending-noise",
}

DEBLENDING_AVO_METHOD_MAP = {
    "UNet": "unet-blending-noise-avo",
    "DnCNN": "dncnn-blending-noise-avo",
    "ResUNet": "res_unet-blending-noise-avo",
    "Attention UNet": "attention-unet-blending-noise-avo",
    "DDPM": "cddpm-blending-noise-avo",
    "SCRN": "scrn-blending-noise-avo",
    "unet_L": "unet_L-blending-noise-avo",
    "q_unet": "q_unet-blending-noise-avo",
    "UNet++": "unet-plusplus-blending-noise-avo",
}

AFFECTED_BENCHMARK_IDS = set(RANDOM_NOISE_SEGC3_SHEETS.values()) | set(RANDOM_NOISE_AVO_SHEETS.values()) | set(DEBLENDING_SEGC3_SHEETS.values()) | set(DEBLENDING_AVO_SHEETS.values())


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


def get_default_meta(model_id, models):
    m = next((x for x in models if x["id"] == model_id), None)
    if m:
        return m.get("paper_url"), m.get("code_url")
    return None, None


def process_excel(path, sheet_map, method_map, results, results_index, models, create_missing=False, meta_source_map=None):
    """Update or create result entries from an Excel. Returns (updated, created, skipped_methods)."""
    updated = 0
    created = 0
    skipped = set()
    for sheet, bench_id in sheet_map.items():
        df = pd.read_excel(path, sheet_name=sheet)
        for _, row in df.iterrows():
            method = str(row.get("Method", "")).strip()
            if method in ("Raw (noisy)", "Raw (pseudo-deblended)", "Input", "Raw"):
                continue
            model_id = method_map.get(method)
            if not model_id:
                skipped.add(method)
                continue
            key = (model_id, bench_id)
            if key in results_index:
                r = results_index[key]
                created_flag = False
            elif create_missing:
                r = {"model_id": model_id, "benchmark_id": bench_id, "scores": {}}
                # copy meta from same model's existing result when possible
                paper_url, code_url = None, None
                if meta_source_map and model_id in meta_source_map:
                    src = meta_source_map[model_id]
                    paper_url = src.get("paper_url")
                    code_url = src.get("code_url")
                if not paper_url:
                    paper_url, _ = get_default_meta(model_id, models)
                if not code_url:
                    _, code_url = get_default_meta(model_id, models)
                r["paper_url"] = paper_url
                r["code_url"] = code_url
                r["date_added"] = TODAY
                results.append(r)
                results_index[key] = r
                created_flag = True
            else:
                skipped.add(f"{method} -> {bench_id}")
                continue
            if "scores_std" not in r or r["scores_std"] is None:
                r["scores_std"] = {}
            for col, metric in COL_TO_METRIC.items():
                if col not in df.columns:
                    continue
                mean, std = parse_value(row[col])
                if mean is None:
                    continue
                r["scores"][metric] = mean
                if std is not None:
                    r["scores_std"][metric] = std
            if created_flag:
                created += 1
            else:
                updated += 1
    return updated, created, skipped


def recalc_counts(benchmarks, results):
    counts = {}
    for r in results:
        counts.setdefault(r["benchmark_id"], set()).add(r["model_id"])
    for b in benchmarks:
        if b["id"] in AFFECTED_BENCHMARK_IDS:
            b["model_count"] = len(counts.get(b["id"], set()))


def main():
    models = json.loads((DATA_DIR / "models.json").read_text(encoding="utf-8"))
    benchmarks = json.loads((DATA_DIR / "benchmarks.json").read_text(encoding="utf-8"))
    results = json.loads((DATA_DIR / "results.json").read_text(encoding="utf-8"))
    results_index = {(r["model_id"], r["benchmark_id"]): r for r in results}

    # Helper: map model_id -> any existing result for meta copy (prefer SEGC3 random-noise)
    random_meta_source = {}
    for r in results:
        if r["benchmark_id"].startswith("segc3-random-noise") and r["model_id"] not in random_meta_source:
            random_meta_source[r["model_id"]] = r

    total_updated = 0
    total_created = 0

    print("Processing SEGC3 random noise...")
    u, c, s = process_excel(
        RAR_DIR / "random_noise_suppression" / "batch_evaluation_results.xlsx",
        RANDOM_NOISE_SEGC3_SHEETS,
        RANDOM_NOISE_METHOD_MAP,
        results, results_index, models,
        create_missing=True,
        meta_source_map=random_meta_source,
    )
    total_updated += u
    print(f"  updated {u}, created {c}, skipped {sorted(s) if s else 'none'}")

    print("Processing Mobile AVO random noise (creating missing entries)...")
    u, c, s = process_excel(
        RAR_DIR / "random_noise_suppression_avo" / "batch_evaluation_results.xlsx",
        RANDOM_NOISE_AVO_SHEETS,
        RANDOM_NOISE_METHOD_MAP,
        results, results_index, models,
        create_missing=True,
        meta_source_map=random_meta_source,
    )
    total_updated += u
    total_created += c
    print(f"  updated {u}, created {c}, skipped {sorted(s) if s else 'none'}")

    print("Processing SEGC3 deblending (creating non-avo entries)...")
    u, c, s = process_excel(
        RAR_DIR / "blending_noise_suppression" / "batch_evaluation_results.xlsx",
        DEBLENDING_SEGC3_SHEETS,
        DEBLENDING_SEGC3_METHOD_MAP,
        results, results_index, models,
        create_missing=True,
    )
    total_updated += u
    total_created += c
    print(f"  updated {u}, created {c}, skipped {sorted(s) if s else 'none'}")

    print("Processing Mobile AVO deblending...")
    u, c, s = process_excel(
        RAR_DIR / "blending_noise_suppression_avo" / "batch_evaluation_results.xlsx",
        DEBLENDING_AVO_SHEETS,
        DEBLENDING_AVO_METHOD_MAP,
        results, results_index, models,
    )
    total_updated += u
    total_created += c
    print(f"  updated {u}, created {c}, skipped {sorted(s) if s else 'none'}")

    # Remove incorrectly assigned -avo deblending results from SEGC3 benchmarks.
    segc3_deblend_bids = set(DEBLENDING_SEGC3_SHEETS.values())
    before = len(results)
    results = [
        r for r in results
        if not (r["benchmark_id"] in segc3_deblend_bids and r["model_id"].endswith("-blending-noise-avo"))
    ]
    removed = before - len(results)
    if removed:
        print(f"  removed {removed} incorrect -avo entries from SEGC3 deblending benchmarks")

    # Rebuild index and recalc counts
    results_index = {(r["model_id"], r["benchmark_id"]): r for r in results}
    recalc_counts(benchmarks, results)

    (DATA_DIR / "results.json").write_text(
        json.dumps(results, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (DATA_DIR / "benchmarks.json").write_text(
        json.dumps(benchmarks, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"Done. updated={total_updated}, created={total_created}, removed={removed}. Total results={len(results)}")


if __name__ == "__main__":
    main()
