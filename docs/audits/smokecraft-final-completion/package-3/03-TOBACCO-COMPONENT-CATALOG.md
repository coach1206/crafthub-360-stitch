# Tobacco Component Catalog — Package 3

34 real, substantive records seeded via
`server/db/seeds/seedSmokecraftEducationalContent.mjs` (idempotent,
`ON CONFLICT DO NOTHING`), all `source_status='curated_platform_content'`,
`review_status='reviewed'`, `visibility='published'`, `created_by='package-3-seed'`.

| Category | Count | Selectable in blend? | Examples |
|---|---|---|---|
| `plant_anatomy` | 7 | No (informational) | Flower, Seed Pod, Stem, Leaf Blade, Midrib, Veins, Roots |
| `leaf_priming` | 4 | Yes | Volado, Seco, Viso, Ligero |
| `wrapper` / `binder` / `filler` | 6 | Yes | Wrapper role, Binder role, Filler role, Long Filler, Short Filler |
| `curing_method` / `fermentation_method` / `aging_method` | 3 | Yes | Air Curing, Pilón Fermentation, Leaf Aging |
| `vitola` / `ring_gauge` / `length` / `construction_characteristic` | 9 | Vitola/ring gauge/length yes; draw/burn/combustion/balance no | Robusto, Corona, Toro, Ring Gauge, Length, Draw, Burn, Combustion, Balance |
| `sensory_category` | 6 | No (informational) | Strength, Body, Aroma, Finish, Complexity, Progression |

Every record has real text (verified live: test "every seeded record
has substantive (not one-line) educational text," 0 records under 20
characters in `why_it_matters`). No supplier/brand/medical claims — all
content describes general tobacco-growing/rolling/smoking concepts.

No fabricated supplier inventory — `is_curated_platform_content=true`
default, matching Package 1's original disclosure that this is
educational platform content, not stock availability.
