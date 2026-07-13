# SmokeCraft Full Recovery Matrix
Generated: 2026-07-13 | Branch: recovery/smokecraft-codex-final | Base: 66531672

## Legend
- ✅ Correct / No action
- ⚠️ Correction applied this session
- ❌ Defect remains / blocked

---

| # | Route | Session | Component | Approved Asset | Asset Match | Real Controls | Duplicate UI | Unauth Bar | Floating Menu | Routing | Fix Applied |
|---|-------|---------|-----------|---------------|-------------|---------------|--------------|------------|---------------|---------|-------------|
| 1 | /smokecraft | 1 | SmokeCraft.jsx | smokecraft-landing.png | ✅ | ✅ nav chips | ⚠️ floating panel over image | ⚠️ giant session bar | ⚠️ SECONDARY_NAV | ✅ | Remove floating panel + bar; add inline nav |
| 2 | /smokecraft/enroll | 2 | Enroll.jsx | smokecraft-entry-gate.png | ✅ | ✅ Begin button | ✅ | ✅ | ✅ | ✅ continue→identity | None |
| 3 | /smokecraft/identity | 3 | Identity.jsx | IDENTY.png | ✅ | ⚠️ only nav bar | ⚠️ giant Start/Continue bar | ⚠️ giant bar | ✅ | ✅ →golden-box | Add real form (Name/Email/etc.) |
| 4 | /smokecraft/golden-box | 3 | GoldenBox.jsx | GOLDEN BOX RULES.png | ✅ | ⚠️ only checkbox | ✅ | ✅ | ✅ | ✅ →mentor-selection | Add guest+venue form |
| 5 | /smokecraft/mentor-selection | 4 | Mentor.jsx | MENTOR SELECTION1.png | ✅ | ✅ mentor chips | ✅ | ✅ | ✅ | ✅ →format | None |
| 6 | /smokecraft/format | 5 | Format.jsx | smokecraft-vitola.png | ✅ (vitola=format ref) | ✅ format chips | ✅ | ✅ | ✅ | ✅ →seed-soil | None |
| 7 | /smokecraft/wrapper-strength | 6 | WrapperStrength.jsx | (redirect) | N/A | N/A | ✅ | ✅ | ✅ | ✅ →seed-soil | None (redirect correct) |
| 8 | /smokecraft/seed-soil | 7 | SeedSoil.jsx | SEED & SOIL.png | ✅ | ✅ chips | ✅ | ✅ | ✅ | ✅ →pairing-lab | None |
| 9 | /smokecraft/pairing-lab | 8 | PairingLab.jsx | PAIRING LAB1.png | ✅ | ✅ chips | ✅ | ✅ | ✅ | ✅ →humidor-match | None |
| 10 | /smokecraft/humidor-match | 9 | HumidorMatch.jsx | humidor match 111.png | ✅ | ✅ full form | ✅ | ✅ | ✅ | ✅ →request-purchase | None |
| 11 | /smokecraft/request-purchase | 10 | RequestPurchase.jsx | REQUEST PURCHASE.png | ✅ | ✅ cards | ✅ | ✅ | ✅ | ✅ →cut-toast-light | None |
| 12 | /smokecraft/cut-toast-light | 11 | CutToastLight.jsx | CUT, TOAST,& LIGHT22.png | ✅ | ✅ chips | ✅ | ✅ | ✅ | ✅ →first-third | None |
| 13 | /smokecraft/first-third | 12 | FirstThird.jsx | FIRST THIRD1.png | ✅ | ✅ sliders | ✅ | ✅ | ✅ | ✅ →second-third | None |
| 14 | /smokecraft/second-third | 13 | SecondThird.jsx | SECOND THIRD.png | ✅ | ✅ sliders | ✅ | ✅ | ✅ | ✅ →flavor-memory | None |
| 15 | /smokecraft/flavor-memory | 14 | FlavorMemory.jsx | FLAVOR MEMORY.png | ✅ | ✅ 18-flavor | ✅ | ✅ | ✅ | ✅ →final-third | None |
| 16 | /smokecraft/final-third | 15 | FinalThird.jsx | FINAL THIRD.png | ✅ | ✅ full form | ✅ | ✅ | ✅ | ✅ →scorecard | None |
| 17 | /smokecraft/scorecard | 16 | Scorecard.jsx | Scorecard.png | ✅ | ✅ calculated | ✅ | ✅ | ✅ | ✅ →final-review | None |
| 18 | /smokecraft/final-review | 17 | FinalReview.jsx | FINAL REVIEW.png | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ →passport-stamp | None |
| 19 | /smokecraft/passport-stamp | 18 | PassportStamp.jsx | PASSPORT STAMP.png | ✅ | ✅ full form | ✅ | ✅ | ✅ | ✅ →connections | None |
| 20 | /smokecraft/connections | 19 | Connections.jsx | CONNECTIONS.png | ⚠️ no asset set | ✅ action cards | ✅ | ✅ | ✅ | ✅ →management-sync | Verify asset |
| 21 | /smokecraft/management-sync | 20 | ManagementSync.jsx | MANAGEMENT SYNC.png | ✅ | ✅ truthful | ✅ | ✅ | ✅ | ✅ →session-complete | None |
| 22 | /smokecraft/session-complete | 21 | SessionComplete.jsx | SESSION COMPLETE.png | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | None |
| 23 | /smokecraft/leaderboard | - | Leaderboard.jsx | smokecraft-leaderboard.png | ✅ | ✅ back btn | ✅ | ✅ | ✅ | ✅ | None |
| 24 | /smokecraft/event-challenge | - | EventChallenge.jsx | smokecraft-event-challenge.png | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | None |
| 25 | /smokecraft/how-it-works | - | HowItWorks.jsx | smokecraft-how-it-works.png | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ →enroll | None |

---

## Internal Journey Routes

| Route | Component | Status |
|-------|-----------|--------|
| /smokecraft/smokecraft-challenge | SmokeCraftChallenge.jsx | ✅ side route |
| /smokecraft/second-humidor | SecondHumidorMatch.jsx | ✅ side route |
| /smokecraft/mini-tasting | MiniTastingRound.jsx | ✅ side route |
| /smokecraft/visit-complete | VisitComplete.jsx | ✅ side route |

---

## Corrections Applied This Session

1. **Landing** — Removed floating SECONDARY_NAV 6-chip panel (bottom:168, zIndex:400). Removed SmokeCraftNavBar "Start New SmokeCraft Session" / "Continue" giant bars. Added clean inline navigation row below the image composition.

2. **Identity** — Removed SmokeCraftNavBar with giant "Start New SmokeCraft Session →" and "Continue Previous Session". Added real form: Full Name, Email, Preferred Name, Birth Date, Country, Experience Level, Focus Areas. Added "Begin My Journey" CTA and "← Back" link. localStorage persistence.

3. **GoldenBox** — Expanded from single checkbox to full Guest Information + Venue Information + Rule Acknowledgement form. Retained GOLDEN BOX RULES.png background. Retained acknowledgement gate. Added localStorage persistence for all fields.

4. **Connections** — Verified asset path (CONNECTIONS.png).

---

## Routing Contract (Verified)

```
landing → enroll → identity → golden-box → mentor-selection → format
→ (wrapper-strength redirects →) seed-soil → pairing-lab → humidor-match
→ request-purchase → cut-toast-light → first-third → second-third
→ flavor-memory → final-third → scorecard → final-review → passport-stamp
→ connections → management-sync → session-complete
```
