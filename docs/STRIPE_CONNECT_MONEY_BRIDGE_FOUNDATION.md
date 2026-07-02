# Stripe Connect / Money Bridge Foundation

> Phase: 4 of 19  
> Status: foundation_ready — not live without Stripe credentials

---

## Why Stripe Connect Is Needed

Money Bridge can calculate the split in preview mode, but it cannot release money until Stripe Connect or another payment processor is live.

The platform has three parties who receive money on every partner food order:

1. **SmokeCraft** — 10% platform commission
2. **Venue** — 5% referral revenue for bringing the customer and the lounge
3. **Partner/Vendor** — 85% for preparing and delivering the food

Without Stripe Connect, none of these parties can receive money. All settlement statuses remain `settlement_pending_preview` until Stripe Connect is configured, connected accounts are created, and onboarding is complete.

---

## Recommended Platform Model

**Stripe Connect — Platform Account + Express Accounts**

```
SmokeCraft Platform Stripe Account    ← collects customer payment
          ↓
application_fee_amount (10% + 5%)     ← SmokeCraft keeps commission + venue fee
          ↓
transfer to Partner Express Account   ← partner receives 85%
          ↓
(separately) venue referral payout    ← venue receives 5% via transfer or manual
```

SmokeCraft acts as the platform. Each venue and partner vendor needs their own Stripe Express connected account. Customers pay SmokeCraft, SmokeCraft splits and transfers.

---

## Account Types

| Account Type | Owner | Purpose |
|---|---|---|
| Platform | SmokeCraft | Collects payment, takes commission |
| Venue Express | Venue (e.g. SmokeCraft Cigar Lounge) | Receives 5% referral payout |
| Partner Express | Partner Vendor (e.g. Izakaya 360) | Receives 85% payout |
| Distributor Express | Cigar/product distributor | Future use |
| Manufacturer Express | Product maker | Future use |

---

## 10% / 5% / 85% Split

For every partner food item ordered:

| Recipient | Rate | Example ($20 order) |
|---|---|---|
| SmokeCraft commission | 10% | $2.00 |
| Venue referral | 5% | $1.00 |
| Partner payout | 85% | $17.00 |

Partner payout = subtotal − commission − referral (ensures exact sum with no rounding leakage).

---

## $4.50 Delivery/Routing Fee

A flat $4.50 delivery/routing fee is added to the order when partner food items are present. This covers food routing, delivery, or commission for the venue handling the order.

- Applied per order (not per item)
- Only when `partnerItems.length > 0`
- Not applied to venue-only orders (cigars, bar)

---

## Tax Preview vs Verified Tax

| Status | Meaning |
|---|---|
| `preview_only` | No venue tax config. Fallback rate (8.5%) applied. Not tax-compliant. |
| `venue_config` | Venue tax config found. Rate applied from config. |

Tax compliance requires integrating Avalara or TaxJar (Phase 9 of 19). Until then, all tax is `preview_only`.

---

## Settlement Status Rules

| Status | When Used |
|---|---|
| `settlement_pending_preview` | Default — no Stripe, no payment |
| `settlement_pending` | Stripe configured, payment intent created |
| `settlement_ready` | Payment succeeded, awaiting transfer |
| `transfer_pending` | Transfer to partner initiated |
| `transfer_complete` | **Only with real Stripe transfer confirmation** |
| `payout_complete` | **Only with real Stripe payout confirmation** |
| `settlement_failed` | Payment or transfer failed |

Never use `transfer_complete` or `payout_complete` without real Stripe proof.

---

## Refund/Reversal Rules

| Status | When Used |
|---|---|
| `refund_preview` | Preview of what a refund would look like |
| `refund_requires_processor` | Stripe not configured |
| `refund_pending` | Stripe configured, refund submitted |
| `refund_completed` | **Only with real Stripe refund confirmation** |
| `reversal_pending` | Transfer reversal initiated |
| `reversal_completed` | **Only with real Stripe reversal confirmation** |

Full refund reverses all three splits proportionally. Partial refund reverses proportionally.

---

## What Is Live vs Not Live

| Feature | Status |
|---|---|
| Split calculation | **live** — Money Bridge preview engine works |
| Settlement ledger | `settlement_pending_preview` — Stripe not configured |
| Payment intents | `stripe_keys_missing` — no Stripe credentials |
| Checkout sessions | `stripe_keys_missing` — no Stripe credentials |
| Venue onboarding | `onboarding_required` — no connected account |
| Partner onboarding | `onboarding_required` — no connected account |
| Refunds | `refund_requires_processor` — Stripe not configured |
| Webhooks | `signature_required` — STRIPE_WEBHOOK_SECRET not set |
| Tax compliance | `preview_only` — fallback rate only |

---

## Required Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `STRIPE_SECRET_KEY` | Yes | Stripe server-side API calls |
| `STRIPE_PUBLISHABLE_KEY` | Yes | Stripe client-side (frontend) |
| `STRIPE_WEBHOOK_SECRET` | Yes | Webhook signature verification |
| `STRIPE_CONNECT_CLIENT_ID` | Yes | Stripe Connect OAuth |
| `STRIPE_PLATFORM_ACCOUNT_ID` | Recommended | Platform account ID |
| `STRIPE_ENVIRONMENT` | Recommended | `test` or `live` |

---

## API Endpoints

```
GET  /api/payments/money-bridge/readiness
GET  /api/payments/money-bridge/accounts/:ownerType/:ownerId
POST /api/payments/money-bridge/accounts/:ownerType/:ownerId
POST /api/payments/money-bridge/accounts/:ownerType/:ownerId/onboarding-link
POST /api/payments/money-bridge/accounts/:ownerType/:ownerId/refresh
POST /api/payments/money-bridge/payment-preview
POST /api/payments/money-bridge/create-payment-intent
POST /api/payments/money-bridge/checkout-session
GET  /api/payments/money-bridge/orders/:orderId/status
POST /api/payments/money-bridge/orders/:orderId/refund-preview
POST /api/payments/money-bridge/orders/:orderId/refund
POST /api/payments/money-bridge/webhooks/:providerName
GET  /api/payments/money-bridge/audit-logs
```

---

## Next Phases

- **Phase 5 of 19** — Order Lifecycle Engine: full state machine (draft → pending → submitted → routed → ready → completed/cancelled). Required before Stripe, KDS, and refund flows can function end-to-end.
- **Phase 6 of 19** — Venue Onboarding Engine: venues need an onboarding flow before they can connect Stripe or POS providers.
- **Phase 7 of 19** — Partner Vendor Onboarding Engine: partners need onboarding contracts before money flows to them.
