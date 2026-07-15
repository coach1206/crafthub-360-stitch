# SmokeCraft 360 — Master Journey, Live Interface, Asset, Route, Data & Rebuild Audit

**Status:** Read-only audit. No application files were modified to produce this report.
**Repo:** coach1206/crafthub-360-stitch
**Branch:** recovery/smokecraft-codex-final
**HEAD at audit time:** `4f993baf5c393467a1a2c533696648b0921cc8bb`

> **Pre-existing commit notice:** `4f993baf` ("fix(smokecraft): complete canonical persistence and interaction proof") was committed and pushed to this branch **before** this master audit began, as the completion of a separate, earlier mandate. It is not part of this audit's scope, output, or verification, and was not modified, reverted, or merged during this audit.

This document is a full-repository inventory. It reports what exists today, what's broken, what's duplicated, and what a safe rebuild would require. It does not recommend fixing anything — that is a separate, later decision.

---

## 1. Scope note on "27-session Master Journey"

The mandate references a locked 27-session Master Journey. The actual coded journey map (`src/constants/session.js`, re-exported via `src/constants/smokecraftJourney.js`) defines **24 sessions across 8 visits**, not 27. This audit reports against the 24-session map as it exists in code today; the discrepancy between the requested "27-session" framing and the coded "24-session" reality is itself a finding (see §7).

**Coded Visit/Session structure:**

| Visit | Sessions |
|---|---|
| 1 | S1 entry (`/smokecraft`), S2 enroll, S3 golden-box, S4 mentor-selection |
| 2 | S5 format, S6 wrapper-strength |
| 3 | S7 seed-soil, S8 pairing-lab |
| 4 | S9 humidor-match, S10 request-purchase, S11 cut-toast-light, S12 first-third |
| 5 | S13 second-third, S14 flavor-memory |
| 6 | S15 final-third, S16 scorecard |
| 7 | S17 smokecraft-challenge, S18 second-humidor-match, S19 mini-tasting |
| 8 | S20 final-review, S21 passport-stamp, S22 connections, S23 management-sync, S24 session-complete |

Gating logic (`isSessionUnlocked`, `isVisitUnlocked`): strictly linear. Visit 1 is always unlocked; visit N unlocks only once every session in visit N−1 is in `completedSteps`. Within a visit, session N unlocks only once every session before it (by global order) is complete.

All 24 sessions have a matching guarded route in `App.jsx`. No missing pages for the numbered spine.

---

## 2. Route table

**Core guarded journey routes** (`<Route path="smokecraft">` block, App.jsx lines ~306–441):

| Path | Element | Guard | Notes |
|---|---|---|---|
| index | SmokeCraft | S1 | |
| enroll | Enroll | S2 | |
| identity | Identity | **S2** | **Duplicate session number** — same guard as `enroll` (see §7) |
| golden-box | GoldenBox | S3 | |
| golden-box/status | GoldenBoxStatus | none | unguarded sub-page |
| mentor-selection | Mentor | S4 | |
| format | Format | S5 | |
| shape-size-burn | Format | S5 | duplicate alias — same element as `format` |
| cigar-gauge-guide | CigarGaugeGuide | S5 | |
| wrapper-strength | WrapperStrength | S6 | render-null redirect stub |
| seed-soil | SeedSoil | S7 | |
| pairing-lab | PairingLab | S8 | |
| humidor-match | HumidorMatch | S9 | |
| request-purchase | RequestPurchase | S10 | |
| cut-toast-light | CutToastLight | S11 | |
| first-third | FirstThird | S12 | |
| second-third | SecondThird | S13 | |
| flavor-memory | FlavorMemory | S14 | |
| final-third | FinalThird | S15 | |
| scorecard | Scorecard | S16 | |
| smokecraft-challenge | SmokeCraftChallenge | S17 | static-only stub |
| second-humidor-match | SecondHumidorMatch | S18 | static-only stub, near-dup of HumidorMatch |
| mini-tasting | MiniTastingRound | S19 | static-only stub |
| final-review | FinalReview | S20 | |
| passport-stamp | PassportStamp | S21 | |
| connections | Connections | S22 | |
| management-sync | ManagementSync | S23 | |
| session-complete | SessionComplete | S24 | |

