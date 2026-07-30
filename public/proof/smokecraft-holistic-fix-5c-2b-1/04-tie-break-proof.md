# Tie-Break Proof — Holistic Fix 5C-2B-1

Rule version `RESULT_TIE_BREAK_RULE_VERSION = 1`. All three tie-break
tests below verified live against the real server/database.

## Construction-quality tie-break

Entry X: construction=9, draw=7, all others=8 (sum=100 → 8.33 avg... exact
weighted total: (9+7+8×10)/120×100 = 80.00). Entry Y: construction=7,
draw=9, all others=8 — identical weighted total (80.00, since 9+7 ==
7+9). Result: Entry X ranks #1 (higher construction average, 9 vs 7),
Entry Y's persisted `tie_break_reason = 'construction_avg'`.

## Variance tie-break

Entry P: two judges both score uniform 8 across all 12 criteria →
weighted totals [80, 80], variance = 0. Entry Q: judge 1 scores
uniform 6, judge 2 scores uniform 10 → weighted totals [60, 100],
average = 80 (ties Entry P), variance = 400. Both entries' per-
criterion averages are identical (6+10)/2 = (8+8)/2 = 8 for every
category — a genuine tie through steps 1-4. Result: Entry P (zero
variance, more consistent judging) ranks #1, Entry Q's persisted
`tie_break_reason = 'score_variance'`.

## Submission-time tie-break

Two entries, identical single-judge score (uniform 8, weighted total
80.00, variance 0, identical criterion averages — a genuine tie
through steps 1-5). `submitted_at` set explicitly 1 hour apart via
direct timestamp verification of real submission ordering. Result:
the earlier-submitted entry ranks #1, the later entry's persisted
`tie_break_reason = 'submission_time'`.

All three confirm the exact documented order: score → construction →
blend (aroma) → presentation (rule_compliance) → variance →
submission time → entry ID (fallback, exercised only by code path,
not a live test — constructing two entries with byte-identical
timestamps down to the microsecond is impractical to assert reliably
in an integration test; the deterministic comparator is verified by
direct source read in the validator).
