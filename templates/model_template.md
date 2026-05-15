# Model 数据收集模板

## 字段说明

| 字段             | 必填  | 类型       | 说明                                    | 可选值/示例                                     |
| -------------- | --- | -------- | ------------------------------------- | ------------------------------------------ |
| id             | 是   | string   | 唯一标识，小写，用连字符分隔，建议含年份                | `unet-tl-2023`                             |
| name           | 是   | string   | 模型名称（大写或首字母大写）                        | `UNET-TL`                                  |
| authors        | 是   | string   | 作者/提供者，可用 et al.（前端显示为"Provider"）    | `Li et al.`                                |
| org            | 是   | string   | 所属机构/参考文献（前端显示为"Reference"）           | `Peking University`                        |
| year           | 否   | number   | 发表年份（数据保留，但前端不再显示）                   | `2023`                                     |
| emoji          | 是   | string   | Emoji 图标（所有模型目前都用 `🔬` 即可）            | `🔬`                                       |
| type           | 是   | string   | 模型类型                                  | `traditional` / `deep_learning` / `hybrid` |
| tasks          | 是   | string[] | 支持的任务（JSON 数组格式）                     | `["coherent_noise_suppression"]`           |
| description    | 是   | string   | 模型描述：核心创新、方法概述                        | 建议 50-150 字                                |
| paper_url      | 是   | string   | 论文链接，优先 DOI                           | `https://doi.org/10.xxxx`                  |
| code_url       | 否   | string   | 代码仓库链接，没有则留空                          | GitHub 链接                                  |
| weights_url    | 否   | string   | 单一预训练权重链接（与 weights_urls 二选一）        | 模型权重下载链接                                   |
| weights_urls   | 否   | object   | 多任务权重链接（key=任务名, value=下载链接）         | 见下方说明                                     |
| architecture_image | 否   | string   | 网络架构示意图路径（相对 public 目录）               | `models/arch-unet-tl.png`                  |
| is_open_source | 是   | boolean  | 是否开源（有 code_url 则为 true）              | `true` / `false`                           |

### weights_urls 格式说明

当模型提供多个任务版本的权重时使用：

```json
{
  "coherent_noise_suppression": "https://huggingface.co/xxx/groundroll",
  "random_noise_suppression": "https://huggingface.co/xxx/denoise",
  "interpolation": "https://huggingface.co/xxx/interp"
}
```

如果只提供单一权重，可只填 `weights_url`。

---

## 空白模板（可复制使用）

### Model 1

| 字段             | 内容                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| id             | `unet-gr`                                                                                                    |
| name           | UNet-GR                                                                                                      |
| authors        | Li et al.                                                                                                    |
| org            | Peking University                                                                                            |
| year           | 2024                                                                                                         |
| emoji          | 🔬                                                                                                           |
| type           | `deep_learning`                                                                                              |
| tasks          | `["coherent_noise_suppression"]`                                                                             |
| description    | End-to-End Ground Roll Suppression Based on U-Net.                                                           |
| paper_url      | `https://doi.org/10.xxxx`                                                                                    |
| code_url       | `https://github.com/sixseven42/seismic-benchmark-code`                                                       |
| weights_url    | `https://huggingface.co/models`                                                                              |
| weights_urls   | `{"coherent_noise_suppression": "https://huggingface.co/xxx", "random_noise_suppression": "https://huggingface.co/xxx"}` |
| architecture_image | `models/arch-unet-gr.png`                                                                                |
| is_open_source | `true`                                                                                                       |

### Model 2

| 字段             | 内容  |
| -------------- | --- |
| id             |     |
| name           |     |
| authors        |     |
| org            |     |
| year           |     |
| emoji          | 🔬  |
| type           |     |
| tasks          |     |
| description    |     |
| paper_url      |     |
| code_url       |     |
| weights_url    |     |
| weights_urls   |     |
| architecture_image |     |
| is_open_source |     |

---

## JSON 格式示例（可直接复制到 `models.json`）

```json
{
  "id": "unet-gr",
  "name": "UNet-GR",
  "authors": "Li et al.",
  "org": "Peking University",
  "year": 2024,
  "emoji": "🔬",
  "type": "deep_learning",
  "tasks": ["coherent_noise_suppression"],
  "description": "End-to-End Ground Roll Suppression Based on U-Net.",
  "paper_url": "https://doi.org/10.xxxx",
  "code_url": "https://github.com/sixseven42/seismic-benchmark-code",
  "weights_url": "https://huggingface.co/models",
  "weights_urls": {
    "coherent_noise_suppression": "https://huggingface.co/xxx/groundroll",
    "random_noise_suppression": "https://huggingface.co/xxx/denoise"
  },
  "architecture_image": "models/arch-unet-gr.png",
  "is_open_source": true
}
```

---

## JSON 格式示例（可直接复制到 `models.json`）

```json
{
  "id": "unet-gr",
  "name": "UNet-GR",
  "authors": "Li et al.",
  "org": "Peking University",
  "year": 2024,
  "emoji": "🔬",
  "type": "deep_learning",
  "tasks": ["coherent_noise_suppression"],
  "description": "End-to-End Ground Roll Suppression Based on U-Net.",
  "paper_url": "https://doi.org/10.xxxx",
  "code_url": "https://github.com/sixseven42/seismic-benchmark-code",
  "weights_url": "https://huggingface.co/models",
  "weights_urls": {
    "coherent_noise_suppression": "https://huggingface.co/xxx/groundroll",
    "random_noise_suppression": "https://huggingface.co/xxx/denoise"
  },
  "architecture_image": "models/arch-unet-gr.png",
  "is_open_source": true
}
```

---

## 快速参考

### 任务类型可选值

- `interpolation`
- `random_noise_suppression`
- `coherent_noise_suppression`
- `first_arrival_picking`
- `super_resolution`

### 模型类型可选值

- `traditional` — 传统信号处理方法
- `deep_learning` — 纯深度学习方法
- `hybrid` — 传统+深度学习混合方法
