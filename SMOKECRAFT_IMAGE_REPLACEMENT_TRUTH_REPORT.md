# SmokeCraft Image Replacement Truth Report

## A. Goal

Replace the old dull/flat/dark-brown SmokeCraft visuals with the approved image-rich SmokeCraft visuals that already exist in the repo.

---

## B. SmokeCraft Pages Found

| Page/Component | Route (if known) | Current Image Usage | Problem |
|---|---|---|---|
| `Enroll.jsx` | `/smoke` entry | `smokecraft.jpg` (1024×1024 generic), `intake-ashtray-bg.jpg` / `intake-whiskey-bg.jpg` (tiny crops) | Small crops as CSS bg — not using large intake reference |
| `FirstThird.jsx` | `/smoke/first-third` | `first-third-bg.png` (521×119 strip) as opacity-20 bg | Tiny strip, barely visible; no full reference image |
| `SecondThird.jsx` | `/smoke/second-third` | `flavor-dna.png` (1448×1086) as `<img>` | ✅ Already uses full image correctly |
| `FinalThird.jsx` | `/smoke/final-third` | `final-third-tasting.png` (1672×941) as `<img>` | ✅ Already uses full image correctly |
| `Scorecard.jsx` | `/smoke/scorecard` | `scorecard-hero.jpg` (360×100 strip) as CSS background | Tiny strip — not the full scorecard reference |
| `CutToastLight.jsx` | `/smoke/cut` | `cut-toast-light-hero.jpg` (315×400 crop) | Small crop — not using full 1672×941 reference |
| `HumidorMatch.jsx` | `/smoke/humidor-match` | `humidor-match-hero.jpg` (270×591 crop) | Small crop — not the full Humidor Match 1.png |
| `RequestPurchase.jsx` | `/smoke/request` | `request-purchase-hero.jpg` (292×290 crop) | Small crop — not the full request reference |
| `Mentor.jsx` | `/smoke/mentor` | `passport-cover.jpg` (170×941 strip) | Tiny passport strip, not the mentor-selection reference |
| `SeedSoil.jsx` | `/smoke/seed-soil` | `seed-soil-bg.jpg` (320×540) + `robusto.jpg` | Generic cigar photo, not the SEED & PARING reference |
| `FlavorDNA.jsx` | `/smoke/flavor-dna` | `flavor-dna-bg.jpg` (348×220 strip) at 0.12 opacity | Nearly invisible tiny strip |
| `FinalReview.jsx` | `/smoke/final-review` | `final-review-bg.jpg` (1536×1024) | May be acceptable — needs visual review |
| `Art.jsx` | `/smoke/art` | `cigar-anatomy.png` + `smokecraft-hero.png` | Generic reference art, not the premium reference images |
| `Leaderboard.jsx` | `/smoke/leaderboard` | `golden-box-hero-v2.jpg` (876×540) + `scorecard-bg-v2.jpg` (405×450) | Cropped versions — not the full scorecard/golden-box reference |
| `GoldenBox.jsx` | `/smoke/golden-box` | `passport-cover.jpg` strip + `golden-box-hero-v2.jpg` crop | Small crops — not the full golden-box reference |
| `PassportStamp.jsx` | `/smoke/passport-stamp` | `passport-stamp-bg.jpg` (190×521) + `passport-stamp-hero.jpg` (480×941) | Small crops — not the full passport-certified reference |
| `Connections.jsx` | `/smoke/connections` | `connections-hero.jpg` (492×781) + `connections-bg.jpg` (422×541) | Crops — not the full passport-connection reference |
| `ManagementSync.jsx` | `/smoke/management-sync` | `management-sync-hero.jpg` (442×681) + `management-sync-bg.jpg` | Small crops — not the full venue-management-sync reference |

---

## C. Candidate Images Reviewed

