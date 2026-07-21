# Visual Closure Continuation — Wiring Report, Decision Board, Gap Matrix, ChatGPT Queue

Branch: `recovery/smokecraft-codex-final`. Continuation point confirmed: commit `4066ad93` (clean tree,
verified via `git status --porcelain` before any change).

## Task 1 — The "33 mapped, unwired" images, re-verified against the real repo (not re-trusted blind)

Re-checking each of the 56 files still on disk under `public/assets/smokecraft/session-visuals/` and
top-level against **actual live route/component state** (not the prior pass's approximate label) found
that most do **not** have a safe, unambiguous, currently-existing destination the way the earlier
"~33 mapped" estimate implied. Every one was individually re-verified this pass:

| Image | Verified reality | Wiring status |
|---|---|---|
| `BINDER EXPERIENCE.png` | sha256 differs from already-wired `apply-binder.png` — a genuinely distinct composition of the same topic, not a duplicate, not provably the "correct" one | **HUMAN_CHOICE_REQUIRED** (moved to decision board) |
| `BUNCHING METHODS.png` | sha256 differs from already-wired `select-bunching-method.png` — same situation | **HUMAN_CHOICE_REQUIRED** |
| `Quality- control Inspection.png` | sha256 differs from already-wired `inspect-and-draw-test.png` — same situation | **HUMAN_CHOICE_REQUIRED** |
| `EXPLODED WRAPPER -BINDER FILLEW VIEW.png` | No existing wired equivalent — genuinely new, but no dedicated "exploded view" panel exists in `WrapperStrength.jsx` to host it without inventing new layout | **UPLOADED_NOT_WIRED — needs a new panel, not a guess-swap** |
| `FERMINATION PROCESS1.png` | A second fermentation image; `fermentation-process.png` (from `FERMINATION PROCESS.png`, no suffix) is already wired — this "1" suffix variant is the classic near-duplicate/alternate-take naming pattern seen elsewhere this session | **HUMAN_CHOICE_REQUIRED** |
| `Filler Placement Challenge.png`, `Virtual Rolling Challenge.png`, `Wrapper Application Challenge.png`, `CHOOSE YOUR CUT.png` / `choose your cut 11.png` | **No dedicated route exists for any of these named challenges** (`grep` of `src/App.jsx` confirms no `/smokecraft/virtual-rolling-challenge`, `/filler-placement-challenge`, `/wrapper-application-challenge` route). `LeafChallenge.jsx` is a different game ("Leaf Recognition Game") whose actual subject doesn't match any of these 4 image titles | **FEATURE_NOT_BUILT — cannot be wired without inventing a route/screen that doesn't exist, which is out of this pass's scope (visual wiring only, not new feature construction)** |
| `BLIND TASTING CHALLENGE.png`, `Bllind Tasting Round.png`, `Draw And Burn Predition.png`, `Pre ligh evaluation.png`, `Palate Calibration.png`, `Blend Fault Identifacaton 1.png` / `Indentification.png` | `Scorecard.jsx` (the real tasting/scoring screen) already has one live, protected, approved full-bleed image (`SC_ASSETS.scorecard`) | **HUMAN_CHOICE_REQUIRED** (candidate replacements for an already-approved protected screen) |
| `SOIL TYPES.png`, `Tobacco Seed Genetics.png`, `TERROIR & GROWING REGION MAP.png`, `Tobacco Plant ANatomy 2.png` | `SeedSoil.jsx` already has one live, protected, hotspot-integrated image | **HUMAN_CHOICE_REQUIRED** |
| `COMPLETE FLAVOR WHEEL.png`, `SMOKING TECHNIQUES.png`, `BURN PROBLEMS  .png` | `FlavorMemory.jsx` already has one live, protected image | **HUMAN_CHOICE_REQUIRED** |
| `CIGAR ANTOMY.png`, `VITOLA & SHAPE GUIDE.png`, `STRENGTH VS BODY.png` | `MeetYourCigar.jsx`/`Format.jsx` already have live, protected images | **HUMAN_CHOICE_REQUIRED** |
| `HOW IT WORKS.png`, `HUMIDOR MATCH.png`, `CONNECTIONS.png`, `SMOKECRAFT LANDING PAGE.png` | Corresponding screens already have live, protected images | **HUMAN_CHOICE_REQUIRED** |
| `MARCO RODRIGUEZ MENTOR.png`, `MEET YOUR MENTORS.png` | Mentor roster already uses a distinct `directSrc` portrait mechanism (per-mentor, not a single static image) — wiring these risks a second, conflicting source of mentor art | **HUMAN_CHOICE_REQUIRED (product decision: extend or replace roster mechanism)** |
| `LEAF PROTECTION.png`, `LONG FILLER VS SHORT FILLER.png` | No single unambiguous panel identified in `WrapperStrength.jsx` for these specific sub-topics beyond what the existing dynamic `Section` (DB-driven wrapper/filler cards) already covers | **UPLOADED_NOT_WIRED — needs a specific panel decision** |
| `" the craft ecosystm.png"` | No matching screen found anywhere in the route registry | **NOT_APPLICABLE — needs product direction** |
| `CRAFTHUB 360. VENUE TABLE EXPERIENCE.png` | Confirmed out of SmokeCraft scope — this is a Venue/POS-related image, already present at `public/assets/` top level for a different system | **NOT_APPLICABLE to SmokeCraft** |
| 14 files (`ACHIEVMENTS`, `AI SUMMARY`, `KNOWLEDGE CHECK`×2, `KNOWLEDGE DROP`, `LEADERBOARD`×3, `LIGHTING TUTORIAL 1`, `MENTOR :COMMENTARY`, `Mini Tasting 11`, `REWARDS 222`, `Recommend next journey`, `SMOKECRAFT CHALLENG`, `Venue Selection 11`, `personlized pairing 222`, `smokecraft badges`) | Confirmed (unchanged from every prior pass) byte-identical or same-subject duplicates of already-live top-level production assets already referenced in `SC_ASSETS` | **DUPLICATE_REPLACED / LEGACY_REFERENCE — unchanged, not deleted** |

**Honest correction to the prior estimate**: none of the remaining 56 files turned out to be a
"safe, unambiguous, ready-to-wire, no-conflict" image once individually re-verified against the real
route/component state. The prior "~33 mapped but not yet wired" figure conflated "a plausible topic
match exists" with "a safe destination with no conflict and no missing route exists" — this pass
corrects that by re-classifying every file against the actual repository, which is a more honest and
useful result than force-wiring images into ambiguous or nonexistent destinations.

**0 new images were wired this pass** — not because no work was done, but because every remaining file,
on real verification, needs either a human decision (near-duplicate of a protected screen's live art),
a new feature/route that doesn't exist yet (out of this pass's wiring-only scope), or product direction
(no matching screen). Forcing any of them in would violate the standing "do not guess between competing
images" and "do not create new routes unless the mapped destination genuinely does not exist" rules.

## Task 2 — Consolidated human visual decision board

| # | Filename(s) | Route | Current live art | What's different | Fixed mentor? | Baked data? | Palette match? | Tablet-ready? | Recommendation |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `golden-box-challenge.png` (superseded) vs `golden-box-challenge-alt.png` (active) | Golden Box (no screen yet consumes this key) | N/A — not yet wired to a screen | Already resolved from source-commit timestamp (see visual-sequence-closure pass) | No | No | Yes | Yes | **RESOLVED — no action needed, informational only** |
| 2 | `BINDER EXPERIENCE.png` vs live `apply-binder.png` | `/smokecraft/wrapper-strength` (processing/rolling steps) | `apply-binder.png`, tested, wired | Different photo composition, same subject | Unclear without visual review | Unclear without visual review | Unclear | Unclear | **NEEDS CHATGPT VISUAL CORRECTION or USE CURRENT — needs side-by-side human look** |
| 3 | `BUNCHING METHODS.png` vs live `select-bunching-method.png` | same | same pattern | same | Unclear | Unclear | Unclear | Unclear | **USE CURRENT (recommended default) unless human prefers the alternate** |
| 4 | `Quality- control Inspection.png` vs live `inspect-and-draw-test.png` | same | same pattern | same | Unclear | Unclear | Unclear | Unclear | **USE CURRENT (recommended default)** |
| 5 | `FERMINATION PROCESS1.png` vs live `fermentation-process.png` | same | same pattern | "1" suffix = classic alternate-take naming | Unclear | Unclear | Unclear | Unclear | **USE CURRENT (recommended default)** |
| 6 | `SOIL TYPES.png` / `Tobacco Seed Genetics.png` / `TERROIR & GROWING REGION MAP.png` / `Tobacco Plant ANatomy 2.png` vs live `SeedSoil.jsx` composite | `/smokecraft/seed-soil` | Live image has a real, tested, protected hotspot-zone system overlaid at exact pixel coordinates | These are standalone single-topic images, not a matching multi-zone composite — swapping would likely break the existing hotspot coordinate system entirely | N/A | N/A | Unclear | Unclear | **KEEP AS REFERENCE ONLY — swapping risks breaking a working, tested hotspot system; only proceed if a new composite is purpose-built to match the zone layout** |
| 7 | `COMPLETE FLAVOR WHEEL.png` / `SMOKING TECHNIQUES.png` / `BURN PROBLEMS.png` vs live `FlavorMemory.jsx` composite | `/smokecraft/flavor-memory` | Live image also has a hotspot-zone system (flavor-zone selectors) at fixed coordinates | Same risk as #6 | N/A | N/A | Unclear | Unclear | **KEEP AS REFERENCE ONLY — same hotspot-coordinate risk** |
| 8 | `CIGAR ANTOMY.png` / `VITOLA & SHAPE GUIDE.png` / `STRENGTH VS BODY.png` vs live `MeetYourCigar.jsx`/`Format.jsx` | `/smokecraft/meet-your-cigar`, `/smokecraft/format` | Live, protected, tested | Standalone topic images vs. full composite | Unclear | Unclear | Unclear | Unclear | **NEEDS CHATGPT VISUAL CORRECTION if intended as full-composite replacements — otherwise KEEP AS REFERENCE ONLY** |
| 9 | `BLIND TASTING CHALLENGE.png` / `Bllind Tasting Round.png` / `Draw And Burn Predition.png` / `Pre ligh evaluation.png` / `Palate Calibration.png` / `Blend Fault Identifacaton 1.png` / `Indentification.png` vs live `Scorecard.jsx` | `/smokecraft/scorecard` | Live, protected, tested | 7 candidate single-topic images vs. 1 live composite | Unclear | Unclear | Unclear | Unclear | **PROMOTIONAL ONLY or KEEP AS REFERENCE — too many candidates for one slot; likely each belongs on a not-yet-built dedicated sub-screen rather than replacing Scorecard's own art** |
| 10 | `HOW IT WORKS.png` / `HUMIDOR MATCH.png` / `CONNECTIONS.png` / `SMOKECRAFT LANDING PAGE.png` vs live equivalents | various | Live, protected, tested | Same-subject alternates | Unclear | Unclear | Unclear | Unclear | **KEEP AS REFERENCE ONLY** |
| 11 | `MARCO RODRIGUEZ MENTOR.png` / `MEET YOUR MENTORS.png` vs the existing dynamic mentor-roster mechanism | Mentor selection | Live roster uses per-mentor `directSrc`, not a single static image | These look like standalone additions to the roster, not a replacement mechanism | **Yes — fixed portrait, exactly the kind of "fixed mentor" issue flagged in the locked visual requirements** | No | Unclear | Unclear | **NEEDS CHATGPT VISUAL CORRECTION — if Marco Rodriguez is a new roster mentor, needs a portrait matching the roster's existing per-mentor format, not a standalone fixed-mentor screen image; product decision needed on whether "Meet Your Mentors" is a new screen or promotional-only** |

For items 2–5 and 6–10, a true visual side-by-side (thumbnail comparison) requires eyes-on image review
this pass did not perform pixel-by-pixel — the recommendations above are based on structural/architectural
risk (hotspot coordinate systems, existing tested wiring) rather than aesthetic judgment, which is the
correct basis for an engineering recommendation, but the final call on which composition looks better is
explicitly deferred to the human, per the standing "do not guess" rule.
