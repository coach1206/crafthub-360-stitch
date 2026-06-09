---
name: Phase 10 RBAC + Demo Mode architecture
description: Sidecar roles, Demo Mode context pattern, and roleMap.js export requirements
---

## Sidecar roles
Three roles sit outside the main hierarchy (guest→staff→manager→admin→founder_level_0):
- `passport_member` (level 0 equivalent)
- `human_mentor` (level 1 equivalent)
- `developer` (level 0 equivalent — read-only diagnostics only)

These roles MUST be gated with `requiredPermission`, never `allowedRoles` alone, because they have no ROLE_LEVELS entry. ProtectedRoute handles both patterns; don't mix them.

## roleMap.js exports required by AuthContext.jsx
`getEffectivePermissions(role)` must be exported from `src/config/roleMap.js`. AuthContext imports it on startup — missing export crashes the entire app silently (blank white screen). The function just returns `ROLE_MAP[role] || []`.

## Demo Mode
- State: `sessionStorage.setItem('novee_demo_mode', '1')` — clears on tab close
- Provider: `DemoModeContext.jsx` — wraps entire app in App.jsx via `<DemoModeProvider>`
- Banner: `DemoBanner.jsx` — fixed top-right, z-index 9999, pulse dot + exit button
- Entry points: Boot screen "PREVIEW DEMO" button + Home screen "EXPLORE IN DEMO MODE" button + Home header "DEMO" pill (desktop only)
- Guard: `isDemoBlocked(pathname)` in DemoModeContext; ProtectedRoute calls it with `window.location.pathname` before the role/permission check
- `enterDemoMode()` also sets `novee_booted = '1'` so BootGuard doesn't redirect back to /boot
- Demo blocked paths defined in `DEMO_BLOCKED_PATHS` Set in DemoModeContext.jsx
- Demo mode does NOT touch the server — no audit events, no payments, no inventory

## auditService.js categories (15)
logAuth, logSession, logPOS, logEAT, logPassport, logMentor, logDeveloper, logAdmin, logFounder, logSecurity, logAccess, logData, logSystem, logRole, logDevice. All wrap the core `log()` function.

## New routes added (Phase 10)
- `/mentor-login` — MentorLogin.jsx (email + PIN, calls loginMentor → /mentor-console)
- `/dev-login` — DevLogin.jsx (email + PIN, calls loginDev → /dev-diagnostics)
- `/mentor-console` — MentorConsole.jsx (protected: access_mentor_console permission)
- `/dev-diagnostics` — DevDiagnostics.jsx (protected: view_diagnostics permission, demo-blocked)

**Why:** The sidecar role pattern requires routes AND login pages that bypass the standard staff/admin login flow. Mentor and developer auth each have their own endpoints on the backend.
