# Session Progress

## 2026-09-04 — Fix Leaderboard filter to show hybrid models (Physics CNN)
- Investigated why `Physics CNN` was missing from the Ground-Roll leaderboard.
- Root cause: `src/pages/LeaderboardPage.tsx` hardcoded the list to `type === 'deep_learning'`, while `physics-cnn-groundroll` has `type: 'hybrid'`.
- Updated the filter to include both `deep_learning` and `hybrid` models.
- Verified `npm run build` passes.

## 2026-09-04 — Fill missing binned metrics for UNet++ SEGC3 random-noise results
- Checked `batch_evaluation_unet_plusplus.xlsx` and `unet_plusplus_model.json`.
- Confirmed the Excel contains all 22 valid metrics (6 core + 16 binned NE/SNR) for every UNet++ sheet, including SEGC3 random noise.
- The repo had only the 6 core metrics for `zhou2018unet_plusplus_denoise` on the 6 SEGC3 random-noise benchmarks; the 16 binned metrics were missing.
- Added 96 missing binned metric mean/std values from the Excel (`UNet-Plus` row) to:
  - `segc3-random-noise-gaussian-snrneg5`, `snr0`, `snr5`
  - `segc3-random-noise-poisson-snrneg5`, `snr0`, `snr5`
- Left existing core metrics unchanged to preserve their precision.
- Created `scripts/fill_unetpp_segc3_binned.py` for reproducibility.
- Verified `npm run build` passes.

## 2026-09-03 — Integrate json0903.rar results
- Extracted `json0903.rar` and inspected the four task folders:
  - `blending_noise_suppression`, `blending_noise_suppression_avo`
  - `random_noise_suppression`, `random_noise_suppression_avo`
- Mapped source tasks to repo tasks (`deblending` and `random_noise_suppression`).
- Added new models and merged existing ones:
  - SEGC3 deblending: `ddpm-blending-noise`, `fbresnet-blending-noise`, `ffcnn-blending-noise`, `q_unet-blending-noise`, `scrn-blending-noise`
  - AVO deblending: `fbresnet-blending-noise-avo`, `ffcnn-blending-noise-avo`
  - SEGC3 random noise: `unet_L-random-noise`, `unet-plusplus-random-noise`
  - AVO random noise: 11 new `*-random-noise-avo` models
- Created 6 new AVO synthetic random-noise benchmarks (`random-noise-avo-*`) with 22 metrics.
- Parsed all Excel sheets for mean ± std, keeping only the 6 core + 16 binned metrics and ignoring energy-ratio/frequency-range columns.
- Updated/created result entries for all affected benchmarks; `model_count` recalculated from actual result counts.
- Updated `parameters_m` for all models that had values in the Excel `Parameters (M)` column.
- Added group description for `AVO Random Noise` in `src/pages/BenchmarksPage.tsx`.
- Created `scripts/integrate_json0903.py` for reproducibility.
- Verified `npm run build` passes.

## 2026-09-03 — Integrate field interpolation results from `interp_field_czt0903.zip`
- Extracted `interp_field_czt0903.zip` and inspected model JSONs and `batch_evaluation_part.xlsx`.
- Added back the `chai2020_unet_interpolation` model (87.15 M) using the source model JSON.
- Parsed the `Interpolation` sheet: 6 models × 7 variants = 42 rows.
- Mapped variant names to Mobile AVO field benchmark IDs; `uniform 70` mapped to `mobile-avo-interp-uniform75`.
- Updated/created 42 result entries with mean ± std for the 22 valid metrics, ignoring energy-ratio/frequency-range columns.
- Updated `parameters_m` for the 6 field interpolation models from the Excel `Parameters (M)` column.
- Recalculated `model_count` for all Mobile AVO interpolation benchmarks.
- Created `scripts/integrate_interp_field_0903.py` for reproducibility.
- Verified `npm run build` passes.

