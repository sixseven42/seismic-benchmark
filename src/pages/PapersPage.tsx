import { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { AppData } from '../types';
import { escapeHtml } from '../utils/helpers';

interface Props {
  data: AppData;
  search: string;
}

export default function PapersPage({ data, search }: Props) {
  const { t } = useLanguage();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [venueFilter, setVenueFilter] = useState('all');

  const years = useMemo(() => {
    return [...new Set(data.papers.map(p => p.year).filter(Boolean))].sort((a, b) => b - a);
  }, [data.papers]);

  const venues = useMemo(() => {
    return [...new Set(data.papers.map(p => p.venue).filter(Boolean))].sort();
  }, [data.papers]);

  const list = useMemo(() => {
    let items = data.papers.slice();
    if (taskFilter !== 'all') {
      items = items.filter(p => (p.tasks || []).includes(taskFilter as import('../types').Task));
    }
    if (yearFilter !== 'all') {
      items = items.filter(p => String(p.year) === yearFilter);
    }
    if (venueFilter !== 'all') {
      items = items.filter(p => p.venue === venueFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.authors || '').toLowerCase().includes(q) ||
        (p.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }
    return items;
  }, [data.papers, taskFilter, yearFilter, venueFilter, search]);

  const toggleAbstract = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t.papers.title}</h1>
        <p className="lede">{t.papers.subtitle}</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-group">
          <label>{t.leaderboard.task}</label>
          <select
            value={taskFilter}
            onChange={e => setTaskFilter(e.target.value)}
          >
            <option value="all">{t.leaderboard.all}</option>
            <option value="interpolation">{t.tasks.interpolation}</option>
            <option value="denoising">{t.tasks.denoising}</option>
            <option value="first_arrival_picking">{t.tasks.first_arrival_picking}</option>
            <option value="super_resolution">{t.tasks.super_resolution}</option>
          </select>
        </div>
        <div className="toolbar-group">
          <label>{t.papers.year}</label>
          <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
            <option value="all">{t.papers.allYears}</option>
            {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>
        </div>
        <div className="toolbar-group">
          <label>{t.papers.venue}</label>
          <select value={venueFilter} onChange={e => setVenueFilter(e.target.value)}>
            <option value="all">{t.papers.allVenues}</option>
            {venues.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <span className="result-count">{list.length} {t.leaderboard.results}</span>
      </div>

      <div className="grid cols-2">
        {list.map(p => {
          const isExpanded = expandedIds.has(p.id);
          return (
            <div key={p.id} className="card paper-card">
              <div className="card-header">
                <div>
                  <div className="card-title">{escapeHtml(p.title)}</div>
                  <div className="card-subtitle">{escapeHtml(p.authors)} · {p.venue} {p.year}</div>
                </div>
              </div>
              <div className="card-body">
                <div className={`paper-abstract ${isExpanded ? '' : 'collapsed'}`}>{escapeHtml(p.abstract)}</div>
                <button className="paper-toggle" onClick={() => toggleAbstract(p.id)}>
                  {isExpanded ? t.papers.showLess : t.papers.showMore}
                </button>
                <div className="paper-meta">
                  {(p.tags || []).map(t => <span key={t} className="tag">{escapeHtml(t)}</span>)}
                  {p.is_sota && <span className="tag tag-sota">{t.papers.sotaBadge}</span>}
                </div>
                <div className="paper-meta" style={{ marginTop: 'var(--space-2)' }}>
                  {p.arxiv_url && <a className="icon-link" href={p.arxiv_url} target="_blank" rel="noreferrer" title="arXiv">arXiv</a>}
                  {p.doi && <a className="icon-link" href={p.doi} target="_blank" rel="noreferrer" title="DOI">DOI</a>}
                  {p.code_url && <a className="icon-link" href={p.code_url} target="_blank" rel="noreferrer" title="Code">💻</a>}
                  {p.citation_count ? <span className="gh-stars">📖 {p.citation_count}</span> : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
