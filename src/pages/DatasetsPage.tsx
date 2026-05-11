import { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { AppData, Filters } from '../types';
import { escapeHtml } from '../utils/helpers';

interface Props {
  data: AppData;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  search: string;
}

function ImagePlaceholder({ text, className }: { text: string; className?: string }) {
  const hue = text.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className={className}
      style={{
        background: `linear-gradient(135deg, hsl(${hue}, 60%, 85%), hsl(${hue}, 60%, 75%))`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: `hsl(${hue}, 60%, 30%)`,
        fontWeight: 600,
        fontSize: '0.9rem',
        borderRadius: 'inherit',
        width: '100%',
        height: '100%',
      }}
    >
      {text.slice(0, 2).toUpperCase()}
    </div>
  );
}

function LazyImage({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return <ImagePlaceholder text={alt} className={className} />;
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      style={{ objectFit: 'cover', width: '100%', height: '100%', borderRadius: 'inherit' }}
    />
  );
}

export default function DatasetsPage({ data, filters, setFilters, search }: Props) {
  const { t } = useLanguage();
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);

  const list = useMemo(() => {
    let items = data.datasets.slice();
    if (filters.task !== 'all') {
      items = items.filter(d => d.task === filters.task);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(d =>
        (d.name || '').toLowerCase().includes(q) ||
        (d.description || '').toLowerCase().includes(q)
      );
    }
    return items;
  }, [data.datasets, filters.task, search]);

  const activeDataset = data.datasets.find(d => d.id === activeDatasetId);

  const relatedBenchmarks = useMemo(() => {
    if (!activeDataset) return [];
    return data.benchmarks.filter(b => activeDataset.related_benchmark_ids.includes(b.id));
  }, [activeDataset, data.benchmarks]);

  const taskOptions = [
    { value: 'all' as Filters['task'], label: t.leaderboard.all },
    { value: 'interpolation', label: t.tasks.interpolation },
    { value: 'coherent_noise_suppression', label: t.tasks.coherent_noise_suppression },
    { value: 'random_noise_suppression', label: t.tasks.random_noise_suppression },
    { value: 'first_arrival_picking', label: t.tasks.first_arrival_picking },
    { value: 'super_resolution', label: t.tasks.super_resolution },
  ];

  const statLabels: Record<string, string> = {
    shots: 'Shots',
    traces: 'Traces',
    samples: 'Samples',
    time_samples: 'Time Samples',
    size_gb: 'Size (GB)',
    format: 'Format',
    dimensions: 'Dimensions',
  };

  const closePanel = () => setActiveDatasetId(null);

  return (
    <div>
      <div className="page-header">
        <h1>{t.datasets?.title ?? 'Datasets'}</h1>
        <p className="lede">{t.datasets?.subtitle ?? 'Explore seismic datasets, visualizations, and related benchmarks.'}</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-group">
          <label>{t.leaderboard.task}</label>
          <select
            value={filters.task}
            onChange={e => setFilters(prev => ({ ...prev, task: e.target.value as Filters['task'] }))}
          >
            {taskOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <span className="result-count">{list.length} {t.leaderboard.results}</span>
      </div>

      <div className="grid cols-2">
        {list.map(d => (
          <div
            key={d.id}
            className={`card clickable dataset-card ${activeDatasetId === d.id ? 'active-card' : ''}`}
            onClick={() => setActiveDatasetId(prev => prev === d.id ? null : d.id)}
          >
            <div className="dataset-thumb">
              <LazyImage src={d.thumbnail} alt={d.name} />
            </div>
            <div className="card-header" style={{ marginTop: 'var(--space-3)' }}>
              <div>
                <div className="card-title">{escapeHtml(d.name)}</div>
                <div className="card-subtitle">{escapeHtml(t.tasks[d.task])}</div>
              </div>
            </div>
            <div className="card-body">
              <p>{escapeHtml(d.description)}</p>
            </div>
          </div>
        ))}
      </div>

      {list.length === 0 && (
        <div className="lb-empty">No datasets match your filters.</div>
      )}

      {/* Slide-over panel */}
      {activeDataset && (
        <>
          <div className="slide-backdrop" onClick={closePanel} />
          <div className="slide-panel">
            <div className="slide-panel-header">
              <div>
                <h2>{escapeHtml(activeDataset.name)}</h2>
                <span className="slide-panel-subtitle">{escapeHtml(t.tasks[activeDataset.task])}</span>
              </div>
              <button className="slide-panel-close" onClick={closePanel} title="Close">✕</button>
            </div>

            <div className="slide-panel-body">
              <div className="slide-panel-col">
                <section className="slide-section">
                  <h4>Description</h4>
                  <p>{escapeHtml(activeDataset.description)}</p>
                </section>

                <section className="slide-section">
                  <h4>Statistics</h4>
                  <div className="stat-grid">
                    {Object.entries(activeDataset.stats).map(([key, val]) => (
                      <div key={key} className="stat-cell">
                        <span className="stat-label">{statLabels[key] ?? key}</span>
                        <span className="stat-value mono">{val}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="slide-section">
                  <h4>Related Benchmarks</h4>
                  {relatedBenchmarks.length ? (
                    <div className="dataset-benchmark-list">
                      {relatedBenchmarks.map(b => (
                        <div key={b.id} className="dataset-benchmark-chip">
                          <span className="dataset-benchmark-icon">{b.icon}</span>
                          <span>{escapeHtml(b.name)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">No related benchmarks.</p>
                  )}
                </section>
              </div>

              <div className="slide-panel-col">
                <section className="slide-section">
                  <h4>Visualization</h4>
                  <div className="viz-pair">
                    <div className="viz-item">
                      <span className="viz-tag">Raw Data</span>
                      <div className="viz-frame">
                        <LazyImage src={activeDataset.gallery[0] ?? null} alt={`${activeDataset.name} raw`} />
                      </div>
                    </div>
                    <div className="viz-item">
                      <span className="viz-tag">Label / Clean</span>
                      <div className="viz-frame">
                        <LazyImage src={activeDataset.gallery[1] ?? null} alt={`${activeDataset.name} label`} />
                      </div>
                    </div>
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
