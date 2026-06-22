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
- **Route/File**: `/smokecraft/golden-box` → `src/pages/smokecraft/GoldenBox.jsx`.
- **Status**: **Partial**. The page presents a journey map (mentor → origins → cultivation → blending → identity) and unlockable content (Vitola Profile, Stamp Collection, Identity Card, Lounge Privileges), gated behind a single "Accept" action that awards XP and a "Golden Invitation" badge before continuing. It does **not** display the specific required rules content: no explicit no-fake-scoring statement, no underage-participation rule, no lounge-etiquette text, and no separate "View Scoring" button — there is one combined accept/continue action, not three distinct buttons (Accept Rules / View Scoring / Start Session) as spec'd.
- **Demo Mode**: allowed.
- **Stores state**: yes — `session.smokeCraft.goldenBox.accepted`, badge added to `session.badges`.
- **Gamification**: yes — 25 XP + "Golden Invitation" badge on accept; `completeStep('golden-box')`.
- **Passport/ranking/mentor/networking**: badge only, no stamp.
- **Missing**: the actual rules text (anti-cheating, age, etiquette, purchase rules) and the three distinct required buttons.

### Phase 6 — Cigar Recommendation / Humidor Match

- **Purpose**: recommend Best Match / Step-Up Pick / Venue Featured Pick based on profile, pairing, mentor, budget, inventory, with POS3 add/request or honest pending state.
- **Route/File**: `/smokecraft/humidor-match` → `HumidorMatch.jsx`; `/smokecraft/request-purchase` → `RequestPurchase.jsx`; `/smokecraft/available` → `Available.jsx`.
- **Status**: **Partial**. `HumidorMatch.jsx` only covers storage condition (Ideal 70/70, Dry Box, Travel Case) — not a cigar recommendation engine. `RequestPurchase.jsx` offers "Request from Humidor" or "I Have My Own Cigar" and, on a humidor request, creates a local POS3/E.A.T. handoff event (`pos3.pendingHumidorRequest`, an `eatCommand` event) — this is an honest "pending staff action" model, not a live POS write. `Available.jsx` shows cigar cards but does **not** implement the spec'd Best Match / Step-Up Pick / Venue Featured Pick triad, and does not cross-reference the user's Seed & Soil or mentor choices to rank recommendations.
- **Demo Mode**: allowed.
- **Stores state**: yes — `session.smokeCraft.humidorMatch`, `requestPurchaseChoice`, `session.pos3.pendingHumidorRequest`. No live backend write; this is the same honest local-handoff pattern documented in `docs/backend-readiness-map.md`.
- **Gamification**: yes — 100 XP (humidor match) + 25 XP (request/purchase); `completeStep()` for both.
- **Passport/ranking/mentor/networking**: none directly.
- **Missing**: the Best Match/Step-Up/Featured recommendation logic itself; any reference to mentor guidance or pairing score in the recommendation; real POS3 inventory-availability check (POS3 provider sync exists in the codebase but isn't called from this page — see `docs/backend-readiness-map.md` §1).

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
- **Route/File**: `/smokecraft/scorecard` → `Scorecard.jsx`; `src/services/smokeWinnerService.js`; `src/services/smokeLeaderboardService.js`.
- **Status**: **Partial/Live mix**. Scorecard itself rates Appearance/Construction/Flavor/Overall (1–10) and computes a final score — this is **live**. Winner-category eligibility (`calculateWinnerEligibility`, `assignWinnerCategory`, `getPendingWinnerCategories`, `getLockedWinnerCategories`) is **live and honest** — no category is auto-granted; it's computed from actual session data, consistent with the no-fake-scoring requirement. **Not confirmed**: the exact four named ranking levels (Novice/Enthusiast/Connoisseur/Aficionado) as a labeled tier system distinct from the winner-category badges — the audit found the winner-category logic but did not confirm a separate numeric-rank-to-tier-name mapping exists; this needs direct verification against `smokeWinnerService.js` before claiming it's complete.
- **Demo Mode**: allowed. Demo leaderboard entries are visually separated from the guest's real session entry (a labeled "Demo Lounge Ranking" board), which is the correct honest pattern.
- **Stores state**: yes — `session.smokeCraft.scorecard`, `finalScore`, `winnerEligibility`, `eventLog`. Also attempts a real backend write via `saveSmokeSessionSnapshot()` / `checkSmokeBackendConnectivity()` — backend-pending, with automatic local fallback if unreachable (per `docs/backend-readiness-map.md`, no environment has observed `storageMode: "postgres"` yet).
- **Gamification**: yes — 100 XP; `completeStep('scorecard')`; purchase-intent creation (`createSmokePurchaseIntent`) also logs honest pending-sync events.
- **Passport/ranking/mentor/networking**: feeds Phase 12's stamp ceremony; does not yet feed Phase 13's networking directly.
- **Missing**: explicit confirmation/labeling of the four ranking-level tier names; auth/role enforcement on the backend write/read routes this page calls (flagged as pending in `docs/backend-readiness-map.md`).

### Phase 12 — 360 Passport Stamp

- **Purpose**: award a stamp with user/venue/event/date/cigar country/type/mentor names/score/badge/pairing/networking status, **inside** the same 360 Passport Connections system — not a separate "Passport Legacy."
- **Route/File**: `/smokecraft/passport-stamp` → `PassportStamp.jsx`; stamp logic in `GuestSessionContext.jsx`'s `completeSmokeCraftSession()`/`awardStamp()`.
- **Status**: **Partial**. The stamp ceremony is live and writes into `session.passport.earnedStamps[]` — confirmed to be the **same** `session.passport` object used by every `/passport/*` page (no separate "Passport Legacy" system exists anywhere in the codebase — repo-wide grep for "Passport Legacy"/"PassportLegacy" returned zero results). However, the actual stamp object recorded (`stampId, title, craft, sessionNumber, eventName, earnedAt, visualTheme, points, sourceModule`) does **not** include several spec'd fields: mentor names, cigar country/type, score, badge earned, pairing-completed flag, or networking status. It is a generic "SmokeCraft 360 Initiation Stamp," not the rich per-session stamp the spec describes.
- **Demo Mode**: allowed.
- **Stores state**: yes — `session.passport.earnedStamps`, `latestStampId`, `passportId`. No backend write.
- **Gamification**: yes — XP awarded (`XP_AWARDS.PASSPORT_STAMP`); `completeStep('passport-stamp')`.
- **Passport/ranking/mentor/networking**: confirmed unified with `/passport/*` — **no conflicting legacy system**. Mentor names, cigar type/country, and score are **not** carried onto the stamp despite being available elsewhere in session state.
- **Missing**: enriching the stamp payload with mentor names, cigar country/type, score, badge, pairing-completed, and networking status — the data exists in session state already; it just isn't being attached to the stamp object today.

### Phase 13 — 360 Passport Connections / Networking

- **Purpose**: share stamp, exchange contact, connect with guest, join leaderboard, save mentor rec, follow venue, join cigar circle, send tasting note, networking QR — under explicit user-controlled privacy/consent.
- **Route/File**: `/passport/connections` → `PassportConnections.jsx`; `/passport/events` → `PassportEvents.jsx`; `src/api/passportConnectionsApi.js`; `src/api/passportEventsApi.js`.
- **Status**: **Local/Demo only — backend pending**. The UI is live and well-developed: Best Matches, People You Met, Suggested connections, event filters (All/Featured/VIP/Craft/Networking/Attending), and a "360 Passport Connections" stamp visual. But every API call here (`verifyConnection`, `scanConnection`, `getPassport`, `attendEvent`, `requestVipAccess`, `scanEventQr`, `unlockEventStamp`) is a `delay()`-based mock with **no real network call and no matching backend route** — this matches the existing finding already documented in `docs/backend-readiness-map.md` §2.
- **Demo Mode**: allowed (and arguably indistinguishable from a "real" session today, since both run on the same mocked API).
- **Stores state**: yes — local component/session state only.
- **Gamification**: no explicit XP award found tied to networking actions in this phase.
- **Passport/ranking/mentor/networking**: this is the **end** of the chain the spec describes, but it is not actually fed by Phase 12's stamp (the stamp object doesn't carry mentor/score/badge data forward — see Phase 12) or by Phase 4's mentor selection ("save mentor recommendation" is not implemented).
- **Privacy/consent**: **not implemented**. No consent UI, opt-in flow, or data-sharing control was found in either `PassportConnections.jsx` or `PassportEvents.jsx` — contact/event data renders without an explicit user permission step. This is a real gap against the spec's explicit privacy rule and should be treated as a requirement for the next phase of work, not a nice-to-have.

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
| Networking action points | 13 | **Missing** — no XP award tied to any Phase 13 action |
| Ranking levels | 11 | **Unconfirmed** — winner-category badge logic exists; the four named tier labels (Novice/Enthusiast/Connoisseur/Aficionado) were not directly confirmed as implemented and need direct verification before claiming completion |
| Badges | 11 | Partial — winner-category service exists and is honest (no auto-grant); exact match against all 10 named badges (First Smoke, Perfect Draw, Seed & Soil Explorer, Maduro Minded, Dominican Route, Pairing Pro, Slow Burn Master, Lounge Certified, Mentor Approved, Gold Box Finisher) was not individually verified line-by-line and should be checked directly against `smokeWinnerService.js` before claiming full coverage |

