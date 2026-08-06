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
const GAME_MANIFEST_PATH = path.resolve(__dirname, '../../docs/smokecraft/SMOKECRAFT_GAME_MANIFEST.json')

function readBuildManifest() {
  try {
    return JSON.parse(fs.readFileSync(BUILD_MANIFEST_PATH, 'utf8'))
  } catch {
    return null
  }
}

// JOURNEY_MANIFEST_INVALID (Phase 19) — a real, cheap, checkable structural
// sanity check on the same build-generated canonical journey manifest that
// scripts/validateSmokecraftManifest.mjs already enforces at build time
// (see that script for the full, stricter check set). This is the runtime
// counterpart: if a deploy somehow shipped without that build gate having
// run (or the committed doc drifted from the shipped bundle), the owner's
// readiness page still catches it instead of silently reporting healthy.
// Deliberately re-reads the file fresh on every request rather than caching
// it, so a redeploy is reflected immediately.
function checkJourneyManifest() {
  let manifest
  try {
    manifest = JSON.parse(fs.readFileSync(GAME_MANIFEST_PATH, 'utf8'))
  } catch {
    return { ok: false, code: 'JOURNEY_MANIFEST_INVALID', detail: 'SMOKECRAFT_GAME_MANIFEST.json missing or unreadable.' }
  }
  const entries = Array.isArray(manifest?.entries) ? manifest.entries : null
  if (!entries || entries.length === 0) {
    return { ok: false, code: 'JOURNEY_MANIFEST_INVALID', detail: 'Manifest has no entries.' }
  }
  if (typeof manifest.totalRoutes === 'number' && manifest.totalRoutes !== entries.length) {
    return { ok: false, code: 'JOURNEY_MANIFEST_INVALID', detail: 'totalRoutes does not match entries length.' }
  }
  const ids = entries.map(e => e.screenId)
  if (new Set(ids).size !== ids.length) {
    return { ok: false, code: 'JOURNEY_MANIFEST_INVALID', detail: 'Duplicate screenId in manifest.' }
  }
  const badRoute = entries.find(e => typeof e.route !== 'string' || !e.route.startsWith('/smokecraft'))
  if (badRoute) {
    return { ok: false, code: 'JOURNEY_MANIFEST_INVALID', detail: 'Entry with missing/invalid route.' }
  }
  return { ok: true, entryCount: entries.length }
}

