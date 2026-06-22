# SmokeCraft 360 Protocol Audit — Phase 0 through Phase 13

Audit date: 2026-06-22. Latest main commit at time of audit: `43860626`.
Scope: ground-truth, evidence-based audit of the full SmokeCraft protocol —
not a summary, not a sales document. Every status below is backed by a file
path and code reference. Nothing in this document changes runtime behavior.

This audit exists so that no further SmokeCraft development starts from a
false premise about what's already built. Read `docs/backend-readiness-map.md`
alongside this doc for the backend-wiring detail this audit builds on.

## How to read the status column

- **Live** — built, navigable, functioning as designed on the front end.
- **Partial** — built, but missing required sub-elements named in the spec.
- **Local/Demo** — fully interactive, but state never leaves the browser
  (localStorage only).
- **Backend Pending** — a real backend route/table exists or is planned, but
  this page doesn't call it yet (or calls it read-only).
- **Missing** — not implemented at all.
- **Blocked** — implemented, but explicitly inaccessible in some mode
  (none found in SmokeCraft — see Demo Mode section).

## Route Inventory

All `/smokecraft/*` and `/passport/*` routes are defined in `src/App.jsx`
(lines 225–291). 17 `/smokecraft/*` route entries, 9 `/passport/*` route
entries. None of these routes are in `DEMO_BLOCKED_PATHS`
(`src/context/DemoModeContext.jsx:24-48`) — the entire SmokeCraft and
Passport tree is reachable in Demo Mode.

| Route | File |
|---|---|
| `/smokecraft` | `src/pages/SmokeCraft.jsx` |
| `/smokecraft/enroll` | `src/pages/smokecraft/Enroll.jsx` |
| `/smokecraft/identity` | `src/pages/smokecraft/Identity.jsx` |
| `/smokecraft/origins` | `src/pages/smokecraft/Origins.jsx` |
| `/smokecraft/curation` | `src/pages/smokecraft/Curation.jsx` |
| `/smokecraft/leaves` | `src/pages/smokecraft/Leaves.jsx` |
| `/smokecraft/leaf-challenge(+calculating/result)` | `LeafChallenge*.jsx` |
| `/smokecraft/cultivation` | `src/pages/smokecraft/Cultivation.jsx` |
| `/smokecraft/blend` | `src/pages/smokecraft/Blend.jsx` |
| `/smokecraft/flavor-dna` | `src/pages/smokecraft/FlavorDNA.jsx` |
| `/smokecraft/seed-soil` | `src/pages/smokecraft/SeedSoil.jsx` |
| `/smokecraft/terroir` | `src/pages/smokecraft/Terroir.jsx` |
| `/smokecraft/mentor-selection` | `src/pages/smokecraft/Mentor.jsx` |
| `/smokecraft/format` | `src/pages/smokecraft/Format.jsx` |
| `/smokecraft/vitola` | `src/pages/smokecraft/Vitola.jsx` |
| `/smokecraft/golden-box(/status)` | `GoldenBox.jsx`, `GoldenBoxStatus.jsx` |
| `/smokecraft/humidor-match` | `src/pages/smokecraft/HumidorMatch.jsx` |
| `/smokecraft/available` | `src/pages/smokecraft/Available.jsx` |
| `/smokecraft/pairing(-mastery)` | `Pairing.jsx`, `PairingMastery.jsx` |
| `/smokecraft/request-purchase` | `src/pages/smokecraft/RequestPurchase.jsx` |
| `/smokecraft/cut-toast-light` | `src/pages/smokecraft/CutToastLight.jsx` |
| `/smokecraft/first-third` | `src/pages/smokecraft/FirstThird.jsx` |
| `/smokecraft/second-third` | `src/pages/smokecraft/SecondThird.jsx` |
| `/smokecraft/final-third` | `src/pages/smokecraft/FinalThird.jsx` |
| `/smokecraft/scorecard` | `src/pages/smokecraft/Scorecard.jsx` |
| `/smokecraft/passport-stamp` | `src/pages/smokecraft/PassportStamp.jsx` |
| `/smokecraft/leaderboard` | `src/pages/smokecraft/Leaderboard.jsx` |
| `/smokecraft/connections` | `src/pages/smokecraft/Connections.jsx` |
| `/smokecraft/event-challenge` | `src/pages/smokecraft/EventChallenge.jsx` |
| `/smokecraft/management-sync` | `src/pages/smokecraft/ManagementSync.jsx` |
| `/smokecraft/art`, `/assistant`, `/session-complete` | `Art.jsx`, `Assistant.jsx`, `SessionComplete.jsx` |
| `/passport`, `/profile`, `/stamps`, `/directory`, `/connections`, `/events`, `/benefits`, `/scan`, `/how-it-works` | `src/pages/passport/*.jsx` |

## Phase-by-Phase Audit

### Phase 0 — Entry Gate

- **Purpose**: detect new/returning user, demo mode, existing passport/badges/stamps/mentor history on entry.
- **Route(s)/File(s)**: `/smokecraft` → `src/pages/SmokeCraft.jsx`; `/boot` → `src/pages/Boot.jsx`; session bootstrap in `src/context/GuestSessionContext.jsx`.
- **Status**: **Live** for returning-session detection (reads `session.profile`, `session.completedSteps`, `session.badges`, `session.passport.earnedStamps` from the existing localStorage session on load). **Missing**: QR-code venue-entry detection, table/bar/humidor/event QR routing into a specific session context, and any "venue guest pass" login option distinct from the guest session itself.
- **Demo Mode**: allowed (not in `DEMO_BLOCKED_PATHS`).
- **Stores state**: yes — `novee_session_v4` localStorage key via `sessionStorageService.js`.
- **Gamification**: none awarded at entry (awarded starting Phase 1).
- **Passport/ranking/mentor/networking**: reads existing passport/badge/mentor state if present; does not create any.
- **Missing**: QR-driven venue/event entry; no distinct "venue guest pass" or "360 Passport profile" login path separate from the guest session that already exists; no explicit "unfinished tasting" resume prompt UI.

