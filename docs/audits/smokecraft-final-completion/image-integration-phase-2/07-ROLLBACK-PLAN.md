# Image Integration Phase 2 — Rollback Plan

- **File moves** (11 `git mv` operations): fully reversible, history-preserving; no file referenced the
  old paths before this pass (grep-verified), so reverting is a straight move-back.
- **`SC_ASSETS` additions** (11 new keys, additive block): revertible by deleting the added block; no
  existing key changed.
- **Component edits** (2 files, `WrapperStrength.jsx` and `CigarGaugeGuide.jsx`): each is a small,
  isolated, additive diff (one import + one lookup map + one JSX element in `WrapperStrength.jsx`; one
  import + one line changed in `CigarGaugeGuide.jsx`) — revertible per-file without touching any other
  logic.
- No migration, no database change, no commit made this session.
