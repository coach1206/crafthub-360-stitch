# SmokeCraft Image Integration — Baseline, Inventory, and Normalization Map

**Consolidation notice**: this pass consolidates the mandate's Step 19 file list (00, 01, 02, 03) into
this single document, explicitly disclosed. `04-POST-INTEGRATION-GAP-AUDIT.md`,
`05-PROOF-SCREENSHOT-INDEX.md`, `06-ROLLBACK-PLAN.md`, and `07-IMAGE-INTEGRATION-COMPLETION-REPORT.md`
remain separate as named.

## Baseline

- Branch: `recovery/smokecraft-codex-final`
- Commit at start of this pass: `aa0b9cf8`
- **Critical discovery**: the images the user uploaded were not in the local working copy — they were
  sitting in 13 already-pushed commits on `origin/recovery/smokecraft-codex-final` (`54d678da` through
  `d09b63d7`, batch upload commits "Batch 111" through "BATCH 0333") that this session's local branch
  had not yet pulled. This is the **same branch**, not a different one — pulling it is a fast-forward,
  not a branch switch, reset, or restore. Verified no overlap between the incoming commits (81 pure
  image-file additions, zero code files) and this session's 211 uncommitted working-tree paths before
  fast-forwarding, then fast-forwarded (`git merge --ff-only`). One untracked local duplicate
  (`CRAFTHUB 360. VENUE TABLE EXPERIENCE.png`) was byte-identical (sha256 match) to the incoming
  tracked copy and was removed to allow the fast-forward — no unique content was lost.
- Commit after pulling: `d09b63d7`. Uncommitted-path count unchanged (211 → 211; one path resolved
  from untracked-duplicate to tracked-then-moved).
- Pre-existing asset folders: `public/assets/smokecraft/{optimized,source,golden-box,cropped,cigars}`,
  `public/assets/smokecraft-reference/{approved,rejected,batch-*}`. No `session-visuals` folder existed
  locally before the pull.
- Pre-existing registry: `src/constants/smokecraftAssets.js` (`SC_ASSETS`), already keying ~50
  approved production images by SmokeCraft session, mostly pointing at
  `public/assets/smokecraft/<filename>.png` (the "RAW" prefix).

## Uploaded asset discovery

The 13 pulled commits added **81 new image files**:
- 66 files into a new `public/assets/smokecraft/session-visuals/` folder
- 13 files directly into `public/assets/smokecraft/` (top level)
- 2 files elsewhere (`public/assets/CRAFTHUB 360. VENUE TABLE EXPERIENCE.png`, a Venue-related image
  outside SmokeCraft scope, and one duplicate of a top-level file)

### Classification

**DUPLICATE_REPLACED** (already-active production assets, session-visuals copy is redundant) — 14
files with identical or near-identical filenames already referenced live in `SC_ASSETS` pointing at the
top-level `public/assets/smokecraft/` copy: `ACHIEVMENTS.png`, `AI SUMMARY.png`,
`KNOWLEDGE CHECK.png`/`KNOWLEDGE CHECK 11.png`, `KNOWLEDGE DROP.png`, `LEADERBOARD.png`/
`LEADERBOARD 111.png`/`leader board.png`, `LIGHTING TUTORIAL 1.png`, `MENTOR :COMMENTARY.png`,
`Mini Tasting 11.png`, `REWARDS 222.png`, `Recommend next journey.png`, `SMOKECRAFT CHALLENG.png`,
`Venue Selection 11.png`, `personlized pairing 222.png`, `smokecraft badges.png`. **Not deleted** —
flagged in place per the "do not blindly delete" rule; the top-level copies remain the single active
production source referenced by `SC_ASSETS`.

**ACTIVE_PRODUCTION — moved and wired this pass** (8 files, Golden Box production set, see the
normalization map below) — these had no prior production home and no `SC_ASSETS` key; Package 7A's
judging/mentor/results screens (built the previous pass, zero images until now) were the clearest,
lowest-risk, highest-value integration target this pass controls end-to-end.

