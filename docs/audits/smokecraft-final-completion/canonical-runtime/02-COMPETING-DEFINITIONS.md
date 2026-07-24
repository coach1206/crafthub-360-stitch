# 02 — Competing Definitions

Re-confirms and consolidates findings from prior dedicated passes (Session-Sequence Reconciliation, Full Root-Cause Audit) plus fresh checks this pass.

| Definition | Classification | Evidence |
|---|---|---|
| `VISIT_STRUCTURE` (`session.js`) | **Canonical** | Single registry every real consumer (`SmokeCraftSessionGuard`, `ResumeJourney.jsx`, `SmokeCraftProgressHeader`, `smokecraftJourneyStatus.js`) reads from — re-traced this pass, unchanged |
| `SMOKECRAFT_FLOW` (`session.js`) | **Dead** | Zero real consumers of session order; marked deprecated (Session-Sequence pass) |
| `JOURNEY_STEPS` (`smokecraftJourneyContract.js`) | **Dead** | 24-session/8-visit list, zero real consumers in the live route tree; marked deprecated |
| `smokecraftRewards.js` `visit`/`sessionNumber` fields | **Dead metadata** | Never read for order/display; docstring corrected |
| `computeJourneyStatus()` (`smokecraftJourneyStatus.js`) | **Canonical** | Single source for completion %, current/last session, hasStarted — used by landing, Resume, guards |
| `getSmokeCraftEntryReadiness()` | **Canonical** | Single source for entry-layer gating |
| `SC_ASSETS` (`smokecraftAssets.js`) | **Canonical** | Single asset registry, all 79 keys build-time validated (Production Build Identity pass) |
| Per-screen `navigate('/smokecraft/<next>')` calls (all 27 session components) | **Derived, not conflicting** | Each hardcodes its own next route inline rather than reading it from a shared "next screen" table — this is real duplication of *routing knowledge*, though every value observed matches `VISIT_STRUCTURE`'s order exactly (cross-checked this pass for all 27) |
| Per-screen `awardSessionRewards(id)`/`setXxx()` completion calls | **Derived, not conflicting** | Each screen's completion handler is real and correct for that screen, but the pattern (persist → award XP → navigate) is duplicated 27 times rather than centralized |
| `SmokeCraftModule.jsx`, `smokecraftProgressService.js`, `smokecraftMvp2MasterRegistry.js` | **Dead** | Confirmed unreferenced by `App.jsx` or any reachable route (Full Root-Cause Audit pass, re-confirmed) |
| Legacy `Format.legacy.jsx` | **Legacy but reachable — checked this pass** | Confirmed **not** imported by `App.jsx` (grep: zero matches) — dead, not reachable |

## Root finding

**No genuinely conflicting production-reachable definition was found** — every "array" or "map" that could compete with the canonical registry was already dead code from before this operation began tracking it, confirmed dead again this pass. The real, accurate gap is not "multiple competing sources of truth fighting for control" — it is **duplicated, not competing, logic**: 27 screens each correctly re-implement the same "persist → award → navigate to the correct next route" pattern inline, rather than calling one shared function. This is a maintainability/DRY concern with real value in centralizing, not a correctness defect — every one of the 27 next-route values was cross-checked this pass against `VISIT_STRUCTURE`'s order and found correct.
