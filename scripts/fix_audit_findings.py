#!/usr/bin/env python3
"""Fix audit findings: fbp group_name + segc3-interp-random70 metrics declaration."""
import json
from pathlib import Path

DATA = Path("src/data")

benchmarks = json.loads((DATA / "benchmarks.json").read_text(encoding="utf-8"))

# 22-metric declaration used by all other interpolation benchmarks
FULL_22 = [
    "snr", "psnr", "ssim", "mae", "mse", "rmse",
    "eb_wse_medium_40_70_ne", "eb_wse_medium_40_70_snr",
    "eb_wse_strong_70_100_ne", "eb_wse_strong_70_100_snr",
    "eb_wse_very_weak_5_20_ne", "eb_wse_very_weak_5_20_snr",
    "eb_wse_weak_20_40_ne", "eb_wse_weak_20_40_snr",
    "fb_fre_high_ne", "fb_fre_high_snr",
    "fb_fre_low_ne", "fb_fre_low_snr",
    "fb_fre_mid_ne", "fb_fre_mid_snr",
    "fb_fre_very_high_ne", "fb_fre_very_high_snr",
]

fixed = []
for b in benchmarks:
    if b["id"].startswith("fbp-") and not b.get("group_name"):
        b["group_name"] = "First-Break Picking"
        fixed.append(f"{b['id']}: group_name -> First-Break Picking")
    if b["id"] == "segc3-interp-random70":
        b["metrics"] = FULL_22
        fixed.append(f"{b['id']}: metrics 6 -> 22 (与其他插值 benchmark 一致)")

(DATA / "benchmarks.json").write_text(
    json.dumps(benchmarks, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
)
print("\n".join(fixed))
