# SmokeCraft 360 — Master Rebuild Plan

**Status:** Planning document only. No application code, routes, components, images, or database files were changed to produce this plan.
**Source of truth:** `docs/SMOKECRAFT_360_MASTER_AUDIT.md`
**Repo:** coach1206/crafthub-360-stitch
**Branch:** recovery/smokecraft-codex-final
**HEAD at planning time:** `f3adf191f16f8248833cbf26a68267c01a049f85`

---

## 1. Executive Summary

The audit found a codebase where the core tasting journey (19 screens) is genuinely interactive and mostly wired to canonical persistence, but is surrounded by three categories of debt: (a) 17 supplemental/in-spine screens that are static stubs or `ComingSoon` placeholders, (b) 8 shadow localStorage/sessionStorage keys that fragment persistence outside the canonical `sc_journey_v1` context, and (c) ~100+ orphaned/duplicate image files left over from repeated incomplete asset-repair passes. Routing has three concrete correctness bugs (duplicate Session-2 guard, duplicate Format route, dead-end legacy session aliases). No Rewards page exists despite being referenced by UI. No AI feature exists beyond a placeholder. Only one real quiz mechanic exists in the entire app.

This plan sequences the fix so that **no screen is rebuilt twice**: persistence is consolidated before screens are redesigned against it, routing is corrected before new screens are added to the route table, and the journey-count decision is locked before any screen numbering is touched.

---

## 2. Audit Findings Used

Every section of this plan traces to a numbered section of `docs/SMOKECRAFT_360_MASTER_AUDIT.md`:

