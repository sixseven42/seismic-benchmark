# SeismicBench 重构版维护指南

> 本文档面向**不熟悉 React + TypeScript + Vite** 的维护者。我们将用通俗的语言解释每个概念，并告诉你：
> **"想改哪里，就改哪个文件"**。

---

## 目录

1. [技术栈简介（通俗版）](#1-技术栈简介通俗版)
2. [项目结构总览](#2-项目结构总览)
3. [修改数据内容](#3-修改数据内容)
4. [修改样式和主题](#4-修改样式和主题)
5. [本地开发与预览](#5-本地开发与预览)
6. [部署到 GitHub Pages](#6-部署到-github-pages)
7. [常见问题](#7-常见问题)

---

## 1. 技术栈简介（通俗版）

本项目使用三个核心技术，可以类比理解：

| 技术 | 类比 | 作用 |
|---|---|---|
| **React** | 乐高积木系统 | 把网页拆成一块块"组件"（如导航栏、表格、卡片），像拼积木一样组合成完整页面 |
| **TypeScript** | 自动检查错别字 | 在写代码时就帮你发现错误（比如把 `snr` 写成 `sn` 会立即报错），避免运行时出错 |
| **Vite** | 自动打包机 | 把你写的多个文件自动合并、优化，生成浏览器能直接运行的静态文件 |

### 为什么要用这些？

- **旧版**：直接写 HTML + JS，所有代码混在一起，改一处可能影响到别处
- **新版**：每个功能独立成一个"组件"，改排行榜不会影响论文页面；TypeScript 会在保存时就告诉你哪里写错了

---

## 2. 项目结构总览

```
seismic-benchmark/
├── .github/
│   └── workflows/
│       └── deploy.yml          ← GitHub 自动部署配置（一般不改）
├── public/                     ← 静态资源（如图标，一般不用）
├── src/                        ← 【核心】所有源代码都在这里
│   ├── data/                   ← 【改数据看这里】
│   │   ├── models.json         ← 模型/方法信息
│   │   ├── benchmarks.json     ← 数据集信息
│   │   ├── results.json        ← 实验分数
│   │   └── papers.json         ← 论文信息
│   ├── pages/                  ← 四个主页面组件
│   │   ├── LeaderboardPage.tsx ← 排行榜页面
│   │   ├── BenchmarksPage.tsx  ← 数据集页面
│   │   ├── ModelsPage.tsx      ← 模型页面
│   │   └── PapersPage.tsx      ← 论文页面
│   ├── hooks/                  ← 工具钩子（主题、数据加载）
│   │   ├── useData.ts          ← 自动读取 JSON 数据
│   │   ├── useTheme.ts         ← 暗色/亮色模式管理
│   │   └── useDebounce.ts      ← 搜索输入防抖
│   ├── utils/                  ← 辅助函数
│   │   ├── helpers.ts          ← 格式化、排序等通用逻辑
│   │   └── charts.ts           ← Chart.js 图表配置
│   ├── types/
│   │   └── index.ts            ← 数据类型定义（JSON 结构说明）
│   ├── App.tsx                 ← 主应用（导航栏 + 路由）
│   ├── main.tsx                ← 程序入口（一般不改）
│   ├── index.css               ← 全局样式（颜色、字体、布局）
│   └── vite-env.d.ts           ← Vite 类型声明（不用管）
├── index.html                  ← HTML 入口（一般不改）
├── package.json                ← 依赖列表（相当于"购物清单"）
├── tsconfig.json               ← TypeScript 配置（一般不改）
├── vite.config.ts              ← Vite 配置（一般不改）
└── MAINTENANCE.md              ← 本文档
```

### 快速对照表

| 想修改的内容 | 修改哪个文件/目录 |
|---|---|
| 添加/修改论文 | `src/data/papers.json` |
| 添加/修改模型 | `src/data/models.json` |
| 添加/修改数据集 | `src/data/benchmarks.json` |
| 添加/修改实验分数 | `src/data/results.json` |
| 修改配色/字体大小 | `src/index.css` |
| 修改页面底部信息 | `src/App.tsx` 中的 `<footer>` |
| 改排行榜表格的列 | `src/pages/LeaderboardPage.tsx` |

---

## 3. 修改数据内容

### 3.1 核心原则

**所有展示数据都来自 `src/data/` 下的四个 JSON 文件**。修改这些文件后，重新构建部署即可更新网站。

### 3.2 JSON 文件说明

#### `src/data/models.json` — 模型（方法）

```json
{
  "id": "unet-interp-2022",       // 唯一标识符，不能重复
  "name": "SeisU-Net",            // 显示名称
  "authors": "Zhang et al.",      // 作者
  "org": "China University of Petroleum", // 单位
  "year": 2022,                   // 年份
  "emoji": "🌊",                  // 图标
  "type": "deep_learning",        // 类型：traditional / deep_learning / hybrid
  "tasks": ["interpolation", "denoising"], // 支持的任务
  "description": "U-Net architecture...",   // 描述
  "paper_url": "https://doi.org/...",       // 论文链接
  "code_url": "https://github.com/...",     // 代码链接
  "weights_url": null,            // 权重下载链接，没有就写 null
  "is_open_source": true          // 是否开源
}
```

#### `src/data/benchmarks.json` — 数据集

```json
{
  "id": "synth-interp-2d",
  "name": "Synthetic 2D Interpolation",
  "task": "interpolation",        // 任务：interpolation / denoising / first_arrival_picking
  "icon": "📡",
  "description": "数据集描述...",
  "data_source": "synthetic",
  "dimensions": "256 × 512 traces",
  "primary_metric": "snr",        // 主要评价指标
  "metrics": ["snr", "ssim", "rmse"], // 该数据集支持的所有指标
  "tags": ["2D", "Marine", "Random Missing"],
  "citation": "Wang et al., Geophysics 2022",
  "download_url": "https://zenodo.org/...", // 数据集下载链接
  "model_count": 0                // 自动计算，写 0 即可
}
```

#### `src/data/results.json` — 实验结果

```json
{
  "model_id": "unet-interp-2022",    // 必须存在于 models.json
  "benchmark_id": "synth-interp-2d", // 必须存在于 benchmarks.json
  "scores": {
    "snr": 28.4,
    "ssim": 0.94,
    "rmse": 0.021
  },
  "is_sota": false,                  // 是否该数据集上当前最佳
  "paper_url": "https://doi.org/...",
  "code_url": "https://github.com/...",
  "date_added": "2024-03-15"         // 格式：YYYY-MM-DD
}
```

#### `src/data/papers.json` — 论文

```json
{
  "id": "seisgan-2022",
  "title": "论文标题",
  "authors": "Li, J., Chen, X.",
  "org": "作者单位",
  "venue": "Geophysics",             // 发表期刊/会议
  "year": 2022,
  "abstract": "摘要内容...",
  "tasks": ["interpolation"],
  "tags": ["GAN", "Deep Learning"],
  "arxiv_url": "https://arxiv.org/abs/...",
  "doi": "https://doi.org/...",
  "code_url": "https://github.com/...",
  "github_stars": 142,               // GitHub 星标数
  "introduces_model": "seisgan-2022", // 对应 models.json 中的 id
  "is_sota": true                    // true 时显示 SOTA 徽章
}
```

### 3.3 添加一篇新论文的完整流程

假设要添加 "SeisTransformer (2024)":

**Step 1**: 打开 `src/data/models.json`，在数组末尾添加：

```json
{
  "id": "seistransformer-2024",
  "name": "SeisTransformer",
  "authors": "Wang et al.",
  "org": "Tongji University",
  "year": 2024,
  "emoji": "⚡",
  "type": "deep_learning",
  "tasks": ["interpolation"],
  "description": "Transformer architecture for seismic trace interpolation.",
  "paper_url": "https://doi.org/10.1190/geo2024-0000.1",
  "code_url": "https://github.com/example/seistransformer",
  "weights_url": null,
  "is_open_source": true
}
```

> ⚠️ **注意 JSON 格式**：
> - 最后一个属性后面**不要**加逗号
> - 如果添加在数组中间，前一项末尾**必须**加逗号
> - 建议用 VS Code 编辑，会自动检查格式错误

**Step 2**: 打开 `src/data/papers.json`，添加论文信息：

```json
{
  "id": "seistransformer-2024",
  "title": "Seismic Interpolation with Transformer Networks",
  "authors": "Wang, H., Li, M.",
  "org": "Tongji University",
  "venue": "Geophysics",
  "year": 2024,
  "abstract": "We propose a transformer-based method...",
  "tasks": ["interpolation"],
  "tags": ["Transformer", "Deep Learning"],
  "arxiv_url": "https://arxiv.org/abs/...",
  "doi": "https://doi.org/10.1190/geo2024-0000.1",
  "code_url": "https://github.com/example/seistransformer",
  "github_stars": 89,
  "introduces_model": "seistransformer-2024",
  "is_sota": true
}
```

**Step 3**: 打开 `src/data/results.json`，添加实验结果（至少2个）：

```json
{
  "model_id": "seistransformer-2024",
  "benchmark_id": "synth-interp-2d",
  "scores": {
    "snr": 30.5,
    "ssim": 0.96,
    "rmse": 0.015
  },
  "is_sota": true,
  "paper_url": "https://doi.org/10.1190/geo2024-0000.1",
  "code_url": "https://github.com/example/seistransformer",
  "date_added": "2024-04-27"
}
```

**Step 4**: 保存所有文件，提交并推送。GitHub Actions 会自动构建并部署。

---

## 4. 修改样式和主题

### 4.1 修改颜色、字体、间距

**文件**: `src/index.css`

文件开头定义了 CSS 变量，修改这里会影响整个网站：

```css
:root {
  --bg: #f7f7f5;          /* 页面背景色 */
  --surface: #ffffff;      /* 卡片背景色 */
  --border: #e2e2dc;       /* 边框颜色 */
  --text: #1a1a18;         /* 主要文字颜色 */
  --text-muted: #6b6b63;   /* 次要文字颜色 */
  --accent: #21b8a3;       /* 主题色（青绿色） */
  --accent-dark: #178a79;  /* 主题色深版 */
  --accent-bg: #e8f9f6;    /* 主题色浅色背景 */
  --tag-bg: #f0f0ec;       /* 标签背景 */
  --mono: 'IBM Plex Mono', monospace;
  --sans: 'IBM Plex Sans', sans-serif;
}
```

### 4.2 修改暗色模式

在同一文件的 `[data-theme="dark"]` 部分：

```css
[data-theme="dark"] {
  --bg: #14140f;
  --surface: #1e1e1c;
  --text: #ececea;
  /* ... */
}
```

### 4.3 修改页面底部信息

**文件**: `src/App.tsx`

搜索 `<footer>` 标签，修改其中的文字和链接：

```tsx
<footer>
  SeismicBench · Data sourced from published papers ·
  Last updated {lastUpdated} ·
  <a href="https://github.com/YOUR_USERNAME/seismic-benchmark" target="_blank" rel="noreferrer">
    Contribute on GitHub
  </a>
</footer>
```

> 注意：`lastUpdated` 是自动从 `results.json` 中的最新日期计算的，无需手动修改。

---

## 5. 本地开发与预览

### 5.1 安装环境

你需要安装 **Node.js**（推荐 18 或以上版本）：

1. 访问 https://nodejs.org/
2. 下载 LTS（长期支持）版本
3. 安装完成后，打开终端（Windows: CMD / PowerShell，Mac: Terminal）
4. 验证安装：

```bash
node -v   # 应该显示版本号，如 v20.10.0
npm -v    # 应该显示版本号
```

### 5.2 安装项目依赖

在项目根目录（有 `package.json` 的文件夹）打开终端，运行：

```bash
npm install
```

这会读取 `package.json` 中的依赖列表，自动下载所有需要的库（React、Chart.js 等）。

> 第一次运行需要几分钟，会生成 `node_modules` 文件夹（很大，不要提交到 git）。

### 5.3 启动开发服务器

```bash
npm run dev
```

终端会显示一个本地地址，如 `http://localhost:5173/`。在浏览器中打开即可预览。

**开发服务器特性**：
- 修改任何文件后，浏览器会自动刷新
- 报错会直接在浏览器页面和终端中显示
- 关闭终端按 `Ctrl+C` 停止

### 5.4 构建生产版本

```bash
npm run build
```

这会生成 `dist/` 文件夹，里面是优化后的静态文件，可以直接部署到 GitHub Pages。

---

## 6. 部署到 GitHub Pages

### 6.1 自动部署（推荐）

项目已配置 GitHub Actions，**每次推送到 `main` 分支会自动构建并部署**。

**首次配置步骤**：

1. 在 GitHub 上创建仓库（如 `seismic-benchmark`）
2. 把代码推送到仓库：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/seismic-benchmark.git
   git push -u origin main
   ```
3. 进入仓库的 **Settings → Pages**
4. **Source** 选择 **Deploy from a branch**
5. **Branch** 选择 **gh-pages** / **root**，点击 Save
6. 等待 1-2 分钟，访问 `https://YOUR_USERNAME.github.io/seismic-benchmark/`

### 6.2 修改部署路径

如果仓库名不是 `seismic-benchmark`，需要修改 `vite.config.ts`：

```ts
export default defineConfig({
  plugins: [react()],
  base: '/你的仓库名/',
})
```

例如仓库名为 `my-benchmark`，则改为 `base: '/my-benchmark/'`。

---

## 7. 常见问题

### Q1: 修改 JSON 后页面没有变化？

- 开发模式下（`npm run dev`）：保存 JSON 后浏览器会自动刷新
- 如果未刷新，按 `F5` 手动刷新
- 生产环境需要重新 `git push`，等待 GitHub Actions 部署完成

### Q2: `npm install` 报错？

- 检查 Node.js 版本：`node -v`，需要 ≥ 18
- 删除 `node_modules` 文件夹和 `package-lock.json`，重新运行 `npm install`

### Q3: 如何添加新的指标（如 PSNR）？

1. 在 `src/types/index.ts` 中的 `MetricKey` 和 `Scores` 中添加新指标
2. 在 `src/data/benchmarks.json` 中使用新指标
3. 在 `src/utils/helpers.ts` 的 `getMetricColumns` 和 `formatMetricValue` 中处理新指标
4. 在 `src/pages/LeaderboardPage.tsx` 和 `ModelsPage.tsx` 的表格中确保新指标被渲染

### Q4: TypeScript 报错 "Type 'xxx' is not assignable to type 'yyy'"？

这是 TypeScript 在帮你发现错误。常见原因：
- JSON 中某个字段的类型不对（如把字符串写成了数字）
- `model_id` 或 `benchmark_id` 在对应文件中不存在
- 数组中最后一项后面加了多余的逗号

根据报错信息定位到具体文件和行号，修正即可。

### Q5: 图表不显示或显示错误？

- 检查浏览器控制台（F12 → Console）是否有错误
- 确保 `chart.js` 和 `react-chartjs-2` 已正确安装（`npm install`）
- 暗色/亮色切换后图表可能需要刷新页面才能完全适配

### Q6: 搜索功能如何工作？

搜索框在导航栏右上角，输入后会延迟 200ms 再过滤（防抖），避免频繁刷新：
- **Leaderboard**: 搜索模型名称、作者、单位
- **Benchmarks**: 搜索数据集名称、标签
- **Models**: 搜索模型名称、作者
- **Papers**: 搜索论文标题、作者、标签

---

## 附录：各任务支持的指标

| 任务 | 可用指标 | 越高越好 |
|---|---|---|
| Interpolation | `snr`, `psnr`, `ssim`, `rmse`, `mse` | SNR ✅, PSNR ✅, SSIM ✅, RMSE ❌, MSE ❌ |
| Denoising | `snr`, `psnr`, `ssim`, `rmse`, `mse` | SNR ✅, PSNR ✅, SSIM ✅, RMSE ❌, MSE ❌ |
| First Arrival Picking | `accuracy`, `f1`, `mae` | Accuracy ✅, F1 ✅, MAE ❌ |

---

如有其他问题，可查看 `CLAUDE.md` 获取原始项目的技术规范。
