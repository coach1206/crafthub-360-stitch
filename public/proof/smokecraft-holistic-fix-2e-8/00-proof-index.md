# Holistic Fix 2E-8 — Proof Index

Starting commit: `bfdc3e74`

## What this proof directory covers

**All 7 remaining sessions with real Golden Box relevance / Why It Matters
gaps (3, 4, 7, 14, 15, 21, 22) are now fixed**, using the exact
`SmokeCraftLessonInfoButton` pattern proven safe in Holistic Fix 2E-7 —
per-file integration, no centralized injection, each screenshot-verified
(button closed / popover open) before being trusted.

- `batch2-s4-terroir-before.png` / `batch2-s4-terroir-after.png` — Session
  4 was the exact screen that broke the centralized-injection attempt in
  Holistic Fix 2E-6 (baked "PHASE 1/6 SESSION 4/27" chrome overlapping a
  full-width banner). The sibling+popover pattern renders cleanly here:
  no overlap with the baked chrome text, the existing "Why It Matters"
  tab, or the Back/Continue buttons.
- `batch2-s14-mentorcommentary-after.png` — Mentor Commentary's
  no-mentor-selected honest-empty-state is preserved unchanged; the new
  popover supplements it with real, mentor-independent content without
  papering over the honest empty state.
- `batch2-s22-pairingrecommendations-after.png` — this file required
  wrapping its single-root return in a fragment (`<>...</>`) since it had
  no existing NavBar sibling slot to anchor next to; verified the popover
  still renders correctly outside the image-bounds-overlay's clipped
  coordinate space.

## Educational audit closure

All 5 remaining Inconclusive cells in
`docs/smokecraft/SMOKECRAFT_EDUCATIONAL_COMPLETENESS_AUDIT.md` are
resolved: 3 legitimately reclassified to P (citing the new button content,
which does cover flavor/construction impact for those specific lessons);
2 (Sessions 1 and 27, both out of scope for the 2E-7/2E-8 integration
passes) honestly reclassified to F rather than guessed at P — the mandate
required zero Inconclusive cells, not zero gaps.

## Regression lock

`validateSmokecraftShellAdoption.mjs` gained 14 new checks (2 per session
x 7 sessions) — same pattern as Holistic Fix 2E-7's 22 checks. Total
shell-adoption checks: 177 (up from 163).

## What this proof directory does NOT cover (explicit gaps, not silently omitted)

- **Full click-test of every quiz/slider/card/mentor/tasting/hotspot
  control across all 27 sessions** was NOT performed this pass. Only the
  18 lesson-info buttons (11 from 2E-7 + 7 from this pass) and SC-D014's
  specific controls (flavor selection, Continue) have been directly
  clicked and verified across this entire operation. A full inventory of
  every quiz answer, slider, hotspot, and mentor control across all 27
  sessions, with mouse/keyboard/pointer/touch/persistence verification for
  each, remains a real, disclosed gap.
- **A dedicated five-viewport re-sweep of these 7 specific screens** was
  not run as a separate deliverable this pass (the existing all-21-session
  sweep from Holistic Fix 2E-6, 115/115, remains the most recent evidence
  and already covers these 7 screens' pre-2E-8 state — not their
  post-2E-8 state with the new popover, though the popover only renders
  on click and does not affect the closed-state layout the viewport sweep
  checks).
- **Interaction matrix and locked baseline documents** were not updated
  this pass beyond what the manifest/defect-register already reflect.
