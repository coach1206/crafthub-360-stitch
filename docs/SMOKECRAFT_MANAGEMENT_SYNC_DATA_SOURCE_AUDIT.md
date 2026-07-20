# SmokeCraft Management Sync — Authoritative Data-Source Map (Phase 2)

Status legend: **AUTHORITATIVE** (real, server-verifiable, safe to build
on) · **PARTIAL** (real but incomplete/local-only) · **LOCAL ONLY**
(client localStorage, no server backing) · **DEMO ONLY** · **NOT STORED**
· **BLOCKED**.

## Session identity

| Field | Source file | Store | API | Table | Persistence | User scope | Venue scope | Status |
|---|---|---|---|---|---|---|---|---|
| Authenticated user ID | `authMiddleware.js` (`req.user.id`) | JWT | — | — | server session | real when authenticated; `proto-guest` in dev | n/a | PARTIAL |
| Guest reference | `GuestSessionContext` | localStorage `novee_guest_session` | none | none | client, single-device | none (no server identity) | none | LOCAL ONLY |
| Venue ID | `SmokeCraftJourneyContext.journey.selectedVenue.id` | localStorage `sc_journey_v1` | none | none | client | n/a | client-only | LOCAL ONLY |
| Journey ID | not present anywhere | — | — | — | — | — | — | NOT STORED |
| Session ID (27-spine) | `constants/session.js` step ids (`entry`, `enroll`, ...) | localStorage | none | none | client | n/a | n/a | LOCAL ONLY |
| Journey phase | `SmokeCraftProgressContext` derived from `completedSteps` | localStorage | none | none | client | n/a | n/a | LOCAL ONLY |
| Session number | derived from spine position | localStorage | none | none | client | n/a | n/a | LOCAL ONLY |
| Started timestamp | not tracked | — | — | — | — | — | — | NOT STORED |
| Completion timestamp | `journey.sessionCompletion.completedAt` | localStorage | none | none | client | n/a | n/a | LOCAL ONLY |
| Completion status | `session.completedSteps.includes('session-complete')` | localStorage | none | none | client | n/a | n/a | LOCAL ONLY |

## Cigar

| Field | Source | Status |
|---|---|---|
| Cigar ID/name/brand/wrapper/origin/shape/size/strength/body | `journey.selectedCigar` (`SmokeCraftJourneyContext`) | LOCAL ONLY |
| Humidor source | `HumidorMatch.jsx` selection flow, static catalog data, no server table | LOCAL ONLY (catalog itself is static app data, not user data) |
| Inventory source | none — no cigar-humidor inventory table found | NOT STORED |

## Pairing

| Field | Source | Status |
|---|---|---|
| Pairing category / selected pairing / compatibility / recommendation / clashes / adjustments / goal | `journey.pairing` (`PairingLab.jsx` writes it) | LOCAL ONLY |

## Flavor

| Field | Source | Status |
|---|---|---|
| First/Second/Final Third notes | `journey.firstThird`/`secondThird`/`finalThird` (per-screen fields) | LOCAL ONLY |
| Flavor Memory selections | `journey.flavorMemory.selectedFlavors` | LOCAL ONLY |
| Body/intensity/finish/balance/dominant notes | not separately tracked beyond the above free-text/selection fields | PARTIAL (only what's listed above; no dedicated scalar fields) |

## Mentor

| Field | Source | Status |
|---|---|---|
| Selected mentor IDs/names | `journey.mentor` array (`MeetYourCigar.jsx`/mentor selection flow) | LOCAL ONLY |
| Mentor commentary | static content (`MentorCommentary.jsx`, baked image + config), not per-guest data | AUTHORITATIVE as static content, NOT STORED as guest interaction data |
| Guidance used | not tracked | NOT STORED |

## Guest

| Field | Source | Status |
|---|---|---|
| Preferences | `journey.identity` fields | LOCAL ONLY |
| Scorecard results | `journey.scorecard` (`Scorecard.jsx`) | LOCAL ONLY |
| Final rating | part of scorecard | LOCAL ONLY |
| Satisfaction | not a dedicated field — would need to be derived/added | NOT STORED |
| Feedback | not tracked as free text anywhere found | NOT STORED |
| Return-intent signal | not tracked | NOT STORED |
| Saved connections | `journey` connections data (`Connections.jsx`) written to localStorage; also `dayone360SmokeCraftConnectionRoutes.js` + migration 072 exist server-side for a related but distinct DayOne360 connections feature — **not confirmed** to be the same data model as SmokeCraft's in-journey "Connections" screen | PARTIAL — server table exists for a related feature, requires implementation-time confirmation of whether it's the same concept |

## Completion

| Field | Source | Status |
|---|---|---|
| Passport stamp | `awardStamp()` (`GuestSessionContext`) writes locally; migration 068's `passport_360_earned_stamps` is real server-side storage **for the Passport module**, not confirmed wired from SmokeCraft's `awardStamp` calls specifically | PARTIAL |
| Rewards / XP | `session.xp` (client) vs. `passport_360_guest_progress.total_xp` (server, Passport-scoped) — not confirmed as the same counter | PARTIAL |
| Completion event | `session-complete` step in `completedSteps` | LOCAL ONLY |
| Staff handoff | not found | NOT STORED |
| Management-sync eligibility | none exists — would be a new derived rule (e.g. `session-complete` present) | NOT STORED (rule not yet defined server-side) |

## Summary judgment

**Every single Management Sync field is currently LOCAL ONLY or NOT
STORED.** Nothing is currently AUTHORITATIVE from a server perspective.
The closest real, reusable server-side precedent is the Passport 360
persistence layer (migration 068) — same platform, same
guest/venue/module shape, real idempotency pattern (`dedupe_key`) — but
it is a **different module's** tables and is not automatically reusable
for SmokeCraft Management Sync's journey/snapshot data without new,
purpose-built tables (Phase 3). This confirms and extends the prior
Management Sync Phase 1 finding ("no real backend destination exists")
with field-by-field detail.
