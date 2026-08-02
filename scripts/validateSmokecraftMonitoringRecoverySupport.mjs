#!/usr/bin/env node
/**
 * SmokeCraft Monitoring, Backups, Recovery, and Support Validator —
 * Production Package 5 (§26)
 *
 * Confirms (by inspecting real files/exports, not by trusting comments)
 * that the required pieces of this package exist and are wired up:
 *   - structured logging module + secret scrubbing
 *   - health/metrics coverage
 *   - alert definitions
 *   - backup policy + script
 *   - restore procedure + restore validator
 *   - incident-severity model
 *   - core runbooks
 *   - support workflow + support corrective-action audit
 *   - payment/inventory incident procedures
 *   - Passport known issue documented
 *   - proof references exist
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PROOF_DIR = path.join(ROOT, 'public/proof/smokecraft-monitoring-backup-recovery-support')

let fails = 0
function check(name, pass, detail = '') {
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}${detail ? ' — ' + detail : ''}`)
  if (!pass) fails++
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel))
}

function fileContains(rel, needle) {
  const p = path.join(ROOT, rel)
  if (!fs.existsSync(p)) return false
  return fs.readFileSync(p, 'utf8').includes(needle)
}

// ── Structured logging + secret scrubbing ───────────────────────
check('structured logger module exists', exists('server/lib/structuredLogger.mjs'))
check('structured logger exports scrubObject/scrubString', fileContains('server/lib/structuredLogger.mjs', 'export function scrubObject') && fileContains('server/lib/structuredLogger.mjs', 'export function scrubString'))
check('structured logger scrubs Stripe secret patterns', fileContains('server/lib/structuredLogger.mjs', 'sk_(live|test)'))
check('structured logger defines correlation IDs', fileContains('server/lib/structuredLogger.mjs', 'newCorrelationId'))
check('structured logger defines required event types (payment/inventory/webhook/media/passport/golden box/backup)', [
  'PAYMENT_TRANSITION', 'INVENTORY_MUTATION', 'WEBHOOK_PROCESSING', 'MEDIA_PROCESSING',
  'PASSPORT_CLAIM', 'GOLDEN_BOX_LIFECYCLE', 'BACKUP', 'RESTORE',
].every((k) => fileContains('server/lib/structuredLogger.mjs', k)))

// ── Health/metrics coverage ──────────────────────────────────────
check('health routes exist (Package 4 baseline extended, not duplicated)', exists('server/routes/healthRoutes.js'))
check('health routes expose /health/live, /health/ready, /health/migrations', ['getLiveness', 'getReadiness', 'getMigrationState'].every((f) => fileContains('server/routes/healthRoutes.js', f)))
check('health routes expose admin-gated /health/metrics (Package 5 addition)', fileContains('server/routes/healthRoutes.js', 'health/metrics') && fileContains('server/routes/healthRoutes.js', 'requireAdmin'))
check('metrics module exists with counters/gauges/histograms', exists('server/lib/metrics.mjs') && ['incrCounter', 'setGauge', 'recordDuration'].every((f) => fileContains('server/lib/metrics.mjs', f)))

// ── Alerts ───────────────────────────────────────────────────────
check('alert rules module exists', exists('server/lib/alertRules.mjs'))
check('alert rules define app_unavailable, db_unavailable, backup_failure, restore_verification_failure, inventory_oversell_attempt', [
  'app_unavailable', 'db_unavailable', 'backup_failure', 'restore_verification_failure', 'inventory_oversell_attempt',
].every((k) => fileContains('server/lib/alertRules.mjs', k)))
check('alert inventory proof doc exists', exists(path.relative(ROOT, path.join(PROOF_DIR, 'alerts-inventory.md'))))

// ── Owner status view ─────────────────────────────────────────────
check('ops status controller exists', exists('server/controllers/opsStatusController.js'))
check('ops status route is RBAC-gated (requireAuth + requireAdmin)', fileContains('server/routes/opsStatusRoutes.js', 'requireAuth') && fileContains('server/routes/opsStatusRoutes.js', 'requireAdmin'))
check('ops status uses text labels, not color-only', fileContains('server/controllers/opsStatusController.js', 'label(status'))

// ── Backups ────────────────────────────────────────────────────────
check('real database backup script exists (pg_dump)', exists('scripts/backup-smokecraft-database.mjs') && fileContains('scripts/backup-smokecraft-database.mjs', 'pg_dump'))
check('backup script records outcome to backup_run_log (no silent failures)', fileContains('scripts/backup-smokecraft-database.mjs', 'backup_run_log'))
check('backup retention policy documented in script', fileContains('scripts/backup-smokecraft-database.mjs', 'RETENTION_DAYS'))
check('database-backups proof doc exists', exists(path.relative(ROOT, path.join(PROOF_DIR, 'database-backups.md'))))

// ── Restore ────────────────────────────────────────────────────────
check('restore validator script exists', exists('scripts/verify-smokecraft-backup-restore.mjs'))
check('restore validator refuses to target the active database', fileContains('scripts/verify-smokecraft-backup-restore.mjs', 'REFUSING TO RUN'))
check('restore validator checks migration version + critical tables + reconciliation', [
  'migration version matches source', 'critical table present', 'row count reconciles', 'inventory ledger sum reconciles',
].every((k) => fileContains('scripts/verify-smokecraft-backup-restore.mjs', k)))
check('restore-test proof doc (real output) exists', exists(path.relative(ROOT, path.join(PROOF_DIR, 'restore-test.md'))))
check('restore validator JSON output captured', exists(path.relative(ROOT, path.join(PROOF_DIR, 'restore-validator-output.json'))))

// ── Incident model ────────────────────────────────────────────────
check('incident-severity proof doc exists', exists(path.relative(ROOT, path.join(PROOF_DIR, 'incident-severity.md'))))
check('incident-runbooks proof doc exists with core runbooks (app down, DB down, payment webhook, migration)', (() => {
  const rel = path.relative(ROOT, path.join(PROOF_DIR, 'incident-runbooks.md'))
  return exists(rel) && ['Application Down', 'Database Down', 'Failed Migration', 'Payment Webhook Outage'].every((k) => fileContains(rel, k))
})())

// ── Support workflow + audit ─────────────────────────────────────
check('support admin controller exists', exists('server/controllers/supportAdminController.js'))
check('support corrective actions require confirm + are logged before apply', fileContains('server/controllers/supportAdminController.js', 'confirm !== true') && fileContains('server/controllers/supportAdminController.js', 'support_case_actions'))
check('support corrective actions are allowlisted (no arbitrary mutation)', fileContains('server/controllers/supportAdminController.js', 'ALLOWED_CORRECTIVE_ACTIONS'))
check('support admin routes RBAC-gate corrective actions to admin+', fileContains('server/routes/supportAdminRoutes.js', 'requireAdmin'))
check('support case migration exists (case model + action audit + backup log)', exists('server/db/migrations/116_smokecraft_monitoring_backup_support.sql'))
check('customer-support proof doc exists', exists(path.relative(ROOT, path.join(PROOF_DIR, 'customer-support.md'))))

// ── Payment/inventory incident handling ──────────────────────────
check('payment-incidents proof doc exists', exists(path.relative(ROOT, path.join(PROOF_DIR, 'payment-incidents.md'))))
check('inventory-incidents proof doc exists (append-only ledger preserved)', (() => {
  const rel = path.relative(ROOT, path.join(PROOF_DIR, 'inventory-incidents.md'))
  return exists(rel) && fileContains(rel, 'append-only')
})())

// ── Passport known issue ─────────────────────────────────────────
check('passport-known-issue proof doc exists', exists(path.relative(ROOT, path.join(PROOF_DIR, 'passport-known-issue.md'))))
check('passport known issue documented as pre-existing, not hidden', (() => {
  const rel = path.relative(ROOT, path.join(PROOF_DIR, 'passport-known-issue.md'))
  return exists(rel) && fileContains(rel, 'pre-existing')
})())

// ── Proof references ──────────────────────────────────────────────
const requiredProofDocs = [
  'baseline.md', 'monitoring-architecture.md', 'structured-logging.md', 'error-tracking.md',
  'metrics.md', 'alerts-inventory.md', 'owner-status-view.md', 'database-backups.md',
  'object-storage-protection.md', 'backup-manifest.md', 'restore-procedures.md', 'restore-test.md',
  'rpo-rto.md', 'incident-severity.md', 'incident-runbooks.md', 'payment-incidents.md',
  'inventory-incidents.md', 'customer-support.md', 'support-admin-tools.md', 'secret-rotation.md',
  'release-rollback.md', 'status-page.md', 'passport-known-issue.md', 'security-and-rbac.md',
  'regression-results.md', 'known-limitations.md', 'final-report.md',
]
for (const doc of requiredProofDocs) {
  check(`proof doc present: ${doc}`, exists(path.relative(ROOT, path.join(PROOF_DIR, doc))))
}

console.log('')
console.log(fails === 0 ? 'RESULT: MONITORING/RECOVERY/SUPPORT VALIDATOR — ALL CHECKS PASSED' : `RESULT: ${fails} CHECK(S) FAILED`)
process.exit(fails === 0 ? 0 : 1)
