# Phase 7 — Novi Deployment Center Audit

**Purpose:** Determine where to add a read-only "Module Deployment Center" page inside the existing Novi/NOVEE admin surface, and which existing security mechanism actually gates it, before writing any new code.

## 1. Route Gating Mechanism (the real enforcement point)

`src/App.jsx` lazy-loads admin pages and wraps each in `<ProtectedRoute>`:

```jsx
const Admin = lazy(() => import('./pages/Admin.jsx'))
...
<Route path="admin" element={
  <ProtectedRoute
    allowedRoles={['admin', 'founder_level_0']}
    loginRoute="/admin-login"
    loginLabel="Admin Login"
    lockedMessage="NOVEE OS Admin requires admin-level access or higher."
    demoBlocked
  >
    <Admin />
  </ProtectedRoute>
} />
```

`ProtectedRoute` is the actual route-level gate (redirects unauthorized users to `loginRoute`, shows `lockedMessage` otherwise). It accepts `allowedRoles` (array) or `requiredPermission` (string).

Within a page, `RoleGate`/`PermissionGate` (`src/components/security/`) plus `useSecurity()` (`src/context/SecurityContext.jsx`) provide finer-grained, in-page section gating.

## 2. Role Vocabulary Mismatch (must be documented honestly)

The Phase 4/6 role vocabulary (`src/modules/roleAccessRules.js` — `guest`/`staff`/`manager`/`vendor_admin`/`novi_admin`/`super_admin`) is **not** the same vocabulary the live app actually authenticates against. The real, enforced role hierarchy is defined in `src/config/roleMap.js`:

```
guest (0) → staff (1) → manager (2) → admin (3) → founder_level_0 (4)
```

There is no real `novi_admin` or `super_admin` role anywhere in `SecurityContext`/`roleMap.js` today. This gap already existed before Phase 7 (noted in the Phase 6 audit). For this page, the only honest choice is:

- **Real route enforcement** uses the existing, live mechanism: `allowedRoles={['admin', 'founder_level_0']}` via `ProtectedRoute`, exactly like the existing `/admin` route.
- **In-page labeling** maps these to the Phase 6 concepts narratively — `admin` is referred to as "Novi Admin" and `founder_level_0` as "Super Admin" in the UI copy, since those are the closest real equivalents — but the code does not invent a fake `novi_admin`/`super_admin` session role. This is called out explicitly in the page itself and in `docs/phase-7-novi-deployment-center.md`.

## 3. Where to Add the Page

- `src/pages/` has existing module-specific subfolders (`pos3/`, `eat/`, `passport/`, `smokecraft/`) but no `novi/` subfolder yet.
- Following the existing `*Home.jsx` convention (e.g. `pos3/POS3Home.jsx`), the new page is added at **`src/pages/novi/ModuleDeploymentCenter.jsx`** — a fresh, additive subfolder, not embedded inside `Admin.jsx` (which already has its own large scope: PIN resets, leaderboard panel, POS3 sync status). Keeping it a separate page avoids growing `Admin.jsx` further and gives it its own clean route (`/admin/deployment-center`) nested under the existing `/admin` gate.
- Visual style matches `Admin.jsx`'s existing inline gold-on-dark token system (`GOLD`, `DARK`, `CARD`, `BORDER`, `DIM`) — not Tailwind — for visual consistency with the rest of Novi OS. No existing screen's styling is touched.

## 4. Route Plan

- New lazy import in `App.jsx`: `const ModuleDeploymentCenter = lazy(() => import('./pages/novi/ModuleDeploymentCenter.jsx'))`.
- New nested route under the existing `admin` path: `<Route path="admin/deployment-center" element={<ProtectedRoute allowedRoles={['admin','founder_level_0']} ... ><ModuleDeploymentCenter /></ProtectedRoute>} />`, immediately after the existing `admin` route. This reuses the exact same gating mechanism as `/admin` rather than inventing a new one.

## 5. Data Source

The page renders data exclusively from the Phase 6 read-only surfaces:
- `src/services/noviModuleStatusService.js` (`getAllNoviModules()`) for the four module cards.
- `src/modules/noviModuleSecurityPolicy.js` for the disabled-action messaging (`canDeployModule()` etc., all of which return `false` today).

No SmokeCraft/POS3/E.A.T. screen or component is imported — only the Phase 3/6 read-only data layer.