### Phase 1 — Profile Capture

- **Purpose**: collect identity + preference fields; seed Smoke Preference DNA.
- **Route/File**: `/smokecraft/enroll` → `src/pages/smokecraft/Enroll.jsx`.
- **Status**: **Live**. Form fields confirmed in code: `fullName, phone, email, nickname, ageConfirmed, city, state, zip, countryRegion, experienceLevel, strengthPreference, occasion, socialPreference, budgetRange, flavorPreferences[]`.
- **Demo Mode**: allowed.
- **Stores state**: yes — `session.profile` (GuestSessionContext), localStorage-persisted. No backend call.
- **Gamification**: `addXP(XP_AWARDS.PROFILE_COMPLETE)` = 50 XP; `completeStep('enroll')`.
- **Passport/ranking/mentor/networking**: initializes a passport ID if missing; does not award a stamp here.
- **Missing**: no backend persistence of profile data; no email/SMS verification (none claimed in UI either — honest).

### Phase 2 — Cigar Shape, Size, and Burn Time Education

- **Purpose**: must cover all 10 named shapes with ring gauge, burn time, difficulty, flavor impact, recommended experience level, and the 4 burn-time categories.
- **Route/File**: `/smokecraft/format` → `src/pages/smokecraft/Format.jsx`.
- **Status**: **Live** — all 10 required shapes present: Robusto, Toro, Churchill, Corona, Gordo, Lancero, Torpedo, Belicoso, Perfecto, Panetela, each with length, ring gauge, burn-time range, burn-time category, and XP value.
- Burn-time categories confirmed exactly as spec'd: Quick Smoke, Standard Smoke, Long Session, VIP Slow Burn.
- **Photo honesty**: a dedicated `CigarVisual` component renders an honest **"Required cigar photo missing"** + filename state if an image is absent/fails to load (`Format.jsx:31`) — confirmed via repo-wide grep, only this one occurrence, used as designed (not triggered as a fallback message but present as the real missing-image path).
- **Partial**: 6 of 10 shapes (Robusto, Toro, Churchill, Corona, Gordo, Torpedo) have dedicated photography; Lancero, Belicoso, Perfecto, and Panetela currently reuse another shape's photo with an in-code TODO comment rather than rendering their own image. This is a partial-photo gap, not a missing-photo gap (no fake/stock substitute is used).
- **Demo Mode**: allowed.
- **Stores state**: yes — `session.smokeCraft.selectedFormat` via `setSmokeCraftFormat()`.
- **Gamification**: yes — 20–45 XP depending on shape selected; `completeStep('format')`.
- **Passport/ranking/mentor/networking**: sets a `pendingPassportStamp` placeholder (`format-guide-completed`) — not an actual stamp yet.
- **Missing**: dedicated photography for Lancero/Belicoso/Perfecto/Panetela.

### Phase 3 — Seed & Soil Pairing

- **Purpose**: Seed = tobacco country/wrapper/binder/filler/origin/aging/strength/craft profile; Soil = venue atmosphere/drink/food/music/weather/social/mood/event theme.
- **Route/File**: `/smokecraft/seed-soil` → `src/pages/smokecraft/SeedSoil.jsx`.
- **Status**: **Partial-but-substantive**. 4 tobacco regions implemented as "Seed" (Vuelta Abajo/Cuba, Jalapa Valley/Nicaragua, Estelí/Nicaragua, San Andrés/Mexico) with wrapper, strength, and aging data — not every required Seed field (e.g. explicit "brand story", "farm origin" as a distinct field) is broken out individually, some are folded into descriptive copy rather than discrete data fields. All 8 required Soil categories are present (Venue Atmosphere, Drink Pairing, Food Pairing, Music Vibe, Weather, Social Setting, Mood, Event Theme).
- **Demo Mode**: allowed.
- **Stores state**: yes — `session.smokeCraft.selectedSeed`, `selectedSoil`, `pairingScore`, `blendSignature`. No backend call.
- **Gamification**: yes — `addXP(100)` baseline, plus a pairing-score-based award/penalty system (e.g. `addXP(-50)` if a pairing warning is knowingly ignored).
- **Passport/ranking/mentor/networking**: none directly; feeds the pairing score used elsewhere.
- **Missing**: explicit per-field breakout of "farm origin" and "brand story" as separate structured data rather than narrative copy; no backend persistence of pairing history across sessions.

### Phase 4 — Mentor Selection

