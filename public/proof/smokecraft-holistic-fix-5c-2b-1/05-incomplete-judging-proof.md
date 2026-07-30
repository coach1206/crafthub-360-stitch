# Incomplete-Judging Proof — Holistic Fix 5C-2B-1

Verified live: a competition with one fully-judged entry and one
entry assigned a judge who never submits a scorecard.

- The live admin results view (`GET /competitions/:id/results`)
  classifies the incomplete entry as `judging_in_progress` in its
  `pending` array — never silently averaged as zero, never included
  in `ranked`.
- `POST /competitions/:id/results/finalize` is rejected with a real
  `409 judging_incomplete` while the incomplete entry remains
  genuinely mid-judging.
- After the missing judge submits their scorecard, finalization
  succeeds and both entries are ranked (2 entries in the finalized
  `ranked` array).

This confirms the mandate's explicit requirement: "Do not silently
treat missing scorecards as zero. Return an honest pending-judging
state until requirements are met."
