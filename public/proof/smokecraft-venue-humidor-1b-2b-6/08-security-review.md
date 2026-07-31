# Venue Humidor Security Review — Venue Humidor 1B-2B-6

This is a focused review of the Venue Humidor vertical slice, not a
full application security certification. Checks performed and exact
results below — nothing here is asserted without a corresponding
command/test run in this pass.

## Authentication / session handling
- Reused unchanged: `requireAuth` (JWT session), `requireRole`, and the
  SmokeCraft guest-identity middleware (`smokecraftGuestIdentity.js`) —
  no new authentication mechanism was introduced anywhere in Venue
  Humidor across any package.
- Session cookie: `httpOnly: true`, `sameSite` set from
  `authConfig.AUTH_COOKIE_SAMESITE` (confirmed via source read of
  `server/middleware/smokecraftGuestIdentity.js:47-49`).
- Session expiration: exercised live in every prior package's browser
  suite ("session expired" honest UI state) — reconfirmed passing in
  this pass's full regression run (`05-full-browser-regression.log`).

## RBAC / venue membership
- Live probe (this pass): unauthenticated `GET .../admin/orders` → 403;
  unauthenticated `POST .../assisted-selling/outcome` → 403 (see
  `07-rbac-matrix.md`).
- Automated cross-role denial assertions already exist and re-passed in
  every 1B-2B-1 through 1B-2B-5 API suite this pass re-ran clean
  (`03-full-api-regression.log`).

## Cross-venue / cross-customer access (IDOR)
- Every resource route enforces `requireResourceVenueMatch()` (product/
  hold/reservation/order all independently re-verified against the
  URL's `:venueId`, not just membership in *a* venue) — confirmed by
  source read of `server/routes/venueHumidorRoutes.js:44-56`.
- Cross-customer order/receipt/acquisition/preference denial is
  re-asserted live in this pass's full regression run: 1B-2B-4 API §1-3
  and §12 (order/receipt/acquisition ownership 403), 1B-2B-5 API §3, §11,
  §12 (cross-venue product exclusion, cross-venue staff denial,
  cross-customer preference isolation) — all passing.

## Mass assignment
- `productService.js` uses a single `EDITABLE_FIELDS` allow-list
  (`server/services/venueHumidor/productService.js:26-34`) for both
  create and update — a request body field not on that list is never
  written to any column. No Venue Humidor write path builds a query
  from `Object.keys(req.body)` directly.

## SQL injection
- Grep of every `server/services/venueHumidor/*.js` and
  `server/controllers/venueHumidor*.js` file for a template-literal SQL
  string interpolating anything other than a numbered `$n` placeholder
  found zero matches — every query is parameterized.

## XSS
- No `dangerouslySetInnerHTML` usage anywhere under
  `src/pages/smokecraft/venueHumidor/` (grep confirmed, zero matches).
  All customer/staff-supplied text (tasting notes, cancellation
  reasons, order notes) renders through normal React text nodes, which
  escape by default.

## CSRF
- Session cookie uses `sameSite` (see Authentication above); all
  mutating Venue Humidor routes are POST/PATCH with JSON bodies (not
  simple GET-triggerable forms), which is the existing app-wide CSRF
  posture — unchanged by this pass, not newly introduced or newly
  reviewed as a standalone control.

## Rate limiting
- Every Venue Humidor route file applies `readLimiter`/`writeLimiter`
  (express-rate-limit) — confirmed present on 47 routes in
  `venueHumidorRoutes.js` and 28 in `venueHumidorCustomerRoutes.js`
  (grep count, this pass). Limiters are skipped only in non-production
  (`skip: () => !IS_PROD`), which is an intentional, existing
  dev-ergonomics tradeoff, not a gap introduced this pass.

## Pickup-code guessing protection
- bcrypt-hashed (`SALT_ROUNDS`), never stored or logged in plaintext
  (confirmed by source read, `fulfillmentService.js`); rate-limited to
  5 attempts before auto-block; expires after 24h; invalidated
  immediately on completion. Unchanged since 1B-2B-3, re-verified
  passing in this pass's regression run.

## Payment-data / internal-note redaction
- `CUSTOMER_INTERNAL_FIELDS` redaction (pickup-code hash/attempts,
  staff identity, handoff/block notes, idempotency keys) applied on
  every customer-facing order/receipt/history read — reused verbatim
  across `checkoutService.getOrder()` (1B-2B-3) and
  `customerOrderHistoryService.js` (1B-2B-4). No raw payment credential
  field exists anywhere in the Venue Humidor schema — only
  `payment_status`/`payment_method_summary`-class fields are stored.

## Idempotency-key handling
- Keys are caller-supplied opaque strings, never derived from or
  exposing internal IDs; every mutating endpoint requires one; enforced
  via real `UNIQUE` database constraints (not just application-level
  checks) — confirmed for `venue_cigar_recommendation_preferences`,
  `venue_cigar_assisted_selling_outcomes`,
  `venue_cigar_acquisition_notes`, `smokecraft_progression_events`, and
  every inventory/order/fulfillment table across all prior packages.

## Audit-event integrity
- Every append-only ledger (`venue_cigar_inventory_events`,
  `venue_cigar_fulfillment_events`, `smokecraft_progression_events`)
  has no UPDATE/DELETE path anywhere in the Venue Humidor codebase —
  confirmed by grep across all `server/services/venueHumidor/*.js`
  files this pass (zero matches for `UPDATE venue_cigar_inventory_events`,
  `UPDATE venue_cigar_fulfillment_events`,
  `UPDATE smokecraft_progression_events`, or the equivalent `DELETE FROM`).

## Error-message leakage
- Every Venue Humidor controller's `sendError()` returns only a short
  `error` code string (e.g. `order_not_owned`, `venue_role_required`) —
  never `err.message` or `err.stack`. Confirmed by grep across all
  Venue Humidor controllers this pass: zero matches for `err.message`
  or `err.stack` being sent in a response body.

## File/image upload
- Not applicable — Venue Humidor product images are stored as URL
  strings (`primary_image_url`/`secondary_image_url`) set by staff, not
  a file-upload endpoint. No upload surface exists to review.

## Logging of sensitive information
- Server startup/request logs (reviewed via the live process log this
  pass) print no pickup codes, no payment data, and no session tokens —
  only route/status/timing lines and the existing POS3Sync summary
  lines unrelated to Venue Humidor.

## Dependency vulnerabilities
- `npm audit --production` (run this pass) reports 3 known
  vulnerabilities, **none introduced by this pass and none specific to
  Venue Humidor code**:
  - `body-parser <1.20.6` — DoS via invalid limit value silently
    disabling size enforcement (low severity).
  - `react-router` 6.0.0–7.17.0 — open-redirect / SSR hydration
    constructor-injection advisories (moderate severity; this app does
    not use SSR, reducing the second advisory's applicability).
  - `react-router-dom` — transitively depends on the vulnerable
    `react-router` range.
  These are pre-existing, app-wide dependency-version issues (not
  Venue-Humidor-specific code) and are recorded as a known limitation
  in `10-production-readiness.md` rather than silently patched —
  upgrading `react-router` is a cross-application, potentially
  breaking major-version change outside this closure pass's scope per
  mandate §17 ("do not perform unrelated large-scale optimization").

## What this review does NOT cover
This is not a penetration test, not a full OWASP Top 10 audit of the
entire application (only the Venue Humidor surface), not a review of
non-Venue-Humidor SmokeCraft modules, and not a certification of
production security posture as a whole. No claim of "secure" or
"certified" is made — only the specific checks above, with their exact
results.
