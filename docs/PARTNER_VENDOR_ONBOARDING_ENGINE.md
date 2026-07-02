# Partner Vendor Onboarding Engine

## Why Partner Vendor Onboarding Is Required

Partner vendors should never become customer-facing until venue approval, product approval, availability, fulfillment rules, and commission rules are in place.

Before outside food, cigar distributor offers, beverage items, merch, or partner specials can appear inside SmokeCraft, Ticket Tapper, or POS360, each partner vendor must complete a multi-step onboarding process. The onboarding engine is the control layer that gates every partner-facing feature.

## Supported Partner Types

| Type | Description |
|---|---|
| `outside_food_vendor` | External food vendor selling at venue events |
| `cigar_distributor` | Cigar product distributor offering venue-specific deals |
| `cigar_manufacturer` | Direct manufacturer campaigns or exclusive products |
| `beverage_distributor` | Beverage/spirit distributor offers |
| `merch_vendor` | Merchandise/branded product vendor |
| `event_partner` | Event co-host or sponsor |
| `service_partner` | Service provider (lounge, cleaning, etc.) |
| `demo_partner` | Demo/preview mode partner only |

## Venue Approval Requirement

Partners do not get access to any venue by default. Each venue-partner relationship must be explicitly requested and approved:

```
venue_approval_required → partner_pending_approval → partner_approved
                                                   ↘ partner_rejected
                                                   ↘ partner_blocked
                                                   ↘ partner_paused
```

A partner cannot display products, collect orders, or have specials published at a venue until `approval_status === 'partner_approved'`.

## Partner Product and Menu Setup

Products default to `draft` status. The lifecycle:

```
product_setup_required / draft → pending_approval → active
                                                  ↘ rejected
                              active → paused
                              active → retired
```

Products must be `active` before they can appear in Ticket Tapper or POS360 order flows.

## Availability Rules

Every product must have an availability record. Without one, `availability_status === 'availability_required'` and ordering is blocked.

- Products can have daily schedules (`available_days_json`)
- Quantity limits are enforced; sold-out products block ordering
- Paused products block ordering
- Venue-specific overrides are supported

## Fulfillment Rules

Default fulfillment mode is `management_review`. Outside food vendors typically route to `partner` or `management_review`. Cigar distributor offers may route to `humidor` or `management_review`.

Default routing fee: **$4.50** per order with partner items.

KDS routing (`future_kds`) is available in the schema but not yet live — no KDS exists.

## Commission Agreement

The default split model:
- **10%** SmokeCraft commission
- **5%** Venue referral
- **85%** Partner payout
- **$4.50** Routing fee

A partner special cannot be published without an active commission agreement. If no active agreement exists, the system returns `agreement_required`.

## Payout Readiness

Partners cannot receive payouts without a completed Stripe Connect onboarding. Current status:

- `payout_onboarding_required` — Stripe Connect account not yet set up
- `stripe_keys_missing` — Stripe not configured at the platform level

All partner settlements are in preview mode (`settlement_pending_preview`). Money Bridge calculates splits but cannot release money until Stripe Connect is live with real credentials.

## Partner Special Eligibility

A partner product can only become a customer-facing special when ALL of the following are true:

1. Partner profile exists
2. Partner onboarding is sufficiently complete
3. Venue relationship is `partner_approved`
4. Product status is `active`
5. Product is available (not sold out, not paused, not outside schedule)
6. Fulfillment rules exist
7. Active commission agreement exists
8. Venue has partner specials enabled
9. Staff/manager approval rules pass (if required by venue policy)

If any required item is missing, the eligibility engine returns `partner_special_not_eligible` with specific blocker reasons.

## E.A.T. Command Hub Integration

`getPartnerVendorHooks(partnerId, venueId)` provides:
- Partner onboarding status
- Venue approval status
- Payout readiness
- Settlement status
- Partner special eligibility warnings
- Required next steps

## What Is Live vs Preview

| Feature | Status |
|---|---|
| Partner profile CRUD | Preview (memory fallback) |
| Venue approval | Preview (memory fallback) |
| Product/menu CRUD | Preview (memory fallback) |
| Availability tracking | Preview (memory fallback) |
| Fulfillment rules | Preview (memory fallback) |
| Commission agreement | Preview (memory fallback) |
| Split calculation | Live math (always correct) |
| Payout/settlement | Preview — requires Stripe Connect |
| POS360 item mapping | Preview — requires provider connection |
| Ticket Tapper display | Gated by eligibility engine |
| Database persistence | Requires `DATABASE_URL` |

## Database

Migration: `server/db/migrations/021_partner_vendor_onboarding_engine.sql`

Tables: `partner_vendor_profiles`, `partner_vendor_onboarding_status`, `partner_vendor_venue_relationships`, `partner_vendor_products`, `partner_vendor_product_availability`, `partner_vendor_fulfillment_rules`, `partner_vendor_commission_agreements`, `partner_vendor_audit_logs`

## API Endpoints

All partner endpoints are mounted at `/api/partners`.

See `server/routes/partnerVendorRoutes.js` for the full list of 30+ endpoints.

## Next Phases

- **Phase 7**: Tax profiles and venue-state tax compliance engine
- **Phase 8**: Ticket Tapper specials approval workflow (staff suggestion → manager approval → publish)
- **Phase 9**: POS360 item mapping and order routing (manual_pos360 and provider modes)
- **Phase 10+**: Stripe Connect live onboarding, real payment processing, settlement
