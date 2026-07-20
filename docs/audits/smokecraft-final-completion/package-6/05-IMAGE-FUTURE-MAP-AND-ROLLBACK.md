# Package 6 — Future Image Map & Rollback Plan

## Future images (all `AWAITING_USER_ASSET`, none integrated)

Meet Your Cigar, Cigar Anatomy, Construction Inspection, Cold Aroma, Cold
Draw, Ring Gauge Guide, Vitola and Shape Guide, Strength vs. Body, Choose
Your Cut, Lighting Tutorial, Smoking Technique, Burn Problems and
Troubleshooting, Complete Flavor Wheel, Flavor Progression, Perfect
Pairing Builder, Personalized Pairing Recommendations, Mentor Commentary,
Golden Box sensory review, Golden Box pairing preparation.

`Vitola.jsx` was deliberately built card/chip-based (matching Package 5's
`WrapperStrength.jsx` approach) rather than image-hotspot-based, since no
approved images exist for any of this content yet. No `SC_ASSETS` key was
invented; `smokecraft_hotspots`/`smokecraft_content_media` remain
schema-ready with zero rows for this content, same as every prior
package's honest-empty-state pattern.

When the user uploads approved images: pull newest approved revision →
register in `SC_ASSETS` → map to real `golden_box_component_catalog`
rows via `smokecraft_content_media.component_id` (all 10 new Package 6
rows already have stable ids) → add `smokecraft_hotspots` rows only where
a real image supports distinct clickable regions → wire into `Vitola.jsx`
without redesigning the verified interaction logic.

## Rollback plan

One migration this pass (`082_package6_flavor_pairing_practice.sql`) —
additive only, nothing to roll back at the schema level for other tables.

To fully revert Package 6:
1. `git checkout -- src/pages/smokecraft/Vitola.jsx` — restores the
   original `ComingSoon` stub.
2. `git checkout -- server/db/seeds/seedSmokecraftEducationalContent.mjs`
   — removes the 10 new catalog rows and 3 new quiz questions from the
   seed script (a live database that already ran the updated seed would
   need `DELETE FROM golden_box_component_catalog WHERE component_type IN
   ('cigar_anatomy','burn_troubleshooting')` plus the 3 quiz rows by
   `question_key`).
3. Delete `server/services/goldenBox/flavorPairingService.js`,
   `server/controllers/flavorPairingController.js`,
   `server/routes/flavorPairingRoutes.js`,
   `src/services/smokecraft/flavorPairingApiClient.js`, the 2 lines
   mounting the route in `server/index.js`.
4. Delete `verify-golden-box-package-6.mjs`,
   `verify-golden-box-package-6-responsive.mjs`, and
   `docs/audits/smokecraft-final-completion/package-6/`.

The two test-harness fixes from the gate review
(`verify-golden-box-package-3.mjs`, `verify-golden-box-package-3-closure.mjs`,
`verify-golden-box-package-5-closure.mjs`) are test files only and are not
part of this rollback — they correct stale assertions and remain correct
regardless of whether Package 6's features are kept.