## 2026-09-04 — Rename `-plus` suffix models to `-L` (large version)
- Identified 17 models with `-plus` suffixes that should follow the `-L` naming standard.
- Renamed model IDs and display names:
  - Ground-roll: `attention-unet-plus-groundroll` → `attention-unet-L-groundroll`, `res-unet-plus-groundroll` → `res-unet-L-groundroll`, `unet-plus-groundroll` → `unet-L-groundroll`
  - Multiples: `attention-unet-plus-multiples` → `attention-unet-L-multiples`, `res-unet-plus-multiples` → `res-unet-L-multiples`, `unet-plus-multiples` → `unet-L-multiples`
  - First-break: `attention-unet-first-break-plus` → `attention-unet-first-break-L`, `res-unet-first-break-plus` → `res-unet-first-break-L`, `unet-first-break-plus` → `unet-first-break-L`
  - Interpolation: `attention-unet-plus-interpolation` → `attention-unet-L-interpolation`, `dncnn-plus-interpolation` → `dncnn-L-interpolation`, `resunet-plus-interpolation` → `resunet-L-interpolation`, `unet-plus-interpolation` → `unet-L-interpolation`
  - AVO interpolation: `avo-attention-unet-plus-interpolation` → `avo-attention-unet-L-interpolation`, `avo-dncnn-plus-interpolation` → `avo-dncnn-L-interpolation`, `avo-resunet-plus-interpolation` → `avo-resunet-L-interpolation`, `avo-unet-plus-interpolation` → `avo-unet-L-interpolation`
- Left legitimate UNet++ models unchanged (`zhou2018unet_plusplus_denoise`, `unet-plusplus-blending-noise`, `unet-plusplus-blending-noise-avo`).
- Updated all `model_id` references in `src/data/results.json`.
- Recalculated `model_count` values in `src/data/benchmarks.json` from actual result entries.
- Created `scripts/rename_plus_to_L.py` for reproducibility.
- Verified `npm run build` passes.

## 2026-09-04 — Remove duplicate UNet++ random-noise models
- Identified duplicate models added by `json0903.rar`:
  - `unet-plusplus-random-noise`
  - `unet-plusplus-random-noise-avo`
- Migrated their results to the canonical `zhou2018unet_plusplus_denoise` model:
  - Replaced 6 existing SEGC3 Gaussian results with the newer values.
  - Added 6 new results for SEGC3 Poisson and AVO synthetic random-noise benchmarks.
- Removed the 2 duplicate model entries.
- Recalculated `model_count` for all `random_noise_suppression` benchmarks.
- Created `scripts/remove_unet_plusplus_duplicates.py` for reproducibility.
- Verified `npm run build` passes.

## 2026-09-03 — Remove PConv interpolation results
- Removed the `pan2020_pconv_unet_interpolation` model from `src/data/models.json`.
- Deleted 3 interpolation result entries with that `model_id`.
- Recalculated `model_count` for all interpolation benchmarks.
- Created `scripts/remove_pconv_interpolation.py` for reproducibility.
- Verified `npm run build` passes.

## 2026-09-03 — Fill CAUNet continuous missing interpolation results
- Inspected `batch_evaluation_part.xlsx` and `interpolation_result_li2022_caunet.json`.
- Updated `li2022_caunet_interpolation` results for the three continuous missing benchmarks:
  - `segc3-interp-continuous20tr`
  - `segc3-interp-continuous30tr`
  - `segc3-interp-continuous40tr`
- Parsed mean ± std from the Excel; preserved existing PSNR because the Excel marks PSNR as `—` for CAUNet.
- Recalculated `model_count` for the affected continuous interpolation benchmarks.
- Created `scripts/update_caunet_continuous_interp.py` for reproducibility.
- Verified `npm run build` passes.

## 2026-09-02 — Rename Mobile AVO random missing benchmark 75% → 70%
- Renamed `mobile-avo-interp-random75` to `mobile-avo-interp-random70` in `src/data/benchmarks.json`.
- Updated benchmark `name` and `description` from 75% to 70%.
- Updated 9 result entries whose `benchmark_id` was the old ID.
- Created `scripts/rename_mobile_avo_random75_to_70.py` for reproducibility.
- Verified `npm run build` passes.

