# SmokeCraft Visual Image Registry

This is the single source of truth for every image used or referenced anywhere in the
SmokeCraft experience. It exists to stop the recurring failure pattern where an approved
reference mockup (a full UI screenshot) gets cropped and wired in as a *runtime* background,
or where a narrow crop gets stretched full-screen and distorts.

**Rule:** approved reference images (the numbered mockup PNGs) are visual specifications
only. They define layout, spacing, proportion, and hierarchy. They are never automatically
runtime backgrounds. A runtime image is banned if it contains baked UI text, baked cards,
baked buttons, screenshot-style layout, fake labels, or any element that duplicates the live
React UI.

Every entry below must be kept current. When a new image is added to `public/` or
`public/assets/smokecraft/`, add a row here before wiring it into a component.

---

## 1. Banned Reference Images (mockups — visual spec only, never runtime)

| File path | Reference-only / Runtime-safe | Screen/route | Clean photo-only? | Contains baked UI? | Approved usage | Banned usage | Crop/stretch risk notes |
|---|---|---|---|---|---|---|---|
| `public/PROFILE DISCOVER 11.png` | Reference-only | `/smokecraft` | No | Yes — crest, headline, CTA stack, Passport/Pairing cards all baked | Visual layout/proportion spec only, viewed by humans during planning | Any `<img src>`, CSS `url()`, or `background-image` reference anywhere in `src/` or shipped `dist/` | Any crop taken from this file must exclude the left-column text/CTA region and the right-column card region entirely — only clean ambient photo regions (if any) may be cropped out, and the resulting crop must be re-verified pixel-by-pixel before runtime use |
| `public/smokecraft Intake.png` | Reference-only | `/smokecraft/enroll` | No | Yes — full intake form mockup (labels, inputs, card borders, dock) | Visual layout/proportion spec only | Any runtime reference | `intake-ashtray-bg.jpg` and `intake-whiskey-bg.jpg` were cropped from this file's corners and have been visually verified clean (see Section 2) — but the source file itself must never be referenced directly |
| `public/GOLDEN BOX JOURNEY11.png` | Reference-only | Gold Box / Journey | No | Yes — sidebar nav, award/eligibility cards, badge progress, scorecard table | Visual layout/proportion spec only | Any runtime reference | High risk: this file was previously used as the crop source for `scorecard-bg-v2.jpg`, which is also reused on Leaderboard and Scorecard screens — every crop traced back to this file needs independent re-verification |
| `public/SEED & PAIRING.11.png` | Reference-only | Seed & Pairing | No | Yes — region cards, seed profile panel, soil selector grid, pairing score breakdown, blend signature table | Visual layout/proportion spec only | Any runtime reference | None currently wired directly from this file |
| `public/SHAPE SIZE BURN.11.png` | Reference-only | Format/Shape/Size/Burn | No | Yes — filter chips, cigar shape grid cards, CTA | Visual layout/proportion spec only | Any runtime reference | Was the crop source for `format-master-tip-v2.jpg` — needs re-verification (see Section 2) |
| `public/lounge demo ranking.11png.png` | Reference-only | Leaderboard / Lounge Demo Ranking | No | Yes — rank/XP card, recent activity card, claim golden box card | Visual layout/proportion spec only | Any runtime reference | None currently wired directly from this file |
| `public/DISCOVER YOUR PROFILE.png` | Reference-only | `/smokecraft` (alt/earlier reference) | No | Assume yes until proven otherwise | Visual layout/proportion spec only | Any runtime reference | Not currently used as a crop source anywhere in `src/` (confirmed via grep) — keep banned regardless |
| Any crop taken from the central UI/card/button area of the above mockups | Reference-only (the crop itself becomes runtime-banned) | All screens | No | Yes, by definition | None | Any runtime use | This is a standing rule, not a single file — any new crop must be visually inspected (Read tool or equivalent) before being wired in, and rejected if it contains any text, card edge, button, or layout chrome from the source mockup |

Additional mockups present in the repo, not yet explicitly named by the user but covered by
the same standing rule (full UI mockups, reference-only, never runtime):

