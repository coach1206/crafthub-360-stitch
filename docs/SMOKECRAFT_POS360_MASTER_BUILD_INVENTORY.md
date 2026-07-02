# SmokeCraft / POS360 Master Build Inventory

> Audit date: 2026-07-02  
> Branch: `claude/beautiful-thompson-r3mm5m`  
> Latest commit: `e2b9bec0`  
> Verification: Phase 9 (56/56 ✓) · Phase 10 POS360 (121/121 ✓)

---

## 1. Protected Foundation — SEALED

These files must never be modified. Confirmed untouched.

| File | Path | Status |
|---|---|---|
| SmokeCraftAssetScreen | `src/components/smokecraft/SmokeCraftAssetScreen.jsx` | ✓ EXISTS · SEALED |
| SmokeCraftHotspotLayer | `src/components/smokecraft/SmokeCraftHotspotLayer.jsx` | ✓ EXISTS · SEALED |
| SmokeCraftAssetRoute | `src/components/smokecraft/SmokeCraftAssetRoute.jsx` | ✓ EXISTS · SEALED |
| VISIT_STRUCTURE | `src/constants/session.js` | ✓ EXISTS · SEALED |
| Passport progress | `src/utils/passportProgress.js` | ✓ EXISTS · SEALED |
| Passport entry | `src/utils/passportEntry.js` | ✓ EXISTS · SEALED |
| SmokeCraft journey | `src/constants/smokecraftJourney.js` | ✓ EXISTS · SEALED |

Rules that cannot change:
- 8-visit / 24-session guest progression
- Passport Stamp lock: S21 locked until S1–S20 complete
- Connections lock: S22 locked until S21 complete
- Management Sync lock: S23 locked until S22 complete

---

## 2. Completed Work

### 2A. Ticket Tapper Specials (Phases 7–9)

| File | Status |
|---|---|
| `src/data/smokeCraftTicketTapperSpecials.js` | ✓ complete — 3 seed specials with approval blocks |
| `src/data/smokeCraftInventorySeed.js` | ✓ complete — 4 inventory items |
| `src/utils/smokeCraftSpecialsEngine.js` | ✓ complete — approval roles, customer filter, one-tap logic |
| `src/services/smokeCraftTicketTapperSpecialsApi.js` | ✓ complete — 14 API functions, all with preview fallback |
| `src/components/smokecraft/TicketTapperSpecialsStrip.jsx` | ✓ complete — customer-facing, double-filters on approval + venue feature |
| `src/components/smokecraft/StaffSpecialsControlPanel.jsx` | ✓ complete — role-based approval UI |
| `src/pages/smokecraft/SmokeCraftVenueCommerce.jsx` | ✓ complete — Smoke/Drink/Food/Partner tabs |
| `server/routes/smokecraftTicketTapperSpecialsRoutes.js` | ✓ complete — 14 endpoints |
| `server/controllers/smokecraftTicketTapperSpecialsController.js` | ✓ complete — dual-mode (postgres + memory fallback) |

### 2B. Money Bridge (Phase 7 + 9)

| File | Status |
|---|---|
| `src/data/smokeCraftVenueCommerce.js` | ✓ complete — venue profile, cigars, drinks, partner foods, MONEY_BRIDGE_RATES |
| `src/utils/smokeCraftMoneyBridge.js` | ✓ complete — calculates 10/5/85 split, $4.50 delivery, tax via config |
| `src/utils/smokeCraftTaxConfig.js` | ✓ complete — preview_only fallback, venue/state config support |
| `src/services/smokeCraftVenueCommerceApi.js` | ✓ complete — 7 API functions |
| `server/routes/smokecraftVenueCommerceRoutes.js` | ✓ complete — 7 endpoints |
| `server/controllers/smokecraftVenueCommerceController.js` | ✓ complete |

### 2C. Phase 9 Production Readiness Contracts

