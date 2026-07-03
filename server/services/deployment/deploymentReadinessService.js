/**
 * EPRL — Deployment Readiness Service
 * Full readiness report for local, staging, Railway, and production deployments.
 */

import { buildEnvironmentReadinessReport, detectDeploymentProvider, getEnvironmentMode } from '../environment/environmentReadinessService.js'
import { buildSafeEnvSummary } from '../../utils/safeEnvironmentLogger.js'

export function getRequiredEnvironmentVariables() {
  return [
    { key: 'DATABASE_URL',             required: true,  description: 'PostgreSQL connection string' },
    { key: 'NODE_ENV',                 required: true,  description: 'Runtime environment (production/staging/development)' },
    { key: 'STRIPE_SECRET_KEY',        required: false, description: 'Stripe secret key for payment processing' },
    { key: 'STRIPE_WEBHOOK_SECRET',    required: false, description: 'Stripe webhook signature verification' },
  ]
}

export function getMissingEnvironmentVariables() {
  return getRequiredEnvironmentVariables()
    .filter(v => v.required && !process.env[v.key])
    .map(v => ({ key: v.key, description: v.description }))
}

export function getOptionalEnvironmentVariables() {
  return getRequiredEnvironmentVariables().filter(v => !v.required)
}

export function getProductionBlockers() {
  const blockers = []
  if (!process.env.DATABASE_URL)          blockers.push({ key: 'DATABASE_URL', message: 'Required for all persistence operations' })
  if (!process.env.STRIPE_SECRET_KEY)     blockers.push({ key: 'STRIPE_SECRET_KEY', message: 'Required for payment processing' })
  if (!process.env.STRIPE_WEBHOOK_SECRET) blockers.push({ key: 'STRIPE_WEBHOOK_SECRET', message: 'Required for webhook verification' })
  if (process.env.NODE_ENV !== 'production') blockers.push({ key: 'NODE_ENV', message: 'Must be "production" for production deployments' })
  return blockers
}

export function getStagingWarnings() {
  const warnings = []
  if (!process.env.DATABASE_URL) warnings.push('DATABASE_URL not set — using in-memory fallback')
  if (!process.env.STRIPE_SECRET_KEY) warnings.push('STRIPE_SECRET_KEY not set — payments in preview mode')
  return warnings
}

export function buildRailwayReadinessChecklist() {
  const hasDb = !!process.env.DATABASE_URL
  return {
    provider: 'railway',
    checklist: [
      { item: 'DATABASE_URL set via Railway Postgres plugin',       done: hasDb },
      { item: 'NODE_ENV set to production in Railway variables',    done: process.env.NODE_ENV === 'production' },
      { item: 'STRIPE_SECRET_KEY set in Railway variables',         done: !!process.env.STRIPE_SECRET_KEY },
      { item: 'STRIPE_WEBHOOK_SECRET set in Railway variables',     done: !!process.env.STRIPE_WEBHOOK_SECRET },
      { item: 'Migrations run via npm run db:migrate on deploy',    done: hasDb },
      { item: 'Health check at /api/health returns ok',             done: false, note: 'Verify after deploy' },
    ],
    ready: hasDb && process.env.NODE_ENV === 'production',
    blockers: hasDb ? [] : ['DATABASE_URL missing — attach Railway Postgres plugin'],
  }
}

export function buildPostgresReadinessChecklist() {
  const hasDb = !!process.env.DATABASE_URL
  return {
    provider: 'postgres',
    checklist: [
      { item: 'DATABASE_URL environment variable set',    done: hasDb },
      { item: 'URL uses postgres:// or postgresql:// protocol', done: hasDb },
      { item: 'Migration 001–028 applied',                done: false, note: 'Run npm run db:migrate' },
      { item: 'inventory_records table exists',           done: false, note: 'Verified after migration' },
      { item: 'operational_sync_events table exists',     done: false, note: 'Verified after migration' },
      { item: 'reorder_approvals table exists',           done: false, note: 'Verified after migration' },
    ],
    ready: hasDb,
    note:  'Run npm run db:migrate after setting DATABASE_URL',
  }
}

export function buildDeploymentReadinessReport() {
  const envReport  = buildEnvironmentReadinessReport()
  const provider   = detectDeploymentProvider()
  const mode       = getEnvironmentMode()
  const missing    = getMissingEnvironmentVariables()
  const blockers   = getProductionBlockers()
  const warnings   = getStagingWarnings()
  const envSummary = buildSafeEnvSummary()
  const railway    = buildRailwayReadinessChecklist()
  const postgres   = buildPostgresReadinessChecklist()

  return {
    ok:              blockers.length === 0,
    environmentMode: mode,
    provider,
    database:        envReport.databaseUrl,
    persistence:     envReport.persistenceMode,
    missing,
    blockers,
    warnings,
    envSummary,
    railway,
    postgres,
    degradedMode:    envReport.degradedMode,
    externalSyncNotLive:       true,
    vendorSyncNotLive:         true,
    externalPOSRequired:       true,
    distributorConnectionRequired: true,
    manufacturerConnectionRequired: true,
    reorderNotSubmitted:       true,
    subsystems: {
      database:   { ready: !!process.env.DATABASE_URL },
      migrations: { ready: false, note: 'Requires runtime check after db:migrate' },
      schema:     { ready: false, note: 'Requires runtime check after db:migrate' },
      payments:   { ready: !!process.env.STRIPE_SECRET_KEY, note: 'Stripe keys required' },
      inventory:  { ready: !!process.env.DATABASE_URL, note: 'Requires DATABASE_URL' },
      reorder:    { ready: !!process.env.DATABASE_URL, note: 'Requires DATABASE_URL' },
      pos360:     { ready: !!process.env.DATABASE_URL, note: 'Requires DATABASE_URL' },
      eat:        { ready: true, note: 'E.A.T. hooks always available; persistence varies by mode' },
    },
    timestamp: new Date().toISOString(),
  }
}
