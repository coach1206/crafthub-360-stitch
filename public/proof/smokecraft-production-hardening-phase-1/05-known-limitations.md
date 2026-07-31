# Known Limitations

1. **react-router / react-router-dom remain unresolved** — no fixed
   6.x release exists; the fix requires a major 7.x migration, out of
   scope for this package (see `02-dependency-vulnerability-review.md`
   for the full exposure assessment and mitigation reasoning).
2. **Dev-only dependency vulnerabilities** (`postcss`, `shell-quote`)
   were observed but not patched — neither ships in the production
   runtime or bundle, and both are outside this package's explicit
   scope (body-parser, react-router, react-router-dom).
3. **`VITE_STAFF_DEMO_MODE` is not enforced by `envValidator.js`** —
   it is a client-bundled (Vite) flag, not a server-side secret, so
   the server-side startup validator cannot meaningfully block it; a
   build-time check would be a new, separate mechanism. Recorded as a
   gap for a future pass rather than silently addressed here to avoid
   scope creep beyond secrets/dependencies/headers.
4. **CORS_ORIGIN currently supports a single origin string** — if a
   future deployment needs multiple approved origins (e.g. staging +
   production), the existing `cors` package configuration would need
   an array or function-based origin check; not needed today (only one
   production origin exists) and not built speculatively.
5. **No automated secret-rotation mechanism** — rotation remains a
   manual operational step (documented in the startup checklist), not
   an automated capability.
6. **Real payment gateway, production monitoring/alerting, and real
   beverage-catalog integration remain out of scope** — unchanged from
   the prior audit's findings, not affected by this pass.
7. **Rate limiting remains IP-based only** (`express-rate-limit`,
   unchanged this pass) — no additional narrow protections were found
   necessary for Phase 1 beyond what already existed (login, general
   API, and Venue Humidor read/write limiters were all already present
   and verified still functioning via the regression suite).
