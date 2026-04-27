import type { Chart as ChartType } from 'chart.js';

const chartInstances: Record<string, ChartType> = {};

export function getChartColors(theme: 'light' | 'dark') {
  const isDark = theme === 'dark';
  return {
    bg: isDark ? '#1e1e1c' : '#ffffff',
    grid: isDark ? '#333333' : '#e2e2dc',
    text: isDark ? '#cccccc' : '#6b6b63',
    accent: '#21b8a3',
    accentDark: '#178a79',
  };
}

export function destroyChart(canvasId: string) {
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
    delete chartInstances[canvasId];
  }
}

export function storeChart(canvasId: string, chart: ChartType) {
  destroyChart(canvasId);
  chartInstances[canvasId] = chart;
}

export function getBarChartConfig(labels: string[], data: number[], metric: string, theme: 'light' | 'dark') {
  const c = getChartColors(theme);
  return {
    type: 'bar' as const,
    data: {
      labels,
      datasets: [{
        label: metric.toUpperCase(),
        data,
        backgroundColor: c.accent,
        borderColor: c.accentDark,
        borderWidth: 1,
        borderRadius: 4,
      }],
    },
    options: {
      indexAxis: 'y' as const,
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: c.grid }, ticks: { color: c.text } },
        y: { grid: { display: false }, ticks: { color: c.text } },
      },
    },
  };
}

export function getRadarChartConfig(dataset: Record<string, number>, theme: 'light' | 'dark') {
  const c = getChartColors(theme);
  const labels = ['SNR', 'PSNR', 'SSIM', 'RMSE (inv)', 'MSE (inv)', 'Accuracy', 'F1', 'MAE (inv)'];
  const data = [
    dataset.snr ?? 0,
    dataset.psnr ?? 0,
    dataset.ssim ?? 0,
    dataset.rmse_inv ?? 0,
    dataset.mse_inv ?? 0,
    dataset.accuracy ?? 0,
    dataset.f1 ?? 0,
    dataset.mae_inv ?? 0,
  ];

  return {
    type: 'radar' as const,
    data: {
      labels,
      datasets: [{
        label: 'Normalized Score',
        data,
        backgroundColor: 'rgba(33, 184, 163, 0.2)',
        borderColor: c.accent,
        pointBackgroundColor: c.accentDark,
        pointBorderColor: '#fff',
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0,
          max: 1,
          ticks: { display: false, backdropColor: 'transparent' },
          grid: { color: c.grid },
          pointLabels: { color: c.text },
        },
      },
      plugins: { legend: { display: false } },
    },
  };
}

export function getScatterChartConfig(
  points: { year: number; score: number; model: string }[],
  theme: 'light' | 'dark'
) {
  const c = getChartColors(theme);
  return {
    type: 'scatter' as const,
    data: {
      datasets: [{
        label: 'SOTA Progression',
        data: points.map(p => ({ x: p.year, y: p.score })),
        backgroundColor: c.accent,
        borderColor: c.accentDark,
        pointRadius: 5,
        pointHoverRadius: 7,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: { dataIndex: number }) => {
              const p = points[ctx.dataIndex];
              return `${p.model} (${p.year}): ${p.score.toFixed(2)}`;
            },
          },
        },
      },
      scales: {
        x: {
          type: 'linear' as const,
          position: 'bottom' as const,
          title: { display: true, text: 'Year', color: c.text },
          grid: { color: c.grid },
          ticks: { color: c.text, stepSize: 1 },
        },
        y: {
          title: { display: true, text: 'Score', color: c.text },
          grid: { color: c.grid },
          ticks: { color: c.text },
        },
      },
    },
  };
}
