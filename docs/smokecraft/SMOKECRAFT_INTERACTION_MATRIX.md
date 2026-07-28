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

## Holistic Fix 2D — Pairing-adjacent family (5 routes)

Migrated Pairing, Available, Assistant, Pairing Mastery, and Vitola onto
`SmokeCraftScreenShell`. Traced and documented each route's real purpose
and reachability (see `public/proof/smokecraft-holistic-fix-2d/index.md`):
`/smokecraft/pairing` is genuinely live-reachable (Landing PAIRING
action, Welcome bottom-strip, CommandHub ticker); the other 4 are
confirmed orphaned, referenced only in the legacy `SMOKECRAFT_FLOW`
config consumed by the admin-only NOVEE OS module registry.

**No merge or redirect performed** between `/smokecraft/pairing`,
Pairing Lab (S11), Personalized Pairing Recommendations (S22), and
Humidor Match (S2) — confirmed via a new build-blocking collision guard
(`scripts/validateSmokecraftShellAdoption.mjs`) that these 5 pairing-
family routes resolve to 5 distinct components, and that the
navigation registry's `PAIRING`/`PAIRING_STANDALONE` keys remain
separate values.

Connected-flow test: Pairing (real Back/Continue hotspots) → Available
(4 real cigar cards with real Select buttons, confirmed via direct DOM
inspection with `$$eval`, plus 4 honestly-disabled drink-pairing buttons
with real accessible titles) → Assistant/Pairing Mastery (honest
`ComingSoon` placeholders) → Vitola (real 84-interactive-element cigar
anatomy/sensory reference tool, backend-integrated). 5-viewport sweep:
25/25 clean, keyboard focus reached a real control in 25/25.

No dead controls found. Pairing-engine gaps (cigar/liquor attribute
scoring, complement/contrast rules, palate history, explainable
recommendations, alternatives) confirmed absent and recorded for the
gameplay-engine package — `Available.jsx`'s drink-pairing button is
already honestly disabled for exactly this reason.

## Holistic Fix 2C — Origins/Curation/Leaf-Challenge/Cultivation module (9 routes)

Migrated Origins, Curation, Leaves, Leaf Challenge, Leaf Challenge
Calculating, Leaf Challenge Result, Cultivation, Blend, and Flavor DNA
onto `SmokeCraftScreenShell`. Investigated and documented this module's
real relationship to the rest of the app for the first time (see
`public/proof/smokecraft-holistic-fix-2c/index.md`): it is orphaned/
unreachable from the shipped app (no entry point links into it, not part
of the 27-session spine, not part of Golden Box), but it does write real
shared XP (`Blend.jsx`) and harmless unrecognized `completedSteps` entries
(`Cultivation.jsx`/`Blend.jsx`).

Connected-flow test (Origins → Curation → Leaves → Leaf Challenge → Leaf
Challenge Calculating → Leaf Challenge Result → Cultivation → Blend →
Flavor DNA): all real content, honest "Image Pending" placeholders per
this module's own pre-existing visual rule (never a stock photo),
real 5-round quiz with live scoring in Leaf Challenge, real auto-advance
in Leaf Challenge Calculating. 5-viewport sweep (45 checks): 39/45 clean
after a backend restart (the first run's failures were `/api/version`/
`/api/auth/me` 500s from a genuinely-down backend, not a regression); the
remaining 6 investigated and confirmed non-regressions — 5 are Chrome's
`navigator.vibrate` permission console warning from pre-existing,
untouched haptic code (a headless-testing artifact), 1 is the same
non-reproducing first-navigation flake already documented elsewhere this
operation. Keyboard focus reached a real control in 30/45 (the 15
non-matches are Origins/Flavor DNA's genuine zero-control instructional
screens, correctly not defects).

No dead controls found. Added 2 new navigation-registry entries
(`SMOKECRAFT_PASSPORT_MODULE_DESTINATIONS.HOME` for `/passport`,
`SMOKECRAFT_EXTERNAL_DESTINATIONS.GRAND_LOUNGE_RANKING` for
`/grand-lounge-ranking`, a confirmed real top-level alias to the exact
same `Leaderboard` component as `/smokecraft/leaderboard`) after
confirming both are genuine, existing destinations this module already
used.

