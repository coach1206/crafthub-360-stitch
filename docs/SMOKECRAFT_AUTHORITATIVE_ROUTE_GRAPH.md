# SmokeCraft 360 — Authoritative Route Graph Correction

## Root cause

`Mentor.jsx` hardcoded `navigate('/smokecraft/format')`. `/smokecraft/format` is real S5 content (correctly built, correctly numbered), guarded by `sessionNumber={5}`. A guest who just finished Mentor Selection has only completed `entry`/`enroll`/`golden-box`/`mentor` — not the numbered S2–S4 sessions — so the guard correctly rejected direct entry and rendered `LockedSmokeCraftScreen`. Every downstream `LockedSmokeCraftScreen`/`smokecraftJourney.js` import chain was traced and confirmed to read `TOTAL_VISITS=6`/`TOTAL_SESSIONS=27` correctly — the literal "8-visit/24-session" text lives only in orphaned, never-rendered modules (`smokecraftJourneyContract.js`, `VisitLockGuard.jsx`/`LockedVisit.jsx` — imported in `App.jsx` but never mounted on any route). The actual defect was purely the wrong hardcoded jump, not a second competing numbering system in the live render path.

## Old graph (Mentor's own hardcoded next-hop) vs. corrected

| Screen | Old forward target | Corrected forward target | Changed? |
|---|---|---|---|
| Mentor Selection | `/smokecraft/format` | `/smokecraft/seed-soil` | ✅ |
| Seed & Soil | `/smokecraft/pairing-lab` | `/smokecraft/humidor-match` | ✅ |
| Humidor Match | `/smokecraft/meet-your-cigar` | (unchanged) | — already correct |
| Meet Your Cigar | `/smokecraft/terroir` | (unchanged) | — already correct |
| Terroir | `/smokecraft/format` | (unchanged) | — already correct |
| Format | `/smokecraft/cut-toast-light` | `/smokecraft/request-purchase` | ✅ |
| Request/Purchase | `/smokecraft/cut-toast-light` | (unchanged) | — already correct |
| Cut, Toast & Light | `/smokecraft/lighting-tutorial` | (unchanged) | — already correct |
| Lighting Tutorial | `/smokecraft/first-third` | (unchanged) | — already correct |
| First Third | `/smokecraft/flavor-memory` | (unchanged) | — already correct |
| Flavor Memory | `/smokecraft/pairing-lab` | (unchanged) | — already correct |
| Pairing Lab | `/smokecraft/second-third` | (unchanged) | — already correct |
| Second Third | `/smokecraft/mentor-commentary` | (unchanged) | — already correct |
| Mentor Commentary | `/smokecraft/knowledge-drop` | (unchanged) | — already correct |
| Knowledge Drop | `/smokecraft/final-third` | (unchanged) | — already correct |
| Final Third | `/smokecraft/scorecard` | (unchanged) | — already correct |
| Scorecard | `/smokecraft/ai-summary` | (unchanged) | — already correct |
| AI Summary | `/smokecraft/pairing-recommendations` | (unchanged) | — already correct |
| Pairing Recommendations | `/smokecraft/passport-stamp` | (unchanged) | — already correct |
| Passport Stamp | `/smokecraft/final-review` | (unchanged) | — already correct |
| Final Review | `/smokecraft/rewards` | (unchanged) | — already correct |
| Connections | `/smokecraft/management-sync` | (unchanged) | — already correct |
| Management Sync | `/smokecraft/session-complete` | (unchanged) | — already correct |

**Only 3 screens' forward navigation actually needed to change**: Mentor Selection, Seed & Soil, Format. One back-navigation fix (Cut, Toast & Light, which pointed back to Format directly — now points to Request/Purchase, the new intervening screen). Everything from Meet Your Cigar onward through Session Complete was already correctly wired and required zero navigation changes — the "braided graph" concern raised earlier turned out to be a false alarm once traced precisely; the existing graph already matched this authoritative order almost everywhere except the three points listed.

