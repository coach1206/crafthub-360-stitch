# Holistic Fix 2B — Proof Index

Starting commit `9a0da0bb`. Golden Box family: 16 real routes + 1 alias
(`gold-box` -> `golden-box`), across 13 components.

## Files

- `five-viewport-results.json` (embedded in the raw script output, see
  `verify-smokecraft-hf2b-golden-box.mjs`) — 30 checks (6 static routes ×
  5 viewports: handheld-portrait, tablet-10in, tablet-12in, display-15in,
  desktop). 30/30 clean (no horizontal overflow, no console error, after
  restarting the backend to clear a rate-limiter artifact from repeated
  test runs — not a code regression, see defect register). Keyboard focus
  reached a real control in 20/30 checks; the 10 non-matches are
  `golden-box-status` (a real, zero-control instructional-image screen —
  nothing to focus by design) and `golden-box-judge` in this environment's
  honest empty state ("No entries are currently assigned to you.") — both
  confirmed correct, not defects.
- `screenshots/<screen>-<viewport>.png` — 30 files.
- `screenshots/flow-01..07-*.png` — the connected-flow walkthrough:
  entry → competitions hub → competition detail → entry workspace →
  results → judge dashboard → packaging studio.

## Connected flow result

Entry → Build Studio → blend/component selections → pairing → notes/save
→ review → presentation preparation → defense → judging view → results →
awards → return to journey:

- **Entry (Golden Box rules)**: real, image-shell screen, real
  acknowledgement checkbox gates Continue — confirmed not fabricating
  completion (Continue stays disabled without acknowledgement).
- **Competitions Hub**: real, backend-driven list. This environment has 0
  seeded competitions in some runs / a real one (`117`) in others,
  depending on prior test data — both states render honestly (open/
  upcoming/in-judging/completed sections, or the explicit "No Golden Box
  competitions exist yet" empty state).
- **Competition Detail**: real backend fetch; unknown/placeholder IDs
  honestly render "Competition not found" via the shell's empty state —
  never a fabricated competition.
- **Entry Workspace (blend/component selections, pairing, notes/save)**:
  real backend fetch; unknown IDs honestly render "Unable to load this
  entry" with a real Retry — never fabricated blend data.
- **Results/Awards**: real backend fetch; unreleased/unknown results
  honestly render "Results unavailable" — never a fabricated placement.
- **Judging view (Judge Dashboard)**: real backend fetch; honest "No
  entries are currently assigned to you" when there is nothing to judge.
- **Presentation preparation (Packaging Studio)**: real backend-driven
  dashboard, real "+ New Packaging Design" control.
- **Defense**: no dedicated "defense" screen or backend concept exists
  anywhere in this codebase — recorded as a genuine gameplay-engine gap
  below, not fabricated.
- **Return to journey**: Golden Box's own Continue control (after
  acknowledgement) navigates to Mentor Selection via
  `smokecraftNavigationRegistry`'s `NAV.MENTOR` — confirmed unchanged
  destination.

## Missing-engine requirements recorded for the gameplay-engine package (not built this pass)

- No "defense" phase/screen exists — the flow described in the mandate
  (presentation preparation → **defense** → judging) has no defense step
  implemented anywhere in Golden Box; judging goes straight from
  submission to Judge/Mentor review.
- Awards are not a separate screen — `ResultsExperience.jsx` shows
  results inline; no dedicated "awards ceremony" presentation exists.
- Final scoring/ranking computation, and any real-time competition-state
  transition engine (e.g. auto-advancing a competition from
  `submission_closed` to `judging`), are explicitly out of scope per the
  mandate and not built this pass.

## Test references

`scripts/validateSmokecraftShellAdoption.mjs` (extended this pass to 13
Golden Box files, full suite now covers 20 files),
`scripts/validateSmokecraftManifest.mjs` (fullyMigratedScreens
cross-check now covers 23 routes: 7 from Holistic Fix 2A + 16 from Golden
Box), `verify-smokecraft-hf2b-golden-box.mjs` (this directory's raw
results).
