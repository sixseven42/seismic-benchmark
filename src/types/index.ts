export type Task =
  | 'interpolation'
  | 'coherent_noise_suppression'
  | 'random_noise_suppression'
  | 'first_arrival_picking'
  | 'multiples_attenuation'
  | 'deblending';
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
  code_url: string | null;
  weights_url: string | null;
  weights_urls?: Record<string, string>;
  architecture_image?: string;
  is_open_source: boolean;
  parameters_m?: number;
}

export interface Benchmark {
  id: string;
  name: string;
  group_name?: string;
  dataset_name: string;
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
  thumbnail?: string | null;
  gallery?: string[];
}

export type MetricKey =
  | 'snr'
  | 'psnr'
  | 'ssim'
  | 'rmse'
  | 'mse'
  | 'accuracy'
  | 'f1'
  | 'mae'
  | 'hit_rate'
  | 'hit_rate_1px'
  | 'hit_rate_3px'
  | 'hit_rate_5px'
  | 'hit_rate_7px'
  | 'hit_rate_9px'
  // Energy-band WSE metrics
  | 'eb_wse_medium_40_70_ne'
  | 'eb_wse_medium_40_70_snr'
  | 'eb_wse_strong_70_100_ne'
  | 'eb_wse_strong_70_100_snr'
  | 'eb_wse_very_weak_5_20_ne'
  | 'eb_wse_very_weak_5_20_snr'
  | 'eb_wse_weak_20_40_ne'
  | 'eb_wse_weak_20_40_snr'
  // Frequency-band metrics
  | 'fb_fre_high_ne'
  | 'fb_fre_high_snr'
  | 'fb_fre_low_ne'
  | 'fb_fre_low_snr'
  | 'fb_fre_mid_ne'
  | 'fb_fre_mid_snr'
  | 'fb_fre_very_high_ne'
  | 'fb_fre_very_high_snr';

export interface Scores {
  snr?: number;
  psnr?: number;
  ssim?: number;
  rmse?: number;
  mse?: number;
  accuracy?: number;
  f1?: number;
  mae?: number;
  hit_rate?: number;
  hit_rate_1px?: number;
  hit_rate_3px?: number;
  hit_rate_5px?: number;
  hit_rate_7px?: number;
  hit_rate_9px?: number;
  // Energy-band WSE metrics
  eb_wse_medium_40_70_ne?: number;
  eb_wse_medium_40_70_snr?: number;
  eb_wse_strong_70_100_ne?: number;
  eb_wse_strong_70_100_snr?: number;
  eb_wse_very_weak_5_20_ne?: number;
  eb_wse_very_weak_5_20_snr?: number;
  eb_wse_weak_20_40_ne?: number;
  eb_wse_weak_20_40_snr?: number;
  // Frequency-band metrics
  fb_fre_high_ne?: number;
  fb_fre_high_snr?: number;
  fb_fre_low_ne?: number;
  fb_fre_low_snr?: number;
  fb_fre_mid_ne?: number;
  fb_fre_mid_snr?: number;
  fb_fre_very_high_ne?: number;
  fb_fre_very_high_snr?: number;
}

export interface Result {
  model_id: string;
  benchmark_id: string;
  scores: Scores;
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
  arxiv_url: string | null;
  doi: string | null;
  code_url: string | null;
  citation_count: number;
  introduces_model: string;
}

export interface AppData {
  models: Model[];
  benchmarks: Benchmark[];
  results: Result[];
  papers: Paper[];
}

export type Tab = 'overview' | 'leaderboard' | 'benchmarks' | 'models' | 'papers' | 'tutorial';

export interface Filters {
  task: Task | 'all';
  dataset: string;
  metric: MetricKey;
  type: ModelType | 'all';
  search: string;
}
