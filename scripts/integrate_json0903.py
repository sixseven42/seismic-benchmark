#!/usr/bin/env python3
"""Integrate results from json0903.rar into the benchmark repo.

Covers:
- blending_noise_suppression -> deblending (SEGC3 common-receiver deblending)
- blending_noise_suppression_avo -> deblending (AVO deblending)
- random_noise_suppression -> random_noise_suppression (SEGC3 random noise)
- random_noise_suppression_avo -> random_noise_suppression (AVO synthetic random noise)

New models are added/merged, new AVO random-noise benchmarks are created,
result scores (22 metrics) and scores_std are parsed from the Excel files,
and affected benchmark model_count values are recalculated.
"""

from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path

import pandas as pd

DATA_DIR = Path("src/data")
SRC_ROOT = Path("tmp/json0903/json0903")
TODAY = datetime.now().strftime("%Y-%m-%d")

TASK_MAP = {
    "blending_noise_suppression": "deblending",
    "blending_noise_suppression_avo": "deblending",
    "random_noise_suppression": "random_noise_suppression",
    "random_noise_suppression_avo": "random_noise_suppression",
}

SUFFIX_MAP = {
    "blending_noise_suppression": "-blending-noise",
    "blending_noise_suppression_avo": "-blending-noise-avo",
    "random_noise_suppression": "-random-noise",
    "random_noise_suppression_avo": "-random-noise-avo",
}

CORE_METRICS = ["snr", "psnr", "ssim", "mae", "mse", "rmse"]
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
ALL_22_METRICS = CORE_METRICS + BINNED_METRICS

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

BASE_MAP = {
    "unet": "unet",
    "unet_L": "unet_L",
    "dncnn": "dncnn",
    "atten_unet": "attention-unet",
    "res_unet": "res-unet",
    "SCRN": "scrn",
    "ffcnn": "ffcnn",
    "fbresnet": "fbresnet",
    "q_unet": "q-unet",
    "unet_plusplus": "unet-plusplus",
    "ddpm": "cddpm",
    "cbdrdn": "cbdrdn",
}


def source_id_to_repo_id(source_id: str, task: str) -> str:
    suffix = SUFFIX_MAP[task]
    if source_id.endswith(suffix):
        base = source_id[: -len(suffix)]
    else:
        base = source_id

    if base == "res_unet" and task.startswith("blending"):
        repo_base = "res_unet"
    elif base == "q_unet" and task.startswith("blending"):
        repo_base = "q_unet"
    else:
        repo_base = BASE_MAP.get(base, base.lower())
    return f"{repo_base}{suffix}"


def method_to_base(method: str) -> str:
    method = method.strip()
    mapping = {
        "UNet": "unet",
        "UNet-L": "unet_L",
        "UNet_L": "unet_L",
        "DnCNN": "dncnn",
        "Attention UNet": "atten_unet",
        "ResUNet": "res_unet",
        "SCRN": "SCRN",
        "FFCNN": "ffcnn",
        "FBResNet": "fbresnet",
        "q_unet": "q_unet",
        "QUNet": "q_unet",
        "Q-UNet": "q_unet",
        "unet_plusplus": "unet_plusplus",
        "UNet++": "unet_plusplus",
        "DDPM": "ddpm",
        "cbdrdn": "cbdrdn",
        "CBD-RDN": "cbdrdn",
    }
    return mapping.get(method, method)


def method_to_repo_id(method: str, task: str) -> str | None:
    if method.strip() in ("Input", "Raw (noisy)"):
        return None
    base = method_to_base(method)
    source_id = f"{base}{SUFFIX_MAP[task]}"
    return source_id_to_repo_id(source_id, task)


def benchmark_id_for_sheet(task: str, sheet: str) -> str:
    if task == "blending_noise_suppression":
        return f"blending-noise-{sheet}"
    if task == "blending_noise_suppression_avo":
        return "blending-noise-avo-T03_avo_mod"
    noise_type, snr_part = sheet.rsplit("_", 1)
    snr_map = {"-5dB": "snrneg5", "0dB": "snr0", "5dB": "snr5"}
    snr = snr_map.get(snr_part, snr_part.lower())
    if task == "random_noise_suppression":
        return f"segc3-random-noise-{noise_type}-{snr}"
    if task == "random_noise_suppression_avo":
        return f"random-noise-avo-{noise_type}-{snr}"
    raise ValueError(f"Unknown task {task}")


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


