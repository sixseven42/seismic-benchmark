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

## Additional Phase — Integrate interpolation field results from `interp_field_czt0820`
- [x] Inspect directory contents (6 models + 6 result JSONs + Excel).
- [x] Map result benchmark IDs to existing repo benchmark IDs.
- [x] Add 6 interpolation models to `src/data/models.json` with required fields and `parameters_m`.
- [x] Add 42 result entries to `src/data/results.json`, filtering out energy ratio / frequency range keys.
- [x] Update interpolation benchmark `metrics` to core 6 + binned NE/SNR where applicable.
- [x] Update `model_count` for the 7 affected interpolation benchmarks.
- [x] Update `getMetricColumns` to show `Energy Band` / `Frequency Band` dropdowns for interpolation.
- [x] Run `npm run build` and push to GitHub.


## Decisions
- Keep only NE/SNR binned metrics (energy ratio / frequency range columns ignored).
- Do not store standard deviations; display single values only, matching the existing benchmark style.

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
