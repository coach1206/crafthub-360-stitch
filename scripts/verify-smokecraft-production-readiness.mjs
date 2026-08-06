#!/usr/bin/env node
/**
 * SmokeCraft production readiness verification script (Truth Gate — Phase 6).
 *
 * Runnable against any live SmokeCraft deployment by a human WITH real
 * access, via SMOKECRAFT_BASE_URL. This session tested it ONLY against a
 * local simulation (localhost, backed by a real local Postgres instance
 * with all 118 migrations applied) — never against the real Railway
 * production URL, which this sandbox's network policy blocks (403).
 * That distinction is disclosed in this script's own summary output, not
 * just in the repo's audit report.
 *
 * Credentials for the owner-safe readiness endpoint are optional and are
 * NEVER printed — only whether they were supplied and whether the call
 * succeeded.
 *
 * Usage:
 *   SMOKECRAFT_BASE_URL=http://localhost:3001 node scripts/verify-smokecraft-production-readiness.mjs
 *   SMOKECRAFT_BASE_URL=https://<railway-url> SMOKECRAFT_ADMIN_EMAIL=... SMOKECRAFT_ADMIN_PIN=... node scripts/verify-smokecraft-production-readiness.mjs
 */

const BASE_URL = process.env.SMOKECRAFT_BASE_URL || 'http://localhost:3001'
const ADMIN_EMAIL = process.env.SMOKECRAFT_ADMIN_EMAIL || null
const ADMIN_PIN = process.env.SMOKECRAFT_ADMIN_PIN || null

