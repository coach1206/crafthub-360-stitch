# 01 — Source-of-Truth Audit

Repo/branch: `coach1206/crafthub-360-stitch` / `recovery/smokecraft-codex-final`
Starting commit: `5de636bf8e3778a3e71de97c5f7e49b43daccb4e` — verified local=remote, clean tree, before this pass.

## Live, real registry (confirmed authoritative)

`src/constants/session.js` → `VISIT_STRUCTURE` (27 sessions, 6 phases, `TOTAL_SESSIONS = 27`, `TOTAL_VISITS = 6`). Consumed by:

- `src/constants/smokecraftJourney.js` (`isSessionUnlocked`, `isVisitUnlocked`, `getSessionByNumber`) — re-exports `VISIT_STRUCTURE` directly and builds every unlock rule on it.
- `src/components/smokecraft/SmokeCraftSessionGuard.jsx` — the actual route guard on every session route — imports from `smokecraftJourney.js`.
- `src/constants/smokecraftJourneyStatus.js` (`computeJourneyStatus`) — the single function `SmokeCraft.jsx` (landing CTA) and `ResumeJourney.jsx` (Resume) both call for completion %, "last completed session", "is complete" (fixed in the prior "Live Resume-State Reconciliation" pass, re-verified unchanged and correct in this pass).
- `App.jsx` route registrations — every `sessionNumber={N}` prop on every `<SmokeCraftSessionGuard>` matches `VISIT_STRUCTURE` exactly (verified below).

**Conclusion: there is exactly one live, real session-order registry, and every consumer that matters (guards, resume, landing CTA, progress display) reads from it.** No change was required to this core system.

## Stale/conflicting arrays found (audited, not previously flagged)

| File | Shape | Real runtime consumers | Verdict |
|---|---|---|---|
| `src/constants/session.js` → `SMOKECRAFT_FLOW` (+ `getNextSmokecraftRoute`/`getLastSmokecraftRoute`) | Flat 16-item list, no phases, different ids/order than `VISIT_STRUCTURE` | Re-exported by `smokeCraftScoring.js`; read into an unused `.flow` field by `smokeCraftModule.config.js`. Zero consumers actually read `.flow` or call the two route helpers anywhere in the app. | **Dead for order/routing purposes.** Deprecation banner added; not deleted (still sits beside real, in-use `XP_AWARDS`/`RANKS` exports in the same file). |
| `src/modules/smokecraft/data/smokecraftJourneyContract.js` → `JOURNEY_STEPS` | 24-session / 8-visit list, explicitly labeled "Canonical" and claims to feed `SmokeCraftSessionGuard` | Verified false: `SmokeCraftSessionGuard.jsx` imports from `smokecraftJourney.js`/`session.js`, never from this file. Real consumers (`smokecraftProgressService.js`, `SmokeCraftModule.jsx`, `smokecraftMvp2MasterRegistry.js`) are themselves never imported by `App.jsx` or anything reachable from the live route tree. | **Fully dead code — an isolated, unwired parallel module system.** Deprecation banner added; not deleted (out of this pass's smallest-safe-fix scope to prune an entire unreferenced subtree). |
| `src/constants/smokecraftRewards.js` → `visit`/`sessionNumber` fields | 8-visit / 24-session numbering baked into badge/XP metadata | Real consumers (`Rewards.jsx`, `GuestSessionContext.jsx`, `MiniTasting.jsx`, `KnowledgeCheck.jsx`, `smokecraftLoyaltyEngine.js`, `recommendedJourneyService.js`) never read `.visit` or `.sessionNumber` — only `id`/`label`/`xp` are consumed. | **Inert metadata, not a competing live registry** (never displayed as a phase/session number to a user). Docstring corrected to disclose this rather than imply it's authoritative. |

None of these three findings affects any user-visible route, guard, label, or progress calculation — confirmed by tracing every real consumer, not just searching for the array's name.

## No other stale sequence found

- Grep for "7-phase"/"seven phase"/24-session/26-session outside the three files above returned only unrelated matches (deployment-pipeline "Phase 7" references, unrelated to SmokeCraft session architecture).
- No duplicate `<Route>` registration exists for any of the 21 unique session URLs (each of the 27 sessions maps to one of 21 routes; sessions 9/13/17/18/20/26 are the pre-existing, documented `mergedInto` sessions sharing an already-built screen's completion signal — confirmed still true, not newly introduced).
