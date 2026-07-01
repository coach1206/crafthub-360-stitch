# SmokeCraft Full 40+ Screen Audit

Generated: 2026-06-30  
Auditor: Claude Code — automated grep + visual inspection of all src/ and public/ assets

---

## A. Repo State

- **Branch:** `claude/beautiful-thompson-r3mm5m`
- **HEAD:** `a61a1ab1` — test: add SmokeCraft browser screenshot proof
- **Status:** Clean (no uncommitted changes)
- **Latest SmokeCraft commits:**
  - `a61a1ab1` test: add SmokeCraft browser screenshot proof
  - `1993289a` test: add SmokeCraft image render diagnostic route
  - `b22d465d` fix: make SmokeCraft approved images visibly render on live pages
  - `81608b2a` fix: replace SmokeCraft live visuals with approved image assets
  - `810f431a` feat: add SmokeCraft approved image visual proof route

---

## B. Full SmokeCraft Screen / Page Inventory

| # | Page / Screen / Module | File | Route | Purpose | Has Approved Image? | Image Path | Visible `<img>`? | Browser Proof Exists? | Status |
|---:|---|---|---|---|---:|---|---:|---:|---|
| 1 | SmokeCraft Entry / Landing | src/pages/SmokeCraft.jsx | /smokecraft | Session entry gate / dashboard | NO | uses /assets/smokecraft/cropped/passport-cover.jpg (old) | partial | NO | PAGE EXISTS BUT OLD/DULL IMAGE |
| 2 | Enroll / Intake | src/pages/smokecraft/Enroll.jsx | /smokecraft/enroll | Guest intake, profile setup | NO | uses /assets/smokecraft/cropped/intake-* (old cropped) | partial | NO | PAGE EXISTS BUT OLD/DULL IMAGE |
| 3 | Identity / Profile Capture | src/pages/smokecraft/Identity.jsx | /smokecraft/identity | Guest identity / profile data | NO | uses generic img wrapper | partial | NO | PAGE EXISTS BUT IMAGE MISSING |
| 4 | Art (Brand story / intro) | src/pages/smokecraft/Art.jsx | /smokecraft/art | SmokeCraft brand art / intro | NO | uses /cigar-anatomy.png + /smokecraft-hero.png (root, old) | YES (old) | NO | PAGE EXISTS BUT OLD/DULL IMAGE |
| 5 | How It Works | src/pages/smokecraft/HowItWorks.jsx | /smokecraft/how-it-works | SmokeCraft 360 system explainer | NO | step images via old /assets/smokecraft/cropped/management-sync-bg.jpg etc | partial | NO | PAGE EXISTS BUT OLD/DULL IMAGE |
| 6 | Format / Cigar Format Selector | src/pages/smokecraft/Format.jsx | /smokecraft/format | Cigar format selection (vitola/shape) | NO | format.image from data (old /assets/smokecraft/cropped/format-master-tip-v2.jpg) | partial | NO | PAGE EXISTS BUT OLD/DULL IMAGE |
| 7 | Cigar Gauge Guide | src/pages/smokecraft/CigarGaugeGuide.jsx | /smokecraft/cigar-gauge-guide | Ring gauge / length guide | NO | uses /assets/smokecraft/cigars/... (old jpg) | background only | NO | PAGE EXISTS BUT OLD/DULL IMAGE |
| 8 | Wrapper & Strength | src/pages/smokecraft/WrapperStrength.jsx | /smokecraft/wrapper-strength | Wrapper types and strength levels | NO | uses /assets/smokecraft/cigars/robusto.jpg (old) | background only | NO | PAGE EXISTS BUT OLD/DULL IMAGE |
| 9 | Mentor Selection | src/pages/smokecraft/Mentor.jsx | /smokecraft/mentor-selection | Select tasting mentor | NO | uses old /assets/smokecraft/cropped/passport-cover.jpg | partial | NO | PAGE EXISTS BUT IMAGE MISSING (no smokecraft-mentor-selection.png wired) |
| 10 | Golden Box | src/pages/smokecraft/GoldenBox.jsx | /smokecraft/golden-box | Golden box rules / invitation | YES | /assets/smokecraft-reference/approved/smokecraft-gold-box-rules.png | YES | DIAGNOSTIC ONLY | ROUTE EXISTS BUT SESSION-LOCKED / NOT PROVEN |
| 11 | Golden Box Status | src/pages/smokecraft/GoldenBoxStatus.jsx | /smokecraft/golden-box/status | Golden box unlock progress | NO | no approved image | NO | NO | PAGE EXISTS BUT IMAGE MISSING |
| 12 | Origins | src/pages/smokecraft/Origins.jsx | /smokecraft/origins | Tobacco origins education | NO | old path (smokecraft/...) | NO | NO | PAGE EXISTS BUT IMAGE MISSING |
| 13 | Curation | src/pages/smokecraft/Curation.jsx | /smokecraft/curation | Cigar curation / selection | NO | old path (/assets/smokecraft/...) | NO | NO | PAGE EXISTS BUT OLD/DULL IMAGE |
| 14 | Leaves | src/pages/smokecraft/Leaves.jsx | /smokecraft/leaves | Tobacco leaf types | NO | old /assets/smokecraft/cropped/passport-cover.jpg | partial | NO | PAGE EXISTS BUT OLD/DULL IMAGE |
| 15 | Leaf Challenge | src/pages/smokecraft/LeafChallenge.jsx | /smokecraft/leaf-challenge | Leaf identification quiz | NO | old /assets/smokecraft/cropped/* (7 refs) | background only | NO | PAGE EXISTS BUT OLD/DULL IMAGE |
| 16 | Leaf Challenge Calculating | src/pages/smokecraft/LeafChallengeCalculating.jsx | /smokecraft/leaf-challenge-calculating | Calculating leaf score | NO | old bg url | background only | NO | PAGE EXISTS BUT IMAGE HIDDEN / BACKGROUND ONLY |
| 17 | Leaf Challenge Result | src/pages/smokecraft/LeafChallengeResult.jsx | /smokecraft/leaf-challenge-result | Leaf quiz score result | NO | uses img wrapper with data src | partial | NO | PAGE EXISTS BUT IMAGE MISSING |
| 18 | Cultivation | src/pages/smokecraft/Cultivation.jsx | /smokecraft/cultivation | Tobacco cultivation education | NO | img wrapper (no approved src) | partial | NO | PAGE EXISTS BUT IMAGE MISSING |
| 19 | Blend | src/pages/smokecraft/Blend.jsx | /smokecraft/blend | Cigar blend profile | NO | no approved image | partial | NO | PAGE EXISTS BUT IMAGE MISSING |
| 20 | Terroir | src/pages/smokecraft/Terroir.jsx | /smokecraft/terroir | Terroir / growing conditions | NO | no image at all | NO | NO | PAGE EXISTS BUT WORDING ONLY |
| 21 | Vitola | src/pages/smokecraft/Vitola.jsx | /smokecraft/vitola | Vitola / cigar shape education | NO | no image at all | NO | NO | PAGE EXISTS BUT WORDING ONLY |
| 22 | Seed & Soil Pairing | src/pages/smokecraft/SeedSoil.jsx | /smokecraft/seed-soil | Region + setting pairing | YES | /assets/smokecraft-reference/approved/smokecraft-seed-soil.png | YES (SmokeCraftVisualPanel) | DIAGNOSTIC ONLY | ROUTE EXISTS BUT SESSION-LOCKED / NOT PROVEN |
| 23 | Flavor DNA | src/pages/smokecraft/FlavorDNA.jsx | /smokecraft/flavor-dna | Sensory profile builder | YES | /assets/smokecraft-reference/approved/smokecraft-flavor-dna.png | YES | DIAGNOSTIC ONLY | ROUTE EXISTS BUT SESSION-LOCKED / NOT PROVEN |
| 24 | Available (Cigar Available) | src/pages/smokecraft/Available.jsx | /smokecraft/available | Available cigar listing | NO | old /assets/smokecraft/cropped/request-purchase-bg.jpg | background only | NO | PAGE EXISTS BUT OLD/DULL IMAGE |
| 25 | Humidor Match | src/pages/smokecraft/HumidorMatch.jsx | /smokecraft/humidor-match | Humidor recommendation matching | YES | /assets/smokecraft-reference/approved/smokecraft-humidor-match.png | YES | DIAGNOSTIC ONLY | ROUTE EXISTS BUT SESSION-LOCKED / NOT PROVEN |
| 26 | Request / Purchase | src/pages/smokecraft/RequestPurchase.jsx | /smokecraft/request-purchase | Request or purchase cigar | YES | /assets/smokecraft-reference/approved/smokecraft-request-purchase.png | YES | DIAGNOSTIC ONLY | ROUTE EXISTS BUT SESSION-LOCKED / NOT PROVEN |
| 27 | Cut, Toast & Light | src/pages/smokecraft/CutToastLight.jsx | /smokecraft/cut-toast-light | Preparation checklist | YES | /assets/smokecraft-reference/approved/smokecraft-cut-toast-light.png | YES | DIAGNOSTIC ONLY | ROUTE EXISTS BUT SESSION-LOCKED / NOT PROVEN |
| 28 | Pairing | src/pages/smokecraft/Pairing.jsx | /smokecraft/pairing | Drink / atmosphere pairing | NO | PairingImage wrapper, src=null for most | partial | NO | PAGE EXISTS BUT IMAGE MISSING |
| 29 | Pairing Lab | src/pages/smokecraft/PairingLab.jsx | /smokecraft/pairing-lab | Pairing lab interactive | NO | old /assets/smokecraft/cropped/pairing-lab-bg.jpg | background only | NO | PAGE EXISTS BUT OLD/DULL IMAGE |
| 30 | Pairing Mastery | src/pages/smokecraft/PairingMastery.jsx | /smokecraft/pairing-mastery | Pairing mastery module | NO | no image at all | NO | NO | PAGE EXISTS BUT WORDING ONLY |
| 31 | First Third | src/pages/smokecraft/FirstThird.jsx | /smokecraft/first-third | First third tasting | NO | old /assets/smokecraft/cropped/first-third-bg.png (bg only) | NO | NO | PAGE EXISTS BUT IMAGE HIDDEN / BACKGROUND ONLY |
| 32 | Second Third | src/pages/smokecraft/SecondThird.jsx | /smokecraft/second-third | Second third tasting | NO | /assets/smokecraft/source/flavor-dna.png (wrong image, old) | YES (wrong) | NO | PAGE EXISTS BUT OLD/DULL IMAGE |
| 33 | Flavor Memory | src/pages/smokecraft/FlavorMemory.jsx | /smokecraft/flavor-memory | Flavor memory log | NO | old /assets/smokecraft/cropped/flavor-memory-bg.jpg (bg only) | NO | NO | PAGE EXISTS BUT IMAGE HIDDEN / BACKGROUND ONLY |
| 34 | Final Third | src/pages/smokecraft/FinalThird.jsx | /smokecraft/final-third | Final third tasting | NO | /final-third-tasting.png (root, old path) | YES (old) | NO | PAGE EXISTS BUT OLD/DULL IMAGE |
| 35 | SmokeCraft Challenge | src/pages/smokecraft/SmokeCraftChallenge.jsx | /smokecraft/smokecraft-challenge | Tasting challenge module | NO | old /assets/smokecraft/cropped/smokecraft-challenge-bg.jpg (bg only) | NO | NO | PAGE EXISTS BUT IMAGE HIDDEN / BACKGROUND ONLY |
| 36 | Second Humidor Match | src/pages/smokecraft/SecondHumidorMatch.jsx | /smokecraft/second-humidor-match | Second visit humidor match | NO | old /assets/smokecraft/cropped/second-humidor-match-bg.jpg (bg only) | NO | NO | PAGE EXISTS BUT IMAGE HIDDEN / BACKGROUND ONLY |
| 37 | Mini Tasting Round | src/pages/smokecraft/MiniTastingRound.jsx | /smokecraft/mini-tasting | Mini tasting round | NO | old /assets/smokecraft/cropped/mini-tasting-bg.jpg (bg only) | NO | NO | PAGE EXISTS BUT IMAGE HIDDEN / BACKGROUND ONLY |
| 38 | Event Challenge | src/pages/smokecraft/EventChallenge.jsx | /smokecraft/event-challenge | Special event challenge | NO | old /assets/smokecraft/cropped/* (bg only) | NO | NO | PAGE EXISTS BUT IMAGE HIDDEN / BACKGROUND ONLY |
| 39 | Scorecard / Ranking | src/pages/smokecraft/Scorecard.jsx | /smokecraft/scorecard | Session scorecard and ranking | YES | /assets/smokecraft-reference/approved/smokecraft-scorecard-ranking.png | YES | DIAGNOSTIC ONLY | ROUTE EXISTS BUT SESSION-LOCKED / NOT PROVEN |
| 40 | Final Review | src/pages/smokecraft/FinalReview.jsx | /smokecraft/final-review | Final session review | NO | old /assets/smokecraft/cropped/final-review-bg.jpg (bg only) | NO | NO | PAGE EXISTS BUT IMAGE HIDDEN / BACKGROUND ONLY |
| 41 | Leaderboard | src/pages/smokecraft/Leaderboard.jsx | /smokecraft/leaderboard | Grand Lounge ranking | NO | old /assets/smokecraft/cropped/golden-box-hero-v2.jpg + scorecard-bg-v2.jpg | YES (old) | NO | PAGE EXISTS BUT OLD/DULL IMAGE |
| 42 | Passport Stamp / Certification | src/pages/smokecraft/PassportStamp.jsx | /smokecraft/passport-stamp | Passport stamp / session cert | YES | /assets/smokecraft-reference/approved/smokecraft-passport-stamp.png | YES | DIAGNOSTIC ONLY | ROUTE EXISTS BUT SESSION-LOCKED / NOT PROVEN |
| 43 | Connections | src/pages/smokecraft/Connections.jsx | /smokecraft/connections | 360 network connections | YES | /assets/smokecraft-reference/approved/smokecraft-passport-connection.png | YES | DIAGNOSTIC ONLY | ROUTE EXISTS BUT SESSION-LOCKED / NOT PROVEN |
| 44 | Management Sync | src/pages/smokecraft/ManagementSync.jsx | /smokecraft/management-sync | Venue staff handoff sync | YES | /assets/smokecraft-reference/approved/smokecraft-venue-management-sync.png | YES | DIAGNOSTIC ONLY | ROUTE EXISTS BUT SESSION-LOCKED / NOT PROVEN |
| 45 | Session Complete | src/pages/smokecraft/SessionComplete.jsx | /smokecraft/session-complete | End of session summary | NO | SessionCompleteImage wrapper (no approved src wired) | partial | NO | PAGE EXISTS BUT IMAGE MISSING |
| 46 | Scan | src/pages/smokecraft/Scan.jsx | /smokecraft/scan | QR scan or check-in | NO | no image | NO | NO | PAGE EXISTS BUT WORDING ONLY |
| 47 | Demo | src/pages/smokecraft/Demo.jsx | /smokecraft/demo | Demo mode | NO | no image | NO | NO | PAGE EXISTS BUT WORDING ONLY |
| 48 | Guest Pass | src/pages/smokecraft/GuestPass.jsx | /smokecraft/guest-pass | Guest pass / temp access | NO | no image | NO | NO | PAGE EXISTS BUT WORDING ONLY |
| 49 | Coming Soon | src/pages/smokecraft/ComingSoon.jsx | /smokecraft/* (fallback) | Placeholder | NO | no image | NO | NO | PAGE EXISTS BUT WORDING ONLY |
| 50 | Locked Visit | src/pages/smokecraft/LockedVisit.jsx | (guard component) | Session-lock gate screen | NO | no image | NO | NO | PAGE EXISTS BUT WORDING ONLY |
| 51 | SmokeCraft Visual Proof | src/pages/smokecraft/SmokeCraftVisualProof.jsx | /smokecraft-visual-proof | Dev proof sheet | YES | all 14 approved images | YES | YES (screenshot) | COMPLETE AND BROWSER PROVEN |
| 52 | SmokeCraft Image Diagnostic | src/pages/smokecraft/SmokeCraftImageDiagnostic.jsx | /smokecraft-image-diagnostic | Dev diagnostic | YES | all 10 approved images | YES | YES (screenshot, all 10 loaded) | COMPLETE AND BROWSER PROVEN |

---

## C. SmokeCraft Routes Found

| Route | Component | Screen / Phase | Session Locked? | Notes |
|---|---|---|---:|---|
| /smokecraft | SmokeCraft.jsx | Entry / Landing | NO | Not behind VisitLockGuard |
| /smokecraft/enroll | Enroll.jsx | Intake / Profile Setup | NO | Open |
| /smokecraft/identity | Identity.jsx | Profile Capture | NO | Open |
| /smokecraft/art | Art.jsx | Brand Art | NO | Open |
| /smokecraft/how-it-works | HowItWorks.jsx | System Explainer | NO | Open |
| /smokecraft/format | Format.jsx | Cigar Format | YES | VisitLockGuard stepId=format |
| /smokecraft/cigar-gauge-guide | CigarGaugeGuide.jsx | Gauge Guide | YES | VisitLockGuard stepId=format |
| /smokecraft/wrapper-strength | WrapperStrength.jsx | Wrapper/Strength | YES | VisitLockGuard stepId=wrapper-strength |
| /smokecraft/mentor-selection | Mentor.jsx | Mentor Selection | NO | Open |
| /smokecraft/golden-box | GoldenBox.jsx | Golden Box | NO | Not locked |
| /smokecraft/golden-box/status | GoldenBoxStatus.jsx | Golden Box Status | NO | Open |
| /smokecraft/origins | Origins.jsx | Origins | NO | Open |
| /smokecraft/curation | Curation.jsx | Curation | NO | Open |
| /smokecraft/leaves | Leaves.jsx | Leaves | NO | Open |
| /smokecraft/leaf-challenge | LeafChallenge.jsx | Leaf Challenge | NO | Open |
| /smokecraft/leaf-challenge-calculating | LeafChallengeCalculating.jsx | Leaf Calc | NO | Open |
| /smokecraft/leaf-challenge-result | LeafChallengeResult.jsx | Leaf Result | NO | Open |
| /smokecraft/cultivation | Cultivation.jsx | Cultivation | NO | Open |
| /smokecraft/blend | Blend.jsx | Blend | NO | Open |
| /smokecraft/terroir | Terroir.jsx | Terroir | NO | Open |
| /smokecraft/vitola | Vitola.jsx | Vitola | NO | Open |
| /smokecraft/seed-soil | SeedSoil.jsx | Seed & Soil | YES | VisitLockGuard stepId=seed-soil |
| /smokecraft/flavor-dna | FlavorDNA.jsx | Flavor DNA | NO | Open (not locked) |
| /smokecraft/available | Available.jsx | Cigar Available | NO | Open |
| /smokecraft/humidor-match | HumidorMatch.jsx | Humidor Match | YES | VisitLockGuard stepId=humidor-match |
| /smokecraft/request-purchase | RequestPurchase.jsx | Request/Purchase | YES | VisitLockGuard stepId=request-purchase |
| /smokecraft/cut-toast-light | CutToastLight.jsx | Cut Toast Light | YES | VisitLockGuard stepId=cut-toast-light (inferred) |
| /smokecraft/pairing | Pairing.jsx | Pairing | NO | Open |
| /smokecraft/pairing-lab | PairingLab.jsx | Pairing Lab | YES | VisitLockGuard stepId=pairing-lab |
| /smokecraft/pairing-mastery | PairingMastery.jsx | Pairing Mastery | NO | Open |
| /smokecraft/first-third | FirstThird.jsx | First Third | YES | VisitLockGuard stepId=first-third |
| /smokecraft/second-third | SecondThird.jsx | Second Third | YES | VisitLockGuard stepId=second-third |
| /smokecraft/flavor-memory | FlavorMemory.jsx | Flavor Memory | YES | VisitLockGuard stepId=flavor-memory |
| /smokecraft/final-third | FinalThird.jsx | Final Third | YES | VisitLockGuard stepId=final-third |
| /smokecraft/smokecraft-challenge | SmokeCraftChallenge.jsx | SC Challenge | YES | VisitLockGuard stepId=smokecraft-challenge |
| /smokecraft/second-humidor-match | SecondHumidorMatch.jsx | 2nd Humidor | YES | VisitLockGuard stepId=second-humidor-match |
| /smokecraft/mini-tasting | MiniTastingRound.jsx | Mini Tasting | YES | VisitLockGuard stepId=mini-tasting |
| /smokecraft/event-challenge | EventChallenge.jsx | Event Challenge | NO | Open |
| /smokecraft/scorecard | Scorecard.jsx | Scorecard | YES | VisitLockGuard stepId=scorecard |
| /smokecraft/final-review | FinalReview.jsx | Final Review | YES | VisitLockGuard stepId=final-review |
| /smokecraft/leaderboard | Leaderboard.jsx | Leaderboard | NO | Open |
| /smokecraft/passport-stamp | PassportStamp.jsx | Passport Stamp | YES | VisitLockGuard stepId=passport-stamp |
| /smokecraft/connections | Connections.jsx | Connections | YES | VisitLockGuard stepId=connections |
| /smokecraft/management-sync | ManagementSync.jsx | Management Sync | YES | VisitLockGuard stepId=management-sync |
| /smokecraft/session-complete | SessionComplete.jsx | Session Complete | YES | VisitLockGuard stepId=session-complete |
| /smokecraft/scan | Scan.jsx | Scan | NO | Open |
| /smokecraft/demo | Demo.jsx | Demo | NO | Open |
| /smokecraft/guest-pass | GuestPass.jsx | Guest Pass | NO | Open |
| /smokecraft-visual-proof | SmokeCraftVisualProof.jsx | Dev Proof | NO | No auth |
| /smokecraft-image-diagnostic | SmokeCraftImageDiagnostic.jsx | Dev Diagnostic | NO | No auth |

**Redirect aliases (not unique screens):** /smokecraft/intake → /enroll, /smokecraft/entry → /smokecraft, /smokecraft/profile → /identity, /smokecraft/education → /format, /smokecraft/mentors → /mentor-selection, /smokecraft/humidor → /humidor-match, /smokecraft/light → /cut-toast-light, /smokecraft/complete → /session-complete, /smokecraft/shape-size-burn → /format, /smokecraft/gold-box → /golden-box, /smokecraft/challenge → /leaf-challenge

---

## D. SmokeCraft Approved Images Found

| Image | Current Path | Used In Code? | Used By Page | Visible In Browser Proof? | Notes |
|---|---|---:|---|---:|---|
| smokecraft-entry-gate.png | /assets/smokecraft-reference/approved/ | NO | NOT WIRED | NO | Should be used by SmokeCraft entry / Enroll |
| smokecraft-profile-capture.png | /assets/smokecraft-reference/approved/ | NO | NOT WIRED | NO | Should be used by Identity / Enroll |
| smokecraft-seed-soil.png | /assets/smokecraft-reference/approved/ | YES | SeedSoil.jsx | YES (diagnostic) | Wired — SmokeCraftVisualPanel |
| smokecraft-mentor-selection.png | /assets/smokecraft-reference/approved/ | NO | NOT WIRED | NO | Should be used by Mentor.jsx |
| smokecraft-gold-box-rules.png | /assets/smokecraft-reference/approved/ | YES | GoldenBox.jsx | YES (diagnostic) | Wired — visible img |
| smokecraft-humidor-match.png | /assets/smokecraft-reference/approved/ | YES | HumidorMatch.jsx | YES (diagnostic) | Wired — visible img |
| smokecraft-cut-toast-light.png | /assets/smokecraft-reference/approved/ | YES | CutToastLight.jsx | YES (diagnostic) | Wired — visible img |
| smokecraft-request-purchase.png | /assets/smokecraft-reference/approved/ | YES | RequestPurchase.jsx | YES (diagnostic) | Wired — visible img |
| smokecraft-flavor-dna.png | /assets/smokecraft-reference/approved/ | YES | FlavorDNA.jsx | YES (diagnostic) | Wired — visible img hero |
| smokecraft-final-third.png | /assets/smokecraft-reference/approved/ | NO | NOT WIRED (proof sheet only) | NO | Should replace /final-third-tasting.png in FinalThird.jsx |
| smokecraft-scorecard-ranking.png | /assets/smokecraft-reference/approved/ | YES | Scorecard.jsx | YES (diagnostic) | Wired — visible img |
| smokecraft-passport-stamp.png | /assets/smokecraft-reference/approved/ | YES | PassportStamp.jsx | YES (diagnostic) | Wired — visible img |
| smokecraft-passport-connection.png | /assets/smokecraft-reference/approved/ | YES | Connections.jsx | YES (diagnostic) | Wired — visible img |
| smokecraft-venue-management-sync.png | /assets/smokecraft-reference/approved/ | YES | ManagementSync.jsx | YES (diagnostic) | Wired — visible img |

**Total approved images: 14**  
**Wired to pages with visible img: 10**  
**Not yet wired: 4** (entry-gate, profile-capture, mentor-selection, final-third)

---

## E. SmokeCraft Images Not Yet Used

| Image | Path | Likely Screen | Recommendation |
|---|---|---|---|
| smokecraft-entry-gate.png | /assets/smokecraft-reference/approved/ | SmokeCraft entry / landing (SmokeCraft.jsx or Enroll.jsx) | Wire as visible hero img on entry gate / enrollment screen |
| smokecraft-profile-capture.png | /assets/smokecraft-reference/approved/ | Identity.jsx or Enroll.jsx profile step | Wire as visible hero img on identity / profile capture screen |
| smokecraft-mentor-selection.png | /assets/smokecraft-reference/approved/ | Mentor.jsx | Wire as visible hero img replacing old passport-cover.jpg |
| smokecraft-final-third.png | /assets/smokecraft-reference/approved/ | FinalThird.jsx | Wire as visible img replacing /final-third-tasting.png (root) |

---

## F. Old / Dull / Flat / Rejected Images Still Present

| Image / File | Path | Where Used | Problem |
|---|---|---|---|
| passport-cover.jpg | /assets/smokecraft/cropped/ | SmokeCraft.jsx, Mentor.jsx, Leaves.jsx | Not SmokeCraft-specific; used as filler |
| golden-box-hero-v2.jpg | /assets/smokecraft/cropped/ | Leaderboard.jsx, GoldenBox.jsx CSS bg | Old non-approved cropped; not from reference folder |
| scorecard-bg-v2.jpg | /assets/smokecraft/cropped/ | Leaderboard.jsx | Old cropped; not from reference folder |
| first-third-bg.png | /assets/smokecraft/cropped/ | FirstThird.jsx (bg only) | Background only, opacity obscured |
| flavor-dna-bg.jpg | /assets/smokecraft/cropped/ | FlavorMemory.jsx CSS bg | Wrong file + hidden as bg |
| second-humidor-match-bg.jpg | /assets/smokecraft/cropped/ | SecondHumidorMatch.jsx bg | Old cropped, bg only |
| mini-tasting-bg.jpg | /assets/smokecraft/cropped/ | MiniTastingRound.jsx bg | Old cropped, bg only |
| final-review-bg.jpg | /assets/smokecraft/cropped/ | FinalReview.jsx bg | Old cropped, bg only |
| smokecraft-challenge-bg.jpg | /assets/smokecraft/cropped/ | SmokeCraftChallenge.jsx bg | Old cropped, bg only |
| pairing-lab-bg.jpg | /assets/smokecraft/cropped/ | PairingLab.jsx bg | Old cropped, bg only |
| /final-third-tasting.png | public/ root | FinalThird.jsx | Root path, old source copy |
| /assets/smokecraft/source/flavor-dna.png | source/ | SecondThird.jsx | Wrong image for Second Third; this is the Flavor DNA reference |
| /smokecraft.jpg | public/ root | SmokeCraft index bg | Unknown, not from reference folder |
| /cigar-anatomy.png | public/ root | Art.jsx | Generic anatomy diagram |
| /smokecraft-hero.png | public/ root | Art.jsx (2x) | Unverified source |
| request-purchase-bg.jpg | /assets/smokecraft/cropped/ | Available.jsx bg | Old cropped, bg only |
| management-sync-bg.jpg | /assets/smokecraft/cropped/ | HowItWorks.jsx bg | Wrong context |
| format-master-tip-v2.jpg | /assets/smokecraft/cropped/ | Format.jsx step images | Not from approved reference folder |
| connections-bg.jpg | /assets/smokecraft/cropped/ | various | Old, background-only |
| flavor-memory-bg.jpg | /assets/smokecraft/cropped/ | FlavorMemory.jsx | Old, bg only |

---

## G. Missing SmokeCraft Screens / Pages

The following expected screens have no page or are stubs/wording-only with no approved visual:

1. **Shape / Size / Burn** — redirects to /format; no dedicated approved reference image for this content area
2. **First Third** (tasting phase 1) — page exists but image is CSS background only (old file)
3. **Flavor Memory** — page exists but image hidden as 20% opacity background
4. **SmokeCraft Challenge** — page exists but background-only (old file)
5. **Second Humidor Match** — page exists but background-only (old file)
6. **Mini Tasting Round** — page exists but background-only (old file)
7. **Final Review** — page exists but background-only (old file)
8. **Session Complete** — page exists; SessionCompleteImage wrapper has no approved src wired
9. **Second Third** — page exists but uses wrong image (flavor-dna.png instead of a second-third reference)
10. **Pairing** — page exists; PairingImage src=null for most items
11. **Pairing Lab** — page exists but background-only (old file)
12. **Pairing Mastery** — page exists but wording-only (no image at all)
13. **Terroir** — page exists but wording-only
14. **Vitola** — page exists but wording-only
15. **Leaderboard** — page exists but uses old non-approved images

---

## H. Missing Approved Image-Rich Visuals

Screens that need an approved reference image not yet in the approved folder:

| Screen | Notes |
|---|---|
| First Third tasting | No dedicated approved reference — only a strip thumbnail exists |
| Second Third tasting | No dedicated approved reference — currently using wrong flavor-dna.png |
| Flavor Memory | No dedicated approved reference |
| SmokeCraft Challenge | No dedicated approved reference |
| Second Humidor Match | No dedicated approved reference |
| Mini Tasting Round | No dedicated approved reference |
| Final Review | No dedicated approved reference |
| Session Complete | No approved image wired |
| Pairing / Pairing Lab | No approved pairing reference image |
| Terroir | No approved reference |
| Vitola | No approved reference |
| Leaderboard | No approved reference in approved folder |
| SmokeCraft Landing (index) | No approved entry reference wired (smokecraft-entry-gate.png exists but not wired) |

---

## I. Pages That Are Still Mostly Wording

Pages where the user currently sees primarily text:

1. **Terroir** — no image at all
2. **Vitola** — no image at all
3. **Pairing Mastery** — no image at all
4. **Demo** — no image
5. **Scan** — no image
6. **Guest Pass** — no image
7. **Coming Soon** — no image
8. **Locked Visit** — no image (system guard screen)
9. **Origins** — old path reference, may render nothing
10. **PairingLab** — bg-only at 85% opacity overlay, content-heavy
11. **FlavorMemory** — bg at 20% opacity + heavy overlay = mostly wording
12. **FirstThird** — bg-only (old file), no visible img element
13. **SmokeCraftChallenge** — bg-only (old file)
14. **SecondHumidorMatch** — bg-only (old file)
15. **MiniTastingRound** — bg-only (old file)
16. **FinalReview** — bg-only (old file)

---

## J. Session Gate / Browser Proof Gaps

Pages that are correctly coded but NOT yet browser-proven with an active session:

| Page | Route | Reason Not Proven |
|---|---|---|
| Seed & Soil | /smokecraft/seed-soil | Requires completed prior steps in active session |
| Humidor Match | /smokecraft/humidor-match | Requires active session |
| Request / Purchase | /smokecraft/request-purchase | Requires active session |
| Cut, Toast & Light | /smokecraft/cut-toast-light | Requires active session |
| First Third | /smokecraft/first-third | Requires active session |
| Second Third | /smokecraft/second-third | Requires active session |
| Flavor Memory | /smokecraft/flavor-memory | Requires active session |
| Final Third | /smokecraft/final-third | Requires active session |
| SmokeCraft Challenge | /smokecraft/smokecraft-challenge | Requires active session |
| Second Humidor Match | /smokecraft/second-humidor-match | Requires active session |
| Mini Tasting Round | /smokecraft/mini-tasting | Requires active session |
| Scorecard | /smokecraft/scorecard | Requires active session |
| Final Review | /smokecraft/final-review | Requires active session |
| Passport Stamp | /smokecraft/passport-stamp | Requires active session |
| Connections | /smokecraft/connections | Requires active session |
| Management Sync | /smokecraft/management-sync | Requires active session |
| Session Complete | /smokecraft/session-complete | Requires active session |
| Format | /smokecraft/format | VisitLockGuard |
| Wrapper Strength | /smokecraft/wrapper-strength | VisitLockGuard |
| Pairing Lab | /smokecraft/pairing-lab | VisitLockGuard |

---

## K. Duplicate / Overlap Problems

| Issue | Detail |
|---|---|
| flavor-dna.png used for SecondThird | SecondThird.jsx uses /assets/smokecraft/source/flavor-dna.png — this is the Flavor DNA reference, not a Second Third reference |
| Shape/Size/Burn redirects to Format | /smokecraft/shape-size-burn redirects to /smokecraft/format; these are distinct educational concepts with no dedicated page |
| Passport routes duality | /smokecraft/passport-stamp (SmokeCraft session end) vs /passport/* routes (Passport hub) serve different purposes but may confuse users |
| Leaderboard accessible from 3 routes | /smokecraft/leaderboard, /leaderboard, /grand-lounge-ranking all hit the same component |
| Golden Box accessed via /golden-box and /gold-box | /gold-box redirects to /golden-box; minor duplication |
| Second Humidor Match vs Humidor Match | Two separate routes for humidor matching; unclear if Second is meant as a repeat visit or a different phase |

---

## L. Correct Next Build Order

**Do not execute now. Audit only.**

1. **Confirm full 40+ SmokeCraft screen list** — complete (this document)
2. **Map each screen to an approved visual or mark missing** — complete (sections D, E, H)
3. **Wire 4 existing unused approved images** to their correct pages:
   - smokecraft-entry-gate.png → SmokeCraft.jsx / Enroll.jsx
   - smokecraft-profile-capture.png → Identity.jsx
   - smokecraft-mentor-selection.png → Mentor.jsx
   - smokecraft-final-third.png → FinalThird.jsx
4. **Replace all old/cropped background images** on sessions-locked pages with approved images or SmokeCraftVisualPanel (First Third, Second Third, Flavor Memory, SmokeCraft Challenge, Second Humidor Match, Mini Tasting, Event Challenge, Final Review, Leaderboard, PairingLab, Available)
5. **Request approved reference images** for screens with no approved image:
   - Second Third tasting reference
   - First Third tasting reference (full size)
   - Flavor Memory reference
   - SmokeCraft Challenge reference
   - Mini Tasting reference
   - Final Review reference
   - Session Complete reference
   - Pairing / Pairing Lab reference
   - Terroir / Vitola / Pairing Mastery references
6. **Establish valid session proof** — inject a synthetic localStorage session for Playwright to bypass VisitLockGuard and screenshot all session-gated pages
7. **Take browser screenshots for every screen group** — all 50 routes
8. **Only then mark SmokeCraft complete**

---

## M. Final Truth

| Metric | Count |
|---|---|
| Total SmokeCraft pages / screens found | **52** (including proof/diagnostic routes) |
| Total unique live routes | **49** |
| Total approved images found | **14** (in /approved/ folder) |
| Approved images wired to pages with visible `<img>` | **10** |
| Approved images in folder but not wired | **4** |
| Pages with visible approved `<img>` elements | **10** (Scorecard, CutToastLight, HumidorMatch, RequestPurchase, SeedSoil, FlavorDNA, GoldenBox, PassportStamp, Connections, ManagementSync) |
| Pages with only old/cropped backgrounds | **~18** |
| Pages with no image at all (wording only) | **~12** |
| Routes browser-proven with screenshots | **2** (diagnostic + visual proof routes only) |
| Session-locked routes not browser-proven | **20+** |
| SmokeCraft complete? | **NO** |

**SmokeCraft is not complete.** 10 pages have visible approved images. 4 approved images exist but are not yet wired. Approximately 18 pages still use old/cropped/background-only images that do not meet the image-first visual requirement. Approximately 12 pages have no image at all. 20+ routes have never been browser-proven with an active session.