**HOLD_FOR_REVIEW — inventoried, registered nowhere yet, not wired this pass** (remaining ~59 files):
genuine new educational content for the Leaf-to-Cigar construction sequence (`APPLYING THE BINDER`,
`APPLYING THE WRAPPER`, `BINDER EXPERIENCE`, `BUNCHING METHODS`, `Bunching Method selection`,
`CIGAR ANTOMY`, `EXPLODED WRAPPER -BINDER FILLEW VIEW`, `FERMINATION PROCESS`/`1`,
`FILLER EXPERIENCE`, `FINAL ESTING & BOXING`, `FORMING THE CAP`, `MOLDING & PRESSING`,
`RING GAUGE GUIDE`, `SOIL TYPES`, `STRENGTH VS BODY`, `TERROIR & GROWING REGION MAP`,
`Tobacco Plant ANatomy 2`, `Tobacco Seed Genetics`, `VITOLA & SHAPE GUIDE`, `LEAF PROTECTION`,
`LONG FILLER VS SHORT FILLER`, `CURING PROCESS`, `leaf sorting & Grading`, `tobacco aging`), the
tasting/sensory sequence (`Palate Calibration`, `Quality- control Inspection`, `QUALITY CONTROL`,
`Blend Fault Identifacaton 1`/`Indentification` [duplicate pair], `BLIND TASTING CHALLENGE`,
`Bllind Tasting Round`, `Draw And Burn Predition`, `FINISHING THE FOOT`, `Pre ligh evaluation`,
`BURN PROBLEMS`, `COMPLETE FLAVOR WHEEL`, `SMOKING TECHNIQUES`, `Leaf Comparison`), construction
challenges (`Filler Placement Challenge`, `Virtual Rolling Challenge`, `Wrapper Application Challenge`,
`CHOOSE YOUR CUT`/`choose your cut 11` [duplicate pair]), mentor visuals
(`MARCO RODRIGUEZ MENTOR`, `MEET YOUR MENTORS`), and general SmokeCraft visuals
(`HOW IT WORKS`, `HUMIDOR MATCH`, `CONNECTIONS`, `SMOKECRAFT LANDING PAGE`,
`perfect pairing builder`, ` the craft ecosystm`). None of these have a `SC_ASSETS` key yet and none
are wired into any screen. See `04-POST-INTEGRATION-GAP-AUDIT.md` for the honest disclosure and
per-item recommended destination.

## Normalization map (Golden Box production set — the only files renamed/moved this pass)

| Original path | New production path | SC_ASSETS key |
|---|---|---|
| `session-visuals/Golden Box challenge.png` | `golden-box/golden-box-challenge.png` | `goldenBoxChallenge` |
| `session-visuals/real golen box challenge.png` | `golden-box/golden-box-challenge-alt.png` | *(not registered — near-duplicate of the above, HOLD_FOR_REVIEW)* |
| `session-visuals/JC GOLDEN BOX.png` | `golden-box/golden-box-judging-criteria.png` | `goldenBoxJudgingCriteria` |
| `session-visuals/Pairing Defense.png` | `golden-box/golden-box-pairing-defense.png` | `goldenBoxPairingDefense` |
| `session-visuals/Blend Revision Round.png` | `golden-box/golden-box-blend-revision-round.png` | `goldenBoxBlendRevisionRound` |
| `session-visuals/Presenation revison Round.png` | `golden-box/golden-box-presentation-revision-round.png` | `goldenBoxPresentationRevision` |
| `session-visuals/Master Blending Education.png` | `golden-box/golden-box-master-blending-education.png` | `goldenBoxMasterBlendingEducation` |
| `public/assets/smokecraft/Final Juding Rubic.png` | `golden-box/golden-box-final-judging-rubric.png` | `goldenBoxFinalJudgingRubric` |
| `public/assets/smokecraft/FIRST , SECOND  & FINAL SCORING.png` | `golden-box/golden-box-scoring-rounds.png` | `goldenBoxScoringRounds` |

All moves used `git mv` (history-preserving). No existing reference broke — none of these 9 files were
referenced by any component before this pass (verified: zero `grep` hits for the old filenames anywhere
in `src/`), so there was nothing to update.

`golden-box-challenge-alt.png` is intentionally left unregistered — it is a probable near-duplicate of
`golden-box-challenge.png` (same subject, different composition) and needs a one-time human choice of
which is the primary card art; flagged `HOLD_FOR_REVIEW`, not silently discarded.