**Alias/redirect routes:** `intake→enroll`, `entry→/smokecraft`, `profile→identity`, `education→format`, `mentors→mentor-selection`, `humidor→humidor-match`, `light→cut-toast-light`, `complete→session-complete`, `gold-box→golden-box`, `mentor→mentor-selection`, `challenge→smokecraft-challenge`, `mini-tasting-round→mini-tasting`, `session/start→enroll`, `passport→/passport`. All are 1:1, non-conflicting redirects.

**Unguarded supplemental routes** (no session number, outside the numbered spine): `art`, `origins`, `curation`, `leaves`, `leaf-challenge` (+2 sub-routes), `cultivation`, `blend`, `flavor-dna`, `pairing`, `available`, `assistant`, `terroir`, `pairing-mastery`, `vitola`, `leaderboard`, `event-challenge`, `how-it-works`, `demo-reset`, `guest-pass`, `demo`, `scan`, `menu`, `venue-commerce`/`order`/`ticket-tapper/staff-specials`, `cart`, `checkout`, `payment-success`, `order-status`, `visit-complete`.

**Legacy dead-end aliases:** `smokecraft/session-1` through `session-4` all `Navigate` to `/smokecraft` (index) regardless of which session number is in the URL — a lossy redirect that discards the intended target.

**Routes outside the smokecraft block that reference SmokeCraft:**

| Path | Purpose |
|---|---|
| `smokecraft-visual-proof` | Standalone QA/visual-proof page, no auth |
| `smokecraft-image-diagnostic` | Diagnostic tool, no auth |
| `smokecraft/venue-pilot-package` | Staff-facing pilot package, explicitly not part of guest journey |
| `pos3/smokecraft-checkout` | POS-side checkout (staff-protected) |
| `eat/smokecraft-panel` | Venue ops panel (protected) |
| `smokecraft/error-log` | Admin/founder-protected, demo-blocked |
| `smokecraft/feature-flag-admin` | Admin/founder-protected, demo-blocked |
| `passport/ceremony`, `passport/leaderboard` | Cross-module redirects into passport-stamp / leaderboard |

**Duplicate functional route (not a redirect):** `order` and `ticket-tapper/staff-specials` both render `SmokeCraftVenueCommerce` directly.

---

## 3. Asset inventory

`src/constants/smokecraftAssets.js` defines 27 `SC_ASSETS` keys. **All 27 resolve to existing files — zero broken references.**

| Key | Used by | Notes |
|---|---|---|
| landing, enroll, identity, goldenBox, mentorSelection, format, seedSoil, pairingLab, humidorMatch, requestPurchase, cutToastLight, firstThird, secondThird, flavorMemory, finalThird, scorecard, smokecraftChallenge, secondHumidorMatch, miniTasting, finalReview, passportStamp, connections, managementSync(+alias), sessionComplete(+alias), leaderboard, eventChallenge, howItWorks, visitComplete | one per journey/supplemental screen | all present |
| wrapperStrength | *(no image — redirect-only step)* | intentional, S6 has no visual |

**Orphaned assets on disk (not referenced by any SC_ASSETS key) — substantial surplus:**
- `public/assets/smokecraft/` (RAW): ~50 files, only ~15 referenced. ~35 orphaned, including near-duplicate/misfiled variants (`CUT, TOAST,& LIGHT22.png`, `SEED & PARING.png`, `humidor match 111.png`, `mentor-selection.png`, `golden-box.png`, `request-purchase.png` / `request or purchange cigar.png`, `smokecraft comple 1.png`, `smokecraft-scorecard.png`).
- `public/assets/smokecraft/cropped/`: 30+ files, only 2 referenced (`discover-profile-bg.jpg`, `connections-hero.jpg`). Several `-v2` suffix pairs indicate abandoned iteration (`golden-box-hero.jpg` vs `-v2`, `humidor-match-bg.jpg` vs `-v2`, `format-master-tip.jpg` vs `-v2`, `scorecard-bg.jpg` vs `-v2`).
- `public/assets/smokecraft-reference/approved/`: 30+ top-level files + a `batch-22/` subfolder (~45 files) of staging candidates. Only 6 REF paths are actually referenced.
- `public/*.png` root-level: multiple legacy files not referenced by SC_ASSETS at all (`smokecraft-origins.png`, `smokecraft-hero.png`, `smokecraft-terroir.png`, `smokecraft-wrapper-strength.png`, lock-state images, etc.). Only `smokecraft-visit-complete.png` is used.
- Byte-identical copies of the same image exist across 3+ directories (RAW / reference-approved / batch-22), indicating repeated, incomplete asset-repair passes (confirmed by the presence of prior audit docs: `SMOKECRAFT_PHASE_1_APPROVED_UNUSED_IMAGE_REPAIR.md`, `SMOKECRAFT_BATCH_3_PUBLIC_IMAGE_MATCH_REPORT.md`, and multiple `verify-*-assets.mjs` scripts already in the repo root).

