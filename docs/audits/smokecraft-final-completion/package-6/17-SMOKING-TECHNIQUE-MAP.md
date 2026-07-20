# Package 6 Closure — Smoking Technique Map

## Content

6 real `smoking_technique` catalog records: `puff-cadence`,
`resting-the-cigar`, `ash-management`, `retrohale`, `relighting`,
`when-to-stop`. Each explains what it is, why it matters, and its
Golden Box sensory relevance. 1 new quiz question (`quiz-retrohale-technique`).

The lesson explicitly states cigar smoke is not meant to be inhaled like
cigarette smoke (`Vitola.jsx`'s `SmokingTechnique` component copy) — no
inhalation is encouraged anywhere in the UI or content text.

## Cadence exercise (tactile, server-persisted)

New table `smokecraft_cadence_sessions` (migration 083): one row per
guest, `status` (`not_started`/`in_progress`/`completed`), `puff_count`,
`ash_checks`, `overheating_warnings`, `started_at`/`stopped_at`.

- **Start**: `POST /api/smokecraft/flavor-pairing/cadence/start` resets
  and marks `in_progress`.
- **Record Puff / Check Ash**: `POST .../cadence/event/:eventType`
  increments the matching counter server-side — the frontend never
  fakes a count locally.
- **Overheating warning**: purely educational pacing heuristic (every
  5th recorded puff triggers a visible warning suggesting a rest) — the
  UI copy explicitly states no device measures actual smoke temperature.
- **Finish**: `POST .../cadence/stop` marks `completed` and awards 15 XP
  via `smoking_technique_complete` (idempotency key
  `smoking-technique-complete:<guest>`) — verified: restarting and
  finishing again does not re-award XP.

Honest states used throughout: `manual` (every recorded event requires a
real tap), no `not_configured`/`unavailable` states were needed since the
exercise has no external device dependency to honestly report as
unconfigured.

## Interaction and accessibility

Native buttons throughout, `aria-label` on every action ("Record a puff
(wait ~45-60 seconds between puffs)", "Record an ash check", "Finish
cadence exercise"), `triggerHaptic` on start/event/finish, `role="status"`
on the overheating warning and completion message, keyboard-operable
(verified: Enter on the focused "Start Cadence Exercise" button starts
the session).

## Mentor / Golden Box connection

Reuses the same `journey.mentor[0]` pattern as every other Package 5/6
section — no separate mentor logic was needed since the mentor callout at
the top of `Vitola.jsx` already covers the whole page including this
section. Golden Box connection is disclosed as informational only (the
lesson explains sensory-preparation relevance in its content text); no
direct pre-fill link into a Golden Box entry was built, consistent with
every other Package 5/6 section's scope boundary.
