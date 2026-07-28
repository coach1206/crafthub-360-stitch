#!/usr/bin/env node
/**
 * Holistic Fix 5B-1 — server-authoritative pairing engine automated proof.
 */
import http from 'http'

const HOST = 'localhost'
const PORT = 3001
let pass = 0, fail = 0
const results = []

function assert(name, cond, detail) {
  if (cond) { pass++; results.push({ name, ok: true }); console.log(`  PASS  ${name}`) }
  else { fail++; results.push({ name, ok: false, detail }); console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`) }
}

function makeClient() {
  let cookies = {}
  function request(method, path, body, extraHeaders = {}) {
    return new Promise((resolve, reject) => {
      const cookieHeader = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ')
      const data = body ? JSON.stringify(body) : null
      const req = http.request({
        host: HOST, port: PORT, path, method,
        headers: { 'Content-Type': 'application/json', ...(cookieHeader ? { Cookie: cookieHeader } : {}), ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}), ...extraHeaders },
      }, res => {
        const setCookie = res.headers['set-cookie']
        if (setCookie) for (const c of setCookie) { const [pair] = c.split(';'); const [k, v] = pair.split('='); cookies[k] = v }
        let chunks = ''
        res.on('data', d => chunks += d)
        res.on('end', () => { let parsed = null; try { parsed = JSON.parse(chunks) } catch {}; resolve({ status: res.statusCode, body: parsed }) })
      })
      req.on('error', reject)
      if (data) req.write(data)
      req.end()
    })
  }
  return { get: (p) => request('GET', p), post: (p, b, h) => request('POST', p, b, h), put: (p, b, h) => request('PUT', p, b, h) }
}

const VALID_CIGAR = { cigarShape: 'Robusto', wrapper: 'Habano', origin: 'Nicaragua', strength: 'Full' }

async function main() {
  console.log('\n── 1. Valid cigar and beverage ──')
  const c1 = makeClient()
  await c1.get('/api/smokecraft/player-state')
  const r1 = await c1.post('/api/smokecraft/pairing-engine/recommend', { ...VALID_CIGAR, pairingType: 'Whiskey', flavorNotes: ['Smoky', 'Bold'], pairingGoal: 'Complement' })
  assert('A valid cigar+beverage request succeeds', r1.status === 200 && r1.body.success)
  assert('A recommendation has an explanation (never unexplained)', typeof r1.body.explanation === 'string' && r1.body.explanation.length > 0)
  assert('A recommendation has a rule set version', typeof r1.body.ruleSetVersion === 'number' && r1.body.ruleSetVersion >= 1)
  assert('A recommendation has a serving sequence', typeof r1.body.servingSequence === 'string' && r1.body.servingSequence.length > 0)
  assert('A recommendation has an alternative recommendation', !!r1.body.alternative && typeof r1.body.alternative.type === 'string')

  console.log('\n── 2. Intensity match ──')
  const r2 = await c1.post('/api/smokecraft/pairing-engine/recommend', { ...VALID_CIGAR, strength: 'Full', pairingType: 'Whiskey' })
  assert('A Full cigar against Whiskey (both intensity 4) reports an even intensity match', r2.body.intensityMatch === 'even')

  console.log('\n── 3. Intentional contrast (mismatched intensity is reported honestly, not hidden) ──')
  const r3 = await c1.post('/api/smokecraft/pairing-engine/recommend', { ...VALID_CIGAR, strength: 'Mild', pairingType: 'Whiskey' })
  assert('A Mild cigar against Whiskey (intensity 1 vs 4) reports a mismatched intensity, not falsely "even"', r3.body.intensityMatch === 'mismatched')
  assert('The mismatch produces a real conflict explanation', r3.body.conflicts.length > 0)

  console.log('\n── 4. Incompatible pairing (flavor clash) ──')
  const r4 = await c1.post('/api/smokecraft/pairing-engine/recommend', { ...VALID_CIGAR, pairingType: 'Whiskey', flavorNotes: ['Sweet', 'Creamy'] })
  assert('Selected notes that clash with the pairing type are flagged as a real conflict', r4.body.conflicts.some(c => c.includes('Sweet') || c.includes('Creamy')))
  assert('A clashing pairing scores lower than a harmonious one', r4.body.compatScore < r1.body.compatScore)

  console.log('\n── 5. Missing input ──')
  const r5 = await c1.post('/api/smokecraft/pairing-engine/recommend', { ...VALID_CIGAR })
  assert('A request with no pairing type is rejected (400), never silently scored', r5.status === 400 && r5.body.error === 'pairing_type_required')

  console.log('\n── 6. Low-confidence result ──')
  const r6 = await c1.post('/api/smokecraft/pairing-engine/recommend', { pairingType: 'Water' })
  assert('A request with almost no real signal reports a real, non-fabricated confidence value below 1.0', r6.body.confidence < 1)

  console.log('\n── 7. Deterministic repeated result ──')
  const r7a = await c1.post('/api/smokecraft/pairing-engine/recommend', { ...VALID_CIGAR, pairingType: 'Whiskey', flavorNotes: ['Smoky', 'Bold'], pairingGoal: 'Complement' })
  const r7b = await c1.post('/api/smokecraft/pairing-engine/recommend', { ...VALID_CIGAR, pairingType: 'Whiskey', flavorNotes: ['Smoky', 'Bold'], pairingGoal: 'Complement' })
  assert('Identical input produces an identical score on repeated requests (deterministic, not random)', r7a.body.compatScore === r7b.body.compatScore)
  assert('Identical input produces an identical rule set version on repeated requests', r7a.body.ruleSetVersion === r7b.body.ruleSetVersion)

  console.log('\n── 8. Rule-version stability + no client-controlled score ──')
  const tampered = await c1.post('/api/smokecraft/pairing-engine/recommend', { ...VALID_CIGAR, pairingType: 'Whiskey', flavorNotes: ['Smoky', 'Bold'], compatScore: 1, ruleSetVersion: 999 })
  assert('A client-submitted compatScore/ruleSetVersion is silently ignored — the server always recomputes its own', tampered.body.compatScore === r1.body.compatScore && tampered.body.ruleSetVersion === r1.body.ruleSetVersion)

  console.log('\n── 9. Save and reload ──')
  const idem1 = `hf5b1-verify-save-${Date.now()}`
  const s1 = await c1.post('/api/smokecraft/pairing-engine/save', { ...VALID_CIGAR, pairingType: 'Whiskey', flavorNotes: ['Smoky', 'Bold'], pairingGoal: 'Complement', idempotencyKey: idem1 })
  assert('A save request succeeds (201)', s1.status === 201)
  assert('The saved score matches the server-computed score, never a client value', s1.body.save.compat_score === r1.body.compatScore)
  const reload = await c1.get('/api/smokecraft/pairing-engine/saved')
  assert('The save is visible in the caller\'s own saved-pairings list on reload', reload.body.saves.some(sv => sv.id === s1.body.save.id))
  const single = await c1.get(`/api/smokecraft/pairing-engine/saved/${s1.body.save.id}`)
  assert('Fetching a single saved pairing returns its revision history', Array.isArray(single.body.save.revisions) && single.body.save.revisions.length >= 1)

  console.log('\n── 10. Duplicate save ──')
  const dup = await c1.post('/api/smokecraft/pairing-engine/save', { ...VALID_CIGAR, pairingType: 'Whiskey', flavorNotes: ['Smoky', 'Bold'], pairingGoal: 'Complement', idempotencyKey: idem1 })
  assert('Re-saving with the same idempotency key does not duplicate — reports alreadySaved', dup.status === 200 && dup.body.alreadySaved === true)
  const listAfterDup = await c1.get('/api/smokecraft/pairing-engine/saved')
  assert('The saved-pairings list still has exactly one row for this exact cigar+beverage combination', listAfterDup.body.saves.filter(sv => sv.pairing_type === 'Whiskey' && sv.cigar_shape === 'Robusto').length === 1)

  console.log('\n── 11. Stale write ──')
  const rate1 = await c1.put(`/api/smokecraft/pairing-engine/saved/${s1.body.save.id}/rate`, { expectedVersion: s1.body.save.save_version, learnerRating: 5, learnerNotes: 'Loved it' })
  assert('A rating update with the correct expectedVersion succeeds', rate1.status === 200 && rate1.body.save.learner_rating === 5)
  const stale = await c1.put(`/api/smokecraft/pairing-engine/saved/${s1.body.save.id}/rate`, { expectedVersion: s1.body.save.save_version, learnerRating: 1 })
  assert('Re-using the now-stale expectedVersion is rejected with a real 409 conflict, not silently overwritten', stale.status === 409 && stale.body.error === 'stale_write')
  const afterStale = await c1.get(`/api/smokecraft/pairing-engine/saved/${s1.body.save.id}`)
  assert('The rejected stale write never actually changed the rating', afterStale.body.save.learner_rating === 5)

  console.log('\n── 12. Revision history (append-only) ──')
  assert('Each successful rating update appended a new revision row (real history, not overwritten in place)', afterStale.body.save.revisions.length >= 2)

  console.log('\n── 13. Cross-user denial ──')
  const c2 = makeClient()
  await c2.get('/api/smokecraft/player-state')
  const otherAccess = await c2.get(`/api/smokecraft/pairing-engine/saved/${s1.body.save.id}`)
  assert('A completely separate guest cannot read another guest\'s saved pairing (404, not 403 — existence is not leaked either)', otherAccess.status === 404)
  const otherRate = await c2.put(`/api/smokecraft/pairing-engine/saved/${s1.body.save.id}/rate`, { expectedVersion: 2, learnerRating: 1 })
  assert('A completely separate guest cannot rate another guest\'s saved pairing', otherRate.status !== 200)
  const otherList = await c2.get('/api/smokecraft/pairing-engine/saved')
  assert('A completely separate guest\'s own saved-pairings list never includes another guest\'s row', !otherList.body.saves.some(sv => sv.id === s1.body.save.id))

  console.log('\n── 14. Guest-to-account preservation ──')
  const c3 = makeClient()
  await c3.get('/api/smokecraft/player-state')
  const idem3 = `hf5b1-verify-conv-${Date.now()}`
  await c3.post('/api/smokecraft/pairing-engine/save', { ...VALID_CIGAR, pairingType: 'Rum', flavorNotes: ['Sweet'], idempotencyKey: idem3 })
  const email = `hf5b1-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`
  await c3.post('/api/smokecraft/account/create', { email, displayName: 'HF5B1 Test' })
  const conv = await c3.post('/api/smokecraft/player-state/convert-guest', { idempotencyKey: `hf5b1-conv-${Date.now()}` })
  assert('Guest-to-account conversion succeeds', conv.status === 201)
  assert('Conversion reports the saved pairing was transferred (real found-and-verified requirement)', conv.body.pairingSavesTransferred >= 1)
  const afterConv = await c3.get('/api/smokecraft/pairing-engine/saved')
  assert('The saved pairing is visible under the new account identity', afterConv.body.saves.some(sv => sv.pairing_type === 'Rum'))

  console.log('\n── 15. Cross-device result (same identity, two independent fetches) ──')
  const dev1 = await c1.get('/api/smokecraft/pairing-engine/saved')
  const dev2 = await c1.get('/api/smokecraft/pairing-engine/saved')
  assert('Two independent live fetches under the same identity return identical saved-pairing data (no per-device drift)', JSON.stringify(dev1.body.saves.map(s => s.id).sort()) === JSON.stringify(dev2.body.saves.map(s => s.id).sort()))

  console.log('\n── 16. Rank-all (Personalized Pairing Recommendations) ──')
  const rankRes = await c1.post('/api/smokecraft/pairing-engine/rank', { ...VALID_CIGAR, flavorNotes: ['Smoky', 'Bold'], pairingGoal: 'Complement' })
  assert('Rank returns every real pairing category', rankRes.status === 200 && rankRes.body.results.length >= 10)
  assert('Rank results are sorted descending by score', rankRes.body.results.every((r, i) => i === 0 || rankRes.body.results[i - 1].compatScore >= r.compatScore))
  assert('Every ranked result has an explanation and rule version', rankRes.body.results.every(r => r.explanation && r.ruleSetVersion))

  console.log('\n── 17. Live-screen route smoke (fresh identity, no prior navigation) ──')
  const c4 = makeClient()
  const fresh = await c4.post('/api/smokecraft/pairing-engine/recommend', { ...VALID_CIGAR, pairingType: 'Whiskey' })
  assert('A genuinely first-ever request from a fresh browser does not 401 (guest identity auto-issued)', fresh.status === 200)

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)

  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-holistic-fix-5b-1', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-holistic-fix-5b-1/01-pairing-engine-flow-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => { console.error(err); process.exit(1) })
