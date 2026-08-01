# 06 — Defects Found and Fixed

## Result: no new product defect found or required in this pass

This package's fresh-player run (62/62 API assertions) and UI smoke pass
(9/9) both passed on the first genuinely-complete attempt against the
existing, already-merged Packages A-F codebase. No SC-D068 was assigned —
assigning one would mean fabricating a defect to satisfy the mandate's
"fix a defect" expectation, which this pass does not do.

## Test-script issues found and fixed during development (not product defects)

These are documented for transparency — they were bugs in the *new test
scripts this package wrote*, caught and fixed before the final run, not
gaps in the running product:

1. **Golden Box rubric field name** — `verify-smokecraft-full-game-fresh-player.mjs`
   initially assumed the judging rubric response had a `categories[]`
   field; the real API returns `criteria[].criterionKey`. Fixed by reading
   the real response shape. (See `04-golden-box-flow.md`.)
2. **Golden Box competition id format assertion** — initially asserted a
   UUID-shaped regex; the real `golden_box_competitions.id` is a plain
   integer/serial. Fixed to assert on the real shape.
3. **UI smoke: Identity "Begin" gate** — initially didn't select the
   required `identity-experienceLevel` option, causing the real (and
   correct) client-side validation to block navigation. Fixed by selecting
   a real value before clicking Begin. (See `05-ui-smoke-pass.md`.)

## Prior-pass defects (context, not re-litigated here)

Packages A-F already found and fixed six real pre-existing defects
(SC-D062 - SC-D067, per their own proof directories), most recently
SC-D067 in Package E (a backward/unreachable Passport-stamp sequencing
bug and a client-trusted-eligibility gap). This pass's full fresh-player
run is, among other things, a regression proof that all six of those
fixes still hold end-to-end — see `07-regression-results.md`.
