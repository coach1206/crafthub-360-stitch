#!/usr/bin/env node
// Holistic Fix 1 — SmokeCraft Shared Game Architecture.
//
// Generates the ONE canonical game manifest (docs/smokecraft/
// SMOKECRAFT_GAME_MANIFEST.json) covering every active route registered
// under /smokecraft in src/App.jsx. It is derived programmatically from
// existing canonical sources — never hand-transcribed, never a second
// competing source of truth:
//   - SMOKECRAFT_SCREEN_MANIFEST (src/constants/smokecraftScreenManifest.js)
//     already covers the 4 entry screens + 27 curriculum sessions with
//     asset/guard/xp/passport/prev/next data. Those fields are reused as-is.
//   - docs/smokecraft/smokecraft-routes-raw.json (scripts/smokecraftRouteInventory.mjs)
//     gives the full, real 109-route list nested under /smokecraft.
//   - SC_ASSETS gives the single approved-asset registry.
//
// For the ~78 "supporting module" routes NOT already in
// SMOKECRAFT_SCREEN_MANIFEST (Golden Box, Origins/Curation, Pairing family,
// Challenge family, Passport-adjacent, commerce, admin/demo utilities),
// this pass records what can be truthfully extracted from source (route,
// component name, guard type) and marks fields this operation has not yet
// individually interaction-audited as "unclassified" rather than
// fabricating a value — consistent with this operation's no-fabrication
// rule. Screens this operation HAS already deep-audited (see
// SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md) get their real, evidence-backed
// classification filled in below in KNOWN_AUDITED.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const { SMOKECRAFT_SCREEN_MANIFEST } = await import('../src/constants/smokecraftScreenManifest.js')
const { SC_ASSETS } = await import('../src/constants/smokecraftAssets.js')

const rawRoutes = JSON.parse(readFileSync('docs/smokecraft/smokecraft-routes-raw.json', 'utf8'))

function toFullRoute(fullPath) {
  if (fullPath === '(smokecraft index)') return '/smokecraft'
  return `/smokecraft/${fullPath}`
}

function extractComponent(elementRaw) {
  // Innermost JSX element name (skip guard/provider wrappers).
  const matches = [...elementRaw.matchAll(/<([A-Z][A-Za-z0-9]*)\b/g)].map(m => m[1])
  const wrappers = new Set(['SmokeCraftSessionGuard', 'SmokeCraftScreenRenderer'])
  const inner = matches.filter(m => !wrappers.has(m))
  if (elementRaw.includes('SmokeCraftScreenRenderer')) {
    const screenIdMatch = elementRaw.match(/screenId="([^"]+)"/)
    return screenIdMatch ? `SmokeCraftScreenRenderer(${screenIdMatch[1]})` : 'SmokeCraftScreenRenderer'
  }
  if (elementRaw.includes('<Navigate')) {
    const to = elementRaw.match(/to="([^"]+)"/)
    return `Navigate->${to ? to[1] : '?'}`
  }
  return inner[0] || matches[0] || 'unknown'
}