- Journey structure & gating logic → Audit §1
- Route table, aliases, duplicate guards → Audit §2, §5
- Asset inventory & duplicates → Audit §3, §5
- Screen/component catalog, static-only screens, orphaned components → Audit §4, §6
- Live-image / journey-count mismatch → Audit §7
- Persistence shadow keys → Audit §8
- Missing controls → Audit §9
- Missing education → Audit §10
- Missing AI → Audit §11/§13
- Missing quizzes/XP/rewards → Audit §12
- Missing states (loading/error/offline/retry) → Audit §14
- Screen counts → Audit §15
- Full screen table → Audit §16
- Prior proposed order (superseded by this plan's dependency-driven order) → Audit §17

---

## 3. Master Journey Decision

### 3a. 24-session (current, coded) vs 27-session (proposed) comparison

| Dimension | 24-session (current) | 27-session (proposed) |
|---|---|---|
| Coded in `session.js` / routed in `App.jsx` | Yes, fully | No — never defined anywhere in the repo |
| Gating logic (`isSessionUnlocked`/`isVisitUnlocked`) | Built and working for 24/8 | Would need to be re-derived from scratch |
| Persistence (`sc_journey_v1`) | Has slots for most of the 24 (missing wrapperStrength, origins, terroir, vitola, blend, flavorDNA — Audit §8) | Unknown — no spec exists for what the extra 3 sessions would be |
| Existing working screens | 19 of 24 numbered sessions already interactive | N/A — can't map until the 3 extra sessions are defined |
| Verification scripts / prior test suites | Written against 24-session routes (`verify-interactions.mjs`, `final-acceptance.mjs`, etc.) | Would need rewriting |

### 3b. Session-by-session mapping

1. **Direct 1:1 mapping**: All 24 current sessions (S1–S24) map cleanly to a real, distinct step in the guest journey — entry, enroll, golden-box, mentor-selection, format, wrapper-strength, seed-soil, pairing-lab, humidor-match, request-purchase, cut-toast-light, first-third, second-third, flavor-memory, final-third, scorecard, smokecraft-challenge, second-humidor-match, mini-tasting, final-review, passport-stamp, connections, management-sync, session-complete. None of these need renaming, merging, or splitting to remain coherent.
2. **Sessions that would be renamed**: none required. `identity` should stop being co-guarded as "Session 2" (see §14/Route Correction Plan) but the session itself (`enroll`) keeps its name and number.
3. **Sessions that would be merged**: `second-humidor-match` (S18) is a strong candidate to merge into the `humidor-match` (S9) pattern rather than exist as a separate near-duplicate stub — see Audit §5 finding 4. This reduces the count to 23 *unique* interaction patterns while keeping 24 numbered checkpoints (S18 becomes a "revisit" checkpoint reusing S9's component in a second-visit configuration, not a rebuild).
4. **Sessions that would be split**: none identified. No existing session is overloaded enough to require splitting into two.
5. **Sessions that are missing from the 24-count**: none confirmed. The audit found zero evidence of what 3 additional sessions the "27" figure would represent — no design doc, no orphaned route, no batch-22 asset set that maps to unbuilt *numbered* sessions (batch-22 appears to be general staging/reference material, not session-specific — Audit §3).
6. **Existing sessions that would become supporting modules**: `smokecraft-challenge` (S17) and `mini-tasting` (S19) are thin enough (static stub, single Continue button) that they are better classified as **supporting-module-style checkpoints inside the spine** — they get real content (Phase 6/7) but do not need to become full "main journey" screens with their own sub-navigation.

### 3c. Recommendation

**Do not adopt 27 as the locked count.** There is no artifact anywhere in this repository — no design doc, no route, no asset set, no journey constant — that defines what the 3 additional sessions would contain. Locking to an undefined number would force either (a) inventing 3 sessions with no product basis, which risks being thrown away, or (b) leaving 3 numbered gaps in a "locked" journey, which is worse than the current honest 24.

**Recommended final journey: 24 sessions, 8 visits — unchanged from current coded structure.**

This is the smallest safe final journey because:
- 19 of 24 sessions are already real, working, interactive screens (Audit §15) — rebuilding to a different count would put all 19 at risk of unnecessary rework.
- The persistence layer (`sc_journey_v1`), gating logic, and existing test suites are all built against 24/8 — changing the count invalidates all of them simultaneously.
- Every genuine gap found in the audit (Rewards page, 3 static stubs, 6 education stubs, AI placeholder) can be closed as **supporting modules or in-place content upgrades** without changing the session count at all.
- If a genuine 27-session (or any other count) product spec is produced later, it can be layered on top of a *stable* 24-session core with far less risk than trying to hit an undefined target now.

**Recommended final session count: 24.**
**Recommended final main-journey screen count: 24** (one screen per session; S18 reuses S9's component under a distinct route rather than a hand-built duplicate).
**Recommended final supporting-module count: 13** — Rewards (new), Leaderboard, HowItWorks, EventChallenge, Origins, Terroir, Vitola, PairingMastery, FlavorDNA, Assistant, GoldenBoxStatus, Scan, GuestPass. (WrapperStrength is *not* counted here — it is S6, inside the main spine, and must become a real main-journey screen, not a supporting module.)

This structure minimizes rebuilding because it changes **zero** existing working routes, preserves all 19 reusable screens untouched at the routing/session level, and converts every audit-identified gap into additive work rather than structural change.

---

## 4. Final Recommended Journey

24 sessions / 8 visits, unchanged from Audit §1's coded structure. See §3c.

## 5. Final Recommended Screen Count

- Main journey: **24**
- Supporting modules: **13**
- Total addressable SmokeCraft screens: **37** (matches Audit §16's enumerated table, which already lists 37 numbered rows).

## 6. Final Recommended Supporting-Module Count

**13** — see §3c list.

---

## 7. Screens to Keep

FirstThird (S12), SecondThird (S13), HumidorMatch (S9), CutToastLight (S11), Format (S5), Mentor (S4), PairingLab (S8), RequestPurchase (S10), ManagementSync (S23), FinalReview (S20) — 10 screens require **zero** structural or persistence change. (FlavorMemory, FinalThird, Scorecard, Connections, GoldenBox, Identity, PassportStamp, SessionComplete are functionally "keep" at the UI level but require the persistence fix in §9, so they are listed under Update, not here, to avoid double-counting.)

## 8. Screens to Update

FlavorMemory (S14), FinalThird (S15), Scorecard (S16), Connections (S22), GoldenBox (S3), Identity (S2), PassportStamp (S21), SessionComplete (S24) — persistence-only fixes (remove shadow keys, read/write exclusively through `useSmokeCraftJourney()`). No visual redesign required for any of these 8.

Scan.jsx, GuestPass.jsx — replace the single full-card invisible hotspot with real, image-aligned controls (same anti-pattern the prior mandate banned for core screens).

## 9. Screens to Merge

SecondHumidorMatch (S18) → merge into the HumidorMatch (S9) component, parameterized for a "second visit" presentation rather than maintained as a separate static stub.

## 10. Screens to Split

None identified. No screen in the audit is overloaded enough to require splitting.

## 11. Screens to Redesign

SmokeCraftChallenge (S17), MiniTastingRound (S19), Leaderboard, EventChallenge — currently static-only, need real interactive content and (for Leaderboard) real or honestly-empty ranking data.

## 12. Screens to Create

- `/smokecraft/rewards` — confirmed missing, referenced by existing UI (Audit §12).
- WrapperStrength (S6) — currently renders null; needs real educational content since it sits inside the guarded spine.
- Origins, Terroir, Vitola, PairingMastery, FlavorDNA — currently `ComingSoon`/image-only; need real content (supporting modules, not spine-blocking).
- Assistant — currently `ComingSoon`; creation here means *deciding and building*, or explicitly de-scoping per §21 (AI Plan) — this plan does not assume AI must ship, only that the placeholder must be resolved one way or the other before freeze.

## 13. Screens to Archive

`Format.legacy.jsx` (1,571-line superseded file) and the 12 orphaned components listed in Audit §4c — archived (not hard-deleted in the first pass) pending a final zero-reference re-check, since deletion is irreversible and this plan treats it as a late-phase, low-risk cleanup step (Phase 9 in Rebuild Priority Order, Package F below).

---

## 14. Route Correction Plan

| Issue | Fix | Risk |
|---|---|---|
| `identity` and `enroll` both guarded as Session 2 | Change `identity`'s guard to a distinct, correctly-ordered session number, or explicitly demote `identity` to an unguarded profile-edit route reachable *from* S2 rather than co-occupying S2's gate | Low — no visual change, pure guard correctness |
| `shape-size-burn` duplicates `format` (same element, same guard) | Make `shape-size-burn` a `Navigate` alias to `/smokecraft/format` instead of an independent route rendering the same element | Low |
| `smokecraft/session-1..session-4` collapse to `/smokecraft` regardless of target | Route each to the guest's actual `currentSession`/`nextSessionId` via `useSmokeCraftProgress()`, or remove the aliases entirely if nothing external still links to them | Low — legacy alias cleanup only |
| No `/smokecraft/rewards` route exists | Add the route once the Rewards screen is built (§12); repoint every "Rewards" CTA (PairingLab, SmokeCraftChallenge, SmokeCraft landing) away from `/smokecraft/humidor-match` | Medium — touches 3 existing files' CTA targets |
| `order` and `ticket-tapper/staff-specials` both render `SmokeCraftVenueCommerce` directly | Out of SmokeCraft-journey scope (venue-commerce subsystem) — flag for the owning team, no action in this plan | N/A |

All route corrections are additive or alias-only — none require deleting a currently-working route.

---

## 15. Persistence Consolidation Plan

**Target state:** every SmokeCraft screen reads and writes exclusively through `useSmokeCraftJourney()` against `sc_journey_v1`. No screen owns a private `localStorage`/`sessionStorage` key.

**Remaining shadow keys to eliminate** (Audit §8 — the prior mandate already fixed FirstThird/SecondThird/RequestPurchase/FlavorMemory-partial/FinalThird-partial/Scorecard-partial/FinalReview):

| File | Shadow key | Action |
|---|---|---|
| Connections.jsx | private `LS_KEY` | migrate connections list into `journey.connections` |
| GoldenBox.jsx | private `LS_KEY` | migrate acknowledged flag into `journey` (new field or reuse `sessionCompletion`) |
| Identity.jsx | `sc_identity_v1` | migrate into `journey.identity` (already has a canonical setter — `setIdentity` exists per Audit §8) |
| Scorecard.jsx | `sc_scorecard_v1` (residual) | finish migration onto `setScorecard`; stop reading `sessionStorage.smokecraftFinalThird` directly — read `journey.finalThird` instead |
| FinalThird.jsx | `sessionStorage.smokecraftFinalThird` (residual) | finish migration onto `setFinalThird` |
| FlavorMemory.jsx | `sessionStorage.smokecraftFlavorMemory` (residual) | finish migration onto `setFlavorMemory` |
| PassportStamp.jsx | private `LS_KEY` + raw reads of `sc_scorecard_v1`/`smokecraftFlavorMemory` | migrate own state into `journey.passportStamp`; read scorecard/flavor data via `journey.scorecard`/`journey.flavorMemory` |
| SessionComplete.jsx | raw reads of `sc_journey_v1`/`sc_identity_v1` | replace manual `localStorage.getItem` calls with `useSmokeCraftJourney()` hook |
| LeafChallenge.jsx / LeafChallengeResult.jsx | `sessionStorage.leafChallengeResult` | out of core-spine scope (supporting module) — migrate onto journey context as a new `journey.leafChallenge` field if LeafChallenge is retained as a supporting module |

**New canonical journey fields required:** `wrapperStrength`, `origins`, `terroir`, `vitola`, `blend`, `flavorDNA` (Audit §8) — add empty default slots to `DEFAULT_STATE` before any of those screens gain real content, so the content-creation work in Phase 7 has somewhere real to persist to from day one.

**Backward compatibility:** `STATE_VERSION` bump from 2→3 with a real migration function (the current v1→v2 migration is a no-op relabel per Audit §8 — this plan requires the v2→v3 migration to actually carry forward any existing `sc_identity_v1`/`sc_scorecard_v1`/`sessionStorage` values into the new canonical fields on first load, so in-progress guest sessions are not silently reset).

**Offline/resume behavior:** canonical state already persists via `useEffect` on every change (existing pattern) — no new mechanism needed, just consistent application across the 8 remaining files.

**Duplicate XP/lost-data prevention:** already sound (`GuestSessionContext.jsx` completedSteps check — Audit §12); no change required, only continued use.

---

## 16. Live Interface Conversion Plan

Applies the Permanent Live Interface Directive to every screen in §11 (Redesign) and §12 (Create).

For each such screen, before implementation begins, explicitly separate:

| Layer | Examples for these screens |
|---|---|
| Static background artwork | Approved photography, decorative framing, permanent headings (unchanged, reused from existing SC_ASSETS where available) |
| Replaceable image zones | Cigar/pairing/mentor thumbnails inside Leaderboard entries, Rewards badge icons, EventChallenge photo |
| Live React controls | Every clickable selection, toggle, input — no full-card invisible hotspots (per the existing project-wide ban) |
| Live data | Rankings (Leaderboard), reward/claim status (Rewards), quiz question/answer state (S17/S19 if quizzed), score/XP/session counts |
| Persistent user state | All of the above written through `useSmokeCraftJourney()` per §15 |
| API/DB data | Only where a real backend exists (leaderboard shared ranking, staff request) — otherwise honest local/empty state, never fabricated |

No screen in this plan may bake user data, scores, XP, rankings, or selections into static image content — this repeats the audit's explicit static-vs-live boundary and is a **verification gate**, not a suggestion.

---

## 17. Dynamic Visual System Plan

- **Approved asset libraries**: the existing `SC_ASSETS` map (Audit §3) stays authoritative for background artwork. No new background photography is required for any Keep/Update screen.
- **Replaceable image zones**: define per screen in §16. For Rewards specifically, badge/achievement icons must come from a defined icon set (reuse `PremiumIcons.jsx`, already active per Audit §4c, rather than commissioning new art).
- **Cigar/flavor/pairing/mentor images**: already connected correctly in the 19 reusable screens (HumidorMatch, PairingLab, Mentor) — no rework needed there, only reuse of the same connection pattern in Leaderboard/Rewards where a cigar/mentor needs to be displayed.
- **Terroir/region/soil/factory/blender images**: needed only if Origins/Terroir/Vitola (§12, Create) are built with location-specific imagery — if no such approved photography exists yet, use neutral fallback graphics rather than placeholder photos, consistent with the Directive's "neutral fallback images" requirement.
- **Neutral fallback images**: required wherever a selection is optional and unmade (e.g., Rewards showing a locked-reward silhouette, Leaderboard showing a placeholder avatar for an unranked guest).
- **Visual-result-matches-data guarantee**: verification gate — every dynamic image slot must be tested against at least one "selected" and one "not yet selected" state (see Phase 12 verification).

---

## 18. Missing Screen Plan

Only one screen is a confirmed net-new build with no existing analog: **`/smokecraft/rewards`**. Required content per the mandate: earned rewards, locked rewards, unlock requirement, XP earned, badges earned, passport stamps earned, claim status, claimedAt, source session — all sourced from `journey` + `GuestSessionContext` XP ledger, no fabricated data.

All other "missing" items (AI Summary, Mentor Commentary, Knowledge Drop, Personal Notes) are **content additions to existing screens**, not new screens:
- AI Summary / Personalized Pairing Recommendations → extend PairingLab's existing real rule-based recommendation engine (Audit §14's confirmation that `buildRecommendation` is genuine logic, not static text) — see §21 AI Plan for the honesty boundary between rule-based and actual AI.
- Mentor Commentary → extend Mentor.jsx / relevant tasting screens with mentor-attributed tips, sourced from a real content table, not fabricated per-render text.
- Knowledge Drop → extend the 6 education screens being created/updated in Phase 7.
- Personal Notes → already exists as a pattern (FirstThird/SecondThird/FlavorMemory notes fields per the prior mandate) — extend the same textarea+persist pattern to any remaining screen missing it (GoldenBox, Connections).

No duplicate screens are created where an existing screen can be safely updated — this satisfies the mandate's explicit instruction.

---

## 19. Education and Quiz Plan

- **Missing content**: Origins, Terroir, Vitola, WrapperStrength (S6, in-spine), PairingMastery, FlavorDNA — all need real educational copy/media (Audit §10).
- **Knowledge checks**: only `LeafChallenge` currently has real scored questions (Audit §12). Extend the same pattern (question bank + scoring + persisted result) to WrapperStrength at minimum, since it's the one education gap inside the guarded main spine; the 5 supporting-module education screens may ship with read-only content first and gain quizzes in a later pass without blocking freeze.
- **Answer validation**: reuse `LeafChallenge`'s existing scoring logic as the reference implementation rather than inventing a second validation pattern.
- **Correct/incorrect feedback**: must be real, derived from the answer key — no static "Great job!" regardless of answer.
- **Quiz persistence**: quiz results write to `journey` (new fields, e.g. `journey.wrapperStrengthQuiz`), not a shadow key — enforced by §15.
- **Mentor commentary + voice/text fallback**: text-first (already the pattern across the app); voice is an enhancement, not required for freeze unless separately mandated.
- **Connect education to selected cigar/tasting stage**: where a guest has already selected a cigar (HumidorMatch/PairingLab), education content should reference that selection contextually rather than being fully generic — this is a P2 quality bar, not a P0 blocker.

---

## 20. AI Plan

- **Current state**: zero real AI integration exists (Audit §11). `Assistant.jsx` is a placeholder; PairingLab/HumidorMatch "recommendations" are rule-based formulas, explicitly confirmed as non-AI (Audit §14/§16 cross-reference).
- **AI inputs** (if built): selected cigar, selected pairing, tasting notes, scorecard ratings, mentor selection.
- **AI outputs** (if built): a natural-language summary/insight — must be visually and textually labeled as AI-generated, distinct from the existing rule-based recommendation panels.
- **Data-source labeling**: every AI output must carry a clear "AI-generated" or equivalent label; the existing rule-based PairingLab/HumidorMatch logic must NOT be relabeled as AI just to satisfy this requirement — that would be dishonest per the Directive's own "no fake AI responses" rule.
- **Failure/fallback behavior**: if the AI call fails or is unavailable, show an honest "Not available" state — never a fabricated response baked into static content.
- **Decision point required before Phase 8 begins**: build the Assistant as a real AI feature, or explicitly de-scope it and change `Assistant.jsx`'s route/label to something honest (e.g., a static FAQ) instead of a permanent "Coming Soon." This plan does not make that product decision — it flags it as a required approval gate (Phase 8 gate, §26).

---

## 21. XP, Rewards, Achievement, and Passport Plan

- **XP triggers**: continue using the existing `awardSessionRewards(sessionId)` per-session pattern (Audit §12 confirms idempotency already works) — extend it to the new Rewards page's earn events and to any new quiz completions from §19.
- **Duplicate-award prevention**: already implemented correctly via `completedSteps.includes(sessionId)` — no change, only continued use for new award sources.
- **Rewards**: define reward catalog (badges, passport stamps, unlockable content) sourced from real XP thresholds and completed-session data — no fabricated "3 rewards earned" unless 3 real award events occurred.
- **Achievement rules**: derive from `completedSteps`/`completedVisits` + quiz scores, not hardcoded per-guest text.
- **Claim behavior**: Rewards page claim action must reflect real claim state (`claimedAt` persisted to journey) — no "claimed" UI without a real state write succeeding.
- **Passport eligibility**: reuse existing `passportStampUnlocked` logic already present in `SmokeCraftProgressContext` (confirmed in the earlier session-progression diagnostic pass, not re-audited here but already known-real from prior work).
- **Leaderboard updates**: honest state only — real shared-backend data when available, or "Shared ranking unavailable" + the guest's own real local result, never invented competitors (mirrors the earlier session's diagnostic finding on this exact point).
- **Persistence**: all of the above through `journey.rewards`/`journey.achievements` (new canonical fields) rather than a new shadow key — enforced by §15's consolidation rule extending to any new state this phase introduces.

---

## 22. Supporting Module Plan

| Module | Entry route | Exit/return | Data in | Data out | Progress preserved | Error/offline |
|---|---|---|---|---|---|---|
| Pairing Lab | `/smokecraft/pairing-lab` (already in spine, S8) | Continue → S9 | selectedCigar (if any) | `journey.pairing` | Y (canonical) | N/A (local-only today) |
| Flavor Memory | `/smokecraft/flavor-memory` (spine, S14) | Continue → S15 | prior selections | `journey.flavorMemory` | Y | N/A |
| Mentor Library | `/smokecraft/mentor-selection` (spine, S4) | Continue → S5 | — | `journey.mentor` | Y | N/A |
| Humidor Match | `/smokecraft/humidor-match` (spine, S9) | Continue → S10 | `journey.pairing` | `journey.selectedCigar` | Y | N/A |
| Passport | `/smokecraft/passport-stamp` (spine, S21) | Continue → S22 | `journey.scorecard`, `journey.flavorMemory` (via canonical fields post-§15) | `journey.passportStamp` | Y | needs real claim error state (Audit §14 confirms `claimStatus` already models error/offline) |
| Leaderboard | `/smokecraft/leaderboard` (supporting) | Back → caller | guest XP/rank | none written | N/A (read-only) | required: "Shared ranking unavailable" honest state |
| Community/Connections | `/smokecraft/connections` (spine, S22) | Continue → S23 | — | `journey.connections` (post-migration) | Y | N/A |
| Event Challenge | `/smokecraft/event-challenge` (supporting) | Back → caller | — | TBD once redesigned | N/A today | needs definition during Phase 6 |
| Request Purchase | `/smokecraft/request-purchase` (spine, S10) | Continue → S11 | `journey.selectedCigar`, `journey.pairing` | `journey.requestPurchase` | Y | staff-request unavailable state already modeled per prior mandate |
| Management Sync | `/smokecraft/management-sync` (spine, S23) | Continue → S24 | — | `journey.managementSync`(if applicable) | Y | N/A |

Rewards (new) joins this table once built: entry from Rewards CTA (multiple screens per §14), exit Back to caller, data in = XP/completedSteps/journey.rewards, data out = claim state, progress preserved via journey, error state = "Reward unavailable" honest fallback.

---

## 23. Accessibility and Responsive Plan

Applies uniformly to every screen touched in Phases 4–7 (not a one-time pass — build it into each screen's implementation, not bolted on after):

- Viewports: 10", 12", 15" tablet, desktop, handheld where applicable — both portrait and landscape.
- Font sizing legible for ages 40–65 (the existing `clamp()`-based sizing pattern already used across reusable screens should be the baseline — reuse, don't reinvent).
- Touch targets sized for kiosk/tablet use (existing reusable screens already model this via percentage-based hit zones — reuse the pattern).
- Contrast: gold-on-dark theme already established; verify contrast ratios on any new screen against the same palette rather than introducing new colors.
- Keyboard navigation + visible focus states: the earlier persistence-gate mandate already established "no browser-default blue focus rectangle, thin gold border instead" — carry this rule into every new/redesigned screen.
- Screen-reader labels: `aria-label`/`aria-pressed` pattern already used throughout reusable screens (Audit §4a) — mandatory on every new control.
- Reduced motion: honor `prefers-reduced-motion` for any new animated element (Rewards claim animation, quiz feedback, etc.).

---

## 24. Screen-by-Screen Rebuild Table

Full 37-row table, extending Audit §16 with rebuild-specific columns. Session/route/asset/classification columns are carried from the audit; new columns added per this plan's requirements.

| ID | Screen | Session | Route | Final Route | Component | Asset | Audit Class | Rebuild Class | Journey/Module | Static Art Kept | Live Controls Req'd | New Images Req'd | Persistence Req'd | Education | Quiz | AI | XP Trigger | Reward Trigger | Back Dest | Continue Dest | Dependencies | Verify Test | Priority | Complexity |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| S1 | SmokeCraft (landing) | 1 | `/smokecraft` | same | SmokeCraft.jsx | landing | KEEP | Keep | Journey | Y | existing | N | journey | N | N | N | N | N | — | S2 | none | route smoke test | P1 | Small |
| S2a | Enroll | 2 | `/smokecraft/enroll` | same | Enroll.jsx | enroll | KEEP | Keep | Journey | Y | existing | N | journey | N | N | N | Y | N | S1 | S3 | none | existing suite | P1 | Small |
| S2b | Identity | 2(dup) | `/smokecraft/identity` | unguarded profile-edit or renumbered | Identity.jsx | identity | UPDATE | Update+Route fix | Journey | Y | existing | N | migrate off `sc_identity_v1` | N | N | N | N | N | S1 | S3 | §14 route fix, §15 persistence | new persistence test | P0 | Medium |
| S3 | GoldenBox | 3 | `/smokecraft/golden-box` | same | GoldenBox.jsx | goldenBox | UPDATE | Update | Journey | Y | existing | N | migrate off private LS_KEY | N | N | N | Y | N | S2 | S4 | §15 | persistence test | P0 | Small |
| — | GoldenBoxStatus | — | `/smokecraft/golden-box/status` | same | GoldenBoxStatus.jsx | goldenBox | REDESIGN | Update | Module | Y | add | N | journey | N | N | N | N | N | S3 | caller | Phase 4 | new UI test | P2 | Small |
| S4 | Mentor | 4 | `/smokecraft/mentor-selection` | same | Mentor.jsx | mentorSelection | KEEP | Keep | Journey | Y | existing | N | journey | N | N | N | Y | N | S3 | S5 | none | existing suite | P1 | Small |
| S5 | Format | 5 | `/smokecraft/format` | same | Format.jsx | format | KEEP | Keep | Journey | Y | existing | N | journey | N | N | N | Y | N | S4 | S6 | none | existing suite | P1 | Small |
| — | shape-size-burn alias | 5 | `/smokecraft/shape-size-burn` | Navigate→format | Format.jsx | format | dup | Route fix | Journey | — | — | N | — | N | N | N | N | N | — | — | §14 | route test | P1 | Small |
| S6 | WrapperStrength | 6 | `/smokecraft/wrapper-strength` | same | WrapperStrength.jsx | (none) | CREATE | Create | Journey | new | full | possible | new journey field | Y | Y (P1 target) | N | Y | N | S5 | S7 | §15 new field, §19 quiz pattern | new content+quiz test | P0 | Medium |
| S7 | SeedSoil | 7 | `/smokecraft/seed-soil` | same | SeedSoil.jsx | seedSoil | KEEP | Keep | Journey | Y | existing | N | journey | N | N | N | Y | N | S6 | S8 | none | existing suite | P1 | Small |
| S8 | PairingLab | 8 | `/smokecraft/pairing-lab` | same | PairingLab.jsx | pairingLab | KEEP | Keep | Journey | Y | existing | N | journey | N | N | N | Y | N | S7 | S9 | none | existing suite | P1 | Small |
| S9 | HumidorMatch | 9 | `/smokecraft/humidor-match` | same | HumidorMatch.jsx | humidorMatch | KEEP | Keep (+reused by S18) | Journey | Y | existing | N | journey | N | N | N | Y | N | S8 | S10 | none | existing suite | P1 | Medium |
| S10 | RequestPurchase | 10 | `/smokecraft/request-purchase` | same | RequestPurchase.jsx | requestPurchase | KEEP | Keep | Journey | Y | existing | N | journey | N | N | N | Y | N | S9 | S11 | none | existing suite | P1 | Small |
| S11 | CutToastLight | 11 | `/smokecraft/cut-toast-light` | same | CutToastLight.jsx | cutToastLight | KEEP | Keep | Journey | Y | existing | N | journey | N | N | N | Y | N | S10 | S12 | none | existing suite | P1 | Small |
| S12 | FirstThird | 12 | `/smokecraft/first-third` | same | FirstThird.jsx | firstThird | KEEP | Keep | Journey | Y | existing | N | journey | N | N | N | Y | N | S11 | S13 | none | existing suite | P1 | Small |
| S13 | SecondThird | 13 | `/smokecraft/second-third` | same | SecondThird.jsx | secondThird | KEEP | Keep | Journey | Y | existing | N | journey | N | N | N | Y | N | S12 | S14 | none | existing suite | P1 | Small |
| S14 | FlavorMemory | 14 | `/smokecraft/flavor-memory` | same | FlavorMemory.jsx | flavorMemory | UPDATE | Update | Journey | Y | existing | N | finish shadow-key migration | N | N | N | Y | N | S13 | S15 | §15 | persistence test | P0 | Small |
| S15 | FinalThird | 15 | `/smokecraft/final-third` | same | FinalThird.jsx | finalThird | UPDATE | Update | Journey | Y | existing | N | finish shadow-key migration | N | N | N | Y | N | S14 | S16 | §15 | persistence test | P0 | Small |
| S16 | Scorecard | 16 | `/smokecraft/scorecard` | same | Scorecard.jsx | scorecard | UPDATE | Update | Journey | Y | existing | N | finish shadow-key migration | N | N | N | Y | N | S15 | S17 | §15 | persistence test | P0 | Small |
| S17 | SmokeCraftChallenge | 17 | `/smokecraft/smokecraft-challenge` | same | SmokeCraftChallenge.jsx | smokecraftChallenge | REDESIGN | Redesign | Journey | Y | full | possible | journey | possible | possible | N | Y | possible | S16 | S18 | §6 content decision | new interaction test | P0 | Medium |
| S18 | SecondHumidorMatch | 18 | `/smokecraft/second-humidor-match` | same | HumidorMatch.jsx (merged) | secondHumidorMatch | MERGE | Merge | Journey | Y | reuse S9 | N | journey | N | N | N | Y | N | S17 | S19 | S9 component finalized first | reuse-component test | P1 | Medium |
| S19 | MiniTastingRound | 19 | `/smokecraft/mini-tasting` | same | MiniTastingRound.jsx | miniTasting | REDESIGN | Redesign | Journey | Y | full | possible | journey | possible | N | N | Y | possible | S18 | S20 | §6 content decision | new interaction test | P0 | Medium |
| S20 | FinalReview | 20 | `/smokecraft/final-review` | same | FinalReview.jsx | finalReview | KEEP | Keep | Journey | Y | existing | N | journey | N | N | N | Y | N | S19 | S21 | none | existing suite | P1 | Small |
| S21 | PassportStamp | 21 | `/smokecraft/passport-stamp` | same | PassportStamp.jsx | passportStamp | UPDATE | Update | Journey | Y | existing | N | finish shadow-key migration | N | N | N | Y | Y | S20 | S22 | §15 | persistence test | P0 | Medium |
| S22 | Connections | 22 | `/smokecraft/connections` | same | Connections.jsx | connections | UPDATE | Update | Journey | Y | existing | N | migrate off private LS_KEY | N | N | N | Y | N | S21 | S23 | §15 | persistence test | P0 | Small |
| S23 | ManagementSync | 23 | `/smokecraft/management-sync` | same | ManagementSync.jsx | managementSync | KEEP | Keep | Journey | Y | existing | N | journey | N | N | N | N | N | S22 | S24 | none | existing suite | P1 | Small |
| S24 | SessionComplete | 24 | `/smokecraft/session-complete` | same | SessionComplete.jsx | sessionComplete | UPDATE | Update | Journey | Y | existing | N | replace raw LS reads with hook | N | N | N | Y | Y | S23 | Passport/Leaderboard | §15 | persistence test | P0 | Small |
| M1 | Leaderboard | — | `/smokecraft/leaderboard` | same | Leaderboard.jsx | leaderboard | REDESIGN | Redesign | Module | Y | full | N | none (read-only) | N | N | N | N | N | caller | caller | §21 leaderboard honesty rule | scroll+data test | P1 | Medium |
| M2 | HowItWorks | — | `/smokecraft/how-it-works` | same | HowItWorks.jsx | howItWorks | REDESIGN/KEEP | decide | Module | Y | maybe none | N | none | possible | N | N | N | N | caller | caller | product decision | none required if static-informational | P3 | Small |
| M3 | EventChallenge | — | `/smokecraft/event-challenge` | same | EventChallenge.jsx | eventChallenge | REDESIGN | Redesign | Module | Y | full | possible | journey (new field) | possible | possible | N | Y | possible | caller | caller | §6 content decision | new interaction test | P2 | Medium |
| M4 | Origins | — | `/smokecraft/origins` | same | Origins.jsx | (unref'd) | CREATE | Create | Module | Y | full | possible | journey (new field) | Y | possible | N | Y | N | caller | caller | §19 content | content test | P2 | Small |
| M5 | Terroir | — | `/smokecraft/terroir` | same | Terroir.jsx | (unref'd) | CREATE | Create | Module | Y | full | possible | journey (new field) | Y | possible | N | Y | N | caller | caller | §19 content | content test | P2 | Small |
| M6 | Vitola | — | `/smokecraft/vitola` | same | Vitola.jsx | (unref'd) | CREATE | Create | Module | Y | full | possible | journey (new field) | Y | possible | N | Y | N | caller | caller | §19 content | content test | P2 | Small |
| M7 | PairingMastery | — | `/smokecraft/pairing-mastery` | same | PairingMastery.jsx | (unref'd) | CREATE | Create | Module | Y | full | possible | journey (new field) | Y | possible | N | Y | N | caller | caller | §19 content | content test | P2 | Small |
| M8 | FlavorDNA | — | `/smokecraft/flavor-dna` | same | FlavorDNA.jsx | (unref'd) | CREATE | Create | Module | Y | full | possible | journey (new field) | Y | possible | N | Y | N | caller | caller | §19 content | content test | P2 | Small |
| M9 | Assistant | — | `/smokecraft/assistant` | same or repurposed | Assistant.jsx | (none) | CREATE/DECIDE | Create or honest de-scope | Module | Y | TBD by decision gate | N | journey (if built) | N | N | Y (if built) | N | N | caller | caller | §20 approval gate | AI honesty test or de-scope confirmation | P2 | Large (if AI) / Small (if de-scoped) |
| M10 | Rewards (new) | — | none | `/smokecraft/rewards` | new file | new/reused icons | CREATE | Create | Module | N (new) | full | possible (icons) | journey (new field) | N | N | N | N | Y | caller | caller | §21, all XP sources | rewards routing+data test | P0 | Medium |
| M11 | Scan | — | `/smokecraft/scan` | same | Scan.jsx | (existing) | UPDATE | Update | Module | Y | replace hotspot | N | none | N | N | N | N | N | caller | Enroll | none | control test | P2 | Small |
| M12 | GuestPass | — | `/smokecraft/guest-pass` | same | GuestPass.jsx | (existing) | UPDATE | Update | Module | Y | replace hotspot | N | none | N | N | N | N | N | caller | Enroll | none | control test | P2 | Small |
| DEL1 | Format.legacy.jsx | — | none | removed | — | — | dead code | Archive | — | — | — | — | — | — | — | — | — | — | — | zero-ref re-check | build passes without it | P3 | Small |
| DEL2 | 12 orphaned components | — | none | removed | — | — | dead code | Archive | — | — | — | — | — | — | — | — | — | — | — | zero-ref re-check | build passes without them | P3 | Small |
| DEL3 | ~100+ orphaned images | — | none | archived/removed | — | — | dead assets | Archive | — | — | — | — | — | — | — | — | — | — | — | all rebuild decisions locked first | build/asset-verify scripts pass | P3 | Medium |

---

## 25. Dependency Map

```
Persistence consolidation (§15)
        │
        ├──> Route corrections (§14)   [independent of persistence, but both must land before...]
        │
        ▼
Screen redesign/creation (§16, Phases 4-7)
        │
        ├──> Dynamic visual system (§17)   [runs alongside screen work]
        │
        ▼
XP / Rewards / Achievements activated (§21)
        │
        ├──> requires Persistence (§15) AND Rewards screen built (§18/§12)
        │
        ▼
AI connected (§20)                     [gated on product decision — may run in parallel with XP/Rewards, not dependent on it]
        │
        ▼
Supporting modules connected (§22)     [depends on the specific module's screen being built/updated first]
        │
        ▼
Accessibility/Responsive pass (§23)    [applies incrementally per screen, but a final full-app pass happens here]
        │
        ▼
End-to-end testing (Phase 12)
        │
        ▼
Freeze (Phase 13)
```

**Must happen before routes are changed:** nothing — route corrections in §14 are low-risk and can start immediately, in parallel with persistence work, since they touch different files.

**Must happen before persistence is migrated:** nothing blocking — this is the safe starting point (Audit §17's own conclusion, retained here).

**Must happen before screens are redesigned:** persistence consolidation for any screen being redesigned that currently reads a shadow key (Scorecard, PassportStamp, SessionComplete) — redesigning against data about to be deleted would cause rework.

**Must happen before AI is connected:** the Phase 8 approval gate (§20 decision point) — build vs. honest de-scope — must be resolved by a human decision-maker, not inferred.

**Must happen before XP and rewards are activated:** Rewards screen must exist (§12/§18) and persistence must be consolidated (§15), since reward state needs a stable, canonical home.

**Must happen before supporting modules are connected:** each module's own screen work (§11/§12) must be complete before its entry in the Supporting Module Plan (§22) table can be verified end-to-end.

**Must happen before end-to-end testing:** all of Phases 2–11 substantially complete — E2E testing is deliberately last so it isn't re-run after every incremental screen fix.

**Must happen before SmokeCraft is frozen:** all Phase 12 verification gates pass (§27) with zero P0 findings outstanding.

**May run in parallel:**
- Route corrections (§14) and persistence consolidation (§15) — different files, no shared dependency.
- Education content creation (§19) and Rewards screen build (§18) — independent screens.
- Accessibility considerations (§23) — should be built into each screen as it's touched, not deferred as a single blocking phase, though a final full-app pass still happens at the end.

---

## 26. Implementation Packages

Packages are intentionally small — each is independently verifiable and revertible without touching the others.

### Package A — Persistence Consolidation
- **Objective:** eliminate all remaining shadow storage keys (§15).
- **Included screens:** Connections, GoldenBox, Identity, Scorecard, FinalThird, FlavorMemory, PassportStamp, SessionComplete.
- **Included files:** the 8 page files above + `SmokeCraftJourneyContext.jsx` (new fields + STATE_VERSION 2→3 migration).
- **Dependencies:** none — first package.
- **Files that must not be touched:** any file outside the 8 pages + context file; no route changes in this package.
- **Required tests:** new/extended `verify-smokecraft-functional-recovery.mjs`-style suite covering all 8 screens' save→reload persistence.
- **Required proof:** localStorage inspection showing zero shadow keys remain after a full guest journey.
- **Rollback point:** revert this package's commit; no other package depends on partial completion.
- **Completion gate:** `git status` shows only the 9 expected files changed; all 8 persistence tests pass; `npm run build` green.
- **Exact deliverable:** one commit, `fix(smokecraft): consolidate remaining shadow persistence keys into canonical journey state`.

### Package B — Route Corrections
- **Objective:** fix the 3 route-correctness bugs (§14).
- **Included files:** `App.jsx` only.
- **Dependencies:** none (can run parallel to Package A).
- **Files that must not be touched:** all page/component files.
- **Required tests:** route-table smoke test (each affected path resolves to the intended target).
- **Required proof:** before/after route table diff matching §14 exactly.
- **Rollback point:** revert this package's commit independently.
- **Completion gate:** no route regressions in existing `verify-interactions.mjs`/`final-acceptance.mjs`.
- **Exact deliverable:** one commit, `fix(smokecraft): correct duplicate guards and dead-end legacy route aliases`.

### Package C — Rewards Screen
- **Objective:** build `/smokecraft/rewards` and repoint all Rewards CTAs (§12, §14, §18).
- **Included screens:** new Rewards page; CTA edits in PairingLab.jsx, SmokeCraftChallenge.jsx, SmokeCraft.jsx.
- **Dependencies:** Package A (needs canonical journey fields for reward/claim state).
- **Files that must not be touched:** any screen not listed above.
- **Required tests:** Rewards routing test (never lands on humidor-match), Rewards data-honesty test (no fabricated claim success).
- **Required proof:** screenshot of Rewards page with real earned/locked state from a test guest session.
- **Rollback point:** independent commit; removing it reverts CTAs to their prior (broken) target, not to a worse state.
- **Completion gate:** all 3 CTA sites verified pointing at `/smokecraft/rewards`; new route registered; build green.
- **Exact deliverable:** one commit, `feat(smokecraft): add Rewards screen and correct Rewards routing`.

### Package D — In-Spine Stub Redesign (S17, S18, S19)
- **Objective:** convert SmokeCraftChallenge, SecondHumidorMatch, MiniTastingRound from static stubs into real interactive content (§9, §11).
- **Included screens:** the 3 above.
- **Dependencies:** Package A (persistence must be stable first); S18 additionally depends on S9 (HumidorMatch) remaining unchanged, which it already is (Keep).
- **Files that must not be touched:** the other 21 spine screens.
- **Required tests:** new interaction tests for each of the 3 screens (real controls, aria-pressed, persistence, reload).
- **Required proof:** screenshots showing real controls, not single-button stubs.
- **Rollback point:** independent per-screen commits if desired, or one combined commit — revertible without affecting Packages A/B/C.
- **Completion gate:** zero single-full-card-hotspot patterns remain in these 3 files; build green; new tests pass.
- **Exact deliverable:** one commit, `feat(smokecraft): convert Session 17/18/19 stub screens into live interfaces`.

### Package E — Education Content (Origins, Terroir, Vitola, PairingMastery, FlavorDNA, WrapperStrength)
- **Objective:** replace `ComingSoon`/null-render stubs with real content (§19).
- **Included screens:** the 6 above.
- **Dependencies:** Package A (new journey fields must exist for any screen that persists a quiz/interaction result).
- **Files that must not be touched:** journey-spine screens not in this list.
- **Required tests:** content-presence test per screen; quiz test for WrapperStrength if a quiz is included in this pass.
- **Required proof:** screenshots of each screen showing real content, not placeholder text.
- **Rollback point:** independent commit.
- **Completion gate:** no `ComingSoon` wrapper remains on any of these 6; WrapperStrength no longer renders null; build green.
- **Exact deliverable:** one commit, `feat(smokecraft): build real educational content for Origins, Terroir, Vitola, PairingMastery, FlavorDNA, and Wrapper/Strength`.

### Package F — Leaderboard, EventChallenge, Scan/GuestPass, Cleanup
- **Objective:** finish remaining redesigns/updates + archive dead code and orphaned assets (§11, §13, Phase 9/10).
- **Included screens:** Leaderboard, EventChallenge, Scan, GuestPass.
- **Included files:** + `Format.legacy.jsx` and 12 orphaned components (delete after re-confirming zero references), + orphaned image cleanup across the 4 asset directories.
- **Dependencies:** all prior packages (this is deliberately last, per the audit's own §17 ordering, so nothing scheduled for reuse elsewhere is deleted prematurely).
- **Files that must not be touched:** anything still referenced — re-verify with a fresh grep pass immediately before deletion, not from memory.
- **Required tests:** existing `verify-all-smokecraft-assets.mjs` must still pass after cleanup; build green with zero missing-import errors.
- **Required proof:** final `git diff --stat` showing only intended deletions; before/after file-count in each asset directory.
- **Rollback point:** independent commit; asset deletions should be a separate commit from the Leaderboard/EventChallenge/Scan/GuestPass code changes within this package, for a cleaner revert path if the cleanup over-reaches.
- **Completion gate:** zero broken references anywhere in the app after cleanup.
- **Exact deliverable:** two commits — `feat(smokecraft): redesign Leaderboard, EventChallenge, and fix Scan/GuestPass hotspots` and `chore(smokecraft): archive dead code and orphaned assets after final reference check`.

### Package G — AI Decision & Implementation (conditional)
- **Objective:** execute whatever decision is made at the Phase 8 gate (§20).
- **Included screens:** Assistant.jsx, and any screen gaining an "AI-generated" label.
- **Dependencies:** explicit human approval of the build-vs-de-scope decision; Package A for persistence if built.
- **Files that must not be touched:** the rule-based PairingLab/HumidorMatch recommendation logic must not be relabeled as AI.
- **Required tests:** AI-honesty test (labels present, fallback state works) or de-scope confirmation test (route no longer claims "Coming Soon" indefinitely).
- **Required proof:** screenshot of either the real AI feature with fallback state demonstrated, or the de-scoped honest replacement.
- **Rollback point:** independent commit.
- **Completion gate:** decision executed and verified either way.
- **Exact deliverable:** one commit, message dependent on the decision taken.

### Package H — XP/Rewards/Achievements Activation & Accessibility Pass
- **Objective:** wire new award sources into the existing idempotent XP system (§21), and run the final full-app accessibility/responsive pass (§23).
- **Included screens:** all screens touched in Packages C–G, re-checked for accessibility.
- **Dependencies:** Packages A–G substantially complete.
- **Files that must not be touched:** none excluded — this is a cross-cutting pass, but changes should be additive (aria-labels, focus styles) not structural.
- **Required tests:** accessibility test matrix across the 4 required viewports.
- **Required proof:** screenshots at 1440×900, 1024×768, 768×1024, 390×844 for every screen touched in this plan.
- **Rollback point:** independent commit per screen group if issues found.
- **Completion gate:** zero browser-default focus rectangles, zero contrast failures, all touch targets meet minimum size.
- **Exact deliverable:** one commit, `fix(smokecraft): final accessibility and responsive verification pass`.

---

## 27. Verification Gates

Run after **every** package above, not just at the end:

1. `npm run build` — must be green.
2. Package-specific new test script — must pass 100%.
3. Full existing regression suite (`verify-interactions.mjs`, `verify-all-smokecraft-assets.mjs`, `final-acceptance.mjs`, and any package-specific script created in Packages A/D/E) — must not regress below its pre-package pass count.
4. `git status`/`git diff --stat` — confirm only the package's declared files changed.
5. Manual screenshot review at the 4 required viewports for any screen with a UI change in that package.
6. Diff Guard re-check: confirm no NOVEE backend, POS360, E.A.T., or approved-image file was touched (carried forward from every prior mandate's standing constraint).

---

## 28. Rollback Strategy

- Every package is its own commit (or tightly-scoped commit pair, per Package F). A bad package is reverted with a single `git revert` without touching unrelated work, because packages are ordered to avoid file overlap wherever possible.
- Persistence migration (Package A) includes a STATE_VERSION bump specifically so that if a later package needs to roll back, in-progress guest sessions on the new version are not corrupted by a partial downgrade — the migration function should be forward-only and idempotent, never destructive to unrecognized-but-present fields.
- Asset deletion (Package F) is deliberately the last and most reversible-in-spirit package — nothing else in this plan depends on the deleted files still existing, by construction of the dependency map (§25).
- No package should ever be force-pushed or squashed in a way that hides its individual verification trail — the packages exist specifically so each can be independently audited later.

---

## 29. Final Production Freeze Criteria

SmokeCraft may be declared complete and frozen only when **all** of the following hold simultaneously:

1. All 8 packages (A–H) are merged and their individual completion gates passed.
2. Zero static-only production screens remain among the 24 main-journey + 13 supporting-module screens (HowItWorks may remain intentionally static only if that is an explicit product decision, documented at the time — not a default).
3. Zero fake/baked live data remains anywhere (no hardcoded scores, XP, rankings, rewards, cigar/pairing details).
4. Zero duplicate or conflicting journey-count references remain in code, docs, or UI copy — everything says "24 sessions / 8 visits" consistently.
5. Every one of the 24 main-journey screens maps 1:1 to a locked session number with no double-guarded sessions remaining.
6. Every supporting module's entry/exit/return behavior (§22) is verified working, including honest error/offline states.
7. All required data persists exclusively through `sc_journey_v1` — zero shadow keys remain anywhere in `src/pages/smokecraft`.
8. Full end-to-end journey test (S1→S24, plus each supporting module reachable and returning correctly) passes with proof screenshots at all 4 required viewports.
9. The AI decision gate (§20) has been explicitly resolved, one way or the other — no indefinite "Coming Soon" placeholder remains without a documented decision.

---

## 30. Exact Recommended Execution Order

This is the practical order in which implementation prompts should be issued — not a repeat of the phase headings.

1. **Package A — Persistence Consolidation.**
   *Changed:* 8 page files + journey context (new fields, STATE_VERSION bump). *Preserved:* all 19 already-working screens' UI and routes, untouched. *Test:* new persistence suite, full existing regression suite. *Approve before continuing:* zero shadow keys remain; build green.

2. **Package B — Route Corrections.**
   *Changed:* `App.jsx` only (3 fixes). *Preserved:* every currently-working route continues to work; only the 3 identified bugs change behavior. *Test:* route-table smoke test + full existing regression suite. *Approve before continuing:* route table matches §14 exactly; no regressions.

3. **Package C — Rewards Screen.**
   *Changed:* new Rewards page + 3 CTA edits. *Preserved:* everything else. *Test:* Rewards routing + data-honesty test. *Approve before continuing:* Rewards page shows real data for a test guest; no CTA still points at humidor-match.

4. **Package D — In-Spine Stub Redesign (S17/S18/S19).**
   *Changed:* 3 screens converted from stub to live interface. *Preserved:* HumidorMatch (S9) component reused, not forked, for S18. *Test:* new interaction tests for all 3. *Approve before continuing:* zero single-hotspot stub patterns remain in the guarded spine.

5. **Package E — Education Content.**
   *Changed:* 6 screens gain real content (5 supporting-module + WrapperStrength in-spine). *Preserved:* everything outside these 6. *Test:* content-presence + WrapperStrength quiz test. *Approve before continuing:* no `ComingSoon`/null-render remains among these 6; WrapperStrength (S6) has real content since it blocks the main spine.

6. **Package F — Leaderboard/EventChallenge/Scan/GuestPass + Dead-Code & Asset Cleanup.**
   *Changed:* 4 screens redesigned/updated; `Format.legacy.jsx`, 12 orphaned components, and confirmed-orphaned images archived. *Preserved:* every file still referenced anywhere, re-verified immediately before deletion. *Test:* full asset-verification script + build. *Approve before continuing:* `git diff --stat` shows only intended deletions; zero broken references.

7. **Package G — AI Decision & Implementation.**
   *Changed:* Assistant.jsx and any newly AI-labeled output, per whichever decision is approved. *Preserved:* the existing rule-based PairingLab/HumidorMatch recommendation logic, explicitly not relabeled as AI. *Test:* AI-honesty test or de-scope confirmation. *Approve before continuing:* the Phase 8 decision gate is closed one way or the other — this step cannot proceed without that approval.

8. **Package H — XP/Rewards/Achievements Activation + Final Accessibility/Responsive Pass.**
   *Changed:* award-source wiring for all new screens from Packages C–G; accessibility/focus/contrast fixes across all touched screens. *Preserved:* the already-sound duplicate-XP-prevention mechanism, reused rather than reimplemented. *Test:* full accessibility matrix at all 4 required viewports. *Approve before continuing:* zero accessibility gate failures.

9. **Phase 12 — Full Production Verification.**
   *Changed:* nothing (verification-only pass). *Preserved:* everything. *Test:* the complete end-to-end journey test (S1→S24 + all supporting modules) with proof screenshots at all 4 viewports. *Approve before continuing:* all §27 verification gates pass with zero P0 findings outstanding.

10. **Phase 13 — Freeze.**
    *Changed:* nothing (declaration only). *Preserved:* everything. *Test:* re-confirmation of all 9 Freeze Criteria in §29. *Approve:* final sign-off that SmokeCraft is frozen against unapproved visual or sequence changes.

---

## Planning Methodology Note

This plan was produced by reading `docs/SMOKECRAFT_360_MASTER_AUDIT.md` in full and mapping every audit finding to a specific plan section, package, or table row — no new repository scanning was performed, and no application file was read for the purpose of altering it. All screen/route/persistence facts are inherited directly from the audit; where the audit flagged something as unconfirmed (e.g., Leaderboard's scroll-trap location, whether 3 additional sessions were ever specified anywhere), this plan states that uncertainty explicitly rather than resolving it by assumption.
