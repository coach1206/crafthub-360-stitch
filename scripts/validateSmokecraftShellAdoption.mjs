#!/usr/bin/env node
// Holistic Fix 2A — build-blocking regression protection for the 7 target
// screens' shell/navigation-registry migration. Wired into `npm run build`
// via validateSmokecraftManifest.mjs so a rollback (someone reverting to
// SmokeCraftImageBoundsOverlay directly, or reintroducing a local route
// literal for a registered destination) fails the build immediately,
// rather than being caught only by a later manual audit.
import { readFileSync } from 'node:fs'

let failures = 0
function check(label, cond) {
  if (cond) { console.log(`  PASS  ${label}`) }
  else { console.error(`  FAIL  ${label}`); failures++ }
}

console.log('\n=== SmokeCraft shell/navigation-registry adoption lock (Holistic Fix 2A) ===\n')

const TARGETS = [
  { file: 'src/pages/smokecraft/WelcomeExperience.jsx', name: 'Welcome', navLiterals: ['/smokecraft/rewards-center', '/smokecraft/passport', '/smokecraft/leaderboard', '/smokecraft/event-challenge', '/smokecraft/collections', '/smokecraft/mentor-selection', '/smokecraft/knowledge-drop', '/smokecraft/golden-box'] },
  { file: 'src/pages/smokecraft/Leaderboard.jsx', name: 'Leaderboard', navLiterals: ['/smokecraft/humidor-match', '/smokecraft/challenge-hub', '/smokecraft/event-challenge', '/smokecraft/rewards-center', '/smokecraft/passport'] },
  { file: 'src/pages/smokecraft/SmokeCraftPassport.jsx', name: 'Passport', navLiterals: ['/passport/scan', '/passport/directory', '/passport/events', '/passport/benefits', '/passport/how-it-works'] },
  { file: 'src/pages/smokecraft/VenueSelect.jsx', name: 'Venue Selection', navLiterals: [] },
  { file: 'src/pages/smokecraft/SmokeCraftCraftHub.jsx', name: 'CraftHub', navLiterals: [] },
  { file: 'src/pages/smokecraft/ChallengeHub.jsx', name: 'Challenge Hub', navLiterals: [] },
  { file: 'src/pages/smokecraft/Rewards.jsx', name: 'Rewards', navLiterals: ['/smokecraft/challenge-hub', '/smokecraft/collections'] },
  // Holistic Fix 2B — Golden Box family (16 routes across 13 components).
  { file: 'src/pages/smokecraft/GoldenBox.jsx', name: 'Golden Box Rules', navLiterals: ['/smokecraft/mentor-selection'] },
  { file: 'src/pages/smokecraft/GoldenBoxStatus.jsx', name: 'Golden Box Status', navLiterals: [] },
  { file: 'src/pages/smokecraft/goldenBox/GoldenBoxHub.jsx', name: 'Golden Box Hub', navLiterals: [] },
  { file: 'src/pages/smokecraft/goldenBox/CompetitionDetail.jsx', name: 'Golden Box Competition Detail', navLiterals: ['/smokecraft/golden-box'] },
  { file: 'src/pages/smokecraft/goldenBox/EntryWorkspace.jsx', name: 'Golden Box Entry Workspace', navLiterals: [] },
  { file: 'src/pages/smokecraft/goldenBox/ResultsExperience.jsx', name: 'Golden Box Results', navLiterals: ['/smokecraft/golden-box', '/smokecraft/leaderboard'] },
  { file: 'src/pages/smokecraft/goldenBox/JudgeDashboard.jsx', name: 'Golden Box Judge Dashboard', navLiterals: [] },
  { file: 'src/pages/smokecraft/goldenBox/JudgeEntryReview.jsx', name: 'Golden Box Judge Entry Review', navLiterals: [] },
  { file: 'src/pages/smokecraft/goldenBox/MentorReview.jsx', name: 'Golden Box Mentor Review', navLiterals: [] },
  { file: 'src/pages/smokecraft/goldenBox/PackagingStudioDashboard.jsx', name: 'Packaging Studio Dashboard', navLiterals: [] },
  { file: 'src/pages/smokecraft/goldenBox/PackagingStudioEditor.jsx', name: 'Packaging Studio Editor', navLiterals: [] },
  { file: 'src/pages/smokecraft/goldenBox/PackagingStudioVersions.jsx', name: 'Packaging Studio Versions', navLiterals: [] },
  { file: 'src/pages/smokecraft/goldenBox/PackagingStudioShare.jsx', name: 'Packaging Studio Share', navLiterals: [] },
  { file: 'src/pages/smokecraft/goldenBox/PackagingReview.jsx', name: 'Packaging Review (public share link)', navLiterals: [] },
  // Holistic Fix 2C — Origins/Curation/Leaf-Challenge/Cultivation module (9 routes).
  { file: 'src/pages/smokecraft/Origins.jsx', name: 'Origins', navLiterals: [] },
  { file: 'src/pages/smokecraft/Curation.jsx', name: 'Curation', navLiterals: ['/grand-lounge-ranking'] },
  { file: 'src/pages/smokecraft/Leaves.jsx', name: 'Leaves', navLiterals: ['/grand-lounge-ranking', '/passport'] },
  { file: 'src/pages/smokecraft/LeafChallenge.jsx', name: 'Leaf Challenge', navLiterals: [] },
  { file: 'src/pages/smokecraft/LeafChallengeCalculating.jsx', name: 'Leaf Challenge Calculating', navLiterals: [] },
  { file: 'src/pages/smokecraft/LeafChallengeResult.jsx', name: 'Leaf Challenge Result', navLiterals: ['/passport'] },
  { file: 'src/pages/smokecraft/Cultivation.jsx', name: 'Cultivation', navLiterals: [] },
  { file: 'src/pages/smokecraft/Blend.jsx', name: 'Blend', navLiterals: [] },
  { file: 'src/pages/smokecraft/FlavorDNA.jsx', name: 'Flavor DNA', navLiterals: [] },
  // Holistic Fix 2D — Pairing-adjacent family (5 routes).
  { file: 'src/pages/smokecraft/Pairing.jsx', name: 'Pairing', navLiterals: [] },
  { file: 'src/pages/smokecraft/Available.jsx', name: 'Available', navLiterals: [] },
  { file: 'src/pages/smokecraft/Assistant.jsx', name: 'Assistant', navLiterals: [] },
  { file: 'src/pages/smokecraft/PairingMastery.jsx', name: 'Pairing Mastery', navLiterals: [] },
  { file: 'src/pages/smokecraft/Vitola.jsx', name: 'Vitola', navLiterals: [] },
  // Holistic Fix 2E — remaining standalone supporting-screen migration batch.
  { file: 'src/pages/SmokeCraft.jsx', name: 'Landing', navLiterals: [] },
  { file: 'src/pages/smokecraft/SeedSoil.jsx', name: 'Seed & Soil', navLiterals: [] },
  { file: 'src/pages/smokecraft/RequestPurchase.jsx', name: 'Request Purchase', navLiterals: [] },
  { file: 'src/pages/smokecraft/ManagementSync.jsx', name: 'Management Sync', navLiterals: [] },
  { file: 'src/pages/smokecraft/ResumeJourney.jsx', name: 'Resume Journey', navLiterals: [] },
  { file: 'src/pages/smokecraft/RewardsCenter.jsx', name: 'Rewards Center', navLiterals: [] },
  { file: 'src/pages/smokecraft/HowItWorks.jsx', name: 'How It Works', navLiterals: [] },
  { file: 'src/pages/smokecraft/GuestPass.jsx', name: 'Guest Pass', navLiterals: [] },
  { file: 'src/pages/smokecraft/Scan.jsx', name: 'Scan', navLiterals: [] },
  { file: 'src/pages/smokecraft/Enroll.jsx', name: 'Enroll', navLiterals: [] },
  { file: 'src/pages/smokecraft/Identity.jsx', name: 'Identity', navLiterals: [] },
  { file: 'src/pages/smokecraft/Art.jsx', name: 'Art', navLiterals: [] },
  { file: 'src/pages/smokecraft/CigarGaugeGuide.jsx', name: 'Cigar Gauge Guide', navLiterals: [] },
  { file: 'src/pages/smokecraft/KnowledgeCheckDemo.jsx', name: 'Knowledge Check Demo', navLiterals: [] },
  { file: 'src/pages/smokecraft/SkillTree.jsx', name: 'Skill Tree', navLiterals: [] },
  { file: 'src/pages/smokecraft/CollectionsCenter.jsx', name: 'Collections Center', navLiterals: [] },
  { file: 'src/pages/smokecraft/Demo.jsx', name: 'Demo', navLiterals: [] },
  { file: 'src/components/smokecraft/SmokeCraftDemoReset.jsx', name: 'Demo Reset', navLiterals: [] },
  { file: 'src/pages/smokecraft/VisitComplete.jsx', name: 'Visit Complete', navLiterals: [] },
  { file: 'src/pages/smokecraft/FillerArrangement.jsx', name: 'Filler Arrangement', navLiterals: [] },
  // Holistic Fix 2E-2 — 27-session curriculum spine migration. All 21
  // registered curriculum componentKeys (session-1..session-27, with
  // merged sessions sharing their primary component) render through this
  // one central SmokeCraftScreenRenderer, so wrapping it puts every
  // curriculum session on the shared shell in a single, build-locked
  // migration point rather than 21 separate per-file edits.
  { file: 'src/components/smokecraft/SmokeCraftScreenRenderer.jsx', name: 'SmokeCraft Curriculum Screen Renderer (all 21 session slots)', navLiterals: [] },
  { file: 'src/pages/smokecraft/WrapperStrength.jsx', name: 'Wrapper Strength (Leaf to Cigar construction module)', navLiterals: [] },
  // Holistic Fix 2E-4 — commerce flow (orphaned distinct workflow, retained
  // as documented direct-access — see SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md).
  { file: 'src/pages/smokecraft/SmokeCraftMenu.jsx', name: 'Commerce Menu', navLiterals: [] },
  { file: 'src/pages/smokecraft/SmokeCraftCart.jsx', name: 'Commerce Cart', navLiterals: [] },
  { file: 'src/pages/smokecraft/SmokeCraftCheckout.jsx', name: 'Commerce Checkout', navLiterals: [] },
  { file: 'src/pages/smokecraft/SmokeCraftPaymentSuccess.jsx', name: 'Commerce Payment Success', navLiterals: [] },
  { file: 'src/pages/smokecraft/SmokeCraftOrderStatus.jsx', name: 'Commerce Order Status', navLiterals: [] },
]

