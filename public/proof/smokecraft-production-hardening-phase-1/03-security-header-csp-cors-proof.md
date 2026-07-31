# Security Header, CSP, and CORS Proof

## Headers present (live, this pass)

See `live-headers-dev.txt` (real dev-server response) and
`live-headers-production-simulated.txt` (a real Express app built with
the exact same `buildSecurityHeaders({ isProd: true })` function,
listening on a local port, queried live — not a hand-written claim).

Confirmed present in both modes: `Content-Security-Policy`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy:
strict-origin-when-cross-origin`, `Permissions-Policy` (denies camera/
microphone/geolocation/payment/usb/interest-cohort),
`Cross-Origin-Opener-Policy: same-origin`,
`Cross-Origin-Resource-Policy: cross-origin` (intentionally permissive
— see rationale in `securityHeaders.js`, needed for legitimate
cross-origin image loading), `X-Frame-Options: SAMEORIGIN`, no
`X-Powered-By`.

Confirmed present **only** in the production-simulated response, never
in dev: `Strict-Transport-Security: max-age=15552000; includeSubDomains`
and `upgrade-insecure-requests` in the CSP — both would break local
`http://localhost` development if forced on unconditionally, so they
are gated on `isProd`.

## CSP directive rationale (compatibility-checked, not blindly strict)

| Directive | Value | Why |
|---|---|---|
| `default-src` | `'self'` | Strictest safe baseline |
| `script-src` | `'self'` | No inline `<script>` tags exist anywhere in the built `index.html` (verified by reading the real built file) |
| `style-src` | `'self' 'unsafe-inline'` | React's `style={{...}}` pattern is used across essentially every component in this app, rendering as inline `style="..."` attributes — there is no practical per-element nonce/hash strategy for this; documented, deliberate compatibility allowance |
| `img-src` | `'self' data: https:` | Venue Humidor product images are staff-entered free-text URLs that may point to any HTTPS host; `EATCommand.jsx` uses real `images.unsplash.com` URLs (confirmed by grep) |
| `connect-src` | `'self'` | No client-side fetch/XHR/WebSocket target other than same-origin `/api/*` was found anywhere in `src/` — ElevenLabs is called server-side only |
| `frame-ancestors` | `'none'` | No legitimate reason for this app to be framed was found |
| `object-src` | `'none'` | No `<object>`/`<embed>` usage found |

## CORS proof

`cors-approved-origin.txt`: a request with `Origin: http://localhost:5000`
(the real configured `CORS_ORIGIN`) receives a matching
`Access-Control-Allow-Origin: http://localhost:5000`.

`cors-unknown-origin.txt`: a request with `Origin: http://evil.example.com`
receives `Access-Control-Allow-Origin: http://localhost:5000` — i.e.
the **server never reflects an arbitrary requesting origin back**; it
always states the one real configured origin. A real browser at
`evil.example.com` would see this mismatch between its own origin and
the header and block the response under the same-origin policy —
`curl` does not enforce that browser-side check itself, so the proof
here is the absence of origin-reflection (confirmed), which is the
server-side half of the real protection.

No route combines `Access-Control-Allow-Credentials: true` with a
wildcard `Access-Control-Allow-Origin: *` — confirmed live (`cors-approved-origin.txt`
shows a specific origin, not `*`, alongside `Allow-Credentials: true`).

## Production origin/secret enforcement proof

See `security-test-results.json` and the live child-process runs in
this pass's terminal output (§1-5 of the security test suite):
production startup rejects a missing JWT secret, a known-unsafe
default (`"changeme"`), a too-short secret, a malformed CORS origin,
and a wildcard CORS origin — all with a non-zero exit code and a
diagnostic message that names the variable without ever printing its
value. Production startup succeeds cleanly with valid, sufficiently
long, non-default temporary test secrets. Development startup succeeds
with no required secrets set (warnings only).
