# Benchmark 数据收集模板

## 字段说明

| 字段             | 必填  | 类型       | 说明                                                         | 可选值/示例                                                                                                                     |
| -------------- | --- | -------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| id             | 是   | string   | 唯一标识，小写，用连字符分隔                                    | `synth-denoise-random`                                                                                                     |
| name           | 是   | string   | 显示名称                                                       | `Synthetic Random Noise`                                                                                                   |
| dataset_name   | 是   | string   | 底层数据集名称（必须对应 `datasets.json` 中的 `name`）            | `SEG C3 Ground Roll` / `Marmousi`                                                                                          |
| task           | 是   | string   | 任务类型                                                       | `interpolation` / `random_noise_suppression` / `coherent_noise_suppression` / `first_arrival_picking` / `super_resolution` |
| icon           | 是   | string   | Emoji 图标                                                     | `📡` `🧊` `🌫️` `⏱️` `🌋`                                                                                                  |
| description    | 是   | string   | Benchmark 描述：如何生成、特点、用途（建议 2-4 句，会完整显示）        | 详细描述                                                                                                                     |
| data_source    | 是   | string   | 数据来源                                                       | `synthetic` / `field`                                                                                                      |
| dimensions     | 是   | string   | 数据补充说明（前端显示为"Supplement"，可写维度或补充信息）          | `256 × 512 traces` / `Irregular land geometry`                                                                             |
| primary_metric | 是   | string   | 主要评价指标                                                     | `snr` / `psnr` / `ssim` / `rmse` / `mse` / `accuracy` / `f1` / `mae`                                                       |
| metrics        | 是   | string[] | 所有评价指标（JSON 数组格式）                                     | `["snr", "ssim", "rmse"]`                                                                                                  |
| tags           | 是   | string[] | 标签（JSON 数组格式）                                             | `["2D", "Marine", "Random Noise"]`                                                                                         |
| citation       | 是   | string   | 引用文献                                                       | `Wang et al., Geophysics 2022`                                                                                             |
| download_url   | 否   | string   | 数据集下载链接（如果在 datasets.json 中已设置，此处可留空）          | Zenodo / GitHub / HuggingFace 等                                                                                            |
| model_count    | 否   | number   | 已有模型数（初始填 0）                                            | `0`                                                                                                                        |

### 重要说明：Dataset 关联

Datasets 栏目已合并到 Benchmarks 中展示。新增 Benchmark 时：

1. **`dataset_name` 必须匹配** `datasets.json` 中某个数据集的 `name` 字段。
2. 如果该数据集还不存在，请**同时在 `datasets.json` 中新增**对应的数据集条目（包含 `name`, `task`, `description`, `thumbnail`, `gallery`, `stats`, `download_url` 等）。
3. Benchmark 面板会自动拉取关联数据集的图片（gallery）和下载链接进行展示。

---

## 空白模板（可复制使用）

### Benchmark 1

| 字段             | 内容                                                                         |
| -------------- | -------------------------------------------------------------------------- |
| id             | `synth-groundroll-coherent`                                                  |
| name           | Synthetic Ground Roll Noise                                                |
| dataset_name   | `SEG C3 Ground Roll`                                                         |
| task           | `coherent_noise_suppression`                                                 |
| icon           | 〰️                                                                          |
| description    | A synthetic 3D seismic benchmark built on the SEG China 3D (SEGC3) geological model... |
| data_source    | `synthetic`                                                                  |
| dimensions     | `9 × 201 × 201 × 625 (shots, xline, inline, time)`                          |
| primary_metric | `snr`                                                                        |
| metrics        | `["snr", "ssim", "rmse"]`                                                    |
| tags           | `["3D", "Ground Roll", "Synthetic"]`                                         |
| citation       | TBD                                                                          |
| download_url   | `https://huggingface.co/models`                                              |
| model_count    | 1                                                                            |

### Benchmark 2

| 字段             | 内容  |
| -------------- | --- |
| id             |     |
| name           |     |
| dataset_name   |     |
| task           |     |
| icon           |     |
| description    |     |
| data_source    |     |
| dimensions     |     |
| primary_metric |     |
| metrics        |     |
| tags           |     |
| citation       |     |
| download_url   |     |
| model_count    | 0   |

---

## 快速参考

### 任务类型可选值

- `interpolation`
- `random_noise_suppression`
- `coherent_noise_suppression`
- `first_arrival_picking`
- `super_resolution`

### 常用 icon 建议

| 任务                         | 建议 icon         |
| -------------------------- | --------------- |
| interpolation              | `📡` `🧊` `🌊`  |
| random_noise_suppression   | `🌫️` `🔇` `✨`  |
| coherent_noise_suppression | `〰️` `🏔️` `🌊` |
| first_arrival_picking      | `⏱️` `🌋` `📍`  |
| super_resolution           | `🔍` `📐` `🔎`  |
