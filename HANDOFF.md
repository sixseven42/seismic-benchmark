# 跨机迁移 / 交接文档

> 生成时间：2026-08-03  
> 用途：把当前项目状态和近期工作记忆迁移到另一台电脑/服务器，拉取 `main` 分支后即可继续操作。

---

## 1. 仓库信息

- **仓库地址**：`git@github.com:sixseven42/seismic-benchmark.git`
- **默认分支**：`main`
- **当前提交**：`ab86950 new`（已推送到 GitHub，与 `origin/main` 一致）
- **本地路径示例**：`C:\Code\benchmark`

在新机器上：

```bash
git clone git@github.com:sixseven42/seismic-benchmark.git
cd seismic-benchmark
npm install
npm run build
```

---

## 2. 技术栈

- **Vite 5 + React 18 + TypeScript 5**
- **React Router**：`HashRouter`
- **图表**：`chart.js` + `react-chartjs-2`
- **Markdown 渲染**：`react-markdown` + `remark-gfm`
- **样式**：自定义 CSS，无 UI 框架

常用命令：

| 命令 | 作用 |
|------|------|
| `npm run dev` | 本地开发服务器 |
| `npm run build` | 类型检查 + 生产构建 |
| `npm run preview` | 预览构建产物 |
| `npm run lint` | ESLint 检查 |

---

## 3. 项目结构与关键文件

```
seismic-benchmark/
├── src/
│   ├── data/
│   │   ├── benchmarks.json      # 数据集/任务定义 + metrics 列表
│   │   ├── models.json          # 模型元数据（含 parameters_m）
│   │   ├── results.json         # 所有评测结果（scores）
│   │   └── papers.json          # 论文列表
│   ├── pages/
│   │   ├── LeaderboardPage.tsx  # 排行榜（含 Energy/Frequency Band 下拉列）
│   │   ├── BenchmarksPage.tsx   # 数据集详情 + Binned Metrics 分表
│   │   ├── ModelsPage.tsx       # 模型卡片与按 benchmark 分组的指标表
│   │   └── ...
│   ├── types/index.ts           # MetricKey / Scores / Model / Benchmark 等类型
│   └── utils/helpers.ts         # isLowerBetter / formatMetricValue / getMetricColumns
├── task_plan.md                 # 当前任务计划（planning-with-files）
├── progress.md                  # 工作日志
├── DATA_INTEGRATION_GUIDE.md    # 数据接入指南
└── MAINTENANCE.md               # 维护说明
```

---

## 4. 当前已完成的关键改动（截至本交接文档）

### 4.1 多次波任务（`multiples_attenuation`）

- 从 `batch_evaluation_part(2).xlsx` 导入 9 个模型的评测结果。
- 指标包括：
  - 6 个核心指标：`snr, psnr, ssim, mae, mse, rmse`
  - 16 个分箱指标：能量带 WSE（4 个强度区间 × NE/SNR）+ 频率带（4 个频段 × NE/SNR）
- 不存储标准差，所有指标只显示单个数值。
- 为 9 个 multiples 模型添加了 `parameters_m`。

### 4.2 面波任务（`coherent_noise_suppression`）

- 从 `batch_evaluation_all.xlsx` 导入 5 个噪声等级（Noise 1.0 ~ 9.0）× 12 个模型 = 60 条结果。
- 同样接入 6 个核心指标 + 16 个 NE/SNR 分箱指标。
- 5 个 ground-roll benchmark 的 `metrics` 数组已追加分箱指标。
- Leaderboard 中 ground-roll 也会显示 `Energy Band` / `Frequency Band` 下拉列。
- 为 12 个 ground-roll 模型添加了 `parameters_m`。

### 4.3 通用改动

- `MetricKey` / `Scores` 已包含全部 16 个分箱指标（无 `_std`）。
- `isLowerBetter(metric)`：`*_ne` 越低越好，其余越高越好。
- `formatMetricValue(value, metric)`：单个数值格式化。

