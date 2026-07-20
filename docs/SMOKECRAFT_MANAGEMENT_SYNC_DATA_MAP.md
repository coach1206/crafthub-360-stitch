# SmokeCraft 360 — Management Sync Data Map

One row per visible field in the approved composition. Status values
restricted to: LIVE AND VERIFIED, WIRED BUT EMPTY, DEMO ONLY, HARDCODED,
PLACEHOLDER, NOT CONNECTED, BLOCKED.

| Field | React element | State var | Canonical source | API | DB table | Journey field | Transform | Persistence | User/venue/session scope | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| Cigar name (summary zone) | `<span>{cigar.name}</span>` | `cigar` | `SmokeCraftJourneyContext` | none | none | `journey.selectedCigar.name` | none | localStorage (`sc_journey_v1`) | session-scoped only (single-device local) | **LIVE AND VERIFIED** |
| Pairing (summary zone) | `<span>{pairing.recommendation}</span>` | `pairing` | `SmokeCraftJourneyContext` | none | none | `journey.pairing.recommendation` | none | localStorage | session-scoped only | **LIVE AND VERIFIED** |
| XP (summary zone) | `<span>{session.xp} XP</span>` | `session` | `GuestSessionContext` | none | none | `session.xp` | none | localStorage (`novee_guest_session`) | session-scoped only | **LIVE AND VERIFIED** |
| Flavor notes (summary zone) | `<span>{flavors.join(', ')}</span>` | `flavors` | `SmokeCraftJourneyContext` | none | none | `journey.flavorMemory.selectedFlavors` | `.join(', ')` | localStorage | session-scoped only | **LIVE AND VERIFIED** |
| Journey Sync Status | none rendered | — | — | none | none | — | — | — | — | **NOT CONNECTED** |
| Data Shared | none rendered | — | — | none | none | — | — | — | — | **NOT CONNECTED** |
| Guest Impact Score | none rendered | — | — | none | none | — | — | — | — | **NOT CONNECTED** |
| Venue Benefit | none rendered | — | — | none | none | — | — | — | — | **NOT CONNECTED** |
| Cigar Selection (What Was Synced) | none rendered | — | — | none | none | — | — | — | — | **NOT CONNECTED** |
| Pairing (What Was Synced) | none rendered | — | — | none | none | — | — | — | — | **NOT CONNECTED** |
| Flavor Notes (What Was Synced) | none rendered | — | — | none | none | — | — | — | — | **NOT CONNECTED** |
| Journey Snapshot | none rendered | — | — | none | none | — | — | — | — | **NOT CONNECTED** |
| Guest Preferences | none rendered | — | — | none | none | — | — | — | — | **NOT CONNECTED** |
| Feedback | none rendered | — | — | none | none | — | — | — | — | **NOT CONNECTED** |
| Top Performing Pairing | none rendered | — | none exists | none | none exists (would require new venue-scoped completed-journeys table) | — | — | — | — | **NOT CONNECTED** |
| Most Selected Cigar | none rendered | — | none exists | none | none exists | — | — | — | — | **NOT CONNECTED** |
| Guest Satisfaction | none rendered | — | none exists | none | none exists | — | — | — | — | **NOT CONNECTED** |
| Repeat Visit Potential | none rendered | — | none exists | none | none exists | — | — | — | — | **NOT CONNECTED** |
| Inventory Impact | none rendered | — | none exists | none | none exists | — | — | — | — | **NOT CONNECTED** |
| Popular Items | none rendered | — | none exists | none | none exists | — | — | — | — | **NOT CONNECTED** |
| Low Stock Alerts | none rendered | — | none exists | none | none exists | — | — | — | — | **NOT CONNECTED** |
| Staff Performance | none rendered | — | none exists | none | none exists | — | — | — | — | **NOT CONNECTED** |
| Revenue Impact | none rendered | — | none exists | none | none exists | — | — | — | — | **NOT CONNECTED** |
| Service Impact | none rendered | — | none exists | none | none exists | — | — | — | — | **NOT CONNECTED** |
| Sync Activity table (5 columns) | none rendered | — | none exists | none | `eat_management_sync_events` exists but is for unrelated POS/order events, not journey sync | — | — | — | — | **NOT CONNECTED** |
| View Analytics (action) | none rendered (no click handler exists) | — | — | no route exists | — | — | — | — | — | **NOT CONNECTED** |
| Inventory Management (action) | none rendered | — | — | no route exists | — | — | — | — | — | **NOT CONNECTED** |
| Staff Feedback (action) | none rendered | — | — | no route/modal exists | — | — | — | — | — | **NOT CONNECTED** |
| Command Hub Access | none rendered | — | — | no route exists | — | — | — | — | — | **NOT CONNECTED** |

## Summary

4 of 28 visible fields are LIVE AND VERIFIED (all sourced from the
existing, canonical, already-verified `GuestSessionContext`/
`SmokeCraftJourneyContext` local state — no fabrication). The remaining
24 fields/actions are NOT CONNECTED — no code renders them at all
currently (not wired-but-empty; genuinely absent), and no real backend
destination exists to safely connect them to without building new
infrastructure (persistent venue-scoped storage, authentication,
aggregation queries) that is out of scope for a single pass given the
data-isolation risk of doing so without dedicated review.

## Addendum — Architecture package (this pass)

This table stands unchanged and is not replaced — it remains the accurate
field-by-field status as of this pass, since no backend or frontend code
was implemented in the architecture-only follow-up package. See
`docs/SMOKECRAFT_MANAGEMENT_SYNC_DATA_SOURCE_AUDIT.md` for a deeper,
per-field authoritative-source trace (matching this table's 24
NOT CONNECTED rows against exactly which client-only source each would
need to be promoted from), and
`docs/SMOKECRAFT_MANAGEMENT_SYNC_IMPLEMENTATION_PLAN.md` (Package C) for
the specific future step that would populate these 24 fields once
Packages A/B exist.
