# Missing Runtime Images — Upload Checklist

Status: **not yet created/uploaded**. This checklist tracks the 9 runtime images identified as missing in the SmokeCraft/POS3/E.A.T. image audit. Do not redesign pages and do not wire placeholders until these are uploaded at the exact paths below.

## Rules for every image in this list
- Clean photo only — no text, no UI, no buttons, no baked screenshots, no fake/mocked-up interface elements.
- Must not be a reference mockup or a crop of one — shoot/source a genuine clean photo.
- Save directly at the exact filename and folder path given (do not rename).
- These paths are under `public/assets/...` (runtime), never under `public/design-references/...`.

---

### 1. Wrapper / Strength Education
- [ ] **Filename:** `wrapper-strength-bg.jpg`
- **Folder path:** `public/assets/smokecraft/cropped/wrapper-strength-bg.jpg`
- **Route:** `/smokecraft/wrapper-strength`
- **Component:** `src/pages/smokecraft/WrapperStrength.jsx`
- **Visual description:** Macro close-up of a cigar's oily, veined wrapper leaf in warm side-light.
- Clean photo only / no text / no UI / no buttons / no baked screenshots / no fake interface elements.

### 2. Pairing Lab
- [ ] **Filename:** `pairing-lab-bg.jpg`
- **Folder path:** `public/assets/smokecraft/cropped/pairing-lab-bg.jpg`
- **Route:** `/smokecraft/pairing-lab`
- **Component:** `src/pages/smokecraft/PairingLab.jsx`
- **Visual description:** Cigar resting beside a glass of dark spirit on a wood table, soft bokeh lounge background.
- Clean photo only / no text / no UI / no buttons / no baked screenshots / no fake interface elements.

### 3. Flavor Memory Session
- [ ] **Filename:** `flavor-memory-bg.jpg`
- **Folder path:** `public/assets/smokecraft/cropped/flavor-memory-bg.jpg`
- **Route:** `/smokecraft/flavor-memory`
- **Component:** `src/pages/smokecraft/FlavorMemory.jsx`
- **Visual description:** Warm-toned abstract close-up of curling cigar smoke against a dark background.
- Clean photo only / no text / no UI / no buttons / no baked screenshots / no fake interface elements.

### 4. SmokeCraft Challenge
- [ ] **Filename:** `smokecraft-challenge-bg.jpg`
- **Folder path:** `public/assets/smokecraft/cropped/smokecraft-challenge-bg.jpg`
- **Route:** `/smokecraft/smokecraft-challenge`
- **Component:** `src/pages/smokecraft/SmokeCraftChallenge.jsx`
- **Visual description:** Low-key shot of cigars arranged in a competitive "challenge tray" lineup, moody amber lighting.
- Clean photo only / no text / no UI / no buttons / no baked screenshots / no fake interface elements.

### 5. Second Humidor Match
- [ ] **Filename:** `second-humidor-match-bg.jpg`
- **Folder path:** `public/assets/smokecraft/cropped/second-humidor-match-bg.jpg`
- **Route:** `/smokecraft/second-humidor-match`
- **Component:** `src/pages/smokecraft/SecondHumidorMatch.jsx`
- **Visual description:** Humidor shelf from a different angle/selection than the first humidor-match screen, to avoid visual repetition.
- Clean photo only / no text / no UI / no buttons / no baked screenshots / no fake interface elements.

### 6. Mini Tasting Round
- [ ] **Filename:** `mini-tasting-bg.jpg`
- **Folder path:** `public/assets/smokecraft/cropped/mini-tasting-bg.jpg`
- **Route:** `/smokecraft/mini-tasting`
- **Component:** `src/pages/smokecraft/MiniTastingRound.jsx`
- **Visual description:** Small tasting flight of 2-3 cigar samples on a tasting mat/tray, top-down or 3/4 angle.
- Clean photo only / no text / no UI / no buttons / no baked screenshots / no fake interface elements.

### 7. SmokeCraft Final Review
- [ ] **Filename:** `final-review-bg.jpg`
- **Folder path:** `public/assets/smokecraft/cropped/final-review-bg.jpg`
- **Route:** `/smokecraft/final-review`
- **Component:** `src/pages/smokecraft/FinalReview.jsx`
- **Visual description:** Single cigar resting in an ashtray, warm dim "session complete" lounge mood.
- Clean photo only / no text / no UI / no buttons / no baked screenshots / no fake interface elements.

### 8. POS3 Handheld
- [ ] **Filename:** `pos3-handheld-bg.jpg`
- **Folder path:** `public/assets/pos3/cropped/pos3-handheld-bg.jpg`
- **Route:** `/pos3/handheld`
- **Component:** `src/pages/pos3/POS3Handheld.jsx`
- **Visual description:** Genuine clean photo of a handheld POS tablet in a lounge/table-service setting. Must NOT be derived from the existing baked-UI `pos3-handheld-reference.png`.
- Clean photo only / no text / no UI / no buttons / no baked screenshots / no fake interface elements.

### 9. E.A.T. Command Hub
- [ ] **Filename:** `eat-command-hub-hero.jpg`
- **Folder path:** `public/assets/eat/cropped/eat-command-hub-hero.jpg`
- **Route:** `/eat/command-hub`
- **Component:** `src/pages/eat/EATCommandHub.jsx`
- **Visual description:** Wide ambient shot of a restaurant back-of-house/dashboard-adjacent scene (POS terminal + kitchen pass, blurred), to sit behind the live dashboard UI as a subtle hero.
- Clean photo only / no text / no UI / no buttons / no baked screenshots / no fake interface elements.

---

## Upload instructions
1. Save each image at its exact folder path and filename above (create the `pos3/cropped/` and `eat/cropped/` subfolders if they don't already exist).
2. Do not place any of these under `public/design-references/...`.
3. Once uploaded, notify so wiring (referencing the image in its component) and any redesign work can proceed — wiring is a separate step not covered by this checklist.
