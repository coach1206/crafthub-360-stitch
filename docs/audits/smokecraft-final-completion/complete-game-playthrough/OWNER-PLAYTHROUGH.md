# SmokeCraft 360 — Owner Playthrough Guide

A step-by-step guide to the complete, approved SmokeCraft journey, as locked at commit `f803e48142d7d5aa666930eeac398a9df61009e2` and proven end-to-end in this pass. Follow this exactly to see the intended experience — nothing here requires guessing what should appear.

## Before you start

Use a fresh browser profile (or clear site data for the app's domain) so no prior test journey interferes. There should be no active SmokeCraft journey.

## Starting URL

`https://<your-deployed-domain>/smokecraft` (locally: `http://localhost:5050/smokecraft` against a production build, or your dev server).

## Entry sequence (in order)

| Step | Route | What you'll see | What to click |
|---|---|---|---|
| 1. Landing | `/smokecraft` | The SmokeCraft landing screen. With no active journey: a single `START SMOKECRAFT JOURNEY` button. | `START SMOKECRAFT JOURNEY` |
| 2. Enrollment | `/smokecraft/enroll` | The Enrollment/guest-pass screen. | Complete and continue |
| 3. Identity | `/smokecraft/identity` | A blank identity form — no prior name, cigar, mentor, XP, or preselected experience level/interests. | Fill in your name and continue |
| 4. Venue | `/smokecraft/venue-select` | Venue selection (or an honest "no venues connected" state with a Continue-without-venue option, if no live venue directory is configured). | Select a venue, or Continue without one |
| 5. Welcome | `/smokecraft/welcome` | Welcome to Today's Experience — shows only your current journey's data (your name, no leftover data from any earlier journey). | Continue |

## The 27-session curriculum, in exact canonical order

Six phases, 27 sessions. Every route below is reached automatically as you complete the one before it — you should never need to type a URL by hand during normal play.

**Phase 1 — Session Preparation**
| # | Route | Session |
|---|---|---|
| 1 | `/smokecraft/welcome` | Welcome to Today's Experience |
| 2 | `/smokecraft/humidor-match` | Choose Your Cigar |
| 3 | `/smokecraft/meet-your-cigar` | Meet Your Cigar |
| 4 | `/smokecraft/terroir` | Terroir |
| 5 | `/smokecraft/format` | Construction Inspection — completing this awards format XP *and* a wrapper-strength XP, then takes you to `/smokecraft/request-purchase` (a real, approved detour) before returning you to Session 6 |
| 6 | `/smokecraft/cut-toast-light` | Choose Your Cut |
| 7 | `/smokecraft/lighting-tutorial` | Lighting Tutorial |

**Phase 2 — First Third**
| # | Route | Session |
|---|---|---|
| 8 | `/smokecraft/first-third` | First Draw |
| 9 | `/smokecraft/first-third` | Flavor Discovery — same screen as Session 8, one combined completion |
| 10 | `/smokecraft/flavor-memory` | Flavor Memory Exercise |
| 11 | `/smokecraft/pairing-lab` | Suggested Pairings |

**Phase 3 — Second Third**
| # | Route | Session |
|---|---|---|
| 12 | `/smokecraft/second-third` | Flavor Evolution |
| 13 | `/smokecraft/second-third` | Construction Check — same screen as Session 12 |
| 14 | `/smokecraft/mentor-commentary` | Mentor Commentary |
| 15 | `/smokecraft/knowledge-drop` | Knowledge Drop |

**Phase 4 — Final Third**
| # | Route | Session |
|---|---|---|
| 16 | `/smokecraft/final-third` | Flavor Finish |
| 17 | `/smokecraft/final-third` | Strength Progression — same screen as Session 16 |
| 18 | `/smokecraft/final-third` | Overall Experience Notes — same screen as Session 16 |

**Phase 5 — Reflection**
| # | Route | Session |
|---|---|---|
| 19 | `/smokecraft/scorecard` | Rate Every Category |
| 20 | `/smokecraft/scorecard` | Personal Notes — same screen as Session 19 |

**Phase 6 — Results**
| # | Route | Session |
|---|---|---|
| 21 | `/smokecraft/ai-summary` | AI Summary |
| 22 | `/smokecraft/pairing-recommendations` | Personalized Pairing Recommendations |
| 23 | `/smokecraft/passport-stamp` | Passport Stamp Animation |
| 24 | `/smokecraft/final-review` | Completed Scorecard |
| 25 | `/smokecraft/rewards` | Rewards and XP |
| 26 | `/smokecraft/rewards` | Achievements — same screen as Session 25 |
| 27 | `/smokecraft/session-complete` | Recommended Next Journey — this is the Results screen; completing it brings the journey to 100% |

## Expected approved visual per screen

Every session screen shows one baked, approved background image (its "asset key" in the developer inventory is shown below) except Session 1 (Welcome), which is intentionally a live interactive component with no static approved artwork — this is a known, disclosed, correct state, not a missing image.

| # | Asset key | # | Asset key | # | Asset key |
|---|---|---|---|---|---|
| 1 | *(none — live component)* | 10 | flavorMemory | 19 | scorecard |
| 2 | humidorMatch | 11 | pairingLab | 20 | scorecard |
| 3 | meetYourCigar | 12 | secondThird | 21 | aiSummary |
| 4 | terroir | 13 | secondThird | 22 | pairingRecommendations |
| 5 | format | 14 | mentorCommentary | 23 | passportStamp |
| 6 | cutToastLight | 15 | knowledgeDrop | 24 | finalReview |
| 7 | lightingTutorial | 16 | finalThird | 25 | rewards |
| 8 | firstThird | 17 | finalThird | 26 | rewards |
| 9 | firstThird | 18 | finalThird | 27 | recommendedNextJourney |

## What to click, generally

Every screen has a `Continue`/primary action that advances you to the next session automatically — you never need to know or type the next route. A `Back` control returns you to the previous screen without losing your completed progress.

## Golden Box and Packaging Studio

Reachable from within the curriculum flow as approved supporting experiences. Golden Box: acknowledge the rules, use the Build Studio, your selections are saved automatically, and you can review/submit your entry. Packaging Studio: Materials and Finish, Structure and Interior, Band and Branding, Version and Sharing, and Review and Submit are all real, working, persisted steps.

## Expected result at the end

After Session 27, your journey reaches 100% completion. `/smokecraft/session-complete` (Results) and `/smokecraft/rewards` (Awards) are both reachable and show your real results — not placeholder/baked data. Returning to Landing afterward offers `VIEW COMPLETED JOURNEY`, and a `START NEW JOURNEY` option remains available to begin again with a clean slate (your completed history is preserved, not lost).
