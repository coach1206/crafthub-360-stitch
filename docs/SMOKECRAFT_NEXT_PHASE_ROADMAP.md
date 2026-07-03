# SmokeCraft Next-Phase Roadmap

Module Build 9 of 9 — Post-RC Roadmap for Production and Marketplace

This roadmap documents the phases required to bring SmokeCraft from internal RC to production deployment and marketplace listing. These phases are **not built** in the 9-build internal RC sequence. They are documented here for planning purposes only.

---

## Phase A — Database Persistence Hardening

**Resolves:** BLOCKER-001

**Goal:** Replace `memory_fallback` with a production-verified database.

**Scope:**
- Configure `DATABASE_URL` in the production environment.
- Write and run database migration suite for all SmokeCraft data models (orders, passport stamps, flavor memory, visit progression, rewards, loyalty, staff queues, analytics, tenant records).
- Implement and test connection pooling, retry logic, and graceful degradation on database failure.
- Verify data survives server restart.
- Switch `persistenceMode` from `memory_fallback` to `database` in the database readiness service.
- Update `productionReady` flags appropriately after verification.

**Not in scope:** Multi-region replication, read replicas, or sharding.

---

## Phase B — POS360 Live Connector Implementation

**Resolves:** BLOCKER-004

**Goal:** Connect SmokeCraft ordering to a live POS360 instance.

**Scope:**
- Obtain POS360 API credentials.
- Implement live POS360 connector in the connector registry.
- Test order submission, status polling, and error handling end-to-end.
- Update POS bridge from `not_connected` to `connected` after successful verification.
- Do not claim `connected: true` until the live round-trip is verified.

**Not in scope:** POS360 inventory management or multi-location sync.

---

## Phase C — E.A.T. Live Sync Implementation

**Resolves:** BLOCKER-005

**Goal:** Connect SmokeCraft to a live E.A.T. sync endpoint.

**Scope:**
- Obtain E.A.T. API credentials.
- Implement live E.A.T. connector.
- Test sync round-trip for order events and status updates.
- Update E.A.T. bridge from `not_connected` / `preview_only` to `connected` after verification.

**Not in scope:** E.A.T. loyalty data sync or cross-platform reward exchange.

---

## Phase D — Live Pairing Provider Integration

**Resolves:** BLOCKER-006

**Goal:** Replace `local_intelligence` with a live AI/pairing provider.

**Scope:**
- Select and contract a pairing provider (internal ML model, third-party API, or hybrid).
- Implement provider connector.
- Set `aiBacked: true` and `recommendationStatus: "live_provider"` only after verified connection.
- Maintain `local_intelligence` fallback if provider is unavailable.
- Never claim live AI-backed pairing unless the connection is verified.

**Not in scope:** Training a custom model or building a proprietary flavor graph.

---

## Phase E — Venue Menu Live Source Integration

**Resolves:** BLOCKER-010

**Goal:** Replace `local_fallback` venue menu with a live source.

**Scope:**
- Select a venue menu source (CMS, POS menu sync, or dedicated menu API).
- Implement live menu connector.
- Verify menu sync, stale-data handling, and fallback behavior.
- Update `venueMenuSource` from `local_fallback` to live status after verification.

**Not in scope:** Menu versioning, A/B testing, or dynamic pricing.

---

## Phase F — Reward Redemption Handler

**Resolves:** BLOCKER-011

**Goal:** Activate live reward redemption against a loyalty provider.

**Scope:**
- Implement live redemption handler that deducts XP or loyalty points and triggers reward fulfillment.
- Connect to the loyalty provider configured in Phase G (or independently if loyalty is separate from billing).
- Verify XP deduction, reward issuance, and error recovery end-to-end.
- Ensure DMRC compliance: no auto-purchases without human approval.

**Not in scope:** Third-party loyalty exchange or points transfer.

---

## Phase G — Billing Provider Integration

**Resolves:** BLOCKER-007

**Goal:** Activate live billing using Stripe or equivalent.

**Scope:**
- Configure production Stripe keys (`STRIPE_SECRET_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`) in environment — never hardcoded.
- Implement charge capture, refund, and webhook handling.
- Verify checkout, payment confirmation, and receipt flow end-to-end.
- Switch billing status from `preview_only` to active only after successful live transaction.
- Verify no charges are created in preview or staging.

