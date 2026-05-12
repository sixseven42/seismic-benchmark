import { useState, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
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
import { getBarChartConfig } from '../utils/charts';

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

  const relatedDataset = useMemo(() => {
    if (!activeBench) return null;
    return data.datasets.find(d => d.name === activeBench.dataset_name) || null;
  }, [activeBench, data.datasets]);

  const closePanel = () => setActiveBenchId(null);

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
            className={`card clickable benchmark-card ${activeBenchId === b.id ? 'active-card' : ''}`}
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
          </div>
        ))}
      </div>

      {activeBench && (
        <>
          <div className="slide-backdrop" onClick={closePanel} />
          <div className="slide-panel">
            <div className="slide-panel-header">
              <div>
                <h2>{escapeHtml(activeBench.name)}</h2>
                <span className="slide-panel-subtitle">{escapeHtml(activeBench.task)} · {escapeHtml(activeBench.dimensions)}</span>
              </div>
              <button className="slide-panel-close" onClick={closePanel} title="Close">✕</button>
            </div>

            <div className="slide-panel-body">
              {/* Description — full width */}
              <div className="slide-panel-col" style={{ gridColumn: '1 / -1' }}>
                <section className="slide-section">
                  <h4>{t.benchmarks.description}</h4>
                  <p>{escapeHtml(activeBench.description)}</p>
                </section>
              </div>

              {/* Dataset Download */}
              {relatedDataset?.download_url && (
                <div className="slide-panel-col" style={{ gridColumn: '1 / -1' }}>
                  <section className="slide-section">
                    <a
                      className="btn btn-primary btn-icon"
                      href={relatedDataset.download_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      📥 Download Dataset
                    </a>
                  </section>
                </div>
              )}

              {/* Left column: Citation, Protocol, Metrics */}
              <div className="slide-panel-col">
                <section className="slide-section">
                  <h4>{t.benchmarks.citation}</h4>
                  <p className="mono">{escapeHtml(activeBench.citation)}</p>
                </section>

                <section className="slide-section">
                  <h4>{t.benchmarks.protocol}</h4>
                  <p>Primary metric: <strong>{activeBench.primary_metric.toUpperCase()}</strong>. {isLowerBetter(activeBench.primary_metric) ? t.benchmarks.lowerIsBetter : t.benchmarks.higherIsBetter}</p>
                </section>

                <section className="slide-section">
                  <h4>{t.benchmarks.metrics}</h4>
                  <p>{(activeBench.metrics || []).map(m => m.toUpperCase()).join(', ')}</p>
                </section>
              </div>

              {/* Right column: Top5 */}
              <div className="slide-panel-col">
                <section className="slide-section">
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
                </section>
              </div>

              {/* Visualization — raw & label images */}
              {relatedDataset && (
                <div className="slide-panel-col" style={{ gridColumn: '1 / -1' }}>
                  <section className="slide-section">
                    <h4>Visualization</h4>
                    <div className="viz-pair row">
                      <div className="viz-item">
                        <span className="viz-tag">Raw Data</span>
                        <div className="viz-frame">
                          {relatedDataset.gallery[0] ? (
                            <img
                              src={relatedDataset.gallery[0]}
                              alt={`${relatedDataset.name} raw`}
                              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                            />
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>No image</div>
                          )}
                        </div>
                      </div>
                      <div className="viz-item">
                        <span className="viz-tag">Label / Clean</span>
                        <div className="viz-frame">
                          {relatedDataset.gallery[1] ? (
                            <img
                              src={relatedDataset.gallery[1]}
                              alt={`${relatedDataset.name} label`}
                              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                            />
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>No image</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {/* Top10 — moved to bottom */}
              <div className="slide-panel-col" style={{ gridColumn: '1 / -1' }}>
                <section className="slide-section">
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
                </section>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