- **Purpose**: exactly 2 mentors; each with portrait, flag, specialty, personality, experience level, quote, and what they help with; mentors should guide downstream cut/toast/light/tasting steps.
- **Route/File**: `/smokecraft/mentor-selection` → `src/pages/smokecraft/Mentor.jsx`.
- **Status**: **Live** for selection itself — 8 mentors (Dominican Republic 🇩🇴, Nicaragua 🇳🇮, Honduras 🇭🇳, Mexico 🇲🇽, Cuba 🇨🇺, Peru 🇵🇪, USA 🇺🇸, Brazil 🇧🇷), each with `country`, `countryCode`, `flag`, `name`, `bio`/specialty, `tags`, realistic portrait (with an honest "Portrait pending" fallback if the image fails), and a voice `greeting`/quote. Exactly-two-mentor rule is enforced in `toggle()` (a third selection attempt is silently capped, not rejected with an error message — see Gamification Gap Map). Proceed is disabled until exactly two are selected.
- **Partial**: mentor "personality"/"experience level" as explicit structured fields are not present — personality comes through in bio/quote copy, not a discrete field.
- **Missing**: mentor guidance is **not wired downstream** — `CutToastLight.jsx`, `FirstThird.jsx`, `SecondThird.jsx`, and `FinalThird.jsx` do not reference the selected mentor at all. The spec's "mentors guide cutting, toasting, lighting, pacing, flavor recognition..." is not implemented; mentor selection currently only shapes the voice greeting played at selection time.
- **Demo Mode**: allowed.
- **Stores state**: yes — `session.selectedMentor`/`selectedMentorCountry` (single primary mentor recorded via `setSelectedMentor`); the full two-mentor array is held in local component state and passed to `setMentors(selected)`.
- **Gamification**: yes — `addXP(XP_AWARDS.MENTOR_SELECTED)` = 75 XP; `completeStep('mentor')`.
- **Passport/ranking/mentor/networking**: mentor choice is not yet referenced by Phase 12 (Passport Stamp) or Phase 13 (Connections) — see those phases.

### Phase 5 — Gold Box Rules

- **Purpose**: present scoring/badge/stamp/etiquette/no-fake-scoring/no-underage/venue/purchase rules; gate via Accept Rules / View Scoring / Start Session.
- **Route/File**: `/smokecraft/golden-box` → `src/pages/smokecraft/GoldenBox.jsx` (+ new `src/utils/smokecraftGoldBoxRules.js` rules-content module).
- **Status**: **Strengthened**. The page now presents the full official rulebook — No Fake Scoring, Age & Venue Compliance, Lounge Etiquette, Event Challenge Rules, Purchase & POS Rules, Completed-Session definition, and a Backend/POS status note — read from real `smokecraftScoring.js` data (`SCORE_CATEGORIES`, `MAX_TOTAL_SCORE`) rather than invented. Three distinct actions now exist: **Accept Rules** (awards the existing 25 XP + "Golden Invitation" badge + `completeStep('golden-box')`, same as before, plus records the new `goldBoxRules` fields), **View Scoring** (expands a panel showing every scoring category/points and badge/stamp overview; records `goldBoxViewedScoring`), and **Start Session** (disabled until rules are accepted; navigates to Humidor Match and records `goldBoxSessionStartedAt`). Attempting Start Session before accepting shows "Accept the Gold Box Rules before starting your session." The journey map and "What's Inside" accordion are unchanged.
- **Demo Mode**: allowed. All new state is local session-only; no backend write, no real age/legal verification, no real POS3/E.A.T. call.
- **Stores state**: yes — `session.smokeCraft.goldenBox.accepted`/`acceptedAt` (unchanged, still read directly by the Phase 11 evaluators below) plus the new additive `session.smokeCraft.goldBoxRules = { goldBoxAccepted, goldBoxAcceptedAt, goldBoxViewedScoring, goldBoxSessionStartedAt, goldBoxRuleVersion }`; badge added to `session.badges`.
- **Gamification**: yes — 25 XP + "Golden Invitation" badge on Accept Rules; `completeStep('golden-box')` — unchanged from before.
- **Passport/ranking/mentor/networking**: feeds Phase 11's `goldBoxRulesAccepted` score category (50 pts) and `gold-box-finisher` badge, both of which already read `session.smokeCraft.goldenBox.accepted` and are unmodified/unaffected by this change. No stamp.
- **See**: `docs/smokecraft-phase-5-implementation.md` for full rule text and coverage detail.

### Phase 6 — Cigar Recommendation / Humidor Match

