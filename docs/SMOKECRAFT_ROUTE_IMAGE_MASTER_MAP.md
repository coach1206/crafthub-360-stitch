# SmokeCraft 360 — Route-to-Image Master Map

Every active SmokeCraft route, its current registered asset, correctness of that mapping, and rebuild classification. Cross-referenced from `smokecraftAssets.js`, `App.jsx`, `SMOKECRAFT_STATIC_SHELL_AUDIT.md`.

| Route | Component | Session | Current asset (registry key) | Mapping correct? | Screen type | Dynamic zones needing React | Package |
|---|---|---|---|---|---|---|---|
| `/smokecraft` | SmokeCraft.jsx | E1 | `landing` | ✅ Yes | Approved image, live zones | Start/Resume label, 6 destinations | A — DONE |
| `/smokecraft/enroll` | Enroll.jsx | E2 | `enroll` (now `smokecraft-guest-pass.png`) | ✅ Yes | Approved image, live zones | Activate/Explore CTAs, inline email | A — DONE |
| `/smokecraft/venue-select` | VenueSelect.jsx | E3 | none (empty state) | ✅ Yes (no image needed by design) | Fully live | Venue list (currently honest-empty) | A — DONE |
| `/smokecraft/identity` | Identity.jsx | E4 | `identity` | ✅ Yes | Fully live, bounded decorative crop | Already all React | A — DONE |
| `/smokecraft/resume` | ResumeJourney.jsx | E5 | `resume` (decorative header only) | ✅ Yes (no dedicated design exists — decision on record) | Fully live | Already all React | A — DONE |
| `/smokecraft/golden-box` | GoldenBox.jsx | Supporting | `goldenBox` | ✅ Asset correct, screen not yet rebuilt | Static image + overlay | Rules text, accept flow, reward display | A — PENDING |
| `/smokecraft/mentor-selection` | Mentor.jsx | Supporting | `mentorSelection` | ✅ Asset correct, screen not yet rebuilt | Static image + overlay | Mentor cards, selection state | A — PENDING |
| `/smokecraft/humidor-match` | HumidorMatch.jsx | S2 | `humidorMatch` | ✅ Asset correct | Partially live | Remaining card framing/labels | B |
| `/smokecraft/meet-your-cigar` | MeetYourCigar.jsx | S3 | `meetYourCigar` | ✅ Asset correct (fixed prior session — no longer collides with Humidor Match) | Fully live | — | B — LIVE |
| `/smokecraft/terroir` | Terroir.jsx | S4 | `terroir` | ✅ Asset correct | Fully live | — | B — LIVE |
| `/smokecraft/format` | Format.jsx | S5 | `format` | ✅ Asset correct | Static image + overlay | Format/vitola selection grid | B |
| `/smokecraft/request-purchase` | RequestPurchase.jsx | Supporting | `requestPurchase` | ✅ Asset correct | Partially live | Remaining purchase-flow framing | B |
| `/smokecraft/pairing-lab` | PairingLab.jsx | S11 | `pairingLab` | ✅ Asset correct | Static image + overlay | Pairing option grid | C |
| `/smokecraft/cut-toast-light` | CutToastLight.jsx | S6 | `cutToastLight` | ✅ Asset correct | Partially live | Remaining step framing/progress | C |
| `/smokecraft/lighting-tutorial` | LightingTutorial.jsx | S7 | `lightingTutorial` | ✅ Asset correct | Fully live | — | C — LIVE |
| `/smokecraft/seed-soil` | SeedSoil.jsx | Supporting | `seedSoil` | ✅ Asset correct | Static image + overlay | Selection grid | C |
| `/smokecraft/first-third` | FirstThird.jsx | S8/S9 | `firstThird` | ✅ Asset correct | Partially live | Flavor note selection UI | D |
| `/smokecraft/second-third` | SecondThird.jsx | S12/S13 | `secondThird` | ✅ Asset correct | Partially live | Same as First Third | D |
| `/smokecraft/final-third` | FinalThird.jsx | S16-18 | `finalThird` | ✅ Asset correct | Static image + overlay | Summary display | D |
| `/smokecraft/mentor-commentary` | MentorCommentary.jsx | S14 | `mentorCommentary` | ✅ Asset correct | Fully live | — | D — LIVE |
| `/smokecraft/knowledge-drop` | KnowledgeDrop.jsx | S15 | `knowledgeDrop` | ✅ Asset correct | Fully live | — | D — LIVE |
| `/smokecraft/mini-tasting` | MiniTastingRound.jsx | Supporting (spine twin) | `miniTasting` | ✅ Asset correct | Static screenshot | Entire screen | D |
| `/smokecraft/second-humidor-match` | SecondHumidorMatch.jsx | Supporting | `secondHumidorMatch` | ✅ Asset correct | Static screenshot | Entire screen | D |
| `/smokecraft/flavor-memory` | FlavorMemory.jsx | S10 | `flavorMemory` | ✅ Asset correct | Static image + overlay | Flavor wheel/grid | E |
| `/smokecraft/scorecard` | Scorecard.jsx | S19/S20 | `scorecard` | ✅ Asset correct | Partially live | Rating categories | E |
| `/smokecraft/final-review` | FinalReview.jsx | S24 | `finalReview` | ✅ Asset correct | Static image + overlay | Review summary | E |
| `/smokecraft/ai-summary` | AISummary.jsx | S21 | `aiSummary` | ✅ Asset correct | Fully live | — | E — LIVE |
| `/smokecraft/pairing-recommendations` | PairingRecommendations.jsx | S22 | `pairingRecommendations` | ✅ Asset correct | Fully live | — | E — LIVE |
| `/smokecraft/passport-stamp` | PassportStamp.jsx | S23 | `passportStamp` | ✅ Asset correct | Static image + overlay | Stamp/badge live-data refs | F |
| `/smokecraft/connections` | Connections.jsx | Supporting | `connections` | ✅ Asset correct | Static image + overlay | Connections list | F |
| `/smokecraft/management-sync` | ManagementSync.jsx | Supporting | `managementSync` | ✅ Asset correct | Static image + overlay | Status display | F |
| `/smokecraft/rewards` | Rewards.jsx | S25/S26 | `rewards`/`achievements` | ✅ Asset correct | Fully live | — | F — LIVE |
| `/smokecraft/session-complete` | SessionComplete.jsx | S27 | `sessionComplete`/`recommendedNextJourney` | ✅ Asset correct | Fully live | — | F — LIVE |
| `/smokecraft/how-it-works` | HowItWorks.jsx | Supporting | `howItWorks` | ✅ Asset correct | Static screenshot | Entire screen | G |
| `/smokecraft/leaderboard` | Leaderboard.jsx | Supporting | `leaderboard` | ✅ Asset correct | Fully live | — | G — LIVE |
| `/smokecraft/event-challenge` | EventChallenge.jsx | Supporting | `eventChallenge` | ✅ Asset correct | Fully live | — | G — LIVE |
| `/smokecraft/smokecraft-challenge` | SmokeCraftChallenge.jsx | Supporting | `smokecraftChallenge` | ✅ Asset correct | Fully live | — | G — LIVE |
| `/smokecraft/golden-box/status` | GoldenBoxStatus.jsx | Supporting sub-route | (inherits Golden Box) | ✅ Reasonable | Static screenshot | Entire screen | G |
| `/smokecraft/menu` | SmokeCraftMenu.jsx | Commerce | (commerce asset) | N/A | Static image + overlay | Out of educational-journey scope | Out of scope |

No route currently uses the **wrong** approved image or a **generic replacement layout** — the only two routes previously at risk of that (Launch, Enroll) were corrected this session and are now verified against their approved source assets.
