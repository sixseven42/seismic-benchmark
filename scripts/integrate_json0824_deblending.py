#!/usr/bin/env python3
"""Integrate the 2026-08-24 deblending update from json0824.rar + benchmarks(1).json.

Only deblending benchmarks/results/models are touched; every other task is left unchanged.
"""

import json
import re
import shutil
from pathlib import Path

import pandas as pd

REPO = Path(__file__).resolve().parent.parent
DATA_DIR = REPO / "src" / "data"
PUBLIC_DATASETS = REPO / "public" / "datasets"
TMP_ROOT = REPO / ".tmp_json0824" / "json0824"
BENCHMARKS_NEW_PATH = Path(
    r"C:\Users\admin\Documents\WeChat Files\wxid_hvmr1h95e7jn22\FileStorage\File\2026-08\benchmarks(1).json"
)

OLD_DEBLENDING_BENCHMARK_IDS = {
    "mobile-avo-deblending-t03-mod",
    "segc3-deblending-t02-mod",
    "segc3-deblending-t02-simp",
    "segc3-deblending-t02-comp",
}

NEW_TASK = "deblending"

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


def normalize_name(name: str) -> str:
    return re.sub(r"[^a-z0-9+]", "", name.lower())


def parse_mean_std(value):
    """Return (mean, std) from strings like '14.7039+-0.243086' or numeric cells."""
    if isinstance(value, (int, float)):
        return float(value), None
    text = str(value).strip()
    if "+-" in text:
        parts = text.split("+-")
        mean = float(parts[0].strip())
        std = float(parts[1].strip()) if len(parts) > 1 and parts[1].strip() not in ("", "0") else 0.0
        return mean, std
    # plain number
    return float(text), None


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def collect_new_models():
    """Load deblending model definitions from the rar, ready to append."""
    models = []
    model_id_by_norm = {}
    for task in ["blending_noise_suppression", "blending_noise_suppression_avo"]:
        model_dir = TMP_ROOT / task / "record_random" / "model"
        for f in sorted(model_dir.glob("*.json")):
            model = load_json(f)
            model["tasks"] = [NEW_TASK]
            # parameters_m will be filled from Excel
            model["parameters_m"] = None
            models.append(model)
            model_id_by_norm[normalize_name(model["name"])] = model["id"]
    return models, model_id_by_norm


def collect_parameters(excel_path: Path) -> dict:
    """Map normalized method name -> parameters_m from the first sheet."""
    params = {}
    xls = pd.ExcelFile(excel_path)
    df = pd.read_excel(xls, sheet_name=xls.sheet_names[0])
    for _, row in df.iterrows():
        method = str(row["Method"]).strip()
        if method.lower() == "input":
            continue
        p = row["Parameters (M)"]
        if pd.isna(p) or str(p).strip() in ("", "-"):
            continue
        params[normalize_name(method)] = float(str(p).strip())
    return params


def make_results(excel_path: Path, sheet_to_benchmark: dict, model_id_by_norm: dict, paper_url: str, code_url: str):
    """Return Result dicts from a deblending Excel workbook."""
    results = []
    xls = pd.ExcelFile(excel_path)
    for sheet, benchmark_id in sheet_to_benchmark.items():
        df = pd.read_excel(xls, sheet_name=sheet)
        for _, row in df.iterrows():
            method = str(row["Method"]).strip()
            if method.lower() == "input":
                continue
            norm = normalize_name(method)
            model_id = model_id_by_norm.get(norm)
            if not model_id:
                print(f"  Warning: no model for method '{method}' in sheet '{sheet}'")
                continue
            scores = {}
            scores_std = {}
            for col, metric in METRIC_MAP.items():
                if col not in df.columns:
                    continue
                value = row[col]
                if pd.isna(value):
                    continue
                mean, std = parse_mean_std(value)
                scores[metric] = mean
                if std is not None:
                    scores_std[metric] = std
            result = {
                "model_id": model_id,
                "benchmark_id": benchmark_id,
                "scores": scores,
                "scores_std": scores_std,
                "paper_url": paper_url,
                "code_url": code_url,
                "date_added": "2026-08-24",
            }
            results.append(result)
    return results


def copy_assets():
    """Copy representative deblending images to public/datasets."""
    PUBLIC_DATASETS.mkdir(parents=True, exist_ok=True)
    segc3_assets = TMP_ROOT / "blending_noise_suppression" / "assets"
    avo_assets = TMP_ROOT / "blending_noise_suppression_avo" / "assets"
    # Use the moderate blending scenario as input and clean as target.
    copies = [
        (segc3_assets / "moderate.png", PUBLIC_DATASETS / "deblending-input.png"),
        (segc3_assets / "clean.png", PUBLIC_DATASETS / "deblending-target.png"),
        (avo_assets / "moderate.png", PUBLIC_DATASETS / "deblending-avo-input.png"),
        (avo_assets / "clean.png", PUBLIC_DATASETS / "deblending-avo-target.png"),
    ]
    for src, dst in copies:
        if src.exists():
            shutil.copy2(src, dst)
            print(f"  copied {src.name} -> {dst.name}")
        else:
            print(f"  Warning: asset missing {src}")


