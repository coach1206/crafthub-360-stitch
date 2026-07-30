# Aggregation Proof — Holistic Fix 5C-2B-1

All results below verified live against the real running server and
database via `verify-smokecraft-hf5c2b1-results-api.mjs` (full raw
results in `01-results-api-results.json`).

- **Single eligible entry**: one entry, one judge, uniform score 8/10
  across all 12 equal-weight criteria. Server-computed weighted total
  = `80.00` exactly (`8/10 × 12 criteria`). `judge_count = 1`,
  `completed_scorecard_count = 1`, criterion-level average for
  `construction` = `8` — all real, non-fabricated persisted values.
- **Multiple entries**: three entries scored 9, 7, and 5 by different
  judges. Ranked strictly #1/#2/#3 in descending score order —
  deterministic, no ties.
- **Variance and criterion averages**: two entries computed to
  identical average weighted totals (80.00) and identical per-
  criterion averages via two judges each (uniform-8+uniform-8 vs.
  uniform-6+uniform-10) — the aggregation query genuinely averages
  each judge's LATEST scorecard, not a naive sum.

Query technique: `computeEntryAggregate()` in `resultsService.js` uses
`DISTINCT ON (judge_id) ... ORDER BY judge_id, created_at DESC` so an
amendment supersedes the scorecard it amended, never double-counted.
