import { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { AppData, Filters } from '../types';
import { formatType, escapeHtml, formatMetricValue } from '../utils/helpers';

interface Props {
  data: AppData;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  search: string;
}

const TASK_LABELS: Record<string, string> = {
  interpolation: 'Interpolation',
  coherent_noise_suppression: 'Coherent Noise — Ground Roll',
  random_noise_suppression: 'Random Noise Suppression',
  first_arrival_picking: 'First Arrival Picking',
  multiples_attenuation: 'Coherent Noise — Multiples',
  deblending: 'Deblending',
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
            <optgroup label={t.taskGroups.coherent_noise}>
              <option value="coherent_noise_suppression">{t.tasks.coherent_noise_suppression}</option>
              <option value="multiples_attenuation">{t.tasks.multiples_attenuation}</option>
              <option value="deblending">{t.tasks.deblending}</option>
            </optgroup>
            <option value="random_noise_suppression">{t.tasks.random_noise_suppression}</option>
            <option value="first_arrival_picking">{t.tasks.first_arrival_picking}</option>
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
                {m.parameters_m != null && <span className="tag">{m.parameters_m}M params</span>}
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
                  {activeModel.parameters_m != null && (
                    <div className="dl-row"><span className="dl-label">Parameters</span><span>{activeModel.parameters_m}M</span></div>
                  )}
                </section>

                <section className="slide-section">
                  {activeModel.paper_url && (
                    <div className="dl-row">
                      <span className="dl-label">Paper</span>
                      <a href={activeModel.paper_url} target="_blank" rel="noreferrer" className="btn btn-primary">📄 View</a>
                    </div>
                  )}
                  {activeModel.code_url && (
                    <div className="dl-row">
                      <span className="dl-label">Code</span>
                      <a href={activeModel.code_url} target="_blank" rel="noreferrer" className="btn btn-primary">💻 View</a>
                    </div>
                  )}
                  {weightOptions.length > 0 && (
                    <div className="dl-row">
                      <span className="dl-label">Weights</span>
                      {weightOptions.length === 1 ? (
                        <a href={weightOptions[0][1]} target="_blank" rel="noreferrer" className="btn btn-primary">⬇️ Download</a>
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
                  {modelResults.map(r => {
                    const metrics = r.benchmark!.metrics || [];
                    const weightsUrl = activeModel?.weights_urls?.[r.benchmark!.task] || activeModel?.weights_url;
                    return (
                      <div key={r.benchmark_id} style={{ marginBottom: 'var(--space-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                          <h5 style={{ margin: 0 }}>{escapeHtml(r.benchmark!.name)}</h5>
                          {weightsUrl && (
                            <a href={weightsUrl} target="_blank" rel="noreferrer" className="btn btn-primary">⬇️ Weights</a>
                          )}
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                          <table className="detail-mini-table">
                            <thead>
                              <tr>
                                <th>Metric</th>
                                <th>Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {metrics.map(m => {
                                const scores = r.scores as Record<string, number | undefined>;
                                const val = scores[m] ?? null;
                                const std = scores[`${m}_std`] ?? null;
                                return (
                                  <tr key={m}>
                                    <td>{m.toUpperCase()}</td>
                                    <td>{formatMetricValue(val, m, std)}</td>
                                  </tr>
                                );
                              })}
                              {!metrics.length && <tr><td colSpan={2} className="text-muted">{t.benchmarks.noResults}</td></tr>}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                  {!modelResults.length && <p className="text-muted">{t.benchmarks.noResults}</p>}
                </section>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
