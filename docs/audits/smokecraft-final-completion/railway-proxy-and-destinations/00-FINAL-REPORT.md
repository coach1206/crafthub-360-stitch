# Railway Proxy & Destinations — Final Report

**Starting commit:** `7e6d361c6738a6a8f1d1d404160cbbc216fae845` (branch `recovery/smokecraft-codex-final`; local HEAD == remote HEAD, clean tree confirmed at start).

**Deployed commit observed on Railway:** Could not determine — outbound network access to the production Railway URL is blocked in this sandbox (confirmed across every prior pass). Local `/api/version`, `/system/build-info`, and `/__build-check` all respond 200 but reflect *this repo's local build*, not Railway. This fix is correct regardless of what Railway is currently serving.

## Root cause (confirmed via user-provided Railway logs)
Railway sits behind a reverse proxy that appends the real client IP to the
`X-Forwarded-For` header. Express shipped with the default `trust proxy = false`,
so `express-rate-limit`'s validator threw `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`
on requests behind that proxy. In production this broke journey creation: Start
stayed on the Landing page, `activeJourneyId` was never created/persisted, and
protected routes stayed locked. Local `vite preview` never surfaced it because
there is no reverse proxy in front of it. See `01-ROOT-CAUSE.md`.

## Fix
`server/index.js`: `const TRUST_PROXY = IS_PROD ? 1 : false; app.set('trust proxy', TRUST_PROXY)`
placed immediately after `const app = express()` — textually before both
`rateLimit({...})` limiter definitions and their `app.use()` registration, and
before all route registration. Production trusts exactly **one** hop (Railway's
edge); local dev leaves it disabled. Deliberately NOT `trust proxy = true`. A
boot diagnostic (no PII) logs environment, trust-proxy value, `req.ip` source,
and limiter status. Security reasoning in `02-PROXY-SECURITY.md`.

## Destination routes (mostly verification of the prior pass)
- **Rewards:** landing "Rewards" control → `/smokecraft/rewards-center`, rendering
  the approved `public/assets/smokecraft/rewards/Reward Center.png` (rendered
  hash == disk sha256, asserted live). Added the mandate-named honest fields the
  prior pass had not itemized: a **Journey** point tile plus honest-empty-state
  rows for **Drink / Cigar & smoke / Food / Pairing specials** and **Venue perks**
  (all "None configured" — no fabricated offers/values).
- **Rankings:** landing "Rankings" control → `/smokecraft/leaderboard`, approved
  `LEADERBOARD 111.png`. No stale baked data ("James Carter", "18,750", "4435"
  absent). All leaderboard routes render the single approved `<Leaderboard/>`
  component — no old generic leaderboard exists.
- **Passport:** landing "View Passport" → `/smokecraft/passport-stamp` (session-23
  renderer). Fresh users are correctly gated to `/smokecraft/enroll` by the live
  entry guard (a live redirect, not a baked lock image). No `FUTURE VISIT LOCKED`
  / `MANAGEMENT SYNC LOCKED` text and no old lock PNG element renders. See
  `03-DESTINATION-ROUTES.md`.

## Results
- New suite `verify-smokecraft-railway-proxy-and-destinations.mjs`: **32/32**.
- Regressions all at baseline — see `04-REGRESSION-MATRIX.md`.
- Production build exit 0; production-mode startup clean; health 200.

## Files changed
- `server/index.js` — trust-proxy config + boot diagnostic.
- `src/pages/smokecraft/RewardsCenter.jsx` — Journey point tile + itemized honest-empty-state venue-reward categories.
- `verify-smokecraft-railway-proxy-and-destinations.mjs` (new).
- `public/proof/smokecraft-railway-proxy-and-destinations/**` (evidence).
- `docs/audits/smokecraft-final-completion/railway-proxy-and-destinations/**` (this set).
- `docs/audits/smokecraft-final-completion/gate-reconciliation/CHECKLIST.md`, `docs/crafthub-mvp2-replication-blueprint.md`.

## Remaining blockers
- Cannot verify Railway's live deployment state (network block). The fix is
  independently proven locally by sending real `X-Forwarded-For` requests to a
  local production-mode backend.
- No real venue-rewards backend exists; the Reward Center venue categories are
  honest empty states by design.

**Status:** PASS — RAILWAY JOURNEY CREATION, REWARDS, RANKINGS, AND PASSPORT ARE FIXED
