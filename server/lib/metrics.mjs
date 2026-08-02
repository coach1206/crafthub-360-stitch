/**
 * SmokeCraft In-App Metrics Module — Production Package 5
 *
 * Simplest compatible approach: an in-memory counter/gauge/histogram
 * registry exposed at GET /api/health/metrics (see healthRoutes.js), plus
 * helper functions services call to record events. Not a replacement for a
 * managed metrics backend (Prometheus/Datadog) — a deliberate MVP choice
 * documented in the monitoring-architecture proof doc.
 */

const counters = new Map()   // name -> number
const gauges = new Map()     // name -> number
const histograms = new Map() // name -> number[] (durations in ms, capped)

const HISTOGRAM_CAP = 500

export function incrCounter(name, by = 1) {
  counters.set(name, (counters.get(name) || 0) + by)
}

export function setGauge(name, value) {
  gauges.set(name, value)
}

export function recordDuration(name, ms) {
  const arr = histograms.get(name) || []
  arr.push(ms)
  if (arr.length > HISTOGRAM_CAP) arr.shift()
  histograms.set(name, arr)
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0
  const idx = Math.min(sorted.length - 1, Math.floor(p * sorted.length))
  return sorted[idx]
}

export function snapshot() {
  const histSummary = {}
  for (const [name, arr] of histograms.entries()) {
    const sorted = [...arr].sort((a, b) => a - b)
    histSummary[name] = {
      count: sorted.length,
      p50: percentile(sorted, 0.5),
      p95: percentile(sorted, 0.95),
      p99: percentile(sorted, 0.99),
      max: sorted.length ? sorted[sorted.length - 1] : 0,
    }
  }
  return {
    timestamp: new Date().toISOString(),
    counters: Object.fromEntries(counters),
    gauges: Object.fromEntries(gauges),
    histograms: histSummary,
  }
}

/** Test/dev helper — clears all recorded metrics. */
export function _resetMetrics() {
  counters.clear()
  gauges.clear()
  histograms.clear()
}

// Known metric names (Package 5 mandate §5), so callers use consistent keys.
export const METRIC = Object.freeze({
  REQUEST_COUNT: 'http.request.count',
  RESPONSE_TIME_MS: 'http.response.duration_ms',
  ERROR_COUNT: 'http.error.count',
  DB_LATENCY_MS: 'db.query.duration_ms',
  DB_POOL_IN_USE: 'db.pool.in_use',
  STORAGE_FAILURE: 'storage.failure.count',
  IMAGE_PROCESSING_MS: 'media.image_processing.duration_ms',
  PAYMENT_SUCCESS: 'payment.success.count',
  PAYMENT_FAILURE: 'payment.failure.count',
  WEBHOOK_FAILURE: 'webhook.failure.count',
  INVENTORY_HOLD_EXPIRED: 'inventory.hold_expired.count',
  CHECKOUT_ABANDONED: 'checkout.abandoned.count',
  ORDER_FULFILLMENT_MS: 'order.fulfillment.duration_ms',
  PASSPORT_CLAIM_FAILURE: 'passport.claim_failure.count',
  GOLDEN_BOX_SUBMISSION_FAILURE: 'golden_box.submission_failure.count',
  JOB_SUCCESS: 'job.success.count',
  JOB_FAILURE: 'job.failure.count',
  DEPLOYMENT_SUCCESS: 'deployment.success.count',
  DEPLOYMENT_FAILURE: 'deployment.failure.count',
})

export default { incrCounter, setGauge, recordDuration, snapshot, _resetMetrics, METRIC }
