# 07 — Legacy Removal

Re-confirmed dead, unreachable from `App.jsx` (no new removal needed, already-deprecated from prior passes, re-verified this pass): `SMOKECRAFT_FLOW`, `JOURNEY_STEPS`/`smokecraftJourneyContract.js`, `SmokeCraftModule.jsx`. Newly checked and confirmed dead this pass: `Format.legacy.jsx` (zero imports anywhere).

The bare `<AISummary />` element at the `ai-summary` route was replaced with `<SmokeCraftScreenRenderer screenId="session-21" />` — the one real removal this pass performed, verified via `verify-smokecraft-zero-legacy-runtime.mjs` (no duplicate wiring, no fallback silently replacing it).

No other legacy production component was found to remove — see `02-COMPETING-DEFINITIONS.md` for the full trace.
