#!/usr/bin/env node
/**
 * Holistic Fix 5C-2A — judge-assignment authority tests against the
 * real running server, zero mocking.
 */
import http from 'http'
import 'dotenv/config'
import { execSync } from 'child_process'

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
  function request(method, path, body) {
    return new Promise((resolve, reject) => {
      const cookieHeader = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ')
      const data = body ? JSON.stringify(body) : null
      const req = http.request({
        host: HOST, port: PORT, path, method,
        headers: { 'Content-Type': 'application/json', ...(cookieHeader ? { Cookie: cookieHeader } : {}), ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) },
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
  return { get: (p) => request('GET', p), post: (p, b) => request('POST', p, b), patch: (p, b) => request('PATCH', p, b) }
}

function sh(cmd) { return execSync(cmd, { encoding: 'utf8', env: process.env }) }

const COMPLETE_COMPONENTS = [
  { componentType: 'wrapper', componentKey: 'habano', componentValue: {} },
  { componentType: 'binder', componentKey: 'nicaragua', componentValue: {} },
  { componentType: 'filler', componentKey: 'criollo', componentValue: {} },
  { componentType: 'vitola', componentKey: 'robusto', componentValue: {} },
]

async function makeSubmittedEntry(competitionId) {
  const c = makeClient()
  await c.get('/api/smokecraft/player-state')
  const created = await c.post(`/api/smokecraft/golden-box/competitions/${competitionId}/entries`)
  const entryId = created.body.entry.entry_id
  await c.patch(`/api/smokecraft/golden-box/entries/${entryId}/draft`, { presentationPayload: { note: 'x' }, expectedVersion: 1, components: COMPLETE_COMPONENTS })
  await c.post(`/api/smokecraft/golden-box/entries/${entryId}/submit`)
  return { client: c, entryId }
}

async function main() {
  const dbName = new URL(process.env.DATABASE_URL).pathname.replace(/^\//, '')
  const psql = (sql) => sh(`sudo -u postgres psql -d ${dbName} -tAc "${sql.replace(/"/g, '\\"')}"`).split('\n')[0].trim()

  const venueId = psql(`INSERT INTO venues (venue_id, name) VALUES ('hf5c2a-test-venue-${Date.now()}', 'HF5C2A Test Venue') RETURNING venue_id`)
  const venueCompetitionId = psql(`INSERT INTO golden_box_competitions (competition_key, title, scope, scope_venue_id, status, submission_closes_at, created_by) VALUES ('hf5c2a-venue-comp-${Date.now()}', 'HF5C2A Venue Test', 'venue', '${venueId}', 'active', now() + interval '7 days', 'test-admin') RETURNING id`)
  const globalCompetitionId = psql(`INSERT INTO golden_box_competitions (competition_key, title, scope, status, submission_closes_at, created_by) VALUES ('hf5c2a-global-comp-${Date.now()}', 'HF5C2A Global Test', 'global', 'active', now() + interval '7 days', 'test-admin') RETURNING id`)

  const admin = makeClient()
  const adminLogin = await admin.post('/api/auth/admin-login', { email: 'admin@novee.dev', pin: '9999' })
  assert('Test setup: admin login succeeds', adminLogin.status === 200)

  console.log('\n── 1. Authorized judge assignment ──')
  const { entryId: entry1 } = await makeSubmittedEntry(globalCompetitionId)
  const assign1 = await admin.post(`/api/smokecraft/golden-box/competitions/${globalCompetitionId}/entries/${entry1}/judges`, { judgeUserId: 'hf5c2a-judge-1' })
  assert('An authorized admin can assign a judge to an eligible submitted entry', assign1.status === 200)
  assert('The assignment records who assigned it (assigned_by), not just when', assign1.body.assignment.assigned_by === 'admin-demo-001')

  console.log('\n── 2. Unauthorized assignment denied ──')
  const anon = makeClient()
  await anon.get('/api/smokecraft/player-state')
  const unauthorized = await anon.post(`/api/smokecraft/golden-box/competitions/${globalCompetitionId}/entries/${entry1}/judges`, { judgeUserId: 'hf5c2a-judge-2' })
  assert('A non-admin cannot assign a judge (real role check, not a client-asserted permission)', unauthorized.status === 403 || unauthorized.status === 401)

  console.log('\n── 3. Duplicate assignment ──')
  const dupAssign = await admin.post(`/api/smokecraft/golden-box/competitions/${globalCompetitionId}/entries/${entry1}/judges`, { judgeUserId: 'hf5c2a-judge-1' })
  assert('A duplicate assignment is a real database no-op, never a second row', dupAssign.status === 200 && dupAssign.body.assignment.alreadyAssigned === true)
  const assignmentCount = psql(`SELECT count(*) FROM golden_box_judge_assignments WHERE entry_id = '${entry1}'`)
  assert('Exactly one real assignment row exists after the duplicate attempt', assignmentCount === '1')

  console.log('\n── 4. Entry not eligible for judging (still a draft) ──')
  const c2 = makeClient()
  await c2.get('/api/smokecraft/player-state')
  const draftEntry = await c2.post(`/api/smokecraft/golden-box/competitions/${globalCompetitionId}/entries`)
  const draftAssign = await admin.post(`/api/smokecraft/golden-box/competitions/${globalCompetitionId}/entries/${draftEntry.body.entry.entry_id}/judges`, { judgeUserId: 'hf5c2a-judge-3' })
  assert('Assigning a judge to a still-editable draft entry (never submitted) is rejected', draftAssign.status === 409 && draftAssign.body.error.startsWith('entry_not_eligible_for_judging'))

  console.log('\n── 5. Judge self-assignment prohibited ──')
  // A real authenticated entrant (staff-demo-001) builds and submits
  // their own entry, then an attempt to assign that SAME account as
  // the judge on their own entry must be rejected — entry.user_id is
  // the real, server-recorded authenticated-entrant id, never a
  // client-asserted role.
  const entrantAccount = makeClient()
  const entrantLogin = await entrantAccount.post('/api/auth/staff-pin-login', { pin: '1234' })
  assert('Test setup: a real authenticated entrant account logs in', entrantLogin.status === 200)
  const ownEntry = await entrantAccount.post(`/api/smokecraft/golden-box/competitions/${globalCompetitionId}/entries`)
  const ownEntryId = ownEntry.body.entry.entry_id
  await entrantAccount.patch(`/api/smokecraft/golden-box/entries/${ownEntryId}/draft`, { presentationPayload: { note: 'self' }, expectedVersion: 1, components: COMPLETE_COMPONENTS })
  await entrantAccount.post(`/api/smokecraft/golden-box/entries/${ownEntryId}/submit`)
  const selfAssign = await admin.post(`/api/smokecraft/golden-box/competitions/${globalCompetitionId}/entries/${ownEntryId}/judges`, { judgeUserId: entrantLogin.body.data.userId })
  assert('An entrant can never be assigned as the judge of their own submitted entry', selfAssign.status === 403 && selfAssign.body.error === 'judge_self_assignment_prohibited')

  console.log('\n── 6. Wrong venue/competition denied ──')
  const { entryId: venueEntry } = await makeSubmittedEntry(venueCompetitionId)
  const noMembershipAssign = await admin.post(`/api/smokecraft/golden-box/competitions/${venueCompetitionId}/entries/${venueEntry}/judges`, { judgeUserId: 'hf5c2a-judge-no-membership' })
  assert('A judge with no real active membership for a venue-scoped competition\'s venue is denied assignment', noMembershipAssign.status === 403 && noMembershipAssign.body.error === 'judge_outside_venue_scope')

  // venue_memberships.user_id has a real FK to system_users — reuse the
  // seeded manager-demo-001 account rather than inventing a user row.
  psql(`INSERT INTO venue_memberships (user_id, venue_id, membership_type, status) VALUES ('manager-demo-001', '${venueId}', 'manager', 'active') ON CONFLICT DO NOTHING`)
  const withMembershipAssign = await admin.post(`/api/smokecraft/golden-box/competitions/${venueCompetitionId}/entries/${venueEntry}/judges`, { judgeUserId: 'manager-demo-001' })
  assert('A judge with a real active venue membership is assigned successfully', withMembershipAssign.status === 200)

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-holistic-fix-5c-2a', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-holistic-fix-5c-2a/01-judge-assignment-api-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => { console.error(err); process.exit(1) })
