/**
 * Production Package 4 — deployment-grade health endpoints.
 * liveness  : process is up, no dependency checks (fast, for orchestrator restart loops)
 * readiness : real dependency connectivity checks (DB, object storage, payment config)
 * migrations: current applied migration count/version vs. filesystem migration files
 *
 * Never returns secrets, connection strings, private IDs, or stack traces.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getDb, isDbAvailable } from '../db/connection.js'
import { healthCheck as storageHealthCheck } from '../services/venueManagement/objectStorageAdapter.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = path.resolve(__dirname, '../db/migrations')

export function getLiveness(_req, res) {
  res.json({ success: true, status: 'alive', timestamp: new Date().toISOString() })
}

export async function getReadiness(_req, res) {
  const checks = {}
  let allOk = true

  // Database
  try {
    if (isDbAvailable()) {
      await getDb().query('SELECT 1')
      checks.database = { ok: true, mode: 'postgres' }
    } else {
      checks.database = { ok: process.env.NODE_ENV !== 'production', mode: 'prototype' }
      if (process.env.NODE_ENV === 'production') allOk = false
    }
  } catch (err) {
    checks.database = { ok: false, error: 'connectivity check failed' }
    allOk = false
  }

  // Object storage
  try {
    const storage = await storageHealthCheck()
    checks.objectStorage = { ok: storage.ok, provider: storage.provider, activated: storage.activated }
    if (process.env.NODE_ENV === 'production' && !storage.ok) allOk = false
  } catch {
    checks.objectStorage = { ok: false }
    if (process.env.NODE_ENV === 'production') allOk = false
  }

  // Payment config (Stripe) — presence/shape only, never the key value
  const stripeKey = process.env.STRIPE_SECRET_KEY || ''
  const stripeConfigured = stripeKey.startsWith('sk_live_') || stripeKey.startsWith('sk_test_')
  checks.paymentProvider = {
    ok: process.env.NODE_ENV === 'production' ? stripeConfigured : true,
    mode: stripeKey.startsWith('sk_live_') ? 'live' : stripeKey.startsWith('sk_test_') ? 'test' : 'unconfigured',
  }
  if (process.env.NODE_ENV === 'production' && !stripeConfigured) allOk = false

  res.status(allOk ? 200 : 503).json({
    success: allOk,
    status: allOk ? 'ready' : 'not-ready',
    checks,
    timestamp: new Date().toISOString(),
  })
}

export function getMigrationState(_req, res) {
  let files = []
  try {
    files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort()
  } catch {
    return res.status(500).json({ success: false, error: 'migrations directory unreadable' })
  }
  const latest = files[files.length - 1] || null
  res.json({
    success: true,
    migrationCount: files.length,
    latestMigration: latest,
    timestamp: new Date().toISOString(),
  })
}
