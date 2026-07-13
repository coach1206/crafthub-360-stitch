# SmokeCraft 360 — First Six Route Image Discovery Report

**Generated:** 2026-07-13  
**Branch:** recovery/smokecraft-codex-final  
**Commit:** 0eb2f1fc71b37557df01a0f27ffcd6dec5c3a9b6  
**Task:** Read-only image discovery — NO source files changed, NO commits, NO pushes  
**Total image files searched:** 218  

---

## Summary Table

| # | Route | Best Candidate | Confidence | Current Registry Status |
|---|-------|---------------|------------|------------------------|
| 1 | /smokecraft | `approved/smokecraft-landing.png` | HIGH | ✅ CORRECT |
| 2 | /smokecraft/identity | `smokecraft/IDENTY.png` | HIGH | ⚠️ Registry correct; component hardcoded to wrong crop |
| 3 | /smokecraft/golden-box | `smokecraft/GOLDEN BOX RULES.png` | HIGH | ❌ Registry uses tiny crop |
| 4 | /smokecraft/mentor-selection | `smokecraft/MENTOR SELECTION1.png` | HIGH | ✅ CORRECT |
| 5 | /smokecraft/format | `approved/smokecraft-vitola.png` | HIGH | ❌ Registry uses tiny crop |
| 6 | /smokecraft/seed-soil | `smokecraft/SEED & SOIL.png` | HIGH | ❌ Registry uses tiny crop |

---

## Route 1 — /smokecraft (Landing)

**Component:** `src/pages/SmokeCraft.jsx`  
**Current rendered path:** `/assets/smokecraft-reference/approved/smokecraft-landing.png`  
**SC_ASSETS key:** `landing`  

### Candidates

| File | Dimensions | Classification | Git Date | MD5 |
|------|-----------|----------------|----------|-----|
| **approved/smokecraft-landing.png** ★ | 1189×667 | APPROVED-REF | 2026-06-25 | 91ac8347 |
| approved/Crafthub 360 landing page.png | 1672×941 | APPROVED-REF | 2026-06-22 | 0cd2ac62 |
| batch-3/candidate-landing-02.png | 1672×941 | BATCH-3 | 2026-06-22 | f71031ab |

### Verdict: **HIGH confidence — `smokecraft-landing.png`**

- Shows SmokeCraft 360 landing: "Discover your cigar profile" with cigar/whiskey/passport imagery and bottom nav chips (REWARDS, RANKINGS, PASSPORT, CRAFTHUB).
- Docs and registry agree. Component already correct.
- `Crafthub 360 landing page.png` shows the VENUE TABLE EXPERIENCE multi-app overview — wrong route.
- `candidate-landing-02.png` shows CraftHub logo with blue circle — unrelated.

**Reason current is correct:** No change needed.

---

## Route 2 — /smokecraft/identity

**Component:** `src/pages/smokecraft/Identity.jsx`  
**Current rendered path (hardcoded in component):** `/assets/smokecraft/cropped/discover-profile-bg.jpg` (768×519 crop)  
**SC_ASSETS key:** `identity` → `/assets/smokecraft/IDENTY.png`  

### Candidates

| File | Dimensions | Classification | Git Date | MD5 |
|------|-----------|----------------|----------|-----|
| **smokecraft/IDENTY.png** ★ | 1672×941 | RAW-UPLOAD | **2026-07-11** | 92b60c40 |
| approved/smokecraft-profile-capture.png | 1672×941 | APPROVED-REF | 2026-06-30 | 9aa9348a |
| batch-22/discover-your-profile-111.png | 1672×941 | BATCH-22 | 2026-07-10 | 0edd0944 |
| PROFILE DISCOVER 11.png | 1672×941 | ROOT-UPLOAD | 2026-06-24 | be26847b |

### Verdict: **HIGH confidence — `IDENTY.png`**