def group_name_for_benchmark(benchmark_id: str) -> str:
    if benchmark_id.startswith("segc3-random-noise"):
        return "SEGC3 Random Noise"
    if benchmark_id.startswith("random-noise-avo"):
        return "AVO Random Noise"
    if benchmark_id.startswith("blending-noise-avo"):
        return "AVO Common-Receiver Deblending"
    if benchmark_id.startswith("blending-noise-T02"):
        return "Common-Receiver Deblending"
    return ""


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main():
    models = load_json(DATA_DIR / "models.json")
    benchmarks = load_json(DATA_DIR / "benchmarks.json")
    results = load_json(DATA_DIR / "results.json")

    models_by_id = {m["id"]: m for m in models}
    benchmarks_by_id = {b["id"]: b for b in benchmarks}
    results_index = {(r["model_id"], r["benchmark_id"]): r for r in results}

    affected_benchmark_ids = set()
    param_updates = {}

    for task_dir in sorted(SRC_ROOT.iterdir()):
        if not task_dir.is_dir():
            continue
        src_task = task_dir.name
        repo_task = TASK_MAP[src_task]

        # ---- models ----
        model_dir = task_dir / "record_random" / "model"
        if model_dir.exists():
            for model_file in sorted(model_dir.glob("*.json")):
                src_model = load_json(model_file)
                repo_id = source_id_to_repo_id(src_model["id"], src_task)
                if repo_id in models_by_id:
                    existing = models_by_id[repo_id]
                    if repo_task not in existing.get("tasks", []):
                        existing.setdefault("tasks", []).append(repo_task)
                else:
                    new_model = dict(src_model)
                    new_model["id"] = repo_id
                    new_model["tasks"] = [repo_task]
                    models.append(new_model)
                    models_by_id[repo_id] = new_model

        # ---- benchmarks ----
        bench_file = task_dir / "record_random" / f"{src_task}_benchmarks.json"
        if bench_file.exists():
            for src_bench in load_json(bench_file):
                bench_id = src_bench["id"]
                affected_benchmark_ids.add(bench_id)
                if bench_id in benchmarks_by_id:
                    existing = benchmarks_by_id[bench_id]
                    existing["task"] = repo_task
                    existing["metrics"] = ALL_22_METRICS
                    if not existing.get("group_name"):
                        existing["group_name"] = group_name_for_benchmark(bench_id)
                else:
                    new_bench = dict(src_bench)
                    new_bench["task"] = repo_task
                    new_bench["metrics"] = ALL_22_METRICS
                    new_bench["group_name"] = group_name_for_benchmark(bench_id)
                    benchmarks.append(new_bench)
                    benchmarks_by_id[bench_id] = new_bench

        # ---- results / parameters ----
        excel = task_dir / "batch_evaluation_results.xlsx"
        if not excel.exists():
            continue
        xl = pd.ExcelFile(excel)
        for sheet in xl.sheet_names:
            benchmark_id = benchmark_id_for_sheet(src_task, sheet)
            affected_benchmark_ids.add(benchmark_id)
            df = pd.read_excel(excel, sheet_name=sheet)
            for _, row in df.iterrows():
                method = str(row["Method"]).strip()
                if method in ("Input", "Raw (noisy)"):
                    continue
                model_id = method_to_repo_id(method, src_task)
                if not model_id:
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

                r["date_added"] = TODAY

    # Update parameters_m from Excel values
    for model in models:
        if model["id"] in param_updates:
            model["parameters_m"] = round(param_updates[model["id"]], 2)

    # Recalculate model_count for all benchmarks
    counts = {}
    for r in results:
        counts.setdefault(r["benchmark_id"], set()).add(r["model_id"])
    for b in benchmarks:
        b["model_count"] = len(counts.get(b["id"], set()))

    save_json(DATA_DIR / "models.json", models)
    save_json(DATA_DIR / "benchmarks.json", benchmarks)
    save_json(DATA_DIR / "results.json", results)

    print(f"Updated models: {len(models)}")
    print(f"Updated benchmarks: {len(benchmarks)}")
    print(f"Updated results: {len(results)}")
    print(f"Affected benchmark ids: {sorted(affected_benchmark_ids)}")


if __name__ == "__main__":
    main()
