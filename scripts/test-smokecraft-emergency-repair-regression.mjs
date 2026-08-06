#!/usr/bin/env node
/**
 * Emergency Repair Regression Suite — Session 1 -> Session 2 production
 * incident (Aug 2026): 500 on GET /api/smokecraft/player-state/tasting/
 * humidor-match/draft, empty venue directory, and LOCAL PREVIEW leakage.
 *
 * Follows this repo's existing convention (plain .mjs assertion scripts
 * driving the real HTTP API against a real locally-running server + real
 * Postgres — no mocks, no direct DB writes for anything the API itself
 * should produce). Exits non-zero on any failure.
 *
 * Requires a server already running on HOST:PORT (see verify-smokecraft-
 * full-game-fresh-player.mjs for the same pattern) with DATABASE_URL
 * pointed at a database that has had `npm run db:migrate` run against it.
 *
 * Run: DATABASE_URL=... node scripts/test-smokecraft-emergency-repair-regression.mjs
 */
import http from 'http'
import assert from 'assert'

const HOST = process.env.TEST_HOST || 'localhost'
const PORT = parseInt(process.env.TEST_PORT || '3001', 10)

let passed = 0
let failed = 0

function req(method, path, { body, cookies } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null
    const headers = { 'Content-Type': 'application/json' }
    if (cookies) headers.Cookie = cookies
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload)
    const r = http.request({ host: HOST, port: PORT, path, method, headers }, (res) => {
      let data = ''
      res.on('data', (c) => (data += c))
      res.on('end', () => {
        let json = null
        try { json = JSON.parse(data) } catch { /* non-JSON response */ }
        const setCookie = res.headers['set-cookie']
        resolve({ status: res.statusCode, json, setCookie })
      })
    })
    r.on('error', reject)
    if (payload) r.write(payload)
    r.end()
  })
}

function cookieHeader(setCookieArr) {
  if (!setCookieArr) return null
  return setCookieArr.map((c) => c.split(';')[0]).join('; ')
}

async function t(name, fn) {
  try {
    await fn()
    console.log(`PASS: ${name}`)
    passed++
  } catch (err) {
    console.error(`FAIL: ${name}`)
    console.error(`      ${err.message}`)
    failed++
  }
}

async function main() {
  // Establish a fresh guest identity the same way a real new player does —
  // hitting any smokecraft-guest-gated endpoint issues the guest cookie.
  const first = await req('GET', '/api/smokecraft/player-state/tasting/humidor-match/draft')
  const cookies = cookieHeader(first.setCookie)

  await t('new player: GET draft for humidor-match (Session 2) returns 200, not 500', () => {
    assert.strictEqual(first.status, 200, `expected 200, got ${first.status}: ${JSON.stringify(first.json)}`)
  })

  await t('new player: draft body is an initialized empty draft at version 0', () => {
    assert.strictEqual(first.json.success, true)
    assert.deepStrictEqual(first.json.draftData, {})
    assert.strictEqual(first.json.version, 0)
  })

  await t('save+resume: valid draft save succeeds and returns version 1', async () => {
    const res = await req('PUT', '/api/smokecraft/player-state/tasting/humidor-match/draft', {
      cookies,
      body: { draftData: { selectedId: 'virtual_humidor' }, expectedVersion: 0 },
    })
    assert.strictEqual(res.status, 200, `expected 200, got ${res.status}: ${JSON.stringify(res.json)}`)
    assert.strictEqual(res.json.success, true)
    assert.strictEqual(res.json.current.version, 1)
  })

  await t('save+resume: reload reflects the saved data, not the empty default', async () => {
    const res = await req('GET', '/api/smokecraft/player-state/tasting/humidor-match/draft', { cookies })
    assert.strictEqual(res.status, 200)
    assert.deepStrictEqual(res.json.draftData, { selectedId: 'virtual_humidor' })
    assert.strictEqual(res.json.version, 1)
  })

  await t('duplicate/stale save is rejected with a conflict, not a silent overwrite or duplicate row', async () => {
    const res = await req('PUT', '/api/smokecraft/player-state/tasting/humidor-match/draft', {
      cookies,
      body: { draftData: { selectedId: 'dry_box' }, expectedVersion: 0 }, // stale — real version is now 1
    })
    assert.strictEqual(res.status, 409, `expected 409 stale_version conflict, got ${res.status}: ${JSON.stringify(res.json)}`)
    assert.strictEqual(res.json.success, false)
    assert.strictEqual(res.json.error, 'stale_version')
  })

  await t('venue directory: honest response shape (ok:true, postgres storage mode, real query — not an error)', async () => {
    const res = await req('GET', '/api/smokecraft/venue-commerce/venues')
    assert.strictEqual(res.status, 200, `expected 200, got ${res.status}: ${JSON.stringify(res.json)}`)
    assert.strictEqual(res.json.ok, true)
    assert.strictEqual(res.json.storageMode, 'postgres')
    assert(Array.isArray(res.json.venues), 'venues must be an array (empty is honest, not an error)')
  })

  await t('malformed/unknown activity key does not 500', async () => {
    const res = await req('GET', '/api/smokecraft/player-state/tasting/not-a-real-session/draft', { cookies })
    assert(res.status < 500, `expected a clean non-5xx response, got ${res.status}: ${JSON.stringify(res.json)}`)
  })

  console.log(`\n${passed} passed, ${failed} failed (of ${passed + failed} total)`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('FATAL:', err)
  process.exit(1)
})
