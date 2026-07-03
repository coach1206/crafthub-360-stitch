# SmokeCraft Production Blockers

Module Build 9 of 9 — Active Blockers for Production and Marketplace

## Summary

| Category | Count |
|----------|-------|
| Critical blockers | 3 |
| High blockers | 6 |
| Medium blockers | 3 |
| **Total** | **12** |

`approvedForProduction: false`
`approvedForMarketplace: false`

---

## Critical Blockers

### BLOCKER-001 — Database Persistence Not Verified

- **Severity:** critical
- **Affected Area:** database / persistence
- **Current Status:** `memory_fallback` — no `DATABASE_URL` configured
- **Required Resolution:** Configure a production database, run migration suite, verify all SmokeCraft data models persist and recover correctly across restarts.
- **Blocks Production:** Yes
- **Blocks Marketplace:** Yes
- **Blocks License Enforcement:** Yes

### BLOCKER-002 — Tenant Isolation Not Database-Backed

- **Severity:** critical
- **Affected Area:** multi-tenant / isolation
- **Current Status:** `contract_ready` — tenant boundary contracts exist but enforcement depends on database-backed row-level security or equivalent.
- **Required Resolution:** Implement and verify database-backed tenant isolation. Run cross-tenant access tests. Confirm `crossTenantAccessAllowed: false` at the database layer, not just the service layer.
- **Blocks Production:** Yes
- **Blocks Marketplace:** Yes
- **Blocks License Enforcement:** Yes

### BLOCKER-003 — Physical Installable Package Artifact Not Created

- **Severity:** critical
- **Affected Area:** packaging / distribution
- **Current Status:** `not_yet_packaged` — no installable `.novee-pkg` or equivalent artifact exists.
- **Required Resolution:** Create a physical module package artifact following NOVEE OS packaging spec. Test install on a clean NOVEE OS instance.
- **Blocks Production:** Yes
- **Blocks Marketplace:** Yes
- **Blocks License Enforcement:** Yes

---

## High Blockers

### BLOCKER-004 — POS360 Live Sync Not Connected

- **Severity:** high
- **Affected Area:** ordering / POS360
- **Current Status:** `not_connected` — POS360 bridge exists but no live connector is configured.
- **Required Resolution:** Obtain POS360 API credentials, implement live connector, test order submission and status polling end-to-end.
- **Blocks Production:** Yes
- **Blocks Marketplace:** No
- **Blocks License Enforcement:** No

### BLOCKER-005 — E.A.T. Live Sync Not Connected

- **Severity:** high
- **Affected Area:** ordering / E.A.T.
- **Current Status:** `not_connected` — E.A.T. bridge exists but no live connector is configured.
- **Required Resolution:** Obtain E.A.T. API credentials, implement live connector, test sync round-trip.
- **Blocks Production:** Yes
- **Blocks Marketplace:** No
- **Blocks License Enforcement:** No

### BLOCKER-006 — Live AI / Pairing Provider Not Connected

- **Severity:** high
- **Affected Area:** pairing intelligence
- **Current Status:** `local_intelligence` — no live AI or pairing provider is connected.
- **Required Resolution:** Configure a live pairing provider, set `aiBacked: true` only after verified connection, update `recommendationStatus` to reflect live status.
- **Blocks Production:** No
- **Blocks Marketplace:** No
- **Blocks License Enforcement:** No

### BLOCKER-007 — Billing Provider Not Connected

- **Severity:** high
- **Affected Area:** billing / monetization
- **Current Status:** `preview_only` — no live billing provider configured.
- **Required Resolution:** Configure Stripe or equivalent billing provider with production keys. Verify charge capture, refund, and webhook flow end-to-end. No charges are created in preview mode.
- **Blocks Production:** Yes
- **Blocks Marketplace:** Yes
- **Blocks License Enforcement:** Yes

### BLOCKER-008 — Marketplace Not Live

- **Severity:** high
- **Affected Area:** marketplace / distribution
- **Current Status:** `marketplace_draft_only` — publish is blocked by 6 reasons.
- **Required Resolution:** Resolve all 6 marketplace publish blockers: marketplace platform live, license enforcement active, physical package created, production persistence verified, billing connected, final governance review passed.
- **Blocks Production:** No
- **Blocks Marketplace:** Yes
- **Blocks License Enforcement:** No

### BLOCKER-009 — License Enforcement Not Active

- **Severity:** high
- **Affected Area:** licensing / entitlements
- **Current Status:** `license_not_enforced` — license checks return `previewOnly: true`.
- **Required Resolution:** Activate license enforcement. Entitlement checks must reject unauthorized access in production. License governance service must switch from `previewOnly` to enforced mode.
- **Blocks Production:** Yes
- **Blocks Marketplace:** Yes
- **Blocks License Enforcement:** Yes

---

## Medium Blockers

### BLOCKER-010 — Live Venue Menu Provider Not Connected

- **Severity:** medium
- **Affected Area:** ordering / venue menu
- **Current Status:** `local_fallback` — menu is served from local fallback, not a live venue menu provider.
- **Required Resolution:** Configure a live venue menu source or CMS integration. Verify menu sync and fallback behavior.
- **Blocks Production:** No
- **Blocks Marketplace:** No
- **Blocks License Enforcement:** No

### BLOCKER-011 — Reward Redemption Handler Not Active

- **Severity:** medium
- **Affected Area:** rewards / loyalty
- **Current Status:** Reward accrual is modeled; live redemption against a loyalty provider is not active.
- **Required Resolution:** Implement live redemption handler. Connect to loyalty provider. Verify XP deduction and reward fulfillment end-to-end.
- **Blocks Production:** No
- **Blocks Marketplace:** No
- **Blocks License Enforcement:** No

### BLOCKER-012 — Final Legal / Compliance Review Not Completed

- **Severity:** medium
- **Affected Area:** legal / compliance
- **Current Status:** Not started.
- **Required Resolution:** Complete legal review of data handling, privacy policy, terms of service, and marketplace listing requirements. Resolve any compliance findings before production deployment or marketplace submission.
- **Blocks Production:** Yes
- **Blocks Marketplace:** Yes
- **Blocks License Enforcement:** No

---

## Resolution Order (Recommended)

1. Database Persistence (BLOCKER-001) — foundation for all others
2. Legal / Compliance Review (BLOCKER-012) — long lead time
3. Billing Provider (BLOCKER-007) — required for marketplace
4. License Enforcement (BLOCKER-009) — required for marketplace
5. POS360 Live Sync (BLOCKER-004)
6. E.A.T. Live Sync (BLOCKER-005)
7. Venue Menu Provider (BLOCKER-010)
8. Reward Redemption Handler (BLOCKER-011)
9. Tenant Isolation (BLOCKER-002) — after database is production-verified
10. Physical Package Artifact (BLOCKER-003)
11. Marketplace (BLOCKER-008) — after all above resolved
12. Live AI / Pairing Provider (BLOCKER-006) — can proceed independently
