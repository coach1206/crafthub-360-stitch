# Phase 3 — CraftHub-to-Novi OS Integration Contract

**Scope note:** This phase builds the contract and read-only bridge a future Novi OS would use to observe CraftHub's modules. It does not move SmokeCraft into Novi OS, does not duplicate any screens, does not change working visuals, and does not wire any live deployment, device control, or licensing. Everything here is read-only metadata and event scaffolding.

## 1. Files Added

- `src/modules/moduleIntegrationContract.js` — defines the standard module record shape (`id`, `name`, `version`, `status`, `routes`, `permissions`, `dependencies`, `optionalIntegrations`, `vendor`, `deploymentStatus`, `healthStatus`, `lastSync`, `featureFlags`, `notes`), the `MODULE_STATUS` / `HEALTH_STATUS` / `DEPLOYMENT_STATUS` enums, `createModuleContract()` (normalizes a partial config to the full shape with honest defaults — never invents a positive status), and `getMissingRequiredFields()`.
- `src/services/noviModuleBridge.js` — read-only Novi bridge: `getAllModules()`, `getModuleById(id)`, `getDeployableModules()`, `getModuleHealth(id)`, `getModuleRoutes(id)`, `getModulePermissions(id)`. Performs no writes, no deployment, no device control.
- `src/services/moduleOpsEventBridge.js` — builds normalized module-lifecycle events (`module_registered`, `module_enabled`, `module_disabled`, `module_health_checked`, `module_dependency_warning`, `module_vendor_ready`, `module_deployment_placeholder`) and hands them to the existing `opsEventBus.emit()` without altering that bus's shape or behavior.
- `src/modules/validateModuleRegistry.js` — pure (no browser/DOM dependency) validation: required fields present, POS 3 / E.A.T. Command Hub have zero hard dependencies, SmokeCraft has zero hard dependencies, Atmosphere may stand alone.
- `server/scripts/verifyModuleRegistry.js` — Node script that imports the live registry, runs the validator, spot-checks the standalone-module rules, and prints `PASS`/`FAIL` lines plus a final summary (style matches `runPhase6IReadinessChecks.js`).
- `docs/phase-3-crafthub-novi-integration-contract.md` — this file.

## 2. Files Modified

- `src/modules/moduleRegistry.js` — all four module records (`smokecraft`, `pos3`, `eat-command-hub`, `atmosphere`) are now built via `createModuleContract()` instead of being hand-written plain objects. This is a normalization-only change: no route, permission, or dependency values changed, only the structural shape was standardized so every record has the same fields (`deploymentStatus`, `healthStatus`, `lastSync`, `featureFlags`, etc.) regardless of how much detail the source config originally had.

## 3. What Is Read-Only Today

- `noviModuleBridge.js` only reads from `moduleRegistry.js`. It has no setter, no network call, no write to localStorage or any backend.
- `getDeployableModules()` reports which modules have *any* `deploymentStatus` beyond `not_applicable` (i.e. `local_only` or `pending`) — this is not a claim that a module is actually deployed or deployable in production, just that the registry has started tracking deployment state for it.
- `getModuleHealth()` returns whatever `healthStatus` is on the record today, which is `unknown` for every module — there is no live health checker yet.

## 4. What Is Not Fake

- No module reports `healthStatus: 'healthy'` unless a real check sets it — today, all four modules report `unknown`, which is the honest, non-fabricated default from `createModuleContract()`.
- No module reports a completed/successful deployment. `deploymentStatus` is `local_only` for SmokeCraft/POS 3/E.A.T. (reflecting that they exist and run locally, not that they've been remotely deployed) and `not_applicable` for Atmosphere (which doesn't exist as a real module yet).
- `moduleOpsEventBridge.js`'s `emitModuleHealthChecked()` and `emitModuleDeploymentPlaceholder()` take the status as an argument from the caller — they do not default to a fabricated "healthy" or "deployed" value. `emitModuleDeploymentPlaceholder()` is explicitly named to signal "a deployment story exists," never "a deployment happened."
- `opsEventBus.emit()` itself touches `localStorage`/`window`, both already wrapped in try/catch inside `opsStorage.js`/`opsEventBus.js`. This means `moduleOpsEventBridge.js` can be safely imported and exercised under Node (e.g. from a future verification script) without crashing — in a non-browser context the event is normalized and returned, but persistence/dispatch silently no-ops, exactly as the existing bus already behaves outside a browser.

## 5. Standalone-Module Rule, Enforced Structurally

- POS 3 and E.A.T. Command Hub each have `dependencies: []` — verified by `validateModuleRegistry.js` and `verifyModuleRegistry.js`.
- SmokeCraft also has `dependencies: []`; its relationships to POS 3/E.A.T. live only in `optionalIntegrations`, with an explicit `direction` field (e.g. `smokecraft-to-pos3-unidirectional`) confirming the dependency runs one way only.
- This is the same rule from the Phase 1 audit and Phase 2 module configs — Phase 3 adds automated verification of it rather than just documentation.

## 6. How This Prepares Novi OS Integration

- Novi OS (or any orchestrator) now has exactly one read-only import path (`noviModuleBridge.js`) to discover module state, instead of needing to read `moduleRegistry.js` directly or infer status from scattered files.
- The ops event types in `moduleOpsEventBridge.js` give Novi OS a defined vocabulary of module-lifecycle signals it can eventually listen for on the existing ops bus, without requiring a second event system or any change to the bus's existing consumers (SmokeCraft/POS3/E.A.T./NOVEE).
- `verifyModuleRegistry.js` gives CI (or a future Novi OS health endpoint) a single command to confirm the module contract and standalone rules haven't regressed.

## 7. Checks Run

- `npm run build` — see below.
- `node server/scripts/verifyModuleRegistry.js` — 13 passed, 0 failed.
- `node server/scripts/runPhase6IReadinessChecks.js` — see below.
- `node server/scripts/runPhase6HSecurityChecks.js` — see below.

## 8. Recommended Next Step (Phase 4)

1. Decide what a real, live `getModuleHealth()` check would look like for each module (e.g. an HTTP ping for E.A.T./POS 3 routes, a build-time check for SmokeCraft) and wire it behind `moduleOpsEventBridge.js`'s `emitModuleHealthChecked()` — only once an actual check exists, never a guessed value.
2. Decide whether/how Novi OS should subscribe to the module ops events defined here (today nothing subscribes to `module_*` events; the bridge only knows how to emit them).
3. Continue the Phase 2 follow-up: dedicated `*.config.js` files for POS 3 and E.A.T. Command Hub, and a decision on what a real Atmosphere Control module would be, before this contract is asked to describe more than placeholders for them.
