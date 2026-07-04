/**
 * verifyPos360OfflineSync.js — Phase B.6 verification (35 checks)
 */

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '../..')

let passed = 0
let failed = 0

function check(label, fn) {
  try {
    const ok = fn()
    if (ok) { console.log(`  ✓  ${label}`); passed++ }
    else    { console.error(`  ✗  ${label}`); failed++ }
  } catch (e) {
    console.error(`  ✗  ${label} — ${e.message}`)
    failed++
  }
}

function readFile(rel) { return readFileSync(join(root, rel), 'utf8') }
function fileExists(rel) { return existsSync(join(root, rel)) }

function noDropTable(rel) {
  const lines = readFile(rel).split('\n')
  return !lines.some(l => !l.trimStart().startsWith('--') && /DROP\s+TABLE/i.test(l))
}

function hasContainsSecrets(rel) {
  return readFile(rel).includes('contains_secrets')
}

console.log('\n── Phase B.6 Offline Mode & Sync Engine — 35 Checks ──────────────────\n')

// ── Migration ──────────────────────────────────────────────────────────────────
check('Migration file exists',
  () => fileExists('server/db/migrations/036_pos360_offline_sync.sql'))

check('Migration has no DROP TABLE (non-comment lines only)',
  () => noDropTable('server/db/migrations/036_pos360_offline_sync.sql'))

check('Migration: pos360_sync_batches table exists',
  () => readFile('server/db/migrations/036_pos360_offline_sync.sql').includes('pos360_sync_batches'))

check('Migration: pos360_sync_actions table exists',
  () => readFile('server/db/migrations/036_pos360_offline_sync.sql').includes('pos360_sync_actions'))

check('Migration: pos360_sync_conflicts table exists',
  () => readFile('server/db/migrations/036_pos360_offline_sync.sql').includes('pos360_sync_conflicts'))

check('Migration: pos360_sync_dead_letters table exists',
  () => readFile('server/db/migrations/036_pos360_offline_sync.sql').includes('pos360_sync_dead_letters'))

check('Migration: pos360_sync_device_health table exists',
  () => readFile('server/db/migrations/036_pos360_offline_sync.sql').includes('pos360_sync_device_health'))

check('Migration: pos360_sync_manager_review_queue table exists',
  () => readFile('server/db/migrations/036_pos360_offline_sync.sql').includes('pos360_sync_manager_review_queue'))

check('Migration: pos360_sync_eat_alerts table exists',
  () => readFile('server/db/migrations/036_pos360_offline_sync.sql').includes('pos360_sync_eat_alerts'))

check('Migration: idempotency_key column in pos360_sync_actions',
  () => readFile('server/db/migrations/036_pos360_offline_sync.sql').includes('idempotency_key'))

check('Migration: clock_drift_ms column',
  () => readFile('server/db/migrations/036_pos360_offline_sync.sql').includes('clock_drift_ms'))

check('Migration: contains_secrets in audit table',
  () => hasContainsSecrets('server/db/migrations/036_pos360_offline_sync.sql'))

// ── Event Contracts ────────────────────────────────────────────────────────────
check('Event contracts file exists',
  () => fileExists('server/services/pos360/pos360SyncEventContracts.js'))

check('SYNC_EVENTS exported',
  () => readFile('server/services/pos360/pos360SyncEventContracts.js').includes('export const SYNC_EVENTS'))

check('SYNC_PRIORITIES exported',
  () => readFile('server/services/pos360/pos360SyncEventContracts.js').includes('export const SYNC_PRIORITIES'))

check('SUPPORTED_LANGUAGES exported from event contracts',
  () => readFile('server/services/pos360/pos360SyncEventContracts.js').includes('export const SUPPORTED_LANGUAGES'))

check('Emergency priority level present',
  () => readFile('server/services/pos360/pos360SyncEventContracts.js').includes("'emergency'"))

check('HIGH_RISK_ACTIONS exported',
  () => readFile('server/services/pos360/pos360SyncEventContracts.js').includes('export const HIGH_RISK_ACTIONS'))

// ── Feature Flags ──────────────────────────────────────────────────────────────
check('Feature flags file exists',
  () => fileExists('server/config/pos360SyncFeatureFlags.js'))

