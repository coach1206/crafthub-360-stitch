# SmokeCraft Route Matrix (Prompt 1/2 — programmatically generated, full nested paths)

Generated from `src/App.jsx` lines 331-599 (the `/smokecraft` parent route group) at commit `67fe8f9ac872e1b784911da2a92fc15c9edc6ee7`, tracking real JSX nesting depth so full paths are reconstructed correctly (e.g. `golden-box/status` -> `/smokecraft/golden-box/status`), not just a flat list of relative path fragments.

**Total routes found in the /smokecraft group: 113**

| # | Full path | Index | Element (raw JSX, truncated) |
|---|---|---|---|
| 1 | `/smokecraft/(smokecraft index)` | yes | `<SmokeCraftSessionGuard sessionNumber={1} enforceEntryReadiness={false}><SmokeCraft /></SmokeCraftSessionGuard>` |
| 2 | `/smokecraft/welcome` | no | `<SmokeCraftSessionGuard sessionNumber={1}><SmokeCraftScreenRenderer screenId="session-1" /></SmokeCraftSessionGuard>` |
| 3 | `/smokecraft/enroll` | no | `<SmokeCraftSessionGuard requires="entry"><Enroll /></SmokeCraftSessionGuard>` |
| 4 | `/smokecraft/venue-select` | no | `<SmokeCraftSessionGuard requires="identity"><VenueSelect /></SmokeCraftSessionGuard>` |
| 5 | `/smokecraft/intake` | no | `<Navigate to="/smokecraft/enroll" replace />` |
| 6 | `/smokecraft/entry` | no | `<Navigate to="/smokecraft" replace />` |
| 7 | `/smokecraft/profile` | no | `<Navigate to="/smokecraft/identity" replace />` |
| 8 | `/smokecraft/education` | no | `<Navigate to="/smokecraft/format" replace />` |
| 9 | `/smokecraft/mentors` | no | `<Navigate to="/smokecraft/mentor-selection" replace />` |
| 10 | `/smokecraft/humidor` | no | `<Navigate to="/smokecraft/humidor-match" replace />` |
| 11 | `/smokecraft/light` | no | `<Navigate to="/smokecraft/cut-toast-light" replace />` |
| 12 | `/smokecraft/complete` | no | `<Navigate to="/smokecraft/session-complete" replace />` |
| 13 | `/smokecraft/golden-box` | yes | `<SmokeCraftSessionGuard requires="entry"><GoldenBox /></SmokeCraftSessionGuard>` |
| 14 | `/smokecraft/golden-box/status` | no | `<GoldenBoxStatus />` |
| 15 | `/smokecraft/golden-box/competitions` | no | `<GoldenBoxHub />` |
| 16 | `/smokecraft/golden-box/competitions/:competitionId` | no | `<GoldenBoxCompetitionDetail />` |
| 17 | `/smokecraft/golden-box/entries/:entryId/blend` | no | `<GoldenBoxEntryWorkspace />` |
| 18 | `/smokecraft/golden-box/results/:competitionId` | no | `<GoldenBoxResultsExperience />` |
| 19 | `/smokecraft/golden-box/judge` | no | `<GoldenBoxJudgeDashboard />` |
| 20 | `/smokecraft/golden-box/judge/entries/:entryId` | no | `<GoldenBoxJudgeEntryReview />` |
| 21 | `/smokecraft/golden-box/mentor/entries/:entryId` | no | `<GoldenBoxMentorReview />` |
| 22 | `/smokecraft/golden-box/packaging-studio` | no | `<PackagingStudioDashboard />` |
| 23 | `/smokecraft/golden-box/packaging-studio/new` | no | `<PackagingStudioDashboard />` |
| 24 | `/smokecraft/golden-box/packaging-studio/:designId` | no | `<PackagingStudioEditor />` |
| 25 | `/smokecraft/golden-box/packaging-studio/:designId/preview` | no | `<PackagingStudioEditor />` |
| 26 | `/smokecraft/golden-box/packaging-studio/:designId/versions` | no | `<PackagingStudioVersions />` |
| 27 | `/smokecraft/golden-box/packaging-studio/:designId/share` | no | `<PackagingStudioShare />` |
| 28 | `/smokecraft/golden-box/packaging-review/:shareToken` | no | `<PackagingReview />` |
| 29 | `/smokecraft/gold-box` | no | `<Navigate to="/smokecraft/golden-box" replace />` |
| 30 | `/smokecraft/venue-humidor` | no | `<VenueHumidorBrowser />` |
| 31 | `/smokecraft/venue-humidor/checkout` | no | `<VenueHumidorCheckout />` |
| 32 | `/smokecraft/venue-humidor/order/:orderId` | no | `<VenueHumidorOrderConfirmation />` |
| 33 | `/smokecraft/venue-humidor/:cigarId` | no | `<VenueHumidorCigarDetail />` |
| 34 | `/smokecraft/art` | no | `<Art />` |
| 35 | `/smokecraft/mentor-selection` | no | `<SmokeCraftSessionGuard requires="entry"><Mentor /></SmokeCraftSessionGuard>` |
| 36 | `/smokecraft/mentor` | no | `<Navigate to="/smokecraft/mentor-selection" replace />` |
| 37 | `/smokecraft/humidor-match` | no | `<SmokeCraftSessionGuard sessionNumber={2}><SmokeCraftScreenRenderer screenId="session-2" /></SmokeCraftSessionGuard>` |
| 38 | `/smokecraft/meet-your-cigar` | no | `<SmokeCraftSessionGuard sessionNumber={3}><SmokeCraftScreenRenderer screenId="session-3" /></SmokeCraftSessionGuard>` |
| 39 | `/smokecraft/terroir` | no | `<SmokeCraftSessionGuard sessionNumber={4}><SmokeCraftScreenRenderer screenId="session-4" /></SmokeCraftSessionGuard>` |
| 40 | `/smokecraft/format` | no | `<SmokeCraftSessionGuard sessionNumber={5}><SmokeCraftScreenRenderer screenId="session-5" /></SmokeCraftSessionGuard>` |
| 41 | `/smokecraft/shape-size-burn` | no | `<Navigate to="/smokecraft/format" replace />` |
| 42 | `/smokecraft/cigar-gauge-guide` | no | `<SmokeCraftSessionGuard sessionNumber={5}><CigarGaugeGuide /></SmokeCraftSessionGuard>` |
| 43 | `/smokecraft/wrapper-strength` | no | `<SmokeCraftSessionGuard requires="format"><WrapperStrength /></SmokeCraftSessionGuard>` |
| 44 | `/smokecraft/seed-soil` | no | `<SmokeCraftSessionGuard requires="mentor"><SeedSoil /></SmokeCraftSessionGuard>` |
| 45 | `/smokecraft/cut-toast-light` | no | `<SmokeCraftSessionGuard sessionNumber={6}><SmokeCraftScreenRenderer screenId="session-6" /></SmokeCraftSessionGuard>` |
| 46 | `/smokecraft/lighting-tutorial` | no | `<SmokeCraftSessionGuard sessionNumber={7}><SmokeCraftScreenRenderer screenId="session-7" /></SmokeCraftSessionGuard>` |
| 47 | `/smokecraft/first-third` | no | `<SmokeCraftSessionGuard sessionNumber={8}><SmokeCraftScreenRenderer screenId="session-8" /></SmokeCraftSessionGuard>` |
| 48 | `/smokecraft/flavor-memory` | no | `<SmokeCraftSessionGuard sessionNumber={10}><SmokeCraftScreenRenderer screenId="session-10" /></SmokeCraftSessionGuard>` |
| 49 | `/smokecraft/pairing-lab` | no | `<SmokeCraftSessionGuard sessionNumber={11}><SmokeCraftScreenRenderer screenId="session-11" /></SmokeCraftSessionGuard>` |
| 50 | `/smokecraft/request-purchase` | no | `<SmokeCraftSessionGuard requires="humidor-match"><RequestPurchase /></SmokeCraftSessionGuard>` |
| 51 | `/smokecraft/second-third` | no | `<SmokeCraftSessionGuard sessionNumber={12}><SmokeCraftScreenRenderer screenId="session-12" /></SmokeCraftSessionGuard>` |
| 52 | `/smokecraft/mentor-commentary` | no | `<SmokeCraftSessionGuard sessionNumber={14}><SmokeCraftScreenRenderer screenId="session-14" /></SmokeCraftSessionGuard>` |
| 53 | `/smokecraft/knowledge-drop` | no | `<SmokeCraftSessionGuard sessionNumber={15}><SmokeCraftScreenRenderer screenId="session-15" /></SmokeCraftSessionGuard>` |
| 54 | `/smokecraft/knowledge-check-demo` | no | `<SmokeCraftSessionGuard requires="entry"><KnowledgeCheckDemo /></SmokeCraftSessionGuard>` |
| 55 | `/smokecraft/mini-tasting-module` | no | `<SmokeCraftSessionGuard requires="entry"><MiniTasting /></SmokeCraftSessionGuard>` |
| 56 | `/smokecraft/final-third` | no | `<SmokeCraftSessionGuard sessionNumber={16}><SmokeCraftScreenRenderer screenId="session-16" /></SmokeCraftSessionGuard>` |
| 57 | `/smokecraft/scorecard` | no | `<SmokeCraftSessionGuard sessionNumber={19}><SmokeCraftScreenRenderer screenId="session-19" /></SmokeCraftSessionGuard>` |
| 58 | `/smokecraft/smokecraft-challenge` | no | `<SmokeCraftSessionGuard requires="scorecard"><SmokeCraftChallenge /></SmokeCraftSessionGuard>` |
| 59 | `/smokecraft/challenge` | no | `<Navigate to="/smokecraft/smokecraft-challenge" replace />` |
| 60 | `/smokecraft/second-humidor-match` | no | `<SmokeCraftSessionGuard requires="scorecard"><SecondHumidorMatch /></SmokeCraftSessionGuard>` |
| 61 | `/smokecraft/mini-tasting` | no | `<SmokeCraftSessionGuard requires="scorecard"><MiniTastingRound /></SmokeCraftSessionGuard>` |
| 62 | `/smokecraft/mini-tasting-round` | no | `<Navigate to="/smokecraft/mini-tasting" replace />` |
| 63 | `/smokecraft/ai-summary` | no | `<SmokeCraftSessionGuard sessionNumber={21}><SmokeCraftScreenRenderer screenId="session-21" /></SmokeCraftSessionGuard>` |
| 64 | `/smokecraft/pairing-recommendations` | no | `<SmokeCraftSessionGuard sessionNumber={22}><SmokeCraftScreenRenderer screenId="session-22" /></SmokeCraftSessionGuard>` |
| 65 | `/smokecraft/passport-stamp` | no | `<SmokeCraftSessionGuard sessionNumber={23}><SmokeCraftScreenRenderer screenId="session-23" /></SmokeCraftSessionGuard>` |
| 66 | `/smokecraft/connections` | no | `<SmokeCraftSessionGuard requires="passport-stamp"><Connections /></SmokeCraftSessionGuard>` |
| 67 | `/smokecraft/management-sync` | no | `<SmokeCraftSessionGuard requires="passport-stamp"><ManagementSync /></SmokeCraftSessionGuard>` |
| 68 | `/smokecraft/management-sync/analytics` | no | `<ManagementSyncAnalytics />` |
| 69 | `/smokecraft/final-review` | no | `<SmokeCraftSessionGuard sessionNumber={24}><SmokeCraftScreenRenderer screenId="session-24" /></SmokeCraftSessionGuard>` |
| 70 | `/smokecraft/rewards` | no | `<SmokeCraftSessionGuard sessionNumber={25}><SmokeCraftScreenRenderer screenId="session-25" /></SmokeCraftSessionGuard>` |
| 71 | `/smokecraft/skill-tree` | no | `<SmokeCraftSessionGuard requires="entry"><SkillTree /></SmokeCraftSessionGuard>` |
| 72 | `/smokecraft/collections` | no | `<SmokeCraftSessionGuard requires="entry"><CollectionsCenter /></SmokeCraftSessionGuard>` |
| 73 | `/smokecraft/challenge-hub` | no | `<SmokeCraftSessionGuard requires="entry"><ChallengeHub /></SmokeCraftSessionGuard>` |
| 74 | `/smokecraft/challenges/blend-fault-identification` | no | `<SmokeCraftSessionGuard requires="entry"><BlendFaultChallenge /></SmokeCraftSessionGuard>` |
| 75 | `/smokecraft/filler-arrangement` | no | `<SmokeCraftSessionGuard requires="entry"><FillerArrangement /></SmokeCraftSessionGuard>` |
| 76 | `/smokecraft/session-complete` | no | `<SmokeCraftSessionGuard sessionNumber={27}><SmokeCraftScreenRenderer screenId="session-27" /></SmokeCraftSessionGuard>` |
| 77 | `/smokecraft/visit-complete` | no | `<VisitComplete />` |
| 78 | `/smokecraft/origins` | no | `<Origins />` |
| 79 | `/smokecraft/curation` | no | `<Curation />` |
| 80 | `/smokecraft/leaves` | no | `<Leaves />` |
| 81 | `/smokecraft/leaf-challenge` | no | `<LeafChallenge />` |
| 82 | `/smokecraft/leaf-challenge-calculating` | no | `<LeafChallengeCalculating />` |
| 83 | `/smokecraft/leaf-challenge-result` | no | `<LeafChallengeResult />` |
| 84 | `/smokecraft/cultivation` | no | `<Cultivation />` |
| 85 | `/smokecraft/blend` | no | `<Blend />` |
| 86 | `/smokecraft/flavor-dna` | no | `<FlavorDNA />` |
| 87 | `/smokecraft/pairing` | no | `<Pairing />` |
| 88 | `/smokecraft/available` | no | `<Available />` |
| 89 | `/smokecraft/assistant` | no | `<Assistant />` |
| 90 | `/smokecraft/pairing-mastery` | no | `<PairingMastery />` |
| 91 | `/smokecraft/vitola` | no | `<Vitola />` |
| 92 | `/smokecraft/identity` | no | `<SmokeCraftSessionGuard requires="enroll"><Identity /></SmokeCraftSessionGuard>` |
| 93 | `/smokecraft/resume` | no | `<SmokeCraftSessionGuard requires="enroll"><ResumeJourney /></SmokeCraftSessionGuard>` |
| 94 | `/smokecraft/leaderboard` | no | `<Leaderboard />` |
| 95 | `/smokecraft/rewards-center` | no | `<RewardsCenter />` |
| 96 | `/smokecraft/account` | no | `<Account />` |
| 97 | `/smokecraft/event-challenge` | no | `<EventChallenge />` |
| 98 | `/smokecraft/how-it-works` | no | `<HowItWorks />` |
| 99 | `/smokecraft/demo-reset` | no | `<SmokeCraftDemoReset />` |
| 100 | `/smokecraft/session/start` | no | `<Navigate to="/smokecraft/enroll" replace />` |
| 101 | `/smokecraft/guest-pass` | no | `<GuestPass />` |
| 102 | `/smokecraft/demo` | no | `<Demo />` |
| 103 | `/smokecraft/scan` | no | `<Scan />` |
| 104 | `/smokecraft/passport` | no | `<SmokeCraftPassport />` |
| 105 | `/smokecraft/crafthub` | no | `<SmokeCraftCraftHub />` |
| 106 | `/smokecraft/menu` | no | `<SmokeCraftMenu />` |
| 107 | `/smokecraft/venue-commerce` | no | `<SmokeCraftVenueCommerce />` |
| 108 | `/smokecraft/order` | no | `<SmokeCraftVenueCommerce />` |
| 109 | `/smokecraft/ticket-tapper/staff-specials` | no | `<SmokeCraftVenueCommerce />` |
| 110 | `/smokecraft/cart` | no | `<SmokeCraftCart />` |
| 111 | `/smokecraft/checkout` | no | `<SmokeCraftCheckout />` |
| 112 | `/smokecraft/payment-success` | no | `<SmokeCraftPaymentSuccess />` |
| 113 | `/smokecraft/order-status` | no | `<SmokeCraftOrderStatus />` |