## 2026-08-31 — Remove `chai2020_unet_interpolation`
- Removed the `chai2020_unet_interpolation` model from `src/data/models.json`.
- Deleted all 7 result entries with `model_id` == `chai2020_unet_interpolation`.
- Recalculated `model_count` for affected `segc3-interp-*` benchmarks.
- Created `scripts/remove_chai2020_unet.py` for reproducibility.
- Verified `npm run build` passes.

## 2026-08-31 — Integrate synthetic interpolation update from `intrep_syn_czt0830.zip`
- Extracted `intrep_syn_czt0830.zip` and inspected JSON results, model definitions, and `batch_evaluation_part.xlsx`.
- Added missing interpolation models from the zip:
  - `chai2020_unet_interpolation` (87.15 M)
  - `pan2020_pconv_unet_interpolation` (22.33 M)
- Updated `parameters_m` for all 7 interpolation models from the Excel `Parameters (M)` column:
  - `chai2020_unet_interpolation` 87.15 M
  - `gated_transformer_v9_interpolation` 113.68 M
  - `li2022_caunet_interpolation` 7.79 M
  - `liu2022_wrdl_interpolation` 35.83 M
  - `pan2020_pconv_unet_interpolation` 22.33 M
  - `park2022_cfunet_interpolation` 7.35 M
  - `yu2022_anet_interpolation` 7.05 M
- Parsed the `Interpolation` sheet (mean ± std) and mapped rows to canonical SEGC3 interpolation benchmarks; `uniform 70` merged into `segc3-interp-uniform75`.
- Averaged duplicate `park2022_cfunet` continuous rows; skipped non-canonical `cfunet_random 50-88` and removed `uniform 30` variant.
- Updated 32 existing SEGC3 interpolation results and created 10 new results for `chai2020_unet_interpolation` and `pan2020_pconv_unet_interpolation`.
- Recalculated `model_count` for all `segc3-interp-*` benchmarks.
- Created `scripts/integrate_intrep_syn_0830.py` for reproducibility.
- Verified `npm run build` passes.

## 2026-08-26 — Add field ground-roll gallery images
- Copied the provided field ground-roll input and label visualizations to:
  - `public/datasets/field-groundroll-input.png`
  - `public/datasets/field-groundroll-label.png`
- Updated `field-groundroll-noise1` benchmark `gallery` to show the input/label pair.
- Verified `npm run build` passes.

## 2026-08-26 — Integrate first-arrival picking model parameter counts
- Parsed `初至拾取模型参数量汇总.md` and mapped 10 model names to first-break `model_id`s.
- Updated `parameters_m` for:
  - Standard: U-Net (7.76 M), ResUNet (8.11 M), Attention U-Net (7.85 M), DnCNN Seg (0.56 M), DSU-Net (1.99 M), HUNet (7.76 M), STUNet (71.55 M)
  - Plus: U-Net Plus (31.04 M), ResUNet Plus (32.44 M), Attention U-Net Plus (31.39 M)
- Rounded all values to 2 decimal places to match existing leaderboard convention.
- Created `scripts/update_first_break_parameters.py` for reproducibility.
- Verified `npm run build` passes.

## 2026-08-26 — Integrate field ground-roll results from `batch_evaluation_all_0822.xlsx`
- Inspected `batch_evaluation_all_0822.xlsx`: one sheet `Noise 1.0` with 10 model rows + `Raw (noisy)`.
- Created new benchmark `field-groundroll-noise1` under group `Field Ground-Roll Noise` (task `coherent_noise_suppression`, data_source `field`).
- Mapped Excel methods (UNet, UNet-Plus, ResUNet, ResUNet-Plus, DnCNN, Attention UNet, Attention UNet-Plus, SANet, Physics CNN, Pix2Pix cGAN) to existing ground-roll `model_id`s.
- Added 10 result entries with 6 core + 16 binned metrics and `scores_std` (mean ± std).
- Updated `parameters_m` for the 10 models from the Excel `Parameters (M)` column (e.g., `dncnn-groundroll` corrected to 0.56 M).
- Added group description for `Field Ground-Roll Noise` in `src/pages/BenchmarksPage.tsx`.
- Recalculated `model_count` for the new benchmark.
- Created `scripts/integrate_field_groundroll_0822.py` for reproducibility.
- Verified `npm run build` passes.