- **Purpose**: recommend Best Match / Step-Up Pick / Venue Featured Pick based on profile, pairing, mentor, budget, inventory, with POS3 add/request or honest pending state.
- **Route/File**: `/smokecraft/humidor-match` → `HumidorMatch.jsx` (+ new `src/utils/smokecraftHumidorMatch.js` recommendation engine); `/smokecraft/request-purchase` → `RequestPurchase.jsx`; `/smokecraft/available` → `Available.jsx` (legacy/orphan, not in `SMOKECRAFT_FLOW`, left untouched — see note below).
- **Status**: **Strengthened**. `HumidorMatch.jsx` now renders the full Best Match / Step-Up Pick / Venue Featured Pick triad above the existing storage-condition selector, both selections required before Continue. `computeHumidorRecommendations(session)` scores 4 real POS3 inventory cigars (`src/data/pos3/inventoryCatalog.js` SKUs `SKU-CIG-PAD64MAD`, `SKU-CIG-OPUSXROB`, `SKU-CIG-CHURCHRES`, `SKU-CIG-OLIVAVMEL`) against the guest's real profile (`experienceLevel`/`strengthPreference`/`occasion`/`budgetRange`/`flavorPreferences`), selected cigar format, Seed & Soil region country, and selected mentors. Inventory availability is read (never decremented) via the existing `inventoryAvailabilityService.checkAvailability()`. "Request from Staff" and "Add to POS" buttons emit honest pending `opsEventBus` events (`POS_HANDOFF_CREATED` / `POS_ADD_TO_TICKET_REQUESTED`) and show "Requested — Pending Staff" / "Add to POS — Backend Pending" — no order is placed, no stock is changed, no POS ticket is created. `RequestPurchase.jsx` is unchanged and still offers "Request from Humidor" or "I Have My Own Cigar" with the same existing honest pending-handoff model. `Available.jsx` remains a legacy/orphan route (not part of `SMOKECRAFT_FLOW`, fully hardcoded fake data, different design system) and was intentionally left out of scope rather than retrofitted.
- **Demo Mode**: allowed. Recommendation engine reads only local session state; no backend or POS3 write occurs in Demo Mode or otherwise.
- **Stores state**: yes — `session.smokeCraft.humidorMatch`, `requestPurchaseChoice`, `session.pos3.pendingHumidorRequest`, and now `session.smokeCraft.selectedHumidorRecommendation` (`selectedRecommendationType`, `selectedCigarId`, `selectedCigarName`, `selectedCigarCountry`, `selectedCigarType`, `selectedWrapper`, `selectedStrength`, `selectedBurnTime`, `selectedPairingSuggestion`, `selectedMentorNote`, `selectedMatchScore`, `selectedAt`). No live backend write; this is the same honest local-handoff pattern documented in `docs/backend-readiness-map.md`.
- **Gamification**: yes — 100 XP (humidor match) + 25 XP (request/purchase); `completeStep()` for both. Unchanged by this work.
- **Passport/ranking/mentor/networking**: `selectedHumidorRecommendation` now feeds Phase 12 — `PassportStamp.jsx`'s `buildStampPayload()` prefers `selectedCigarCountry`/`selectedWrapper`/`selectedStrength`/`selectedCigarName`/`selectedBurnTime` over the previous honest `null` placeholders (those nulls existed only because Seed & Soil stores a region id, not country/wrapper/strength). Phase 11 (`smokecraftScoring.js`) and Phase 13 (`Connections.jsx`) do not yet read these fields directly, but the data is now present in session state for future cross-referencing, the same as mentor/Seed & Soil data already is.
- **Missing**: a live POS3 ticket integration for "Add to POS" (intentionally left as "Backend Pending" per honesty rules); a real per-unit retail price field (only wholesale `unitCost` exists in the inventory catalog, so price is honestly shown as "Price pending POS sync").

### Phase 7 — Cut, Toast, and Light Guidance

- **Purpose**: inspect/cut type/toast/light/draw guidance with points earned.
- **Route/File**: `/smokecraft/cut-toast-light` → `CutToastLight.jsx`.
- **Status**: **Partial**. Implements a checklist of prep steps (cut, toast, light) and awards XP scaled to how many steps were completed. It does **not** break out the specific sub-steps named in the spec as distinct trackable items — wrapper texture/firmness/foot aroma inspection, the three cut-type choices (straight/V-cut/punch), rotate-while-toasting, draw resistance rating, or smoke-output/heat/smoothness ratings are not present as discrete fields; the page is a simpler 3-step checklist.
- **Demo Mode**: allowed.
- **Stores state**: yes — `session.smokeCraft.eventLog` entry `PREP_STEPS_COMPLETED`.
- **Gamification**: yes — variable XP by completed-step count; `completeStep('cut-toast-light')`.
- **Passport/ranking/mentor/networking**: none directly; no mentor guidance surfaced here (see Phase 4 gap).
- **Missing**: cut-type selection, wrapper inspection sub-steps, draw-resistance rating, mentor-guided tips.

### Phase 8 — First Third Tasting

- **Purpose**: opening flavor/aroma/draw/burn/smoke output/strength/first impression with multi-category scoring.
- **Route/File**: `/smokecraft/first-third` → `FirstThird.jsx`.
- **Status**: **Partial**. Captures selected flavor notes (checkbox set) and a draw rating, then computes XP from `tastingXP(notesCount, hasDrawRating)`. Does not implement separate numeric scores for flavor/draw/burn/aroma/smoothness/construction as distinct rated categories — it is notes + one rating, not six.
- **Demo Mode**: allowed.
- **Stores state**: yes — `session.smokeCraft.firstThird`, eventLog entry `TASTING_RECORDED`.
- **Gamification**: yes — formula-based XP; `completeStep('first-third')`.
- **Passport/ranking/mentor/networking**: none directly; no mentor feedback wired in.
- **Missing**: the six-category scoring breakdown; mentor feedback.

### Phase 9 — Second Third Tasting

- **Purpose**: flavor transition, strength increase, complexity, pairing response, room experience, mentor feedback, pacing guidance.
- **Route/File**: `/smokecraft/second-third` → `SecondThird.jsx`.
- **Status**: **Partial** — same shape as Phase 8 (notes + rating + formula XP). "Pairing response," "room experience," "mentor feedback," and "pacing guidance" are not implemented as distinct captured data; the page does not differ structurally from First/Final Third beyond copy.
- **Demo Mode**: allowed.
- **Stores state**: yes — `session.smokeCraft.secondThird`.
- **Gamification**: yes — formula-based XP; `completeStep('second-third')`.
- **Passport/ranking/mentor/networking**: none directly.
- **Missing**: pairing-response/room-experience/mentor-feedback/pacing-guidance capture.

### Phase 10 — Final Third Tasting