**Dimensions observed:** two natural sizes recur across pages — 1672×941 (Mentor, HumidorMatch, PairingLab, SecondThird) and 1448×1086 (PassportStamp, FlavorMemory, FinalReview, SessionComplete). Other pages' NAT_W/NAT_H were not directly confirmed in this pass.

---

## 4. Pages and components catalog

### 4a. Core 24-session journey pages — interactive, use canonical journey context

FirstThird, SecondThird, FinalThird, HumidorMatch, CutToastLight, FlavorMemory, Format, Mentor, PairingLab, RequestPurchase, Scorecard, SeedSoil, Connections, ManagementSync, PassportStamp, FinalReview, SessionComplete, Identity, GoldenBox — all render real `SmokeCraftImageBoundsOverlay` + `aria-pressed` controls (or equivalent form fields) and read/write journey state (mostly). 19 pages.

### 4b. Static-only interface failures (§8 detail)

| Page | Session | Failure |
|---|---|---|
| SecondHumidorMatch.jsx | S18 | Static image + single full-width Continue button only. No real controls. Near-duplicate stub of HumidorMatch. |
| MiniTastingRound.jsx | S19 | Static image + single Continue button only. |
| SmokeCraftChallenge.jsx | S17 | Static image + single Continue button only. |
| Leaderboard.jsx | unguarded | Static background image, only a Back button. No live ranking data (17 lines total). |
| HowItWorks.jsx | unguarded | Static image, single "Get Started" button. |
| EventChallenge.jsx | unguarded | Static image, only a Back button. |
| FlavorDNA.jsx, Origins.jsx, GoldenBoxStatus.jsx | unguarded | Pure image-only `SmokeCraftAssetScreen`, zero controls. |
| Terroir.jsx, PairingMastery.jsx, Vitola.jsx | unguarded | Thin wrappers around a generic `ComingSoon` placeholder. |
| Scan.jsx, GuestPass.jsx | unguarded | Static image with a single full-card invisible hotspot to Enroll. |
| WrapperStrength.jsx | S6 | Renders null — pure redirect stub, no UI at all. |
| Assistant.jsx | unguarded | `ComingSoon` placeholder — no AI feature (see §13). |

**Total static-only/non-functional screens: 17** (3 of which — S17, S18, S19 — sit inside the guarded numbered spine).

### 4c. Components (`src/components/smokecraft/`)

Active/used: SmokeCraftImageBoundsOverlay, SmokeCraftImageBounds, SmokeCraftHotspotLayer, SmokeCraftAssetScreen, SmokeCraftAssetRoute, SmokeCraftNavBar, SmokeCraftProgressHeader, SmokeCraftSessionGuard, VisitLockGuard, LockedSmokeCraftScreen, SmokeCraftAppShell, SmokeCraftDemoReset, SmokeCraftHandoffTrigger, SmokeCraftPremium, SmokeCraftInsightChip, SmokeCraftInsightPanel, CigarIntelligencePanel, WinnerCategoryCard, PremiumIcons, StaffSpecialsControlPanel, TicketTapperSpecialsStrip.

**Orphaned components (zero references outside their own file) — 12 total:**
DemoModeBanner, PairingScorePanel, SmokeBackendReadinessPanel, SmokeCraftMenuButton, SmokeCraftPassportUploadCard, SmokeCraftReferenceCanvas, SmokeCraftSelectableCard, SmokeCraftVisualPanel, AdvancedScorecardPanel, UniqueBlendPanel, VenueHeroRotator, WinnerCriteriaPanel.

### 4d. Legacy dead code

`Format.legacy.jsx` (1,571 lines) — an old pre-refactor version of Format.jsx, fully superseded, apparently kept only for reference. Not imported/routed anywhere live.

---

## 5. Duplicate, obsolete, unused, wrong-route findings