- `IDENTY.png`: Shows IDENTITY screen composition — portrait of cigar smoker in hat (left), "IDENTITY — Every journey begins with you" heading, printed GUEST PROFILE form with blank Name/Email/Phone/Birthdate zones (right). Newest founder upload (2026-07-11). Explicitly named in `docs/AI_WORKFLOW_RULES.md`.
- `smokecraft-profile-capture.png`: **MISLABELED** in approved folder. MD5 matches `public/DISCOVER YOUR PROFILE.png` — this is the landing/discover page composition, not the identity screen.
- `discover-your-profile-111.png`: Shows "Discover your cigar profile" with Padron 1964 Anniversary — landing/entry content, not identity form.
- `PROFILE DISCOVER 11.png`: Another landing/discover variant. Not identity form content.

**Reason current component is wrong:** Identity.jsx was hardcoded to `discover-profile-bg.jpg` (768×519 partial crop) in a previous session. This is background-only, not the approved full composition.

**Unresolved:** `IDENTY.png` contains printed form field outlines. Overlaying React form controls creates a double-form appearance. Whether the composition was intended to use those printed zones as visual guides (with React controls filling them), or whether a portrait-only crop should be used instead, is a founder decision outside this discovery task scope.

---

## Route 3 — /smokecraft/golden-box

**Component:** `src/pages/smokecraft/GoldenBox.jsx`  
**Current rendered path:** `/assets/smokecraft/cropped/golden-box-hero-v2.jpg` (876×540 crop)  
**SC_ASSETS key:** `goldenBox`  

### Candidates

| File | Dimensions | Classification | Git Date | MD5 |
|------|-----------|----------------|----------|-----|
| **smokecraft/GOLDEN BOX RULES.png** ★ | 1448×1086 | RAW-UPLOAD | **2026-07-11** | 1e4c2241 |
| approved/smokecraft-gold-box-rules.png | 1672×941 | APPROVED-REF | 2026-06-30 | 3e15b9be |
| GOLDEN BOX JOURNEY.png | 1672×941 | ROOT-UPLOAD | 2026-06-25 | 760fce04 |
| GOLDEN BOX JOURNEY11.png | 1672×941 | ROOT-UPLOAD | 2026-06-24 | 11380ccc |
| batch-22/smokcraft goldenbox rules.png | 1672×941 | BATCH-22 | 2026-07-10 | fdeef1fb |

### Verdict: **HIGH confidence — `GOLDEN BOX RULES.png`**

- `GOLDEN BOX RULES.png`: Shows the correct Golden Box composition — left nav + 5 numbered Golden Box Rules printed, center "Your Golden Box Awaits" with premium cigar box photograph, right GUEST SETTINGS and RULE ACKNOWLEDGEMENT printed form zones. Blank zones match GoldenBox.jsx (5 principles + acknowledgement). Newest upload (2026-07-11). Docs name this file.
- `smokecraft-gold-box-rules.png` (approved folder): **WRONG CONTENT** despite its name. Visual: SmokeCraft Scorecard "0/40" with flavor/construction/draw scoring — this is the Scorecard screen mislabeled in the approved folder.
- `GOLDEN BOX JOURNEY.png`: Shows Golden Box Journey status/points screen (675 pts) — this is the GoldenBoxStatus route, not golden-box.
- `GOLDEN BOX JOURNEY11.png`: MD5 identical to `smokecraft-golden-box-status.png` — same status dashboard.
- `batch-22/smokcraft goldenbox rules.png`: Shows "Rules of Play" with Contest Levels (Novice → Expert) and XP progression — visually different design, may be supplemental or an alternative rules variant.

**Reason current is wrong:** `golden-box-hero-v2.jpg` (876×540) is a background-only crop of a cigar box. Not the approved full composition with rules and form zones.

**Unresolved:** `batch-22/smokcraft goldenbox rules.png` (2026-07-10) shows a different "Rules of Play" visual design. Whether this represents a design update for the golden-box route, or a different route entirely, cannot be determined from discovery alone.

---

## Route 4 — /smokecraft/mentor-selection