- **Purpose**: finish, heat, bitterness, strength peak, complexity, satisfaction, would-smoke-again, would-buy, would-recommend, next pairing.
- **Route/File**: `/smokecraft/final-third` → `FinalThird.jsx`.
- **Status**: **Partial** — same notes+rating+formula-XP shape as Phases 8–9. The explicit would-smoke-again/would-buy/would-recommend/next-pairing fields named in the spec are not present as their own captured fields.
- **Demo Mode**: allowed.
- **Stores state**: yes — `session.smokeCraft.finalThird`.
- **Gamification**: yes — formula-based XP; `completeStep('final-third')`.
- **Passport/ranking/mentor/networking**: none directly.
- **Missing**: would-smoke-again/would-buy/would-recommend/next-pairing fields.

### Phase 11 — Scorecard and Ranking

- **Purpose**: aggregate scoring across every prior step; ranking levels (Novice/Enthusiast/Connoisseur/Aficionado); badges (First Smoke, Perfect Draw, Seed & Soil Explorer, Maduro Minded, Dominican Route, Pairing Pro, Slow Burn Master, Lounge Certified, Mentor Approved, Gold Box Finisher).
- **Route/File**: `/smokecraft/scorecard` → `Scorecard.jsx`; new `src/utils/smokecraftScoring.js` (score categories, ranking, badges); `src/services/smokecraft/smokeWinnerService.js` (separate, pre-existing 13-category winner system, untouched); `src/services/smokeLeaderboardService.js`.
- **Status (updated)**: **Live**. A new `src/utils/smokecraftScoring.js` module adds the 13 named score categories from the spec (`profileCompleted` 50, `cigarFormatSelected` 50, `seedSoilCompleted` 100, `mentorSelectionCompleted` 100, `goldBoxRulesAccepted` 50, `cutLightStepsCompleted` 100, `firstThirdNotes` 100, `secondThirdNotes` 100, `finalThirdNotes` 100, `pairingReview` 75, `finalReview` 100, `passportStampEarned` 75, `networkingAction` 100 — `MAX_TOTAL_SCORE` = 1100), each evaluator reading only real session fields and returning an honest `points`/`status`/`reason` (never fabricated). `getProtocolRankingLevel(total, maxTotal)` maps the score percentage onto the same four named tiers already used app-wide for XP (`RANKS` in `src/constants/session.js`: Novice/Enthusiast/Connoisseur/Aficionado), so the tier vocabulary stays single-sourced even though this is a separate, score-percentage-based mapping distinct from the XP-based `session.rank`. `computeProtocolBadges(session)` implements all 10 spec'd badges (First Smoke, Perfect Draw, Seed & Soil Explorer, Maduro Minded, Dominican Route, Pairing Pro, Slow Burn Master, Lounge Certified, Mentor Approved, Gold Box Finisher) in the exact `{badgeId, name, description, unlocked, reason, phase, pointsImpact, unlockedAt}` shape, each derived from real session fields — this is fully additive and does **not** modify, rename, or duplicate the pre-existing, separately-named 13-category `smokeWinnerService.js` winner system.
- **Honesty notes**: `pairingReview` reuses the Phase 3 `pairingGrade` (Phase 6 has no distinct pairing-review capture per the audit) rather than fabricating a separate mechanism. `secondThirdNotes` required a prerequisite fix — `SecondThird.jsx` previously collected flavor notes/draw rating but discarded them; a new `setSecondThirdTasting()` context callback (mirroring `setFirstThirdTasting`/`setFinalThirdTasting`) now persists them to `session.smokeCraft.secondThird`, the same pattern already fixed for `Scorecard.jsx` in the Phase 12/13 pass.
- **Scorecard UI (updated)**: `Scorecard.jsx` now renders a "Protocol Score & Ranking" panel showing total/max protocol score, ranking level, a per-category breakdown (points earned / max, status color, honest reason text), and a badge grid (unlocked vs locked, each with its honest reason/unlock condition) — independent of the pre-existing Appearance/Construction/Flavor/Overall rating panel and `WinnerCriteriaPanel`, which remain unchanged.
- **Demo Mode**: allowed. Demo leaderboard entries remain visually separated from the guest's real session entry, unchanged.
- **Stores state**: yes — on Continue, `Scorecard.jsx` now writes `session.smokeCraft.score`, `maxScore`, `rankingLevel`, `badgesEarned`, `badgeEarned`, `scoreBreakdown`, `scoreCalculatedAt`, in addition to the existing `scorecard`/`winnerEligibility`/`eventLog` fields. Newly-unlocked protocol badges are also added to `session.badges[]` via `addBadge()` with id `protocol-<badgeId>`, deduplicated, distinct from winner-category badges.
- **Gamification**: yes — 100 XP; `completeStep('scorecard')`; purchase-intent creation logs honest pending-sync events (unchanged).
- **Passport/ranking/mentor/networking**: now feeds Phase 12 directly — `PassportStamp.jsx`'s `buildStampPayload()` prefers `session.smokeCraft.rankingLevel`/`score`/`badgeEarned`/`badgesEarned` (the new Phase 11 protocol values) and falls back to the older `session.rank`/`session.badges` only if Phase 11 hasn't run yet, so the stamp stays honest either way. `networkingAction` (one of the 13 score categories) reads `session.smokeCraft.passportConnections`, so completing Phase 13 actions raises the Phase 11 score, closing the loop in the other direction too.
- **Backend pending**: same as before — `saveSmokeSessionSnapshot()` / `checkSmokeBackendConnectivity()` still fall back to local storage automatically; no environment has observed `storageMode: "postgres"` yet.

### Phase 12 — 360 Passport Stamp

