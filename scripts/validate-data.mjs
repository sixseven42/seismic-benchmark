import { readFileSync } from 'fs';

const models = JSON.parse(readFileSync('./src/data/models.json', 'utf-8'));
const benchmarks = JSON.parse(readFileSync('./src/data/benchmarks.json', 'utf-8'));
const results = JSON.parse(readFileSync('./src/data/results.json', 'utf-8'));

const modelIds = new Set(models.map(m => m.id));
const benchIds = new Set(benchmarks.map(b => b.id));

let errors = 0;

// Orphan results
const orphanResults = results.filter(r => !modelIds.has(r.model_id) || !benchIds.has(r.benchmark_id));
if (orphanResults.length) {
  console.error('Orphan results:', orphanResults.length);
  orphanResults.forEach(r => console.error(`  ${r.model_id} / ${r.benchmark_id}`));
  errors += orphanResults.length;
}

// Duplicate results
const seen = new Map();
const duplicates = [];
for (const r of results) {
  const key = `${r.model_id}-${r.benchmark_id}`;
  if (seen.has(key)) duplicates.push(key);
  seen.set(key, true);
}
if (duplicates.length) {
  console.error('Duplicate results:', duplicates);
  errors += duplicates.length;
}

// model_count mismatch
for (const b of benchmarks) {
  const actual = new Set(results.filter(r => r.benchmark_id === b.id).map(r => r.model_id)).size;
  if (b.model_count !== actual) {
    console.error(`model_count mismatch for ${b.id}: declared ${b.model_count}, actual ${actual}`);
    errors++;
  }
}

// Missing scores metrics
for (const r of results) {
  const bench = benchmarks.find(b => b.id === r.benchmark_id);
  if (!bench) continue;
  for (const m of bench.metrics) {
    if (r.scores[m] === undefined) {
      console.error(`Missing metric ${m} in result ${r.model_id}/${r.benchmark_id}`);
      errors++;
    }
  }
}

console.log(`\nTotal errors: ${errors}`);
console.log(`Models: ${models.length}, Benchmarks: ${benchmarks.length}, Results: ${results.length}`);
process.exit(errors ? 1 : 0);
