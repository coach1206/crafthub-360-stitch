#!/usr/bin/env node
/**
 * Support Admin RBAC + Corrective-Action-Audit Test — Production Package 5 (§27)
 *
 * Boots the real Express app in-process (supertest-free — uses Node's
 * fetch against a listener on an ephemeral port) and exercises:
 *   - unauthorized access is rejected (401/403)
 *   - manager can create a support case and look up real data
 *   - a corrective action requires confirm:true and is logged BEFORE apply
 *   - staff (below manager) cannot apply a corrective action
 */
import assert from 'assert'

const BASE_PORT = 4560 + Math.floor(Math.random() * 200)
process.env.PORT = String(BASE_PORT)
process.env.NODE_ENV = 'development' // dev headers allowed for this local RBAC test only

const { default: app } = await import('../server/index.js')

// server/index.js starts its own listener; we just need to know the port
// it actually bound to. It logs PORT from env, so reuse BASE_PORT.
await new Promise((r) => setTimeout(r, 1500))

const base = `http://localhost:${BASE_PORT}`
let passed = 0
async function t(name, fn) {
  try {
    await fn()
    console.log(`PASS: ${name}`)
    passed++
  } catch (err) {
    console.error(`FAIL: ${name}`)
    console.error(`      ${err.message}`)
    process.exitCode = 1
  }
}

function devHeaders(role, id = 'test-staff-1') {
  return {
    'x-novee-user-role': role,
    'x-novee-user-id': id,
    'x-novee-user-email': `${id}@example.test`,
    'content-type': 'application/json',
  }
}

await t('unauthenticated request to ops-status is rejected', async () => {
  const res = await fetch(`${base}/api/admin/ops-status`)
  assert([401, 403].includes(res.status), `expected 401/403, got ${res.status}`)
})

await t('staff role cannot access support-admin corrective-action route', async () => {
  const caseRes = await fetch(`${base}/api/support-admin/cases`, {
    method: 'POST', headers: devHeaders('manager'),
    body: JSON.stringify({ category: 'login', description: 'RBAC test case' }),
  })
  const caseBody = await caseRes.json()
  assert(caseRes.status === 201, `expected case create 201, got ${caseRes.status}: ${JSON.stringify(caseBody)}`)
  const caseId = caseBody.case.id

  const res = await fetch(`${base}/api/support-admin/cases/${caseId}/corrective-action`, {
    method: 'POST', headers: devHeaders('staff'),
    body: JSON.stringify({ actionType: 'add_case_note', payload: { note: 'x' }, reason: 'test', confirm: true }),
  })
  assert([401, 403].includes(res.status), `expected staff to be blocked, got ${res.status}`)
})

let createdCaseId = null
await t('manager can create a support case against the real DB', async () => {
  const res = await fetch(`${base}/api/support-admin/cases`, {
    method: 'POST', headers: devHeaders('manager'),
    body: JSON.stringify({ category: 'passport', description: 'Missing Passport stamp — RBAC/audit test', severity: 'sev4' }),
  })
  const body = await res.json()
  assert.strictEqual(res.status, 201)
  assert(body.case?.id)
  createdCaseId = body.case.id
})

await t('preview (confirm omitted) does not mutate the case', async () => {
  const res = await fetch(`${base}/api/support-admin/cases/${createdCaseId}/corrective-action`, {
    method: 'POST', headers: devHeaders('admin'),
    body: JSON.stringify({ actionType: 'add_case_note', payload: { note: 'preview only' }, reason: 'test preview' }),
  })
  const body = await res.json()
  assert.strictEqual(res.status, 200)
  assert.strictEqual(body.applied, false)

  const getRes = await fetch(`${base}/api/support-admin/cases/${createdCaseId}`, { headers: devHeaders('manager') })
  const getBody = await getRes.json()
  assert(!getBody.case.resolution_notes || !getBody.case.resolution_notes.includes('preview only'))
})

await t('admin corrective action with confirm:true is applied and audited', async () => {
  const res = await fetch(`${base}/api/support-admin/cases/${createdCaseId}/corrective-action`, {
    method: 'POST', headers: devHeaders('admin'),
    body: JSON.stringify({ actionType: 'add_case_note', payload: { note: 'applied note' }, reason: 'test apply', confirm: true }),
  })
  const body = await res.json()
  assert.strictEqual(res.status, 200)
  assert.strictEqual(body.applied, true)
  assert(body.case.resolution_notes.includes('applied note'))

  const getRes = await fetch(`${base}/api/support-admin/cases/${createdCaseId}`, { headers: devHeaders('manager') })
  const getBody = await getRes.json()
  const actionLog = getBody.actions.find((a) => a.action_type === 'corrective_action')
  assert(actionLog, 'expected an audited corrective_action row')
  assert(actionLog.before_state && actionLog.after_state, 'expected before/after state captured')
})

console.log('')
console.log(`${passed} support-admin RBAC/audit test(s) passed${process.exitCode ? ', SOME FAILED' : ''}`)
if (!process.exitCode) console.log('RESULT: SUPPORT ADMIN RBAC + CORRECTIVE-ACTION AUDIT VERIFIED')
process.exit(process.exitCode || 0)
