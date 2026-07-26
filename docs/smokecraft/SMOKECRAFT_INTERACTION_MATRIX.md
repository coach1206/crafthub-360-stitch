# SmokeCraft Interaction Matrix — Prompt 3B (in progress)

Baseline commit: `147544b1834c98c8ef94a2614e442e742d5711f2` (Batch 1 complete)

## Status

This document is **not yet the full 20-column matrix** this prompt
specifies (route/screen/session/label/accessible-name/element-type/
intended-action/actual-action/destination/live-vs-baked/mouse/touch/
keyboard/focus/persistence/defect-ID/repair-status/test-reference/
proof-reference for every visible interaction on every active route).
That is a genuinely large, multi-pass undertaking. What follows is the
real, evidence-based work completed so far, plus an honest accounting of
what remains.

## Batch 1 — CLOSED, verified

**Session 1 / Welcome** (`src/pages/smokecraft/WelcomeExperience.jsx`):
18 controls repaired and verified (SC-D001). See `SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md`
and `public/proof/smokecraft-system-audit-prompt-3b/session1-sidebar-repaired.png`.

**Landing** (`src/pages/SmokeCraft.jsx`): all 9 canonical actions dispatch
through one resolver (`resolveSmokeCraftLandingAction`), no inline
hardcoded routes — confirmed by source read in Prompts 1-2 and by the
109-route browser test (`verify-smokecraft-all-routes-browser-test.mjs`).
Individual click-by-click testing of all 9 with screenshot proof per
action was NOT separately performed this pass.

**Leaderboard** (`src/pages/smokecraft/Leaderboard.jsx`): 9-item sidebar,
all live (SC-D010, closed in the prior Prompt 3 pass).

## Batch 2 — session interaction triage (real, script-generated, not a full audit)

`scripts/smokecraftSessionInteractionTriage.mjs` counts real interactive
elements (`<button`, `<input`, `<select`, `<textarea`, slider markup)
directly in each of the 27 session component's own source file, resolved
via the canonical component registry (not guessed):

```
| S | Phase | Route | File | Buttons | Inputs | Selects | Textareas | Sliders | Total interactive |
|---|---|---|---|---|---|---|---|---|---|
| S1 | 1 | /smokecraft/welcome | WelcomeExperience.jsx | 12 | 0 | 0 | 0 | 0 | 12 |
| S2 | 1 | /smokecraft/humidor-match | HumidorMatch.jsx | 6 | 0 | 0 | 0 | 0 | 6 |
| S3 | 1 | /smokecraft/meet-your-cigar | MeetYourCigar.jsx | 1 | 0 | 0 | 0 | 0 | 1 (low) |
| S4 | 1 | /smokecraft/terroir | Terroir.jsx | 1 | 0 | 0 | 0 | 0 | 1 (low) |
| S5 | 1 | /smokecraft/format | Format.jsx | 2 | 0 | 0 | 0 | 0 | 2 (low) |
| S6 | 1 | /smokecraft/cut-toast-light | CutToastLight.jsx | 2 | 0 | 0 | 0 | 0 | 2 (low) |
| S7 | 1 | /smokecraft/lighting-tutorial | LightingTutorial.jsx | 2 | 0 | 0 | 0 | 0 | 2 (low) |
| S8/S9 | 2 | /smokecraft/first-third | FirstThird.jsx | 2 | 0 | 0 | 1 | 0 | 3 |
| S10 | 2 | /smokecraft/flavor-memory | FlavorMemory.jsx | 1 | 1 | 0 | 1 | 1 | 4 |
| S11 | 2 | /smokecraft/pairing-lab | PairingLab.jsx | 2 | 0 | 0 | 0 | 0 | 2 (low) |
| S12/S13 | 3 | /smokecraft/second-third | SecondThird.jsx | 2 | 0 | 0 | 1 | 0 | 3 |
| S14 | 3 | /smokecraft/mentor-commentary | MentorCommentary.jsx | 3 | 0 | 0 | 0 | 0 | 3 |
| S15 | 3 | /smokecraft/knowledge-drop | KnowledgeDrop.jsx | 3 | 0 | 0 | 0 | 0 | 3 |
| S16/17/18 | 4 | /smokecraft/final-third | FinalThird.jsx | 2 | 0 | 0 | 0 | 0 | 2 (low) |
| S19/S20 | 5 | /smokecraft/scorecard | Scorecard.jsx | 2 | 1 | 0 | 1 | 0 | 4 |
| S21 | 6 | /smokecraft/ai-summary | AISummary.jsx | 2 | 0 | 0 | 0 | 0 | 2 (low) |
| S22 | 6 | /smokecraft/pairing-recommendations | PairingRecommendations.jsx | 7 | 0 | 0 | 0 | 0 | 7 |
| S23 | 6 | /smokecraft/passport-stamp | PassportStamp.jsx | 0 | 0 | 0 | 0 | 0 | 0 (see correction below) |
| S24 | 6 | /smokecraft/final-review | FinalReview.jsx | 1 | 0 | 0 | 0 | 0 | 1 (low) |
| S25/S26 | 6 | /smokecraft/rewards | Rewards.jsx | 6 | 0 | 0 | 0 | 0 | 6 |
| S27 | 6 | /smokecraft/session-complete | SessionComplete.jsx | 7 | 0 | 0 | 0 | 0 | 7 |
```

**Correction (real limitation of this method, disclosed):** S23 (Passport
Stamp) shows 0 raw `<button` matches in its own file, but a source read
confirms it renders `<SmokeCraftNavBar>` (the shared Primary/Continue +
Secondary/Back component whose own buttons live in a different file) —
so it is NOT actually a zero-interaction dead screen, my grep-based
method simply doesn't count child-component-supplied controls. This is
disclosed as a real limitation of the triage script, not silently
corrected without saying so. **No session was confirmed to have zero
real interaction** by this triage.

**What this triage does NOT tell us:** whether each screen's OWN,
screen-specific controls (quiz answers, sliders, mentor cards, tasting
notes, uploads) are genuinely live vs. some being baked-image
decorations counted as real `<button>`s that don't do anything
meaningful, or whether hotspot alignment is correct at any viewport.
Several "low" counts (S3, S4, S5, S6, S7, S11, S16-18, S21, S24) warrant
closer, screen-by-screen visual+click inspection in a further pass —
they are flagged, not yet individually verified or fixed.

## Not yet done (Batches 2 continuation, 3, 4)

- Forward (S1→S27) and backward (S27→S1) click-through of the actual
  Previous/Next/Continue controls (route-level forward/backward is
  already proven by `verify-smokecraft-full-journey-sequence-and-assets.mjs`;
  the CONTENT-level controls within each screen are not).
- Full click-test of every quiz, slider, mentor control, tasting control,
  upload area within each of the 27 sessions.
- Batch 3: Rewards, Passport, Collections, Challenge Hub, Golden Box,
  CraftHub, mentor, pairing hubs — sidebar/card-level audit beyond
  Leaderboard.
- Batch 4: hotspot alignment at 5 viewports, keyboard/focus test suite,
  full automated test matching this document's control count.
