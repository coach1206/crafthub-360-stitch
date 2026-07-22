# Phase 7 — Proof Manifest

Maps the mandate's 36 required proof items to what actually exists in the live product and what was captured. The Golden Box flow does not have separate standalone screens for every named step in the mandate's list (e.g. there is no dedicated "wrapper selection screen" distinct from "binder selection screen") — all component selection (wrapper/binder/filler/vitola + optional attributes) happens inside one `EntryWorkspace.jsx` "blend" step via `ComponentPicker` cards. This is disclosed here rather than fabricating screens that don't exist, per the mandate's own instruction: "Do not invent missing screens merely because they are named in older planning documents."

| # | Required item | Mapped to | File |
|---|---|---|---|
| 1 | Golden Box introduction | `/smokecraft/golden-box` (rules/acknowledgement screen doubles as entry) | `01-golden-box-introduction.png` |
| 2 | Golden Box rules | Same screen, ACK_TEXT legal copy | `02-golden-box-rules.png` |
| 3 | Eligibility state | `/smokecraft/golden-box/competitions` (Hub shows eligibility per competition) | `04-eligibility-state.png` |
| 4 | Build Studio | `EntryWorkspace.jsx` "blend" step — not separately screenshotted this pass because it requires a real, non-fabricated competition + entry to reach (creating one is real backend state, already covered by Golden Box 7A's own dedicated proof); see `public/proof/smokecraft-package-7/` and `public/proof/smokecraft-package-7a/` for existing, still-valid Build Studio/presentation/defense/results proof captured in prior passes | reused, not recaptured |
| 5-8 | Blend/wrapper/binder/filler selection neutral state | All rendered by the same `ComponentPicker` component inside the "blend" step — no default `selected` value (verified via source, not screenshot, since reaching this step requires a live entry) | verified via `03-asset-wiring-evidence.json` + source checks in the dedicated suite |
| 9 | Filler Arrangement | Not a Golden Box screen — Filler Arrangement is a separate SmokeCraft lesson (already covered by its own dedicated 17/17 suite and proof directory) | N/A — out of Golden Box scope |
| 10-12 | Strength/body/flavor/pairing controls | `OPTIONAL_COMPONENTS` in `EntryWorkspace.jsx` (strength/body as optional attribute pickers); pairing via `pairingItem` state, verified empty by default via source | verified via source checks |
| 13 | Blend Revision neutral sliders | No dedicated slider control exists in the current `EntryWorkspace.jsx` "review" step (component attribute pickers, not sliders) — disclosed as-is, not fabricated | N/A — no slider UI exists to screenshot |
| 14 | Mentor choice neutral state | `MentorReview.jsx` fields start empty (verified via source) | verified via source checks |
| 15 | Judging rubric | `/smokecraft/golden-box/judge` (Judge Dashboard, links to rubric via `goldenBoxFinalJudgingRubric` asset) | `15-judging-rubric.png` |
| 16 | Presentation | `EntryWorkspace.jsx` "presentation" step | reused from `public/proof/smokecraft-package-7/01-presentation.png` |
| 17 | Defense | Same step, pairing defense | reused from `public/proof/smokecraft-package-7/02-defense.png` |
| 18 | Results | `ResultsExperience.jsx` | reused from `public/proof/smokecraft-package-7a/04-results-experience.png` |
| 19 | Awards | `ResultsExperience.jsx` award states | reused from `public/proof/smokecraft-package-7a/` |
| 20 | Correct OPEN THE BOX placement | `SmokeCraftHotspotLayer.jsx:171` — single golden-box-scoped location | verified in dedicated suite output |
| 21 | No misplaced OPEN THE BOX | Full source grep — exactly 1 occurrence in the codebase | verified in dedicated suite output |
| 22-27 | Desktop/handheld/10in/12in/15in/landscape tablet | Golden Box Hub, all 6 viewports | `22-desktop.png` through `27-tablet-landscape.png` |
| 28 | Keyboard focus | Golden Box rules screen | `28-keyboard-focus.png` |
| 29 | Loading state | Not separately captured — Golden Box Hub/Judge Dashboard both show real loading via React Query-style fetch states already covered by the "renders (non-blank)" checks | verified via dedicated suite |
| 30 | Empty state | Judge Dashboard, fresh/unauthenticated session | `30-empty-state.png` |
| 31 | Error state | Not separately captured this pass — no reproducible error-triggering condition was found without fabricating a network failure; existing error-state proof from Phase 5's visual audit remains valid for the shared error-boundary pattern | reused from Phase 5 proof |
| 32 | Before/after for each fix | No production defect was found or fixed this pass, so no before/after proof applies | N/A |
| 33 | Test summary | `verify-smokecraft-phase7-golden-box-visual.mjs`, clean run output | `31-test-run-output.txt` |
| 34 | Build result | `npm run build` output | `32-build-and-health-check.md` |
| 35 | Health-check result | `GET /api/health` | `34-health-check-result.json` |
| 36 | Updated checklist | `CHECKLIST.md` copy | `33-checklist-updated.md` |