1. **`identity` and `enroll` both guarded as Session 2** (App.jsx) — two distinct pages satisfy the same gate; ambiguous which one "counts" as S2 completion.
2. **`shape-size-burn` and `format`** render the identical `Format` element under the same guard — redundant route.
3. **`smokecraft/session-1..session-4`** legacy aliases all collapse to `/smokecraft` regardless of the number in the URL — lossy, misleading redirect.
4. **HumidorMatch vs SecondHumidorMatch** — the second is a regressed/unfinished stub of the first, not a legitimate distinct design.
5. **MiniTastingRound / SmokeCraftChallenge / SecondHumidorMatch** — three near-identical boilerplate stub screens (static image + one Continue button + `awardSessionRewards` call), candidates for consolidation into one reusable pattern.
6. **`order` and `ticket-tapper/staff-specials`** both render `SmokeCraftVenueCommerce` directly — functional duplication.
7. **12 orphaned components**, **1,571-line legacy file**, **~35 orphaned RAW images**, **~28 orphaned cropped images**, **most of `batch-22/`'s ~45 staging images**, and **most root-level `public/*.png` SmokeCraft files** are unused and safe to remove or archive after confirming no dynamic/string-built path references them.
8. **Byte-identical images duplicated across 3+ asset directories** — same file physically stored under RAW, reference/approved, and batch-22 paths, left over from iterative repair passes documented in prior audit `.md` files at repo root.

---

## 6. Static-only interface failures

See §4b — 17 pages total render no functional controls: single-hotspot Continue buttons, image-only screens, or `ComingSoon` stubs. 3 of these (S17, S18, S19) are inside the guarded numbered journey and block genuine progression content from three full sessions.

---

## 7. Live dynamic-image failures

No cases of a *wrong* image being rendered at a working route were found — all 27 `SC_ASSETS` references resolve correctly and each page's image matches its intended screen name. The "27-session" framing in the mandate does not match the coded 24-session map (§1) — this is either a stale spec or an indication that 3 additional sessions were planned but never coded/wired, which would explain some of the orphaned assets in `batch-22/`.

---

## 8. Persistence failures

`src/context/SmokeCraftJourneyContext.jsx` — canonical key `sc_journey_v1`, STATE_VERSION 2 (migration logic only branches on `< 1`, so a real v1→v2 reshape never fires — it just relabels old data). DEFAULT_STATE covers: identity, mentor, format, seedSoil, pairing, selectedCigar, requestPurchase, cutToastLight, firstThird, secondThird, flavorMemory, finalThird, scorecard, finalReview, passportStamp, connections, sessionCompletion.

**Fields with no canonical journey slot at all:** wrapperStrength, origins, terroir, vitola, blend, flavorDNA — these numbered/supplemental steps don't persist through the shared context.

**Confirmed shadow/private persistence keys bypassing the canonical context:**

| File | Key | Issue |
|---|---|---|
| Connections.jsx | private `LS_KEY` | own connections list, not in journey.connections |
| GoldenBox.jsx | private `LS_KEY` | acknowledged flag stored outside journey |
| Identity.jsx | private `LS_KEY` (`sc_identity_v1`) | duplicates `journey.identity` |
| Scorecard.jsx | private `LS_KEY` (`sc_scorecard_v1`) + reads `sessionStorage.smokecraftFinalThird` | duplicates `journey.scorecard`, plus reads a separate final-third mirror |
| FinalThird.jsx | `sessionStorage.smokecraftFinalThird` | separate from `journey.finalThird` |
| FlavorMemory.jsx | `sessionStorage.smokecraftFlavorMemory` | separate from `journey.flavorMemory` |
| PassportStamp.jsx | private `LS_KEY` + directly reads raw `sc_scorecard_v1` and `sessionStorage.smokecraftFlavorMemory` | reads shadow keys instead of `useSmokeCraftJourney()` |
| SessionComplete.jsx | directly reads raw `localStorage['sc_journey_v1']` and `localStorage['sc_identity_v1']` | bypasses the context hook entirely, reading the storage key by hand |
| LeafChallenge.jsx / LeafChallengeResult.jsx | `sessionStorage.leafChallengeResult` | separate result mirror |

**Finding:** persistence is fragmented across at least 8 shadow keys in addition to the canonical `sc_journey_v1`. Data can silently drift between `journey.*` and these mirrors (e.g., Scorecard and PassportStamp can disagree about scorecard contents if one reads the shadow key and the other reads canonical state).

