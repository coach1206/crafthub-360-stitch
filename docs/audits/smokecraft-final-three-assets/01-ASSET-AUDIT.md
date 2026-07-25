# SmokeCraft — Final Three Screens: Approved-Asset Audit (Phase 1)

**Starting commit:** `bb2e52bd6d154b494171c4122732110acafa7278`
**Branch:** `recovery/smokecraft-codex-final`
**Date:** 2026-07-25

## Purpose

Three SmokeCraft screens have been carried forward across multiple passes as
disclosed `missing-approved-asset` blockers. Because the repo owner
(`COACH1206`) has been uploading new approved assets directly through the
GitHub web UI throughout this operation, the previous "missing" conclusion was
treated as **stale and unproven** and re-derived from scratch this pass — by
searching the whole repository *and* the whole git history across all branches,
and by **opening and visually inspecting** every candidate image rather than
matching on filename.

---

## Search method (what was actually done)

1. Enumerated every image file in the working tree (`*.png|jpg|jpeg|webp|svg`).
2. Enumerated **every image ever added in git history, all branches**:
   `git log --all --diff-filter=A --name-only -- '*.png' '*.jpg' '*.jpeg'`.
3. Enumerated **every commit authored by `COACH1206`** across the whole branch
   history and listed the files each one added, to catch web-UI uploads that
   landed after the last audit.
4. Keyword-swept the full historical path list for: `welcome`, `today`,
   `experience`, `resume`, `start`, `journey`, `reward`, `badge`, `begin` —
   case-insensitively, and without assuming spacing/punctuation.
5. Cross-checked the asset registry (`src/constants/smokecraftAssets.js`) for
   unreferenced/orphan assets that might be a mis-named Welcome or Resume
   visual.
6. **Opened each surviving candidate as an image** and judged its actual
   content and design system.

## Newest owner uploads (verified this pass)

| Commit | Message | File(s) added |
|---|---|---|
| `1381c4a0` | `passport/.gitkeep` | `public/assets/smokecraft/passport/.gitkeep` |
| `e6550659` | `Add files via upload` | *(no files — empty commit)* |
| `3e7abe54` | `Badge Collection.png` | `public/assets/smokecraft/Badge Collection.png` |
| `cee57e12` | `PAIRING` | `public/assets/smokecraft/pairing/Pairing Center1.png` |
| `4881d21b` | `Reward Center` | `public/assets/smokecraft/rewards/Reward Center.png` |
| `42adf027` | `Create Reward Centr` | `public/assets/Reward Centr` *(1-byte placeholder)* |

**Key finding:** the new `passport/` folder contains only `.gitkeep` — it is an
empty placeholder folder, not a new asset drop. No Welcome, Resume, or
Session-25-specific image has ever been uploaded.

---

## Screen 1 — Welcome / Session 1

| Field | Value |
|---|---|
| Canonical screen ID | `welcome` (Entry layer → Session 1) |
| Route | `/smokecraft/welcome` |
| Component | `src/pages/smokecraft/WelcomeExperience.jsx` (388 lines) |
| Phase / Session | Phase 1 / Session 1 |
| Current visual behavior | Fully live React component. **No image wiring at all** — no `SC_ASSETS` import, no `SmokeCraftImageBoundsOverlay`. Renders the learner/venue/status summary, Cigar Preview, Mentor Preview, Session 1 Preview and Golden Box Objective Preview as real expandable tactile controls. |
| Approved asset found | **NONE** |
| Exact asset path | n/a |
| SHA-256 | n/a |
| Introducing commit | n/a |

### Candidates inspected and rejected

| Candidate | Inspected? | Verdict |
|---|---|---|
| `stitch_export/.../smokecraft_start/screen.png` | Yes — opened | **REJECTED.** A Stitch AI design-tool mockup, added by a *Claude* commit (`d850afda`), not an owner upload. Narrow mobile column with ~60% dead space, and a completely different design system (pale smoke photography, light serif display type) rather than the approved deep-navy/charcoal/amber panel system. Fails "genuine user-approved visual", "not a Claude-created replacement", and "preserves the approved premium design system". |
| `stitch_export/.../smokecraft_refined_airy_start/screen.png` | Same family | **REJECTED** for the same reasons. |
| `stitch_export/.../guided_tour_welcome_to_crafthub_360/screen.png` | Same family | **REJECTED** — also CraftHub-scoped, not SmokeCraft Session 1. |
| `public/assets/smokecraft/dashboard expernice.png` | Yes — opened | **REJECTED.** Despite the promising "experience" filename, it is a multi-screen *design storyboard sheet* laying out S2 Identity, S3 Leaf Matrix and S4 Pairing Reveal side by side with goal columns. It is a spec board, not a single renderable screen, and its content is Sessions 2–4, not Session 1 Welcome. |

**Decision:** no approved asset exists. Per Phase 6, `WelcomeExperience.jsx`
is left **exactly as-is** — it is a real, working, tactile-verified live
component and must not be disturbed merely to "try something".

---

## Screen 2 — Rewards / Session 25 (+ merged Session 26 Achievements)

| Field | Value |
|---|---|
| Canonical screen ID | `rewards` (hosts `achievements` behind a mode toggle) |
| Route | `/smokecraft/rewards` |
| Component | `src/pages/smokecraft/Rewards.jsx` (603 lines) |
| Phase / Session | Phase 6 / Session 25 (+26) |
| Current visual behavior | Live React screen. `SC_ASSETS.rewards` / `SC_ASSETS.achievements` are used **only as a darkened decorative CSS background header** (`linear-gradient(...) , url(...)`), never as a bounds overlay. All XP/badge/stamp data is live. |
| Approved asset found | **NONE suitable** |

