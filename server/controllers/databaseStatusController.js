import { getDatabaseStatus } from '../db/index.js'
import { getMigrationStatus } from '../db/runMigrations.js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = path.resolve(__dirname, '../db/migrations')

export async function getDatabaseStatusHandler(req, res) {
  const dbStatus = getDatabaseStatus()

  let migrationRunnerStatus = 'migration_ready'
  let migrationsFolderFound = false
  let migrationCount = 0

  try {
    migrationsFolderFound = fs.existsSync(MIGRATIONS_DIR)
    if (migrationsFolderFound) {
      migrationCount = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).length
    }
  } catch {
    migrationRunnerStatus = 'migration_folder_unavailable'
  }

  if (!process.env.DATABASE_URL) {
    migrationRunnerStatus = 'database_required'
  } else {
    try {
      const status = await getMigrationStatus()
      migrationRunnerStatus = status.status ?? 'migration_ready'
    } catch {
      migrationRunnerStatus = 'migration_status_unavailable'
    }
  }

  res.json({
    ...dbStatus,
    migrationRunnerStatus,
    migrationsFolderFound,
    migrationCount,
    lastCheckedAt: new Date().toISOString(),
  })
}