| File | Status |
|---|---|
| `src/utils/venueFeatureSettings.js` | ✓ complete — partner specials opt-in, 30-day trial, cancellation |
| `server/services/posInventoryAdapter.js` | ✓ complete — contract, preview_inventory, not_connected |
| `server/services/kitchenRoutingAdapter.js` | ✓ complete — contract, routing_preview, station mapping |
| `server/services/eatCommandHubContract.js` | ✓ complete — venue feature hooks + POS360 readiness hooks |
| `server/db/migrations/017_ticket_tapper_specials.sql` | ✓ complete — 6 tables |
| `server/scripts/verifyPhase9.js` | ✓ complete — 56/56 passing |

### 2D. POS360 Platform Layer (Phase 10)

| File | Status |
|---|---|
| `server/db/migrations/018_pos360_integration_hub.sql` | ✓ complete — 9 tables |
| `server/db/runMigrations.js` | ✓ complete — safe runner, no crash without DB |
| `server/utils/encryption.js` | ✓ complete — AES-256-CBC, encryption_key_required if missing |
| `server/config/posProviderConfig.js` | ✓ complete — env var readiness per provider |
| `server/services/pos/providers/basePosProviderAdapter.js` | ✓ complete — 16-method base class |
| `server/services/pos/providers/squareAdapter.js` | ✓ skeleton — oauth_required |
| `server/services/pos/providers/toastAdapter.js` | ✓ skeleton — partner_approval_required |
| `server/services/pos/providers/cloverAdapter.js` | ✓ skeleton — oauth_required |
| `server/services/pos/providers/lightspeedAdapter.js` | ✓ skeleton — oauth_required |
| `server/services/pos/providers/shopifyPosAdapter.js` | ✓ skeleton — oauth_required |
| `server/services/pos/providers/manualPos360Adapter.js` | ✓ complete — manual_mode, no OAuth |
| `server/services/pos/providers/futureProviderAdapter.js` | ✓ template — integration_required |
| `server/services/pos360IntegrationHub.js` | ✓ complete — central dispatcher, tenant guard |
| `server/services/pos360ItemMappingService.js` | ✓ complete — mapping_required blocks live push |
| `server/services/pos360OrderBridgeService.js` | ✓ complete — idempotency, manual fallback |
| `server/services/pos360WebhookService.js` | ✓ complete — dedup, unverified → webhook_pending |
| `server/services/pos360AuditLogService.js` | ✓ complete — every action logged |
| `server/services/pos360ProviderHealthService.js` | ✓ complete — safe error normalization, retry plan |
| `server/middleware/venueTenantGuard.js` | ✓ complete |
| `server/controllers/pos360IntegrationController.js` | ✓ complete — 17 handlers, tokens stripped |
| `server/routes/pos360IntegrationRoutes.js` | ✓ complete — 17 endpoints at /api/pos360 |
| `server/scripts/verifyPos360PlatformLayer.js` | ✓ complete — 121/121 passing |
| `docs/POS360_PLATFORM_LAYER.md` | ✓ complete |

### 2E. Database Migrations (17 files)

| Migration | Content |
|---|---|
| 001 | Initial NoveeOS schema |
| 002 | Admin roles / security |
| 003 | Auth hardening |
| 004 | POS3 provider prep |
| 005 | POS3 operational hardening |
| 006 | Device deployment |
| 008 | Venue testing |
| 009 | Demo / pilot package |
| 010 | New roles and tables |
| 011 | SmokeCraft schema |
| 012 | Internal sync engine |
| 013 | Sync reconciliation |
| 014 | Sync audit lifecycle |
| 015 | Venue commerce foundation |
| 016 | POS3 commerce foundation |
| 017 | Ticket Tapper specials (6 tables) |
| 018 | POS360 integration hub (9 tables) |

---

## 3. Engine Status Audit

