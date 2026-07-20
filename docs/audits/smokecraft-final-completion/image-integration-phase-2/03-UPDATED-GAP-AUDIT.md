# Image Integration Phase 2 — Updated Gap Audit

Consolidates the mandate's `03-UPDATED-GAP-AUDIT.md`, `04-SC-ASSETS-CHANGE-MAP.md`, and
`05-PROTECTED-SCREEN-CHANGE-MAP.md` into one file (disclosed).

## SC_ASSETS change map

11 new keys added, all additive, none of the existing 63 keys modified:
`rollingStepPrepareLeaves`, `rollingStepArrangeFiller`, `rollingStepSelectBunching`,
`rollingStepApplyBinder`, `rollingStepMoldOrPress`, `rollingStepApplyWrapper`,
`rollingStepConstructCap`, `rollingStepFinishFoot`, `rollingStepInspectAndDrawTest`,
`rollingStepRestAndBoxAge`, `ringGaugeGuide`.

## Protected/near-protected screen change map

| Screen | Protection level | Prior state | Change made | Why necessary | Smallest-change confirmation | Regression test |
|---|---|---|---|---|---|---|
| `WrapperStrength.jsx` | Near-protected (real backend-integrated construction data, part of the locked sequence's supporting modules) | 10 rolling-process steps rendered as text-only list items, no imagery | Added a 44×44 decorative `MediaSlot` thumbnail per step, keyed off the existing `step.stepKey` — zero changes to state, API calls, or step logic | The step list was the single clearest 1:1 match between real uploaded content and a real, currently-unimaged, already-working screen | Diff is additive-only: one import line, one lookup map, one `<MediaSlot>` element inside the existing `<li>` — no existing JSX removed or restructured | `verify-golden-box-package-5-leaf-construction.mjs` (27/27) and `verify-golden-box-package-4-seed-soil.mjs` (17/17), both re-run clean |
| `CigarGaugeGuide.jsx` | Not protected (sub-step screen, no locked-sequence gating logic, no backend integration) | Generic non-topic-specific background (`cigars/robusto.jpg`) | Swapped the background URL for `SC_ASSETS.ringGaugeGuide` | Exact subject match, no prior dedicated art, no existing approved image to conflict with | One-line change | `npm run build` clean; manual load + screenshot confirmed correct render, no 404 |

No other protected or near-protected screen (Flavor Memory, Pairing Lab, Badges, Passport, Leaderboard,
GoldenBox.jsx, GoldenBoxStatus.jsx, Cutting, Lighting, Venue Management, `session.js`) was touched this
pass.

## Findings (post-Phase-2)

| # | Category | Severity | Route/Component | Asset | What's wrong | Why it matters | Required fix | Dependency | Recommended package |
|---|---|---|---|---|---|---|---|---|---|
| 1 | BLOCKED_BY_HUMAN_CHOICE | Medium | SeedSoil.jsx, FlavorMemory.jsx, MeetYourCigar.jsx, Scorecard.jsx, HumidorMatch.jsx, Connections.jsx, PairingLab.jsx, mentor selection | ~20 files (see manifest) | Uploaded images share a subject with already-live approved production art; unclear whether they're replacements, drafts, or unrelated reference material | Swapping without confirmation risks silently discarding an intentionally-chosen approved image | A human (the user) needs to say, per screen, "replace" or "not this one" | None technical — a decision, not code | A short, targeted "Phase 3: confirmed replacements" pass once the user reviews the list in `01-REMAINING-IMAGE-MANIFEST.md` |
| 2 | DUPLICATE_ASSET_CONFLICT | Low | Golden Box challenge card | golden-box-challenge.png / golden-box-challenge-alt.png | Two candidate images for one visual slot, unresolved since Phase 1 | Minor — only affects which challenge-card art displays | Human pick of primary | None | Any future Golden Box pass |
| 3 | UPLOADED_NOT_WIRED | Low | WrapperStrength.jsx processing section (curing/fermentation/aging/grading) | CURING PROCESS.png, FERMINATION PROCESS.png/1.png, tobacco aging.png, leaf sorting & Grading.png, LEAF PROTECTION.png, LONG FILLER VS SHORT FILLER.png, EXPLODED WRAPPER -BINDER FILLEW VIEW.png, BINDER EXPERIENCE.png, top-level BUNCHING METHODS.png | A second real, same-pattern integration opportunity identified but not executed this pass — needs the processing-method key map from `leafConstructionApiClient.js` confirmed first | Same value proposition as the rolling-step thumbnails, just not yet mapped | Map processing-method keys 1:1 to these images, same `MediaSlot` pattern | None blocking — straightforward follow-up |
| 4 | CHALLENGE_GAP | Low | LeafChallenge.jsx family | Filler Placement/Virtual Rolling/Wrapper Application Challenge.png, Choose Your Cut.png/11.png | Challenge screens have no fixed hero-art slot; adding one is a small scope addition to a scored flow that deserves its own verification | Currently text/data-only, functional | Add a hero slot + verify scoring flow unaffected | None blocking | Next SmokeCraft content pass |
| 5 | NEEDS_IMPROVEMENT | Low | Multiple filenames | Blend Fault Identifacaton 1.png / Indentification.png, FIRST , SECOND & FINAL SCORING.png (moved), FERMINATION, Juding, Predition, Indentification | Typos in uploaded filenames | Any alt-text/copy authored later should correct these, not copy verbatim | Correct spelling when eventually wired | Tied to items above | Same passes |
| 6 | NOT_APPLICABLE | Info | N/A | " the craft ecosystm.png" | No matching screen or route identified | Needs product direction | N/A | N/A | Product decision, not engineering |

No new `MISSING_IMAGE`, `WIRED_BUT_NONINTERACTIVE`, `WIRED_BUT_WEAK_EDUCATION`,
`BAD_RESPONSIVE_BEHAVIOR`, `ACCESSIBILITY_GAP`, `HOTSPOT_GAP`, `SC_ASSETS_GAP`, `QUIZ_GAP`, `XP_GAP`,
`MENTOR_GAP`, `GOLDEN_BOX_GAP`, `BADGE_GAP`, `REWARD_GAP`, `SKILL_TREE_GAP`, `COLLECTION_GAP`,
`RECOMMENDED_NEXT_JOURNEY_GAP`, or `RESULTS_GAP` findings were introduced by this pass's changes — both
integrated screens were verified decorative-only, accessible (`alt`/`decorative` set correctly on every
`MediaSlot`), and responsive (390×844 handheld confirmed clean).
