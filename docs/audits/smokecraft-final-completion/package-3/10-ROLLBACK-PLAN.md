# Rollback Plan — Package 3

## Migration 079 rollback

```sql
DROP TABLE IF EXISTS smokecraft_content_audit_log;
DROP TABLE IF EXISTS smokecraft_quiz_questions;
DROP TABLE IF EXISTS smokecraft_component_compatibility;
DROP TABLE IF EXISTS smokecraft_flavor_notes;
DROP TABLE IF EXISTS smokecraft_hotspots;
DROP TABLE IF EXISTS smokecraft_content_media;
DROP TABLE IF EXISTS smokecraft_content_versions;

ALTER TABLE golden_box_component_catalog
  DROP COLUMN IF EXISTS slug, DROP COLUMN IF EXISTS category, DROP COLUMN IF EXISTS subcategory,
  DROP COLUMN IF EXISTS origin, DROP COLUMN IF EXISTS why_it_matters, DROP COLUMN IF EXISTS quality_impact,
  DROP COLUMN IF EXISTS flavor_impact, DROP COLUMN IF EXISTS strength_impact, DROP COLUMN IF EXISTS aroma_impact,
  DROP COLUMN IF EXISTS burn_impact, DROP COLUMN IF EXISTS construction_impact, DROP COLUMN IF EXISTS performance_impact,
  DROP COLUMN IF EXISTS decision_guidance, DROP COLUMN IF EXISTS compatibility_notes, DROP COLUMN IF EXISTS common_mistakes,
  DROP COLUMN IF EXISTS mentor_guidance, DROP COLUMN IF EXISTS related_session_id, DROP COLUMN IF EXISTS media_asset_key,
  DROP COLUMN IF EXISTS future_github_asset_path, DROP COLUMN IF EXISTS alt_text, DROP COLUMN IF EXISTS selectable_in_blend,
  DROP COLUMN IF EXISTS source_status, DROP COLUMN IF EXISTS review_status, DROP COLUMN IF EXISTS visibility,
  DROP COLUMN IF EXISTS version, DROP COLUMN IF EXISTS updated_at, DROP COLUMN IF EXISTS created_by;
```

Would remove the 34 seeded educational records along with the columns
(they live in the same table). If only the seed data needs reverting
(keeping the schema), instead run:
`DELETE FROM golden_box_component_catalog WHERE created_by = 'package-3-seed';`

## Application-code rollback

Delete `server/services/goldenBox/contentService.js`,
`server/controllers/goldenBoxContentController.js`,
`server/routes/goldenBoxContentRoutes.js`,
`server/db/seeds/seedSmokecraftEducationalContent.mjs`,
`verify-golden-box-package-3.mjs`. Revert the 2 additive lines in
`server/index.js`. Revert `EntryWorkspace.jsx`'s dropdown-based
`ComponentPicker` back to the Package 2 placeholder-button version (git
diff isolates this cleanly). Revert `educationalContentContract.js`'s
`fromCatalogRow` signature change.

## Blast radius if rolled back

Zero impact on any protected system. The one existing-table touch
(`golden_box_component_catalog`, additive columns only) does not affect
any Package 1/2 functionality that doesn't reference the new columns —
confirmed by Package 1's regression suite (36/36) still passing
unmodified against the extended table.