## 2026-08-24 — Integrate random-noise and deblending mean±std from json0824.rar
- Extracted `json0824.rar` and parsed the four `batch_evaluation_results.xlsx` files.
- Updated all SEGC3 random-noise results with 6 core + 16 binned metrics and `scores_std`.
- Added missing Mobile AVO random-noise results for 8 models (UNet, DnCNN, ResUNet, Attention UNet, DDPM, SCRN, QUNet, UNet++) across 6 benchmarks.
- Added SEGC3 deblending results using the non-`-avo` model IDs from the rar and removed the incorrectly assigned `-avo` entries from SEGC3 deblending benchmarks.
- Updated AVO deblending results.
- Recalculated `model_count` for all affected random-noise and deblending benchmarks.
- Created `scripts/integrate_json0824_random_deblending.py` for reproducibility.
- Verified `npm run build` passes and pushed commit `2e0ced3` to `main`.

## 2026-08-24 — Set all DnCNN papers to Siwei Yu 2019
- Updated `authors`, `year`, and `paper_url` for 10 DnCNN-family models (including DnCNN-Plus and deblending variants) to cite Yu, Ma & Wang (2019), *Deep learning for denoising*, Geophysics.
- Created `scripts/update_dncnn_paper.py` for reproducibility.
- Verified `npm run build` passes and pushed commit `cd498d1` to `main`.

## 2026-08-24 — Backfill standard deviations for older interpolation results
- Parsed `batch_evaluation_part.xlsx` (`Interpolation` sheet) from `interp_field_czt0820.zip` and `interp_syn_czt0822.zip`.
- Mapped Mobile AVO `uniform70` Excel rows to the current `mobile-avo-interp-uniform75` benchmark; skipped removed `segc3-interp-random10-30` rows.
- Updated `scores` and `scores_std` for 70 existing interpolation result entries (35 Mobile AVO field + 35 SEGC3 synthetic).
- Created `scripts/backfill_interp_zip_std.py` to make the update reproducible.
- Verified `npm run build` passes and pushed commit `5c143c1` to `main`.

## 2026-08-24 — Integrate 2026-08-24 deblending update
- Extracted `json0824.rar` to `.tmp_json0824/` using 7-Zip.
- Replaced old deblending benchmarks with new definitions from `benchmarks(1).json`:
  - SEGC3: `blending-noise-T02_mod`, `blending-noise-T02_comp`, `blending-noise-T02_simp` (group `Common-Receiver Deblending`).
  - Mobile AVO: `blending-noise-avo-T03_avo_mod` (group `AVO Common-Receiver Deblending`).
- Added 15 new deblending-specific models with `parameters_m` from Excel.
- Extracted 22 metrics + standard deviations from deblending Excel sheets; created 27 result entries (SEGC3 18 + AVO 9).
- Removed old `segc3-deblending-*` and `mobile-avo-deblending-t03-mod` results.
- Copied deblending assets to `public/datasets/` (`deblending-input.png`, `deblending-target.png`, `deblending-avo-input.png`, `deblending-avo-target.png`).
- Updated `BenchmarksPage.tsx` group descriptions for new deblending groups.
- Fixed pre-existing Mobile AVO interpolation inconsistencies: created `mobile-avo-interp-random75`, merged `uniform70` results into `uniform75`, removed obsolete `uniform70` benchmark, recalculated `model_count`.
- Verified `npm run build` passes.

## 2026-07-20
- Created task plan for updating `multiples_attenuation` results from `batch_evaluation_part(2).xlsx`.
- Parsed Excel (`Multiples` sheet, 9 model rows + `Raw (noisy)`).
- Mapped 9 methods to existing `model_id`s.
- Extracted 6 core metrics + 16 NE/SNR binned metrics (ignored energy ratio / frequency range columns and standard deviations).
- Updated 9 `multiples-attenuation` entries in `src/data/results.json`.
- Verified `npm run build` passes.

