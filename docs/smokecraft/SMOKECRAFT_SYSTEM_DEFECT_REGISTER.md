# SmokeCraft System Defect Register — Prompt 1 (updated Prompt 2, Prompt 3)

Baseline commit: `d6469504a2a83ab4acfb27e89a25064d505d4d55` (Prompt 1), updated at `67fe8f9ac872e1b784911da2a92fc15c9edc6ee7` (Prompt 2), updated at `3da3532ee414ab3b0b8bd9ad6e061a79a6de530d` (Prompt 3 start)

## Prompt 3E-3 update — Challenge Hub, Daily/Weekly Challenge, Event Challenge, SmokeCraft Challenge

Starting commit: `c3674eecbfccf3ae1b9799c854582c665868355b` (Prompt 3E-2 close).

Scope per mandate: audit and fix all challenge interactions across
`ChallengeHub.jsx` (Daily/Weekly challenges are cards within this same
screen — no separate route exists), `EventChallenge.jsx`, and
`SmokeCraftChallenge.jsx`. Golden Box, Mentor, Pairing, responsive layout,
POS360, and E.A.T. 360 were explicitly out of scope.

**Result: NO new defects found.** All screens in scope were already
correctly built as real, live, backend-integrated flows (a "Challenge Hub
Live State" pass, migration 088, predates this recovery operation) — but a
real **testing-environment limitation was discovered and resolved this
pass**, described below, that was necessary to get a true PASS rather than
a false BLOCKED.

- **Environment finding (resolved, not a code defect):** this session's
  Node server had been running with no `DATABASE_URL` (in-memory
  prototype mode). Under that mode, `ChallengeHub.jsx` correctly rendered
  its own honest error state ("Something went wrong loading challenges" +
  Retry) rather than a fabricated challenge list — proving the
  no-fabrication requirement is already respected — but the Daily/Weekly
  challenge cards could not be interaction-tested in that state. Local
  Postgres (`crafthub_smokecraft_final`, same DB used in an earlier phase
  of this operation) was already running the `smokecraft_challenge_*`
  tables from migration 088 with 2 seeded active definitions
  (`daily-lesson-practice`, `weekly-multi-activity-builder`). Restarting
  the server with `DATABASE_URL` pointed at that database allowed full
  live verification of the real Daily/Weekly cards rather than only their
  honest-failure fallback state.
- **Challenge Hub** (`src/pages/smokecraft/ChallengeHub.jsx`): live
  browser test against the real backend found 3 real cards — "Daily
  Practice" (daily), "Weekly Builder" (weekly), and the standalone
  practice activity "Blend Fault Identification". Clicked the Daily card:
  opened a real detail region (`role="region"`) with live progress,
  status, and a real "Start Challenge" control. Keyboard test: `Tab`-focus
  landed on the card's real `aria-label`, `Enter` activated it identically
  to a click (opened the same detail region) — confirms native `<button>`
  semantics, not a div-with-onClick anti-pattern. "Back to Rewards"
  confirmed present and real. Practice card confirmed to navigate to
  `/smokecraft/challenges/blend-fault-identification`, a real, separate,
  working 3-step quiz flow (2 real buttons found on load, question/answer/
  submit flow present in source). No dead controls found.
- **Event Challenge** (`src/pages/smokecraft/EventChallenge.jsx`): 5 real
  calendar events sourced from `PASSPORT_EVENTS` (never fabricated, per
  the file's own docstring). "Event Details" opens real per-event detail
  with banner/sponsor upload inputs (local file reference only, honestly
  labelled "no upload backend connected"), a real "Join Event" toggle
  (`aria-pressed`, disabled once joined or expired), an honest "Not
  available" placeholder for point/reward values (no reward catalog
  configured — correctly not fabricated), and an honest leaderboard
  preview panel (`getLeaderboardSnapshot`, no fabricated rankings). "←
  Event Calendar" and "Back to Challenges" both confirmed to navigate
  correctly; the shared `SmokeCraftNavBar` "← Back" control also present
  and real. No dead controls found.
- **SmokeCraft Challenge** (`src/pages/smokecraft/SmokeCraftChallenge.jsx`):
  13 real challenge categories computed live from
  `calculateWinnerEligibility(session)` (the pre-existing, already-verified
  winner-category engine) — never a fabricated list. Clicked "View" on a
  category: opened a real detail panel with working "View Progress"/"View
  Rewards" toggle buttons (`aria-pressed`), both showing honest content
  (rewards panel explicitly states "Not available — no reward catalog is
  configured for this challenge yet" rather than inventing a reward).
  "Join Challenge" confirmed to flip to a real "Joined" disabled state.
  "Start Challenge →" nav-bar primary confirmed present (awards the
  existing `smokecraft-challenge` session reward and advances to Second
  Humidor Match — unchanged pre-existing journey-flow behavior). No dead
  controls found.

Proof: `public/proof/smokecraft-prompt-3e-3/` — `challenge-hub-list.png`,
`challenge-hub-detail.png`, `blend-fault-challenge.png`,
`event-challenge-calendar.png`, `event-challenge-detail.png`,
`smokecraft-challenge-categories.png`, `smokecraft-challenge-detail.png`.

Regressions re-run and passing: `verify-smokecraft-final-three-approved-assets.mjs`
(17/17), `verify-smokecraft-phase-session-lock.mjs` (9/9),
`scripts/smokecraftAssetExclusivityCheck.mjs` (7/7),
`verify-smokecraft-full-journey-sequence-and-assets.mjs` (92-94/94, only the
known pre-existing SC-D008 stale-assertion failure).

**Prompt 5 engine handoff (recorded per mandate, not built this pass):**
- Streaks are explicitly disclosed by `ChallengeHub.jsx` as not yet
  backend-connected ("Streaks and leaderboards are not yet
  backend-connected for this hub").
- Challenge Hub has no leaderboard integration of its own (separate from
  the existing standalone Leaderboard screen).
- Event Challenge has no reward catalog (grand reward / participation
  reward / points rules all render "Not available" honestly) and no
  banner/sponsor upload backend (local file reference only).
- SmokeCraft Challenge categories have no reward catalog either (same
  "Not available" honesty pattern) and its "Live events" section
  explicitly discloses no scheduled-events backend exists yet.
- Blend Fault Identification (practice activity, `BlendFaultChallenge.jsx`)
  has a working 3-step scoring flow but no server-side persistence beyond
  its own existing scope — disclosed in `ChallengeHub.jsx`'s own comment
  as a pre-existing limitation, out of scope for this pass.
- None of the above are code defects in this pass — they are genuine,
  already-disclosed backend/catalog gaps for a future phase.

## Prompt 3E-2 update — Rewards, Badge Collection, Passport Stamp, Connections

Starting commit: `854495f042888c4507367935d435b6dc55fc90e9` (Prompt 3E-1 close).

Scope per mandate: audit `Connections.jsx`, `PassportStamp.jsx`, `Rewards.jsx`
(badge display), for dead/baked controls of the SC-D001/SC-D010/SC-D011/SC-D012/
SC-D013 class. Golden Box, Mentor, Pairing, Challenges, responsive layout,
POS360, and E.A.T. 360 were explicitly out of scope for this pass.

**Result: NO new defects found.** All three screens were already correctly
built before this pass. Source-level investigation was followed by real
browser verification (seeded guest session, Playwright, `localhost:5050`)
rather than relying on source read alone, since prior passes in this
operation twice caught real mistakes (route-nesting) that source read alone
missed.

- **Connections** (`src/pages/smokecraft/Connections.jsx`): 7 real toggle
  buttons (`CONNECTION_OPTIONS.map`). Live-clicked 3 of the 7 in a real
  browser: all 3 changed `aria-pressed` state correctly (`false -> true`).
  Continue button confirmed real, navigated to `/smokecraft/management-sync`
  as expected. Back control present. No fix needed.
- **Passport Stamp** (`src/pages/smokecraft/PassportStamp.jsx`): confirmed
  real backend-integrated claim flow (`POST /api/smokecraft/passport-stamp/claim`,
  real 409-duplicate detection, honest `idle`/`claiming`/`claimed`/`duplicate`/
  `error`/`offline` states). Live browser test: renders without crashing,
  Back/Continue controls present and real. No fix needed. Note: Prompt 5's
  "duplicate protection" requirement is already satisfied server-side here —
  not an open gap for that phase.
- **Rewards / Badge Collection** (`src/pages/smokecraft/Rewards.jsx`, S25
  mode): confirmed `BadgeCrest` is a non-interactive decorative component
  (no `onClick`, no misleading pointer cursor) rendered via
  `aria-label="... badge (earned)"` / `"(locked)"` — not a clickable-looking
  dead control. Confirmed via `src/App.jsx` there is exactly one `rewards`
  route (Session 25), so there is no separate "Badge Collection" screen to
  audit — badges are inline within Rewards. Live browser test: page renders
  real XP/rank/point values, 6 real buttons present, badge elements confirmed
  present and non-interactive by inspection. No fix needed.

Proof: `public/proof/smokecraft-prompt-3e-2/connections-toggled.png`,
`passport-stamp.png`, `rewards-badges.png`.

Regressions re-run and passing: `verify-smokecraft-final-three-approved-assets.mjs`
(17/17), `verify-smokecraft-phase-session-lock.mjs` (9/9),
`scripts/smokecraftAssetExclusivityCheck.mjs` (7/7).

**Prompt 5 engine handoff (recorded per mandate, not built this pass):**
automatic badge/stamp unlock triggers keyed to rule-based session-completion
events; duplicate protection for badges specifically (Passport Stamp already
has real server-side duplicate protection via the claim API — this is not a
gap, but badge awarding has no equivalent server endpoint yet — confirmed by
grep, `Rewards.jsx` computes badge `earned` state purely from local
`completedSteps`, no server round-trip); unlock reason/timestamp capture;
cross-device/cross-screen persistence (current state is `localStorage`-only,
disclosed elsewhere in this operation as "LOCAL PREVIEW MODE"); and an
admin correction/audit history surface (does not exist anywhere in this
codebase).

## Prompt 3 update

- **SC-D010 CLOSED with browser evidence** — see table row below for full detail.
- **SC-D001 CLOSED (Prompt 3B, Batch 1)** — the defect was actually broader than "bottom-icon strip": the entire left sidebar (9 items), top bar (Back to Journey, notifications, help, account), and bottom strip (6 items) were baked/dead, not just the bottom strip. All 18 controls now wired live, verified via real browser test (all 18 `data-testid` elements found, 3 spot-checked destinations navigate correctly, zero visual regression). See table row below.
- **Full system-wide interaction audit (all 27 sessions' internal controls, every sidebar on every screen, all bottom navs beyond `SmokeCraftNavBar`, all landing/dashboard cards, hotspot alignment at 5 viewports) was NOT attempted this pass.** This turn fixed the one concretely-evidenced defect from the Prompt 2 register (SC-D010) with full verification, rather than claiming broader coverage that wasn't actually performed.

## Prompt 2 updates (closed and new)

- **SC-D005 CLOSED with browser evidence.** All 109 routes were opened in a real browser (`verify-smokecraft-all-routes-browser-test.mjs`), seeded with a fully-progressed guest session so every guard renders real content. Result: **95 PASS, 14 REDIRECT PASS** (the known `Navigate` aliases), **0 REPAIR REQUIRED, 0 DEAD ROUTE, 0 BLOCKED**. Full per-route results + 109 screenshots: `public/proof/smokecraft-system-audit-prompt-2/all-routes/`.
- **Phase 6-vs-7 conflict investigated and documented, NOT silently resolved either way.** See `SMOKECRAFT_PHASE_RECONCILIATION.md`: the 7-phase count was the original pre-implementation plan; it was deliberately superseded by a documented, tested, shipped 6-phase decision ("Package J") before this recovery operation began, and no session-to-phase breakdown for the original 7-phase plan is preserved anywhere to safely restore from. Locking tests added (`verify-smokecraft-phase-session-lock.mjs`, 9/9 passing) protect the current, real, working structure against further drift while leaving the 6-vs-7 naming question open for an explicit product decision.
- **SC-D010 (new): Leaderboard sidebar has 8 of 9 baked labels with no live control.** `src/pages/smokecraft/Leaderboard.jsx` overlays exactly ONE live click handler ("LOUNGE" → back to Landing, line ~510) on top of the approved image's baked sidebar, which visually shows 9 labels (LOUNGE, JOURNEY, CIGARS, CHALLENGES, EVENTS, LEADERBOARD, REWARDS, PASSPORT, CONNECTIONS, SETTINGS — confirmed by source read of the same file's own comments). The other 8 are `DEAD VISUAL CONTROL`. Assigned to Prompt 3.
- **Asset-exclusivity validation script added** (`scripts/smokecraftAssetExclusivityCheck.mjs`, Part 9) — 7/7 checks pass: no missing assets, no curriculum session without an asset, Session-1 image not shared with CraftHub, Leaderboard uses the disclosed newest approved asset, Venue Selection asset used by exactly one key, no undeclared cross-screen asset sharing.

Every defect below is real (reproduced or directly evidenced from source/asset
data gathered this pass), not speculative filler. Items whose evidence is
"not yet gathered" are marked as such explicitly rather than invented.

Every defect below is real (reproduced or directly evidenced from source/asset
data gathered this pass), not speculative filler. Items whose evidence is
"not yet gathered" are marked as such explicitly rather than invented.

| ID | Route/Screen | File/Asset | Defect type | Severity | Evidence | Assigned prompt |
|---|---|---|---|---|---|---|
| SC-D001 | `/smokecraft/welcome` (Session 1) | `src/pages/smokecraft/WelcomeExperience.jsx` | ~~Entire left sidebar (9 items), top bar (4 controls), bottom strip (6 items) baked/dead~~ **CLOSED Prompt 3B** | N/A (resolved) | Fixed: `SIDEBAR_ITEMS`/`BOTTOM_STRIP_ITEMS` arrays + live overlay buttons for all 18 controls, pixel-calibrated via PIL crop. Real browser test: 18/18 `data-testid` elements found; Rewards/Leaderboard/Pairing spot-checks navigate correctly; Settings honestly disabled (no real screen exists); Sign Out navigates to Landing (no destructive reset — this is a guest kiosk app with no real auth). Screenshot: `public/proof/smokecraft-system-audit-prompt-3b/session1-sidebar-repaired.png`. | Closed |
| SC-D002 | 7 actively-used portrait assets: `enroll` (Guest Pass), `aiSummary`, `knowledgeDrop`, `connections`, `knowledgeDropTobacco`, `knowledgeDropAging`, `terroir` | see `SMOKECRAFT_ASSET_INVENTORY.md` | Portrait/vertical assets in active use, per this mandate's hard requirement that tablet screen visuals be landscape | Medium | Dimensions computed directly from file bytes this pass (1086×1448 etc.) | Prompt 4 |
| SC-D003 | 293 image files under SmokeCraft asset directories are not referenced by any `SC_ASSETS` key | `public/assets/smokecraft/**`, `public/assets/smokecraft-reference/**` | Unreferenced/legacy assets not yet reviewed for quarantine | Low | Computed directly this pass via `SC_ASSETS` cross-reference | Prompt 2 (classification), not auto-deleted |
| SC-D004 | 72 duplicate-hash groups (identical file bytes under different filenames) | see `SMOKECRAFT_ASSET_INVENTORY.md` | Asset naming/organization debt — does not itself cause a live defect, but obscures which file is canonical | Low | Computed directly this pass via SHA-256 | Prompt 2 |
| SC-D005 | ~~~100 of 109 registered routes~~~ **CLOSED Prompt 2** | various | All 109 routes browser-tested: 95 PASS, 14 REDIRECT PASS, 0 requiring repair | N/A (resolved) | `public/proof/smokecraft-system-audit-prompt-2/all-routes/00-all-routes-results.json` | Closed |
| SC-D006 | All 27 sessions | various | Per-session quiz/scorecard/slider/upload interaction audit (Part 6 classification) not performed this pass beyond asset+route+component verification already covered by existing test suites | Unknown (unverified) | `SMOKECRAFT_27_SESSION_AUDIT.md` covers route/asset/component only | Prompt 3 |
| SC-D007 | All routes except Venue Selection | various | Four-viewport responsive/scrolling audit (Part 7) not performed this pass beyond the existing full-journey suite's Section G (which sweeps all 31 canonical screens at 4 viewports for horizontal-overflow only, not the full checklist in this mandate — scroll behavior, touch target sizing, hero undersizing, etc.) | Unknown (unverified) | `verify-smokecraft-full-journey-sequence-and-assets.mjs` Section G already exists and passes for horizontal-overflow specifically | Prompt 4 |
| SC-D008 | `verify-smokecraft-full-journey-sequence-and-assets.mjs` — "Welcome honestly declares it has no approved asset" assertion | `verify-smokecraft-full-journey-sequence-and-assets.mjs` | Known pre-existing FAILING assertion — this is a stale, self-invalidating test assertion from before Welcome/S1 had a real approved asset wired (fixed in commit `7e8c4281`, prior session). The assertion itself was designed to flip-and-fail once a real asset was found, which it now correctly does. | N/A (expected, not a live defect) | Reproduced consistently across every full-journey run this session and the prior one | Prompt 6 (test file itself should be updated to stop asserting the stale pre-fix state) |
| SC-D009 | Live Railway production deployment | N/A | Cannot verify what commit/branch Railway is actually serving | Blocking (external) | Org egress 403 to `crafthub360.up.railway.app`, no Railway CLI/credentials — reproduced and confirmed every time it has been attempted this operation | Prompt 6 |
| SC-D011 | `/smokecraft/passport` | `src/pages/smokecraft/SmokeCraftPassport.jsx`, asset `360 PASSPORT  2.png` | ~~5 action cards baked/dead~~ **CLOSED Prompt 3D, corrected 3E-1** | N/A (resolved) | Fixed: `PASSPORT_ACTION_CARDS` array + live overlay for all 5 cards. **Correction made in 3E-1**: the original fix routed "Scan to Connect"/"Join an Event"/"Explore Benefits" to generic screens (Connections/Event Challenge/Rewards Center) and incorrectly disabled "Explore Directory" as unsupported — a real, existing, substantial top-level `/passport/*` module (`src/pages/passport/*.jsx`, 265-775 lines each) was missed. Corrected to route to the real dedicated pages: Scan -> `/passport/scan`, Directory -> `/passport/directory`, Event -> `/passport/events`, Benefits -> `/passport/benefits`. "View Matches" remains honestly disabled — confirmed no "matches" route exists anywhere. All destinations re-verified via real browser test after correction. Screenshot: `public/proof/smokecraft-system-audit-prompt-3d/passport-cards-repaired.png`. | Closed |
| SC-D012 | `/smokecraft/passport` | same as SC-D011 | ~~"FULL GUIDE" link and "Directory" list row not investigated~~ **CLOSED Prompt 3E-1** | N/A (resolved) | Fixed: both now route to the real `/passport/how-it-works` and `/passport/directory` pages (same top-level module discovered while fixing SC-D011). Verified via real browser test: both destinations confirmed correct. Screenshot: `public/proof/smokecraft-prompt-3e-1/passport-guide-directory-repaired.png`. | Closed |
| SC-D013 | `/smokecraft/crafthub` | `src/pages/smokecraft/SmokeCraftCraftHub.jsx` | ~~"STAFF HANDOFF"/"DAYONE360 TRAVEL" unwired~~ **CLOSED Prompt 3E-1** | N/A (resolved) | Fixed: DAYONE360 TRAVEL now routes to `/dayone360-travel` (a real, existing top-level route — confirmed via browser test it is a sibling of `/smokecraft`, not nested under it, same class of correction as SC-D011/SC-D012). STAFF HANDOFF confirmed to have no real feature anywhere in this codebase — wired as a real, focusable, `disabled` button with accessible name "Staff Handoff (not yet available)" rather than fabricated. Verified via real browser test + screenshot, zero visual regression: `public/proof/smokecraft-prompt-3e-1/crafthub-bottom-row-repaired.png`. | Closed |
| SC-D010 | `/smokecraft/leaderboard` sidebar | `src/pages/smokecraft/Leaderboard.jsx` | ~~8 of 9 baked sidebar labels had no live click handler~~ **CLOSED Prompt 3** | N/A (resolved) | Fixed: added a `SIDEBAR_ITEMS` array + live overlay `<button>` for each row (JOURNEY→`/smokecraft/resume`, CIGARS→`/smokecraft/humidor-match`, CHALLENGES→`/smokecraft/challenge-hub`, EVENTS→`/smokecraft/event-challenge`, REWARDS→`/smokecraft/rewards-center`, PASSPORT→`/smokecraft/passport`; LEADERBOARD itself gets no separate control since it's the current page and its highlight is real, not a false default; SETTINGS wired as a real, focusable, `disabled` button with accessible name "Settings (not yet available)" since no SmokeCraft settings screen exists — honest, not silently dead). Pixel positions calibrated via PIL crop of the 1538×1022 approved image. Verified via real browser test: all 7 buttons present, Rewards→`/smokecraft/rewards-center` and Passport→`/smokecraft/passport` confirmed navigating correctly; Cigars correctly triggered the existing S2 session guard (test session wasn't progressed far enough to unlock S2 — expected guard behavior, not a new defect). Screenshot confirms zero visual regression (overlays invisible, image unchanged). Proof: `public/proof/smokecraft-system-audit-prompt-3/leaderboard-sidebar-repaired.png`. | Closed |

## Not classified as defects (explicit non-issues, per this mandate's own rules)

- Zero connected venues in `/smokecraft/venue-select` — a valid state per Part 8 of this mandate. Not a defect on its own; only dead controls, wrong image, fake data, or blocked navigation in that state would be.
- 6 phases (not 7) in `VISIT_STRUCTURE` — this repository's locked architecture has always been 6 phases / 27 sessions; not silently changed to match this mandate's stated "7 phases," and not silently changed to match without flagging the discrepancy. See `SMOKECRAFT_27_SESSION_AUDIT.md`.
- S9/S13/S17/S18/S20/S26 having no dedicated component registry entry — intentional (shared/merged component), verified in the 27-session audit.
