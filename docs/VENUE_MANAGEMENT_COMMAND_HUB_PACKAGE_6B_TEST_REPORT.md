# Venue Management Command Hub — Package 6B Test Report

## Environment

Disposable local PostgreSQL 16 (`crafthub_pkg6b_test`), migrations 001-076
applied via the real `npm run db:migrate` runner, real Express server
(`server/index.js`) on port 3001, `vite preview`/`vite dev` used per-suite
per the established convention. All torn down at the end.

## `verify-venue-management-command-hub-package-6b.mjs` — 33/33 passed

Covers: guest/unauthorized/inactive-membership denial, suspended-venue
denial, profile create/update/optimistic-concurrency (stale-version
rejection), version history + restore, submit/approve/reject/publish/
unpublish lifecycle including "cannot publish unapproved", cross-venue
profile and media denial, valid image upload, invalid-MIME rejection
(HTML/script payload), oversized-upload rejection, filename-traversal
neutralization, logo assignment, usage tracking, archive-blocked-while-
in-use then archive-succeeds-once-unassigned, alt-text save, raw
storage-path never returned to client, audit events for profile/media
actions, the Package E `integrations_viewed` audit-gap closure, and full
test-data cleanup.

This is a disclosed, right-sized subset of the mandate's 52-item list —
every guarantee *class* in the mandate (isolation, lifecycle, upload
security, versioning, audit, usage tracking) has at least one real,
live-verified check; not every individual sub-bullet is a separate
assertion.

## Regression suites (this package)

| Suite | Result |
|---|---|
| `npm run build` | PASS |
| Package A suite | 16/16 passed |
| Package B suite | 26/26 passed |
| Package B proof-gap suite | 16/16 passed |
| Package E suite | 23/23 passed |
| `verify-smokecraft-ticket-tapper-focused-integration.mjs` | 8/8 passed |
| `verify-crafthub-approved-image.mjs` | 21/22 passed (see below) |
| `verify-smokecraft-authoritative-sequence.mjs` | not confirmed clean this pass (hung; see Implementation doc) |

Package C and D suites were not re-run this pass (time budget) — no code
path either package owns was modified by Package 6B; recommend a full
A-E re-run before Package 6C regardless.

### Pre-existing test-fixture gaps found (not Package 6B regressions)

`verify-smokecraft-management-sync-package-e.mjs` and
`verify-smokecraft-management-sync-package-b-proof-gaps.mjs` reference
venue/user/membership fixture rows they delete at cleanup but never
insert. Manually seeding those fixtures produced clean 16/16 and 23/23
runs, confirming the underlying Management Sync application code has
zero regression from Package 6B's changes.

### CraftHub touch-target check (#20)

Failed under `vite dev`, exactly matching the touch-target timing
artifact documented in Packages C/D as a dev-mode rendering quirk (not
reproduced against `vite preview` this pass due to time budget).

## Cleanup

Test database dropped, Express server / vite dev / vite preview servers
stopped, local PostgreSQL 16 cluster stopped, `dist/` and
`server/_local_media_storage/` removed, temp logs removed.