> **Not to be confused with** the separate landing-accessible Rewards Center
> (`RewardsCenter.jsx`, `/smokecraft/rewards-center`, `Reward Center.png`),
> which is already correctly wired and was **not touched**.

### Candidates inspected and rejected

| Candidate | Inspected? | Verdict |
|---|---|---|
| `public/assets/smokecraft/Badge Collection.png`<br>sha256 `01ba4719…a546b` | Yes — opened the file | **REJECTED — it is not an image.** The file is **1 byte long and contains only a newline**. It was created through the GitHub web UI "create new file" flow (the same pattern as `public/assets/Reward Centr` and the various `.gitkeep`s), not uploaded. It has no PNG magic bytes and cannot be rendered. Wiring it would have produced a broken image on Session 25. |
| `public/assets/smokecraft/REWARDS 222.png`<br>1535×1024, sha256 `98619614…99895` | Yes — opened and read in full | **REJECTED as a visual foundation; retained as decorative header.** The prior pass's finding was re-verified and is still accurate: it is a **fully-baked mock dashboard**. It bakes in an identity block reading "WELCOME / GUEST", a reward-status panel with fixed `2,750 XP`, `12` badges earned, `5` passport stamps, a `2,750 / 5,000 XP` progress bar to "CONNOISSEUR", an "AFICIONADO ★★★★★" experience level, five specific earned badges, four fixed reward cards with fixed XP prices, and a journey rail fixed at step 9 of 11. There is **not one blank zone** for live React overlay data. Converting it to a bounds-overlay foundation would violate the mandate's explicit bars on baked user data, a "Guest" placeholder identity, fake balances, fake completed rewards, and permanently-selected state — and its baked 9-of-11 rail contradicts the canonical 27-session spine. |
| `public/assets/smokecraft/session-visuals/ACHIEVMENTS.png` | Filename-adjacent | Already wired as `SC_ASSETS.achievements` for the S26 mode; not a candidate for the S25 foundation. |

**Decision:** no approved asset exists for a live Session-25 foundation. The
existing honest decorative-header usage is left unchanged.

---

## Screen 3 — Resume Journey

| Field | Value |
|---|---|
| Canonical screen ID | `resume` (entry layer) |
| Route | `/smokecraft/resume` |
| Component | `src/pages/smokecraft/ResumeJourney.jsx` (416 lines) |
| Phase / Session | Entry layer (pre-Phase-1) |
| Current visual behavior | Live React screen. `SC_ASSETS.resume` points at `cropped/golden-box-hero-v2.jpg` — an unrelated Golden Box photo used **purely as decoration**, already self-documented in the registry with the comment *"ResumeJourney.jsx has no image of its own to date."* Resume destination is derived from the shared `computeJourneyStatus` / `resolveSmokeCraftEntryDestination` authority — not duplicated. |
| Approved asset found | **NONE** |

### Candidates inspected and rejected

| Candidate | Inspected? | Verdict |
|---|---|---|
| `public/assets/smokecraft/Recommend next journey.png` | Yes — opened | **REJECTED on content.** Titled "RECOMMENDED NEXT JOURNEY — personalized for your taste, continue growing". It is a *post-completion recommender* offering five **new** journeys to start (Humidor Expert, Pair & Impress, Flavor Explorer, Flavor Memory, Community Events), each with its own `START JOURNEY` button. That is the semantic **opposite** of Resume, which must return the learner to their earliest genuinely incomplete step without creating a new journey. Independently disqualifying: it is fully baked — `12,450 XP`, `Aficionado Level 4`, `35%`, `7 / 20 Challenges Completed`, a fixed "MASTER TASTER BADGE" next-reward and a fixed 5-step recommended path. Its `START JOURNEY` buttons are exactly the kind of superficial filename/label match the mandate warns against. |
| Landing / Guest-Pass / Identity / Welcome imagery | — | **REJECTED by rule.** The mandate explicitly forbids reusing these for Resume. |

**Decision:** no dedicated approved Resume asset exists. `SC_ASSETS.resume`
remains the **honestly-disclosed decorative placeholder** it already was, with
its existing explanatory comment intact.

---

## Phase 6 — Missing-asset decision (all three)

All three screens remain marked `missing-approved-asset`. No substitute was
created, no image was edited/renamed/overwritten/moved, no screen's image was
borrowed for another screen, and **zero application source files were
modified**.

### Exact visuals still needed from the repo owner

1. **Welcome / Session 1** — a "Welcome to Today's Experience" screen in the
   approved deep-navy/charcoal/walnut/amber/champagne-gold system, with blank
   zones for the live learner name, venue, knowledge level and journey status,
   and room for the Cigar / Mentor / Session-1 / Golden-Box preview controls.
   It must not bake in a name, venue, knowledge level, or a "Guest" identity.
2. **Rewards / Session 25** — a curriculum rewards/achievements screen with
   **empty** XP, badge, stamp and reward-tier zones for live React overlays,
   and no fixed journey-step rail. (A genuine `Badge Collection` image would
   still need checking against S25's actual needs — a badge wall is not
   necessarily the S25 rewards/XP screen.)
3. **Resume Journey** — a dedicated "Resume / Start-Resume Journey" screen with
   blank zones for the live session number, learner name and completion
   percentage, distinct from the "Recommended Next Journey" recommender.

Until those exist, the three components stay as live, working React screens and
**no visual completion is claimed for any of them.**
