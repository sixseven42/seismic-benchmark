import { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { AppData, Filters, MetricKey } from '../types';
import { formatType, escapeHtml } from '../utils/helpers';

interface Props {
  data: AppData;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  search: string;
}

const TASK_LABELS: Record<string, string> = {
  interpolation: 'Interpolation',
  coherent_noise_suppression: 'Coherent Noise Suppression',
  random_noise_suppression: 'Random Noise Suppression',
  first_arrival_picking: 'First Arrival Picking',
  super_resolution: 'Super Resolution',
};

export default function ModelsPage({ data, filters, setFilters, search }: Props) {
  const { t } = useLanguage();
  const [activeModelId, setActiveModelId] = useState<string | null>(null);
  const [weightsTask, setWeightsTask] = useState<string>('');

  const items = useMemo(() => {
    let list = data.models.slice();
    if (filters.task !== 'all') {
      list = list.filter(m => (m.tasks || []).includes(filters.task as import('../types').Task));
    }
    if (filters.type !== 'all') {
      list = list.filter(m => m.type === filters.type);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        (m.name || '').toLowerCase().includes(q) ||
        (m.authors || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [data.models, filters.task, filters.type, search]);

  const activeModel = data.models.find(m => m.id === activeModelId);

  const modelResults = useMemo(() => {
    if (!activeModel) return [];
    return data.results
      .filter(r => r.model_id === activeModel.id)
      .map(r => {
        const b = data.benchmarks.find(x => x.id === r.benchmark_id);
        return { ...r, benchmark: b };
      })
      .filter((r): r is typeof r & { benchmark: NonNullable<typeof r.benchmark> } => !!r.benchmark);
  }, [activeModel, data.results, data.benchmarks]);

  const metricCols: { key: MetricKey; label: string }[] = [
    { key: 'snr', label: 'SNR' },
    { key: 'psnr', label: 'PSNR' },
    { key: 'ssim', label: 'SSIM' },
    { key: 'rmse', label: 'RMSE' },
    { key: 'mse', label: 'MSE' },
    { key: 'accuracy', label: 'Accuracy' },
    { key: 'f1', label: 'F1' },
    { key: 'mae', label: 'MAE' },
  ];

  const closePanel = () => {
    setActiveModelId(null);
    setWeightsTask('');
  };

  const weightOptions = useMemo(() => {
    if (!activeModel) return [];
    if (activeModel.weights_urls && Object.keys(activeModel.weights_urls).length > 0) {
      return Object.entries(activeModel.weights_urls);
    }
    if (activeModel.weights_url) {
      return [['default', activeModel.weights_url]];
    }
    return [];
  }, [activeModel]);

  return (
    <div>
      <div className="page-header">
        <h1>{t.models.title}</h1>
        <p className="lede">{t.models.subtitle}</p>
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
        <div className="toolbar-group">
          <label>{t.leaderboard.type}</label>
          <select
            value={filters.type}
            onChange={e => setFilters(prev => ({ ...prev, type: e.target.value as Filters['type'] }))}
          >
            <option value="all">{t.leaderboard.allTypes}</option>
            <option value="traditional">Traditional</option>
            <option value="deep_learning">Deep Learning</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        <span className="result-count">{items.length} {t.leaderboard.results}</span>
      </div>

      <div className="grid cols-2">
        {items.map(m => (
          <div
            key={m.id}
            className={`card clickable model-row ${activeModelId === m.id ? 'active-card' : ''}`}
            onClick={() => setActiveModelId(prev => prev === m.id ? null : m.id)}
          >
            <div className="card-header">
              <span className="card-icon">{m.emoji || '🔬'}</span>
              <div>
                <div className="card-title">{escapeHtml(m.name)}</div>
                <div className="card-subtitle">{escapeHtml(m.authors || '—')}</div>
              </div>
            </div>
            <div className="card-body">
              <p>{escapeHtml(m.description)}</p>
              <div className="card-meta">
                <span className={`tag tag-type-${m.type}`}>{formatType(m.type)}</span>
                {(m.tasks || []).map(t => <span key={t} className="tag">{escapeHtml(t)}</span>)}
                {m.is_open_source && <span className="tag tag-accent">{t.models.openSource}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {activeModel && (
        <>
          <div className="slide-backdrop" onClick={closePanel} />
          <div className="slide-panel">
            <div className="slide-panel-header">
              <div>
                <h2>{escapeHtml(activeModel.name)}</h2>
                <span className="slide-panel-subtitle">{escapeHtml(activeModel.authors || '—')}</span>
              </div>
              <button className="slide-panel-close" onClick={closePanel} title="Close">✕</button>
            </div>

            <div className="slide-panel-body">
              <div className="slide-panel-col">
                <section className="slide-section">
                  <h4>{t.models.details}</h4>
                  <p>{escapeHtml(activeModel.description)}</p>
                </section>

                <section className="slide-section">
                  <div className="dl-row"><span className="dl-label">Provider</span><span>{escapeHtml(activeModel.authors || '—')}</span></div>
                  <div className="dl-row"><span className="dl-label">Reference</span><span>{escapeHtml(activeModel.org || '—')}</span></div>
                  <div className="dl-row"><span className="dl-label">Type</span><span>{formatType(activeModel.type)}</span></div>
                </section>

                <section className="slide-section">
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    {activeModel.paper_url && <a href={activeModel.paper_url} target="_blank" rel="noreferrer" className="btn btn-primary">📄 Paper</a>}
                    {activeModel.code_url && <a href={activeModel.code_url} target="_blank" rel="noreferrer" className="btn btn-primary">💻 Code</a>}
                  </div>

                  {weightOptions.length > 0 && (
                    <div style={{ marginTop: 'var(--space-3)' }}>
                      {weightOptions.length === 1 ? (
                        <a href={weightOptions[0][1]} target="_blank" rel="noreferrer" className="btn btn-primary">⬇️ Weights</a>
                      ) : (
                        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
                          <select
                            value={weightsTask}
                            onChange={e => setWeightsTask(e.target.value)}
                            style={{ minWidth: 180 }}
                          >
                            <option value="">Select task…</option>
                            {weightOptions.map(([task, url]) => (
                              <option key={task} value={url}>{TASK_LABELS[task] || task}</option>
                            ))}
                          </select>
                          {weightsTask && (
                            <a href={weightsTask} target="_blank" rel="noreferrer" className="btn btn-primary">⬇️ Download</a>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </section>
              </div>

              <div className="slide-panel-col">
                <section className="slide-section">
                  <h4>Architecture</h4>
                  <div className="viz-frame" style={{ aspectRatio: '16 / 9' }}>
                    {activeModel.architecture_image ? (
                      <img
                        src={activeModel.architecture_image}
                        alt={`${activeModel.name} architecture`}
                        style={{ objectFit: 'contain', width: '100%', height: '100%', padding: 'var(--space-2)' }}
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                        No architecture diagram
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <div className="slide-panel-col" style={{ gridColumn: '1 / -1' }}>
                <section className="slide-section">
                  <h4>{t.models.scoresTitle}</h4>
                  <table className="detail-mini-table">
                    <thead>
                      <tr>
                        <th>{t.leaderboard.benchmark}</th>
                        <th>{t.leaderboard.task}</th>
                        {metricCols.map(m => <th key={m.key}>{m.label}</th>)}
                        <th>SOTA?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modelResults.map(r => (
                        <tr key={r.benchmark_id}>
                          <td>{escapeHtml(r.benchmark!.name)}</td>
                          <td>{escapeHtml(r.benchmark!.task)}</td>
                          {metricCols.map(m => (
                            <td key={m.key}>{r.scores[m.key] != null ? r.scores[m.key]!.toFixed(m.key === 'ssim' || m.key === 'f1' ? 3 : m.key === 'rmse' ? 4 : m.key === 'mse' ? 6 : m.key === 'accuracy' ? 2 : 2) : '—'}{m.key === 'accuracy' && r.scores[m.key] != null ? '%' : ''}</td>
                          ))}
                          <td>{r.is_sota ? <span className="tag tag-sota">{t.models.sotaBadge}</span> : '—'}</td>
                        </tr>
                      ))}
                      {!modelResults.length && <tr><td colSpan={metricCols.length + 4} className="text-muted">{t.benchmarks.noResults}</td></tr>}
                    </tbody>
                  </table>
                </section>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
