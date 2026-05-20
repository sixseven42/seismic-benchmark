# 数据上传与整合指南

本文档说明如何将你提供的研究材料（model、results、benchmark JSON 以及图片）正确整合到 SeismicBench 网页中。

---

## 1. 文件结构规范

你提供的材料通常包含以下三类文件：

```
gtx/
├── model/
│   ├── task_model_xxx.json          # 模型元数据（1个模型1个文件）
│   └── ...
├── results/
│   ├── task_result_xxx.json         # 评测结果（1个模型1个文件，可能含多个benchmark结果）
│   └── ...
└── task_benchmarks.json             # benchmark定义（1个任务1个文件，可能含多个variant）
```

---

## 2. 我【会保留原样】的字段

以下字段直接照搬你提供的 JSON，**不做任何修改**：

| 字段 | 说明 |
|------|------|
| `id` | benchmark / model 的唯一标识 |
| `name` | 显示名称 |
| `description` | 描述文本 |
| `scores` | 评测分数对象 |
| `paper_url` | 论文链接 |
| `code_url` | 代码链接 |
| `weights_url` / `weights_urls` | 权重下载链接 |
| `citation` | 引用文献 |
| `download_url` | 数据集下载链接 |
| `model_count` | 你填写的已有模型数 |
| `metrics` | 该 benchmark 支持的指标列表 |
| `tags` | 标签列表 |

**例外处理**：如果你的 results 中 `scores` 包含字符串 `"non"`，我会将其转为 `null`，否则前端调用 `.toFixed()` 会报错。

---

## 3. 我【会补充或调整】的字段

以下字段需要你确认，或由我根据规则补充：

### 3.1 `group_name`（分组名称）

**规则**：如果同一任务下有多个仅参数不同的 benchmark（如 Noise 1/3/5/7/9），需要在每个 benchmark 上加相同的 `group_name`，前端会自动合并为一张卡片。

**示例**：
```json
{
  "id": "segc3-groundroll-noise1",
  "name": "SEGC3 Ground-Roll Noise 1",
  "group_name": "SEGC3 Ground-Roll Noise",
  ...
}
```

**注意**：`group_name` 只需加在 `benchmarks.json` 中，`results.json` 和 `models.json` 不需要改动。

### 3.2 通用描述（GROUP_DESCRIPTIONS）

如果一组 benchmark 使用了 `group_name`，我需要在 `src/pages/BenchmarksPage.tsx` 的 `GROUP_DESCRIPTIONS` 常量中补充该组的通用描述。请你在提供材料时，一并给出这段通用描述（2-4句话，概括整个系列）。

**示例**：
```ts
const GROUP_DESCRIPTIONS: Record<string, string> = {
  'SEGC3 Ground-Roll Noise': 'A suite of synthetic 3D seismic benchmarks ...',
};
```

### 3.3 数据集关联（`dataset_name`）

`benchmarks.json` 中的 `dataset_name` 必须能在 `src/data/datasets.json` 中找到对应条目。如果该数据集不存在，需要同时提供：
- 数据集名称
- 1张缩略图路径（如 `datasets/xxx-thumb.png`）
- 2张展示图路径（Raw + Label，如 `datasets/xxx-raw.png`、`datasets/xxx-label.png`）
- 基本统计信息（shots、traces、samples、dt 等）

### 3.4 图片路径

所有图片放在 `public/` 目录下，路径**不要以 `/` 开头**（因为网站有 `base: '/seismic-benchmark/'`）。

| 用途 | 存放路径 | JSON 中写法 |
|------|----------|-------------|
| 团队照片 | `public/team/xxx.jpg` | `/seismic-benchmark/team/xxx.jpg` |
| 数据集图片 | `public/datasets/xxx.png` | `datasets/xxx.png` |
| 模型架构图 | `public/models/xxx.png` | `models/xxx.png` |

---

## 4. 整合流程（以后按此执行）

当你提供新材料时，请按以下格式给出：

1. **模型文件**（`model/*.json`）：每个模型一个文件，字段见模板。
2. **结果文件**（`results/*.json`）：每个模型一个文件，支持多个 benchmark 的结果数组。
3. **benchmark 文件**（`*_benchmarks.json`）：该任务下所有 benchmark 的数组。
4. **分组说明**（如需要）：哪些 benchmark 需要加 `group_name`，以及通用描述。
5. **图片文件**：数据集图片、团队照片等，直接给出文件或路径。
6. **删除说明**：如果有旧的占位数据需要删除，请明确指出。

**我会执行的操作**：
1. 读取你提供的 JSON，原样合并到 `src/data/` 下对应文件。
2. 根据你的分组说明添加 `group_name`。
3. 在 `GROUP_DESCRIPTIONS` 中补充通用描述。
4. 处理图片（复制到 `public/` 并确认路径格式）。
5. 运行 `npm run build` 验证无报错。

---

## 5. 常见注意事项

| 问题 | 处理方式 |
|------|----------|
| `scores` 中有 `"non"` | 转为 `null`，前端显示为 "—" |
| `weights_urls` 为空对象 `{}` | 删除该字段，保持简洁 |
| `architecture_image` 为 `null` | 删除该字段 |
| `weights_url` 为 `null` | 删除该字段 |
| 同一数据集多个 benchmark | 统一 `dataset_name`，按需加 `group_name` |
| 旧占位数据冲突 | 请你明确指出删除哪些旧条目 |

---

## 6. 模板参考

详细的字段模板见 `templates/` 目录：
- `model_template.md`
- `benchmark_template.md`
- `result_template.md`