for (const t of TARGETS) {
  const src = readFileSync(t.file, 'utf8')

  check(`${t.name}: imports SmokeCraftScreenShell`, /import SmokeCraftScreenShell from/.test(src))
  check(`${t.name}: actually renders <SmokeCraftScreenShell`, /<SmokeCraftScreenShell\b/.test(src))
  check(`${t.name}: does not import SmokeCraftImageBoundsOverlay directly (must go through the shell)`, !/import SmokeCraftImageBoundsOverlay from/.test(src))

  // A registered destination's literal string must not reappear as a bare
  // string literal in the file — it must be reached only via the registry
  // constant (NAV.X / PASSPORT_MODULE.X), never re-typed inline.
  for (const literal of t.navLiterals) {
    const bareLiteralRe = new RegExp(`['"\`]${literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`)
    check(`${t.name}: registered destination "${literal}" is not reintroduced as a bare local literal`, !bareLiteralRe.test(src))
  }
}

// Approved-asset lock: each image-shell screen must still reference its own
// exact SC_ASSETS key — a migration must never silently swap in a
// different approved image.
const ASSET_LOCKS = [
  { file: 'src/pages/smokecraft/WelcomeExperience.jsx', key: 'SC_ASSETS.session1' },
  { file: 'src/pages/smokecraft/Leaderboard.jsx', key: 'SC_ASSETS.leaderboard' },
  { file: 'src/pages/smokecraft/SmokeCraftPassport.jsx', key: 'SC_ASSETS.passportHub' },
  { file: 'src/pages/smokecraft/SmokeCraftCraftHub.jsx', key: 'SC_ASSETS.craftHubVenueTable' },
  { file: 'src/pages/smokecraft/Rewards.jsx', key: 'SC_ASSETS.rewards' },
  { file: 'src/pages/smokecraft/GoldenBox.jsx', key: 'SC_ASSETS.goldenBox' },
]
for (const a of ASSET_LOCKS) {
  const src = readFileSync(a.file, 'utf8')
  check(`${a.file}: still references its locked approved asset (${a.key})`, src.includes(a.key))
}

