# Phase 6 — Novi OS Module Registry Foundation

**Scope note:** This phase builds Novi OS's own read-only catalog of CraftHub's deployable modules. It does not copy any SmokeCraft screen, does not duplicate CraftHub's own registry as a second source of truth, does not build live remote deployment, and does not build billing. Atmosphere Control is not falsely marked ready.

## 1. Files Added

- `docs/phase-6-novi-os-module-registry-audit.md` — audit of existing Novi/NOVEE routes, the (nonexistent) prior Novi registry, vendor-management areas, security/role files, and deployment/device placeholders, done before writing any new code.
- `src/modules/noviModuleRegistry.js` — Novi OS's module records, one per CraftHub module (`smokecraft`, `pos3`, `eat-command-hub`, `atmosphere`), each with `moduleId`, `moduleName`, `sourceSystem: 'CraftHub'`, `version`, `readinessStatus`, `deploymentStatus`, `licenseRequired`, `vendorAssignable`, `standaloneAllowed`, `dependencies`, `optionalIntegrations`, `securityLevel`, `supportedEnvironments`, `controlMode`. Built by deriving every field from the existing CraftHub registry (via `noviModuleBridge.js`) and the Phase 5 readiness validator — not by re-describing the modules from scratch.
- `src/services/noviModuleStatusService.js` — read-only accessors: `getAllNoviModules()`, `getNoviModuleById()`, `getVendorAssignableModules()`, `getStandaloneModules()`, `getNotReadyModules()`, `getModulesBySourceSystem()`.
- `src/modules/noviModuleSecurityPolicy.js` — role-based action rules reusing the Phase 4 role vocabulary (`guest`/`staff`/`manager`/`vendor_admin`/`novi_admin`/`super_admin`): `canViewModuleRegistry()`, `canViewAssignedModulesOnly()`, `canDeployModule()` (always `false` — deployment isn't built), `canManageModuleRegistry()`, `canDisableModuleGlobally()`.
- `server/scripts/verifyNoviModuleRegistry.js` — Node verification script, 25 checks.
- `docs/phase-6-novi-os-module-registry.md` — this file.

## 2. What Novi Can See Now

- All four CraftHub modules, with an honest `readinessStatus`/`controlMode`: SmokeCraft, POS 3, and E.A.T. Command Hub report `controlMode: 'planned_deployable'` (ready, but nothing deploys them yet); Atmosphere reports `controlMode: 'not_ready'`.
- Each module's real dependency/optional-integration data, security level (derived from its actual `permissions`), and supported environments — sourced from the same data CraftHub itself uses, not a second hand-authored copy.
- Filtered views via the status service: vendor-assignable modules (excludes Atmosphere), standalone-allowed modules (all of SmokeCraft/POS3/E.A.T.), and not-ready modules (Atmosphere only).

## 3. What Novi Cannot Control Yet

- There is no `deployModule()` function anywhere in this layer — `canDeployModule()` returns `false` for every role, including `super_admin`.
- `noviModuleRegistry.js` exposes no setter/update function — it is read-only data, built once at import time from the live CraftHub registry.
- No billing, licensing charge, or device contact happens anywhere in this phase. `licenseRequired` is a flag describing a future requirement, not an active check.
- `canDisableModuleGlobally()` exists in the security policy as a rule statement (which role *would* be allowed to do this), but it is not wired to any real remote-disable transport here — that remains the Phase 4 in-memory prototype (`remoteDisableRegistry.js`), unconnected to this Novi-side registry.

## 4. Why This Avoids Duplicate Builds

- `noviModuleRegistry.js` is built from `getAllModules()` (the Phase 3 `noviModuleBridge.js`), which itself reads `src/modules/moduleRegistry.js` — there is exactly one underlying source of module truth. If CraftHub's registry changes, Novi's view updates automatically; nothing needs to be hand-kept in sync.
- The audit (`docs/phase-6-novi-os-module-registry-audit.md`) confirmed no prior Novi module registry existed, so this phase is purely additive — nothing was replaced or migrated.
- The verification script explicitly checks that neither `noviModuleRegistry.js` nor `noviModuleStatusService.js` imports any SmokeCraft page or component path, confirming no screen duplication occurred.
- `noviModuleSecurityPolicy.js` reuses the Phase 4 `roleAccessRules.js` role vocabulary instead of inventing a second role system alongside CraftHub's.

## 5. Checks Run

- `npm run build` — PASS.
- `node server/scripts/verifyNoviModuleRegistry.js` — 25 passed, 0 failed.
- `node server/scripts/verifyModuleRegistry.js` — 13 passed, 0 failed.
- `node server/scripts/verifyVendorModuleSecurity.js` — 14 passed, 0 failed.
- `node server/scripts/verifyDeploymentReadiness.js` — 20 passed, 0 failed.
- `node server/scripts/runPhase6IReadinessChecks.js` — 43 passed, 0 failed.
- `node server/scripts/runPhase6HSecurityChecks.js` — 26 passed, 0 failed.

## 6. Recommended Next Step (Phase 7)

1. Decide where in the existing Novi/NOVEE UI (`NoveeHome.jsx`, `Admin.jsx`, or a new screen) this registry should actually be surfaced to a `novi_admin`/`super_admin` user — today nothing renders it.
2. Connect `noviModuleSecurityPolicy.js`'s rule statements to a real route guard once an actual Novi-side module-management screen exists, rather than leaving them as unconsumed pure functions.
3. Only after a UI consumer exists, consider whether `canDisableModuleGlobally()` should call into the existing Phase 4 `remoteDisableRegistry.js` — and only as its own reviewed step, not bundled into registry work.
4. Continue deferring real deployment, billing, and device control until a live transport and a real Atmosphere Control implementation both exist.
