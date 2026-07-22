# Remediation 2 — Canonical Identity Design

## Key finding: no server-side duplicate identity ever existed

Before this remediation, the "identity fragmentation" was **entirely client-side**. The general NOVEE OS `GuestSessionContext.jsx` generates `passport.passportId` as a pure local string (`` `PP-${now.toString(36).toUpperCase()}` ``, e.g. `PP-1A2B3C`) — never sent to any backend table as a primary key, never persisted server-side under that value. Confirmed by source inspection: the only caller that ever sent this local ID to a backend endpoint (`getEarnedStampsWithBackend()` via `passportAdapter.js`) sent it as a **lookup parameter** (`guestId: passportId`) to the insecure Phase F.5 API — which, being unauthenticated, would look up whatever row (if any) happened to exist under that exact string, almost always finding none, and silently falling back to local-only data.

**There is no server-side duplicate-identity table to merge.** The real canonical identity has only ever existed in one place: `passport_360_guest_profiles`, keyed by the verified `guest_reference` from the SmokeCraft JWT. This remediation's job was therefore not a database merge, but **routing the general-NOVEE-OS-side reads through the same canonical endpoint** that SmokeCraft itself already uses — rather than through a client-generated ID that was never a real backend key.

## Canonical identity architecture

- **The one canonical Passport ID is `passport_360_guest_profiles.guest_id`** (a real `UUID`), resolved from `req.smokecraftIdentity.id` (verified JWT `sub` for guests, `req.user.id` for authenticated users) via `createOrResolveGuestProfile()`.
- **A prerequisite fix**: the `smokecraft_guest_session` cookie was previously scoped `path: '/api/smokecraft'`, so a real browser would never have sent it to `/api/passport-360/sync/*` at all — a genuine, previously-masked defect (my own earlier Playwright tests only passed because they manually injected the cookie with `path: '/'`, bypassing the real restriction). **Fixed this pass**: broadened to `path: '/api'` (`server/middleware/smokecraftGuestIdentity.js`). This is what makes cross-path canonical identity resolution actually work in a real browser, not just in a test harness.
- **SmokeCraft path**: any SmokeCraft screen (Skill Tree, Collections, Challenge Hub, Blend Fault, the now-secured Passport Stamp claim) resolves identity via `req.smokecraftIdentity.id` → the same `passport_360_guest_profiles` row.
- **"General NOVEE OS" path**: `passportService.js`'s `getEarnedStampsWithBackend()` now calls `GET /api/passport-360/sync/stamps` directly with `credentials: 'include'` — the exact same identity-resolution code path, because it's the exact same endpoint. There is no separate "general NOVEE OS identity resolver" left to diverge.

## Verified same-Passport-ID result

`verify-passport-security-unified-identity.mjs` proves this directly: a learner claims a real stamp via the SmokeCraft Passport Stamp screen, then both `GET /api/passport-360/sync/profile` ("SmokeCraft path") and `GET /api/passport-360/sync/stamps` ("general NOVEE OS path," called exactly as `passportService.js` calls it) return data keyed by the identical `guest_id` — verified directly, not asserted.

## LocalStorage cannot override canonical identity

Verified directly: a page is seeded with `localStorage.setItem('novee_guest_session', JSON.stringify({ passport: { passportId: 'FAKE-LOCAL-OVERRIDE-ID' }, xp: 999999 }))` before loading `/passport/profile`; the real backend call (`GET /api/passport-360/sync/profile`) still returns the caller's real, server-resolved `passportId` — the fake local value has no effect because the backend never reads it in the first place (identity is always derived from the httpOnly session cookie, never from any request body, query string, or client-readable storage).

## Duplicate canonical identity prevention

Unchanged from the prior pass, re-verified this pass: `UNIQUE(tenant_id, venue_id, guest_reference)` on `passport_360_guest_profiles`, enforced via a resolve-then-insert pattern. Verified directly: exactly 1 profile row exists per real learner across repeated calls.

## What was intentionally NOT done

The pre-existing `GuestSessionContext.jsx` reducer's own `passport.passportId` field (the local `PP-...` string) was **not removed or rewritten**. Doing so would mean touching a 1,400+ line, heavily-used, central context file that spans the entire NOVEE OS app (not just SmokeCraft) — explicitly out of scope ("General NOVEE OS redesign," "avoid broad refactors"). It remains as a local display/legacy value for parts of the app that don't call the backend at all; it is simply no longer treated as the identity used for any real backend Passport call, which is the actual defect this remediation needed to close.
