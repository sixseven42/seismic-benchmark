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

## UNet++ random-noise integration (2026-08-23)
- Inspected `batch_evaluation_unet_plusplus.xlsx`: 12 random-noise sheets (6 SEGC3 + 6 AVO) and 4 deblending sheets.
- Added `zhou2018unet_plusplus_denoise` model to `src/data/models.json` (UNet++ by Zhou et al., 2018, 9.05 M parameters).
- Integrated the 6 `RN-SEGC3 ...` sheets into existing SEGC3 random-noise benchmarks:
  - `segc3-random-noise-gaussian-snrneg5`, `snr0`, `snr5`
  - `segc3-random-noise-poisson-snrneg5`, `snr0`, `snr5`
- Extracted means for 6 core metrics + 16 NE/SNR binned metrics; ignored standard-deviation, energy-ratio and frequency-range columns.
- Updated the 6 SEGC3 random-noise benchmarks in `src/data/benchmarks.json`:
  - metrics now include core 6 + 16 binned keys
  - `model_count` +1 each
- Updated `getMetricColumns` in `src/utils/helpers.ts` so `random_noise_suppression` shows `Energy Band` / `Frequency Band` dropdown columns.
- Verified `npm run build` passes.
- **Note:** AVO random-noise and deblending sheets in the Excel were not integrated because the repo has no corresponding benchmarks yet.
