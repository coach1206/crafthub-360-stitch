/**
 * Production Package 7 — Public Status Summary (practical minimum).
 *
 * Deliberately built as a thin, sensitive-field-stripped wrapper around
 * the existing readiness check. Never exposes error rates, DB internals,
 * provider names/credentials, or the admin ops-status payload. Honest
 * degraded state only — never fabricated "operational".
 */
import { getDb, isDbAvailable } from '../db/connection.js'
import { healthCheck as storageHealthCheck } from '../services/venueManagement/objectStorageAdapter.js'

function componentState(ok) {
  return ok ? 'operational' : 'degraded'
}

export async function getPublicStatus(_req, res) {
  let dbOk = false
  try {
    if (isDbAvailable()) {
      await getDb().query('SELECT 1')
      dbOk = true
    }
  } catch {
    dbOk = false
  }

  let storageOk = false
  let storageActivated = false
  try {
    const storage = await storageHealthCheck()
    storageOk = !!storage.ok
    storageActivated = !!storage.activated
  } catch {
    storageOk = false
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY || ''
  const stripeConfigured = stripeKey.startsWith('sk_live_') || stripeKey.startsWith('sk_test_')
  const stripeLive = stripeKey.startsWith('sk_live_')

  res.set('Cache-Control', 'no-store')
  res.json({
    success: true,
    generatedAt: new Date().toISOString(),
    incident: { active: false, description: null },
    maintenance: { active: false, description: null },
    components: {
      smokecraft:            { state: componentState(dbOk) },
      venueHumidor:          { state: componentState(dbOk) },
      checkoutPayments:      { state: dbOk && stripeConfigured ? (stripeLive ? 'operational' : 'operational-test-mode') : 'external_activation_pending' },
      mediaDelivery:         { state: storageActivated ? componentState(storageOk) : 'external_activation_pending' },
      passportRewards:       { state: componentState(dbOk) },
      goldenBox:             { state: componentState(dbOk) },
      pos360:                { state: componentState(dbOk) },
      eat360:                { state: componentState(dbOk) },
    },
    externalMonitoring: {
      activated: false,
      note: 'No live Sentry/uptime-provider account is connected in this environment. This page reflects this server\'s own internal health checks only.',
    },
    internalOpsLink: '/admin/ops-status',
  })
}
