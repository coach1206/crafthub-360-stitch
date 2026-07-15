# SmokeCraft 360 — Master Rebuild Plan

**Status:** Planning document only. No application code, routes, components, images, or database files were changed to produce this plan.
**Source of truth:** `docs/SMOKECRAFT_360_MASTER_AUDIT.md` + the user-approved 27-session SmokeCraft 360 Master Journey specification.
**Repo:** coach1206/crafthub-360-stitch
**Branch:** recovery/smokecraft-codex-final
**HEAD at planning time:** `87fd5be7a87e47f51a68c272ae635d8bb07b4a1f`

> **Revision notice:** This version corrects the master-journey decision in the prior revision of this document, which incorrectly treated the repository's current 24-session/8-visit implementation as the target structure. The current 24-session structure is the *existing implementation*, not the *product requirement*. The product requirement is the user-approved 27-session SmokeCraft 360 Master Journey below. This plan now locks to 27 and maps every existing screen, route, component, and asset onto it — treating gaps as work to build, not as evidence the requirement doesn't apply.

---

## 1. Executive Summary

The audit (`docs/SMOKECRAFT_360_MASTER_AUDIT.md`) found a codebase with 19 genuinely interactive, canonically-persisted core screens, 17 static-stub or placeholder screens, 8 residual persistence shadow-keys, three route-correctness bugs, and ~100+ orphaned image files. That inventory remains fully valid and is reused throughout this plan. What changes in this revision is the target structure those findings are mapped against: not the current 24-session/8-visit implementation, but the **locked 27-session SmokeCraft 360 Master Journey**, organized into 7 phases plus a 5-screen Entry/Authentication layer that sits in front of it.

