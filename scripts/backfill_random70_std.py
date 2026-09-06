#!/usr/bin/env python3
"""Backfill scores_std for mobile-avo-interp-random70 from avo_interpolation_json.zip.

Root cause: backfill_std.py ran while the repo benchmark was still named
mobile-avo-interp-random75; commit 9ba5d30 later renamed it to random70,
so the 9 random70 std entries were silently skipped.
"""
import json
import zipfile
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RESULTS_PATH = ROOT / "src" / "data" / "results.json"
AVO_INTERP_ZIP = Path(
    r"C:\Users\admin\Documents\WeChat Files\wxid_hvmr1h95e7jn22\FileStorage\File\2026-08\avo_interpolation_json.zip"
)

VALID_METRICS = set([
    "snr", "psnr", "ssim", "mae", "mse", "rmse",
    "eb_wse_medium_40_70_ne", "eb_wse_medium_40_70_snr",
    "eb_wse_strong_70_100_ne", "eb_wse_strong_70_100_snr",
    "eb_wse_very_weak_5_20_ne", "eb_wse_very_weak_5_20_snr",
    "eb_wse_weak_20_40_ne", "eb_wse_weak_20_40_snr",
    "fb_fre_high_ne", "fb_fre_high_snr",
    "fb_fre_low_ne", "fb_fre_low_snr",
    "fb_fre_mid_ne", "fb_fre_mid_snr",
    "fb_fre_very_high_ne", "fb_fre_very_high_snr",
])

# source model_id (pre-rename zip) -> current repo model_id
MODEL_MAP = {
    "avo-unet-interpolation": "avo-unet-interpolation",
    "avo-unet-plus-interpolation": "avo-unet-L-interpolation",
    "avo-resunet-interpolation": "avo-res-unet-interpolation",
    "avo-resunet-plus-interpolation": "avo-res-unet-L-interpolation",
    "avo-attention-unet-interpolation": "avo-attention-unet-interpolation",
    "avo-attention-unet-plus-interpolation": "avo-attention-unet-L-interpolation",
    "avo-dncnn-interpolation": "avo-dncnn-interpolation",
    "avo-dncnn-plus-interpolation": "avo-dncnn-L-interpolation",
    "avo-spnet-interpolation": "avo-spnet-interpolation",
}

results = json.loads(RESULTS_PATH.read_text(encoding="utf-8"))
by_key = {(r["model_id"], r["benchmark_id"]): r for r in results}

tmp = Path(tempfile.mkdtemp())
with zipfile.ZipFile(AVO_INTERP_ZIP) as z:
    z.extractall(tmp)

updated = 0
for p in tmp.rglob("*.json"):
    if "__MACOSX" in p.parts or "detailed" in p.name.lower() or "result" not in p.name.lower():
        continue
    for entry in json.loads(p.read_text(encoding="utf-8")):
        if entry.get("benchmark_id") != "avo-interp-random70":
            continue
        model_id = MODEL_MAP.get(entry.get("model_id"))
        if not model_id:
            continue
        std = entry.get("scores_std") or {}
        std_scores = {k: float(v) for k, v in std.items() if k in VALID_METRICS and v is not None}
        r = by_key.get((model_id, "mobile-avo-interp-random70"))
        if r and std_scores:
            r["scores_std"] = std_scores
            updated += 1

RESULTS_PATH.write_text(
    json.dumps(results, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
)
print(f"updated {updated} entries")