## Holistic Fix 2B — Golden Box family shell migration (16 routes, 13 components)

Migrated the entire Golden Box family (rules screen, competitions hub,
competition detail, entry workspace, results, judge dashboard, judge/
mentor entry review, and all 5 Packaging Studio screens) onto
`SmokeCraftScreenShell`. Full detail in
`SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md`'s Holistic Fix 2B section and
`public/proof/smokecraft-holistic-fix-2b/`.

Connected-flow test (entry → competitions hub → competition detail →
entry workspace → results → judge dashboard → packaging studio → return
to journey): all screens render real, backend-driven content; unknown/
placeholder IDs honestly show "not found"/"unavailable" via the shell's
generic empty/error panel rather than fabricated data. 5-viewport sweep
(30 checks across 6 static routes): 30/30 clean after a rate-limiter
reset (repeated test runs against the shared guest-session endpoint had
exhausted its window — an environment artifact, not a code regression,
confirmed by restarting the backend and re-running clean). Keyboard focus
reached a real control in 20/30 checks; the other 10 are two genuinely
zero-control screens (`golden-box/status`, an instructional image with no
interactive content by design, and `golden-box/judge`'s honest empty
state when no entries are assigned) — confirmed correct, not defects.

No dead controls found anywhere in the Golden Box family. SC-D008 (the
stale "Welcome has no approved asset" test assertion) was investigated,
found genuinely stale and provable (Welcome's manifest entry has had a
real `session1` asset with `assetStatus: 'ok'` since an earlier pass), and
fixed — `verify-smokecraft-full-journey-sequence-and-assets.mjs` now
passes 107/107, not 106/107.

## Holistic Fix 2A — full shell + navigation-registry migration (7 screens)

Migrated Welcome, Leaderboard, Passport, Venue Selection, CraftHub,
Challenge Hub, and Rewards to actually import and render
`SmokeCraftScreenShell` (not just have it available), replacing their
direct `SmokeCraftImageBoundsOverlay` import where applicable. Full detail,
per-screen results, and proof in `SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md`'s
Holistic Fix 2A section and `public/proof/smokecraft-holistic-fix-2a/`.
5-viewport browser verification (35 screen×viewport checks): 34/35 clean
(no horizontal overflow, no console error), keyboard focus reached a real
control in all 35. The one flagged check (Welcome at handheld-portrait)
was investigated and found to be a flaky, non-reproducing resource-load
console error unrelated to this migration — it does not reproduce
consistently across repeated identical runs and was also observed to not
reproduce at all in some runs, which rules out a deterministic shell/
navigation-registry regression.

Two new build-blocking regression suites added:
`scripts/validateSmokecraftShellAdoption.mjs` (39 checks: shell imported +
rendered, no direct `SmokeCraftImageBoundsOverlay` import, no registered
destination reintroduced as a bare literal, per-screen) and its asset-lock
extension (5 checks: each screen still references its exact locked
`SC_ASSETS` key). Both wired into `npm run build`'s `prebuild` step.

A real, caused-by-this-batch regression was found and fixed (not
dismissed): the pre-existing `verify-smokecraft-final-three-approved-assets.mjs`
grepped for the literal string `SmokeCraftImageBoundsOverlay` in
`WelcomeExperience.jsx`/`Rewards.jsx`, which no longer appears there since
those files now go through `SmokeCraftScreenShell`. Fixed by updating that
test to accept the shell's `mode="image-shell"` indirection as an
equally-valid instance of "the canonical overlay pattern" (the underlying
component still renders — just one composition layer deeper) — this is a
legitimate architecture evolution, not a weakened assertion.

## Holistic Fix 2 — navigation-registry migration (3 screens re-verified)

Welcome, Leaderboard, and Passport had their local hardcoded sidebar/
bottom-nav/action-card route literals replaced with imports from the new
`smokecraftNavigationRegistry.js` (see `SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md`'s
Holistic Fix 2 section). Re-verified via a real browser test (6/6 checks):
Welcome's Rewards and Leaderboard sidebar links, Leaderboard's Rewards and
Passport sidebar links, and Passport's Directory action card and Full Guide
link all still navigate to the exact same destination as before the
migration — zero behavior change. This is a source-of-truth change, not a
new interaction surface, so it does not add new rows to this matrix; it
removes 3 more instances of the scattered-literal pattern this document's
earlier batches flagged as still open.