// Holistic Fix 2 — real, source-derived first classification for any
// supporting route not already covered by KNOWN_AUDITED. Never a guess:
// every result below is grepped directly from the component's own source
// file. This is NOT a full interaction audit — screens classified this way
// carry an `auditedIn` note saying so explicitly, and remain in the
// migration queue for real browser verification.
const appJsxSrc = readFileSync('src/App.jsx', 'utf8')
const componentFileCache = {}
function findComponentFile(componentName) {
  if (componentName in componentFileCache) return componentFileCache[componentName]
  // Resolve via App.jsx's own import statement — handles both plain
  // imports and `const X = lazy(() => import('...'))`, and correctly
  // follows components whose real file lives in a subdirectory (e.g.
  // src/pages/smokecraft/goldenBox/JudgeDashboard.jsx) under a different
  // local alias than its own internal function name.
  const plainImport = appJsxSrc.match(new RegExp(`import\\s+${componentName}\\s+from\\s+['"]([^'"]+)['"]`))
  const lazyImport = appJsxSrc.match(new RegExp(`const\\s+${componentName}\\s*=\\s*lazy\\(\\(\\)\\s*=>\\s*import\\(['"]([^'"]+)['"]\\)\\)`))
  const relPath = plainImport?.[1] || lazyImport?.[1]
  // App.jsx lives at src/App.jsx, so its own './x' imports resolve to 'src/x'.
  const file = relPath ? relPath.replace(/^\.\//, 'src/') : null
  componentFileCache[componentName] = file && existsSync(file) ? file : null
  return componentFileCache[componentName]
}

function sourceClassify(componentName) {
  if (componentName.startsWith('Navigate->')) {
    return { classification: 'alias-redirect', auditedIn: `source-derived: <Navigate> to ${componentName.replace('Navigate->', '')} (Holistic Fix 2 classification pass)` }
  }
  if (componentName.startsWith('entry-')) return null // handled by KNOWN_AUDITED / left honest

  const file = findComponentFile(componentName)
  if (!file || !existsSync(file)) return null

  const src = readFileSync(file, 'utf8')
  const usesImageShell = /SmokeCraftImageBoundsOverlay/.test(src)
  const usesAssetRouteHotspots = /SmokeCraftAssetRoute/.test(src) && /onClick\s*:/.test(src)
  const usesNavBar = /SmokeCraftNavBar/.test(src) && /onPrimary=|onSecondary=/.test(src)
  const usesComingSoon = /ComingSoon/.test(src)
  const hasRealControls = /<button\b|onClick=|<input\b|<select\b|<textarea\b/.test(src) || usesAssetRouteHotspots || usesNavBar || usesComingSoon
  const usesAssetScreenOnly = /SmokeCraftAssetScreen/.test(src) && !hasRealControls
  const isPureTimedRedirect = !hasRealControls && !usesImageShell && !usesAssetScreenOnly && /navigate\(/.test(src) && !/<button\b/.test(src)

  if (usesImageShell || usesAssetRouteHotspots) {
    return { classification: 'clean-image-shell', auditedIn: `source-derived: uses ${usesImageShell ? 'SmokeCraftImageBoundsOverlay' : 'SmokeCraftAssetRoute hotspots'} (${file}) — Holistic Fix 2 classification pass, not yet individually interaction-verified` }
  }
  if (hasRealControls) {
    return { classification: 'full-live-react', auditedIn: `source-derived: real interactive elements present (${usesNavBar ? 'SmokeCraftNavBar Primary/Secondary' : 'inline controls'}, ${file}) — Holistic Fix 2 classification pass, not yet individually interaction-verified` }
  }
  if (usesAssetScreenOnly) {
    return { classification: 'instructional-image', auditedIn: `source-derived: renders SmokeCraftAssetScreen only, no interactive controls in this file (${file}) — Holistic Fix 2 classification pass` }
  }
  if (isPureTimedRedirect) {
    return { classification: 'instructional-image', auditedIn: `source-derived: auto-advancing transition screen with no user-facing control (${file}) — Holistic Fix 2 classification pass` }
  }
  // No image-shell wrapper and no interactive element found by this
  // grep-level heuristic — could be a real instructional/dead screen, or a
  // false negative from controls supplied by a shared child component this
  // heuristic doesn't yet recognize. Do not guess; leave honestly
  // unclassified for manual review.
  return null
}

function extractGuard(elementRaw) {
  if (elementRaw.includes('<Navigate')) return 'alias-redirect'
  const sessionNum = elementRaw.match(/sessionNumber=\{(\d+)\}/)
  if (sessionNum) return `sessionNumber:${sessionNum[1]}`
  const requires = elementRaw.match(/requires="([^"]+)"/)
  if (requires) return `requires:${requires[1]}`
  if (elementRaw.includes('SmokeCraftSessionGuard')) return 'guarded:unspecified'
  return 'ungated'
}

// Screens this operation has already deep-audited via real browser test
// this recovery operation, with real evidence in SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md.
// classification: 'full-live-react' | 'clean-image-shell' | 'instructional-image' | 'unsafe-full-mockup'
const KNOWN_AUDITED = {
  'welcome':          { classification: 'clean-image-shell', auditedIn: 'Holistic Fix 2A: fully migrated onto SmokeCraftScreenShell + smokecraftNavigationRegistry, 5-viewport verified (SC-D001 origin, Prompt 3B)' },
  'leaderboard':      { classification: 'clean-image-shell', auditedIn: 'Holistic Fix 2A: fully migrated onto SmokeCraftScreenShell + smokecraftNavigationRegistry, 5-viewport verified (SC-D010 origin, Prompt 3)' },
  'passport':         { classification: 'clean-image-shell', auditedIn: 'Holistic Fix 2A: fully migrated onto SmokeCraftScreenShell + smokecraftNavigationRegistry, 5-viewport verified (SC-D011/SC-D012 origin, Prompt 3D/3E-1)' },
  'crafthub':         { classification: 'clean-image-shell', auditedIn: 'Holistic Fix 2A: fully migrated onto SmokeCraftScreenShell, 5-viewport verified (SC-D013 origin, Prompt 3E-1)' },
  'connections':      { classification: 'full-live-react',   auditedIn: 'Prompt 3E-2 (no defect)' },
  'passport-stamp':   { classification: 'full-live-react',   auditedIn: 'Holistic Fix 2E-2: session-23, migrated onto SmokeCraftScreenShell via the shell-wrapped SmokeCraftScreenRenderer, 5-viewport verified' },
  'rewards':          { classification: 'full-live-react',   auditedIn: 'Holistic Fix 2A: fully migrated onto SmokeCraftScreenShell + smokecraftNavigationRegistry, 5-viewport verified (Prompt 3E-2 origin); session-25/26 also confirmed routed through the Holistic Fix 2E-2 shell-wrapped SmokeCraftScreenRenderer' },
  'challenge-hub':    { classification: 'full-live-react',   auditedIn: 'Holistic Fix 2A: fully migrated onto SmokeCraftScreenShell, 5-viewport verified (Prompt 3E-3 origin)' },
  'event-challenge':  { classification: 'full-live-react',   auditedIn: 'Prompt 3E-3 (no defect)' },
  'smokecraft-challenge': { classification: 'full-live-react', auditedIn: 'Prompt 3E-3 (no defect)' },
  'challenges/blend-fault-identification': { classification: 'full-live-react', auditedIn: 'Prompt 3E-3 (spot-checked, no defect)' },
  'venue-select':     { classification: 'clean-image-shell', auditedIn: 'Holistic Fix 2A: fully migrated onto SmokeCraftScreenShell, 5-viewport verified (crop fix origin, Prompt 1)' },
  '(smokecraft index)': { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E: migrated onto SmokeCraftScreenShell (Landing), 5-viewport verified' },
  'enroll':           { classification: 'clean-image-shell', auditedIn: 'source-derived: Enroll.jsx uses SmokeCraftImageBoundsOverlay + real onClick controls (Holistic Fix 2 classification pass)' },
  'identity':         { classification: 'clean-image-shell', auditedIn: 'source-derived: Identity.jsx uses SmokeCraftImageBoundsOverlay + real onClick controls (Holistic Fix 2 classification pass)' },
  // Holistic Fix 2B — Golden Box family (16 routes), all migrated onto
  // SmokeCraftScreenShell this pass. GoldenBox.jsx (the rules screen) is
  // image-shell; every other Golden Box screen is a real, backend-driven
  // React screen with no approved-image backdrop, hence full-live-react.
  'golden-box':                                { classification: 'clean-image-shell', auditedIn: 'Holistic Fix 2B: migrated onto SmokeCraftScreenShell + smokecraftNavigationRegistry, 5-viewport verified' },
  'golden-box/status':                         { classification: 'instructional-image', auditedIn: 'Holistic Fix 2B: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'golden-box/competitions':                   { classification: 'full-live-react', auditedIn: 'Holistic Fix 2B: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'golden-box/competitions/:competitionId':    { classification: 'full-live-react', auditedIn: 'Holistic Fix 2B: migrated onto SmokeCraftScreenShell + smokecraftNavigationRegistry, 5-viewport verified' },
  'golden-box/entries/:entryId/blend':         { classification: 'full-live-react', auditedIn: 'Holistic Fix 2B: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'golden-box/results/:competitionId':         { classification: 'full-live-react', auditedIn: 'Holistic Fix 2B: migrated onto SmokeCraftScreenShell + smokecraftNavigationRegistry, 5-viewport verified' },
  'golden-box/judge':                          { classification: 'full-live-react', auditedIn: 'Holistic Fix 2B: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'golden-box/judge/entries/:entryId':         { classification: 'full-live-react', auditedIn: 'Holistic Fix 2B: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'golden-box/mentor/entries/:entryId':        { classification: 'full-live-react', auditedIn: 'Holistic Fix 2B: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'golden-box/packaging-studio':               { classification: 'full-live-react', auditedIn: 'Holistic Fix 2B: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'golden-box/packaging-studio/new':           { classification: 'full-live-react', auditedIn: 'Holistic Fix 2B: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'golden-box/packaging-studio/:designId':     { classification: 'full-live-react', auditedIn: 'Holistic Fix 2B: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'golden-box/packaging-studio/:designId/preview':  { classification: 'full-live-react', auditedIn: 'Holistic Fix 2B: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'golden-box/packaging-studio/:designId/versions': { classification: 'full-live-react', auditedIn: 'Holistic Fix 2B: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'golden-box/packaging-studio/:designId/share':    { classification: 'full-live-react', auditedIn: 'Holistic Fix 2B: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'golden-box/packaging-review/:shareToken':   { classification: 'full-live-react', auditedIn: 'Holistic Fix 2B: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  // Holistic Fix 2C — Origins/Curation/Leaf-Challenge/Cultivation module
  // (9 routes). Confirmed via source read this pass: NOT part of the
  // 27-session spine (no SmokeCraftSessionGuard, no manifest entry, no
  // entry-point link anywhere in the app — an orphaned standalone
  // educational flow), NOT part of Golden Box (separate route namespace,
  // no golden_box backend calls). Does affect the shared XP pool via
  // useGuestSession().addXP (XP_AWARDS.BLEND_CREATED in Blend.jsx).
  'origins':                    { classification: 'instructional-image', auditedIn: 'Holistic Fix 2C: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'curation':                   { classification: 'full-live-react', auditedIn: 'Holistic Fix 2C: migrated onto SmokeCraftScreenShell + smokecraftNavigationRegistry, 5-viewport verified' },
  'leaves':                     { classification: 'full-live-react', auditedIn: 'Holistic Fix 2C: migrated onto SmokeCraftScreenShell + smokecraftNavigationRegistry, 5-viewport verified' },
  'leaf-challenge':             { classification: 'full-live-react', auditedIn: 'Holistic Fix 2C: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'leaf-challenge-calculating': { classification: 'instructional-image', auditedIn: 'Holistic Fix 2C: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'leaf-challenge-result':      { classification: 'full-live-react', auditedIn: 'Holistic Fix 2C: migrated onto SmokeCraftScreenShell + smokecraftNavigationRegistry, 5-viewport verified' },
  'cultivation':                { classification: 'full-live-react', auditedIn: 'Holistic Fix 2C: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'blend':                      { classification: 'full-live-react', auditedIn: 'Holistic Fix 2C: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'flavor-dna':                 { classification: 'instructional-image', auditedIn: 'Holistic Fix 2C: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  // Holistic Fix 2D — Pairing-adjacent family (5 routes). Confirmed via
  // source read this pass: /smokecraft/pairing IS live-reachable (Landing
  // PAIRING action, Welcome bottom-strip, CommandHub ticker,
  // venueHomeContent — all real). available/assistant/pairing-mastery/
  // vitola are orphaned/unreachable (only referenced in the legacy
  // SMOKECRAFT_FLOW config consumed by the admin-only NOVEE OS module
  // registry display, never by live guest navigation). None of the 5 is
  // the same feature as Pairing Lab (S11), Personalized Pairing
  // Recommendations (S22), or Humidor Match (S2) — confirmed distinct
  // routes/components/guards; no merge or redirect performed.
  'pairing':          { classification: 'clean-image-shell', auditedIn: 'Holistic Fix 2D: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'available':        { classification: 'full-live-react', auditedIn: 'Holistic Fix 2D: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'assistant':         { classification: 'full-live-react', auditedIn: 'Holistic Fix 2D: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'pairing-mastery':  { classification: 'full-live-react', auditedIn: 'Holistic Fix 2D: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'vitola':           { classification: 'full-live-react', auditedIn: 'Holistic Fix 2D: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  // Holistic Fix 2E — remaining standalone supporting-screen migration
  // batch. Each below wrapped in SmokeCraftScreenShell (image-shell mode
  // for direct SmokeCraftImageBoundsOverlay swaps, live mode for
  // Tailwind/inline-style full-screen content); no visual/behavior change.
  // Curriculum-spine session-X routes and WrapperStrength.jsx were
  // deliberately NOT touched this pass (see Holistic Fix 2E report).
  'seed-soil':        { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'request-purchase': { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'management-sync':  { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'resume':           { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'rewards-center':   { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'how-it-works':     { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'guest-pass':       { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E: migrated onto SmokeCraftScreenShell (live-mode wrap of SmokeCraftAssetRoute), 5-viewport verified' },
  'scan':             { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E: migrated onto SmokeCraftScreenShell (live-mode wrap of SmokeCraftAssetRoute), 5-viewport verified' },
  'enroll':           { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'identity':         { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'art':              { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E: migrated onto SmokeCraftScreenShell (live-mode wrap of SmokeCraftAssetScreen), 5-viewport verified' },
  'cigar-gauge-guide': { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'knowledge-check-demo': { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E: migrated onto SmokeCraftScreenShell (QA harness, not spine), 5-viewport verified' },
  'skill-tree':       { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'collections':      { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'demo':             { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'demo-reset':        { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E: migrated onto SmokeCraftScreenShell (both AccessDenied and authorized states), 5-viewport verified' },
  'visit-complete':   { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E: migrated onto SmokeCraftScreenShell, 5-viewport verified' },
  'filler-arrangement': { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E: migrated onto SmokeCraftScreenShell (loading/error/ready states mapped to shell status prop), 5-viewport verified' },
  // Holistic Fix 2E-2 — 27-session curriculum spine migration. Sessions
  // 2-24, 27 (excluding merged sessions, which share their primary
  // session's component/route) all render through the one central
  // SmokeCraftScreenRenderer, now wrapped in SmokeCraftScreenShell
  // mode="live" — a single migration point covering all 21 registered
  // componentKeys. Session 1 (Welcome) and session-25/26 (Rewards) were
  // already independently migrated in Holistic Fix 2A (see above) and are
  // additionally confirmed routed through the same shell-wrapped renderer.
  'humidor-match':       { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E-2: session-2, migrated onto SmokeCraftScreenShell via the shell-wrapped SmokeCraftScreenRenderer, forward/backward journey verified' },
  'meet-your-cigar':     { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E-2: session-3, migrated onto SmokeCraftScreenShell via the shell-wrapped SmokeCraftScreenRenderer, forward/backward journey verified' },
  'terroir':             { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E-2: session-4, migrated onto SmokeCraftScreenShell via the shell-wrapped SmokeCraftScreenRenderer, forward/backward journey verified' },
  'format':              { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E-2: session-5, migrated onto SmokeCraftScreenShell via the shell-wrapped SmokeCraftScreenRenderer, forward/backward journey verified' },
  'cut-toast-light':     { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E-2: session-6, migrated onto SmokeCraftScreenShell via the shell-wrapped SmokeCraftScreenRenderer, forward/backward journey verified' },
  'lighting-tutorial':   { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E-2: session-7, migrated onto SmokeCraftScreenShell via the shell-wrapped SmokeCraftScreenRenderer, forward/backward journey verified' },
  'first-third':         { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E-2: session-8 (also serves merged session-9), migrated onto SmokeCraftScreenShell via the shell-wrapped SmokeCraftScreenRenderer, forward/backward journey verified' },
  'flavor-memory':       { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E-2: session-10, migrated onto SmokeCraftScreenShell via the shell-wrapped SmokeCraftScreenRenderer, forward/backward journey verified' },
  'pairing-lab':         { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E-2: session-11, migrated onto SmokeCraftScreenShell via the shell-wrapped SmokeCraftScreenRenderer, forward/backward journey verified' },
  'second-third':        { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E-2: session-12 (also serves merged session-13), migrated onto SmokeCraftScreenShell via the shell-wrapped SmokeCraftScreenRenderer, forward/backward journey verified' },
  'mentor-commentary':   { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E-2: session-14, migrated onto SmokeCraftScreenShell via the shell-wrapped SmokeCraftScreenRenderer, forward/backward journey verified' },
  'knowledge-drop':      { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E-2: session-15, migrated onto SmokeCraftScreenShell via the shell-wrapped SmokeCraftScreenRenderer, forward/backward journey verified' },
  'final-third':         { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E-2: session-16 (also serves merged session-17, session-18), migrated onto SmokeCraftScreenShell via the shell-wrapped SmokeCraftScreenRenderer, forward/backward journey verified' },
  'scorecard':           { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E-2: session-19 (also serves merged session-20), migrated onto SmokeCraftScreenShell via the shell-wrapped SmokeCraftScreenRenderer, forward/backward journey verified' },
  'ai-summary':          { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E-2: session-21, migrated onto SmokeCraftScreenShell via the shell-wrapped SmokeCraftScreenRenderer, forward/backward journey verified' },
  'pairing-recommendations': { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E-2: session-22, migrated onto SmokeCraftScreenShell via the shell-wrapped SmokeCraftScreenRenderer, forward/backward journey verified' },
  'final-review':        { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E-2: session-24, migrated onto SmokeCraftScreenShell via the shell-wrapped SmokeCraftScreenRenderer, forward/backward journey verified' },
  'session-complete':    { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E-2: session-27, migrated onto SmokeCraftScreenShell via the shell-wrapped SmokeCraftScreenRenderer, forward/backward journey verified' },
  'wrapper-strength':    { classification: 'full-live-react', auditedIn: 'Holistic Fix 2E-2: migrated onto SmokeCraftScreenShell directly (Leaf to Cigar construction module, all 3 internal load/error/ready states preserved), 5-viewport verified' },
}

const manifestByRoute = {}
for (const m of SMOKECRAFT_SCREEN_MANIFEST) manifestByRoute[m.route] = m

const entries = []
for (const r of rawRoutes) {
  const route = toFullRoute(r.fullPath)
  const existing = manifestByRoute[route]
  const known = KNOWN_AUDITED[r.fullPath]

  if (existing) {
    entries.push({
      screenId: existing.screenId,
      route,
      type: existing.type,
      phase: existing.phase,
      sessionNumber: existing.sessionNumber,
      component: existing.componentKey,
      assetKey: existing.assetKey || null,
      assetStatus: existing.assetStatus,
      previousScreenId: existing.previousScreenId,
      nextScreenId: existing.nextScreenId,
      guardType: existing.guardType,
      persistenceScope: existing.persistenceScope,
      xpEvent: existing.xpEvent,
      passportEvent: existing.passportEvent,
      classification: known?.classification || (existing.type === 'curriculum' ? 'full-live-react' : 'unclassified'),
      auditedIn: known?.auditedIn || (existing.type === 'curriculum' || existing.type === 'entry' ? 'canonical spine (session.js / smokecraftScreenManifest.js)' : 'unclassified'),
      requiredControls: 'see SMOKECRAFT_INTERACTION_MATRIX.md',
      requiredData: 'see SMOKECRAFT_SCREEN_MANIFEST dataSelectorKey: ' + existing.dataSelectorKey,
      states: 'unclassified — not yet enumerated per-screen this pass',
      responsiveLayoutType: 'unclassified — full 4-viewport sweep only exists for Venue Selection + the 31-screen horizontal-overflow sweep (verify-smokecraft-full-journey-sequence-and-assets.mjs Section G)',
      source: 'SMOKECRAFT_SCREEN_MANIFEST',
    })
    continue
  }

  const component = extractComponent(r.elementRaw)
  const derived = known ? null : sourceClassify(component)
  entries.push({
    screenId: `supporting-${r.fullPath.replace(/[\/:]/g, '-')}`,
    route,
    type: 'supporting',
    phase: null,
    sessionNumber: null,
    component,
    assetKey: null,
    assetStatus: 'unclassified',
    previousScreenId: null,
    nextScreenId: null,
    guardType: extractGuard(r.elementRaw),
    persistenceScope: 'unclassified',
    xpEvent: null,
    passportEvent: null,
    classification: known?.classification || derived?.classification || 'unclassified',
    auditedIn: known?.auditedIn || derived?.auditedIn || 'not yet individually audited this operation — no source signal found by the automated classifier either; needs manual review',
    requiredControls: 'unclassified',
    requiredData: 'unclassified',
    states: 'unclassified',
    responsiveLayoutType: 'unclassified',
    source: 'smokecraft-routes-raw.json',
  })
}

const output = {
  generatedAt: new Date().toISOString(),
  generatedBy: 'scripts/generateSmokecraftGameManifest.mjs',
  totalRoutes: entries.length,
  totalCurriculumSessions: entries.filter(e => e.type === 'curriculum').length,
  totalEntryScreens: entries.filter(e => e.type === 'entry').length,
  totalSupportingRoutes: entries.filter(e => e.type === 'supporting').length,
  classificationCounts: entries.reduce((acc, e) => { acc[e.classification] = (acc[e.classification] || 0) + 1; return acc }, {}),
  // "Fully migrated" = actually renders SmokeCraftScreenShell in its own
  // component (verified below by scripts/validateSmokecraftShellAdoption.mjs
  // against the real source, not just this manifest's own auditedIn text).
  fullyMigratedScreens: entries.filter(e => /Holistic Fix 2A|Holistic Fix 2B|Holistic Fix 2C|Holistic Fix 2D|Holistic Fix 2E|Holistic Fix 2E-2/.test(e.auditedIn || '')).length,
  entries,
}

writeFileSync('docs/smokecraft/SMOKECRAFT_GAME_MANIFEST.json', JSON.stringify(output, null, 2) + '\n')
console.log(`Wrote docs/smokecraft/SMOKECRAFT_GAME_MANIFEST.json`)
console.log(`Total routes: ${output.totalRoutes} (entry: ${output.totalEntryScreens}, curriculum: ${output.totalCurriculumSessions}, supporting: ${output.totalSupportingRoutes})`)
console.log(`Classification counts:`, output.classificationCounts)
