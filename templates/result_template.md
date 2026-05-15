# Result（评测结果）数据收集模板

## 说明

Result 表示某个 **Model** 在某个 **Benchmark** 上的评测得分。

填写前请确保对应的 `model_id` 和 `benchmark_id` 已存在于 `models.json` 和 `benchmarks.json` 中。

---

## 字段说明

| 字段           | 必填  | 类型      | 说明                                      | 示例                        |
| ------------ | --- | ------- | --------------------------------------- | ------------------------- |
| model_id     | 是   | string  | 模型 id（对应 models.json）                  | `unet-tl-2023`            |
| benchmark_id | 是   | string  | 基准数据集 id（对应 benchmarks.json）         | `synth-denoise-random`    |
| scores       | 是   | object  | 分数对象，**只需填写该 benchmark 支持的指标**    | 见下方说明                     |
| paper_url    | 否   | string  | 论文链接（可选）                              | `https://doi.org/10.xxxx` |
| code_url     | 否   | string  | 代码链接（可选）                              | GitHub 链接                 |
| date_added   | 是   | string  | 添加日期，格式 `YYYY-MM-DD`                  | `2024-01-15`              |

### scores 格式说明

`scores` 是一个 JSON 对象，key 为指标名，value 为分数。**只需要填写该 benchmark 支持的指标**（即 `benchmarks.json` 中该 benchmark 的 `metrics` 字段包含的指标）。

可选指标：`snr` / `psnr` / `ssim` / `rmse` / `mse` / `accuracy` / `f1` / `mae`

示例（该 benchmark 支持 snr, ssim, rmse）：

```json
{"snr": 15.2, "ssim": 0.89, "rmse": 0.03}
```

---

## 空白模板（可复制使用）

### Result 1

| 字段           | 内容                          |
| ------------ | --------------------------- |
| model_id     | `unet-gr`                   |
| benchmark_id | `synth-groundroll-coherent` |
| scores       | `{"snr": 14.8, "ssim": 0.91, "rmse": 0.028}` |
| paper_url    |                             |
| code_url     | `https://github.com/...`    |
| date_added   | `2024-05-12`                |

### Result 2

| 字段           | 内容  |
| ------------ | --- |
| model_id     |     |
| benchmark_id |     |
| scores       |     |
| paper_url    |     |
| code_url     |     |
| date_added   |     |

---

## JSON 格式示例（可直接复制到 `results.json`）

```json
{
  "model_id": "unet-gr",
  "benchmark_id": "synth-groundroll-coherent",
  "scores": {
    "snr": 14.8,
    "ssim": 0.91,
    "rmse": 0.028
  },
  "paper_url": "",
  "code_url": "https://github.com/sixseven42/seismic-benchmark-code",
  "date_added": "2024-05-12"
}
```

---

## 批量填写建议格式

如果你有多个结果，也可以用下面的表格方式批量填写：

| model_id | benchmark_id | scores (JSON) | date_added |
| -------- | ------------ | ------------- | ---------- |
|          |              |               |            |
|          |              |               |            |
|          |              |               |            |

---

## 新增一组数据的完整示例

假设你要新增一个 **ResNet-Denoise** 模型，在 **Synthetic Random Noise** benchmark 上的评测结果：

### Step 1: 在 `models.json` 中新增 Model

```json
{
  "id": "resnet-denoise",
  "name": "ResNet-Denoise",
  "authors": "Zhang et al.",
  "org": "Tsinghua University",
  "year": 2024,
  "emoji": "🔬",
  "type": "deep_learning",
  "tasks": ["random_noise_suppression"],
  "description": "Residual learning network for seismic random noise attenuation with dilated convolutions.",
  "paper_url": "https://doi.org/10.xxxx",
  "code_url": "https://github.com/zhang/resnet-denoise",
  "weights_url": "https://huggingface.co/resnet-denoise/weights",
  "weights_urls": {
    "random_noise_suppression": "https://huggingface.co/resnet-denoise/weights"
  },
  "architecture_image": "models/arch-resnet-denoise.png",
  "is_open_source": true
}
```

### Step 2: 在 `benchmarks.json` 中确认/新增 Benchmark

确保 `synth-denoise-random` 已存在：

```json
{
  "id": "synth-denoise-random",
  "name": "Synthetic Random Noise",
  "dataset_name": "Marmousi",
  "task": "random_noise_suppression",
  "icon": "🌫️",
  "description": "Shot gathers from the classic Marmousi velocity model contaminated with additive Gaussian white noise...",
  "data_source": "synthetic",
  "dimensions": "256 × 512 traces",
  "primary_metric": "snr",
  "metrics": ["snr", "ssim", "rmse"],
  "tags": ["2D", "Random Noise", "Marmousi"],
  "citation": "Versteeg, Leading Edge 1994 (Marmousi)",
  "download_url": "",
  "model_count": 2
}
```

> 如果 benchmark 关联的数据集（`dataset_name`）在 `datasets.json` 中不存在，需要同时新增数据集。

### Step 3: 在 `results.json` 中新增 Result

```json
{
  "model_id": "resnet-denoise",
  "benchmark_id": "synth-denoise-random",
  "scores": {
    "snr": 16.5,
    "ssim": 0.93,
    "rmse": 0.024
  },
  "paper_url": "https://doi.org/10.xxxx",
  "code_url": "https://github.com/zhang/resnet-denoise",
  "date_added": "2024-05-12"
}
```

### Step 4: 更新计数（可选）

如果该 model 是这个 benchmark 上的新结果，记得把 `benchmarks.json` 中对应 benchmark 的 `model_count` 加 1。

---

## 提交前检查清单

- [ ] `model_id` 存在于 `models.json`
- [ ] `benchmark_id` 存在于 `benchmarks.json`
- [ ] `scores` 中的指标都在该 benchmark 的 `metrics` 列表中
- [ ] `date_added` 格式为 `YYYY-MM-DD`