| # | Engine | Status | Notes |
|---|---|---|---|
| 1 | Ticket Tapper Specials Engine | **complete** | approval gate, customer filter, one-tap, tracking |
| 2 | Inventory Engine | **partial** | seed data + status logic done; no live POS sync |
| 3 | Money Bridge Preview Engine | **complete** | 10/5/85 split, preview tax, honest settlement labels |
| 4 | POS360 Integration Hub Engine | **complete** | hub + 7 adapters, tenant guard, no live OAuth yet |
| 5 | POS360 Order Bridge Engine | **complete** | idempotency, manual fallback, no live order push |
| 6 | POS360 Item Mapping Engine | **complete** | mapping_required blocks push, manual bypasses |
| 7 | POS360 Webhook Engine | **complete** | dedup, unverified stored, no live processing yet |
| 8 | POS360 Audit Log Engine | **complete** | all actions logged, memory fallback honest |
| 9 | POS360 Provider Health Engine | **complete** | error normalization, retry planning, no live check |
| 10 | Stripe Connect Payment Split Engine | **missing** | no stripeConnectService.js, no routes, no migration |
| 11 | Venue Onboarding Engine | **missing** | no venueOnboardingService.js, no routes |
| 12 | Partner Vendor Onboarding Engine | **missing** | no partnerVendorOnboardingService.js |
| 13 | Menu/Product Mapping Engine | **partial** | pos360ItemMappingService covers POS; no full menu admin |
| 14 | Order Lifecycle Engine | **missing** | no orderLifecycleService.js; order status states defined in data |
| 15 | Refund/Cancellation/Reversal Engine | **missing** | no refundService.js, no routes, no migration |
| 16 | Staff Role Permission Engine | **partial** | approval roles complete in specials; no global RBAC service |
| 17 | Kitchen/Fulfillment Routing Engine | **contract_only** | kitchenRoutingAdapter.js = contract; no live KDS |
| 18 | Real-Time Event Engine | **contract_only** | attach points annotated; WebSocket/Supabase not wired |
| 19 | Reporting/Analytics Engine | **missing** | specials report endpoint exists; no full analytics service |
| 20 | Tax Compliance Engine | **contract_only** | smokeCraftTaxConfig.js = preview only; no Avalara/TaxJar |
| 21 | E.A.T. Command Hub Admin Engine | **partial** | eatCommandHubContract.js exists; no live E.A.T. UI |
| 22 | Deployment/Production Readiness Engine | **partial** | migration runner, env checks exist; no CI/CD pipeline |

### Summary counts
- **Complete:** 9 engines (1, 3, 4, 5, 6, 7, 8, 9, 3)
- **Partial:** 5 engines (2, 13, 16, 21, 22)
- **Contract only:** 3 engines (17, 18, 20)
- **Missing:** 5 engines (10, 11, 12, 14, 15)

---

## 4. Live vs Not Live

| Feature | Real Status |
|---|---|
| PostgreSQL persistence | **database_required** — DATABASE_URL not configured |
| Square OAuth | **oauth_required** — credentials not set |
| Toast integration | **partner_approval_required** — Partner Program needed |
| Clover OAuth | **oauth_required** — credentials not set |
| Lightspeed OAuth | **oauth_required** — credentials not set |
| Shopify POS OAuth | **oauth_required** — credentials not set |
| Manual POS360 | **manual_mode** — functional now |
| Stripe Connect | **missing** — no code exists |
| KDS / kitchen display | **routing_preview** — contract only |
| Real-time push | **real_time_ready** — annotation only, not wired |
| Tax compliance | **preview_only** — fallback rate only |
| Money Bridge settlement | **pending_preview** — no payment processor |
| Partner vendor payout | **pending_preview** — no settlement engine |
| Venue onboarding | **missing** — no service |
| Refunds/cancellations | **missing** — no service |
| Full reporting/analytics | **missing** — specials report only |

---

## 5. Recommended Build Order: Phase 2 → Phase 18

