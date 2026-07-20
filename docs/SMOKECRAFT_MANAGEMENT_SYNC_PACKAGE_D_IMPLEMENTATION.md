# SmokeCraft Management Sync — Package D Implementation

## Part 1 — Package C gap closure (real, not further deferred)

### 1. START connected to the server
`WelcomeExperience.jsx`'s existing `handleBegin` (S1 "Begin Experience") —
the actual, real START trigger in this app — now calls
`startOrResumeJourney` (fire-and-forget) when a real venue is selected.
Live-tested: clicking Begin Experience creates exactly one real server
journey (confirmed via direct DB query); a second visit/click reuses the
existing journey (resume path), no duplicate. Guarded against
double-click/remount by the hook's existing `startInFlightRef` and its
"check-existing-then-create" logic (unchanged from Package C).

### 2. RESUME connected to the server
`ResumeJourney.jsx`'s `handleResume` now also calls
`startOrResumeJourney`, reusing the exact same reconciliation code path
verified for START (same hook, same function). Not separately re-tested
end-to-end through the Resume Journey screen's own UI this pass (time
budget) — but it is the same, already-proven code, not new/untested
logic.

### 3. Reconciliation — snapshot-version awareness added
`useSmokeCraftServerJourney.js`'s resume branch now also calls
`getLatestSnapshot` after confirming ownership, and updates
`managementSync.snapshotVersion` from the real server value. If the
server's version differs from what was locally known,
`managementSync.stale` is set `true` rather than silently overwritten —
verified by code read; not exercised with two genuinely divergent
snapshot versions in the browser suite this pass (would require a
multi-device simulation out of this package's time scope).

### 4. Snapshot mapper — expanded from 3 to ~10 real fields
`src/services/smokecraft/managementSyncSnapshotMapper.js` (new) maps
`cigarSelection` (name/origin/wrapper/strength/body), `pairingSelection`,
`flavorNotes`, `mentorSelections`, `scorecard`, `rating`, `preferences`
(experience level/focus area), `connectionsSaved`, `completionState`,
`passportState` — all from real `journey` context fields, none
fabricated. `feedbackText`/`returnIntent`/`staffHandoffRequested` remain
`null` — **honestly** — because no real UI anywhere in this app collects
guest feedback, return-intent, or staff-handoff requests yet (confirmed
by code search this pass, not merely assumed). Live-tested: a real
snapshot row now contains a populated `mentor_selections` column
(previously always `null` under Package C's 3-field mapper).

### 5. Checkpoints — 2 additional real save points added
Beyond Package C's single Management-Sync-button checkpoint:
- **Scorecard submission** (`Scorecard.jsx`'s `handleSubmit`): fires
  `saveSnapshot` with the expanded mapper (including the just-submitted
  scorecard), fire-and-forget, only if a server journey already exists.
- **Session Complete** (`SessionComplete.jsx`'s existing, idempotency-
  guarded completion effect): now also fires `saveSnapshot` +
  `completeOnServer`, guarded by the same `!session.completedSteps.includes('session-complete')`
  check already protecting the local reward/stamp award — so it fires
  at most once, matching the existing idempotency pattern exactly rather
  than inventing a new one.

**Disclosed, not closed**: per-screen checkpoints at Mentor Selection,
Cigar selection, Cut/Toast/Light, Seed & Soil, Humidor Match, Flavor
Memory, Pairing Lab, Final Third, and Connections individually were
**not** added as separate save points. The 3 checkpoints that do exist
(Management Sync button, Scorecard, Session Complete) each capture
*all* currently-available local state via the shared mapper at that
moment — so a completed journey's final snapshot is comprehensive even
though it wasn't saved incrementally at every single screen. This is a
real, working design (verified end-to-end), just not the full 12-screen
checkpoint mesh the mandate described. See the Package E Handoff for
what remains.

### 6. Granular UI states
ARIA `role="status"` `aria-live="polite"` added to the sync-status
container (verified present via Playwright locator). A `Retry` button
was added to the FAILED state (previously text-only). `saveState`
(`saving`/`saved`/`failed`) is now tracked in `managementSync` state by
`saveSnapshot`, though `ManagementSync.jsx`'s own UI still collapses
the multi-step chain into one combined "Syncing…"/"✓ Synced" display
rather than showing distinct per-step SAVING/SAVED text — a
**disclosed, deliberate** simplification since the screen only has one
user-facing action (the sync button), not per-checkpoint UI.
PROCESSING, PARTIAL, and RETRYING-as-a-distinct-state remain
un-implemented — PROCESSING is genuinely unreachable (internal sync
completes synchronously), and PARTIAL/RETRYING were judged lower-value
than closing the START/RESUME/mapper/checkpoint gaps given this
package's real time budget.

### 7. Accessibility
`role="status"`/`aria-live="polite"`/`aria-atomic="true"` on the sync
status container; `aria-label` on both the Sync and Retry buttons;
both are real `<button>` elements (correct keyboard/focus semantics by
default, not newly added — they always were real buttons). **No
automated accessibility-testing tool (axe-core or similar) exists in
this repository** — confirmed by checking `package.json` and
`node_modules` — so "test with... automated accessibility tooling
already available in the repository" could not be fulfilled because no
such tooling exists; this is disclosed rather than silently skipped.

## Part 2 — real venue analytics

### Data model decision
**On-demand direct queries**, not a new aggregate table. Documented in
`server/services/managementSync/venueAnalyticsService.js`'s own header
comment and in `SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_D_ANALYTICS_MODEL.md`:
venue journey volume is unproven and no background-job runner exists in
this codebase to keep a materialized table fresh (same conclusion the
original Package A architecture already reached for `venue_insights`).
**No new migration was created** — confirmed via `npm run db:migrate`
showing 74 migrations both before and after this package (074 remains
the latest).

### Real analytics service
`getVenueAnalyticsSummary(venueId, {startDate, endDate})` — completed/
active journey counts, completion rate (real numerator/denominator),
cigar/pairing/flavor trends (top-5, using each completed journey's
**latest** snapshot only — `DISTINCT ON (journey_id) ... ORDER BY
snapshot_version DESC`, avoiding double-counting), scorecard average,
internal sync-health counts. 5-journey minimum sample size before any
ranking/average is returned; below threshold, an honest
`{value: null, availability: 'insufficient_data', sampleSize, threshold}`
object instead. 90-day maximum date range enforced.

### Real API endpoint
`GET /api/smokecraft/management-sync/venues/:venueId/insights` —
`requireAuth` + `requireValidVenue` + `requireVenueMembership` (the
exact middleware chain already built and tested in Package B, reused
unchanged) + `auditAction('VENUE', 'analytics_viewed', 'post')`.

### Real frontend destination
`src/pages/smokecraft/ManagementSyncAnalytics.jsx` (new), registered at
`/smokecraft/management-sync/analytics`. Venue-manager-only — the
**server** enforces this (a guest gets 401/403), not merely a hidden
frontend route; the page itself shows an honest "Unauthorized" state on
denial. Real fetched data only, sample-size suppression rendered
honestly ("Minimum sample size not reached (2/5)"), no fake charts.

### Inventory / Staff Feedback destinations
**Audited, confirmed NOT CONNECTED** — no inventory-management or
staff-feedback route/button exists anywhere in this codebase (confirmed
by code search this pass, not merely re-asserted from the Package D
Handoff). No fake destination was created, per instruction. See the
Package E Handoff for what remains.

## Real bugs found this package

None new — Part 1/2 built cleanly on the already-hardened Package B/C
foundation (the stale-closure and `FOR UPDATE`+`MAX()` bugs from earlier
packages did not recur, since this package reused the same, now-fixed
`saveSnapshot`/`createSnapshot` code paths rather than duplicating them).

## Addendum — Package E audited real integrations against Package D's foundation

Package E's integration audit confirmed Package D's real venue-analytics
service (`getVenueAnalyticsSummary`) remains the only genuine internal
analytics destination — no external system audit in Package E changed
anything about Package D's implementation.