*(Note: a separate, earlier mandate already remediated the shadow-key problem specifically for FirstThird/SecondThird/RequestPurchase/FlavorMemory(partial)/FinalThird(partial)/Scorecard(partial)/FinalReview in commit `4f993baf`, which predates this audit. The residual issues listed above — Connections, GoldenBox, Identity, PassportStamp, SessionComplete, LeafChallenge — were not in that mandate's scope and remain unresolved as of this audit.)*

---

## 9. Missing controls and user actions

- **S17/S18/S19 (SmokeCraftChallenge, SecondHumidorMatch, MiniTastingRound):** no selectable controls of any kind — just one Continue button per screen. These sessions have no actual guest interaction.
- **Leaderboard:** no controls beyond Back — no filters, no live data query, no refresh/retry.
- **6 education-labeled steps** (Origins, Terroir, Vitola, WrapperStrength, PairingMastery, FlavorDNA — see §12) have no interactive content controls at all.
- **Scan/GuestPass:** single full-card invisible hotspot — same anti-pattern the earlier persistence-gate mandate explicitly banned for the core journey screens, but never remediated here.

---

## 10. Missing educational content

Six education-labeled journey/supplemental steps have **zero interactive or assessed educational content**:

- `Origins.jsx` (Tobacco Origins)
- `Terroir.jsx` (Tobacco Terroir) — `ComingSoon` stub
- `Vitola.jsx` (Vitola Science) — `ComingSoon` stub
- `WrapperStrength.jsx` (S6, Wrapper/Strength Education) — renders null, pure redirect
- `PairingMastery.jsx` — `ComingSoon` stub
- `FlavorDNA.jsx` — image-only, no content

Only one education/study step in the whole app has real depth: `Leaves.jsx` → `LeafChallenge.jsx` → `LeafChallengeResult.jsx` (a genuine study-then-quiz-then-score flow). Everything else awards XP for passive click-through, not for engaging with or being assessed on actual content.

---

## 11. Missing AI interactions

**Confirmed: no AI-driven interaction feature exists anywhere in `src/pages/smokecraft`.** `Assistant.jsx` is 14 lines rendering `<ComingSoon stepLabel="SmokeCraft Assistant" />` — no chat UI, no LLM call, no recommendation service backed by AI. The "recommendation" logic in PairingLab and HumidorMatch (see §14) is real rule-based scoring, but it is not AI — it's a static lookup-table + formula.

---

## 12. Missing quizzes, XP, rewards, and achievements

**Real quiz + reward loop:** `LeafChallenge.jsx` (multiple-choice rounds, real scoring) → `LeafChallengeResult.jsx` (score-gated badge/XP reveal). This is the only genuine quiz mechanic in the app.

**XP-on-click-through only (no assessment):** Art.jsx, Available.jsx, Blend.jsx, Cultivation.jsx, Leaves.jsx (has a "quiz" icon but is a study checklist, not a scored quiz), Format.legacy.jsx.

**XP display only, no award logic of its own:** ManagementSync.jsx, PassportStamp.jsx, Scorecard.jsx, AdvancedScorecardPanel.jsx (orphaned, unused).

**No Rewards page or route exists in the app at all.** Every UI element labeled "Rewards" (in PairingLab.jsx, SmokeCraftChallenge.jsx, SmokeCraft.jsx) currently routes to `/smokecraft/humidor-match` because there is nowhere else to send them — this was already identified in a prior diagnostic pass this session and confirmed again here.

**XP award idempotency:** `GuestSessionContext.jsx` guards against duplicate XP by checking `completedSteps.includes(sessionId)` before applying an award — this mechanism itself is sound.

---

## 13. Missing AI interactions

*(See §11 — reported once; duplicated numbering in the source mandate.)*

---

## 14. Required empty, loading, saving, completed, error, offline, retry states

**Have real loading/error/empty/offline states:** ErrorLogViewer.jsx, FeatureFlagAdmin.jsx, SmokeCraftCart.jsx, SmokeCraftMenu.jsx, SmokeCraftCheckout.jsx, SmokeCraftImageDiagnostic.jsx, PassportStamp.jsx (`claimStatus` includes `error`/`offline`), Identity.jsx (field-validation errors only, no network state).

**Have zero loading/error/offline/retry/empty state handling** (0 grep hits for any of those terms): Mentor, Format, SeedSoil, HumidorMatch, RequestPurchase, CutToastLight, FirstThird, SecondThird, FinalThird, Scorecard, FinalReview, Connections, SessionComplete, Origins, Terroir, Vitola, WrapperStrength, Pairing, PairingMastery, SmokeCraftChallenge, SecondHumidorMatch, MiniTastingRound (21 pages).

This is consistent with these screens being local-form/localStorage-only today (no network calls to fail). But it also means: the moment any of these screens gains a real backend call (staff request, order submission, leaderboard fetch, AI assistant, etc.), there is currently no honest failure/offline/retry UI pattern established anywhere in the core journey to extend from — only the commerce/admin screens have one.

**"Saving…" / honest-save states:** partially addressed by the prior (out-of-scope) mandate for the screens it touched; not present at all in Connections, GoldenBox, Identity, PassportStamp, SessionComplete.

---

## 15. Exact screen counts

| Category | Count |
|---|---|
| **Existing reusable screens** (real overlay + controls + journey persistence, usable as-is or with minor persistence cleanup) | **19** — FirstThird, SecondThird, FinalThird, HumidorMatch, CutToastLight, FlavorMemory, Format, Mentor, PairingLab, RequestPurchase, Scorecard, SeedSoil, Connections, ManagementSync, PassportStamp, FinalReview, SessionComplete, Identity, GoldenBox |
| **Existing screens requiring redesign** (static-only or stub, sitting on a real route) | **17** — SecondHumidorMatch, MiniTastingRound, SmokeCraftChallenge, Leaderboard, HowItWorks, EventChallenge, FlavorDNA, Origins, GoldenBoxStatus, Terroir, PairingMastery, Vitola, Scan, GuestPass, WrapperStrength, Assistant, (plus Format.legacy.jsx as dead code to remove rather than redesign) |
| **New screens actually required** | **1 confirmed** — a real `/smokecraft/rewards` page (referenced by UI, never built). Additional net-new screens beyond that are only required *if* the 27-session framing in the mandate is authoritative and 3 more sessions must be designed from scratch — that is a scope decision, not an audit finding, and is flagged in §7 rather than assumed here. |
| **New visual assets actually required** | **0 confirmed missing** — every existing route's image asset resolves. Net-new imagery is only needed for the 1 new Rewards page (or for the 3 unconfirmed additional sessions if that scope is adopted). |

---

## 16. Screen-by-screen Master Audit Table

| # | Screen | Session | Interactive | Journey-persisted | Classification |
|---|---|---|---|---|---|
| 1 | SmokeCraft (landing) | S1 | Y | Y | KEEP |
| 2 | Enroll | S2 | Y | Y | KEEP |
| 3 | Identity | S2 (dup) | Y | shadow key | UPDATE — fix dup session-2 guard + shadow `sc_identity_v1` key |
| 4 | GoldenBox | S3 | Y | shadow key | UPDATE — shadow LS_KEY |
| 5 | Mentor | S4 | Y | Y | KEEP |
| 6 | Format | S5 | Y | Y | KEEP |
| 7 | WrapperStrength | S6 | N (null render) | N | CREATE — real content, currently a redirect stub |
| 8 | SeedSoil | S7 | Y | Y | KEEP |
| 9 | PairingLab | S8 | Y | Y | KEEP |
| 10 | HumidorMatch | S9 | Y | Y | KEEP |
| 11 | RequestPurchase | S10 | Y | Y | KEEP |
| 12 | CutToastLight | S11 | Y | Y | KEEP |
| 13 | FirstThird | S12 | Y | Y | KEEP |
| 14 | SecondThird | S13 | Y | Y | KEEP |
| 15 | FlavorMemory | S14 | Y | shadow mirror | UPDATE — sessionStorage mirror |
| 16 | FinalThird | S15 | Y | shadow mirror | UPDATE — sessionStorage mirror |
| 17 | Scorecard | S16 | Y | shadow key + reads shadow FinalThird | UPDATE |
| 18 | SmokeCraftChallenge | S17 | N | N | REDESIGN — static stub |
| 19 | SecondHumidorMatch | S18 | N | N | MERGE into HumidorMatch pattern or REDESIGN |
| 20 | MiniTastingRound | S19 | N | N | REDESIGN — static stub |
| 21 | FinalReview | S20 | Y | Y | KEEP |
| 22 | PassportStamp | S21 | Y | shadow key + reads shadow Scorecard/FlavorMemory | UPDATE |
| 23 | Connections | S22 | Y | shadow key | UPDATE |
| 24 | ManagementSync | S23 | Y | Y | KEEP |
| 25 | SessionComplete | S24 | Y | reads raw LS keys directly | UPDATE — bypass context hook |
| 26 | Leaderboard | unguarded | N | N | REDESIGN — static image + Back only |
| 27 | HowItWorks | unguarded | N | N | REDESIGN or KEEP-as-static (informational only, may be intentional) |
| 28 | EventChallenge | unguarded | N | N | REDESIGN |
| 29 | Origins | unguarded | N | N | CREATE real content |
| 30 | Terroir | unguarded | N | N | CREATE real content |
| 31 | Vitola | unguarded | N | N | CREATE real content |
| 32 | PairingMastery | unguarded | N | N | CREATE real content |
| 33 | FlavorDNA | unguarded | N | N | CREATE real content |
| 34 | Assistant | unguarded | N | N | CREATE (or explicitly de-scope if AI is out of scope) |
| 35 | Rewards | — | N/A (doesn't exist) | N/A | **CREATE — new screen** |
| 36 | Scan / GuestPass | unguarded | marginal | N | UPDATE — replace full-card hotspot |
| 37 | Format.legacy.jsx | dead code | — | — | DELETE |
| — | 12 orphaned components | — | — | — | DELETE (after usage re-confirmation) |
| — | ~100+ orphaned image files across 4 asset directories | — | — | — | SPLIT: archive vs delete, per-directory pass |

---

## 17. Smallest safe rebuild order

Ordered to fix highest-blast-radius/lowest-risk items first, and to avoid redesigning a screen twice:

1. **Persistence consolidation** (no visual change, lowest risk): eliminate the 8 shadow localStorage/sessionStorage keys in Connections, GoldenBox, Identity, Scorecard, FinalThird, FlavorMemory, PassportStamp, SessionComplete — route everything through `useSmokeCraftJourney()`. This must happen *before* any of the below, since several of the broken screens (Scorecard, PassportStamp) currently read from these shadow keys and would otherwise be rebuilt against a data source about to be deleted.
2. **Fix the Session-2 double-guard** (`identity` vs `enroll`) — a data-model correctness fix, no UI change.
3. **Fix the legacy `session-1..session-4` dead-end redirects** to route to the guest's actual current session instead of always `/smokecraft`.
4. **Build the missing `/smokecraft/rewards` page** and repoint every "Rewards" CTA at it instead of `/smokecraft/humidor-match` — self-contained, no dependency on other rebuild steps.
5. **Redesign the 3 in-spine static stubs** (SmokeCraftChallenge S17, SecondHumidorMatch S18, MiniTastingRound S19) — these block real guest interaction inside the guarded numbered journey and are the highest-visibility gap.
6. **Redesign Leaderboard** with real/live-or-honest-empty ranking data (this audit did not find a scroll-trap in Leaderboard.jsx itself — the file has no fixed-position/overflow styling; if a scroll trap is confirmed, it lives in `SmokeCraftAssetScreen.jsx`, which should be checked before rebuilding Leaderboard's own layout).
7. **Build real content for the 5 education-only-in-name steps** (Origins, Terroir, Vitola, PairingMastery, FlavorDNA) plus WrapperStrength (currently a null-render redirect) — lowest urgency since they sit outside the guarded numbered spine (except WrapperStrength, which is S6 and currently shows nothing).
8. **Decide and either build or explicitly de-scope** the SmokeCraft Assistant (AI) feature — currently a bare placeholder.
9. **Asset cleanup pass**: archive or delete confirmed-orphaned files across `public/assets/smokecraft/`, `.../cropped/`, `.../smokecraft-reference/approved/` (incl. `batch-22/`), and root-level `public/*.png` — do this last, after all rebuild decisions are locked, so nothing scheduled for reuse in steps 4–8 is deleted prematurely.
10. **Delete confirmed dead code**: `Format.legacy.jsx` and the 12 orphaned components — final cleanup pass, after re-confirming zero references post-rebuild.

---

## Audit methodology note

This report was compiled from four parallel read-only repository searches (assets, pages/components, routes/journey map, persistence/states/content) cross-referenced against direct reads of `App.jsx`, `SmokeCraftJourneyContext.jsx`, `session.js`/`smokecraftJourney.js`, and `smokecraftAssets.js`. No screenshots or live-browser verification were performed as part of this audit — all findings are static-code and file-system based. Live-browser confirmation of the static-only screens, the Leaderboard scroll behavior, and the shadow-key drift would be a reasonable next step before any implementation work begins.
