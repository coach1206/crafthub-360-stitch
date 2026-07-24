# 03 — Cache Policy

## Finding before this pass

`server/index.js` applied a single blanket `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate` to every non-`/api/` response — including the content-hashed JS/CSS bundle, which was safe (no staleness risk) but gave zero caching benefit despite Vite already guaranteeing a new filename on every content change. This was confirmed **not** the cause of any reported stale-image symptom (no-store prevents caching entirely) — if anything it ruled out HTTP-cache-layer staleness as an explanation, strengthening the deployment-identity-uncertainty hypothesis from the root-cause audit.

## Policy now in effect (`server/index.js`)

| Resource type | Header | Rationale |
|---|---|---|
| `/api/*` | unaffected by this middleware; `/api/health` and `/api/version` explicitly `no-store` (added this pass, `healthRoutes.js`) | Version/health checks must never be cached |
| Content-hashed JS/CSS (`/assets/<name>-<8-hex>.js\|css`) | `public, max-age=31536000, immutable` (new) | Filename changes on every content change — safe to cache for a year |
| HTML (`index.html`, served via `sendFreshIndexHtml`) | `no-store, no-cache, must-revalidate, proxy-revalidate` (unchanged) | Must always fetch fresh so a new deploy is visible immediately |
| Unhashed static images (`public/assets/smokecraft/...`) | `no-store, no-cache, must-revalidate, proxy-revalidate` (unchanged) — now additionally cache-busted via `?v=<assetVersion>` query string (`02-ASSET-VERSIONING.md`) | Belt-and-suspenders: HTTP headers prevent caching today; the version query string protects against any future header change or an intermediary that ignores `Cache-Control` |
| `/build-manifest.json` | `no-store` (inherits the general non-API rule, unchanged) | Must always reflect the currently-running build |

## Verification

`server/index.js`'s `HASHED_ASSET_RE` regex tested against real built filenames (`index-bf2b65e1.js`, `Admin-a37f7169.js`, etc. from this pass's fresh build) — confirmed matches. Non-hashed paths (`index.html`, `/assets/smokecraft/*.png`) confirmed do not match, so they retain the strict no-cache path.
