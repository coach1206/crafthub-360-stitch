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

## Batch 2 continuation (Prompt 3C) — flagged sessions individually inspected

All 11 flagged low-count sessions (S3, S4, S5, S6, S7, S11, S16-18, S21,
S24) were individually source-read this pass. **Every one of them is a
real, working, loop-rendered interactive screen — none are dead/static.**
The triage script's low counts were a real, disclosed limitation of the
counting method, not evidence of a defect: each of these files renders
its own set of `<button>` elements via a `.map()` loop over a data array
(e.g. `FOCUS_ZONES.map(zone => <button ...>)`, `SECTIONS.map(s => <button
...>)`), which a static single-tag grep only counts once no matter how
many buttons actually render at runtime. Confirmed present in: `MeetYourCigar.jsx`
(7 expandable brand/blend/wrapper/etc. sections), `Terroir.jsx` (`SECTIONS.map`),
`Format.jsx` (`ZONES_FULL.map` + a second data-row `.map`), `CutToastLight.jsx`
(`CUT_METHODS.map`), `LightingTutorial.jsx` (`STEPS.map`), `FirstThird.jsx`/
`SecondThird.jsx`/`FinalThird.jsx` (`FOCUS_ZONES.map`/`FLAVOR_ZONES.map`),
`PairingLab.jsx` (`options.map` + `PAIRING_ZONES.map`), `AISummary.jsx`
(`SECTION_ORDER.map`), `FinalReview.jsx` (`READINESS_ZONES.map`) — all
also use the shared `SmokeCraftNavBar` for Primary/Back. **No session
required a code fix from this inspection.**

**What was NOT done:** actually clicking every one of these loop-rendered
buttons in a real browser to confirm each one's destination/state-change
is correct, testing keyboard/focus/touch on each, or verifying hotspot
alignment at 5 viewports for any of them. Source-level presence of real
`<button>` elements is strong evidence against "dead visual control," but
is not equivalent to full interaction verification.

## Batch 3 (started) — gameplay hub spot-check

- **CollectionsCenter.jsx, ChallengeHub.jsx**: safe pattern confirmed —
  approved image rendered as normal in-flow `<img>` content (not a
  full-bleed background with overlaid hotspots), real `<button>` elements
  rendered as normal DOM content around/below it. No dead-control risk of
  the SC-D001/SC-D010/SC-D011 kind found in these two screens.
- **SmokeCraftPassport.jsx: NEW CONFIRMED DEFECT (SC-D011).** The approved
  `360 PASSPORT  2.png` asset is a full baked mockup with 5 action cards
  that look clickable ("Scan to Connect," "Explore Directory," "View
  Matches," "Join an Event," "Explore Benefits") plus a "Full Guide" link
  and a "Directory" list row — visually confirmed via image crop, source
  read confirms only one real `<button>` (Back) in the entire file. Not
  fixed this pass — logged with full evidence rather than rushed.
- Golden Box, CraftHub, Mentor, Pairing, Rewards, Passport Stamp,
  Connections, Event/Weekly/Daily/SmokeCraft Challenge screens: **not yet
  individually inspected** this pass.

## Batch 3E-2 — Rewards/Badges, Passport Stamp, Connections (live browser verified)

Following the Prompt 3E-1 corrections, Prompt 3E-2 audited the remaining
Batch 3 items called out by name in the mandate: `Connections.jsx`,
`PassportStamp.jsx`, and `Rewards.jsx` badge display. Unlike the Batch 2/3
work above, this pass went beyond source read to real Playwright browser
verification (seeded guest session against a local vite preview server) —
see `SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md`'s Prompt 3E-2 section for full
detail and proof screenshots. **No dead/baked controls found; no fix
required.** Connections' 7 toggle buttons were live-clicked (3 of 7) and
confirmed to change `aria-pressed` state; its Continue control was clicked
and confirmed to navigate to `/smokecraft/management-sync`. Passport Stamp
was confirmed to render its real backend-integrated claim flow without
crashing. Rewards was confirmed to render real point/rank values with
non-interactive badge crests (not a false-clickable control).

## Not yet done (Batch 3 remainder, Batch 4)

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
