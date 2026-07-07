import { readFileSync, writeFileSync } from 'fs';

const srcModelPath = 'C:/Users/admin/Documents/WeChat Files/wxid_hvmr1h95e7jn22/FileStorage/File/2026-07/first_arrival_picking_model_hunet.json';
const srcResultPath = 'C:/Users/admin/Documents/WeChat Files/wxid_hvmr1h95e7jn22/FileStorage/File/2026-07/first_arrival_picking_result_hunet.json';
const dataDir = './src/data';

function readJson(path) {
  const content = readFileSync(path, 'utf-8');
  const clean = content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;
  return JSON.parse(clean);
}

// Load current project data
const models = readJson(`${dataDir}/models.json`);
const benchmarks = readJson(`${dataDir}/benchmarks.json`);
const results = readJson(`${dataDir}/results.json`);

// Load new source data
let newModel = readJson(srcModelPath);
const newResults = readJson(srcResultPath);

// Fill missing required fields
newModel = {
  ...newModel,
  org: newModel.org || 'Unknown',
  emoji: newModel.emoji || '🔬',
  description: newModel.description || 'HUNet for first-arrival picking.',
  is_open_source: newModel.is_open_source !== undefined ? newModel.is_open_source : true,
};

if (newModel.architecture_image === null) delete newModel.architecture_image;
if (newModel.weights_urls && Object.keys(newModel.weights_urls).length === 0) {
  delete newModel.weights_urls;
}

const fbpBenchIds = new Set(newResults.map(r => r.benchmark_id));

// Merge model
const modelMap = new Map(models.map(m => [m.id, m]));
if (!modelMap.has(newModel.id)) {
  console.log(`Adding new model: ${newModel.id}`);
  models.push(newModel);
  modelMap.set(newModel.id, newModel);
} else {
  Object.assign(modelMap.get(newModel.id), newModel);
}

// Merge results
const resultKey = r => `${r.model_id}-${r.benchmark_id}`;
const existingResultKeys = new Set(results.map(resultKey));
let addedResults = 0;
for (const newResult of newResults) {
  const key = resultKey(newResult);
  if (!existingResultKeys.has(key)) {
    results.push(newResult);
    existingResultKeys.add(key);
    addedResults++;
  }
}
console.log(`Added ${addedResults} new results`);

// Update model_count for first-break benchmarks
for (const bench of benchmarks) {
  if (fbpBenchIds.has(bench.id)) {
    const count = new Set(results.filter(r => r.benchmark_id === bench.id).map(r => r.model_id)).size;
    bench.model_count = count;
    console.log(`Updated ${bench.id} model_count -> ${count}`);
  }
}

// Sort for consistency
models.sort((a, b) => a.id.localeCompare(b.id));
results.sort((a, b) => {
  const cmp = a.benchmark_id.localeCompare(b.benchmark_id);
  if (cmp !== 0) return cmp;
  return a.model_id.localeCompare(b.model_id);
});

writeFileSync(`${dataDir}/models.json`, JSON.stringify(models, null, 2) + '\n');
writeFileSync(`${dataDir}/benchmarks.json`, JSON.stringify(benchmarks, null, 2) + '\n');
writeFileSync(`${dataDir}/results.json`, JSON.stringify(results, null, 2) + '\n');

console.log('Done. Final counts:', {
  models: models.length,
  benchmarks: benchmarks.length,
  results: results.length,
});
