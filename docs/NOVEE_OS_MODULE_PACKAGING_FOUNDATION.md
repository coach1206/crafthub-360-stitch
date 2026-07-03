# NOVEE OS Module Packaging Foundation (NOMPF)

## Module Build 1 of 9 — Post-Phase Module Build Series

**This is not Phase 20.**
This is the first build in the Post-Phase Module Build Series that follows the sealed 19-phase core build.

---

## NOVEE OS Platform Clarification

**NOVEE OS is platform software — not a website.**

NOVEE OS is the operating and module layer that:
- Hosts installable modules
- Controls module activation, licensing, and permissions
- Manages tenant/venue access
- Handles upgrades, rollback, and marketplace readiness
- Provides the foundation for all venue hospitality operations

**noveeos.com is the public-facing portal** — the customer access point, marketplace storefront, documentation hub, login entry, sales layer, and support area. It is a separate system from the NOVEE OS platform itself.

---

## What Module Build 1 Creates

The NOVEE OS Module Packaging Foundation (NOMPF) is the operating layer that all future modules plug into.

Module Build 1 creates:
- Module manifest schema (canonical shape for all module manifests)
- Module registry (central in-memory registry, database-ready)
- Module dependency service (dependency mapping, conflict detection)
- Module activation service (preview-only activation state model)
- Module lifecycle hook service (install/uninstall/enable/disable/upgrade/rollback previews)
- Module versioning service (semver comparison, upgrade/rollback planning previews)
- Module permission service (role-to-module permission mapping)
- Module route registry service (route registration preview)
- Module service registry service (service registration preview)
- Module UI component registry service (component registration preview)
- Module hook registry service (E.A.T., POS360, NCIE, checkout, staff, KDS, LOCC, EOCG, audit hooks)
- Module audit service (preview-only audit trail)
- Module marketplace draft service (listing drafts — not live marketplace)
- Module license readiness service (license requirements — not enforced yet)
- Initial module manifests (15 draft manifests for the full module series)
- API routes (`/api/modules/*`)
- UI components (`src/components/modules/`)
- E.A.T. hooks for all NOMPF subsystems
- Documentation

---

## What Module Build 1 Does Not Create

- Live marketplace (not_live_marketplace)
- License enforcement (license_not_enforced)
- Physical module install/uninstall execution (preview_only)
- Individual business module packages (SmokeCraft, POS360, E.A.T., etc.)
- Module registry persistence without DATABASE_URL (module_registry_in_memory_only)
- White-label enforcement
- Tenant billing or subscription management
- Phase 20 (there is no Phase 20)

---

## Module Manifest Schema

Every NOVEE OS module manifest includes:

| Field | Description |
|---|---|
| `moduleId` | Unique identifier |
| `moduleName` | Display name |
| `moduleSlug` | URL-safe slug |
| `moduleType` | One of 11 module types |
| `moduleCategory` | hospitality, commerce, inventory, operations, etc. |
| `moduleDescription` | Description |
| `moduleVersion` | Semver string |
| `moduleStatus` | Current module status |
| `coreOrAddon` | `core` or `addon` |
| `premiumEligible` | Premium tier flag |
| `enterpriseEligible` | Enterprise tier flag |
| `whiteLabelEligible` | White-label flag |
| `marketplaceEligible` | Marketplace listing flag |
| `dependencies` | Required module IDs |
| `optionalDependencies` | Optional module IDs |
| `incompatibleModules` | Conflicting module IDs |
| `requiredServices` | Backend services required |
| `requiredRoutes` | API routes required |
| `requiredComponents` | UI components required |
| `requiredHooks` | Hooks required |
| `requiredPermissions` | Permission keys |
| `requiredEnvVars` | Environment variables required |
| `requiredMigrations` | DB migrations required |
| `requiredDocs` | Documentation required |
| `installHooks` | Install hook identifiers |
| `uninstallHooks` | Uninstall hook identifiers |
| `enableHooks` | Enable hook identifiers |
| `disableHooks` | Disable hook identifiers |
| `upgradeHooks` | Upgrade hook identifiers |
| `rollbackHooks` | Rollback hook identifiers |
| `licenseRequirements` | License tier and enforcement status |
| `pricingModel` | Pricing model |
| `tenantScope` | Tenant activation scope |
| `venueScope` | Venue activation scope |
| `createdAt` / `updatedAt` | Timestamps |

