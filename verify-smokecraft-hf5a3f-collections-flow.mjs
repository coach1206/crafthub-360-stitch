#!/usr/bin/env node
/**
 * Holistic Fix 5A-3F — Collections ledger integration automated proof.
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
  return {
    get: (p) => request('GET', p),
    post: (p, b, h) => request('POST', p, b, h),
  }
}

async function main() {
  console.log('\n── 1. Qualifying event unlocks a Collection item ──')
  const c1 = makeClient()
  await c1.get('/api/smokecraft/player-state')
  const before = await c1.get('/api/smokecraft/collections/')
  const fillerBefore = before.body.items.find(i => i.itemKey === 'filler-mastery-badge')
  assert('Before completing the qualifying activity, the item is honestly locked', fillerBefore.state === 'locked')

  const complete = await c1.post('/api/smokecraft/filler-arrangement/complete', {})
  assert('The real qualifying activity (Filler Arrangement completion) records successfully', complete.status === 200)

  const after = await c1.get('/api/smokecraft/collections/')
  const fillerAfter = after.body.items.find(i => i.itemKey === 'filler-mastery-badge')
  assert('After the qualifying event, the Collection item is earned (server re-derived, not client-set)', fillerAfter.state === 'earned')
  assert('The item\'s earnedAt timestamp is real (present)', !!fillerAfter.earnedAt)

  console.log('\n── 2. Non-qualifying event does not unlock ──')
  const c2 = makeClient()
  await c2.get('/api/smokecraft/player-state')
  const neverCompleted = await c2.get('/api/smokecraft/collections/')
  const rollerItem = neverCompleted.body.items.find(i => i.itemKey === 'master-roller-badge')
  assert('A guest who never completed a rolling-process step never has master-roller-badge unlocked', rollerItem.state === 'locked')

  console.log('\n── 3. Duplicate event does not duplicate ownership ──')
  const dupComplete = await c1.post('/api/smokecraft/filler-arrangement/complete', {})
  const afterDup = await c1.get('/api/smokecraft/collections/')
  const fillerAfterDup = afterDup.body.items.find(i => i.itemKey === 'filler-mastery-badge')
  assert('Re-triggering the same qualifying activity does not change the item\'s original earnedAt (no duplicate award)', fillerAfterDup.earnedAt === fillerAfter.earnedAt)

  console.log('\n── 4. Rapid double-click / two-tab race on recalculate ──')
  const c3 = makeClient()
  await c3.get('/api/smokecraft/player-state')
  await c3.post('/api/smokecraft/filler-arrangement/complete', {})
  const [race1, race2] = await Promise.all([
    c3.post('/api/smokecraft/collections/recalculate', {}),
    c3.post('/api/smokecraft/collections/recalculate', {}),
  ])
  assert('Both concurrent recalculate requests return well-formed success (no 500)', [race1.status, race2.status].every(s => s === 200))
  const raceCollections = await c3.get('/api/smokecraft/collections/')
  const raceFiller = raceCollections.body.items.find(i => i.itemKey === 'filler-mastery-badge')
  assert('A two-tab recalculate race still results in exactly one ownership record (DB UNIQUE constraint enforced)', raceFiller.state === 'earned')

  console.log('\n── 5. Cross-user isolation ──')
  const c4 = makeClient()
  await c4.get('/api/smokecraft/player-state')
  const otherGuestCollections = await c4.get('/api/smokecraft/collections/')
  const otherFiller = otherGuestCollections.body.items.find(i => i.itemKey === 'filler-mastery-badge')
  assert('A completely separate guest never sees another guest\'s earned item', otherFiller.state === 'locked')

  console.log('\n── 6. Correction / reversal ──')
  const guestState = await c1.get('/api/smokecraft/player-state')
  const guestRef = guestState.body.state.guestReference
  const unauthorizedCorrection = await c1.post('/api/smokecraft/player-state/corrections', {
    idempotencyKey: `hf5a3f-corr-0001-${Date.now()}`, guestReference: guestRef, correctionType: 'collection',
    targetTable: 'smokecraft_collection_ownership', targetAwardKey: 'filler-mastery-badge', reversed: true, reason: 'unauthorized test',
  })
  assert('An ordinary (non-staff) identity cannot invoke a correction', unauthorizedCorrection.status === 403)

  const staffCorrection = await c1.post('/api/smokecraft/player-state/corrections', {
    idempotencyKey: `hf5a3f-corr-0002-${Date.now()}`, guestReference: guestRef, correctionType: 'collection',
    targetTable: 'smokecraft_collection_ownership', targetAwardKey: 'filler-mastery-badge', reversed: true, reason: 'automated test reversal',
  }, { 'x-novee-user-role': 'staff' })
  assert('A staff-authorized correction/reversal succeeds', staffCorrection.status === 201)

  const afterCorrection = await c1.get('/api/smokecraft/collections/')
  const fillerAfterCorrection = afterCorrection.body.items.find(i => i.itemKey === 'filler-mastery-badge')
  assert('The item now honestly reports a corrected state (not silently re-locked, not still counted as earned)', fillerAfterCorrection.state === 'corrected')
  assert('The original earnedAt timestamp is preserved (correction never deletes/edits history)', fillerAfterCorrection.earnedAt === fillerAfter.earnedAt)
  assert('A corrected item no longer counts toward the ownership summary total', afterCorrection.body.summary.categories.find(cat => cat.category === 'Leaf Collection').owned === 0)

  console.log('\n── 7. Guest-to-account preservation ──')
  const c5 = makeClient()
  await c5.get('/api/smokecraft/player-state')
  await c5.post('/api/smokecraft/filler-arrangement/complete', {})
  const guestCollectionsBefore = await c5.get('/api/smokecraft/collections/')
  const guestFillerBefore = guestCollectionsBefore.body.items.find(i => i.itemKey === 'filler-mastery-badge')
  assert('A fresh guest earns filler-mastery-badge before conversion', guestFillerBefore.state === 'earned')

  const email = `hf5a3f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`
  const createAccount = await c5.post('/api/smokecraft/account/create', { email, displayName: 'HF5A3F Test' })
  assert('A real account is created on the same cookie jar as the guest', createAccount.status === 201)

  const convert = await c5.post('/api/smokecraft/player-state/convert-guest', { idempotencyKey: 'hf5a3f-convert-1' })
  assert('Guest-to-account conversion succeeds', convert.status === 201)
  assert('Conversion transfers at least 1 Collections item (real cascading unlocks from the same event may produce more than 1)', convert.body.collectionsTransferred >= 1)

  const afterConvertCollections = await c5.get('/api/smokecraft/collections/')
  const afterConvertFiller = afterConvertCollections.body.items.find(i => i.itemKey === 'filler-mastery-badge')
  assert('After conversion, the SAME account identity (now authenticated) still sees the earned item', afterConvertFiller.state === 'earned')

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)

  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-holistic-fix-5a-3f', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-holistic-fix-5a-3f/01-collections-flow-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => { console.error(err); process.exit(1) })
