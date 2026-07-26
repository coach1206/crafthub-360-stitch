# Holistic Fix 2E-7 — Proof Index

Starting commit: `903a41ab`

## What this proof directory covers

**All 11 sessions that had no on-screen lesson title (2, 5, 6, 8, 10, 11, 12,
16, 19, 23, 24) now have one, plus real per-lesson "Why It Matters" and
"Golden Box relevance" content — integrated PER FILE, not centrally, and
each one verified live before being trusted.**

### The approach (learned from two earlier failed attempts this operation)

Holistic Fix 2E-6 tried a centralized fix via `SmokeCraftScreenRenderer.jsx`
and found a real visual regression (baked phase/session text in approved
background images overlapping a new banner). This pass built a new, small,
reusable component instead: `SmokeCraftLessonInfoButton.jsx` — a small "i"
button that opens a popover on click, so nothing is ever forced over
existing content.

**First attempt at the button also failed live-testing**: placed as a
*child* of `SmokeCraftImageBoundsOverlay` (Session 2 / HumidorMatch), the
button rendered but its popover panel was invisible — the overlay clips
children to its own bounds-relative coordinate space, not full viewport.
Caught this via a real click-and-screenshot test (`s2f-before.png` /
button visible; popover text absent), reverted, then fixed by rendering the
button as a **sibling** of the overlay instead (`position: fixed`, real
viewport coordinates) — confirmed working via a second live test
(`s2f-after.png` shows the real popover with real content, readable, no
overlap, Back/Continue/Apply Settings buttons still fully clickable).

### Verification performed for all 11 sessions

Every one of the 11 files was screenshotted twice (button closed / popover
open) via `check_batch_info_buttons.mjs`-style real browser automation —
see `batch-s5-format-*.png`, `batch-s8-firstthird-before.png`,
`batch-s16-finalthird-*.png` for representative examples (the remaining 6
sessions' screenshots were reviewed live during this pass but not all
individually copied into this directory given time constraints — their
integration is identical, machine-generated from the same script, and each
one's build/validator checks passed).

### Build-blocking regression lock added

`validateSmokecraftShellAdoption.mjs` now has 22 new checks (2 per session
× 11 sessions): each of the 11 files must still import and render
`SmokeCraftLessonInfoButton`, and `smokecraftEducationalEnrichment.js` must
still have both `whyItMatters` and `goldenBox` populated for that session
number.

## What this proof directory does NOT cover (explicit gaps, not silently omitted)

- **The other 7 sessions with real Golden Box relevance / Why It Matters
  gaps but an existing on-screen title (3, 4, 7, 14, 15, 21, 22)** were
  NOT touched this pass — the mandate's 11-title-gap list was addressed
  in full; the broader 18-session enrichment list from Holistic Fix 2E-5/
  2E-6 was not.
- **Full click-test of every quiz/slider/card/mentor/tasting control
  across all 27 sessions** was not performed — only the info button
  itself, and (for SC-D014, already closed in 2E-6) Flavor Memory's
  flavor-selection + Continue.
- **The educational audit is not marked "no session inconclusive"** —
  several I (inconclusive) cells remain for criteria not addressed by this
  pass's fix (subscreen-gated content, flavor/quality/construction impact
  prose for interaction-only tasting screens).
- **A dedicated five-viewport re-sweep specifically of the 11 changed
  screens** was not run as a separate deliverable — the existing
  `verify-smokecraft-hf2e5-curriculum-five-viewport.mjs` suite (which
  covers all 21 sessions, including these 11) was re-run in full instead
  (see the regression-results file).
