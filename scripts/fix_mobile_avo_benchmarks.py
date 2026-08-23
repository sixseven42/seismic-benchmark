#!/usr/bin/env python3
"""Reassign field interpolation results to Mobile AVO benchmarks and add Mobile AVO interpolation benchmarks."""
import json
from collections import Counter
from pathlib import Path

ROOT = Path(r'C:\Code\benchmark')
BENCH_PATH = ROOT / 'src' / 'data' / 'benchmarks.json'
RESULTS_PATH = ROOT / 'src' / 'data' / 'results.json'

MOBILE_AVO_URL = 'https://wiki.seg.org/wiki/Mobil_AVO_viking_graben_line_12'

FIELD_MODELS = {
    'chai2020_unet', 'gated_transformer_v9', 'li2022_caunet',
    'liu2022_wrdl', 'park2022_cfunet', 'yu2022_anet',
}

SEGC3_TO_MOBILE_INTERP = {
    'segc3-interp-continuous20tr': 'mobile-avo-interp-continuous20tr',
    'segc3-interp-continuous30tr': 'mobile-avo-interp-continuous30tr',
    'segc3-interp-continuous40tr': 'mobile-avo-interp-continuous40tr',
    'segc3-interp-random30': 'mobile-avo-interp-random30',
    'segc3-interp-random50': 'mobile-avo-interp-random50',
    'segc3-interp-uniform50': 'mobile-avo-interp-uniform50',
    'segc3-interp-uniform70': 'mobile-avo-interp-uniform70',
}


def load_json(path):
    with path.open('r', encoding='utf-8') as f:
        return json.load(f)


def save_json(path, data):
    with path.open('w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')


def find_index(benchmarks, predicate):
    for i, b in enumerate(benchmarks):
        if predicate(b):
            return i
    return len(benchmarks)


def update_mobile_avo_random_noise(benchmarks):
    for b in benchmarks:
        if b['id'].startswith('mobile-avo-random-noise'):
            b['description'] = (
                'Mobile AVO Viking Graben Line 12 open-source 2D marine field dataset '
                'random-noise attenuation benchmark.'
            )
            b['citation'] = MOBILE_AVO_URL
            b['download_url'] = MOBILE_AVO_URL
            print(f'Updated {b["id"]} description/citation/download_url')


def create_mobile_avo_interpolation_benchmarks(benchmarks):
    templates = {
        'continuous20tr': next(b for b in benchmarks if b['id'] == 'segc3-interp-continuous20tr'),
        'continuous30tr': next(b for b in benchmarks if b['id'] == 'segc3-interp-continuous30tr'),
        'continuous40tr': next(b for b in benchmarks if b['id'] == 'segc3-interp-continuous40tr'),
        'random30': next(b for b in benchmarks if b['id'] == 'segc3-interp-random30'),
        'random50': next(b for b in benchmarks if b['id'] == 'segc3-interp-random50'),
        'uniform50': next(b for b in benchmarks if b['id'] == 'segc3-interp-uniform50'),
        'uniform70': next(b for b in benchmarks if b['id'] == 'segc3-interp-uniform70'),
    }
    variants = [
        ('continuous20tr', 'Continuous Missing 20 Traces'),
        ('continuous30tr', 'Continuous Missing 30 Traces'),
        ('continuous40tr', 'Continuous Missing 40 Traces'),
        ('random30', 'Random Missing 30%'),
        ('random50', 'Random Missing 50%'),
        ('uniform50', 'Uniform Missing 50%'),
        ('uniform70', 'Uniform Missing 70%'),
    ]
    insert_idx = find_index(benchmarks, lambda b: b['id'] == 'fbp-geomseg-all')
    added = 0
    for key, name_suffix in variants:
        bid = f'mobile-avo-interp-{key}'
        if any(b['id'] == bid for b in benchmarks):
            print(f'Benchmark {bid} already exists')
            continue
        if key.startswith('continuous'):
            group = 'Mobile AVO Continuous Missing'
        elif key.startswith('random'):
            group = 'Mobile AVO Random Missing'
        elif key.startswith('uniform'):
            group = 'Mobile AVO Uniform Missing'
        else:
            group = 'Mobile AVO Interpolation'
        tmpl = templates[key]
        bench = {
            'id': bid,
            'name': f'Mobile AVO {name_suffix}',
            'group_name': group,
            'dataset_name': 'Mobile AVO Interpolation',
            'task': 'interpolation',
            'icon': '📡',
            'description': f'Mobile AVO Viking Graben Line 12 open-source 2D marine field dataset interpolation benchmark with {name_suffix.lower()}.',
            'data_source': 'field',
            'dimensions': tmpl['dimensions'],
            'primary_metric': 'snr',
            'metrics': tmpl['metrics'],
            'tags': ['Mobile AVO', 'Interpolation', name_suffix.split()[0], 'Field'],
            'citation': MOBILE_AVO_URL,
            'download_url': MOBILE_AVO_URL,
            'model_count': 0,
            'gallery': [],
        }
        benchmarks.insert(insert_idx, bench)
        insert_idx += 1
        added += 1
        print(f'Added benchmark {bid}')
    return added


def move_field_results(results):
    moved = 0
    existing = {(r['model_id'], r['benchmark_id']): r for r in results}
    for r in results:
        if r['model_id'] in FIELD_MODELS and r['benchmark_id'] in SEGC3_TO_MOBILE_INTERP:
            new_bench = SEGC3_TO_MOBILE_INTERP[r['benchmark_id']]
            old_key = (r['model_id'], r['benchmark_id'])
            new_key = (r['model_id'], new_bench)
            r['benchmark_id'] = new_bench
            if new_key in existing:
                # replace existing entry with this one and remove old duplicate
                existing[new_key].update(r)
                r['__delete__'] = True
            else:
                existing[new_key] = r
            del existing[old_key]
            moved += 1
    # remove duplicates marked for deletion
    before = len(results)
    results[:] = [r for r in results if not r.pop('__delete__', False)]
    print(f'Moved {moved} field results; removed {before - len(results)} duplicates')


def recalc_model_counts(benchmarks, results):
    counts = Counter(r['benchmark_id'] for r in results)
    for b in benchmarks:
        if b['task'] in ('interpolation', 'random_noise_suppression'):
            old = b['model_count']
            b['model_count'] = counts.get(b['id'], 0)
            if old != b['model_count']:
                print(f'Recalc {b["id"]}: {old} -> {b["model_count"]}')


def main():
    benchmarks = load_json(BENCH_PATH)
    results = load_json(RESULTS_PATH)

    update_mobile_avo_random_noise(benchmarks)
    create_mobile_avo_interpolation_benchmarks(benchmarks)
    move_field_results(results)
    recalc_model_counts(benchmarks, results)

    save_json(BENCH_PATH, benchmarks)
    save_json(RESULTS_PATH, results)
    print('Done')


if __name__ == '__main__':
    main()
