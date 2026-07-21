# Task 4 — ChatGPT Image-Creation and Correction Queue

Locked visual requirements (apply to every item below): SmokeCraft 360 branding, landscape
tablet-touchscreen format, deep navy blue / charcoal-black / champagne gold palette, large readable
fonts (ages 45–75), realistic premium photography, no fixed mentor portrait baked into a shared
screen (dynamic mentor area top-right only), no default toolbar/card highlights, no prefilled
scores/progress/answers/slider values, no baked user data, no fake live states, clean blank areas
reserved for React-controlled/system-populated content.

| # | Screen title | Existing filename | Problem | Edit or replace | Required format | Required live blank areas | Dynamic mentor area | Content to include | Destination route | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Seed & Soil composite (if a replacement is wanted) | `SeedSoil.jsx`'s current live composite (no upload candidate proven correct) | The 4 uploaded candidates (`SOIL TYPES.png` etc.) are standalone single-topic images, not a matching multi-zone composite — cannot safely replace the current hotspot-integrated art | New composite, purpose-built to match the existing 8-zone hotspot coordinate layout (4 seed zones + 4 soil zones, left/right split, documented in `SeedSoil.jsx`'s `SEED_ZONES`/`SOIL_ZONES` arrays) | Landscape tablet, 1672×941 (current `NAT_W`/`NAT_H`) | 8 named zone regions at the exact existing percentage coordinates | N/A (no mentor on this screen) | Seed genetics (Criollo/Corojo/Habano/Connecticut) + soil types (Sandy Loam/Clay Loam/Volcanic/Limestone) in one composite | `/smokecraft/seed-soil` | Medium — only needed if the human decides the uploaded singles should replace the composite rather than stay as reference |
| 2 | Flavor Memory composite (if a replacement is wanted) | Current live composite; uploaded singles (`COMPLETE FLAVOR WHEEL.png` etc.) don't match the 8-zone layout | Same structural issue as #1 | New composite matching the existing 8-zone flavor layout (`FLAVOR_ZONES` array, 1448×1086) | Landscape tablet, 1448×1086 | 8 named flavor-zone regions | N/A | Earth/Wood/Spice/Cocoa/Coffee/Sweet/Nuts/Floral zones + space for the live radar chart + perception sliders panel | `/smokecraft/flavor-memory` | Medium — same condition as #1 |
| 3 | Marco Rodriguez mentor portrait | `MARCO RODRIGUEZ MENTOR.png` (fixed-composition upload) | Baked as a fixed standalone image rather than matching the existing per-mentor roster portrait format (`directSrc` mechanism) | Replace — needs to match the existing roster's individual-portrait crop/format exactly | Same aspect/crop as existing roster portraits (check `src/data/` mentor roster for the exact spec) | None (portrait only) | This IS the mentor asset | Realistic portrait matching the roster's established visual language | Mentor selection / roster data | High — blocks adding this mentor without creating a visual inconsistency |
| 4 | Virtual Rolling Challenge screen | `Virtual Rolling Challenge.png` (uploaded, unwired — no route exists) | No screen exists yet to receive it | New standalone screen art once the route is built | Landscape tablet | Challenge instruction area, live progress/readiness area, XP area | Top-right dynamic mentor slot | Rolling-process challenge framing | Route TBD — Package 7D or later | Low — blocked by missing route, not urgent until that feature is scoped |
| 5 | Filler Placement Challenge screen | `Filler Placement Challenge.png` (uploaded, unwired) | Same — no route | Same as #4 | Landscape tablet | Same | Same | Filler-placement framing | Route TBD | Low |
| 6 | Wrapper Application Challenge screen | `Wrapper Application Challenge.png` (uploaded, unwired) | Same | Same | Landscape tablet | Same | Same | Wrapper-application framing | Route TBD | Low |
| 7 | Skill Tree | none exists | Route doesn't exist at all | New | Landscape tablet | Full live progression-node area (dynamic, tree shape rendered by React, not baked into the image) | Top-right | Premium collectible skill-tree background/frame only — nodes are live components | Route TBD (Package 7C) | Low — out of scope this pass |
| 8 | Collections Center | none exists | Route doesn't exist | New | Landscape tablet | Full live grid area for collectible items | Top-right | Premium collectible-display frame/background | Route TBD (Package 7C) | Low |
| 9 | Challenge Hub | none exists | Route doesn't exist | New | Landscape tablet | Live daily/weekly challenge card area | Top-right | Hub framing, no baked challenge content | Route TBD (Package 7D) | Low |

**Not queued** (no image needed, per the gap matrix): Seed Germination, Cold Aroma/Cold Draw, Burn
Testing, Wrapper/Ring-Gauge/Vitola/Fermentation "games" (not real distinct mechanics), Mentor Challenge
Visuals (feature doesn't exist and isn't planned).

**Not queued pending a human decision first** (queuing artwork before the decision would risk
commissioning the wrong correction): items 2–5, 6–10 from the decision board
(`01-WIRING-REPORT-AND-DECISION-BOARD.md`) where "KEEP AS REFERENCE ONLY" or "USE CURRENT" may mean no
new artwork is needed at all.
