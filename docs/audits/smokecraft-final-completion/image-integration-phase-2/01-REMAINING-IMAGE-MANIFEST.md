# Image Integration Phase 2 — Remaining Image Manifest

## Integrated this pass (11 files, moves out of the "remaining 59")

| File | New path | SC_ASSETS key | Route/Component | Status |
|---|---|---|---|---|
| Leaf Comparison.png | leaf-construction/leaf-comparison.png | rollingStepPrepareLeaves | WrapperStrength.jsx / RollingProcess | ALREADY_INTEGRATED |
| FILLER EXPERIENCE.png | leaf-construction/arrange-filler.png | rollingStepArrangeFiller | same | ALREADY_INTEGRATED |
| Bunching Method selection.png | leaf-construction/select-bunching-method.png | rollingStepSelectBunching | same | ALREADY_INTEGRATED |
| APPLYING THE BINDER.png | leaf-construction/apply-binder.png | rollingStepApplyBinder | same | ALREADY_INTEGRATED |
| MOLDING & PRESSING.png | leaf-construction/mold-or-press.png | rollingStepMoldOrPress | same | ALREADY_INTEGRATED |
| APPLYING THE WRAPPER.png | leaf-construction/apply-wrapper.png | rollingStepApplyWrapper | same | ALREADY_INTEGRATED |
| FORMING THE CAP.png | leaf-construction/construct-cap.png | rollingStepConstructCap | same | ALREADY_INTEGRATED |
| FINISHING THE FOOT.png | leaf-construction/finish-foot.png | rollingStepFinishFoot | same | ALREADY_INTEGRATED |
| QUALITY CONTROL.png | leaf-construction/inspect-and-draw-test.png | rollingStepInspectAndDrawTest | same | ALREADY_INTEGRATED |
| FINAL ESTING & BOXING.png | leaf-construction/rest-and-box-age.png | rollingStepRestAndBoxAge | same | ALREADY_INTEGRATED |
| RING GAUGE GUIDE.png | (kept at session-visuals/, key points there) | ringGaugeGuide | CigarGaugeGuide.jsx background | ALREADY_INTEGRATED |

All ten `step_key`-mapped images render as 44×44 decorative thumbnails next to their matching rolling
step in `WrapperStrength.jsx`, verified via proof screenshot and a clean 27/27 re-run of
`verify-golden-box-package-5-leaf-construction.mjs`. `ringGaugeGuide` replaces the generic
`cigars/robusto.jpg` background on `CigarGaugeGuide.jsx` with topic-matched art.

## Still remaining, classified honestly (48 files)

### BLOCKED_BY_HUMAN_VISUAL_CHOICE (already-imaged protected/near-protected screens — candidate
replacements for existing approved production art; swapping without confirmation is a guess, not a fix)

| File | Current SC_ASSETS state | Screen already showing | Why blocked |
|---|---|---|---|
| SOIL TYPES.png, Tobacco Seed Genetics.png, TERROIR & GROWING REGION MAP.png, Tobacco Plant ANatomy 2.png | `seedSoil`, `terroir`, `terroirSoil` already point at approved art | SeedSoil.jsx (protected — real hotspot/zone system) | Same-subject upload could be an intended replacement, a draft, or unrelated reference — needs a human decision, not an automated swap |
| COMPLETE FLAVOR WHEEL.png, SMOKING TECHNIQUES.png, BURN PROBLEMS.png | `flavorMemory` already points at approved art | FlavorMemory.jsx (protected) | Same reasoning |
| CIGAR ANTOMY.png, VITOLA & SHAPE GUIDE.png, STRENGTH VS BODY.png | `meetYourCigar`/`format` already point at approved art | MeetYourCigar.jsx, Format.jsx | Same reasoning |
| Palate Calibration.png, Blend Fault Identifacaton 1.png / Indentification.png, BLIND TASTING CHALLENGE.png, Bllind Tasting Round.png, Draw And Burn Predition.png, Pre ligh evaluation.png | `scorecard` already points at approved art | Scorecard.jsx | Same reasoning |
| HOW IT WORKS.png, HUMIDOR MATCH.png, CONNECTIONS.png, SMOKECRAFT LANDING PAGE.png | `howItWorks`/`humidorMatch`/`connections`/`landing` already point at approved art | HumidorMatch.jsx, Connections.jsx, landing | Same reasoning |
| MARCO RODRIGUEZ MENTOR.png, MEET YOUR MENTORS.png | Mentor roster uses its own approved-portrait mechanism (`directSrc` on `MediaSlot`), not `SC_ASSETS` | Mentor selection | Wiring these could create a second, conflicting source of mentor art without confirming they're meant to extend (not replace) the existing roster |