| Candidate | Source Path | Dimensions | Visual Description | Decision |
|---|---|---|---|---|
| 01 | `public/assets/smokecraft/smokecraft Intake.png` | 941×1672 | Premium cigar intake/entry screen — portrait format, lounge atmosphere | APPROVED IMAGE-RICH SMOKECRAFT VISUAL |
| 02 | `public/assets/smokecraft/DISOVER YOUR CIGAR PROFILE.png` | 1672×941 | "Discover Your Cigar Profile" screen — rich imagery, gold accents | APPROVED IMAGE-RICH SMOKECRAFT VISUAL |
| 03 | `public/assets/smokecraft/SEED & PARING.png` | 1672×941 | Seed & Pairing screen — deep lounge imagery, premium layout | APPROVED IMAGE-RICH SMOKECRAFT VISUAL |
| 04 | `public/assets/smokecraft/mentor-selection.png` | 1672×941 | Mentor selection screen — mentor cards with imagery | APPROVED IMAGE-RICH SMOKECRAFT VISUAL |
| 05 | `public/assets/smokecraft/golden-box.png` | 1672×941 | Golden Box Journey screen — golden box rules visual | APPROVED IMAGE-RICH SMOKECRAFT VISUAL |
| 06 | `public/assets/smokecraft/Humidor Match 1.png` | 1672×941 | Humidor Match screen — immersive humidor imagery | APPROVED IMAGE-RICH SMOKECRAFT VISUAL |
| 07 | `public/assets/smokecraft/CUT  TOAST, & LIGHT.png` | 1672×941 | Cut / Toast / Light ceremony screen | APPROVED IMAGE-RICH SMOKECRAFT VISUAL |
| 08 | `public/assets/smokecraft/request or purchange cigar.png` | 1672×941 | Request / Purchase Cigar screen | APPROVED IMAGE-RICH SMOKECRAFT VISUAL |
| 09 | `public/assets/smokecraft/flavodr dna.png` | 1448×1086 | Flavor DNA screen — flavor mapping visual | APPROVED IMAGE-RICH SMOKECRAFT VISUAL |
| 10 | `public/assets/smokecraft/final-third-tasting.png` | 1672×941 | Final Third Tasting screen — tasting guide | APPROVED IMAGE-RICH SMOKECRAFT VISUAL |
| 11 | `public/assets/smokecraft/smokecraft-scorecard.png` | 1672×941 | Scorecard / Ranking screen | APPROVED IMAGE-RICH SMOKECRAFT VISUAL |
| 12 | `public/assets/smokecraft/passport-certified-final.png` | 1672×941 | Passport Stamp / Certified screen | APPROVED IMAGE-RICH SMOKECRAFT VISUAL |
| 13 | `public/assets/smokecraft/passport-connection-1.png` | 1672×941 | Passport Connection screen | APPROVED IMAGE-RICH SMOKECRAFT VISUAL |
| 14 | `public/assets/smokecraft/golden-box/venue-management-sync.png` | 1672×941 | Venue Management Sync screen | APPROVED IMAGE-RICH SMOKECRAFT VISUAL |
| R1 | `public/assets/smokecraft/EAT SYSTEM.png` | 1672×941 | E.A.T. system visual — not a SmokeCraft screen | NOT SMOKECRAFT / REJECT |
| R2 | `public/assets/smokecraft/POS 3 SYSTEM.png` | 941×1672 | POS3 portrait — not a SmokeCraft screen | NOT SMOKECRAFT / REJECT |
| R3 | `public/assets/smokecraft/pos 3.png` | 941×1672 | POS3 portrait variant — not a SmokeCraft screen | NOT SMOKECRAFT / REJECT |
| R4 | `public/assets/smokecraft/CRAFTHUB 360. VENUE TABLE EXPERIENCE.png` | 1672×941 | CraftHub 360 landing — already wired to POS360 proof route | NOT SMOKECRAFT / REJECT |
| R5 | `public/assets/smokecraft/crafthub-landing.png` | 1672×941 | CraftHub landing — not a SmokeCraft screen | NOT SMOKECRAFT / REJECT |
| R6 | `public/assets/smokecraft/novee-os-boot.png` | 1672×941 | NOVEE OS boot screen — not a SmokeCraft screen | NOT SMOKECRAFT / REJECT |
| R7 | `public/assets/smokecraft/eat-system.png` | 1672×941 | E.A.T. system duplicate | NOT SMOKECRAFT / REJECT |
| R8 | `public/assets/smokecraft/profound-1.png` | 1672×941 | NOVEE brand mark — not a SmokeCraft screen | NOT SMOKECRAFT / REJECT |