## Approach taken (per your explicit fallback authorization)

**Stable IDs preserved, no session renumbering.** `VISIT_STRUCTURE`/`TOTAL_SESSIONS=27`/`TOTAL_VISITS=6` are unchanged. Only the ordered route/prerequisite graph changed:
- `Seed & Soil`'s guard changed from `requires="format"` to `requires="mentor"` (`App.jsx`).
- `Seed & Soil` registered in `SUPPORTING_MODULES` (`session.js`) — it existed only in the legacy, unused `SMOKECRAFT_FLOW` array before, which meant `KNOWN_ROUTES` (Resume's self-heal validator) didn't recognize it and silently discarded any resume target pointing there.

A full spine renumbering was assessed and rejected as disproportionate: the actual defect was 3 wrong hardcoded strings, not a structural numbering conflict. Renumbering would have touched dozens of already-verified "Fully Live" screens for no functional gain.

## Migration safety

`SmokeCraftJourneyContext.loadFromStorage()` now self-heals: if a guest's persisted `resumeRoute === '/smokecraft/format'` and they never actually made a Format selection (`!journey.format`), it's rewritten to `/smokecraft/seed-soil` on load — idempotent, runs once per load, never touches already-valid progress. Guests who legitimately completed Format under the new flow (real `journey.format` value present) are never affected.

## No canonical resolver framework introduced

Per your note not to build "an unnecessary second framework" — the existing `SmokeCraftSessionGuard` (`sessionNumber`/`requires` props) and `currentAllowed`/`resolveSafeResumeTarget` mechanisms already constitute one canonical system. The fix works within it rather than adding `getCanonicalNextRoute()`/`getCanonicalPreviousRoute()` helpers, since the actual defect (3 wrong strings + 1 missing registry entry) didn't require a new abstraction layer.

## Files changed

- `src/pages/smokecraft/Mentor.jsx` — forward target + button label
- `src/pages/smokecraft/SeedSoil.jsx` — forward target + button label
- `src/pages/smokecraft/Format.jsx` — forward target + button label
- `src/pages/smokecraft/CutToastLight.jsx` — back target
- `src/App.jsx` — Seed & Soil guard prerequisite
- `src/constants/session.js` — registered `seed-soil` in `SUPPORTING_MODULES`
- `src/context/SmokeCraftJourneyContext.jsx` — stale `/format` resume-target migration

## Screens NOT touched (confirmed already correct)

Humidor Match, Meet Your Cigar, Terroir, Request/Purchase, Cut-Toast-Light (forward), Lighting Tutorial, First Third, Flavor Memory, Pairing Lab, Second Third, Mentor Commentary, Knowledge Drop, Final Third, Scorecard, AI Summary, Pairing Recommendations, Passport Stamp, Final Review, Connections, Management Sync, Session Complete, Rewards, Achievements, Mini Tasting Round, Second Humidor Match. Mini Tasting Round and Second Humidor Match remain exactly as classified in the prior Master Audit (supporting modules gated behind Scorecard) — not investigated further this pass since they sit outside the corrected chain (Mentor→Seed&Soil→...→Format) and the original defect didn't touch them.

## Image mapping

No image mappings changed. Every touched screen (Mentor Selection, Seed & Soil, Format, Cut-Toast-Light) keeps its existing, already-verified approved asset (`SC_ASSETS.mentorSelection`/individual mentor portraits, `SC_ASSETS.seedSoil`, `SC_ASSETS.format`, `SC_ASSETS.cutToastLight`) — this was a navigation-only correction, confirmed via the same asset-verification suite (62/62 passing, unchanged).

## Tests

`verify-smokecraft-authoritative-sequence.mjs` (new, 20/20 passing) — covers the corrected chain, direct-URL guard protection, Format's correct later-locked state, the migration self-heal, no-duplicate-reward checks, and 4-viewport Mentor Selection layout checks. Full regression battery re-run clean (see final report).
