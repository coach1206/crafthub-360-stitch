/**
 * POS360 Provider Health Service
 * Normalizes provider errors, manages rate-limit status, retry planning.
 * Customer never sees raw provider errors.
 */
import { getProviderReadiness } from '../config/posProviderConfig.js'

const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 2000, 4000]

export async function getProviderHealth(providerName) {
  const readiness = getProviderReadiness(providerName)
  return {
    ok: true,
    providerName,
    status: readiness.readinessStatus === 'ready' ? 'connected_pending_sync' : 'provider_not_connected',
    readinessStatus: readiness.readinessStatus,
    lastChecked: new Date().toISOString(),
    message: readiness.readinessStatus === 'ready'
      ? `${providerName} credentials present. Connection not verified — OAuth required.`
      : `${providerName} is not connected: ${readiness.readinessStatus}`,
  }
}

export async function getRateLimitStatus(providerName) {
  return {
    providerName,
    rateLimited: false,
    status: 'rate_limit_unknown',
    message: `No live connection to ${providerName}. Rate limit status unavailable.`,
  }
}

export function normalizeProviderError(providerName, error) {
  const raw = error?.message ?? String(error)
  const status = raw.includes('429') ? 'rate_limited'
    : raw.includes('401') || raw.includes('403') ? 'credentials_missing'
    : raw.includes('404') ? 'provider_error'
    : 'provider_error'

  return {
    providerName,
    status,
    safeMessage: `${providerName} returned an error. Contact support if this persists.`,
    retryable: status === 'rate_limited' || raw.includes('5'),
  }
}

export function shouldRetryProviderCall(providerName, error) {
  const normalized = normalizeProviderError(providerName, error)
  if (!normalized.retryable) return false
  if (normalized.status === 'provider_not_connected') return false
  return true
}

export function getRetryPlan(providerName, error) {
  const normalized = normalizeProviderError(providerName, error)
  const should = shouldRetryProviderCall(providerName, error)
  return {
    providerName,
    shouldRetry: should,
    maxRetries: MAX_RETRIES,
    retryDelayMs: RETRY_DELAYS,
    errorStatus: normalized.status,
    reason: should ? 'Transient error — retry after delay.' : 'Non-retryable error or provider not connected.',
  }
}
