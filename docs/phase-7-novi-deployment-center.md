# Phase 7 — Novi Deployment Center (Read-Only UI)

**Scope note:** This phase adds a read-only Novi OS admin screen showing which CraftHub modules exist, which are standalone, which are ready, and which are not ready. It builds no live deployment, no billing, no device control, copies no CraftHub screen, and does not fake Atmosphere readiness.

## 1. Route Added

`src/App.jsx` adds a new lazy import and a nested route under the existing `/admin` path:

```jsx
const ModuleDeploymentCenter = lazy(() => import('./pages/novi/ModuleDeploymentCenter.jsx'))
...
<Route path="admin/deployment-center" element={
  <ProtectedRoute
    allowedRoles={['admin', 'founder_level_0']}
    loginRoute="/admin-login"
    loginLabel="Admin Login"
    lockedMessage="Module Deployment Center requires Novi admin-level access or higher."
    demoBlocked
  >
    <ModuleDeploymentCenter />
  </ProtectedRoute>
} />
```

This reuses the exact same `ProtectedRoute` gating mechanism already protecting `/admin` — no new enforcement code, no new role system. See `docs/phase-7-novi-deployment-center-audit.md` for the full audit, including the role-vocabulary discrepancy between the Phase 4/6 vocabulary (`novi_admin`/`super_admin`) and the real, enforced roles (`admin`/`founder_level_0`) defined in `src/config/roleMap.js`.

## 2. UI Behavior

`src/pages/novi/ModuleDeploymentCenter.jsx` renders one card per module returned by `getAllNoviModules()` (Phase 6, `src/services/noviModuleStatusService.js`) — currently SmokeCraft 360, POS 3, E.A.T. Command Hub, and Atmosphere Control. Each card shows, sourced entirely from the registry data (nothing hand re-described):

- Module name, source system, version
- Readiness label: **Ready** or **Not Ready**
- Deployment status and control mode label (**Read Only** / **Planned Deployable** / **Not Ready**)
- **Standalone** / **Not Standalone**
- **Vendor Assignable** / **Not Vendor Assignable**
- Security level
- Supported environments
- Dependencies (or "None")
- Optional integrations, each as an **Optional Integration: {id}** badge (or "None")

Atmosphere Control's `controlMode` is `CONTROL_MODE.NOT_READY` in the Phase 6 registry, so it renders **Not Ready** and **Not Vendor Assignable** honestly — nothing in this page overrides or fakes that status.

## 3. Security Behavior

- Route-level: only `admin` and `founder_level_0` roles can reach `/admin/deployment-center`; everyone else is redirected to `/admin-login` with a locked message. The route is also `demoBlocked`, matching the existing `/admin` route.
- In-page: a static info card states plainly that the screen is Novi admin / super admin only, that deployment actions are not active yet, and that live vendor assignment, billing, and device control are future phases.
- Display-only role labels: the signed-in role (`admin` or `founder_level_0`) is shown as "Novi Admin" / "Super Admin" respectively — these are presentation labels only, not new session roles.

## 4. What Remains Disabled

Every module card renders four action buttons — **Assign Vendor**, **Deploy Module**, **Disable Module**, **View Audit Log** — each:

- `disabled` (HTML attribute, not just styled to look disabled)
- Labeled with trailing text "— Coming in Phase 8/9"
- Has no `onClick` handler anywhere in the page (verified by `server/scripts/verifyNoviDeploymentCenter.js`)
- There is no `deployModule()`/`handleDeploy()` function anywhere in this page

No fake clicks, no fake success/failure messages, no simulated progress. This page only reads and displays Phase 6 data.

## 5. Verification

- `server/scripts/verifyNoviDeploymentCenter.js` — 16 static, file-system-level checks: page exists, all four modules render via `getAllNoviModules()` (no hardcoded duplicate list), Atmosphere reports `NOT_READY`, no deploy function exists, no `onClick` handlers exist, all four required buttons are present and disabled with the Phase 8/9 messaging, the route is protected by `ProtectedRoute` with the correct `allowedRoles` and `demoBlocked`, and the page imports no SmokeCraft/POS3/E.A.T. screen or component.

## 6. Recommended Next Step (Phase 8)

1. Build the real vendor-assignment flow (wiring "Assign Vendor" to `vendorModuleAccess.js` / `noviModuleSecurityPolicy.js`'s rule statements) for modules that are actually vendor-assignable.
2. Connect "Disable Module" to the existing Phase 4 `remoteDisableRegistry.js` transport, scoped first to a single vendor before any global disable.
3. Wire "View Audit Log" to `deploymentAuditLog.js` as a true read view before any write actions are added.
4. Continue deferring "Deploy Module" (live deployment) and billing until a real Atmosphere Control implementation exists and `canDeployModule()` can honestly return `true` for at least one module/role pair.
