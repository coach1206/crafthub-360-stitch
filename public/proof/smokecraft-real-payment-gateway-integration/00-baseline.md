# Baseline — Real Payment Gateway Integration (Production Package 2 of 7)

- Starting commit: `2356ea5b378d64dd2d399ff2d3f11de9942d85c3`
- Branch: `recovery/smokecraft-codex-final`
- `git status` at start: clean, up to date with `origin/recovery/smokecraft-codex-final`
- `git rev-parse HEAD` == `git rev-parse origin/recovery/smokecraft-codex-final` == `2356ea5b378d64dd2d399ff2d3f11de9942d85c3` — confirmed before any change was made.
- Prior completed work (per operating instructions, not re-verified line-by-line in this pass, only regression-tested): Required-Interaction Packages A–F, Full Game Fresh-Player Closure, Final Gameplay Acceptance, Production Package 1 (Venue Humidor Media Management).

## Environment

- `DATABASE_URL` present in `.env` pointing at a local PostgreSQL 16 instance (`crafthub_smokecraft_final`). The `postgresql` service was not running at task start; started via `service postgresql start` (no destructive action — a real, empty-of-conflicts local dev Postgres cluster already provisioned in this container).
- No `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CONNECT_CLIENT_ID`, or any Square credential present in the environment at any point during this pass — confirmed via `env | grep -i stripe` / `env | grep -i square` returning nothing, and via the live `getPaymentProviderConfig('stripe')` readiness check reporting `stripe_keys_missing` throughout.
- Per the mandate's payment-safety instructions, **no live provider credentials were used or fabricated at any point.** The real Stripe SDK (`stripe` npm package, already present in `package.json`) is wired against the real Stripe API surface, but every test in this pass that exercises payment-intent creation, webhooks, refunds, or reconciliation mocks ONLY the Stripe network call (`server/services/payments/stripeAdapter.js`'s injected `stripeClient`), never the business logic in `paymentService.js`/`checkoutService.js`/`inventoryService.js`.
