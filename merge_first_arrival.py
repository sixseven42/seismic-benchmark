import json
import re

# Load current papers
with open('src/data/papers.json', encoding='utf-8') as f:
    current = json.load(f)

# Load new papers
with open('C:/Users/admin/Downloads/初至拾取.json', encoding='utf-8') as f:
    new_papers = json.load(f)

print(f"Current papers: {len(current)}")
print(f"New papers to merge: {len(new_papers)}")

# Build deduplication sets
existing_dois = set()
existing_titles = set()
for p in current:
    doi = p.get('doi')
    if doi:
        existing_dois.add(doi.lower().strip())
    title = p.get('title', '').lower().strip()
    if title:
        existing_titles.add(title)

# Normalize tasks
def normalize_tasks(tasks):
    result = []
    for t in tasks:
        if t == 'first_break_picking':
            result.append('first_arrival_picking')
        elif t in ('Ant Colony Optimization', 'review', 'foundation_model', 'velocity_estimation', 'normal_moveout_correction'):
            # Skip non-benchmark tasks
            continue
        else:
            result.append(t)
    # Remove duplicates while preserving order
    seen = set()
    out = []
    for t in result:
        if t not in seen:
            seen.add(t)
            out.append(t)
    return out

# Check first-arrival picking papers already in dataset
existing_fap = [p for p in current if 'first_arrival_picking' in p.get('tasks', [])]
print(f"Existing first_arrival_picking papers: {len(existing_fap)}")

added = 0
skipped = 0
for p in new_papers:
    # Normalize tasks
    p['tasks'] = normalize_tasks(p.get('tasks', []))

    # If no benchmark tasks remain but this is from the first-arrival batch, add it
    if not p['tasks']:
        p['tasks'] = ['first_arrival_picking']

    # Ensure is_sota is boolean
    if p.get('is_sota') is None:
        p['is_sota'] = False

    # Deduplicate
    doi = p.get('doi')
    title = p.get('title', '').lower().strip()
    doi_match = doi and doi.lower().strip() in existing_dois
    title_match = title in existing_titles

    if doi_match or title_match:
        skipped += 1
        print(f"  SKIP (duplicate): {p['title'][:60]}")
        continue

    current.append(p)
    existing_dois.add(doi.lower().strip() if doi else '')
    existing_titles.add(title)
    added += 1

print(f"\nAdded: {added}, Skipped: {skipped}")
print(f"Total papers now: {len(current)}")

# Check final task distribution
from collections import Counter
task_counts = Counter()
for p in current:
    for t in p.get('tasks', []):
        task_counts[t] += 1
print("\nTask distribution:")
for t, c in sorted(task_counts.items(), key=lambda x: -x[1]):
    print(f"  {t}: {c}")

# Save
with open('src/data/papers.json', 'w', encoding='utf-8') as f:
    json.dump(current, f, ensure_ascii=False, indent=2)

print("\nSaved to src/data/papers.json")
