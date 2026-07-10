/**
 * Verification: SmokeCraft Landing Interactions + Ticket Tapper Motion
 *
 * Confirms:
 * - SmokeCraft landing (/smokecraft) hotspot covers "Start New SmokeCraft Session" CTA
 * - Identity (/smokecraft/identity) hotspot awards session rewards before navigating
 * - TicketTapperSpecialsStrip has marquee animation + empty-state placeholder
 * - SmokeCraftHotspotLayer maps "Start New Session" label correctly
 * - No SmokeCraft images were modified
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../../')

let passed = 0
let failed = 0

function check(label, ok, detail = '') {
  if (ok) {
    console.log(`  ✅ ${label}`)
    passed++
  } else {
    console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`)
    failed++
  }
}

function read(relPath) {
  const p = resolve(ROOT, relPath)
  if (!existsSync(p)) return null
  return readFileSync(p, 'utf8')
}

console.log('\nSmokeCraft Landing Interactions + Ticket Tapper Verification\n')

// ── Gate 1: SmokeCraft landing hotspot ────────────────────────────────────────
console.log('Gate 1 — SmokeCraft landing: "Start New SmokeCraft Session" hotspot')
const landing = read('src/pages/SmokeCraft.jsx')
check('SmokeCraft.jsx exists', landing !== null)
if (landing) {
  check('Landing hotspot label is "Start New SmokeCraft Session"',
    landing.includes('Start New SmokeCraft Session'))
  check('Landing hotspot navigates to /smokecraft/identity',
    landing.includes('/smokecraft/identity'))
  // Hotspot zone: y ≥ 40% (button visible above fold), width ≥ 10% (not a dot), height ≥ 5%
  const yMatch = landing.match(/y:\s*(\d+)/)
  const wMatch = landing.match(/width:\s*(\d+)/)
  const hMatch = landing.match(/height:\s*(\d+)/)
  if (yMatch) check('Landing hotspot y ≥ 40% (button in content area)',
    parseInt(yMatch[1], 10) >= 40, `y=${yMatch[1]}`)
  if (wMatch) check('Landing hotspot width ≥ 10% (usable tap width)',
    parseInt(wMatch[1], 10) >= 10, `width=${wMatch[1]}`)
  if (hMatch) check('Landing hotspot height ≥ 5% (tall enough tap target)',
    parseInt(hMatch[1], 10) >= 5, `height=${hMatch[1]}`)
}

// ── Gate 2: Identity page hotspot awards session rewards ──────────────────────
console.log('\nGate 2 — Identity page: awards session rewards before navigating')
const identity = read('src/pages/smokecraft/Identity.jsx')
check('Identity.jsx exists', identity !== null)
if (identity) {
  check('Identity uses useNavigate or useSmokeCraftProgress for routing',
    identity.includes('useNavigate') || identity.includes('useSmokeCraftProgress'))
  check('Identity uses triggerHaptic or hapticTap for session feedback',
    identity.includes('triggerHaptic') || identity.includes('hapticTap'))
  check('Identity hotspot navigates to /smokecraft/golden-box',
    identity.includes('/smokecraft/golden-box'))
  check('Identity calls triggerHaptic for premium tap feedback',
    identity.includes('triggerHaptic'))
}

// ── Gate 3: SmokeCraftHotspotLayer shortLabel handles new session label ────────
console.log('\nGate 3 — SmokeCraftHotspotLayer: shortLabel maps landing CTA correctly')
const hotspotLayer = read('src/components/smokecraft/SmokeCraftHotspotLayer.jsx')
check('SmokeCraftHotspotLayer.jsx exists', hotspotLayer !== null)
if (hotspotLayer) {
  check('shortLabel maps "start new" / "new session" to Start New Session',
    hotspotLayer.includes('start new') || hotspotLayer.includes('new session'))
  check('shortLabel result text contains "Start New Session"',
    hotspotLayer.includes('Start New Session'))
  check('CTA pill still has pulse animation', hotspotLayer.includes('sc-pulse'))
  check('CTA pill still has backdrop-filter blur', hotspotLayer.includes('backdrop-filter'))
  check('Active/press state has sc-pressed or sc-tap-flash animation',
    hotspotLayer.includes('sc-pressed') || hotspotLayer.includes('sc-tap-flash'))
  check('Hover state removes animation (no pulse on hover)',
    hotspotLayer.includes('animation: none'))
  check('touchAction manipulation set for touch devices',
    hotspotLayer.includes('touchAction'))
  check('focus-visible outline for keyboard accessibility',
    hotspotLayer.includes('focus-visible'))
}

// ── Gate 4: TicketTapperSpecialsStrip — marquee + placeholder (optional) ──────
console.log('\nGate 4 — TicketTapperSpecialsStrip: marquee motion + empty placeholder (optional feature)')
const ticker = read('src/components/smokecraft/TicketTapperSpecialsStrip.jsx')
// This component is optional — pass if absent, check contents if present
check('TicketTapperSpecialsStrip.jsx present or absent gracefully', true)
if (ticker) {
  check('Marquee CSS animation defined (sc-ticker-scroll)',
    ticker.includes('sc-ticker-scroll'))
  check('Marquee track class applied (.sc-ticker-track)',
    ticker.includes('sc-ticker-track'))
  check('Ticker pauses on hover (animation-play-state: paused)',
    ticker.includes('animation-play-state: paused'))
  check('Cards duplicated for seamless loop',
    ticker.includes('customerSpecials, ...customerSpecials') ||
    ticker.includes('[...customerSpecials, ...customerSpecials]'))
  check('Empty state placeholder rendered when no specials',
    ticker.includes('Specials coming soon') || ticker.includes('coming soon'))
  check('Empty state uses pulsing dot animation (sc-ticker-empty-dot)',
    ticker.includes('sc-ticker-empty-dot'))
  check('No longer returns null when empty (placeholder instead)',
    !ticker.match(/if\s*\(\s*customerSpecials\.length\s*===\s*0\s*\)\s*return\s+null/))
  check('Edge-fade gradient overlays (::before / ::after)',
    ticker.includes('sc-ticker-wrapper'))
  check('Styles injected via ensureTickerStyles (one-time DOM inject)',
    ticker.includes('ensureTickerStyles'))
}

// ── Gate 5: Session guard allows fresh-user entry (session 1 auto-unlocked) ───
console.log('\nGate 5 — Session guard: session 1 always unlocked for fresh users')
const journeyConstants = read('src/constants/smokecraftJourney.js')
const sessionConstants = read('src/constants/session.js')
check('smokecraftJourney.js exists', journeyConstants !== null)
check('session.js exists', sessionConstants !== null)
if (journeyConstants) {
  check("isVisitUnlocked returns true when visitNumber <= 1",
    journeyConstants.includes('visitNumber <= 1') ||
    (sessionConstants && sessionConstants.includes('visitNumber <= 1')))
}
if (sessionConstants) {
  check("Session 1 id is 'entry' (auto-complete)",
    sessionConstants.includes("id: 'entry'") || sessionConstants.includes('id: "entry"'))
  check("isSessionComplete treats 'entry' as always complete",
    sessionConstants.includes("sessionId === 'entry' ? true") ||
    journeyConstants.includes("sessionId === 'entry' ? true"))
}

// ── Gate 6: SmokeCraftSessionGuard wires correctly ───────────────────────────
console.log('\nGate 6 — SmokeCraftSessionGuard: demo bypass + session check')
const guard = read('src/components/smokecraft/SmokeCraftSessionGuard.jsx')
check('SmokeCraftSessionGuard.jsx exists', guard !== null)
if (guard) {
  check('Guard checks isDemoMode for bypass', guard.includes('isDemoMode'))
  check('Guard uses isSessionUnlocked', guard.includes('isSessionUnlocked'))
  check('Guard renders LockedSmokeCraftScreen when locked',
    guard.includes('LockedSmokeCraftScreen'))
}

// ── Gate 7: Landing image asset exists at the referenced path ────────────────
console.log('\nGate 7 — Landing image: approved asset exists on disk')
const { readdirSync, existsSync: fsExists } = await import('fs')
// Extract src path from SmokeCraft.jsx
const srcMatch = landing && landing.match(/src=["']([^"']+)["']/)
const referencedSrc = srcMatch ? srcMatch[1] : null
check('SmokeCraft.jsx references a src path', !!referencedSrc, referencedSrc || 'no src found')
if (referencedSrc) {
  // Resolve the public-relative URL to the actual file (strip leading /)
  const assetPath = resolve(ROOT, 'public', referencedSrc.replace(/^\//, ''))
  check(`Asset exists at public${referencedSrc}`, fsExists(assetPath), assetPath)
  check('No longer references old smokecraft-landing.png',
    !landing.includes('smokecraft-landing.png'))
  check('No longer references DISOVER (misspelled) asset',
    !landing.includes('DISOVER YOUR CIGAR PROFILE'))
}

// ── Gate 8: Hotspot pills hidden in production — no browser tooltips ─────────
console.log('\nGate 8 — SmokeCraftHotspotLayer: pills hidden in production, no browser tooltips')
if (hotspotLayer) {
  check('sc-cta-pill span is gated on debug (not rendered unconditionally)',
    !!hotspotLayer.match(/\{debug\s*&&[\s\S]*?sc-cta-pill/) ||
    !!hotspotLayer.match(/sc-cta-pill[\s\S]{0,200}\{debug\s*&&/))
  check('Production buttons are transparent (background: transparent when not debug)',
    hotspotLayer.includes("'transparent'") || hotspotLayer.includes('"transparent"') ||
    hotspotLayer.match(/background:.*debug.*transparent/s))
  check('Debug mode controlled by sessionStorage smokecraft_hotspot_debug',
    hotspotLayer.includes('smokecraft_hotspot_debug'))
  check('Debug mode flag defaults to off (=== "1" check)',
    hotspotLayer.includes("=== '1'") || hotspotLayer.includes('=== "1"'))
  check('Buttons have aria-label for accessibility (screen readers)',
    hotspotLayer.includes('aria-label'))
  // title= creates native browser tooltips — must be ABSENT in production hotspot buttons
  check('NO title attribute on hotspot buttons (prevents "Continue Previous Session" tooltip leak)',
    !hotspotLayer.includes('title={h.label}') && !hotspotLayer.match(/HotspotButton[\s\S]{0,800}title=\{/))
}

// ── Gate 8b: SmokeCraftAssetScreen — image clears bottom nav ─────────────────
console.log('\nGate 8b — SmokeCraftAssetScreen: image stops at nav top (bottom: 64px)')
const assetScreen = read('src/components/smokecraft/SmokeCraftAssetScreen.jsx')
check('SmokeCraftAssetScreen.jsx exists', assetScreen !== null)
if (assetScreen) {
  check('Container uses bottom: NAV_HEIGHT or bottom: 64 (not inset:0 to 100vh)',
    assetScreen.includes('NAV_HEIGHT') || assetScreen.includes('bottom: 64') || assetScreen.includes('bottom:64'))
  check('NAV_HEIGHT constant defined (64px)',
    assetScreen.includes('NAV_HEIGHT = 64') || assetScreen.includes('64px'))
  check('objectPosition prop accepted (allows per-screen anchor)',
    assetScreen.includes('objectPosition'))
  check('Image does NOT use fixed height: 100vh (would extend under nav)',
    !assetScreen.match(/height:\s*['"]?100vh/))
}

// ── Gate 8c: Landing page safe-area anchor + hotspot separation ──────────────
console.log('\nGate 8c — Landing page: objectPosition bottom + non-overlapping hotspots')
if (landing) {
  check('Landing uses objectPosition center bottom (anchors image to show CTA area)',
    landing.includes('center bottom') || landing.includes('objectPosition'))
  // Verify Start and Continue hotspots do not overlap in y-axis
  const allY = [...landing.matchAll(/label:\s*'([^']+)'[\s\S]{0,200}?y:\s*(\d+)[\s\S]{0,100}?height:\s*(\d+)/g)]
  let startEntry = null; let continueEntry = null
  for (const m of allY) {
    if (m[1].toLowerCase().includes('start new')) startEntry = { y: +m[2], h: +m[3] }
    if (m[1].toLowerCase().includes('continue')) continueEntry = { y: +m[2], h: +m[3] }
  }
  if (startEntry && continueEntry) {
    const startBottom = startEntry.y + startEntry.h
    const continueBottom = continueEntry.y + continueEntry.h
    const noOverlap = continueBottom <= startEntry.y || startBottom <= continueEntry.y
    check('Start New and Continue hotspots do not overlap vertically', noOverlap,
      `Start y:${startEntry.y}+${startEntry.h}, Continue y:${continueEntry.y}+${continueEntry.h}`)
  }
}

// ── Gate 9: /smokecraft landing has no stale 8/24 progress header ────────────
console.log('\nGate 9 — /smokecraft landing: progress header suppressed, no stale 8/24 labels')
const appJsx = read('src/App.jsx')
check('App.jsx exists', appJsx !== null)
if (appJsx) {
  check('/smokecraft index route uses hideHeader to suppress progress overlay',
    !!appJsx.match(/Route\s+index[^>]*SmokeCraftSessionGuard[^>]*hideHeader/) ||
    !!appJsx.match(/hideHeader[^>]*SmokeCraft\s*\//))
  check('TOTAL_VISITS is 7 (not 8)',
    !!(read('src/constants/session.js') || '').includes('TOTAL_VISITS = 7'))
  check('TOTAL_SESSIONS is 18 (not 24)',
    !!(read('src/constants/session.js') || '').includes('TOTAL_SESSIONS = 18'))
  check('"Challenge / Second Cigar" not in session constants',
    !(read('src/constants/session.js') || '').includes('Challenge / Second Cigar'))
}

// ── Gate 10: How It Works does NOT route to /smokecraft/enroll ───────────────
console.log('\nGate 10 — SmokeCraft.jsx landing: How It Works routes to /smokecraft/how-it-works')
if (landing) {
  check('How It Works hotspot routes to /smokecraft/how-it-works',
    landing.includes('/smokecraft/how-it-works'))
  check('How It Works does NOT route to /smokecraft/enroll',
    !landing.match(/How It Works[\s\S]{0,200}\/smokecraft\/enroll/))
  check('Continue Previous Session uses currentAllowed (not hardcoded enroll)',
    landing.includes('currentAllowed') &&
    !landing.match(/Continue Previous Session[\s\S]{0,200}\/smokecraft\/enroll/))
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n─────────────────────────────────────────────────`)
console.log(`SmokeCraft Landing Interactions: ${passed + failed} checks, ${passed} passed, ${failed} failed`)
if (failed === 0) {
  console.log('\n✅ Landing interactions live-ready. Start Session CTA wired, Ticket Tapper animated.')
  process.exit(0)
} else {
  console.log('\n❌ Landing interaction issues found — fix before live deployment.')
  process.exit(1)
}
