# Production Lockdown — Phase 3: Security + Access Control Report

## A. Executive Summary

The primary launch blocker identified going into this phase —
`src/data/staffHandoffRegistry.js` shipping plaintext founder/staff
emails and 4-digit PINs in the production client bundle — has been
fixed and verified. The registry's credential tables are now gated
behind `import.meta.env.DEV`, which Vite statically resolves to `false`
in production builds, allowing Rollup to dead-code-eliminate the
credential strings entirely. A post-build grep of `dist/assets/*.js`
confirms none of the founder/staff emails or PINs are present in the
shipped bundle.

The staff handoff login modal (`StaffHandoffLoginModal.jsx`) now shows
a disabled, production-safe state — "Staff authentication requires
secure backend configuration." — instead of a working PIN form when
`STAFF_HANDOFF_AUTH_AVAILABLE` is false (i.e. in production). The
dev-mode email+PIN form is preserved unchanged for local development.

A broader route-protection audit found no guest-facing pages linking
directly to staff/admin/founder routes, and confirmed the real
backend-backed login pages (`StaffLogin.jsx`, `AdminLogin.jsx`,
`FounderLogin.jsx`, etc.) do not share this vulnerability. One
architectural risk remains and is not fixed in this phase: client-side
role storage (`SecurityContext`'s `localStorage` fallback and
`staffHandoffService`'s `sessionStorage` session) is still trusted by
`ProtectedRoute.jsx` ahead of any backend verification. Closing the
registry's credential-exposure path removes the only currently
production-reachable way to populate that trust with a founder grant,
but the underlying design remains client-trusted pending real backend
session enforcement.

## B. Credential Exposure Findings

Found in `src/data/staffHandoffRegistry.js`, previously declared as
unconditional top-level constants (and therefore included in every
build, including production):

| Email | PIN | Role |
|---|---|---|
| `jccollins1206@yahoo.com` | `2501` | `founder_level_0` |
| `staff@crafthub360.com` | `2501` | `staff` |
| `manager@crafthub360.com` | `3600` | `manager` |

These were consumed directly by `verifyFounderCredentials()` and
`verifyStaffHandoffCredentials()` in the same file, called from
`StaffHandoffLoginModal.jsx`'s `handleSubmit`. Because the constants
were plain top-level `const` declarations with no environment guard,
Vite/Rollup had no basis to remove them from the production bundle —
the strings shipped as-is in the client JS, readable by anyone who
opened devtools or downloaded the bundle.

## C. Files Using Staff Auth

- `src/data/staffHandoffRegistry.js` — credential tables and verification functions (fixed this phase)
- `src/components/staffhandoff/StaffHandoffLoginModal.jsx` — consumes the registry, renders the login form (fixed this phase)
- `src/components/staffhandoff/StaffHandoffButton.jsx` — floating guest-page trigger that opens the modal and, on success, grants role via `setRole()` + `saveStaffSession()`
- `src/services/staffHandoffService.js` — `sessionStorage`-based staff session used by the handoff flow
- `src/context/SecurityContext.jsx` — `localStorage`-based client-trusted role fallback, populated by `setRole()`
- `src/components/security/ProtectedRoute.jsx` — route gate; checks `isFounder()` and `staffSession?.role === 'founder'` first, before any other check
- `src/pages/CraftHub.jsx`, `src/pages/smokecraft/SessionComplete.jsx` — guest-facing pages that render `StaffHandoffButton`

## D. Route Protection Status

Audited every `ProtectedRoute` usage in `src/App.jsx`:

| Route | Gate | Login route | Demo-blocked |
|---|---|---|---|
| `/novee-home`, `/ultra-command-center`, `/novee-vault`, `/remote-software-control` | `allowedRoles=['admin','founder_level_0','developer']` | `/admin-login` | true |
| `/venue-mirror` | `allowedRoles=['manager','admin','founder_level_0']` | `/admin-login` | true |
| `/mentor-console` | `requiredPermission='access_mentor_console'` | `/mentor-login` | false |
| `/dev-diagnostics` | `requiredPermission='view_diagnostics'` | `/dev-login` | true |
| `/pos`, `/pos3` (+ nested: handheld, tables, orders, checkout, kitchen, bar, humidor, inventory, integrations, settings) | `requiredPermission='access_pos3_staff'` | `/staff-login` | true |
| `/eat-legacy`, `/eat` (+ nested: command-hub, pos-control, operations, inventory, reorders, staff, sections, kitchen, bar, humidor, data, reports, device-mode, media, settings) | `requiredPermission='access_eat_command'` | `/admin-login` | true |
| `/admin` | `allowedRoles=['admin','founder_level_0']` | `/admin-login` | true |
| `/founder` | `allowedRoles=['founder_level_0']` | `/founder-login` | true |
| `/device-status` | `allowedRoles=['staff','manager','admin','founder_level_0']` | `/staff-login` | true |
| `/kiosk-setup`, `/install-help`, `/venue-test` | `allowedRoles=['manager','admin','founder_level_0']` | `/admin-login` | true |
| `/founder-demo`, `/investor-demo` | `allowedRoles=['founder_level_0']` | `/founder-login` | true |
| `/venue-demo` | `allowedRoles=['manager','admin','founder_level_0']` | `/admin-login` | false |
| `/pilot-onboarding` | `allowedRoles=['admin','founder_level_0']` | `/admin-login` | true |
| `/system-overview` | `allowedRoles=['manager','admin','founder_level_0']` | `/admin-login` | true |

Guest-accessible, ungated routes confirmed: `/smokecraft/*`,
`/passport/*`, `/crafthub`, `/leaderboard`, `/pourcraft`,
`/beercraft`, `/winecraft`, `/demo`, `/offline`. Login screens
(`/staff-login`, `/admin-login`, `/founder-login`, `/mentor-login`,
`/dev-login`) are intentionally public.

No staff/admin/founder route is linked from any guest-facing page
outside the now-secured `StaffHandoffButton` flow (verified by grep —
no matches for direct `navigate`/`to=` references into those routes
from pages outside the Admin/FounderControl/EAT/POS3 page files
themselves).

## E. Role Matrix

```
ROLE_LEVELS = { guest: 0, staff: 1, manager: 2, admin: 3, founder_level_0: 4 }
SIDECAR_ROLES (permission-gated, not hierarchy-gated): passport_member, human_mentor, developer
```

- **Guest (0)** — SmokeCraft, Passport, CraftHub, Leaderboard, public demo pages. No staff/admin access.
- **Staff (1)** — POS3 and E.A.T. operational routes (`access_pos3_staff`, `access_eat_command` permissions).
- **Manager (2)** — Staff routes + venue-mirror, kiosk-setup, install-help, venue-test, venue-demo, system-overview.
- **Admin (3)** — Manager routes + `/admin`, novee-home/vault/command-center/remote-software-control, pilot-onboarding.
- **Founder (4)** — All of the above + `/founder`, founder-demo, investor-demo. Also bypasses `ProtectedRoute` entirely via the `isFounder()`/`staffSession.role === 'founder'` check, ahead of all other gating.

## F. Public User Exposure Risks

- `StaffHandoffButton` renders on two guest-facing pages
  (`SessionComplete.jsx`, `CraftHub.jsx`) as a small floating dot,
  visible to any guest who reaches those pages.
- Prior to this phase's fix, any guest who opened devtools or
  inspected the bundle could read the founder email/PIN directly out
  of the shipped JS and self-grant `founder_level_0` access through
  the handoff modal — a real, reachable privilege-escalation path, not
  just an information disclosure.
- This phase closes that path in production: `STAFF_HANDOFF_AUTH_AVAILABLE`
  is `false` in production, so the modal shows the disabled-state
  message and the credential tables are absent from the bundle
  entirely.

## G. Fixes Applied

1. **`src/data/staffHandoffRegistry.js`**
   - `DEMO_STAFF` and `FOUNDER_CREDENTIAL` are now gated behind
     `import.meta.env.DEV ? {...} : []/null`, so Vite/Rollup
     dead-code-eliminates the credential strings from production
     builds.
   - Added `export const STAFF_HANDOFF_AUTH_AVAILABLE = import.meta.env.DEV`.
   - Added a null-guard in `verifyFounderCredentials()` (`if (!FOUNDER_CREDENTIAL) return { ok: false }`) so production calls fail safe instead of throwing.

2. **`src/components/staffhandoff/StaffHandoffLoginModal.jsx`**
   - When `STAFF_HANDOFF_AUTH_AVAILABLE` is false, the component now
     renders a disabled-state panel: "Staff Login Unavailable" /
     "Staff authentication requires secure backend configuration." with
     a Close button — no form, no PIN input.
   - The original working email+PIN form is preserved unchanged for
     dev mode, moved into an inner `StaffHandoffLoginForm` component.

3. **Verification**
   - `npm run build` — passed cleanly, no errors.
   - `grep -rl "jccollins1206\|2501\|staff@crafthub360\|manager@crafthub360" dist/assets/*.js` — **zero matches**, confirming the production bundle no longer contains any of the credentials.

No other files were modified. Guest/user SmokeCraft flows, staff
features, and all existing routes remain intact — only the
production-reachable credential path was closed.

## H. Remaining Backend Requirements

- No real backend endpoint exists yet for "staff email + PIN" handoff
  auth. The existing `/api/auth/staff-pin-login` is PIN-only (no
  email), and is not what `StaffHandoffLoginModal` calls.
- `ProtectedRoute.jsx`'s founder bypass (`isFounder() || staffSession?.role === 'founder'`)
  and `SecurityContext.jsx`'s `localStorage`-based `setRole()` fallback
  remain client-trusted, by the code's own documentation ("This context
  is for UI rendering decisions only... never rely on this alone").
  No backend middleware currently enforces these role grants
  server-side for the routes they gate.
- These were not modified in this phase, since doing so without a real
  backend session-verification endpoint would mean either removing
  working functionality or faking backend auth — both out of scope per
  the phase's explicit rules.

## I. Launch Blockers

- **Fixed and verified**: plaintext credential exposure in the client
  bundle. The only currently production-reachable path to self-grant
  staff/founder access is closed.
- **Not yet resolved, architectural**: `SecurityContext`/`staffHandoffService`'s
  client-trusted role storage is not backed by server-side session
  verification. This is a pre-existing, documented limitation, not
  introduced by this phase, and is not currently exploitable via any
  production UI path now that the registry fix is in place — but it
  should be closed before any new client-writable path to populate
  those stores is added.

## J. Recommended Next Phase

Implement a real backend staff-handoff auth endpoint (email + PIN, or
equivalent), and switch `StaffHandoffLoginModal` / `staffHandoffService`
to call it instead of any client-side table — including in development
— so role grants are issued and verified server-side end-to-end, the
same way `AuthContext`'s JWT-cookie flow already works for the other
login screens.
