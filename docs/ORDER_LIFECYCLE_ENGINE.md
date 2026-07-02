# Order Lifecycle Engine

## Important Notice

The Order Lifecycle Engine tracks order state and readiness, but it does not prove live payment capture, POS sync, or kitchen routing unless those integrations are verified.

All order states are tracked through a safe, auditable state machine. No state change implies payment capture, POS synchronization, or kitchen notification unless the relevant integration provides verified proof.

## Why Order Lifecycle Is Required

Before live commerce can operate, the platform must track every order through:

1. A safe, auditable state machine with defined allowed transitions
2. Payment confirmation linkage (not capture — confirmation)
3. Tax calculation snapshot linkage
4. Partner/vendor fulfillment approval tracking
5. POS routing preview tracking
6. KDS/kitchen routing preview tracking
7. Refund linkage (preview — not issued unless Stripe is live)
8. Audit trail for every transition

Without the Order Lifecycle Engine, there is no shared source of truth for what state an order is in, and no safe way to link payment, tax, partner, POS, or KDS integrations.

## Lifecycle States

### Primary Flow

```
order_draft → order_pending → order_submitted → order_accepted → order_routed → order_preparing → order_ready → order_completed
```

### Branch States

- `order_cancelled` — can be reached from draft, pending, submitted, accepted, routed, preparing, or ready
- `order_rejected` — reached from submitted
- `order_failed` — reached from accepted, routed, or preparing; can return to order_pending
- `refund_pending` — reached from order_completed
- `partially_refunded` — reached from refund_pending
- `order_refunded` — reached from refund_pending or partially_refunded

## Allowed Transitions

| From | To |
|------|----|
| order_draft | order_pending, order_cancelled |
| order_pending | order_submitted, order_cancelled |
| order_submitted | order_accepted, order_rejected, order_cancelled |
| order_accepted | order_routed, order_cancelled, order_failed |
| order_routed | order_preparing, order_cancelled, order_failed |
| order_preparing | order_ready, order_cancelled, order_failed |
| order_ready | order_completed, order_cancelled |
| order_completed | refund_pending |
| order_failed | order_pending |
| refund_pending | partially_refunded, order_refunded |
| partially_refunded | refund_pending, order_refunded |

## Blocked Transitions

- `order_draft` → `order_completed` — skipping is blocked
- `order_completed` → `order_preparing` — reversal is blocked
- `order_cancelled` → `order_completed` — re-activation after cancel is blocked
- All terminal states (`order_completed`, `order_cancelled`, `order_rejected`, `order_refunded`) cannot re-enter the primary flow except `order_completed` → `refund_pending`

## Payment Link Behavior

- `linkPaymentToOrder(orderId, paymentContext)` links a Stripe payment intent reference to an order
- `paymentStatus` always returns `payment_confirmation_required` until Stripe confirms capture with proof
- `paymentMode` is always `payment_preview` until live Stripe integration is verified
- The system never claims `payment captured` or `Stripe confirmed` without proof

## Tax Link Behavior

- `linkTaxCalculationToOrder(orderId, taxContext)` links a tax calculation snapshot to an order
- `taxStatus` returns `tax_preview_required` until the Tax Profiles Engine provides a verified calculation
- Tax preview from Phase 7 can be linked; it remains `tax_preview` until CPA review is complete

## Partner Fulfillment Behavior

- `linkPartnerFulfillment(orderId, partnerContext)` links partner/vendor fulfillment to an order
- `approvalStatus` returns `venue_approval_required` until the partner has venue approval
- `availabilityStatus` returns `availability_required` until inventory is confirmed
- Partner items never appear as fulfilled unless all Phase 6 eligibility gates pass

## POS Routing Preview Behavior

- `linkPOSRouting(orderId, posContext)` links a POS routing record to an order
- `routingStatus` returns `pos_sync_pending` until a live POS provider connection is verified
- `routingMode` is always `routing_preview` without real provider credentials, OAuth, and API proof
- manual_pos360 fallback is always available for venues without a live POS connection

## KDS Routing Preview Behavior

- `linkKDSRouting(orderId, kdsContext)` links a KDS routing record to an order
- `routingStatus` returns `kds_routing_pending` until a live KDS station connection is verified
- `routingMode` is always `routing_preview` without KDS integration proof

## Refund Link Behavior

- `linkRefundToOrder(orderId, refundContext)` links a refund record to an order
- `refundStatus` returns `refund_pending`; `refundMode` is `refund_preview`
- Refunds are never issued without a live Stripe payment intent and proven capture

## Database Fallback Behavior

- When `DATABASE_URL` is not set, all operations use in-memory Maps
- Every response includes `storageMode: 'memory_fallback'` and `syncMode: 'order_lifecycle_preview'`
- Responses never claim `persisted`, `live order sync`, or `order completed live` without database proof

## What Is Live vs Preview-Only

| Feature | Status |
|---------|--------|
| Order state machine | Live (in-memory or postgres) |
| Payment capture | Preview — requires live Stripe |
| Tax calculation | Preview — requires CPA-reviewed rates |
| POS sync | Preview — requires provider OAuth + credentials |
| KDS routing | Preview — requires KDS station integration |
| Partner fulfillment | Preview — requires venue approval + availability |
| Refund issuance | Preview — requires live Stripe |
| Database persistence | Available when DATABASE_URL is set |

## How Money Bridge Uses Order Lifecycle

Phase 4 Money Bridge can link its settlement preview to an order via `linkPaymentToOrder`. The settlement split (10% SmokeCraft, 5% venue referral, 85% partner payout) is calculated but remains `settlement_pending_preview` until Stripe Connect is live.

## How Tax Uses Order Lifecycle

Phase 7 Tax engine produces a `taxCalculationSnapshot`. This snapshot can be linked to an order via `linkTaxCalculationToOrder`. Tax amounts remain `tax_preview_required` until verified rates are configured and CPA review is complete.

## How Partner Vendor Onboarding Uses Order Lifecycle

Phase 6 Partner Vendor Onboarding gates control whether a partner item can appear in an order. All Phase 6 eligibility checks (venue approval, product active, availability, fulfillment rules, commission agreement) must pass before a partner item is eligible.

## How E.A.T. Can Display Order Readiness

`getOrderLifecycleHooks(venueId, partnerId)` returns:
- `orderLifecycleStatus` — current readiness
- `paymentStatus` — always `payment_confirmation_required` without Stripe proof
- `taxStatus` — always `tax_preview_required` without CPA-reviewed rates
- `posStatus` — always `pos_sync_pending` without provider connection
- `kdsStatus` — always `kds_routing_pending` without KDS connection
- `orderHooks` — blockers with severity levels

## Database

Migration: `server/db/migrations/023_order_lifecycle_engine.sql`

Tables: `order_lifecycle_orders`, `order_lifecycle_line_items`, `order_lifecycle_status_events`, `order_lifecycle_payment_links`, `order_lifecycle_tax_links`, `order_lifecycle_partner_fulfillment`, `order_lifecycle_pos_routing`, `order_lifecycle_kds_routing`, `order_lifecycle_refund_links`, `order_lifecycle_audit_logs`

## API Endpoints

All order endpoints at `/api/orders`. See `server/routes/orderLifecycleRoutes.js`.
