# Untracked Work Inventory POS360 / E.A.T. / NOVEE

## Current Branch
- Branch: `claude/beautiful-thompson-r3mm5m`
- Current commit: `59287e2b` — chore: protect overlapping visual work and require POS360 reference assets

## Untracked Files and Folders

### 1. `UNCOMMITTED_WORK_INVENTORY_POS360_EAT_NOVEE.md`
- Type: document
- Likely track: POS360 / E.A.T. / NOVEE (all tracks)
- Is it currently committed? NO
- Is it live in the app? NO
- Should it be committed as live app code now? NO
- Reason: Documentation only. Prior inventory file from earlier recovery step. Superseded by CONSOLIDATED report. Archive and hold.

---

### 2. `public/novee-interface-page.png`
- Type: image
- Likely track: POS360 / Track 1 (Boot screen overlay zones reference)
- Is it currently committed? NO
- Is it live in the app? NO — `Boot.jsx` was reverted; no committed code references this file
- Should it be committed as live app code now? NO
- Reason: `Boot.jsx` was reverted as part of recovery. This image is only useful when Boot.jsx is rebuilt image-first with approved reference images. Must not be wired until Boot.jsx rebuild is approved.

---

### 3. `public/proof/` (folder — 9 files)
- Contents:
  - `public/proof/phase5b-final/closeups/p5b-bottom.png`
  - `public/proof/phase5b-final/closeups/p5b-cards.png`
  - `public/proof/phase5b-final/closeups/p5b-full.png`
  - `public/proof/phase5b-final/closeups/p5b-hero.png`
  - `public/proof/phase5b-final/closeups/p5b-pressed.png`
  - `public/proof/phase5b-final/closeups/p5b-rail.png`
  - `public/proof/phase5b-final/closeups/p5b-rightpanel.png`
  - `public/proof/phase5b-final/closeups/target.png`
  - `public/proof/phase5b-final/index.html`
  - `public/proof/phase5c-audit/index.html`
- Type: proof folder (screenshots + HTML audit pages)
- Likely track: Track 1 (Phase 5b = POS360 integration hub visual proof)
- Is it currently committed? NO
- Is it live in the app? NO — no route in App.jsx serves /proof/
- Should it be committed as live app code now? NO
- Reason: Internal proof screenshots and audit pages. Archive only. Not user-facing.

---

### 4. `public/reference-pos360-table-management-target.png`
- Type: image (reference / design target)
- Likely track: Track 1 (POS360 Table Management)
- Is it currently committed? NO
- Is it live in the app? NO
- Should it be committed as live app code now? NO
- Reason: Reference/design target image. Not yet mapped to a committed screen. Archive until table management screen rebuild is approved.

---

### 5. `scratchpad/` (folder — 40 files)
- Contents include:
  - Build scripts: `build-proofsheets.cjs`, `capture.cjs`, `capture-retry.cjs`
  - HTML proof sheets: `eat-proof-sheet.html`, `pos3-proof-sheet.html`
  - E.A.T. proof screenshots: `scratchpad/eat-proof/*.png` (17 screenshots)
  - POS3 proof screenshots: `scratchpad/pos3-proof/*.png` (7 screenshots)
  - Integration hub proof: `scratchpad/proof_phase5b_integration/*.png` (2 screenshots)
  - SmokeCraft proof: `scratchpad/smokecraft-proof/smokecraft-first-second-final-proof.png`
- Type: scratchpad / proof folder
- Likely track: Track 1 (E.A.T., POS3/POS360, SmokeCraft)
- Is it currently committed? NO
- Is it live in the app? NO
- Should it be committed as live app code now? NO
- Reason: Internal build tooling and proof screenshots from prior sessions. Not user-facing code. Archive for reference.

---

### 6. `src/assets/pos3-integration-crops/footer-strip.png`
- Type: image (crop from reference)
- Likely track: Track 1 (POS360 Integration Hub)
- Is it currently committed? NO
- Is it live in the app? NO — no committed component references this path
- Should it be committed as live app code now? NO
- Reason: Intermediate crop file, not referenced by any committed source file. Archive only.

---

### 7. `src/assets/pos3-integration-crops/sync-panel-bg.png`
- Type: image (crop from reference)
- Likely track: Track 1 (POS360 Integration Hub)
- Is it currently committed? NO
- Is it live in the app? NO — no committed component references `src/assets/pos3-integration-crops/sync-panel-bg.png`
- Should it be committed as live app code now? NO
- Reason: Intermediate crop file, not referenced by any committed source file. Archive only.

---

### 8. `src/pages/pos3/POS360BartenderView.jsx`
- Type: source file (React component)
- Likely track: Track 1 (POS360 Handheld / Bartender view)
- Is it currently committed? NO
- Is it live in the app? NO — not imported or routed in any committed file
- Should it be committed as live app code now? NO
- Reason: New component that was never wired into App.jsx or any parent. Must be reviewed, approved, and properly routed before committing as live code.

---

## Critical Note

Untracked files are not protected by git diff patch files. They must be archived before cleanup or rebuild work continues. The safety patch (`UNCOMMITTED_WORK_SAFETY_PATCH_POS360_EAT_NOVEE.patch`) covers only the 14 previously modified tracked files. It does not cover any file listed above.
