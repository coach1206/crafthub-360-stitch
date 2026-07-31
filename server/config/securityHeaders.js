/**
 * Production Hardening Phase 1 — canonical security-headers
 * configuration, applied once at the top of the Express middleware
 * chain (before CORS/body-parsing/routes). Built on `helmet` rather
 * than hand-rolled header-setting, and scoped to what this
 * application's own real behavior requires — never a blanket
 * "strictest possible" preset applied without checking compatibility.
 *
 * Compatibility findings this configuration is based on (verified by
 * source inspection, not assumed):
 *   - No inline <script> tags exist in the built index.html (Vite
 *     emits only a single external module script) — script-src 'self'
 *     needs no 'unsafe-inline'/'unsafe-eval' allowance.
 *   - Every component uses React inline `style={{...}}` objects,
 *     which render as `style="..."` attributes on thousands of
 *     elements across the app — style-src therefore DOES require
 *     'unsafe-inline' (there is no practical per-element nonce/hash
 *     strategy for React inline styles); this is a documented,
 *     deliberate compatibility allowance, not an oversight.
 *   - Venue Humidor product images (`primary_image_url`/
 *     `secondary_image_url`) are staff-entered free-text URLs that may
 *     point to any HTTPS host, and `EATCommand.jsx` uses real
 *     `images.unsplash.com` URLs — img-src therefore allows `https:`
 *     broadly (still blocks plaintext `http:` and `data:`-smuggled
 *     script execution vectors), plus `data:` for inline/generated
 *     images already used elsewhere in the app.
 *   - No client-side fetch/XHR/WebSocket target other than same-origin
 *     `/api/*` was found (ElevenLabs is called server-side only, from
 *     `server/services/voiceService.js` — never from the browser) —
 *     connect-src is 'self' only.
 *   - No `<iframe>`/embed usage or legitimate reason for this app to be
 *     framed was found — frame-ancestors 'none' and X-Frame-Options
 *     equivalent via CSP.
 *   - No camera/QR/microphone/geolocation API usage was found anywhere
 *     in `src/` — Permissions-Policy denies all of them.
 */
import helmet from 'helmet'

export function buildSecurityHeaders({ isProd }) {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        // Deliberate compatibility allowance — see module docstring.
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        // Vite dev/preview servers are plain HTTP locally; helmet's
        // own CSP defaults include upgrade-insecure-requests
        // unconditionally (it MERGES this directives object with its
        // defaults unless told otherwise), which would instruct local
        // browsers to upgrade http://localhost subresource requests to
        // https and break dev — explicitly null it out in
        // non-production to override the default, only force it in
        // production where the app is always served over HTTPS behind
        // the platform's TLS edge.
        upgradeInsecureRequests: isProd ? [] : null,
      },
    },
    // HSTS only makes sense once the app is actually served over HTTPS
    // (production, behind the platform TLS edge) — sending it in local
    // HTTP development would incorrectly instruct browsers to upgrade
    // http://localhost to https://localhost, breaking dev entirely.
    hsts: isProd
      ? { maxAge: 15552000 /* 180 days */, includeSubDomains: true, preload: false }
      : false,
    // Cross-Origin-Embedder-Policy defaults off in helmet already —
    // left off explicitly: enabling it would block the real, legitimate
    // cross-origin product/menu images (unsplash, staff-supplied URLs)
    // documented above, none of which send CORP headers we control.
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    // helmet removes X-Powered-By by default; explicit here for clarity.
    hidePoweredBy: true,
  })
}

/**
 * Permissions-Policy — no camera/microphone/geolocation/USB/payment
 * API usage exists anywhere in this app (verified by grep across
 * src/); deny all of them. Applied as a raw header since helmet's own
 * Permissions-Policy support was removed in v7+ (intentionally left to
 * the app, per helmet's own documentation).
 */
export function permissionsPolicyHeader(_req, res, next) {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()'
  )
  next()
}

/**
 * Cache-Control for authenticated JSON API responses — prevents a
 * shared/browser cache from retaining another user's order history,
 * receipt, or admin data after they log out on a shared device. Static
 * built assets (served separately via express.static) are unaffected —
 * this only applies to the /api mount.
 */
export function noStoreForApi(req, res, next) {
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store')
  }
  next()
}
