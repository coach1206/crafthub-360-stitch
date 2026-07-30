# Venue/Competition Isolation Proof — Holistic Fix 5C-2B-1

Verified live against the real running server and database.

## Venue isolation

Two real `venues` rows and two real `venue`-scoped
`golden_box_competitions` (Venue A, Venue B), each with one entry
scored differently (9/10 vs 3/10). Venue A's finalized `ranked` array
contained exactly one entry — Venue A's own — never Venue B's, despite
both being scored by the same judge account across both venues'
memberships.

## Competition isolation

Two separate `global`-scope competitions (never venue-related), each
with one entry scored differently (4/10 vs 9/10). Competition A's
finalized ranking never included Competition B's entry — every results
query in `resultsService.js` is scoped by a real `competition_id`
parameter (`WHERE e.competition_id = $1`, `WHERE competition_id = $1
AND result_version = $2`); no query aggregates across competitions.
