# 05 — Deployment Verification

## What was verified this pass (real, local)

- Fresh `npm run build` from `HEAD`, `prebuild` hooks ran (asset validation + manifest generation), build succeeded.
- `dist/build-manifest.json` generated with the real current commit, branch, and 27/28 critical assets `ok` (Welcome disclosed missing).
- `/api/version` (local server, real Postgres-backed) returns `backendCommit`/`frontendCommit` matching the manifest exactly, `manifestFound: true`.
- `/build-manifest.json` reachable via the built preview server.
- `/system/build-info` renders live, shows 27 sessions / 6 phases, and correctly reports version parity as a match (since frontend and backend were built from the same local commit in this test).
- The build diagnostic footer renders on every page; `?diagnostics=1` expands the panel; a version-mismatch banner component exists with a non-destructive hard-refresh action (not live-triggered in this pass, since no real mismatch exists locally — verified by source/structure, not by live observation of a mismatch).

## What could NOT be verified — unchanged blocker

Live Railway deployment and verification remain blocked in this session — identical, re-confirmed 403 organization egress policy denial to `crafthub360.up.railway.app`, no Railway CLI/credentials/dashboard access. This pass builds the permanent infrastructure that *would* let a future session (or the user, directly) prove deployment freshness in seconds once real access exists — it does not itself close that gap, because doing so requires access this session does not have.

## What "closing this gate" will look like once access exists

1. Push this pass's commit.
2. Confirm Railway redeploys (dashboard or `/api/version` polling).
3. Open `/api/version`, `/build-manifest.json`, `/system/build-info` — confirm all three report the same commit.
4. Confirm the commit matches this pass's pushed commit hash.
5. Open SmokeCraft in an incognito browser, confirm the build marker is visible and matches.
