# Canonical Session Inventory

Single canonical source: `src/constants/session.js`'s `VISIT_STRUCTURE`
(the locked 27-session/6-phase spine, "Package J" — confirmed as the
sole canonical source; no conflicting session registry was found. A
second, unrelated, non-matching array exists earlier in the same file
but is explicitly commented as legacy/unused and not consumed by any
live route — confirmed by the file's own comments, not a live
conflict).

21 distinct primary session components (6 sessions are merged into a
sibling session's component per `mergedInto`, sharing one route/screen
— e.g. session 9 merges into 8's `/smokecraft/first-third`). This
pass's manifest covers the 21 distinct components, consistent with
every prior audit pass's own scope.

| Session | Phase | Title | Route | Component |
|---|---|---|---|---|
| 1 | 1 | Welcome to Today's Experience | /smokecraft/welcome | WelcomeExperience.jsx |
| 2 | 1 | Choose Your Cigar | /smokecraft/humidor-match | HumidorMatch.jsx |
| 3 | 1 | Meet Your Cigar | /smokecraft/meet-your-cigar | MeetYourCigar.jsx |
| 4 | 1 | Terroir | /smokecraft/terroir | Terroir.jsx |
| 5 | 1 | Construction Inspection | /smokecraft/format | Format.jsx |
| 6 | 1 | Choose Your Cut | /smokecraft/cut-toast-light | CutToastLight.jsx |
| 7 | 1 | Lighting Tutorial | /smokecraft/lighting-tutorial | LightingTutorial.jsx |
| 8 (serves 9) | 2 | First Draw | /smokecraft/first-third | FirstThird.jsx |
| 10 | 2 | Flavor Memory Exercise | /smokecraft/flavor-memory | FlavorMemory.jsx |
| 11 | 2 | Suggested Pairings | /smokecraft/pairing-lab | PairingLab.jsx |
| 12 (serves 13) | 3 | Flavor Evolution | /smokecraft/second-third | SecondThird.jsx |
| 14 | 3 | Mentor Commentary | /smokecraft/mentor-commentary | MentorCommentary.jsx |
| 15 | 3 | Knowledge Drop | /smokecraft/knowledge-drop | KnowledgeDrop.jsx |
| 16 (serves 17,18) | 4 | Flavor Finish | /smokecraft/final-third | FinalThird.jsx |
| 19 (serves 20) | 5 | Rate Every Category | /smokecraft/scorecard | Scorecard.jsx |
| 21 | 6 | Session Summary | /smokecraft/ai-summary | AISummary.jsx |
| 22 | 6 | Personalized Pairing Recommendations | /smokecraft/pairing-recommendations | PairingRecommendations.jsx |
| 23 | 6 | Passport Stamp Animation | /smokecraft/passport-stamp | PassportStamp.jsx |
| 24 | 6 | Completed Scorecard | /smokecraft/final-review | FinalReview.jsx |
| 25 (serves 26) | 6 | Rewards and XP | /smokecraft/rewards | Rewards.jsx |
| 27 | 6 | Recommended Next Journey | /smokecraft/session-complete | SessionComplete.jsx |

No canonical-source conflict was found — proceeding was safe.
