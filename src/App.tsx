import { useState, useMemo } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { useTheme } from './hooks/useTheme';
import { useData } from './hooks/useData';
import { useDebounce } from './hooks/useDebounce';
import { getLastUpdatedDate } from './utils/helpers';
import type { Tab, Filters } from './types';
import OverviewPage from './pages/OverviewPage';
import LeaderboardPage from './pages/LeaderboardPage';
import BenchmarksPage from './pages/BenchmarksPage';
import ModelsPage from './pages/ModelsPage';
import PapersPage from './pages/PapersPage';

const TABS: { id: Tab; labelKey: keyof ReturnType<typeof useLanguage>['t']['nav'] }[] = [
  { id: 'overview', labelKey: 'overview' },
  { id: 'leaderboard', labelKey: 'leaderboard' },
  { id: 'benchmarks', labelKey: 'benchmarks' },
  { id: 'models', labelKey: 'models' },
  { id: 'papers', labelKey: 'papers' },
];

function AppContent() {
  const { theme, toggleTheme } = useTheme();
  const { lang, t, toggleLang } = useLanguage();
  const { data, loading, error } = useData();
  const location = useLocation();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<Filters>({
    task: 'all',
    dataset: 'all',
    metric: 'snr',
    type: 'all',
    search: '',
  });

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 200);

  const activeTab = useMemo<Tab>(() => {
    const path = location.pathname.slice(1);
    return TABS.some(t => t.id === path) ? (path as Tab) : 'overview';
  }, [location.pathname]);

  const handleTabChange = (tab: Tab) => {
    navigate(`/${tab}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const lastUpdated = useMemo(() => getLastUpdatedDate(data.results), [data.results]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <h3>Failed to load data</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-brand">
            <span className="brand-mark">S</span>
            SeismicBench
          </div>
          <ul className="nav-tabs">
            {TABS.map(tab => (
              <li key={tab.id}>
                <button
                  className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => handleTabChange(tab.id)}
                >
                  {t.nav[tab.labelKey]}
                </button>
              </li>
            ))}
          </ul>
          <div className="nav-spacer" />
          <div className="nav-search">
            <input
              type="text"
              placeholder={t.nav.searchPlaceholder}
              value={searchInput}
              onChange={e => {
                setSearchInput(e.target.value);
                setFilters(prev => ({ ...prev, search: e.target.value.trim().toLowerCase() }));
              }}
            />
          </div>
          <button className="theme-toggle" onClick={toggleLang} title="Switch language" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            {lang === 'en' ? '中' : 'EN'}
          </button>
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      <main>
        <Routes>
          <Route path="/overview" element={<OverviewPage data={data} />} />
          <Route
            path="/leaderboard"
            element={
              <LeaderboardPage
                data={data}
                filters={filters}
                setFilters={setFilters}
                search={debouncedSearch}
              />
            }
          />
          <Route
            path="/benchmarks"
            element={
              <BenchmarksPage
                data={data}
                filters={filters}
                setFilters={setFilters}
                search={debouncedSearch}
                theme={theme}
              />
            }
          />
          <Route
            path="/models"
            element={
              <ModelsPage
                data={data}
                filters={filters}
                setFilters={setFilters}
                search={debouncedSearch}
                theme={theme}
              />
            }
          />
          <Route
            path="/papers"
            element={
              <PapersPage
                data={data}
                search={debouncedSearch}
              />
            }
          />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      </main>

      <footer>
        {t.footer.text} {lastUpdated} ·
        <a href="https://github.com/YOUR_USERNAME/seismic-benchmark" target="_blank" rel="noreferrer">
          {t.footer.contribute}
        </a>
      </footer>
    </>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
