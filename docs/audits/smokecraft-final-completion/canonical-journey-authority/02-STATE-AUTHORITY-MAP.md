# 02 — State Authority Map

| Value | Authority | Reset by Start New Journey (before this pass) | Reset by Start New Journey (after this pass) |
|---|---|---|---|
| Curriculum completion / current session / percent | `computeJourneyStatus(completedSteps)` (single, unchanged) | N/A — `completedSteps` reset to `['enroll']` by `useStartNewSmokeCraftJourney` (unchanged) | unchanged |
| Entry readiness (enroll/venue) | `getSmokeCraftEntryReadiness()` (single, unchanged) | N/A | unchanged |
| Learner display name (`journey.identity.preferredName`/`fullName`) | `SmokeCraftJourneyContext.journey.identity` | **Not reset — the confirmed root cause** | **Fixed — now reset to `null`** |
| `guestSession.profile.firstName` | `GuestSessionContext` | Reset (unchanged, from the earlier Clean-Start pass) | unchanged |
| Selected venue | `journey.selectedVenue` | Preserved (deliberate, documented decision from the Entry-Prerequisite pass) | unchanged — still preserved |
| Selected cigar / mentor / knowledge level (`guestSession.*`) | `GuestSessionContext` | Reset via `resetJourneySpecificFields()` (unchanged) | unchanged |
| Completed/archived journey history | `journey.previousCompletedJourneys` | Read-only, never re-hydrated into active state (unchanged, re-verified) | unchanged |

No second, competing "journey lifecycle" state store was found. The single defect was one field's omission from one existing reset function.
