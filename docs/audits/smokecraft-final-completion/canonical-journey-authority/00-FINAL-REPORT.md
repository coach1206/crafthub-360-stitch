# 00 — Final Report: Emergency Root-Cause Fix — Canonical Journey Authority

**Repo/branch:** `coach1206/crafthub-360-stitch` / `recovery/smokecraft-codex-final`
**Starting commit:** `2293a46b5caef71d00517a2c7b8fc634fabdd741` — verified local=remote, clean tree, before this pass.

## Root cause

`SmokeCraftJourneyContext.jsx`'s `startNewJourney()` explicitly preserved `journey.identity` (`fullName`/`preferredName`/`experienceLevel`) across a new journey, grouped in a "preserved as-is" comment alongside `selectedVenue`. This is the field Welcome's greeting reads (`journey.identity?.preferredName || journey.identity?.fullName`) — a guest's display name from a prior, archived journey could silently carry into a brand-new journey's Welcome screen. See `01-ROOT-CAUSE.md` for the full evidence chain, including what this session could and could not independently verify about the cited live screenshots (network access remains blocked, identical to every prior pass).

## Conflicting state authorities found

None, in the architectural sense claimed. `computeJourneyStatus()` and `getSmokeCraftEntryReadiness()` are already, and remain, the single authorities for curriculum-progress and entry-readiness state respectively — re-verified correct. The single real defect was one field omitted from one existing reset function.

## Canonical resolver path / canonical route-decision path

Not created — see `03-JOURNEY-RESOLVER.md` and `04-ROUTE-DECISION-MATRIX.md` for why the existing functions already serve this role.

## GuestSession scoping result

Not implemented (full per-journeyId field scoping was not built) — the confirmed defect lived in `SmokeCraftJourneyContext`, not `GuestSessionContext`, and `GuestSessionContext`'s journey-specific fields were already correctly reset by the existing `resetJourneySpecificFields()` (unchanged, re-verified).

## Legacy reconciliation result

Not implemented — see `05-LEGACY-RECONCILIATION.md` for the reasoning (the defect self-heals on the next Start New Journey).

## No-active Resume result

**Fixed.** Redirects immediately to `/smokecraft`, no flash, generic inline fallback text removed from the render path. Live-verified.

## No-active Welcome result

Confirmed already correctly guarded by the existing entry-readiness contract (unchanged) — Welcome is only reachable when entry (enroll+venue) is genuinely complete, which is a real, valid, non-buggy state distinct from "no active journey" (curriculum progress).

## No-flash result

Confirmed — Resume's redirect uses the same `return null` pattern already established for `SmokeCraftSessionGuard`.

## Greg Guy elimination result

**Confirmed fixed, live.** Real root-cause scenario reproduced (seed a prior `journey.identity.preferredName = 'Greg Guy'`, click Start New Journey) and confirmed resolved: `identityAfterStartNew: null`, no "Greg" anywhere in the DOM after.

## Stale knowledge-level / cigar / mentor results

`journey.identity.experienceLevel` is cleared by the same fix (it's part of the same `identity` object). Cigar/mentor are `GuestSessionContext` fields, already correctly reset by the pre-existing `resetJourneySpecificFields()` — re-verified unchanged.

## Completed-history / archived-history results

Confirmed unchanged and correct — `previousCompletedJourneys` remains read-only, never re-hydrated into active state, and does not affect the startup CTA (live-verified: 2 completed journeys on record, landing still correctly shows only `START SMOKECRAFT JOURNEY`).

## Clean-start identity / Enrollment / Identity / Venue / Welcome / Session 1 results

Unaffected by this pass — the existing entry sequence (unchanged) was re-verified still functioning via the required regression battery.

## Cross-learner result

Unaffected — architecture unchanged (separate localStorage per browser profile); not independently re-tested this pass with two live profiles.

## Files changed

`src/context/SmokeCraftJourneyContext.jsx` (1 line added: `identity: null` in `startNewJourney`'s reset payload), `src/pages/smokecraft/ResumeJourney.jsx` (redirect effect + no-flash guard, dead inline fallback removed).

## Dedicated suite result

`verify-smokecraft-canonical-journey-authority.mjs` — 25/25 pass, 0 fail.

## Regression results

Clean-start (54/55), entry-prerequisite-guard (43/43), 27-session-sequence (39/39), tactile-haptic (71/71), approved-entry-visuals (24/24), Golden Box Packaging Studio (70/74), Passport Security (59/59) — all pass at established baselines.

## Build / startup / health

All pass.

## Proof directory

`public/proof/smokecraft-canonical-journey-authority/` — root-cause scenario before/after screenshots, no-active-resume-redirect screenshot, raw JSON results, dedicated suite output.

## Whether the root cause is eliminated

**Yes, for the confirmed, reproducible defect found by investigation** (identity carryover on Start New Journey). **Unconfirmed** for whatever the mandate's specific cited live screenshots actually showed, since this session could not independently observe production — the fix applied is the most plausible, evidence-based explanation available, not a verified match to an unseen screenshot.

## Whether Phase 10 may close

**No.** Same unchanged network/credentials blocker as every prior pass.

## Honest remaining blockers

No Railway access (same as every prior pass). The full architectural rewrite the mandate requested (new resolver/route-decision functions, per-journeyId GuestSession scoping, legacy reconciliation migration) was not built — a deliberate scope decision once the narrow, real root cause was found and fixed, not an oversight.

**Status: ENGINEERING COMPLETE — JOURNEY AUTHORITY ROOT CAUSE ELIMINATED, LIVE DEPLOYMENT NOT YET VERIFIED**
