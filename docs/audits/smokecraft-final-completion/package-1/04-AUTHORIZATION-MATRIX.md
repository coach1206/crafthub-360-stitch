# Authorization Matrix — Package 1

## Recipe/component visibility (Step 5, Decision 4) — server-enforced, `visibilityService.js`

| Viewer role | Recipe (default, before judging closes) | Recipe (after judging closes) | Scores | Personal info |
|---|---|---|---|---|
| Entrant | Yes | Yes | Yes | Yes |
| Assigned judge | Yes | Yes | Yes | Yes |
| Mentor | No | Yes | Yes (after close) | Yes (after close) |
| Venue administrator (active manager/admin/owner membership at the competition's scope venue) | No | Yes | Yes (after close) | Yes (after close) |
| Competition administrator / platform administrator | Yes | Yes | Yes | Yes |
| Authorized viewer | No | Yes | Yes (after close) | Yes (after close) |
| Public | No | No (default) | Yes only after close | No |

Overridable per-entry via `golden_box_visibility_rules` — the table
records an explicit grant/deny that takes precedence over the default
matrix above.

## Role resolution — never trusted from the client

`resolveViewerRole()` computes the caller's role fresh on every request:
platform-admin bypass (`req.user.role`) → entrant match (`ownsAsUser`/
`ownsAsGuest`, explicitly guarding against `null === null` matching two
different guests — **a real bug found and fixed this package**, see
`07-PACKAGE-1-COMPLETION-REPORT.md`) → assigned-judge lookup (real query
against `golden_box_judge_assignments`) → venue-administrator lookup
(real query against `venue_memberships`) → falls through to `public`.

## Competition/administrative actions

| Action | Required role |
|---|---|
| Create competition | `admin` (platform) |
| Transition competition lifecycle | `admin` |
| Assign judge | `admin` |
| Submit scorecard | authenticated + verified assigned-judge (checked server-side, not just role) |
| Issue rewards | `admin` |
| List/get competitions | public (read-only, no sensitive data in the competition record itself) |

## Guest/entrant identity

Reuses `smokecraftGuestIdentity.js` (Management Sync, Package B) exactly
— server-issued JWT (`sub`=guest UUID), HttpOnly cookie
`smokecraft_guest_session`, no new identity/token scheme.
`requireSmokeCraftIdentity` rejects any request with no verified
identity (`identity_required`, 400/403 depending on production vs.
dev-mode fallback — same documented nuance as every prior package).

## Live-verified this package

`verify-golden-box-package-1.mjs` checks #11/#13/#19 (unrelated entrant
denied, assigned judge allowed, unauthorized staff denied) all pass
against a real running server with real seeded identities — not
asserted by code review alone.
