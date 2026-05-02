import { useState, useMemo } from 'react';
import { Bar, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useLanguage } from '../contexts/LanguageContext';
import type { AppData, Filters } from '../types';
import { isLowerBetter, escapeHtml } from '../utils/helpers';
import { getBarChartConfig, getScatterChartConfig } from '../utils/charts';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, RadialLinearScale, Title, Tooltip, Legend
);

interface Props {
  data: AppData;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  search: string;
  theme: 'light' | 'dark';
}

export default function BenchmarksPage({ data, filters, setFilters, search, theme }: Props) {
  const { t } = useLanguage();
  const [activeBenchId, setActiveBenchId] = useState<string | null>(null);

  const list = useMemo(() => {
    let items = data.benchmarks.slice();
    if (filters.task !== 'all') {
      items = items.filter(b => b.task === filters.task);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(b =>
        (b.name || '').toLowerCase().includes(q) ||
        (b.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }
    return items;
  }, [data.benchmarks, filters.task, search]);

  const activeBench = data.benchmarks.find(b => b.id === activeBenchId);

  const benchResults = useMemo(() => {
    if (!activeBench) return [];
    const metric = activeBench.primary_metric;
    const lowerBetter = isLowerBetter(metric);
    return data.results
      .filter(r => r.benchmark_id === activeBench.id)
      .map(r => {
        const m = data.models.find(x => x.id === r.model_id);
        return { ...r, model: m, score: r.scores[metric] ?? null };
      })
      .filter((r): r is typeof r & { score: number; model: NonNullable<typeof r.model> } =>
        r.score !== null && r.model !== undefined
      )
      .sort((a, b) => lowerBetter ? (a.score - b.score) : (b.score - a.score));
  }, [activeBench, data.results, data.models]);

  const top5 = benchResults.slice(0, 5);
  const top10 = benchResults.slice(0, 10);

  const scatterPoints = useMemo(() => {
    return benchResults
      .filter(r => r.model.year)
      .map(r => ({ year: r.model.year, score: r.score, model: r.model.name }))
      .sort((a, b) => a.year - b.year);
  }, [benchResults]);

  return (
    <div>
      <div className="page-header">
        <h1>{t.benchmarks.title}</h1>
        <p className="lede">{t.benchmarks.subtitle}</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-group">
          <label>{t.leaderboard.task}</label>
          <select
            value={filters.task}
            onChange={e => setFilters(prev => ({ ...prev, task: e.target.value as Filters['task'] }))}
          >
            <option value="all">{t.leaderboard.all}</option>
            <option value="interpolation">{t.tasks.interpolation}</option>
            <option value="coherent_noise_suppression">{t.tasks.coherent_noise_suppression}</option>
            <option value="random_noise_suppression">{t.tasks.random_noise_suppression}</option>
            <option value="first_arrival_picking">{t.tasks.first_arrival_picking}</option>
            <option value="super_resolution">{t.tasks.super_resolution}</option>
          </select>
        </div>
        <span className="result-count">{list.length} {t.leaderboard.results}</span>
      </div>

      <div className="grid cols-2">
        {list.map(b => (
          <div
            key={b.id}
            className="card clickable benchmark-card"
            onClick={() => setActiveBenchId(prev => prev === b.id ? null : b.id)}
          >
            <div className="card-header">
              <span className="card-icon">{b.icon || '📊'}</span>
              <div>
                <div className="card-title">{escapeHtml(b.name)}</div>
                <div className="card-subtitle">{escapeHtml(b.task)} · {escapeHtml(b.dimensions)}</div>
              </div>
            </div>
            <div className="card-body">
              <p>{escapeHtml(b.description)}</p>
              <div className="card-meta">
                {(b.tags || []).map(t => <span key={t} className="tag">{escapeHtml(t)}</span>)}
                <span className="tag tag-accent">{b.model_count} methods</span>
              </div>
            </div>

            {activeBenchId === b.id && activeBench && (
              <div className="detail-panel" onClick={e => e.stopPropagation()}>
                <div className="detail-grid">
                  <div className="detail-section">
                    <h4>{t.benchmarks.description}</h4>
                    <p>{escapeHtml(activeBench.description)}</p>
                    <h4>{t.benchmarks.citation}</h4>
                    <p className="mono">{escapeHtml(activeBench.citation)}</p>
                    <h4>{t.benchmarks.protocol}</h4>
                    <p>Primary metric: <strong>{activeBench.primary_metric.toUpperCase()}</strong>. {isLowerBetter(activeBench.primary_metric) ? t.benchmarks.lowerIsBetter : t.benchmarks.higherIsBetter}</p>
                    <h4>{t.benchmarks.metrics}</h4>
                    <p>{(activeBench.metrics || []).map(m => m.toUpperCase()).join(', ')}</p>
                  </div>
                  <div className="detail-section">
                    <h4>{t.benchmarks.top5}</h4>
                    <table className="detail-mini-table">
                      <thead><tr><th>Rank</th><th>Method</th><th>{activeBench.primary_metric.toUpperCase()}</th></tr></thead>
                      <tbody>
                        {top5.map((r, i) => (
                          <tr key={r.model_id}>
                            <td>{i + 1}</td>
                            <td>{escapeHtml(r.model.name)}</td>
                            <td>{r.score.toFixed(2)}</td>
                          </tr>
                        ))}
                        {!top5.length && <tr><td colSpan={3} className="text-muted">{t.benchmarks.noResults}</td></tr>}
                      </tbody>
                    </table>
                  </div>
                  <div className="detail-section" style={{ gridColumn: '1 / -1' }}>
                    <h4>{t.benchmarks.top10}</h4>
                    <div className="detail-chart-wrap">
                      {top10.length > 0 && (
                        <Bar {...getBarChartConfig(
                          top10.map(r => r.model.name),
                          top10.map(r => r.score),
                          activeBench.primary_metric,
                          theme
                        )} />
                      )}
                    </div>
                  </div>
                  <div className="detail-section" style={{ gridColumn: '1 / -1' }}>
                    <h4>{t.benchmarks.sotaProgression}</h4>
                    <div className="detail-chart-wrap" style={{ height: 260 }}>
                      {scatterPoints.length > 0 && (
                        <Scatter {...getScatterChartConfig(scatterPoints, theme)} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
