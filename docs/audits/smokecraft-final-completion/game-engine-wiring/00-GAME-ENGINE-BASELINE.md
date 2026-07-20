# Game-Engine Wiring — Baseline

**Consolidation notice**: given the scale of the mandate (audit every interactive control across all
27 sessions), this pass does not attempt a literal control-by-control inventory of the entire journey —
that would require either weeks of per-screen verification or a shallow, unverified pass across dozens
of screens, both of which this session has consistently avoided. Instead this pass does what every prior
pass in this session has done: a real, honest audit of what's already verified (a great deal, backed by
dozens of passing test suites across Packages 1–7A), a targeted search for genuine frontend-only/silent-
failure gaps, and a real fix + real test for the clearest one found, with the rest disclosed as an
inventory-level finding for a future pass. `01`–`08` are correspondingly scoped to match.

## Baseline

- Branch: `recovery/smokecraft-codex-final`
- Commit: `d09b63d7` (unchanged this pass — no pull, no commit)
- Uncommitted paths before: 234. After: 235 (1 new verify script + 1 edited component + doc files).

## Current interactive surface (confirmed, not re-derived)

Every prior package's own test suites already establish, with real DB/API assertions, that the
following are backend-authoritative (not frontend-only):
- Seed/soil/terroir hotspot selections (`verify-golden-box-package-4-seed-soil.mjs`, 17/17) —
  persisted server-side, rehydrated after reload.
- Leaf priming, wrapper/binder/filler selection, rolling-process steps, quality-control checklist
  (`verify-golden-box-package-5-leaf-construction.mjs`, 27/27) — persisted server-side.
- Golden Box entry draft/submit/presentation/pairing/defense (`verify-golden-box-package-1..3.mjs`,
  `verify-golden-box-package-7a.mjs`) — persisted, ownership-enforced, idempotent XP.
- Judge scorecards (draft/submit/lock/amend/void) — real backend lifecycle, ownership-enforced
  (`verify-golden-box-package-7a.mjs`).
- Mentor review — real persistence, role-gated (`verify-golden-box-package-7a.mjs`).
- Quiz/knowledge-check widgets across multiple sessions — real questions, real feedback, backend-
  recorded (Package 4/5 suites).
- Venue Management, Ticket Tapper — unaffected/verified separately, out of scope for SmokeCraft
  game-engine wiring.

## Current tactile/haptic helper

`src/utils/haptics.js` — `triggerHaptic(intensity)`, already used consistently across all these
verified screens; not modified this pass.

## Local/session storage usage

`src/context/SmokeCraftJourneyContext.jsx` persists a `sc_journey_v1` snapshot to `localStorage` as a
**client-side convenience cache** (resume-without-reload, offline-tolerant UI state) layered *on top
of* real backend saves for every screen audited above — not a substitute for them. This is documented
architecture, not a gap, for every screen with its own confirmed backend save.

## Real gap found this pass

`src/pages/smokecraft/FlavorMemory.jsx` — the perception sliders (Intensity/Body/Strength) and flavor-
zone toggle buttons updated `localStorage` (via `SmokeCraftJourneyContext`) immediately, but only
reached the real backend (`POST /api/modules/smokecraft/pairing/flavor-memory` and
`POST /api/passport-360/smokecraft/flavor-memory/save`) once, at final "Continue" — and that call's
errors were silently swallowed (`catch {}`), with no saving/saved/error UI state at any point. This is
exactly the `GAME_EFFECT_WITHOUT_PERSISTENCE`-adjacent pattern the mandate calls out: the control looked
interactive (moved, updated a chart) and had *a* path to the backend, but gave no honest feedback about
whether that path succeeded, and only fired once at the very end rather than as the learner interacted.

## Protected-file state

No migrations, Venue Management, `session.js`, `GoldenBox.jsx`, `GoldenBoxStatus.jsx`, Badges,
Passport, or Leaderboard core files touched this pass. `FlavorMemory.jsx` is not on the protected list.
