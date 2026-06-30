# SmokeCraft Live Image Replacement Map

## A. Replacement Rule

Only replace visual image references with approved official assets from:

`/assets/smokecraft-reference/approved/`

Do not change logic, routing, auth, scoring, state, API calls, or phase behavior.

---

## B. Live Page Replacements

| Live Page / Component | Current Image / Visual | Approved Replacement | Replace Now? | Notes |
|---|---|---|---|---|
| `Scorecard.jsx` | `cropped/scorecard-hero.jpg` (360×100 strip as CSS bg) | `smokecraft-scorecard-ranking.png` (1672×941) | ✅ YES | Hero banner panel |
| `CutToastLight.jsx` | `cropped/cut-toast-light-hero.jpg` (315×400 crop) | `smokecraft-cut-toast-light.png` (1672×941) | ✅ YES | Hero banner panel |
| `HumidorMatch.jsx` | `cropped/humidor-match-hero.jpg` (270×591 crop) | `smokecraft-humidor-match.png` (1672×941) | ✅ YES | Hero banner panel |
| `RequestPurchase.jsx` | `cropped/request-purchase-hero.jpg` (292×290 crop) | `smokecraft-request-purchase.png` (1672×941) | ✅ YES | Hero banner panel |
| `SeedSoil.jsx` | `cropped/seed-soil-bg.jpg` (320×540 tiny) | `smokecraft-seed-soil.png` (1672×941) | ✅ YES | Full-page background image |
| `FlavorDNA.jsx` | `cropped/flavor-dna-bg.jpg` (348×220 at 0.12 opacity) | `smokecraft-flavor-dna.png` (1448×1086) | ✅ YES | Background texture overlay |
| `Connections.jsx` bg | `cropped/connections-bg.jpg` (422×541 at opacity-10) | `smokecraft-passport-connection.png` (1672×941) | ✅ YES | Background overlay |
| `Connections.jsx` hero | `cropped/connections-hero.jpg` (492×781) as `<img>` | `smokecraft-passport-connection.png` (1672×941) | ✅ YES | Hero image element |
| `ManagementSync.jsx` bg | `cropped/management-sync-bg.jpg` (422×441 at opacity-8) | `smokecraft-venue-management-sync.png` (1672×941) | ✅ YES | Background overlay |
| `ManagementSync.jsx` hero | `cropped/management-sync-hero.jpg` (442×681) as `<img>` | `smokecraft-venue-management-sync.png` (1672×941) | ✅ YES | Hero image element |
| `GoldenBox.jsx` | `cropped/golden-box-hero-v2.jpg` (876×540) in CSS | `smokecraft-gold-box-rules.png` (1672×941) | ✅ YES | CSS background in golden-box-bg class |
| `PassportStamp.jsx` bg | `cropped/passport-stamp-bg.jpg` (190×521) as backdrop | `smokecraft-passport-stamp.png` (1672×941) | ✅ YES | Cinematic backdrop |
| `PassportStamp.jsx` hero | `cropped/passport-stamp-hero.jpg` (480×941) as `<img>` | `smokecraft-passport-stamp.png` (1672×941) | ✅ YES | Hero image element |

---

## C. Skipped Items

| Page / Component | Reason Skipped |
|---|---|
| `Mentor.jsx` nav avatar | `passport-cover.jpg` used as 36px circular nav button avatar — not a hero visual, no approved avatar-sized replacement |
| `GoldenBox.jsx` nav avatar | `passport-cover.jpg` used as 36px circular nav button avatar — same as above |
| `Leaderboard.jsx` | Uses `golden-box-hero-v2.jpg` + `scorecard-bg-v2.jpg` as decorative blurred overlays — low priority, not the primary visual issue |
| `FinalThird.jsx` | Already uses `final-third-tasting.png` (1672×941) as `<img>` correctly |
| `SecondThird.jsx` | Already uses `flavor-dna.png` (1448×1086) as `<img>` correctly |
| `SessionComplete.jsx` | Uses `final-third-bg.jpg` as 10% opacity backdrop — low visual impact |
| `EventChallenge.jsx` | Uses `golden-box-hero.jpg` as 10% opacity backdrop — low visual impact |
| `FinalReview.jsx` | Uses `final-review-bg.jpg` (1536×1024) — see Section D |
| `Art.jsx` | Uses `cigar-anatomy.png` + `smokecraft-hero.png` — these are educational/reference art, not replaceable with the approved screen references |

---

## D. Questionable Phase Assets

These phases are **not replaced** — marked for user visual approval:

| Phase | Status | Notes |
|---|---|---|
| **Shape / Size / Burn** | NEEDS USER VISUAL APPROVAL | No approved full reference image found. `cigar-shape-size-master.png` (1586×992) exists as anatomy diagram but is not a screen reference |
| **First Third** | NEEDS USER VISUAL APPROVAL | Only a 521×119 strip (`first-third-bg.png`) exists — no full reference image |
| **Second Third** | NEEDS USER VISUAL APPROVAL | Currently shows `flavor-dna.png` (1448×1086) as `<img>` — may not be the intended Second Third visual |
| **Final Review** | NEEDS USER VISUAL APPROVAL | `final-review-bg.jpg` (1536×1024) currently used — source unknown, may or may not be the approved final review reference |
