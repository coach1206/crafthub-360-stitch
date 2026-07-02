# NOVEE OS Parent Platform

## Important Notice

NOVEE OS is the parent operating system for all Craft360 vertical experiences. SmokeCraft 360 is the first active vertical — not the parent platform. NOVEE OS powers all verticals but does not claim live operational status without verified integration proof. All readiness values are honest previews.

## Platform Architecture

```
NOVEE OS (Parent Platform)
├── SmokeCraft 360       [active]
├── PourCraft 360        [craft_vertical_registered]
├── BeerCraft 360        [craft_vertical_registered]
├── WineCraft 360        [craft_vertical_registered]
├── CoffeeCraft 360      [craft_vertical_registered]
├── TeaCraft 360         [craft_vertical_registered]
├── ChocolateCraft 360   [craft_vertical_registered]
├── BBQCraft 360         [craft_vertical_registered]
├── SteakCraft 360       [craft_vertical_registered]
├── ChefCraft 360        [craft_vertical_registered]
├── MixologyCraft 360    [craft_vertical_registered]
├── CheeseCraft 360      [craft_vertical_registered]
├── DessertCraft 360     [craft_vertical_registered]
└── HospitalityCraft 360 [craft_vertical_registered]
```

## Payment Authority

NOVEE OS collects application fees but does not hold venue or vendor funds. The payment model is direct-charge via Stripe Connect. Venue funds flow directly to the venue's Stripe account. NOVEE OS does not hold, manage, or control venue or vendor funds at any time.

- No live payment is initiated without verified Stripe Connect proof
- All payment readiness values are `payment_bridge_preview` without verified credentials
- Split math: 10% commission + 5% venue referral + 85% partner payout (integer cents, `payout = subtotal - commission - referral`)

## Platform Readiness

All NOVEE OS readiness hooks return `platform_preview` until integrations are verified:

| Signal | Default Status |
|--------|---------------|
| Stripe Connect | `stripe_connect_preview` |
| Order Lifecycle | `order_lifecycle_preview` |
| KDS Routing | `kds_routing_pending` |
| Tax Compliance | `tax_compliance_preview` |
| POS Sync | `pos_sync_preview` |
| NCIE Intelligence | `ncie_preview` |

## Source Files

| File | Purpose |
|------|---------|
| `src/data/novee/noveePlatformModules.js` | NOVEE OS identity and 14 craft module registry |
| `src/data/novee/noveeVerticalRegistry.js` | Full vertical capability and routing metadata |
| `src/services/novee/noveePlatformAuthority.js` | Platform identity, manifest, vertical authority resolution |
| `src/services/novee/noveePaymentAuthority.js` | Fee structure, payment readiness, no-custody model |
| `src/services/novee/noveeReadinessHooks.js` | Aggregated readiness signals for E.A.T. and dashboards |