### DUPLICATE_ASSET_CONFLICT (unchanged from Phase 1, still unresolved — human choice required)

| File A | File B | Screen | Status |
|---|---|---|---|
| `golden-box/golden-box-challenge.png` | `golden-box/golden-box-challenge-alt.png` | Golden Box challenge card art | **BLOCKED_BY_HUMAN_VISUAL_CHOICE** — both files exist and are registered/available on disk; only `golden-box-challenge.png` is wired into `SC_ASSETS.goldenBoxChallenge`; `golden-box-challenge-alt.png` is intentionally left unregistered and unrendered in production. **Not resolved this pass** — reported here per Step 9's explicit instruction to surface it, not guess. |

### READY_TO_INTEGRATE but deferred (genuinely new content, no existing art conflict, needs its own
screen/route decision rather than a screen-swap)

| File | Category | Likely destination | Why deferred |
|---|---|---|---|
| Filler Placement Challenge.png, Virtual Rolling Challenge.png, Wrapper Application Challenge.png, CHOOSE YOUR CUT.png / choose your cut 11.png | Group D — construction challenges | `LeafChallenge.jsx` family | These challenge screens use a generative/dynamic scoring flow (`LeafChallengeCalculating.jsx`, `LeafChallengeResult.jsx`) with no fixed per-challenge hero slot today — adding one is a small but real scope addition to a scored, backend-integrated flow that deserves its own verification pass rather than a quick add alongside 10 other changes |
| CURING PROCESS.png, leaf sorting & Grading.png, tobacco aging.png, LEAF PROTECTION.png, LONG FILLER VS SHORT FILLER.png, EXPLODED WRAPPER -BINDER FILLEW VIEW.png, BINDER EXPERIENCE.png, BUNCHING METHODS.png (top-level, distinct from the moved `select-bunching-method.png`), FERMINATION PROCESS.png / 1.png | Group B — processing/curing sub-topics | WrapperStrength.jsx "processing" section (curing/fermentation/aging/grading — confirmed to exist by the Package 5 suite's own check: "UI: processing section shows curing/fermentation/aging/grading") | A second, real integration opportunity — same low-risk decorative-thumbnail pattern used for the rolling steps — but needs its own `step_key`-equivalent mapping investigation into `leafConstructionApiClient.js`'s processing-method keys, not done this pass |
| Quality- control Inspection.png, FIRST , SECOND & FINAL SCORING.png *(already moved to golden-box/ in Phase 1)* | Group D | Already handled | n/a |
| perfect pairing builder.png | Pairing Lab | PairingLab.jsx | `PairingLab.jsx` already has its own approved `pairingLab` art (protected); same BLOCKED_BY_HUMAN_VISUAL_CHOICE reasoning applies |
| the craft ecosystm.png | General/overview | No confirmed destination | NOT_APPLICABLE — no matching screen identified; needs product direction, not an engineering guess |

### LEGACY_REFERENCE / DUPLICATE_REPLACED (unchanged from Phase 1 — 14 files duplicating already-live
top-level production assets; not deleted, still flagged in place)

ACHIEVMENTS.png, AI SUMMARY.png, KNOWLEDGE CHECK.png/11.png, KNOWLEDGE DROP.png, LEADERBOARD.png/111.png/
leader board.png, LIGHTING TUTORIAL 1.png, MENTOR :COMMENTARY.png, Mini Tasting 11.png, REWARDS 222.png,
Recommend next journey.png, SMOKECRAFT CHALLENG.png, Venue Selection 11.png, personlized pairing 222.png,
smokecraft badges.png — unchanged from the Phase 1 inventory, no new findings this pass.

## Manifest totals

- Integrated Phase 1: 8
- Integrated Phase 2: 11 (10 rolling-process thumbnails + 1 ring-gauge background)
- Total integrated: 19
- Still unwired: 48 (2 duplicate-choice-blocked, ~13 human-visual-choice-blocked distinct screens
  covering ~20 files, ~14 legacy/duplicate flagged files, ~14 deferred-but-mapped files)
