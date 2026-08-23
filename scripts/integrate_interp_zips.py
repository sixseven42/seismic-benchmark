#!/usr/bin/env python3
"""Integrate interpolation results from field (czt0820) and synthetic (czt0822) zips."""
import json
import zipfile
import tempfile
from collections import Counter
from pathlib import Path

ROOT = Path(r'C:\Code\benchmark')
MODELS_PATH = ROOT / 'src' / 'data' / 'models.json'
BENCH_PATH = ROOT / 'src' / 'data' / 'benchmarks.json'
RESULTS_PATH = ROOT / 'src' / 'data' / 'results.json'

ZIPS = {
    'field': Path(r'C:\Users\admin\Documents\WeChat Files\wxid_hvmr1h95e7jn22\FileStorage\File\2026-08\interp_field_czt0820.zip'),
    'syn': Path(r'C:\Users\admin\Documents\WeChat Files\wxid_hvmr1h95e7jn22\FileStorage\File\2026-08\interp_syn_czt0822.zip'),
}

BENCHMARK_MAP = {
    # field zip
    'interp-continuous-miss20tr': 'segc3-interp-continuous20tr',
    'interp-continuous-miss30tr': 'segc3-interp-continuous30tr',
    'interp-continuous-miss40tr': 'segc3-interp-continuous40tr',
    'interp-random-miss30': 'segc3-interp-random30',
    'interp-random-miss50': 'segc3-interp-random50',
    'interp-uniform-miss50': 'segc3-interp-uniform50',
    'interp-uniform-miss70': 'segc3-interp-uniform70',
    # synthetic zip
    'interp-continuous-20tr': 'segc3-interp-continuous20tr',
    'interp-continuous-30tr': 'segc3-interp-continuous30tr',
    'interp-continuous-40tr': 'segc3-interp-continuous40tr',
    'interp-random-30': 'segc3-interp-random30',
    'interp-random-50': 'segc3-interp-random50',
    'interp-uniform-50': 'segc3-interp-uniform50',
    'interp-uniform-70': 'segc3-interp-uniform70',
}

CORE_METRICS = ['snr', 'psnr', 'ssim', 'mae', 'mse', 'rmse']
BINNED_METRICS = [
    'eb_wse_medium_40_70_ne', 'eb_wse_medium_40_70_snr',
    'eb_wse_strong_70_100_ne', 'eb_wse_strong_70_100_snr',
    'eb_wse_very_weak_5_20_ne', 'eb_wse_very_weak_5_20_snr',
    'eb_wse_weak_20_40_ne', 'eb_wse_weak_20_40_snr',
    'fb_fre_high_ne', 'fb_fre_high_snr',
    'fb_fre_low_ne', 'fb_fre_low_snr',
    'fb_fre_mid_ne', 'fb_fre_mid_snr',
    'fb_fre_very_high_ne', 'fb_fre_very_high_snr',
]
VALID_METRICS = set(CORE_METRICS + BINNED_METRICS)
ALL_METRICS = CORE_METRICS + BINNED_METRICS


def load_json(path):
    with path.open('r', encoding='utf-8') as f:
        return json.load(f)


def save_json(path, data):
    with path.open('w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')


def clean_scores(scores):
    return {k: float(v) for k, v in scores.items() if k in VALID_METRICS and v is not None}


def extract_zip(zippath):
    tmp = tempfile.mkdtemp()
    with zipfile.ZipFile(zippath, 'r') as z:
        z.extractall(tmp)
    return Path(tmp)


def find_json_files(root):
    results = []
    models = []
    for p in root.rglob('*.json'):
        if '__MACOSX' in p.parts:
            continue
        name = p.name.lower()
        if name.startswith('interpolation_result'):
            results.append(p)
        elif name.startswith('interpolation_model'):
            models.append(p)
    return models, results


def add_models(models_data, model_files):
    existing_ids = {m['id'] for m in models_data}
    added = 0
    for mp in model_files:
        raw = load_json(mp)
        mid = raw.get('id')
        if not mid or mid in existing_ids:
            continue
        # fill required fields
        model = {
            'id': mid,
            'name': raw.get('name') or mid,
            'authors': raw.get('authors') or 'Unknown',
            'org': 'Unknown',
            'year': raw.get('year') or 2026,
            'emoji': '🔧',
            'type': raw.get('type', 'deep_learning'),
            'tasks': raw.get('tasks', ['interpolation']),
            'description': f"{raw.get('name') or mid} for seismic interpolation.",
            'paper_url': raw.get('paper_url') or None,
            'code_url': raw.get('code_url') or None,
            'weights_url': None,
            'is_open_source': True,
            'parameters_m': raw.get('parameters_m'),
        }
        models_data.append(model)
        existing_ids.add(mid)
        added += 1
        print(f'Added model {mid}')
    return added


def integrate_results(results_data, result_files):
    existing = {(r['model_id'], r['benchmark_id']): r for r in results_data}
    added = 0
    replaced = 0
    skipped = 0
    for rp in result_files:
        entries = load_json(rp)
        if isinstance(entries, dict):
            entries = entries.get('results', [entries])
        for entry in entries:
            raw_bench = entry.get('benchmark_id')
            if raw_bench not in BENCHMARK_MAP:
                skipped += 1
                continue
            bench_id = BENCHMARK_MAP[raw_bench]
            model_id = entry.get('model_id')
            if not model_id:
                continue
            scores = clean_scores(entry.get('scores', {}))
            result = {
                'model_id': model_id,
                'benchmark_id': bench_id,
                'scores': scores,
                'paper_url': entry.get('paper_url') or None,
                'code_url': entry.get('code_url') or None,
                'date_added': '2026-08-23',
            }
            key = (model_id, bench_id)
            if key in existing:
                existing[key].update(result)
                replaced += 1
            else:
                results_data.append(result)
                existing[key] = result
                added += 1
    print(f'Results: added={added}, replaced={replaced}, skipped={skipped}')
    return added, replaced


def update_benchmarks(benchmarks_data, results_data):
    bench_by_id = {b['id']: b for b in benchmarks_data}
    counts = Counter(r['benchmark_id'] for r in results_data)
    affected = set(BENCHMARK_MAP.values())
    for bench_id in affected:
        b = bench_by_id.get(bench_id)
        if not b:
            continue
        b['metrics'] = ALL_METRICS
        b['model_count'] = counts.get(bench_id, b.get('model_count', 0))
        print(f'Updated benchmark {bench_id}: model_count={b["model_count"]}')


def main():
    models = load_json(MODELS_PATH)
    benchmarks = load_json(BENCH_PATH)
    results = load_json(RESULTS_PATH)

    all_model_files = []
    all_result_files = []
    for label, zippath in ZIPS.items():
        tmp = extract_zip(zippath)
        mfiles, rfiles = find_json_files(tmp)
        print(f'{label}: {len(mfiles)} model files, {len(rfiles)} result files')
        all_model_files.extend(mfiles)
        all_result_files.extend(rfiles)

    add_models(models, all_model_files)
    integrate_results(results, all_result_files)
    update_benchmarks(benchmarks, results)

    save_json(MODELS_PATH, models)
    save_json(BENCH_PATH, benchmarks)
    save_json(RESULTS_PATH, results)
    print('Done.')


if __name__ == '__main__':
    main()
