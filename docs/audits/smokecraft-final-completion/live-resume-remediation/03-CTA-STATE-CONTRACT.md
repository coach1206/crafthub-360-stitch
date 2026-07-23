# 03 — CTA State Contract

One authoritative source (`computeJourneyStatus(completedSteps)` in `src/constants/smokecraftJourneyStatus.js`) drives every CTA on both the landing page (`src/pages/SmokeCraft.jsx`) and the Resume page (`src/pages/smokecraft/ResumeJourney.jsx`). Neither screen computes its own independent notion of "does a resumable journey exist."

| State | Condition | Landing CTA | Resume-page primary | Resume-page secondary |
|---|---|---|---|---|
| No valid active journey | `!journeyStatus.hasStarted` | `START SMOKECRAFT JOURNEY →` | `START SMOKECRAFT JOURNEY` (no confirmation — nothing recoverable to lose) | none |
| Valid incomplete journey | `hasStarted && !isComplete` | `RESUME SMOKECRAFT JOURNEY →` | `RESUME SMOKECRAFT JOURNEY` | `START NEW SMOKECRAFT JOURNEY` (requires confirmation) |
| Valid completed journey | `isComplete` | `VIEW COMPLETED JOURNEY →` | `VIEW COMPLETED JOURNEY` | `START NEW SMOKECRAFT JOURNEY` (requires confirmation) |

LocalStorage (`novee_guest_session`) is read only as a display cache of the guest-session record whose actual identity is anchored by the server-issued guest-session cookie — it is never treated as a second, competing source of "is there an active journey," and no code path lets a client write an arbitrary override that this logic would trust (verified: `computeJourneyStatus` only ever reads `completedSteps`, which is itself only ever written by real, gated completion events, not free-form client input).
