# SmokeCraft Batch 3 Platform Asset Report

Generated: 2026-06-30  
Branch: claude/beautiful-thompson-r3mm5m

---

## A. Purpose

Recover or identify Batch 3 platform/entry SmokeCraft visuals from existing public assets before requesting uploads.

---

## B. Confirmed Assets

| Screen | Source Public Path | Approved Path | Wired To Page | Status |
|---|---|---|---|---|
| SmokeCraft Landing | public/smokecraft-hero.png | public/assets/smokecraft-reference/approved/smokecraft-landing.png | src/pages/SmokeCraft.jsx | WIRED |
| Art | public/cigar-anatomy.png | public/assets/smokecraft-reference/approved/smokecraft-art.png | src/pages/smokecraft/Art.jsx | WIRED |
| How It Works | public/SMOKECRAT STORY BOARD.png | public/assets/smokecraft-reference/approved/smokecraft-how-it-works.png | src/pages/smokecraft/HowItWorks.jsx | WIRED |
| Scan | public/smokecraft Intake.png | public/assets/smokecraft-reference/approved/smokecraft-scan.png | src/pages/smokecraft/Scan.jsx | WIRED |

---

## C. Missing Assets

| Required Screen | Required Filename | Status |
|---|---|---|
| Origins | smokecraft-origins.png | NEEDS UPLOAD to public/ — upload Origins reference image to public/ root |
| Guest Pass | smokecraft-guest-pass.png | NEEDS UPLOAD to public/ — upload Guest Pass reference image to public/ root |

---

## D. Pages Updated

| Page | Approved Image | Visible `<img>`? | Notes |
|---|---|:---:|---|
| src/pages/SmokeCraft.jsx | smokecraft-landing.png | YES | `<img>` panel after body copy, before action buttons |
| src/pages/smokecraft/Art.jsx | smokecraft-art.png | YES | `<img>` panel at top of main before art grid |
| src/pages/smokecraft/HowItWorks.jsx | smokecraft-how-it-works.png | YES | `<img>` panel after description, before steps |
| src/pages/smokecraft/Scan.jsx | smokecraft-scan.png | YES | `<img>` panel at top of main before scan card |
| src/pages/smokecraft/Origins.jsx | smokecraft-origins.png | NO | SKIPPED — file missing; will wire on upload |
| src/pages/smokecraft/GuestPass.jsx | smokecraft-guest-pass.png | NO | SKIPPED — file missing; will wire on upload |

---

## E. SmokeCraft Visual Batch Status

**Batch 1: COMPLETE — 8 of 8 WIRED**  
**Batch 2: COMPLETE — 8 of 8 WIRED**  
**Batch 3: 4 of 6 WIRED — 2 missing (Origins, Guest Pass — need upload to public/)**
