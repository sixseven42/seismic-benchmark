# Result（评测结果）数据收集模板

## 说明

Result 表示某个 **Model** 在某个 **Benchmark** 上的评测得分。
目前 `results.json` 为空，所以 Leaderboard 页面没有数据。

填写前请确保对应的 model_id 和 benchmark_id 已存在于 models.json 和 benchmarks.json 中。

---

## 字段说明


| 字段           | 必填  | 类型      | 说明                           | 示例                        |
| ------------ | --- | ------- | ---------------------------- | ------------------------- |
| model_id     | 是   | string  | 模型 id（对应 models.json）        | `unet-tl-2023`            |
| benchmark_id | 是   | string  | 基准数据集 id（对应 benchmarks.json） | `synth-denoise-random`    |
| scores       | 是   | object  | 分数对象，包含该 benchmark 支持的指标     | 见下方说明                     |
| is_sota      | 是   | boolean | 是否为该 benchmark 上的当前最佳        | `true` / `false`          |
| paper_url    | 否   | string  | 论文链接                         | `https://doi.org/10.xxxx` |
| code_url     | 否   | string  | 代码链接                         | GitHub 链接                 |
| date_added   | 是   | string  | 添加日期                         | `2024-01-15`              |


### scores 格式说明

scores 是一个 JSON 对象，key 为指标名，value 为分数。**只需要填写该 benchmark 支持的指标**。

可选指标：`snr` / `psnr` / `ssim` / `rmse` / `mse` / `accuracy` / `f1` / `mae`

示例：

```json
{"snr": 15.2, "ssim": 0.89, "rmse": 0.03}
```

---

## 空白模板（可复制使用）

### Result 1


| 字段           | 内容                                                             |
| ------------ | -------------------------------------------------------------- |
| model_id     | UNet-GR                                                        |
| benchmark_id | synth-groundroll-coherent                                      |
| scores       | 99                                                             |
| is_sota      | false                                                          |
| paper_url    | [https://huggingface.co/models](https://huggingface.co/models) |
| code_url     | [https://huggingface.co/models](https://huggingface.co/models) |
| date_added   | [https://huggingface.co/models](https://huggingface.co/models) |


### Result 2


| 字段           | 内容  |
| ------------ | --- |
| model_id     |     |
| benchmark_id |     |
| scores       |     |
| is_sota      |     |
| paper_url    |     |
| code_url     |     |
| date_added   |     |


### Result 3


| 字段           | 内容  |
| ------------ | --- |
| model_id     |     |
| benchmark_id |     |
| scores       |     |
| is_sota      |     |
| paper_url    |     |
| code_url     |     |
| date_added   |     |


---

## 批量填写建议格式

如果你有多个结果，也可以用下面的表格方式批量填写：


| model_id | benchmark_id | scores (JSON) | is_sota | date_added |
| -------- | ------------ | ------------- | ------- | ---------- |
|          |              |               |         |            |
|          |              |               |         |            |
|          |              |               |         |            |


