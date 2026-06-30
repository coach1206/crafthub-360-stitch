# POS360 / CraftHub 360 / E.A.T. Reference Image Mapping

## Official Required Images

| Required Screen | Official Path | Status |
|---|---|---|
| CraftHub 360 Landing Page | `public/assets/pos360-reference/crafthub-360-landing-page.png` | ✅ CONFIRMED + COPIED |
| Choose Destination | `public/assets/pos360-reference/choose-destination.png` | ✅ CONFIRMED + COPIED |
| Unlock POS360 | `public/assets/pos360-reference/unlock-pos-360.png` | ❌ MISSING |
| Manager Access Interface | `public/assets/pos360-reference/manager-access-interface.png` | ❌ MISSING |
| Module Deployment | `public/assets/pos360-reference/module-deployment.png` | ❌ MISSING |

## User-Confirmed Candidate Decisions

| Required Screen | Decision | Source Candidate | Official Path | Status |
|---|---|---|---|---|
| CraftHub 360 Landing Page | Confirmed | public/assets/smokecraft/CRAFTHUB 360. VENUE TABLE EXPERIENCE.png | public/assets/pos360-reference/crafthub-360-landing-page.png | COPIED |
| Choose Destination | Confirmed | public/novee-interface-page.png | public/assets/pos360-reference/choose-destination.png | COPIED |
| Unlock POS360 | Missing | No candidate found | public/assets/pos360-reference/unlock-pos-360.png | MISSING |
| Manager Access Interface | Missing | No candidate found | public/assets/pos360-reference/manager-access-interface.png | MISSING |
| Module Deployment | Missing | No candidate found | public/assets/pos360-reference/module-deployment.png | MISSING |

The visual proof route must not be created yet because only 2 of 5 required official images exist. The remaining 3 required images must be uploaded or confirmed before routing begins.

## Extra Approved References (copied to extras/)

| Visual | Official Extra Path | Source Path | Status |
|---|---|---|---|
| CraftHub landing (existing) | `public/assets/pos360-reference/extras/crafthub-landing-reference-01.png` | `public/crafthub-landing.png` | ✅ Copied |
| NOVEE OS Boot Interface | `public/assets/pos360-reference/extras/novee-os-boot-interface-reference-01.png` | `public/design-references/INTERFACE NO.png` | ✅ Copied |
| CraftHub 360 Explained diagram | `public/assets/pos360-reference/extras/crafthub-360-explained-reference-01.png` | `public/design-references/phase-7/CRAFT HUB EXPLAIND.png` | ✅ Copied |
| NOVEE OS Deck slide | `public/assets/pos360-reference/extras/novee-os-deck-reference-01.png` | `public/design-references/phase-7/DECK, NOVEE OS.png` | ✅ Copied |
| CraftHub 360 Storyboard | `public/assets/pos360-reference/extras/crafthub-360-storyboard-reference-01.png` | `public/design-references/phase-7/360 story board.png` | ✅ Copied |
| POS360 Table Management target | `public/assets/pos360-reference/extras/pos360-table-management-reference-01.png` | `public/reference-pos360-table-management-target.png` | ✅ Copied |
| SmokeCraft Request/Purchase Cigar | `public/assets/pos360-reference/extras/smokecraft-request-purchase-reference-01.png` | `attached_assets/request or purchange cigar.png` | ✅ Copied |
| SmokeCraft Cut/Toast/Light | `public/assets/pos360-reference/extras/smokecraft-cut-light-reference-01.png` | `attached_assets/CUT & LIGHT .png` | ✅ Copied |

## Missing

All 5 required official images are missing from `attached_assets/`:

1. `crafthub-360-landing-page.png` — The image named "Crafthub 360 landing page.png" was never uploaded to this repo. The closest existing asset is `crafthub-landing.png` (1672×941, already committed) but it is not labeled as the official "CraftHub 360 landing page" reference and was not uploaded as that specific file.

2. `choose-destination.png` — The image named "CHOOSE DESTINATION.png" was never uploaded. No image in `attached_assets/` shows a "Choose Destination" screen by name.

3. `unlock-pos-360.png` — The image named "unlock pos 360.png" was never uploaded. No image in `attached_assets/` shows an "Unlock POS360" screen by name.

4. `manager-access-interface.png` — The image named "MANGER ACCESS INERTFACE.png" (note: original had typos) was never uploaded. No image in `attached_assets/` shows a manager access interface by name.

5. `module-deployment.png` — The image named "module deployment.png" was never uploaded. No image in `attached_assets/` shows a module deployment screen by name.

## Conflicts

None — no slot had multiple usable candidates. All 5 required slots are simply empty.

## Unidentified Assets (May Contain Required Images)

Three UUID images exist in `attached_assets/` that cannot be identified from filename:

| File | Dimensions | Size | Notes |
|---|---|---|---|
| `0E1669EB-2BD9-41AE-9549-BA48F6D0EFBB_1781008090743.png` | 1024×1024 | 1941K | Unknown content — needs visual review |
| `0FA797BC-6150-4BEA-A16F-D8AEB447996E_1781008242814.png` | 1536×1024 | 2218K | Unknown content — needs visual review |
| `A3D73DE8-107B-47CD-836F-98ED50F9CD40_1781008090743.png` | 1536×1024 | 2240K | Unknown content — needs visual review |

These may contain some of the required screens. They cannot be assigned to an official slot without visual confirmation. Even if all 3 match, 2 required images remain missing.

## Do Not Use

- All `stitch_export/` screens — AI-generated mockups, not real reference uploads
- All `Screenshot_*.png` files in `attached_assets/` — app QA screenshots, not design references
- `image_1780843742992.png` — narrow 306×1600 strip, unidentified, not suitable as a full-screen reference
- `Crafthub_images__1780942613750.jpeg` — 1024×1024 small JPEG, likely branding/logo, not a screen reference

## Visual Proof Route Status

**NOT CREATED.** The visual proof route (`/pos360-visual-proof`) was not created because the required condition was not met: not all 5 official reference images are confirmed present in `public/assets/pos360-reference/`.

Per instruction: "If all five do not exist, stop. Do not create the proof route."
