export function escapeHtml(str: string): string {
  if (!str) return '';
  return str.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
}

export function isLowerBetter(metric: string): boolean {
  return metric === 'rmse' || metric === 'mae' || metric === 'mse';
}

export function formatType(type: string): string {
  return type ? type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';
}

export function isNewResult(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  return diff <= 30;
}

export function getLastUpdatedDate(results: { date_added?: string }[]): string {
  const dates = results
    .map(r => r.date_added ? new Date(r.date_added).getTime() : 0)
    .filter(t => t > 0);
  const lastUpdated = dates.length ? new Date(Math.max(...dates)) : new Date();
  return lastUpdated.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

export function getMetricColumns(task: string): string[] {
  if (task === 'interpolation' || task === 'denoising') {
    return ['snr', 'psnr', 'ssim', 'rmse', 'mse'];
  }
  if (task === 'first_arrival_picking') {
    return ['accuracy', 'f1', 'mae'];
  }
  return ['snr', 'psnr', 'ssim', 'rmse', 'mse', 'accuracy', 'f1', 'mae'];
}

export function formatMetricValue(value: number | null | undefined, metric: string): string {
  if (value == null) return '—';
  if (metric === 'ssim' || metric === 'f1') return value.toFixed(3);
  if (metric === 'mse') return value.toFixed(6);
  if (metric === 'rmse') return value.toFixed(4);
  if (metric === 'accuracy') return value.toFixed(2) + '%';
  return value.toFixed(2);
}
