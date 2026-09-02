# Update multiples_attenuation results from batch_evaluation_part(2).xlsx

## Goal
Replace the current `multiples_attenuation` scores in `src/data/results.json` with the values from the new Excel file `batch_evaluation_part(2).xlsx`, keeping the same schema (6 core metrics + 16 NE/SNR binned metrics, no `_std` fields).

## Phases
- [x] Inspect Excel structure and map `Method` names to existing `model_id`s.
- [x] Read current `src/data/results.json` and `src/data/models.json` to establish baseline.
- [x] Write a one-off Python script that extracts the new mean values for the 6 core metrics and 16 binned metrics, and writes them back to `src/data/results.json`.
- [x] Run the script and validate the JSON output.
- [x] Run `npm run build` to ensure TypeScript/types remain consistent.
- [x] (Optional) Update `parameters_m` in `src/data/models.json` if the Excel contains new parameter counts.

## Additional Phase — Update ground-roll results from `batch_evaluation_all.xlsx`
- [x] Inspect `batch_evaluation_all.xlsx` sheet structure and identify which benchmark(s) it covers.
- [x] Map `Method` names to ground-roll `model_id`s and benchmark variant IDs.
- [x] Update `src/data/results.json` for the corresponding `coherent_noise_suppression` entries.
- [x] Run `npm run build` to verify consistency.

## Additional Phase — Server handoff / migration
- [x] Summarize current project state, recent changes, and continuation instructions into a handoff document.
- [x] Commit the handoff document (and updated planning files) to `main`.
- [x] Push to GitHub so the other server can pull and continue.

## Additional Phase — Integrate latest interpolation JSON zips and Excels
- [x] Inspect `interpolation_json.zip`, `avo_interpolation_json.zip`, and the two Excel files.
- [x] Map SEGC3 / Mobile AVO benchmark IDs and model IDs.
- [x] Add new interpolation models and set `parameters_m` from Excel.
- [x] Create missing benchmarks (`segc3-interp-uniform75`, `mobile-avo-interp-random70`, `mobile-avo-interp-uniform75`).
- [x] Add/replace result entries, keeping only valid metric keys.
- [x] Recalculate interpolation benchmark `model_count`.
- [x] Run `npm run build` and push to GitHub.

## Additional Phase — Mobile AVO dataset correction and interpolation benchmarks
- [x] Update Mobile AVO random-noise benchmark URLs/descriptions to the SEG wiki page.
- [x] Create Mobile AVO interpolation benchmarks (uniform / random / continuous).
- [x] Reassign field interpolation results from SEGC3 to Mobile AVO benchmarks.
- [x] Update `scripts/integrate_interp_zips.py` mapping.
- [x] Recalculate affected `model_count` values.
- [x] Run `npm run build` and push to GitHub.

## Additional Phase — Add missing benchmarks and Mobile AVO UNet++ results
- [x] Create `segc3-interp-random10-30` benchmark and integrate skipped synthetic result.
- [x] Create 6 Mobile AVO field random-noise benchmarks.
- [x] Integrate UNet++ results from `RN-AVO ...` sheets.
- [x] Update benchmark `metrics` and `model_count`.
- [x] Run `npm run build` and push to GitHub.

## Additional Phase — Integrate interpolation field & synthetic zip results
- [x] Inspect `interp_field_czt0820.zip` and `interp_syn_czt0822.zip` contents.
- [x] Map result benchmark IDs to existing repo benchmark IDs.
- [x] Add synthetic interpolation models (`*_interpolation`) including `pan2020_pconv_unet_interpolation` to `src/data/models.json`.
- [x] Add/replace result entries from both zips, keeping only valid metric keys.
- [x] Update affected interpolation benchmark `metrics` and `model_count`.
- [x] Run `npm run build` and push to GitHub.


## New Phase — Simplify SEGC3 interpolation benchmarks
- [x] Inspect current SEGC3 interpolation benchmark IDs and result counts.
- [x] Remove non-canonical SEGC3 interpolation benchmarks:
  - Random missing: keep `random30`, `random50`, `random70`; delete `random10-30` and all `*-to-*` cross-domain variants.
  - Uniform missing: keep `uniform50`, `uniform75`; delete `uniform30`, `uniform70`, and all `*-to-*` cross-domain variants.
  - Continuous missing: keep `continuous20tr`, `continuous30tr`, `continuous40tr`; delete all `*-to-*` cross-domain variants.
