# Production Lockdown — Phase 4: Backend Auth + Session Verification Report

## A. Executive Summary

A real, mature backend auth system already exists (`server/routes/authRoutes.js`,
`server/middleware/authMiddleware.js`, `server/services/authService.js`):
JWT-in-HttpOnly-cookie sessions, per-role login endpoints, `/api/auth/me`
identity lookup, and route-level `requireAuth`/`requireStaff`/`requireManager`/`requireAdmin`
middleware enforced server-side on POS3/E.A.T./admin API routes. Dev-only
headers and the prototype guest fallback are hard-blocked in production
regardless of any env var. This backend was not missing — it simply wasn't
being trusted consistently by the frontend.

The audit found two frontend code paths that bypassed this backend entirely
and granted privileged (including founder) access based purely on
client-writable storage, with no server round-trip:

1. `ProtectedRoute.jsx` checked `sessionStorage['smokecraft_staff_session'].role === 'founder'` as an unconditional master bypass, ahead of every other check, in every environment (not gated by `import.meta.env.DEV`).
2. `BootConsole.jsx` used the same sessionStorage check (twice) to unlock the founder/admin boot console UI.
3. `SecurityContext.jsx`'s `localStorage['novee_admin_session']` prototype-role fallback was readable and settable in production builds, not just development.

All three are fixed this phase: route/UI privilege decisions now resolve
through `isFounder()`/`role`, which is sourced from `SecurityContext`, which
in turn prefers the backend-verified JWT (`AuthContext.authUser`) and falls
back to the localStorage prototype role **only when `import.meta.env.DEV` is
true**. In production, that fallback is statically eliminated and `setRole()`
is a no-op. No backend changes were needed — the backend contract already
covers login, logout, session verification, and role lookup.

## B. Current Auth Flow

1. **Login** — `StaffLogin.jsx` / `AdminLogin.jsx` / `FounderLogin.jsx` / `MentorLogin.jsx` / `DevLogin.jsx` call `AuthContext.loginStaff/loginAdmin/loginFounder/loginMentor/loginDev`, which call `authApiService` → `POST /api/auth/{staff-pin,admin,founder,mentor,dev}-login`. On success the backend sets an HttpOnly JWT cookie (`novee_auth`) and returns the verified user; `AuthContext` stores that in React state (`authUser`).
2. **Session restore** — On mount, `AuthContext` calls `GET /api/auth/me` (cookie sent automatically). If a valid, non-revoked JWT is present, the backend returns the authoritative role; otherwise `authenticated: false`.
3. **Role resolution for UI** — `SecurityContext` reads `AuthContext.authUser` first. Only if there is no real JWT session does it fall back to a `localStorage` prototype role — and as of this phase, only in `import.meta.env.DEV`.
4. **Route gating (UI only)** — `ProtectedRoute.jsx` uses `SecurityContext`'s `role`/`isFounder()`/`hasPermission()` to decide whether to render a page or an "Access Restricted" screen.
5. **Route gating (API, authoritative)** — Every POS3/E.A.T./admin server route is independently wrapped in `requireAuth` + `requireStaff`/`requireManager`/`requireAdmin` (see `server/routes/pos3IntegrationRoutes.js`, `adminRoutes.js`). This is the real enforcement layer; the frontend gate is a UX convenience, not a security boundary, by design and by the codebase's own documentation.
6. **Logout** — `AuthContext.logout()` calls `POST /api/auth/logout` (revokes the session) and clears the local prototype key.

## C. Client-Trusted Risks (found this phase)

| Risk | Location | Severity before fix |
|---|---|---|
| Unconditional founder bypass via `sessionStorage['smokecraft_staff_session']`, settable via devtools with no backend check | `ProtectedRoute.jsx` (every protected route, every environment) | Critical — full founder bypass reachable in production by anyone who opens devtools |
| Same sessionStorage check unlocking the founder/admin boot console | `BootConsole.jsx` (×2) | High — UI-only exposure, no protected data, but reveals internal admin UI |
| `localStorage['novee_admin_session']` prototype role readable/writable in production builds | `SecurityContext.jsx` | High — same bypass vector, also production-reachable prior to this fix |

None of these required a working backend session — an attacker only needed
to know the storage key names, which were (and remain) visible in the
shipped JS as plain string literals. Closing them required removing the
client-trust *read paths*, not hiding the key names.

## D. Backend Endpoint Availability

A backend auth/session system **already exists** and is production-hardened:

- `POST /api/auth/staff-pin-login`, `/admin-login`, `/founder-login`, `/mentor-login`, `/dev-login` — role-specific login, issue JWT cookie.
- `GET /api/auth/me` — authoritative session/role lookup (`requireAuth`).
- `POST /api/auth/logout`, `/refresh`, `/revoke-session` — session lifecycle.
- `POST /api/auth/promote-member`, `/passport-refresh` — Passport Member flows.
- `authMiddleware.js` — `requireAuth`/`optionalAuth`: verifies JWT (cookie or Bearer), checks revocation, hard-blocks dev headers and prototype guest fallback in production.
- `roleMiddleware.js` — `requireStaff`/`requireManager`/`requireAdmin` etc., applied directly on POS3/E.A.T./admin API routes server-side.

