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
import type { AppData, Filters, Benchmark } from '../types';
import { isLowerBetter, escapeHtml } from '../utils/helpers';
import { getBarChartConfig } from '../utils/charts';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, RadialLinearScale, Title, Tooltip, Legend
);

const GROUP_DESCRIPTIONS: Record<string, string> = {
  'SEGC3 Ground-Roll Noise': 'A suite of synthetic 3D seismic benchmarks built on the SEG China 3D (SEGC3) geological model with progressively increasing ground-roll noise strengths (levels 1, 3, 5, 7 and 9). Each variant shares the same 9-shot-line geometry and provides paired raw/noisy and clean labels, enabling systematic evaluation of coherent noise suppression methods under controlled interference conditions.',
  'SEGC3 Multiples Attenuation': 'A synthetic marine seismic benchmark for free-surface multiples attenuation. It provides paired noisy-input and multiples-noise-label volumes, enabling supervised evaluation of methods that predict and subtract multiple energy from marine shot gathers.',
  'SEGC3 Random Noise': 'A suite of synthetic 3D seismic benchmarks based on the SEG China 3D (SEGC3) geological model with varying random noise types (Gaussian and Poisson) and SNR levels (-5 dB, 0 dB and 5 dB). Each variant provides paired noisy and clean labels, enabling systematic evaluation of random noise suppression methods under controlled noise conditions.',
  'SEGC3 Random Missing': 'A suite of synthetic 3D seismic interpolation benchmarks based on the SEG China 3D (SEGC3) geological model with randomly missing traces at varying ratios (30%, 50%, 70%) and cross-domain tests. Each variant provides paired incomplete and complete data, enabling systematic evaluation of interpolation methods under random spatial subsampling conditions.',
  'SEGC3 Uniform Missing': 'A suite of synthetic 3D seismic interpolation benchmarks based on the SEG China 3D (SEGC3) geological model with uniformly missing traces at varying ratios (30%, 50%, 70%) and cross-domain tests. Each variant provides paired incomplete and complete data, enabling systematic evaluation of interpolation methods under uniform spatial subsampling conditions.',
  'SEGC3 Continuous Missing': 'A suite of synthetic 3D seismic interpolation benchmarks based on the SEG China 3D (SEGC3) geological model with continuously missing traces at varying lengths (20, 30, 40 traces) and cross-domain tests. Each variant provides paired incomplete and complete data, enabling systematic evaluation of interpolation methods under continuous spatial gap conditions.',
};

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

  const filteredBenchmarks = useMemo(() => {
    let items = data.benchmarks.slice();
    if (filters.task !== 'all') {
      items = items.filter(b => b.task === filters.task);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(b =>
        (b.name || '').toLowerCase().includes(q) ||
        (b.group_name || '').toLowerCase().includes(q) ||
        (b.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }
    return items;
  }, [data.benchmarks, filters.task, search]);

  const { groupEntries, singles } = useMemo(() => {
    const groups = new Map<string, Benchmark[]>();
    const singlesArr: Benchmark[] = [];
    for (const b of filteredBenchmarks) {
      if (b.group_name) {
        if (!groups.has(b.group_name)) groups.set(b.group_name, []);
        groups.get(b.group_name)!.push(b);
      } else {
        singlesArr.push(b);
      }
    }
    return {
      groupEntries: Array.from(groups.entries()).map(([name, items]) => ({ name, items })),
      singles: singlesArr,
    };
  }, [filteredBenchmarks]);

  const activeBench = data.benchmarks.find(b => b.id === activeBenchId);

  const activeGroupItems = useMemo(() => {
    if (!activeBench?.group_name) return [];
    return data.benchmarks
      .filter(b => b.group_name === activeBench.group_name)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activeBench, data.benchmarks]);

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

  const closePanel = () => setActiveBenchId(null);

  const getGroupStats = (items: Benchmark[]) => {
    const ids = new Set(items.map(i => i.id));
    const modelIds = new Set(
      data.results.filter(r => ids.has(r.benchmark_id)).map(r => r.model_id)
    );
    return { variantCount: items.length, methodCount: modelIds.size };
  };

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
            <optgroup label={t.taskGroups.coherent_noise}>
              <option value="coherent_noise_suppression">{t.tasks.coherent_noise_suppression}</option>
              <option value="multiples_attenuation">{t.tasks.multiples_attenuation}</option>
            </optgroup>
            <option value="random_noise_suppression">{t.tasks.random_noise_suppression}</option>
            <option value="first_arrival_picking">{t.tasks.first_arrival_picking}</option>
            <option value="deblending">{t.tasks.deblending}</option>
          </select>
        </div>
        <span className="result-count">{filteredBenchmarks.length} {t.leaderboard.results}</span>
      </div>

      <div className="grid cols-2">
        {/* Group cards */}
        {groupEntries.map(({ name, items }) => {
          const first = items[0];
          const { variantCount, methodCount } = getGroupStats(items);
          const allTags = Array.from(new Set(items.flatMap(b => b.tags || [])));
          const isActive = activeBench?.group_name === name;
          return (
            <div
              key={name}
              className={`card clickable benchmark-card ${isActive ? 'active-card' : ''}`}
              onClick={() => setActiveBenchId(items[0].id)}
            >
              <div className="card-header">
                <span className="card-icon">{first.icon || '📊'}</span>
                <div>
                  <div className="card-title">{escapeHtml(name)}</div>
                  <div className="card-subtitle">{escapeHtml(first.task)} · {escapeHtml(first.dataset_name)}</div>
                </div>
              </div>
              <div className="card-body">
                <p>{escapeHtml(GROUP_DESCRIPTIONS[name] || first.description)}</p>
                <div className="card-meta">
                  {allTags.map(t => <span key={t} className="tag">{escapeHtml(t)}</span>)}
                  <span className="tag tag-accent">{variantCount} variants · {methodCount} methods</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Single benchmark cards */}
        {singles.map(b => (
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
                <h2>{escapeHtml(activeBench.group_name || activeBench.name)}</h2>
                <span className="slide-panel-subtitle">
                  {activeBench.group_name ? escapeHtml(activeBench.name) : `${escapeHtml(activeBench.task)} · ${escapeHtml(activeBench.dimensions)}`}
                </span>
              </div>
              <button className="slide-panel-close" onClick={closePanel} title="Close">✕</button>
            </div>

            <div className="slide-panel-body">
              {/* Variant selector — full width */}
              {activeGroupItems.length > 0 && (
                <div className="slide-panel-col" style={{ gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Variant</span>
                    <select
                      value={activeBenchId || ''}
                      onChange={e => setActiveBenchId(e.target.value)}
                      style={{ minWidth: 200 }}
                    >
                      {activeGroupItems.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Description — full width */}
              <div className="slide-panel-col" style={{ gridColumn: '1 / -1' }}>
                <section className="slide-section">
                  <h4>{t.benchmarks.description}</h4>
                  <p>{escapeHtml(activeBench.group_name ? (GROUP_DESCRIPTIONS[activeBench.group_name] || activeBench.description) : activeBench.description)}</p>
                </section>
              </div>

              {/* Dataset Download */}
              {activeBench.download_url && (
                <div className="slide-panel-col" style={{ gridColumn: '1 / -1' }}>
                  <section className="slide-section">
                    <a
                      className="btn btn-primary btn-icon"
                      href={activeBench.download_url}
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
              {activeBench.gallery && activeBench.gallery.length > 0 && (
                <div className="slide-panel-col" style={{ gridColumn: '1 / -1' }}>
                  <section className="slide-section">
                    <h4>Visualization</h4>
                    <div className="viz-pair row">
                      <div className="viz-item">
                        <span className="viz-tag">Raw Data</span>
                        <div className="viz-frame">
                          {activeBench.gallery[0] ? (
                            <img
                              src={activeBench.gallery[0]}
                              alt={`${activeBench.name} raw`}
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
                          {activeBench.gallery[1] ? (
                            <img
                              src={activeBench.gallery[1]}
                              alt={`${activeBench.name} label`}
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
                    {top10.length > 0 && (() => {
                      const metric = activeBench.primary_metric;
                      const lowerBetter = isLowerBetter(metric);
                      const bestScore = top10[0].score;
                      const rawScores = top10.map(r => r.score);
                      const chartData = top10.map(r => {
                        if (!lowerBetter) return r.score;
                        if (bestScore <= 0) return r.score <= 0 ? 100 : 0;
                        return (bestScore / r.score) * 100;
                      });
                      return (
                        <Bar {...getBarChartConfig(
                          top10.map(r => r.model.name),
                          chartData,
                          metric,
                          theme,
                          rawScores
                        )} />
                      );
                    })()}
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