### Module Types

- `core_platform`, `experience_module`, `commerce_module`, `management_module`
- `inventory_module`, `connector_module`, `intelligence_module`, `operations_module`
- `marketplace_module`, `licensing_module`, `addon_module`

### Module Statuses

- `manifest_ready`, `registered`, `installed`, `enabled`, `disabled`
- `uninstall_ready`, `upgrade_available`, `rollback_available`
- `dependency_blocked`, `license_blocked`, `marketplace_draft`
- `white_label_ready`, `not_yet_packaged`

---

## Module Registry Foundation

The module registry (`moduleRegistryService.js`) operates in:
- **In-memory mode** when `DATABASE_URL` is not configured (`module_registry_in_memory_only`, `database_required`)
- **Database mode** when `DATABASE_URL` is configured (durable registry)

The registry is seeded at startup with all 15 initial module draft manifests. All modules have status `not_yet_packaged`.

---

## Dependency Rules

- All modules must declare their `dependencies` array
- `nompf-core` is the base dependency for all modules
- Circular dependencies are detected and blocked
- Missing dependencies return `dependency_blocked`
- Optional dependencies return `optional_dependency_missing` (not blocking)

---

## Activation Preview Rules

- Module activation is **preview-only** in Module Build 1
- No code is physically installed or removed
- Activation state is held in memory
- Activation requires: dependencies satisfied, required env vars present
- Venue-level and tenant-level activation scopes are modeled

---

## Install/Uninstall Hook Preview Rules

- All lifecycle hooks are **preview-only** in Module Build 1
- `install_preview_ready`, `uninstall_preview_ready`, etc.
- No destructive operations are performed
- Hooks are defined per manifest; execution requires Module Build 2+

---

## Versioning and Rollback Planning

- Semver (`major.minor.patch`) comparison is supported
- Upgrade paths and rollback paths are preview-validated
- All modules start at `0.0.0`
- Live upgrade execution requires Module Build 2+

---

## Permission Map

Module permissions are mapped per role without breaking existing role behavior:

| Role Category | Default Module Access |
|---|---|
| `guest`, `customer`, `server`, `bartender`, `kitchen_staff`, `humidor_staff`, `cashier`, `host`, `busser` | `preview_only` |
| `manager` | `permission_granted` for most modules; `owner_required` for add-ons |
| `owner`, `admin`, `internal_admin`, `reseller_admin` | `permission_granted` |

---

## Route Registry

Module routes are registered in preview mode. Existing platform routes are **not remounted or replaced**. Route conflict detection is available.

Endpoint: `GET /api/modules/routes/:moduleId`

---

## Service Registry

Module services are registered in preview mode. Existing platform services are not replaced.

Endpoint: `GET /api/modules/services/:moduleId`

---

## Component Registry

Module UI components are registered in preview mode. Existing approved screens are not modified.

Endpoint: `GET /api/modules/components/:moduleId`

---

## Hook Registry

Supported hook systems: `eat`, `pos360`, `ncie`, `checkout`, `staff`, `kds`, `locc`, `eocg`, `audit`

Endpoint: `GET /api/modules/hooks/:moduleId`

---

## Audit Trail

Module audit events are tracked in memory (`audit_preview_only`). Database persistence requires `DATABASE_URL`.

Supported audit events include: `module_manifest_registered`, `module_activation_preview`, `module_install_preview`, `module_permission_checked`, `module_license_checked`, `module_marketplace_draft_created`, and more.