---

## 5. 类型与指标命名约定

### 5.1 核心指标

```ts
'snr' | 'psnr' | 'ssim' | 'rmse' | 'mse' | 'mae' | 'accuracy' | 'f1'
```

### 5.2 分箱指标（能量带 + 频率带）

能量带 WSE：

```ts
'eb_wse_very_weak_5_20_ne'  | 'eb_wse_very_weak_5_20_snr'
'eb_wse_weak_20_40_ne'      | 'eb_wse_weak_20_40_snr'
'eb_wse_medium_40_70_ne'    | 'eb_wse_medium_40_70_snr'
'eb_wse_strong_70_100_ne'   | 'eb_wse_strong_70_100_snr'
```

频率带：

```ts
'fb_fre_low_ne'        | 'fb_fre_low_snr'
'fb_fre_mid_ne'        | 'fb_fre_mid_snr'
'fb_fre_high_ne'       | 'fb_fre_high_snr'
'fb_fre_very_high_ne'  | 'fb_fre_very_high_snr'
```

### 5.3 Leaderboard 列别名

- `eb`：由 `ebMetric` 状态解析为具体能量带指标。
- `fb`：由 `fbMetric` 状态解析为具体频率带指标。
- `hit_rate`：由 `hitRatePx` 状态解析为 `hit_rate_{1,3,5,7,9}px`。

---

## 6. 继续工作的常见入口

### 6.1 接入新的 Excel 结果

1. 确认 Excel sheet 名称、Method 列与现有 `model_id` 的映射。
2. 确认 benchmark_id（如 `segc3-groundroll-noise1`）。
3. 只保留 NE/SNR 列，忽略能量比、频率范围、标准差。
4. 更新 `src/data/results.json` 对应条目。
5. 如需在 Leaderboard/Benchmarks/Models 页面显示分箱指标，把对应 `MetricKey` 追加到 `benchmarks.json` 的 `metrics` 数组。
6. 运行 `npm run build` 验证。

### 6.2 添加新的任务

1. 在 `src/types/index.ts` 的 `Task` 联合类型中新增任务名。
2. 在 `src/data/benchmarks.json` 中添加 benchmark 定义。
3. 在 `src/data/models.json` 中给相关模型添加任务。
4. 在 `src/data/results.json` 中添加结果。
5. 在 `src/utils/helpers.ts` 的 `getMetricColumns` 中配置该任务显示的列。
6. 在 `src/i18n/index.ts` 中补充中英文翻译。
7. 更新 `src/pages/LeaderboardPage.tsx`、`BenchmarksPage.tsx`、`ModelsPage.tsx` 中的 task select optgroup（如需）。

---

## 7. 环境/依赖注意事项

- 不需要额外全局工具，普通 Node.js + npm 即可。
- `node_modules` 和 `dist` 已加入 `.gitignore`，不要提交。
- 构建产物在 `dist/` 目录，可配合任何静态文件服务器部署。

---

## 8. 记忆文件说明

- `task_plan.md`：当前/最近任务计划，使用 planning-with-files skill 管理。
- `progress.md`：工作日志，记录每次会话的进展。
- `.claude/` 目录：Claude Code 本地配置/技能目录，未提交到仓库；新机器上会自动重建。

---

## 9. 验证清单（新机器首次拉取后建议执行）

```bash
npm install
npm run build
# 期望：tsc 通过，vite build 成功，无 TypeScript 错误
```

---

## 10. 近期未解决问题 / 下一步可选工作

- 随机噪声、插值、初至拾取等任务目前只有核心指标，未接入分箱指标。
- `deblending` 任务已占位，暂无结果数据。
- Leaderboard 的指标显示名目前仍是 `toUpperCase()`，后续可补充 `metricLabels` 映射优化可读性。

---

如有新的 Excel 需要接入，可参考 `DATA_INTEGRATION_GUIDE.md` 中的流程。
