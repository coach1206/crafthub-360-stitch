# SmokeCraft Management Sync — Venue Data Model Audit (Part 2)

**BLOCKER 2 (venue half) — REQUIRES MAPPING.** Two competing, real venue
systems exist; SmokeCraft-adjacent features consistently use the older,
simpler one.

## Two real venue systems found

### System 1 — `venues` (migration `010_new_roles_and_tables.sql`)
```sql
CREATE TABLE IF NOT EXISTS venues (
  id            BIGSERIAL    PRIMARY KEY,
  venue_id      TEXT         NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  name          TEXT         NOT NULL,
  venue_type    TEXT         NOT NULL DEFAULT 'cigar_lounge' CHECK (...),
  city, state, country, address, phone, email, website, capacity,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','pending','suspended')),
  settings      JSONB NOT NULL DEFAULT '{}',
  created_at, updated_at
);
```
Plus `venue_memberships` (`user_id`/`passport_id` → `venue_id`,
`membership_type CHECK IN ('member','staff','mentor','manager','admin','owner')`)
and `venue_permissions` (`venue_id, role, permission_key` with a
`UNIQUE (venue_id, role, permission_key)` constraint).

### System 2 — `novee_os_venues` (migration
`049_novee_os_tenant_venue_workspace_governance.sql`)
```sql
CREATE TABLE IF NOT EXISTS novee_os_venues (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL,
  venue_group_id    UUID REFERENCES novee_os_venue_groups(id),
  venue_key         TEXT NOT NULL UNIQUE,
  venue_name        TEXT NOT NULL,
  venue_status, governance_status, readiness_status ... (platform-governance fields),
  ...
);
```
A larger, platform-governance-oriented model (organization/workspace
hierarchy, readiness flags, deployment flags) — not a simple
venue-membership model on its own; role/permission data for this system
lives separately in migration 051's `novee_os_role_catalog` /
`novee_os_user_role_assignments`, which are **not venue-scoped** by
default (global role catalog).

## Which system SmokeCraft-adjacent features actually use

Checked real `venue_id` column definitions in the two most relevant
existing SmokeCraft-adjacent migrations:
- `ticket_tapper_promotions` (071): `venue_id TEXT NOT NULL` — plain TEXT,
  matches System 1's `venue_id` type exactly.
- `passport_360_guest_profiles`/`_guest_progress`/etc. (068): `venue_id
  TEXT NOT NULL DEFAULT 'novee-grand-lounge'` — also plain TEXT, matching
  System 1's shape (though with the default-value anti-pattern already
  flagged in the backend architecture doc).

**Neither uses `novee_os_venues.id` (UUID) directly.** Both existing
SmokeCraft-adjacent tables use a plain `TEXT venue_id`, consistent with
System 1's `venues.venue_id`.

## Answers to the required questions

1. **Exact venue table name**: `venues` (System 1) is the one actually
   used by SmokeCraft-adjacent tables in practice.
2. **Primary key column**: `id` (BIGSERIAL, internal); `venue_id` (TEXT,
   `UNIQUE`) is the public/foreign-key-facing identifier.
3. **Venue identifier type**: TEXT (UUID-shaped string by default, but
   not a native `UUID` column type).
4. **Venue slug/public ID column**: `venue_id` itself serves this role;
   no separate slug column.
5. **Venue name column**: `name`.
6. **Tenant/organization column**: none on `venues` itself (System 1 has
   no tenant hierarchy) — tenancy exists only in System 2
   (`novee_os_venues.organization_id`).
7. **Active/inactive status column**: `status` (`active`/`inactive`/
   `pending`/`suspended`).
8. **Ownership column**: not on `venues` directly — ownership is
   expressed via `venue_memberships.membership_type = 'owner'`.
9. **Created/updated timestamps**: yes, both present.
10. **Foreign-key usage**: `venue_memberships.venue_id` and
    `venue_permissions.venue_id` both `REFERENCES venues(venue_id)`.
11. **Existing venue indexes**: `idx_venues_type`, `idx_venues_status`.
12. **Existing venue constraints**: `venue_type`/`status` CHECK
    constraints, `venue_id UNIQUE`.
13. **Does `journey.selectedVenue.id` map directly to `venues.venue_id`?**
    **Not provably yet.** `/smokecraft/venue-select` currently has
    `VENUES = []` (confirmed in the Ticket Tapper package this session —
    no live venue directory is connected), so no real
    `journey.selectedVenue.id` value has ever been produced by a live
    selection. There is no code path today that populates
    `VenueSelect.jsx`'s venue list from the `venues` table via an API —
    that connection does not exist yet.
14. **Is `selectedVenue.id` a slug, UUID, integer, or temporary client
    ID?** Undetermined — it is whatever a future real venue-directory API
    would assign, since the field is currently never populated with real
    data.
15. **Does Ticket Tapper use the same venue identifier?** Consistent
    *type* (TEXT), but Ticket Tapper's `venueId` today is also a
    frontend-controlled string (previously hardcoded
    `'smokecraft-360-main'`, now `journey.selectedVenue.id` — see the
    Ticket Tapper focused integration package) — not yet proven to
    resolve to a real `venues.venue_id` row either, for the same reason
    as #13.
16. **Does Passport 360 use the same venue identifier?** Same TEXT
    shape, but its default (`'novee-grand-lounge'`) is a literal string,
    not proven to correspond to a row in `venues` either — **this is a
    pre-existing, unresolved gap in the platform, not something this
    audit can resolve without a real venue-directory connection.**
17. **Do POS360 and E.A.T. use the same venue identifier?** Not
    re-audited this pass (out of scope) — flagged as unconfirmed.
18. **Do multiple venue ID systems currently exist?** **Yes, confirmed —
    System 1 (`venues`, TEXT) and System 2 (`novee_os_venues`, UUID,
    org-scoped) both exist and are not unified.**
19. **Exact server-side method for validating a venue**: none found
    specific to SmokeCraft — no controller was located that does
    `SELECT 1 FROM venues WHERE venue_id = $1 AND status = 'active'`
    before accepting a venue-scoped write. This would be new code in
    Package B.
20. **Exact server-side method for confirming venue ownership**: none
    found reused by any SmokeCraft-adjacent controller; `venue_memberships`
    exists as the real data source for this check but nothing currently
    queries it from a SmokeCraft-adjacent route.
21. **Exact foreign key Package A should use**: `venue_id TEXT NOT NULL
    REFERENCES venues(venue_id)` — matching System 1, consistent with
    every existing SmokeCraft-adjacent table. **No `DEFAULT` value** (correcting
    the anti-pattern in migration 068).
22. **Required normalization/mapping layer**: yes — Package B must add a
    real "does this venue_id exist and is it active" check
    (`SELECT ... FROM venues WHERE venue_id = $1 AND status = 'active'`)
    before accepting any Management Sync write, since nothing currently
    guarantees `journey.selectedVenue.id` is a real row.

## Assignment

**REQUIRES MAPPING** — the target table/column are now clearly
identified (`venues.venue_id TEXT`, System 1), but the actual runtime
guarantee that a given `journey.selectedVenue.id` value corresponds to a
real row does not exist yet, because no live venue directory is wired to
`VenueSelect.jsx`. Package A's foreign key is correctly specified above;
Package B must add the existence/status validation described in #22
before trusting any client-supplied `venue_id`.
