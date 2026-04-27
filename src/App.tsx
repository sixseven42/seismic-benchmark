import { useState, useMemo } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import { useData } from './hooks/useData';
import { useDebounce } from './hooks/useDebounce';
import { getLastUpdatedDate } from './utils/helpers';
import type { Tab, Filters } from './types';
import LeaderboardPage from './pages/LeaderboardPage';
import BenchmarksPage from './pages/BenchmarksPage';
import ModelsPage from './pages/ModelsPage';
import PapersPage from './pages/PapersPage';

const TABS: { id: Tab; label: string }[] = [
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'benchmarks', label: 'Benchmarks' },
  { id: 'models', label: 'Models' },
  { id: 'papers', label: 'Papers' },
];

function App() {
  const { theme, toggleTheme } = useTheme();
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
    return TABS.some(t => t.id === path) ? (path as Tab) : 'leaderboard';
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
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
          <div className="nav-spacer" />
          <div className="nav-search">
            <input
              type="text"
              placeholder="Search..."
              value={searchInput}
              onChange={e => {
                setSearchInput(e.target.value);
                setFilters(prev => ({ ...prev, search: e.target.value.trim().toLowerCase() }));
              }}
            />
          </div>
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      <main>
        <Routes>
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
          <Route path="*" element={<Navigate to="/leaderboard" replace />} />
        </Routes>
      </main>

      <footer>
        SeismicBench · Data sourced from published papers ·
        Last updated {lastUpdated} ·
        <a href="https://github.com/YOUR_USERNAME/seismic-benchmark" target="_blank" rel="noreferrer">
          Contribute on GitHub
        </a>
      </footer>
    </>
  );
}

export default App;