**Headline gap**: the gamification chain is real and largely wired from Phase 1 through Phase 12, but **breaks at Phase 13** — no networking action currently earns XP, and the Phase 11 ranking-tier-name mapping needs direct confirmation rather than being assumed complete from this pass.

## 360 Passport Connection Chain

- **SmokeCraft stamp feeds 360 Passport Connections?** Structurally yes (same `session.passport` object, same system, no Passport Legacy conflict) — but **functionally thin**: the stamp object itself doesn't carry mentor names, cigar details, score, or badge forward, so Phase 13 has nothing rich to display even though it's wired to the same data store.
- **Networking actions connect properly?** No — Phase 13's API layer is fully mocked; nothing it does persists or round-trips anywhere.
- **Mentor history preserved?** Partially — `session.selectedMentor`/`selectedMentorCountry` persist in session state, but nothing in Phase 12 or 13 reads or displays it.
- **Privacy/consent respected?** No — not implemented at all in the current Connections/Events UI.
- **No separate legacy passport logic conflicts?** Confirmed — zero references to "Passport Legacy" anywhere in the repository.

## Demo Mode Gap Map

Every SmokeCraft and Passport route is allowed in Demo Mode (none appear in
`DEMO_BLOCKED_PATHS`, `src/context/DemoModeContext.jsx:24-48`). This means
Demo Mode currently exercises the **entire** protocol end to end, including
all of the partial/gap areas above — a demo session will hit the same
mocked Phase 13 APIs and the same thin Phase 12 stamp as a "real" session,
because there is no functional difference between the two for SmokeCraft
today (the backend-pending areas are pending for everyone, not just demo
users). No phase needs an additional Demo Mode block; the disclosure need is
the same Backend Pending honesty already applied elsewhere in the product
(POS3/E.A.T. TopBar pill) — Phase 13 in particular should carry an equivalent
visible disclosure, since its mocked APIs could otherwise read as real to a
demo reviewer.

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

