---
name: Phase 8 RBAC Architecture
description: Role names, permission keys, middleware pattern, frontend security layer, and dev-testing approach established in Phase 8.
---

## Role names (canonical Phase 8+)
guest | staff | manager | admin | founder_level_0
NOT "founder" — always "founder_level_0".

## Permission key format
Underscore format: `access_pos3_staff`, `access_eat_command`, `founder_override`, etc.
Source of truth: server/config/roleMap.js (server) and src/config/roleMap.js (frontend copy).

## apiClient.js pattern
Uses named exports only — `apiGet`, `apiPost`, `apiPut`, `apiDelete`.
Import as: `import { apiGet, apiPost } from './apiClient.js'`
Never `import apiClient from './apiClient.js'` (no default export — Rollup build error).

## Dev auth headers (development only)
x-novee-user-role, x-novee-user-id, x-novee-user-email
founderOnly / requireFounderLevel0 is NEVER bypassed — enforced in all environments.

## Frontend role storage
localStorage key: `novee_admin_session` — shape: { role, userId, email, displayName, grantedAt }
Default: guest. SecurityContext reads this. DevRoleSwitcher (bottom-right, DEV only) sets it.

## buildPermissionMatrix
Defined in server/config/roleMap.js, re-exported through server/config/permissions.js.
Must keep both in sync — permissions.js is a re-export barrel only.

**Why:** adminController imports from permissions.js; roleMap.js holds the implementation.

## Security gate layering in App.jsx
Routes hit BootGuard first, then ProtectedRoute. /admin redirecting to /boot in screenshots is correct — not a bug.