**Not in scope:** Subscription billing, invoice generation, or tax calculation.

---

## Phase H — License Enforcement Activation

**Resolves:** BLOCKER-009

**Goal:** Activate SmokeCraft license enforcement.

**Scope:**
- Switch license governance service from `previewOnly: true` to enforced mode.
- Implement entitlement checks that reject unauthorized access in production.
- Test license expiry, downgrade, and revocation flows.
- Ensure `licenseEnforced: true` is only set after enforcement is active and tested.

**Not in scope:** License resale, transfer, or multi-seat negotiation.

---

## Phase I — Marketplace Publishing Workflow

**Resolves:** BLOCKER-008

**Goal:** Publish SmokeCraft to the NOVEE OS marketplace.

**Prerequisites:** Phases A, G, H, K, and physical package artifact (Phase J) must be complete.

**Scope:**
- Resolve all 6 marketplace publish blockers.
- Prepare marketplace listing (description, screenshots, pricing, categories).
- Submit for marketplace review.
- Complete final governance review.
- Activate marketplace listing.

**Not in scope:** Marketplace analytics, user reviews, or version auto-update.

---

## Phase J — Production Tenant Isolation

**Resolves:** BLOCKER-002 and BLOCKER-003 (partial)

**Goal:** Verify and activate database-backed tenant isolation and create the physical installable package.

**Scope (Tenant Isolation):**
- Implement database-backed row-level security or equivalent isolation layer.
- Run cross-tenant access tests; confirm `crossTenantAccessAllowed: false` is enforced at the database layer.
- Switch `tenantReady` from `false` to `true` only after verification.

**Scope (Physical Package):**
- Create a `.novee-pkg` or equivalent installable module artifact per the NOVEE OS packaging specification.
- Test install on a clean NOVEE OS instance.
- Verify all routes, services, and assets resolve correctly post-install.
- Switch `physicalArtifactExists` from `false` to `true` only after verified install.

---

## Phase K — Legal / Compliance Review

**Resolves:** BLOCKER-012

**Goal:** Complete legal review before production deployment or marketplace submission.

**Scope:**
- Privacy policy review for SmokeCraft data collection (flavor memory, visit progression, passport stamps).
- Terms of service for SmokeCraft experience module.
- Marketplace listing compliance review.
- Age-verification compliance for tobacco/cigar product context.
- Data retention and deletion policy review.

**Not in scope:** GDPR right-to-erasure implementation (separate engineering phase if required by legal review).

---

## Phase L — Production Deployment Runbook

**Goal:** Document and execute the production deployment of SmokeCraft.

**Prerequisites:** All phases A–K complete, all production blockers resolved, all verification scripts passing against production environment.

**Scope:**
- Write production deployment runbook.
- Define rollback procedure.
- Define health check and monitoring plan.
- Execute staged rollout (internal → beta → GA).
- Smoke-test all SmokeCraft routes and journeys post-deployment.
- Confirm `productionReady: true` only after successful production deployment and smoke-test.

---

## Phase Dependency Map

```
A (Database)
└─► B (POS360)
└─► C (E.A.T.)
└─► F (Redemption)
└─► J (Tenant + Package)
    └─► I (Marketplace) ◄─ G (Billing) ◄─ H (License) ◄─ K (Legal)
        └─► L (Production Runbook)

D (Live Pairing) — independent
E (Venue Menu) — independent
```

---

## What Is Not a Phase

The following are **not** roadmap phases because they are already implemented in the 9-build RC:

- NOVEE OS module packaging foundation
- SmokeCraft module registration
- SmokeCraft journey logic (8-visit / 24-session)
- Flavor Memory position (between Second Third and Final Third)
- Passport Stamp lock rules
- Connections lock rules
- Local ordering, POS bridge (not_connected mode), E.A.T. bridge (not_connected mode)
- Local intelligence pairing
- XP tier system (Ember → Inferno)
- Venue admin, staff operations, analytics
- Integration connector registry (10 categories, all not_connected)
- Enterprise packaging governance
- White-label governance (`canBypassProtectedProgression: false`)
- Marketplace draft hardening (publish always blocked)
- License governance (preview only)
- Feature flag governance (12 flags)
- Final QA and handoff documentation
