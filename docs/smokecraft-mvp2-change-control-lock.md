# SmokeCraft MVP2 — Change Control Lock

Effective: MVP2 investor-readiness build (v1.0.0)

This document defines what is frozen for the MVP2 investor release and what
process is required to change it.

---

## Frozen at MVP2

These elements are locked and must not be changed without a documented
justification (verified production defect, investor feedback, or founder
authorization):

| Element | Frozen state | Why |
|---|---|---|
| Journey step order | S1–S24, session numbers fixed | Changing breaks SmokeCraftSessionGuard for all in-progress sessions |
| Approved image paths | `public/assets/smokecraft-reference/approved/` | Demo video, investor screenshots, and marketing materials reference these paths |
| Approved image filenames | As-is (see `mvp2-visual-image-registry.md`) | Renaming breaks existing route-to-image mappings |
| SmokeCraft brand (dark/gold/obsidian) | `#0a0603` background, `#E9C176` gold | Investor impression locked; redesign requires explicit authorization |
| Feature flag defaults | See `smokecraftFeatureFlagContract.js` | Flags at `false` indicate live integrations not verified; do not set to `true` until verified |
| Production-blocked flags | `productionSync`, `billing`, `whiteLabel`, `marketplaceListing` | These require external dependencies not deployed in this build |
| NavBar z-index (500) | Fixed | Overlap protection; do not lower |

## What Can Still Change

- Bug fixes with documented root cause
- Content copy corrections (with founder approval)
- New routes added after S24 (must update master registry)
- Backend integrations (requires updating feature flags + data contracts)
- New e2e test coverage (additive only — do not reduce test count)

## Process for Any Change to Frozen Elements

1. Document the verified defect or investor feedback triggering the change
2. Update `smokecraftMvp2MasterRegistry.js` to reflect the new state
3. Re-run `node e2e-smokecraft-investor-readiness.mjs` — must stay ≥ 300/300
4. Update `mvp2-visual-image-registry.md` if any asset paths changed
5. Commit with message starting `[CHANGE-CONTROL]`

## Who Can Authorize

- Bug fixes: any contributor with a verified defect report
- Flow order changes: founder authorization required
- Brand changes: founder authorization required
- Feature flag activation: requires verified external integration + founder sign-off