---

## D. Approved SmokeCraft Images

| Approved Visual | Source Path | Official Copied Path | Intended Screen/Phase |
|---|---|---|---|
| Entry Gate / Intake | `public/assets/smokecraft/smokecraft Intake.png` | `public/assets/smokecraft-reference/approved/smokecraft-entry-gate.png` | Enroll / Intake entry |
| Discover Your Profile | `public/assets/smokecraft/DISOVER YOUR CIGAR PROFILE.png` | `public/assets/smokecraft-reference/approved/smokecraft-profile-capture.png` | Profile / Identity screen |
| Seed & Pairing / Soil | `public/assets/smokecraft/SEED & PARING.png` | `public/assets/smokecraft-reference/approved/smokecraft-seed-soil.png` | SeedSoil.jsx |
| Mentor Selection | `public/assets/smokecraft/mentor-selection.png` | `public/assets/smokecraft-reference/approved/smokecraft-mentor-selection.png` | Mentor.jsx |
| Golden Box Rules | `public/assets/smokecraft/golden-box.png` | `public/assets/smokecraft-reference/approved/smokecraft-gold-box-rules.png` | GoldenBox.jsx |
| Humidor Match | `public/assets/smokecraft/Humidor Match 1.png` | `public/assets/smokecraft-reference/approved/smokecraft-humidor-match.png` | HumidorMatch.jsx |
| Cut / Toast / Light | `public/assets/smokecraft/CUT  TOAST, & LIGHT.png` | `public/assets/smokecraft-reference/approved/smokecraft-cut-toast-light.png` | CutToastLight.jsx |
| Request / Purchase Cigar | `public/assets/smokecraft/request or purchange cigar.png` | `public/assets/smokecraft-reference/approved/smokecraft-request-purchase.png` | RequestPurchase.jsx |
| Flavor DNA | `public/assets/smokecraft/flavodr dna.png` | `public/assets/smokecraft-reference/approved/smokecraft-flavor-dna.png` | FlavorDNA.jsx |
| Final Third Tasting | `public/assets/smokecraft/final-third-tasting.png` | `public/assets/smokecraft-reference/approved/smokecraft-final-third.png` | FinalThird.jsx |
| Scorecard / Ranking | `public/assets/smokecraft/smokecraft-scorecard.png` | `public/assets/smokecraft-reference/approved/smokecraft-scorecard-ranking.png` | Scorecard.jsx |
| Passport Stamp | `public/assets/smokecraft/passport-certified-final.png` | `public/assets/smokecraft-reference/approved/smokecraft-passport-stamp.png` | PassportStamp.jsx |
| Passport Connection | `public/assets/smokecraft/passport-connection-1.png` | `public/assets/smokecraft-reference/approved/smokecraft-passport-connection.png` | Connections.jsx |
| Venue Management Sync | `public/assets/smokecraft/golden-box/venue-management-sync.png` | `public/assets/smokecraft-reference/approved/smokecraft-venue-management-sync.png` | ManagementSync.jsx |

---

## E. Rejected SmokeCraft Images

| Rejected Visual | Source Path | Reason |
|---|---|---|
| EAT SYSTEM | `public/assets/smokecraft/EAT SYSTEM.png` | E.A.T. system visual — not a SmokeCraft screen |
| POS 3 SYSTEM | `public/assets/smokecraft/POS 3 SYSTEM.png` | POS3 portrait — not a SmokeCraft screen |
| pos 3 | `public/assets/smokecraft/pos 3.png` | POS3 portrait variant — not a SmokeCraft screen |
| CRAFTHUB 360 venue | `public/assets/smokecraft/CRAFTHUB 360. VENUE TABLE EXPERIENCE.png` | Already wired to POS360 proof route — not SmokeCraft |
| crafthub-landing | `public/assets/smokecraft/crafthub-landing.png` | CraftHub landing — not SmokeCraft |
| novee-os-boot | `public/assets/smokecraft/novee-os-boot.png` | NOVEE OS boot — not SmokeCraft |
| eat-system | `public/assets/smokecraft/eat-system.png` | E.A.T. system duplicate |
| profound-1 | `public/assets/smokecraft/profound-1.png` | NOVEE brand mark — not SmokeCraft |

