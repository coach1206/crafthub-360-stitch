# Package 5 — Future Image and Hotspot Integration Map

Per the permanent image workflow rule: none of the following images exist
yet, none were fabricated, generated, or substituted. `WrapperStrength.jsx`
was deliberately built as a card-based, non-image-dependent layout this
pass (no `SC_ASSETS.wrapperStrength` key was invented) — every "future
image" below is currently taught through real text content alone.

Tracked for future placement (all currently `AWAITING_USER_ASSET` — no
`smokecraft_content_media`/`smokecraft_hotspots` rows exist yet for any of
them, schema-ready from migration 079):

- Leaf Primings (comparative diagram)
- Why Different Leaves Smoke Differently
- Leaf Comparison
- Wrapper Leaf Experience
- Binder Experience
- Filler Experience
- Long Filler vs. Short Filler
- Exploded Wrapper–Binder–Filler View
- Leaf Preparation (moistening, de-stemming, sorting)
- Filler Arrangement
- Bunching Methods (entubado/accordion/book/Lieberman)
- Binder Application
- Molding and Pressing
- Wrapper Application
- Cap Construction
- Foot Styles
- Cigar Rolling Process (full sequence)
- Quality Control and Draw Testing
- Curing Process
- Fermentation Process
- Tobacco Aging
- Leaf Sorting and Grading
- Final Resting and Box Aging

When the user uploads approved images to GitHub, the integration sequence
is: pull the newest approved revision → register in `SC_ASSETS` → map each
image to its real `golden_box_component_catalog` row via
`smokecraft_content_media.component_id` (all 12 new construction_step /
processing_method rows and the pre-existing leaf/wrapper/binder/filler
rows already have stable ids ready to reference) → add `smokecraft_hotspots`
rows only if a given image needs distinct clickable regions → wire into
`WrapperStrength.jsx`'s existing card layout (or convert to an image-
overlay layout matching `SeedSoil.jsx`'s pattern) without redesigning the
verified interaction logic already built and tested this pass.
