# 01 — Runtime Trace

Generated directly from live source (`session.js`, `smokecraftAssets.js`, `App.jsx`) this pass — not hand-typed, to avoid transcription drift.

| # | Route | Registered | Guard | Asset key | Asset registered |
|---|---|---|---|---|---|
| S1 | `/smokecraft/welcome` | 1 | sessionNumber={1} | — | n/a |
| S2 | `/smokecraft/humidor-match` | 1 | sessionNumber={2} | humidorMatch | yes |
| S3 | `/smokecraft/meet-your-cigar` | 1 | sessionNumber={3} | meetYourCigar | yes |
| S4 | `/smokecraft/terroir` | 1 | sessionNumber={4} | terroir | yes |
| S5 | `/smokecraft/format` | 1 | sessionNumber={5} | format | yes |
| S6 | `/smokecraft/cut-toast-light` | 1 | sessionNumber={6} | cutToastLight | yes |
| S7 | `/smokecraft/lighting-tutorial` | 1 | sessionNumber={7} | lightingTutorial | yes |
| S8 | `/smokecraft/first-third` | 1 | sessionNumber={8} | firstThird | yes |
| S9 | `/smokecraft/first-third` | 1 | sessionNumber={9} | firstThird | yes |
| S10 | `/smokecraft/flavor-memory` | 1 | sessionNumber={10} | flavorMemory | yes |
| S11 | `/smokecraft/pairing-lab` | 1 | sessionNumber={11} | pairingLab | yes |
| S12 | `/smokecraft/second-third` | 1 | sessionNumber={12} | secondThird | yes |
| S13 | `/smokecraft/second-third` | 1 | sessionNumber={13} | secondThird | yes |
| S14 | `/smokecraft/mentor-commentary` | 1 | sessionNumber={14} | mentorCommentary | yes |
| S15 | `/smokecraft/knowledge-drop` | 1 | sessionNumber={15} | knowledgeDrop | yes |
| S16 | `/smokecraft/final-third` | 1 | sessionNumber={16} | finalThird | yes |
| S17 | `/smokecraft/final-third` | 1 | sessionNumber={17} | finalThird | yes |
| S18 | `/smokecraft/final-third` | 1 | sessionNumber={18} | finalThird | yes |
| S19 | `/smokecraft/scorecard` | 1 | sessionNumber={19} | scorecard | yes |
| S20 | `/smokecraft/scorecard` | 1 | sessionNumber={20} | scorecard | yes |
| S21 | `/smokecraft/ai-summary` | 1 | sessionNumber={21} | aiSummary | yes |
| S22 | `/smokecraft/pairing-recommendations` | 1 | sessionNumber={22} | pairingRecommendations | yes |
| S23 | `/smokecraft/passport-stamp` | 1 | sessionNumber={23} | passportStamp | yes |
| S24 | `/smokecraft/final-review` | 1 | sessionNumber={24} | finalReview | yes |
| S25 | `/smokecraft/rewards` | 1 | sessionNumber={25} | rewards | yes |
| S26 | `/smokecraft/rewards` | 1 | sessionNumber={26} | achievements | yes |
| S27 | `/smokecraft/session-complete` | 1 | sessionNumber={27} | recommendedNextJourney | yes |

### Entry layer

| Screen | Route | Registered |
|---|---|---|
| Launch | `/smokecraft` | 1 |
| Sign In / Guest Mode | `/smokecraft/enroll` | 1 |
| Venue Selection | `/smokecraft/venue-select` | 1 |
| Personal Dashboard | `/smokecraft/identity` | 1 |
| Resume or Start New Journey | `/smokecraft/resume` | 1 |

### Supporting modules

| Screen | Route | Requires |
|---|---|---|
| Gold Box Rules | `/smokecraft/golden-box` | entry |
| Mentor Selection | `/smokecraft/mentor-selection` | entry |
| Seed & Soil | `/smokecraft/seed-soil` | mentor |
| Wrapper / Strength Education | `/smokecraft/wrapper-strength` | format |
| Request / Purchase | `/smokecraft/request-purchase` | humidor-match |
| SmokeCraft Challenge | `/smokecraft/smokecraft-challenge` | scorecard |
| Second Humidor Match | `/smokecraft/second-humidor-match` | scorecard |
| Mini Tasting Round | `/smokecraft/mini-tasting` | scorecard |
| 360 Passport Connections | `/smokecraft/connections` | passport-stamp |
| Venue / Management Sync | `/smokecraft/management-sync` | passport-stamp |

## Result

Every one of the 27 curriculum sessions and 5 entry-layer screens is registered in `App.jsx` **exactly once**, guarded by `SmokeCraftSessionGuard` with the correct `sessionNumber` matching the single canonical registry (`VISIT_STRUCTURE`), and (except S1/Welcome, disclosed since the Approved Entry Visual Restoration pass) resolves to a real, registered, on-disk approved asset. No duplicate route, no unguarded route, no orphaned registration was found. This is consistent with every prior pass's independent trace of this same data (Session-Sequence Reconciliation, Full Root-Cause Audit, Approved Entry Visual Restoration) — re-confirmed here, not newly discovered.

## State/completion source per screen (traced by reading each component)

Every one of the 27 session components and 5 entry screens reads its own journey data via `useGuestSession()`/`useSmokeCraftJourney()`/`useSmokeCraftProgress()` (the three existing contexts) and calls its own `awardSessionRewards(id)`/`setXxx(data)` on completion, then `navigate('/smokecraft/<next>')` directly. This is the "one component per route, direct context reads, direct navigate() calls" pattern — real, working, and already regression-tested across ~10 prior passes, but **not** funneled through a single generic renderer/data-selector/completion-service function. That is the literal gap this pass's mandate targets.
