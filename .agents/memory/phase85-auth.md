---
name: Phase 8.5 Auth Architecture
description: JWT cookie sessions, founder triple-factor login, dev-spoof blocking, AuthContext→SecurityContext precedence chain.
---

## Auth identity resolution (backend, authMiddleware.js)
1. JWT from HttpOnly cookie `novee_auth` (cookie-parser required)
2. JWT from `Authorization: Bearer <token>`
3. Dev headers `x-novee-user-role` (dev only, never founder without ALLOW_DEV_FOUNDER=true)
4. Prototype guest fallback (dev only)
5. 401 in production

## Founder login triple-factor
- endpoint: POST /api/auth/founder-login
- requires: email + pin + founderChallenge
- challenge compared against `FOUNDER_CHALLENGE_SECRET` env var (direct string equality, NOT bcrypt hash stored in DB)
- Failure in any factor: log attempt, increment lockout, return 401

## blockDevFounderSpoofing middleware
- Blocks `req.user.mode === 'dev-header'` when role is `founder_level_0`
- Unless `ALLOW_DEV_FOUNDER=true` in .env (dev only)
- Applied in founderRoutes.js AND adminRoutes.js founder-level endpoints
- Chain: `requireAuth → blockDevFounderSpoofing → requireFounderLevel0`

## Frontend identity chain (component tree order)
```
AuthProvider (JWT session from /api/auth/me)
  SecurityProvider (reads AuthContext via useContext(AuthContext))
    GuestSessionProvider
      App
```
- If AuthContext.isAuthenticated: SecurityContext uses AuthContext identity (mode: 'jwt')
- Otherwise: SecurityContext reads from localStorage (prototype/dev)
- DevRoleSwitcher: shows "DEV MODE ONLY — NOT REAL AUTH" banner; shows logout button when real session active

## Login screens
- /staff-login → StaffLogin.jsx — PIN pad, touchscreen-friendly
- /admin-login → AdminLogin.jsx — email + PIN form
- /founder-login → FounderLogin.jsx — email + PIN + challenge (no autocomplete)
- All three are OUTSIDE BootGuard (accessible without boot flow)

## ProtectedRoute loginRoute prop
- Pass `loginRoute="/staff-login"` and `loginLabel="Staff Login"` to show login button instead of just "Return Home"

## Dev prototype seeds (dev only)
- staff-demo-001: PIN 1234
- manager-demo-001: PIN 5678, email manager@novee.dev
- admin-demo-001: PIN 9999, email admin@novee.dev
- founder-demo-001: PIN 0000, email founder@novee.dev, challenge = FOUNDER_CHALLENGE_SECRET env var

**Why:** FOUNDER_CHALLENGE_SECRET must be set in .env before seeding or founder login returns 503.