## Ground-roll update from `batch_evaluation_all.xlsx`
- Inspected 5 sheets: `Noise 1.0`–`Noise 9.0`, each with 12 model rows + `Raw (noisy)`.
- Mapped methods to 12 ground-roll `model_id`s and 5 benchmark variant IDs (`segc3-groundroll-noise1` etc.).
- Added 16 NE/SNR binned metrics to all 5 ground-roll benchmarks in `src/data/benchmarks.json`.
- Updated 60 ground-roll result entries in `src/data/results.json`.
- Added `parameters_m` to 12 ground-roll models in `src/data/models.json`.
- Updated `getMetricColumns` in `src/utils/helpers.ts` so ground-roll also shows `Energy Band` / `Frequency Band` dropdown columns.
- Verified `npm run build` passes.

## Server handoff (2026-08-03)
- Created `HANDOFF.md` summarizing project setup, recent changes, type conventions, continuation guide, and verification steps.
- Updated `task_plan.md` and `progress.md`.
- Committed and pushed to `main` on `git@github.com:sixseven42/seismic-benchmark.git`.

## STUNet first-arrival picking integration (2026-08-03)
- Verified the two STUNet JSON files were not yet integrated.
- Added STUNet model (`jiang2023swin_transformer_first_break`) to `src/data/models.json`.
- Added 5 result entries to `src/data/results.json` for benchmarks:
  - `fbp-geomseg-all`
  - `fbp-brunswick-valid`
  - `fbp-dongbei`
  - `fbp-halfmile-valid`
  - `fbp-lalor-valid`
- Corrected `model_id` in results from `pu2024hu_net_first_arrival_accuracy` to `jiang2023swin_transformer_first_break`.
- Incremented `model_count` for the 5 affected benchmarks.
- Verified `npm run build` passes.

## Remove Chai2020UNet (2026-08-24)
- Removed models `chai2020_unet` and `chai2020_unet_interpolation` from `src/data/models.json`.
- Removed all result entries with those `model_id`s.
- Recalculated `model_count` for affected interpolation benchmarks.
- Verified `npm run build` passes.

## Display metric standard deviations (2026-08-24)
- Added `scores_std?: Scores` to the `Result` type and updated `formatMetricValue` to render `mean ± std`.
- Created `scripts/backfill_std.py` to extract standard deviations from source files:
  - `interpolation_json.zip` → 85 entries
  - `avo_interpolation_json.zip` → 63 entries
  - `batch_evaluation_unet_plusplus.xlsx` → 16 entries (random noise + deblending)
  - `batch_evaluation_all.xlsx` → 60 entries (ground-roll)
  - `batch_evaluation_part(2).xlsx` → 9 entries (multiples)
- Total results with `scores_std`: 233 / ~? entries.
- Updated `LeaderboardPage`, `BenchmarksPage` (top5 + binned metrics), and `ModelsPage` score tables to display ±std.
- CSV export now writes combined `mean ± std` strings for metric columns.
- Verified `npm run build` passes and pushed commit `9d70873` to `main`.

## Leaderboard parameters column (2026-08-24)
- Added a sortable `PARAMS (M)` column to the leaderboard between `Method` and `Benchmark`.
- CSV export now includes a `Params (M)` field.
- Created `scripts/backfill_parameters.py` to fill missing `parameters_m` from interpolation Excel/zip files; interpolation models already had parameters, so no new values were written this run.
- 20 models remain without `parameters_m` (random-noise and first-arrival-picking models); they display `—` in the column until their source files are provided.
- Verified `npm run build` passes and pushed commit `bf4d1c0` to `main`.

## Leaderboard AUX dropdown column (2026-08-24)
- Replaced the fixed `SSIM / MAE / MSE / RMSE` columns in the leaderboard with a single `DETAIL` dropdown column.
- `getMetricColumns` now returns `['snr', 'psnr', 'aux', 'eb', 'fb']` for tasks with binned metrics, and `['snr', 'psnr', 'aux', ...]` for other tasks.
- Added `auxMetric` state in `LeaderboardPage.tsx`; dropdown options are SSIM / MAE / MSE / RMSE.
- Updated sorting, CSV export, highlight, and table cell rendering to resolve the `aux` alias.
- Verified `npm run build` passes and pushed commit `8eacf6c` to `main`.