| File path | Notes |
|---|---|
| `public/GOLDEN BOX JOURNEY.png` | Earlier/alt version of the Gold Box reference — same restrictions apply |
| `public/SEED PARING 2.png` | Earlier/alt version of the Seed & Pairing reference — was a crop source for `seed-soil-bg.jpg`, needs re-verification |
| `public/SHAPE SIZE BURN.1.png` | Earlier/alt version of the Format reference — same restrictions apply |
| `public/lounge demo ranking.png` | Earlier/alt version of the Leaderboard reference — same restrictions apply |

---

## 2. Runtime-Safe / Pending-Safe Images

| File path | Screen/route | Clean photo-only? | Contains baked UI? | Approved usage | Banned usage | Notes |
|---|---|---|---|---|---|---|
| `public/smokecraft.jpg` | `/smokecraft/enroll` (full-page bg) | Yes — verified | No | Full-page `background-size: cover` base layer | N/A | Verified clean lounge photo: cigar on ashtray, smoke, leather chairs, humidor cases. Currently the only screen using a full-resolution, non-cropped photo as a full-cover bg — this is the safe pattern other screens should match |
| `public/assets/smokecraft/cropped/intake-ashtray-bg.jpg` | `/smokecraft/enroll` (left scene accent) | Yes — verified | No | Small fixed accent panel, `height: min(46vh,420px); width: min(20vw,280px)`, top-anchored, masked | Full-page/full-cover background (it is only 207×401px — too narrow, would stretch/distort) | Cropped from `smokecraft Intake.png` top-left corner; verified clean of form/dock bleed |
| `public/assets/smokecraft/cropped/intake-whiskey-bg.jpg` | `/smokecraft/enroll` (right scene accent) | Yes — verified | No | Small fixed accent panel, same sizing as above, top-right anchored | Full-page/full-cover background (142×468px — too narrow) | Cropped from `smokecraft Intake.png` top-right corner; verified clean (whiskey glass + blurred leather chairs only) |
| `public/assets/smokecraft/cropped/golden-box-hero-v2.jpg` | Gold Box (`GoldenBoxHeroImage`, focal `<img>`) **and** Leaderboard (`RewardsAtmosphere`, full-page bg via `backgroundImage`) | **NEEDS RE-VERIFY** | Unknown — never independently re-confirmed clean this audit cycle | Pending: focal hero image on Gold Box only, until split | Using the same file as both a focal hero `<img>` AND a stretched full-page background is the exact double-duty pattern that caused the Enroll Round-1 bug — **flagged for splitting into two distinct assets** | Cropped from `lounge demo ranking.11png.png` per the existing verification script mapping. Must be re-verified pixel-clean and, if reused across two screens in two different aspect ratios, split into a focal version and a separate wide-ambient version |
| `public/assets/smokecraft/cropped/passport-cover.jpg` | Gold Box (header avatar) | Yes — verified elsewhere in repo | No | Small card/avatar image | Full-page background | Confirmed previously removed from `/smokecraft` front door specifically because it contains baked embossed text ("SMOKECRAFT 360" / "PASSPORT" / "360") — that removal stands; this entry covers its remaining legitimate small-card usage on Gold Box only |
| `public/assets/smokecraft/cropped/flavor-dna-bg.jpg` | Not yet wired to a confirmed screen in this audit | Unverified | Unknown | Pending — needs identity check before any use | None until verified | Listed in `cropped/` directory but not found referenced in any `src/` file during this audit; do not wire in until verified clean |
| `public/assets/smokecraft/cropped/discover-profile-hero.jpg` | `/smokecraft` (front-door full-bleed `<img>`) | **NEEDS RE-VERIFY** | Unknown — derived from `PROFILE DISCOVER 11.png`, a full UI mockup | Pending — current usage stands until re-verified | Continued use if re-verification finds baked headline/card/CTA bleed | Highest-priority re-verification target on the front-door screen; the existing in-code "bg-guard" console check only validates the *filename string*, not the actual pixel content |
| `public/assets/smokecraft/cropped/seed-soil-bg.jpg` | `/smokecraft/seed-soil` (ambient bg, opacity 0.22) | **NEEDS RE-VERIFY** | Unknown — derived from `SEED PARING 2.png` / `SEED & PAIRING.11.png` per verification script mapping | Pending — low-opacity (0.22) usage is lower-risk and may continue while re-verification is scheduled | Increasing opacity or using at full-cover/full-opacity before re-verification | Low priority due to low opacity already reducing visual impact of any bleed |
| `public/assets/smokecraft/cropped/scorecard-bg-v2.jpg` | Leaderboard (side accent panel, 32% width, opacity 0.24); Leaderboard (stretched `<img>`, `width:54%, height:125%`, `objectFit:cover`, line 604); Scorecard (ambient bg, opacity 0.10) | **HIGH RISK where stretched** | Unknown — derived from `GOLDEN BOX JOURNEY11.png` per verification script mapping | Low-opacity ambient usage (Scorecard 0.10, Leaderboard side panel 0.24) may continue | The `width:54%, height:125%` absolutely-positioned `<img>` usage on `Leaderboard.jsx:604` is flagged HIGH RISK — even with `objectFit:cover`, a non-square/mismatched aspect box risks visible distortion or unintended cropping of source content | **Priority fix target.** Must be re-sized to a container with a sane aspect ratio (not `height:125%`) or replaced with a properly-proportioned crop before this screen is marked visually approved |
| `public/assets/smokecraft/cropped/management-sync-bg.jpg` | `/smokecraft/format` (full-page `::before` background) | **NEEDS RE-VERIFY** | Unknown | Pending — filename does not match any named SmokeCraft mockup family, raising risk it is a leftover/generic asset | Continued use without identity confirmation | Must confirm this asset is actually SmokeCraft-themed (cigar/lounge content) and not an unrelated stock background before treating it as approved |
| `public/assets/smokecraft/cropped/format-master-tip-v2.jpg` | `/smokecraft/format` (tip card, 86px height) | **NEEDS RE-VERIFY** | Unknown — derived from `SHAPE SIZE BURN.11.png` per verification script mapping | Pending | Continued use without re-verification | Small fixed-height usage (86px) limits but does not eliminate risk |
| `public/assets/smokecraft/cropped/cut-toast-light-bg.jpg` | `/smokecraft/format` (CTA card, 102px height) | **NEEDS RE-VERIFY** | Unknown | Pending | Continued use without re-verification | Small fixed-height usage (102px) limits but does not eliminate risk |

