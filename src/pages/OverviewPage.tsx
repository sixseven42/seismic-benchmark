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
    { year: '2023', text: t.overview.milestone1 },
    { year: '2024', text: t.overview.milestone2 },
    { year: '2025', text: t.overview.milestone3 },
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
          <div className="grid cols-3">
            {/* Team member placeholders - replace with actual photos and info */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'var(--tag-bg)',
                margin: '0 auto var(--space-3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
                color: 'var(--text-muted)',
                border: '2px solid var(--border)',
              }}>
                👤
              </div>
              <div style={{ fontWeight: 600 }}>Team Member 1</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Principal Investigator</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'var(--tag-bg)',
                margin: '0 auto var(--space-3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
                color: 'var(--text-muted)',
                border: '2px solid var(--border)',
              }}>
                👤
              </div>
              <div style={{ fontWeight: 600 }}>Team Member 2</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Lead Developer</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'var(--tag-bg)',
                margin: '0 auto var(--space-3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
                color: 'var(--text-muted)',
                border: '2px solid var(--border)',
              }}>
                👤
              </div>
              <div style={{ fontWeight: 600 }}>Team Member 3</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Data Curator</div>
            </div>
          </div>
          <p className="text-muted" style={{ marginTop: 'var(--space-4)', fontSize: '0.85rem', textAlign: 'center' }}>
            Replace the placeholder avatars above with actual team photos by placing images in the <code>public/team/</code> folder and updating the image paths.
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
          <div className="card-body">
            {milestones.map((m, i) => (
              <div key={i} className="dl-row">
                <span className="dl-label" style={{ fontFamily: 'var(--mono)', color: 'var(--accent-dark)' }}>{m.year}</span>
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
