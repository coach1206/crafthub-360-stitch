# SmokeCraft Route Matrix (Prompt 1 — programmatically generated)

Generated from `src/App.jsx` lines 326-584 (the `/smokecraft` parent route group) at commit `d6469504a2a83ab4acfb27e89a25064d505d4d55`. This is a mechanical extraction of every `<Route>` JSX element in that block — not hand-transcribed — so it cannot silently drift from the actual router.

**Total routes found in the /smokecraft group: 109**

| # | Path (relative to /smokecraft) | Index route | Element (raw JSX) |
|---|---|---|---|
| 1 | `smokecraft` | no | `<SmokeCraftJourneyProvider><SmokeCraftProgressProvider><SmokeCraftOrderProvider><Outlet /></SmokeCraftOrderProvider></SmokeCraftProgressProvider></SmokeCraftJou` |
| 2 | `(index)` | yes | `<SmokeCraftSessionGuard sessionNumber={1} enforceEntryReadiness={false` |
| 3 | `welcome` | no | `<SmokeCraftSessionGuard sessionNumber={1` |
| 4 | `enroll` | no | `<SmokeCraftSessionGuard requires="entry"><Enroll /></SmokeCraftSessionGuard>` |
| 5 | `venue-select` | no | `<SmokeCraftSessionGuard requires="identity"><VenueSelect /></SmokeCraftSessionGuard>` |
| 6 | `intake` | no | `<Navigate to="/smokecraft/enroll" replace />` |
| 7 | `entry` | no | `<Navigate to="/smokecraft" replace />` |
| 8 | `profile` | no | `<Navigate to="/smokecraft/identity" replace />` |
| 9 | `education` | no | `<Navigate to="/smokecraft/format" replace />` |
| 10 | `mentors` | no | `<Navigate to="/smokecraft/mentor-selection" replace />` |
| 11 | `humidor` | no | `<Navigate to="/smokecraft/humidor-match" replace />` |
| 12 | `light` | no | `<Navigate to="/smokecraft/cut-toast-light" replace />` |
| 13 | `complete` | no | `<Navigate to="/smokecraft/session-complete" replace />` |
| 14 | `(index)` | yes | `<SmokeCraftSessionGuard requires="entry"><GoldenBox /></SmokeCraftSessionGuard>` |
| 15 | `status` | no | `<GoldenBoxStatus />` |
| 16 | `competitions` | no | `<GoldenBoxHub />` |
| 17 | `competitions/:competitionId` | no | `<GoldenBoxCompetitionDetail />` |
| 18 | `entries/:entryId/blend` | no | `<GoldenBoxEntryWorkspace />` |
| 19 | `results/:competitionId` | no | `<GoldenBoxResultsExperience />` |
| 20 | `judge` | no | `<GoldenBoxJudgeDashboard />` |
| 21 | `judge/entries/:entryId` | no | `<GoldenBoxJudgeEntryReview />` |
| 22 | `mentor/entries/:entryId` | no | `<GoldenBoxMentorReview />` |
| 23 | `packaging-studio` | no | `<PackagingStudioDashboard />` |
| 24 | `packaging-studio/new` | no | `<PackagingStudioDashboard />` |
| 25 | `packaging-studio/:designId` | no | `<PackagingStudioEditor />` |
| 26 | `packaging-studio/:designId/preview` | no | `<PackagingStudioEditor />` |
| 27 | `packaging-studio/:designId/versions` | no | `<PackagingStudioVersions />` |
| 28 | `packaging-studio/:designId/share` | no | `<PackagingStudioShare />` |
| 29 | `packaging-review/:shareToken` | no | `<PackagingReview />` |
| 30 | `gold-box` | no | `<Navigate to="/smokecraft/golden-box" replace />` |
| 31 | `art` | no | `<Art />` |
| 32 | `mentor-selection` | no | `<SmokeCraftSessionGuard requires="entry"><Mentor /></SmokeCraftSessionGuard>` |
| 33 | `mentor` | no | `<Navigate to="/smokecraft/mentor-selection" replace />` |
| 34 | `humidor-match` | no | `<SmokeCraftSessionGuard sessionNumber={2` |
| 35 | `meet-your-cigar` | no | `<SmokeCraftSessionGuard sessionNumber={3` |
| 36 | `terroir` | no | `<SmokeCraftSessionGuard sessionNumber={4` |
| 37 | `format` | no | `<SmokeCraftSessionGuard sessionNumber={5` |
| 38 | `shape-size-burn` | no | `<Navigate to="/smokecraft/format" replace />` |
| 39 | `cigar-gauge-guide` | no | `<SmokeCraftSessionGuard sessionNumber={5` |
| 40 | `wrapper-strength` | no | `<SmokeCraftSessionGuard requires="format"><WrapperStrength /></SmokeCraftSessionGuard>` |
| 41 | `seed-soil` | no | `<SmokeCraftSessionGuard requires="mentor"><SeedSoil /></SmokeCraftSessionGuard>` |
| 42 | `cut-toast-light` | no | `<SmokeCraftSessionGuard sessionNumber={6` |
| 43 | `lighting-tutorial` | no | `<SmokeCraftSessionGuard sessionNumber={7` |
| 44 | `first-third` | no | `<SmokeCraftSessionGuard sessionNumber={8` |
| 45 | `flavor-memory` | no | `<SmokeCraftSessionGuard sessionNumber={10` |
| 46 | `pairing-lab` | no | `<SmokeCraftSessionGuard sessionNumber={11` |
| 47 | `request-purchase` | no | `<SmokeCraftSessionGuard requires="humidor-match"><RequestPurchase /></SmokeCraftSessionGuard>` |
| 48 | `second-third` | no | `<SmokeCraftSessionGuard sessionNumber={12` |
| 49 | `mentor-commentary` | no | `<SmokeCraftSessionGuard sessionNumber={14` |
| 50 | `knowledge-drop` | no | `<SmokeCraftSessionGuard sessionNumber={15` |
| 51 | `knowledge-check-demo` | no | `<SmokeCraftSessionGuard requires="entry"><KnowledgeCheckDemo /></SmokeCraftSessionGuard>` |
| 52 | `mini-tasting-module` | no | `<SmokeCraftSessionGuard requires="entry"><MiniTasting /></SmokeCraftSessionGuard>` |
| 53 | `final-third` | no | `<SmokeCraftSessionGuard sessionNumber={16` |
| 54 | `scorecard` | no | `<SmokeCraftSessionGuard sessionNumber={19` |
| 55 | `smokecraft-challenge` | no | `<SmokeCraftSessionGuard requires="scorecard"><SmokeCraftChallenge /></SmokeCraftSessionGuard>` |
| 56 | `challenge` | no | `<Navigate to="/smokecraft/smokecraft-challenge" replace />` |
| 57 | `second-humidor-match` | no | `<SmokeCraftSessionGuard requires="scorecard"><SecondHumidorMatch /></SmokeCraftSessionGuard>` |
| 58 | `mini-tasting` | no | `<SmokeCraftSessionGuard requires="scorecard"><MiniTastingRound /></SmokeCraftSessionGuard>` |
| 59 | `mini-tasting-round` | no | `<Navigate to="/smokecraft/mini-tasting" replace />` |
| 60 | `ai-summary` | no | `<SmokeCraftSessionGuard sessionNumber={21` |
| 61 | `pairing-recommendations` | no | `<SmokeCraftSessionGuard sessionNumber={22` |
| 62 | `passport-stamp` | no | `<SmokeCraftSessionGuard sessionNumber={23` |
| 63 | `connections` | no | `<SmokeCraftSessionGuard requires="passport-stamp"><Connections /></SmokeCraftSessionGuard>` |
| 64 | `management-sync` | no | `<SmokeCraftSessionGuard requires="passport-stamp"><ManagementSync /></SmokeCraftSessionGuard>` |
| 65 | `management-sync/analytics` | no | `<ManagementSyncAnalytics />` |
| 66 | `final-review` | no | `<SmokeCraftSessionGuard sessionNumber={24` |
| 67 | `rewards` | no | `<SmokeCraftSessionGuard sessionNumber={25` |
| 68 | `skill-tree` | no | `<SmokeCraftSessionGuard requires="entry"><SkillTree /></SmokeCraftSessionGuard>` |
| 69 | `collections` | no | `<SmokeCraftSessionGuard requires="entry"><CollectionsCenter /></SmokeCraftSessionGuard>` |
| 70 | `challenge-hub` | no | `<SmokeCraftSessionGuard requires="entry"><ChallengeHub /></SmokeCraftSessionGuard>` |
| 71 | `challenges/blend-fault-identification` | no | `<SmokeCraftSessionGuard requires="entry"><BlendFaultChallenge /></SmokeCraftSessionGuard>` |
| 72 | `filler-arrangement` | no | `<SmokeCraftSessionGuard requires="entry"><FillerArrangement /></SmokeCraftSessionGuard>` |
| 73 | `session-complete` | no | `<SmokeCraftSessionGuard sessionNumber={27` |
| 74 | `visit-complete` | no | `<VisitComplete />` |
| 75 | `origins` | no | `<Origins />` |
| 76 | `curation` | no | `<Curation />` |
| 77 | `leaves` | no | `<Leaves />` |
| 78 | `leaf-challenge` | no | `<LeafChallenge />` |
| 79 | `leaf-challenge-calculating` | no | `<LeafChallengeCalculating />` |
| 80 | `leaf-challenge-result` | no | `<LeafChallengeResult />` |
| 81 | `cultivation` | no | `<Cultivation />` |
| 82 | `blend` | no | `<Blend />` |
| 83 | `flavor-dna` | no | `<FlavorDNA />` |
| 84 | `pairing` | no | `<Pairing />` |
| 85 | `available` | no | `<Available />` |
| 86 | `assistant` | no | `<Assistant />` |
| 87 | `pairing-mastery` | no | `<PairingMastery />` |
| 88 | `vitola` | no | `<Vitola />` |
| 89 | `identity` | no | `<SmokeCraftSessionGuard requires="enroll"><Identity /></SmokeCraftSessionGuard>` |
| 90 | `resume` | no | `<SmokeCraftSessionGuard requires="enroll"><ResumeJourney /></SmokeCraftSessionGuard>` |
| 91 | `leaderboard` | no | `<Leaderboard />` |
| 92 | `rewards-center` | no | `<RewardsCenter />` |
| 93 | `event-challenge` | no | `<EventChallenge />` |
| 94 | `how-it-works` | no | `<HowItWorks />` |
| 95 | `demo-reset` | no | `<SmokeCraftDemoReset />` |
| 96 | `session/start` | no | `<Navigate to="/smokecraft/enroll" replace />` |
| 97 | `guest-pass` | no | `<GuestPass />` |
| 98 | `demo` | no | `<Demo />` |
| 99 | `scan` | no | `<Scan />` |
| 100 | `passport` | no | `<SmokeCraftPassport />` |
| 101 | `crafthub` | no | `<SmokeCraftCraftHub />` |
| 102 | `menu` | no | `<SmokeCraftMenu />` |
| 103 | `venue-commerce` | no | `<SmokeCraftVenueCommerce />` |
| 104 | `order` | no | `<SmokeCraftVenueCommerce />` |
| 105 | `ticket-tapper/staff-specials` | no | `<SmokeCraftVenueCommerce />` |
| 106 | `cart` | no | `<SmokeCraftCart />` |
| 107 | `checkout` | no | `<SmokeCraftCheckout />` |
| 108 | `payment-success` | no | `<SmokeCraftPaymentSuccess />` |
| 109 | `order-status` | no | `<SmokeCraftOrderStatus />` |

## Notes

- This list is every route registered directly under the `/smokecraft` path prefix in the single-page router (`src/App.jsx`). It does not include routes registered under other top-level prefixes (e.g. `/crafthub`, `/passport` at the app root, `/pos3`, `/eat`) which are separate NOVEE OS modules, not part of the SmokeCraft experience.
- Nested sub-groups (e.g. `golden-box`, `passport`, `cart`) are flattened into this same list at their JSX nesting level; their full path is `/smokecraft/<parent>/<child>`.
- `Navigate` elements are redirects/aliases, not real screens — they are included and marked by their `element` column so redirect destinations are traceable.