// ASSET_GOVERNANCE (this pass) — runtime counterpart of
// scripts/validateSmokecraftAssets.mjs. Re-checks the live SC_ASSETS
// registry for external image URLs, non-repo-relative paths, and assets
// missing from disk, so a deploy that somehow shipped without the build-time
// validator having run still surfaces the exact same real failure on the
// owner's readiness page instead of reporting healthy. UNAPPROVED_IMAGE_ASSET
// covers "on disk but not repo-relative/registered correctly"; the paired
// EXTERNAL_IMAGE_REFERENCE code is reported separately since it is a
// materially different (and more severe) production-safety violation.
const SC_ASSETS_PATH = path.resolve(__dirname, '../../src/constants/smokecraftAssets.js')
const PUBLIC_DIR = path.resolve(__dirname, '../../public')
// R2_* checks (SmokeCraft Production Closure, Part 11). Real, not
// simulated: when the object-storage adapter is activated (STORAGE_PROVIDER
// != local + bucket + credentials all present), this uploads a tiny
// generated object under a diagnostics-only prefix, HEADs it, verifies its
// metadata round-trips, deletes it, and confirms the delete — leaving
// nothing behind and never touching real customer/venue media. When the
// adapter is not activated, this reports R2_CONFIGURATION_MISSING as a
// real (non-fabricated) status rather than pretending success.
async function checkR2Diagnostics() {
  let adapter
  try {
    adapter = await import('../services/venueManagement/objectStorageAdapter.js')
  } catch (err) {
    return { ok: false, code: 'R2_CONFIGURATION_MISSING', detail: `object-storage adapter failed to load: ${err.message}` }
  }
  const info = adapter.providerInfo()
  if (!info.activated) {
    return { ok: false, code: 'R2_CONFIGURATION_MISSING', provider: info.provider, bucket: info.bucket, detail: 'STORAGE_PROVIDER/STORAGE_BUCKET/credentials not fully configured — R2 is not wired in this environment.' }
  }
  // Namespaced under this environment's keyPrefix — remove() refuses to
  // delete any key outside it (a real, correct safety guard against
  // cross-environment deletes), found by the R2 diagnostics test suite
  // to be a real bug here and in r2Diagnostics.js's own preflight before
  // this fix: an unprefixed diagnostic key would pass every stage up
  // through delete, then fail there in real production every time.
  const diagnosticKey = `${info.keyPrefix}/diagnostics/smokecraft-readiness/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.txt`
  const payload = Buffer.from(`smokecraft readiness diagnostic ${new Date().toISOString()}`)
  try {
    await adapter.putObjectAtKey({ key: diagnosticKey, buffer: payload, mimeType: 'text/plain', cacheControl: 'no-store' })
    const head = await adapter.headObject(diagnosticKey)
    if (!head) return { ok: false, code: 'R2_READ_FAILED', detail: 'HEAD after PUT returned no object.' }
    await adapter.remove(diagnosticKey)
    const postDeleteHead = await adapter.headObject(diagnosticKey)
    if (postDeleteHead) return { ok: false, code: 'R2_DELETE_FAILED', detail: 'Object still present after delete.' }
    return { ok: true, provider: info.provider, bucket: info.bucket }
  } catch (err) {
    const msg = err.message || String(err)
    let code = 'R2_BUCKET_UNREACHABLE'
    if (/credential|signature|forbidden|403/i.test(msg)) code = 'R2_CREDENTIALS_INVALID'
    else if (/write|put/i.test(msg)) code = 'R2_WRITE_FAILED'
    return { ok: false, code, detail: msg }
  }
}

async function checkAssetGovernance() {
  let mod
  try {
    mod = await import(SC_ASSETS_PATH)
  } catch {
    return { ok: false, code: 'UNAPPROVED_IMAGE_ASSET', detail: 'SC_ASSETS registry failed to load.' }
  }
  const SC_ASSETS = mod.SC_ASSETS || {}
  for (const [key, value] of Object.entries(SC_ASSETS)) {
    if (value === null) continue
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value)) {
      return { ok: false, code: 'EXTERNAL_IMAGE_REFERENCE', detail: `SC_ASSETS.${key} references an external URL.` }
    }
    if (!value.startsWith('/')) {
      return { ok: false, code: 'UNAPPROVED_IMAGE_ASSET', detail: `SC_ASSETS.${key} is not a repo-relative path.` }
    }
    const fsPath = path.join(PUBLIC_DIR, decodeURIComponent(value.split('?')[0]))
    if (!fs.existsSync(fsPath)) {
      return { ok: false, code: 'UNAPPROVED_IMAGE_ASSET', detail: `SC_ASSETS.${key} does not exist on disk.` }
    }
  }
  return { ok: true, assetCount: Object.keys(SC_ASSETS).length }
}