## UNet++ deblending integration (2026-08-24)
- Created 4 deblending benchmarks:
  - `mobile-avo-deblending-t03-mod` (Mobile AVO field, T03 mod)
  - `segc3-deblending-t02-mod`, `segc3-deblending-t02-simp`, `segc3-deblending-t02-comp` (SEGC3 synthetic)
- Updated `zhou2018unet_plusplus_denoise` model `tasks` to include `deblending`.
- Extracted 4 UNet-Plus deblending result entries from `batch_evaluation_unet_plusplus.xlsx` (6 core + 16 binned metrics).
- Added group descriptions for `SEGC3 Deblending` and `Mobile AVO Deblending` in `BenchmarksPage.tsx`.
- Verified `npm run build` passes and pushed commit `a3dd0f7` to `main`.

## Mobile AVO random70 → random75 merge (2026-08-24)
- Moved all 9 results from `mobile-avo-interp-random70` to `mobile-avo-interp-random75`.
- Deleted `mobile-avo-interp-random70` benchmark.
- Recalculated interpolation benchmark `model_count` values.
- Verified `npm run build` passes and pushed commit `cfc96ac` to `main`.

## Simplify SEGC3 interpolation benchmarks (2026-08-24)
- Inspected current interpolation benchmarks: 8 canonical SEGC3 variants + 12 cross-domain/non-canonical variants.
- Deleted 12 SEGC3 interpolation benchmarks:
  - Random: `segc3-interp-random10-30`, `segc3-interp-random30-to-random40`, `segc3-interp-random50-to-random60`, `segc3-interp-random70-to-random80`
  - Uniform: `segc3-interp-uniform30`, `segc3-interp-uniform70`, `segc3-interp-uniform30-to-uniform40`, `segc3-interp-uniform50-to-uniform60`, `segc3-interp-uniform70-to-uniform80`
  - Continuous: `segc3-interp-continuous20tr-to-continuous30tr`, `segc3-interp-continuous30tr-to-continuous40tr`, `segc3-interp-continuous40tr-to-continuous50tr`
- Merged 5 results from `segc3-interp-uniform70` into `segc3-interp-uniform75`; discarded 4 duplicates where 75% results already existed.
- Removed 45 obsolete result entries tied to deleted benchmarks.
- Recalculated `model_count` for all interpolation benchmarks (e.g. `segc3-interp-uniform75`: 10 → 15).
- Updated `BenchmarksPage.tsx` group descriptions to reflect simplified variant sets.
- Added `scripts/cleanup_segc3_interpolation.py` for reproducibility.
- Verified `npm run build` passes and pushed commit `513912e` to `main`.

## Latest interpolation results integration (2026-08-24)
- Integrated `interpolation_json.zip` (SEGC3 synthetic) and `avo_interpolation_json.zip` (Mobile AVO field).
- Added new SEGC3 interpolation models: `unet-plus-interpolation`, `unet-unpn-interpolation`, `attention-unet-plus-interpolation`, `attention-unet-unpn-interpolation`, `resunet-plus-interpolation`, `resunet-unpn-interpolation`, `dncnn-plus-interpolation`, `spnet-interpolation`.
- Added 9 Mobile AVO interpolation models (`avo-*-interpolation`).
- Created new benchmarks:
  - `segc3-interp-uniform75`
  - `mobile-avo-interp-random70`
  - `mobile-avo-interp-uniform75`
- Mapped result benchmark IDs and model IDs; `resunet-interpolation` mapped to existing `res-unet-interpolation`.
- Extracted `parameters_m` from `batch_evaluation.xlsx` / `batch_evaluation_avo.xlsx`.
- Filtered scores to valid core + 16 binned metrics, ignored `_std` / energy ratio / frequency range.
- Recalculated `model_count` for all interpolation benchmarks.
- Verified `npm run build` passes.

## Mobile AVO gallery image (2026-08-23)
- Copied the Mobile AVO visualization image to `public/datasets/mobile-avo-data.png`.
- Added the image to the `gallery` array of all Mobile AVO benchmarks (random-noise ×6 + interpolation ×7).
- Updated `src/pages/BenchmarksPage.tsx` so a single-gallery-image benchmark renders with a `Data` tag instead of the `Raw Data / Label` pair.
- Verified `npm run build` passes.