---

## F. Missing Screens

SmokeCraft phases that do not yet have a confirmed approved full reference image:

| Phase | Screen | Status |
|---|---|---|
| Shape / Size / Burn | `smokecraft-shape-size-burn.png` | No approved full reference found — `cigar-shape-size-master.png` (1586×992) is a cigar anatomy diagram, may serve as placeholder only |
| First Third | `smokecraft-first-third.png` | Only a 521×119 strip (`first-third-bg.png`) exists — NO full reference image |
| Second Third | `smokecraft-second-third.png` | `flavor-dna.png` (1448×1086) is currently used — maps to Flavor DNA, not Second Third specifically |
| Final Review | `smokecraft-final-review.png` | `final-review-bg.jpg` (1536×1024) exists — may be acceptable, needs visual confirmation |

---

## G. Live App Replacement Plan

These SmokeCraft pages need their current tiny-crop or CSS-gradient images replaced with the approved full reference images from `public/assets/smokecraft-reference/approved/`. **No replacement made yet — visual proof must be approved first.**

| Page | Current (problem) | Replace With | Official Approved Path |
|---|---|---|---|
| `Scorecard.jsx` | `scorecard-hero.jpg` (360×100 strip as CSS bg) | Full scorecard reference | `/assets/smokecraft-reference/approved/smokecraft-scorecard-ranking.png` |
| `CutToastLight.jsx` | `cut-toast-light-hero.jpg` (315×400 crop) | Full cut/toast/light reference | `/assets/smokecraft-reference/approved/smokecraft-cut-toast-light.png` |
| `HumidorMatch.jsx` | `humidor-match-hero.jpg` (270×591 crop) | Full Humidor Match reference | `/assets/smokecraft-reference/approved/smokecraft-humidor-match.png` |
| `RequestPurchase.jsx` | `request-purchase-hero.jpg` (292×290 crop) | Full request/purchase reference | `/assets/smokecraft-reference/approved/smokecraft-request-purchase.png` |
| `Mentor.jsx` | `passport-cover.jpg` (170×941 strip) | Full mentor-selection reference | `/assets/smokecraft-reference/approved/smokecraft-mentor-selection.png` |
| `SeedSoil.jsx` | `seed-soil-bg.jpg` (320×540) | Full Seed & Pairing reference | `/assets/smokecraft-reference/approved/smokecraft-seed-soil.png` |
| `GoldenBox.jsx` | `golden-box-hero-v2.jpg` crop | Full golden-box reference | `/assets/smokecraft-reference/approved/smokecraft-gold-box-rules.png` |
| `PassportStamp.jsx` | Small passport crops | Full passport-certified reference | `/assets/smokecraft-reference/approved/smokecraft-passport-stamp.png` |
| `Connections.jsx` | Small connection crops | Full passport-connection reference | `/assets/smokecraft-reference/approved/smokecraft-passport-connection.png` |
| `ManagementSync.jsx` | Small management-sync crops | Full venue-management-sync reference | `/assets/smokecraft-reference/approved/smokecraft-venue-management-sync.png` |
| `Enroll.jsx` | `smokecraft.jpg` (1024×1024) + tiny crops | Full entry-gate reference | `/assets/smokecraft-reference/approved/smokecraft-entry-gate.png` |
| `FlavorDNA.jsx` | `flavor-dna-bg.jpg` (348×220 at 0.12 opacity) | Full Flavor DNA reference | `/assets/smokecraft-reference/approved/smokecraft-flavor-dna.png` |