- [x] Merge `segc3-interp-uniform70` results into `segc3-interp-uniform75` (models without a 75 entry get moved; duplicates keep the existing 75 value).
- [x] Delete all result entries whose `benchmark_id` was removed.
- [x] Recalculate `model_count` for all interpolation benchmarks from actual result counts.
- [x] Update `BenchmarksPage.tsx` group descriptions to match the simplified variant sets.
- [x] Run `npm run build` and push to GitHub.

## Additional Phase — Integrate UNet++ deblending results
- [x] Create 4 deblending benchmarks for SEGC3 T02 (mod/simp/comp) and Mobile AVO T03 mod.
- [x] Update UNet++ model tasks to include `deblending`.
- [x] Extract UNet-Plus scores from the 4 `Deblending*` sheets in `batch_evaluation_unet_plusplus.xlsx`.
- [x] Add 4 result entries to `src/data/results.json` (6 core + 16 binned metrics).
- [x] Add group descriptions for `SEGC3 Deblending` and `Mobile AVO Deblending` in `BenchmarksPage.tsx`.
- [x] Run `npm run build` and push to GitHub.

## Additional Phase — Leaderboard AUX dropdown column
- [x] Replace fixed SSIM/MAE/MSE/RMSE columns with a single `aux` dropdown column (`DETAIL`).
- [x] Update `getMetricColumns` in `src/utils/helpers.ts` to return `aux` for relevant tasks.
- [x] Add `auxMetric` state and dropdown rendering in `src/pages/LeaderboardPage.tsx`.
- [x] Update sorting, CSV export, and cell resolution to handle the `aux` alias.
- [x] Run `npm run build` and push to GitHub.

## Additional Phase — Add parameters (M) column to leaderboard
- [x] Create `scripts/backfill_parameters.py` to extract `parameters_m` from interpolation Excels/zips and backfill missing model entries.
- [x] Add a sortable `PARAMS (M)` column to the leaderboard table between Method and Benchmark.
- [x] Update CSV export to include `Params (M)`.
- [x] Run `npm run build` and push to GitHub.

## Additional Phase — Display metric standard deviations
- [x] Add `scores_std?: Scores` to `Result` interface.
- [x] Update `formatMetricValue` to accept an optional `std` and render `mean ± std`.
- [x] Create `scripts/backfill_std.py` to extract standard deviations from interpolation zips and relevant Excel files.
- [x] Backfill `scores_std` for 233 existing result entries.
- [x] Update `LeaderboardPage`, `BenchmarksPage`, and `ModelsPage` tables to display ±std.
- [x] Update CSV export to include standard deviations.
- [x] Run `npm run build` and push to GitHub.

## Additional Phase — Integrate 2026-08-24 deblending update (`json0824.rar` / `benchmarks(1).json`)
- [x] Extract `json0824.rar` and inspect new deblending benchmarks, models, and Excel results.
- [x] Replace existing SEGC3 / Mobile AVO deblending benchmarks with the new `benchmarks(1).json` definitions (IDs: `blending-noise-T02_mod`, `blending-noise-T02_comp`, `blending-noise-T02_simp`, `blending-noise-avo-T03_avo_mod`), mapped to repo task `deblending`.
- [x] Add new deblending-specific models from the rar and assign `parameters_m` from the Excel files.
- [x] Extract all 22 metrics (6 core + 16 binned) plus standard deviations from the deblending Excel sheets and create 27 result entries (SEGC3 6×3 + AVO 9×1).
- [x] Remove old deblending result entries and migrate any previous results under the new benchmark IDs.
- [x] Copy deblending visualization assets from the rar to `public/datasets/` and update gallery references.
- [x] Update `BenchmarksPage.tsx` group descriptions for the new deblending group names.
- [x] Recalculate `model_count` for all benchmarks from actual result counts.
- [x] Run `npm run build` and push to GitHub.

## Additional Phase — Backfill standard deviations for older interpolation zips
- [x] Parse `batch_evaluation_part.xlsx` (`Interpolation` sheet) from `interp_field_czt0820.zip` and `interp_syn_czt0822.zip`.
- [x] Map method/variant rows to existing repo `model_id` + `benchmark_id` (Mobile AVO `uniform70` → `uniform75`; skip removed `random10-30`).
- [x] Update `scores` and `scores_std` only for the 70 matching existing interpolation result entries (35 field + 35 synthetic).
- [x] Run `npm run build` and push to GitHub.

