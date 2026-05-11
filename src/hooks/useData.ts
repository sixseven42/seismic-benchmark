import { useState, useEffect } from 'react';
import type { AppData, Model, Benchmark, Result, Paper, Dataset } from '../types';
import modelsJson from '../data/models.json';
import benchmarksJson from '../data/benchmarks.json';
import resultsJson from '../data/results.json';
import papersJson from '../data/papers.json';
import datasetsJson from '../data/datasets.json';

export function useData(): { data: AppData; loading: boolean; error: string | null } {
  const [state, setState] = useState<{
    data: AppData;
    loading: boolean;
    error: string | null;
  }>({
    data: { models: [], benchmarks: [], results: [], papers: [], datasets: [] },
    loading: true,
    error: null,
  });

  useEffect(() => {
    try {
      const models = modelsJson as Model[];
      const benchmarks = (benchmarksJson as Benchmark[]).map(b => ({
        ...b,
        model_count: (resultsJson as Result[]).filter(r => r.benchmark_id === b.id).length,
      }));
      const results = resultsJson as Result[];
      const papers = papersJson as Paper[];
      const datasets = datasetsJson as Dataset[];

      setState({
        data: { models, benchmarks, results, papers, datasets },
        loading: false,
        error: null,
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load data',
      }));
    }
  }, []);

  return state;
}
