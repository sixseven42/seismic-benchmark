import { readFileSync, writeFileSync, readdirSync } from 'fs';

const srcDir = 'C:/Users/admin/Documents/WeChat Files/wxid_hvmr1h95e7jn22/FileStorage/File/2026-07/record_random(1)/record_random';
const dataDir = './src/data';

function readJson(path) {
  const content = readFileSync(path, 'utf-8');
  const clean = content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;
  return JSON.parse(clean);
}

function normalizeModelId(id) {
  // Source model file uses q_unet-random-noise but project uses qunet-random-noise
  return id.replace(/^q_unet-/, 'qunet-');
}

function cleanModel(model) {
  model.id = normalizeModelId(model.id);
  if (model.architecture_image === null) delete model.architecture_image;
  if (model.weights_urls && Object.keys(model.weights_urls).length === 0) {
    delete model.weights_urls;
  }
  return model;
}

// Load current project data
const models = readJson(`${dataDir}/models.json`);
const benchmarks = readJson(`${dataDir}/benchmarks.json`);
const results = readJson(`${dataDir}/results.json`);

// Load new source data
const newBenchmarks = readJson(`${srcDir}/random_noise_suppression_benchmarks.json`);
const modelFiles = readdirSync(`${srcDir}/model`).filter(f => f.endsWith('.json'));
const newModels = modelFiles.map(f => cleanModel(readJson(`${srcDir}/model/${f}`)));

const resultFiles = readdirSync(`${srcDir}/results`).filter(f => f.endsWith('.json'));
const newResults = resultFiles.flatMap(f => readJson(`${srcDir}/results/${f}`)).map(r => ({
  ...r,
  model_id: normalizeModelId(r.model_id),
}));

// IDs of random noise benchmarks
const rnBenchIds = new Set(newBenchmarks.map(b => b.id));

// 1. Update existing benchmark fields and preserve group/gallery
for (const newBench of newBenchmarks) {
  const idx = benchmarks.findIndex(b => b.id === newBench.id);
  if (idx === -1) {
    console.log(`Adding new benchmark: ${newBench.id}`);
    benchmarks.push(newBench);
  } else {
    const existing = benchmarks[idx];
    Object.assign(existing, newBench);
    if (!existing.gallery) {
      existing.gallery = ['datasets/segc3-random-raw.png', 'datasets/segc3-random-label.png'];
    }
    if (!existing.group_name) {
      existing.group_name = 'SEGC3 Random Noise';
    }
  }
}

// 2. Merge models
const modelMap = new Map(models.map(m => [m.id, m]));
for (const newModel of newModels) {
  if (!modelMap.has(newModel.id)) {
    console.log(`Adding new model: ${newModel.id}`);
    models.push(newModel);
    modelMap.set(newModel.id, newModel);
  } else {
    const existing = modelMap.get(newModel.id);
    Object.assign(existing, newModel);
  }
}

// 3. Merge results
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

// 4. Recalculate model_count for random noise benchmarks
for (const bench of benchmarks) {
  if (rnBenchIds.has(bench.id)) {
    const count = new Set(results.filter(r => r.benchmark_id === bench.id).map(r => r.model_id)).size;
    bench.model_count = count;
    console.log(`Updated ${bench.id} model_count -> ${count}`);
  }
}

// 5. Sort models and results for consistency
models.sort((a, b) => a.id.localeCompare(b.id));
results.sort((a, b) => {
  const cmp = a.benchmark_id.localeCompare(b.benchmark_id);
  if (cmp !== 0) return cmp;
  return a.model_id.localeCompare(b.model_id);
});

// Write back
writeFileSync(`${dataDir}/models.json`, JSON.stringify(models, null, 2) + '\n');
writeFileSync(`${dataDir}/benchmarks.json`, JSON.stringify(benchmarks, null, 2) + '\n');
writeFileSync(`${dataDir}/results.json`, JSON.stringify(results, null, 2) + '\n');

console.log('Done. Final counts:', {
  models: models.length,
  benchmarks: benchmarks.length,
  results: results.length,
});
