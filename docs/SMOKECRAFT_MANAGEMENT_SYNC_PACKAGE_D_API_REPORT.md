# SmokeCraft Management Sync — Package D API Report

## New endpoint

| Method | Path | Auth | Query params | Response (success) |
|---|---|---|---|---|
| GET | `/api/smokecraft/management-sync/venues/:venueId/insights` | `requireAuth` + `requireValidVenue` + `requireVenueMembership` | `startDate`, `endDate` (ISO, required, ≤90 days apart) | `{success, venueId, dateRange, completedJourneyCount, activeJourneyCount, completionRate:{value,numerator,denominator}, cigarTrends, pairingTrends, flavorTrends, scorecardAverage, syncHealth:{pending,completed,failed}}` |

`cigarTrends`/`pairingTrends`/`flavorTrends`/`scorecardAverage` each
follow `{value, availability: 'ok'|'insufficient_data', sampleSize, threshold?}`.

## Errors

`date_range_required`, `invalid_date_range`, `date_range_too_large` (400,
includes `maxDays: 90`); `venue_not_found`/`venue_inactive` (via the
reused `requireValidVenue`, 404/403); `venue_membership_required` (via
the reused `requireVenueMembership`, 403); 401 in production for a
fully-unauthenticated request (403 in this repo's non-production
dev-mode fallback, documented as a pre-existing platform behavior, not
new).

## Frontend client

`getVenueAnalytics(venueId, {startDate, endDate})` added to
`src/services/smokecraft/managementSyncApiClient.js` — same
`credentials: 'include'`, same normalized error shape as every other
client function.

## No competing endpoint versions

This is the only analytics endpoint added — matches the single path
already specified in the original `SMOKECRAFT_MANAGEMENT_SYNC_API_CONTRACT.md`
Phase 5 (`GET .../venues/:venueId/insights`), not a new invented shape.