## Mobile AVO interpolation grouping fix (2026-08-23)
- Split Mobile AVO interpolation benchmarks into three `group_name`s to match SEG C3 structure:
  - `Mobile AVO Continuous Missing`
  - `Mobile AVO Random Missing`
  - `Mobile AVO Uniform Missing`
- Updated `scripts/fix_mobile_avo_benchmarks.py` to use category-specific group names for future runs.
- Verified `npm run build` passes.

## Mobile AVO dataset correction (2026-08-23)
- Updated Mobile AVO random-noise benchmarks to cite https://wiki.seg.org/wiki/Mobil_AVO_viking_graben_line_12 and note it is an open-source 2D marine field dataset.
- Added 7 Mobile AVO interpolation benchmarks (continuous 20/30/40tr, random 30/50%, uniform 50/70%).
- Reassigned the 42 field interpolation results from `interp_field_czt0820.zip` to the new Mobile AVO interpolation benchmarks (they had been incorrectly placed under SEGC3).
- Recalculated `model_count` for all interpolation and random-noise benchmarks.
- Updated `scripts/integrate_interp_zips.py` so field zip maps to Mobile AVO and synthetic zip maps to SEGC3 going forward.
- Verified `npm run build` passes.

## New benchmarks + UNet++ AVO integration (2026-08-23)
- Added interpolation benchmark `segc3-interp-random10-30` and integrated the previously skipped `yu2022_anet_interpolation` result for `interp-random-10-30`.
- Added 6 Mobile AVO field random-noise benchmarks:
  - `mobile-avo-random-noise-gaussian-snrneg5`, `snr0`, `snr5`
  - `mobile-avo-random-noise-poisson-snrneg5`, `snr0`, `snr5`
- Integrated UNet++ (`zhou2018unet_plusplus_denoise`) Mobile AVO results from the 6 `RN-AVO ...` sheets in `batch_evaluation_unet_plusplus.xlsx`.
- Updated benchmark `metrics` (6 core + 16 binned) and `model_count` for all new benchmarks.
- Verified `npm run build` passes.

## UNet++ cleanup (2026-08-23)
- Removed the older `unet-plusplus-random-noise` model and its 6 SEGC3 random-noise results.
- Kept `zhou2018unet_plusplus_denoise` as the canonical UNet++ entry; paper/code references follow the original Zhou et al. 2018 UNet++ paper.
- Updated the 6 SEGC3 random-noise benchmarks in `src/data/benchmarks.json` to recalculate `model_count` after deletion.
- Verified `npm run build` passes.

## Interpolation field & synthetic zip integration (2026-08-23)
- Extracted and inspected `interp_field_czt0820.zip` (6 models, 7 benchmarks) and `interp_syn_czt0822.zip` (7 models, 7 benchmarks).
- Added 7 new synthetic interpolation models to `src/data/models.json`:
  - `chai2020_unet_interpolation`
  - `gated_transformer_v9_interpolation`
  - `li2022_caunet_interpolation`
  - `liu2022_wrdl_interpolation`
  - `pan2020_pconv_unet_interpolation` (new architecture)
  - `park2022_cfunet_interpolation`
  - `yu2022_anet_interpolation`
- Integrated results into 7 SEGC3 interpolation benchmarks:
  - Field results mapped: `interp-continuous-miss*tr` → `segc3-interp-continuous*tr`, `interp-random-miss*` → `segc3-interp-random*`, `interp-uniform-miss*` → `segc3-interp-uniform*`.
  - Synthetic results mapped: `interp-continuous-*tr` → `segc3-interp-continuous*tr`, `interp-random-*` → `segc3-interp-random*`, `interp-uniform-*` → `segc3-interp-uniform*`.
- Filtered scores to 6 core + 16 NE/SNR binned metrics; ignored energy ratio / frequency range keys.
- Replaced 42 existing field result entries and added 45 new synthetic result entries; skipped 1 unmatched synthetic benchmark (`interp-random-10-30`).
- Updated affected interpolation benchmarks in `src/data/benchmarks.json`:
  - metrics include core 6 + 16 binned keys
  - `model_count` recalculated from `results.json`
- Verified `npm run build` passes.
