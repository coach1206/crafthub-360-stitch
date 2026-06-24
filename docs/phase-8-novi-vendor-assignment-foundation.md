# Phase 8 — Novi Vendor Assignment + Remote Disable Foundation

**Scope note:** This phase adds honest, prototype-safe vendor assignment, remote disable, and audit logging for Novi-side module management. It builds no live deployment, no billing, no device control, and copies no CraftHub screen.

## 1. Files Added

- `src/modules/noviVendorModuleAssignments.js` — in-memory vendor↔module assignment registry. `assignModuleToVendor()` refuses to create an assignment for a module the Phase 6 registry itself reports as not vendor-assignable (e.g. Atmosphere) rather than silently allowing it or faking readiness. Tracks assignment status, environment, assigned-by/at, and notes; exposes `getAssignedModuleIds()`, `getEnabledModuleIds()`, `getDisabledModuleIds()` per vendor.
- `src/services/noviRemoteDisableService.js` — Novi-side prototype remote disable, mirroring the Phase 4 `remoteDisableRegistry.js` pattern: `disableModuleForVendor()`, `disableModuleGlobally()`, and a `requestRestore()` placeholder that only flips a status flag. No network call, device, or vendor system is touched.
- `src/modules/noviDeploymentAuditLog.js` — in-memory audit log recording assignment/disable/restore preview events (action, module id, vendor id, actor role, status, reason, timestamp, environment, notes).
- `server/scripts/verifyNoviVendorAssignmentFoundation.js` — 16 checks exercising the real modules directly.
- `docs/phase-8-novi-vendor-assignment-foundation.md` — this file.

## 2. What Works Now

- POS 3, E.A.T. Command Hub, and SmokeCraft 360 can each be assigned to a vendor independently — assigning one never assigns or implies the others (verified directly: `getAssignedModuleIds()` for a POS3-only assignment never contains `smokecraft`, and so on for each module).
- Assigning a module the registry reports as `vendorAssignable: false` (Atmosphere, while `not_ready`) is refused outright — `assignModuleToVendor()` returns `{ ok: false, reason: 'module_not_assignable', record: null }`, not a fabricated success.
- Remote disable supports both a single-vendor scope and a global (all-vendors) scope, and a restore-request placeholder that marks a record `requested` without actually restoring anything live.
- Every assignment/disable/restore action taken through the Deployment Center UI is recorded in the Novi audit log with actor role, module, vendor, status, and timestamp.
- The Deployment Center page (`src/pages/novi/ModuleDeploymentCenter.jsx`) now has three new read-only/admin-safe sections — Currently Assigned Modules, Disabled Modules, and an Audit Trail Preview — plus a vendor selector and three working preview buttons per module card: **Assign Vendor Preview**, **Disable Module Preview**, **Restore Module Preview**.

## 3. What Is Prototype-Only

- Every action created through this page is explicitly labeled `Prototype only. No live deployment sent.` — visible both as inline text near each module card's action row and as the `title` attribute on every preview button.
- "Assign", "disable", and "restore" here mean: write an in-memory record and an audit log entry. No vendor system, POS terminal, or device is contacted.
- All data is in-memory only — restarting or reloading the app clears every assignment, disable record, and audit entry, the same as every prior phase's prototype data.

## 4. What Is Not Live

- **Deploy Module** remains permanently disabled (`disabled` HTML attribute, no `onClick`, no `deployModule()`/`handleDeploy()` function anywhere in the new layer or the page) — live deployment is still not built.
- No billing, licensing charge, or payment verification happens anywhere in this phase.
- No device control, POS terminal contact, or vendor-system network call happens anywhere in this phase.
- `requestRestore()` only changes a local status field — it does not reach any live system to actually restore service.

## 5. Security Notes

- The Deployment Center route remains gated exactly as in Phase 7: `<ProtectedRoute allowedRoles={['admin', 'founder_level_0']} ... demoBlocked>` in `src/App.jsx`. No new route or public path was added — guests, staff, and vendor accounts cannot reach this page.
- No new session role was introduced. The Phase 4/6 vocabulary (`novi_admin`/`super_admin`) is still used only for in-page display labels ("Novi Admin"/"Super Admin"), mapped from the real `admin`/`founder_level_0` roles, per the Phase 7 audit's documented resolution.
- The vendor selector on the page reuses the existing Phase 4 demo vendor list (`vendorModuleAccess.js`'s `listVendors()`) rather than inventing a new vendor source.

## 6. How This Prepares Phase 9

- The assignment registry, disable service, and audit log built here give Phase 9 (live deployment) a real place to write to once an actual deployment transport exists — `assignModuleToVendor()`'s readiness check, `disableModuleForVendor()`/`disableModuleGlobally()`, and the audit trail can all be reused unchanged; only a real `deployModule()` function and its wiring need to be added on top.
- Because Atmosphere's assignment is already refused at this layer based on the same `controlMode`/`vendorAssignable` data Phase 6 derived, Phase 9 does not need to re-implement that guard — it inherits it for free as long as Atmosphere stays `not_ready`.
