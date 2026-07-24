# 05 — Data Ownership

`getSmokeCraftScreenData(screenId, { session, journey })` (`src/services/smokecraft/smokecraftScreenDataSelector.js`) is a pure function (no hooks, no new storage) that projects the existing `GuestSessionContext`/`SmokeCraftJourneyContext` state into three explicit groups, matching the mandate's required separation:

- **Account data:** xp, rank, badges, passport, hapticsEnabled
- **Journey data:** learnerName (from `journey.identity`, the field fixed in the prior Canonical Journey Authority pass), venue, cigar, mentor, knowledgeLevel, activeJourneyId, completedSteps, goldenBox
- **History data:** previousCompletedJourneys — explicitly kept separate, only ever read by history-review UI, never merged into `journey`

This does not replace `GuestSessionContext`/`SmokeCraftJourneyContext` — no new storage authority was created (re-confirmed: `getSmokeCraftScreenData` contains no `localStorage`/`useState` calls). It is a shared read-shape, migrated screens can adopt without duplicating field-access logic.
