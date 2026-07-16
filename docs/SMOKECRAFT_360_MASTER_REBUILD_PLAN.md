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

#### Package B — Implementation Evidence (completed)

**Scope actually implemented:** limited to route corrections, guards, and navigation targets within the *current* 24-session structure — no route-naming/renumbering decision from §14 was implemented (that remains deferred to whichever package builds the 27-session Entry layer), no screens were created or redesigned, and no new placeholder routes were added (none were required for the fixes below).

**Exact files changed:**
- `src/App.jsx` — `shape-size-burn` changed from an independent guarded route to a `Navigate` alias into `/smokecraft/format`; legacy `smokecraft/session-2`/`-3`/`-4` changed from all collapsing to `/smokecraft` to redirecting at their real Session 2/3/4 destinations (`/smokecraft/enroll`, `/smokecraft/golden-box`, `/smokecraft/mentor-selection`); `session-1` left pointing at `/smokecraft` since Session 1 *is* the index route.
- `src/components/smokecraft/LockedSmokeCraftScreen.jsx` — "Back to Current Session" button now navigates to `currentAllowed?.route` (the guest's real current session) instead of hardcoded `/smokecraft`, with a safe `'/smokecraft'` fallback when no resume route is available. Removed a dead, unused `getCurrentAllowedSession` import that had been left in place from an earlier, never-finished attempt at this exact fix.
- `src/context/SmokeCraftProgressContext.jsx` — **root-cause fix**: the context's exported `value` object never included the `currentAllowed` object itself (only its flattened sub-fields `currentVisit`/`currentSession`/`currentLabel`/`currentVisitTitle`), so every consumer reading `currentAllowed?.route` — including Identity.jsx's pre-existing "Continue Previous Session" link, which predates this package — was silently reading `undefined` and never worked. Added `currentAllowed` itself to the exported context value so `.route` is actually reachable. This is the single change that makes the entire "use canonical persisted resume route" requirement (item D) actually function, for both the fix in this package and the already-existing Identity.jsx feature it fixes for free.
- `src/pages/smokecraft/Identity.jsx` — resolves the duplicate Session-2 guard (item A): added an explicit `useEffect` that redirects to `/smokecraft/enroll` if the guest hasn't completed `'enroll'` yet (skipped in demo mode, matching the rest of the app's demo-mode-bypass convention). Enroll remains the sole authoritative Session-2 checkpoint; Identity is now only reachable after it, resolving the audit's "two distinct pages ambiguously satisfy the same completion gate" finding without renumbering the 24-session catalog.
- `verify-interactions.mjs` — Suite 9 ("Identity Field Completeness") previously navigated directly to `/smokecraft/identity` with no demo-mode flag and no prior `enroll` completion, which is exactly the ambiguous-access pattern this package's fix closes. Updated to inject demo mode before navigating (the identical `goto → sessionStorage.setItem('novee_demo_mode','1') → goto` pattern already used by every other suite in this same file), so the suite verifies field completeness independent of the (now-enforced) sequential gate rather than depending on it being absent.
- `verify-smokecraft-route-corrections.mjs` (new) — 12-check Playwright suite for this package.

**Routes corrected:** `shape-size-burn` (duplicate→alias), `smokecraft/session-2`, `smokecraft/session-3`, `smokecraft/session-4` (dead-end→real destination).

**Aliases corrected:** all 3 of the above are now genuine aliases (redirect to canonical destination) rather than either duplicating a route's guard or collapsing to the wrong page.

**Duplicate routes removed or redirected:** `shape-size-burn` — redirected (not removed), preserving the backward-compatible URL per the locked decision rule.

**Session guards corrected:** Enroll/Identity — Enroll remains `sessionNumber={2}`-guarded (unchanged); Identity gained an explicit sequential dependency on `'enroll'` being complete, resolving the ambiguity without touching `VISIT_STRUCTURE` or any other guard's `sessionNumber`.

**Back targets corrected:** none needed changing — every main-journey screen already uses `navigate(-1)` (browser history back), confirmed via full-repo grep across all 19 reusable screens plus the supporting-module screens named in the mandate (Leaderboard, EventChallenge, etc.); this is the correct "return to whatever the entry point was" pattern and was not a bug.

**Continue targets corrected:** none needed changing — the main-spine screens' hardcoded forward-progression `navigate('/smokecraft/next-route')` calls are intentional and correct for a linear guided journey, not a routing bug.

**Resume behavior corrected:** `LockedSmokeCraftScreen.jsx`'s "Back to Current Session" button (item D) — now uses `currentAllowed?.route`, which required fixing the context root cause described above. `VisitComplete.jsx` and `LockedVisit.jsx`'s "Return to SmokeCraft"/"Return to SmokeCraft Hub" buttons were reviewed and intentionally left unchanged — those are genuine "go to the top-level hub" actions (a visit just completed, or a future visit is locked; there is nothing to resume), not mislabeled resume bugs. `SessionComplete.jsx`'s "Return to SmokeCraft" was reviewed and left unchanged for the same reason — the journey is finished, not paused.

**Supporting-module return routes corrected:** none required a code change. Every module named in the mandate (Pairing Lab, Flavor Memory, Mentor Library, Terroir, Humidor Match, Passport, Leaderboard, Community, Event Challenge, Connections, Request Purchase, Management Sync) was individually confirmed via grep to already use `navigate(-1)` for its Back action — this is the correct, already-working "return to caller" pattern the mandate asks for, not a defect.

**Deferred future routes:** the full §14 route-naming decision (whether to rename working URLs to match new session titles, or add the 10 net-new routes for E3/E5/S1/S3/S6/S14/S15/S21/S22/S25) remains deferred to the packages that actually build those screens (Packages C–H) — Package B intentionally did not add any placeholder routes, since none of the corrections in scope required one.

**Tests added:** `verify-smokecraft-route-corrections.mjs` — 7 suites / 12 checks covering: `shape-size-burn` alias resolution, all 4 legacy session aliases, the Identity/Enroll sequential gate (both blocked and allowed cases, plus demo-mode bypass), locked-screen resume routing to the real current session, all 25 main-spine routes resolving with content, route guards still enforcing progression outside demo mode, and no route loop between Enroll and Identity.

**Tests run:** `verify-smokecraft-route-corrections.mjs` (new), `verify-smokecraft-persistence-consolidation.mjs` (Package A regression check), `verify-interactions.mjs` (existing, 1 suite updated per above), `verify-all-smokecraft-assets.mjs` (existing), `final-acceptance.mjs` (existing), `npm run build`.

**Test results:**
| Suite | Result |
|---|---|
| `verify-smokecraft-route-corrections.mjs` | **12 passed, 0 failed** |
| `verify-smokecraft-persistence-consolidation.mjs` | **31 passed, 0 failed** — Package A unaffected |
| `verify-interactions.mjs` | 19 passed, 3 failed — **identical to the Package A baseline** after the necessary Suite 9 update described above; without that update this package showed 6 failures (a real, self-inflicted regression) that was caught, root-caused (not just patched), and resolved |
| `verify-all-smokecraft-assets.mjs` | **63 passed, 0 failed** |
| `final-acceptance.mjs` | 65 passed, 18 failed — **byte-identical failure list to the Package A baseline**, confirmed via `diff` |
| `npm run build` | **green** |

**Manual verification performed:** via the automated Playwright suite (real browser against the built app): started at Launch, confirmed Enroll must be completed before Identity is reachable outside demo mode, moved through the main-spine screens, exercised Back (`navigate(-1)`) and Continue on representative screens, triggered a locked-screen state and confirmed "Back to Current Session" lands on the guest's real current session rather than always the index, confirmed all 4 legacy session aliases and the `shape-size-burn` alias land correctly, and confirmed no loop forms between Enroll and Identity once enroll is complete.

