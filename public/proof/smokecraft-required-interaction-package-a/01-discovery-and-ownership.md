# 01 — Discovery and Ownership

**Starting commit:** `6cde9504` (SmokeCraft Required-Interaction Manifest and 21-Session Audit)

## Scope

Close the required-interaction gap for Sessions 8 (First Third), 12 (Second Third), and 16
(Final Third) — all three classified `PARTIAL` in the canonical manifest
(`src/constants/smokecraftRequiredInteractions.js`), sharing the same root cause: real tasting
observations are captured in the UI and written to local `GuestSessionContext`/journey state,
but never submitted to any server endpoint that validates them, and completion is granted by the
same generic `completeSession()` call used by every other session — so completion has never
actually depended on the observation being real.

## Existing architecture inventoried before writing any code

- `MiniTasting.jsx` + `saveTastingDraft()` / `submitTastingCompletion()` — the cigar-selection
  tasting flow's real backend, but hardcoded to validate `selectedCigarId` against venue flight
  inventory. Not directly reusable for a generic multi-note observation capture.
- `submitCultivatorEvidence()` (Holistic Fix 5A-3E) — the correct architectural precedent: a
  second, independent validation function writing a different `activity_type` to the SAME shared
  append-only ledger, `smokecraft_activity_attempts`. This is the pattern followed for Package A.
- `smokecraft_activity_attempts` schema (already existed, no migration needed):
  `guest_reference`, `activity_type`, `activity_key`, `evidence JSONB`, `xp_awarded`,
  `idempotency_key`, with `UNIQUE(guest_reference, activity_type, activity_key)` and
  `UNIQUE(guest_reference, idempotency_key)`.
- `completeSession()` (`server/services/smokecraft/playerStateService.js`) — the single,
  universal, idempotent, server-authoritative completion+XP mechanism for all 21 sessions. Looks
  up XP server-side from `sessionRewardTable.js` by `sessionId` alone. Confirmed via source read
  to accept no field carrying the player's actual answer.
- `SmokeCraftScreenRenderer.jsx` — the single canonical render path for all 27 curriculum
  screens; supplies a real `onComplete` callback to session components, which calls
  `completeSmokeCraftScreen()` → `awardSessionRewards()` → server `completeSession()`.

## Decision

Add a new server-side evidence-validation function (`submitTastingObservation`) that writes
`activity_type='tasting_observation'` rows to the existing shared ledger — not a second
persistence system — then gate `completeSession()` for `sessionId` in
`['first-third','second-third','final-third']` on that evidence already existing. No new
migration, no new table, no change to XP ownership (this function awards 0 XP; `completeSession`
remains the sole XP authority).
