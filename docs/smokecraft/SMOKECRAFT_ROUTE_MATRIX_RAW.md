# SmokeCraft Route Matrix (Prompt 1/2 — programmatically generated, full nested paths)

Generated from `src/App.jsx` lines 327-586 (the `/smokecraft` parent route group) at commit `67fe8f9ac872e1b784911da2a92fc15c9edc6ee7`, tracking real JSX nesting depth so full paths are reconstructed correctly (e.g. `golden-box/status` -> `/smokecraft/golden-box/status`), not just a flat list of relative path fragments.

**Total routes found in the /smokecraft group: 109**

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
| 30 | `/smokecraft/art` | no | `<Art />` |
| 31 | `/smokecraft/mentor-selection` | no | `<SmokeCraftSessionGuard requires="entry"><Mentor /></SmokeCraftSessionGuard>` |
| 32 | `/smokecraft/mentor` | no | `<Navigate to="/smokecraft/mentor-selection" replace />` |
| 33 | `/smokecraft/humidor-match` | no | `<SmokeCraftSessionGuard sessionNumber={2}><SmokeCraftScreenRenderer screenId="session-2" /></SmokeCraftSessionGuard>` |
| 34 | `/smokecraft/meet-your-cigar` | no | `<SmokeCraftSessionGuard sessionNumber={3}><SmokeCraftScreenRenderer screenId="session-3" /></SmokeCraftSessionGuard>` |
| 35 | `/smokecraft/terroir` | no | `<SmokeCraftSessionGuard sessionNumber={4}><SmokeCraftScreenRenderer screenId="session-4" /></SmokeCraftSessionGuard>` |
| 36 | `/smokecraft/format` | no | `<SmokeCraftSessionGuard sessionNumber={5}><SmokeCraftScreenRenderer screenId="session-5" /></SmokeCraftSessionGuard>` |
| 37 | `/smokecraft/shape-size-burn` | no | `<Navigate to="/smokecraft/format" replace />` |
| 38 | `/smokecraft/cigar-gauge-guide` | no | `<SmokeCraftSessionGuard sessionNumber={5}><CigarGaugeGuide /></SmokeCraftSessionGuard>` |
| 39 | `/smokecraft/wrapper-strength` | no | `<SmokeCraftSessionGuard requires="format"><WrapperStrength /></SmokeCraftSessionGuard>` |
| 40 | `/smokecraft/seed-soil` | no | `<SmokeCraftSessionGuard requires="mentor"><SeedSoil /></SmokeCraftSessionGuard>` |
| 41 | `/smokecraft/cut-toast-light` | no | `<SmokeCraftSessionGuard sessionNumber={6}><SmokeCraftScreenRenderer screenId="session-6" /></SmokeCraftSessionGuard>` |
| 42 | `/smokecraft/lighting-tutorial` | no | `<SmokeCraftSessionGuard sessionNumber={7}><SmokeCraftScreenRenderer screenId="session-7" /></SmokeCraftSessionGuard>` |
| 43 | `/smokecraft/first-third` | no | `<SmokeCraftSessionGuard sessionNumber={8}><SmokeCraftScreenRenderer screenId="session-8" /></SmokeCraftSessionGuard>` |
| 44 | `/smokecraft/flavor-memory` | no | `<SmokeCraftSessionGuard sessionNumber={10}><SmokeCraftScreenRenderer screenId="session-10" /></SmokeCraftSessionGuard>` |
| 45 | `/smokecraft/pairing-lab` | no | `<SmokeCraftSessionGuard sessionNumber={11}><SmokeCraftScreenRenderer screenId="session-11" /></SmokeCraftSessionGuard>` |
| 46 | `/smokecraft/request-purchase` | no | `<SmokeCraftSessionGuard requires="humidor-match"><RequestPurchase /></SmokeCraftSessionGuard>` |
| 47 | `/smokecraft/second-third` | no | `<SmokeCraftSessionGuard sessionNumber={12}><SmokeCraftScreenRenderer screenId="session-12" /></SmokeCraftSessionGuard>` |
| 48 | `/smokecraft/mentor-commentary` | no | `<SmokeCraftSessionGuard sessionNumber={14}><SmokeCraftScreenRenderer screenId="session-14" /></SmokeCraftSessionGuard>` |
| 49 | `/smokecraft/knowledge-drop` | no | `<SmokeCraftSessionGuard sessionNumber={15}><SmokeCraftScreenRenderer screenId="session-15" /></SmokeCraftSessionGuard>` |
| 50 | `/smokecraft/knowledge-check-demo` | no | `<SmokeCraftSessionGuard requires="entry"><KnowledgeCheckDemo /></SmokeCraftSessionGuard>` |
| 51 | `/smokecraft/mini-tasting-module` | no | `<SmokeCraftSessionGuard requires="entry"><MiniTasting /></SmokeCraftSessionGuard>` |
| 52 | `/smokecraft/final-third` | no | `<SmokeCraftSessionGuard sessionNumber={16}><SmokeCraftScreenRenderer screenId="session-16" /></SmokeCraftSessionGuard>` |
| 53 | `/smokecraft/scorecard` | no | `<SmokeCraftSessionGuard sessionNumber={19}><SmokeCraftScreenRenderer screenId="session-19" /></SmokeCraftSessionGuard>` |
| 54 | `/smokecraft/smokecraft-challenge` | no | `<SmokeCraftSessionGuard requires="scorecard"><SmokeCraftChallenge /></SmokeCraftSessionGuard>` |
| 55 | `/smokecraft/challenge` | no | `<Navigate to="/smokecraft/smokecraft-challenge" replace />` |
| 56 | `/smokecraft/second-humidor-match` | no | `<SmokeCraftSessionGuard requires="scorecard"><SecondHumidorMatch /></SmokeCraftSessionGuard>` |
| 57 | `/smokecraft/mini-tasting` | no | `<SmokeCraftSessionGuard requires="scorecard"><MiniTastingRound /></SmokeCraftSessionGuard>` |
| 58 | `/smokecraft/mini-tasting-round` | no | `<Navigate to="/smokecraft/mini-tasting" replace />` |
| 59 | `/smokecraft/ai-summary` | no | `<SmokeCraftSessionGuard sessionNumber={21}><SmokeCraftScreenRenderer screenId="session-21" /></SmokeCraftSessionGuard>` |
| 60 | `/smokecraft/pairing-recommendations` | no | `<SmokeCraftSessionGuard sessionNumber={22}><SmokeCraftScreenRenderer screenId="session-22" /></SmokeCraftSessionGuard>` |
| 61 | `/smokecraft/passport-stamp` | no | `<SmokeCraftSessionGuard sessionNumber={23}><SmokeCraftScreenRenderer screenId="session-23" /></SmokeCraftSessionGuard>` |
| 62 | `/smokecraft/connections` | no | `<SmokeCraftSessionGuard requires="passport-stamp"><Connections /></SmokeCraftSessionGuard>` |
| 63 | `/smokecraft/management-sync` | no | `<SmokeCraftSessionGuard requires="passport-stamp"><ManagementSync /></SmokeCraftSessionGuard>` |
| 64 | `/smokecraft/management-sync/analytics` | no | `<ManagementSyncAnalytics />` |
| 65 | `/smokecraft/final-review` | no | `<SmokeCraftSessionGuard sessionNumber={24}><SmokeCraftScreenRenderer screenId="session-24" /></SmokeCraftSessionGuard>` |
| 66 | `/smokecraft/rewards` | no | `<SmokeCraftSessionGuard sessionNumber={25}><SmokeCraftScreenRenderer screenId="session-25" /></SmokeCraftSessionGuard>` |
| 67 | `/smokecraft/skill-tree` | no | `<SmokeCraftSessionGuard requires="entry"><SkillTree /></SmokeCraftSessionGuard>` |
| 68 | `/smokecraft/collections` | no | `<SmokeCraftSessionGuard requires="entry"><CollectionsCenter /></SmokeCraftSessionGuard>` |
| 69 | `/smokecraft/challenge-hub` | no | `<SmokeCraftSessionGuard requires="entry"><ChallengeHub /></SmokeCraftSessionGuard>` |
| 70 | `/smokecraft/challenges/blend-fault-identification` | no | `<SmokeCraftSessionGuard requires="entry"><BlendFaultChallenge /></SmokeCraftSessionGuard>` |
| 71 | `/smokecraft/filler-arrangement` | no | `<SmokeCraftSessionGuard requires="entry"><FillerArrangement /></SmokeCraftSessionGuard>` |
| 72 | `/smokecraft/session-complete` | no | `<SmokeCraftSessionGuard sessionNumber={27}><SmokeCraftScreenRenderer screenId="session-27" /></SmokeCraftSessionGuard>` |
| 73 | `/smokecraft/visit-complete` | no | `<VisitComplete />` |
| 74 | `/smokecraft/origins` | no | `<Origins />` |
| 75 | `/smokecraft/curation` | no | `<Curation />` |
| 76 | `/smokecraft/leaves` | no | `<Leaves />` |
| 77 | `/smokecraft/leaf-challenge` | no | `<LeafChallenge />` |
| 78 | `/smokecraft/leaf-challenge-calculating` | no | `<LeafChallengeCalculating />` |
| 79 | `/smokecraft/leaf-challenge-result` | no | `<LeafChallengeResult />` |
| 80 | `/smokecraft/cultivation` | no | `<Cultivation />` |
| 81 | `/smokecraft/blend` | no | `<Blend />` |
| 82 | `/smokecraft/flavor-dna` | no | `<FlavorDNA />` |
| 83 | `/smokecraft/pairing` | no | `<Pairing />` |
| 84 | `/smokecraft/available` | no | `<Available />` |
| 85 | `/smokecraft/assistant` | no | `<Assistant />` |
| 86 | `/smokecraft/pairing-mastery` | no | `<PairingMastery />` |
| 87 | `/smokecraft/vitola` | no | `<Vitola />` |
| 88 | `/smokecraft/identity` | no | `<SmokeCraftSessionGuard requires="enroll"><Identity /></SmokeCraftSessionGuard>` |
| 89 | `/smokecraft/resume` | no | `<SmokeCraftSessionGuard requires="enroll"><ResumeJourney /></SmokeCraftSessionGuard>` |
| 90 | `/smokecraft/leaderboard` | no | `<Leaderboard />` |
| 91 | `/smokecraft/rewards-center` | no | `<RewardsCenter />` |
| 92 | `/smokecraft/account` | no | `<Account />` |
| 93 | `/smokecraft/event-challenge` | no | `<EventChallenge />` |
| 94 | `/smokecraft/how-it-works` | no | `<HowItWorks />` |
| 95 | `/smokecraft/demo-reset` | no | `<SmokeCraftDemoReset />` |
| 96 | `/smokecraft/session/start` | no | `<Navigate to="/smokecraft/enroll" replace />` |
| 97 | `/smokecraft/guest-pass` | no | `<GuestPass />` |
| 98 | `/smokecraft/demo` | no | `<Demo />` |
| 99 | `/smokecraft/scan` | no | `<Scan />` |
| 100 | `/smokecraft/passport` | no | `<SmokeCraftPassport />` |
| 101 | `/smokecraft/crafthub` | no | `<SmokeCraftCraftHub />` |
| 102 | `/smokecraft/menu` | no | `<SmokeCraftMenu />` |
| 103 | `/smokecraft/venue-commerce` | no | `<SmokeCraftVenueCommerce />` |
| 104 | `/smokecraft/order` | no | `<SmokeCraftVenueCommerce />` |
| 105 | `/smokecraft/ticket-tapper/staff-specials` | no | `<SmokeCraftVenueCommerce />` |
| 106 | `/smokecraft/cart` | no | `<SmokeCraftCart />` |
| 107 | `/smokecraft/checkout` | no | `<SmokeCraftCheckout />` |
| 108 | `/smokecraft/payment-success` | no | `<SmokeCraftPaymentSuccess />` |
| 109 | `/smokecraft/order-status` | no | `<SmokeCraftOrderStatus />` |
