#!/usr/bin/env python3
"""Update first-arrival picking (first-break) model parameters_m from the
markdown summary file `初至拾取模型参数量汇总.md`.
"""

import json
import re
from pathlib import Path

DATA_DIR = Path("src/data")
MD_PATH = Path(r"C:\Users\admin\Documents\WeChat Files\wxid_hvmr1h95e7jn22\FileStorage\File\2026-08\初至拾取模型参数量汇总.md")

NAME_TO_MODEL_ID = {
    "U-Net": "unet-first-break",
    "ResUNet": "res-unet-first-break",
    "Attention U-Net": "attention-unet-first-break",
    "DnCNN Seg": "dncnn-seg-first-break",
    "DSU-Net": "wang2024dsunet_first_break_picking",
    "HUNet": "pu2024hu_net_first_arrival_accuracy",
    "STUNet": "jiang2023swin_transformer_first_break",
    "U-Net Plus": "unet-first-break-plus",
    "ResUNet Plus": "res-unet-first-break-plus",
    "Attention U-Net Plus": "attention-unet-first-break-plus",
}


def parse_params_m(value: str) -> float:
    """Parse a string like '7.762465M' to a float and round to 2 decimals."""
    s = value.strip()
    if s.endswith("M"):
        s = s[:-1]
    return round(float(s), 2)


def main():
    models = json.loads((DATA_DIR / "models.json").read_text(encoding="utf-8"))
    models_by_id = {m["id"]: m for m in models}

    updates = []
    md_text = MD_PATH.read_text(encoding="utf-8")
    for line in md_text.splitlines():
        line = line.strip()
        if not line.startswith("|"):
            continue
        # Skip header/separator lines
        if re.search(r"^\|[\s-]*类别", line) or re.search(r"^\|[\s-]+\|[\s-]+", line):
            continue
        parts = [p.strip() for p in line.split("|")]
        # parts layout: ['', category, model, registry, config, runs, total, trainable, params_m, mem, '']
        if len(parts) < 9:
            continue
        model_name = parts[2]
        params_cell = parts[8]
        if model_name not in NAME_TO_MODEL_ID:
            continue
        model_id = NAME_TO_MODEL_ID[model_name]
        params_m = parse_params_m(params_cell)
        models_by_id[model_id]["parameters_m"] = params_m
        updates.append((model_id, model_name, params_m))

    (DATA_DIR / "models.json").write_text(
        json.dumps(models, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    print(f"Updated {len(updates)} models:")
    for model_id, name, params_m in updates:
        print(f"  {model_id} ({name}): {params_m} M")


if __name__ == "__main__":
    main()
