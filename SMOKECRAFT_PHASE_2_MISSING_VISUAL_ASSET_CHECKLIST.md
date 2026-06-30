# SmokeCraft Phase 2 Missing Visual Asset Checklist

Generated: 2026-06-30  
Branch: claude/beautiful-thompson-r3mm5m  
HEAD: 911a4f2a  
Source: Full grep of src/pages/smokecraft + src/components/smokecraft + SMOKECRAFT_FULL_40_PLUS_SCREEN_AUDIT.md

---

## A. Purpose

This checklist defines every SmokeCraft screen that still needs an approved image-rich visual before the full 40+ screen SmokeCraft experience can be considered complete.

No placeholder visuals. No CSS reinterpretations. No Stitch source. Only approved image-rich assets.

---

## B. Already Approved and Wired

Pages currently wired to approved images with visible `<img>` elements:

| Screen / Page | File | Approved Image | Status |
|---|---|---|---|
| Enroll / Intake | src/pages/smokecraft/Enroll.jsx | smokecraft-entry-gate.png | WIRED — visible img, Phase 1 |
| Identity / Profile Capture | src/pages/smokecraft/Identity.jsx | smokecraft-profile-capture.png | WIRED — visible img, Phase 1 |
| Mentor Selection | src/pages/smokecraft/Mentor.jsx | smokecraft-mentor-selection.png | WIRED — visible img, Phase 1 |
| Final Third | src/pages/smokecraft/FinalThird.jsx | smokecraft-final-third.png | WIRED — visible img, Phase 1 |
| Seed & Soil | src/pages/smokecraft/SeedSoil.jsx | smokecraft-seed-soil.png | WIRED — SmokeCraftVisualPanel |
| Humidor Match | src/pages/smokecraft/HumidorMatch.jsx | smokecraft-humidor-match.png | WIRED — absolute img hero |
| Request / Purchase | src/pages/smokecraft/RequestPurchase.jsx | smokecraft-request-purchase.png | WIRED — absolute img hero |
| Cut, Toast & Light | src/pages/smokecraft/CutToastLight.jsx | smokecraft-cut-toast-light.png | WIRED — absolute img hero |
| Scorecard / Ranking | src/pages/smokecraft/Scorecard.jsx | smokecraft-scorecard-ranking.png | WIRED — absolute img hero |
| Passport Stamp | src/pages/smokecraft/PassportStamp.jsx | smokecraft-passport-stamp.png | WIRED — visible img |
| Connections | src/pages/smokecraft/Connections.jsx | smokecraft-passport-connection.png | WIRED — visible img |
| Management Sync | src/pages/smokecraft/ManagementSync.jsx | smokecraft-venue-management-sync.png | WIRED — visible img |
| Golden Box | src/pages/smokecraft/GoldenBox.jsx | smokecraft-gold-box-rules.png | WIRED — visible img |
| Flavor DNA | src/pages/smokecraft/FlavorDNA.jsx | smokecraft-flavor-dna.png | WIRED — visible img hero |

**Total wired: 14 pages**

---

## C. Missing Approved Visuals Needed

Every screen that still requires a new approved image uploaded to `public/assets/smokecraft-reference/approved/`:

