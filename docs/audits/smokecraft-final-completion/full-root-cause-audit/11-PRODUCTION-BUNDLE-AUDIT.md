# 11 — Production Build Content Audit

Build run fresh this pass: `rm -rf dist && npm run build` — **succeeded, 0 errors**, ~3 minutes (large asset volume, ~1.6GB output — expected, this repo bundles hundreds of high-resolution approved images verbatim via `public/`).

## `dist/index.html` (verified present and correct — see note below)

Real, correct SPA shell: single `<script type="module">` entry (`assets/index-961d58b8.js`), single stylesheet, correct title (`NOVEE OS | CraftHub 360`), correct manifest link, `<div id="root">`. No stale/duplicate entry point found.

**Note on this pass's process:** an interim build attempt in this pass was interrupted mid-write by a container restart, leaving a transient `dist/` with no `index.html` — this was correctly diagnosed as a container-restart artifact (confirmed by disk space being ample, 24G free) and resolved by re-running the build clean, not treated as a real defect.

## Key entry assets confirmed present with exact correct filename case in the built output

```
dist/assets/smokecraft-reference/approved/smokecraft-landing.png     ✓
dist/assets/smokecraft-reference/approved/smokecraft-guest-pass.png  ✓
dist/assets/smokecraft/IDENTY.png                                    ✓
dist/assets/smokecraft/Venue Selection 11.png                        ✓
dist/assets/smokecraft/MENTOR SELECTION1.png                         ✓
```

SHA-256 manifest for these five (proof: `public/proof/smokecraft-full-root-cause-audit/production-bundle-manifest.txt`):

```
f817ab40... smokecraft-landing.png
5c798061... smokecraft-guest-pass.png
00668504... IDENTY.png
b17463c6... Venue Selection 11.png
e585d1c6... MENTOR SELECTION1.png
```

## Verification results

- **Expected images copied into the build:** confirmed for all 5 spot-checked entry assets, and for all 27 session assets (their existence-on-disk was already re-confirmed programmatically in `03-ROUTE-ASSET-TRUTH-TABLE.md`, and `public/` is copied to `dist/` verbatim by Vite with no filtering — so disk-existence in `public/` is equivalent to bundle-presence).
- **Filename case preserved:** confirmed — Vite's `publicDir` copy is a verbatim filesystem copy, no case-folding observed (`Venue Selection 11.png`, `IDENTY.png`, `MENTOR SELECTION1.png` all retain their exact original case in `dist/`).
- **No stale unauthorized asset bundled as "active":** N/A to re-check — bundling is not selective; every file in `public/` is copied regardless of whether it is registered. This means the *bundle itself* cannot distinguish "active" from "reference-only" — that distinction lives entirely in `SC_ASSETS` (the registry) and each component's import, both already audited (`02`, `03`). The bundle audit's job is only to confirm nothing required is *missing*, which is confirmed.
- **Correct route components present:** confirmed — the single `index-961d58b8.js` bundle is the one and only frontend entry; there is no secondary/duplicate build output.
- **Correct commit/version embedded:** `/api/version` reads `process.env.RAILWAY_GIT_COMMIT_SHA` at *runtime*, not at build time — so the frontend build itself does not embed a commit hash (confirmed: no `import.meta.env.VITE_COMMIT` or similar was found referenced anywhere in `src/`). This means commit identity is entirely a **backend runtime environment variable**, set by Railway automatically — the bundle itself carries no independent proof of which commit built it. This is a minor, disclosed architectural gap: **the frontend bundle has no self-describing build/commit marker of its own.**
- **Service worker / cache headers:** `dist/offline.html` and `manifest.webmanifest` exist (PWA scaffold), but `src/main.jsx` unconditionally unregisters any active service worker on every load (confirmed, `08-HYDRATION-AND-TIMING-AUDIT.md`) — so no service worker should be pinning stale assets in any browser that has loaded the current build at least once. Whether Railway's own HTTP cache headers (separate from the service worker) could cause a CDN/browser to serve stale files is **unverifiable from this session** (would require inspecting live response headers).
- **Asset hashes changing when images change:** confirmed for the JS/CSS bundles (Vite content-hashes `index-*.js`/`index-*.css` filenames, forcing a fresh fetch on any code change) — but **images copied from `public/` keep their original filenames with no content hash** (Vite's documented `publicDir` behavior: files are copied verbatim, unhashed). This means **if an approved image file were replaced in-place with new bytes but the same filename, a browser or CDN caching that exact URL by filename could keep serving the old image bytes indefinitely**, with no cache-busting mechanism. This is a real, disclosed architectural gap distinct from the JS/CSS bundle's cache-safety, and a plausible contributor to "the repo has the right image but the user still sees the old one."

## Conclusion

The production bundle, built fresh from current `HEAD`, is internally correct and complete — no missing asset, no wrong-case filename, no stale unauthorized asset displacing a registered one. Two genuine, disclosed architectural gaps were found that could explain live/repo disagreement independent of any source code defect: (1) the frontend bundle carries no self-describing commit identity of its own, relying entirely on a backend runtime env var; (2) `public/`-sourced images are unhashed and have no cache-busting, unlike the hashed JS/CSS bundle.
