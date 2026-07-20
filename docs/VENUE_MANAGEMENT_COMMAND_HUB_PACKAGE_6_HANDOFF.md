# Venue Management Command Hub + NOVEE OS Remote Venue Operations Hub — Package 6 Handoff

Not implemented this package. This is planning guidance only.

## Management capabilities Package 6 must build

- Venue profile management (name/address/status — `venues` table exists, System 1, no management UI exists).
- Venue branding and media — no infrastructure exists.
- Cigar and product management — no cigar-humidor product table exists (confirmed NOT_CONFIGURED, Package E).
- Menus and pairings — `smokeCraftVenueCommerce.js` has static data; no real management UI exists.
- Inventory destination — confirmed NOT_CONFIGURED (Package E); Package 6 must design and build the cigar-humidor inventory table/API from scratch.
- Ticket Tapper management — `TicketTapperManagement.jsx` already exists and is real (confirmed this session) — Package 6 should **reuse**, not rebuild.
- Events and challenges — no real backend found; static data only.
- Staff and permissions — `venue_memberships`/`venue_permissions` exist (System 1, Package A/B's foundation) — Package 6 should **reuse** for the data model, build the management UI.
- SmokeCraft venue configuration — none exists.
- Media uploads — none exists.
- Management Sync review — the real `ManagementSyncAnalytics.jsx` page (Package D/E) is a start; Package 6 should **extend**, not replace.
- Venue analytics — real, live (Package D) — Package 6 should **reuse** `getVenueAnalyticsSummary`/`GET /insights` as-is.
- Announcements — no infrastructure exists.
- Staff feedback — confirmed NOT_CONFIGURED (Package E) — Package 6 must design from scratch.
- Internal handoffs — the `smokecraft_management_sync_actions` table (Package A) is real, general-purpose infrastructure — Package 6 should **reuse**.
- Integrations — the integration registry/connection-state engine (Package E) is real — Package 6 should **extend** with a management UI over `GET /integrations`, and **complete** the Staff Handoff/Inventory backends this document lists as Package 6's own responsibility.
- Audit logs — `audit_logs` table + `auditAction()` middleware are real, general-purpose (pre-existing platform infra) — **reuse**.
- Approval and publishing — Ticket Tapper's approval workflow (`submitForApproval`/`approve`/`reject`/`publish`) is a real, working precedent — Package 6 should **reuse the pattern**.

## NOVEE OS Remote Venue Operations Hub

- Remote venue configuration, remote feature activation, controlled
  remote actions, approval rules, venue notifications — **none of this
  exists today** (confirmed COMING_SOON, Package E). Package 6 (or a
  dedicated NOVEE OS package) must design this from scratch; no
  shortcut exists to reuse.
- Strict tenant isolation — the platform's existing `novee_os_*`
  migration series (049-067) has real tenant/organization/workspace
  scoping infrastructure that any NOVEE OS remote-ops work should
  **reuse**, not reinvent.

## Per-Package-E-integration disposition for Package 6

| Integration | Package 6 must... |
|---|---|
| Internal Management Sync | Reuse as-is (Package A-D, fully real) |
| Ticket Tapper | Reuse as-is; build a management UI wrapper if desired, but the backend is complete |
| Passport 360 | Configure — resolve the guest-identity mapping question (Package E's disclosed gap) before any write path can be built |
| Staff Handoff | Complete from scratch — no existing infrastructure to build on beyond generic `audit_logs`/`smokecraft_management_sync_actions` |
| Inventory | Complete from scratch — no cigar-humidor table exists anywhere |
| POS360 | Leave unavailable for Management Sync purposes; defer the actual bridge to Package 7 |
| E.A.T. 360 | Leave unavailable; defer to Package 7 |
| NOVEE OS | Defer remote-ops entirely to Package 7 (or a dedicated NOVEE OS Control Plane package); Package 6 may build local venue-management UI only |

## Rollback requirements

Any new Package 6 tables must follow the established convention (`CREATE
TABLE IF NOT EXISTS`, additive migrations, documented `DROP TABLE IF
EXISTS` rollback SQL, no destructive `ALTER` on existing tables) — the
same pattern used consistently across migrations 001-074.

Package 6 is not implemented as part of Package E.