- **Purpose**: award a stamp with user/venue/event/date/cigar country/type/mentor names/score/badge/pairing/networking status, **inside** the same 360 Passport Connections system — not a separate "Passport Legacy."
- **Route/File**: `/smokecraft/passport-stamp` → `PassportStamp.jsx`; stamp logic in `GuestSessionContext.jsx`'s `awardStamp()` → `src/utils/passportProgress.js`'s `awardPassportStamp()`.
- **Status (updated)**: **Partial, strengthened**. `awardPassportStamp()` now accepts an optional `extra` payload that is merged onto the stamp object (and onto an already-earned stamp, so a later page can enrich rather than duplicate). `PassportStamp.jsx` builds this payload (`buildStampPayload()`) from data already in session state: `userId/guestId`, `smokeCraftSessionId`, `smokeCraftPassportId`, `userName`, `venue`, `eventName`, `date`, `cigarName`/`cigarType`/`burnTime` (from `smokeCraft.selectedFormat`), `mentorNames`/`mentorIds` (from `session.mentors`), `score` (from the now-persisted `smokeCraft.scorecard.total`), `rankingLevel` (`session.rank`), `badgeEarned`/`badgesEarned`, `pairingCompleted`/`seedRegion`/`soilSelections` (from `smokecraftSeedSoil`), `networkingStatus`, `shareConsent`, `createdAt`. The Passport Stamp screen now renders a "Stamp Details" card showing venue/event/date/cigar/mentors/score/badge-ranking/pairing-completed/networking-status/privacy-status.
- **Still honest gaps (not faked)**: `cigarCountry`/`wrapper`/`strength` are left `null` and labeled "Backend pending" in the UI — the Seed & Soil step (Phase 3) only stores a `seedRegionId`, not the region's country/wrapper/strength as discrete session fields, so the stamp cannot honestly populate those without inventing data. Fixing this is a Phase 3 data-shape change, out of scope for this pass.
- **Scorecard persistence added**: `Scorecard.jsx` previously computed `total`/`scores` only in local component state and never saved them — there was nothing for the stamp to read. `handleContinue()` now writes `{ scores, total, maxTotal }` into `session.smokeCraft.scorecard` before navigating, which is the minimum change required for the stamp's `score` field to be real rather than fabricated.
- **Demo Mode**: allowed.
- **Stores state**: yes — `session.smokecraftStamps[]` (enriched), `session.passport.earnedStamps[]` (unchanged, still the thinner `completeSmokeCraftSession()` path), `latestStampId`, `passportId`. No backend write.
- **Gamification**: yes — XP awarded (`XP_AWARDS.PASSPORT_STAMP`); `completeStep('passport-stamp')`.
- **Passport/ranking/mentor/networking**: confirmed unified with `/passport/*` — **no conflicting legacy system** (zero "Passport Legacy" matches, re-confirmed this pass). Mentor names, score, and badges are now carried onto the stamp object.
- **Remaining work**: `cigarCountry`/`wrapper`/`strength` enrichment depends on a Phase 3 data-shape change (storing the full region object, not just its id) — flagged for a future pass, not implemented here to stay in scope.

### Phase 13 — 360 Passport Connections / Networking

