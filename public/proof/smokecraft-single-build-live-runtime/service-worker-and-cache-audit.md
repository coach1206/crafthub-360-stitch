# Service worker / cache / dist audit — real findings

## Service worker
- `public/sw.js` **exists** and is deployed (copied into `dist/sw.js`). It is the
  retired "NOVEE OS Phase 11" worker. Its CURRENT content is a self-destructing
  kill switch: `install` and `activate` both delete every Cache Storage bucket and
  `activate` calls `self.registration.unregister()`. It is deliberately KEPT, not
  deleted: removing the file would make `/sw.js` 404, which leaves any browser that
  still holds an old registration stuck with its old worker instead of killing it.
- `src/serviceWorkerRegistration.js` existed and contained a real
  `navigator.serviceWorker.register('/sw.js')` implementation, but **nothing in the
  app imported it** — verified by grep across `src/` and `index.html`. It was dead
  code and a latent landmine (any future import would re-register a worker on a
  route-cached, stale-while-revalidate strategy). **Deleted this pass.**
- No PWA Vite plugin, no `workbox`, no `vite-plugin-pwa` in `vite.config.js` or
  `package.json`. Verified by grep.
- `src/main.jsx` proactively unregisters every service worker registration on
  every page load (pre-existing, from the Production Build Identity pass).
- Verified in a real browser on all 12 tested routes:
  `navigator.serviceWorker.controller` is **null** and
  `getRegistrations().length` is **0**. See `build-id-across-routes.json`.

## Cache Storage
- Unregistering a worker does NOT delete the Cache Storage buckets it created.
  The retired worker used cache name `novee-os-v2` with a **stale-while-revalidate**
  strategy for static assets, which returns a cached hashed JS chunk ahead of the
  network — a genuine mechanism for serving a previous build's code. Any browser
  that ever registered it can still hold that bucket.
- **Fix added this pass:** `src/main.jsx` now also deletes Cache Storage buckets
  whose names start with `novee-os` / `smokecraft` / `workbox` / `crafthub`. It
  touches ONLY Cache Storage by name prefix — localStorage and IndexedDB
  (`novee_guest_session`, `sc_journey_v1`, Passport identity, archived journeys)
  are untouched, so this can never cost a user their journey.
- Verified in a real browser: `caches.keys()` returns `[]` on every tested route.

## dist cleanliness
- `vite.config.js` sets no `build.outDir`, so it defaults to `dist` inside the
  project root, where Vite's `emptyOutDir` defaults to **true**. It is not
  disabled anywhere. `dist` is therefore emptied before every build.
- Only ONE frontend output directory exists in the repo root: `dist`. No stray
  `build/`, `out/`, `.next/`, or second dist-like directory.
- `dist/smokecraft/` and the other `dist/*` subdirectories are `public/` assets
  copied verbatim by Vite, not a second frontend build. `public/smokecraft/`
  contains **images only** — no standalone HTML page and no compiled JS bundle
  (verified by `find`). No route can load an old standalone page from it.

## Static server / cache headers (server/index.js)
- `index.html` and all HTML routes: `no-store, no-cache, must-revalidate,
  proxy-revalidate` + `Pragma: no-cache` + `Expires: 0`. Correct.
- `express.static(..., { index: false })` — express.static never auto-serves
  index.html with its own ETag/Last-Modified, so a conditional 304 cannot
  re-serve stale HTML. Correct, pre-existing.
- The SPA fallback `sendFreshIndexHtml` reads `dist/index.html` from disk **at
  request time** with `cacheControl:false, etag:false, lastModified:false`. It is
  NOT cached in server memory at startup. Correct, pre-existing.
- Hashed immutable assets (`/assets/<name>-<8 hex>.js|css`):
  `public, max-age=31536000, immutable`. Correct and intentionally preserved.
- `/api/version` and `/system/build-info` data: `no-store`. Correct.
- **Real defect found and fixed this pass:** `public/smokecraft/` is copied into
  `dist`, so a request for the SPA route `/smokecraft` matched a real DIRECTORY and
  `express.static` answered **301 Moved Permanently → /smokecraft/**. A 301 is the
  most persistently cached response a browser stores, and it was being emitted for
  the module's primary entry route. Fixed with `redirect: false`, so `/smokecraft`
  now falls through to the no-store SPA fallback. Verified: was `301`, now `200`
  with `no-store`.

## Build identity
- One build ID derived from the git commit (Railway/Vercel/GIT env var, then local
  `git rev-parse`) and embedded via Vite `define` into the JS bundle
  (`window.__SMOKECRAFT_BUILD__`, `src/generated/buildInfo.js`), the build
  manifest, `/api/version`, and `/system/build-info`. Pre-existing and still
  correct — verified, not rebuilt.
- Verified in a real browser: all 12 routes + `/system/build-info` report the SAME
  commit, and it equals `/api/version`'s `backendCommit`, before and after
  navigation and refresh.