## Batch 3E-3 — Challenge Hub, Daily/Weekly Challenge, Event Challenge, SmokeCraft Challenge (live browser verified)

Prompt 3E-3 closed out the remaining Batch 3 challenge screens. See
`SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md`'s Prompt 3E-3 section for full
detail and proof screenshots. **No dead/baked controls found; no fix
required.** Notably, this pass required restarting the local Node server
against a real Postgres database (the migration-088 `smokecraft_challenge_*`
tables, already present from an earlier phase of this operation) to fully
interaction-test the Daily/Weekly challenge cards — under the
no-`DATABASE_URL` in-memory mode used by prior passes, Challenge Hub
correctly rendered its own honest error+Retry state instead of a
fabricated challenge list, which is itself further confirming evidence of
this module's no-fabrication discipline, but is not full interaction
coverage. With the database connected: Challenge Hub's 3 real cards
(Daily Practice, Weekly Builder, Blend Fault Identification practice)
were mouse-clicked and keyboard-activated (`Tab` + `Enter`) with identical
results, confirming real `<button>` semantics rather than div/onClick
hotspots. Event Challenge's 5 real calendar events, join/detail/upload
controls, and honest "Not available" reward placeholders were verified.
SmokeCraft Challenge's 13 real categories, View/Join toggles, and
Progress/Rewards detail toggles were verified, including the "Start
Challenge →" nav-bar primary.

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

## Holistic Fix 2E-5 update

`verify-smokecraft-hf2e5-curriculum-forward-backward.mjs` now provides a
dedicated forward (S1→S27) walk plus real clicks on Previous/Next/Back-to-
Journey controls at a mid-spine screen, plus a guard test confirming a
future unearned session cannot be jumped to directly. See its results at
`public/proof/smokecraft-holistic-fix-2e-5/04-forward-backward-results.json`.
Still not done: a full click-test of every quiz/slider/mentor/tasting/
upload control across all 27 sessions, and a dedicated five-viewport
curriculum sweep (both remain open per
`SMOKECRAFT_EDUCATIONAL_COMPLETENESS_AUDIT.md`).

## Holistic Fix 2E-9 / 2E-10 update — full 276-control discovery + representative deep-testing

Holistic Fix 2E-9 discovered every visible interactive control live from the
rendered DOM (not source-code guessing) across all 21 primary curriculum
routes (`verify-smokecraft-hf2e9-all-session-interactions.mjs`) — 276
controls total. Every one was hit-tested for occlusion (no blocked overlay)
and every session's keyboard Tab-focus was verified. See
`public/proof/smokecraft-holistic-fix-2e-9/02-all-session-interaction-results.json`
for the raw discovery data.

Holistic Fix 2E-10 then deep-tested 5 representative control-behavior
implementations for real state change, refresh persistence, and
duplicate-firing protection — covering the interaction patterns the other
271 controls are built from (hotspot-zone selection/toggle,
rating-toggle-with-client-persistence, tab-based expand/collapse, the
Continue-button `done`-flag duplicate-fire guard used throughout the
curriculum, and honest empty/disabled-state rendering with no fabrication).

**Honest scope disclosure**: individual state-change/persistence/
duplicate-firing verification was NOT built for all 276 discovered
controls — only for these 5 representative implementations. Controls not
individually deep-tested remain covered only by the Holistic Fix 2E-9
occlusion/keyboard-focus sweep, not full behavioral verification.

### Deep-tested representative implementations

