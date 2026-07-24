# 07 — Rollback Plan

## Files changed/added this pass

`vite.config.js`, `src/generated/buildInfo.js` (new), `src/constants/assetVersion.js` (new), `src/constants/smokecraftAssets.js` (2-line addition), `scripts/validateSmokecraftAssets.mjs` (new), `scripts/generateBuildManifest.mjs` (new), `package.json` (`prebuild` script added), `server/controllers/healthController.js`, `server/routes/healthRoutes.js`, `server/index.js`, `src/components/system/BuildDiagnosticFooter.jsx` (new), `src/pages/system/BuildInfo.jsx` (new), `src/App.jsx` (2 imports + 2 mount points), `src/main.jsx` (comment only), `.gitignore` (1 line), `verify-smokecraft-production-build-identity.mjs` (new).

## Risk profile

Low. No existing route, guard, journey-state, or asset-selection logic was changed — every change is additive (new files, new query-string suffix on asset URLs, new response fields on `/api/version`, new cache-header branch, new UI element that renders on top of, not instead of, existing content).

## Rollback

`git revert <this pass's commit>` cleanly removes all of the above. The one thing to note: `public/build-manifest.json` is gitignored and regenerated on every build — a revert does not need to (and cannot) "undo" a specific manifest file's content, since it is never committed.

## Failure modes considered

- **If `RAILWAY_GIT_COMMIT_SHA` is unset on Railway for any reason:** `vite.config.js` falls back to `git rev-parse HEAD` inside the build container — still a real, correct commit as long as Railway's build step has a real `.git` checkout (standard for git-based deploys). Only a fully git-less production build environment would trigger the new build-refusal error.
- **If `dist/build-manifest.json` is missing at runtime** (e.g., server started without a preceding `npm run build`): `/api/version` falls back to the original env-var-only behavior, `manifestFound: false` — never crashes, never fabricates a value.
- **If the diagnostic footer's `/api/version` fetch fails:** caught, logged nowhere destructive, the footer still renders the frontend-only identity; the real user journey is never blocked (confirmed by design — no `await` blocks initial render).