| Priority | Screen / Page | Route | Current Problem | Required New Asset Filename | Visual Direction | Notes |
|---:|---|---|---|---|---|---|
| 1 | Second Third | /smokecraft/second-third | wrong image — currently uses flavor-dna.png (different screen's reference) | smokecraft-second-third.png | Mid-smoke tasting evaluation; dark lounge atmosphere; cigar held mid-smoke with sensory notes visible | Replace wrong image immediately once asset uploaded |
| 1 | First Third | /smokecraft/first-third | background-only (old /assets/smokecraft/cropped/first-third-bg.png) | smokecraft-first-third.png | Opening third tasting; cigar being cut/lit or first draw; atmospheric lounge shot | Old file is CSS bg at low opacity; no visible img element |
| 1 | Final Review | /smokecraft/final-review | background-only (old /assets/smokecraft/cropped/final-review-bg.jpg) | smokecraft-final-review.png | End-of-session review panel; scorecard or tasting notes being reviewed; warm amber lighting | Old file is CSS bg; completely hidden |
| 1 | Session Complete | /smokecraft/session-complete | missing — SessionCompleteImage wrapper src not wired | smokecraft-session-complete.png | Session completion ceremony; passport stamp or trophy; celebratory cigar lounge moment | SessionCompleteImage component renders nothing; needs approved src |
| 1 | Flavor Memory | /smokecraft/flavor-memory | background-only at 20% opacity (old /assets/smokecraft/cropped/flavor-memory-bg.jpg) | smokecraft-flavor-memory.png | Memory/recall phase; sensory flavor wheel or notes being logged; introspective atmosphere | Almost entirely wording — bg opacity makes image invisible |
| 1 | SmokeCraft Challenge | /smokecraft/smokecraft-challenge | background-only (old /assets/smokecraft/cropped/smokecraft-challenge-bg.jpg) | smokecraft-challenge.png | Challenge module; competitive tasting or blind identification; dramatic lighting | Hidden as CSS background |
| 1 | Second Humidor Match | /smokecraft/second-humidor-match | background-only (old /assets/smokecraft/cropped/second-humidor-match-bg.jpg) | smokecraft-second-humidor-match.png | Second visit humidor match; premium humidor cabinet open; curated selection visible | Hidden as CSS background |
| 1 | Mini Tasting Round | /smokecraft/mini-tasting | background-only (old /assets/smokecraft/cropped/mini-tasting-bg.jpg) | smokecraft-mini-tasting-round.png | Mini flight tasting; 2-3 cigars laid out with tasting notes; intimate lounge setting | Hidden as CSS background |
| 2 | Pairing | /smokecraft/pairing | missing — PairingImage src=null for most items | smokecraft-pairing.png | Cigar and drink pairing; whiskey or rum glass beside lit cigar; elegant table setting | PairingImage component renders nothing without approved src |
| 2 | Pairing Lab | /smokecraft/pairing-lab | background-only (old /assets/smokecraft/cropped/pairing-lab-bg.jpg) | smokecraft-pairing-lab.png | Pairing lab interactive; spread of pairing options; menu-style layout with cigars and drinks | Old file is CSS bg; image hidden under overlay |
| 2 | Pairing Mastery | /smokecraft/pairing-mastery | wording-only — no image at all | smokecraft-pairing-mastery.png | Mastery certificate or pairing achievement; gold seal or badge on lounge background | Zero visual presence |
| 2 | Terroir | /smokecraft/terroir | wording-only — no image at all | smokecraft-terroir.png | Tobacco terroir; aerial or ground-level tobacco field shot; region-specific landscape | Zero visual presence |
| 2 | Vitola | /smokecraft/vitola | wording-only — no image at all | smokecraft-vitola.png | Cigar vitola / shape guide; multiple cigar shapes laid out in size order on dark surface | Zero visual presence |
| 2 | Leaderboard | /smokecraft/leaderboard | old/dull — uses non-approved /assets/smokecraft/cropped/golden-box-hero-v2.jpg + scorecard-bg-v2.jpg | smokecraft-leaderboard.png | Grand lounge ranking board; elegant hall-of-fame style layout; gold typography on dark background | Old cropped images; not from approved folder |
| 2 | Event Challenge | /smokecraft/event-challenge | background-only (old /assets/smokecraft/cropped/*) | smokecraft-event-challenge.png | Special event challenge; event signage or podium; competitive tasting setup | Old CSS bg files; image not visible |
| 3 | Golden Box Status | /smokecraft/golden-box/status | missing — no approved image wired; GoldenBoxStatusImage wrapper src not wired | smokecraft-golden-box-status.png | Golden Box unlock progress; partially opened gold box or progress tracker; exclusive preview | Component renders nothing |
| 3 | SmokeCraft Landing / Index | /smokecraft | old/dull — uses /assets/smokecraft/cropped/passport-cover.jpg (small avatar) | smokecraft-landing.png | Entry gate hero; premium cigar lounge exterior or bar shot; dark dramatic welcome screen | Landing only shows old passport-cover.jpg as a small avatar |
| 3 | Art / Brand Story | /smokecraft/art | old/dull — uses /cigar-anatomy.png + /smokecraft-hero.png (root paths, unverified source) | smokecraft-art.png | Brand art / craftsmanship story; artisanal cigar making process or close-up leaf detail | Root path images, not from approved folder |
| 3 | Origins | /smokecraft/origins | old/unclear — uses old path references; may render nothing | smokecraft-origins.png | Tobacco origins education; map or globe overlay with tobacco-growing regions highlighted | Not from approved folder |
| 3 | How It Works | /smokecraft/how-it-works | old/dull — step.image data uses old /assets/smokecraft/cropped/management-sync-bg.jpg etc | smokecraft-how-it-works.png | SmokeCraft system explainer; step-by-step visual showing the session journey | Old cropped images; none from approved folder |
| 3 | Scan | /smokecraft/scan | wording-only — no image | smokecraft-scan.png | QR check-in scan; phone scanning a QR code in a lounge setting | Zero visual presence |
| 3 | Guest Pass | /smokecraft/guest-pass | wording-only — no image | smokecraft-guest-pass.png | Guest pass / temporary access; VIP pass card design against lounge background | Zero visual presence |

**Total missing approved assets: 22**

---

## D. Screens That Must Be Visually Reviewed

Screens where an image exists but may be mapped wrong, too small, or not strong enough:

| Screen / Page | File | Current Image | Problem | Action Required |
|---|---|---|---|---|
| Second Third | SecondThird.jsx | /assets/smokecraft/source/flavor-dna.png | WRONG IMAGE — Flavor DNA reference shown on Second Third page | Replace immediately once smokecraft-second-third.png is uploaded |
| Flavor DNA | FlavorDNA.jsx | smokecraft-flavor-dna.png | Correct image BUT also used as 8% opacity background texture — background layer redundant | Remove bg texture layer; keep only visible hero img |
| Connections | Connections.jsx | smokecraft-passport-connection.png | Correct image BUT also used as 10% opacity background — bg layer redundant | Background layer adds nothing; consider removing |
| Management Sync | ManagementSync.jsx | smokecraft-venue-management-sync.png | Correct image BUT also used as ~8% opacity background — bg layer redundant | Same: bg layer redundant |
| Mentor | Mentor.jsx | smokecraft-mentor-selection.png (hero) + /assets/smokecraft/cropped/passport-cover.jpg (avatar) | Approved hero wired in Phase 1 but old passport-cover.jpg still present as small avatar button | Avatar is minor; confirmed separate use; low risk |
| Leaves | Leaves.jsx | /assets/smokecraft/cropped/passport-cover.jpg | Old non-approved image; small img usage in page | Not a hero image; needs dedicated leaves/tobacco leaf approved reference |
| Leaderboard | Leaderboard.jsx | golden-box-hero-v2.jpg + scorecard-bg-v2.jpg | Both are old cropped images, neither from approved folder | Replace with smokecraft-leaderboard.png when uploaded |
| First Third | FirstThird.jsx | /assets/smokecraft/cropped/first-third-bg.png | CSS background only; no visible img element | Convert to visible img once smokecraft-first-third.png uploaded |
| Cigar Gauge Guide | CigarGaugeGuide.jsx | /assets/smokecraft/cigars/... (old jpgs) | Old non-approved; background style usage | Needs approved reference or dedicated gauge guide image |
| Wrapper Strength | WrapperStrength.jsx | /assets/smokecraft/cigars/robusto.jpg | Old non-approved; single cigar photo as background | Needs approved wrapper/strength reference |
| Format | Format.jsx | /assets/smokecraft/cropped/format-master-tip-v2.jpg | Old cropped; step images from data array | Needs approved format/vitola reference |

---

## E. Screens That Are Still Wording-Only

Pages where the user currently sees primarily text with no meaningful image:

| Screen / Page | Route | Notes |
|---|---|---|
| Terroir | /smokecraft/terroir | No image element of any kind |
| Vitola | /smokecraft/vitola | No image element of any kind |
| Pairing Mastery | /smokecraft/pairing-mastery | No image element of any kind |
| Scan | /smokecraft/scan | No image element of any kind |
| Guest Pass | /smokecraft/guest-pass | No image element of any kind |
| Coming Soon | /smokecraft/* (fallback) | Intentional placeholder; no image |
| Locked Visit | (guard component) | System guard screen; no image |
| Demo | /smokecraft/demo | No image element |
| Session Complete | /smokecraft/session-complete | SessionCompleteImage wrapper renders nothing — src not wired |
| Pairing | /smokecraft/pairing | PairingImage wrapper renders nothing — src=null for most items |
| Origins | /smokecraft/origins | Old path references may render nothing |
| Blend | /smokecraft/blend | img wrapper with data src; approved image not wired |
| Cultivation | /smokecraft/cultivation | img wrapper with data src; approved image not wired |
| Leaf Challenge Result | /smokecraft/leaf-challenge-result | img wrapper with data src; approved image not wired |

---

## F. Screens That Are Still Background-Only or Hidden Image

Pages where imagery exists in the source but is not clearly visible as a large image panel to the user:

| Screen / Page | Route | Image File | Hidden How |
|---|---|---|---|
| First Third | /smokecraft/first-third | /assets/smokecraft/cropped/first-third-bg.png | CSS background, opacity hidden under content overlay |
| Flavor Memory | /smokecraft/flavor-memory | /assets/smokecraft/cropped/flavor-memory-bg.jpg | CSS background at ~20% opacity; content overlay completely buries it |
| SmokeCraft Challenge | /smokecraft/smokecraft-challenge | /assets/smokecraft/cropped/smokecraft-challenge-bg.jpg | CSS background, not a visible img element |
| Second Humidor Match | /smokecraft/second-humidor-match | /assets/smokecraft/cropped/second-humidor-match-bg.jpg | CSS background, not a visible img element |
| Mini Tasting Round | /smokecraft/mini-tasting | /assets/smokecraft/cropped/mini-tasting-bg.jpg | CSS background, not a visible img element |
| Event Challenge | /smokecraft/event-challenge | /assets/smokecraft/cropped/* | CSS background files, not visible img elements |
| Final Review | /smokecraft/final-review | /assets/smokecraft/cropped/final-review-bg.jpg | CSS background, not a visible img element |
| Pairing Lab | /smokecraft/pairing-lab | /assets/smokecraft/cropped/pairing-lab-bg.jpg | CSS background at 85% opacity with heavy content overlay |
| Leaf Challenge Calculating | /smokecraft/leaf-challenge-calculating | old bg url | CSS background, not a visible img element |
| Available | /smokecraft/available | /assets/smokecraft/cropped/request-purchase-bg.jpg | CSS background, old non-approved file |
| How It Works | /smokecraft/how-it-works | step images via old /assets/smokecraft/cropped/management-sync-bg.jpg etc | Step img uses wrong context images |
| Golden Box | /smokecraft/golden-box | smokecraft-gold-box-rules.png | Also used as CSS background (approved file double-used) |
| Curation | /smokecraft/curation | /assets/smokecraft/... (old path) | Old path, may not render; no approved img |
| Leaves | /smokecraft/leaves | /assets/smokecraft/cropped/passport-cover.jpg | Small avatar img; not a content hero image |
| Leaf Challenge | /smokecraft/leaf-challenge | /assets/smokecraft/cropped/* (7 refs) | CSS background usage; old cropped files |
| SecondThird | /smokecraft/second-third | /assets/smokecraft/source/flavor-dna.png | Visible img but WRONG image (Flavor DNA used for Second Third) |

---

## G. Screens That Need Browser Proof With Active Session

Every route requiring an injected localStorage guest session to bypass VisitLockGuard before screenshots can be taken:

| Screen / Page | Route | Session Locked? | Has Approved Image? | Notes |
|---|---|---:|---:|---|
| Format | /smokecraft/format | YES | NO | VisitLockGuard stepId=format |
| Cigar Gauge Guide | /smokecraft/cigar-gauge-guide | YES | NO | VisitLockGuard stepId=format |
| Wrapper Strength | /smokecraft/wrapper-strength | YES | NO | VisitLockGuard stepId=wrapper-strength |
| Seed & Soil | /smokecraft/seed-soil | YES | YES | VisitLockGuard stepId=seed-soil |
| Humidor Match | /smokecraft/humidor-match | YES | YES | VisitLockGuard stepId=humidor-match |
| Request / Purchase | /smokecraft/request-purchase | YES | YES | VisitLockGuard stepId=request-purchase |
| Cut, Toast & Light | /smokecraft/cut-toast-light | YES | YES | VisitLockGuard stepId=cut-toast-light |
| First Third | /smokecraft/first-third | YES | NO (bg-only old) | VisitLockGuard stepId=first-third |
| Second Third | /smokecraft/second-third | YES | NO (wrong image) | VisitLockGuard stepId=second-third |
| Flavor Memory | /smokecraft/flavor-memory | YES | NO (bg-only old) | VisitLockGuard stepId=flavor-memory |
| Final Third | /smokecraft/final-third | YES | YES | VisitLockGuard stepId=final-third |
| SmokeCraft Challenge | /smokecraft/smokecraft-challenge | YES | NO (bg-only old) | VisitLockGuard stepId=smokecraft-challenge |
| Second Humidor Match | /smokecraft/second-humidor-match | YES | NO (bg-only old) | VisitLockGuard stepId=second-humidor-match |
| Mini Tasting Round | /smokecraft/mini-tasting | YES | NO (bg-only old) | VisitLockGuard stepId=mini-tasting |
| Scorecard | /smokecraft/scorecard | YES | YES | VisitLockGuard stepId=scorecard |
| Final Review | /smokecraft/final-review | YES | NO (bg-only old) | VisitLockGuard stepId=final-review |
| Passport Stamp | /smokecraft/passport-stamp | YES | YES | VisitLockGuard stepId=passport-stamp |
| Connections | /smokecraft/connections | YES | YES | VisitLockGuard stepId=connections |
| Management Sync | /smokecraft/management-sync | YES | YES | VisitLockGuard stepId=management-sync |
| Session Complete | /smokecraft/session-complete | YES | NO (missing src) | VisitLockGuard stepId=session-complete |
| Pairing Lab | /smokecraft/pairing-lab | YES | NO (bg-only old) | VisitLockGuard stepId=pairing-lab |

**Total session-locked routes needing active-session browser proof: 21**

---

## H. Upload Requirements

All new approved image assets must be uploaded to:

```
public/assets/smokecraft-reference/approved/
```

Rules:
- PNG or JPG only
- Safe lowercase hyphenated filenames
- No spaces
- No typo filenames
- No Stitch direct source
- No attached_assets direct app reference
- No generic dashboard interpretation
- Must be image-rich SmokeCraft cigar lounge style (dark, amber/gold tones, premium atmosphere)

**Exact filenames required (22 new assets):**

```
smokecraft-second-third.png
smokecraft-first-third.png
smokecraft-final-review.png
smokecraft-session-complete.png
smokecraft-flavor-memory.png
smokecraft-challenge.png
smokecraft-second-humidor-match.png
smokecraft-mini-tasting-round.png
smokecraft-pairing.png
smokecraft-pairing-lab.png
smokecraft-pairing-mastery.png
smokecraft-terroir.png
smokecraft-vitola.png
smokecraft-leaderboard.png
smokecraft-event-challenge.png
smokecraft-golden-box-status.png
smokecraft-landing.png
smokecraft-art.png
smokecraft-origins.png
smokecraft-how-it-works.png
smokecraft-scan.png
smokecraft-guest-pass.png
```

---

## I. Exact Next Build Order After Assets Are Uploaded

1. Confirm new assets exist in `public/assets/smokecraft-reference/approved/` with exact filenames above.
2. Normalize filenames if needed (lowercase, hyphenated, no spaces).
3. Wire only confirmed assets into live pages as visible `<img>` panels — same pattern as Phase 1.
4. Do not use `background-image` CSS as the sole image delivery method.
5. For pages with existing wrong CSS backgrounds: convert to `<img>` element with `position: absolute; inset: 0; width: 100%; height: 100%; objectFit: cover`.
6. For pages with wrong images (SecondThird): replace src immediately.
7. Run `npm run build` — confirm zero errors.
8. Inject synthetic localStorage SmokeCraft session into Playwright to bypass VisitLockGuard.
9. Screenshot all 21 session-locked routes with active session proof.
10. Commit and push.

---

## J. Final Truth

| Metric | Count |
|---|---|
| Total SmokeCraft screens inventoried | 52 |
| Total approved images available | 14 |
| Approved images wired to pages with visible `<img>` | 14 |
| New approved image assets still needed | **22** |
| Pages with zero visual presence (wording-only) | **14** |
| Pages with hidden/background-only imagery | **16** |
| Pages with wrong image wired | **1** (SecondThird) |
| Session-locked routes not yet browser-proven | **21** |
| SmokeCraft visually complete? | **NO** |

**22 new visual assets are still needed before SmokeCraft can be considered visually complete.**

SmokeCraft Phase 2 missing visual asset checklist is complete, and no additional live page changes were made.
