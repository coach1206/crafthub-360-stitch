#!/usr/bin/env node
/**
 * SmokeCraft Database Backup — Production Package 5 (§8)
 *
 * Runs a REAL `pg_dump` against DATABASE_URL and writes a timestamped
 * custom-format artifact to backups/ (gitignored). Records the outcome in
 * backup_run_log (success or failure — never silent). Computes a sha256
 * checksum of the artifact for manifest/integrity verification.
 *
 * Retention policy (documented, applied by this script when run on a
 * schedule): keep all backups from the last 7 days, plus one
 * weekly snapshot per ISO week for 8 weeks. This script prunes on each
 * run; a cron/CI schedule (documented in proof docs, not wired to a live
 * scheduler in this sandbox) would call this daily plus before every
 * migration.
 *
 * Usage: node scripts/backup-smokecraft-database.mjs [--pre-migration]
 */
import { execFile } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const execFileAsync = promisify(execFile)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..')
const BACKUP_DIR = path.join(REPO_ROOT, 'backups')

const RETENTION_DAYS = 7
const WEEKLY_SNAPSHOTS = 8

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

async function recordRun(client, { runType, status, artifactPath, artifactBytes, sha256, migrationVersion, detail, startedAt }) {
  try {
    await client.query(
      `INSERT INTO backup_run_log
         (run_type, status, artifact_path, artifact_bytes, artifact_sha256, migration_version, detail, started_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [runType, status, artifactPath, artifactBytes, sha256, migrationVersion, JSON.stringify(detail || {}), startedAt]
    )
  } catch (err) {
    console.error('[backup] WARNING: could not write backup_run_log row:', err.message)
  }
}

async function getLatestMigrationVersion(client) {
  try {
    const r = await client.query(`SELECT filename FROM schema_migrations ORDER BY id DESC LIMIT 1`)
    return r.rows[0]?.filename ? String(r.rows[0].filename) : null
  } catch {
    return null
  }
}

function sha256File(filePath) {
  const buf = fs.readFileSync(filePath)
  return crypto.createHash('sha256').update(buf).digest('hex')
}

function pruneOldBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return []
  const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith('.dump'))
  const now = Date.now()
  const kept = []
  const weeklyKeys = new Set()
  const sorted = files
    .map((f) => ({ f, mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)

  for (const { f, mtime } of sorted) {
    const ageDays = (now - mtime) / (1000 * 60 * 60 * 24)
    const date = new Date(mtime)
    const isoWeek = `${date.getUTCFullYear()}-W${Math.ceil((((date - new Date(Date.UTC(date.getUTCFullYear(), 0, 1))) / 86400000) + 1) / 7)}`
    if (ageDays <= RETENTION_DAYS) {
      kept.push(f)
      continue
    }
    if (!weeklyKeys.has(isoWeek) && weeklyKeys.size < WEEKLY_SNAPSHOTS) {
      weeklyKeys.add(isoWeek)
      kept.push(f)
      continue
    }
    fs.unlinkSync(path.join(BACKUP_DIR, f))
  }
  return kept
}

async function main() {
  const isPreMigration = process.argv.includes('--pre-migration')
  const databaseUrl = process.env.DATABASE_URL
  const startedAt = new Date()

  if (!databaseUrl) {
    console.error('[backup] FAILURE: DATABASE_URL not set. No backup can be taken.')
    process.exit(1)
  }

  fs.mkdirSync(BACKUP_DIR, { recursive: true })
  const filename = `smokecraft-${isPreMigration ? 'premigration-' : ''}${nowStamp()}.dump`
  const artifactPath = path.join(BACKUP_DIR, filename)

  const pg = (await import('pg')).default
  const client = new pg.Client({ connectionString: databaseUrl })
  await client.connect()
  const migrationVersion = await getLatestMigrationVersion(client)

  try {
    console.log(`[backup] Running pg_dump (custom format) -> ${artifactPath}`)
    await execFileAsync('pg_dump', [
      '--format=custom',
      '--no-owner',
      '--no-privileges',
      `--file=${artifactPath}`,
      databaseUrl,
    ])

    const stat = fs.statSync(artifactPath)
    const sha256 = sha256File(artifactPath)
    console.log(`[backup] SUCCESS. ${stat.size} bytes, sha256=${sha256}, migration_version=${migrationVersion}`)

    await recordRun(client, {
      runType: 'backup', status: 'success', artifactPath: path.relative(REPO_ROOT, artifactPath),
      artifactBytes: stat.size, sha256, migrationVersion, startedAt,
      detail: { preMigration: isPreMigration },
    })

    const kept = pruneOldBackups()
    console.log(`[backup] Retention applied. ${kept.length} backup artifact(s) retained (7-day daily + 8 weekly snapshots).`)

    console.log(JSON.stringify({
      success: true, artifactPath, bytes: stat.size, sha256, migrationVersion, retained: kept.length,
    }))
  } catch (err) {
    console.error('[backup] FAILURE:', err.message)
    await recordRun(client, {
      runType: 'backup', status: 'failure', artifactPath: null, artifactBytes: null, sha256: null,
      migrationVersion, startedAt, detail: { error: err.message, preMigration: isPreMigration },
    })
    await client.end()
    process.exit(1)
  }
  await client.end()
}

main().catch((err) => {
  console.error('[backup] FATAL:', err)
  process.exit(1)
})
