# Package 4 — Seed and Soil Live Educational Journey

Covers Steps 3–20 of the Package 4 mandate. Documented together (rather
than as 9 separate files) because the build was small and tightly coupled
enough that splitting it further would fragment, not clarify, the record —
disclosed here as a scope-format reduction, not a content reduction. All
substantive requirements below were verified working, not stubbed.

## Session-flow lock (Step 4)

No new session IDs were created and no route changed. `/smokecraft/seed-soil`
(`SeedSoil.jsx`) remains the single, locked screen for this territory —
the 27-session spine and `SUPPORTING_MODULES` in `src/constants/session.js`
are untouched. Germination, plant anatomy, terroir, and growing-region
content are delivered as expandable sections *within* this one screen, not
as new numbered sessions — consistent with the mandate's explicit "do not
alter the 27-session order" instruction.

## What is now database-backed (previously hardcoded/static)

- **Seed genetics zones** (Criollo, Corojo, Habano, Connecticut): each zone
  now carries a real `component_key` matching Package 3's seeded
  `seed_genetics` catalog rows. Selecting a zone still works exactly as
  before (local `journey.seedSoil` state); a new "i" button per zone opens
  the real educational detail via `EducationalDetailPanel` fed from
  `GET /api/smokecraft/golden-box-content/components/:id`, not a
  hardcoded string.
  - **Known content gap, disclosed**: "Connecticut" is mapped to the
    `connecticut-shade` catalog record. A separate `connecticut-broadleaf`
    record exists but has no distinct zone in the current approved image —
    reachable once a future image update adds a distinct hotspot; not
    fabricated as a merged or duplicated entry.
- **Soil zones** (Sandy Loam, Clay Loam, Volcanic, Limestone): same
  pattern, matching Package 3's seeded `soil` catalog rows exactly.
- **Terroir factors** (6 real records) and **plant anatomy** (7 real
  records): exposed via a new "Terroir, Anatomy & Quiz" drawer (button
  anchored inside the image overlay, opens a fixed bottom drawer above the
  nav bar) rather than as image hotspots — because the current approved
  Seed & Soil image has no distinct visual regions for these categories.
  This is the honest, disclosed state: **no growing-region-specific
  sub-screen or new hotspot coordinates were fabricated** for content the
  approved image doesn't visually support yet. When new approved images
  with anatomy/terroir hotspot regions are uploaded, `smokecraft_hotspots`
  (Package 3 schema, unused until now) is ready to receive real x/y/w/h
  data without further schema change.
- **Growing region / origin content**: reachable through the existing
  Package 3 content API (`component_type=country|region`) but not yet
  wired into a dedicated UI section this pass — disclosed gap, see
  "Known limitations" below.

## Notes (Step 13)

Previously local/session-storage only (`journey.seedSoil.notes`, lost on
a new device or cleared storage). Now also persisted server-side,
guest-scoped, via `smokecraft_seed_soil_notes` (migration 080) and
`POST/GET /api/smokecraft/seed-soil/notes`. The textarea still updates
`journey.seedSoil` locally for backward compatibility with any other
screen reading it, and separately debounce-saves (1.2s) to the backend.
Verified: typed note persists to the real table and rehydrates correctly
after a full page reload.

## Progress tracking (part of Step 15/16 plumbing)

`smokecraft_seed_soil_progress` records a `(guest_reference,
component_id)` row, upserted with `viewed_at`, every time a real
educational detail panel is opened for a catalog-backed zone. Verified via
direct DB query after a UI interaction.

## Knowledge checks (Step 14) and XP (Step 15)

Two new real quiz questions were seeded (added to
`seedSmokecraftEducationalContent.mjs`, idempotent), tied to real
components (`criollo`, `volcanic`), reusing the existing
`smokecraft_quiz_questions` table from Package 3 — no new quiz schema.
`smokecraft_seed_soil_quiz_attempts` (migration 080) records one attempt
per `(guest_reference, question_id)`; a correct first attempt awards 15 XP
through the existing `xpService.awardXp` (idempotency key
`seed-soil-quiz:<guest>:<questionId>` — a duplicate submit is a genuine
no-op, not a double award, matching the same idempotency pattern already
proven in Golden Box). Answers/explanations are only revealed after
submission, matching Package 3's answer-leakage prevention.

The mandate's "exploration complete" XP rule
(`seed_soil_exploration_complete`) was seeded into `xp_award_rules` this
pass but **is not yet wired to an award trigger** — disclosed gap, see
below.

## Mentor guidance connection (Step 12)

Not newly built this pass — `journey.mentor` was already globally
available and Golden Box's `MentorGuidancePanel` pattern exists, but
Seed and Soil's own screen does not yet surface a mentor-specific callout.
Disclosed gap; low-risk since the existing mentor system elsewhere in the
journey is unaffected.

## Golden Box connection (Step 16)

Package 3 already ensured the Golden Box blend builder's seed_genetics/
soil/terroir dropdowns read the same catalog rows this screen now teaches
from — confirmed still true (component keys match exactly, verified in
this package's regression run). No new direct link (e.g., "you selected
Criollo here, pre-fill it in your Golden Box entry") was built — disclosed
gap, a real product decision that would need explicit sign-off since it
touches Golden Box entry creation, a protected-adjacent area.

## Responsive & accessibility (Steps 19–20)

Verified via the new `verify-golden-box-package-4-seed-soil.mjs` suite:
no horizontal overflow at desktop (1440×900) and handheld (390×844); the
new Learn More drawer, its buttons, and the knowledge-check radio inputs
all have accessible labels; `EducationalDetailPanel` (reused, already
ARIA-dialog + focus-trapped from Package 2) is unchanged. Full accessibility
audit (screen-reader pass, contrast ratios) was **not independently
re-run this pass** — disclosed, matches the same scope boundary Package 2
originally used for its own accessibility claims.

## A genuine layout bug found and fixed during this build

`SmokeCraftImageBoundsOverlay` renders `position: fixed` across the full
viewport (minus the nav bar). Placing the new Terroir/Anatomy/Quiz section
as ordinary DOM content below it — my first draft — made it visually
present but **unclickable**, because the fixed overlay occupied the same
screen coordinates and intercepted pointer events. Fixed by moving the
toggle trigger inside the overlay's own pointer-events-auto child layer,
and rendering the expandable content as its own `position: fixed` drawer
(`zIndex: 50`, anchored above the nav bar) rather than as page-flow
content. Caught by a real Playwright timeout during testing, not
discovered by inspection — verified fixed by all 17 Seed & Soil suite
checks passing afterward.

## Known limitations (honest disclosure)

- Growing-region/origin content has a working API but no dedicated UI
  section in this screen yet.
- `seed_soil_exploration_complete` XP rule seeded but not yet triggered
  by any real "all zones explored" completion check.
- No mentor-specific guidance callout on this screen yet.
- Connecticut seed zone maps to `connecticut-shade` only; `connecticut-
  broadleaf` has no distinct hotspot in the current approved image.
- Full accessibility (screen reader, contrast) re-audit not independently
  run this pass.
- No new hotspot images integrated (per permanent directive) —
  `smokecraft_hotspots`/`smokecraft_content_media` remain schema-ready,
  zero rows, `USER_CREATING_IMAGE` implied by absence of records.