- **Purpose**: share stamp, exchange contact, connect with guest, join leaderboard, save mentor rec, follow venue, join cigar circle, send tasting note, networking QR — under explicit user-controlled privacy/consent.
- **Route/File**: `/smokecraft/connections` → `Connections.jsx` (SmokeCraft's own networking step, step 15 of 17 — the primary target of this pass); `/passport/connections` → `PassportConnections.jsx`; `/passport/events` → `PassportEvents.jsx`; `src/api/passportConnectionsApi.js`; `src/api/passportEventsApi.js`.
- **Status (updated, `Connections.jsx` only)**: **Local/Demo, now consent-gated and honestly tracked**. The page now has:
  - A visible privacy notice with the required copy: "Your SmokeCraft Passport details are only shared when you choose to share them," plus an explicit statement that nothing here is sent anywhere automatically and no real backend/SMS/email exists yet.
  - A consent panel (`setNetworkingConsent()`) with all 8 spec'd fields (`allowShareStamp`, `allowShareName`, `allowShareContact`, `allowShareBusinessLinks`, `allowShareSmokeCraftLevel`, `allowShareFavoriteCigarStyle`, `allowShareEventStamp`, `allowVenueFollowUp`), defaulting to `false` — nothing is shareable until the guest opts in.
  - All 9 named networking actions (share stamp, exchange contact card, connect with another guest, use networking QR code, join leaderboard, follow venue, save mentor recommendation, join cigar circle, send a tasting note), each mapped to the consent field it actually requires (`mentor-rec` requires none — it's a private, on-device bookmark, not a share).
  - Honest per-action status tracking via `recordPassportConnectionAction()`, writing into the new `session.smokeCraft.passportConnections[]` array with one of the spec'd statuses: `consent_required` (shown with a lock icon, action does nothing but opens the consent panel) or `shared_locally` (recorded on the device only — never claims a real send/connect). `not_started`, `connection_pending`, and `backend_pending` are supported by the underlying status model but not currently reachable from this page (no backend exists yet to produce them).
- **Gamification loop closed**: `recordPassportConnectionAction()` writes to `session.smokeCraft.passportConnections`, which is exactly the field `smokeWinnerService.js`'s `evalPassportConnector()` already reads to evaluate the "Passport Connector" winner category (`passport.earnedStamps.length > 0` **and** `smokeCraft.passportConnections.length > 0`). Before this pass, nothing ever wrote to `passportConnections`, so that winner category could never be earned — it is now reachable through honest, consented local actions. A small local/demo XP award (`addXP(10)`, clearly local-only, not backend-verified) is given per completed action, distinct from the page's existing flat 50 XP on Continue.
- **Demo Mode**: allowed; confirmed safe — no SMS, email, or external network call is made by any action (`recordPassportConnectionAction` only updates local session state).
- **Stores state**: yes — `session.smokeCraft.passportConnections[]`, `session.smokeCraft.networkingConsent`, `session.smokeCraft.networkingStatus`. No backend write.
- **Passport/ranking/mentor/networking**: the stamp (Phase 12) and connections (Phase 13) are now linked through the same `smokeCraft` object the winner-eligibility service reads — this closes the structural gap noted in the original audit ("the stamp object doesn't carry mentor/score/badge data forward... Phase 13 has nothing rich to display").
- **Not changed in this pass (still backend pending, by design)**: `/passport/connections` (`PassportConnections.jsx`) and `/passport/events` (`PassportEvents.jsx`) still call fully mocked `delay()`-based APIs with no real route — connecting those to a real backend was explicitly out of scope for this pass (consent had to exist first, per the original Recommended Build Order). Their privacy/consent gap is **not yet addressed** — only the SmokeCraft-native `Connections.jsx` step received consent gating in this pass.

## Gamification Gap Map

| Point source | Phase | Implemented? | Evidence |
|---|---|---|---|
| Profile points | 1 | Yes | `XP_AWARDS.PROFILE_COMPLETE` = 50 |
| Format selection points | 2 | Yes | per-shape XP, 20–45 |
| Seed & Soil points | 3 | Yes | `addXP(100)` + pairing-score-based adjustment |
| Mentor selection points | 4 | Yes | `XP_AWARDS.MENTOR_SELECTED` = 75 |
| Gold Box points | 5 | Yes | `addXP(25)` + badge |
| Cut/light points | 7 | Yes | variable, by completed-step count |
| First third points | 8 | Yes | formula-based |
| Second third points | 9 | Yes | formula-based |
| Final third points | 10 | Yes | formula-based |
| Pairing review points | 6 | **Not found as a distinct award** — Phase 6 awards points for the humidor-match/request-purchase steps, not a "pairing review" specifically |
| Final review points | 11 | Yes | `addXP(100)` on Scorecard completion |
| Passport stamp | 12 | Yes | `XP_AWARDS.PASSPORT_STAMP` |
| Networking action points | 13 | **Updated — now implemented** — `recordPassportConnectionAction()` + `addXP(10)` per completed, consented action in `Connections.jsx`; honestly labeled local/demo, not backend-verified |
| Ranking levels | 11 | **Resolved** — `getProtocolRankingLevel()` in `src/utils/smokecraftScoring.js` maps the Phase 11 score percentage onto the same four named tiers (Novice/Enthusiast/Connoisseur/Aficionado, sourced from `RANKS` in `src/constants/session.js`), separate from the pre-existing XP-based `session.rank` and from the winner-category service |
| Badges | 11 | **Resolved** — `computeProtocolBadges()` implements all 10 named badges (First Smoke, Perfect Draw, Seed & Soil Explorer, Maduro Minded, Dominican Route, Pairing Pro, Slow Burn Master, Lounge Certified, Mentor Approved, Gold Box Finisher) against real session data, additive to and distinct from the pre-existing 13-category `smokeWinnerService.js` winner system |

**Headline gap (updated)**: the gamification chain is now real and wired from Phase 1 through Phase 13 — Phase 13 actions write to `session.smokeCraft.passportConnections`, which `evalPassportConnector()` already reads, so the "Passport Connector" winner category is reachable for the first time. The remaining gaps are Phase 6's recommendation-logic naming and Phase 11's ranking-tier-name confirmation, neither of which were in scope for this pass.

## 360 Passport Connection Chain

- **SmokeCraft stamp feeds 360 Passport Connections?** Yes, and **no longer thin** — `buildStampPayload()` (`PassportStamp.jsx`) now carries venue, event, date, cigar name/type, burn time, mentor names/ids, score, ranking level, badge(s) earned, pairing-completed, seed region, soil selections, networking status, and share-consent snapshot forward onto the stamp object via `awardStamp()`'s new `extra` parameter. `cigarCountry`/`wrapper`/`strength` remain honestly `null` (Phase 3 only stores a seed-region id, not country/wrapper/strength as session fields) and are shown with a "Backend pending" UI fallback rather than invented values.
- **Networking actions connect properly?** Now honestly local/demo: 9 named actions in `Connections.jsx` write a real, consented `shared_locally` status into session state (no fake send/connect claim). The deeper `/passport/connections` and `/passport/events` API layers (`PassportConnections.jsx`/`PassportEvents.jsx`) are unchanged in this pass and remain fully mocked/backend-pending.
- **Mentor history preserved?** Yes — `session.mentors[].name/id` now flow into the stamp payload (`mentorNames`/`mentorIds`) and are displayed on the Stamp Detail Card.
- **Privacy/consent respected?** Yes, for the SmokeCraft-native `Connections.jsx` step — a consent panel with the 8 spec'd fields gates every sharing action, with the exact required copy ("Your SmokeCraft Passport details are only shared when you choose to share them.") shown above the action list. The separate `/passport/connections` and `/passport/events` pages were **not** touched in this pass and still have no consent layer.
- **No separate legacy passport logic conflicts?** Confirmed — zero references to "Passport Legacy" anywhere in the repository; this pass added no new passport system, only enriched the existing one.

## Demo Mode Gap Map

Every SmokeCraft and Passport route is allowed in Demo Mode (none appear in
`DEMO_BLOCKED_PATHS`, `src/context/DemoModeContext.jsx:24-48`). This means
Demo Mode currently exercises the **entire** protocol end to end, including
all of the partial/gap areas above. **Updated**: `Connections.jsx` now
explicitly discloses, in-UI, that "Networking is local/demo only today — no
real backend connection, SMS, or email is sent yet," which is exactly the
visible Backend Pending disclosure this section previously called for —
Phase 13 no longer reads as a finished real-networking feature to a demo
reviewer. No action sends a real SMS/email or makes any external network
call; every Phase 13 action only writes to local session state. The
`/passport/connections` and `/passport/events` pages were not touched and
still lack an equivalent disclosure — they remain a residual gap.

## Grep Checks

| Check | Result |
|---|---|
| `/smokecraft` route entries | 17 confirmed in `src/App.jsx` |
| `/passport` route entries | 9 confirmed in `src/App.jsx` |
| `demoBlocked` | Present on every gated `<Route>` in `App.jsx` (POS3/E.A.T./Admin/Founder/etc.); SmokeCraft/Passport routes do not carry it, by design |
| `DEMO_BLOCKED_PATHS` | Defined once, `src/context/DemoModeContext.jsx:24-48`; contains 22 paths, none under `/smokecraft` or `/passport` |
| `ProtectedRoute` | Used in 4 files |
| `href="#"` | 1 match — `src/pages/Admin.jsx:1675`, which is an explanatory **code comment**, not a real dead link |
| `onClick={() => {}}` | 0 matches |
| Fake backend claims (heuristic) | 0 matches |
| Fake SMS/email delivery claims | 0 matches |
| `REQUIRED CIGAR PHOTO MISSING` / "Required cigar photo missing" | 1 match — `src/pages/smokecraft/Format.jsx:31`, the real honest-fallback implementation, not a fake claim |
| "Passport Legacy" / "PassportLegacy" | 0 matches anywhere in the repo |

## Recommended Build Order

1. ~~**Phase 13 privacy/consent**~~ — **Done in this pass**: `Connections.jsx` now gates every sharing action behind the 8 spec'd consent fields, with the required privacy copy shown up front.
2. ~~**Phase 12 stamp enrichment**~~ — **Done in this pass**: `buildStampPayload()` attaches mentor names/ids, cigar name/type, burn time, score, badge(s), ranking level, pairing-completed, seed region/soil, networking status, and share-consent snapshot to the stamp object via `awardStamp()`'s new `extra` parameter.
3. **Phase 4 → 7/8/9/10 mentor wiring** — surface the selected mentor's guidance on the cut/toast/light and tasting pages, fulfilling the spec's "mentors guide cutting, toasting, lighting..." requirement.
4. ~~**Phase 11 ranking-tier confirmation**~~ — **Done.** `src/utils/smokecraftScoring.js` implements the 13 named score categories, the Novice/Enthusiast/Connoisseur/Aficionado tier mapping, and the full 10-badge list, all additive to the pre-existing `smokeWinnerService.js`.
5. **Phase 6 recommendation logic** — implement Best Match / Step-Up Pick / Venue Featured Pick using existing pairing-score and mentor data, rather than only storage-condition selection.
6. **Phase 5 rules content** — add the actual no-fake-scoring/age/etiquette/purchase rules text and the three distinct Accept Rules / View Scoring / Start Session actions.
7. **Phase 2 photography** — replace the four reused-photo shapes (Lancero, Belicoso, Perfecto, Panetela) with dedicated images.
8. **Phase 13 backend wiring** — connect `passportConnectionsApi.js`/`passportEventsApi.js` to real routes now that consent (item 1) is in place, following the same pattern already proven for SmokeCraft sessions.

## Honest Verdict (updated)

SmokeCraft is **not** reducible to Intake/Passport/Mentor/Seed & Soil/
Leaderboard — all 14 phases (0–13) have real, navigable implementations, and
the gamification chain is now wired from Phase 1 through Phase 13: Phase 13
networking actions write honest, consented local state that the existing
"Passport Connector" winner category already reads, and the Phase 12 stamp
now carries mentor, score, badge, ranking, and pairing data forward instead
of being a bare claim of a stamp. What remains **not fully built to spec**:
`cigarCountry`/`wrapper`/`strength` are honestly null pending a Phase 3 data
shape change; `/passport/connections` and `/passport/events` still have no
real backend and no consent layer of their own; several tasting/rules/
recommendation phases (5, 6, 7, 8, 9, 10) implement a simplified version of
their spec rather than every named sub-element; and the Phase 11
ranking-tier-name claim still needs direct verification rather than being
assumed.

**Demo Mode readiness**: every phase is reachable and functions in Demo
Mode today, with no routing blocks needed. Phase 13 now visibly discloses,
in-UI, that networking is local/demo only with no real backend/SMS/email —
closing the disclosure gap this section previously flagged for that phase.
`/passport/connections` and `/passport/events` still lack an equivalent
disclosure and remain a residual gap for a future pass.

**Conclusion**: SmokeCraft is demo-ready as an experience walkthrough, with
Phase 12 and Phase 13 now meaningfully strengthened and connected into the
existing gamification/winner system. Further SmokeCraft development should
follow the Recommended Build Order above rather than assuming any phase
beyond what is documented here as "Live" is finished.
