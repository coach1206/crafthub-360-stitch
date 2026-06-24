# Phase 4 — CraftHub Vendor/Module Security Foundation

**Scope note:** This phase adds a prototype-safe security layer that decides whether a vendor/role may use a given module, and records that decision. It does not wire real billing, does not wire live remote deployment, does not duplicate Novi OS, and does not change any working SmokeCraft/POS 3/E.A.T. visuals or guest flow.

## 1. Files Added

- `src/modules/vendorModuleAccess.js` — vendor access record shape (`vendorId`, `vendorName`, `assignedModules`, `enabledModules`, `disabledModules`, `licenseStatus`, `accessLevel`, `expirationDate`, `environment`, `lastCheckedDate`) plus `createVendorAccessRecord()` (honest defaults) and a small in-memory demo registry (`demo-vendor-smokecraft`, `demo-vendor-pos3`, `demo-vendor-eat`, `demo-vendor-expired`, `demo-vendor-expired-date`) used by the verification script.
- `src/modules/roleAccessRules.js` — the six required roles (`guest`, `staff`, `manager`, `vendor_admin`, `novi_admin`, `super_admin`) mapped to the experience types they may reach (`guest_experience`, `staff_tool`, `reports_operations`, `vendor_module_management`, `module_registry_management`, `remote_module_disable`), with `isExperienceAllowedForRole()`.
- `src/modules/moduleSecurityGuard.js` — `checkModuleAccess({ vendorId, moduleId, role, experienceType, environment })`, which checks (in order): module exists, vendor exists, module assigned to vendor, module enabled for vendor, module not remotely disabled, license active, license not expired, environment valid, role allowed for the requested experience. Returns `{ allowed, reason }` with a specific `ACCESS_DENIAL_REASON` — never a generic "no."
- `src/modules/remoteDisableRegistry.js` — `disableModuleForVendor()` / `disableModuleGlobally()`, recording scope/moduleId/vendorId/reason/disabledBy/timestamp/restoreStatus in an in-memory list. `isModuleDisabledForVendor()` is consulted by the security guard.
- `src/modules/deploymentAuditLog.js` — `recordAuditEvent({ vendorId, moduleId, action, status, actorRole, reason, environment, notes })`, an in-memory audit trail with `getAuditLog()` / `getAuditLogForVendor()` / `getAuditLogForModule()`.
- `server/scripts/verifyVendorModuleSecurity.js` — Node verification script, 14 checks covering every rule in Section 6 below.
- `docs/phase-4-crafthub-vendor-module-security.md` — this file.

## 2. Files Modified

- `src/modules/moduleSecurityGuard.js` additionally imports `isModuleDisabledForVendor` from `remoteDisableRegistry.js` so a remote-disable record (global or vendor-scoped) blocks access the same way an `vendor.disabledModules` entry does — these are two related but distinct disable paths (vendor-level disable vs. remote/admin-level disable), both honored.

## 3. Security Rules Implemented

1. Module must exist in `moduleRegistry.js`.
2. Vendor must exist in `vendorModuleAccess.js`.
3. Module must be in the vendor's `assignedModules`.
4. Module must be in the vendor's `enabledModules` and not in `disabledModules`.
5. Module must not have an active remote-disable record (global or vendor-scoped).
6. Vendor's `licenseStatus` must be `active`.
7. Vendor's `expirationDate` (if set) must not be in the past.
8. The requested `environment` must be one of `demo` / `staging` / `production`.
9. The requesting role must be allowed the requested experience type per `roleAccessRules.js`.

Role rules:
- `guest` → guest experiences only.
- `staff` → guest experiences + staff tools.
- `manager` → guest + staff + reports/operations.
- `vendor_admin` → guest + vendor module management (their own assigned modules only — enforced by `checkModuleAccess`'s assignment check, not by role alone).
- `novi_admin` → guest + module registry management.
- `super_admin` → everything, including remote module disable.

## 4. What Is Prototype-Only

- The vendor registry in `vendorModuleAccess.js` is a small hardcoded in-memory object, not a database. Restarting the process resets it.
- `remoteDisableRegistry.js` and `deploymentAuditLog.js` are in-memory arrays — there is no persistence, no real-time push to any device, and no actual remote channel to SmokeCraft/POS 3/E.A.T. hardware or servers.
- `licenseStatus` and `expirationDate` are plain fields a real billing/licensing system would populate — nothing here calls a payment processor or verifies a real subscription.
- "Remote disable" only means "this prototype's in-memory record now says disabled" — no module process is actually stopped, no vendor terminal is actually locked out.

## 5. What Is Not Fake

- `checkModuleAccess()` never returns `allowed: true` without checking real data from `moduleRegistry.js` and `vendorModuleAccess.js` — there is no hardcoded bypass.
- Every denial carries a specific, honest `ACCESS_DENIAL_REASON` (e.g. `license_expired` vs. `module_not_assigned`) rather than a generic failure — callers (and Novi OS later) can tell exactly why access was refused.
- The audit log only records events that were actually passed to `recordAuditEvent()` by real check/disable calls in this run — nothing is pre-seeded as a fake "success" entry.
- The standalone-module rule from Phase 1-3 is preserved: `checkModuleAccess()` for POS 3 / E.A.T. / SmokeCraft never consults or requires another module's assignment — each is independently assignable, verified explicitly in `verifyVendorModuleSecurity.js`.

## 6. Checks Run

- `npm run build` — PASS.
- `node server/scripts/verifyModuleRegistry.js` — 13 passed, 0 failed.
- `node server/scripts/verifyVendorModuleSecurity.js` — 14 passed, 0 failed (guest blocked from staff tools; vendor blocked from an unassigned module; expired-date license blocked; inactive license status blocked; globally-disabled module blocked; POS 3/E.A.T./SmokeCraft all independently assignable; `super_admin` allowed to remotely disable, `vendor_admin` is not; audit log captured the denied events).
- `node server/scripts/runPhase6IReadinessChecks.js` — 43 passed, 0 failed.
- `node server/scripts/runPhase6HSecurityChecks.js` — 26 passed, 0 failed.

## 7. How Novi OS Will Use This Later

- Once a real Novi OS orchestrator exists, it can call `moduleSecurityGuard.checkModuleAccess()` before granting a vendor UI access to a module, instead of re-implementing this logic.
- `remoteDisableRegistry.js` defines the exact shape a future live "kill switch" would need (scope, reason, who, when, restore status) — Phase 5+ work can wire a real transport (e.g. a backend endpoint + websocket push) behind these same function signatures without changing the calling code.
- `deploymentAuditLog.js` gives Novi OS one place to pull a vendor's or module's security history from, ready to be backed by a real persistent store later.

## 8. Recommended Next Step (Phase 5)

1. Replace the in-memory `vendorModuleAccess.js` registry with a real persisted store (database-backed), keeping the same record shape so `moduleSecurityGuard.js` doesn't need to change.
2. Wire a real billing/licensing check behind `licenseStatus`/`expirationDate` instead of hand-set demo values.
3. Build the actual remote transport behind `remoteDisableRegistry.js` (e.g. a backend route + push notification to a vendor's running module instance) — only once there's a real module instance to notify.
4. Decide how/where `checkModuleAccess()` should actually be called from existing routes (e.g. `server/routes/pos3IntegrationRoutes.js`, `server/routes/smokecraftEatRoutes.js`) as a real enforcement point, rather than only being exercised by the verification script.