def recalc_model_counts(benchmarks, results):
    counts = {}
    for r in results:
        bid = r["benchmark_id"]
        counts.setdefault(bid, set()).add(r["model_id"])
    for b in benchmarks:
        b["model_count"] = len(counts.get(b["id"], set()))


def main():
    print("Loading repo data...")
    models = load_json(DATA_DIR / "models.json")
    benchmarks = load_json(DATA_DIR / "benchmarks.json")
    results = load_json(DATA_DIR / "results.json")

    print("Loading new deblending models...")
    new_models, model_id_by_norm = collect_new_models()

    print("Extracting parameters from Excel...")
    seg_params = collect_parameters(TMP_ROOT / "blending_noise_suppression" / "batch_evaluation_results.xlsx")
    avo_params = collect_parameters(TMP_ROOT / "blending_noise_suppression_avo" / "batch_evaluation_results.xlsx")
    for m in new_models:
        norm = normalize_name(m["name"])
        m["parameters_m"] = seg_params.get(norm) or avo_params.get(norm)
        if m["parameters_m"] is None:
            print(f"  Warning: no parameters for {m['id']}")

    print("Loading new deblending benchmarks from benchmarks(1).json...")
    new_benchmarks_all = load_json(BENCHMARKS_NEW_PATH)
    new_deblending_benchmarks = [
        b for b in new_benchmarks_all
        if b["task"].startswith("blending_noise_suppression")
    ]
    print(f"  found {len(new_deblending_benchmarks)} new deblending benchmarks")
    for b in new_deblending_benchmarks:
        b["task"] = NEW_TASK
        b["model_count"] = 0

    print("Creating new result entries from Excel...")
    seg_results = make_results(
        TMP_ROOT / "blending_noise_suppression" / "batch_evaluation_results.xlsx",
        {"T02_mod": "blending-noise-T02_mod", "T02_comp": "blending-noise-T02_comp", "T02_simp": "blending-noise-T02_simp"},
        model_id_by_norm,
        "https://huggingface.co/datasets/GeoBrain/deblending-common-receiver",
        "https://huggingface.co/datasets/GeoBrain/deblending-common-receiver",
    )
    avo_results = make_results(
        TMP_ROOT / "blending_noise_suppression_avo" / "batch_evaluation_results.xlsx",
        {"T03_avo_mod": "blending-noise-avo-T03_avo_mod"},
        model_id_by_norm,
        "https://huggingface.co/datasets/GeoBrain/deblending-common-receiver-avo",
        "https://huggingface.co/datasets/GeoBrain/deblending-common-receiver-avo",
    )
    new_results = seg_results + avo_results
    print(f"  created {len(new_results)} new results")

    print("Updating repo data structures...")
    # 1) models: remove deblending from canonical UNet++ and append new models
    for m in models:
        if m["id"] == "zhou2018unet_plusplus_denoise" and NEW_TASK in (m.get("tasks") or []):
            m["tasks"] = [t for t in m["tasks"] if t != NEW_TASK]
    existing_ids = {m["id"] for m in models}
    for m in new_models:
        if m["id"] not in existing_ids:
            models.append(m)
            existing_ids.add(m["id"])

    # 2) benchmarks: drop old deblending, add new
    benchmarks = [b for b in benchmarks if b["id"] not in OLD_DEBLENDING_BENCHMARK_IDS]
    existing_bench_ids = {b["id"] for b in benchmarks}
    for b in new_deblending_benchmarks:
        if b["id"] not in existing_bench_ids:
            benchmarks.append(b)
            existing_bench_ids.add(b["id"])

    # 3) results: drop old deblending, add new
    results = [r for r in results if r["benchmark_id"] not in OLD_DEBLENDING_BENCHMARK_IDS]
    results.extend(new_results)

    # 4) recalc model_count
    recalc_model_counts(benchmarks, results)

    print("Copying visualization assets...")
    copy_assets()

    print("Saving JSON files...")
    save_json(DATA_DIR / "models.json", models)
    save_json(DATA_DIR / "benchmarks.json", benchmarks)
    save_json(DATA_DIR / "results.json", results)

    print("Done.")
    print(f"  models: +{len(new_models)}")
    print(f"  benchmarks: -{len(OLD_DEBLENDING_BENCHMARK_IDS)} +{len(new_deblending_benchmarks)}")
    print(f"  results: +{len(new_results)}")


if __name__ == "__main__":
    main()
