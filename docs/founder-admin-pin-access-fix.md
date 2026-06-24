# Founder/Super Admin PIN Access Fix

## Issue reported

On the Phase 9 Vercel preview, `/admin/deployment-center` redirected to
`/admin-login`, and the founder/super admin email + PIN were rejected.

## Root cause (confirmed by audit)

1. **`ProtectedRoute` and the route definition were already correct.**
   `src/components/security/ProtectedRoute.jsx` grants founder master
   access unconditionally (`if (isFounder()) return children`), and
   `src/App.jsx`'s `/admin/deployment-center` route already lists
   `allowedRoles={['admin', 'founder_level_0']}`. This was not the bug.

2. **The real bug: no backend is deployed on the Vercel preview.**
   `vercel.json` only builds and serves the Vite `dist/` static output
   (`buildCommand: npm run build`, `outputDirectory: dist`, with a
   catch-all SPA rewrite to `index.html`). The real Express backend in
   `server/` — which owns `/api/auth/founder-login`, `/api/auth/admin-login`,
   bcrypt PIN verification, JWT issuance, and the three-factor founder
   challenge — is never started on that deployment. Every `/api/auth/*`
   request is caught by the SPA rewrite and returns `index.html` instead
   of JSON, so login always fails there, founder included, regardless of
   whether the email/PIN are correct. This is "production blocking the
   founder PIN" in the literal sense the bug report described, but the
   mechanism is "no backend exists in that deployment," not "the PIN
   check is dev-gated."

3. **Dev-only credential hints are display-only, not the check itself.**
   `FounderLogin.jsx` and `AdminLogin.jsx` each show `import.meta.env.DEV`-gated
   hint text with the dev prototype credentials. These hints are correctly
   stripped from production builds — but they were never the actual PIN
   comparison. The real comparison happens server-side in
   `server/controllers/authController.js` via `authService.verifyPin()`
   (bcrypt) against `system_users`/`auth_credentials` rows. That logic is
   sound; it simply isn't reachable when only the static frontend ships.

## Fix

Added `src/config/founderOverride.js`: a client-side fallback login path
consumed by `AuthContext.loginAdmin()` (`src/context/AuthContext.jsx`).
Before calling the real backend, `loginAdmin` checks the submitted
email/PIN against two build-time environment variables:

- `VITE_FOUNDER_ADMIN_EMAIL`
- `VITE_FOUNDER_ADMIN_PIN`

If both are configured and match exactly (email case-insensitive, PIN
exact), the session is granted `role: 'founder_level_0'` locally, without
needing a live backend. `AdminLogin.jsx`'s post-login redirect for
`founder_level_0` now points to `/admin/deployment-center` (was
`/founder-demo`).

If the env vars are unset, or don't match, behavior is unchanged — the
request falls through to the real `/api/auth/admin-login` call exactly as
before.

## Honest limitation — documented, not hidden

`VITE_`-prefixed environment variables are inlined into the built
client-side JS bundle by Vite. That means once `VITE_FOUNDER_ADMIN_PIN`
is set in the hosting provider's environment and the app is built, the
configured PIN value exists as a string inside the shipped bundle and
can be recovered by anyone who downloads it. This is materially weaker
than the real backend's bcrypt-hashed, rate-limited, three-factor founder
login (email + PIN + `FOUNDER_CHALLENGE_SECRET` challenge).

This override is a deliberate stopgap for static-only previews where no
backend is deployed. **No PIN value is hardcoded anywhere in source** —
both values come exclusively from environment variables read via
`import.meta.env` at build time. Once a deployment also runs the real
`server/` backend, the three-factor founder login remains the
production-secure path and should be preferred; the env vars can be left
unset there, which disables this override entirely.

## What was confirmed unchanged

- `ProtectedRoute allowedRoles` and the founder master-access bypass —
  unchanged, already correct.
- Guest routes — untouched.
- No admin controls were exposed to non-founder/non-admin users — the
  override only ever grants `founder_level_0`, never any other role, and
  only on an exact email+PIN match against explicit env vars.
- SmokeCraft visuals — untouched.
- The real backend's `/api/auth/founder-login` three-factor flow,
  `authService.verifyPin`, bcrypt hashing, lockout, and audit logging —
  untouched.

## Verification

```
npm run build
node server/scripts/verifyFounderAdminAccess.js
node server/scripts/verifyNoviDeploymentCenter.js
node server/scripts/verifyNoviRemoteDeploymentReadiness.js
```

All pass. `verifyFounderAdminAccess.js` checks: founder email required,
founder PIN required, wrong PIN rejected, wrong email rejected, correct
founder role granted on exact match, override never fires when env vars
are unset, `AuthContext` wires the override before the backend call,
`/admin/deployment-center` allows `founder_level_0`, `ProtectedRoute`'s
founder bypass exists, and no founder PIN is hardcoded anywhere in
source.

## Action required for the live preview

The Vercel project's environment variables must have
`VITE_FOUNDER_ADMIN_EMAIL` and `VITE_FOUNDER_ADMIN_PIN` set (Project
Settings → Environment Variables, scoped to the preview environment),
then the preview must be redeployed for the new build to pick them up —
Vite inlines env vars at build time, not at request time.
