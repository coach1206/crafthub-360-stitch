# Do Not Break Rules

## The UI developer MAY improve

Composition, spacing, typography, animation, imagery treatment, card presentation, navigation presentation, premium styling — freely, within the locked design tokens (`VISUAL_DESIGN_SYSTEM.md`).

## The UI developer MUST NOT independently change

- **Canonical sequence** — the 27-session order, the recovered Golden Box Rules → Mentor Selection → Seed & Soil opening chain, or any screen's previous/next target. These are enforced by `scripts/verifySmokecraftCanonicalJourneyLock.mjs` and `scripts/verifySmokecraftFullGameInventoryLock.mjs` (both build-blocking).
- **Routes** — every `/smokecraft/*` path is a contract other code (guards, resume logic, deep links) depends on.
- **Completion rules / unlock logic** — `SmokeCraftSessionGuard`'s `sessionNumber`/`requires` props, `completeSmokeCraftScreen()`'s manifest-driven next-route resolution.
- **XP / rewards** — `src/constants/smokecraftRewards.js` (`SESSION_REWARDS`) is server-mirrored; changing client-side values without a matching server change creates a real economy defect.
- **Passport logic** — eligibility/claim is server-computed and server-owned; never fake or client-compute a stamp.
- **Golden Box logic** — competition/entry/judging/award flow is a real backend system.
- **Asset IDs** — `SC_ASSETS` keys are referenced by the governed resolver and the R2 sync pipeline; renaming one breaks that chain.
- **Backend authority / API contracts** — every completion, selection-attempt, and draft-save call goes through real server endpoints (`useGuestSession()`, `submitSelectionAttempt`, `saveTastingDraft`, etc.) — a UI change must call these the same way, never bypass them with local-only state.

## Why this matters

Two real production defects were found and fixed in the sessions leading up to this handoff specifically because a screen's *visible* presentation silently diverged from its *real* state (SC-D076: a baked "Active" badge; SC-D077: a real chain of screens a player's actual clicks never entered). Both are now covered by build-blocking tests. Any UI change that touches the boundary between presentation and the rules above should be run past engineering, not merged silently.