check('getSyncFlags function exported',
  () => readFile('server/config/pos360SyncFeatureFlags.js').includes('export function getSyncFlags'))

check('offline_mode_enabled flag present',
  () => readFile('server/config/pos360SyncFeatureFlags.js').includes('offline_mode_enabled'))

// ── Localization ───────────────────────────────────────────────────────────────
check('Localization file exists',
  () => fileExists('src/locales/pos360Sync.js'))

check('t() function exported',
  () => readFile('src/locales/pos360Sync.js').includes('export function t('))

check('6 languages present (en-US, es-DO, es, ht, de, pt)',
  () => {
    const src = readFile('src/locales/pos360Sync.js')
    return ['en-US', 'es-DO', 'es', 'ht', 'de', 'pt'].every(l => src.includes(l))
  })

// ── Service ────────────────────────────────────────────────────────────────────
check('Service file exists',
  () => fileExists('server/services/pos360/pos360OfflineSyncService.js'))

check('Service: correct DB import path',
  () => readFile('server/services/pos360/pos360OfflineSyncService.js').includes("from '../../db/connection.js'"))

check('Service: fallback comment (no DATABASE_URL mention)',
  () => {
    const src = readFile('server/services/pos360/pos360OfflineSyncService.js')
    return src.includes('Falls back gracefully when no database connection is configured') &&
           !src.includes('DATABASE_URL')
  })

check('Service: queueOfflineAction exported',
  () => readFile('server/services/pos360/pos360OfflineSyncService.js').includes('export async function queueOfflineAction'))

check('Service: replayAction exported',
  () => readFile('server/services/pos360/pos360OfflineSyncService.js').includes('export async function replayAction'))

check('Service: moveToDeadLetter exported',
  () => readFile('server/services/pos360/pos360OfflineSyncService.js').includes('export async function moveToDeadLetter'))

check('Service: createEATAlert exported',
  () => readFile('server/services/pos360/pos360OfflineSyncService.js').includes('export async function createEATAlert'))

check('Service: approveReplay exported',
  () => readFile('server/services/pos360/pos360OfflineSyncService.js').includes('export async function approveReplay'))

// ── Controller & Routes ────────────────────────────────────────────────────────
check('Controller file exists',
  () => fileExists('server/controllers/pos360OfflineSyncController.js'))

check('Routes file exists',
  () => fileExists('server/routes/pos360OfflineSyncRoutes.js'))

check('Routes: mounted at /api/pos360/sync in server/index.js',
  () => readFile('server/index.js').includes('/api/pos360/sync'))

// ── UI ─────────────────────────────────────────────────────────────────────────
check('UI page exists',
  () => fileExists('src/pages/pos360/POS360OfflineSync.jsx'))

check('UI: /smokecraft-pos360.png referenced',
  () => readFile('src/pages/pos360/POS360OfflineSync.jsx').includes('/smokecraft-pos360.png'))

check('UI: OfflineStatusBanner component present',
  () => readFile('src/pages/pos360/POS360OfflineSync.jsx').includes('OfflineStatusBanner'))

check('UI: ConflictCenter component present',
  () => readFile('src/pages/pos360/POS360OfflineSync.jsx').includes('ConflictCenter'))

check('UI: DeadLetterQueue component present',
  () => readFile('src/pages/pos360/POS360OfflineSync.jsx').includes('DeadLetterQueue'))

check('UI: EATSyncAlertsPanel component present',
  () => readFile('src/pages/pos360/POS360OfflineSync.jsx').includes('EATSyncAlertsPanel'))

check('UI: ManagerReviewQueue component present',
  () => readFile('src/pages/pos360/POS360OfflineSync.jsx').includes('ManagerReviewQueue'))

check('UI: LanguageSelector component present',
  () => readFile('src/pages/pos360/POS360OfflineSync.jsx').includes('LanguageSelector'))

check('UI: EmergencySyncPriorityPanel component present',
  () => readFile('src/pages/pos360/POS360OfflineSync.jsx').includes('EmergencySyncPriorityPanel'))

check('App.jsx: sync route registered',
  () => readFile('src/App.jsx').includes('path="sync"') && readFile('src/App.jsx').includes('POS360OfflineSync'))

console.log(`\n── Result: ${passed} passed, ${failed} failed ──────────────────────────\n`)
if (failed > 0) process.exit(1)
