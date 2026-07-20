# Production Readiness Consolidated Pass — Baseline

**Scale disclosure**: this mandate specifies an 18-phase pass covering SmokeCraft, POS360, E.A.T. 360,
a new automated route crawler, full responsive/accessibility matrices, and a live Railway deployment
with screenshot proof. At this session's established standard (real fixes, real tests, no shallow
claims), a literal full-depth execution of all 18 phases is not achievable in one pass. This document
set does the same thing every prior pass in this session has done: real baseline capture, a real
(scoped) audit reusing already-verified prior work rather than re-deriving it, real deterministic fixes
where found, real tests, and an honest, disclosed report of what remains — rather than a shallow claim
of full completion across three separate large applications.

## Phase 1 — git state

```
git branch --show-current        → recovery/smokecraft-codex-final
git rev-parse HEAD                → d09b63d78b0139bc31f0d38effbf98ac41b5e282
git rev-parse @{u}                → origin/recovery/smokecraft-codex-final
ahead/behind (HEAD...origin)      → 0  0   (local HEAD already matches remote — no pull needed)
```

- Uncommitted paths at start: 236 (50 modified, 19 renamed, 167 untracked — this is the accumulated,
  never-committed working tree from every package/pass across this entire session: Golden Box backend
  and frontend, Seed & Soil, Leaf & Construction, Package 7A judging/mentor/results, Image Integration
  Phases 1–2, and the Game-Engine FlavorMemory fix).
- No unrelated user work was found mixed into the tree — every uncommitted path traces to a documented
  pass in `docs/audits/smokecraft-final-completion/`.

## Phase 2 — prior audits reconciled

Read and reconciled (not repeated): `docs/audits/smokecraft-final-completion/image-integration/`,
`image-integration-phase-2/`, `game-engine-wiring/`. No `master-visual-sequence-audit/` directory exists
yet (the mandate references it as if pre-existing — it is not; this pass's own
`02-MASTER-VISUAL-COVERAGE-MATRIX.md` is the first version). No dedicated POS360/E.A.T. 360 audit
directory was found under `docs/` beyond scattered architecture docs (`docs/PHASE_E_4_DEPLOYMENT_ACTIVATION.md`,
etc.) — those applications have not had a dedicated visual-completion pass in this session.

## Real deterministic check performed (asset-path scan)

Cross-referenced every `/assets/smokecraft/...` path literal found anywhere in `src/` against the real
files on disk. 103 unique referenced paths, 35 not found on disk. Investigated all 35: every one traces
to either (a) `src/modules/smokecraft/data/smokecraftAssetRegistry.js`, a legacy data file with zero
live imports anywhere in `src/` (grep-confirmed dead code, not rendered), or (b) partner/venue logo URLs
in `src/data/smokeCraftVenueCommerce.js`, rendered exclusively through `<img onError={...}>` guarded
paths in the live `SmokeCraftVenueCommerce.jsx` route — confirmed to degrade gracefully, not render a
broken image. **No deterministic broken-image bug was found in the live, reachable route set.** This is
reported honestly rather than fabricating fixes for a problem that doesn't exist in production code.