| Phase | Focus | Rationale |
|---|---|---|
| **2** | Stripe Connect Payment Split Engine | Unlocks Money Bridge settlement and partner payout. Required before any real revenue flows. |
| **3** | Order Lifecycle Engine | Full order state machine (draft → pending → submitted → routed → ready → completed/cancelled). Required for Stripe, KDS, and refund flows. |
| **4** | Venue Onboarding Engine | Venues need onboarding before they can connect POS providers or accept Stripe payouts. |
| **5** | Partner Vendor Onboarding Engine | Partners (Izakaya 360, Gaucho Grill, etc.) need onboarding contracts before money flows to them. |
| **6** | Square OAuth + Catalog Sync | Highest-demand POS. OAuth flow, menu sync, inventory sync, order push. Square first because it has broadest venue adoption. |
| **7** | Real-Time Event Engine | WebSocket / Supabase Realtime for live specials push, inventory updates, and kitchen routing. Required for KDS and partner fulfillment. |
| **8** | Kitchen/Fulfillment Routing (Live KDS) | Connect to real KDS or partner confirmation API. Kitchen routing currently preview_only. |
| **9** | Tax Compliance Engine | Integrate Avalara or TaxJar. Per-venue/state tax rates replacing preview_only fallback. |
| **10** | Reporting/Analytics Engine | Full specials performance, Money Bridge revenue, POS sync, venue/partner reporting. |
| **11** | Refund/Cancellation/Reversal Engine | Tied to Stripe Connect (Phase 2) and Order Lifecycle (Phase 3). Cannot refund without payment integration. |
| **12** | Toast POS Integration | Requires Toast Partner Program approval. Begin approval process now; implement when approved. |
| **13** | Menu/Product Admin Engine | Full venue menu admin — CRUD for items, pricing, categories, partner food assignments. |
| **14** | Staff Role Permission Engine (Global RBAC) | Extend specials approval gate to all POS360 operations, venue management, and E.A.T. UI. |
| **15** | Clover / Lightspeed / Shopify POS Integrations | Lower priority after Square. Same pattern, different adapters. |
| **16** | E.A.T. Command Hub Live UI | Build full management dashboard wired to all contract layers already in place. |
| **17** | PostgreSQL Production Deployment | Configure DATABASE_URL, run migrations, verify persistence in staging. |
| **18** | Production Hardening + CI/CD | Rate limiting, auth hardening, staging/production parity, automated migration checks. |

---

## 6. Immediate Blockers Before Revenue Flows

1. **No Stripe Connect** — Money Bridge calculates splits but cannot settle them.
2. **No ORDER_LIFECYCLE service** — Orders have states defined in data but no state machine enforcing transitions.
3. **No DATABASE_URL** — All persistence is memory fallback. Nothing survives a server restart.
4. **No real POS provider credentials** — All providers return oauth_required or partner_approval_required.
5. **No venue onboarding** — No way to create a venue record with Stripe account, POS connection, or tax config through a controlled flow.

---

## 7. Architecture Principle (Locked)

> POS integration is not one feature. It is a platform layer.  
> Build the POS360 hub once, then every POS provider becomes a plug-in instead of a custom rebuild every time.

```
SmokeCraft Ticket Tapper Order
          ↓
POS360 Integration Hub          ← center of the system
          ↓
Provider Adapter Layer
          ↓
Square | Toast | Clover | Lightspeed | Shopify POS | Manual POS360 | Future Provider
```

SmokeCraft never talks directly to Square. It talks to POS360.

---

## 8. Verification Scripts

| Script | Tests | Status |
|---|---|---|
| `server/scripts/verifyPhase9.js` | 56 | ✓ all passing |
| `server/scripts/verifyPos360PlatformLayer.js` | 121 | ✓ all passing |
| `npm run db:migrate` | Migration runner | exists, safe without DB |
| `npm run verify:pos360` | Full POS360 platform | 121/121 |

---

## 9. Next Phase Recommendation

**Phase 2: Stripe Connect Payment Split Engine**

Required files:
- `server/db/migrations/019_stripe_connect.sql`
- `server/services/stripeConnectService.js`
- `server/services/moneyBridgeSettlementService.js`
- `server/routes/stripeConnectRoutes.js`
- `server/controllers/stripeConnectController.js`
- `src/services/stripeConnectApi.js`
- `server/scripts/verifyStripeConnect.js`

Required behavior:
- Venue Stripe Connect account creation (Express accounts)
- Partner Stripe Connect account creation
- Payment Intent creation with automatic split (application_fee_amount)
- Transfer to partner Stripe account
- Webhook handling for payment confirmation
- All settlement statuses honest until Stripe confirms
- Never claim payment_released without real Stripe confirmation