**Component:** `src/pages/smokecraft/Mentor.jsx`  
**Current rendered path:** `/assets/smokecraft/MENTOR%20SELECTION1.png`  
**SC_ASSETS key:** `mentorSelection`  

### Candidates

| File | Dimensions | Classification | Git Date | MD5 |
|------|-----------|----------------|----------|-----|
| **smokecraft/MENTOR SELECTION1.png** ★ | 1672×941 | RAW-UPLOAD | **2026-07-11** | 4ea8ff8c |
| approved/smokecraft-mentor-selection.png | 1672×941 | APPROVED-REF | 2026-06-30 | c358b329 |

*Note: `smokecraft-mentor-selection.png` is identical (MD5 match) to `smokecraft/mentor-selection.png` and `smokecraft/images/mentor-selection.png` — three copies of the same file.*

### Verdict: **HIGH confidence — `MENTOR SELECTION1.png`**

- `MENTOR SELECTION1.png`: Shows Mentor Selection — "Your Journey. Their Wisdom. Your Masterpiece." heading, 8 mentor portraits in 2×4 grid with names, origins, expertise. NOVEE OS branding. Mentor card zones provide backdrop for React interactive cards. Newest upload (2026-07-11). Docs and registry name this file.
- `smokecraft-mentor-selection.png`: Same 8 mentor portraits, CraftHub 360 branding (older header), selection counter "4+" visible. Earlier iteration of the same screen. Not incorrect, just superseded.

**Reason current is correct:** Component and registry already use `MENTOR SELECTION1.png` correctly.

---

## Route 5 — /smokecraft/format

**Component:** `src/pages/smokecraft/Format.jsx`  
**Current rendered path:** `/assets/smokecraft/cropped/format-master-tip-v2.jpg` (688×372 crop)  
**SC_ASSETS key:** `format`  

### Candidates

| File | Dimensions | Classification | Git Date | MD5 |
|------|-----------|----------------|----------|-----|
| **approved/smokecraft-vitola.png** ★ | 1586×992 | APPROVED-REF | 2026-06-30 | 765fe2b4 |
| SHAPE SIZE BURN.1.png | 1586×992 | ROOT-UPLOAD | 2026-06-24 | 765fe2b4 |
| SHAPE SIZE BURN.11.png | 935×1683 | ROOT-UPLOAD | 2026-06-24 | 26c69ccc |

*Note: `smokecraft-vitola.png` and `SHAPE SIZE BURN.1.png` are identical files (MD5 match).*

### Verdict: **HIGH confidence — `smokecraft-vitola.png`**

- `smokecraft-vitola.png` / `SHAPE SIZE BURN.1.png`: Shows "Shape, Size & Burn Time" landscape composition (1586×992) — cigar format grid (Robusto, Toro, Churchill, Corona, Gordo, Torpedo/Figurado) with descriptions, "Choose the format that matches your pace." Full composition with blank selection zones matching Format.jsx interactive chips. Docs name `smokecraft-vitola.png`.
- `SHAPE SIZE BURN.11.png`: Portrait orientation (935×1683) — comprehensive version with Format Guide, Cigar Intelligence panel, flavor profiles. More detailed content but wrong aspect ratio for the landscape app layout.
- `format-master-tip-v2.jpg` (current): 688×372 tiny crop. Not the approved composition.

**Reason current is wrong:** `format-master-tip-v2.jpg` is a background-only partial crop, not the full composition.

---

## Route 6 — /smokecraft/seed-soil

**Component:** `src/pages/smokecraft/SeedSoil.jsx`  
**Current rendered path:** `/assets/smokecraft/cropped/seed-soil-bg.jpg` (320×540 portrait crop)  
**SC_ASSETS key:** `seedSoil`  

### Candidates

