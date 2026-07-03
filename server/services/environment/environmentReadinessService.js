/**
 * EPRL — Environment Readiness Service
 * Detects runtime mode, DATABASE_URL status, and deployment context.
 */

import { redactDatabaseUrl } from '../../utils/safeEnvironmentLogger.js'

const ENVIRONMENT_MODES = [
  'local_demo','local_database','staging_database','production_database',
  'test_mode','database_missing','database_invalid_url','database_unavailable',
  'migration_pending','migration_mismatch','schema_ready','degraded_mode',
]

export function getEnvironmentMode() {
  const nodeEnv  = process.env.NODE_ENV ?? 'development'
  const appEnv   = process.env.APP_ENV  ?? ''
  const hasDb    = !!process.env.DATABASE_URL

  if (nodeEnv === 'test') return 'test_mode'
  if (!hasDb) return 'local_demo'

  const urlStatus = validateDatabaseUrlShape(process.env.DATABASE_URL)
  if (!urlStatus.valid) return 'database_invalid_url'

  if (nodeEnv === 'production' || appEnv === 'production') return 'production_database'
  if (appEnv === 'staging') return 'staging_database'
  return 'local_database'
}

export function getDatabaseUrlStatus() {
  const url = process.env.DATABASE_URL
  if (!url) return { present: false, status: 'database_missing', redacted: null }
  const validation = validateDatabaseUrlShape(url)
  return {
    present:  true,
    status:   validation.valid ? 'database_url_valid' : 'database_invalid_url',
    redacted: redactDatabaseUrl(url),
    valid:    validation.valid,
    reason:   validation.reason ?? null,
  }
}

export function validateDatabaseUrlShape(url) {
  if (!url) return { valid: false, reason: 'missing_database_url' }
  const lower = url.toLowerCase()
  if (!lower.startsWith('postgres://') && !lower.startsWith('postgresql://')) {
    return { valid: false, reason: 'invalid_protocol' }
  }
  try {
    const parsed = new URL(url)
    if (!parsed.hostname) return { valid: false, reason: 'missing_host' }
    if (!parsed.pathname || parsed.pathname === '/') return { valid: false, reason: 'missing_database_name' }
    return { valid: true }
  } catch {
    return { valid: false, reason: 'malformed_url' }
  }
}

export function detectDeploymentProvider() {
  if (process.env.RAILWAY_ENVIRONMENT)          return 'railway'
  if (process.env.RENDER)                       return 'render'
  if (process.env.VERCEL)                       return 'vercel'
  if (process.env.FLY_APP_NAME)                 return 'fly_io'
  if (process.env.HEROKU_APP_NAME)              return 'heroku'
  if (process.env.AWS_EXECUTION_ENV)            return 'aws'
  if (process.env.GOOGLE_CLOUD_PROJECT)         return 'gcp'
  if (process.env.AZURE_FUNCTIONS_ENVIRONMENT)  return 'azure'
  return 'unknown'
}

export function detectRuntimeMode() {
  return {
    nodeEnv:     process.env.NODE_ENV    ?? 'development',
    appEnv:      process.env.APP_ENV     ?? 'local',
    provider:    detectDeploymentProvider(),
    mode:        getEnvironmentMode(),
    hasDatabase: !!process.env.DATABASE_URL,
    hasStripe:   !!process.env.STRIPE_SECRET_KEY,
    hasWebhook:  !!process.env.STRIPE_WEBHOOK_SECRET,
  }
}

export function buildEnvironmentReadinessReport() {
  const mode      = getEnvironmentMode()
  const dbStatus  = getDatabaseUrlStatus()
  const runtime   = detectRuntimeMode()
  const blockers  = []
  const warnings  = []

  if (!dbStatus.present)   blockers.push('DATABASE_URL missing — persistence in degraded mode')
  if (!runtime.hasStripe)  warnings.push('STRIPE_SECRET_KEY missing — payment flows preview-only')
  if (!runtime.hasWebhook) warnings.push('STRIPE_WEBHOOK_SECRET missing — webhook verification disabled')

  return {
    ok:              blockers.length === 0,
    environmentMode: mode,
    databaseUrl:     dbStatus,
    runtime,
    blockers,
    warnings,
    degradedMode:    !dbStatus.present,
    persistenceMode: dbStatus.present ? 'real_database' : 'in_memory_only',
    timestamp:       new Date().toISOString(),
  }
}

export function buildDatabaseReadinessReport() {
  const dbStatus = getDatabaseUrlStatus()
  return {
    ok:              dbStatus.present && dbStatus.valid,
    status:          dbStatus.status,
    present:         dbStatus.present,
    valid:           dbStatus.valid ?? false,
    redacted:        dbStatus.redacted,
    degradedMode:    !dbStatus.present,
    databaseRequired: true,
    persistenceMode: dbStatus.present ? 'real_database' : 'in_memory_only',
    note:            dbStatus.present
                       ? 'DATABASE_URL detected — database persistence available when migrations are applied'
                       : 'DATABASE_URL not set — all persistence is in_memory_only',
  }
}

export function buildPersistenceModeReport() {
  const hasDb = !!process.env.DATABASE_URL
  return {
    ok:              true,
    persistenceMode: hasDb ? 'real_database' : 'in_memory_only',
    degradedMode:    !hasDb,
    databaseRequired: !hasDb,
    canWrite:        hasDb,
    canRead:         true,
    note:            hasDb
                       ? 'Write and read persistence available via database'
                       : 'In-memory-only mode — data not durable across restarts',
  }
}

export function buildSafeFallbackReport() {
  return {
    ok:              true,
    fallbackActive:  !process.env.DATABASE_URL,
    fallbackMode:    'in_memory_only',
    degradedMode:    true,
    databaseRequired: true,
    note:            'Safe fallback is always available. No data is lost from in-memory stores during a session.',
    externalSyncNotLive:   true,
    vendorSyncNotLive:     true,
    realTimePushPending:   true,
  }
}