No new backend endpoint was required for this phase. The one gap noted in
Phase 3 remains: there is no backend "staff email + PIN" handoff endpoint
matching `StaffHandoffLoginModal`'s email+PIN form (the existing
`staff-pin-login` is PIN-only). That gap is documented again in Section F
below; it does not block this phase's fix since the modal is already
disabled in production (Phase 3).

## E. Changes Applied

1. **`src/components/security/ProtectedRoute.jsx`**
   - Removed the `loadStaffSession()` import and the `staffSession?.role === 'founder'` sessionStorage bypass.
   - Founder master access now resolves solely through `isFounder()` (SecurityContext), which prefers the backend-verified JWT role.

2. **`src/context/SecurityContext.jsx`**
   - `readStoredSession()` now returns `null` unconditionally when `import.meta.env.DEV` is false — the localStorage prototype role is never read in production, and Vite/Rollup eliminates that branch from the production bundle.
   - `setRole()` now no-ops (with a console warning) when `import.meta.env.DEV` is false, so even a manual `setRole()` call from production code can no longer write a role to localStorage.

3. **`src/pages/BootConsole.jsx`**
   - Removed the `loadStaffSession` import and both `staffSession?.role === 'founder'` checks. Boot console privilege now depends solely on `BOOT_ALLOWED_ROLES.has(role)`, where `role` comes from `SecurityContext` (backend-first).

4. **Verification**
   - `npm run build` — passed cleanly, no errors.
   - Confirmed via code review that `StaffHandoffButton.jsx`'s `setRole()`/`saveStaffSession()` calls (only reachable through the already-disabled-in-production `StaffHandoffLoginModal`, per Phase 3) no longer have any effect on route access even if somehow triggered, since neither storage location is trusted by `ProtectedRoute` or `BootConsole` anymore.

No backend files were modified — the existing backend contract was already sufficient.

## F. Remaining Backend Contract

The backend already implements the full contract for real-identity auth.
One gap remains, carried over from Phase 3:

| Need | Status |
|---|---|
| Login (staff/admin/founder/mentor/dev) | ✅ Exists — `/api/auth/{staff-pin,admin,founder,mentor,dev}-login` |
| Logout | ✅ Exists — `/api/auth/logout` |
| Verify session | ✅ Exists — `GET /api/auth/me`, enforced via `requireAuth` on protected API routes |
| Role lookup | ✅ Exists — role returned by `/api/auth/me` and embedded in the JWT, checked server-side by `roleMiddleware.js` |
| Staff handoff auth (email + PIN, for the SmokeCraft → POS3/E.A.T. handoff specifically) | ❌ Missing — only a PIN-only `staff-pin-login` exists; `StaffHandoffLoginModal`'s email+PIN form has no backend counterpart, so it remains disabled in production (Phase 3 fix) |

Recommended contract for the missing endpoint, if this handoff flow should
ship as a real feature rather than stay disabled:

```
POST /api/auth/staff-handoff-login
  body: { email, pin }
  success: sets the same HttpOnly JWT cookie as other login endpoints,
           returns { role, displayName, email, staffId }
  failure: { success: false, message: 'Staff credentials not recognized.' }
```

## G. Route Protection Verification

Re-confirmed (no regressions from this phase's changes):

- Guest routes (`/smokecraft/*`, `/passport/*`, `/crafthub`, `/leaderboard`, `/pourcraft`, `/beercraft`, `/winecraft`, `/demo`) remain ungated and fully functional.
- Staff routes (`/pos3/*`, `/eat/*`) still require `access_pos3_staff` / `access_eat_command` permission via `ProtectedRoute`, now resolved purely from backend-first `SecurityContext` role — no sessionStorage shortcut.
- Admin (`/admin`) and Founder (`/founder`) routes still require `allowedRoles=['admin','founder_level_0']` / `['founder_level_0']` respectively, with the founder bypass now sourced only from `isFounder()`.
- `/boot` (BootConsole) now only reveals the founder/admin/developer console to users whose `SecurityContext` role actually matches, with no sessionStorage override.
- Backend API routes (`server/routes/pos3IntegrationRoutes.js`, `adminRoutes.js`, etc.) were already independently enforcing `requireAuth` + role middleware server-side; this phase did not touch them and they remain the authoritative security boundary regardless of frontend UI state.
- `npm run build` passed with no errors after all changes.

## H. Launch Blockers

- **Fixed this phase**: the two production-reachable, ungated client-storage bypasses (`ProtectedRoute.jsx`'s sessionStorage founder check, `BootConsole.jsx`'s duplicate of the same check, and the production-active `localStorage` prototype-role fallback in `SecurityContext.jsx`) are closed. Privileged UI access now requires either a real backend-verified JWT session or (development only) the explicit dev role switcher.
- **Not a blocker, tracked**: the staff-handoff email+PIN flow has no backend endpoint and remains disabled in production (Phase 3); this is a missing feature, not an exposed vulnerability, since the disabled state ships safely.
- **No blocking backend gaps** — login, logout, session verification, and role lookup are all implemented and already enforced server-side independent of any frontend state.

## I. Next Phase Recommendation

If the staff-handoff (email+PIN) flow should become a real, shippable
feature rather than stay disabled in production, implement the
`POST /api/auth/staff-handoff-login` endpoint described in Section F and
wire `StaffHandoffLoginModal`/`staffHandoffService` to call it the same way
the other login screens call `AuthContext`, removing the need for the
`STAFF_HANDOFF_AUTH_AVAILABLE` disabled-state branch entirely.
