import { useState, useMemo, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../hooks/useTheme';
import type { AppData, Filters, MetricKey } from '../types';
import {
  isLowerBetter,
  isNewResult,
  getMetricColumns,
  formatMetricValue,
  escapeHtml,
} from '../utils/helpers';
import { getBarChartConfig } from '../utils/charts';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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
  const { theme } = useTheme();
  const [sort, setSort] = useState<SortState>({ key: 'score', dir: 'desc' });
  const [hitRatePx, setHitRatePx] = useState<string>('hit_rate_3px');
  const [ebMetric, setEbMetric] = useState<MetricKey>('eb_wse_medium_40_70_snr');
  const [fbMetric, setFbMetric] = useState<MetricKey>('fb_fre_high_snr');
  const [auxMetric, setAuxMetric] = useState<MetricKey>('ssim');

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
    list = list.filter(row =>
      row.model!.type === 'deep_learning' || row.model!.type === 'hybrid'
    );
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(row =>
        (row.model!.name || '').toLowerCase().includes(q) ||
        (row.model!.authors || '').toLowerCase().includes(q) ||
        (row.model!.org || '').toLowerCase().includes(q)
      );
    }

    const { key, dir } = sort;
    const allMetrics = [
      'snr', 'psnr', 'ssim', 'rmse', 'mse', 'accuracy', 'f1', 'mae',
      'hit_rate', 'hit_rate_1px', 'hit_rate_3px', 'hit_rate_5px', 'hit_rate_7px', 'hit_rate_9px',
      'eb', 'fb', 'aux',
      'eb_wse_medium_40_70_ne', 'eb_wse_medium_40_70_snr',
      'eb_wse_strong_70_100_ne', 'eb_wse_strong_70_100_snr',
      'eb_wse_very_weak_5_20_ne', 'eb_wse_very_weak_5_20_snr',
      'eb_wse_weak_20_40_ne', 'eb_wse_weak_20_40_snr',
      'fb_fre_high_ne', 'fb_fre_high_snr',
      'fb_fre_low_ne', 'fb_fre_low_snr',
      'fb_fre_mid_ne', 'fb_fre_mid_snr',
      'fb_fre_very_high_ne', 'fb_fre_very_high_snr',
    ];

    list.sort((a, b) => {
      if (key === 'name') {
        const av = a.model!.name || '';
        const bv = b.model!.name || '';
        return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      } else if (key === 'benchmark') {
        const av = a.benchmark!.name || '';
        const bv = b.benchmark!.name || '';
        return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      } else if (key === 'params') {
        const av = a.model!.parameters_m ?? null;
        const bv = b.model!.parameters_m ?? null;
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        return dir === 'asc' ? av - bv : bv - av;
      } else if (key === 'score' || allMetrics.includes(key)) {
        let metric = key === 'score' ? filters.metric : key === 'hit_rate' ? hitRatePx : key;
        if (metric === 'eb') metric = ebMetric;
        if (metric === 'fb') metric = fbMetric;
        if (metric === 'aux') metric = auxMetric;
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
    const resolveMetric = (m: string): MetricKey => {
      if (m === 'hit_rate') return hitRatePx as MetricKey;
      if (m === 'eb') return ebMetric;
      if (m === 'fb') return fbMetric;
      if (m === 'aux') return auxMetric;
      return m as MetricKey;
    };
    const headers = ['Rank', 'Method', 'Authors', 'Org', 'Year', 'Type', 'Params (M)', 'Benchmark', 'Task', ...metricCols.map(m => resolveMetric(m).toUpperCase()), 'Date Added'];
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
        m.parameters_m != null ? m.parameters_m.toFixed(2) : '',
        `"${(b.name || '').replace(/"/g, '""')}"`,
        b.task || '',
        ...metricCols.map(metric => {
          const actualMetric = resolveMetric(metric);
          const val = row.result.scores[actualMetric] ?? null;
          const std = row.result.scores_std?.[actualMetric] ?? null;
          return formatMetricValue(val, actualMetric, std);
        }),
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
  }, [rows, metricCols, filters.task, hitRatePx, ebMetric, fbMetric, auxMetric]);

  const availableDatasets = useMemo(() => {
    return data.benchmarks.filter(b => filters.task === 'all' || b.task === filters.task);
  }, [data.benchmarks, filters.task]);

  const datasetOptions = useMemo(() => {
    const groups = new Map<string, typeof availableDatasets>();
    const singles: typeof availableDatasets = [];
    for (const b of availableDatasets) {
      if (b.group_name) {
        if (!groups.has(b.group_name)) groups.set(b.group_name, []);
        groups.get(b.group_name)!.push(b);
      } else {
        singles.push(b);
      }
    }
    return { groups: Array.from(groups.entries()), singles };
  }, [availableDatasets]);

  const currentBench = data.benchmarks.find(b => b.id === filters.dataset);

  const taskOptions: (
    | { value: Filters['task']; label: string }
    | { group: string; items: { value: Filters['task']; label: string }[] }
  )[] = [
    { value: 'interpolation', label: t.tasks.interpolation },
    {
      group: t.taskGroups.coherent_noise,
      items: [
        { value: 'coherent_noise_suppression', label: t.tasks.coherent_noise_suppression },
        { value: 'multiples_attenuation', label: t.tasks.multiples_attenuation },
        { value: 'deblending', label: t.tasks.deblending },
      ],
    },
    { value: 'random_noise_suppression', label: t.tasks.random_noise_suppression },
    { value: 'first_arrival_picking', label: t.tasks.first_arrival_picking },
  ];

  const typeOptions: { value: Filters['type']; label: string }[] = [
    { value: 'deep_learning', label: 'Deep Learning (E2E)' },
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
              const firstBench = data.benchmarks.find(b => b.task === task);
              setFilters(prev => ({
                ...prev,
                task,
                dataset: firstBench ? firstBench.id : 'all',
                metric: task === 'first_arrival_picking' ? 'mae' : 'snr',
              }));
              setSort({ key: 'score', dir: 'desc' });
            }}
          >
            {taskOptions.map(o =>
              'group' in o ? (
                <optgroup key={o.group} label={o.group}>
                  {o.items.map(item => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </optgroup>
              ) : (
                <option key={o.value} value={o.value}>{o.label}</option>
              )
            )}
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
            {datasetOptions.groups.map(([groupName, items]) => (
              <optgroup key={groupName} label={groupName}>
                {items.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </optgroup>
            ))}
            {datasetOptions.singles.map(b => (
              <option key={b.id} value={b.id}>{b.dataset_name}</option>
            ))}
          </select>
        </div>

        <div className="toolbar-group">
          <label>{t.leaderboard.metric}</label>
          <select
            value={filters.metric}
            onChange={e => {
              const val = e.target.value as MetricKey;
              if (val.startsWith('hit_rate_')) setHitRatePx(val);
              if (val.startsWith('eb_wse_')) setEbMetric(val);
              if (val.startsWith('fb_fre_')) setFbMetric(val);
              setFilters(prev => ({ ...prev, metric: val }));
            }}
          >
            {(() => {
              const metrics = currentBench?.metrics || ['snr', 'psnr', 'ssim', 'rmse', 'mse', 'accuracy', 'f1', 'mae'];
              const energyMetrics = metrics.filter(m => m.startsWith('eb_wse_'));
              const freqMetrics = metrics.filter(m => m.startsWith('fb_fre_'));
              const hitRateMetrics = metrics.filter(m => m.startsWith('hit_rate_') || m === 'hit_rate');
              const coreMetrics = metrics.filter(m => !energyMetrics.includes(m) && !freqMetrics.includes(m) && !hitRateMetrics.includes(m));
              return (
                <>
                  {coreMetrics.map(m => (
                    <option key={m} value={m}>{m.toUpperCase()}</option>
                  ))}
                  {energyMetrics.length > 0 && (
                    <optgroup label="Energy Band">
                      {energyMetrics.map(m => (
                        <option key={m} value={m}>{m.toUpperCase()}</option>
                      ))}
                    </optgroup>
                  )}
                  {freqMetrics.length > 0 && (
                    <optgroup label="Frequency Band">
                      {freqMetrics.map(m => (
                        <option key={m} value={m}>{m.toUpperCase()}</option>
                      ))}
                    </optgroup>
                  )}
                  {hitRateMetrics.length > 0 && (
                    <optgroup label="Hit Rate">
                      {hitRateMetrics.map(m => (
                        <option key={m} value={m}>{m.replace('hit_rate_', '').replace(/^hit_rate$/, 'Any')}</option>
                      ))}
                    </optgroup>
                  )}
                </>
              );
            })()}
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
              <th className="sortable" onClick={() => handleSort('params')}>
                PARAMS (M) <span className="sort-arrow">{sort.key === 'params' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</span>
              </th>
              <th className="sortable" onClick={() => handleSort('benchmark')}>
                {t.leaderboard.benchmark} <span className="sort-arrow">{sort.key === 'benchmark' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</span>
              </th>
              {metricCols.map(m => {
                if (m === 'hit_rate') {
                  const isActive = filters.metric === hitRatePx;
                  return (
                    <th
                      key={m}
                      className={`sortable ${isActive ? 'sort-active' : ''}`}
                      onClick={() => handleSort('hit_rate')}
                    >
                      HIT RATE{' '}
                      <select
                        value={hitRatePx}
                        onClick={e => e.stopPropagation()}
                        onChange={e => {
                          const val = e.target.value;
                          setHitRatePx(val);
                          setFilters(prev => ({ ...prev, metric: val as MetricKey }));
                        }}
                        style={{ fontSize: '0.7em', marginLeft: 4, padding: '1px 2px' }}
                      >
                        {['1px', '3px', '5px', '7px', '9px'].map(px => (
                          <option key={px} value={`hit_rate_${px}`}>{px}</option>
                        ))}
                      </select>
                      <span className="sort-arrow">{sort.key === 'hit_rate' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</span>
                    </th>
                  );
                }
                if (m === 'eb') {
                  const isActive = filters.metric === ebMetric;
                  const options = (currentBench?.metrics || []).filter(x => x.startsWith('eb_wse_'));
                  return (
                    <th
                      key={m}
                      className={`sortable ${isActive ? 'sort-active' : ''}`}
                      onClick={() => handleSort('eb')}
                    >
                      ENERGY BAND{' '}
                      <select
                        value={ebMetric}
                        onClick={e => e.stopPropagation()}
                        onChange={e => {
                          const val = e.target.value as MetricKey;
                          setEbMetric(val);
                          setFilters(prev => ({ ...prev, metric: val }));
                        }}
                        style={{ fontSize: '0.7em', marginLeft: 4, padding: '1px 2px' }}
                      >
                        {options.map(opt => (
                          <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                        ))}
                      </select>
                      <span className="sort-arrow">{sort.key === 'eb' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</span>
                    </th>
                  );
                }
                if (m === 'fb') {
                  const isActive = filters.metric === fbMetric;
                  const options = (currentBench?.metrics || []).filter(x => x.startsWith('fb_fre_'));
                  return (
                    <th
                      key={m}
                      className={`sortable ${isActive ? 'sort-active' : ''}`}
                      onClick={() => handleSort('fb')}
                    >
                      FREQUENCY BAND{' '}
                      <select
                        value={fbMetric}
                        onClick={e => e.stopPropagation()}
                        onChange={e => {
                          const val = e.target.value as MetricKey;
                          setFbMetric(val);
                          setFilters(prev => ({ ...prev, metric: val }));
                        }}
                        style={{ fontSize: '0.7em', marginLeft: 4, padding: '1px 2px' }}
                      >
                        {options.map(opt => (
                          <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                        ))}
                      </select>
                      <span className="sort-arrow">{sort.key === 'fb' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</span>
                    </th>
                  );
                }
                if (m === 'aux') {
                  const isActive = filters.metric === auxMetric;
                  const options = (currentBench?.metrics || []).filter(x => ['ssim', 'mae', 'mse', 'rmse'].includes(x));
                  const optionLabels: Record<string, string> = { ssim: 'SSIM', mae: 'MAE', mse: 'MSE', rmse: 'RMSE' };
                  return (
                    <th
                      key={m}
                      className={`sortable ${isActive ? 'sort-active' : ''}`}
                      onClick={() => handleSort('aux')}
                    >
                      DETAIL{' '}
                      <select
                        value={auxMetric}
                        onClick={e => e.stopPropagation()}
                        onChange={e => {
                          const val = e.target.value as MetricKey;
                          setAuxMetric(val);
                          setFilters(prev => ({ ...prev, metric: val }));
                        }}
                        style={{ fontSize: '0.7em', marginLeft: 4, padding: '1px 2px' }}
                      >
                        {(options.length ? options : ['ssim', 'mae', 'mse', 'rmse']).map(opt => (
                          <option key={opt} value={opt}>{optionLabels[opt] || opt.toUpperCase()}</option>
                        ))}
                      </select>
                      <span className="sort-arrow">{sort.key === 'aux' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</span>
                    </th>
                  );
                }
                return (
                  <th
                    key={m}
                    className={`sortable ${m === highlightMetric ? 'sort-active' : ''}`}
                    onClick={() => handleSort(m)}
                  >
                    {m.toUpperCase()}{' '}
                    <span className="sort-arrow">{sort.key === m ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</span>
                  </th>
                );
              })}
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
                  <td className="lb-params">{row.model!.parameters_m != null ? row.model!.parameters_m.toFixed(2) : '—'}</td>
                  <td className="lb-benchmark">{escapeHtml(row.benchmark!.name)}</td>
                  {metricCols.map(m => {
                    const actualMetric = m === 'hit_rate' ? hitRatePx : m === 'eb' ? ebMetric : m === 'fb' ? fbMetric : m === 'aux' ? auxMetric : m;
                    const val = row.result.scores[actualMetric as MetricKey] ?? null;
                    const std = row.result.scores_std?.[actualMetric as MetricKey] ?? null;
                    const isHighlight = actualMetric === highlightMetric;
                    return (
                      <td key={m} className={`lb-score ${isHighlight ? 'lb-score-highlight' : ''}`}>
                        {formatMetricValue(val, actualMetric, std)}
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
                    {(row.model!.weights_urls?.[row.benchmark!.task] || row.model!.weights_url) && (
                      <a
                        className="icon-link"
                        href={row.model!.weights_urls?.[row.benchmark!.task] || row.model!.weights_url || ''}
                        target="_blank"
                        rel="noreferrer"
                        title="Weights"
                      >
                        ⬇️
                      </a>
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

      {rows.length > 0 && (
        <div className="section-title" style={{ marginTop: 'var(--space-6)' }}>
          <h3>{highlightMetric.toUpperCase()} Comparison</h3>
        </div>
      )}
      {rows.length > 0 && (
        <div className="card">
          <div className="detail-chart-wrap" style={{ height: Math.max(280, rows.length * 44) }}>
            {(() => {
              const lowerBetter = isLowerBetter(highlightMetric);
              const bestScore = lowerBetter
                ? Math.min(...rows.map(r => r.result.scores[highlightMetric] ?? Infinity))
                : Math.max(...rows.map(r => r.result.scores[highlightMetric] ?? -Infinity));
              const chartData = rows.map(r => {
                const score = r.result.scores[highlightMetric] ?? 0;
                if (!lowerBetter) return score;
                if (bestScore <= 0) return score <= 0 ? 100 : 0;
                return (bestScore / score) * 100;
              });
              const rawScores = rows.map(r => r.result.scores[highlightMetric] ?? 0);
              return (
                <Bar
                  {...getBarChartConfig(
                    rows.map(r => r.model!.name),
                    chartData,
                    highlightMetric,
                    theme,
                    rawScores
                  )}
                />
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