Most of the 24 existing sessions map directly or with light modification onto the 27-session spec. A minority require splitting (CutToastLight → Choose Your Cut + Lighting Tutorial), merging (SeedSoil → folded into Terroir; several existing supplemental education stubs → folded into one Knowledge Drop session), or reclassification from "main journey" to "supporting module" (GoldenBox, RequestPurchase, SmokeCraftChallenge, MiniTastingRound, SecondHumidorMatch, Connections, ManagementSync, Leaderboard, EventChallenge, HowItWorks, Assistant, Scan, GuestPass). A genuine set of new sessions has no existing analog at all (Meet Your Cigar, Mentor Commentary, Knowledge Drop as a unified experience, AI Summary, Personalized Pairing Recommendations as a results screen, Rewards & Achievements, Recommended Next Journey, plus the Entry/Authentication layer's Venue Select and Resume screens).

Per the mandate's explicit instruction, this plan does **not** force one screen per session where a session represents an additional interaction stage within an existing flow — several adjacent sessions are combined into a single screen using tabs/panels (e.g., Sessions 8–9, 16–18, 19–20, 25–26), which keeps the main-journey **screen** count below the **session** count without violating the locked 27-session sequence.

---

## 2. Audit Findings Used

All findings from `docs/SMOKECRAFT_360_MASTER_AUDIT.md` remain the factual basis for this plan — the audit describes what exists in the repository today; this plan describes how that inventory maps onto the locked 27-session target. Specifically reused without re-verification:

- Route table, aliases, duplicate guards → Audit §2, §5
- Asset inventory & duplicates → Audit §3, §5
- Screen/component catalog, static-only screens, orphaned components → Audit §4, §6
- Persistence shadow keys → Audit §8
- Missing controls, education, AI, quizzes/XP/rewards, missing states → Audit §9–§14
- Existing screen counts (19 reusable / 17 static-stub) → Audit §15
- Full current-state screen table → Audit §16

---

## 3. Master Journey Decision

### 3a. Locked Final Master Journey (27 sessions, 7 phases, + 5-screen Entry layer)

| Phase | Session | Title |
|---|---|---|
| Entry/Auth (not counted in the 27) | E1 | Launch Screen |
| Entry/Auth | E2 | Sign In / Guest Mode |
| Entry/Auth | E3 | Select Venue or Lounge |
| Entry/Auth | E4 | Personal Dashboard |
| Entry/Auth | E5 | Resume or Start New Journey |
| 2 — Session Preparation | S1 | Welcome to Today's Experience |
| 2 | S2 | Choose Your Cigar |
| 2 | S3 | Meet Your Cigar |
| 2 | S4 | Terroir |
| 2 | S5 | Construction Inspection |
| 2 | S6 | Choose Your Cut |
| 2 | S7 | Lighting Tutorial |
| 3 — First Third | S8 | First Draw |
| 3 | S9 | Flavor Discovery |
| 3 | S10 | Flavor Memory Exercise |
| 3 | S11 | Suggested Pairings |
| 4 — Second Third | S12 | Flavor Evolution |
| 4 | S13 | Construction Check |
| 4 | S14 | Mentor Commentary |
| 4 | S15 | Knowledge Drop |
| 5 — Final Third | S16 | Flavor Finish |
| 5 | S17 | Strength Progression |
| 5 | S18 | Overall Experience Notes |
| 6 — Reflection | S19 | Rate Every Category |
| 6 | S20 | Personal Notes |
| 7 — Results | S21 | AI Summary |
| 7 | S22 | Personalized Pairing Recommendations |
| 7 | S23 | Passport Stamp Animation |
| 7 | S24 | Completed Scorecard |
| 7 | S25 | Rewards and XP |
| 7 | S26 | Achievements |
| 7 | S27 | Recommended Next Journey |

This is the **locked final journey**. It is not a synthesis or compromise with the current 24-session implementation — it is the target, and the current implementation is evaluated against it.

### 3b. Existing-to-new session mapping

| New session | Existing session/screen | Mapping type |
|---|---|---|
| E1 Launch Screen | current S1 (`/smokecraft` landing, SmokeCraft.jsx) | Reuse, rename role to "Entry" layer |
| E2 Sign In / Guest Mode | current S2 (Enroll.jsx) | Reuse, rename |
| E3 Select Venue or Lounge | *(none)* | **Missing — create** |
| E4 Personal Dashboard | Identity.jsx (currently co-guarded as S2) | Reuse, rename, and resolve its duplicate-guard bug (Audit §5) as part of the move |
| E5 Resume or Start New Journey | *(no dedicated screen; resume logic exists in `SmokeCraftProgressContext`)* | **Missing screen — create**, wrapping existing (already-correct) resume logic |
| S1 Welcome to Today's Experience | *(none directly; closest is GoldenBox's rules framing)* | **Missing — create**; GoldenBox becomes a supporting module reachable from here, not this session itself |
| S2 Choose Your Cigar | current S9 (HumidorMatch.jsx) | Reuse, rename, move earlier in sequence |
| S3 Meet Your Cigar | *(none as a screen; `CigarIntelligencePanel` component already exists and is active per Audit §4c)* | **Create** screen, reusing the existing panel component; current Mentor-selection (S4) folds in here as a tab |
| S4 Terroir | current Terroir.jsx (unguarded `ComingSoon` stub) | **Update/create real content**; current SeedSoil (S7) merges in as a tab (seed/soil is thematically terroir) |
| S5 Construction Inspection | current Format.jsx (S5) + CigarGaugeGuide.jsx | Reuse Format's shape/size logic, merge CigarGaugeGuide content in as a tab, rename session |
| S6 Choose Your Cut | current CutToastLight.jsx (S11), cut portion only | **Split** — cut selection becomes its own session/screen |
| S7 Lighting Tutorial | current CutToastLight.jsx (S11), toast+light portion | **Split** — toast/light becomes its own session/screen |
| S8 First Draw | current FirstThird.jsx (S12) | Reuse; combined into one screen with S9 via tabs (not forced into 2 screens) |
| S9 Flavor Discovery | *(currently folded into FirstThird's existing notes/selection controls)* | Reuse as a tab within the same FirstThird screen |
| S10 Flavor Memory Exercise | current FlavorMemory.jsx (S14) | Reuse, move earlier in sequence |
| S11 Suggested Pairings | current PairingLab.jsx (S8) | Reuse, move later in sequence |
| S12 Flavor Evolution | current SecondThird.jsx (S13) | Reuse |
| S13 Construction Check | *(none)* | **Create** as a tab within the same screen as S12, reusing Format/CigarGaugeGuide-style inspection controls |
| S14 Mentor Commentary | *(none — current Mentor.jsx is a selection screen, not a commentary/tip screen)* | **Create**, fed by the mentor chosen in S3 |
| S15 Knowledge Drop | current Origins.jsx, Vitola.jsx, PairingMastery.jsx, FlavorDNA.jsx (all `ComingSoon`/image-only stubs) | **Merge** all four into one tabbed Knowledge Drop screen rather than 4 separate main-journey screens |
| S16 Flavor Finish | current FinalThird.jsx (S15) | Reuse; combined with S17/S18 in one screen via tabs |
| S17 Strength Progression | *(none)* | **Create** as a tab within the same screen as S16 |
| S18 Overall Experience Notes | *(reuses the existing personal-notes textarea pattern already used across FirstThird/SecondThird/FlavorMemory)* | **Create** as a tab within the same screen, reusing the established notes-field pattern |
| S19 Rate Every Category | current Scorecard.jsx (S16) | Reuse |
| S20 Personal Notes | current Scorecard.jsx already has a `personalNotes` field | **Merge** into the same Scorecard screen as a section, not a separate screen |
| S21 AI Summary | *(none — no AI feature exists, Audit §11)* | **Create**, subject to the AI Plan decision gate (§21) |
| S22 Personalized Pairing Recommendations | current PairingLab.jsx's `buildRecommendation` logic (Audit §14 confirms this is real rule-based logic) | **Create** a distinct results-recap screen that *reuses* the existing recommendation logic rather than re-deriving it |
| S23 Passport Stamp Animation | current PassportStamp.jsx (S21) | Reuse |
| S24 Completed Scorecard | current FinalReview.jsx (S20) | **Merge** — FinalReview becomes the read-only completed-scorecard recap rather than a separate readiness-checklist screen |
| S25 Rewards and XP | *(none — confirmed missing in Audit §12)* | **Create** (same net-new Rewards page identified in the audit) |
| S26 Achievements | *(none)* | **Create** as a tab within the same Rewards screen, not a separate screen |
| S27 Recommended Next Journey | current SessionComplete.jsx (S24) | **Merge** — SessionComplete's completion framing extends into a "what's next" recommendation rather than being replaced |

### 3c. Sessions renamed (same underlying screen, new session identity/number)

HumidorMatch (old S9 → new S2), Mentor selection (old S4 → folds into new S3 as a tab), PairingLab (old S8 → new S11), FlavorMemory (old S14 → new S10), Format (old S5 → new S5, renamed "Construction Inspection"), Enroll (old S2 → E2), Identity (old co-guarded S2 → E4), SmokeCraft landing (old S1 → E1).

### 3d. Sessions merged

- SeedSoil (old S7) → merges into Terroir (new S4) as a tab.
- CigarGaugeGuide → merges into Construction Inspection (new S5) as a tab.
- Origins, Vitola, PairingMastery, FlavorDNA (4 stub screens) → merge into one Knowledge Drop screen (new S15).
- FinalReview (old S20) → merges into Completed Scorecard (new S24) as its live content source.
- SessionComplete (old S24) → merges into Recommended Next Journey (new S27).
- Scorecard's existing `personalNotes` field → absorbs new S20 Personal Notes rather than spawning a separate screen.

### 3e. Sessions split

- CutToastLight (old S11) → splits into Choose Your Cut (new S6) and Lighting Tutorial (new S7), since the new spec treats cut selection and the lighting tutorial as two distinct sessions with two distinct pieces of content (cut technique vs. toast/light technique).

### 3f. Sessions/screens missing entirely (must be created)

E3 Select Venue or Lounge, E5 Resume or Start New Journey, S1 Welcome to Today's Experience, S3 Meet Your Cigar (screen wrapper; component exists), S13 Construction Check (as new tab content), S14 Mentor Commentary, S17 Strength Progression (as new tab content), S18 Overall Experience Notes (as new tab content, reusing existing notes pattern), S21 AI Summary, S22 Personalized Pairing Recommendations (as a distinct results screen; underlying logic exists), S25 Rewards and XP, S26 Achievements (as new tab content).

### 3g. Existing sessions that become supporting modules (not part of the 27-session spine)

GoldenBox (old S3) — becomes a supporting rules/orientation module reachable from S1 Welcome, not a numbered session itself.
RequestPurchase (old S10) — becomes an embedded ordering drawer/panel reachable from S2 Choose Your Cigar, per the mandate's instruction to "use live React panels, tabs, overlays, drawers, and dynamic zones where they provide a cleaner experience" rather than a standalone numbered session.
SmokeCraftChallenge (old S17), SecondHumidorMatch (old S18), MiniTastingRound (old S19) — become optional supporting-module side-experiences reachable from Recommended Next Journey (new S27), not required numbered sessions in the core 27.
Connections (old S22), ManagementSync (old S23) — become supporting modules reachable post-journey (social/venue-ops), consistent with their current non-tasting-flow content.
Leaderboard, EventChallenge, HowItWorks, Assistant, Scan, GuestPass — remain supporting modules, as in the prior audit's classification; unchanged by the journey renumbering.

### 3h. Recommendation

**Locked final journey: 27 sessions, 7 phases, plus a 5-screen Entry/Authentication layer (32 numbered checkpoints total, 27 of which are the "Master Journey" proper).**

This does not minimize rebuilding by *avoiding* the 27-session structure — it minimizes rebuilding *within* the locked 27-session structure by:
- Reusing all 14 of the existing screens whose content already matches a new session's intent, without rebuilding their working interaction logic (only renaming/reordering/re-routing them).
- Using tabs/panels to satisfy sessions that represent an additional interaction stage of an existing flow (S9 within S8's screen, S13 within S12's screen, S17/S18 within S16's screen, S20 within S19's screen, S26 within S25's screen) rather than inflating the screen count 1:1 with the session count, per the mandate's explicit instruction.
- Converting existing static-stub screens (Origins/Vitola/PairingMastery/FlavorDNA, GoldenBox, SmokeCraftChallenge, MiniTastingRound, SecondHumidorMatch) into either real Knowledge Drop content or supporting modules, so no static-stub screen is silently kept in its current non-functional state.
- Treating every currently "missing" 27-session item as a **build gap**, not a reason to fall back to 24 — consistent with this revision's explicit correction.

---

## 4. Final Recommended Journey

27 sessions across 7 phases, preceded by a 5-screen Entry/Authentication layer (E1–E5). See §3a.

## 5. Final Recommended Main-Screen Count

**21 main-journey screens** covering all 27 sessions (several sessions share a screen via tabs, per §3h) **+ 5 Entry/Authentication screens = 26 total spine screens.**

Screen-to-session breakdown:
S1(1) · S2(1) · S3(1) · S4(1) · S5(1) · S6(1) · S7(1) · S8+S9(1) · S10(1) · S11(1) · S12+S13(1) · S14(1) · S15(1) · S16+S17+S18(1) · S19+S20(1) · S21(1) · S22(1) · S23(1) · S24(1) · S25+S26(1) · S27(1) = **21 screens / 27 sessions**, plus E1–E5 = **5 screens / 5 entries**. Total = **26**.

## 6. Final Recommended Supporting-Module Count

**13** — GoldenBox, RequestPurchase, SmokeCraftChallenge, SecondHumidorMatch, MiniTastingRound, Connections, ManagementSync, Leaderboard, EventChallenge, HowItWorks, Assistant, Scan, GuestPass.

---

## 7. Existing Screens Reused (14)

HumidorMatch (→S2), PairingLab (→S11), FlavorMemory (→S10), Format (→S5, +CigarGaugeGuide merged), SecondThird (→S12, +new S13 tab), FirstThird (→S8, +new S9 tab), FinalThird (→S16, +new S17/S18 tabs), Scorecard (→S19, +new S20 section), PassportStamp (→S23), FinalReview (→S24, repurposed as read-only recap), Mentor (→folds into S3 as a tab), SmokeCraft landing (→E1), Enroll (→E2), Identity (→E4).

## 8. Existing Screens Updated (persistence-only, independent of renumbering)

Connections, GoldenBox, Identity, Scorecard, FinalThird, FlavorMemory, PassportStamp, SessionComplete — same 8-screen shadow-key elimination identified in Audit §8, now layered onto their new session identities from §3b/§3c. This work is renumbering-agnostic and should not be re-scoped by the journey correction.

## 9. Screens Merged

SeedSoil→Terroir(S4), CigarGaugeGuide→Construction Inspection(S5), Origins+Vitola+PairingMastery+FlavorDNA→Knowledge Drop(S15), FinalReview→Completed Scorecard(S24), SessionComplete→Recommended Next Journey(S27), Scorecard's existing notes field→Personal Notes(S20).

## 10. Screens Split

CutToastLight → Choose Your Cut(S6) + Lighting Tutorial(S7).

## 11. Screens Redesigned

SmokeCraftChallenge, MiniTastingRound (now supporting modules, still need conversion from static stub to real interactive content before they're worth surfacing from Recommended Next Journey), Leaderboard, EventChallenge — same redesign need as identified in the audit, now scoped as supporting-module work rather than in-spine work.

## 12. New Screens Required (10)

E3 Select Venue or Lounge, E5 Resume or Start New Journey, S1 Welcome to Today's Experience, S3 Meet Your Cigar, S14 Mentor Commentary, S15 Knowledge Drop (net-new *screen*, even though its content sources are merged-in stubs), S21 AI Summary, S22 Personalized Pairing Recommendations, S25/S26 Rewards and Achievements, and the merge target for S13/S17/S18/S20/S24/S27 count as *new tab content within reused screens*, not new screens — see §5's screen-count math, which already reflects this distinction.

## 13. New Visual Assets Required

- Likely new: Welcome (S1), Meet Your Cigar (S3), Mentor Commentary (S14), AI Summary (S21), Rewards/Achievements (S25/S26), Venue Select (E3), Resume (E5) — background artwork does not yet exist for these under any current SC_ASSETS key.
- Likely reusable without new photography: Knowledge Drop (S15) can probably reuse existing orphaned assets already sitting unreferenced in `public/*.png` (`smokecraft-origins.png`, `smokecraft-terroir.png`, etc., per Audit §3) rather than requiring net-new commissioned art — this should be confirmed screen-by-screen during Phase 5 (Dynamic Visual System), not assumed.
- Personalized Pairing Recommendations (S22) can likely reuse PairingLab's existing background/visual language since it's a results view of the same domain.

## 14. Missing Routes Required

`/smokecraft/venue-select` (E3), `/smokecraft/resume` (E5), `/smokecraft/welcome` (S1), `/smokecraft/choose-cigar` (S2, replaces/renames `humidor-match`), `/smokecraft/meet-your-cigar` (S3), `/smokecraft/terroir` (S4, already exists as a route, needs real content + SeedSoil merge), `/smokecraft/construction-inspection` (S5, replaces/renames `format`), `/smokecraft/choose-cut` (S6, new — split from `cut-toast-light`), `/smokecraft/lighting-tutorial` (S7, new — split from `cut-toast-light`), `/smokecraft/first-draw` (S8/S9, replaces/renames `first-third`), `/smokecraft/flavor-memory` (S10, unchanged), `/smokecraft/suggested-pairings` (S11, replaces/renames `pairing-lab`), `/smokecraft/flavor-evolution` (S12/S13, replaces/renames `second-third`), `/smokecraft/mentor-commentary` (S14, new), `/smokecraft/knowledge-drop` (S15, new), `/smokecraft/final-third` (S16/S17/S18, unchanged route, expanded content), `/smokecraft/scorecard` (S19/S20, unchanged route, expanded content), `/smokecraft/ai-summary` (S21, new), `/smokecraft/pairing-recommendations` (S22, new), `/smokecraft/passport-stamp` (S23, unchanged), `/smokecraft/completed-scorecard` (S24, replaces/renames `final-review`), `/smokecraft/rewards` (S25/S26, new — same page previously identified as missing in the audit), `/smokecraft/next-journey` (S27, replaces/renames `session-complete`).

**Route-renaming caution:** several of the above are proposed renames of existing, working routes (`humidor-match`→`choose-cigar`, `format`→`construction-inspection`, `first-third`→`first-draw`, `pairing-lab`→`suggested-pairings`, `second-third`→`flavor-evolution`, `final-review`→`completed-scorecard`, `session-complete`→`next-journey`). Renaming a working route has real risk (external links, bookmarks, analytics continuity) — this plan recommends keeping the **existing route paths** as the actual URLs and only changing the **session number/label/order** they're gated under, unless product explicitly requires URL changes too. This is flagged as a decision point for Package B (§27), not assumed here.

---

## 15. Route Correction Plan

Unchanged from the audit's original 3 findings — these are correctness bugs independent of journey renumbering and should be fixed regardless of which session-count decision governs the rest of the plan:

| Issue | Fix |
|---|---|
| `identity` and `enroll` both guarded as old Session 2 | Resolved naturally by the new mapping — Identity becomes E4 (Personal Dashboard), Enroll becomes E2 (Sign In/Guest Mode); they no longer share a gate once each has its own Entry-layer position |
| `shape-size-burn` duplicates `format` | Make `shape-size-burn` a `Navigate` alias to whatever the final Construction Inspection (S5) route is |
| `smokecraft/session-1..session-4` collapse to `/smokecraft` regardless of target | Route each to the guest's actual current position in the new 27-session sequence, or remove if unused externally |

Additionally, per §14, the route-renaming decision (keep existing URLs vs. rename to match new session titles) must be locked before Package B begins.

---

## 16. Persistence Consolidation Plan

Unchanged in substance from the prior plan — the shadow-key elimination work (Audit §8) is independent of session renumbering. What changes is that the canonical journey context needs new fields for the genuinely new sessions:

**Shadow keys to eliminate** (same 8 files as before): Connections, GoldenBox, Identity, Scorecard, FinalThird, FlavorMemory, PassportStamp, SessionComplete.

**New canonical journey fields required** (superset of the prior plan's list, expanded for the 27-session content):
- `venueSelection` (E3), `dashboardState` (E4, if distinct from Identity), `welcomeAcknowledged` (S1), `meetYourCigar` (S3), `terroir` (S4, absorbing old `seedSoil`), `constructionInspection` (S5, replaces `format` conceptually — recommend keeping `format` field name for backward compatibility and adding new fields alongside it rather than renaming, per the STATE_VERSION migration discipline below), `chooseYourCut` + `lightingTutorial` (S6/S7, split from `cutToastLight`), `flavorDiscovery` (S9, new sub-field of `firstThird`), `constructionCheck` (S13, new sub-field of `secondThird`), `mentorCommentary` (S14), `knowledgeDrop` (S15), `strengthProgression` + `overallExperienceNotes` (S17/S18, new sub-fields of `finalThird`), `personalNotes` (S20 — reuse `scorecard.personalNotes`, already exists), `aiSummary` (S21), `pairingRecommendations` (S22, distinct from `journey.pairing`), `rewards` + `achievements` (S25/S26), `nextJourney` (S27).

**STATE_VERSION:** bump 2→3 (already planned in the prior version) must now also carry forward `journey.format`→construction-inspection and `journey.pairing`/`journey.selectedCigar`→choose-your-cigar mappings so that in-progress guest sessions under the old 24-session field names are not silently lost when the new fields are introduced. This migration requirement is larger than the prior plan anticipated and should be scoped as its own sub-task within Package A.

**Backward compatibility principle:** do not rename existing canonical field names (`journey.format`, `journey.pairing`, `journey.selectedCigar`, etc.) purely to match new session titles — add new fields for genuinely new content, and reuse existing fields under their existing names where the underlying data is the same thing with a new session label. This avoids an unnecessary, purely-cosmetic migration burden.

---

## 17. Live Interface Conversion Plan

Unchanged in principle from the prior plan (Permanent Live Interface Directive applies identically), now scoped to the 26 spine screens (§5) and 13 supporting modules (§6):

For every screen, separate static background artwork / approved photography / replaceable image zones / live React controls / live data / persistent user state / API-DB data, exactly as specified in the Directive. No screen may bake user data, scores, XP, rankings, selections, or AI output into static image content.

**New emphasis from this revision:** the tabbed/panel-merged screens (S8+S9, S12+S13, S16+S17+S18, S19+S20, S25+S26) must each render their constituent sessions as genuinely separate, independently-testable live panels within the shared screen — not as one undifferentiated blob. Each sub-session's live data must be independently verifiable in Phase 12 testing (§29) even though they share a route/component shell.

---

## 18. Dynamic Visual System Plan

Unchanged in principle from the prior plan. Newly relevant per this revision:
- Knowledge Drop (S15) should attempt to reuse the orphaned `public/*.png` education-adjacent images identified in Audit §3 before requesting new photography.
- Mentor Commentary (S14) should reuse the existing per-mentor imagery already defined in Mentor.jsx's `MENTOR_ZONES` data (mentor portraits/origin info) rather than commissioning new mentor art.
- AI Summary (S21) and Personalized Pairing Recommendations (S22) are primarily data/text-driven results screens — they need a results-panel visual treatment consistent with the existing gold/dark theme, not necessarily new background photography at all.

---

## 19. Missing Screen Plan

Superseded by §12 (New Screens Required) and §3f — this section is retained for structural parity with the required-output list but points to those sections rather than duplicating them.

---

## 20. Education and Quiz Plan

- Knowledge Drop (S15) consolidates Origins/Terroir(partially, since Terroir is its own session S4)/Vitola/PairingMastery/FlavorDNA content. Note: Terroir is *its own numbered session* (S4) in the locked journey, so it is **not** folded into Knowledge Drop — only Origins, Vitola, PairingMastery, and FlavorDNA merge into S15. This corrects an internal consistency risk: Terroir must get its own real content (§3b), separate from the Knowledge Drop merge.
- Construction Inspection (S5) and Construction Check (S13) both need real inspection-style content — S5 is the initial physical inspection (pre-lighting), S13 is a mid-smoke re-check; these are genuinely distinct sessions despite the similar name and should not be collapsed into each other.
- Only `LeafChallenge`/`LeafChallengeResult` currently has a real scored quiz mechanic (Audit §12) — extend this pattern to at least one of the Knowledge Drop sub-topics as the reference implementation for education-with-assessment, consistent with the mandate's "missing quizzes" requirement.
- Mentor Commentary (S14) is content-delivery, not assessment — no quiz required there by definition, but it must be sourced from real per-mentor content tied to the mentor selected in S3, not generic text.

---

## 21. AI Plan

Unchanged in substance from the prior plan's AI Plan, now explicitly tied to the locked S21 AI Summary session:

- **AI inputs**: selections and data gathered across S2–S20 (cigar, terroir, construction, cut/light method, flavor notes across all three thirds, mentor, scorecard ratings, personal notes).
- **AI outputs**: a natural-language summary, clearly labeled as AI-generated, distinct from the rule-based Personalized Pairing Recommendations (S22), which must remain labeled as rule-based/algorithmic, not AI, per the existing Audit §14 finding that this logic is real but not AI-driven.
- **Decision gate**: build S21 as a real AI feature, or explicitly de-scope it — this remains a required human approval gate before Package G (§28) begins, unchanged from the prior plan.
- **Failure/fallback**: honest "Not available" state, never a fabricated response.

---

## 22. XP, Rewards, Achievement, and Passport Plan

Unchanged in substance, now explicitly mapped to S25 (Rewards and XP) and S26 (Achievements) as a single screen with two tabs (§3d, §5):

- XP triggers extend to every new session in the 27-session journey, using the existing idempotent `completedSteps.includes(sessionId)` pattern (Audit §12) — no new duplicate-prevention mechanism needed, only broader application.
- Rewards catalog, achievement rules, claim behavior, and Passport eligibility (S23) all persist through `journey.rewards`/`journey.achievements`/`journey.passportStamp` per §16's consolidation rule.
- Recommended Next Journey (S27) should surface which supporting modules (SmokeCraftChallenge, MiniTastingRound, SecondHumidorMatch, etc.) remain unexplored, using real completion state, not a fixed suggestion list.

---

## 23. Supporting Module Plan

| Module | Entry point | Data in | Data out | Progress preserved | Notes |
|---|---|---|---|---|---|
| GoldenBox | linked from S1 Welcome | — | acknowledged flag → journey (post-migration) | Y | orientation/rules content |
| RequestPurchase | embedded drawer from S2 Choose Your Cigar | selected cigar | `journey.requestPurchase` | Y | no longer a separate numbered session, per §3g |
| SmokeCraftChallenge | linked from S27 Recommended Next Journey | — | TBD once redesigned | N/A today | needs real content per Audit §6 regardless of module status |
| SecondHumidorMatch | linked from S27, reuses S2's HumidorMatch component | prior cigar choice | new cigar choice | Y | merge target confirmed in prior plan (§9, prior revision), unchanged |
| MiniTastingRound | linked from S27 | — | TBD once redesigned | N/A today | same redesign need as SmokeCraftChallenge |
| Connections | linked post-journey | — | `journey.connections` (post-migration) | Y | social/community |
| ManagementSync | linked post-journey, staff-facing | — | TBD | Y | venue-ops |
| Leaderboard | linked from S25/S26 Rewards or post-journey | guest XP/rank | none written | N/A (read-only) | honest "Shared ranking unavailable" state required, per prior plan |
| EventChallenge | linked from S27 | — | TBD once redesigned | N/A today | |
| HowItWorks | linked from E1/E2 or help menu | — | none | N/A | may remain static-informational by product decision |
| Assistant | linked from any screen (global help) or specifically from S21 | user question/context | AI response or honest fallback | N/A | subject to §21 decision gate |
| Scan | linked from E2 | — | none | N/A | replace full-card hotspot per Audit §9 |
| GuestPass | linked from E2 | — | none | N/A | replace full-card hotspot per Audit §9 |

---

## 24. Accessibility and Responsive Plan

Unchanged from the prior plan — applies to all 26 spine screens and 13 supporting modules uniformly: 10"/12"/15" tablet + desktop + handheld, portrait/landscape, age-40–65-legible font sizing, touch targets, contrast, keyboard navigation, visible gold-border focus states (no browser-default blue rectangles), `aria-label`/`aria-pressed` on every control, reduced-motion support.

---

## 25. Screen-by-Screen Rebuild Table

| Session | Title | Existing screen(s) | Route (existing→proposed) | Rebuild class | Reused screen | Live controls req'd | New assets | Persistence field | Education | Quiz | AI | XP | Reward | Back dest | Continue dest | Priority | Complexity |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| E1 | Launch Screen | SmokeCraft.jsx | `/smokecraft`→unchanged | Reuse | Y | existing | N | — | N | N | N | N | N | — | E2 | P0 | Small |
| E2 | Sign In / Guest Mode | Enroll.jsx | `/smokecraft/enroll`→unchanged | Reuse | Y | existing | N | — | N | N | N | Y | N | E1 | E3 | P0 | Small |
| E3 | Select Venue or Lounge | *(none)* | new `/smokecraft/venue-select` | Create | N | full | possible | `venueSelection` | N | N | N | N | N | E2 | E4 | P0 | Medium |
| E4 | Personal Dashboard | Identity.jsx | `/smokecraft/identity`→unchanged, guard fixed | Reuse+fix | Y | existing | N | migrate off `sc_identity_v1` | N | N | N | N | N | E3 | E5 | P0 | Medium |
| E5 | Resume or Start New Journey | *(none; logic exists)* | new `/smokecraft/resume` | Create | N | full (wraps existing logic) | N | — | N | N | N | N | N | E4 | S1 or last incomplete session | P0 | Small |
| S1 | Welcome to Today's Experience | *(none)* | new `/smokecraft/welcome` | Create | N | full | Y | `welcomeAcknowledged` | N | N | N | Y | N | E5 | S2 | P0 | Small |
| S2 | Choose Your Cigar | HumidorMatch.jsx (+RequestPurchase drawer) | `humidor-match`→keep URL, renumber | Reuse | Y | existing +drawer | N | `selectedCigar` (existing) | N | N | N | Y | N | S1 | S3 | P0 | Medium |
| S3 | Meet Your Cigar | *(none; CigarIntelligencePanel exists)* | new `/smokecraft/meet-your-cigar` | Create | N (component reused) | full | possible | `meetYourCigar` | Y | N | N | Y | N | S2 | S4 | P0 | Medium |
| S4 | Terroir | Terroir.jsx (+SeedSoil merged) | `terroir`→keep URL, add content | Update+Merge | Y (SeedSoil) | full | possible (reuse orphaned assets) | `terroir` (absorbs `seedSoil`) | Y | possible | N | Y | N | S3 | S5 | P0 | Medium |
| S5 | Construction Inspection | Format.jsx (+CigarGaugeGuide merged) | `format`→keep URL, renumber+merge | Reuse+Merge | Y | existing +tab | N | `format` (kept name) | possible | N | N | Y | N | S4 | S6 | P1 | Medium |
| S6 | Choose Your Cut | CutToastLight.jsx (cut portion) | new `/smokecraft/choose-cut` | Split | Y (partial) | existing (subset) | N | `chooseYourCut` | N | N | N | Y | N | S5 | S7 | P0 | Medium |
| S7 | Lighting Tutorial | CutToastLight.jsx (toast+light portion) | new `/smokecraft/lighting-tutorial` | Split | Y (partial) | existing (subset) | N | `lightingTutorial` | Y | N | N | Y | N | S6 | S8 | P0 | Medium |
| S8 | First Draw | FirstThird.jsx | `first-third`→keep URL, renumber | Reuse | Y | existing | N | `firstThird` (existing) | N | N | N | Y | N | S7 | (tab) S9 | P0 | Small |
| S9 | Flavor Discovery | *(tab within FirstThird)* | same route as S8, tab 2 | Reuse (tab) | Y | existing | N | `firstThird.flavorDiscovery` | N | N | N | Y | N | (tab) S8 | S10 | P1 | Small |
| S10 | Flavor Memory Exercise | FlavorMemory.jsx | `flavor-memory`→keep URL, renumber | Reuse | Y | existing | N | `flavorMemory` (existing) | N | N | N | Y | N | S9 | S11 | P0 | Small |
| S11 | Suggested Pairings | PairingLab.jsx | `pairing-lab`→keep URL, renumber | Reuse | Y | existing | N | `pairing` (existing) | N | N | N | Y | N | S10 | S12 | P0 | Small |
| S12 | Flavor Evolution | SecondThird.jsx | `second-third`→keep URL, renumber | Reuse | Y | existing | N | `secondThird` (existing) | N | N | N | Y | N | S11 | (tab) S13 | P0 | Small |
| S13 | Construction Check | *(tab within SecondThird screen)* | same route as S12, tab 2 | Create (tab) | Y (host screen) | full (new tab) | possible | `secondThird.constructionCheck` | possible | N | N | Y | N | (tab) S12 | S14 | P1 | Small |
| S14 | Mentor Commentary | *(none)* | new `/smokecraft/mentor-commentary` | Create | N | full | possible (reuse mentor imagery) | `mentorCommentary` | Y | N | N | Y | N | S13 | S15 | P1 | Medium |
| S15 | Knowledge Drop | Origins/Vitola/PairingMastery/FlavorDNA.jsx | new `/smokecraft/knowledge-drop` | Merge+Create | Y (content sources) | full (new tabbed screen) | possible (reuse orphaned assets) | `knowledgeDrop` | Y | possible | N | Y | N | S14 | S16 | P1 | Large |
| S16 | Flavor Finish | FinalThird.jsx | `final-third`→keep URL, renumber | Reuse | Y | existing | N | `finalThird` (existing) | N | N | N | Y | N | S15 | (tab) S17 | P0 | Small |
| S17 | Strength Progression | *(tab within FinalThird screen)* | same route as S16, tab 2 | Create (tab) | Y (host) | full (new tab) | N | `finalThird.strengthProgression` | N | N | N | Y | N | (tab) S16 | (tab) S18 | P1 | Small |
| S18 | Overall Experience Notes | *(tab within FinalThird screen, reuses notes pattern)* | same route as S16, tab 3 | Create (tab) | Y (host) | full (new tab) | N | `finalThird.overallExperienceNotes` | N | N | N | Y | N | (tab) S17 | S19 | P1 | Small |
| S19 | Rate Every Category | Scorecard.jsx | `scorecard`→keep URL, renumber | Reuse | Y | existing | N | `scorecard` (existing) | N | N | N | Y | N | S18 | (section) S20 | P0 | Small |
| S20 | Personal Notes | Scorecard.jsx (`personalNotes` field, existing) | same route as S19, section 2 | Merge | Y (host) | existing field | N | `scorecard.personalNotes` (existing) | N | N | N | Y | N | (section) S19 | S21 | P1 | Small |
| S21 | AI Summary | *(none)* | new `/smokecraft/ai-summary` | Create | N | full | possible | `aiSummary` | N | N | Y | Y | N | S20 | S22 | P2 | Large |
| S22 | Personalized Pairing Recommendations | PairingLab.jsx's `buildRecommendation` logic (reused, not the screen) | new `/smokecraft/pairing-recommendations` | Create | N (logic reused) | full (new results screen) | possible (reuse PairingLab visuals) | `pairingRecommendations` | N | N | N | Y | N | S21 | S23 | P1 | Medium |
| S23 | Passport Stamp Animation | PassportStamp.jsx | `passport-stamp`→keep URL, renumber | Reuse | Y | existing | N | `passportStamp` (existing, migrate off shadow key) | N | N | N | Y | Y | S22 | S24 | P0 | Small |
| S24 | Completed Scorecard | FinalReview.jsx (repurposed) | `final-review`→keep URL, repurpose | Merge | Y | existing (repurposed) | N | reads `scorecard` (existing) | N | N | N | N | N | S23 | S25 | P1 | Small |
| S25 | Rewards and XP | *(none)* | new `/smokecraft/rewards` | Create | N | full | possible (reuse PremiumIcons) | `rewards` | N | N | N | N | Y | S24 | (tab) S26 | P0 | Medium |
| S26 | Achievements | *(tab within Rewards screen)* | same route as S25, tab 2 | Create (tab) | Y (host) | full (new tab) | N | `achievements` | N | N | N | N | Y | (tab) S25 | S27 | P1 | Small |
| S27 | Recommended Next Journey | SessionComplete.jsx (repurposed) | `session-complete`→keep URL, repurpose | Merge | Y | existing (repurposed) | N | reads `sessionCompletion` (existing) + surfaces supporting-module completion | N | N | N | N | N | S26 | E5/Home | P1 | Medium |

Supporting modules retain the classifications from the prior plan's §11/§25 (SmokeCraftChallenge, SecondHumidorMatch, MiniTastingRound = Redesign; GoldenBox, RequestPurchase, Connections, ManagementSync, Scan, GuestPass = Update; Leaderboard, EventChallenge = Redesign; HowItWorks = decide; Assistant = decide per §21) — unchanged by this revision except that their entry points now originate from the new session numbers per §23, not the old ones.

---

## 26. Dependency Map

```
LOCK: 27-session sequence, session IDs, route map,
      existing→new mapping, supporting-module placement,
      Back/Continue destinations, resume behavior, completion behavior   (§3, §14, §23 decisions)
        │
        ▼
Persistence consolidation (§16)   — shadow-key removal + new canonical fields for genuinely new sessions
        │
        ├──> Route corrections (§15)   [parallel, different files]
        │
        ▼
Screen split/merge/reuse work (S6/S7 split; S4+SeedSoil, S5+CigarGaugeGuide,
S15 four-way merge, S24/S27 repurposing)
        │
        ▼
New-screen creation (E3, E5, S1, S3, S14, S15-as-screen, S21, S22, S25/S26)
        │
        ├──> Dynamic visual system (§18)   [runs alongside screen work]
        │
        ▼
XP / Rewards / Achievements activated (S25/S26 must exist first)
        │
        ▼
AI connected (S21)   [gated on product decision, §21 — may run parallel to XP/Rewards]
        │
        ▼
Supporting modules connected (§23)   [each depends on its own entry-point session existing first]
        │
        ▼
Accessibility/Responsive pass (§24)
        │
        ▼
End-to-end testing (Phase 12, §29)
        │
        ▼
Freeze (§30)
```

**Critical addition in this revision:** the 27-session sequence, session IDs, route map, existing→new mapping, supporting-module placement, Back/Continue destinations, resume behavior, and completion behavior **must all be explicitly locked and approved before Package A begins** — this is a new upstream gate that did not exist in the prior plan, per the mandate's explicit "Implementation Package Correction" instruction.

**May run in parallel:** route corrections and persistence consolidation (different files); education content creation (S4, S15) and Rewards screen build (S25/S26) once both are past the lock gate; accessibility work, built incrementally into each screen rather than deferred.

---

## 27. Implementation Packages (revised order and content)

### Package 0 — Lock the 27-Session Structure *(new — must complete before Package A)*
- **Objective:** obtain explicit, recorded approval of §3a's session table, §3b's mapping, §14's route-naming decision (keep existing URLs vs. rename), Back/Continue destinations per §25's table, resume behavior (E5), and completion behavior (S27).
- **Included files:** none — this is a documentation/approval package, not a code package. Deliverable is confirmation added to this plan or a follow-up doc, not application code.
- **Dependencies:** none.
- **Completion gate:** explicit user sign-off on the locked structure; no ambiguity remains about which existing route serves which new session number.
- **Exact deliverable:** recorded approval (no commit required unless the approval itself is documented in a new doc revision).

### Package A — Persistence Consolidation (expanded scope)
- **Objective:** eliminate remaining shadow storage keys (§16) AND add the new canonical journey fields required for the 27-session structure's genuinely new sessions.
- **Included files:** the 8 shadow-key page files (Connections, GoldenBox, Identity, Scorecard, FinalThird, FlavorMemory, PassportStamp, SessionComplete) + `SmokeCraftJourneyContext.jsx` (new fields per §16 + STATE_VERSION 2→3 migration, now larger in scope than the prior plan anticipated).
- **Dependencies:** Package 0 (must know the final field names before adding them).
- **Required tests:** persistence suite covering all 8 shadow-key fixes + presence of all new fields with correct defaults.
- **Completion gate:** zero shadow keys remain; all new fields exist with safe defaults; migration verified non-destructive to existing in-progress sessions.
- **Exact deliverable:** one commit, `fix(smokecraft): consolidate persistence and add canonical fields for 27-session journey`.

#### Package A — Implementation Evidence (completed)

**Scope actually implemented:** limited strictly to the 8 audit-identified shadow-key screens and the canonical context — no route restructuring, no new screens, no route/App.jsx changes. Canonical fields for the *not-yet-built* 27-session sessions (E3, S1, S3, S14, S15, S21, S22, S25, S26, etc.) are deliberately **not** added yet — those are deferred to whichever later package actually builds each screen, so no unused/speculative schema ships ahead of the feature that needs it. The only new field added is `goldenBox` (`{ acknowledged }`), since GoldenBox is one of the 8 audit-identified shadow-key screens and had no canonical slot at all.

**Exact files changed:**
- `src/context/SmokeCraftJourneyContext.jsx` — STATE_VERSION 2→3, added `goldenBox` field + `setGoldenBox` setter, added idempotent `migrateLegacyKeys()` migration function, hardened `loadFromStorage()` against corrupt/invalid JSON.
- `src/pages/smokecraft/Identity.jsx` — removed `sc_identity_v1` shadow key; reads/writes exclusively through `journey.identity` / `setIdentity`.
- `src/pages/smokecraft/GoldenBox.jsx` — removed `sc_golden_box_v1` shadow key; reads/writes exclusively through `journey.goldenBox` / `setGoldenBox`.
- `src/pages/smokecraft/Connections.jsx` — removed `sc_connections_v1` shadow key; now imports `useSmokeCraftJourney()` (previously didn't); reads/writes through `journey.connections` / `setConnections`.
- `src/pages/smokecraft/Scorecard.jsx` — removed `sc_scorecard_v1` shadow key; reads/writes exclusively through `journey.scorecard` / `setScorecard`; reads `journey.finalThird` instead of `sessionStorage.smokecraftFinalThird`; now stamps `overall` onto every saved snapshot so PassportStamp can read a real score canonically.
- `src/pages/smokecraft/FinalThird.jsx` — removed the redundant `sessionStorage.smokecraftFinalThird` write (canonical `setFinalThird` call was already present).
- `src/pages/smokecraft/FlavorMemory.jsx` — removed the redundant `sessionStorage.smokecraftFlavorMemory` write (canonical `setFlavorMemory` call was already present).
- `src/pages/smokecraft/PassportStamp.jsx` — removed `sc_passport_stamp_v1` shadow key and the three functions that read `sc_scorecard_v1`/`smokecraftFlavorMemory` directly; now imports `useSmokeCraftJourney()` (previously didn't) and reads scorecard/flavor-memory/claim data exclusively from canonical `journey.*`.
- `src/pages/smokecraft/SessionComplete.jsx` — removed the two raw `localStorage.getItem('sc_journey_v1'/'sc_identity_v1')` reads; now uses `useSmokeCraftJourney()` hook instead of hand-reading storage keys.
- `verify-smokecraft-persistence-consolidation.mjs` (new) — 31-check Playwright test suite for this package.

**Canonical persistence key and schema version:** `sc_journey_v1`, `STATE_VERSION` 2 → 3.

**Legacy keys discovered (7, confirmed via live-code grep, not just the audit doc):** `sc_identity_v1`, `sc_golden_box_v1`, `sc_connections_v1`, `sc_scorecard_v1`, `sc_passport_stamp_v1` (all `localStorage`), `smokecraftFlavorMemory`, `smokecraftFinalThird` (both `sessionStorage`). `LeafChallenge.jsx`'s `sessionStorage.leafChallengeResult` was found in the same grep pass but is **explicitly out of scope** — it does not belong to any of the 8 mandated screens and was left untouched.

**Legacy keys migrated:** all 7, via a single idempotent `migrateLegacyKeys()` function — canonical data always wins (a legacy value is only copied in when the canonical field is still empty), so newer canonical data can never be overwritten by older shadow data.

**Legacy keys deprecated or removed:** all 7 are **removed** (not merely deprecated) immediately after each load's migration pass, since by that point canonical state is confirmed authoritative for that field either way (freshly merged, or already populated). Removal makes re-running migration a safe no-op — the keys are simply absent on subsequent loads.

**Fields added to the canonical record:** `goldenBox: { acknowledged }` (new). All other 7 shadow keys mapped onto fields that already existed in `DEFAULT_STATE` (`identity`, `connections`, `scorecard`, `passportStamp`, `flavorMemory`, `finalThird`) — confirmed by direct inspection of the context file before editing, not assumed from the audit.

**Context actions added or updated:** `setGoldenBox` (new setter, added to both the `value` object and the exported callback list). No existing setters were removed or renamed — `setConnections`, `setScorecard`, `setPassportStamp`, `setFlavorMemory`, `setFinalThird`, `setIdentity` already existed and are now the *only* write path for their respective screens.

**Pages converted away from shadow storage:** Identity, GoldenBox, Connections, Scorecard, FinalThird, FlavorMemory, PassportStamp, SessionComplete — all 8.

**XP duplicate-prevention method:** unchanged — `GuestSessionContext.jsx`'s existing `awardSessionRewards(sessionId)` already guards with `if (prev.completedSteps.includes(sessionId)) return prev` before applying any XP/badge award. This mechanism lives outside the SmokeCraft journey context (it's part of `GuestSessionContext`, a separate, already-correct system) and was not modified — Package A verified it rather than rebuilding it, since duplicating a working idempotency guard would itself be a regression risk.

**Tests added:** `verify-smokecraft-persistence-consolidation.mjs` — 9 suites / 31 checks covering: shadow-key migration (7 keys), migration idempotency, canonical-data-never-overwritten, live screen writes with zero new shadow-key writes (6 screens spot-checked), Back/refresh/dashboard-return/resume data preservation, XP duplicate-prevention, corrupt-storage fallback, all 17 previously-shadow-touched-adjacent screens still rendering, and SessionComplete's canonical-only reads.

**Tests run:** `verify-smokecraft-persistence-consolidation.mjs` (new), `verify-interactions.mjs` (existing), `verify-all-smokecraft-assets.mjs` (existing), `final-acceptance.mjs` (existing), `npm run build`.

**Test results:**
| Suite | Result |
|---|---|
| `verify-smokecraft-persistence-consolidation.mjs` | **31 passed, 0 failed** |
| `verify-interactions.mjs` | 19 passed, 3 failed — **identical to the pre-Package-A baseline**, confirmed by stashing this package's changes, rebuilding, and re-running against the locked HEAD (`feba62cd`); the 3 failures (PairingLab recommendation persistence, HumidorMatch cigar-preset buttons, CutToastLight option rendering) are pre-existing and untouched by this package |
| `verify-all-smokecraft-assets.mjs` | **63 passed, 0 failed** |
| `final-acceptance.mjs` | 65 passed, 18 failed — **byte-identical failure list to the pre-Package-A baseline** (`diff` confirmed no difference), verified the same way via stash-and-rebuild comparison |
| `npm run build` | **green**, no errors |

No test was skipped. Every pre-existing failure was independently reproduced against the locked baseline commit before being accepted as "not a regression" — this package does not claim success on any suite it did not actually run to completion.

**Manual verification performed:** via the automated Playwright suite (equivalent to the required manual checklist, run against a real browser against the built app, not mocked): started a fresh journey, entered identity information, completed Golden Box acknowledgement, saved Connections selections, submitted Scorecard ratings, triggered Flavor Memory and Final Third selections, refreshed after each major step, navigated backward/forward, returned to the dashboard/entry screen, and confirmed all values remained present with zero XP duplication.

**Known limitations:**
- `LeafChallenge.jsx`'s separate `sessionStorage.leafChallengeResult` shadow key was identified but intentionally left unmigrated — it's outside this package's 8-screen mandate.
- PassportStamp's `finalScore` now reads `journey.scorecard.overall`, which Scorecard only populates on save/continue (via `calcOverall()`) — a guest who never saves/continues past Scorecard will see `finalScore: null` on PassportStamp, matching the pre-existing behavior (the old shadow-key read of `submittedOverall` was effectively always null too, since nothing ever wrote that exact key).
- Golden Box's canonical shape is `{ acknowledged: boolean }`, matching its pre-existing local shape exactly — no additional fields were speculatively added.

**Intentionally deferred to later packages:** route corrections (Package B), CutToastLight split (Package C), all screen merges (Package D), all net-new Entry/Session-Prep/Results screens and their canonical fields (Packages E, G, H), supporting-module redesigns and dead-code/asset cleanup (Package I), accessibility pass (Package J).

### Package B — Route Corrections + Route Map Finalization
- **Objective:** fix the 3 original route bugs (§15) AND implement whichever route-naming decision was locked in Package 0 (§14).
- **Included files:** `App.jsx` (+ new route files for genuinely new screens, added as stubs in this package, filled in by later packages).
- **Dependencies:** Package 0.
- **Completion gate:** route table matches the locked structure exactly; no regressions in existing working routes.
- **Exact deliverable:** one commit, `fix(smokecraft): correct routing and align route map to locked 27-session structure`.

### Package C — Split Screens (Choose Your Cut / Lighting Tutorial)
- **Objective:** split CutToastLight into S6 and S7 (§3e, §10).
- **Dependencies:** Packages 0, A, B.
- **Completion gate:** both new screens function independently with correct Back/Continue chaining; existing CutToastLight functionality fully preserved across the split, no capability lost.
- **Exact deliverable:** one commit, `feat(smokecraft): split Choose Your Cut and Lighting Tutorial into distinct sessions`.

### Package D — Merge Screens (Terroir+SeedSoil, Construction Inspection+CigarGaugeGuide, Knowledge Drop, Completed Scorecard, Next Journey)
- **Objective:** implement all 6 merges from §9/§3d.
- **Dependencies:** Packages 0, A, B.
- **Completion gate:** each merge target screen contains all constituent content, reachable via tabs where specified; no functionality from a merged-away screen is silently dropped.
- **Exact deliverable:** one commit, `feat(smokecraft): merge Terroir/SeedSoil, Construction Inspection/CigarGaugeGuide, Knowledge Drop, Completed Scorecard, and Next Journey`.

### Package E — New Screens: Entry Layer (E3, E5) + Session Prep (S1, S3)
- **Objective:** build the 4 net-new Entry/Session-1-3 screens.
- **Dependencies:** Packages 0, A, B.
- **Completion gate:** all 4 render real content with live controls (no static stubs), persist correctly, chain Back/Continue correctly.
- **Exact deliverable:** one commit, `feat(smokecraft): build Venue Select, Resume, Welcome, and Meet Your Cigar screens`.

### Package F — New Tab Content: S9, S13, S17, S18, S20
- **Objective:** add the 5 new tab-based sub-sessions to their host screens (FirstThird, SecondThird, FinalThird, Scorecard).
- **Dependencies:** Packages 0, A.
- **Completion gate:** each tab is independently testable and persists to its own canonical field; host screens' existing (reused) tabs remain unaffected.
- **Exact deliverable:** one commit, `feat(smokecraft): add Flavor Discovery, Construction Check, Strength Progression, Overall Experience Notes, and Personal Notes tabs`.

### Package G — Mentor Commentary (S14)
- **Objective:** build the net-new S14 screen, fed by the mentor selected in S3.
- **Dependencies:** Package E (S3 must exist and persist mentor selection first).
- **Completion gate:** real per-mentor content renders based on actual selected mentor, not generic text.
- **Exact deliverable:** one commit, `feat(smokecraft): build Mentor Commentary session`.

### Package H — Results Phase: AI Summary (S21) + Personalized Pairing Recommendations (S22) + Rewards/Achievements (S25/S26)
- **Objective:** build the Results-phase net-new screens.
- **Dependencies:** Package 0 (AI decision gate must be resolved for S21 before this package can fully complete — S22, S25, S26 can proceed independently of the AI decision).
- **Completion gate:** S22 correctly reuses (not re-derives) PairingLab's existing recommendation logic; S25/S26 show real XP/reward/achievement data; S21 either shows real AI output with honest fallback or is explicitly de-scoped per the gate.
- **Exact deliverable:** one commit (or two, if AI is de-scoped separately), `feat(smokecraft): build AI Summary, Personalized Pairing Recommendations, Rewards, and Achievements screens`.

### Package I — Supporting Module Redesign + Cleanup
- **Objective:** redesign SmokeCraftChallenge, MiniTastingRound, Leaderboard, EventChallenge; update Scan/GuestPass hotspots; archive dead code (`Format.legacy.jsx`, 12 orphaned components) and orphaned assets.
- **Dependencies:** all prior packages (deliberately last, per original audit ordering logic, so nothing scheduled for reuse — e.g., orphaned Knowledge Drop images — is deleted prematurely).
- **Completion gate:** zero broken references after cleanup; all supporting modules reachable from their new (§23) entry points.
- **Exact deliverable:** two commits — `feat(smokecraft): redesign remaining supporting modules` and `chore(smokecraft): archive dead code and orphaned assets after final reference check`.

### Package J — Accessibility/Responsive Final Pass
- **Objective:** full-app accessibility/responsive verification across all 26 spine + 13 supporting-module screens.
- **Dependencies:** Packages A–I substantially complete.
- **Completion gate:** zero accessibility gate failures across all 4 required viewports.
- **Exact deliverable:** one commit, `fix(smokecraft): final accessibility and responsive verification pass`.

---

## 28. Verification Gates

Unchanged in mechanics from the prior plan, run after every package:

1. `npm run build` green.
2. Package-specific new test passes 100%.
3. Full existing regression suite does not regress below its pre-package pass count.
4. `git status`/`git diff --stat` confirms only the package's declared files changed.
5. Manual screenshot review at 1440×900, 1024×768, 768×1024, 390×844 for any screen with a UI change.
6. Diff Guard re-check: no NOVEE backend, POS360, E.A.T., or approved-image file touched.
7. **New for this revision:** confirm the screen/session actually implemented matches its locked entry in §3a/§25 exactly — no silent renumbering or re-scoping mid-implementation.

---

## 29. Rollback Strategy

Unchanged in mechanics from the prior plan — one package per commit (or tightly-scoped pair), independently revertible, STATE_VERSION migration forward-only and idempotent, asset deletion last and most reversible-in-spirit. New for this revision: **Package 0's lock must not be revisited mid-implementation** — if the locked structure needs to change after Package A begins, that is a new planning cycle, not a rollback, since later packages depend on field names and route decisions made at the lock.

---

## 30. Final Production Freeze Criteria

SmokeCraft may be declared complete and frozen only when:

1. All packages (0–J) are merged and their individual completion gates passed.
2. All 27 sessions map to a working, live-interactive screen or tab per §25 — zero static-only production screens remain among them.
3. Zero fake/baked live data remains anywhere.
4. The journey consistently reads as 27 sessions / 7 phases + 5-entry layer everywhere in code, docs, and UI copy — no residual "24-session" references remain.
5. Every one of the 27 sessions maps 1:1 to a locked session number, with no double-guarded or ambiguous sessions.
6. Every supporting module's entry/exit/return behavior (§23) is verified working.
7. All required data persists exclusively through `sc_journey_v1` — zero shadow keys remain.
8. Full end-to-end journey test (E1→E5→S1→S27, plus every supporting module reachable and returning correctly) passes with proof screenshots at all 4 required viewports.
9. The AI decision gate (§21) has been explicitly resolved.

---

## 31. Exact Recommended Execution Order

1. **Package 0 — Lock the 27-Session Structure.** *Changed:* nothing (approval only). *Test:* none (human sign-off). *Approve before continuing:* explicit confirmation of §3a/§3b/§14/§25's Back-Continue chain, resume behavior, and completion behavior.
2. **Package A — Persistence Consolidation (expanded).** *Changed:* 8 page files + journey context. *Preserved:* all 19 already-working screens' UI and routes untouched. *Test:* new persistence suite + full regression. *Approve before continuing:* zero shadow keys; all new fields present; migration non-destructive.
3. **Package B — Route Corrections + Route Map Finalization.** *Changed:* `App.jsx` + new route stubs. *Preserved:* every currently-working route. *Test:* route-table smoke test + full regression. *Approve before continuing:* route table matches locked structure exactly.
4. **Package C — Split Screens.** *Changed:* CutToastLight split into 2. *Preserved:* all cut/toast/light functionality, none lost in the split. *Test:* new interaction tests for both halves. *Approve before continuing:* both screens function independently, chain correctly.
5. **Package D — Merge Screens.** *Changed:* 6 merge targets built. *Preserved:* all constituent content from merged-away screens. *Test:* content-completeness test per merge. *Approve before continuing:* no functionality silently dropped.
6. **Package E — New Entry/Prep Screens (E3, E5, S1, S3).** *Changed:* 4 new screens. *Preserved:* everything else. *Test:* new interaction tests. *Approve before continuing:* all 4 real, live, persisted.
7. **Package F — New Tab Content (S9, S13, S17, S18, S20).** *Changed:* 5 new tabs on 4 existing screens. *Preserved:* existing reused tabs on those same screens. *Test:* per-tab persistence test. *Approve before continuing:* each tab independently verifiable.
8. **Package G — Mentor Commentary (S14).** *Changed:* 1 new screen. *Preserved:* S3's mentor-selection data flow. *Test:* mentor-content-matches-selection test. *Approve before continuing:* real per-mentor content confirmed.
9. **Package H — Results Phase (S21, S22, S25, S26).** *Changed:* 4 new screens/tabs. *Preserved:* PairingLab's existing recommendation logic, reused not rebuilt. *Test:* AI-honesty test (or de-scope confirmation) + rewards/achievements data test. *Approve before continuing:* AI decision gate resolved; results screens show real data.
10. **Package I — Supporting Module Redesign + Cleanup.** *Changed:* 4 supporting modules redesigned, hotspots fixed, dead code/assets archived. *Preserved:* every still-referenced file, re-verified before deletion. *Test:* full asset-verification + build. *Approve before continuing:* zero broken references.
11. **Package J — Accessibility/Responsive Final Pass.** *Changed:* cross-cutting a11y/focus/contrast fixes. *Preserved:* underlying screen logic, additive changes only. *Test:* full accessibility matrix, 4 viewports. *Approve before continuing:* zero gate failures.
12. **Phase 12 — Full Production Verification.** *Changed:* nothing (verification-only). *Test:* complete E1→E5→S1→S27 end-to-end test + all supporting modules, proof screenshots at 4 viewports. *Approve before continuing:* all §28 gates pass, zero P0 findings.
13. **Phase 13 — Freeze.** *Changed:* nothing (declaration only). *Test:* re-confirmation of §30's 9 criteria. *Approve:* final sign-off.

---

## Planning Methodology Note

This revision was produced by re-reading the user-approved 27-session Master Journey specification supplied in the correction mandate, then re-mapping every finding already established in `docs/SMOKECRAFT_360_MASTER_AUDIT.md` onto that locked structure — no new repository scanning was performed, and no application file was read for the purpose of altering it. Where a mapping required a judgment call (e.g., whether a route should be renamed or only its session number changed), this plan states that as an open decision point rather than resolving it unilaterally.

---

# PACKAGE 0: LOCKED PRODUCTION ARCHITECTURE

**Status:** This section resolves every open decision point left in §14/§25/§27 of the plan above (route-naming, Back/Continue chain, resume behavior, completion behavior, supporting-module placement) into one authoritative, locked architecture. Once approved, no later package may silently renumber, re-route, or re-scope a session — any change to what's locked here is a new planning cycle, not a mid-implementation adjustment (§29).

**Governing decision rules applied throughout this section** (per the Package 0 mandate):
- Existing working route URLs are preserved wherever the underlying screen is reused, renamed, or merged-into — only genuinely new screens get new routes.
- No route is invented where an existing one already serves the purpose.
- No session is forced into its own screen where a live multi-tab/multi-panel component safely serves multiple sessions (S8+S9, S12+S13, S16+S17+S18, S19+S20, S25+S26).
- No screen is merged where the result would be crowded or confusing — each merge below was checked against this before being locked (see per-merge notes in Table 2).
- No screen is preserved merely because it exists — GoldenBox, SmokeCraftChallenge, SecondHumidorMatch, and MiniTastingRound are demoted to supporting modules specifically because their current content doesn't earn a numbered main-journey slot in the locked 27, not out of inertia.
- No approved visual identity is discarded — every reused screen keeps its current SC_ASSETS background image.
- Supporting modules are never substituted for a required main-journey session — every one of the 27 sessions has its own authoritative screen or tab in Table 1, independent of any supporting module.
- The legacy 24-session / 8-visit structure, and any code construct built around it (`VISIT_STRUCTURE`, `TOTAL_VISITS`, `isVisitUnlocked`, old session numbers S1–S24), is retired by this lock — Package B is responsible for removing or fully superseding these constructs so no conflicting count remains anywhere in the codebase, docs, or UI copy.

---

## Table 1: Final Journey Map

| Final Screen ID | Phase | Session | Final Screen Name | Final Route | Main Journey / Supporting Module | Back Destination | Continue Destination | Resume Target | Completion Trigger |
|---|---|---|---|---|---|---|---|---|---|
| E1 | Entry/Auth | — | Launch Screen | `/smokecraft` (unchanged) | Main Journey (Entry layer) | — (first screen) | E2 | E1 itself if never entered | Guest taps Enter/Continue |
| E2 | Entry/Auth | — | Sign In / Guest Mode | `/smokecraft/enroll` (unchanged) | Main Journey (Entry layer) | E1 | E3 | E2 if incomplete | Guest signs in or selects Guest Mode |
| E3 | Entry/Auth | — | Select Venue or Lounge | `/smokecraft/venue-select` (NEW) | Main Journey (Entry layer) | E2 | E4 | E3 if incomplete | Venue/lounge selected |
| E4 | Entry/Auth | — | Personal Dashboard | `/smokecraft/identity` (unchanged, guard fixed) | Main Journey (Entry layer) | E3 | E5 | E4 if incomplete | Profile fields confirmed |
| E5 | Entry/Auth | — | Resume or Start New Journey | `/smokecraft/resume` (NEW) | Main Journey (Entry layer) | E4 | S1 (new) or last incomplete session (resume) | E5 itself (this *is* the resume screen) | Guest chooses Resume or Start New |
| S1 | 2 — Session Preparation | 1 | Welcome to Today's Experience | `/smokecraft/welcome` (NEW) | Main Journey | E5 | S2 | S1 if incomplete | Guest acknowledges welcome |
| S2 | 2 | 2 | Choose Your Cigar | `/smokecraft/humidor-match` (unchanged) | Main Journey | S1 | S3 | S2 if incomplete | Cigar selected (+ optional RequestPurchase drawer completed) |
| S3 | 2 | 3 | Meet Your Cigar | `/smokecraft/meet-your-cigar` (NEW; absorbs Mentor selection as internal tab) | Main Journey | S2 | S4 | S3 if incomplete | Cigar intro viewed + mentor selected |
| S4 | 2 | 4 | Terroir | `/smokecraft/terroir` (unchanged, content added; absorbs Seed & Soil as tab) | Main Journey | S3 | S5 | S4 if incomplete | Terroir + seed/soil content engaged |
| S5 | 2 | 5 | Construction Inspection | `/smokecraft/format` (unchanged; absorbs Cigar Gauge Guide + Wrapper/Strength as tabs) | Main Journey | S4 | S6 | S5 if incomplete | Shape/size/wrapper/strength inspection complete |
| S6 | 2 | 6 | Choose Your Cut | `/smokecraft/choose-cut` (NEW, split from Cut/Toast/Light) | Main Journey | S5 | S7 | S6 if incomplete | Cut method selected |
| S7 | 2 | 7 | Lighting Tutorial | `/smokecraft/cut-toast-light` (unchanged; now toast+light only) | Main Journey | S6 | S8 | S7 if incomplete | Toast + light method selected |
| S8 | 3 — First Third | 8 | First Draw | `/smokecraft/first-third` (unchanged, tab 1) | Main Journey | S7 | (tab) S9 | S8 if incomplete | Draw observations recorded |
| S9 | 3 | 9 | Flavor Discovery | same route as S8, tab 2 | Main Journey | (tab) S8 | S10 | S8/S9 host screen if incomplete | Flavor notes recorded |
| S10 | 3 | 10 | Flavor Memory Exercise | `/smokecraft/flavor-memory` (unchanged) | Main Journey | S9 | S11 | S10 if incomplete | Flavor memory exercise recorded |
| S11 | 3 | 11 | Suggested Pairings | `/smokecraft/pairing-lab` (unchanged) | Main Journey | S10 | S12 | S11 if incomplete | Pairing recommendation generated |
| S12 | 4 — Second Third | 12 | Flavor Evolution | `/smokecraft/second-third` (unchanged, tab 1) | Main Journey | S11 | (tab) S13 | S12 if incomplete | Evolution observations recorded |
| S13 | 4 | 13 | Construction Check | same route as S12, tab 2 | Main Journey | (tab) S12 | S14 | S12/S13 host screen if incomplete | Mid-smoke construction check recorded |
| S14 | 4 | 14 | Mentor Commentary | `/smokecraft/mentor-commentary` (NEW) | Main Journey | S13 | S15 | S14 if incomplete | Mentor commentary viewed |
| S15 | 4 | 15 | Knowledge Drop | `/smokecraft/knowledge-drop` (NEW; absorbs Origins, Vitola, Pairing Mastery, Flavor DNA) | Main Journey | S14 | S16 | S15 if incomplete | At least one knowledge module engaged |
| S16 | 5 — Final Third | 16 | Flavor Finish | `/smokecraft/final-third` (unchanged, tab 1) | Main Journey | S15 | (tab) S17 | S16 if incomplete | Finish notes recorded |
| S17 | 5 | 17 | Strength Progression | same route as S16, tab 2 | Main Journey | (tab) S16 | (tab) S18 | S16/S17/S18 host screen if incomplete | Strength progression recorded |
| S18 | 5 | 18 | Overall Experience Notes | same route as S16, tab 3 | Main Journey | (tab) S17 | S19 | S16/S17/S18 host screen if incomplete | Overall notes entered |
| S19 | 6 — Reflection | 19 | Rate Every Category | `/smokecraft/scorecard` (unchanged, section 1) | Main Journey | S18 | (section) S20 | S19 if incomplete | All 6 categories rated |
| S20 | 6 | 20 | Personal Notes | same route as S19, section 2 | Main Journey | (section) S19 | S21 | S19/S20 host screen if incomplete | Personal notes entered (optional field, non-blocking) |
| S21 | 7 — Results | 21 | AI Summary | `/smokecraft/ai-summary` (NEW) | Main Journey | S20 | S22 | S21 if incomplete | AI summary viewed or honest fallback shown |
| S22 | 7 | 22 | Personalized Pairing Recommendations | `/smokecraft/pairing-recommendations` (NEW; reuses PairingLab's `buildRecommendation` logic) | Main Journey | S21 | S23 | S22 if incomplete | Recommendation viewed |
| S23 | 7 | 23 | Passport Stamp Animation | `/smokecraft/passport-stamp` (unchanged) | Main Journey | S22 | S24 | S23 if incomplete | Stamp animation played + claimed |
| S24 | 7 | 24 | Completed Scorecard | `/smokecraft/final-review` (unchanged; repurposed as read-only recap) | Main Journey | S23 | S25 | S24 if incomplete | Recap viewed |
| S25 | 7 | 25 | Rewards and XP | `/smokecraft/rewards` (NEW, tab 1) | Main Journey | S24 | (tab) S26 | S25 if incomplete | Rewards/XP viewed |
| S26 | 7 | 26 | Achievements | same route as S25, tab 2 | Main Journey | (tab) S25 | S27 | S25/S26 host screen if incomplete | Achievements viewed |
| S27 | 7 | 27 | Recommended Next Journey | `/smokecraft/session-complete` (unchanged; repurposed) | Main Journey | S26 | E5 (Resume/Dashboard) or SmokeCraft Home | N/A — journey terminal screen | Journey marked complete; next-journey recommendation shown |

---

## Table 2: Existing-to-Final Mapping

| Existing Screen | Existing Route | Existing Component | Existing Asset | Final Screen ID | Final Session | Final Classification | Reuse | Rename | Merge | Split | Redesign | Create | Archive | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SmokeCraft (landing) | `/smokecraft` | SmokeCraft.jsx | landing | E1 | Entry | Main Journey | Y | Y | | | | | | role renamed to Launch Screen |
| Enroll | `/smokecraft/enroll` | Enroll.jsx | enroll | E2 | Entry | Main Journey | Y | Y | | | | | | role renamed to Sign In/Guest Mode |
| Identity | `/smokecraft/identity` | Identity.jsx | identity | E4 | Entry | Main Journey | Y | Y | | | | | | duplicate S2 guard resolved by giving it its own Entry slot |
| GoldenBox | `/smokecraft/golden-box` | GoldenBox.jsx | goldenBox | — | — | Supporting Module | Y | | | | | | | demoted from main spine; linked from S1 |
| GoldenBoxStatus | `/smokecraft/golden-box/status` | GoldenBoxStatus.jsx | goldenBox | — | — | Supporting Module (sub-page of GoldenBox) | Y | | | | | | | unchanged, follows GoldenBox |
| Mentor (selection) | `/smokecraft/mentor-selection` | Mentor.jsx | mentorSelection | S3 | 3 | Main Journey (tab) | Y | Y | Y | | | | | folds into Meet Your Cigar as a tab; old route becomes a redirect to S3 |
| Format | `/smokecraft/format` | Format.jsx | format | S5 | 5 | Main Journey | Y | Y | Y | | | | | renamed Construction Inspection; absorbs CigarGaugeGuide + WrapperStrength |
| `shape-size-burn` alias | `/smokecraft/shape-size-burn` | Format.jsx (dup) | format | — | — | obsolete alias | | | | | | | Y | becomes `Navigate`→S5's route, or removed |
| CigarGaugeGuide | `/smokecraft/cigar-gauge-guide` | CigarGaugeGuide.jsx | format | S5 | 5 | Main Journey (tab) | Y | | Y | | | | | merges into Construction Inspection as a tab |
| WrapperStrength | `/smokecraft/wrapper-strength` | WrapperStrength.jsx | (none) | S5 | 5 | Main Journey (tab) | | | Y | | | | | currently renders null; content merges into Construction Inspection as a tab |
| SeedSoil | `/smokecraft/seed-soil` | SeedSoil.jsx | seedSoil | S4 | 4 | Main Journey (tab) | Y | | Y | | | | | merges into Terroir as a tab; old route becomes a redirect |
| PairingLab | `/smokecraft/pairing-lab` | PairingLab.jsx | pairingLab | S11 | 11 | Main Journey | Y | Y | | | | | | renamed Suggested Pairings |
| HumidorMatch | `/smokecraft/humidor-match` | HumidorMatch.jsx | humidorMatch | S2 | 2 | Main Journey | Y | Y | | | | | | renamed Choose Your Cigar |
| RequestPurchase | `/smokecraft/request-purchase` | RequestPurchase.jsx | requestPurchase | — | — | Supporting Module (drawer from S2) | Y | | | | | | | demoted from numbered session to embedded ordering drawer |
| CutToastLight | `/smokecraft/cut-toast-light` | CutToastLight.jsx | cutToastLight | S6 + S7 | 6, 7 | Main Journey (split) | Y | Y | | Y | | | | cut portion → new S6 screen; toast+light portion stays on this route as S7 |
| FirstThird | `/smokecraft/first-third` | FirstThird.jsx | firstThird | S8 + S9 | 8, 9 | Main Journey (+tab) | Y | Y | | | | | | renamed First Draw; gains Flavor Discovery as tab 2 |
| SecondThird | `/smokecraft/second-third` | SecondThird.jsx | secondThird | S12 + S13 | 12, 13 | Main Journey (+tab) | Y | Y | | | | | | renamed Flavor Evolution; gains Construction Check as tab 2 |
| FlavorMemory | `/smokecraft/flavor-memory` | FlavorMemory.jsx | flavorMemory | S10 | 10 | Main Journey | Y | | | | | | | route/name unchanged, moved earlier in sequence |
| FinalThird | `/smokecraft/final-third` | FinalThird.jsx | finalThird | S16 + S17 + S18 | 16, 17, 18 | Main Journey (+2 tabs) | Y | Y | | | | | | renamed Flavor Finish; gains Strength Progression + Overall Experience Notes tabs |
| Scorecard | `/smokecraft/scorecard` | Scorecard.jsx | scorecard | S19 + S20 | 19, 20 | Main Journey (+section) | Y | Y | | | | | | renamed Rate Every Category; existing `personalNotes` field becomes S20 |
| SmokeCraftChallenge | `/smokecraft/smokecraft-challenge` | SmokeCraftChallenge.jsx | smokecraftChallenge | — | — | Supporting Module | Y | | | | Y | | | demoted; still needs redesign from static stub; linked from S27 |
| SecondHumidorMatch | `/smokecraft/second-humidor-match` | SecondHumidorMatch.jsx | secondHumidorMatch | — | — | Supporting Module | Y | | | | Y | | | demoted; reuses S2's HumidorMatch component; linked from S27 |
| MiniTastingRound | `/smokecraft/mini-tasting` | MiniTastingRound.jsx | miniTasting | — | — | Supporting Module | Y | | | | Y | | | demoted; still needs redesign; linked from S27 |
| FinalReview | `/smokecraft/final-review` | FinalReview.jsx | finalReview | S24 | 24 | Main Journey | Y | Y | Y | | | | | renamed Completed Scorecard; repurposed as read-only recap |
| PassportStamp | `/smokecraft/passport-stamp` | PassportStamp.jsx | passportStamp | S23 | 23 | Main Journey | Y | Y | | | | | | renamed Passport Stamp Animation |
| Connections | `/smokecraft/connections` | Connections.jsx | connections | — | — | Supporting Module | Y | | | | | | | demoted; social/community, linked post-journey |
| ManagementSync | `/smokecraft/management-sync` | ManagementSync.jsx | managementSync | — | — | Supporting Module | Y | | | | | | | demoted; venue-ops, linked post-journey |
| SessionComplete | `/smokecraft/session-complete` | SessionComplete.jsx | sessionComplete | S27 | 27 | Main Journey | Y | Y | Y | | | | | renamed Recommended Next Journey; repurposed |
| Leaderboard | `/smokecraft/leaderboard` | Leaderboard.jsx | leaderboard | — | — | Supporting Module | Y | | | | Y | | | unchanged classification; still needs redesign |
| HowItWorks | `/smokecraft/how-it-works` | HowItWorks.jsx | howItWorks | — | — | Supporting Module | Y | | | | (decide) | | | may remain static-informational by product decision |
| EventChallenge | `/smokecraft/event-challenge` | EventChallenge.jsx | eventChallenge | — | — | Supporting Module | Y | | | | Y | | | unchanged classification; still needs redesign |
| Origins | `/smokecraft/origins` | Origins.jsx | (unreferenced) | S15 | 15 | Main Journey (tab, via merge) | | | Y | | | | | merges into Knowledge Drop; old route becomes redirect |
| Terroir (old stub) | `/smokecraft/terroir` | Terroir.jsx | (unreferenced) | S4 | 4 | Main Journey | | | | | | Y | | this is the *screen*, kept as S4's route; content created fresh (not a Knowledge Drop merge target — see §20 correction) |
| Vitola | `/smokecraft/vitola` | Vitola.jsx | (unreferenced) | S15 | 15 | Main Journey (tab, via merge) | | | Y | | | | | merges into Knowledge Drop; old route becomes redirect |
| PairingMastery | `/smokecraft/pairing-mastery` | PairingMastery.jsx | (unreferenced) | S15 | 15 | Main Journey (tab, via merge) | | | Y | | | | | merges into Knowledge Drop; old route becomes redirect |
| FlavorDNA | `/smokecraft/flavor-dna` | FlavorDNA.jsx | (unreferenced) | S15 | 15 | Main Journey (tab, via merge) | | | Y | | | | | merges into Knowledge Drop; old route becomes redirect |
| Assistant | `/smokecraft/assistant` | Assistant.jsx | (none) | — | — | Supporting Module (or S21 source) | | | | | (decide) | | | subject to AI decision gate; may feed S21 or remain a standalone help module |
| Rewards | *(does not exist)* | *(none)* | *(new/reused icons)* | S25 + S26 | 25, 26 | Main Journey (new screen, +tab) | | | | | | Y | | net-new; also covers Achievements as tab 2 |
| Scan | `/smokecraft/scan` | Scan.jsx | (existing) | — | — | Supporting Module | Y | | | | | | | full-card hotspot needs replacing; linked from E2 |
| GuestPass | `/smokecraft/guest-pass` | GuestPass.jsx | (existing) | — | — | Supporting Module | Y | | | | | | | full-card hotspot needs replacing; linked from E2 |
| Meet Your Cigar | *(does not exist)* | *(CigarIntelligencePanel exists)* | *(new)* | S3 | 3 | Main Journey (new screen) | | | | | | Y | | wraps existing panel component |
| Construction Check | *(does not exist)* | *(none)* | *(new/reused)* | S13 | 13 | Main Journey (new tab) | | | | | | Y | | |
| Mentor Commentary | *(does not exist)* | *(none)* | *(new)* | S14 | 14 | Main Journey (new screen) | | | | | | Y | | fed by S3's mentor selection |
| Strength Progression | *(does not exist)* | *(none)* | *(new tab)* | S17 | 17 | Main Journey (new tab) | | | | | | Y | | |
| Overall Experience Notes | *(does not exist)* | *(existing notes pattern reused)* | *(new tab)* | S18 | 18 | Main Journey (new tab) | | | | | | Y | | reuses established notes-textarea pattern |
| AI Summary | *(does not exist)* | *(none)* | *(new)* | S21 | 21 | Main Journey (new screen) | | | | | | Y | | subject to AI decision gate |
| Personalized Pairing Recommendations | *(does not exist)* | *(PairingLab logic reused)* | *(new)* | S22 | 22 | Main Journey (new screen) | | | | | | Y | | reuses `buildRecommendation`, not the PairingLab screen itself |
| Venue Select | *(does not exist)* | *(none)* | *(new)* | E3 | Entry | Main Journey (new screen) | | | | | | Y | | |
| Resume or Start New Journey | *(does not exist; logic exists)* | *(wraps `SmokeCraftProgressContext`)* | *(new)* | E5 | Entry | Main Journey (new screen) | | | | | | Y | | thin wrapper around already-correct resume logic |
| `smokecraft/session-1..session-4` legacy aliases | `/smokecraft/session-1` .. `-4` | Navigate stubs | — | — | — | obsolete | | | | | | | Y | dead-end aliases, all collapse to `/smokecraft` today; removed or repointed to E5 |
| `order` / `ticket-tapper/staff-specials` duplicate | both routes | SmokeCraftVenueCommerce.jsx | — | — | — | out of SmokeCraft-journey scope | | | | | | | | flagged for owning team, no action in this plan |
| Format.legacy.jsx | none (unrouted) | Format.legacy.jsx | — | — | — | obsolete | | | | | | | Y | dead code, 1,571 lines, fully superseded |
| 12 orphaned components | none | (12 files, Audit §4c) | — | — | — | obsolete | | | | | | | Y | zero references outside own file |
| ~100+ orphaned image files | various | — | 4 asset directories | — | — | obsolete/archive | | | | | | | Y | archived last, after all reuse decisions locked |

---

## Table 3: Supporting Module Map

| Module | Route | Entry Point | Return Point | Data In | Data Out | Progress Preservation | Dashboard Access | Required Changes |
|---|---|---|---|---|---|---|---|---|
| GoldenBox (+Status) | `/smokecraft/golden-box` | Linked from S1 Welcome | Back to S1 | — | acknowledged flag → `journey` (post-migration) | Y | Y — reachable from E4 Personal Dashboard | migrate off private `LS_KEY` (Package A) |
| Request Purchase | `/smokecraft/request-purchase` (embedded drawer) | Opened from S2 Choose Your Cigar | Closes back into S2 | selected cigar | `journey.requestPurchase` | Y | N (contextual to S2 only) | none functional; already canonical per prior mandate |
| Pairing Lab | *(now S11, not a supporting module — see Table 1)* | — | — | — | — | — | — | reclassified as Main Journey per locked structure |
| Flavor Memory Module | *(now S10, not a supporting module — see Table 1)* | — | — | — | — | — | — | reclassified as Main Journey per locked structure |
| Mentor Library | folds into S3 (tab), not a standalone module | — | — | — | — | — | — | reclassified as Main Journey tab per locked structure |
| Terroir Module | *(now S4, not a supporting module — see Table 1)* | — | — | — | — | — | — | reclassified as Main Journey per locked structure |
| Humidor Match | *(now S2, not a supporting module — see Table 1)* | — | — | — | — | — | — | reclassified as Main Journey per locked structure |
| Passport | *(now S23, not a supporting module — see Table 1)* | — | — | — | — | — | — | reclassified as Main Journey per locked structure |
| Leaderboard | `/smokecraft/leaderboard` | Linked from S25/S26 Rewards, or E4 Dashboard | Back to caller | guest XP/rank | none written (read-only) | N/A | Y — reachable from E4 | redesign from static stub; honest "Shared ranking unavailable" state required |
| Community (Connections) | `/smokecraft/connections` | Linked post-journey (from S27) or E4 Dashboard | Back to caller | — | `journey.connections` (post-migration) | Y | Y — reachable from E4 | migrate off private `LS_KEY` (Package A) |
| Event Challenge | `/smokecraft/event-challenge` | Linked from S27 Recommended Next Journey | Back to S27 | — | TBD once redesigned | N/A today | N (journey-completion contextual) | redesign from static stub |
| Connections | *(see Community, above — same module, not duplicated)* | | | | | | | |
| Request Purchase | *(see above — listed once, not duplicated)* | | | | | | | |
| Management Sync | `/smokecraft/management-sync` | Linked post-journey, staff-facing | Back to caller | — | TBD | Y | Y — staff-only access point | unchanged; out of guest-journey critical path |
| SmokeCraftChallenge | `/smokecraft/smokecraft-challenge` | Linked from S27 Recommended Next Journey | Back to S27 | — | TBD once redesigned | N/A today | N | redesign from static stub |
| SecondHumidorMatch | `/smokecraft/second-humidor-match` | Linked from S27, reuses S2's HumidorMatch component | Back to S27 | prior cigar choice | new cigar choice | Y | N | reuse S2 component, don't rebuild |
| MiniTastingRound | `/smokecraft/mini-tasting` | Linked from S27 | Back to S27 | — | TBD once redesigned | N/A today | N | redesign from static stub |
| HowItWorks | `/smokecraft/how-it-works` | Linked from E1/E2 or help menu | Back to caller | — | none | N/A | Y — general help access | may remain static-informational by product decision |
| Assistant | `/smokecraft/assistant` | Linked from any screen (global help) or specifically from S21 | Back to caller | user question/context | AI response or honest fallback | N/A | Y — global help access | subject to §21 AI decision gate |
| Scan | `/smokecraft/scan` | Linked from E2 | Back to E2 | — | none | N/A | N | replace full-card hotspot |
| GuestPass | `/smokecraft/guest-pass` | Linked from E2 | Back to E2 | — | none | N/A | N | replace full-card hotspot |

*(Note: Pairing Lab, Flavor Memory Module, Mentor Library, Terroir Module, Humidor Match, and Passport were listed as "supporting modules" in the correction mandate's generic module list, but the locked 27-session structure places each of them as a required numbered main-journey session instead — per the decision rule "do not treat supporting modules as substitutes for missing main-journey screens," they are not demoted, they were never optional. Table 1 is authoritative for their placement.)*

**Final supporting-module count: 13** — GoldenBox, RequestPurchase, Leaderboard, Connections, EventChallenge, ManagementSync, SmokeCraftChallenge, SecondHumidorMatch, MiniTastingRound, HowItWorks, Assistant, Scan, GuestPass.

---

## Table 4: Dependency Map

| Work Item | Depends On | Blocks | Can Run in Parallel With | Must Be Sequential With | Verification Required |
|---|---|---|---|---|---|
| Package 0 lock (this section, once approved) | Audit + prior plan revisions | every later package | — | nothing (first) | explicit user sign-off |
| Persistence consolidation (shadow-key removal) | Package 0 lock | Screen split/merge/create work that reads/writes those fields | Route corrections | must precede any screen work touching Connections, GoldenBox, Identity, Scorecard, FinalThird, FlavorMemory, PassportStamp, SessionComplete | persistence test suite |
| New canonical journey fields (§16 list) | Package 0 lock (field names must be final) | all net-new screen builds (E3, E5, S1, S3, S14, S15, S21, S22, S25/S26) | Route corrections | must precede those screens' persistence wiring | field-presence test with safe defaults |
| STATE_VERSION 2→3 migration | New canonical fields defined | any guest session created/resumed after this ships | — | must ship in the same package as the new fields | migration non-destructiveness test against a v2 fixture session |
| Route corrections (3 original bugs + route-naming decision) | Package 0 lock | screen split/merge work that depends on final URLs | Persistence consolidation | must precede Package C/D/E/F/G/H's route wiring | route-table smoke test |
| CutToastLight split (S6/S7) | Route corrections, persistence | S6/S7 individual content builds | Merge-screen work (Package D) | must precede any content build for S6 or S7 | dual-screen interaction test, functionality-preservation check |
| Merge-screen work (S4+SeedSoil, S5+CigarGaugeGuide+WrapperStrength, S15 four-way merge, S24 repurpose, S27 repurpose, S20 field reuse) | Route corrections, persistence | later content-authoring for merged screens | Split-screen work (Package C) | must precede Package I (cleanup/archival of the merged-away screens' old routes) | content-completeness test per merge |
| New Entry-layer + Session-Prep screens (E3, E5, S1, S3) | Route corrections, persistence | Mentor Commentary (S14, depends on S3's mentor data) | Merge-screen work | — | new interaction tests per screen |
| New tab content (S9, S13, S17, S18, S20) | Persistence (host screens' fields) | nothing further downstream | New Entry-layer screens, Merge-screen work | must land on top of the already-reused host screens (S8, S12, S16, S19) without disturbing their existing tabs | per-tab persistence test |
| Mentor Commentary (S14) | S3 (Meet Your Cigar) must exist and persist mentor selection | Knowledge Drop content authoring order is independent, no hard block | Results-phase work | must follow Package E | mentor-content-matches-selection test |
| Knowledge Drop (S15) | Merge-screen work (4-way merge locked) | nothing further downstream | Mentor Commentary, Results-phase work | — | content-presence test across all 4 merged topics |
| AI decision gate resolution (§21) | Package 0 lock | S21 AI Summary completion (not S22/S25/S26, which are independent) | all other packages | must resolve before Package H is considered complete | AI-honesty test or de-scope confirmation |
| Results-phase screens (S21, S22, S25, S26) | New canonical fields, S11's `buildRecommendation` logic (reused for S22) | Supporting-module redesign (SmokeCraftChallenge/MiniTastingRound/SecondHumidorMatch surfaced from S27) | Mentor Commentary, Knowledge Drop | S21 specifically blocked on the AI decision gate; S22/S25/S26 are not | rewards/achievements data test, recommendation-reuse test |
| Supporting-module redesign + cleanup (SmokeCraftChallenge, MiniTastingRound, Leaderboard, EventChallenge, Scan, GuestPass hotspots, dead-code/asset archival) | All prior packages substantially complete (so nothing scheduled for reuse is deleted prematurely) | Final accessibility pass | — | must be last content package, before Accessibility pass | full asset-verification script + build |
| Accessibility/Responsive final pass | All content packages substantially complete | End-to-end testing | — | must precede Phase 12 | accessibility matrix, 4 viewports |
| End-to-end testing (Phase 12) | Accessibility pass | Freeze | — | must precede Freeze | full E1→E5→S1→S27 journey test + all supporting modules, proof screenshots |
| Freeze | End-to-end testing passed with zero P0 findings | — | — | terminal step | re-confirmation of all 9 Freeze Criteria (§30) |

---

## PACKAGE 0 — REQUIRED FINAL OUTPUT

1. **Final journey count:** 27 sessions, 7 phases.
2. **Final entry-screen count:** 5 (E1–E5).
3. **Final main-session screen count:** 21 screens covering the 27 sessions (screens shared via tabs: S8+S9, S12+S13, S16+S17+S18, S19+S20, S25+S26 — see Table 1).
4. **Final supporting-module count:** 13 (Table 3).
5. **Existing screens reused:** 18 — SmokeCraft landing(→E1), Enroll(→E2), Identity(→E4), Mentor(→S3 tab), Format(→S5), PairingLab(→S11), HumidorMatch(→S2), CutToastLight(→S7, split), FirstThird(→S8/S9), SecondThird(→S12/S13), FlavorMemory(→S10), FinalThird(→S16/S17/S18), Scorecard(→S19/S20), FinalReview(→S24), PassportStamp(→S23), SessionComplete(→S27), plus GoldenBox and CigarGaugeGuide reused in their new (supporting-module / merged-tab) roles.
6. **Existing screens renamed:** 12 — SmokeCraft landing, Enroll, Identity, Mentor(role), Format, PairingLab, HumidorMatch, CutToastLight, FirstThird, SecondThird, FinalThird, Scorecard, FinalReview, SessionComplete carry new session titles (some screens both reused and renamed — see Table 2's Rename column for the exact set).
7. **Existing screens merged:** 8 — Mentor(→S3 tab), SeedSoil(→S4 tab), CigarGaugeGuide(→S5 tab), WrapperStrength(→S5 tab), Origins/Vitola/PairingMastery/FlavorDNA (4 screens →S15 Knowledge Drop), FinalReview(→S24 repurpose), SessionComplete(→S27 repurpose), Scorecard's notes field(→S20).
8. **Existing screens split:** 1 — CutToastLight → S6 (new) + S7 (existing route retained).
9. **Existing screens redesigned:** 4 (as supporting modules) — SmokeCraftChallenge, SecondHumidorMatch, MiniTastingRound, Leaderboard; +2 more flagged for redesign-or-decide — EventChallenge (redesign), HowItWorks (decide).
10. **New screens required:** 10 — Venue Select(E3), Resume(E5), Welcome(S1), Meet Your Cigar(S3), Mentor Commentary(S14), Knowledge Drop(S15), AI Summary(S21), Personalized Pairing Recommendations(S22), Rewards(S25), Achievements(S26, tab of S25's screen).
11. **New routes required:** 8 — `/smokecraft/venue-select`, `/smokecraft/resume`, `/smokecraft/welcome`, `/smokecraft/meet-your-cigar`, `/smokecraft/choose-cut`, `/smokecraft/mentor-commentary`, `/smokecraft/knowledge-drop`, `/smokecraft/ai-summary`, `/smokecraft/pairing-recommendations`, `/smokecraft/rewards` (10 routes; existing working routes are preserved unchanged per the locked decision rule, not renamed).
12. **Obsolete routes or screens:** `shape-size-burn` alias, `smokecraft/session-1..session-4` legacy aliases, old `mentor-selection`/`seed-soil`/`origins`/`vitola`/`pairing-mastery`/`flavor-dna`/`wrapper-strength` routes (become redirects into their merge targets or are removed), `Format.legacy.jsx`, 12 orphaned components, ~100+ orphaned image files, and the entire legacy `VISIT_STRUCTURE`/8-visit/24-session code construct.
13. **First technical implementation package after Package 0:** **Package A — Persistence Consolidation (expanded scope)**.
14. **Exact files expected to change in that next package:** `src/context/SmokeCraftJourneyContext.jsx` (new canonical fields + STATE_VERSION 2→3 migration) + the 8 shadow-key page files — `src/pages/smokecraft/Connections.jsx`, `GoldenBox.jsx`, `Identity.jsx`, `Scorecard.jsx`, `FinalThird.jsx`, `FlavorMemory.jsx`, `PassportStamp.jsx`, `SessionComplete.jsx`. No route files, no other React components, no images.
15. **Tests required before moving forward:** persistence suite confirming zero shadow localStorage/sessionStorage keys remain across all 8 files; new-field presence test confirming every field listed in §16 exists with a safe default; STATE_VERSION migration test confirming a fixture v2 session upgrades to v3 without data loss; full existing regression suite (`verify-interactions.mjs`, `verify-all-smokecraft-assets.mjs`, `final-acceptance.mjs`) must not regress below its current pass count; `npm run build` green.
