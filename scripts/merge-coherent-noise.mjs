import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const srcDir = 'C:/Users/admin/Documents/WeChat Files/wxid_hvmr1h95e7jn22/FileStorage/File/2026-06/json';
const dataDir = './src/data';

function readJson(path) {
  const content = readFileSync(path, 'utf-8');
  const clean = content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;
  return JSON.parse(clean);
}

function stripNulls(obj, keys) {
  for (const key of keys) {
    if (obj[key] === null) delete obj[key];
  }
  return obj;
}

// Load current project data
const models = readJson(`${dataDir}/models.json`);
const benchmarks = readJson(`${dataDir}/benchmarks.json`);
const results = readJson(`${dataDir}/results.json`);

// Load new source data
const newBenchmarks = readJson(`${srcDir}/coherent_noise_attenuation_benchmarks.json`);
const newModelFiles = [
  'coherent_noise_attenuation_model_attention_unet_groundroll.json',
  'coherent_noise_attenuation_model_dncnn_groundroll.json',
  'coherent_noise_attenuation_model_res_unet_groundroll.json',
  'coherent_noise_attenuation_model_unet_groundroll.json',
  'coherent_noise_attenuation_model_conditional_ddpm_groundroll.json',
  'coherent_noise_attenuation_model_enhanced_atten_unet_groundroll.json',
  'coherent_noise_attenuation_model_physics_cnn_groundroll.json',
  'coherent_noise_attenuation_model_pix2pix_cgan_groundroll.json',
  'coherent_noise_attenuation_model_sanet_groundroll.json',
];
const newModels = newModelFiles.map(f => readJson(`${srcDir}/${f}`));

const newResultFiles = [
  'coherent_noise_attenuation_result_attention_unet_groundroll.json',
  'coherent_noise_attenuation_result_attention_unet_plus_groundroll.json',
  'coherent_noise_attenuation_result_dncnn_groundroll.json',
  'coherent_noise_attenuation_result_res_unet_groundroll.json',
  'coherent_noise_attenuation_result_res_unet_plus_groundroll.json',
  'coherent_noise_attenuation_result_unet_groundroll.json',
  'coherent_noise_attenuation_result_unet_plus_groundroll.json',
  'coherent_noise_attenuation_result_conditional_ddpm_groundroll.json',
  'coherent_noise_attenuation_result_enhanced_atten_unet_groundroll.json',
  'coherent_noise_attenuation_result_physics_cnn_groundroll.json',
  'coherent_noise_attenuation_result_pix2pix_cgan_groundroll.json',
  'coherent_noise_attenuation_result_sanet_groundroll.json',
];
const newResults = newResultFiles.flatMap(f => readJson(`${srcDir}/${f}`));

// IDs of coherent noise benchmarks
const cnBenchIds = new Set(newBenchmarks.map(b => b.id));

// 1. Update existing benchmark fields and model_count
for (const newBench of newBenchmarks) {
  const idx = benchmarks.findIndex(b => b.id === newBench.id);
  if (idx === -1) {
    console.log(`Adding new benchmark: ${newBench.id}`);
    benchmarks.push(newBench);
  } else {
    // Preserve gallery and group_name if existing has them
    const existing = benchmarks[idx];
    Object.assign(existing, newBench);
    if (!existing.gallery) {
      existing.gallery = ['datasets/segc3-raw.png', 'datasets/segc3-label.png'];
    }
    if (!existing.group_name) {
      existing.group_name = 'SEGC3 Ground-Roll Noise';
    }
  }
}

// 2. Merge models
const modelMap = new Map(models.map(m => [m.id, m]));
for (const newModel of newModels) {
  // Clean incompatible fields
  stripNulls(newModel, ['architecture_image', 'weights_url']);
  if (newModel.weights_urls && Object.keys(newModel.weights_urls).length === 0) {
    delete newModel.weights_urls;
  }

  if (!modelMap.has(newModel.id)) {
    console.log(`Adding new model: ${newModel.id}`);
    models.push(newModel);
    modelMap.set(newModel.id, newModel);
  } else {
    // Update existing model fields but preserve weights_url if source has null
    const existing = modelMap.get(newModel.id);
    if (newModel.weights_url === null && existing.weights_url) {
      delete newModel.weights_url;
    }
    Object.assign(existing, newModel);
  }
}

// 3. Add plus models that exist in results but not in model files
const plusModels = new Map([
  ['attention-unet-plus-groundroll', 'attention-unet-groundroll'],
  ['res-unet-plus-groundroll', 'res-unet-groundroll'],
  ['unet-plus-groundroll', 'unet-groundroll'],
]);

for (const [plusId, baseId] of plusModels) {
  if (modelMap.has(plusId)) continue;
  const base = modelMap.get(baseId);
  if (!base) {
    console.warn(`Base model ${baseId} not found, skipping ${plusId}`);
    continue;
  }
  const plusModel = {
    ...base,
    id: plusId,
    name: base.name.includes('++') ? base.name : `${base.name}++`,
    description: base.description.replace('U-Net', 'U-Net++').replace('UNet', 'UNet++'),
  };
  console.log(`Adding derived plus model: ${plusId}`);
  models.push(plusModel);
  modelMap.set(plusId, plusModel);
}

// Normalize all models: strip null architecture_image and empty weights_urls
for (const model of models) {
  if (model.architecture_image === null) delete model.architecture_image;
  if (model.weights_urls && Object.keys(model.weights_urls).length === 0) {
    delete model.weights_urls;
  }
}

// 4. Merge results
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

// 5. Recalculate model_count for coherent noise benchmarks
for (const bench of benchmarks) {
  if (cnBenchIds.has(bench.id)) {
    const count = new Set(results.filter(r => r.benchmark_id === bench.id).map(r => r.model_id)).size;
    bench.model_count = count;
    console.log(`Updated ${bench.id} model_count -> ${count}`);
  }
}

// 6. Sort models and results for consistency
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
