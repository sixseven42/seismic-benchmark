import { useState, useMemo, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { AppData, Filters, MetricKey } from '../types';
import {
  isLowerBetter,
  isNewResult,
  getMetricColumns,
  formatMetricValue,
  escapeHtml,
} from '../utils/helpers';

interface Props {
  data: AppData;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  search: string;
}

interface SortState {
  key: string;
  dir: 'asc' | 'desc';
}

export default function LeaderboardPage({ data, filters, setFilters, search }: Props) {
  const { t } = useLanguage();
  const [sort, setSort] = useState<SortState>({ key: 'score', dir: 'desc' });

  const metricCols = useMemo(() => getMetricColumns(filters.task), [filters.task]);

  const rows = useMemo(() => {
    let list = data.results.map(r => {
      const model = data.models.find(m => m.id === r.model_id);
      const benchmark = data.benchmarks.find(b => b.id === r.benchmark_id);
      return { model, benchmark, result: r };
    }).filter(row => row.model && row.benchmark);

    if (filters.task !== 'all') {
      list = list.filter(row => row.benchmark!.task === filters.task);
    }
    if (filters.dataset !== 'all') {
      list = list.filter(row => row.benchmark!.id === filters.dataset);
    }
    if (filters.type !== 'all') {
      list = list.filter(row => row.model!.type === filters.type);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(row =>
        (row.model!.name || '').toLowerCase().includes(q) ||
        (row.model!.authors || '').toLowerCase().includes(q) ||
        (row.model!.org || '').toLowerCase().includes(q)
      );
    }

    const { key, dir } = sort;
    const allMetrics = ['snr', 'psnr', 'ssim', 'rmse', 'mse', 'accuracy', 'f1', 'mae'];

    list.sort((a, b) => {
      if (key === 'name') {
        const av = a.model!.name || '';
        const bv = b.model!.name || '';
        return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      } else if (key === 'benchmark') {
        const av = a.benchmark!.name || '';
        const bv = b.benchmark!.name || '';
        return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      } else if (key === 'score' || allMetrics.includes(key)) {
        const metric = key === 'score' ? filters.metric : key;
        const av = a.result.scores[metric as MetricKey] ?? null;
        const bv = b.result.scores[metric as MetricKey] ?? null;
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        const lowerBetter = isLowerBetter(metric);
        const mult = lowerBetter ? -1 : 1;
        return dir === 'asc' ? (av - bv) * mult : (bv - av) * mult;
      }
      return 0;
    });

    return list;
  }, [data, filters, sort, search]);

  const highlightMetric = filters.metric;
  const lowerBetter = isLowerBetter(highlightMetric);

  const highlightScores = useMemo(() => {
    const scores = rows
      .map(r => r.result.scores[highlightMetric] ?? null)
      .filter((s): s is number => s !== null);
    return scores;
  }, [rows, highlightMetric]);

  const bestScore = highlightScores.length
    ? (lowerBetter ? Math.min(...highlightScores) : Math.max(...highlightScores))
    : 0;

  const handleSort = useCallback((key: string) => {
    setSort(prev => ({
      key,
      dir: prev.key === key ? (prev.dir === 'asc' ? 'desc' : 'asc') : 'desc',
    }));
  }, []);

  const exportCSV = useCallback(() => {
    const headers = ['Rank', 'Method', 'Authors', 'Org', 'Year', 'Type', 'Benchmark', 'Task', ...metricCols.map(m => m.toUpperCase()), 'Date Added'];
    const lines = [headers.join(',')];
    rows.forEach((row, idx) => {
      const m = row.model!;
      const b = row.benchmark!;
      const line = [
        idx + 1,
        `"${(m.name || '').replace(/"/g, '""')}"`,
        `"${(m.authors || '').replace(/"/g, '""')}"`,
        `"${(m.org || '').replace(/"/g, '""')}"`,
        m.year || '',
        m.type || '',
        `"${(b.name || '').replace(/"/g, '""')}"`,
        b.task || '',
        ...metricCols.map(metric => row.result.scores[metric as MetricKey] ?? ''),
        row.result.date_added || '',
      ];
      lines.push(line.join(','));
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seismicbench-${filters.task}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [rows, metricCols, filters.task]);

  const availableDatasets = useMemo(() => {
    return data.benchmarks.filter(b => filters.task === 'all' || b.task === filters.task);
  }, [data.benchmarks, filters.task]);

  const currentBench = data.benchmarks.find(b => b.id === filters.dataset);

  const taskOptions: { value: Filters['task']; label: string }[] = [
    { value: 'all', label: t.leaderboard.all },
    { value: 'interpolation', label: t.tasks.interpolation },
    { value: 'denoising', label: t.tasks.denoising },
    { value: 'first_arrival_picking', label: t.tasks.first_arrival_picking },
  ];

  const typeOptions: { value: Filters['type']; label: string }[] = [
    { value: 'all', label: t.leaderboard.allTypes },
    { value: 'traditional', label: 'Traditional' },
    { value: 'deep_learning', label: 'Deep Learning' },
    { value: 'hybrid', label: 'Hybrid' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>{t.leaderboard.title}</h1>
        <p className="lede">{t.leaderboard.subtitle}</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-group">
          <label>{t.leaderboard.task}</label>
          <select
            value={filters.task}
            onChange={e => {
              const task = e.target.value as Filters['task'];
              setFilters(prev => ({
                ...prev,
                task,
                dataset: 'all',
                metric: task === 'first_arrival_picking' ? 'accuracy' : 'snr',
              }));
              setSort({ key: 'score', dir: 'desc' });
            }}
          >
            {taskOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="toolbar-group">
          <label>{t.leaderboard.dataset}</label>
          <select
            value={filters.dataset}
            onChange={e => {
              const dataset = e.target.value;
              const bench = data.benchmarks.find(b => b.id === dataset);
              setFilters(prev => ({
                ...prev,
                dataset,
                metric: bench ? bench.primary_metric : prev.metric,
              }));
            }}
          >
            <option value="all">{t.leaderboard.allDatasets}</option>
            {availableDatasets.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="toolbar-group">
          <label>{t.leaderboard.metric}</label>
          <select
            value={filters.metric}
            onChange={e => setFilters(prev => ({ ...prev, metric: e.target.value as MetricKey }))}
          >
            {(currentBench?.metrics || ['snr', 'psnr', 'ssim', 'rmse', 'mse', 'accuracy', 'f1', 'mae']).map(m => (
              <option key={m} value={m}>{m.toUpperCase()}</option>
            ))}
          </select>
        </div>

        <div className="toolbar-group">
          <label>{t.leaderboard.type}</label>
          <select
            value={filters.type}
            onChange={e => setFilters(prev => ({ ...prev, type: e.target.value as Filters['type'] }))}
          >
            {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <span className="result-count">{rows.length} {t.leaderboard.results}</span>
      </div>

      <div className="lb-wrapper">
        <table className="lb-table" id="leaderboard-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort('rank')}>
                {t.leaderboard.rank} <span className="sort-arrow">{sort.key === 'rank' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</span>
              </th>
              <th className="sortable" onClick={() => handleSort('name')}>
                {t.leaderboard.method} <span className="sort-arrow">{sort.key === 'name' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</span>
              </th>
              <th className="sortable" onClick={() => handleSort('benchmark')}>
                {t.leaderboard.benchmark} <span className="sort-arrow">{sort.key === 'benchmark' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</span>
              </th>
              {metricCols.map(m => (
                <th
                  key={m}
                  className={`sortable ${m === highlightMetric ? 'sort-active' : ''}`}
                  onClick={() => handleSort(m)}
                >
                  {m.toUpperCase()}{' '}
                  <span className="sort-arrow">{sort.key === m ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</span>
                </th>
              ))}
              <th>{highlightMetric.toUpperCase()} {t.leaderboard.highlight}</th>
              <th>{t.leaderboard.links}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const rank = idx + 1;
              const medal = rank <= 3 ? (rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉') : '';
              const highlightScore = row.result.scores[highlightMetric] ?? null;
              const pct = highlightScore !== null && bestScore
                ? (lowerBetter ? (bestScore / highlightScore) : (highlightScore / bestScore)) * 100
                : 0;

              return (
                <tr key={`${row.model!.id}-${row.benchmark!.id}`}>
                  <td className="lb-rank">
                    {medal}<span>{rank}</span>
                  </td>
                  <td className="lb-method">
                    <span className="method-emoji">{row.model!.emoji || ''}</span>
                    <div>
                      <strong>{escapeHtml(row.model!.name)}</strong>
                      <span className="method-meta">{escapeHtml(row.model!.authors)} · {escapeHtml(row.model!.org)}</span>
                    </div>
                    {isNewResult(row.result.date_added) && <span className="tag tag-new">{t.leaderboard.newBadge}</span>}
                  </td>
                  <td className="lb-benchmark">{escapeHtml(row.benchmark!.name)}</td>
                  {metricCols.map(m => {
                    const val = row.result.scores[m as MetricKey] ?? null;
                    const isHighlight = m === highlightMetric;
                    return (
                      <td key={m} className={`lb-score ${isHighlight ? 'lb-score-highlight' : ''}`}>
                        {formatMetricValue(val, m)}
                      </td>
                    );
                  })}
                  <td>
                    {highlightScore !== null ? (
                      <div className="lb-progress">
                        <div className="lb-progress-fill" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
                      </div>
                    ) : '—'}
                  </td>
                  <td className="lb-actions">
                    {row.model!.paper_url && (
                      <a className="icon-link" href={row.model!.paper_url} target="_blank" rel="noreferrer" title="Paper">📄</a>
                    )}
                    {row.model!.code_url && (
                      <a className="icon-link" href={row.model!.code_url} target="_blank" rel="noreferrer" title="Code">💻</a>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={metricCols.length + 6} className="lb-empty">
                  {t.leaderboard.noResults}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)' }}>
        <button className="btn btn-primary btn-icon" onClick={exportCSV}>📥 {t.leaderboard.exportCSV}</button>
      </div>

      <div className="section-title">
        <h3>{t.leaderboard.downloadsTitle}</h3>
      </div>
      <div className="card">
        <div className="card-body">
          {availableDatasets.length ? availableDatasets.map(b => (
            <div className="dl-row" key={b.id}>
              <span className="dl-label">{escapeHtml(b.name)}</span>
              <a href={b.download_url} target="_blank" rel="noreferrer" className="btn-ghost btn-icon">{t.leaderboard.downloadsTitle.includes('Download') ? 'Download ↓' : '下载 ↓'}</a>
            </div>
          )) : (
            <p className="text-muted">{t.leaderboard.noDatasets}</p>
          )}
        </div>
      </div>
    </div>
  );
}
