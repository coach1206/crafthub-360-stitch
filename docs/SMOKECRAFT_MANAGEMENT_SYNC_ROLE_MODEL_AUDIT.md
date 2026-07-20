# SmokeCraft Management Sync — Role & Permission Model Audit (Part 3)

**BLOCKER 2 (role half) — PARTIAL.**

## Findings

1. **User table**: `novee_os_platform_users` (migration 051) is the
   platform-wide user table; a separate `system_users` is referenced by
   `venue_memberships.user_id` in migration 010 — **two user-table
   references exist across the two eras of migrations**, consistent with
   the two-venue-system finding in Part 2. Not fully reconciled in this
   pass — flagged as a real open question, not resolved here.
2. **Role table**: `novee_os_role_catalog` (051) — global role catalog,
   not venue-scoped.
3. **Permission table**: `novee_os_permission_catalog` (051), plus the
   simpler `venue_permissions` (010) which is venue-scoped
   (`venue_id, role, permission_key`).
4. **User-role relationship**: `novee_os_user_role_assignments` (051) —
   global, not venue-scoped.
5. **Venue membership relationship**: `venue_memberships` (010) —
   `user_id`/`passport_id` → `venue_id`, with `membership_type`.
6. **Venue-role relationship**: `venue_permissions` (010) — the only
   table that ties a role string directly to a specific venue.
7. **Are roles global or venue-scoped?** **Both exist, inconsistently.**
   `novee_os_role_catalog`/`_user_role_assignments` (051) model a global
   role per user. `venue_memberships.membership_type` (010) models a
   per-venue role. The actual `requireRole()`/`requirePermission()`
   middleware (see #11-13 below) checks `req.user.role` — a single,
   global field — **not** a venue-scoped lookup.
8. **How are venue managers identified?** By `venue_memberships.membership_type
   = 'manager'` in the data model (System 1) — but this is **not what the
   live authorization middleware checks** (see #13).
9. **How is venue staff identified?** `venue_memberships.membership_type
   = 'staff'`.
10. **How are platform admins identified?** `req.user.role` global field
    (e.g. `'admin'`, `'founder_level_0'`), checked by `requireRole`/
    `requireFounderLevel0`.
11. **Exact `requireRole` syntax**: `requireRole(minRoleName)` returns
    middleware that calls `meetsMinRole(user.role, minRoleName)` — a
    **global role hierarchy check**, e.g. `requireRole('manager')` in a
    route file.
12. **Exact `requirePermission` syntax**: `requirePermission(permissionKey)`
    → `roleHasPermission(user.role, permissionKey)` — also global,
    role-string-based, not venue-scoped.
13. **Do permission checks validate venue scope?** **No — confirmed by
    reading the full `requireRole`/`requirePermission` implementations
    in `roleMiddleware.js`.** Both only inspect `req.user.role` (a global
    string) against a required role/permission name. Neither queries
    `venue_memberships` or compares a request's `venueId` param against
    the caller's actual venue affiliation. **This is the single most
    important finding of this part**: today, a user with `role =
    'manager'` (however that global role was assigned) would pass
    `requireRole('venue_manager')`-style checks for **any** venue's
    insights endpoint, not just their own — there is no existing
    venue-ownership enforcement to reuse as-is.
14. **Does current middleware trust a client-supplied venue ID?**
    N/A directly (no SmokeCraft-adjacent controller currently does a
    venue-scoped authorization check at all), but by extension of #13,
    *if* a controller naively did `requireRole('manager')` then read
    `req.params.venueId` without a separate ownership check, it would
    effectively trust the client-supplied venue ID. **Management Sync's
    Package B must not do this** — it must add its own explicit
    `venue_memberships` lookup.
15. **Existing secure controller example using venue-scoped
    authorization**: **none found.** No controller in this codebase was
    located that both uses `requireRole`/`requirePermission` AND
    separately validates the request's venue against the caller's
    `venue_memberships` row. This must be built new in Package B, not
    copied from precedent.
16. **Exact middleware Package B should reuse**: `requireAuth` (identity),
    `requireRole('manager')` or `requirePermission(...)` (coarse role
    gate, existing), plus **new** business logic: a
    `requireVenueMembership(paramName)`-style check (not yet built) that
    queries `venue_memberships WHERE user_id = req.user.id AND venue_id =
    req.params[paramName] AND membership_type IN ('manager','admin','owner')
    AND status = 'active'`.
17. **Missing middleware that must be implemented**: the venue-ownership
    check described in #16 — this is new code, correctly identified as a
    gap rather than assumed to already exist.
18. **Correct access model** (per the mandate's roles, mapped to real
    infrastructure):
    - **Guest**: no `req.user` role beyond `'guest'` (or the
      `proto-guest` prototype fallback) — `requireAuth`-gated own-journey
      endpoints only, never `requireRole('manager')`-gated ones.
    - **Authenticated user**: `requireAuth` passes; still needs the new
      venue-membership check before touching venue-scoped data.
    - **Venue staff**: `venue_memberships.membership_type = 'staff'` +
      the new venue-membership check, scoped to handoff-only actions
      (Package D).
    - **Venue manager**: `venue_memberships.membership_type IN
      ('manager','admin','owner')` + the new venue-membership check.
    - **Platform admin**: existing `requireRole('admin')`/
      `requireFounderLevel0` — global, no venue check needed (platform
      admins are not venue-scoped by design).

## Assignment

**PARTIAL.** The data model for venue-scoped roles exists
(`venue_memberships`), and the coarse role-hierarchy middleware exists
and is reusable for a first gate, but the **actual venue-ownership
enforcement does not exist anywhere in this codebase today** and must be
built as new, explicit logic in Package B — it cannot be assumed to
already work correctly by using `requireRole` alone. This is now a
precisely-scoped, buildable gap, not an open question.
