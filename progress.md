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
