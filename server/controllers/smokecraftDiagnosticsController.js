/**
 * SmokeCraft self-diagnostic readiness endpoint (Truth Gate — Phase 5).
 *
 * GET /api/smokecraft/diagnostics/readiness
 *
 * Admin/founder-only (mounted behind requireAuth + requireAdmin in
 * server/routes/smokecraftDiagnosticsRoutes.js — the same real auth
 * middleware every other admin-gated route in this codebase uses, e.g.
 * server/routes/adminRoutes.js). Never public.
 *
 * Exists so the owner can open one URL and get a structured pass/fail
 * report of exactly what is proving Session 2 (Humidor Match) works or
 * doesn't, without searching Railway logs, DevTools, or the database —
 * this is the "make the application diagnose and prove its own
 * production state" requirement.
 *
 * Never returns: SQL text, connection strings, secrets, tokens, stack
 * traces, or any real player/venue PII. The Session 2 draft write test
 * always runs inside a transaction that is rolled back — it never
 * creates a permanent row.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getDb, isDbAvailable } from '../db/connection.js'
import { getMigrationStatus } from '../db/runMigrations.js'
import { verifySmokecraftSchema } from '../db/verifySmokecraftSchema.js'
import { startupState } from '../state/startupState.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CLIENT_DIST = path.resolve(__dirname, '../../dist')
const BUILD_MANIFEST_PATH = path.join(CLIENT_DIST, 'build-manifest.json')

function readBuildManifest() {
  try {
    return JSON.parse(fs.readFileSync(BUILD_MANIFEST_PATH, 'utf8'))
  } catch {
    return null
  }
}

// Probe guest_reference — never a real learner's identity. Fixed literal,
// never derived from request input, so it cannot be used to enumerate or
// disturb real player data. The write test below uses a distinct,
// clearly-marked value and always rolls back.
const DIAGNOSTIC_READ_PROBE_GUEST = '__diagnostic_probe__'
const DIAGNOSTIC_WRITE_PROBE_GUEST = '__diagnostic_write_probe__'
const DIAGNOSTIC_ACTIVITY_KEY = '__readiness_check__'

async function checkDatabaseConnectivity(db) {
  if (!db) return { ok: false, code: 'DATABASE_UNAVAILABLE', detail: 'No database connection.' }
  try {
    await db.query('SELECT 1')
    return { ok: true }
  } catch (err) {
    return { ok: false, code: 'DATABASE_UNAVAILABLE', detail: 'Connectivity probe failed.' }
  }
}

async function checkMigrations() {
  const status = await getMigrationStatus()
  const ok = status.status === 'audit_logged' // 0 pending
  return { ok, code: ok ? undefined : 'MIGRATIONS_INCOMPLETE', pendingCount: status.pendingCount, migrationCount: status.migrations.length }
}

async function checkPlayerStateDependency(db) {
  if (!db) return { ok: false, code: 'PLAYER_STATE_DEPENDENCY_FAILED' }
  try {
    await db.query('SELECT 1 FROM smokecraft_player_state LIMIT 1')
    return { ok: true }
  } catch (err) {
    return { ok: false, code: 'PLAYER_STATE_DEPENDENCY_FAILED', detail: 'smokecraft_player_state query failed.' }
  }
}

async function checkVenueReadiness(db) {
  if (!db) return { ok: false, code: 'DATABASE_UNAVAILABLE', activeVenueCount: 0 }
  try {
    const { rows } = await db.query(`SELECT COUNT(*)::int AS c FROM venues WHERE status = 'active'`)
    const count = rows[0]?.c ?? 0
    return { ok: true, activeVenueCount: count, empty: count === 0 }
  } catch (err) {
    return { ok: false, code: 'DATABASE_UNAVAILABLE', activeVenueCount: 0, detail: 'venues query failed.' }
  }
}

async function checkSession2DraftRead(db) {
  if (!db) return { ok: false, code: 'SESSION2_DRAFT_READ_FAILED' }
  try {
    await db.query(
      `SELECT draft_data, version FROM smokecraft_tasting_drafts WHERE guest_reference = $1 AND activity_key = $2`,
      [DIAGNOSTIC_READ_PROBE_GUEST, DIAGNOSTIC_ACTIVITY_KEY]
    )
    // Zero rows is a fully valid, successful result — GET draft never
    // throws merely because no draft exists yet (matches the real
    // handler's contract in playerStateController.js).
    return { ok: true }
  } catch (err) {
    return { ok: false, code: 'SESSION2_DRAFT_READ_FAILED', detail: 'draft SELECT failed.' }
  }
}

async function checkSession2DraftWrite(db) {
  if (!db) return { ok: false, code: 'SESSION2_DRAFT_WRITE_FAILED' }
  try {
    await db.query('BEGIN')
    await db.query(
      `INSERT INTO smokecraft_tasting_drafts (guest_reference, activity_key, draft_data, version)
       VALUES ($1, $2, $3, 0)
       ON CONFLICT (guest_reference, activity_key) DO UPDATE SET draft_data = EXCLUDED.draft_data`,
      [DIAGNOSTIC_WRITE_PROBE_GUEST, DIAGNOSTIC_ACTIVITY_KEY, JSON.stringify({ probe: true })]
    )
    await db.query('ROLLBACK') // never a permanent write, per mandate
    return { ok: true }
  } catch (err) {
    await db.query('ROLLBACK').catch(() => {})
    return { ok: false, code: 'SESSION2_DRAFT_WRITE_FAILED', detail: 'draft transactional INSERT failed.' }
  }
}

export async function handleReadinessCheck(req, res) {
  const manifest = readBuildManifest()
  const commit = manifest?.commit || process.env.RAILWAY_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || null
  const environment = process.env.NODE_ENV || 'development'
  const applicationVersion = manifest?.applicationVersion || process.env.npm_package_version || null

  let db = null
  try { db = getDb() } catch { db = null }

  const dbConnectivity = await checkDatabaseConnectivity(db)
  const migrations = dbConnectivity.ok ? await checkMigrations() : { ok: false, code: 'MIGRATIONS_INCOMPLETE' }
  const schema = dbConnectivity.ok ? await verifySmokecraftSchema(db) : { ok: false, failureCode: 'DATABASE_UNAVAILABLE', checks: [] }
  const tastingDraftTable = schema.checks.find(c => c.name === 'table_exists:smokecraft_tasting_drafts') || { ok: dbConnectivity.ok && schema.ok }
  const tastingDraftColumns = schema.checks.find(c => c.name === 'columns:smokecraft_tasting_drafts') || { ok: dbConnectivity.ok && schema.ok }
  const playerState = dbConnectivity.ok ? await checkPlayerStateDependency(db) : { ok: false, code: 'PLAYER_STATE_DEPENDENCY_FAILED' }
  const venue = dbConnectivity.ok ? await checkVenueReadiness(db) : { ok: false, code: 'DATABASE_UNAVAILABLE', activeVenueCount: 0 }
  const session2Read = dbConnectivity.ok && tastingDraftTable.ok ? await checkSession2DraftRead(db) : { ok: false, code: 'SESSION2_DRAFT_READ_FAILED' }
  const session2Write = dbConnectivity.ok && tastingDraftTable.ok ? await checkSession2DraftWrite(db) : { ok: false, code: 'SESSION2_DRAFT_WRITE_FAILED' }

  const checks = {
    databaseConnectivity: dbConnectivity,
    migrations,
    schemaVerification: { ok: schema.ok, failureCode: schema.failureCode || undefined },
    tastingDraftTable: { ok: !!tastingDraftTable.ok, code: tastingDraftTable.ok ? undefined : 'TASTING_DRAFT_TABLE_MISSING' },
    tastingDraftColumns: { ok: !!tastingDraftColumns.ok, code: tastingDraftColumns.ok ? undefined : 'TASTING_DRAFT_COLUMN_MISSING' },
    playerStateDependency: playerState,
    venueData: { ok: venue.ok, activeVenueCount: venue.activeVenueCount ?? 0, code: venue.code },
    session2DraftRead: session2Read,
    session2DraftWrite: session2Write,
  }

  // Hard failures — anything schema/db/session2-critical failing means the
  // Session 2 journey is genuinely broken.
  const hardFailureCodes = []
  if (!dbConnectivity.ok) hardFailureCodes.push('DATABASE_UNAVAILABLE')
  if (!migrations.ok) hardFailureCodes.push('MIGRATIONS_INCOMPLETE')
  if (!tastingDraftTable.ok) hardFailureCodes.push('TASTING_DRAFT_TABLE_MISSING')
  if (!tastingDraftColumns.ok) hardFailureCodes.push('TASTING_DRAFT_COLUMN_MISSING')
  if (!playerState.ok) hardFailureCodes.push('PLAYER_STATE_DEPENDENCY_FAILED')
  if (!session2Read.ok) hardFailureCodes.push('SESSION2_DRAFT_READ_FAILED')
  if (!session2Write.ok) hardFailureCodes.push('SESSION2_DRAFT_WRITE_FAILED')

  // Venue emptiness is a soft (degraded) failure — venue selection has an
  // explicit "Continue without venue" path (src/pages/smokecraft/
  // VenueSelect.jsx), so an empty-but-working venues table must never
  // block the player journey or read as a system failure.
  const softFailureCodes = []
  if (venue.ok && venue.empty) softFailureCodes.push('VENUE_DATA_EMPTY')
  if (venue.ok === false && venue.code) hardFailureCodes.push(venue.code === 'DATABASE_UNAVAILABLE' ? 'DATABASE_UNAVAILABLE' : venue.code)

  let overallStatus = 'ready'
  if (hardFailureCodes.length > 0) overallStatus = 'failed'
  else if (softFailureCodes.length > 0) overallStatus = 'degraded'

  res.json({
    success: true,
    overallStatus,
    failureCodes: [...new Set(hardFailureCodes)],
    degradedCodes: [...new Set(softFailureCodes)],
    applicationVersion,
    commit,
    environment,
    startup: {
      migrationStatus: startupState.migration?.status ?? null,
      schemaVerified: startupState.schema?.ok ?? null,
      bootedAt: startupState.bootedAt,
    },
    checks,
    timestamp: new Date().toISOString(),
  })
}
