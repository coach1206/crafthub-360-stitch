# SmokeCraft Enterprise Packaging and Governance

Module Build 8 of 9 — NOVEE OS SmokeCraft Module

## Overview

This document covers the enterprise packaging metadata, white-label readiness, tenant boundary contracts, license governance preview, entitlement preview, marketplace draft hardening, upgrade/rollback planning, feature flag governance, enterprise readiness evaluation, and governance audit trail for the SmokeCraft Experience Module.

## What Is Real Now

- Enterprise package metadata exists and is maintained in-memory
- White-label readiness metadata exists with governed override rules
- Tenant boundary contracts exist; `crossTenantAccessAllowed: false` is always enforced
- License governance preview exists; entitlements are `preview_only`
- Marketplace draft hardening exists; publishing is always blocked with documented reasons
- Upgrade and rollback preview plans exist (no migration executed)
- Feature flag governance exists with 12 governed flags
- Enterprise readiness review evaluates 16 dimensions
- Governance audit trail records all enterprise review events

## What Is Still Not Real Yet

- SmokeCraft is **not** physically packaged as a production installable module
- Marketplace listing is **not** live
- License enforcement is **not** active — `license_not_enforced`
- Billing is **preview_only** — no charges are created
- Tenant isolation is **not** production-ready; database-backed multi-tenancy is not verified
- POS360 is **not** live-syncing
- E.A.T. is **not** live-syncing
- Database persistence is **not** production-ready without a verified DATABASE_URL

## Architecture

### Data Contracts (`src/modules/smokecraft/data/`)

| File | Purpose |
|------|---------|
| `smokecraftEnterprisePackageContract.js` | Package status, physical package status, install/upgrade statuses |
| `smokecraftWhiteLabelContract.js` | Override permissions, protected brand elements, allowed/blocked tokens |
| `smokecraftTenantContract.js` | Tenant isolation shape, scoped areas, `crossTenantAccessAllowed: false` |
| `smokecraftLicenseGovernanceContract.js` | License states, types, entitlement checks |
| `smokecraftMarketplaceDraftContract.js` | Listing metadata, publish blockers (6 required reasons) |
| `smokecraftFeatureFlagContract.js` | 12 feature flags with defaults and protection rules |

### Backend Services (`server/services/smokecraft/`)

| Service | Purpose |
|---------|---------|
| `smokecraftEnterprisePackageService.js` | Package manifest, enterprise package record |
| `smokecraftWhiteLabelService.js` | Brand override validation, white-label readiness report |
| `smokecraftTenantBoundaryService.js` | Tenant access validation, boundary status |
| `smokecraftLicenseGovernanceService.js` | License state, entitlement checks |
| `smokecraftMarketplaceDraftHardeningService.js` | Marketplace draft, publish blocking |
| `smokecraftUpgradeRollbackService.js` | Upgrade and rollback preview plans |
| `smokecraftFeatureFlagGovernanceService.js` | Flag management, protection enforcement |
| `smokecraftEntitlementPreviewService.js` | Entitlement preview per tenant |
| `smokecraftEnterpriseReadinessService.js` | 16-dimension readiness evaluation |
| `smokecraftGovernanceAuditService.js` | 9 audit event types, governance trail |

### API Routes (`/api/modules/smokecraft/enterprise/`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/status` | Enterprise overview |
| GET | `/package` | Package manifest and metadata |
| GET | `/white-label` | White-label readiness |
| GET | `/tenant/:tenantId` | Tenant boundary status |
| GET | `/license` | License governance state |
| GET | `/marketplace-draft` | Marketplace draft and blockers |
| GET | `/upgrade-rollback` | Upgrade/rollback preview plans |
| GET | `/feature-flags` | Feature flag governance |
| GET | `/entitlements/:tenantId` | Entitlement preview |
| GET | `/readiness` | Enterprise readiness summary |
| GET | `/audit` | Governance audit log |

### Frontend Components (`src/modules/smokecraft/components/`)

| Component | Shows |
|-----------|-------|
| `SmokeCraftEnterpriseReadinessPanel.jsx` | 16-dimension readiness grid, production blockers |
| `SmokeCraftWhiteLabelReadinessPanel.jsx` | Override permissions, protected elements |
| `SmokeCraftLicenseGovernancePanel.jsx` | License state, entitlement table |
| `SmokeCraftMarketplaceDraftPanel.jsx` | Draft metadata, 6 publish-blocked reasons |
| `SmokeCraftTenantBoundaryPanel.jsx` | Boundary status, scoped areas, cross-tenant block |
| `SmokeCraftUpgradeRollbackPanel.jsx` | Version plan, rollback steps, no-migration notice |

## Enterprise Package Statuses

```
packageStatus:         package_candidate
physicalPackageStatus: not_yet_packaged
marketplaceStatus:     marketplace_draft (publish blocked)
licenseStatus:         license_not_enforced
installStatus:         not_installable
```

## Publish Blocked Reasons (all active)

1. `marketplace_not_live`
2. `license_enforcement_not_active`
3. `physical_package_not_created`
4. `production_persistence_not_verified`
5. `billing_not_connected`
6. `final_governance_review_required`

## Feature Flag Defaults

| Flag | Default |
|------|---------|
| `smokecraft.ordering.enabled` | `true` |
| `smokecraft.staffQueue.enabled` | `true` |
| `smokecraft.pairing.localIntelligence.enabled` | `true` |
| `smokecraft.pairing.provider.enabled` | **`false`** |
| `smokecraft.rewards.enabled` | `true` |
| `smokecraft.passport.enabled` | `true` |
| `smokecraft.venueAdmin.enabled` | `true` |
| `smokecraft.whiteLabel.enabled` | **`false`** |
| `smokecraft.marketplaceListing.enabled` | **`false`** |
| `smokecraft.licenseEnforcement.enabled` | **`false`** |
| `smokecraft.billing.enabled` | **`false`** |
| `smokecraft.productionSync.enabled` | **`false`** |

## Production Blockers (all active)

- Database not production-ready (no verified DATABASE_URL)
- POS360 not connected
- E.A.T. not connected
- Pairing provider not connected
- Venue menu provider not connected
- License enforcement not active
- Billing not connected
- Tenant isolation not verified

## What Module Build 9 Should Handle

**MODULE BUILD 9 OF 9 — SmokeCraft Final QA, End-to-End Flow Verification, Documentation Lock, Release Candidate Report, and Handoff Package**

Module Build 9 should run final end-to-end verification across SmokeCraft journey, ordering, pairing, rewards, admin, integrations, enterprise packaging, documentation, protected files, honest statuses, and production blockers. It should produce the release candidate report and handoff package without claiming production readiness that has not been proven.

## Verify

```bash
npm run verify:smokecraft-enterprise-packaging
```