| Control type | Representative session | Route | State-change | Persistence | Duplicate-firing | Disabled-state | Test / proof reference |
|---|---|---|---|---|---|---|---|
| Selection/toggle (image-shell hotspot zone) | 2 | /smokecraft/humidor-match | PASS | n/a (ephemeral; confirmed via journey context on Continue) | PASS (see Continue row below) | n/a | verify-smokecraft-hf2e10-control-state-persistence.mjs #1 |
| Rating-toggle with client persistence | 8 | /smokecraft/first-third | PASS | PASS — survives full page reload (journey-context localStorage) | not independently tested | n/a | #2 |
| Expand/collapse (role="tab" section) | 4 | /smokecraft/terroir | PASS — real content revealed, not decorative | not required to persist | n/a | n/a | #3 |
| Continue/completion button (`done`-flag guard) | 2 | /smokecraft/humidor-match | PASS | n/a | PASS — rapid synchronous double-click produces exactly one navigation, confirmed both via source read (`if (done) return`) and live test | n/a | #4 |
| Honest empty/disabled state (no fabrication) | 14 | /smokecraft/mentor-commentary | PASS — real "No Mentor Selected", no fabricated commentary | n/a | n/a | PASS — correct absence of a mentor control when none selected | #5 |

Full result: 8/8 passing. Proof: `public/proof/smokecraft-holistic-fix-2e-10/03-control-state-persistence-results.json`.

### Full 276-control discovery inventory (occlusion + keyboard-focus verified)

| Session | Route | Visible controls discovered | Blocked-overlay | Keyboard-focus |
|---|---|---|---|---|
| 1 | /smokecraft/welcome | 25 | 0 blocked | PASS |
| 2 | /smokecraft/humidor-match | 21 | 0 blocked | PASS |
| 3 | /smokecraft/meet-your-cigar | 10 | 0 blocked | PASS |
| 4 | /smokecraft/terroir | 9 | 0 blocked | PASS |
| 5 | /smokecraft/format | 9 | 0 blocked | PASS |
| 6 | /smokecraft/cut-toast-light | 7 | 0 blocked | PASS |
| 7 | /smokecraft/lighting-tutorial | 12 | 0 blocked | PASS |
| 8 | /smokecraft/first-third | 9 | 0 blocked | PASS |
| 10 | /smokecraft/flavor-memory | 13 | 0 blocked | PASS |
| 11 | /smokecraft/pairing-lab | 40 | 0 blocked | PASS |
| 12 | /smokecraft/second-third | 9 | 0 blocked | PASS |
| 14 | /smokecraft/mentor-commentary | 3 | 0 blocked | PASS |
| 15 | /smokecraft/knowledge-drop | 7 | 0 blocked | PASS |
| 16 | /smokecraft/final-third | 16 | 0 blocked | PASS |
| 19 | /smokecraft/scorecard | 37 | 0 blocked | PASS |
| 21 | /smokecraft/ai-summary | 12 | 0 blocked | PASS |
| 22 | /smokecraft/pairing-recommendations | 11 | 0 blocked | PASS |
| 23 | /smokecraft/passport-stamp | 3 | 0 blocked | PASS |
| 24 | /smokecraft/final-review | 8 | 0 blocked | PASS |
| 25 | /smokecraft/rewards | 3 | 0 blocked | PASS |
| 26 | /smokecraft/rewards | 9 | 0 blocked | PASS |
| 27 | /smokecraft/session-complete | 3 | 0 blocked | PASS |

**Total controls discovered**: 276 across 21 primary curriculum routes.

### Duplicate-protection engine-level gap (disclosed, not fixed this pass)

Confirmed via source read: the client-side `done`-flag guard (e.g.
`FirstThird.jsx`, `HumidorMatch.jsx`) prevents a duplicate `onComplete`/
navigate call from a rapid double-click on the SAME page load. It does
NOT protect against a duplicate XP award, badge, or stamp trigger from two
independent requests reaching the backend (e.g. two browser tabs, a
retried network request after a dropped response). No engine-level
(server-side idempotency-key) duplicate protection for XP/badge/stamp
awards was found or added this pass — this is recorded here as a real,
disclosed gap for the later gameplay-engine package, not silently fixed
or fabricated as already handled.
## Holistic Fix 2E-11 update

All 276 controls discovered in Holistic Fix 2E-9 are now mapped to exactly
one of 7 source-derived implementation groups (not label-guessed) in
`SMOKECRAFT_CONTROL_IMPLEMENTATION_MAP.md`:

