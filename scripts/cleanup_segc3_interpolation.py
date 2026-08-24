#!/usr/bin/env python3
"""Simplify SEGC3 interpolation benchmarks to canonical variants only."""
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(r'C:\Code\benchmark')
BENCH_PATH = ROOT / 'src' / 'data' / 'benchmarks.json'
RESULTS_PATH = ROOT / 'src' / 'data' / 'results.json'
PAGE_PATH = ROOT / 'src' / 'pages' / 'BenchmarksPage.tsx'

KEEP_SEGC3 = {
    'segc3-interp-random30',
    'segc3-interp-random50',
    'segc3-interp-random70',
    'segc3-interp-uniform50',
    'segc3-interp-uniform75',
    'segc3-interp-continuous20tr',
    'segc3-interp-continuous30tr',
    'segc3-interp-continuous40tr',
}

MERGE = {
    'segc3-interp-uniform70': 'segc3-interp-uniform75',
}


def load_json(path):
    with path.open('r', encoding='utf-8') as f:
        return json.load(f)


def save_json(path, data):
    with path.open('w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')


def simplify_results(results):
    existing = {(r['model_id'], r['benchmark_id']): r for r in results}
    kept = []
    moved = 0
    discarded = 0
    for r in results:
        bid = r['benchmark_id']
        mid = r['model_id']
        if bid in MERGE:
            new_bid = MERGE[bid]
            key = (mid, new_bid)
            if key not in existing:
                r['benchmark_id'] = new_bid
                existing[key] = r
                kept.append(r)
                moved += 1
            else:
                # 75% result already exists; discard 70% duplicate
                discarded += 1
        elif bid.startswith('segc3-interp-') and bid not in KEEP_SEGC3:
            discarded += 1
            continue
        else:
            kept.append(r)
    print(f'Results: moved={moved}, discarded={discarded}, kept={len(kept)}')
    return kept


def simplify_benchmarks(benchmarks):
    kept = []
    removed = []
    for b in benchmarks:
        bid = b['id']
        if bid.startswith('segc3-interp-') and bid not in KEEP_SEGC3:
            removed.append(bid)
            continue
        kept.append(b)
    print(f'Benchmarks removed: {len(removed)}')
    for bid in removed:
        print(f'  - {bid}')
    return kept


def recalc_counts(benchmarks, results):
    counts = Counter(r['benchmark_id'] for r in results)
    for b in benchmarks:
        if b['task'] == 'interpolation':
            old = b['model_count']
            b['model_count'] = counts.get(b['id'], 0)
            if old != b['model_count']:
                print(f'Recalc {b["id"]}: {old} -> {b["model_count"]}')


def update_group_descriptions(page_text):
    # Update Random Missing description
    page_text = re.sub(
        r"('SEGC3 Random Missing':\s*').*?(')",
        r"\1A suite of synthetic 3D seismic interpolation benchmarks based on the SEG China 3D (SEGC3) geological model with randomly missing traces at fixed ratios (30%, 50%, 70%). Each variant provides paired incomplete and complete data, enabling systematic evaluation of interpolation methods under random spatial subsampling conditions.\2",
        page_text,
        flags=re.DOTALL,
    )
    # Update Uniform Missing description
    page_text = re.sub(
        r"('SEGC3 Uniform Missing':\s*').*?(')",
        r"\1A suite of synthetic 3D seismic interpolation benchmarks based on the SEG China 3D (SEGC3) geological model with uniformly missing traces at fixed ratios (50% and 75%). Each variant provides paired incomplete and complete data, enabling systematic evaluation of interpolation methods under uniform spatial subsampling conditions.\2",
        page_text,
        flags=re.DOTALL,
    )
    # Update Continuous Missing description
    page_text = re.sub(
        r"('SEGC3 Continuous Missing':\s*').*?(')",
        r"\1A suite of synthetic 3D seismic interpolation benchmarks based on the SEG China 3D (SEGC3) geological model with continuously missing traces at fixed lengths (20, 30, 40 traces). Each variant provides paired incomplete and complete data, enabling systematic evaluation of interpolation methods under continuous spatial gap conditions.\2",
        page_text,
        flags=re.DOTALL,
    )
    return page_text


def main():
    benchmarks = load_json(BENCH_PATH)
    results = load_json(RESULTS_PATH)

    results = simplify_results(results)
    benchmarks = simplify_benchmarks(benchmarks)
    recalc_counts(benchmarks, results)

    save_json(RESULTS_PATH, results)
    save_json(BENCH_PATH, benchmarks)

    page_text = PAGE_PATH.read_text(encoding='utf-8')
    page_text = update_group_descriptions(page_text)
    PAGE_PATH.write_text(page_text, encoding='utf-8')

    print('Done')


if __name__ == '__main__':
    main()
