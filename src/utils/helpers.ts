export function escapeHtml(str: string): string {
  if (!str) return '';
  return str.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
}

export function isLowerBetter(metric: string): boolean {
  return metric === 'rmse' || metric === 'mae' || metric === 'mse' || metric.endsWith('_ne');
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
  if (
    task === 'multiples_attenuation' ||
    task === 'coherent_noise_suppression' ||
    task === 'interpolation' ||
    task === 'random_noise_suppression' ||
    task === 'deblending'
  ) {
    return ['snr', 'psnr', 'aux', 'eb', 'fb'];
  }
  if (task === 'first_arrival_picking') {
    return ['mae', 'rmse', 'f1', 'hit_rate'];
  }
  return ['snr', 'psnr', 'aux', 'accuracy', 'f1'];
}

export function formatMetricValue(value: number | null | undefined, metric: string, std?: number | null | undefined): string {
  if (value == null) return '—';
  let meanStr: string;
  if (metric === 'ssim' || metric === 'f1') meanStr = value.toFixed(3);
  else if (metric === 'mse') meanStr = value.toFixed(6);
  else if (metric === 'rmse') meanStr = value.toFixed(4);
  else if (metric === 'accuracy') meanStr = value.toFixed(2) + '%';
  else meanStr = value.toFixed(2);

  if (std == null) return meanStr;

  let stdStr: string;
  if (metric === 'ssim' || metric === 'f1') stdStr = std.toFixed(4);
  else if (metric === 'mse') stdStr = std.toFixed(7);
  else if (metric === 'rmse') stdStr = std.toFixed(5);
  else if (metric === 'accuracy') stdStr = std.toFixed(2) + '%';
  else stdStr = std.toFixed(3);

  return `${meanStr} ± ${stdStr}`;
}
