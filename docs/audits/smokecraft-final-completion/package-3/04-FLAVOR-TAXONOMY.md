# Flavor Taxonomy — Package 3

`smokecraft_flavor_notes` — 16 top-level groups seeded (earth, wood,
spice, sweet, nut, cream, coffee, cocoa, leather, herbal, floral, fruit,
citrus, mineral, roasted, pepper), each with a real definition. Every
row's `common_learner_confusion` field includes a standing disclaimer:
"Flavor perception varies by individual — these notes describe common
consensus, not an objective scale," satisfying the mandate's "recognize
sensory variation, not objective certainty" instruction.

Schema supports child notes via self-referencing `parent_id` (not yet
populated — Package 3 seeded top-level groups only, per its own
foundational-content scope; child-note seeding is reasonable Package 4
follow-up work, not fabricated here).

Each record's schema also supports (populated where seed content
exists, left null honestly where it doesn't yet): common descriptors,
typical tobacco associations, strength perception, aroma relationship,
compatibility notes, pairing considerations, related session, Golden Box
use, media asset key, future GitHub asset path — ready for Package 4+ to
enrich without a schema change.
