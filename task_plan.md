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

## Decisions
- Keep only NE/SNR binned metrics (energy ratio / frequency range columns ignored).
- Do not store standard deviations; display single values only, matching the existing benchmark style.
- For uniform 70% → 75% merge, when a model already has a 75% result, keep the 75% value and discard the 70% duplicate.
- For Mobile AVO interpolation, `mobile-avo-interp-random70` results were also merged into `mobile-avo-interp-random75` and the 70% benchmark was removed.

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
