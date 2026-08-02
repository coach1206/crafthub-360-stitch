# Production Package 4 — Domains/TLS, Session/Cookie/Proxy, CORS

## Domain conventions (documented pattern — no real domain claimed/purchased here)
- Production app: `https://app.<realdomain>` (or the bare apex, per operator choice)
- Staging app: `https://staging.<realdomain>`
- Media/CDN: `https://media.<realdomain>` → fronts the R2 bucket
  (`STORAGE_CDN_URL`)
- Webhooks: `https://app.<realdomain>/api/webhooks/stripe` — same host as
  the API, no separate webhook subdomain (keeps the raw-body/no-CORS
  handling in one well-understood route, not split across hosts)
- No fake "approved" domain is asserted anywhere in this repo — every
  reference uses `APP_PUBLIC_URL`/`STORAGE_CDN_URL` env vars or the literal
  placeholder `smokecraft.example.com` in docs.

## TLS
- Railway terminates TLS automatically for both the platform subdomain and
  any custom domain attached via its dashboard (Let's Encrypt-backed,
  auto-renewed — no manual cert management).
- Cloudflare terminates TLS for the R2/CDN domain the same way.
- `envValidator.js` requires `APP_PUBLIC_URL` to start with `https://` in
  production — an `http://` value now fails startup (new in this pass).

## HSTS / secure headers
Already established in `server/config/securityHeaders.js` from an earlier
pass — this pass did not need to re-add it, only confirmed (by reading the
file) that HSTS/X-Content-Type-Options/frame protections/referrer-policy
are all present and unconditional in production. Not re-copied here to
avoid drift between two "sources of truth" — see that file directly.

## Session/cookie/proxy config
- `trust proxy` is set to `1` in production (`server/index.js`) — correct
  for a single reverse-proxy hop (Railway's edge), so `req.ip` and
  `req.protocol` resolve from the trusted `X-Forwarded-*` headers without
  being spoofable by the client directly.
- `AUTH_COOKIE_SECURE` is hard-forced `true` in production in
  `server/config/authConfig.js` regardless of the env var (defense in
  depth) — `envValidator.js` additionally errors if an operator's `.env`
  explicitly sets `AUTH_COOKIE_SECURE=false` in production, so the
  operator's own config can never even *claim* otherwise.
- `httpOnly` cookies, `SameSite=lax` — unchanged from the existing config,
  appropriate for a single-domain app (no cross-site cookie requirement).
- No redirect loops behind the proxy: `trust proxy=1` means Express sees
  the real `X-Forwarded-Proto`, so any `req.secure`-based redirect doesn't
  loop against Railway's internal HTTP-to-the-app hop.

## CORS
- `CORS_ORIGIN` must be a single real `https://` origin in production —
  wildcard (`*`) or `true` is a hard startup failure (`envValidator.js`,
  pre-existing from Package 1, re-verified this pass).
- Webhook routes (Stripe) are intentionally NOT behind the general CORS
  middleware — they're server-to-server calls with signature verification,
  not browser calls, so CORS doesn't apply and adding it would be a no-op
  at best, a false sense of security at worst. Confirmed this is still the
  case by reading the webhook route registration order in `server/index.js`.
- Admin endpoints are mounted under the same CORS policy as the rest of the
  API (single approved frontend origin) — never a separately-permissive
  policy for `/api/admin/*`.
