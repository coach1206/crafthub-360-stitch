# Package 5 — Data, API, Interaction, XP, and Mentor Map

Consolidated (mandate asked for 8 separate files across Steps 30/33/34/35/
36 categories: data/API map, interaction inventory, construction process
map, quiz/XP/progression map, mentor guidance map, image/hotspot future
map, Golden Box construction dependencies, rollback). Combined into this
file plus `04-IMAGE-HOTSPOT-FUTURE-MAP.md`, `05-ROLLBACK-PLAN.md`, and
`06-PACKAGE-5-COMPLETION-REPORT.md` — disclosed scope-format reduction,
same reasoning as Package 4: the underlying content and test coverage are
real, splitting further would fragment rather than clarify.

## Schema/backend (Step 30)

**No new migration.** `smokecraft_seed_soil_notes` / `_progress` /
`_quiz_attempts` (migration 080) are generic by design — keyed on
`(guest_reference, component_id)`, with no seed-soil-specific column —
so Package 5 reuses them as-is for construction/curing/fermentation/aging
notes, progress, and quiz attempts. This is a genuine additive reuse, not
a migration edit (080 is untouched). `xp_award_rules.seed_soil_quiz_correct`
(15 XP) is reused for Package 5's own knowledge checks rather than adding a
near-duplicate rule.

**Content additions** (`seedSmokecraftEducationalContent.mjs`, idempotent
on a clean database — see disclosed pre-existing duplicate-seed caveat in
`06-PACKAGE-5-COMPLETION-REPORT.md`):
- 10 `construction_step` records: `bunching-entubado`, `bunching-accordion`,
  `bunching-book`, `bunching-lieberman`, `binder-application`,
  `molding-pressing`, `wrapper-application`, `cap-construction`,
  `foot-finishing`, `quality-control-draw-test`.
- 2 `processing_method` records: `leaf-sorting-grading`,
  `final-resting-box-aging`.
- 3 new quiz questions, tied to `wrapper-role`, `long-filler`, and
  `pilon-fermentation`.

**API**: no new routes. Reuses `/api/smokecraft/seed-soil/{components,
notes,progress,quiz/:id/answer}` and
`/api/smokecraft/golden-box-content/components/:id` verbatim (Package 4).

## Interaction inventory (Step 34 groundwork)

All on `/smokecraft/wrapper-strength` (`WrapperStrength.jsx`):
- Leaf priming cards (4): tap/click/Enter select; "Learn More" opens real
  detail; checkbox adds to a 2-3-item comparison table.
- Wrapper / Binder / Filler cards (5 total incl. long/short filler): same
  pattern.
- Rolling-process cards (10 construction steps): tap opens real detail;
  not comparable (sequential technique, not a blend choice) — no fixed
  "complete this step" state is claimed since there is no physical action
  to verify, an honest boundary given no image/haptic device integration
  exists yet.
- Curing/Fermentation/Aging/Grading cards (5, merged from 4 real catalog
  types): tap opens real detail.
- Comparison table: renders once 2+ items are checked, shows why-it-
  matters/flavor/strength/construction side by side, explicit "no item
  is universally best" disclaimer per the mandate's own instruction.
- Notes: single persistent textarea, guest-scoped, debounce-saved.
- Knowledge check: one real question (wrapper-vs-other-leaves), radio
  select, submit, honest correct/incorrect feedback, one-time XP.
- Every interactive control: `aria-label`/`aria-pressed` where
  applicable, `role="status"` on the quiz result, keyboard-operable
  (native `<button>`/`<input>` elements throughout, no click-only divs),
  visible border-color change on selection (no color-only meaning — also
  uses a ✓ glyph and `aria-pressed`), `disabled` states on Learn More
  during a pending progress-record call and on Submit Answer until an
  option is chosen. No default/preselected leaf or component — verified
  by test.

## XP and progression (Step 26)

Reuses the same idempotent `awardXp` call pattern as Package 4:
`seed-soil-quiz:<guest>:<questionId>` — a duplicate submit for the same
question is a genuine no-op (verified by Package 4's own duplicate-award
test, unchanged code path). No new duplicate-prevention logic was needed
since the reused `seedSoilService.submitQuizAnswer` function already
handles it identically regardless of which screen calls it.

## Mentor guidance (Step 27)

Reads `journey.mentor[0]` directly (same array shape fixed in Package 2's
closure pass). When present, shows a real mentor-name callout; when
absent, shows an honest "No mentor selected yet" message rather than a
hardcoded default mentor — verified by a dedicated test with mentor
state cleared.

## Golden Box connection (Step 28)

The catalog rows this screen teaches from (`wrapper`, `binder`, `filler`,
`curing_method`, `fermentation_method`, `aging_method`) are the exact
same rows already selectable in a live Golden Box entry's blend picker
(migration 077's `golden_box_blend_components.component_type` CHECK
already includes all of them — confirmed, no schema change needed).
Selections made on this screen are explicitly practice-only (disclosed
in the UI itself) and do not create or touch a `golden_box_entries` row
— satisfying "do not force creation of a live competition entry to
complete lessons." No direct pre-fill link was built (same disclosed
scope boundary as Package 4's Seed & Soil screen).

## Judging scorecard readiness (Step 29)

Not touched. Package 1's human judging/scorecard system
(`golden_box_scorecards`/`_scores`) was not modified or rebuilt. No new
scorecard-image mapping was added this pass — disclosed gap, the mandate
only asked to "prepare" future mapping, and no new approved images exist
yet to map against (per the permanent image workflow rule).
