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

## Additional Phase — Integrate DSUNet and Plus first-arrival picking models/results
- [x] Inspect `dsunet.zip` and `plus.zip` contents and identify model/result JSON files.
- [x] Extract model metadata and map to existing/new model IDs.
- [x] Add new models to `src/data/models.json` with required fields.
- [x] Add result entries to `src/data/results.json` with corrected `model_id`s.
- [x] Update `model_count` for affected first-arrival benchmarks.
- [x] Run `npm run build` and push to GitHub.


## Decisions
- Keep only NE/SNR binned metrics (energy ratio / frequency range columns ignored).
- Do not store standard deviations; display single values only, matching the existing benchmark style.

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