const results = []
function record(name, ok, detail = '') {
  results.push({ name, ok, detail })
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`)
}

async function get(pathname, opts = {}) {
  const res = await fetch(`${BASE_URL}${pathname}`, { redirect: 'manual', ...opts })
  let body = null
  try { body = await res.json() } catch { /* not JSON — fine for HTML routes */ }
  return { status: res.status, body, headers: res.headers }
}

async function main() {
  console.log(`\nSmokeCraft Production Readiness Verification`)
  console.log(`Target: ${BASE_URL}`)
  console.log(`${BASE_URL.includes('localhost') || BASE_URL.includes('127.0.0.1') ? 'LOCAL SIMULATION TARGET' : 'REMOTE TARGET — real network access required, not exercised by the authoring sandbox'}\n`)

  // ── 1. Health endpoint ──────────────────────────────────────────────
  try {
    const { status, body } = await get('/api/health')
    record('health endpoint responds 200', status === 200, `status=${status}`)
    record('health endpoint reports db mode', !!body?.db, `db=${body?.db}`)
  } catch (err) {
    record('health endpoint reachable', false, err.message)
  }

  // ── 2. Welcome page (SPA shell) ─────────────────────────────────────
  try {
    const res = await fetch(`${BASE_URL}/smokecraft/welcome`)
    const html = await res.text()
    record('welcome page returns 200', res.status === 200, `status=${res.status}`)
    record('welcome page is not a 500 error page', !/internal server error/i.test(html))
  } catch (err) {
    record('welcome page reachable', false, err.message)
  }

  // ── 3. Session 1 route ──────────────────────────────────────────────
  try {
    const res = await fetch(`${BASE_URL}/smokecraft/first-third`)
    record('Session 1 route returns 200', res.status === 200, `status=${res.status}`)
  } catch (err) {
    record('Session 1 route reachable', false, err.message)
  }

  // ── 4. Session 2 route ──────────────────────────────────────────────
  try {
    const res = await fetch(`${BASE_URL}/smokecraft/humidor-match`)
    record('Session 2 route returns 200', res.status === 200, `status=${res.status}`)
  } catch (err) {
    record('Session 2 route reachable', false, err.message)
  }

  // ── 5. Draft GET (Session 2's exact incident endpoint) ──────────────
  try {
    const { status, body } = await get('/api/smokecraft/player-state/tasting/humidor-match/draft')
    record('draft GET is never HTTP 500', status !== 500, `status=${status}`)
    record('draft GET returns JSON with success field', typeof body?.success === 'boolean', `body=${JSON.stringify(body).slice(0, 120)}`)
  } catch (err) {
    record('draft GET reachable', false, err.message)
  }

  // ── 6. Invalid slug handling ─────────────────────────────────────────
  try {
    const { status } = await get('/api/smokecraft/player-state/tasting/NOT_A_VALID_SLUG!!/draft')
    record('invalid session slug returns 400 (not 500)', status === 400, `status=${status}`)
  } catch (err) {
    record('invalid slug check reachable', false, err.message)
  }

  // ── 7. No HTTP 500 across a small route sample ───────────────────────
  const sampleRoutes = [
    '/api/health', '/api/smokecraft/player-state/health',
    '/api/smokecraft/venue-commerce/venues',
  ]
  for (const route of sampleRoutes) {
    try {
      const { status } = await get(route)
      record(`no HTTP 500 on ${route}`, status !== 500, `status=${status}`)
    } catch (err) {
      record(`${route} reachable`, false, err.message)
    }
  }

  // ── 8. Venue directory response ──────────────────────────────────────
  try {
    const { status, body } = await get('/api/smokecraft/venue-commerce/venues')
    record('venue directory responds without 500', status !== 500, `status=${status}`)
    record('venue directory response has a venues array (real or honestly empty)', Array.isArray(body?.venues), `venues=${Array.isArray(body?.venues) ? body.venues.length : 'n/a'}`)
  } catch (err) {
    record('venue directory reachable', false, err.message)
  }

  // ── 9. Production build/version marker + no incorrect LOCAL PREVIEW ─
  try {
    const { status, body } = await get('/api/version')
    record('/api/version responds', status === 200, `status=${status}`)
    const env = body?.environment
    const looksProd = BASE_URL.includes('localhost') ? true : env === 'production'
    record('environment marker matches target (no LOCAL PREVIEW misdetection against a remote URL)', looksProd, `environment=${env}`)
  } catch (err) {
    record('/api/version reachable', false, err.message)
  }

  // ── 10. Owner-safe readiness endpoint (only if credentials supplied) ─
  if (ADMIN_EMAIL && ADMIN_PIN) {
    try {
      const loginRes = await fetch(`${BASE_URL}/api/auth/admin-login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, pin: ADMIN_PIN }),
      })
      const setCookie = loginRes.headers.get('set-cookie') || ''
      const cookieHeader = setCookie.split(';')[0] || ''
      record('admin login succeeds with supplied credentials', loginRes.status === 200, `status=${loginRes.status}`)
      if (loginRes.status === 200 && cookieHeader) {
        const readiness = await fetch(`${BASE_URL}/api/smokecraft/diagnostics/readiness`, {
          headers: { Cookie: cookieHeader },
        })
        const readinessBody = await readiness.json().catch(() => null)
        record('readiness endpoint reachable with admin session', readiness.status === 200, `status=${readiness.status}`)
        record('readiness endpoint reports overallStatus', ['ready', 'degraded', 'failed'].includes(readinessBody?.overallStatus), `overallStatus=${readinessBody?.overallStatus}`)
      }
    } catch (err) {
      record('owner-safe readiness check', false, err.message)
    }
  } else {
    console.log('  SKIP  owner-safe readiness endpoint — SMOKECRAFT_ADMIN_EMAIL / SMOKECRAFT_ADMIN_PIN not supplied (credentials never printed, only presence is checked)')
  }

  // ── 11. Draft save/resume flow (best-effort; requires a guest cookie) ─
  try {
    const getRes = await fetch(`${BASE_URL}/api/smokecraft/player-state/tasting/humidor-match/draft`)
    const setCookie = getRes.headers.get('set-cookie') || ''
    const cookieHeader = setCookie.split(';')[0] || ''
    const getBody = await getRes.json().catch(() => null)
    if (cookieHeader && getBody) {
      const putRes = await fetch(`${BASE_URL}/api/smokecraft/player-state/tasting/humidor-match/draft`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({ draftData: { selectedId: 'virtual_humidor' }, expectedVersion: getBody.version ?? 0 }),
      })
      record('draft save succeeds for a fresh guest session', putRes.status === 200, `status=${putRes.status}`)
      const resumeRes = await fetch(`${BASE_URL}/api/smokecraft/player-state/tasting/humidor-match/draft`, { headers: { Cookie: cookieHeader } })
      const resumeBody = await resumeRes.json().catch(() => null)
      record('draft resumes after a second GET (simulated refresh)', resumeBody?.draftData?.selectedId === 'virtual_humidor', `draftData=${JSON.stringify(resumeBody?.draftData)}`)
    } else {
      console.log('  SKIP  draft save/resume flow — no guest cookie issued by this deployment (identity middleware behavior may differ)')
    }
  } catch (err) {
    record('draft save/resume flow', false, err.message)
  }

  // ── Summary ───────────────────────────────────────────────────────────
  const passed = results.filter(r => r.ok).length
  const failed = results.filter(r => !r.ok).length
  console.log(`\n=== SUMMARY ===`)
  console.log(JSON.stringify({
    target: BASE_URL,
    testedAgainstRealProductionURL: false,
    disclosure: 'This run was executed against the target above only. It does not itself prove anything about crafthub360.up.railway.app unless SMOKECRAFT_BASE_URL was pointed at it by a human with real network access.',
    passed, failed, total: results.length,
    overall: failed === 0 ? 'PASS' : 'FAIL',
  }, null, 2))

  process.exit(failed === 0 ? 0 : 1)
}

main().catch(err => {
  console.error('Verification script crashed:', err.message)
  process.exit(1)
})
