# 03 — User Roles and RBAC

Two RBAC layers exist in this codebase, at different maturity levels.
Do not conflate them.

## Layer 1 — Route-level platform roles (real, enforced, this is the
authoritative gate for reaching a system at all)

Enforced by `<ProtectedRoute>` in `src/App.jsx`, using either
`allowedRoles` (coarse platform role) or `requiredPermission` (named
permission string, resolved elsewhere in the auth model).

| Route | Gate | Login surface | Demo-blocked |
|---|---|---|---|
| `/pos` (POS3 legacy staff entry) | `requiredPermission="access_pos3_staff"` | Staff PIN login | Yes |
| `/pos/table/:tableId` | `requiredPermission="access_pos3_staff"` | Staff PIN login | Yes |
| `/pos3/*` | `requiredPermission="access_pos3_staff"` (mounted the same way) | Staff PIN login | Yes |
| `/eat/*` | `requiredPermission="access_eat_command"` | Manager/admin login | Yes |
| `/eat-legacy` | `requiredPermission="access_eat_command"` | Manager/admin login | Yes |
| `/mentor-console` | `requiredPermission="access_mentor_console"` | Mentor login | No |
| `/dev-diagnostics` | `requiredPermission="view_diagnostics"` | Developer login | Yes |
| `/novee-vault`, `/remote-software-control` | `allowedRoles=['admin','founder_level_0','developer']` | Admin/Founder login | Yes |
| `/venue-mirror` | `allowedRoles=['manager','admin','founder_level_0']` | Admin/Founder login | Yes |
| Several `/eat/*`-adjacent admin screens | `allowedRoles=['manager','admin','founder_level_0']` or `['admin','founder_level_0']` or `['founder_level_0']` (varies by screen — see `src/App.jsx` ~936-1109) | Admin login | Mixed |
| SmokeCraft guest routes (`/smokecraft/*` curriculum) | Session-based `<SmokeCraftSessionGuard>`, not a platform role | Guest identity | N/A |
| Venue Humidor admin routes (`/smokecraft/admin/humidor*`) | Venue-membership based (`requireVenueStaff`/`requireVenueRole`, see Layer 2 pattern below, server-enforced) | Venue staff login | N/A |

**All `/pos3` and `/eat` route trees are `demoBlocked` — investor demo
mode does not unlock them.** This is a real, deliberate constraint: the
proven investor-demo path (`16-INVESTOR-DEMO-PATH.md`) covers SmokeCraft
and Venue Humidor only, never POS360 or E.A.T. 360.

## Layer 2 — Fine-grained hospitality job roles (real, but explicitly a
UI-only guardrail, not backend-enforced)

`src/modules/pos360Permissions.js` defines a second, finer role set that
exists **only inside POS360's own UI state** — there is no backend
record of "this staff member is a bartender." Quoting the module's own
header comment: *"Local/demo only... Treat every check here as a
UI-level guardrail, not real access control — a backend authorization
layer keyed to verified staff identity is still required for
production."*

### POS360 job roles (`POS360_ROLES`)

`owner`, `venue_admin`, `manager`, `server`, `bartender`, `kitchen`,
`humidor_staff`, `host`, `support_runner`.

### POS360 action matrix (`POS360_ACTIONS`, abbreviated)

| Action | owner/venue_admin | manager | server | bartender | kitchen | humidor_staff | host | support_runner |
|---|---|---|---|---|---|---|---|---|
| Floor edit mode / layout save | full | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Open table / add order | full | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Void / comp / refund / discount | full | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Merge/transfer/split check | full | ✅ | ✅ (transfer/split only) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Close shift / staff reassign | full | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Reports access | full | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View/update bar queue | full | (via manager set) | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View/update kitchen queue | full | (via manager set) | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| View/update humidor queue & fulfillment | full | (via manager set) | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Reservations/waitlist/table holds/seat guests | full | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| View assigned tasks / update delivered status | full | — | — | — | — | — | — | ✅ |
| Approve money action | full | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

Owner/venue_admin gets `FULL_ACCESS` (every action). See
`src/modules/pos360Permissions.js` for the exact per-role arrays; the
table above is a faithful summary, not a re-derivation.

## Layer 2b — Venue Humidor RBAC (real, server-enforced, proven live)

Reused from the platform's `venue_memberships` tiers
(`member`/`mentor`/`staff`/`manager`/`admin`/`owner`/`platform admin`).
Full matrix (upload/edit/approve/CSV-import/view) is documented and
proof-verified in `public/proof/smokecraft-venue-humidor-media-management/06-rbac-and-security.md`
— reproduced in `12-INVENTORY-AUTHORITY-MODEL.md` of this package where
it applies to inventory/media specifically. Key proven properties:
venue isolation (a staff member of venue A cannot act on venue B), no
self-approval of one's own uploads, server-authoritative identity
(`req.user.id`, never client-supplied).

## What a developer must not assume

- POS360's job-role matrix (Layer 2) is **not currently backed by a real
  staff-identity check** — assume any UI gate built from it can be
  bypassed by anyone who reaches `/pos3` at all (Layer 1's coarser
  `access_pos3_staff` permission). Do not present Layer 2 as security in
  new work; it is a UX role-simulation layer today.
- E.A.T. 360 has **no equivalent job-role matrix file** in this
  codebase — its only gate found is the coarse `access_eat_command`
  permission plus a handful of `allowedRoles` arrays on individual
  adjacent screens. If E.A.T. needs manager-vs-admin-vs-owner
  differentiation inside its own screens, that does not exist yet and is
  a real gap (see `18-UIUX-DEVELOPER-IMPLEMENTATION-CHECKLIST.md`).
