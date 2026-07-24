# 13 — Permanent Remediation Plan

Not implemented in this pass (audit-only, per the mandate's explicit no-fixes rule). Ordered by dependency — Package 1 must happen before any later package's result can be trusted.

## Package 1 — Establish real deployment evidence (blocks everything else)

**Scope:** obtain, from outside this session, one of: a Railway dashboard screenshot of Deployments showing the deployed commit SHA, authenticated Railway CLI output (`railway status`/`railway logs`), or a direct user-supplied response from `https://crafthub360.up.railway.app/api/version`.
**Files:** none — this is not a code change.
**Dependencies:** none.
**Tests/proof:** the `/api/version` response itself, compared against `git log` on `recovery/smokecraft-codex-final`.
**Rollback:** N/A.
**Completion gate:** the deployed commit is known and matches (or is proven to lag) `HEAD`.

## Package 2 — Cache-bust static image assets

**Scope:** give `public/`-sourced SmokeCraft images a content-hash or version-query mechanism so a corrected image is guaranteed to bypass any stale browser/CDN cache, matching the safety the JS/CSS bundle already has.
**Files:** `vite.config.js` (asset handling), `src/constants/smokecraftAssets.js` (path generation), possibly a build-time asset-copy step.
**Dependencies:** Package 1's evidence should confirm this is actually needed (i.e., that a redeployed fix commit still shows old images) before spending effort here — if Package 1 shows deploys were simply never happening, this package is lower priority.
**Tests:** a new check that an image's served URL changes when its file content changes.
**Rollback:** revert the hashing mechanism; images continue working, just without cache-busting.
**Completion gate:** a locally-simulated "old cached image, new deployed file" scenario is proven to resolve to the new file.

## Package 3 — Embed a frontend build/commit marker

**Scope:** add a build-time constant (e.g., `import.meta.env.VITE_COMMIT_SHA`, injected from `RAILWAY_GIT_COMMIT_SHA` at build time) rendered somewhere inspectable (a hidden meta tag, a dev-only footer, or exposed via a small `window.__BUILD__` object) so the frontend bundle itself — not just the backend `/api/version` — can self-report what commit built it.
**Files:** `vite.config.js`, `src/main.jsx` or a new small module.
**Dependencies:** none.
**Tests:** a new check that the built `dist/index.html` (or a bundled JS chunk) contains the expected marker after a build with `VITE_COMMIT_SHA` set.
**Rollback:** trivial — a single added constant.
**Completion gate:** the marker is present and correct in a fresh production build.

## Package 4 — Trace and, if needed, fix server-side Start New Journey scoping

**Scope:** confirm whether Golden Box/Packaging Studio server-persisted state is correctly archived (not left orphaned/reachable) when a guest starts a new journey; fix if it is not.
**Files:** likely `useStartNewSmokeCraftJourney.js` (add a server call) and the relevant Golden Box/Packaging Studio route handlers.
**Dependencies:** none technically, but should follow Package 1 so effort isn't spent on a symptom that turns out to be purely deployment-lag.
**Tests:** a new suite verifying a guest's Golden Box draft is inaccessible/archived after Start New Journey.
**Rollback:** revert the added server call; existing behavior (whatever it currently is) returns.
**Completion gate:** Golden Box state after Start New Journey is proven either correctly isolated or correctly archived.

## Package 5 — Live verification pass (final gate, requires Package 1's access)

**Scope:** once real deployment access exists (Package 1), re-run the existing local test suites' equivalent checks against the actual live URL — confirm entry visuals, session sequence, and journey-state behavior match what has been repeatedly verified locally.
**Files:** none new required — existing `verify-smokecraft-*.mjs` suites can be pointed at the live URL if access is confirmed.
**Dependencies:** Package 1 (mandatory), Packages 2–4 (recommended first, so the live check isn't testing against known gaps).
**Rollback:** N/A.
**Completion gate:** live entry visuals, 27-session sequence, and Start/Resume/Start New all verified against the actual production origin, matching every local finding in this operation's history.

## Recommended next execution prompt

Do not resume page-level patching. The single highest-leverage next step, based only on this audit's confirmed evidence, is: **obtain real Railway deployment access or evidence (Package 1) before authorizing any further code change** — every other package's priority depends on knowing whether the live symptom is a deployment gap or a genuine remaining code defect, and this audit cannot distinguish the two without it.
