# Session Progress

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

## Interpolation field results integration (2026-08-20)
- Inspected `interp_field_czt0820` directory: 6 model JSONs + 6 result JSONs + `batch_evaluation_part.xlsx`.
- Extracted `parameters_m` from Excel for the 6 interpolation models.
- Added 6 new interpolation models to `src/data/models.json`:
  - `chai2020_unet`
  - `gated_transformer_v9`
  - `li2022_caunet`
  - `liu2022_wrdl`
  - `park2022_cfunet`
  - `yu2022_anet`
- Added 42 result entries (6 models × 7 benchmarks) to `src/data/results.json`.
- Mapped result benchmark IDs to repo IDs, e.g. `interp-continuous-miss20tr` → `segc3-interp-continuous20tr`.
- Filtered out energy ratio / frequency range keys, kept core 6 + 16 NE/SNR binned metrics.
- Updated the 7 affected interpolation benchmarks in `src/data/benchmarks.json`:
  - metrics now include core 6 + 16 binned keys
  - `model_count` +6
- Updated `getMetricColumns` in `src/utils/helpers.ts` so interpolation shows `Energy Band` / `Frequency Band` dropdown columns.
- Verified `npm run build` passes.
