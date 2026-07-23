# 00 — Final Report: Clean Start, State Reset, and Entry-Sequence Restoration

**Repo/branch:** `coach1206/crafthub-360-stitch` / `recovery/smokecraft-codex-final`
**Starting commit:** `ee099ef3251f6e393328bef09dda4cd20213f919` — verified local=remote, clean tree, before this pass began.

## Root cause

Two independent, uncoordinated React state stores exist for SmokeCraft: `GuestSessionContext` (learner name, mentor, cigar, the entire `smokeCraft` tasting object, Golden Box progress) and `SmokeCraftJourneyContext` (venue, mentor, cigar, scorecard, Golden Box association, journey ID). The pre-existing "Start New Journey" reset (`startNewJourney()`) only ever reset `SmokeCraftJourneyContext` — it never touched `GuestSessionContext`, so `profile.firstName`, `selectedMentor`, `selectedCraft`, and the nested `smokeCraft` object silently survived every Start action. The `START SMOKECRAFT JOURNEY` primary CTA added in the immediately-prior pass didn't call any reset function at all — it only navigated. Full detail in `01-ROOT-CAUSE.md`.

**State sources leaking old journey data:** `GuestSessionContext`'s `profile`, `selectedCraft`, `selectedMentor`, `selectedMentorCountry`, `selectedLevel`, `smokeCraft.*`, `goldenBoxProgress`, `currentSmokecraftStep`, `latestStampId` — none of these were ever reset by any prior Start action.

## Fix

New shared hook `useStartNewSmokeCraftJourney()` is now the one canonical start function, called by every Start entry point on `ResumeJourney.jsx`. It calls the existing `startNewJourney()` (SmokeCraftJourneyContext reset, unchanged) plus a new `resetJourneySpecificFields()` (GuestSessionContext reset, new) plus the existing `completedSteps` reset — all three now happen together, atomically, from one place, with idempotent double-click protection.

## Results

- **Shared start function result:** confirmed — all 3 Start entry points on `ResumeJourney.jsx` call `startNewSmokeCraftJourney()`
- **Journey ID result:** new unique `activeJourneyId` minted per call
- **Prior journey archive result:** unchanged, still correct (`previousCompletedJourneys` append)
- **One-active-journey result:** unchanged, still correct
- **Completion reset result:** `0%` for a fresh journey, verified
- **Learner-name / Venue / Cigar / Mentor / Knowledge-level reset results:** name/cigar/mentor/level now correctly reset to blank/null (the actual fix); venue is disclosed, pre-existing, intentional preservation (see `05-JOURNEY-SCOPING.md`)
- **Quiz / Flavor Memory / Scorecard reset results:** all reset via the `smokeCraft`/`SmokeCraftJourneyContext` resets
- **Skill Tree / Collections / Challenge / Blend Fault / Filler Arrangement reset results:** disclosed as server-persisted, cross-journey-by-design, out of scope (see `02-STATE-RESET-MANIFEST.md`) — not silently assumed reset
- **Golden Box / Packaging Studio reset results:** the `GuestSessionContext` copy of Golden Box progress is reset; the server-persisted Golden Box entry/Packaging Studio design records are disclosed as independent, out of scope for a SmokeCraft-journey Start action
- **Results / Awards reset result:** SmokeCraftJourneyContext's `finalReview`/`aiSummary`/`pairingRecommendations` reset; cumulative `rewards`/`achievements` explicitly preserved (disclosed, pre-existing design)
- **Passport preservation result:** confirmed untouched by source inspection
- **Entry route / Enrollment / Identity / Venue / Mentor results:** confirmed via the real, existing route/guard graph (not the mandate's generic placeholder sequence — see `03-ENTRY-SEQUENCE.md` for the disclosed difference and why the real graph is authoritative)
- **Welcome visual result:** no fallback/duplicate component found; single registered route, real component, no hardcoded demo values (see `04-VISUAL-ROUTE-ASSET-MAP.md`)
- **Welcome dynamic-data result:** confirmed live via a real Playwright browser run reproducing the exact reported scenario — see `06-REGRESSION-MATRIX.md`
- **Session 1 / route-sequence result:** unchanged, correct
- **Deep-link protection result:** unchanged, correct (`SmokeCraftSessionGuard sessionNumber={1}`)
- **Refresh persistence result:** confirmed (unchanged `saveSession` mechanism)
- **Archived-journey result:** confirmed never re-hydrated as active state
- **LocalStorage override result:** confirmed no code path restores archived journey data
- **Cross-learner result:** structurally sound (no change to identity/authorization code); live verification blocked, same as Phase 10
- **Double-click idempotency result:** confirmed via `useRef` lock in the shared hook

## Defects discovered and fixed

1. `GuestSessionContext` fields never reset by any Start action — fixed.
2. Primary `START SMOKECRAFT JOURNEY` CTA (added in the prior pass) called no reset function at all — fixed.
3. Duplicate, ad-hoc reset logic existed only in `handleConfirmReset()` — consolidated into one shared hook, per the mandate's "one canonical start action" requirement.

## Production files changed

`src/services/sessionStorageService.js`, `src/context/GuestSessionContext.jsx`, `src/hooks/useStartNewSmokeCraftJourney.js` (new), `src/pages/smokecraft/ResumeJourney.jsx`.

## Dedicated suite result

`verify-smokecraft-clean-start-entry-flow.mjs` — 54/55 achievable checks pass, 0 fail, 1 correctly blocked (live cross-learner check).

## Regression results

Phase 9 (36/39, 3 stale-commit-only), Phase 9A (51/54, 3 stale-commit-only), Golden Box Packaging Studio (71/74, 3 stale-commit-only), Passport Security Unified Identity (59/59). Full detail in `06-REGRESSION-MATRIX.md`, including a real Playwright end-to-end reproduction of the exact reported live scenario, run locally.

## Production build / startup / health check

All pass.

## Live deployment verification

**Still blocked** — identical network-access limitation documented since the original Phase 10 pass (organization egress policy denial to `crafthub360.up.railway.app`, no Railway CLI/credentials/dashboard access in this session). No live proof was fabricated; the proof package documents this honestly.

## Whether Phase 10 may close

**No.** The engineering fix is complete and locally verified (including a real, working end-to-end browser reproduction of the exact reported defect), but it has not been deployed to or verified against the real production origin.

## Remaining blockers

Identical to every prior Phase 10 attempt: no network path to the production URL, no Railway dashboard/CLI credentials. What would close it: a Railway dashboard screenshot/log, authenticated Railway CLI output, or a direct user-supplied response from the production origin.

**Status: ENGINEERING COMPLETE — CLEAN START FIX NOT YET LIVE VERIFIED**
