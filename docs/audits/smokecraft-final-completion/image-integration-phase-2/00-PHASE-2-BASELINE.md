# Image Integration Phase 2 — Baseline

**Consolidation notice**: consolidates the mandate's Step 16 file list (00, 01) into this baseline +
`01-REMAINING-IMAGE-MANIFEST.md`; `04-SC-ASSETS-CHANGE-MAP.md` and `05-PROTECTED-SCREEN-CHANGE-MAP.md`
are folded into `03-UPDATED-GAP-AUDIT.md` and `06-TEST-EVIDENCE.md` respectively, explicitly disclosed.

## Pre-work verification (as instructed — no pull performed)

```
git branch --show-current   → recovery/smokecraft-codex-final
git rev-parse HEAD          → d09b63d78b0139bc31f0d38effbf98ac41b5e282
git rev-parse @{u}          → origin/recovery/smokecraft-codex-final
ahead/behind (HEAD...origin)→ 0  0   (local HEAD already matches remote exactly)
```
No pull was necessary or performed this pass — local HEAD already equals the origin tip from the
Phase 1 fast-forward.

- Uncommitted paths at start of Phase 2: 222 (per Phase 1's own final count).
- Uncommitted paths after Phase 2 changes: 234 (12 new: 10 moved/renamed leaf-construction images +
  1 renamed ring-gauge image + registry/component edits — see file list below).
- Untracked files before any Phase 2 edits: 570 files under `git ls-files --others --exclude-standard`
  (dominated by `node_modules`/build artifacts already gitignored-but-present in this container image,
  not new SmokeCraft content — verified no SmokeCraft asset paths among them beyond what Phase 1 already
  accounted for).
- Total image files under `public/assets/smokecraft*`: 344 (`.png`/`.jpg`/`.webp`).
- `SC_ASSETS` registry entries before this pass: 63 keys (55 original + 8 added in Phase 1).
- Golden Box images previously integrated (Phase 1): 8.
- Remaining unwired images at Phase 2 start (per Phase 1's own gap audit): 59.

## Phase 2 scope decision

Rather than attempting to wire all 59 remaining images shallowly, this pass did the same audit-first
work Phase 1 did for Golden Box: identify which of the 59 have a **real, currently-unimaged production
screen or component** they map to, versus which map to a screen that **already has approved, working,
tested art** (and therefore requires a human decision, not an automated swap — see Finding below).

**Key finding**: most Group A/C topics (Seed & Soil, Terroir, Flavor Memory, Meet Your Cigar, etc.)
are locked-sequence screens that already render one full-bleed `SC_ASSETS`-driven composite image via
protected, working, hotspot-backed logic (`SeedSoil.jsx` → `SC_ASSETS.seedSoil`, `FlavorMemory.jsx` →
`SC_ASSETS.flavorMemory`, `MeetYourCigar.jsx` → `SC_ASSETS.meetYourCigar`, `Scorecard.jsx` →
`SC_ASSETS.scorecard`, etc.). The newly uploaded images with matching subject names (`SOIL TYPES.png`,
`TERROIR & GROWING REGION MAP.png`, `Tobacco Seed Genetics.png`, `COMPLETE FLAVOR WHEEL.png`,
`CIGAR ANTOMY.png`, etc.) are candidate replacements or alternate compositions for those **already-live**
images, not empty slots. Swapping a working screen's approved production art for a same-subject upload
without human confirmation that it is an intended *replacement* (not a duplicate, an earlier draft, or
unrelated reference art) is exactly the kind of blind guess the mandate prohibits ("Do not guess" —
Step 9). These are classified `BLOCKED_BY_HUMAN_VISUAL_CHOICE` in the manifest, not integrated.

Two real, safe, currently-unimaged targets were found and integrated instead:
1. **`WrapperStrength.jsx`** (route `/smokecraft/wrapper-strength`, Group B) — a fully-built,
   database-backed rolling-process step list (`prepare-leaves` → `rest-and-box-age`, 10 real
   `step_key` values) with **no imagery at all**. 10 of the uploaded construction images map 1:1 to
   these exact step keys.
2. **`CigarGaugeGuide.jsx`** (route `/smokecraft/cigar-gauge-guide`, Group C) — a real sub-step screen
   using a generic, non-topic-specific stock background (`cigars/robusto.jpg`). `RING GAUGE GUIDE.png`
   is an exact subject match and had no prior `SC_ASSETS` key at all.

Both are additive, decorative-only integrations — no rolling-process state, quiz logic, database
service, or gauge-scale data was touched.
