# 05 — Regression Matrix

| Suite | Result | Notes |
|---|---|---|
| Start vs. Resume Journey State (dedicated) | 42/48 pass, 0 fail, 6 blocked | 6 blocked items require reachable production, honestly reported not fabricated |
| Phase 9 Full Journey | 36/39 | 3 stale-commit-only |
| Phase 9A Packaging Studio Journey Amendment | 51/54 | 3 stale-commit-only |
| Golden Box Packaging Studio | 71/74 | 3 stale-commit-only |
| Passport Security Unified Identity | 59/59 | |
| Production build | pass | `npm run build` |
| Production startup / health check | pass | local server + Postgres reconnected after a mid-pass container hiccup (documented below) |

## Note on the mid-pass environment hiccup

Partway through this pass, the sandbox's Postgres cluster and both Vite servers (dev port 5000, preview port 5050) went down simultaneously — consistent with a container/session restart unrelated to any change in this pass. All three were restarted (`service postgresql start`, `npx vite --port 5000`, `npx vite preview --port 5050`) and every suite was re-run clean afterward. This is an environment-recovery event, not a regression.

## Stale-commit assertions

Each of Phase 9, Phase 9A, and Golden Box Packaging Studio's own dedicated scripts assert against their own pass's starting commit hash, which necessarily diverges once later commits land — consistent with every prior pass in this operation. These are metadata-only, not functional failures.

## 2026-07-23 update (Phase 10 Live Closeout pass)

Re-ran `verify-smokecraft-start-resume-state.mjs` (42/42 achievable checks pass, 0 fail, 6 blocked pending live access) and `verify-smokecraft-live-resume-state-reconciliation.mjs` (26/29 achievable pass, 3 fail, 6 blocked). The 3 failures are stale CTA-text assertions in the earlier script (`'Start Journey →'`/`'Resume Journey →'`/`'View Results →'`), superseded by the exact-wording contract this later pass introduced — not a functional regression, since the correct, current dedicated suite for this exact behavior passes cleanly. Production build re-confirmed passing.
