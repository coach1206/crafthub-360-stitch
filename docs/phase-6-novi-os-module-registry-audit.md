# Phase 6 — Novi OS Module Registry Audit

**Purpose:** Map what exists today on the Novi OS / NOVEE side of the codebase before building `src/modules/noviModuleRegistry.js`, so Phase 6 builds on real structure rather than guessing at it.

## 1. Current Admin/Dashboard Routes (Novi/NOVEE)

All defined in `src/App.jsx` — there is no `src/pages/admin/`, `src/pages/founder/`, or `src/pages/novi*/` subdirectory; these are flat files directly under `src/pages/`.

- `src/pages/NoveeHome.jsx` — card-grid hub linking to CraftHub, SmokeCraft, POS 3, E.A.T., DayOne360, Leaderboard. Routed at `home` and gated `novee-home`.
- `src/pages/Admin.jsx` — "NOVEE OS Administration Screen," gated behind `lockedMessage: "NOVEE OS Admin... requires admin-level access or higher"`.
- `src/pages/FounderControl.jsx` — Founder Level 0 exclusive screen.
- `NOVEELoader` (in `App.jsx`) — boot/suspense fallback shown while routes load ("Loading NOVEE OS module…").
- `novee-vault` route — "NOVEE Vault requires elevated system access."
- Ultra Command Center route — "NOVEE OS Ultra Command Center."
- A legacy `/novee` route redirects to `/ultra-command-center`.

## 2. Existing Novi-Specific Module Registry

**None exists.** No `noviModuleRegistry.js`, `noviAppRegistry.js`, or equivalent. The only Novi-side artifact today is `src/services/noviModuleBridge.js` (Phase 3) — explicitly a read-only observer over CraftHub's own `src/modules/moduleRegistry.js`, not a separate registry. Nothing in `src/pages` currently imports this bridge; it has no consumer yet. This confirms Phase 6 is additive, not duplicative — there is no existing Novi registry to conflict with or overwrite.

## 3. Vendor Management Areas

Beyond the Phase 1-5 CraftHub-side files (`src/modules/vendorModuleAccess.js`, `moduleSecurityGuard.js`, `roleAccessRules.js`, `remoteDisableRegistry.js`, `deploymentAuditLog.js`, `vendorDeploymentPlanner.js`), the only other "vendor" hits in `src/` are incidental marketing-copy mentions (`DayOneTravel.jsx`, `PassportDirectory.jsx`, `PassportHowItWorks.jsx`, `InvestorDemo.jsx`, `demoModeConfig.js`) — none are vendor-management infrastructure. **No Novi/admin page has a dedicated vendor management UI today.**

## 4. Security/Role Files Referenced by Novi Pages

- `src/pages/Admin.jsx` imports `src/components/security/RoleGate.jsx`, `src/components/security/PermissionGate.jsx`, and `src/services/adminApiService.js` (uses permission strings such as `access_pos3_manager`, `access_eat_command`, `view_audit_logs`, `manage_staff`, `manage_integrations`, and role arrays like `['manager','admin','founder_level_0']`).
- `src/pages/FounderControl.jsx` imports `src/services/founderApiService.js` and `src/context/SecurityContext.jsx`.
- Neither imports the Phase 4 `src/modules/roleAccessRules.js` — that file currently lives independently in `src/modules/`, with its own role vocabulary (`guest`/`staff`/`manager`/`vendor_admin`/`novi_admin`/`super_admin`) distinct from `Admin.jsx`'s ad hoc role strings (`'admin'`, `'founder_level_0'`). Phase 6 reuses `roleAccessRules.js`'s vocabulary rather than inventing a third one.

## 5. Deployment/Device-Control Placeholders

Beyond the Phase 5 files (`deploymentProfiles.js`, `moduleHealthMonitor.js`, `deploymentReadinessValidator.js`, `vendorDeploymentPlanner.js`), "deploy"/"device" terms appear in: `src/pages/eat/EATDeviceMode.jsx`, `src/pages/pos3/POS3Settings.jsx`, `src/pages/DeviceStatus.jsx`, `src/pages/InstallHelp.jsx`, `src/pages/KioskSetup.jsx`, `src/pages/SystemOverview.jsx`, and a few demo pages. None of these reference the Phase 5 deployment-readiness modules — they are independent, existing CraftHub-side hardware/kiosk UI, out of scope for this phase.

## 6. CraftHub Overlap

**Zero overlap today.** No page under `src/pages` imports `moduleRegistry.js`, `noviModuleBridge.js`, or `moduleOpsEventBridge.js`. The Phase 3 bridge exists but is unconsumed — it is the clean integration seam Phase 6's `noviModuleRegistry.js` should build on (by importing from `noviModuleBridge.js`/`moduleRegistry.js`, never by copying CraftHub's module data).

## 7. Conclusion for Phase 6

- There is nothing to deduplicate — no prior Novi module registry exists.
- The Phase 6 registry should source its module list from the existing CraftHub registry (via `noviModuleBridge.js`/`moduleRegistry.js`) rather than re-describing SmokeCraft/POS3/E.A.T./Atmosphere from scratch, to avoid drift between the two registries.
- Phase 6 should reuse `roleAccessRules.js`'s role vocabulary for consistency with Phase 4, rather than inventing new role names.
- No existing Novi screen needs to change for this phase — the registry and its security policy are new, additive files only.
