#!/usr/bin/env python3
"""Set all DnCNN model entries to cite the Siwei Yu 2019 paper."""

import json
from pathlib import Path

DATA_DIR = Path("src/data")

TARGET = {
    "authors": "Siwei Yu, Jianwei Ma, Wenlong Wang",
    "org": "",
    "year": 2019,
    "paper_url": "https://doi.org/10.1190/geo2018-0668.1",
}


def main():
    models = json.loads((DATA_DIR / "models.json").read_text(encoding="utf-8"))
    updated = 0
    for m in models:
        if "dncnn" in m["id"].lower():
            m.update(TARGET)
            updated += 1
            print(f"  updated {m['id']}")
    (DATA_DIR / "models.json").write_text(
        json.dumps(models, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"Done. Updated {updated} DnCNN models.")


if __name__ == "__main__":
    main()
