# 01 — Build Identity Architecture

## Root cause this closes

The prior root-cause audit found `vite.config.js` only checked `VERCEL_GIT_COMMIT_SHA` — a Vercel-specific variable — never `RAILWAY_GIT_COMMIT_SHA` (the real variable Railway sets). On Railway, this meant the existing `window.__SMOKECRAFT_BUILD__` diagnostic silently fell back to a local `git rev-parse HEAD` executed inside Railway's own build container, which is *not wrong* per se (it is still the real commit being built) but was never confirmed correct and, more importantly, was never exposed anywhere a human or a test could check it against the backend.

## Architecture

- **`vite.config.js`** resolves one canonical commit/branch/timestamp at build time, in priority order: `RAILWAY_GIT_COMMIT_SHA` → `VERCEL_GIT_COMMIT_SHA` → `GIT_COMMIT_SHA` → local `git rev-parse HEAD` → refuse the build (production mode only). Injects 8 `__BUILD_*__` constants via Vite's `define`.
- **`src/generated/buildInfo.js`** is the one module every consumer (frontend components, build scripts) imports. It reads the `__BUILD_*__` constants when bundled by Vite (browser context) and falls back to the same environment variables directly when imported under plain Node (build scripts run before Vite, e.g. `scripts/generateBuildManifest.mjs`) — using `typeof` checks on the identifiers themselves, which Vite's `define` performs textual substitution on, so the same source file is correct in both contexts without duplicating the priority logic.
- **`server/controllers/healthController.js`**'s `/api/version` reads `dist/build-manifest.json` **at request time**, not from its own independently-set env vars — this guarantees `/api/version` and `/build-manifest.json` can never disagree with each other about what a specific running server process is serving, by construction.

## Why this specific design (not a simpler one)

A simpler design (e.g., only exposing `/api/version` from env vars, with no manifest file) would still leave the frontend bundle with no way to prove its own identity independently — the original problem. A design with two independently-computed identity sources (one for frontend, one for backend, never cross-checked) would reintroduce exactly the "can't tell if they agree" gap this pass exists to close. Reading the same manifest file from both the static-file endpoint and the API endpoint is the smallest mechanism that makes disagreement structurally impossible rather than merely unlikely.
