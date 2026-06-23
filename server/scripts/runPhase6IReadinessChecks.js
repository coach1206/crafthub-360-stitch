/**
 * Phase 6I — Final Readiness Checks
 * Lightweight, static, file-system-only checks — no live database, no
 * Express server, no network calls. Verifies that every file/wiring
 * requirement built across Phase 6C–6H is still present and that no staff
 * panel has leaked into a guest route. Run with:
 *   node server/scripts/runPhase6IReadinessChecks.js
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../..')

let passed = 0
let failed = 0

function check(label, condition) {
  if (condition) {
    passed += 1
    console.log(`PASS — ${label}`)
  } else {
    failed += 1
    console.error(`FAIL — ${label}`)
  }
}

function fileExists(relPath) {
  return existsSync(resolve(ROOT, relPath))
}

function readFile(relPath) {
  return readFileSync(resolve(ROOT, relPath), 'utf8')
}

// ── 1. Required Phase 6C–6H files exist ──────────────────────────
const requiredFiles = [
  'src/services/syncQueueService.js',
  'src/services/syncApiClient.js',
  'src/services/syncStatusService.js',
  'src/services/syncConflictResolutionService.js',
  'src/services/syncReconciliationService.js',
  'src/services/syncEventReplayService.js',
  'src/services/syncAuditClientService.js',
  'server/controllers/syncController.js',
  'server/controllers/syncReconciliationController.js',
  'server/controllers/syncAuditController.js',
  'server/services/syncReconciliationStore.js',
  'server/services/syncReplayServerService.js',
  'server/services/syncConflictResolutionServerService.js',
  'server/services/syncAuditStore.js',
  'server/services/syncAuditService.js',
  'server/services/syncRequestValidationService.js',
  'server/services/syncSecurityResponseService.js',
]
for (const f of requiredFiles) check(`required file exists: ${f}`, fileExists(f))

// ── 2. Required staff panels exist ───────────────────────────────
const staffPanels = [
  'src/components/staff/SyncStatusPanel.jsx',
  'src/components/staff/SyncConflictReviewPanel.jsx',
  'src/components/staff/SyncAuditTimelinePanel.jsx',
]
for (const f of staffPanels) check(`staff panel exists: ${f}`, fileExists(f))

// ── 3. Staff panels only mounted in EATCommandHub.jsx ────────────
const hubPath = 'src/pages/eat/EATCommandHub.jsx'
const hub = fileExists(hubPath) ? readFile(hubPath) : ''
for (const panelFile of staffPanels) {
  const componentName = panelFile.split('/').pop().replace('.jsx', '')
  check(`${componentName} is imported by EATCommandHub.jsx`, hub.includes(componentName))
}

// Scan all src files (excluding the panel files themselves and the hub) for stray imports.
function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git') continue
    const full = resolve(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) walk(full, out)
    else if (entry.endsWith('.jsx') || entry.endsWith('.js')) out.push(full)
  }
  return out
}

const srcFiles = walk(resolve(ROOT, 'src'))
const panelComponentNames = ['SyncStatusPanel', 'SyncConflictReviewPanel', 'SyncAuditTimelinePanel']
const strayImporters = []
for (const file of srcFiles) {
  const relPath = file.replace(ROOT + '/', '')
  if (relPath === hubPath) continue
  if (staffPanels.includes(relPath)) continue
  const content = readFileSync(file, 'utf8')
  for (const name of panelComponentNames) {
    const wordBoundaryMatch = new RegExp(`(?<![A-Za-z0-9_])${name}(?![A-Za-z0-9_])`).test(content)
    if (wordBoundaryMatch) strayImporters.push(`${relPath} references ${name}`)
  }
}
check('no guest/non-hub file imports a staff sync/audit panel', strayImporters.length === 0)
if (strayImporters.length) strayImporters.forEach((s) => console.error(`  -> ${s}`))

// ── 4. EATCommandHub remains permission gated ────────────────────
const appJsx = fileExists('src/App.jsx') ? readFile('src/App.jsx') : ''
const eatRouteBlockMatch = appJsx.match(/path="eat"[\s\S]{0,300}/)
check('App.jsx /eat route still carries requiredPermission="access_eat_command"',
  Boolean(eatRouteBlockMatch && eatRouteBlockMatch[0].includes('requiredPermission="access_eat_command"')))

// ── 5. Sync reconciliation / audit routes exist and are staff-gated ──
const reconRoutes = fileExists('server/routes/syncReconciliationRoutes.js') ? readFile('server/routes/syncReconciliationRoutes.js') : ''
const auditRoutes = fileExists('server/routes/syncAuditRoutes.js') ? readFile('server/routes/syncAuditRoutes.js') : ''
check('sync reconciliation routes exist', fileExists('server/routes/syncReconciliationRoutes.js'))
check('sync audit routes exist', fileExists('server/routes/syncAuditRoutes.js'))
check('every reconciliation route line uses requireAuth, requireStaff',
  reconRoutes.split('\n').filter((l) => l.trim().startsWith('router.')).every((l) => l.includes('requireAuth, requireStaff')))
check('every audit route line uses requireAuth, requireStaff',
  auditRoutes.split('\n').filter((l) => l.trim().startsWith('router.')).every((l) => l.includes('requireAuth, requireStaff')))

// ── 6. Validation / security response / sanitizer services exist ────
check('syncRequestValidationService.js exists', fileExists('server/services/syncRequestValidationService.js'))
check('syncSecurityResponseService.js exists', fileExists('server/services/syncSecurityResponseService.js'))
const auditStore = readFile('server/services/syncAuditStore.js')
check('audit sanitizer is wired into syncAuditStore.js', auditStore.includes('sanitizeAuditMetadata'))

// ── 7. Replay service references conflict resolution before confirmation ──
const replayService = readFile('server/services/syncReplayServerService.js')
check('replay service imports classifyConflict from conflict resolution service',
  replayService.includes('classifyConflict') && replayService.includes('syncConflictResolutionServerService.js'))
check('replay confirmation only follows recordEvent() (no client-supplied confirmation id)',
  replayService.includes('recordEvent(candidateEvent') && replayService.includes('markReplayConfirmed(candidateEvent.eventId, { confirmationId: event.event_id })'))

// ── 8. Replay preview does not call mutation methods ─────────────
const previewFnMatch = replayService.match(/export async function previewReplay\([\s\S]*?\n}/)
const previewFnBody = previewFnMatch ? previewFnMatch[0] : ''
const mutationMethodNames = ['recordEvent(', 'markReplayConfirmed(', 'markReplayRejected(', 'recordReplayAttempt(']
check('previewReplay() body does not call any known mutation method',
  Boolean(previewFnBody) && mutationMethodNames.every((m) => !previewFnBody.includes(m)))

// ── 9. Forbidden client fields list exists ────────────────────────
const validationService = readFile('server/services/syncRequestValidationService.js')
check('FORBIDDEN_CLIENT_FIELDS list is exported', validationService.includes('export const FORBIDDEN_CLIENT_FIELDS'))
check('FORBIDDEN_CLIENT_FIELDS includes backendConfirmationId and success', validationService.includes("'backendConfirmationId'") && validationService.includes("'success'"))

// ── 10. Production reports 6C–6H exist ────────────────────────────
const reports = [
  'PRODUCTION_LOCKDOWN_PHASE_6C_CLIENT_SYNC_QUEUE_REPORT.md',
  'PRODUCTION_LOCKDOWN_PHASE_6D_EAT_CATCHUP_STATUS_UI_REPORT.md',
  'PRODUCTION_LOCKDOWN_PHASE_6E_RECONCILIATION_REPLAY_SAFETY_REPORT.md',
  'PRODUCTION_LOCKDOWN_PHASE_6F_BACKEND_RECONCILIATION_REPLAY_REPORT.md',
  'PRODUCTION_LOCKDOWN_PHASE_6G_AUDIT_ACCOUNTABILITY_TIMELINE_REPORT.md',
  'PRODUCTION_LOCKDOWN_PHASE_6H_SECURITY_PERMISSIONS_ABUSE_REPORT.md',
]
for (const r of reports) check(`production report exists: ${r}`, fileExists(r))

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
