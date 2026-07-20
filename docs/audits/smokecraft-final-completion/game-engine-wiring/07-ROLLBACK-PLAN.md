# Game-Engine Wiring — Rollback Plan

- `src/pages/smokecraft/FlavorMemory.jsx`: single-file, additive/behavioral diff (debounced save effect,
  save-state UI, error propagation in `handleContinue`). Revertible by restoring the prior version of
  this one file; no other file depends on the new `saveState` local state.
- `verify-golden-box-game-engine-flavor-memory.mjs`: new standalone test file, deletable with no
  impact on any other suite.
- No migration, no database change, no commit made this session.
