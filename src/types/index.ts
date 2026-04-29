export type Task = 'interpolation' | 'denoising' | 'first_arrival_picking' | 'super_resolution';
export type ModelType = 'traditional' | 'deep_learning' | 'hybrid';
export type Language = 'en' | 'zh';

export interface Model {
  id: string;
  name: string;
  authors: string;
  org: string;
  year: number;
  emoji: string;
  type: ModelType;
  tasks: Task[];
  description: string;
  paper_url: string;
  code_url: string;
  weights_url: string | null;
  is_open_source: boolean;
}

export interface Benchmark {
  id: string;
  name: string;
  task: Task;
  icon: string;
  description: string;
  data_source: string;
  dimensions: string;
  primary_metric: MetricKey;
  metrics: MetricKey[];
  tags: string[];
  citation: string;
  download_url: string;
  model_count: number;
}

export type MetricKey = 'snr' | 'psnr' | 'ssim' | 'rmse' | 'mse' | 'accuracy' | 'f1' | 'mae';

export interface Scores {
  snr?: number;
  psnr?: number;
  ssim?: number;
  rmse?: number;
  mse?: number;
  accuracy?: number;
  f1?: number;
  mae?: number;
}

export interface Result {
  model_id: string;
  benchmark_id: string;
  scores: Scores;
  is_sota: boolean;
  paper_url: string;
  code_url: string;
  date_added: string;
}

export interface Paper {
  id: string;
  title: string;
  authors: string;
  org: string;
  venue: string;
  year: number;
  abstract: string;
  tasks: Task[];
  tags: string[];
  arxiv_url: string;
  doi: string;
  code_url: string;
  github_stars: number;
  introduces_model: string;
  is_sota: boolean;
}

export interface AppData {
  models: Model[];
  benchmarks: Benchmark[];
  results: Result[];
  papers: Paper[];
}

export type Tab = 'overview' | 'leaderboard' | 'benchmarks' | 'models' | 'papers';

export interface Filters {
  task: Task | 'all';
  dataset: string;
  metric: MetricKey;
  type: ModelType | 'all';
  search: string;
}
