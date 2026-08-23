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


## Decisions
- Keep only NE/SNR binned metrics (energy ratio / frequency range columns ignored).
- Do not store standard deviations; display single values only, matching the existing benchmark style.

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