Endpoint: `GET /api/modules/audit`

---

## Marketplace Draft Readiness

Module listing drafts are prepared but the live marketplace does not exist yet:

- `not_live_marketplace`
- `marketplace_not_live: true`
- `listing_drafts_only: true`
- `live_marketplace: false`

Endpoint: `GET /api/modules/marketplace-drafts`

---

## License Readiness

License requirements are mapped but not enforced:

- `license_gate_required`
- `license_not_enforced`
- `license_gate_built: false`
- `preview_only`

License tiers: `none`, `standard`, `premium`, `enterprise`, `white_label`, `reseller`

Endpoint: `GET /api/modules/license-readiness`

---

## Initial Module Draft List (15 Modules)

All initial modules have status `not_yet_packaged` / `needs_module_manifest`:

1. SmokeCraft Experience Module
2. POS360 Module
3. E.A.T. Command Hub Module
4. Inventory Availability Module (ISPAE)
5. Reorder Connector Add-On Module (DMRC)
6. Live Operations Command Center Module (LOCC)
7. External Operations Connector Gateway Module (EOCG)
8. Venue Onboarding Module
9. Partner Vendor Module
10. Payment / Checkout Module
11. KDS Module
12. NCIE Module
13. Passport Connections Module
14. White-Label Licensing Module
15. Marketplace Registry Module

Endpoint: `GET /api/modules/initial-manifests`

---

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/modules/foundation/readiness` | Full NOMPF readiness report |
| `GET /api/modules/registry` | Module registry report |
| `GET /api/modules/registry/:moduleId` | Single module manifest |
| `POST /api/modules/registry/register-preview` | Register module manifest (preview) |
| `GET /api/modules/dependencies/:moduleId` | Dependency readiness |
| `GET /api/modules/activation/:moduleId` | Activation readiness |
| `POST /api/modules/activation/:moduleId/activate-preview` | Activate module (preview) |
| `POST /api/modules/activation/:moduleId/deactivate-preview` | Deactivate module (preview) |
| `GET /api/modules/lifecycle/:moduleId` | Lifecycle hook readiness |
| `POST /api/modules/lifecycle/:moduleId/install-preview` | Run install hooks (preview) |
| `POST /api/modules/lifecycle/:moduleId/uninstall-preview` | Run uninstall hooks (preview) |
| `GET /api/modules/versioning/:moduleId` | Version readiness |
| `GET /api/modules/permissions/:moduleId` | Permission map |
| `GET /api/modules/routes/:moduleId` | Route registry |
| `GET /api/modules/services/:moduleId` | Service registry |
| `GET /api/modules/components/:moduleId` | Component registry |
| `GET /api/modules/hooks/:moduleId` | Hook registry |
| `GET /api/modules/audit` | Audit trail |
| `GET /api/modules/marketplace-drafts` | Marketplace drafts |
| `GET /api/modules/license-readiness` | License readiness |
| `GET /api/modules/initial-manifests` | All 15 initial module drafts |

---

## Post-Build Next Sequence

**Next: MODULE BUILD 2 — SmokeCraft Experience Module**

| Build | Name | Status |
|---|---|---|
| 1 | NOVEE OS Module Packaging Foundation | **complete** |
| 2 | SmokeCraft Experience Module | **next** |
| 3 | POS360 Module | pending |
| 4 | E.A.T. Command Hub Module | pending |
| 5 | Inventory Availability Module (ISPAE) | pending |
| 6 | Reorder Connector Add-On (DMRC) | pending |
| 7 | LOCC Module | pending |
| 8 | EOCG Module | pending |
| 9 | White-Label Marketplace Licensing Module | pending |

---

## Why This Is Not Phase 20

The 19-phase core build is sealed and complete. The Post-Phase Module Build Series is a separate sequence that builds installable module packages on top of the sealed core. It is labeled Module Build 1 through 9, not Phase 20. No Phase 20 exists or will exist.
