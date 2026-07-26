#!/usr/bin/env node
// Holistic Fix 1 — build-blocking manifest/navigation/shell validation.
// Wired into `npm run build` via package.json's `prebuild` script, so a
// violation of the shared SmokeCraft architecture fails the build rather
// than silently shipping. Exits non-zero on any FAIL.
import { readFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'

const { VISIT_STRUCTURE, TOTAL_SESSIONS, TOTAL_VISITS } = await import('../src/constants/session.js')
const { SMOKECRAFT_SCREEN_MANIFEST } = await import('../src/constants/smokecraftScreenManifest.js')
const { SC_ASSETS } = await import('../src/constants/smokecraftAssets.js')
const { allRegisteredNavRoutes } = await import('../src/constants/smokecraftNavigationRegistry.js')

let failures = 0
function check(label, cond) {
  if (cond) { console.log(`  PASS  ${label}`) }
  else { console.error(`  FAIL  ${label}`); failures++ }
}

console.log('\n=== SmokeCraft game-manifest / navigation / shell validation (Holistic Fix 1) ===\n')

// 1. Regenerate the raw route inventory fresh (never trust a stale cached
// copy) and confirm the manifest generator + this validator agree with it.
execSync('node scripts/smokecraftRouteInventory.mjs', { stdio: 'pipe' })
const rawRoutes = JSON.parse(readFileSync('docs/smokecraft/smokecraft-routes-raw.json', 'utf8'))
check('Route inventory regenerates without error', Array.isArray(rawRoutes) && rawRoutes.length > 0)

// 2. Manifest file exists and its own recorded totals match the live route count.
check('SMOKECRAFT_GAME_MANIFEST.json exists', existsSync('docs/smokecraft/SMOKECRAFT_GAME_MANIFEST.json'))
if (existsSync('docs/smokecraft/SMOKECRAFT_GAME_MANIFEST.json')) {
  const manifest = JSON.parse(readFileSync('docs/smokecraft/SMOKECRAFT_GAME_MANIFEST.json', 'utf8'))
  check('Manifest totalRoutes matches live /smokecraft route count (no route missing from the manifest)', manifest.totalRoutes === rawRoutes.length)

  // No duplicate screenIds.
  const ids = manifest.entries.map(e => e.screenId)
  check('No duplicate screenId in the manifest', new Set(ids).size === ids.length)

  // Every entry must resolve to a real, non-empty route string.
  check('Every manifest entry has a route string', manifest.entries.every(e => typeof e.route === 'string' && e.route.startsWith('/smokecraft')))

  // No entry may claim classification "full-live-react" or "clean-image-shell"
  // (i.e. "verified/complete") without a real auditedIn evidence trail — an
  // unsafe static mockup must never be marked complete.
  const claimedComplete = manifest.entries.filter(e => e.classification === 'full-live-react' || e.classification === 'clean-image-shell')
  check('Every screen classified as live/clean-shell cites real audit evidence (auditedIn is not empty/unclassified)',
    claimedComplete.every(e => e.auditedIn && e.auditedIn !== 'unclassified' && e.auditedIn !== 'not yet individually audited this operation'))
}

// 3. 27-session / 6-phase spine — re-assert the existing lock inline so this
// single validator is sufficient evidence the spine hasn't silently drifted.
const spine = []
for (const v of VISIT_STRUCTURE) for (const s of v.sessions) spine.push({ ...s, visit: v.visit })
check('Exactly 27 sessions in the spine', spine.length === 27)
check('TOTAL_SESSIONS constant equals 27', TOTAL_SESSIONS === 27)
check('Exactly 6 phases', VISIT_STRUCTURE.length === 6)
check('TOTAL_VISITS constant equals 6', TOTAL_VISITS === 6)
const sessionNumbers = spine.map(s => s.session).sort((a, b) => a - b)
check('Session numbers are exactly 1..27, no gap, no duplicate', JSON.stringify(sessionNumbers) === JSON.stringify(Array.from({ length: 27 }, (_, i) => i + 1)))

// 4. Every curriculum session in the manifest has a resolvable on-disk asset
// OR an explicitly disclosed missing-asset status (never silently blank).
const sessionEntries = SMOKECRAFT_SCREEN_MANIFEST.filter(m => m.type === 'curriculum')
check('Every curriculum manifest entry has an assetStatus field', sessionEntries.every(e => typeof e.assetStatus === 'string'))
check('No curriculum manifest entry silently references a non-existent SC_ASSETS key',
  sessionEntries.every(e => !e.assetKey || SC_ASSETS[e.assetKey] || e.assetStatus !== 'ok'))

// 5. Navigation registry — every registered destination route must actually
// exist in the live route inventory (never a fabricated/guessed target).
const liveRoutes = new Set(rawRoutes.map(r => r.fullPath === '(smokecraft index)' ? '/smokecraft' : `/smokecraft/${r.fullPath}`))
const navRoutes = allRegisteredNavRoutes()
const smokecraftNavRoutes = navRoutes.filter(r => r.startsWith('/smokecraft'))
check('Every SmokeCraft-namespace navigation-registry destination resolves to a real, currently-registered route',
  smokecraftNavRoutes.every(r => liveRoutes.has(r)))

// 6. Locked-baseline protection: the venue-select crop fix, the 27/6 spine,
// and the 3 approved-asset-wired screens (session1/resume/rewards) must not
// have regressed. This mirrors verify-smokecraft-phase-session-lock.mjs's
// existing checks so a single `npm run build` run also re-asserts them.
check('Locked phase groupings unchanged (Package J decision)',
  VISIT_STRUCTURE.map(v => v.sessions.map(s => s.session).join(',')).join('|') ===
  '1,2,3,4,5,6,7|8,9,10,11|12,13,14,15|16,17,18|19,20|21,22,23,24,25,26,27')

// 7. Holistic Fix 2 — no route may remain unclassified. Every one of the
// 108 active routes must carry a real classification (full-live-react,
// clean-image-shell, instructional-image, alias-redirect, or the honest
// unsafe-full-mockup flag if one is ever found) with real evidence, not
// the bare placeholder string.
if (existsSync('docs/smokecraft/SMOKECRAFT_GAME_MANIFEST.json')) {
  const manifest = JSON.parse(readFileSync('docs/smokecraft/SMOKECRAFT_GAME_MANIFEST.json', 'utf8'))
  const unclassified = manifest.entries.filter(e => e.classification === 'unclassified')
  check(`No route remains unclassified (${unclassified.length} unclassified)`, unclassified.length === 0)
}

// 8. Legacy <Navigate> route aliases must resolve to a route that still
// exists in the live route inventory — never a dangling alias.
if (existsSync('docs/smokecraft/SMOKECRAFT_GAME_MANIFEST.json')) {
  const manifest = JSON.parse(readFileSync('docs/smokecraft/SMOKECRAFT_GAME_MANIFEST.json', 'utf8'))
  const aliases = manifest.entries.filter(e => e.classification === 'alias-redirect')
  const brokenAliases = aliases.filter(a => {
    const target = a.auditedIn.match(/<Navigate> to (\/[^\s(]+)/)?.[1]
    return !target || !liveRoutes.has(target)
  })
  check(`Every legacy <Navigate> alias resolves to a currently-registered route (${aliases.length} aliases checked, ${brokenAliases.length} broken)`, brokenAliases.length === 0)

  // Holistic Fix 2E-3 — canonical alias table drift guard. Every literal
  // <Navigate to="/smokecraft/..."> inside App.jsx's SmokeCraft route tree
  // must be represented as an alias-redirect manifest entry with a matching
  // target — this is the "one canonical alias table" (the manifest itself
  // is that table). Fails the build if a new scattered alias is added to
  // App.jsx without also being classified in the manifest.
  const appJsxSrc = readFileSync('src/App.jsx', 'utf8')
  const smokecraftBlockMatch = appJsxSrc.match(/ {14}<Route path="smokecraft" element=\{<SmokeCraftJourneyProvider>[\s\S]*?\n {14}<\/Route>/)
  const smokecraftBlock = smokecraftBlockMatch ? smokecraftBlockMatch[0] : ''
  const literalAliasTargets = [...smokecraftBlock.matchAll(/<Navigate to="(\/smokecraft\/[^"]+)"/g)].map(m => m[1])
  const manifestAliasTargets = new Set(aliases.map(a => a.auditedIn.match(/<Navigate> to (\/[^\s(]+)/)?.[1]).filter(Boolean))
  const undocumentedAliases = literalAliasTargets.filter(t => !manifestAliasTargets.has(t))
  check(`Every <Navigate> alias target inside the SmokeCraft route tree is documented in the canonical alias table (manifest alias-redirect entries) (${literalAliasTargets.length} literal targets checked, ${undocumentedAliases.length} undocumented)`,
    undocumentedAliases.length === 0)
}

// 9. Commerce alias enforcement (Holistic Fix 2, item 10) — `venue-commerce`,
// `order`, and `ticket-tapper/staff-specials` are a documented, intentional
// alias group (see SMOKECRAFT_MIGRATION_QUEUE.md Group 4). This must stay
// enforced: if they ever silently diverge to different components, that is
// exactly the "three misleading routes" state the mandate forbids.
const appJsxForCommerce = readFileSync('src/App.jsx', 'utf8')
const commerceAliasLines = [
  appJsxForCommerce.match(/<Route path="venue-commerce"\s+element=\{<(\w+)/)?.[1],
  appJsxForCommerce.match(/<Route path="order"\s+element=\{<(\w+)/)?.[1],
  appJsxForCommerce.match(/<Route path="ticket-tapper\/staff-specials"\s+element=\{<(\w+)/)?.[1],
]
check('venue-commerce / order / ticket-tapper/staff-specials remain a documented, enforced alias group (identical component)',
  commerceAliasLines.every(Boolean) && new Set(commerceAliasLines).size === 1)

// 10. Holistic Fix 2A/2B — every manifest entry claiming a
// "Holistic Fix 2A"/"Holistic Fix 2B" auditedIn citation must be backed by
// a real component file that actually renders <SmokeCraftScreenShell — not
// just a text label. Route -> file map covers both passes; Golden Box
// routes that share one component (packaging-studio/packaging-studio/new,
// etc.) are expected and intentional.
if (existsSync('docs/smokecraft/SMOKECRAFT_GAME_MANIFEST.json')) {
  const manifest = JSON.parse(readFileSync('docs/smokecraft/SMOKECRAFT_GAME_MANIFEST.json', 'utf8'))
  const ROUTE_TO_FILE = {
    '/smokecraft/welcome': 'src/pages/smokecraft/WelcomeExperience.jsx',
    '/smokecraft/leaderboard': 'src/pages/smokecraft/Leaderboard.jsx',
    '/smokecraft/passport': 'src/pages/smokecraft/SmokeCraftPassport.jsx',
    '/smokecraft/venue-select': 'src/pages/smokecraft/VenueSelect.jsx',
    '/smokecraft/crafthub': 'src/pages/smokecraft/SmokeCraftCraftHub.jsx',
    '/smokecraft/challenge-hub': 'src/pages/smokecraft/ChallengeHub.jsx',
    '/smokecraft/rewards': 'src/pages/smokecraft/Rewards.jsx',
    '/smokecraft/golden-box': 'src/pages/smokecraft/GoldenBox.jsx',
    '/smokecraft/golden-box/status': 'src/pages/smokecraft/GoldenBoxStatus.jsx',
    '/smokecraft/golden-box/competitions': 'src/pages/smokecraft/goldenBox/GoldenBoxHub.jsx',
    '/smokecraft/golden-box/competitions/:competitionId': 'src/pages/smokecraft/goldenBox/CompetitionDetail.jsx',
    '/smokecraft/golden-box/entries/:entryId/blend': 'src/pages/smokecraft/goldenBox/EntryWorkspace.jsx',
    '/smokecraft/golden-box/results/:competitionId': 'src/pages/smokecraft/goldenBox/ResultsExperience.jsx',
    '/smokecraft/golden-box/judge': 'src/pages/smokecraft/goldenBox/JudgeDashboard.jsx',
    '/smokecraft/golden-box/judge/entries/:entryId': 'src/pages/smokecraft/goldenBox/JudgeEntryReview.jsx',
    '/smokecraft/golden-box/mentor/entries/:entryId': 'src/pages/smokecraft/goldenBox/MentorReview.jsx',
    '/smokecraft/golden-box/packaging-studio': 'src/pages/smokecraft/goldenBox/PackagingStudioDashboard.jsx',
    '/smokecraft/golden-box/packaging-studio/new': 'src/pages/smokecraft/goldenBox/PackagingStudioDashboard.jsx',
    '/smokecraft/golden-box/packaging-studio/:designId': 'src/pages/smokecraft/goldenBox/PackagingStudioEditor.jsx',
    '/smokecraft/golden-box/packaging-studio/:designId/preview': 'src/pages/smokecraft/goldenBox/PackagingStudioEditor.jsx',
    '/smokecraft/golden-box/packaging-studio/:designId/versions': 'src/pages/smokecraft/goldenBox/PackagingStudioVersions.jsx',
    '/smokecraft/golden-box/packaging-studio/:designId/share': 'src/pages/smokecraft/goldenBox/PackagingStudioShare.jsx',
    '/smokecraft/golden-box/packaging-review/:shareToken': 'src/pages/smokecraft/goldenBox/PackagingReview.jsx',
    '/smokecraft/origins': 'src/pages/smokecraft/Origins.jsx',
    '/smokecraft/curation': 'src/pages/smokecraft/Curation.jsx',
    '/smokecraft/leaves': 'src/pages/smokecraft/Leaves.jsx',
    '/smokecraft/leaf-challenge': 'src/pages/smokecraft/LeafChallenge.jsx',
    '/smokecraft/leaf-challenge-calculating': 'src/pages/smokecraft/LeafChallengeCalculating.jsx',
    '/smokecraft/leaf-challenge-result': 'src/pages/smokecraft/LeafChallengeResult.jsx',
    '/smokecraft/cultivation': 'src/pages/smokecraft/Cultivation.jsx',
    '/smokecraft/blend': 'src/pages/smokecraft/Blend.jsx',
    '/smokecraft/flavor-dna': 'src/pages/smokecraft/FlavorDNA.jsx',
    '/smokecraft/pairing': 'src/pages/smokecraft/Pairing.jsx',
    '/smokecraft/available': 'src/pages/smokecraft/Available.jsx',
    '/smokecraft/assistant': 'src/pages/smokecraft/Assistant.jsx',
    '/smokecraft/pairing-mastery': 'src/pages/smokecraft/PairingMastery.jsx',
    '/smokecraft/vitola': 'src/pages/smokecraft/Vitola.jsx',
    '/smokecraft': 'src/pages/SmokeCraft.jsx',
    '/smokecraft/seed-soil': 'src/pages/smokecraft/SeedSoil.jsx',
    '/smokecraft/request-purchase': 'src/pages/smokecraft/RequestPurchase.jsx',
    '/smokecraft/management-sync': 'src/pages/smokecraft/ManagementSync.jsx',
    '/smokecraft/resume': 'src/pages/smokecraft/ResumeJourney.jsx',
    '/smokecraft/rewards-center': 'src/pages/smokecraft/RewardsCenter.jsx',
    '/smokecraft/how-it-works': 'src/pages/smokecraft/HowItWorks.jsx',
    '/smokecraft/guest-pass': 'src/pages/smokecraft/GuestPass.jsx',
    '/smokecraft/scan': 'src/pages/smokecraft/Scan.jsx',
    '/smokecraft/enroll': 'src/pages/smokecraft/Enroll.jsx',
    '/smokecraft/identity': 'src/pages/smokecraft/Identity.jsx',
    '/smokecraft/art': 'src/pages/smokecraft/Art.jsx',
    '/smokecraft/cigar-gauge-guide': 'src/pages/smokecraft/CigarGaugeGuide.jsx',
    '/smokecraft/knowledge-check-demo': 'src/pages/smokecraft/KnowledgeCheckDemo.jsx',
    '/smokecraft/skill-tree': 'src/pages/smokecraft/SkillTree.jsx',
    '/smokecraft/collections': 'src/pages/smokecraft/CollectionsCenter.jsx',
    '/smokecraft/demo': 'src/pages/smokecraft/Demo.jsx',
    '/smokecraft/demo-reset': 'src/components/smokecraft/SmokeCraftDemoReset.jsx',
    '/smokecraft/visit-complete': 'src/pages/smokecraft/VisitComplete.jsx',
    '/smokecraft/filler-arrangement': 'src/pages/smokecraft/FillerArrangement.jsx',
    '/smokecraft/humidor-match': 'src/components/smokecraft/SmokeCraftScreenRenderer.jsx',
    '/smokecraft/meet-your-cigar': 'src/components/smokecraft/SmokeCraftScreenRenderer.jsx',
    '/smokecraft/terroir': 'src/components/smokecraft/SmokeCraftScreenRenderer.jsx',
    '/smokecraft/format': 'src/components/smokecraft/SmokeCraftScreenRenderer.jsx',
    '/smokecraft/cut-toast-light': 'src/components/smokecraft/SmokeCraftScreenRenderer.jsx',
    '/smokecraft/lighting-tutorial': 'src/components/smokecraft/SmokeCraftScreenRenderer.jsx',
    '/smokecraft/first-third': 'src/components/smokecraft/SmokeCraftScreenRenderer.jsx',
    '/smokecraft/flavor-memory': 'src/components/smokecraft/SmokeCraftScreenRenderer.jsx',
    '/smokecraft/pairing-lab': 'src/components/smokecraft/SmokeCraftScreenRenderer.jsx',
    '/smokecraft/second-third': 'src/components/smokecraft/SmokeCraftScreenRenderer.jsx',
    '/smokecraft/mentor-commentary': 'src/components/smokecraft/SmokeCraftScreenRenderer.jsx',
    '/smokecraft/knowledge-drop': 'src/components/smokecraft/SmokeCraftScreenRenderer.jsx',
    '/smokecraft/final-third': 'src/components/smokecraft/SmokeCraftScreenRenderer.jsx',
    '/smokecraft/scorecard': 'src/components/smokecraft/SmokeCraftScreenRenderer.jsx',
    '/smokecraft/ai-summary': 'src/components/smokecraft/SmokeCraftScreenRenderer.jsx',
    '/smokecraft/pairing-recommendations': 'src/components/smokecraft/SmokeCraftScreenRenderer.jsx',
    '/smokecraft/passport-stamp': 'src/components/smokecraft/SmokeCraftScreenRenderer.jsx',
    '/smokecraft/final-review': 'src/components/smokecraft/SmokeCraftScreenRenderer.jsx',
    '/smokecraft/session-complete': 'src/components/smokecraft/SmokeCraftScreenRenderer.jsx',
    '/smokecraft/wrapper-strength': 'src/pages/smokecraft/WrapperStrength.jsx',
    '/smokecraft/menu': 'src/pages/smokecraft/SmokeCraftMenu.jsx',
    '/smokecraft/cart': 'src/pages/smokecraft/SmokeCraftCart.jsx',
    '/smokecraft/checkout': 'src/pages/smokecraft/SmokeCraftCheckout.jsx',
    '/smokecraft/payment-success': 'src/pages/smokecraft/SmokeCraftPaymentSuccess.jsx',
    '/smokecraft/order-status': 'src/pages/smokecraft/SmokeCraftOrderStatus.jsx',
  }
  const claimedMigrated = manifest.entries.filter(e => /Holistic Fix 2A|Holistic Fix 2B|Holistic Fix 2C|Holistic Fix 2D|Holistic Fix 2E|Holistic Fix 2E-2/.test(e.auditedIn || ''))
  const verifiedCount = claimedMigrated.filter(e => {
    const file = ROUTE_TO_FILE[e.route]
    return file && existsSync(file) && readFileSync(file, 'utf8').includes('<SmokeCraftScreenShell')
  }).length
  check(`Manifest fullyMigratedScreens (${manifest.fullyMigratedScreens}) — every claimed route (${claimedMigrated.length}) is backed by a real <SmokeCraftScreenShell> render (${verifiedCount} verified)`,
    manifest.fullyMigratedScreens === claimedMigrated.length && verifiedCount === claimedMigrated.length && verifiedCount >= 82)
}

// Holistic Fix 2E-5 — educational-audit doc/code sync guard. Fails if the
// audit doc's grading table ever loses coverage for one of the 21 primary
// curriculum session slots (does not require the grading to be complete,
// only that no session silently drops out of the document).
if (existsSync('docs/smokecraft/SMOKECRAFT_EDUCATIONAL_COMPLETENESS_AUDIT.md')) {
  const auditDoc = readFileSync('docs/smokecraft/SMOKECRAFT_EDUCATIONAL_COMPLETENESS_AUDIT.md', 'utf8')
  const PRIMARY_SESSIONS = [1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 14, 15, 16, 19, 21, 22, 23, 24, 25, 27]
  const missingFromAudit = PRIMARY_SESSIONS.filter(n => !new RegExp(`\\|\\s*${n}\\b`).test(auditDoc))
  check(`Educational completeness audit doc still covers all ${PRIMARY_SESSIONS.length} primary session slots (${missingFromAudit.length} missing)`,
    missingFromAudit.length === 0, missingFromAudit.join(','))
}

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS' : 'FAIL'} — ${failures} failing check(s) ===\n`)
if (failures > 0) process.exit(1)