// Holistic Fix 2D — pairing-route collision guard. Five distinct pairing
// concepts exist in this codebase (/smokecraft/pairing, Pairing Lab [S11],
// Personalized Pairing Recommendations [S22], Humidor Match [S2], and
// /smokecraft/pairing-mastery) and must never be silently collapsed into
// one route or component. Fails the build if any two of these routes ever
// resolve to the same component, or if the registry's PAIRING/
// PAIRING_STANDALONE keys are ever collapsed into one value.
{
  const appJsx = readFileSync('src/App.jsx', 'utf8')
  function componentFor(routePath) {
    const re = new RegExp(`<Route path="${routePath.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}"\\s+element=\\{<[^>]*?<?(\\w+)\\s*/?>`)
    return appJsx.match(re)?.[1] || null
  }
  const pairingRoutes = {
    'pairing': componentFor('pairing'),
    'pairing-lab': componentFor('pairing-lab'),
    'pairing-recommendations': componentFor('pairing-recommendations'),
    'humidor-match': componentFor('humidor-match'),
    'pairing-mastery': componentFor('pairing-mastery'),
  }
  const resolvedPairs = Object.entries(pairingRoutes).filter(([, c]) => c)
  const seen = new Map()
  let collision = false
  for (const [route, comp] of resolvedPairs) {
    if (seen.has(comp)) { collision = true; console.error(`  FAIL  Route collision: "${route}" and "${seen.get(comp)}" both resolve to component "${comp}"`); failures++ }
    else seen.set(comp, route)
  }
  check('No collision among the 5 distinct pairing-family routes (pairing/pairing-lab/pairing-recommendations/humidor-match/pairing-mastery)', !collision)

  const navSrc = readFileSync('src/constants/smokecraftNavigationRegistry.js', 'utf8')
  const pairingKey = navSrc.match(/PAIRING:\s*'([^']+)'/)?.[1]
  const pairingStandaloneKey = navSrc.match(/PAIRING_STANDALONE:\s*'([^']+)'/)?.[1]
  check('smokecraftNavigationRegistry keeps PAIRING and PAIRING_STANDALONE as distinct, non-collapsed values',
    !!pairingKey && !!pairingStandaloneKey && pairingKey !== pairingStandaloneKey)
}

