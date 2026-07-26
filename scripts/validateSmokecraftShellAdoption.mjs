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

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS' : 'FAIL'} — ${failures} failing check(s) ===\n`)
if (failures > 0) process.exit(1)
