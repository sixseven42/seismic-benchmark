import { useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { AppData } from '../types';

interface Props {
  data: AppData;
}

export default function OverviewPage({ data }: Props) {
  const { t } = useLanguage();

  const stats = useMemo(() => ({
    methods: data.models.length,
    datasets: data.benchmarks.length,
    papers: data.papers.length,
    results: data.results.length,
  }), [data]);

  const milestones = [
    { year: '2026.04', text: t.overview.milestone1 },
    { year: '2026.05', text: t.overview.milestone2 },
    { year: '2026.05', text: t.overview.milestone3 },
    { year: '2026.05', text: t.overview.milestone4 },
  ];

  const futurePlans = [
    t.overview.future1,
    t.overview.future2,
    t.overview.future3,
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)', flexWrap: 'wrap' }}>
        <img
          src="/seismic-benchmark/logo.png"
          alt="GeoBrain Logo"
          style={{ width: 140, height: 140, objectFit: 'contain', flexShrink: 0 }}
        />
        <div>
          <h1>{t.overview.title}</h1>
          <p className="lede">{t.overview.subtitle}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid cols-4" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--mono)' }}>
            {stats.methods}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 'var(--space-2)' }}>
            {t.overview.statsMethods}
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--mono)' }}>
            {stats.datasets}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 'var(--space-2)' }}>
            {t.overview.statsDatasets}
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--mono)' }}>
            {stats.papers}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 'var(--space-2)' }}>
            {t.overview.statsPapers}
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--mono)' }}>
            {stats.results}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 'var(--space-2)' }}>
            {t.overview.statsResults}
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="section-title">
        <h2>{t.overview.aboutTitle}</h2>
      </div>
      <div className="card">
        <div className="card-body">
          <p style={{ marginBottom: 'var(--space-3)' }}>{t.overview.aboutText1}</p>
          <p>{t.overview.aboutText2}</p>
        </div>
      </div>

      {/* Team Section */}
      <div className="section-title">
        <h2>{t.overview.teamTitle}</h2>
      </div>
      <div className="card">
        <div className="card-body">
          <p style={{ marginBottom: 'var(--space-4)' }}>{t.overview.teamText}</p>
          <div className="team-scroll">
            {[
              { name: t.overview.teamMember1Name, role: t.overview.teamMember1Role, img: '/seismic-benchmark/team/majianwei.jpg', pos: 'center 15%' },
              { name: t.overview.teamMember2Name, role: t.overview.teamMember2Role, img: '/seismic-benchmark/team/liuqi.jpg', pos: 'center top' },
              { name: t.overview.teamMember3Name, role: t.overview.teamMember3Role, img: '/seismic-benchmark/team/chengzhitong.jpg', pos: 'center top' },
              { name: t.overview.teamMember4Name, role: t.overview.teamMember4Role, img: '/seismic-benchmark/team/gaotianxiang.png', pos: 'center top' },
              { name: t.overview.teamMember5Name, role: t.overview.teamMember5Role, img: '/seismic-benchmark/team/hupeng.jpg', pos: 'center top' },
              { name: t.overview.teamMember6Name, role: t.overview.teamMember6Role, img: '/seismic-benchmark/team/lishirui.jpg', pos: 'center top' },
              { name: t.overview.teamMember7Name, role: t.overview.teamMember7Role, img: '/seismic-benchmark/team/gaowei.jpg', pos: 'center top' },
              { name: t.overview.teamMember8Name, role: t.overview.teamMember8Role, img: '/seismic-benchmark/team/shengwenzhe.jpg', pos: 'center top' },
              { name: t.overview.teamMember9Name, role: t.overview.teamMember9Role, img: '/seismic-benchmark/team/geyulong.jpg', pos: 'center top' },
            ].map((m) => (
              <div key={m.name} className="team-member">
                <img
                  src={m.img}
                  alt={m.name}
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    objectPosition: m.pos,
                    margin: '0 auto var(--space-3)',
                    display: 'block',
                    border: '2px solid var(--border)',
                  }}
                />
                <div style={{ fontWeight: 600 }}>{m.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{m.role}</div>
              </div>
            ))}
          </div>
          <p className="text-muted" style={{ marginTop: 'var(--space-4)', fontSize: '0.85rem', textAlign: 'center' }}>
            GeoBrain Team · PKU & HIT
          </p>
        </div>
      </div>

      {/* Milestones & Future Plans */}
      <div className="detail-grid" style={{ marginTop: 'var(--space-6)' }}>
        <div className="card">
          <div className="card-header">
            <span className="card-icon">🏆</span>
            <div>
              <div className="card-title">{t.overview.milestonesTitle}</div>
            </div>
          </div>
          <div className="card-body" style={{ maxHeight: 220, overflowY: 'auto', scrollbarWidth: 'thin' }}>
            {milestones.map((m, i) => (
              <div key={i} className="dl-row">
                <span className="dl-label" style={{ fontFamily: 'var(--mono)', color: 'var(--accent-dark)', flexShrink: 0 }}>{m.year}</span>
                <span>{m.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-icon">🚀</span>
            <div>
              <div className="card-title">{t.overview.futureTitle}</div>
            </div>
          </div>
          <div className="card-body">
            {futurePlans.map((plan, i) => (
              <div key={i} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700, fontFamily: 'var(--mono)' }}>{i + 1}.</span>
                <span>{plan}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
