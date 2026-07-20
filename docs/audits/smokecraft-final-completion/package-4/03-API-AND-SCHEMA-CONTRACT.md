# Package 4 — Backend/API Contract (Step 17)

## Migration

`server/db/migrations/080_seed_soil_learning_experience.sql` — additive
only, does not touch 075-079.

New tables:
- `smokecraft_seed_soil_notes` (id, guest_reference, component_id FK→
  golden_box_component_catalog, note_text, created_at, updated_at)
- `smokecraft_seed_soil_progress` (id, guest_reference, component_id FK,
  viewed_at, `UNIQUE(guest_reference, component_id)`)
- `smokecraft_seed_soil_quiz_attempts` (id, guest_reference, question_id
  FK→smokecraft_quiz_questions, is_correct, xp_awarded, created_at,
  `UNIQUE(guest_reference, question_id)`)

New `xp_award_rules` rows: `seed_soil_quiz_correct` (15 XP),
`seed_soil_exploration_complete` (10 XP, seeded but not yet triggered —
disclosed in `02-SEED-SOIL-LIVE-EXPERIENCE.md`).

## Service

`server/services/goldenBox/seedSoilService.js` — `getNotes`, `saveNote`,
`recordProgress`, `getProgress`, `submitQuizAnswer` (delegates XP award to
the existing, unmodified `xpService.awardXp`).

## Routes — `/api/smokecraft/seed-soil` (mounted in `server/index.js`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/components?category=` | public | thin pass-through to Package 3's `contentService.listComponents` |
| GET | `/notes` | guest identity required | own notes only |
| POST | `/notes` | guest identity required | create or update (`noteId` optional) |
| GET | `/progress` | guest identity required | own progress only |
| POST | `/progress` | guest identity required | upsert `(guest, component)` |
| POST | `/quiz/:questionId/answer` | guest identity required | idempotent per `(guest, question)`, never re-awards XP on repeat |

Identity: reuses the exact same `attachSmokeCraftIdentity` +
`requireSmokeCraftIdentity` middleware and `bridgeIdentity` pattern as
`goldenBoxRoutes.js` — no new identity scheme. Rate limits: 90/min read,
40/min write (comparable to Golden Box's own limiter, seed-soil is
lighter-weight interaction).

## Frontend

- `src/services/smokecraft/seedSoilApiClient.js` — thin fetch wrapper,
  same conventions as `goldenBoxContentApiClient.js`.
- `src/pages/smokecraft/SeedSoil.jsx` — rewired to fetch real catalog rows
  on mount, matched to existing zone ids by `component_key`; notes/
  progress/quiz calls added; no route change.

## Regression surface checked

Migration 080 was applied cleanly on top of 001-079 with zero conflicts.
`golden_box_component_catalog`, `smokecraft_quiz_questions`, and
`xp_award_rules` were only read/inserted-into (via idempotent seed
additions), never altered structurally. Protected files (migrations
075-079, Venue Management, Flavor Memory, Pairing Lab, Badges, Passport,
Leaderboard, `GoldenBox.jsx`, `GoldenBoxStatus.jsx`) were not touched —
confirmed by `git status` scoping (see final report).
