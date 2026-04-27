import { useState, useMemo } from 'react';
import { Radar } from 'react-chartjs-2';
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
import type { AppData, Filters, MetricKey } from '../types';
import { formatType, escapeHtml } from '../utils/helpers';
import { getRadarChartConfig } from '../utils/charts';

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

export default function ModelsPage({ data, filters, setFilters, search, theme }: Props) {
  const [activeModelId, setActiveModelId] = useState<string | null>(null);

  const items = useMemo(() => {
    let list = data.models.slice();
    if (filters.task !== 'all') {
      list = list.filter(m => (m.tasks || []).includes(filters.task));
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

  const radarData = useMemo(() => {
    const allScores: Record<string, number[]> = {};
    data.results.forEach(r => {
      Object.entries(r.scores || {}).forEach(([k, v]) => {
        if (v != null) {
          if (!allScores[k]) allScores[k] = [];
          allScores[k].push(v);
        }
      });
    });

    const minMax: Record<string, { min: number; max: number }> = {};
    Object.entries(allScores).forEach(([k, arr]) => {
      if (arr.length) {
        minMax[k] = { min: Math.min(...arr), max: Math.max(...arr) };
      }
    });

    const modelScores: Record<string, number> = {};
    modelResults.forEach(r => {
      Object.entries(r.scores || {}).forEach(([k, v]) => {
        if (v != null && (!modelScores[k] || v > modelScores[k])) {
          modelScores[k] = v;
        }
      });
    });

    const normalize = (k: string, v: number) => {
      const mm = minMax[k];
      if (!mm || mm.max === mm.min) return 0.5;
      return (v - mm.min) / (mm.max - mm.min);
    };

    return {
      snr: normalize('snr', modelScores.snr ?? 0),
      psnr: normalize('psnr', modelScores.psnr ?? 0),
      ssim: normalize('ssim', modelScores.ssim ?? 0),
      rmse_inv: 1 - normalize('rmse', modelScores.rmse ?? 0),
      mse_inv: 1 - normalize('mse', modelScores.mse ?? 0),
      accuracy: normalize('accuracy', modelScores.accuracy ?? 0),
      f1: normalize('f1', modelScores.f1 ?? 0),
      mae_inv: 1 - normalize('mae', modelScores.mae ?? 0),
    };
  }, [modelResults, data.results]);

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

  return (
    <div>
      <div className="page-header">
        <h1>Models</h1>
        <p className="lede">Browse methods and compare their performance across benchmarks.</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-group">
          <label>Task</label>
          <select
            value={filters.task}
            onChange={e => setFilters(prev => ({ ...prev, task: e.target.value as Filters['task'] }))}
          >
            <option value="all">All</option>
            <option value="interpolation">Interpolation</option>
            <option value="denoising">Denoising</option>
            <option value="first_arrival_picking">First Arrival Picking</option>
          </select>
        </div>
        <div className="toolbar-group">
          <label>Type</label>
          <select
            value={filters.type}
            onChange={e => setFilters(prev => ({ ...prev, type: e.target.value as Filters['type'] }))}
          >
            <option value="all">All Types</option>
            <option value="traditional">Traditional</option>
            <option value="deep_learning">Deep Learning</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        <span className="result-count">{items.length} results</span>
      </div>

      <div className="grid cols-2">
        {items.map(m => (
          <div
            key={m.id}
            className="card clickable model-row"
            onClick={() => setActiveModelId(prev => prev === m.id ? null : m.id)}
          >
            <div className="card-header">
              <span className="card-icon">{m.emoji || '🔬'}</span>
              <div>
                <div className="card-title">{escapeHtml(m.name)}</div>
                <div className="card-subtitle">{escapeHtml(m.authors)} · {m.year}</div>
              </div>
            </div>
            <div className="card-body">
              <p>{escapeHtml(m.description)}</p>
              <div className="card-meta">
                <span className={`tag tag-type-${m.type}`}>{formatType(m.type)}</span>
                {(m.tasks || []).map(t => <span key={t} className="tag">{escapeHtml(t)}</span>)}
                {m.is_open_source && <span className="tag tag-accent">Open Source</span>}
              </div>
            </div>

            {activeModelId === m.id && activeModel && (
              <div className="detail-panel" onClick={e => e.stopPropagation()}>
                <div className="detail-grid">
                  <div className="detail-section">
                    <h4>Method Details</h4>
                    <p>{escapeHtml(activeModel.description)}</p>
                    <div className="dl-row"><span className="dl-label">Authors</span><span>{escapeHtml(activeModel.authors)}</span></div>
                    <div className="dl-row"><span className="dl-label">Organization</span><span>{escapeHtml(activeModel.org)}</span></div>
                    <div className="dl-row"><span className="dl-label">Year</span><span>{activeModel.year}</span></div>
                    <div className="dl-row"><span className="dl-label">Type</span><span>{formatType(activeModel.type)}</span></div>
                    <div style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                      {activeModel.paper_url && <a href={activeModel.paper_url} target="_blank" rel="noreferrer" className="btn btn-primary">📄 Paper</a>}
                      {activeModel.code_url && <a href={activeModel.code_url} target="_blank" rel="noreferrer" className="btn btn-primary">💻 Code</a>}
                      {activeModel.weights_url && <a href={activeModel.weights_url} target="_blank" rel="noreferrer" className="btn btn-primary">⬇️ Weights</a>}
                    </div>
                  </div>
                  <div className="detail-section">
                    <h4>Performance Radar</h4>
                    <div className="detail-chart-wrap" style={{ height: 320 }}>
                      <Radar {...getRadarChartConfig(radarData, theme)} />
                    </div>
                  </div>
                  <div className="detail-section" style={{ gridColumn: '1 / -1' }}>
                    <h4>Scores by Benchmark</h4>
                    <table className="detail-mini-table">
                      <thead>
                        <tr>
                          <th>Benchmark</th>
                          <th>Task</th>
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
                            <td>{r.is_sota ? <span className="tag tag-sota">SOTA</span> : '—'}</td>
                          </tr>
                        ))}
                        {!modelResults.length && <tr><td colSpan={metricCols.length + 4} className="text-muted">No results yet.</td></tr>}
                      </tbody>
                    </table>
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
