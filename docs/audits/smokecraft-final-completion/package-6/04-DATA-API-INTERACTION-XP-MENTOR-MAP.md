# Package 6 — Data, API, Interaction, XP, and Mentor Map

Consolidated (same disclosed documentation-format choice as Package 5).

## Schema/backend

**One new migration**: `082_package6_flavor_pairing_practice.sql` —
additive, does not touch 075-081. New tables:
`smokecraft_flavor_stage_observations` (guest+stage keyed, one row per
stage, never overwrites a different stage), `smokecraft_pairing_drafts`
(guest-scoped, multiple drafts supported, "revise" = re-save with the
draft's `id`). New `xp_award_rules` row: `pairing_draft_saved` (15 XP,
awarded once per guest on first save, idempotent).

**Reused without modification**: `smokecraft_seed_soil_notes`/`_progress`/
`_quiz_attempts` (migration 080) — used for cigar-anatomy/vitola/ring-
gauge/strength-body/burn-troubleshooting progress tracking and detail-
panel "Learn More" recording, exactly as Package 5 reused them for
construction content. `golden_box_component_catalog` — 10 new rows
(`cigar_anatomy` ×5, `burn_troubleshooting` ×5). `smokecraft_flavor_notes`
— unchanged, read-only, powers the Flavor Wheel. `smokecraft_quiz_questions`
— 3 new questions (cap, ring gauge, tunneling).

## API

New routes at `/api/smokecraft/flavor-pairing`: `GET /flavor-stages`,
`POST /flavor-stages/:stage`, `GET /pairing-drafts`, `GET
/pairing-drafts/:id`, `POST /pairing-drafts`. Reuses
`/api/smokecraft/seed-soil/{components,notes,progress}` verbatim for
anatomy/vitola/sensory/troubleshooting content and progress, and
`/api/smokecraft/golden-box-content/components/:id` for quiz lookup —
identical pattern to Package 5.

## Interaction inventory

All on `/smokecraft/vitola` (`Vitola.jsx`):
- Cigar Anatomy / Vitola / Ring Gauge & Length / Strength vs. Body / Burn
  & Draw Troubleshooting: 5 chip rows, tap/click/Enter select, "Learn
  More" opens real detail, `aria-pressed`/`aria-label` throughout, no
  default selection (verified by test).
- Flavor Wheel: stage tabs (cold aroma → cold draw → first/second/final
  third → finish), tap-to-toggle flavor notes per stage (16 real taxonomy
  groups), personal notes per stage, debounce-saved, each stage
  independently persisted and never overwritten by another stage
  (verified: switching stages shows a fresh, correctly-scoped note set;
  returning to a stage rehydrates its own data).
- Pairing Builder: category select, item text input, complement/contrast
  strategy toggle, reasoning textarea, save (creates a new draft; passing
  an existing draft's `id` on a later save revises it — the current UI
  always creates new rather than exposing an edit-existing affordance,
  disclosed below), drafts list with resume-after-reload.
- Every control uses native `<button>`/`<input>`/`<select>`/`<textarea>`
  elements — no click-only divs — `triggerHaptic` on selection/save/quiz
  events (same existing utility, no new adapter needed, same as Package
  5's disclosure), visible border/color change on selection, `disabled`
  states during pending saves and until required fields are chosen.

## XP and progression

`pairing_draft_saved` (15 XP) uses idempotency key
`pairing-draft-first-save:<guest>` — awarded once per guest regardless of
how many pairing drafts they create afterward (verified: 2 distinct
drafts by the same guest produce exactly 1 XP transaction). Quiz XP
reuses the existing `seed_soil_quiz_correct` rule and idempotency pattern
unchanged from Package 4/5.

## Mentor guidance

Same pattern as Package 5 — reads `journey.mentor[0]` directly, shows a
real name when present, an honest "No mentor selected yet" message when
absent, verified by a dedicated test with mentor state cleared.

## Golden Box connection

The `vitola`/`ring_gauge`/`sensory_category` (strength/body) catalog rows
this screen teaches from are the exact rows already selectable in a live
Golden Box entry's blend picker (migration 077's `component_type` CHECK
already includes `vitola`, `ring_gauge`, `length`, `strength`, `body`).
Flavor-stage observations and pairing drafts are explicitly practice-only
and do not create or touch a `golden_box_entries` row — satisfying "do
not force a competition entry to complete a lesson." No direct pre-fill
link (e.g., "use this pairing rationale in your Golden Box entry") was
built — disclosed gap, same scope boundary Package 4/5 used for their own
screens.

## Known interaction gap, disclosed

The Pairing Builder's "Revise" capability is only partially built: the
backend genuinely supports updating an existing draft by id
(`savePairingDraft` accepts `payload.id`), but the current frontend
always creates a new draft on save rather than offering a "select a
saved draft to edit" affordance. A learner can build multiple drafts and
resume viewing them, but cannot yet revise one in place through the UI.
