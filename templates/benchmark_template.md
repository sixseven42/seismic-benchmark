# Benchmark 数据收集模板

## 字段说明


| 字段             | 必填  | 类型       | 说明                | 可选值/示例                                                                                                                     |
| -------------- | --- | -------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------- |
| id             | 是   | string   | 唯一标识，小写，用连字符分隔    | `synth-denoise-random`                                                                                                     |
| name           | 是   | string   | 显示名称              | `Synthetic Random Noise`                                                                                                   |
| task           | 是   | string   | 任务类型              | `interpolation` / `random_noise_suppression` / `coherent_noise_suppression` / `first_arrival_picking` / `super_resolution` |
| icon           | 是   | string   | Emoji 图标          | `📡` `🧊` `🌫️` `⏱️` `🌋`                                                                                                  |
| description    | 是   | string   | 数据集描述：如何生成、特点、用途  | 建议 1-3 句话                                                                                                                  |
| data_source    | 是   | string   | 数据来源              | `synthetic` / `field`                                                                                                      |
| dimensions     | 是   | string   | 数据维度描述            | `256 × 512 traces`                                                                                                         |
| primary_metric | 是   | string   | 主要评价指标            | `snr` / `psnr` / `ssim` / `rmse` / `mse` / `accuracy` / `f1` / `mae`                                                       |
| metrics        | 是   | string[] | 所有评价指标（JSON 数组格式） | `["snr", "ssim", "rmse"]`                                                                                                  |
| tags           | 是   | string[] | 标签（JSON 数组格式）     | `["2D", "Marine", "Random Noise"]`                                                                                         |
| citation       | 是   | string   | 引用文献              | `Wang et al., Geophysics 2022`                                                                                             |
| download_url   | 是   | string   | 数据集下载链接           | Zenodo / GitHub / SEG Wiki 等                                                                                               |
| model_count    | 否   | number   | 已有模型数（初始填 0）      | `0`                                                                                                                        |


---

## 空白模板（可复制使用）

### Benchmark 1


| 字段             | 内容                                                                         |
| -------------- | -------------------------------------------------------------------------- |
| id             | synth-groundroll-coherent                                                  |
| name           | Synthetic Ground Roll Noise                                                |
| task           | `coherent_noise_suppression`                                               |
| icon           | \                                                                          |
| description    | A dataset constructed based on the SEGC3 dataset and synthetic ground roll |
| data_source    | syntheric                                                                  |
| dimensions     | 9x201x201x625(shot numbers, xline, inline, time)                           |
| primary_metric | `snr` / `psnr` / `ssim` / `rmse` / `mse`                                   |
| metrics        | `["snr", "ssim", "rmse"]`                                                  |
| tags           | \                                                                          |
| citation       | \                                                                          |
| download_url   | [https://huggingface.co/models](https://huggingface.co/models)             |
| model_count    | 1                                                                          |


### Benchmark 2


| 字段             | 内容  |
| -------------- | --- |
| id             |     |
| name           |     |
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


### Benchmark 3


| 字段             | 内容  |
| -------------- | --- |
| id             |     |
| name           |     |
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

## 快速参考：常用 icon 建议


| 任务                         | 建议 icon         |
| -------------------------- | --------------- |
| interpolation              | `📡` `🧊` `🌊`  |
| random_noise_suppression   | `🌫️` `🔇` `✨`  |
| coherent_noise_suppression | `〰️` `🏔️` `🌊` |
| first_arrival_picking      | `⏱️` `🌋` `📍`  |
| super_resolution           | `🔍` `📐` `🔎`  |


