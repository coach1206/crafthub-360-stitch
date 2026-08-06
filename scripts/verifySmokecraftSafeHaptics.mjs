// Standalone verifier for the safe-haptics contract in src/utils/haptics.js
// (Holistic Fix — SmokeCraft production closure, Part 2).
//
// Runs in plain Node with a minimal mocked `navigator`/`document`, so it
// needs no browser and no test runner (none is currently wired into this
// repo's package.json). Proves, with a real module import and real mocked
// globals — not assertions about the source text — that:
//   1. no vibration fires before any user gesture (mount-time calls are safe)
//   2. vibration is allowed after a real user gesture (pointerdown/click/keydown)
//   3. unsupported browsers (no navigator.vibrate) stay safe, no throw
//   4. a vibrate() call that throws is caught — never propagates
//   5. prefers-reduced-motion suppresses vibration even after a gesture
//
// Usage: node scripts/verifySmokecraftSafeHaptics.mjs

import { pathToFileURL } from 'url'
import { resolve } from 'path'

let fail = 0
function check(name, cond, detail = '') {
  if (cond) console.log(`  OK    ${name}`)
  else { fail++; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}

console.log('── SmokeCraft safe-haptics verifier\n')

function makeMockDom({ vibrateImpl, hasVibrate = true, reducedMotion = false } = {}) {
  const listeners = {}
  const calls = []
  const vibrate = hasVibrate
    ? (pattern) => {
        calls.push(pattern)
        if (vibrateImpl) return vibrateImpl(pattern)
        return true
      }
    : undefined

  const document = {
    visibilityState: 'visible',
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn) },
    _fire(type) { for (const fn of listeners[type] || []) fn() },
  }
  const navigator = hasVibrate ? { vibrate } : {}
  const window = {
    matchMedia: (q) => ({ matches: q.includes('reduced-motion') ? reducedMotion : false }),
  }
  const localStorage = {
    getItem() { return null }, // no persisted session -> haptics default-enabled
  }
  return { document, navigator, window, localStorage, calls }
}

function setGlobal(name, value) {
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true })
}

async function freshImport(mocks) {
  setGlobal('document', mocks.document)
  setGlobal('navigator', mocks.navigator)
  setGlobal('window', mocks.window)
  setGlobal('localStorage', mocks.localStorage)
  // Cache-bust so the module's top-level gesture-listener setup re-runs
  // against the fresh mocked `document` for each scenario.
  const url = pathToFileURL(resolve('src/utils/haptics.js')).href + `?t=${Date.now()}_${Math.random()}`
  return import(url)
}

// 1. No vibration on "page load" (module import + immediate call, no gesture)
{
  const mocks = makeMockDom()
  const { triggerHaptic } = await freshImport(mocks)
  const fired = triggerHaptic('success')
  check('no vibration on page load (no gesture yet)', fired === false && mocks.calls.length === 0)
}

// 2. Allowed after a real user gesture
{
  const mocks = makeMockDom()
  const { triggerHaptic } = await freshImport(mocks)
  mocks.document._fire('pointerdown')
  const fired = triggerHaptic('light')
  check('vibration allowed after a real user gesture', fired === true && mocks.calls.length === 1)
}

// 3. Unsupported browsers remain safe
{
  const mocks = makeMockDom({ hasVibrate: false })
  const { triggerHaptic } = await freshImport(mocks)
  mocks.document._fire('click')
  let threw = false
  let fired
  try { fired = triggerHaptic('medium') } catch { threw = true }
  check('unsupported browser (no navigator.vibrate) stays safe, no throw', !threw && fired === false)
}

// 4. Rejected/throwing calls do not throw out of triggerHaptic
{
  const mocks = makeMockDom({ vibrateImpl: () => { throw new Error('DOMException: vibrate rejected') } })
  const { triggerHaptic } = await freshImport(mocks)
  mocks.document._fire('keydown')
  let threw = false
  let fired
  try { fired = triggerHaptic('warning') } catch { threw = true }
  check('a rejected/throwing vibrate() call does not throw', !threw && fired === false)
}

// 5. prefers-reduced-motion suppresses vibration even after a gesture
{
  const mocks = makeMockDom({ reducedMotion: true })
  const { triggerHaptic } = await freshImport(mocks)
  mocks.document._fire('pointerdown')
  const fired = triggerHaptic('success')
  check('prefers-reduced-motion suppresses vibration', fired === false && mocks.calls.length === 0)
}

console.log(`\n=== RESULT: ${fail === 0 ? 'PASS' : 'FAIL'} (${fail} check${fail === 1 ? '' : 's'} failed) ===`)
if (fail > 0) process.exit(1)