| Group | Controls | Persistence | Navigation | Duplicate-fire risk | Disabled-state |
|---|---|---|---|---|---|
| navigation | 55 | No | Yes | No | No |
| selection-toggle | 94 | No | No | No | No |
| rating-toggle | 67 | Yes | No | No | No |
| tab-disclosure | 23 | No | No | No | No |
| tasting-input | 12 | No | No | No | No |
| completion | 23 | No | Yes | Yes | No |
| honest-disabled | 2 | No | No | No | Yes |

**Total: 276 mapped, 0 unmapped.** A new build-blocking validator,
`scripts/validateSmokecraftControlCoverage.mjs`, asserts this mapping stays
complete and consistent with the raw 2E-9 discovery data on every build
(group counts, per-session coverage, and required test references for
persistence/navigation/duplicate-risk/disabled-state groups).

The 6th deep-tested implementation (tasting-input, FlavorMemory's
flavor-wheel toggle) was added to
`verify-smokecraft-hf2e10-control-state-persistence.mjs` this pass and
passes 10/10 with the other 5 previously-verified implementations. The
7th group, navigation, is covered by the existing
`verify-smokecraft-hf2e5-curriculum-forward-backward.mjs` and
`verify-smokecraft-full-journey-sequence-and-assets.mjs` suites — its
behavior contract IS the forward/backward walk those scripts already run.

**Engine-level idempotency disclosure (reaffirmed):** the duplicate-fire
protection verified for the `completion` group is a client-side `if (done)
return` guard only. It reliably prevents a rapid double-click within one
page load from double-navigating or double-awarding, but it is not
server-side idempotency against two genuinely independent requests (e.g.
two browser tabs, a retried network request). Server-side idempotency for
XP, badges, and Passport stamps is recorded as a gameplay-engine
requirement for Holistic Fix 4 / the gameplay-engine package, not a Stage
2 control-architecture defect.

No new product control defects were found this pass. Two suspected
failures during deep-test extension (a Terroir `role="tab"` vs
`role="button"` selector mismatch, and a HumidorMatch double-click test
using non-simultaneous `Promise.all([...])` clicks from the Node side)
were both root-caused to test-harness mistakes, not product bugs, and
fixed as such — the underlying product behavior was already correct in
both cases.

## Holistic Fix 3 — system-wide responsive closure

