# Genetics / Origin / Soil / Terroir Catalog — Closure Pass

21 new real records seeded (idempotent), bringing the total catalog to
55 records. All `source_status='curated_platform_content'`,
`review_status='reviewed'`, `visibility='published'`.

## Seed genetics (5) — keys match `SeedSoil.jsx`'s existing hotspot vocabulary

Criollo, Corojo, Habano, Connecticut Broadleaf, Connecticut Shade. Each
includes why-it-matters, flavor/strength influence (always hedged —
"depends heavily on where and how it is grown," never a guarantee),
quality notes, and decision guidance. No flavor-guarantee claims, no
supplier/commercial claims.

## Origin / region (6)

Countries: Dominican Republic, Nicaragua, Honduras, Ecuador, United
States. Region: Connecticut River Valley. Cuba was **not** seeded this
pass — the mandate's own instruction ("add Cuba only when the
platform's educational and legal framing is appropriate") was treated
as a decision requiring explicit owner sign-off, not assumed. Every
record includes a variation disclaimer ("individual farms and
processing vary widely") rather than absolute claims.

## Soil (4) — keys match `SeedSoil.jsx`'s existing hotspot vocabulary

Sandy Loam, Clay Loam, Volcanic, Limestone. Each explains drainage/
water-retention/nutrient behavior and explicitly states why soil alone
does not determine final flavor (per the mandate's explicit instruction).

## Terroir factors (6)

Climate, Elevation, Rainfall, Sun Exposure, Drainage, Growing Season.
Each explains the factor, why it matters, and its interaction with
other factors — no deterministic promises ("sets the broad conditions;
day-to-day weather and farming practice still shape the individual
harvest").

## Relationships (Step 7)

Seed genetics link to leaf-use associations via their own `decision_guidance`
text (e.g. Connecticut Shade → "common reference point for mild
wrapper"). Full structured origin→region→soil→terroir relationship rows
(via `smokecraft_component_compatibility`) were not added this closure
pass beyond the 3 already seeded in the base Package 3 pass — disclosed
as a Package 4 follow-up rather than rushed with unverified claims.
