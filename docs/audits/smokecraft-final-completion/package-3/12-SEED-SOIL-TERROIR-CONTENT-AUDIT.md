# Seed / Origin / Soil / Terroir Content Audit

| Topic | Classification | Evidence |
|---|---|---|
| Seed genetics (Criollo/Corojo/Habano/Connecticut) | HARDCODED (labels only) | `SeedSoil.jsx`'s `SEED_ZONES` — 4 real hotspot labels/coordinates, zero descriptive content, no DB table |
| Soil types (Sandy Loam/Clay Loam/Volcanic/Limestone) | HARDCODED (labels only) | `SeedSoil.jsx`'s `SOIL_ZONES` — same pattern, 4 real labels, zero content |
| Countries/regions | MISSING | No structured country/region data anywhere; `Terroir.jsx`'s `SECTIONS` is static prose only, not per-region records |
| Climate/elevation/rainfall/sun exposure/drainage | MISSING | No structured terroir-factor data; only prose in `Terroir.jsx`/`KnowledgeDrop.jsx` |
| Mineral content | MISSING | Not represented anywhere |

## Governing decision

`SeedSoil.jsx`'s 4 seed labels and 4 soil labels are the **existing,
approved hotspot vocabulary** for the locked visual screen — this
closure pass seeds `golden_box_component_catalog` rows using these
**exact same keys** (`criollo`, `corojo`, `habano`, `connecticut-broadleaf`/
`connecticut-shade`, `sandy-loam`, `clay-loam`, `volcanic`, `limestone`)
so a future Package 4 SeedSoil.jsx rebuild can wire directly into this
content without a second, conflicting vocabulary. No duplicate labels
were invented.
