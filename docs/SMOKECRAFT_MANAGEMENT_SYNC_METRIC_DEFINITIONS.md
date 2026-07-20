# SmokeCraft Management Sync — Metric Definitions (Phase 9)

All metrics below are defensible only when their stated minimum-data
requirement is met; otherwise the API returns `null` + an availability
reason (never a fabricated or interpolated value), per the response
contract.

## Guest Impact Score (single-journey metric)

**Appropriate scope**: a single completed journey only — never presented
as a venue trend (a venue-level rollup of these would be a *separate*,
explicitly-labeled aggregate, not this metric renamed).

- **Inputs**: scorecard `rating` (1-5, from `smokecraft_management_sync_snapshots.rating`),
  `completion_state` (completed/not), `feedback_text` presence (boolean,
  content itself never used numerically), `connections_saved` (count),
  `return_intent` (yes/no/maybe).
- **Weights**: completion 40%, rating (normalized 0-1 from 1-5 scale)
  35%, feedback given 10%, connection saved 10%, return intent = yes 5%.
- **Missing-data behavior**: any input that is `null` is excluded from
  both the numerator and the weight denominator (re-normalized over
  available inputs), not treated as 0.
- **Minimum-data requirement**: `completion_state = 'completed'` is
  mandatory — an in-progress journey never gets a score (`journey_incomplete`).
- **Output range**: 0-100, integer.
- **Note**: this is a per-journey engagement signal, not a financial or
  satisfaction guarantee — labeled as such in any UI copy (out of scope
  here, a frontend concern for a later package).

## Venue Benefit

**No fabricated financial value, per instruction.** Defined purely as
measurable operational signals, each independently reported (not
collapsed into one fake dollar figure):
- `completedJourneyCount` (venue-scoped count)
- `feedbackCapturedCount`
- `cigarPreferenceCapturedCount`
- `pairingPreferenceCapturedCount`
- `connectionSavedCount`
- `staffHandoffCreatedCount`

Each is a real `COUNT()` over `smokecraft_management_sync_snapshots`
joined to `journeys` filtered by `venue_id` — no weighting, no synthetic
currency conversion.

## Top Performing Pairing / Most Selected Cigar

- **Sample-size threshold**: minimum 5 completed journeys with a non-null
  selection for that venue before a "top"/"most selected" value is
  returned; below threshold → `null` + `insufficient_data`.
- **Venue scope**: `WHERE venue_id = $1 AND status = 'completed'`.
- **Completed-journey requirement**: only `journeys.status = 'completed'`
  rows count — in-progress journeys are excluded entirely, not counted as
  partial signal.
- **Tie behavior**: on an exact count tie, return all tied values as an
  array with `tie: true`, rather than arbitrarily picking one (avoids
  presenting an arbitrary winner as authoritative).
- **Insufficient-data response**: `{ value: null, availability:
  'insufficient_data', sampleSize: N, threshold: 5 }` — the actual sample
  size is always shown alongside the reason, so "insufficient" is
  verifiable, not just asserted.

## Guest Satisfaction

- **Source field**: `smokecraft_management_sync_snapshots.rating`
  (1-5 scale).
- **Aggregation**: `AVG(rating)` over completed journeys for the venue,
  rounded to 2 decimals.
- **Sample size**: same 5-journey minimum threshold as above; the raw
  `sampleSize` is always included so a manager can judge confidence
  themselves even near the threshold.
- **Missing-data handling**: journeys with `rating IS NULL` are excluded
  from both numerator and denominator (not counted as 0 or as
  "unrated = 3").

## Repeat Visit Potential

- **Inputs**: `return_intent`, `rating`, `connections_saved > 0`,
  preference-completion (cigar + pairing both non-null).
- **Formula**: percentage of a venue's completed journeys where
  `return_intent = 'yes'` OR (`return_intent IS NULL` AND `rating >= 4`
  AND at least one preference captured) — a real proxy formula, not a
  random or invented number, but explicitly labeled `estimated` in the
  response (`{value, availability: 'ok', basis: 'estimated', sampleSize}`)
  since it partially infers intent when `return_intent` wasn't directly
  collected.
- **Denominator validity**: this percentage is only returned when
  `sampleSize >= 5` (same threshold); with a smaller/zero denominator the
  API returns `null` + `insufficient_data`, never divides by zero or by
  an assumed default.

## Cross-cutting rules enforced by this design

- No random values anywhere in any formula above — every input traces to
  a real stored column.
- No single journey is ever presented through the venue-aggregate keys
  (`management_insights`/`venue_operations_impact`) — those keys only
  ever contain multi-journey aggregates gated by the sample-size
  threshold.
- No percentage is computed with a zero or missing denominator; all such
  cases return `insufficient_data` instead.
