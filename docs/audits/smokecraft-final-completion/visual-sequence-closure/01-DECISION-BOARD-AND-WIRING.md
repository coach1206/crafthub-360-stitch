# Visual Sequence Closure — Decision Board and Wiring

## What was wired this pass (provable, not a guess)

**Processing-section 4-topic thumbnail strip** — `WrapperStrength.jsx`'s existing "Curing, Fermentation,
Aging & Grading" section (a real, previously-identified gap from Image Integration Phase 2's own gap
audit item #3) now shows 4 real thumbnails — Curing, Fermentation, Aging, Grading — one per named
sub-topic. This is not a duplicate-choice situation: each image names a distinct real sub-topic within
the single merged section, so using all 4 (rather than picking one) is the correct, non-guessing
resolution.

| Image | New path | SC_ASSETS key |
|---|---|---|
| CURING PROCESS.png | leaf-construction/curing-process.png | processingCuring |
| FERMINATION PROCESS.png | leaf-construction/fermentation-process.png | processingFermentation |
| tobacco aging.png | leaf-construction/final-resting-aging.png | processingAging |
| leaf sorting & Grading.png | leaf-construction/sorting-and-grading.png | processingGrading |

## Golden Box challenge-art duplicate — resolved deterministically

Per Phase 9's rule ("only require human choice when source history does not prove the intended
winner"): checked git commit history for both files at their original upload paths.

- `Golden Box challenge.png` → committed in `1ab0c05b` ("BATCH 777"), 2026-07-20 16:14:05
- `real golen box challenge.png` → committed in `db00992f` ("BATCH888"), 2026-07-20 16:15:34 — **89
  seconds later, same upload session**, and its filename explicitly self-identifies as "real" — the
  standard signal for a same-session correction superseding an immediately-prior draft.

**Resolution**: `SC_ASSETS.goldenBoxChallenge` now points at the later file
(`golden-box-challenge-alt.png`, registered under its existing filename, not renamed to avoid
disk-history confusion). The earlier file (`golden-box-challenge.png`) remains on disk, unregistered,
not deleted — a `LEGACY_REFERENCE`, exactly as instructed. Neither file is rendered twice; the registry
key resolves to exactly one file. **Not yet wired to a screen** — no component currently references
`SC_ASSETS.goldenBoxChallenge` (registered in Phase 1 but never actually consumed) — the resolution is
correct and ready for whenever a future pass adds a Golden Box challenge card to a screen.

## Remaining genuine human-choice conflicts (unchanged from Image Integration Phase 2's own findings —
not re-litigated, because nothing new was learned about them this pass)

| Screen | Conflict | Why it's genuinely a human choice (not provable from source) |
|---|---|---|
| SeedSoil.jsx | `SOIL TYPES.png`/`Tobacco Seed Genetics.png`/`TERROIR & GROWING REGION MAP.png` vs. already-live `seedSoil`/`terroir`/`terroirSoil` art | These are same-subject uploads with no upload-order or naming signal indicating "replacement" (unlike the Golden Box pair) — could be alternate compositions, earlier drafts, or unrelated reference art |
| FlavorMemory.jsx | `COMPLETE FLAVOR WHEEL.png`, `SMOKING TECHNIQUES.png`, `BURN PROBLEMS.png` vs. live `flavorMemory` art | Same reasoning |
| MeetYourCigar.jsx / Format.jsx | `CIGAR ANTOMY.png`, `VITOLA & SHAPE GUIDE.png`, `STRENGTH VS BODY.png` vs. live art | Same reasoning |
| Scorecard.jsx | `Palate Calibration.png`, `Blend Fault Identifacaton 1.png`/`Indentification.png`, `BLIND TASTING CHALLENGE.png`, `Bllind Tasting Round.png`, `Draw And Burn Predition.png`, `Pre ligh evaluation.png` vs. live `scorecard` art | Same reasoning |
| HumidorMatch.jsx / Connections.jsx / landing | `HOW IT WORKS.png`, `HUMIDOR MATCH.png`, `CONNECTIONS.png`, `SMOKECRAFT LANDING PAGE.png` vs. live art | Same reasoning |
| Mentor selection | `MARCO RODRIGUEZ MENTOR.png`, `MEET YOUR MENTORS.png` vs. the existing mentor-roster `directSrc` mechanism | Wiring these could create a second, conflicting source of mentor art |

**Recommendation for each**: since none carry a provable "this supersedes that" signal the way the
Golden Box pair did, presenting these to the user as a simple visual side-by-side (old vs. new) would
let a human resolve all ~20 in one short review — the single highest-leverage next step for closing the
remaining visual gap.

## Deferred, mapped, not yet wired (real content, no conflict, just not yet executed)

Construction challenge hero art (`Filler Placement Challenge.png`, `Virtual Rolling Challenge.png`,
`Wrapper Application Challenge.png`, `CHOOSE YOUR CUT.png`/`choose your cut 11.png`) — mapped to the
`LeafChallenge*.jsx` family per Image Integration Phase 2's own finding #4; not wired this pass because
adding a hero-art slot to a scored, backend-integrated challenge flow deserves its own verification pass
(same reasoning Phase 2 gave, still valid, not re-litigated).

`LEAF PROTECTION.png`, `LONG FILLER VS SHORT FILLER.png` — construction-topic images without a clearly
identified single-topic destination distinct from the already-wired rolling-process/processing
sections; genuinely `UPLOADED_NOT_WIRED` pending a specific screen/section match.

`" the craft ecosystm.png"` — no matching screen identified, `NOT_APPLICABLE`, needs product direction
(unchanged from Image Integration Phase 2).