| File | Dimensions | Classification | Git Date | MD5 |
|------|-----------|----------------|----------|-----|
| **smokecraft/SEED & SOIL.png** ★ | 1672×941 | RAW-UPLOAD | **2026-07-11** | 6c58a4bc |
| approved/smokecraft-seed-soil.png | 1672×941 | APPROVED-REF | 2026-06-30 | 7fa3bd9c |
| smokecraft/SEED & PARING.png | 1672×941 | RAW-UPLOAD | 2026-06-22 | 7fa3bd9c |
| SEED & PAIRING.11.png | 941×1672 | ROOT-UPLOAD | 2026-06-24 | 019b4ddc |

*Note: `smokecraft-seed-soil.png` and `SEED & PARING.png` are identical files (MD5 match). `SEED & PAIRING.11.png` and `SEED PARING 2.png` are identical.*

### Verdict: **HIGH confidence — `SEED & SOIL.png`**

- `SEED & SOIL.png`: Shows "Seed & Soil — Where Tobacco Character Begins" with seed type panels (Criollo, Corojo, Habano, Connecticut) and soil composition panels (Sandy Loam, Clay Loam, Volcanic, Limestone) — blank selection zones present. Content matches SeedSoil.jsx SEED_TYPES and SOIL_TYPES arrays exactly. Newest upload (2026-07-11). Docs name this file.
- `smokecraft-seed-soil.png` / `SEED & PARING.png`: Shows "Seed & Soil Pairing" selection by **tobacco growing region** (Vuelta Abajo, Jalapa Valley, Estelí, San Andrés) — different data model from SeedSoil.jsx which uses seed variety + soil type categories. Earlier upload.
- `SEED & PAIRING.11.png`: Portrait (941×1672), same pairing-by-region content. Wrong aspect ratio for landscape layout.
- `seed-soil-bg.jpg` (current): 320×540 portrait crop. Not the approved composition.

**Reason current is wrong:** `seed-soil-bg.jpg` is a background-only partial crop, not the full composition.

**Unresolved:** `smokecraft-seed-soil.png` (in approved folder) shows tobacco growing regions (Vuelta Abajo, Jalapa Valley, Estelí, San Andrés) — this may represent an older version of the seed-soil concept or may belong to a different route. `SEED & SOIL.png` shows the current seed variety / soil type concept that matches SeedSoil.jsx.

---

## Registry Discrepancies Found

| Route | SC_ASSETS Key | Registry Points To | What It Should Point To |
|-------|--------------|-------------------|------------------------|
| /smokecraft/identity | `identity` | `IDENTY.png` ✅ | `IDENTY.png` — but component ignores registry |
| /smokecraft/golden-box | `goldenBox` | `cropped/golden-box-hero-v2.jpg` ❌ | `GOLDEN BOX RULES.png` |
| /smokecraft/format | `format` | `cropped/format-master-tip-v2.jpg` ❌ | `smokecraft-vitola.png` |
| /smokecraft/seed-soil | `seedSoil` | `cropped/seed-soil-bg.jpg` ❌ | `SEED & SOIL.png` |

---

## Mislabeled Files in Approved Folder

| File | Expected Content | Actual Content |
|------|-----------------|----------------|
| `approved/smokecraft-gold-box-rules.png` | Golden Box Rules | SmokeCraft Scorecard (0/40) |
| `approved/smokecraft-profile-capture.png` | Identity/Profile form | Landing page (MD5 = DISCOVER YOUR PROFILE.png) |

---

## Files Confirmed in Rejected Folder (Not Used)

- `rejected/CRAFTHUB 360. VENUE TABLE EXPERIENCE.png`
- `rejected/EAT SYSTEM.png` / `rejected/eat-system.png`
- `rejected/POS 3 SYSTEM.png` / `rejected/pos 3.png`
- `rejected/crafthub-landing.png`
- `rejected/novee-os-boot.png`
- `rejected/profound-1.png`

---

## Confirmations

- **No source files were changed** — Identity.jsx, Mentor.jsx, GoldenBox.jsx, Format.jsx, SeedSoil.jsx, SmokeCraft.jsx, smokecraftAssets.js all unchanged.
- **No commits were created.**
- **No pushes were made.**
- **No files renamed, moved, deleted, or generated.**
