# 01 — Root Cause

## Symptom (production only)
Real Railway users could not start a SmokeCraft journey: clicking START stayed on
the Landing page, `activeJourneyId` was never created/persisted, and protected
routes remained locked / returned users to prerequisite screens.

## User-provided evidence
Railway production logs repeatedly emitted:

    ERR_ERL_UNEXPECTED_X_FORWARDED_FOR

(Reproduced verbatim in `public/proof/smokecraft-railway-proxy-and-destinations/railway-error-log.txt`, clearly labelled as user-provided production evidence.)

## Mechanism
1. Railway terminates TLS at an edge reverse proxy and forwards the real client
   IP in the `X-Forwarded-For` header.
2. Express defaulted to `trust proxy = false`. With that setting, `req.ip`
   resolves to the immediate socket peer (the proxy), and `express-rate-limit`'s
   built-in validator detects an `X-Forwarded-For` header it was told not to
   trust — a misconfiguration signal — and **throws** `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`.
3. The throw happens inside request handling for `/api/*` (both the general and
   auth limiters are mounted there), so journey/session API calls failed, and the
   client never received a successful journey-creation response.

## Why local testing missed it
`vite preview` / the local backend receive **direct** connections with no
reverse proxy and no `X-Forwarded-For` header, so the validator never fires. The
bug is purely about forwarded-header handling, not about physically running on
Railway — which is why it is faithfully reproducible locally by sending a request
with an `X-Forwarded-For` header to a local production-mode backend. The prior
pass's "could not reproduce via a real click against local preview" verdict was
therefore honest and correct for its test environment; the defect only exists
where a proxy inserts the header.

## Fix
Configure `app.set('trust proxy', 1)` in production (Railway's single edge hop),
disabled in local development, before any rate-limit / IP-dependent middleware.
See `02-PROXY-SECURITY.md` for the hop-count and spoofing analysis.