### Other runtime images in `cropped/` not yet assigned to a screen audit
(present on disk, not flagged by name in this round — treat as NEEDS RE-VERIFY before any new usage)

`connections-bg.jpg`, `discover-profile-bg.jpg`, `final-third-bg.jpg`, `final-third-bg.png`,
`first-third-bg.png`, `format-master-tip.jpg` (superseded by `-v2`), `golden-box-hero.jpg`
(superseded by `-v2`), `humidor-match-bg.jpg` / `humidor-match-bg-v2.jpg`,
`passport-stamp-bg.jpg`, `request-purchase-bg.jpg`, `scorecard-bg.jpg` (superseded by `-v2`).

### Per-cigar product photos (Format screen)
`public/assets/smokecraft/cigars/{robusto,toro,churchill,corona,gordo,torpedo-figurado}.jpg` —
dedicated product shots, approved usage only, with an honest "Image pending" fallback if
missing (no cartoon substitute). See `src/data/smokecraftAssets.js`.

### Mentor portraits
`public/mentors/*.jpg` — dedicated portrait photos, approved usage only, same honest-fallback
rule applies.

---

## 3. Maintenance rule

Any time a new image is cropped, sourced, or wired into a SmokeCraft component:
1. Visually inspect it (Read tool or equivalent) for baked UI before wiring it in.
2. Add or update its row in Section 2 of this file in the same commit.
3. If it is derived from a banned reference image, note the source file and crop boundary.
4. Run `node server/scripts/verifySmokeCraftBannedImages.js` before committing.