// ROUTE_SEQUENCE_INVALID (this pass) — cross-checks the build-generated
// journey manifest's route order against the canonical server-side
// VISIT_STRUCTURE spine (src/constants/session.js) that
// scripts/verify-smokecraft-full-game-fresh-player.mjs drives its 27-session
// walkthrough from. Catches a manifest that has silently drifted from the
// real session order (e.g. a hand-edit that re-ordered entries without
// re-running the generator).
const SESSION_CONST_PATH = path.resolve(__dirname, '../../src/constants/session.js')
async function checkRouteSequence(manifest) {
  if (!manifest?.ok) return { ok: false, code: 'ROUTE_SEQUENCE_INVALID', detail: 'Journey manifest itself is invalid; cannot verify sequence.' }
  let entries
  try {
    entries = JSON.parse(fs.readFileSync(GAME_MANIFEST_PATH, 'utf8')).entries
  } catch {
    return { ok: false, code: 'ROUTE_SEQUENCE_INVALID', detail: 'Manifest unreadable.' }
  }
  let VISIT_STRUCTURE
  try {
    ;({ VISIT_STRUCTURE } = await import(SESSION_CONST_PATH))
  } catch {
    return { ok: false, code: 'ROUTE_SEQUENCE_INVALID', detail: 'Canonical session spine failed to load.' }
  }
  // Compare by ROUTE, not screenId — the manifest's screenId uses a
  // "session-N" naming convention distinct from the canonical spine's
  // completion ids, but both sides carry the real /smokecraft/... route,
  // which is the actual thing a "hardcoded next/previous route" bug would
  // corrupt. Manifest entries are pre-filtered to curriculum sessions
  // (sessionNumber present) so entry/admin/commerce screens outside the
  // 27-session spine don't produce false mismatches.
  // The canonical spine legitimately repeats a route across consecutive
  // merged sub-sessions (e.g. first-third appears twice for the merged
  // S8/S9 tasting pair — see verify-smokecraft-full-game-fresh-player.mjs
  // comments on "covers merged S9/S13/S17/S18/S20"). Collapse consecutive
  // duplicates before comparing so that legitimate merging is never
  // reported as a false route-order violation.
  const canonicalRoutesRaw = []
  for (const v of VISIT_STRUCTURE) for (const s of v.sessions) if (s.route) canonicalRoutesRaw.push(s.route)
  const canonicalRoutes = canonicalRoutesRaw.filter((r, i) => r !== canonicalRoutesRaw[i - 1])
  const manifestRoutes = entries
    .filter(e => e.sessionNumber != null && typeof e.route === 'string')
    .map(e => e.route)
    .filter(r => canonicalRoutes.includes(r))
  const filteredCanonical = canonicalRoutes.filter(r => manifestRoutes.includes(r))
  if (manifestRoutes.length === 0) {
    return { ok: false, code: 'ROUTE_SEQUENCE_INVALID', detail: 'No curriculum-session routes found in manifest to cross-check against the canonical spine.' }
  }
  for (let i = 0; i < manifestRoutes.length; i++) {
    if (manifestRoutes[i] !== filteredCanonical[i]) {
      return { ok: false, code: 'ROUTE_SEQUENCE_INVALID', detail: `Manifest route order diverges from canonical spine at position ${i} (manifest="${manifestRoutes[i]}", expected="${filteredCanonical[i]}").` }
    }
  }
  return { ok: true, checkedCount: manifestRoutes.length }
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
  const journeyManifest = checkJourneyManifest()
  const assetGovernance = await checkAssetGovernance()
  const routeSequence = await checkRouteSequence(journeyManifest)
  const r2Diagnostics = await checkR2Diagnostics()

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
    journeyManifest,
    assetGovernance,
    routeSequence,
    r2Diagnostics,
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
  if (!journeyManifest.ok) hardFailureCodes.push(journeyManifest.code)
  if (!assetGovernance.ok) hardFailureCodes.push(assetGovernance.code)
  if (!routeSequence.ok) hardFailureCodes.push(routeSequence.code)

  // Venue emptiness is a soft (degraded) failure — venue selection has an
  // explicit "Continue without venue" path (src/pages/smokecraft/
  // VenueSelect.jsx), so an empty-but-working venues table must never
  // block the player journey or read as a system failure.
  const softFailureCodes = []
  if (venue.ok && venue.empty) softFailureCodes.push('VENUE_DATA_EMPTY')
  // R2 not being configured is a real, honest DEGRADED signal (production
  // media delivery isn't wired), not a hard journey-breaking failure — the
  // app still fully functions on its existing local/GitHub-served assets.
  if (!r2Diagnostics.ok) softFailureCodes.push(r2Diagnostics.code)
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