A new 5-viewport (handheld portrait, 10" tablet landscape, 12" tablet
landscape, 15" display, desktop) responsive sweep of all 108 routes
(`verify-smokecraft-hf3-responsive-inventory.mjs`) found and fixed two
real defects:

1. `SmokeCraftVenueCommerce.jsx`'s fixed `'1fr 280px'` two-column grid
   caused real horizontal overflow at handheld-portrait width on
   `/venue-commerce`, `/order`, and `/ticket-tapper/staff-specials`
   (all three render this one component). Fixed with a shared
   `.sc-commerce-two-col` CSS class that collapses to a single column
   below 820px.
2. `Connections.jsx` declared the wrong natural image dimensions
   (1672×941 landscape instead of the real 492×781 portrait), causing
   `SmokeCraftImageBoundsOverlay`'s scale math to genuinely stretch the
   rendered image. Fixed by correcting the declared dimensions.

Result: 0 horizontal overflow, 0 blocked scrolling, 0 obscured controls,
0 stretched images across all 108 routes × 5 viewports. A new
build-blocking validator, `scripts/validateSmokecraftResponsive.mjs`,
locks this against regression. Full detail:
`public/proof/smokecraft-holistic-fix-3/00-proof-index.md`.

## Holistic Fix 4 — server-authoritative session completion & awards

The `completion` control-implementation group's behavior contract is
extended: real click still triggers the `if (done) return` client-side
guard (unchanged, still prevents same-page-load double-fire), but the
resulting session-completion and Passport-stamp award now ALSO fire a
real, idempotent server mutation (`POST
/api/smokecraft/player-state/sessions/:id/complete`, `POST
/api/smokecraft/player-state/awards/passport-stamp`), verified live via
`verify-smokecraft-hf4-player-state-idempotency.mjs` (30/30 passing,
including a real two-tab race and a real cross-guest idempotency-key
collision regression test). localStorage remains the fast, offline-safe
UI cache; the server's `(guest_reference, session_id)` /
`(guest_reference, award_type, award_key)` UNIQUE constraints are now
the actual duplicate-award guard, not the client-side `if (done) return`
alone. See `SMOKECRAFT_STATE_OWNERSHIP_MAP.md` for the full state audit
and `public/proof/smokecraft-holistic-fix-4/` for proof.

## Holistic Fix 4B — account identity and journey-content sync

New screen: `/smokecraft/account` (Create Account / Sign In / Sign Out /
conversion success/conflict / error states), using the existing
`SmokeCraftScreenShell` visual system. The `completion` control group's
underlying data now also syncs the full journey-content snapshot
(mentor pick, tasting notes, quiz answers, pairing selections, etc.) to
the server via the shared `stateAdapter.js`, with real optimistic-
concurrency version protection — verified via
`verify-smokecraft-hf4b-account-and-conversion.mjs` (31/31 passing,
including a real stale-write 409 rejection and true cross-device resume
via a second real login). No existing control's visible behavior
changed. See `SMOKECRAFT_GUEST_ACCOUNT_MERGE_POLICY.md` and
`public/proof/smokecraft-holistic-fix-4b/`.

## Holistic Fix 5A — server-side badge/Passport-stamp auto-unlock, rank, leaderboard

The `completion` control-implementation group's server-side behavior
(unchanged client-side guard) now automatically grants tied badges/
Passport stamps and recomputes rank in the SAME atomic transaction as
the session-completion mutation — the client no longer separately
claims these. Verified live (22/22,
`verify-smokecraft-hf5a-gameplay-engine.mjs`), including a two-tab race
on a badge-and-rank-granting completion (exactly one badge, one rank
promotion, both idempotent). A real leaderboard now exists
(`GET /api/smokecraft/player-state/leaderboard`), wired into
`Leaderboard.jsx`'s existing honest-disclosure boundary message. No
control's visible markup or click behavior changed. See
`SMOKECRAFT_GAMEPLAY_ENGINE_MAP.md`, `SMOKECRAFT_RULE_REGISTRY.md`,
`SMOKECRAFT_LEADERBOARD_RULES.md`.

## Holistic Fix 5A-2 update

No visible control was added, removed, or relaid out this pass (server-
side reward-authority work only). Interaction sweep re-verified: 88/88
passed, 276 controls unchanged across all 21 curriculum sessions.

## Holistic Fix 5A-3B update

No visible control added/removed/relaid out. Fixes a real interaction
defect (SC-D027): the global version-mismatch alert no longer intercepts
clicks on controls underneath it. Interaction sweep re-verified: 88/88
(was 73/88 before this fix), 276 real product controls (the transient
+22 discrepancy during this session was the alert's own Refresh button
being counted while the mismatch happened to be active — not a real
control-count drift).

## Holistic Fix 5B-1A update (pairing screen visual and interaction closure)

No visible control was added, removed, or relaid out. Real browser
verification of PairingLab (S11) and PairingRecommendations (S22)
found and fixed 3 real interaction defects:

- SC-D047: PairingLab.jsx was missing its single accessible `<h1>` page
  title (every other SmokeCraft screen has one).
- SC-D048: PairingLab.jsx's journey-sync effect looped indefinitely on
  every render (a stale useEffect dependency on a freshly-created
  object), manifesting as flavor-note/pairing-goal chip buttons
  constantly detaching from the DOM under real interaction.
- SC-D049: once the render loop was fixed, PairingLab.jsx's Pairing
  Choices panel and the pairing-type hotspot row were found to
  genuinely overlap (both measured against the approved image),
  with the invisible hotspot buttons silently intercepting clicks
  meant for the visible flavor-note chips underneath — closed with an
  explicit stacking order, no visual change.

All controls remain reachable by keyboard (Tab) with a visible focus
style, and by pointer/click at their real (now correctly stacked)
hit-test area. See `SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md` and
`public/proof/smokecraft-holistic-fix-5b-1a/00-proof-index.md`.
