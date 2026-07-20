# Golden Box Content Integration — Package 3

## What changed in `EntryWorkspace.jsx`

- `ComponentPicker` replaced its placeholder "Select"/"Change" button
  with a real `<select>` dropdown populated from
  `GET /api/smokecraft/golden-box-content/components?selectableOnly=true`
  — one dropdown per required/optional component type, options are the
  real seeded catalog rows for that `component_type`.
- **No default selection**: every dropdown starts on "Choose
  \<label\>…" (empty value) — confirmed live (Package 3 test: "no
  default/auto-selected component").
- Categories with zero seeded rows (seed_genetics, origin, region, soil,
  terroir — Package 3's seed scope did not include these, consistent
  with the mandate's "seed only verified foundational content" limit)
  honestly render "Not yet configured — no catalog content exists for
  this category yet" instead of a dropdown.
- "Learn More" opens the existing, unmodified `EducationalDetailPanel`
  with **real** content (`fromCatalogRow`) when a selection exists, an
  honest "choose one above" hint when real options exist but none is
  selected, or the honest `not_yet_available` state when the category
  has no catalog content at all — three real states, never a fabricated
  one.
- Draft save now sends the real `component_id`/`component_key`/
  `display_name` to the backend instead of the placeholder string.

## Real bug found and fixed this integration

Postgres `BIGSERIAL` ids serialize as **strings** over JSON. The
dropdown's `onChange` handler originally coerced the selected value to
`Number(...)` and compared it against `row.id` (a string) — the
comparison never matched, so no selection ever actually registered
(dropdown silently stayed on "Choose…" even after picking a real
option). Fixed by comparing `String(r.id) === String(catalogId)`
throughout and removing the `Number()` coercion. Found via a live
browser test, not code review alone (Package 3 test #21 initially
failed, isolated, and fixed).

## Regression note

Package 2's own test suite (`verify-golden-box-package-2.mjs`) asserted
against the old placeholder-button UI; updated to select from the new
real dropdowns (and to accept the honest pre-selection educational-panel
state) since this was an **intentional UI evolution once real seeded
content existed**, not a regression — re-confirmed 22/22 passing after
the update.