// Holistic Fix 2E-2 — 27-session curriculum spine lock. Every one of the 21
// registered componentKeys must still exist, still be registered, and must
// only ever be rendered through SmokeCraftScreenRenderer (which itself must
// stay on SmokeCraftScreenShell — checked above). Fails the build if a
// session slot is removed, renamed, or if App.jsx starts importing/
// rendering a curriculum component directly (bypassing the renderer/shell).
{
  const registrySrc = readFileSync('src/constants/smokecraftComponentRegistry.js', 'utf8')
  const EXPECTED_SESSION_KEYS = [
    'session-1', 'session-2', 'session-3', 'session-4', 'session-5', 'session-6', 'session-7',
    'session-8', 'session-10', 'session-11', 'session-12', 'session-14', 'session-15', 'session-16',
    'session-19', 'session-21', 'session-22', 'session-23', 'session-24', 'session-25', 'session-27',
  ]
  check(`Curriculum component registry still registers all ${EXPECTED_SESSION_KEYS.length} session slots (session-1..session-27 with merges)`,
    EXPECTED_SESSION_KEYS.every(k => new RegExp(`'${k}':`).test(registrySrc)))

  const appJsx = readFileSync('src/App.jsx', 'utf8')
  const curriculumComponentNames = [
    'WelcomeExperience', 'HumidorMatch', 'MeetYourCigar', 'Terroir', 'Format', 'CutToastLight',
    'LightingTutorial', 'FirstThird', 'FlavorMemory', 'PairingLab', 'SecondThird', 'MentorCommentary',
    'KnowledgeDrop', 'FinalThird', 'Scorecard', 'AISummary', 'PairingRecommendations', 'PassportStamp',
    'FinalReview', 'SessionComplete',
  ]
  const bypassed = curriculumComponentNames.filter(name => new RegExp(`<Route[^>]*element=\\{<[^>]*<${name}\\b`).test(appJsx))
  check('No curriculum session component is rendered directly from App.jsx (all must route through SmokeCraftScreenRenderer)', bypassed.length === 0)

  // Holistic Fix 2E-5 — interaction-manifest regression lock. Only
  // session-21 has a populated SMOKECRAFT_INTERACTION_MANIFEST entry today
  // (a disclosed, pre-existing gap — see SMOKECRAFT_EDUCATIONAL_COMPLETENESS_AUDIT.md);
  // this does not fabricate coverage for the other 20 slots, it only fails
  // the build if a required interaction is silently removed from what
  // already exists.
  const interactionSrc = readFileSync('src/constants/smokecraftInteractionManifest.js', 'utf8')
  check("session-21's required interactive region ('section-review') is still registered in the interaction manifest",
    /session-21[\s\S]*?section-review/.test(interactionSrc))

  // Holistic Fix 2E-7 — lesson-info (title/Golden Box/Why It Matters)
  // regression lock for the 11 sessions that had no on-screen title before
  // this pass. Fails the build if the SmokeCraftLessonInfoButton is removed
  // from any of these files, or if the per-session enrichment content it
  // depends on is removed from smokecraftEducationalEnrichment.js.
  const LESSON_INFO_TARGETS = [
    { file: 'src/pages/smokecraft/HumidorMatch.jsx', session: 2 },
    { file: 'src/pages/smokecraft/Format.jsx', session: 5 },
    { file: 'src/pages/smokecraft/CutToastLight.jsx', session: 6 },
    { file: 'src/pages/smokecraft/FirstThird.jsx', session: 8 },
    { file: 'src/pages/smokecraft/FlavorMemory.jsx', session: 10 },
    { file: 'src/pages/smokecraft/PairingLab.jsx', session: 11 },
    { file: 'src/pages/smokecraft/SecondThird.jsx', session: 12 },
    { file: 'src/pages/smokecraft/FinalThird.jsx', session: 16 },
    { file: 'src/pages/smokecraft/Scorecard.jsx', session: 19 },
    { file: 'src/pages/smokecraft/PassportStamp.jsx', session: 23 },
    { file: 'src/pages/smokecraft/FinalReview.jsx', session: 24 },
    // Holistic Fix 2E-8 — the 7 sessions that already had a title but were
    // missing Golden Box relevance / Why It Matters coverage.
    { file: 'src/pages/smokecraft/MeetYourCigar.jsx', session: 3 },
    { file: 'src/pages/smokecraft/Terroir.jsx', session: 4 },
    { file: 'src/pages/smokecraft/LightingTutorial.jsx', session: 7 },
    { file: 'src/pages/smokecraft/MentorCommentary.jsx', session: 14 },
    { file: 'src/pages/smokecraft/KnowledgeDrop.jsx', session: 15 },
    { file: 'src/pages/smokecraft/AISummary.jsx', session: 21 },
    { file: 'src/pages/smokecraft/PairingRecommendations.jsx', session: 22 },
  ]
  const enrichmentSrc = readFileSync('src/constants/smokecraftEducationalEnrichment.js', 'utf8')
  for (const t of LESSON_INFO_TARGETS) {
    const src = readFileSync(t.file, 'utf8')
    check(`${t.file}: still renders SmokeCraftLessonInfoButton (Session ${t.session} lesson title/Golden Box/Why It Matters)`,
      /import SmokeCraftLessonInfoButton from/.test(src) && /<SmokeCraftLessonInfoButton\b/.test(src))
    check(`smokecraftEducationalEnrichment.js: session ${t.session} entry still has both whyItMatters and goldenBox`,
      new RegExp(`\\b${t.session}:\\s*\\{[\\s\\S]{0,20}whyItMatters[\\s\\S]*?goldenBox`).test(enrichmentSrc))
  }

  // Holistic Fix 2E-9 — clip-prevention regression lock. SmokeCraftLessonInfoButton
  // must keep using position:'fixed' (real viewport coordinates), not
  // position:'absolute' — the Holistic Fix 2E-7 investigation found that
  // position:'absolute' inside SmokeCraftImageBoundsOverlay's bounds-relative
  // coordinate space silently clips the popover panel invisible.
  const buttonSrc = readFileSync('src/components/smokecraft/SmokeCraftLessonInfoButton.jsx', 'utf8')
  check("SmokeCraftLessonInfoButton: button uses position:'fixed' (not 'absolute', which clips inside SmokeCraftImageBoundsOverlay)",
    (buttonSrc.match(/position:\s*'fixed'/g) || []).length >= 2 && !/position:\s*'absolute'/.test(buttonSrc))
}

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS' : 'FAIL'} — ${failures} failing check(s) ===\n`)
if (failures > 0) process.exit(1)
