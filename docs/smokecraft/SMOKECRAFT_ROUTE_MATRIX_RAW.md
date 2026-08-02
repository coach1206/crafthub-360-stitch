# SmokeCraft Route Matrix (Prompt 1/2 — programmatically generated, full nested paths)

Generated from `src/App.jsx` lines 356-672 (the `/smokecraft` parent route group) at commit `67fe8f9ac872e1b784911da2a92fc15c9edc6ee7`, tracking real JSX nesting depth so full paths are reconstructed correctly (e.g. `golden-box/status` -> `/smokecraft/golden-box/status`), not just a flat list of relative path fragments.

**Total routes found in the /smokecraft group: 138**

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
| 34 | `/smokecraft/compliance/age-gate` | no | `<ComplianceAgeGate />` |
| 35 | `/smokecraft/compliance/policies` | no | `<CompliancePolicyCenter />` |
| 36 | `/smokecraft/compliance/consent` | no | `<ComplianceConsentCenter />` |
| 37 | `/smokecraft/compliance/data-rights` | no | `<ComplianceDataRightsCenter />` |
| 38 | `/smokecraft/staff/compliance/age-verification` | no | `<ComplianceStaffAgeVerification />` |
| 39 | `/smokecraft/admin/compliance` | no | `<ComplianceAdmin />` |
| 40 | `/smokecraft/admin/humidor` | no | `<VenueHumidorAdminDashboard />` |
| 41 | `/smokecraft/admin/humidor/new` | no | `<VenueHumidorAdminProductForm />` |
| 42 | `/smokecraft/admin/humidor/inventory-events` | no | `<VenueHumidorAdminInventoryEvents />` |
| 43 | `/smokecraft/admin/humidor/media` | no | `<VenueHumidorAdminMedia />` |
| 44 | `/smokecraft/admin/humidor/:cigarId/edit` | no | `<VenueHumidorAdminProductForm />` |
| 45 | `/smokecraft/admin/humidor/orders/history` | no | `<VenueHumidorFulfillmentHistory />` |
| 46 | `/smokecraft/admin/humidor/payments` | no | `<VenueHumidorAdminPayments />` |
| 47 | `/smokecraft/admin/humidor/orders/:orderId/handoff` | no | `<VenueHumidorHandoff />` |
| 48 | `/smokecraft/admin/humidor/orders/:orderId` | no | `<VenueHumidorOrderDetail />` |
| 49 | `/smokecraft/admin/humidor/orders` | no | `<VenueHumidorOrderQueue />` |
| 50 | `/smokecraft/orders/:orderId/pickup` | no | `<VenueHumidorPickup />` |
| 51 | `/smokecraft/orders/:orderId/receipt` | no | `<VenueHumidorReceipt />` |
| 52 | `/smokecraft/orders/:orderId` | no | `<VenueHumidorMyOrderDetail />` |
| 53 | `/smokecraft/orders` | no | `<VenueHumidorMyOrders />` |
| 54 | `/smokecraft/passport/acquisitions/:acquisitionId` | no | `<VenueHumidorAcquisitionDetail />` |
| 55 | `/smokecraft/passport/acquisitions` | no | `<VenueHumidorMyAcquisitions />` |
| 56 | `/smokecraft/humidor/recommendations` | no | `<VenueHumidorRecommendations />` |
| 57 | `/smokecraft/humidor/pairing` | no | `<VenueHumidorRecommendations pairingMode />` |
| 58 | `/smokecraft/admin/humidor/assisted-selling` | no | `<VenueHumidorAssistedSelling />` |
| 59 | `/smokecraft/art` | no | `<Art />` |
| 60 | `/smokecraft/mentor-selection` | no | `<SmokeCraftSessionGuard requires="entry"><Mentor /></SmokeCraftSessionGuard>` |
| 61 | `/smokecraft/mentor` | no | `<Navigate to="/smokecraft/mentor-selection" replace />` |
| 62 | `/smokecraft/humidor-match` | no | `<SmokeCraftSessionGuard sessionNumber={2}><SmokeCraftScreenRenderer screenId="session-2" /></SmokeCraftSessionGuard>` |
| 63 | `/smokecraft/meet-your-cigar` | no | `<SmokeCraftSessionGuard sessionNumber={3}><SmokeCraftScreenRenderer screenId="session-3" /></SmokeCraftSessionGuard>` |
| 64 | `/smokecraft/terroir` | no | `<SmokeCraftSessionGuard sessionNumber={4}><SmokeCraftScreenRenderer screenId="session-4" /></SmokeCraftSessionGuard>` |
| 65 | `/smokecraft/format` | no | `<SmokeCraftSessionGuard sessionNumber={5}><SmokeCraftScreenRenderer screenId="session-5" /></SmokeCraftSessionGuard>` |
| 66 | `/smokecraft/shape-size-burn` | no | `<Navigate to="/smokecraft/format" replace />` |
| 67 | `/smokecraft/cigar-gauge-guide` | no | `<SmokeCraftSessionGuard sessionNumber={5}><CigarGaugeGuide /></SmokeCraftSessionGuard>` |
| 68 | `/smokecraft/wrapper-strength` | no | `<SmokeCraftSessionGuard requires="format"><WrapperStrength /></SmokeCraftSessionGuard>` |
| 69 | `/smokecraft/seed-soil` | no | `<SmokeCraftSessionGuard requires="mentor"><SeedSoil /></SmokeCraftSessionGuard>` |
| 70 | `/smokecraft/cut-toast-light` | no | `<SmokeCraftSessionGuard sessionNumber={6}><SmokeCraftScreenRenderer screenId="session-6" /></SmokeCraftSessionGuard>` |
| 71 | `/smokecraft/lighting-tutorial` | no | `<SmokeCraftSessionGuard sessionNumber={7}><SmokeCraftScreenRenderer screenId="session-7" /></SmokeCraftSessionGuard>` |
| 72 | `/smokecraft/first-third` | no | `<SmokeCraftSessionGuard sessionNumber={8}><SmokeCraftScreenRenderer screenId="session-8" /></SmokeCraftSessionGuard>` |
| 73 | `/smokecraft/flavor-memory` | no | `<SmokeCraftSessionGuard sessionNumber={10}><SmokeCraftScreenRenderer screenId="session-10" /></SmokeCraftSessionGuard>` |
| 74 | `/smokecraft/pairing-lab` | no | `<SmokeCraftSessionGuard sessionNumber={11}><SmokeCraftScreenRenderer screenId="session-11" /></SmokeCraftSessionGuard>` |
| 75 | `/smokecraft/request-purchase` | no | `<SmokeCraftSessionGuard requires="humidor-match"><RequestPurchase /></SmokeCraftSessionGuard>` |
| 76 | `/smokecraft/second-third` | no | `<SmokeCraftSessionGuard sessionNumber={12}><SmokeCraftScreenRenderer screenId="session-12" /></SmokeCraftSessionGuard>` |
| 77 | `/smokecraft/mentor-commentary` | no | `<SmokeCraftSessionGuard sessionNumber={14}><SmokeCraftScreenRenderer screenId="session-14" /></SmokeCraftSessionGuard>` |
| 78 | `/smokecraft/knowledge-drop` | no | `<SmokeCraftSessionGuard sessionNumber={15}><SmokeCraftScreenRenderer screenId="session-15" /></SmokeCraftSessionGuard>` |
| 79 | `/smokecraft/knowledge-check-demo` | no | `<SmokeCraftSessionGuard requires="entry"><KnowledgeCheckDemo /></SmokeCraftSessionGuard>` |
| 80 | `/smokecraft/mini-tasting-module` | no | `<SmokeCraftSessionGuard requires="entry"><MiniTasting /></SmokeCraftSessionGuard>` |
| 81 | `/smokecraft/final-third` | no | `<SmokeCraftSessionGuard sessionNumber={16}><SmokeCraftScreenRenderer screenId="session-16" /></SmokeCraftSessionGuard>` |
| 82 | `/smokecraft/scorecard` | no | `<SmokeCraftSessionGuard sessionNumber={19}><SmokeCraftScreenRenderer screenId="session-19" /></SmokeCraftSessionGuard>` |
| 83 | `/smokecraft/smokecraft-challenge` | no | `<SmokeCraftSessionGuard requires="scorecard"><SmokeCraftChallenge /></SmokeCraftSessionGuard>` |
| 84 | `/smokecraft/challenge` | no | `<Navigate to="/smokecraft/smokecraft-challenge" replace />` |
| 85 | `/smokecraft/second-humidor-match` | no | `<SmokeCraftSessionGuard requires="scorecard"><SecondHumidorMatch /></SmokeCraftSessionGuard>` |
| 86 | `/smokecraft/mini-tasting` | no | `<SmokeCraftSessionGuard requires="scorecard"><MiniTastingRound /></SmokeCraftSessionGuard>` |
| 87 | `/smokecraft/mini-tasting-round` | no | `<Navigate to="/smokecraft/mini-tasting" replace />` |
| 88 | `/smokecraft/ai-summary` | no | `<SmokeCraftSessionGuard sessionNumber={21}><SmokeCraftScreenRenderer screenId="session-21" /></SmokeCraftSessionGuard>` |
| 89 | `/smokecraft/pairing-recommendations` | no | `<SmokeCraftSessionGuard sessionNumber={22}><SmokeCraftScreenRenderer screenId="session-22" /></SmokeCraftSessionGuard>` |
| 90 | `/smokecraft/passport-stamp` | no | `<SmokeCraftSessionGuard sessionNumber={23}><SmokeCraftScreenRenderer screenId="session-23" /></SmokeCraftSessionGuard>` |
| 91 | `/smokecraft/connections` | no | `<SmokeCraftSessionGuard requires="passport-stamp"><Connections /></SmokeCraftSessionGuard>` |
| 92 | `/smokecraft/management-sync` | no | `<SmokeCraftSessionGuard requires="passport-stamp"><ManagementSync /></SmokeCraftSessionGuard>` |
| 93 | `/smokecraft/management-sync/analytics` | no | `<ManagementSyncAnalytics />` |
| 94 | `/smokecraft/final-review` | no | `<SmokeCraftSessionGuard sessionNumber={24}><SmokeCraftScreenRenderer screenId="session-24" /></SmokeCraftSessionGuard>` |
| 95 | `/smokecraft/rewards` | no | `<SmokeCraftSessionGuard sessionNumber={25}><SmokeCraftScreenRenderer screenId="session-25" /></SmokeCraftSessionGuard>` |
| 96 | `/smokecraft/skill-tree` | no | `<SmokeCraftSessionGuard requires="entry"><SkillTree /></SmokeCraftSessionGuard>` |
| 97 | `/smokecraft/collections` | no | `<SmokeCraftSessionGuard requires="entry"><CollectionsCenter /></SmokeCraftSessionGuard>` |
| 98 | `/smokecraft/challenge-hub` | no | `<SmokeCraftSessionGuard requires="entry"><ChallengeHub /></SmokeCraftSessionGuard>` |
| 99 | `/smokecraft/challenges/blend-fault-identification` | no | `<SmokeCraftSessionGuard requires="entry"><BlendFaultChallenge /></SmokeCraftSessionGuard>` |
| 100 | `/smokecraft/filler-arrangement` | no | `<SmokeCraftSessionGuard requires="entry"><FillerArrangement /></SmokeCraftSessionGuard>` |
| 101 | `/smokecraft/session-complete` | no | `<SmokeCraftSessionGuard sessionNumber={27}><SmokeCraftScreenRenderer screenId="session-27" /></SmokeCraftSessionGuard>` |
| 102 | `/smokecraft/visit-complete` | no | `<VisitComplete />` |
| 103 | `/smokecraft/origins` | no | `<Origins />` |
| 104 | `/smokecraft/curation` | no | `<Curation />` |
| 105 | `/smokecraft/leaves` | no | `<Leaves />` |
| 106 | `/smokecraft/leaf-challenge` | no | `<LeafChallenge />` |
| 107 | `/smokecraft/leaf-challenge-calculating` | no | `<LeafChallengeCalculating />` |
| 108 | `/smokecraft/leaf-challenge-result` | no | `<LeafChallengeResult />` |
| 109 | `/smokecraft/cultivation` | no | `<Cultivation />` |
| 110 | `/smokecraft/blend` | no | `<Blend />` |
| 111 | `/smokecraft/flavor-dna` | no | `<FlavorDNA />` |
| 112 | `/smokecraft/pairing` | no | `<Pairing />` |
| 113 | `/smokecraft/available` | no | `<Available />` |
| 114 | `/smokecraft/assistant` | no | `<Assistant />` |
| 115 | `/smokecraft/pairing-mastery` | no | `<PairingMastery />` |
| 116 | `/smokecraft/vitola` | no | `<Vitola />` |
| 117 | `/smokecraft/identity` | no | `<SmokeCraftSessionGuard requires="enroll"><Identity /></SmokeCraftSessionGuard>` |
| 118 | `/smokecraft/resume` | no | `<SmokeCraftSessionGuard requires="enroll"><ResumeJourney /></SmokeCraftSessionGuard>` |
| 119 | `/smokecraft/leaderboard` | no | `<Leaderboard />` |
| 120 | `/smokecraft/rewards-center` | no | `<RewardsCenter />` |
| 121 | `/smokecraft/account` | no | `<Account />` |
| 122 | `/smokecraft/event-challenge` | no | `<EventChallenge />` |
| 123 | `/smokecraft/how-it-works` | no | `<HowItWorks />` |
| 124 | `/smokecraft/demo-reset` | no | `<SmokeCraftDemoReset />` |
| 125 | `/smokecraft/session/start` | no | `<Navigate to="/smokecraft/enroll" replace />` |
| 126 | `/smokecraft/guest-pass` | no | `<GuestPass />` |
| 127 | `/smokecraft/demo` | no | `<Demo />` |
| 128 | `/smokecraft/scan` | no | `<Scan />` |
| 129 | `/smokecraft/passport` | no | `<SmokeCraftPassport />` |
| 130 | `/smokecraft/crafthub` | no | `<SmokeCraftCraftHub />` |
| 131 | `/smokecraft/menu` | no | `<SmokeCraftMenu />` |
| 132 | `/smokecraft/venue-commerce` | no | `<SmokeCraftVenueCommerce />` |
| 133 | `/smokecraft/order` | no | `<SmokeCraftVenueCommerce />` |
| 134 | `/smokecraft/ticket-tapper/staff-specials` | no | `<SmokeCraftVenueCommerce />` |
| 135 | `/smokecraft/cart` | no | `<SmokeCraftCart />` |
| 136 | `/smokecraft/checkout` | no | `<SmokeCraftCheckout />` |
| 137 | `/smokecraft/payment-success` | no | `<SmokeCraftPaymentSuccess />` |
| 138 | `/smokecraft/order-status` | no | `<SmokeCraftOrderStatus />` |