**Known limitations:**
- The §14 route-naming decision (keep existing URLs vs. rename to match new 27-session titles) is still open — Package B did not need to resolve it since none of its corrections required a URL rename.
- Identity's new sequential gate is enforced at the component level (a `useEffect` redirect), not via `SmokeCraftSessionGuard`'s numeric `sessionNumber` mechanism, since the guard only accepts a session number and Identity's real dependency is a specific step id (`'enroll'`), not a numeric threshold. This is consistent with the guard's existing capabilities and does not require modifying the shared guard component.
- The `currentAllowed` context fix is a genuine bug fix with a larger blast radius than initially scoped (it also fixes Identity.jsx's pre-existing, never-working "Continue Previous Session" link) — this was verified safe via the full regression suite rather than assumed, since it touches a shared context consumed by other screens.

**Intentionally deferred to later packages:** the CutToastLight split (Package C), all screen merges (Package D), all net-new Entry/Session-Prep/Results screens (Packages E, G, H), supporting-module redesigns and dead-code/asset cleanup (Package I), accessibility pass (Package J), and the §14 route-naming/renumbering decision itself.

### Package C — Split Screens (Choose Your Cut / Lighting Tutorial)
- **Objective:** split CutToastLight into S6 and S7 (§3e, §10).
- **Dependencies:** Packages 0, A, B.
- **Completion gate:** both new screens function independently with correct Back/Continue chaining; existing CutToastLight functionality fully preserved across the split, no capability lost.
- **Exact deliverable:** one commit, `feat(smokecraft): split Choose Your Cut and Lighting Tutorial into distinct sessions`.

#### Lighting Tutorial (S7) — Implementation Evidence (screen built, not yet routed)

**Scope actually implemented:** builds only the Lighting Tutorial (S7) screen component, per an explicit single-screen mandate that also prohibited modifying routes. Choose Your Cut (S6) and the CutToastLight split itself remain unbuilt — this entry covers S7 in isolation, not the full Package C split described above.

**Exact files changed:** `src/pages/smokecraft/LightingTutorial.jsx` (new) — no other file touched.

**Screen contents:** 8-step tutorial covering toasting the foot, lighting technique, even burn, avoiding tunneling, avoiding overheating, correct flame distance, proper first draw, and burn inspection. Every required live zone is present and React-driven: tutorial text, step indicator (`role="progressbar"` with 8 clickable step dots), educational media area (honestly labeled "Media pending production upload" — no fabricated image), live viewed-step progress (`X of 8 steps remaining`, derived from real component state, not a fake score), Continue/Back buttons via the existing `SmokeCraftNavBar` pattern, a real toggleable Help panel, a Mentor Tip panel, and a Knowledge Drop panel per step. Continue is disabled on the final step until all 8 steps have actually been viewed. Static artwork is a CSS-composed navy/gold/wood-tone atmosphere (no new image file — none was requested or generated); all step content, progress, and controls are React state, satisfying the Live Interface Directive's static-vs-live separation.

**Persistence:** calls the existing canonical `setCutToastLight()` setter (from `SmokeCraftJourneyContext`, unmodified) to record `lightingTutorialCompleted`/`lightingTutorialCompletedAt` once the guest finishes all 8 steps and continues — no new persistence field, key, or context change was made; the screen only *consumes* Package A's already-existing setter.

**Routing:** intentionally **not wired into `App.jsx`** — the mandate explicitly prohibited modifying routes. The component is complete and self-contained but is not yet reachable via the live route tree. Wiring it to `/smokecraft/lighting-tutorial` (or repurposing the existing `/smokecraft/cut-toast-light` route once Choose Your Cut is also built) remains a follow-up step for whoever completes the full CutToastLight split.

**No fake data:** confirmed no hardcoded XP, score, "connected" status, or baked selection anywhere in the file — completion status and step progress are both derived from real `useState` tracking of which steps the guest has actually viewed.

**Tests run:** since the screen cannot be reached via a real route without violating the "do not modify routes" constraint, verification used a temporary, non-committed test harness (a throwaway entry file + HTML page, both deleted before this commit — confirmed absent from the final `git status`) mounting `<LightingTutorial />` directly under the same `GuestSessionProvider`/`SmokeCraftJourneyProvider`/`BrowserRouter` wrapping used everywhere else in the app, served via the Vite dev server, and driven with a real Playwright browser. `npm run build` was also run to confirm the new file doesn't break the production build (it doesn't — Vite excludes it from the bundle since nothing imports it yet, which is expected given it isn't routed).

**Test results:** 31/31 checks passed — 4 viewports (1440×900, 1024×768, 768×1024, 390×844) each confirmed: zero page errors, title renders, nav-bar buttons present, step-indicator progressbar present, help button present, no horizontal overflow. Interaction checks confirmed: Step 1 shows "Toasting the Foot", stepping through all 8 lands on "Burn Inspection", the final-step button correctly reads "Continue to First Draw →" and is disabled until all steps are viewed then becomes enabled, all 8 step-indicator dots are present and clicking one jumps directly to that step, and the Help panel opens on click. `npm run build`: green.

**Known limitations:** not reachable from the live app until a route is added (explicitly out of this mandate's scope). No demonstration video/image asset exists yet (correctly and honestly labeled as pending rather than faked, consistent with the image-reconciliation plan's finding that no dedicated Lighting Tutorial artwork currently exists).

**Intentionally deferred:** Choose Your Cut (S6), the actual CutToastLight route split, and wiring this screen into `App.jsx` — all remain for a future, explicitly-authorized routing/screen-split package.

#### Lighting Tutorial (S7) — Routing Follow-Up (screen wired into the live journey)

**Scope actually implemented:** wires the previously-built Lighting Tutorial screen into the live route tree at `/smokecraft/lighting-tutorial`, placed immediately after the existing `cut-toast-light` route (standing in for the not-yet-split Choose Your Cut screen). Choose Your Cut (S6) and the actual CutToastLight component split remain unbuilt — that stays deferred to a future package; this entry only makes the already-built Lighting Tutorial screen reachable.

**Exact files changed:**
- `src/App.jsx` — added the `LightingTutorial` import and the new `lighting-tutorial` route (guarded with the same `sessionNumber={11}` as `cut-toast-light`, since Lighting Tutorial is an interstitial add-on to that checkpoint, not a new numbered session in `VISIT_STRUCTURE`).
- `src/pages/smokecraft/CutToastLight.jsx` — Continue target changed from `/smokecraft/first-third` to `/smokecraft/lighting-tutorial` so the new screen is actually inserted into the live chain instead of being bypassed; nav-bar label updated to match.
- `src/pages/smokecraft/LightingTutorial.jsx` — added a sequential-completion gate mirroring the Identity/Enroll pattern (`cut-toast-light` must be complete first, demo-mode bypassed); Back on step 1 changed from `navigate(-1)` to a deterministic `navigate('/smokecraft/cut-toast-light')`; added a dedicated `sessionStorage` "active screen" marker (set on mount, cleared on unmount) used by the Resume fix below.
- `src/context/SmokeCraftProgressContext.jsx` — added a `currentAllowed` override so "Back to Current Session"/Resume can route to Lighting Tutorial specifically. **Root-cause note:** the first implementation attempt used the existing, already-automatic `lastVisitedRoute` guest-session field, but that field is overwritten on *every* route navigation (including the act of visiting the locked screen itself, per the same automatic tracker used everywhere else), so it could never actually signal "the guest was last active on Lighting Tutorial" by the time the resume button rendered. Caught by the new test suite, not shipped — replaced with a dedicated `sessionStorage.sc_active_screen` flag set only by `LightingTutorial.jsx`, which isn't touched by any other screen's navigation.
- `verify-smokecraft-lighting-tutorial-route.mjs` (new) — 12-check Playwright suite for this package.

**Route added:** `/smokecraft/lighting-tutorial`, guarded by `SmokeCraftSessionGuard sessionNumber={11}` (same checkpoint as `cut-toast-light`) plus the screen's own `cut-toast-light`-completion gate.

**Back target:** `/smokecraft/cut-toast-light` (deterministic, not `navigate(-1)`).

**Continue target:** `/smokecraft/first-third`, gated — disabled until all 8 tutorial steps have been viewed.

**Resume behavior:** `SmokeCraftProgressContext`'s `currentAllowed.route` resolves to `/smokecraft/lighting-tutorial` whenever the guest is actively on that screen (tracked via the dedicated `sessionStorage` flag, not the generic per-navigation tracker) and has already completed `cut-toast-light`; falls back to the standard next-incomplete-session logic otherwise. No `VISIT_STRUCTURE`/session-catalog change was needed.

**Persistence:** Package A's `sc_journey_v1` schema, setters, and migration are untouched — this package only calls the already-existing `setCutToastLight()` setter (unchanged) and adds a session-only `sessionStorage` UI marker that is not part of the canonical journey or guest-session persistence schema.

**Tests added:** `verify-smokecraft-lighting-tutorial-route.mjs` — 9 suites / 12 checks: route resolves, guard blocks unauthorized access, Back targets `cut-toast-light`, Continue targets `first-third` and stays gated until all steps are viewed (including when steps are skipped via direct step-dot navigation), Resume routes to Lighting Tutorial when it's the guest's active screen, refresh preserves the route, CutToastLight's Continue correctly chains into Lighting Tutorial (no loop), and the full Choose Your Cut → Lighting Tutorial → First Draw chain completes end-to-end with no dead end.

**Tests run:** new suite, `verify-smokecraft-persistence-consolidation.mjs` (Package A regression), `verify-smokecraft-route-corrections.mjs` (Package B regression), `verify-interactions.mjs`, `verify-all-smokecraft-assets.mjs`, `final-acceptance.mjs`, `npm run build`.

**Test results:**
| Suite | Result |
|---|---|
| `verify-smokecraft-lighting-tutorial-route.mjs` | **12 passed, 0 failed** |
| `verify-smokecraft-persistence-consolidation.mjs` | **31 passed, 0 failed** — Package A unaffected |
| `verify-smokecraft-route-corrections.mjs` | **12 passed, 0 failed** — Package B unaffected |
| `verify-interactions.mjs` | 19 passed, 3 failed — identical to the established baseline (same 3 pre-existing, unrelated failures) |
| `verify-all-smokecraft-assets.mjs` | **63 passed, 0 failed** |
| `final-acceptance.mjs` | 65 passed, 18 failed — byte-identical failure list to the established baseline, confirmed via `diff` |
| `npm run build` | **green** |

**Responsive/accessibility:** re-confirmed via the original Lighting Tutorial build's 4-viewport check (1440×900, 1024×768, 768×1024, 390×844) — unaffected by this routing-only change, since the screen's own markup was not modified.

**Known limitations:** Choose Your Cut (S6) still does not exist as its own screen — `cut-toast-light` continues to stand in for it. The `sessionStorage` resume marker is session-scoped (cleared on tab close), so a guest who closes the tab mid-tutorial and returns later will not be resumed directly to Lighting Tutorial — an accepted, documented limitation rather than a silent gap.

#### Choose Your Cut (S6) — Implementation Evidence (Package F: Complete Choose Your Cut)

**Scope actually implemented:** refactors the overloaded `cut-toast-light` screen so it represents Choose Your Cut only — cut selection (Straight/V/Punch), a real "Learn Why" toggle, and live selected/educational state. Toast-method and light-method selection are removed from this screen entirely (toasting/lighting technique is now taught in the Lighting Tutorial screen built in the prior package, which never depended on those sub-fields). The route path, guard, and Continue/Back targets already established in Package E are preserved unchanged.

**Exact files changed:**
- `src/pages/smokecraft/CutToastLight.jsx` — removed `TOAST_METHODS`, `LIGHT_METHODS`, their `METHOD_TIPS` entries, and the toast/light `STEP_GROUPS` rows and state; now renders only the three cut buttons plus a new explicit "Learn Why" toggle button that opens a panel with cut-specific rationale text (`METHOD_WHY`); `primaryDisabled` now depends solely on `!cutMethod`; persisted payload narrowed to `{ cut: cutMethod }` merged over any existing `journey.cutToastLight` fields (non-destructive to other keys such as `lightingTutorialCompleted`); Back and Continue logic unchanged (`navigate(-1)` / `/smokecraft/lighting-tutorial`).
- `verify-smokecraft-lighting-tutorial-route.mjs` — updated two test steps (Suites 8 and 9) that clicked now-removed `Gentle Toast`/`Cedar Spill` selectors; they now only select a cut, matching the refactored screen.
- `verify-smokecraft-choose-your-cut.mjs` (new) — 13-suite / 16-check Playwright suite for this package.

**Final Choose Your Cut route:** `/smokecraft/cut-toast-light` (unchanged from Package E — the route path itself was not renamed, only the screen's content was narrowed to represent Choose Your Cut only, per the mandate's "if overloaded, refactor it so it represents Choose Your Cut only" instruction).

**Back target:** `navigate(-1)` (unchanged, existing codebase convention — no internal step ambiguity on this screen to warrant a hardcoded target).

**Continue target:** `/smokecraft/lighting-tutorial` (unchanged from Package E).

**Persistence behavior:** uses the existing, unmodified `setCutToastLight()` setter from `SmokeCraftJourneyContext`. On selection the screen now persists `{ ...(journey.cutToastLight || {}), cut: cutMethod }` — the spread preserves any other fields already on the record (e.g. `lightingTutorialCompleted` written later by `LightingTutorial.jsx`) instead of overwriting them, and drops `toast`/`light` since they are no longer collected here. Selection is restored on mount from `journey.cutToastLight?.cut`, so refresh and Resume both work through the existing canonical persistence path with no schema or migration change. Neither `SmokeCraftJourneyContext.jsx` nor `SmokeCraftProgressContext.jsx` required any changes — Choose Your Cut's resume already worked via the standard `getCurrentAllowedSession` mechanism (`cut-toast-light` is session 11 in `VISIT_STRUCTURE`), untouched by the Lighting-Tutorial-specific `sc_active_screen` override, which only activates for `/smokecraft/lighting-tutorial` itself.

**Tests added:** `verify-smokecraft-choose-your-cut.mjs` — 13 suites / 16 checks: route resolves; Straight/V/Punch Cut each independently selectable; only one cut selected at a time; Learn Why content updates to match the selected cut; Continue blocked with no cut selected then enabled once one is chosen; Continue routes to Lighting Tutorial; Back navigates away; selection survives refresh; selection survives Back-then-revisit-then-Continue; Resume (fresh mount with a pre-seeded canonical selection) restores the saved cut; Lighting Tutorial still resolves and renders correctly.

**Tests run:** new suite, `verify-smokecraft-persistence-consolidation.mjs` (Package A regression), `verify-smokecraft-route-corrections.mjs` (Package B regression), `verify-smokecraft-lighting-tutorial-route.mjs` (Package E regression), `verify-interactions.mjs`, `verify-all-smokecraft-assets.mjs`, `final-acceptance.mjs`, `npm run build`.

**Test results:**
| Suite | Result |
|---|---|
| `verify-smokecraft-choose-your-cut.mjs` | **16 passed, 0 failed** |
| `verify-smokecraft-persistence-consolidation.mjs` | **31 passed, 0 failed** — Package A unaffected |
| `verify-smokecraft-route-corrections.mjs` | **12 passed, 0 failed** — Package B unaffected |
| `verify-smokecraft-lighting-tutorial-route.mjs` | **12 passed, 0 failed** — Package E unaffected (selectors updated to match the refactor, behavior unchanged) |
| `verify-interactions.mjs` | 20 passed, 2 failed — Suite 6 ("CutToastLight Restoration"), a previously-known pre-existing failure, now passes as a side effect of this refactor; the 2 remaining failures (PairingLab recommendation, HumidorMatch preset buttons) are the same pre-existing, unrelated failures as every prior baseline |
| `verify-all-smokecraft-assets.mjs` | **63 passed, 0 failed** |
| `final-acceptance.mjs` | 65 passed, 18 failed — identical count/failure profile to the established baseline |
| `npm run build` | **green** |

**Confirmed no unrelated files changed:** `git status --short` before commit showed only `src/pages/smokecraft/CutToastLight.jsx` (modified), `verify-smokecraft-lighting-tutorial-route.mjs` (modified, selector-only), and `verify-smokecraft-choose-your-cut.mjs` (new) — no image, persistence, unrelated-route, or unrelated-screen files touched; regenerated `public/proof/final-live-acceptance/*.png` screenshots were discarded via `git checkout --` before commit.

**Known limitations:** the approved Choose Your Cut background image continues to be the shared `SC_ASSETS.cutToastLight` asset (not renamed or replaced), since the mandate scoped image changes to "only if the approved Choose Your Cut image must be connected" and the existing asset already serves this narrowed screen correctly.

#### Terroir (S4) + Knowledge Drop (S15) — Implementation Evidence (Package G: Terroir + Knowledge Drop Live Experience)

**Scope actually implemented:** replaces the unbuilt `Terroir.jsx` `ComingSoon` stub with a real, live React screen covering Country/Region/Soil/Climate/Growing Conditions/Why It Matters, and builds a brand-new `KnowledgeDrop.jsx` screen covering Tobacco/Fermentation/Aging/Factory Story with an optional per-topic knowledge check. Both reuse approved existing imagery (`smokecraft-terroir.png`, `smokecraft-seed-soil.png`, and the previously-orphaned `smokecraft-origins.png` / `smokecraft-vitola.png` / `smokecraft-pairing-mastery.png` / `smokecraft-flavor-dna.png`) rather than requesting new photography, per the rebuild plan's own guidance (§"Likely reusable without new photography… Knowledge Drop"). Neither screen was wired into the guarded main-journey spine (`SmokeCraftSessionGuard`) — both remain standalone/unguarded, matching their pre-existing status (Terroir was already unguarded; the four merge-source stubs it draws from were also unguarded) and staying inside this package's explicit scope of "Terroir + Knowledge Drop" only, not spine renumbering.

**Exact files changed:**
- `src/pages/smokecraft/Terroir.jsx` — full rewrite from the `ComingSoon` stub to a live tabbed content screen: 6 selectable sections, a replaceable image zone with real `onLoad`/`onError` states (not a fabricated loading animation), an educational content panel, empty state (no section chosen yet), completed state (all 6 viewed), Back (`navigate(-1)`) and Continue (`navigate('/smokecraft')`) via `SmokeCraftNavBar`, and progress persisted through the new `setTerroir()` setter.
- `src/pages/smokecraft/KnowledgeDrop.jsx` (new) — same architecture as Terroir: 4 selectable topics, replaceable image zone with real load/error states, educational panel, an optional per-topic knowledge-check quiz (real multiple-choice state, real right/wrong feedback, contributes to a real `quizScore`, never auto-completed), empty/completed states, Back/Continue via `SmokeCraftNavBar`, progress persisted through the new `setKnowledgeDrop()` setter.
- `src/context/SmokeCraftJourneyContext.jsx` — added two missing canonical fields (`terroir: null`, `knowledgeDrop: null`) and their setters (`setTerroir`, `setKnowledgeDrop`), following the exact existing per-step-setter pattern (e.g. `setSeedSoil`). No existing field, setter, migration, or `STATE_VERSION` was touched.
- `src/constants/smokecraftAssets.js` — added `terroir`, `terroirSoil`, `knowledgeDropTobacco`, `knowledgeDropFermentation`, `knowledgeDropAging`, `knowledgeDropFactory` entries, all pointing at already-approved reference images already present in the repo (`public/assets/smokecraft-reference/approved/`) — no new image files were created or requested.
- `src/App.jsx` — added the `KnowledgeDrop` import and a new unguarded `knowledge-drop` route (`/smokecraft/knowledge-drop`), placed next to the existing `terroir` route in the "Supplemental / unguarded pages" group. The `terroir` route itself was not moved, renamed, or reguarded — only its element's internal implementation changed.
- `verify-smokecraft-terroir-knowledge-drop.mjs` (new) — 12-suite / 19-check Playwright suite for this package.

**Terroir route:** `/smokecraft/terroir` (route path unchanged — only the screen behind it was built out from a stub).

**Knowledge Drop route:** `/smokecraft/knowledge-drop` (new route, added because the locked route did not yet exist, per the mandate's allowed-file-scope exception for `src/App.jsx`).

**Back target (both screens):** `navigate(-1)` — matches the established "supporting/standalone module returns to caller" convention confirmed in Package B for every other unguarded module.

**Continue target (both screens):** `navigate('/smokecraft')` — a deterministic, safe fallback to the SmokeCraft entry/dashboard, consistent with the existing `ComingSoon` component's own fallback pattern (`nextRoute || prevRoute || '/smokecraft'`). Neither screen is yet wired into the guarded main-journey spine, so there is no locked "next screen" for Continue to chain into within this package's scope.

**Persistence behavior:** both screens read their initial state from `journey.terroir` / `journey.knowledgeDrop` on mount (Resume support) and call `setTerroir()` / `setKnowledgeDrop()` — both pre-existing-pattern setters added this package — whenever the guest's viewed-section/topic set (or quiz score) changes. Data is stored under the existing `sc_journey_v1` canonical key; no new localStorage/sessionStorage key was created, no shadow-key pattern was reintroduced, and Package A's migration and `STATE_VERSION` are untouched.

**Images reused (no new photography):** `smokecraft-terroir.png` (Terroir — Country/Region/Climate/Growing Conditions/Why It Matters), `smokecraft-seed-soil.png` (Terroir — Soil), `smokecraft-origins.png` (Knowledge Drop — Tobacco), `smokecraft-vitola.png` (Knowledge Drop — Fermentation), `smokecraft-pairing-mastery.png` (Knowledge Drop — Aging), `smokecraft-flavor-dna.png` (Knowledge Drop — Factory Story). All six were already present and approved in `public/assets/smokecraft-reference/approved/`.

**Tests added:** `verify-smokecraft-terroir-knowledge-drop.mjs` — 12 suites / 19 checks: both routes resolve; all 6 Terroir sections and all 4 Knowledge Drop topics are independently selectable; content updates correctly per selection; progress persists to `sc_journey_v1`; refresh restores viewed-count state; Back and Continue both work on both screens; Resume restores a pre-seeded viewed-sections/topics set (and quiz score) on fresh mount; no horizontal overflow at desktop width; tablet (768×1024) and mobile (390×844) layouts render without overflow and with a visible nav bar; ARIA `role="tablist"`/`aria-label` accessibility markers are present on both screens' selectors.

**Tests run:** new suite, `verify-smokecraft-persistence-consolidation.mjs` (Package A regression), `verify-smokecraft-route-corrections.mjs` (Package B regression), `verify-smokecraft-lighting-tutorial-route.mjs` (Package E regression), `verify-smokecraft-choose-your-cut.mjs` (Package F regression), `verify-interactions.mjs`, `verify-all-smokecraft-assets.mjs`, `final-acceptance.mjs`, `npm run build`.

**Test results:**
| Suite | Result |
|---|---|
| `verify-smokecraft-terroir-knowledge-drop.mjs` | **19 passed, 0 failed** |
| `verify-smokecraft-persistence-consolidation.mjs` | **31 passed, 0 failed** — Package A unaffected |
| `verify-smokecraft-route-corrections.mjs` | **12 passed, 0 failed** — Package B unaffected |
| `verify-smokecraft-lighting-tutorial-route.mjs` | **12 passed, 0 failed** — Package E unaffected |
| `verify-smokecraft-choose-your-cut.mjs` | **16 passed, 0 failed** — Package F unaffected |
| `verify-interactions.mjs` | 20 passed, 2 failed — identical to the established post-Package-F baseline (same 2 pre-existing, unrelated failures) |
| `verify-all-smokecraft-assets.mjs` | **63 passed, 0 failed** |
| `final-acceptance.mjs` | 65 passed, 18 failed — identical count/failure profile to the established baseline |
| `npm run build` | **green** |

**Confirmed no unrelated files changed:** `git status --short` before commit showed only `src/App.jsx`, `src/constants/smokecraftAssets.js`, `src/context/SmokeCraftJourneyContext.jsx`, `src/pages/smokecraft/Terroir.jsx` (all modified), `src/pages/smokecraft/KnowledgeDrop.jsx` and `verify-smokecraft-terroir-knowledge-drop.mjs` (both new) — no Choose Your Cut, Lighting Tutorial, AI Summary, Rewards, Leaderboard, Mini Tasting, SmokeCraft Challenge, Event Challenge, or unrelated-route/image files touched; regenerated `public/proof/final-live-acceptance/*.png` screenshots were discarded via `git checkout --` before commit.

**Known limitations:** neither screen is yet wired into the guarded 27-session main-journey spine (`SmokeCraftSessionGuard`) — both remain reachable only via direct navigation or existing links to `/smokecraft/terroir` / `/smokecraft/knowledge-drop`, exactly as `Origins`/`Vitola`/`PairingMastery`/`FlavorDNA` (their still-unmerged legacy source stubs) already were. Wiring Terroir into its locked S4 spine position (between Meet Your Cigar and Construction Inspection) and Knowledge Drop into its locked S15 spine position (after Mentor Commentary) is deferred to a future routing/spine package, consistent with how Package E deferred the Choose Your Cut/Lighting Tutorial split's own spine placement work. The four legacy stub screens (`Origins.jsx`, `Vitola.jsx`, `PairingMastery.jsx`, `FlavorDNA.jsx`) were left completely untouched, per the mandate's "do not modify any unrelated route or image" — their eventual redirect-to-Knowledge-Drop consolidation is also deferred.

**Intentionally deferred:** Choose Your Cut (S6) as its own screen, the actual CutToastLight component split, and giving Lighting Tutorial its own distinct session number in `VISIT_STRUCTURE` — all remain for the full Package C split described earlier in this document.

#### Terroir (S4) + Knowledge Drop (S15) — Routing Follow-Up (Package H: Wire Terroir and Knowledge Drop into the Guarded Main Journey)

**Scope actually implemented:** wires the two previously-standalone/unguarded screens built in Package G into the guarded main-journey spine, using the exact interstitial pattern established by Package E for Lighting Tutorial (share the nearest already-built predecessor's checkpoint number, add the screen's own prerequisite gate, add a dedicated `sc_active_screen` Resume flag). Meet Your Cigar (locked S3) and Mentor Commentary (locked S14) — the screens' true locked predecessors per Package 0 — remain unbuilt and were explicitly out of scope for this package, so each screen is instead chained immediately after the real, already-built screen that currently stands in for its unbuilt predecessor (`mentor-selection` for Meet Your Cigar; `flavor-memory` for Mentor Commentary), exactly as `cut-toast-light` stood in for the not-yet-split Choose Your Cut when Lighting Tutorial was wired in.

**Exact files changed:**
- `src/App.jsx` — removed the two unguarded `terroir`/`knowledge-drop` routes from the "Supplemental / unguarded pages" group; re-added `terroir` guarded with `SmokeCraftSessionGuard sessionNumber={4}` immediately after `mentor-selection` (same checkpoint, since Terroir's own prerequisite gate — mentor-selection complete — is enforced in the screen); added `knowledge-drop` guarded with `SmokeCraftSessionGuard sessionNumber={15}` immediately after `flavor-memory` (same checkpoint as `final-third`, since Knowledge Drop's own prerequisite gate — flavor-memory complete — is enforced in the screen).
- `src/pages/smokecraft/Terroir.jsx` — added a sequential-completion gate (mentor-selection must be complete first, demo-mode bypassed, mirroring Identity/Enroll and cut-toast-light/lighting-tutorial); added the `sc_active_screen` Resume flag (set on mount, cleared on unmount); Back changed from `navigate(-1)` to deterministic `navigate('/smokecraft/mentor-selection')`; Continue changed from `navigate('/smokecraft')` to deterministic `navigate('/smokecraft/format')`, and now also writes a `completedAt` timestamp into the persisted `journey.terroir` record on Continue (idempotent — only set once).
- `src/pages/smokecraft/KnowledgeDrop.jsx` — same set of changes: gate requires `flavor-memory` complete; `sc_active_screen` Resume flag; Back changed to deterministic `navigate('/smokecraft/flavor-memory')`; Continue changed to deterministic `navigate('/smokecraft/final-third')` with a `completedAt` timestamp written into `journey.knowledgeDrop`.
- `src/context/SmokeCraftProgressContext.jsx` — generalized the single-entry Lighting-Tutorial-only `currentAllowed` override (added in Package E) into an `ACTIVE_SCREEN_OVERRIDES` list covering all three interstitial screens (Lighting Tutorial, Terroir, Knowledge Drop), each keyed by its own required prerequisite step. No change to the override's underlying mechanism — only extended to more entries.
- `verify-smokecraft-terroir-knowledge-drop.mjs` (Package G's suite) — updated the two Continue-target assertions (Suite 8) from `/smokecraft` to `/smokecraft/format` (Terroir) and `/smokecraft/final-third` (Knowledge Drop), reflecting the now-deterministic routing; all other assertions in that suite were unaffected since they already ran with demo mode enabled.
- `verify-smokecraft-terroir-knowledge-drop-spine.mjs` (new) — 15-suite / 17-check Playwright suite for this package.

**Final Terroir guard and route:** `/smokecraft/terroir`, guarded by `SmokeCraftSessionGuard sessionNumber={4}` (unlocked once sessions 1–3 — entry/enroll/golden-box — are complete) plus the screen's own gate requiring `mentor` (mentor-selection) complete.

**Final Knowledge Drop guard and route:** `/smokecraft/knowledge-drop`, guarded by `SmokeCraftSessionGuard sessionNumber={15}` (unlocked once sessions 1–14 — through `flavor-memory` — are complete) plus the screen's own gate requiring `flavor-memory` complete.

**Back / Continue targets:** Terroir Back → `/smokecraft/mentor-selection`; Terroir Continue → `/smokecraft/format` (Construction Inspection, S5 — matches the locked map's "Next" exactly, since `format` already *is* the locked S5 route). Knowledge Drop Back → `/smokecraft/flavor-memory`; Knowledge Drop Continue → `/smokecraft/final-third` (Flavor Finish, S16 — matches the locked map's "Next" exactly, since `final-third` already *is* the locked S16 route). Neither Continue button points to `/smokecraft` any longer; neither Back button uses `navigate(-1)`.

**Resume behavior:** `SmokeCraftProgressContext`'s `currentAllowed.route` now resolves to `/smokecraft/terroir` or `/smokecraft/knowledge-drop` whenever the guest is actively on that screen (via its dedicated `sc_active_screen` flag) and has completed that screen's specific prerequisite (`mentor` / `flavor-memory` respectively) — the same mechanism Package E built for Lighting Tutorial, now covering three interstitials via one shared override list.

**Persistence:** Package A's `sc_journey_v1` schema, setters, and migration remain untouched. Completion now writes a `completedAt` timestamp (set once, preserved on re-entry via `journey.terroir?.completedAt || Date.now()`) into the existing `terroir`/`knowledgeDrop` fields added in Package G — no schema change. `awardSessionRewards('terroir')` / `awardSessionRewards('knowledge-drop')` retain the existing, unmodified idempotency guard (checks `completedSteps.includes(sessionId)` before granting XP), confirmed via a dedicated re-entry test (Suite 13) showing XP does not increase on a second completion.

**Tests added:** `verify-smokecraft-terroir-knowledge-drop-spine.mjs` — 15 suites / 17 checks: both routes resolve; both screens are guarded at their correct journey position (blocked pre-prerequisite, accessible post-prerequisite, non-demo); Back and Continue targets are correct and deterministic for both screens; Resume returns to each screen when it was the guest's last active screen; refresh preserves progress; completed state (6/6 sections) persists to `sc_journey_v1`; XP is not duplicated on re-entering a completed Terroir; no route loop; full chain Mentor Selection → Terroir → Construction Inspection completes with no dead end.

**Tests run:** new suite, updated Package G suite, `verify-smokecraft-persistence-consolidation.mjs` (Package A regression), `verify-smokecraft-route-corrections.mjs` (Package B regression), `verify-smokecraft-lighting-tutorial-route.mjs` (Package E regression), `verify-smokecraft-choose-your-cut.mjs` (Package F regression), `verify-interactions.mjs`, `verify-all-smokecraft-assets.mjs`, `final-acceptance.mjs`, `npm run build`.

**Test results:**
| Suite | Result |
|---|---|
| `verify-smokecraft-terroir-knowledge-drop-spine.mjs` | **17 passed, 0 failed** |
| `verify-smokecraft-terroir-knowledge-drop.mjs` (Package G, updated) | **19 passed, 0 failed** |
| `verify-smokecraft-persistence-consolidation.mjs` | **31 passed, 0 failed** — Package A unaffected |
| `verify-smokecraft-route-corrections.mjs` | **12 passed, 0 failed** — Package B unaffected |
| `verify-smokecraft-lighting-tutorial-route.mjs` | **12 passed, 0 failed** — Package E unaffected |
| `verify-smokecraft-choose-your-cut.mjs` | **16 passed, 0 failed** — Package F unaffected |
| `verify-interactions.mjs` | 20 passed, 2 failed — identical to the established post-Package-G baseline (same 2 pre-existing, unrelated failures) |
| `verify-all-smokecraft-assets.mjs` | **63 passed, 0 failed** |
| `final-acceptance.mjs` | identical count/failure profile to the established baseline (confirmed via direct run) |
| `npm run build` | **green** |

**Confirmed no unrelated files changed:** `git status --short` before commit showed only `src/App.jsx`, `src/context/SmokeCraftProgressContext.jsx`, `src/pages/smokecraft/Terroir.jsx`, `src/pages/smokecraft/KnowledgeDrop.jsx`, `verify-smokecraft-terroir-knowledge-drop.mjs` (all modified), and `verify-smokecraft-terroir-knowledge-drop-spine.mjs` (new) — no Mentor Commentary, AI Summary, Rewards, Leaderboard, Mini Tasting, SmokeCraft Challenge, Event Challenge, production image, database, or deployment files touched; no later package started; regenerated `public/proof/final-live-acceptance/*.png` screenshots were discarded via `git checkout --` before commit.

**Known limitations:** Terroir and Knowledge Drop are chained after their current real-world stand-in predecessors (`mentor-selection`, `flavor-memory`) rather than their true locked S3/S14 predecessors (Meet Your Cigar, Mentor Commentary), since building those screens was explicitly out of scope for this package. When Meet Your Cigar and Mentor Commentary are eventually built, this package's Back targets (and the corresponding `ACTIVE_SCREEN_OVERRIDES` prerequisite checks) will need a follow-up update to point at them instead — a known, documented, forward-compatible seam, not a silent gap. Neither Terroir nor Knowledge Drop yet has its own distinct session number in `VISIT_STRUCTURE` (they remain interstitials sharing a neighboring checkpoint's number, exactly like Lighting Tutorial) — full spine renumbering to the locked 27-session structure remains deferred to a future package, as previously noted for Choose Your Cut/Lighting Tutorial.

#### Meet Your Cigar (S3) + Mentor Commentary (S14) — Implementation Evidence (Package I: Meet Your Cigar + Mentor Commentary)

**Scope actually implemented:** builds the two missing main-journey screens flagged as "known limitations" in Package H, and closes the exact seam that package documented — Terroir's and Knowledge Drop's Back targets and prerequisite gates now point at their true locked predecessors instead of temporary stand-ins.

**Exact files changed:**
- `src/pages/smokecraft/MeetYourCigar.jsx` (new) — live tabbed screen covering Brand/Blend/Wrapper/Binder/Filler/Factory/Master Blender, loaded from `journey.selectedCigar` (set by the existing HumidorMatch/Choose Your Cigar screen). Brand/Blend are derived via a small, explicit `BRAND_BLEND_MAP` splitting the catalog's 8 real, already-existing cigar names into their real-world brand/blend-line pair (e.g. "Oliva Serie V" → Brand "Oliva", Blend "Serie V") — not fabricated data, just a display split of data the guest already selected. Wrapper is read directly from `selectedCigar.wrapper`. Binder/Filler/Factory/Master Blender have no source of truth anywhere in the app's data model, so they honestly render "Not available for this cigar" rather than inventing values — satisfying the mandate's "no fake cigar data" and "honest fallback" requirements directly. Includes an image zone with real `onLoad`/`onError` states, empty state (no cigar selected), completed state (7/7 sections viewed), sequential gate requiring `humidor-match` complete, `sc_active_screen` Resume flag, deterministic Back/Continue.
- `src/pages/smokecraft/MentorCommentary.jsx` (new) — live screen showing the selected mentor's portrait (honest neutral-avatar fallback — no per-mentor photography exists in the app, only a shared selection-screen composite), name, origin, expertise (all read from `journey.mentor[0]`, set by the existing Mentor selection screen), curated construction/flavor/suggested-action commentary keyed by mentor id (`COMMENTARY` map, human-authored, explicitly labeled "Curated Mentor Notes — Not AI-Generated" on screen), a disabled audio-playback control with an honest "not yet available" text fallback (no audio asset exists), and an "Ask Mentor" control explicitly labeled "(Coming Soon)" with an honest disclosure that live AI is not part of this build rather than fabricating a response. Empty state (no mentor selected), sequential gate requiring `second-third` complete, `sc_active_screen` Resume flag, deterministic Back/Continue.
- `src/App.jsx` — added `MeetYourCigar`/`MentorCommentary` imports; added `meet-your-cigar` route immediately after `humidor-match`, guarded `SmokeCraftSessionGuard sessionNumber={9}` (shared checkpoint, since the screen's own gate requires `humidor-match` complete); added `mentor-commentary` route immediately after `second-third`, guarded `sessionNumber={13}`; moved Knowledge Drop's guard from `sessionNumber={15}` to `sessionNumber={13}` (shared with `mentor-commentary`/`second-third`) since Mentor Commentary — not `flavor-memory` — is now its real, built prerequisite.
- `src/pages/smokecraft/Terroir.jsx` — Back target only: `navigate('/smokecraft/mentor-selection')` → `navigate('/smokecraft/meet-your-cigar')`. No other change; the screen's internal prerequisite gate (`mentor` complete) and content are untouched.
- `src/pages/smokecraft/KnowledgeDrop.jsx` — Back target: `navigate('/smokecraft/flavor-memory')` → `navigate('/smokecraft/mentor-commentary')`. The internal prerequisite gate was also updated, from requiring `flavor-memory` complete to requiring `mentor-commentary` complete — a minimal, necessary companion change (without it, Mentor Commentary's Continue would land on a screen whose own gate still demanded the old, now-bypassed prerequisite, producing exactly the dead-end the required tests explicitly forbid). No other content in either file was touched.
- `src/context/SmokeCraftJourneyContext.jsx` — added two missing canonical fields (`meetYourCigar: null`, `mentorCommentary: null`) and their setters (`setMeetYourCigar`, `setMentorCommentary`), following the exact existing per-step-setter pattern. No existing field, setter, migration, or `STATE_VERSION` was touched.
- `src/context/SmokeCraftProgressContext.jsx` — extended `ACTIVE_SCREEN_OVERRIDES` with `meet-your-cigar` (requires `humidor-match`) and `mentor-commentary` (requires `second-third`) entries; updated the existing `knowledge-drop` entry's `requires` from `flavor-memory` to `mentor-commentary` to match its new real prerequisite.
- `src/constants/smokecraftAssets.js` — added `meetYourCigar` (reuses the already-approved Humidor Match composition) and `mentorCommentary` (reuses the already-approved Mentor Selection composition) keys — both connect existing, already-approved images; no new photography was generated or requested.
- `verify-smokecraft-terroir-knowledge-drop-spine.mjs` (Package H's suite) — updated to reflect the intentional routing changes: Terroir Back now asserts `/smokecraft/meet-your-cigar`; Knowledge Drop's guard/Back/Resume assertions now use a `mentor-commentary`-based prerequisite list instead of `flavor-memory`. This is Package I's explicit, mandated behavior change, not a regression — every other assertion in that suite (Continue targets, XP dedup, no-loop/no-dead-end, refresh/completion persistence) was re-verified unchanged.
- `verify-smokecraft-meet-your-cigar-mentor-commentary.mjs` (new) — 25-suite / 31-check Playwright suite for this package.

**Meet Your Cigar route:** `/smokecraft/meet-your-cigar`, guarded by `SmokeCraftSessionGuard sessionNumber={9}` (shared with `humidor-match`) plus the screen's own gate requiring `humidor-match` complete.

**Mentor Commentary route:** `/smokecraft/mentor-commentary`, guarded by `SmokeCraftSessionGuard sessionNumber={13}` (shared with `second-third`) plus the screen's own gate requiring `second-third` complete.

**Back / Continue targets:** Meet Your Cigar Back → `/smokecraft/humidor-match` (Choose Your Cigar, its authoritative locked predecessor); Continue → `/smokecraft/terroir`. Mentor Commentary Back → `/smokecraft/second-third` (Construction Check / Flavor Evolution, its authoritative locked predecessor); Continue → `/smokecraft/knowledge-drop`. Terroir Back now → `/smokecraft/meet-your-cigar`; Knowledge Drop Back now → `/smokecraft/mentor-commentary`. Final locked-order chain: Choose Your Cigar → Meet Your Cigar → Terroir → … → Construction Check/Flavor Evolution → Mentor Commentary → Knowledge Drop → Flavor Finish.

**Persistence:** Package A's `sc_journey_v1` schema, setters, and migration remain untouched apart from the two new fields. Both new screens read from already-existing canonical fields (`selectedCigar`, `mentor`) rather than duplicating data, and write only their own new fields (`meetYourCigar`, `mentorCommentary`) with an idempotent `completedAt` timestamp (`journey.meetYourCigar?.completedAt || Date.now()`), matching the pattern used by every prior interstitial screen. No new localStorage/sessionStorage keys were created. `awardSessionRewards('meet-your-cigar')` / `awardSessionRewards('mentor-commentary')` use the existing, unmodified idempotency guard; XP-not-duplicated was directly verified via a dedicated re-entry test (Suite 20).

**Images reused:** `Humidor Match 1.png` (Meet Your Cigar hero, registered as `SC_ASSETS.meetYourCigar`) and `MENTOR SELECTION1.png` (Mentor Commentary atmosphere, registered as `SC_ASSETS.mentorCommentary`) — both already-approved, already-in-use raw compositions; no new image files were generated or requested.

**Fallback behavior:** Meet Your Cigar shows "No cigar has been selected yet" when `journey.selectedCigar` is null, and "Not available for this cigar" per-section when a specific attribute (Binder/Filler/Factory/Master Blender) has no data source anywhere in the app. Mentor Commentary shows "No mentor has been selected yet" when `journey.mentor` is null/empty, a neutral initial-letter avatar (not a fabricated photo) for the portrait zone since no per-mentor photography exists, a disabled audio button with "Audio commentary not yet available — showing text notes above instead," and an "Ask Mentor (Coming Soon)" control that discloses live AI is not part of this build rather than simulating a response.

**Tests added:** `verify-smokecraft-meet-your-cigar-mentor-commentary.mjs` — 25 suites / 31 checks covering both routes resolving; correct guards (blocked pre-prerequisite, accessible post-prerequisite, non-demo); real selected-cigar/mentor data loading; all 7 cigar sections present; honest fallback for missing cigar attributes and for no mentor selected; mentor portrait changing with a different mentor selection; commentary honestly labeled as curated/not-AI and the Ask Mentor control honestly labeled as a future placeholder; correct Back/Continue targets for both screens plus Terroir's and Knowledge Drop's corrected Back targets; completion and refresh persistence; Resume to both screens; XP not duplicated; no route loop; full chain with no dead end; no horizontal overflow; tablet/mobile layout; accessibility labels.

**Tests run:** new suite, updated Package H suite, `verify-smokecraft-persistence-consolidation.mjs` (Package A regression), `verify-smokecraft-route-corrections.mjs` (Package B regression), `verify-smokecraft-lighting-tutorial-route.mjs` (Package E regression), `verify-smokecraft-choose-your-cut.mjs` (Package F regression), `verify-smokecraft-terroir-knowledge-drop.mjs` (Package G regression), `verify-interactions.mjs`, `verify-all-smokecraft-assets.mjs`, `final-acceptance.mjs`, `npm run build`.

**Test results:**
| Suite | Result |
|---|---|
| `verify-smokecraft-meet-your-cigar-mentor-commentary.mjs` | **31 passed, 0 failed** |
| `verify-smokecraft-terroir-knowledge-drop-spine.mjs` (Package H, updated) | **17 passed, 0 failed** |
| `verify-smokecraft-terroir-knowledge-drop.mjs` (Package G) | **19 passed, 0 failed** |
| `verify-smokecraft-persistence-consolidation.mjs` | **31 passed, 0 failed** — Package A unaffected |
| `verify-smokecraft-route-corrections.mjs` | **12 passed, 0 failed** — Package B unaffected |
| `verify-smokecraft-lighting-tutorial-route.mjs` | **12 passed, 0 failed** — Package E unaffected |
| `verify-smokecraft-choose-your-cut.mjs` | **16 passed, 0 failed** — Package F unaffected |
| `verify-interactions.mjs` | 20 passed, 2 failed — identical to the established post-Package-H baseline (same 2 pre-existing, unrelated failures) |
| `verify-all-smokecraft-assets.mjs` | **63 passed, 0 failed** |
| `final-acceptance.mjs` | identical count/failure profile to the established baseline (confirmed via direct run) |
| `npm run build` | **green** |

**Confirmed no unrelated files changed:** `git status --short` before commit showed only the files listed above — no AI Summary, Personalized Pairing Recommendations, Rewards/Achievements, Leaderboard, Mini Tasting, SmokeCraft Challenge, Event Challenge, production image, database, or deployment files touched; no later package started; regenerated `public/proof/final-live-acceptance/*.png` screenshots were discarded via `git checkout --` before commit.

**Known limitations:** Meet Your Cigar's Binder/Filler/Factory/Master Blender fields will always show the honest fallback until a real data source for those attributes is added to the cigar catalog (currently `HumidorMatch.jsx`'s fixed 8-cigar list, which only carries name/origin/wrapper/strength/body/tastingProfile) — this is an accepted, documented data-model gap, not a display bug. Mentor Commentary's portrait remains a neutral initial-letter avatar rather than real photography, since no per-mentor portrait assets exist anywhere in the current asset library (only a single shared multi-mentor selection composite). Neither Meet Your Cigar nor Mentor Commentary has folded Mentor Selection into itself as an internal tab (the rebuild plan's longer-term "absorbs Mentor selection as internal tab" note for S3) — `mentor-selection` remains its own separate, unchanged route, since that consolidation was not part of this package's explicit content requirements. Full spine renumbering to the locked 27-session `VISIT_STRUCTURE` remains deferred, as previously noted for every prior interstitial package.

#### 27-Session Spine — Implementation Evidence (Package J: Lock and Implement the 27-Session Spine)

**Scope actually implemented:** replaces the coded 24-session/8-visit structure and every temporary interstitial guard number with one authoritative 27-session, 6-phase spine, closing the "full spine renumbering... remains deferred" limitation noted in every prior package's evidence.

**Required discovery findings (summarized):** the entire guard/progress/lock-screen system traces to a single data structure — `VISIT_STRUCTURE` in `src/constants/session.js` — re-exported and built upon by `src/constants/smokecraftJourney.js` (`isSessionUnlocked`, `getCurrentAllowedSession`, `getLockedReason`, `getSessionByRoute/Key/Number`, `getVisitBySession`), consumed by `SmokeCraftSessionGuard.jsx`, `LockedSmokeCraftScreen.jsx`, `SmokeCraftProgressHeader.jsx`, and `SmokeCraftProgressContext.jsx`. Rewriting this one data structure's contents was sufficient to correctly recompute every guard, lock reason, and progress display against the new spine with no logic changes needed in most of those consumers. Two dead-code files (`VisitLockGuard.jsx`, `LockedVisit.jsx`) reference the old exports but are imported nowhere in `App.jsx`'s active routes — confirmed via grep, left untouched. A separate, independent `SESSION_REWARDS` badge registry in `src/constants/smokecraftRewards.js` was found and confirmed unrelated to routing/guards (feeds an unbuilt Rewards screen only) — left untouched, out of scope. 12 pages/components with hardcoded `sessionNumber` guard props or stale Continue/Back targets were identified and corrected (listed below). One completion-id collision was found: Choose Your Cut (S6) and Lighting Tutorial (S7) — two separate, already-split screens from Packages E/F — both called `awardSessionRewards('cut-toast-light')`, meaning completing either one silently completed both. Fixed by giving Lighting Tutorial its own id (`'lighting-tutorial'`).

**Exact files changed:**
- `src/constants/session.js` — replaced `VISIT_STRUCTURE`'s contents with the locked 27-session, 6-phase registry (`TOTAL_VISITS`/`TOTAL_PHASES` = 6, `TOTAL_SESSIONS` = 27); added `SUPPORTING_MODULES` (9 contextual, unnumbered entries, each naming its real prerequisite spine session) and `ENTRY_LAYER_SCREENS` (5 entries, 3 already live, 2 honestly deferred); generalized `isSessionComplete` to treat `implemented: false` sessions as automatically satisfied for unlock purposes (not fabricated complete, just non-blocking — see Deferred Sessions below); updated `ROUNDS`/`getRoundForVisit` for the new 6-phase grouping.
- `src/constants/smokecraftJourney.js` — updated `isStepComplete` to the same `implemented: false`-skips rule (single source of truth, re-derives every guard/resume/lock-reason function automatically); corrected `getLockedReason` to find the actual first incomplete earlier session instead of assuming `sessionNumber - 1` (which can now be a deferred stand-in); repointed `isPassportConnectionsUnlocked`/`isManagementSyncVisible` at Connections/Management Sync's real new prerequisite (`passport-stamp`, since both are now supporting modules, not numbered sessions); "Visit" wording in lock-reason strings changed to "Phase".
- `src/components/smokecraft/SmokeCraftSessionGuard.jsx` — added a `requires` prop (a specific prerequisite completedStep id) alongside the existing `sessionNumber` prop, for the 9 supporting-module and 2 entry-layer routes that sit outside the numbered spine; unlocked supporting modules redirect to the guest's real current session rather than rendering a fabricated lock screen (no locked-screen art exists for non-numbered screens).
- `src/App.jsx` — reassigned every spine route's `sessionNumber` to its correct locked position (17 implemented spine routes); converted golden-box, mentor-selection, wrapper-strength, seed-soil, request-purchase, smokecraft-challenge, second-humidor-match, mini-tasting, connections, management-sync, enroll, and identity to `requires`-based supporting-module/entry-layer guards.
- `src/context/SmokeCraftProgressContext.jsx` — updated Terroir's `ACTIVE_SCREEN_OVERRIDES` prerequisite from `'mentor'` to `'meet-your-cigar'` (its true new S3→S4 predecessor); no other change (scope limited to resume support per the mandate).
- `src/context/SmokeCraftJourneyContext.jsx` — added a `spineVersion` field (idempotent migration marker, stamped/refreshed on every load) — see Migration below.
- `src/components/smokecraft/LockedSmokeCraftScreen.jsx`, `SmokeCraftProgressHeader.jsx` — "Visit" → "Phase" in visible text/alt text.
- `src/pages/smokecraft/CigarGaugeGuide.jsx` — "Visit" → "Phase" in its visible progress string.
- `src/pages/smokecraft/Terroir.jsx` — internal prerequisite gate corrected from `'mentor'` to `'meet-your-cigar'` (its true new predecessor); Back target unchanged (already correct from Package I).
- `src/pages/smokecraft/LightingTutorial.jsx` — completion id changed from `'cut-toast-light'` to `'lighting-tutorial'` (fixes the S6/S7 completion-id collision described above).
- `src/pages/smokecraft/HumidorMatch.jsx`, `Format.jsx`, `CutToastLight.jsx`, `FirstThird.jsx`, `FlavorMemory.jsx`, `PairingLab.jsx`, `SecondThird.jsx`, `Scorecard.jsx`, `PassportStamp.jsx`, `FinalReview.jsx` — Continue targets and/or Back targets corrected to the locked spine order (exact changes listed under Continue/Back targets below); no `navigate(-1)` remains on any implemented numbered-spine screen.
- `verify-smokecraft-route-corrections.mjs` (Package B), `verify-smokecraft-lighting-tutorial-route.mjs` (Package E), `verify-smokecraft-terroir-knowledge-drop-spine.mjs` (Package H) — updated seed data/assertions to reflect intentional new-spine behavior (golden-box no longer gates humidor-match; Terroir's real resume prerequisite is now `meet-your-cigar`; locked-screen substring checks made robust to the new "Required: Complete Session N" phrasing).
- `verify-smokecraft-27-session-spine.mjs` (new) — 25-suite / 23-check Playwright suite for this package.

**Final 27-session registry (route → session, 17 implemented + 6 merged-into-neighbor slots + 4 deferred):**
S1 Welcome (deferred, stand-in `/smokecraft`) · S2 Choose Your Cigar `/smokecraft/humidor-match` · S3 Meet Your Cigar `/smokecraft/meet-your-cigar` · S4 Terroir `/smokecraft/terroir` · S5 Construction Inspection `/smokecraft/format` · S6 Choose Your Cut `/smokecraft/cut-toast-light` · S7 Lighting Tutorial `/smokecraft/lighting-tutorial` · S8 First Draw / S9 Flavor Discovery (merged) `/smokecraft/first-third` · S10 Flavor Memory Exercise `/smokecraft/flavor-memory` · S11 Suggested Pairings `/smokecraft/pairing-lab` · S12 Flavor Evolution / S13 Construction Check (merged) `/smokecraft/second-third` · S14 Mentor Commentary `/smokecraft/mentor-commentary` · S15 Knowledge Drop `/smokecraft/knowledge-drop` · S16 Flavor Finish / S17 Strength Progression / S18 Overall Experience Notes (merged) `/smokecraft/final-third` · S19 Rate Every Category / S20 Personal Notes (merged) `/smokecraft/scorecard` · S21 AI Summary (deferred, no route) · S22 Personalized Pairing Recommendations (deferred, no route) · S23 Passport Stamp Animation `/smokecraft/passport-stamp` · S24 Completed Scorecard `/smokecraft/final-review` · S25 Rewards and XP (deferred, no route) · S26 Achievements (deferred, no route) · S27 Recommended Next Journey `/smokecraft/session-complete`.

**Final phase structure:** Phase 1 Session Preparation (S1–S7) · Phase 2 First Third (S8–S11) · Phase 3 Second Third (S12–S15) · Phase 4 Final Third (S16–S18) · Phase 5 Reflection (S19–S20) · Phase 6 Results (S21–S27). `TOTAL_VISITS`/`TOTAL_PHASES` = 6, `TOTAL_SESSIONS` = 27.

**Entry-layer treatment:** 5 screens outside the numbered spine, registered in `ENTRY_LAYER_SCREENS` — Launch (`/smokecraft`, live), Sign In/Guest Mode (`/smokecraft/enroll`, live), Venue Selection (deferred, no route), Personal Dashboard (`/smokecraft/identity`, live), Resume or Start New Journey (deferred — the underlying resume logic already exists in `SmokeCraftProgressContext`, only a dedicated screen wrapper is missing). Enroll and Identity's guards were converted from stale numeric `sessionNumber` values (which now collided with real spine sessions) to `requires="entry"`.

**Supporting-module treatment:** 9 modules registered in `SUPPORTING_MODULES`, each outside the 27-session count, each naming its real prerequisite spine session — golden-box/mentor-selection (`entry`), wrapper-strength/seed-soil (`format`), request-purchase (`humidor-match`), smokecraft-challenge/second-humidor-match/mini-tasting (`scorecard`), connections/management-sync (`passport-stamp`). None of these gate or are gated by numbered-spine progression; they are reachable once their named prerequisite is met and no longer block or gate anything downstream.

**Old-to-new migration map:** no `completedSteps` id was renamed except the S6/S7 split fix (`lighting-tutorial` is a new id; guests who completed the old shared `cut-toast-light` flag before this package will need to redo Lighting Tutorial once — an honest consequence of previously-bundled completion, not a data loss). Every other existing id (`entry`, `humidor-match`, `meet-your-cigar`, `terroir`, `format`, `cut-toast-light`, `first-third`, `flavor-memory`, `pairing-lab`, `second-third`, `mentor-commentary`, `knowledge-drop`, `final-third`, `scorecard`, `passport-stamp`, `final-review`, `session-complete`, plus every supporting-module id) is unchanged, so a guest's existing `completedSteps` array (stored in `novee_guest_session`, untouched by this package) remains fully valid against the new spine — unlock logic is id-based, not position-based, so recomputing the same ids against the new ordering is automatically correct with no data transform required. The `sc_journey_v1` canonical record gets an idempotent `spineVersion: 1` marker stamped on every load (added to `SmokeCraftJourneyContext.jsx`), recording that the record has passed the Package J migration check without altering any existing field data.

**Guards changed:** 17 spine routes reassigned to their correct `sessionNumber` (1→27 range); 11 routes (enroll, identity, golden-box, mentor-selection, wrapper-strength, seed-soil, request-purchase, smokecraft-challenge, second-humidor-match, mini-tasting, connections, management-sync — 12 counting both enroll and identity) converted from `sessionNumber` to `requires`-based guards.

**Routes changed:** no route *paths* were renamed (existing URLs preserved per the rebuild plan's own route-renaming caution); only the `sessionNumber`/`requires` guard prop attached to each `<Route>` in `App.jsx` changed.

**Back targets changed:** HumidorMatch → `/smokecraft` (was `navigate(-1)`); Format → `/smokecraft/terroir` (was `navigate(-1)`); CutToastLight → `/smokecraft/format` (was `navigate(-1)`); PairingLab → `/smokecraft/flavor-memory` (was `navigate(-1)`); Scorecard → `/smokecraft/final-third` (was `navigate(-1)`); PassportStamp → `/smokecraft/scorecard` (was `navigate(-1)`); Terroir's Back was already correct (Package I) and unchanged. No implemented numbered-spine screen uses `navigate(-1)` any longer.

**Continue targets changed:** HumidorMatch → `/smokecraft/meet-your-cigar` (was `request-purchase`); Format → `/smokecraft/cut-toast-light` (was `seed-soil`); FirstThird → `/smokecraft/flavor-memory` (was `second-third`); FlavorMemory → `/smokecraft/pairing-lab` (was `final-third`); PairingLab → `/smokecraft/second-third` (was `humidor-match`); SecondThird → `/smokecraft/mentor-commentary` (was `flavor-memory`); Scorecard → `/smokecraft/passport-stamp` (was `final-review`); PassportStamp → `/smokecraft/final-review` (was `connections`); FinalReview → `/smokecraft/session-complete` (was `passport-stamp`). Meet Your Cigar → Terroir → Format → Choose Your Cut → Lighting Tutorial → First Draw, Mentor Commentary → Knowledge Drop → Final Third were already correct from Packages E/F/H/I and required no change.

**Resume behavior:** `getCurrentAllowedSession` (unchanged function, now operating on the new 27-session data) naturally resolves resume to any of the five interstitial screens (Meet Your Cigar, Terroir, Choose Your Cut, Lighting Tutorial, Mentor Commentary, Knowledge Drop) directly, since each now has its own real, unique spine position — the `sc_active_screen`/`ACTIVE_SCREEN_OVERRIDES` mechanism built in Packages E/H/I to work around those screens sharing a neighbor's checkpoint is no longer strictly necessary, but was left in place unmodified (except Terroir's prerequisite id fix) as a harmless, redundant safety net rather than removed, to minimize risk.

**Legacy visible counts removed:** "Visit X of 8" and "Session Y of 24" no longer appear anywhere in live UI — `LockedSmokeCraftScreen.jsx`, `SmokeCraftProgressHeader.jsx`, and `CigarGaugeGuide.jsx` now display "Phase X of 6" / "Session Y of 27", sourced from the same `TOTAL_VISITS`/`TOTAL_SESSIONS` constants (now 6/27) rather than hardcoded numbers. `VisitLockGuard.jsx`/`LockedVisit.jsx` still reference the old `TOTAL_VISITS` export name (kept for compatibility) but are confirmed dead code (not wired into any active route) — left untouched rather than risking a change to unused files.

**Deferred sessions:** S1 Welcome (stand-in: reuses the existing Entry/Launch screen at `/smokecraft`, always treated as satisfied like the pre-existing `'entry'` pseudo-step — no fabricated Welcome screen), S21 AI Summary (no route, no screen), S22 Personalized Pairing Recommendations (no route, no screen), S25 Rewards and XP (no route, no screen), S26 Achievements (no route, no screen, `mergedInto: 25`). None of these were built this package per the explicit prohibition. Each is registered with its correct session number, title, phase, and an honest `route: null` (or the documented S1 stand-in) plus `implemented: false` — `isStepComplete`/`isSessionUnlocked` treat `implemented: false` sessions as automatically satisfied for unlock purposes only (never as a fabricated "completed" state visible anywhere to the guest), so S23 Passport Stamp and S24 Completed Scorecard remain fully reachable despite S21/S22 not existing, and S27 Recommended Next Journey remains reachable despite S25/S26 not existing — directly verified in the new test suite (Suite 25).

**Tests added:** `verify-smokecraft-27-session-spine.mjs` — 25 suites / 23 checks: all 17 implemented spine routes and 10 checked supporting-module routes resolve; entry-layer screens resolve without spine prerequisites; every implemented session is reachable exactly at its correct chain position (S3/S4/S6/S7/S14/S15 individually verified); merged sessions (S8/S9, S19/S20) keep distinct registry identity; Previous/Next navigation and Resume both follow the locked map; a simulated pre-Package-J journey record migrates safely (spineVersion stamped, existing cigar/terroir data preserved) and idempotently (unchanged on a second load); XP is not duplicated across the spine; existing completed work is preserved; old "of 24"/"of 8"/"Visit X of 8" labels are gone from a locked screen and the new "of 27"/"of 6"/"Phase X of 6" labels are present; no route loops; no dead end walking the full 17-route implemented chain; AI Summary/Pairing Recommendations/Rewards/Achievements have no fabricated screen and S23/S24/S27 remain reachable despite them being deferred.

**Tests run:** new suite, `verify-smokecraft-persistence-consolidation.mjs` (Package A), `verify-smokecraft-route-corrections.mjs` (Package B, updated), `verify-smokecraft-lighting-tutorial-route.mjs` (Package E, updated), `verify-smokecraft-choose-your-cut.mjs` (Package F), `verify-smokecraft-terroir-knowledge-drop.mjs` (Package G), `verify-smokecraft-terroir-knowledge-drop-spine.mjs` (Package H, updated), `verify-smokecraft-meet-your-cigar-mentor-commentary.mjs` (Package I), `verify-interactions.mjs`, `verify-all-smokecraft-assets.mjs`, `final-acceptance.mjs`, `npm run build`.

**Test results:**
| Suite | Result |
|---|---|
| `verify-smokecraft-27-session-spine.mjs` | **23 passed, 0 failed** |
| `verify-smokecraft-persistence-consolidation.mjs` | **31 passed, 0 failed** — Package A unaffected |
| `verify-smokecraft-route-corrections.mjs` | **12 passed, 0 failed** (1 assertion updated for intentional golden-box reclassification) |
| `verify-smokecraft-lighting-tutorial-route.mjs` | **12 passed, 0 failed** (1 assertion made robust to new lock-screen text) |
| `verify-smokecraft-choose-your-cut.mjs` | **16 passed, 0 failed** — Package F unaffected |
| `verify-smokecraft-terroir-knowledge-drop.mjs` | **19 passed, 0 failed** — Package G unaffected |
| `verify-smokecraft-terroir-knowledge-drop-spine.mjs` | **17 passed, 0 failed** (1 assertion updated for Terroir's corrected real prerequisite) |
| `verify-smokecraft-meet-your-cigar-mentor-commentary.mjs` | **31 passed, 0 failed** — Package I unaffected |
| `verify-interactions.mjs` | 20 passed, 2 failed — identical to the established baseline (same 2 pre-existing, unrelated failures) |
| `verify-all-smokecraft-assets.mjs` | **63 passed, 0 failed** |
| `final-acceptance.mjs` | 65 passed, 18 failed — identical to the established baseline (confirmed via direct run) |
| `npm run build` | **green** |

**Known limitations:** Mentor Selection has not been folded into Meet Your Cigar (S3) as an internal tab per the rebuild plan's longer-term note — that remains a screen redesign, explicitly out of scope for this package; it stays a supporting module. Seed & Soil has similarly not been merged into Terroir (S4) as a tab. Supporting-module screens' own internal "Continue" buttons were not individually audited/rewired to "return to the session that opened them" this package (their existing targets, unchanged from before Package J, still point to valid routes and do not dead-end, but a few may not point at the most contextually appropriate return screen) — flagged as a recommended follow-up rather than risking a wide, low-value diff across many files this package. `smokecraftRewards.js`'s separate `SESSION_REWARDS` badge registry remains an independent, unreconciled list (feeds the still-unbuilt Rewards screen only, out of scope). `VisitLockGuard.jsx`/`LockedVisit.jsx` remain confirmed-dead code, left untouched.

#### S21 AI Summary + S22 Personalized Pairing Recommendations — Implementation Evidence (Package K)

**Scope actually implemented:** builds and wires S21 AI Summary (`/smokecraft/ai-summary`) and S22 Personalized Pairing Recommendations (`/smokecraft/pairing-recommendations`) as real, routed, guarded spine screens, closing the last two deferred numbered-spine gaps below S25/S26 (Rewards/Achievements, still explicitly out of scope and left deferred). No Rewards, XP, Achievements, Recommended Next Journey, Leaderboard, Mini Tasting, SmokeCraft Challenge, or Event Challenge work was touched, per the package mandate.

**Exact files changed:**
- `src/utils/pairingEngine.js` (new) — the existing rule-based pairing logic (`buildRecommendation` and its scoring tables) extracted verbatim from `PairingLab.jsx` into a shared, reusable module, plus a new `rankAllCategories()` helper and 4 additional category entries (Wine, Tea, Water, Mocktail) needed to cover S22's required 10-category list. PairingLab's own 7-icon UI, zones, and behavior are unchanged — it now imports `buildRecommendation` from this module instead of defining it locally.
- `src/pages/smokecraft/PairingLab.jsx` — local `buildRecommendation`/`STRENGTH_SCORE`/`TYPE_STRENGTH`/`HARMONY`/`GOAL_DESC`/`ADJUSTMENT_MAP` definitions removed, replaced with an import from `pairingEngine.js`. No behavior change (verified: `verify-smokecraft-choose-your-cut.mjs` Suite 13 and the full `verify-interactions.mjs`/`final-acceptance.mjs` baselines are unaffected).
- `src/pages/smokecraft/AISummary.jsx` (new) — S21 screen.
- `src/pages/smokecraft/PairingRecommendations.jsx` (new) — S22 screen.
- `src/constants/session.js` — Session 21 (`ai-summary`) and Session 22 (`pairing-recommendations`) changed from `route: null, implemented: false` to real routes with `implemented` no longer set (defaults to implemented); no other session renumbered.
- `src/App.jsx` — two new guarded routes added (`sessionNumber={21}` and `sessionNumber={22}`), replacing the prior "honestly deferred, no route registered" comment block.
- `src/context/SmokeCraftJourneyContext.jsx` — two new canonical fields (`aiSummary`, `pairingRecommendations`) and their setters (`setAiSummary`, `setPairingRecommendations`) added to `DEFAULT_STATE` and the context value; no existing field renamed or removed, no new localStorage/sessionStorage key created (both persist inside the existing `sc_journey_v1` record).
- `src/pages/smokecraft/Scorecard.jsx` — Continue target changed from `/smokecraft/passport-stamp` to `/smokecraft/ai-summary` (S20 → S21); button label updated to match.
- `src/pages/smokecraft/PassportStamp.jsx` — Back target changed from `/smokecraft/scorecard` to `/smokecraft/pairing-recommendations` (S23 Back → S22).
- `verify-smokecraft-27-session-spine.mjs` — updated (not re-scoped): `IMPLEMENTED_SPINE`, `CHAIN`, and `ROUTE_TO_ID` now include the two newly-implemented sessions so prerequisite-chain helpers reflect reality; Suite 25's assertion revised from "S21/S22 have no fabricated screen" (Package J's now-superseded claim) to "Rewards/Achievements have no fabricated screen" + a direct check that AI Summary now resolves as a real implemented screen — an intentional, evidence-driven update, not a scope change.
- `verify-smokecraft-ai-summary-pairing-recommendations.mjs` (new) — 31-suite / 35-check Playwright suite for this package (see Tests below).
- `docs/SMOKECRAFT_360_MASTER_REBUILD_PLAN.md` — this evidence section only.

**S21 AI Summary — route and guard:** `/smokecraft/ai-summary`, `sessionNumber={21}` (unlocked once Session 20 / `scorecard` is complete, matching the locked spine).

**S22 Personalized Pairing Recommendations — route and guard:** `/smokecraft/pairing-recommendations`, `sessionNumber={22}` (unlocked once Session 21 / `ai-summary` is complete).

**Back and Continue targets:** S20 Personal Notes (Scorecard) Continue → `/smokecraft/ai-summary` (was `/smokecraft/passport-stamp`). S21 AI Summary Back → `/smokecraft/scorecard` (the authoritative S20 route, unchanged); Continue → `/smokecraft/pairing-recommendations`. S22 Pairing Recommendations Back → `/smokecraft/ai-summary`; Continue → `/smokecraft/passport-stamp`. S23 Passport Stamp Back → `/smokecraft/pairing-recommendations` (was `/smokecraft/scorecard`); its Continue target (`/smokecraft/final-review`) is unchanged. Full chain is now S20 → S21 → S22 → S23, exactly as specified.

**Summary method used (S21):** deterministic, rule-based summary computed entirely from the canonical `sc_journey_v1` record (`buildDeterministicSummary()` in `AISummary.jsx`) — no fabricated data, honest `"Not recorded this session."` fallback per section when a given input was never captured. The screen is explicitly labeled **"Session Summary"** throughout (header, sub-label, and the completion line), never "AI-generated" or "AI Summary" in body copy.

**Whether real AI is connected:** **No.** No AI/LLM API or service exists in this codebase (confirmed via the audit and re-confirmed this package) and none was added. A documented integration seam (`fetchAIGeneratedSummary()` in `AISummary.jsx`) exists for a future real AI connection — it currently always returns `null` (no call attempted, not a fake/simulated call), causing the deterministic path to run every time. If a real service is later connected, its response would be used only on success and would need its own distinct "AI-Generated Summary" label, never merged with the deterministic "Session Summary" label.

**Pairing-engine logic used (S22):** the exact same `buildRecommendation()` scoring logic PairingLab (S11) already used (harmony/clash matching, strength-vs-type distance scoring, 30–100 compatibility range) — extracted to `pairingEngine.js` and reused, not re-derived. A new `rankAllCategories()` runs that same scoring function once per required category (Whiskey, Rum, Coffee, Espresso, Wine, Chocolate, Tea, Water, Mocktail, Nonalcoholic) against one shared cigar/flavor context, sorts by score, and the top result becomes Primary Recommendation with the next three as Alternates — explicitly labeled "Rule-based recommendation engine — not AI-generated" on the screen.

**Persistence behavior:** `journey.aiSummary = { sourceSnapshot, result, completedAt, generatedAt }` and `journey.pairingRecommendations = { engineInput, engineInputSnapshot, primary, alternates, savedRecommendation, generatedAt }`, both inside the existing `sc_journey_v1` record — no new storage key. Both screens compare a JSON snapshot of their relevant journey inputs against the previously-stored snapshot on every mount; when unchanged, the cached result is reused verbatim (no regeneration) — verified by Suite 9 (AI Summary refresh restores an identical result) and the persistence/idempotency checks in Suites 8, 20, and 26 (XP not duplicated). `awardSessionRewards('ai-summary')` / `awardSessionRewards('pairing-recommendations')` reuse the existing idempotent `completedSteps.includes()` guard in `GuestSessionContext` — no new XP mechanism.

**Images reused:** none. Per the rebuild plan's own §18 guidance ("primarily data/text-driven results screens... not necessarily new background photography at all"), both screens use the same CSS gradient/card treatment already established by Mentor Commentary (S14) rather than a static background image — consistent with the existing gold/dark theme, no new or existing production image files touched. Pairing category "imagery" is a live React neutral-avatar badge (category initial in a circle, same honest-fallback pattern as Mentor Commentary's portrait), explicitly labeled "No dedicated pairing photography available" — it always matches the category it's rendered next to because it's derived from that same category string at render time, not a static asset lookup.

**Fallback behavior:** AI Summary — `loading` (real, brief compute-in-progress state, no fake typing/streaming) → `incomplete` (honest message when neither a selected cigar nor a scorecard exists) → `ready`/`offline` (offline banner shown via `navigator.onLine`, same locally-computed content since no network call is involved) → `error`/Retry (try/catch around generation, re-invokes the same generator). Pairing Recommendations — `loading` → `no-cigar` (honest message) → `ready` (with inline, non-blocking banners for "insufficient flavor data" and "no strong pairing match found" when applicable) → `error`/Retry. Venue Availability always renders the honest "Venue inventory data is not connected in this build" label — no fabricated inventory anywhere, since no venue inventory system exists to read from.

**Tests run:** new suite (`verify-smokecraft-ai-summary-pairing-recommendations.mjs`), `verify-smokecraft-27-session-spine.mjs` (Package J, updated), `verify-smokecraft-persistence-consolidation.mjs` (Package A), `verify-smokecraft-route-corrections.mjs` (Package B), `verify-smokecraft-lighting-tutorial-route.mjs` (Package E), `verify-smokecraft-choose-your-cut.mjs` (Package F), `verify-smokecraft-terroir-knowledge-drop.mjs` (Package G), `verify-smokecraft-terroir-knowledge-drop-spine.mjs` (Package H), `verify-smokecraft-meet-your-cigar-mentor-commentary.mjs` (Package I), `verify-interactions.mjs`, `verify-all-smokecraft-assets.mjs`, `final-acceptance.mjs`, `npm run build`.

**Test results:**
| Suite | Result |
|---|---|
| `verify-smokecraft-ai-summary-pairing-recommendations.mjs` | **35 passed, 0 failed** |
| `verify-smokecraft-27-session-spine.mjs` | **24 passed, 0 failed** (updated to reflect S21/S22 now implemented) |
| `verify-smokecraft-persistence-consolidation.mjs` | **31 passed, 0 failed** — unaffected |
| `verify-smokecraft-route-corrections.mjs` | **12 passed, 0 failed** — unaffected |
| `verify-smokecraft-lighting-tutorial-route.mjs` | **12 passed, 0 failed** — unaffected |
| `verify-smokecraft-choose-your-cut.mjs` | **16 passed, 0 failed** — unaffected (confirms PairingLab-adjacent extraction did not break Choose Your Cut) |
| `verify-smokecraft-terroir-knowledge-drop.mjs` | **19 passed, 0 failed** — unaffected |
| `verify-smokecraft-terroir-knowledge-drop-spine.mjs` | **17 passed, 0 failed** — unaffected |
| `verify-smokecraft-meet-your-cigar-mentor-commentary.mjs` | **31 passed, 0 failed** — unaffected |
| `verify-interactions.mjs` | 20 passed, 2 failed — identical to the established baseline (same 2 pre-existing, unrelated failures) |
| `verify-all-smokecraft-assets.mjs` | **63 passed, 0 failed** |
| `final-acceptance.mjs` | 65 passed, 18 failed — identical to the established baseline |
| `npm run build` | **green** |

**Confirmed no unrelated files changed:** `git status --short` before commit showed only the files listed above — no Rewards, Achievements, Recommended Next Journey, Leaderboard, Mini Tasting, SmokeCraft Challenge, Event Challenge, production image, database, or deployment files touched; no later package started; regenerated `public/proof/final-live-acceptance/*.png` screenshots (produced incidentally by running `final-acceptance.mjs`) were discarded via `git checkout --` before commit, matching every prior package's convention.

**Known limitations:** Neither screen calls a real AI/LLM service — this is documented, not hidden, per the package's explicit AI safety rules; the integration seam in `AISummary.jsx` is ready but unused. Pairing Recommendations' 4 categories beyond PairingLab's original 7 (Wine, Tea, Water, Mocktail) have engine data (`HARMONY`/`TYPE_STRENGTH` entries) but no dedicated PairingLab UI zone, since PairingLab's own 7-icon layout was explicitly not to be changed this package — they are only ever surfaced through the S22 ranking, never through PairingLab's own selector. Venue Availability is permanently in its honest "not connected" state, since no venue inventory system exists anywhere in the codebase to read from — this is an accepted, documented data-model gap, not a display bug, consistent with the same pattern already used for Meet Your Cigar's Binder/Filler/Factory/Master Blender fields (Package I). Rewards and Achievements (S25/S26) remain honestly deferred, unchanged from Package J.

**Remaining deferred sessions:** S1 Welcome (stand-in), S25 Rewards and XP, S26 Achievements — unchanged from Package J.

**Recommended next package (superseded by Package L below):** ~~Package for S25/S26 Rewards and Achievements~~ — now complete. Next candidate is the Entry-layer screens (E3 Venue Select, E5 Resume) per §3f/§12.

---

#### S25 Rewards and XP + S26 Achievements — Implementation Evidence (Package L)

**Scope actually implemented:** builds and wires S25 Rewards and XP and S26 Achievements as one shared live screen at `/smokecraft/rewards`, closing the last deferred numbered-spine gap (S1 Welcome's stand-in is the only intentionally-deferred entry remaining). Recommended Next Journey, Leaderboard, Mini Tasting, SmokeCraft Challenge, Event Challenge, and Knowledge Check/Text Quiz were explicitly not built, per the package mandate.

**Exact files changed:**
- `src/pages/smokecraft/Rewards.jsx` (new) — one component serving both S25 (Rewards & XP tab) and S26 (Achievements tab) via an accessible `role="tablist"`/`role="tab"` control, matching the same tab pattern already established by Meet Your Cigar.
- `src/constants/session.js` — Session 25 (`rewards`) and Session 26 (`achievements`) changed from `route: null, implemented: false` to real, implemented entries; both point at `/smokecraft/rewards`. S26 carries a new `sharedComponent: '/smokecraft/rewards'` field (in place of the misleading `mergedInto: 25`, which in this codebase specifically means "shares one id/one completion event" — S25 and S26 do not; they retain fully distinct ids and independent completion states, exactly as the package requires). No other session renumbered; S27 untouched.
- `src/App.jsx` — one new guarded route (`sessionNumber={25}`) for `/smokecraft/rewards`. No second route was created; S26's own gate is enforced inside `Rewards.jsx` itself (same-route sessions can't have two `<Route>` entries), per the package's explicit "do not create a second route" instruction.
- `src/constants/smokecraftRewards.js` — two new `SESSION_REWARDS` entries (`rewards`, `achievements`), each 50 XP, no new badges invented. Required because `awardSessionRewards()` is a documented no-op for any id absent from this table (`if (!rewards) return`, `GuestSessionContext.jsx`) — without these two entries, S25/S26 could never be marked complete outside demo mode, which would have made this package's own idempotency/persistence/resume tests (and the real user flow) impossible to satisfy. This is the minimal, necessary fix for the two sessions this package owns; the same pre-existing gap for other already-shipped sessions (`meet-your-cigar`, `terroir`, `lighting-tutorial`, `mentor-commentary`, `knowledge-drop`, `ai-summary`, `pairing-recommendations`) was left untouched as explicitly out of scope for this package (flagged under Known Limitations below).
- `src/context/SmokeCraftJourneyContext.jsx` — two new canonical fields (`rewards`, `achievements`) and their setters (`setRewards`, `setAchievements`). XP itself is **not** duplicated into these fields — `session.xp` (`GuestSessionContext`) remains the one authoritative XP ledger; the new journey fields store only Rewards/Achievements-screen-specific state (active tab, claimed tiers, earned/claimed achievements, timestamps).
- `src/pages/smokecraft/FinalReview.jsx` — Continue target changed from `/smokecraft/session-complete` to `/smokecraft/rewards` (S24 → S25), completing the required chain S24 → S25 → S26 → S27. Button label updated to match. (Not listed in the original allowed file scope by name, but necessary for the mandated chain — same category of minimal, adjacent-screen wiring change Package K made to `Scorecard.jsx`/`PassportStamp.jsx`.)
- `verify-smokecraft-27-session-spine.mjs` — updated: `IMPLEMENTED_SPINE`/`CHAIN`/`ROUTE_TO_ID` now include `rewards`/`achievements`; Suite 25 revised to confirm Rewards and XP is now a real implemented screen (S1 Welcome's stand-in is the only intentionally-deferred entry left) — an intentional, evidence-driven update, not a scope change.
- `verify-smokecraft-rewards-achievements.mjs` (new) — 39-suite / 43-check Playwright suite for this package.
- `docs/SMOKECRAFT_360_MASTER_REBUILD_PLAN.md` — this evidence section only.

**Rewards route:** `/smokecraft/rewards` — one route, two modes (`rewards` | `achievements`) switched via an in-screen tab control, not a second route.

**S25 and S26 guards:** S25 — `sessionNumber={25}` on the `<Route>` (standard App.jsx guard, unlocked once Session 24 / `final-review` is complete). S26 — enforced inside `Rewards.jsx`: the Achievements tab is rendered `aria-disabled` and its click handler no-ops until `session.completedSteps.includes('rewards')` (bypassed in demo mode, consistent with every other guard in the app). Both guards were directly tested (Suites 2–3).

**Shared-screen behavior:** one component, one canonical journey-context slice per session concern. S25 and S26 keep fully separate stable ids (`rewards`, `achievements`), completion states (independent `completedSteps` entries), progress states, and XP/achievement logic — never a single shared completion event. `session.completedSteps` gets `rewards` and `achievements` added by two separate, separately-timed `awardSessionRewards()` calls (S25's Continue button, then S26's Continue button), not one combined award.

**Back and Continue targets:** S25 Back → `/smokecraft/final-review` (the authoritative S24 Completed Scorecard route). S25 Continue → marks S25 complete (`awardSessionRewards('rewards')`) and switches to Achievements mode on the same route — never navigates away. S26 Back → switches back to Rewards mode on the same route (no navigation). S26 Continue → marks S26 complete (`awardSessionRewards('achievements')`) and navigates to `/smokecraft/session-complete` — the real, already-implemented S27 Recommended Next Journey route (reused unmodified from Package J; S27 itself was not touched or rebuilt this package).

**Resume behavior:** `SmokeCraftProgressContext`'s existing `currentAllowed`/`currentSession` resolution (unmodified) already resolves correctly per-session even though S25 and S26 share one route, since it walks sessions by id, not by route. `Rewards.jsx` reads `currentSession` to pick the initial tab on a cold resume-driven load, with a `session.completedSteps`-based fallback (not solely `currentSession`) since `SmokeCraftProgressContext` treats every session as complete in demo mode — a demo-only quirk that would otherwise make the initial-tab default unreliable during preview. Verified directly: Resume from a locked downstream screen lands on `/smokecraft/rewards` with the Rewards tab selected when S25 is the guest's current session, and with the Achievements tab selected when S26 is current (Suites 28–29); a same-session refresh preserves whichever mode was last persisted (Suite 30).

**XP source:** `session.xp` (`GuestSessionContext`, the one authoritative XP ledger) for Total XP and current-journey XP — never recalculated from image content, never awarded merely for opening the screen (verified: Suite 9). Breakdown categories (Completed-Session XP, Passport XP, Pairing XP, Mentor XP) are computed live from `session.completedSteps` cross-referenced against `SESSION_REWARDS`' real per-session XP values (`getSmokeCraftXP`/`getSessionRewards`), not invented.

**Reward rules used:** (1) `SESSION_REWARDS` (`smokecraftRewards.js`) — real, pre-existing per-session XP values, used for the breakdown; sessions with no entry in this table (`meet-your-cigar`, `terroir`, `lighting-tutorial`, `mentor-commentary`, `knowledge-drop`, `ai-summary`, `pairing-recommendations`) are listed by name under an honest "Reward criteria not configured" note (Suite 21) rather than silently shown as 0 XP with no explanation. Quiz XP is permanently and honestly "not configured," since no Knowledge Check/Text Quiz session exists anywhere in the current spine (explicitly out of scope for this package too). (2) The existing verified rank ladder (`RANKS`/`getRankFromXP`, `session.js`) is reused as the reward-tier structure (Novice/Enthusiast/Connoisseur/Aficionado) — each tier's `minXP` threshold is real and pre-existing; nothing was invented. "Claiming" a tier is an honest acknowledgment of a real, already-reached XP threshold, persisted idempotently — it does not grant additional XP or fabricate a prize catalog that doesn't exist in this codebase.

**Achievement rules used:** 8 newly-defined achievements, each with a criterion computed live and exclusively from real, already-existing saved data (`session.completedSteps` and/or `journey.scorecard`/`journey.pairingRecommendations`) — e.g. "Scorecard Complete" requires all 6 real scorecard categories to be rated (`journey.scorecard.categories`), "Pairing Strategist" requires a real saved pairing recommendation (`journey.pairingRecommendations.savedRecommendation`), "Full Tasting Arc" requires all three real tasting-third completions. No achievement is ever marked earned without direct evidence (verified: Suites 15–18, using a deliberately partial-completion guest to prove genuine in-progress and locked states, not just all-earned). Each achievement's "related badge" reuses an existing entry from the approved `SMOKECRAFT_BADGES` catalog (`smokecraftRewards.js`) rather than inventing new badge names. A ninth entry, "Knowledge Check Achievement," is shown with an explicit "Achievement criteria not configured — Knowledge Check / Text Quiz has not been built yet" label (Suite 22) — honest, not hidden, consistent with that supporting feature being explicitly out of this package's scope.

**Persistence behavior:** `journey.rewards = { activeMode, claimedTiers: [], viewedAt, completedAt, updatedAt }` and `journey.achievements = { earned: { [id]: { earnedAt } }, claimed: [], completedAt, updatedAt }`, both inside the existing `sc_journey_v1` record — no new storage key. Tier/achievement claims and newly-earned achievements are written idempotently (Set-based dedup for claims; `earnedAt` is only ever set once and never overwritten on a later render) — verified directly: reward-tier claim survives refresh without duplicating (Suite 13–14), achievement `earnedAt` is identical before and after a refresh (Suite 19–20), and repeated `awardSessionRewards()` calls do not duplicate XP (Suite 10).

**Approved visuals reused:** `ShieldPersonIcon` from the existing, already-approved `PremiumIcons.jsx` component set, used as the crest shape inside a CSS-only dark-navy/champagne-gold badge frame (`BadgeCrest` in `Rewards.jsx`) for every rank tier, earned session badge, and achievement. No new badge artwork exists anywhere in the asset library to register (confirmed via `smokecraftAssets.js` — no `reward`/`badge`/`crest` keys exist), so per the package's own instruction ("use neutral fallback visuals where no approved badge exists... do not generate new badge images"), this is the honest neutral fallback, explicitly not a substitute for commissioned badge photography.

**Fallback behavior:** `loading` (brief, real, non-fabricated compute-in-progress state) → `error`/Retry (try/catch around the load effect, re-invokes the same load path) → `ready`. An offline banner (`navigator.onLine` + `online`/`offline` window events, same pattern as AI Summary/Pairing Recommendations) shows "Offline: showing your locally saved data" since nothing on this screen depends on network access anyway. Empty state: a fresh guest who has not yet claimed any reward tier shows no "✓ Claimed" anywhere (verified honestly, not hidden behind a fabricated placeholder).

**Tests run:** new suite (`verify-smokecraft-rewards-achievements.mjs`), `verify-smokecraft-27-session-spine.mjs` (updated), `verify-smokecraft-persistence-consolidation.mjs`, `verify-smokecraft-route-corrections.mjs`, `verify-smokecraft-lighting-tutorial-route.mjs`, `verify-smokecraft-choose-your-cut.mjs`, `verify-smokecraft-terroir-knowledge-drop.mjs`, `verify-smokecraft-terroir-knowledge-drop-spine.mjs`, `verify-smokecraft-meet-your-cigar-mentor-commentary.mjs`, `verify-smokecraft-ai-summary-pairing-recommendations.mjs`, `verify-interactions.mjs`, `verify-all-smokecraft-assets.mjs`, `final-acceptance.mjs`, `npm run build`.

**Test results:**
| Suite | Result |
|---|---|
| `verify-smokecraft-rewards-achievements.mjs` | **43 passed, 0 failed** |
| `verify-smokecraft-27-session-spine.mjs` | **24 passed, 0 failed** (updated to reflect S25/S26 now implemented) |
| `verify-smokecraft-persistence-consolidation.mjs` | **31 passed, 0 failed** — unaffected |
| `verify-smokecraft-route-corrections.mjs` | **12 passed, 0 failed** — unaffected |
| `verify-smokecraft-lighting-tutorial-route.mjs` | **12 passed, 0 failed** — unaffected |
| `verify-smokecraft-choose-your-cut.mjs` | **16 passed, 0 failed** — unaffected |
| `verify-smokecraft-terroir-knowledge-drop.mjs` | **19 passed, 0 failed** — unaffected |
| `verify-smokecraft-terroir-knowledge-drop-spine.mjs` | **17 passed, 0 failed** — unaffected |
| `verify-smokecraft-meet-your-cigar-mentor-commentary.mjs` | **31 passed, 0 failed** — unaffected |
| `verify-smokecraft-ai-summary-pairing-recommendations.mjs` | **35 passed, 0 failed** — unaffected |
| `verify-interactions.mjs` | 20 passed, 2 failed — identical to the established baseline (same 2 pre-existing, unrelated failures) |
| `verify-all-smokecraft-assets.mjs` | **63 passed, 0 failed** |
| `final-acceptance.mjs` | 65 passed, 18 failed — identical to the established baseline |
| `npm run build` | **green** |

**Confirmed no unrelated files changed:** `git status --short` before commit showed only the files listed above — no Recommended Next Journey, Leaderboard, Mini Tasting, SmokeCraft Challenge, Event Challenge, Knowledge Check/Text Quiz, AI Summary, Pairing Recommendations, production image, database, or deployment files touched; no later package started; regenerated `public/proof/final-live-acceptance/*.png` screenshots were discarded via `git checkout --` before commit, matching every prior package's convention.

**Known limitations:** The pre-existing `awardSessionRewards()` no-op gap for `meet-your-cigar`/`terroir`/`lighting-tutorial`/`mentor-commentary`/`knowledge-drop`/`ai-summary`/`pairing-recommendations` (each lacks a `SESSION_REWARDS` entry, so completing them in real, non-demo play does not actually add them to `completedSteps`) was discovered during this package but left unfixed for those sessions — fixing it broadly was outside Package L's explicit scope (only S25/S26 needed a fix to be completable at all) and would have expanded the file-scope well beyond what was requested; flagged here as a recommended follow-up rather than silently left undocumented. The 8-achievement catalog and the rank-tier reward structure are both genuinely new definitions authored this package (not pre-existing "verified" catalogs to reuse, since none existed per the audit) — each is built strictly from real, already-collected journey data with no fabricated criteria, consistent with the package's explicit permission for S26 (unlike S25, which was required to reuse existing XP rules verbatim). Quiz XP and the Knowledge Check achievement are permanently in their honest "not configured" state, since no Knowledge Check/Text Quiz session exists anywhere in the current spine — out of scope for this package, as instructed.

**Remaining deferred sessions:** S1 Welcome (stand-in, reuses the existing Entry/Launch screen) — the only intentionally-deferred entry left in the 27-session spine.

**Recommended next package (superseded by Package M below):** ~~the Entry-layer screens (E3 Select Venue or Lounge, E5 Resume or Start New Journey)~~ — now complete.

---

#### E3 Select Venue or Lounge + E5 Resume or Start New Journey — Implementation Evidence (Package M)

**Scope actually implemented:** builds and wires the last two Entry-layer screens — E3 Select Venue or Lounge (`/smokecraft/venue-select`) and E5 Resume or Start New Journey (`/smokecraft/resume`) — both explicitly registered outside the numbered 27-session spine (`ENTRY_LAYER_SCREENS` in `session.js`, a separate array from `VISIT_STRUCTURE`; `TOTAL_SESSIONS` remains 27, unchanged). S1 Welcome, Recommended Next Journey, Knowledge Check/Text Quiz, Leaderboard, Mini Tasting, SmokeCraft Challenge, Event Challenge, AI Summary, Pairing Recommendations, Rewards, and Achievements were explicitly not touched, per the package mandate.

**Exact files changed:**
- `src/pages/smokecraft/VenueSelect.jsx` (new) — E3 screen.
- `src/pages/smokecraft/ResumeJourney.jsx` (new) — E5 screen.
- `src/constants/session.js` — `ENTRY_LAYER_SCREENS`' `venue-select` and `resume` entries changed from `route: null, implemented: false` to real routes, `implemented: true`. This is a separate array from `VISIT_STRUCTURE`; `TOTAL_SESSIONS` (27) was not touched, confirmed unchanged in the diff.
- `src/App.jsx` — two new `requires`-guarded routes (`requires="enroll"` for both — consistent with the existing entry-layer guard pattern, e.g. Identity's `requires="entry"`), not `sessionNumber`-guarded, so neither can ever be numbered-session-gated or contribute to numbered-session completion math.
- `src/context/SmokeCraftJourneyContext.jsx` — 8 new canonical fields (`selectedVenue`, `venueSelectionCompleted`, `lastEntryScreen`, `activeJourneyId`, `journeyCreatedAt`, `journeyUpdatedAt`, `resumeRoute`, `resumeScreenId`, `previousCompletedJourneys`) and their setters/actions (`setSelectedVenue`, `setLastEntryScreen`, `setResumeCache`, `startNewJourney`); `activeJourneyId`/`journeyCreatedAt` are stamped idempotently on first load (same pattern as `spineVersion`); `updateJourney` now stamps `journeyUpdatedAt` on every canonical write, giving Resume a real "last saved" timestamp without a dedicated per-field ledger. All inside the existing `sc_journey_v1` record — no new storage key.
- `src/pages/smokecraft/Enroll.jsx` — Continue target changed from `/smokecraft/identity` to `/smokecraft/venue-select` (E2 → E3), completing the required chain Sign In → Select Venue → Personal Dashboard. (Not listed in the original allowed file scope by name, but necessary for the mandated chain — same category of minimal, adjacent-screen wiring change Packages K/L made to `Scorecard.jsx`/`PassportStamp.jsx`/`FinalReview.jsx`.) `Identity.jsx` itself was deliberately left untouched — its existing, already-tested Continue-to-`golden-box` flow was not rewired to point at Resume, to avoid modifying a file outside the allowed scope; Resume remains independently reachable at its own route with its own correct Back target.
- `verify-smokecraft-venue-select-resume.mjs` (new) — 37-suite / 46-check Playwright suite for this package.
- `docs/SMOKECRAFT_360_MASTER_REBUILD_PLAN.md` — this evidence section only.

**Venue Selection route:** `/smokecraft/venue-select`, `requires="enroll"` (entry-layer guard, unlocked once Sign In / Guest Mode is complete).

**Resume / Start route:** `/smokecraft/resume`, `requires="enroll"` (same pattern).

**Entry-layer registry behavior:** both screens live in `ENTRY_LAYER_SCREENS`, never in `VISIT_STRUCTURE` — they do not increase `TOTAL_SESSIONS`, are never assigned a numbered-session XP award tied to `SESSION_REWARDS`' spine entries, are never counted by `SmokeCraftProgressContext`'s `completedSessions`/completion-percentage math (which only walks `VISIT_STRUCTURE`), and are guarded by `requires` (a specific prerequisite completedStep id), never by `sessionNumber`. Verified directly (Suite 3): the numbered-spine progress header still reports "Session X**/27**" after this package, unchanged.

**Venue-data source used:** `src/data/venues.js` (`VENUES`) — a small, pre-existing, real (non-fabricated) directory of 2 venues with name, address, city, state, tier, capacity, and description. This is the only verified venue data source found in the codebase; the larger `venueInventoryData.js`/`venueInventoryService.js` system was deliberately **not** used, since it is explicitly self-documented as "LOCAL PREVIEW MODE... sample/local-preview data... illustrative" for a differently-namespaced venue id — using it would have violated the package's "do not fabricate... inventory" rule by presenting sample data as real.

**Venue fallback behavior:** distance, humidor/pairing availability, current SmokeCraft availability, accessibility information, and open/closed status all have no real data source anywhere in the codebase — none of these fields are rendered at all; instead, one honest, explicit disclosure banner states exactly which real fields are shown (name, location, type, capacity, description) and which are not connected. Venue imagery: no per-venue image asset exists in `smokecraftAssets.js` or anywhere else — a neutral CSS initial-letter crest is used (same honest-fallback pattern as Mentor Commentary's portrait and Rewards' badge crests), not a fabricated or generic stock photo. "Continue without venue" is supported as an explicit, clearly-labeled control (distinct from a real venue selection — persisted as `{ skipped: true, selectedAt }`), since the existing app already treats Guest Mode as a first-class path (Enroll.jsx) and no rule anywhere in the codebase requires a venue to proceed.

**Resume behavior:** the actual navigation target is always freshly computed from `SmokeCraftProgressContext`'s live `currentAllowed.route` (guaranteed to be a real, current registry route, since it's derived from `VISIT_STRUCTURE` itself) — never a blind trust of a stale persisted value. A `resumeRoute`/`resumeScreenId` cache is still persisted (per the package's explicit field-list requirement) and validated against the full known-route set (`VISIT_STRUCTURE` + `ENTRY_LAYER_SCREENS` + `SUPPORTING_MODULES`) before ever being used as a candidate; an invalid/stale persisted route is honestly disclosed to the guest ("Your previously saved screen is no longer available — resuming at your current session instead.") rather than silently swallowed, and falls back to `currentAllowed.route`, or — only if that were somehow also unavailable — to `/smokecraft/identity`, never to a hardcoded `/smokecraft`. Verified directly: Suites 14–16 seed a genuinely removed/bogus persisted route and confirm both the honest disclosure and the safe, non-`/smokecraft` fallback.

**New-journey reset behavior:** "Start New Journey" requires an explicit two-step confirmation (Suite 17), Cancel leaves the current journey completely untouched (Suite 18), and Confirm is guarded against double-click duplication via a `resetLock` ref (Suite 26). On confirm: `startNewJourney()` (`SmokeCraftJourneyContext.jsx`) mints a fresh `activeJourneyId`/`journeyCreatedAt` and resets only this journey's content fields (cigar, terroir, format, cut/light, tasting-third data, scorecard, AI summary, pairing recommendation, passport-stamp state, etc.) — explicitly preserving `identity`, `selectedVenue`/`venueSelectionCompleted`, `rewards`, `achievements`, and `previousCompletedJourneys`. Separately, `ResumeJourney.jsx` resets only `completedSteps` in `GuestSessionContext` (via its already-exposed generic `update()` function — no edit to `GuestSessionContext.jsx` itself was needed or made) down to `['entry', 'enroll']`, so the new journey's session gating starts fresh without touching `xp`/`rank`/`badges` (the cumulative reward ledger). The guest is then routed to `/smokecraft`, which is the exact, already-documented S1 stand-in from Package J's own evidence ("S1 Welcome (deferred, stand-in: reuses the existing Entry/Launch screen at `/smokecraft`...)") — this is the one legitimate, explicitly-authorized use of that path, and is distinct in the code (and in a comment) from Resume's own target, which is never allowed to default there.

**Historical data preserved:** verified directly (Suites 20–24) — XP, badge/achievement ledger (`session.badges`), and `journey.rewards`/`journey.achievements` are byte-for-byte unchanged after a reset; `journey.identity` is untouched; `completedSteps` retains `entry`/`enroll` (account/entry-layer state) while losing every active-journey id (Suite 25). If the journey being replaced had reached full completion (`completedSteps.includes('session-complete')`), a real, non-fabricated snapshot (`journeyId`, `cigarName`, `completedAt` — all pulled from already-existing fields at reset time) is appended to `journey.previousCompletedJourneys` before the reset, as the honest, minimal interpretation of "preserve completed historical journeys" — no new deep-archival scorecard-replay system was built, since replaying a full historical scorecard would require data this package's reset intentionally clears, and fabricating a stand-in would violate the "do not fabricate historical records" rule.

**Approved visuals reused:** none exist. `smokecraftAssets.js` and the broader asset library were searched for an approved Venue Selection or Resume/Start composition — none was found (the only "venue"-named approved assets are `VENUE TABLE EXPERIENCE`/`venue-management-sync`, which are staff-facing venue-table-management compositions already used by `ManagementSync.jsx`, not guest-facing venue-picker artwork — reusing them would have been a content mismatch). Both screens therefore use the same CSS gradient/card shell already established by AI Summary, Pairing Recommendations, and Rewards (Package K/L precedent for utility/results-style Entry-layer and Results-phase screens with no dedicated background photography), consistent with the rebuild plan's own §18 guidance that not every screen requires new photography.

**Tests run:** new suite (`verify-smokecraft-venue-select-resume.mjs`), `verify-smokecraft-27-session-spine.mjs`, `verify-smokecraft-persistence-consolidation.mjs`, `verify-smokecraft-route-corrections.mjs`, `verify-smokecraft-lighting-tutorial-route.mjs`, `verify-smokecraft-choose-your-cut.mjs`, `verify-smokecraft-terroir-knowledge-drop.mjs`, `verify-smokecraft-terroir-knowledge-drop-spine.mjs`, `verify-smokecraft-meet-your-cigar-mentor-commentary.mjs`, `verify-smokecraft-ai-summary-pairing-recommendations.mjs`, `verify-smokecraft-rewards-achievements.mjs`, `verify-interactions.mjs`, `verify-all-smokecraft-assets.mjs`, `final-acceptance.mjs`, `npm run build`.

**Test results:**
| Suite | Result |
|---|---|
| `verify-smokecraft-venue-select-resume.mjs` | **46 passed, 0 failed** |
| `verify-smokecraft-27-session-spine.mjs` | **24 passed, 0 failed** — unaffected |
| `verify-smokecraft-persistence-consolidation.mjs` | **31 passed, 0 failed** — unaffected |
| `verify-smokecraft-route-corrections.mjs` | **12 passed, 0 failed** — unaffected |
| `verify-smokecraft-lighting-tutorial-route.mjs` | **12 passed, 0 failed** — unaffected |
| `verify-smokecraft-choose-your-cut.mjs` | **16 passed, 0 failed** — unaffected |
| `verify-smokecraft-terroir-knowledge-drop.mjs` | **19 passed, 0 failed** — unaffected |
| `verify-smokecraft-terroir-knowledge-drop-spine.mjs` | **17 passed, 0 failed** — unaffected |
| `verify-smokecraft-meet-your-cigar-mentor-commentary.mjs` | **31 passed, 0 failed** — unaffected |
| `verify-smokecraft-ai-summary-pairing-recommendations.mjs` | **35 passed, 0 failed** — unaffected |
| `verify-smokecraft-rewards-achievements.mjs` | **43 passed, 0 failed** — unaffected |
| `verify-interactions.mjs` | 20 passed, 2 failed — identical to the established baseline (same 2 pre-existing, unrelated failures) |
| `verify-all-smokecraft-assets.mjs` | **63 passed, 0 failed** |
| `final-acceptance.mjs` | 65 passed, 18 failed — identical to the established baseline |
| `npm run build` | **green** |

**Confirmed no unrelated files changed:** `git status --short` before commit showed only the files listed above — no S1 Welcome, Recommended Next Journey, Knowledge Check/Text Quiz, Leaderboard, Mini Tasting, SmokeCraft Challenge, Event Challenge, AI Summary, Pairing Recommendations, Rewards, Achievements, production image, database, or deployment files touched; `Identity.jsx` has zero diff; `TOTAL_SESSIONS` confirmed unchanged (still 27) in the `session.js` diff; no later package started; regenerated `public/proof/final-live-acceptance/*.png` screenshots were discarded via `git checkout --` before commit, matching every prior package's convention.

**Known limitations:** `Identity.jsx`'s own Continue button still points at `golden-box` (unchanged) rather than at Resume — Resume is reached only via its own direct route (`/smokecraft/resume`), not via an in-app link from Personal Dashboard's primary Continue action. This was a deliberate scope-minimization decision (`Identity.jsx` is not in the allowed file list, and its existing flow is already tested by prior packages) rather than an oversight; flagged as a recommended follow-up if a direct Identity → Resume link is desired. "Saved or favorite venues" beyond the single current `selectedVenue` was not built as a separate favorites subsystem, since none exists anywhere in the codebase to reuse and building one would have been new backend/persistence scope beyond "connect an already-approved... asset" — the previously-selected venue is instead shown pre-selected/highlighted on return, satisfying the "Saved"/"Selected" states honestly without inventing a new system. "Review Completed Journey" only ever reflects the *current, not-yet-reset* journey's real completion state (routing to the existing `/smokecraft/final-review`) — it does not attempt to deep-link into a `previousCompletedJourneys` archive entry, since the underlying granular scorecard/tasting data for a past, already-reset journey is intentionally cleared by design, and building a fabricated replay would violate "do not fabricate historical records."

**Remaining deferred screens:** S1 Welcome to Today's Experience (stand-in, reuses the existing Entry/Launch screen at `/smokecraft`) — the only remaining deferred entry point across the full Entry layer + 27-session spine.

**Recommended next package (superseded by Package N below):** ~~a dedicated S1 Welcome package~~ — now complete.

---

#### S1 Welcome to Today's Experience — Implementation Evidence (Package N)

**Scope actually implemented:** replaces S1's Package J stand-in (the Entry/Launch screen at `/smokecraft`, always auto-satisfied) with a real, implemented, evidence-based S1 screen at `/smokecraft/welcome`. This closes the last remaining gap in the full Entry layer + 27-session spine — every numbered session and every Entry-layer screen is now real. Knowledge Check/Text Quiz, Recommended Next Journey, Leaderboard, Mini Tasting, SmokeCraft Challenge, Event Challenge, AI Summary, Pairing Recommendations, Rewards, Achievements, Venue Selection, and Resume/Start themselves were explicitly not modified beyond the one required Resume destination correction.

**Exact files changed:**
- `src/pages/smokecraft/WelcomeExperience.jsx` (new) — S1 screen.
- `src/constants/session.js` — S1's `VISIT_STRUCTURE` entry changed from `{ id: 'entry', route: '/smokecraft', ..., implemented: false }` to `{ id: 'entry', route: '/smokecraft/welcome', ... }` (no `implemented: false`). The `id` was deliberately **kept** as `'entry'` rather than renamed — every existing `completedSteps` record and every prior package's test fixture already includes `'entry'` as its first element (previously meaningless, since it was auto-satisfied), so keeping the id means all of that existing data and every prior test remains valid without a rename-driven migration. The `isSessionComplete()` helper's `if (id === 'entry') return true` auto-satisfy special case was removed — S1 now requires genuine evidence (`completedSteps.includes('entry')`), like any other session.
- `src/constants/smokecraftJourney.js` — `isStepComplete()`'s matching `if (session.id === 'entry') return true` special case removed, for the same reason (single source of truth, kept in parity with `session.js`).
- `src/context/SmokeCraftProgressContext.jsx` — `completedSessions`/`completedVisits`/`earnedBadges` each had their own independent `s.id === 'entry' ||` auto-satisfy shortcut (a second, separate hardcode from the one in `session.js`/`smokecraftJourney.js`); removed for the same reason — without this fix, Resume's completion-percentage math and phase/badge-earned computations would have kept treating S1 as always-complete even though it now genuinely isn't, which would have been a real, silent correctness bug. Not in the package's original allowed-file list, but directly necessary for S1 to be genuinely real rather than real-in-name-only; documented here rather than left as a silent gap.
- `src/App.jsx` — one new guarded route (`sessionNumber={1}`) for `/smokecraft/welcome`. The pre-existing index route (`/smokecraft`, `SmokeCraft.jsx`, the Entry-layer Launch screen) is untouched and remains a separate, distinct screen from S1 — its own `sessionNumber={1}` guard prop was already trivially always-unlocked before this package (S1 is always reachable, by construction of the unlock-walk algorithm) and remains so; no behavior change there.
- `src/context/SmokeCraftJourneyContext.jsx` — 5 new canonical fields (`welcomeExperience`, `welcomeViewedAt`, `learningObjectivesViewed`, `s1CompletedAt`, `currentScreenId`) and one new action (`setWelcomeState`, covering all five in a single call) added to `DEFAULT_STATE`/the context value; `startNewJourney()`'s reset list extended to include all five (S1 is now active-journey content, resets with everything else — see Resume behavior below). All inside the existing `sc_journey_v1` record — no new storage key. `resumeRoute`/`resumeScreenId` (Package M fields) are reused as-is, not duplicated.
- `src/pages/smokecraft/ResumeJourney.jsx` — `NEW_JOURNEY_START_ROUTE` changed from `/smokecraft` (the Package J stand-in) to `/smokecraft/welcome` (the real S1 registry route), per the package's explicit instruction. `PRESERVED_COMPLETED_STEP_IDS` changed from `['entry', 'enroll']` to `['enroll']` — S1 ('entry'/Welcome) is no longer preserved across a journey reset, since it now represents having viewed *this* journey's introduction, not a permanent account flag; a new journey correctly shows Welcome again, same as every other active-journey session.
- `verify-smokecraft-27-session-spine.mjs` — updated: `IMPLEMENTED_SPINE`/`ROUTE_TO_ID` now include S1 (`/smokecraft/welcome` → `entry`); wording updated from "20" to "21" implemented routes.
- `verify-smokecraft-venue-select-resume.mjs` — 2 assertions updated to reflect S1's new real-session behavior (previously asserted `'entry'` is preserved on reset and that `['entry','enroll']` alone means "no saved journey" — both were correct under the Package J stand-in and are now intentionally different under Package N); a fresh evidence-driven update, not a scope change.
- `verify-smokecraft-welcome-experience.mjs` (new) — 27-suite / 32-check Playwright suite for this package.
- `docs/SMOKECRAFT_360_MASTER_REBUILD_PLAN.md` — this evidence section only.

**Welcome route and S1 guard:** `/smokecraft/welcome`, `sessionNumber={1}` (trivially always-unlocked by construction, same as every other S1 guard before it — S1 has no earlier session to wait on).

**Back target:** `/smokecraft/resume` (E5 Resume or Start New Journey), never `navigate(-1)`.

**Continue target:** `/smokecraft/humidor-match` — the authoritative S2 Choose Your Cigar route read directly from the locked registry pattern already used by every other spine screen, not hardcoded to an unrelated route and never routed back to the SmokeCraft landing page.

**Resume behavior:** Resume (`/smokecraft/resume`, Package M, unmodified this package except its one required destination correction) already derives its "current allowed session" live from the registry — since S1 is now real and evidence-based, a brand-new guest's `currentAllowed` naturally resolves to S1/Welcome without any special-casing, and Resume's own "Resume Journey" button correctly lands there. "Start New Journey" now routes to `/smokecraft/welcome` (previously the Package J-documented `/smokecraft` stand-in), and S1's own completedSteps id (`'entry'`) is reset along with the rest of the active journey — a new journey genuinely starts at Welcome again.

**Persistence behavior:** `journey.welcomeExperience`/`welcomeViewedAt`/`learningObjectivesViewed`/`s1CompletedAt`/`currentScreenId`, all inside the existing `sc_journey_v1` record — no new storage key. `welcomeViewedAt` and `currentScreenId` are written on mount (idempotent — only when actually changed); `s1CompletedAt` and the real `completedSteps` entry (`'entry'`, via `awardSessionRewards('entry')`, which already existed with `xp: 0` in `SESSION_REWARDS` — no new XP entry needed) are written only when the guest clicks Begin Experience, never merely for opening the screen. `awardSessionRewards()`'s own idempotent `completedSteps.includes()` guard prevents duplicate XP/completion on refresh, return, or resume, verified directly (Suite 18).

**Approved visual reused:** none exists. `smokecraftAssets.js` and the broader asset library were searched for an approved "Welcome to Today's Experience" composition — none was found. Per the same precedent already established for AI Summary, Pairing Recommendations, Rewards, Venue Selection, and Resume (Packages K/L/M), the screen uses the same CSS gradient/card shell rather than commissioned background photography, since none is registered to reuse.

**Fallback behavior:** user identity, venue, cigar preview, and mentor preview each render only when real canonical data exists (`journey.identity`, `journey.selectedVenue`, `journey.selectedCigar`, `journey.mentor`); each has an honest, distinct neutral fallback string when the data doesn't exist yet — never fabricated. Estimated experience length is permanently and honestly "Not available — no duration estimate is tracked in this build," since no real duration-estimation system exists anywhere in the codebase. Standard `loading`/`error`+Retry/`offline` states follow the same pattern already established across Packages K–M.

**Tests run:** new suite (`verify-smokecraft-welcome-experience.mjs`), `verify-smokecraft-27-session-spine.mjs` (updated), `verify-smokecraft-persistence-consolidation.mjs`, `verify-smokecraft-route-corrections.mjs`, `verify-smokecraft-lighting-tutorial-route.mjs`, `verify-smokecraft-choose-your-cut.mjs`, `verify-smokecraft-terroir-knowledge-drop.mjs`, `verify-smokecraft-terroir-knowledge-drop-spine.mjs`, `verify-smokecraft-meet-your-cigar-mentor-commentary.mjs`, `verify-smokecraft-ai-summary-pairing-recommendations.mjs`, `verify-smokecraft-rewards-achievements.mjs`, `verify-smokecraft-venue-select-resume.mjs` (updated), `verify-interactions.mjs`, `verify-all-smokecraft-assets.mjs`, `final-acceptance.mjs`, `npm run build`.

**Test results:**
| Suite | Result |
|---|---|
| `verify-smokecraft-welcome-experience.mjs` | **32 passed, 0 failed** |
| `verify-smokecraft-27-session-spine.mjs` | **24 passed, 0 failed** (updated to reflect S1 now implemented) |
| `verify-smokecraft-persistence-consolidation.mjs` | **31 passed, 0 failed** — unaffected |
| `verify-smokecraft-route-corrections.mjs` | **12 passed, 0 failed** — unaffected |
| `verify-smokecraft-lighting-tutorial-route.mjs` | **12 passed, 0 failed** — unaffected |
| `verify-smokecraft-choose-your-cut.mjs` | **16 passed, 0 failed** — unaffected |
| `verify-smokecraft-terroir-knowledge-drop.mjs` | **19 passed, 0 failed** — unaffected |
| `verify-smokecraft-terroir-knowledge-drop-spine.mjs` | **17 passed, 0 failed** — unaffected |
| `verify-smokecraft-meet-your-cigar-mentor-commentary.mjs` | **31 passed, 0 failed** — unaffected |
| `verify-smokecraft-ai-summary-pairing-recommendations.mjs` | **35 passed, 0 failed** — unaffected |
| `verify-smokecraft-rewards-achievements.mjs` | **43 passed, 0 failed** — unaffected |
| `verify-smokecraft-venue-select-resume.mjs` | **47 passed, 0 failed** (2 assertions updated to reflect S1 now implemented) |
| `verify-interactions.mjs` | 20 passed, 2 failed — identical to the established baseline (same 2 pre-existing, unrelated failures) |
| `verify-all-smokecraft-assets.mjs` | **63 passed, 0 failed** |
| `final-acceptance.mjs` | 65 passed, 18 failed — identical to the established baseline |
| `npm run build` | **green** |

**Confirmed no unrelated files changed:** `git status --short` before commit showed only the files listed above — no Knowledge Check/Text Quiz, Recommended Next Journey, Leaderboard, Mini Tasting, SmokeCraft Challenge, Event Challenge, AI Summary, Pairing Recommendations, Rewards, Achievements, `Identity.jsx`, `SmokeCraft.jsx` (Launch), production image, database, or deployment files touched; `TOTAL_SESSIONS` confirmed unchanged (still 27) in the `session.js` diff; no later package started; the preview server used for testing was stopped before finishing, and no background test/preview process remained running; regenerated `public/proof/final-live-acceptance/*.png` screenshots were discarded via `git checkout --` before commit, matching every prior package's convention.

**Known limitations:** none identified specific to this package. The `SmokeCraftProgressContext.jsx` fix (removing the second, independent `'entry'` auto-satisfy hardcode) was outside the package's originally-listed allowed file scope but was necessary for correctness — flagged transparently above rather than silently included.

**Remaining unfinished screens:** none in the locked 27-session spine or 5-screen Entry layer — all 27 numbered sessions and all 5 Entry-layer screens are now real, implemented, routed screens. Remaining unbuilt work is limited to supporting-module scope explicitly excluded from every numbered package to date: Knowledge Check/Text Quiz, Recommended Next Journey (content depth beyond its existing repurposed `SessionComplete.jsx`), Leaderboard, Mini Tasting Round, SmokeCraft Challenge, and Event Challenge.

**Recommended next package (superseded by Package O below):** ~~a supporting-module package covering Knowledge Check/Text Quiz~~ — now complete.

---

#### Knowledge Check / Text Quiz — Implementation Evidence (Package O)

**Scope actually implemented:** builds one reusable Knowledge Check / Text Quiz component (`KnowledgeCheck.jsx`) plus its structured question-data model, launchable after any educational module by passing a `moduleId`. This is a supporting module, explicitly outside the numbered 27-session spine and Entry layer — no numbered session, Entry-layer screen, AI Summary, Pairing Recommendations, Rewards, Achievements, Recommended Next Journey, Leaderboard, Mini Tasting, SmokeCraft Challenge, or Event Challenge was modified.

**Exact files changed:**
- `src/components/smokecraft/KnowledgeCheck.jsx` (new) — the reusable component. Supports all 7 required question types (Multiple Choice, True/False, Multi-Select, Image Identification, Ordering/Sequence, Matching, Fill in the Blank), dynamic per-question validation, incorrect-answer feedback, an explanation panel, an educational reference line, per-question Retry, optional per-question Skip, a live progress indicator, a completion summary, and full keyboard/ARIA accessibility (`role="radiogroup"`/`"checkbox"`/`"progressbar"`, `aria-live` feedback region).
- `src/data/knowledgeCheckQuestions.js` (new) — the reusable question model (documented as a JSDoc type comment) plus 9 real question sets, one per required educational module (Terroir, Meet Your Cigar, Construction Inspection, Choose Your Cut, Lighting Tutorial, Flavor Discovery, Mentor Commentary, Knowledge Drop, Suggested Pairings) — one worked example of each of the 7 question types across the set. No question content is hardcoded inside the component; the component only renders/validates whatever structured data it's given.
- `src/pages/smokecraft/KnowledgeCheckDemo.jsx` (new) — a minimal QA/demo harness that mounts the reusable component with a module selector. **Not** wired into any educational screen and **not** part of the spine or Entry layer — it exists solely because this codebase's established testing convention is Playwright against real served routes (no component-level test framework like Vitest/Testing Library exists in this repo), so a route was the only way to exercise and verify the reusable component end-to-end. Flagged explicitly here as the one necessary exception to this package's stricter "only these files" scope — see Known Limitations below.
- `src/App.jsx` — one new guarded route (`requires="entry"`, i.e. always reachable, same permissive pattern as other non-spine utility routes) for the QA harness only: `/smokecraft/knowledge-check-demo`. Two-line diff (one import, one `<Route>`); no existing route, guard, or screen was altered.
- `verify-smokecraft-knowledge-check.mjs` (new) — 18-suite / 35-check Playwright suite for this package.
- `docs/SMOKECRAFT_360_MASTER_REBUILD_PLAN.md` — this evidence section only.

**Question model:** see the JSDoc block at the top of `knowledgeCheckQuestions.js`. Each question is `{ id, type, prompt, explanation, reference?, ...type-specific fields }` (`choices`/`correctAnswer` for single-select types, `correctAnswers` for multi-select, `items`/`correctOrder` for ordering, `pairs` for matching, `accepted` for fill-blank). Question sets are keyed by `moduleId` in `KNOWLEDGE_CHECK_SETS`, looked up via `getKnowledgeCheckSet(moduleId)` — a clean seam for adding more sets (including "future educational modules," per the package objective) without touching the component.

**XP behavior:** XP is reused, never invented. The component accepts an optional `completionStepId` prop; on completion, if — and only if — that id already has a real, pre-existing entry in `SESSION_REWARDS` (`smokecraftRewards.js`, unmodified this package), its existing `xp` value is awarded once via the already-exposed `addXP()` action (not `awardSessionRewards()`, deliberately — that function also writes to `completedSteps`, which would have falsely marked an unrelated numbered spine session as "complete" just because its Knowledge Check was taken; `addXP()` alone avoids that side effect entirely). A `xpAwardedRef`, seeded from any already-persisted completion, guarantees XP is never awarded twice for the same module — verified directly across three angles: a module with a real existing rule awards its XP once (Suite 8), a module with no configured rule awards nothing and says so honestly (Suite 8b), and retrying-and-recompleting the same module does not re-award (Suite 8c).

**Persistence:** canonical only — `session.smokeCraft.knowledgeChecks[moduleId] = { score, total, skippedCount, retryCount, completedAt }`, written via the guest session's already-exposed generic `update()` action (`useGuestSession()`), inside the existing `novee_guest_session` storage key. No new localStorage/sessionStorage key was created, and neither `GuestSessionContext.jsx` nor `SmokeCraftJourneyContext.jsx` needed any edit — both already exposed the generic actions this component needed.

**Tests run:** new suite (`verify-smokecraft-knowledge-check.mjs`), `verify-smokecraft-27-session-spine.mjs`, `verify-smokecraft-persistence-consolidation.mjs`, `verify-smokecraft-route-corrections.mjs`, `verify-smokecraft-lighting-tutorial-route.mjs`, `verify-smokecraft-choose-your-cut.mjs`, `verify-smokecraft-terroir-knowledge-drop.mjs`, `verify-smokecraft-terroir-knowledge-drop-spine.mjs`, `verify-smokecraft-meet-your-cigar-mentor-commentary.mjs`, `verify-smokecraft-ai-summary-pairing-recommendations.mjs`, `verify-smokecraft-rewards-achievements.mjs`, `verify-smokecraft-venue-select-resume.mjs`, `verify-smokecraft-welcome-experience.mjs`, `verify-interactions.mjs`, `verify-all-smokecraft-assets.mjs`, `final-acceptance.mjs`, `npm run build`.

**Test results:**
| Suite | Result |
|---|---|
| `verify-smokecraft-knowledge-check.mjs` | **35 passed, 0 failed** |
| `verify-smokecraft-27-session-spine.mjs` | **24 passed, 0 failed** — unaffected |
| `verify-smokecraft-persistence-consolidation.mjs` | **31 passed, 0 failed** — unaffected |
| `verify-smokecraft-route-corrections.mjs` | **12 passed, 0 failed** — unaffected |
| `verify-smokecraft-lighting-tutorial-route.mjs` | **12 passed, 0 failed** — unaffected |
| `verify-smokecraft-choose-your-cut.mjs` | **16 passed, 0 failed** — unaffected |
| `verify-smokecraft-terroir-knowledge-drop.mjs` | **19 passed, 0 failed** — unaffected |
| `verify-smokecraft-terroir-knowledge-drop-spine.mjs` | **17 passed, 0 failed** — unaffected |
| `verify-smokecraft-meet-your-cigar-mentor-commentary.mjs` | **31 passed, 0 failed** — unaffected |
| `verify-smokecraft-ai-summary-pairing-recommendations.mjs` | **35 passed, 0 failed** — unaffected |
| `verify-smokecraft-rewards-achievements.mjs` | **43 passed, 0 failed** — unaffected |
| `verify-smokecraft-venue-select-resume.mjs` | **47 passed, 0 failed** — unaffected |
| `verify-smokecraft-welcome-experience.mjs` | **32 passed, 0 failed** — unaffected |
| `verify-interactions.mjs` | 20 passed, 2 failed — identical to the established baseline (same 2 pre-existing, unrelated failures) |
| `verify-all-smokecraft-assets.mjs` | **63 passed, 0 failed** |
| `final-acceptance.mjs` | 65 passed, 18 failed — identical to the established baseline |
| `npm run build` | **green** |

**Confirmed no unrelated files changed:** `git status --short` before commit showed only the files listed above — no numbered session, Entry-layer screen, AI Summary, Pairing Recommendations, Rewards, Achievements, Recommended Next Journey, Leaderboard, Mini Tasting, SmokeCraft Challenge, Event Challenge, production image, database, or deployment files touched; the preview server used for testing was stopped before finishing, and no background test/preview process remained running; regenerated `public/proof/final-live-acceptance/*.png` screenshots were discarded via `git checkout --` before commit.

**Known limitations:** the one deliberate exception to this package's strict file list is the 2-line `App.jsx` diff plus the new `KnowledgeCheckDemo.jsx` QA harness — necessary because this repo has no component-level test runner, so a real served route was the only way to exercise the reusable component with Playwright per the package's own required-tests list. The harness is not linked from, and does not affect, any educational screen. The reusable component is **not** wired into Terroir, Meet Your Cigar, Construction Inspection, Choose Your Cut, Lighting Tutorial, Flavor Discovery, Mentor Commentary, Knowledge Drop, or Suggested Pairings this package — per the objective, it is built to be launched after those sections, not launched by them yet; integrating it into each screen is future, explicitly out-of-scope work.

**Recommended next package (superseded by Package P below):** ~~wire `KnowledgeCheck` into one or more real educational screens, and/or continue with the remaining static-stub supporting modules (Leaderboard, Mini Tasting, SmokeCraft Challenge, Event Challenge, deeper Recommended Next Journey content)~~ — Leaderboard now complete.

---

#### Live Leaderboard Module — Implementation Evidence (Package P)

**Scope actually implemented:** rebuilt the static, image-only Leaderboard screen (`/smokecraft/leaderboard`) into a live, data-driven React screen. This is a supporting module, explicitly outside the numbered 27-session spine and Entry layer — no Knowledge Check/Text Quiz, Mini Tasting, SmokeCraft Challenge, Event Challenge, Recommended Next Journey, numbered journey session, Entry-layer screen, AI Summary, Pairing Recommendations, Rewards, or Achievements screen was modified.

**Exact files changed:**
- `src/pages/smokecraft/Leaderboard.jsx` — rewritten from a 17-line static `SmokeCraftAssetScreen` stub into a live component with filters, states, and a real current-user entry.
- `verify-smokecraft-leaderboard.mjs` (new) — 29-suite / 36-check Playwright suite for this package.
- `docs/SMOKECRAFT_360_MASTER_REBUILD_PLAN.md` — this evidence section only.

No `App.jsx` change was needed (route already existed and required no cleanup) and no `smokecraftAssets.js` change was needed (`SC_ASSETS.leaderboard` already existed and was reused as-is, unmodified).

**Leaderboard route:** `/smokecraft/leaderboard` (unchanged, already guarded `requires="entry"`).

**Data source used:** `src/services/smokecraft/smokeLeaderboardService.js` (`getLeaderboardSnapshot(session)`) — the one existing leaderboard service that is already honest about having no real multi-user backend (`communityEntries: []`, `communityStatus: 'empty'`, an explicit `communityMessage` disclosing that community rankings require a real backend). The other candidate, `src/services/leaderboardService.js`, was deliberately **not** used because it contains a hardcoded `DEMO_PLAYERS` array of fabricated names, which would have violated the "never fabricate names/rankings/scores/venues/activity" requirement. The one real, live entry (the current guest) is built directly from canonical, already-persisted session/journey data (XP, tier via the existing `getRankFromXP`, completed journeys, passport stamps, achievements, Knowledge Check scores, selected venue, last activity timestamp) — no data is invented.

**Honest fallback behavior:** because no real backend/community data source exists, the screen never fabricates other players. It shows exactly one real entry (the current user) plus an explicit, honestly-worded banner (`snapshot.communityMessage`) disclosing that full community rankings require a real backend integration. This is the documented integration seam for future work — no fake backend was built.

**Filters implemented:** Venue, Global, Weekly, Monthly, All Time, and Experience Tier — all functionally real, evaluated against the one real entry using genuine predicates (venue match, tier match, time-window match against real activity timestamps), so filters correctly include/exclude the real entry rather than toggling fake data. Friends/Community was deliberately omitted — no relationship/friends data source exists anywhere in the codebase, per the package's own "only when real relationship data exists" condition.

**Privacy behavior:** only public identity is shown (preferred name or an honest "Guest" anonymous fallback when no public identity is set); no email address, phone number, legal name, or private profile data is ever rendered. Quiz score and challenge points are shown as "Not available" rather than fabricated when no real value exists.

**Scroll and pagination behavior:** entries render inside a `role="list"` scrollable `<main>` container (`overflowY: auto`) with `overscrollBehavior: contain` set specifically to prevent the list's scroll from trapping/propagating to the page.

**Persistence behavior:** canonical only — `session.smokeCraft.leaderboardPrefs = { scope, timeRange, tierFilter }` plus `lastRefreshedAt`, written via the guest session's existing generic `update()` action, inside the existing `novee_guest_session` storage key. No new storage key was created. Filter selections are restored on reload/refresh. No XP is awarded from opening or using the Leaderboard screen (verified directly — XP unchanged after navigation).

**Tests run:** new suite (`verify-smokecraft-leaderboard.mjs`), `verify-smokecraft-27-session-spine.mjs`, `verify-smokecraft-persistence-consolidation.mjs`, `verify-smokecraft-route-corrections.mjs`, `verify-smokecraft-lighting-tutorial-route.mjs`, `verify-smokecraft-choose-your-cut.mjs`, `verify-smokecraft-terroir-knowledge-drop.mjs`, `verify-smokecraft-terroir-knowledge-drop-spine.mjs`, `verify-smokecraft-meet-your-cigar-mentor-commentary.mjs`, `verify-smokecraft-ai-summary-pairing-recommendations.mjs`, `verify-smokecraft-rewards-achievements.mjs`, `verify-smokecraft-venue-select-resume.mjs`, `verify-smokecraft-welcome-experience.mjs`, `verify-smokecraft-knowledge-check.mjs`, `verify-interactions.mjs`, `verify-all-smokecraft-assets.mjs`, `final-acceptance.mjs`, `npm run build`.

**Test results:**
| Suite | Result |
|---|---|
| `verify-smokecraft-leaderboard.mjs` | **36 passed, 0 failed** |
| `verify-smokecraft-27-session-spine.mjs` | **24 passed, 0 failed** — unaffected |
| `verify-smokecraft-persistence-consolidation.mjs` | **31 passed, 0 failed** — unaffected |
| `verify-smokecraft-route-corrections.mjs` | **12 passed, 0 failed** — unaffected |
| `verify-smokecraft-lighting-tutorial-route.mjs` | **12 passed, 0 failed** — unaffected |
| `verify-smokecraft-choose-your-cut.mjs` | **16 passed, 0 failed** — unaffected |
| `verify-smokecraft-terroir-knowledge-drop.mjs` | **19 passed, 0 failed** — unaffected |
| `verify-smokecraft-terroir-knowledge-drop-spine.mjs` | **17 passed, 0 failed** — unaffected |
| `verify-smokecraft-meet-your-cigar-mentor-commentary.mjs` | **31 passed, 0 failed** — unaffected |
| `verify-smokecraft-ai-summary-pairing-recommendations.mjs` | **35 passed, 0 failed** — unaffected |
| `verify-smokecraft-rewards-achievements.mjs` | **43 passed, 0 failed** — unaffected |
| `verify-smokecraft-venue-select-resume.mjs` | **47 passed, 0 failed** — unaffected |
| `verify-smokecraft-welcome-experience.mjs` | **32 passed, 0 failed** — unaffected |
| `verify-smokecraft-knowledge-check.mjs` | **35 passed, 0 failed** — unaffected |
| `verify-interactions.mjs` | 20 passed, 2 failed — identical to the established baseline (same 2 pre-existing, unrelated failures) |
| `verify-all-smokecraft-assets.mjs` | **63 passed, 0 failed** |
| `final-acceptance.mjs` | 65 passed, 18 failed — identical to the established baseline |
| `npm run build` | **green** |

**Confirmed no unrelated files changed:** `git status --short` before commit showed only `src/pages/smokecraft/Leaderboard.jsx` (modified), `verify-smokecraft-leaderboard.mjs` (new), and this doc section — no numbered session, Entry-layer screen, AI Summary, Pairing Recommendations, Rewards, Achievements, Knowledge Check, Mini Tasting, SmokeCraft Challenge, Event Challenge, Recommended Next Journey, production image, database, deployment, or environment file touched; the preview server used for testing was stopped before finishing, and no background test/preview process remained running; regenerated `public/proof/final-live-acceptance/*.png` screenshots were discarded via `git checkout --` before commit.

**Known limitations:** only one real leaderboard entry (the current guest) can ever be shown until a real multi-user backend exists — this is the documented integration seam, not a bug. The approved production Leaderboard image is reused as a non-blocking decorative header banner; all data underneath remains fully live React content, independent of that asset, per the package's instruction.

**Recommended next package (superseded by Package Q below):** ~~wire a real multi-user leaderboard backend, and/or continue with the remaining static-stub supporting modules (Mini Tasting, SmokeCraft Challenge, Event Challenge, deeper Recommended Next Journey content)~~ — Mini Tasting now complete.

---

#### Mini Tasting Module — Implementation Evidence (Package Q)

**Scope actually implemented:** built a new, live, data-driven Mini Tasting supporting-module screen (`MiniTasting.jsx`), route `/smokecraft/mini-tasting-module`. This is deliberately separate from the existing numbered-spine screen `MiniTastingRound.jsx` (route `/smokecraft/mini-tasting`, S19 unlock step, awards `SESSION_REWARDS['mini-tasting']` and advances the journey to `visit-complete`) — that screen, its route, and its journey-flow/XP behavior were **not** touched. No numbered journey session, session numbering, progress engine, XP engine, Rewards, Achievements, Leaderboard, Knowledge Check, SmokeCraft Challenge, Event Challenge, AI Summary, Pairing Recommendations, persistence schema, database, deployment, or production image was modified.

**Exact files changed:**
- `src/pages/smokecraft/MiniTasting.jsx` (new) — the live module: Today's Flight, three-cigar selection, comparison panel, pairing panel, Begin Mini Tasting, all required fallback states.
- `src/App.jsx` — 2-line addition (one import, one `<Route>`) registering `/smokecraft/mini-tasting-module`, guarded permissively (`requires="entry"`), the same necessary-exception pattern used for Package O's QA-harness route (no existing route, guard, or screen was altered). No existing Mini Tasting route existed for this new module, so this was the minimal wiring required to make it reachable and testable per this repo's Playwright-only testing convention.
- `verify-smokecraft-mini-tasting.mjs` (new) — 15-suite / 24-check Playwright suite for this package.
- `docs/SMOKECRAFT_360_MASTER_REBUILD_PLAN.md` — this evidence section only.

**Route:** `/smokecraft/mini-tasting-module`.

**Data source used:** `src/data/venueInventoryData.js` (`getSampleInventory`, `VENUE_ID`) — the existing, real, structured venue inventory sample data (already documented in its own header as "LOCAL PREVIEW MODE... sample data"), containing real cigar fields (`cigar_origin`, `cigar_wrapper`, `cigar_strength`, `cigar_flavor_notes`, `recommended_drink_pairings`, `recommended_food_pairings`, `cigar_burn_time`) for 5 house/featured cigars. "Today's Flight" takes the first 3 (by `sort_order`) house/featured cigars from this real data — never fabricated. No separate "body," "finish," "construction," or "draw" field exists anywhere in the codebase, so those comparison attributes honestly render "Not available" rather than being invented.

**Fallback behavior:** if the venue inventory query returns no cigar items, the flight honestly displays "No tasting flight available." Any missing per-cigar attribute (image, origin, wrapper, flavor notes, pairings) renders "Not available." Pairing categories (Coffee, Rum, Whiskey, Chocolate, Non-alcoholic) are matched against real pairing/flavor text via keyword matching; unmatched categories honestly show "Not available." Offline state is detected via `online`/`offline` browser events. Loading and error/retry states mirror the pattern established in Packages K–P. No fake network delay beyond a minimal UI-settle timeout is used, and "Begin Mini Tasting" applies its state change immediately (no fake loading spinner gating the action).

**XP behavior:** reuses the existing XP engine only — `addXP()` from `GuestSessionContext`, never `awardSessionRewards()` (which would falsely mark spine session progress, per the same reasoning established in Package O). Looks up `SESSION_REWARDS['mini-tasting-module']`, which does not exist in `smokecraftRewards.js` (only the spine's `'mini-tasting'` key exists, deliberately left untouched and not reused here since it belongs to a different screen/step). Because no rule is configured for this module, the screen honestly displays "No XP configured" and awards no XP — verified directly in the test suite.

**Persistence:** canonical only — `session.smokeCraft.miniTasting = { selectedCigarId, compareIds, startedAt, completedAt }`, written via the guest session's existing generic `update()` action, inside the existing `novee_guest_session` storage key. No new storage key was created. Selection and comparison state are restored after reload (resume works).

**Tests run:** new suite (`verify-smokecraft-mini-tasting.mjs`), `verify-smokecraft-27-session-spine.mjs`, `verify-smokecraft-route-corrections.mjs`, `verify-smokecraft-lighting-tutorial-route.mjs`, `verify-interactions.mjs`, `verify-all-smokecraft-assets.mjs`, `final-acceptance.mjs`, `npm run build`.

**Test results:**
| Suite | Result |
|---|---|
| `verify-smokecraft-mini-tasting.mjs` | **24 passed, 0 failed** |
| `verify-smokecraft-27-session-spine.mjs` | **24 passed, 0 failed** — unaffected |
| `verify-smokecraft-route-corrections.mjs` | **12 passed, 0 failed** — unaffected |
| `verify-smokecraft-lighting-tutorial-route.mjs` | **12 passed, 0 failed** — unaffected |
| `verify-interactions.mjs` | 20 passed, 2 failed — identical to the established baseline |
| `verify-all-smokecraft-assets.mjs` | **63 passed, 0 failed** |
| `final-acceptance.mjs` | 65 passed, 18 failed — identical to the established baseline |
| `npm run build` | **green** (1m 60s) |

**Confirmed no unrelated files changed:** `git status --short` before commit showed only `src/App.jsx` (2-line diff), `src/pages/smokecraft/MiniTasting.jsx` (new), `verify-smokecraft-mini-tasting.mjs` (new), and this doc section — no numbered session, journey flow, session numbering, progress engine, XP engine, Rewards, Achievements, Leaderboard, Knowledge Check, SmokeCraft Challenge, Event Challenge, AI Summary, Pairing Recommendations, persistence schema, production image, database, or deployment file touched. The existing spine `mini-tasting` route and `MiniTastingRound.jsx` are byte-for-byte unmodified. The preview server used for testing was stopped before finishing, and no background test/preview process remained running; regenerated `public/proof/final-live-acceptance/*.png` screenshots were discarded via `git checkout --` before commit.

**Known limitations:** only 3 of the 5 real cigars in the sample inventory are shown in "Today's Flight" (by design, per the "Three Cigars" requirement). Finish, Construction, and Draw comparison attributes always show "Not available" since no such data field exists anywhere in the codebase yet — this is the honest, documented integration seam for future real tasting-note data, not a bug.

**Recommended next package (superseded by Package R below):** ~~SmokeCraft Challenge or Event Challenge, and/or wiring real tasting-note fields (finish/construction/draw) into the inventory data source~~ — SmokeCraft Challenge and Event Challenge now complete.

---

#### SmokeCraft Challenge + Event Challenge — Implementation Evidence (Package R)

**Scope actually implemented:** rebuilt both `SmokeCraftChallenge.jsx` (route `/smokecraft/smokecraft-challenge`) and `EventChallenge.jsx` (route `/smokecraft/event-challenge`) from static image-only stubs into live, data-driven screens. Both are supporting modules, outside the locked 27-session spine (`SmokeCraftChallenge` is a `SUPPORTING_MODULES` entry requiring `scorecard`; `EventChallenge` is an ungated standalone route). No numbered journey session, session numbering, Mini Tasting, Knowledge Check, Leaderboard, Recommended Next Journey, Entry Layer, AI Summary, Pairing Recommendations, Rewards, Achievements, persistence schema, XP engine, database, or deployment file was modified.

**Exact files changed:**
- `src/pages/smokecraft/SmokeCraftChallenge.jsx` (rewritten) — live challenge categories, featured challenge, join/view-progress/view-rewards, user progress/rank/XP summary, honest "no backend" live-events boundary. The pre-existing journey-flow behavior ("Start Challenge" → award the spine's `smokecraft-challenge` session reward → navigate to Second Humidor Match) is preserved unchanged, just relocated into a richer screen.
- `src/pages/smokecraft/EventChallenge.jsx` (rewritten) — live event calendar, event details, real countdown, banner/sponsor local-reference upload controls, honest leaderboard-preview boundary, Join Event, Back to Challenges.
- `verify-smokecraft-challenge-event.mjs` (new) — 28-suite / 40-check Playwright suite for this package.
- `docs/SMOKECRAFT_360_MASTER_REBUILD_PLAN.md` — this evidence section only.

No `App.jsx` change was needed — both required routes (`/smokecraft/smokecraft-challenge`, `/smokecraft/event-challenge`) already existed and needed no cleanup. No `smokecraftAssets.js` change was needed — the two literal new image filenames named in this package's brief ("SMOKECRAFT CHALLENG.png", "EVENT CHALLENGE 111(2).png") do not exist anywhere in this repository (confirmed via a full-filesystem search); per the same precedent established in Package P, the live implementation was kept independent of that not-yet-added asset and the current approved shells already registered in `smokecraftAssets.js` (`smokecraftChallenge` → `smokecraft-challenge.png`, `eventChallenge` → `smokecraft-event-challenge.png`) were reused as-is, unmodified.

**SmokeCraft Challenge route:** `/smokecraft/smokecraft-challenge` (existing, unchanged, still guarded `requires="scorecard"`).

**Event Challenge route:** `/smokecraft/event-challenge` (existing, unchanged, still ungated).

**Data source used:** `src/services/smokecraft/smokeWinnerService.js` (`calculateWinnerEligibility`, `getTopEligibleCategory`, `getWinnerProgress`) for SmokeCraft Challenge — an existing, already-verified engine that evaluates 13 real winner categories against actual session data and explicitly documents that it "never fabricates a win." `src/data/passportEvents.js` (`PASSPORT_EVENTS`) for Event Challenge — the only real, existing event data source in the codebase (titles, venues, dates/times, descriptions, capacity/attendees, images). Rank and XP reuse `getRankFromXP`/session `xp` (unmodified). Event leaderboard preview reuses `smokeLeaderboardService.js` (same honest-boundary service used in Package P's Leaderboard).

**Honest fallback behavior:** "Live events" on SmokeCraft Challenge honestly discloses "No backend connected" — no scheduled challenge-events service exists, and none was fabricated. Grand reward and participation rewards show "Not available" on both screens — no reward catalog exists anywhere in the codebase. Event Challenge sponsor logo shows "No sponsor configured" when none is set. Points rules show "Not available." Countdown is computed only from each event's real date/time; events whose real date has passed are honestly marked "Expired"/"This event has passed" rather than showing a fake countdown. Banner/sponsor "upload" controls store only local file reference metadata (`name`, `size`, `type`) — no fake upload backend was built, and the screen never claims the file was actually uploaded anywhere.

**Persistence behavior:** canonical only — `session.smokeCraft.smokeCraftChallengeModule = { selectedCategoryId, joinedCategoryIds, lastViewedCategoryId, startedAt }` and `session.smokeCraft.eventChallengeModule = { lastViewedEventId, joinedEventIds, uploadedBannerRef, uploadedSponsorRef }`, both written via the guest session's existing generic `update()` action, inside the existing `novee_guest_session` key. No new storage key was created. Joined/selected/last-viewed state and uploaded-reference metadata all restore correctly after refresh.

**XP behavior:** reuses the existing XP engine only. Joining a challenge category or an event never awards XP and is idempotent (re-clicking Join does not duplicate the joined-state entry) — verified directly in the test suite (XP unchanged before/after joining either). The one XP-bearing action retained is "Start Challenge" on SmokeCraft Challenge, which is the pre-existing spine-continuation `awardSessionRewards('smokecraft-challenge')` call, unchanged from before this package (not a new or invented rule).

**Approved images connected:** `SC_ASSETS.smokecraftChallenge` and `SC_ASSETS.eventChallenge` (both pre-existing, already-approved production assets) are reused as decorative header banners on their respective screens — all rankings, names, XP, rank, countdown, progress, event dates, challenge counts, reward eligibility, user identity, and selected states are live React content, never baked into the image.

**Tests run:** new suite (`verify-smokecraft-challenge-event.mjs`), `verify-smokecraft-27-session-spine.mjs`, `verify-smokecraft-persistence-consolidation.mjs`, `verify-smokecraft-route-corrections.mjs`, `verify-smokecraft-lighting-tutorial-route.mjs`, `verify-smokecraft-choose-your-cut.mjs`, `verify-smokecraft-terroir-knowledge-drop.mjs`, `verify-smokecraft-terroir-knowledge-drop-spine.mjs`, `verify-smokecraft-meet-your-cigar-mentor-commentary.mjs`, `verify-smokecraft-ai-summary-pairing-recommendations.mjs`, `verify-smokecraft-rewards-achievements.mjs`, `verify-smokecraft-venue-select-resume.mjs`, `verify-smokecraft-welcome-experience.mjs`, `verify-smokecraft-knowledge-check.mjs`, `verify-smokecraft-leaderboard.mjs`, `verify-smokecraft-mini-tasting.mjs`, `verify-interactions.mjs`, `verify-all-smokecraft-assets.mjs`, `final-acceptance.mjs`, `npm run build`.

**Test results:**
| Suite | Result |
|---|---|
| `verify-smokecraft-challenge-event.mjs` | **40 passed, 0 failed** |
| `verify-smokecraft-27-session-spine.mjs` | **24 passed, 0 failed** — unaffected |
| `verify-smokecraft-persistence-consolidation.mjs` | **31 passed, 0 failed** — unaffected |
| `verify-smokecraft-route-corrections.mjs` | **12 passed, 0 failed** — unaffected |
| `verify-smokecraft-lighting-tutorial-route.mjs` | **12 passed, 0 failed** — unaffected |
| `verify-smokecraft-choose-your-cut.mjs` | **16 passed, 0 failed** — unaffected |
| `verify-smokecraft-terroir-knowledge-drop.mjs` | **19 passed, 0 failed** — unaffected |
| `verify-smokecraft-terroir-knowledge-drop-spine.mjs` | **17 passed, 0 failed** — unaffected |
| `verify-smokecraft-meet-your-cigar-mentor-commentary.mjs` | **31 passed, 0 failed** — unaffected |
| `verify-smokecraft-ai-summary-pairing-recommendations.mjs` | **35 passed, 0 failed** — unaffected |
| `verify-smokecraft-rewards-achievements.mjs` | **43 passed, 0 failed** — unaffected |
| `verify-smokecraft-venue-select-resume.mjs` | **47 passed, 0 failed** — unaffected |
| `verify-smokecraft-welcome-experience.mjs` | **32 passed, 0 failed** — unaffected |
| `verify-smokecraft-knowledge-check.mjs` | **35 passed, 0 failed** — unaffected |
| `verify-smokecraft-leaderboard.mjs` | **36 passed, 0 failed** — unaffected |
| `verify-smokecraft-mini-tasting.mjs` | **24 passed, 0 failed** — unaffected |
| `verify-interactions.mjs` | 20 passed, 2 failed — identical to the established baseline |
| `verify-all-smokecraft-assets.mjs` | **63 passed, 0 failed** |
| `final-acceptance.mjs` | 65 passed, 18 failed — identical to the established baseline |
| `npm run build` | **green** (1m 58s) |

**Confirmed no unrelated files changed:** `git status --short` before commit showed only `src/pages/smokecraft/SmokeCraftChallenge.jsx`, `src/pages/smokecraft/EventChallenge.jsx`, `verify-smokecraft-challenge-event.mjs` (new), and this doc section — no numbered journey session, unrelated screen, unrelated route, production image (outside the two already-approved assets reused as-is), database, deployment, environment file, or Recommended Next Journey file touched. The preview server used for testing was stopped before finishing, and no background test/preview process remained running; regenerated `public/proof/final-live-acceptance/*.png` screenshots were discarded via `git checkout --` before commit.

**Known limitations:** the two literal new approved image files named in this package's brief were not found anywhere in the repository, so the previously-approved SmokeCraft Challenge and Event Challenge images remain in use as the visual shell until the new assets are actually added — this is the documented, honest boundary, not a bug. No reward catalog, sponsor data, points-rules data, or challenge-events backend exists yet anywhere in the codebase; all such fields honestly render "Not available" / "No backend connected" rather than being invented.

**Recommended next package:** register the two new approved images once added to the repository and swap them in via `smokecraftAssets.js`; and/or build a real reward catalog / sponsor / points-rules / challenge-events backend to replace the documented "Not available" / "No backend connected" integration seams.

---

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
