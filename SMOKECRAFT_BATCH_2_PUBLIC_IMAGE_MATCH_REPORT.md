# SmokeCraft Batch 2 Public Image Match Report

Generated: 2026-06-30  
Branch: claude/beautiful-thompson-r3mm5m  
Search: All existing public/ images before requesting new uploads

---

## A. Search Scope

Searched all existing public/ images before requesting new uploads.  
Excluded: stitch_export, attached_assets.  
Total public images searched: 309  
Batch 2 keyword-matched candidates: 12

---

## B. Candidate Images Found

| # | Candidate File | Source Public Path | Dimensions | Content Visible | Batch 2 Match | Decision |
|---|---|---|---|---|---|---|
| 1 | candidate-golden-box-status-01 | public/assets/smokecraft/cropped/scorecard.png | 1672×941 | "SmokeCraft Scorecard" 0/40 form | None | REJECT — scorecard, not golden box |
| 2 | candidate-golden-box-status-02 | public/GOLDEN BOX JOURNEY11.png | 1672×941 | "Golden Box Journey" 675 pts, progress badges | Golden Box Status | CONFIRMED MATCH |
| 3 | candidate-golden-box-status-03 | public/lounge demo ranking.png | 1672×941 | "Your Golden Box Awaits" gold box | Golden Box Status (alt) | CONFIRMED ALT — lower quality duplicate; #2 preferred |
| 4 | candidate-golden-box-status-04 | public/smokecraft/images/golden-box.png | 1672×941 | "Your Golden Box Awaits" (duplicate of #3) | Golden Box Status | DUPLICATE — rejected in favor of #2 |
| 5 | candidate-leaderboard-01 | public/smokecraft/images/leaderboard.png | 1672×941 | "Your Golden Box Awaits" | NOT leaderboard | REJECT — misclassified as leaderboard at source |
| 6 | candidate-leaderboard-02 | public/lounge demo ranking.11png.png | 1672×941 | "Demo Lounge Ranking" + "Claim Golden Box" | Leaderboard | CONFIRMED MATCH |
| 7 | candidate-leaderboard-03 | public/assets/smokecraft/cropped/scorecard-hero.jpg | 1672×941 | "SmokeCraft Scorecard" form | Scorecard | REJECT — not a leaderboard |
| 8 | candidate-pairing-01 | public/smokecraft/images/seed-soil-pairing.png | 941×1672 | "Seed & Soil Pairing" portrait | Pairing (seed/soil) | POSSIBLE — less representative than #9 |
| 9 | candidate-pairing-02 | public/assets/smokecraft/cropped/pairing-lab-bg.jpg | 1086×1448 | "Your Blend Pairing Guide" cigar+drink cards | Pairing | CONFIRMED MATCH — best full UI |
| 10 | candidate-pairing-lab-01 | public/assets/smokecraft/cropped/pairing-lab-strip.png | 526×190 | Tiny horizontal strip | — | REJECT — too small |
| 11 | candidate-vitola-01 | public/smokecraft/images/cigar-shape-size.png | 1586×992 | "Shape, Size & Burn Time" cigar shapes chart | Vitola | CONFIRMED MATCH |
| 12 | candidate-vitola-02 | public/assets/smokecraft/cropped/vitola-bg.jpg | 1586×992 | "Shape, Size & Burn Time" (identical to #11) | Vitola | DUPLICATE — rejected in favor of #11 |

---

## C. Confirmed Batch 2 Matches

| Required Screen | Required Approved Filename | Source Public Path | Dimensions | Decision |
|---|---|---|---|---|
| Pairing | smokecraft-pairing.png | public/assets/smokecraft/cropped/pairing-lab-bg.jpg | 1086×1448 | CONFIRMED MATCH |
| Vitola | smokecraft-vitola.png | public/smokecraft/images/cigar-shape-size.png | 1586×992 | CONFIRMED MATCH |
| Leaderboard | smokecraft-leaderboard.png | public/lounge demo ranking.11png.png | 1672×941 | CONFIRMED MATCH |
| Golden Box Status | smokecraft-golden-box-status.png | public/GOLDEN BOX JOURNEY11.png | 1672×941 | CONFIRMED MATCH |

**4 of 8 Batch 2 assets confirmed and copied to approved/.**  
**4 of 8 still require new uploads.**

---

## D. Missing After Public Search

| Required Screen | Required Filename | Status |
|---|---|---|
| Pairing Lab | smokecraft-pairing-lab.png | NEEDS UPLOAD — no full-screen candidate found |
| Pairing Mastery | smokecraft-pairing-mastery.png | NEEDS UPLOAD — no candidate found |
| Terroir | smokecraft-terroir.png | NEEDS UPLOAD — no candidate found |
| Event Challenge | smokecraft-event-challenge.png | NEEDS UPLOAD — no candidate found |

---

## E. Wiring — Live Pages Updated

4 confirmed assets copied to `public/assets/smokecraft-reference/approved/` and wired as visible `<img>` panels:

| Page | File | Approved Image | Wiring Method |
|---|---|---|---|
| Pairing | src/pages/smokecraft/Pairing.jsx | smokecraft-pairing.png | New visible `<img>` panel added after title/description, before Featured Cigar Hero |
| GoldenBoxStatus | src/pages/smokecraft/GoldenBoxStatus.jsx | smokecraft-golden-box-status.png | New visible `<img>` panel added before Cinematic Open Box animation |
| Leaderboard | src/pages/smokecraft/Leaderboard.jsx | smokecraft-leaderboard.png | New visible `<img>` panel added at top of main, before real session data |
| Vitola | src/pages/smokecraft/Vitola.jsx | smokecraft-vitola.png | Passed as referenceImage prop to ComingSoon component (ComingSoon.jsx updated to accept + render it) |