## Additional Phase — Integrate random-noise and deblending mean±std from `json0824.rar`
- [x] Extract `json0824.rar` and locate `batch_evaluation_results.xlsx` for random-noise (SEGC3 + Mobile AVO) and deblending (SEGC3 + Mobile AVO).
- [x] Parse `mean+-std` cells for all 22 metrics, ignoring energy-ratio/frequency-range columns.
- [x] Update SEGC3 random-noise results and add missing Mobile AVO random-noise results.
- [x] Add SEGC3 deblending results with non-`-avo` model IDs from the rar and remove incorrectly assigned `-avo` SEGC3 deblending entries.
- [x] Update Mobile AVO deblending results.
- [x] Recalculate `model_count` for affected benchmarks.
- [x] Run `npm run build` and push to GitHub.

## Additional Phase — Integrate field ground-roll results from `batch_evaluation_all_0822.xlsx`
- [x] Inspect Excel structure and identify the field ground-roll benchmark variant.
- [x] Map Excel method names to existing ground-roll `model_id`s.
- [x] Create new benchmark `field-groundroll-noise1` with group `Field Ground-Roll Noise`.
- [x] Add 10 result entries with mean ± std for 6 core + 16 binned metrics.
- [x] Update `parameters_m` for the 10 models from the Excel `Parameters (M)` column.
- [x] Add group description for `Field Ground-Roll Noise` in `BenchmarksPage.tsx`.
- [x] Recalculate `model_count` for the new benchmark.
- [x] Run `npm run build` and push to GitHub.

## Additional Phase — Integrate first-arrival picking model parameter counts
- [x] Parse `初至拾取模型参数量汇总.md` and map model names to first-break `model_id`s.
- [x] Update `parameters_m` for the 10 first-arrival picking models (7 standard + 3 Plus variants).
- [x] Round parameter counts to 2 decimal places to match existing leaderboard convention.
- [x] Run `npm run build` and push to GitHub.

## Additional Phase — Add field ground-roll gallery images
- [x] Copy the provided input/label visualizations to `public/datasets/`.
- [x] Update `field-groundroll-noise1` benchmark `gallery` to reference the two images.
- [x] Run `npm run build` and push to GitHub.

## Additional Phase — Integrate synthetic interpolation update from `intrep_syn_czt0830.zip`
- [x] Extract zip and inspect JSON results, model definitions, and `batch_evaluation_part.xlsx`.
- [x] Add missing interpolation models (`chai2020_unet_interpolation`, `pan2020_pconv_unet_interpolation`) from the zip's model JSONs.
- [x] Update `parameters_m` for all 7 interpolation models from the Excel `Parameters (M)` column.
- [x] Parse the `Interpolation` sheet (mean ± std), map model/variant rows to repo `model_id` + `benchmark_id`.
- [x] Map `uniform 70` rows to the existing `segc3-interp-uniform75` benchmark; ignore removed/non-canonical variants.
- [x] Average duplicate rows (e.g., `park2022_cfunet` continuous variants) when aggregating to a single result entry.
- [x] Update 32 existing SEGC3 interpolation results and create 10 new results for the newly added models.
- [x] Recalculate `model_count` for all `segc3-interp-*` benchmarks.
- [x] Run `npm run build` and push to GitHub.

## Additional Phase — Remove `chai2020_unet_interpolation`
- [x] Remove the `chai2020_unet_interpolation` model from `src/data/models.json`.
- [x] Delete all result entries with `model_id` == `chai2020_unet_interpolation`.
- [x] Recalculate `model_count` for affected `segc3-interp-*` benchmarks.
- [x] Run `npm run build` and push to GitHub.

## Additional Phase — Rename Mobile AVO random missing benchmark 75% → 70%
- [x] Rename `mobile-avo-interp-random75` to `mobile-avo-interp-random70` in `src/data/benchmarks.json`.
- [x] Update benchmark `name` and `description` from 75% to 70%.
- [x] Update all result entries whose `benchmark_id` was `mobile-avo-interp-random75`.
- [x] Run `npm run build` and push to GitHub.

## Decisions
- Keep only NE/SNR binned metrics (energy ratio / frequency range columns ignored).
- Standard deviations are now stored in `scores_std` and rendered as `mean ± std` for all result entries where the source data provides them.
- For uniform 70% → 75% merge, when a model already has a 75% result, keep the 75% value and discard the 70% duplicate.
- For Mobile AVO interpolation, `mobile-avo-interp-random70` results were also merged into `mobile-avo-interp-random75` and the 70% benchmark was removed.
- Deblending benchmarks store the same 6 core + 16 binned metrics as random-noise benchmarks, even though the leaderboard currently shows only the 6 core metrics for the `deblending` task.

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
