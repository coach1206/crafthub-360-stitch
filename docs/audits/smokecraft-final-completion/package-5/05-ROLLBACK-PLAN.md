# Package 5 — Rollback Plan

No migration was created this package (reused migration 080's generic
tables) — there is nothing to roll back at the schema level.

To fully revert Package 5's changes:

1. `git checkout -- src/pages/smokecraft/WrapperStrength.jsx` — restores
   the original dead pass-through redirect.
2. `git checkout -- server/db/seeds/seedSmokecraftEducationalContent.mjs`
   — removes the 12 new catalog rows and 3 new quiz questions from the
   seed script (does not retroactively delete already-seeded rows from a
   live database; a `DELETE FROM golden_box_component_catalog WHERE
   created_by = 'package-3-seed' AND component_type IN
   ('construction_step')` plus the 2 new `processing_method` keys would be
   needed for a live database that already ran the updated seed).
3. Delete `verify-golden-box-package-5-leaf-construction.mjs` and
   `docs/audits/smokecraft-final-completion/package-5/`.

Nothing else was touched — no other production file, no protected file,
no route registration change (the route already existed), no migration.
