# Phase 5 — Module Deployment Readiness Layer

**Scope note:** This phase prepares SmokeCraft 360, POS 3, E.A.T. Command Hub, and Atmosphere Control for *future* Novi OS deployment by defining readiness structures only. No module is actually deployed, no billing is charged, no device is contacted, and Novi OS itself is not duplicated. No visual, SmokeCraft flow, or POS/E.A.T. behavior changed.

## 1. Files Added

- `src/modules/deploymentProfiles.js` — the 8 required named profiles (SmokeCraft Only, POS 3 Only, E.A.T. Only, Atmosphere Only, POS 3 + E.A.T., SmokeCraft + POS 3, SmokeCraft + E.A.T., Full CraftHub Suite), each with `modules`, `requiredPermissions`, `requiredEnvironments`, `featureFlags`, `healthRequirements`.
- `src/modules/moduleHealthMonitor.js` — `getModuleHealthSnapshot(moduleId)` reporting `online`, `configValid`, `dependenciesSatisfied`, `registryValid`, `securityValid`, `deploymentReady`, and `issues[]` — every field derived from real registry/validation data, no uptime percentage or invented metric.
- `src/modules/deploymentReadinessValidator.js` — `validateModuleReadiness(moduleId)` (module registered, security configured, permissions configured, routes valid, health valid) and `validateProfileReadiness(profileId)` (profile exists + every included module is ready).
- `src/modules/vendorDeploymentPlanner.js` — `generateDeploymentPlan({ vendorId, profileId, role })` returning `{ vendorId, profileId, modulesIncluded, warnings, requirements, readinessScore }`. Produces a plan only; there is no `deploy()` function anywhere in this file.
- `server/scripts/verifyDeploymentReadiness.js` — Node verification script, 20 checks.
- `docs/phase-5-deployment-readiness.md` — this file.

## 2. What Is Deployment Ready

- **SmokeCraft 360**, **POS 3**, and **E.A.T. Command Hub** each pass `validateModuleReadiness()` — they are registered, have valid permissions/routes, and have no unsatisfied dependencies (each has `dependencies: []`, consistent with Phases 1-4).
- Profiles **SmokeCraft Only**, **POS 3 Only**, **E.A.T. Only**, and **POS 3 + E.A.T.** are all ready, since every module they include is individually ready.

## 3. What Is NOT Deployed (and Honestly Reported as Such)

- **Atmosphere Control** is registered (so Novi OS has a known id to target later) but `validateModuleReadiness('atmosphere')` correctly reports `ready: false` — it has no real implementation, per Phase 1/2's findings, and this phase does not pretend otherwise.
- The **Full CraftHub Suite** profile is therefore also honestly reported as not ready — it includes Atmosphere, and a profile is only as ready as its least-ready module.
- `moduleHealthMonitor.js`'s `online` field means "registered and not disabled/not-built," not "a server process is actually running" — there is no real process supervisor in this prototype.
- `vendorDeploymentPlanner.js` generates a *plan* object only. It has no `deploy()`, no network call, and no side effect beyond reading existing registry/security/readiness data.
- `readinessScore` in a generated plan is the real fraction of included modules that are both deployment-ready and currently access-checked-allowed for that vendor — never a hardcoded 1.0 or invented percentage. A plan for an unknown vendor correctly returns warnings and a score of 0, not a fabricated success.

## 4. What Novi OS Will Control Later

- Once a real Novi OS deployment pipeline exists, it can call `vendorDeploymentPlanner.generateDeploymentPlan()` to get a structured "what would this deployment need" report, then drive an actual deployment process behind that same plan shape — without this layer needing to change.
- `moduleHealthMonitor.js` defines the exact health fields (`online`, `configValid`, `dependenciesSatisfied`, `registryValid`, `securityValid`, `deploymentReady`) a future live health-check service would populate for real, instead of deriving them from static registry data as it does today.
- `deploymentProfiles.js` gives Novi OS a fixed vocabulary of deployment shapes to offer a vendor, rather than needing to assemble arbitrary module combinations ad hoc.

## 5. Checks Run

- `npm run build` — PASS.
- `node server/scripts/verifyModuleRegistry.js` — 13 passed, 0 failed.
- `node server/scripts/verifyVendorModuleSecurity.js` — 14 passed, 0 failed.
- `node server/scripts/verifyDeploymentReadiness.js` — 20 passed, 0 failed.
- `node server/scripts/runPhase6IReadinessChecks.js` — 43 passed, 0 failed.
- `node server/scripts/runPhase6HSecurityChecks.js` — 26 passed, 0 failed.

## 6. Remaining Phases

1. Decide and scope a real Atmosphere Control module before the Full Suite profile (or any Atmosphere-inclusive profile) can honestly report ready.
2. Replace `moduleHealthMonitor.js`'s static-derived `online`/`deploymentReady` fields with a real health-check service once one exists (e.g. an actual HTTP ping per module route).
3. Build the real deployment execution layer behind `vendorDeploymentPlanner.generateDeploymentPlan()` — only after a live transport to a vendor's environment exists, and only as its own reviewed, tested phase per this project's established "document risk, don't force it" rule.
4. Wire `deploymentReadinessValidator.js` and `vendorDeploymentPlanner.js` into an actual Novi OS-facing endpoint or UI, once Novi OS itself begins to be built rather than just prepared for.
