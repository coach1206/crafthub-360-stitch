# Stripe Environment Setup — NOVEE OS Platform

## Platform Context

NOVEE OS is platform software — a multi-venue hospitality operating system. It is not a website.
`noveeos.com` is the public-facing customer portal and is a separate system.

Stripe payment credentials are wired into the NOVEE OS platform runtime via environment variables.
Keys are never hardcoded in source code and are never committed to version control.

---

## Required Environment Variables

### Backend (Server Only)

```
STRIPE_SECRET_KEY=sk_live_...
```

- Used exclusively by the server (`process.env.STRIPE_SECRET_KEY`)
- Never exposed to the frontend or browser
- Required for: creating payment intents, confirming charges, managing subscriptions, webhook verification
- Prefix for live keys: `sk_live_`
- Prefix for test keys: `sk_test_`

### Frontend (Vite / React)

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

- Accessed via `import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY`
- Safe to expose to the browser — Stripe publishable keys are designed for client-side use
- Required for: Stripe.js initialization, Elements, Checkout redirect
- Prefix for live keys: `pk_live_`
- Prefix for test keys: `pk_test_`
- A legacy `STRIPE_PUBLISHABLE_KEY` (no `VITE_` prefix) is also read as fallback

### Webhook Secret (Backend Only)

```
STRIPE_WEBHOOK_SECRET=whsec_...
```

- Used exclusively by the server to verify Stripe webhook signatures
- Never exposed to the frontend
- Required for: verifying event authenticity from Stripe's webhook delivery

---

## .env.example Placeholders

The `.env.example` file in the project root shows variable names with empty values.
**Do not place real keys into `.env.example`.** It is committed to version control.

```
STRIPE_SECRET_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## Setting Keys in Railway (Production)

1. Open your Railway project dashboard
2. Select the service running the NOVEE OS backend
3. Go to **Variables**
4. Add each key with its real value:
   - `STRIPE_SECRET_KEY` → your live secret key
   - `VITE_STRIPE_PUBLISHABLE_KEY` → your live publishable key
   - `STRIPE_WEBHOOK_SECRET` → your webhook signing secret
5. Redeploy the service for changes to take effect

Railway injects these as `process.env.*` at runtime. The keys are never written to disk or included in build artifacts.

---

## Setting Keys for Local Development

Create a `.env` file in the project root (already in `.gitignore`):

```
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Use Stripe test keys for local development. Live keys should only be set in production environments.

---

## Key Redaction Format

When Stripe key status is reported in health endpoints or logs, values are redacted:

```
sk_live_****abcd
pk_live_****wxyz
whsec_****1234
```

The real key value is never returned by any API endpoint. Only presence/absence is reported.

---

## Health Check Endpoint

```
GET /api/health/payments
```

Returns Stripe readiness status without exposing key values:

```json
{
  "service": "payments",
  "stripeReady": true,
  "paymentStatus": "payment_ready_with_env",
  "secretKey": {
    "present": true,
    "status": "stripe_configured_backend",
    "environment": "live",
    "redacted": "sk_live_****abcd"
  },
  "publishableKey": {
    "present": true,
    "status": "stripe_configured_frontend",
    "environment": "live",
    "redacted": "pk_live_****wxyz"
  },
  "webhookSecret": {
    "present": true,
    "status": "stripe_webhook_ready"
  },
  "degradedMode": false,
  "blockers": [],
  "warnings": []
}
```

When keys are missing the response shows `payment_blocked_missing_env` and `degradedMode: true`.

---

## Readiness Statuses

| Status | Meaning |
|---|---|
| `payment_ready_with_env` | Secret + publishable keys present |
| `payment_blocked_missing_env` | One or more required keys missing |
| `stripe_configured_backend` | `STRIPE_SECRET_KEY` is set |
| `stripe_secret_key_required` | `STRIPE_SECRET_KEY` is missing |
| `stripe_configured_frontend` | Publishable key is set |
| `stripe_publishable_key_required` | Publishable key is missing |
| `stripe_webhook_ready` | `STRIPE_WEBHOOK_SECRET` is set |
| `stripe_webhook_secret_required` | `STRIPE_WEBHOOK_SECRET` is missing |

---

## Security Rules

- `STRIPE_SECRET_KEY` must never appear in frontend code, build output, or browser network requests
- `STRIPE_WEBHOOK_SECRET` must never appear in frontend code
- No Stripe key may be hardcoded in any source file
- No Stripe key may be committed to version control
- All key values in API responses must be redacted to `****` format
- The `src/lib/stripeClient.js` frontend helper only reads `VITE_STRIPE_PUBLISHABLE_KEY`
- The server `stripeReadinessService.js` only reports presence — it never returns raw key values

---

## Related Files

| File | Purpose |
|---|---|
| `server/services/payments/stripeReadinessService.js` | Backend readiness + redaction service |
| `src/lib/stripeClient.js` | Frontend publishable key helper |
| `server/controllers/eprlHealthController.js` | `handlePaymentsHealth` handler |
| `server/routes/eprlHealthRoutes.js` | `GET /api/health/payments` route |
| `.env.example` | Placeholder variable list (no real values) |
| `server/scripts/verifyStripeEnv.js` | Verification script |
