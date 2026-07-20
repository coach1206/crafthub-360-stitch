# SmokeCraft Management Sync — Package D Analytics Model

## Data source decision: on-demand queries, not a materialized table

Considered per the original Package A schema doc's tradeoff (§D,
"on-demand vs. materialized"): a `smokecraft_management_sync_venue_insights`
table was designed but never built, precisely so this decision could be
made with real evidence later. That evidence now exists: no background
job runner exists anywhere in this codebase (confirmed in the original
architecture audit), so a materialized table would go stale with no
mechanism to refresh it. On-demand queries are simpler, always correct,
and — at the journey volumes any single venue could plausibly generate —
not a performance concern. **No new migration was created this package.**

## Formulas (all implemented exactly as specified in the original `SMOKECRAFT_MANAGEMENT_SYNC_METRIC_DEFINITIONS.md`)

- **Completed/active journey count**: `COUNT(*) FILTER (WHERE status = ...)`, venue+date-range scoped.
- **Completion rate**: `completed / total`, real numerator/denominator returned (never a bare percentage).
- **Cigar/pairing/flavor trends**: top-5 by count, computed only from each completed journey's **latest** snapshot (`DISTINCT ON (journey_id) ... ORDER BY snapshot_version DESC`) — a journey snapshotted 3 times counts once, using its newest data.
- **Scorecard average**: `AVG(rating)` over the same latest-snapshot set, only where `rating IS NOT NULL`.
- **Sync health**: `COUNT(*) GROUP BY status` over `smokecraft_management_sync_events` — internal Management Sync activity only, never framed as an external-integration status.

## Minimum sample size

**5 completed journeys per venue**, matching the original spec. Below
threshold, every ranking/average field returns
`{value: null, availability: 'insufficient_data', sampleSize, threshold}`
— the real sample size is always shown, never hidden, so "insufficient"
is independently verifiable by whoever reads the response.

## Date range

Required (`startDate`/`endDate`), validated (`invalid_date_range` for
malformed/inverted dates), capped at 90 days (`date_range_too_large`) —
prevents an unbounded full-table scan from the browser.

## Live-verified accuracy (this package)

6 real completed journeys seeded at one venue (4× "Robusto Reserve", 2×
"Torpedo Classic", all paired "Bourbon", all noted "Cedar", all rated 4):
the API correctly returned `completedJourneyCount: 6`, top cigar
"Robusto Reserve" with `count: 4`, pairing "Bourbon" with `count: 6`,
flavor "Cedar" with `count: 6`, and `scorecardAverage.value: 4` — every
number traced to and matched the real seeded data, not asserted from
code inspection alone. A second venue seeded with only 2 journeys
correctly returned `insufficient_data` with `sampleSize: 2`.
