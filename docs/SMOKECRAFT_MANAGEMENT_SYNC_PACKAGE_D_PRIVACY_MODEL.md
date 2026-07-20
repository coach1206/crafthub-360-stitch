# SmokeCraft Management Sync — Package D Privacy Model

## What venue analytics never returns

- **Guest identity**: no `guest_reference`, no `user_id`, no journey ID
  appears anywhere in `getVenueAnalyticsSummary`'s response — confirmed
  live this package by regex-scanning the actual JSON response for the
  test's own seeded guest-reference pattern (zero matches).
- **Raw free-text feedback**: `snapshots.feedback_text` is never
  selected by the analytics service (confirmed by reading the SQL — the
  `SELECT` list is `cigar_selection, pairing_selection, flavor_notes,
  rating` only, no `feedback_text` column at all).
- **Individual journey records**: every query aggregates
  (`COUNT`/`AVG`/top-N grouping) — no endpoint returns a raw per-journey
  row list.

## Suppression

Below the 5-journey minimum sample size, rankings/averages are withheld
entirely (`insufficient_data`), not shown with a misleadingly small
sample. This protects against re-identification risk in a low-volume
venue where "the one guest who rated 2 stars" could otherwise be
inferred from a tiny aggregate.

## Access control (reused from Package B, not reinvented)

`requireAuth` → real venue existence/status check
(`requireValidVenue`) → `requireVenueMembership` (real
`venue_memberships` row required, or platform-admin bypass) — the exact
same middleware chain already built and tested for the actions
endpoints in Package B. Guests can never reach this endpoint (no guest
identity path is wired into these routes at all — they require
`requireAuth`, which a guest cookie alone does not satisfy).

## Audit

Every analytics view is audited (`auditAction('VENUE', 'analytics_viewed',
'post')`, writing to the real `audit_logs` table) — a record exists of
who viewed which venue's data and when, without that record itself
containing any guest-identifying information (the audit row's `metadata`
is the sanitized request body, which for a `GET` request is empty).
