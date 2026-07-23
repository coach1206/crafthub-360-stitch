# 05 — Journey Scoping

## Architecture disclosure: SmokeCraft's numbered-spine state is browser-scoped, not journey-ID-namespaced

Confirmed by source inspection (consistent with every prior pass's findings — Phase Architecture Reconciliation, Live Deployment Verification): SmokeCraft's `GuestSessionContext`/`SmokeCraftJourneyContext` state is a single object per guest-session cookie, not an array of journeys keyed by journey ID. `activeJourneyId` exists as a field *within* that single object (minted fresh by `startNewJourney()`), and `previousCompletedJourneys` is an append-only archive array — but the live, editable journey-content fields (`selectedMentor`, `smokeCraft.*`, `mentor`, `selectedCigar`, etc.) are not namespaced per journey ID; there is exactly one "current" copy of each, which is what `startNewJourney()`/`resetJourneySpecificFields()` overwrite in place.

This means: "journey ID scoping" in the strict sense the mandate describes (every read/write scoped to the active journey ID, multiple journeys' data coexisting in storage) **does not exist and was not built in this pass** — building it would be a substantial architecture change (converting every journey-content field into a `{ [journeyId]: value }` map, or moving to per-journey server records), far beyond "the smallest safe production fix" for this specific defect. The defect this pass fixes — stale data surviving a Start action — is fully resolved by ensuring the single current copy is genuinely reset on every Start, which is what was implemented.

## What "scoping" concretely means today, verified correct after this fix

- Only one journey's content data exists in `GuestSessionContext`/`SmokeCraftJourneyContext` at any time — the "current" one.
- `startNewJourney()` mints a new `activeJourneyId` and, if the outgoing journey was complete, archives a summary (`journeyId`, `cigarName`, `completedAt`) into `previousCompletedJourneys` — the only "other journey" data that coexists with the current one, and it is read-only history, never re-hydrated as active state.
- Cross-**learner** isolation (different guest-session cookies/identities) is unaffected by this pass and remains enforced server-side for every module that persists real records (Golden Box, Packaging Studio, Passport) — re-verified via the Passport Security Unified Identity regression suite.

## Golden Box / Packaging Studio disclosure

As noted in `02-STATE-RESET-MANIFEST.md`, Golden Box entries and Packaging Studio designs are server-persisted under their own `entryId`/`designId`, tied to the guest identity, not to the SmokeCraft numbered-journey concept. Starting a new SmokeCraft journey does not retroactively unlink or hide a guest's existing in-progress Golden Box entry — this is disclosed as existing, intentional module separation (Golden Box is a `SUPPORTING_MODULES` entry, outside `TOTAL_SESSIONS`, with its own independent lifecycle), not a defect this pass introduces or is asked to fix.
