# 01 — Baseline

## Starting state (confirmed before any work began)

- Branch: `recovery/smokecraft-codex-final`
- Starting commit: `c727c0f9f4adcbebc5b4a2e228f506d3c988eb0d`
- `git status`: clean (no untracked/modified files)
- Local `HEAD` == `origin/recovery/smokecraft-codex-final` == `c727c0f9...`

All three baseline conditions from the mandate were verified directly via
`git status`, `git rev-parse HEAD`, and `git rev-parse
origin/recovery/smokecraft-codex-final` before any other action was taken.

## What this package inherits (not re-derived, per pragmatic scope)

- All 27 sessions / 22 distinct completion ids, real server-authoritative
  completion via `POST /api/smokecraft/player-state/sessions/:id/complete`
  — see `src/constants/smokecraftRequiredInteractions.js` and
  `public/proof/smokecraft-full-game-fresh-player-closure/01-canonical-27-session-map.md`.
- A full, real, API-driven fresh-player run (62/62 assertions,
  `scripts/verify-smokecraft-full-game-fresh-player.mjs`) and a UI smoke
  pass already proved Golden Box and the 27-session spine are functionally
  complete end-to-end.
- This package does not reopen that functional/backend proof. It adds a
  visual/UX investor-demo-readiness layer on top: real screenshots, a
  documented investor demo path, live-data-honesty checks, and a targeted
  defect hunt limited to genuinely investor-visible acceptance blockers.

## Environment stood up for this pass

- PostgreSQL 16 (`crafthub_smokecraft_final`) — started via `service postgresql start`.
- Backend API — `node server/index.js` on port 3001 (development mode; rate
  limiting exempted in dev per existing `IS_PROD` convention).
- Production build — `npm run build` (Vite), served via `vite preview` on
  port 5050 for the real-browser Playwright walk (a build target, not the
  dev server, matching the prior UI-smoke-pass precedent).