1. **Phase 13 privacy/consent** — add an explicit opt-in/consent step before any contact/event data renders; this is a real product gap, not cosmetic.
2. **Phase 12 stamp enrichment** — attach mentor names, cigar country/type, score, badge, and pairing-completed status to the stamp object already being written; the data already exists in session state.
3. **Phase 4 → 7/8/9/10 mentor wiring** — surface the selected mentor's guidance on the cut/toast/light and tasting pages, fulfilling the spec's "mentors guide cutting, toasting, lighting..." requirement.
4. **Phase 11 ranking-tier confirmation** — directly verify (or implement) the Novice/Enthusiast/Connoisseur/Aficionado tier mapping in `smokeWinnerService.js`, and confirm the full 10-badge list against spec name-by-name.
5. **Phase 6 recommendation logic** — implement Best Match / Step-Up Pick / Venue Featured Pick using existing pairing-score and mentor data, rather than only storage-condition selection.
6. **Phase 5 rules content** — add the actual no-fake-scoring/age/etiquette/purchase rules text and the three distinct Accept Rules / View Scoring / Start Session actions.
7. **Phase 2 photography** — replace the four reused-photo shapes (Lancero, Belicoso, Perfecto, Panetela) with dedicated images.
8. **Phase 13 backend wiring** — connect `passportConnectionsApi.js`/`passportEventsApi.js` to real routes once consent (item 1) is in place, following the same pattern already proven for SmokeCraft sessions.

## Honest Verdict

SmokeCraft is **not** reducible to Intake/Passport/Mentor/Seed & Soil/
Leaderboard — all 14 phases (0–13) have real, navigable implementations, and
the gamification chain is substantially wired from Phase 1 through Phase 12.
But the protocol is **not fully built to spec**: Phase 13 networking has no
real backend and no privacy/consent step, the Phase 12 stamp is thinner than
specified, several tasting/rules/recommendation phases (5, 6, 7, 8, 9, 10)
implement a simplified version of their spec rather than every named
sub-element, and the Phase 11 ranking-tier-name claim needs direct
verification rather than being assumed.

**Demo Mode readiness**: every phase is reachable and functions in Demo
Mode today, with no routing blocks needed. What Demo Mode does **not** yet
do is visibly disclose that Phase 13 (and parts of Phase 6/11/12) are
running on mocked or partial logic — the same kind of "Backend Pending"
honesty already applied to POS3/E.A.T. should be extended to Phase 13
specifically before this is shown as a finished networking feature.

**Conclusion**: SmokeCraft is demo-ready as an experience walkthrough, but
not protocol-complete. Further SmokeCraft development should follow the
Recommended Build Order above rather than assuming any phase beyond what is
documented here as "Live" is finished.
