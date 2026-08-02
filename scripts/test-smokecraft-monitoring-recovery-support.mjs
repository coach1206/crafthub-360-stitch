#!/usr/bin/env node
/**
 * SmokeCraft Monitoring/Recovery/Support Unit Tests — Production Package 5 (§27)
 *
 * Follows this repo's existing convention (plain .mjs assertion scripts,
 * not a test framework) — see scripts/validateSmokecraft*.mjs. Exits
 * non-zero on any failure.
 */
import assert from 'assert'
import { scrubObject, scrubString, newCorrelationId, logEvent, SEVERITY, EVENT_TYPE } from '../server/lib/structuredLogger.mjs'
import { evaluate, ALERT_DEFINITIONS } from '../server/lib/alertRules.mjs'
import { incrCounter, setGauge, recordDuration, snapshot, _resetMetrics, METRIC } from '../server/lib/metrics.mjs'

let passed = 0
function t(name, fn) {
  try {
    fn()
    console.log(`PASS: ${name}`)
    passed++
  } catch (err) {
    console.error(`FAIL: ${name}`)
    console.error(`      ${err.message}`)
    process.exitCode = 1
  }
}

// ── Secret scrubbing ─────────────────────────────────────────
// Fake key fixtures are assembled from parts at runtime (never a literal
// Stripe-shaped string in source) so this test file itself can never trip
// secret-scanning tools while still exercising the real scrubbing regex.
const FAKE_LIVE_KEY = ['sk', 'live', '51ABCDEFGHIJKLMNOP123456'].join('_')
const FAKE_WEBHOOK_SECRET = ['whsec', 'abcdefghijklmnopqrstuvwx12345'].join('_')

t('scrubs Stripe secret key', () => {
  const out = scrubString(`key=${FAKE_LIVE_KEY}`)
  assert(!out.includes(FAKE_LIVE_KEY))
  assert(out.includes('[redacted]'))
})

t('scrubs Stripe webhook secret', () => {
  const out = scrubString(FAKE_WEBHOOK_SECRET)
  assert(out === '[redacted]')
})

t('scrubs JWT-shaped token', () => {
  const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U'
  const out = scrubString(`Authorization: Bearer ${jwt}`)
  assert(!out.includes(jwt))
})

t('scrubs password field regardless of key casing', () => {
  const out = scrubObject({ Password: 'hunter2', ok: true })
  assert.strictEqual(out.Password, '[redacted]')
  assert.strictEqual(out.ok, true)
})

t('scrubs nested DB connection string with credentials', () => {
  const out = scrubObject({ config: { databaseUrl: 'postgres://user:pw@host:5432/db' } })
  assert(!JSON.stringify(out).includes('user:pw'))
})

t('does NOT scrub allowlisted operational IDs', () => {
  const out = scrubObject({ venue_id: 'venue-42', order_id: 'order-99', actor_id: 'staff-1' })
  assert.strictEqual(out.venue_id, 'venue-42')
  assert.strictEqual(out.order_id, 'order-99')
  assert.strictEqual(out.actor_id, 'staff-1')
})

// ── Correlation IDs ───────────────────────────────────────────
t('correlation IDs are unique and prefixed', () => {
  const a = newCorrelationId()
  const b = newCorrelationId()
  assert.notStrictEqual(a, b)
  assert(a.startsWith('corr_'))
})

// ── Structured log format ─────────────────────────────────────
t('logEvent emits required structured fields', () => {
  const line = logEvent(SEVERITY.INFO, EVENT_TYPE.STARTUP, { route: '/x', correlation_id: 'corr_1', venue_id: 'v1' })
  assert(line.timestamp && !Number.isNaN(Date.parse(line.timestamp)))
  assert.strictEqual(line.service, 'smokecraft-360')
  assert.strictEqual(line.severity, 'info')
  assert.strictEqual(line.event_type, 'startup')
  assert.strictEqual(line.venue_id, 'v1')
})

t('logEvent scrubs secrets even when logging a caught error message', () => {
  const line = logEvent(SEVERITY.ERROR, EVENT_TYPE.DB_FAILURE, {
    message: 'connect failed for postgres://user:secretpw@host/db',
  })
  assert(!JSON.stringify(line).includes('secretpw'))
})

// ── Alert threshold evaluation ─────────────────────────────────
t('app_unavailable does not fire below minSamples in window', () => {
  const now = Date.now()
  const r = evaluate('app_unavailable', { sampleTimestampsMs: [now - 1000], nowMs: now })
  assert.strictEqual(r.fires, false)
})

t('app_unavailable fires at minSamples within window', () => {
  const now = Date.now()
  const r = evaluate('app_unavailable', { sampleTimestampsMs: [now - 1000, now - 2000, now - 3000], nowMs: now })
  assert.strictEqual(r.fires, true)
  assert.strictEqual(r.severity, 'sev1')
})

t('app_unavailable ignores samples outside the window (no noisy single-event alert)', () => {
  const now = Date.now()
  const r = evaluate('app_unavailable', { sampleTimestampsMs: [now - 999999, now - 999998, now - 999997], nowMs: now })
  assert.strictEqual(r.fires, false)
})

t('elevated_5xx_rate requires both sample count AND rate threshold', () => {
  const notEnoughSamples = evaluate('elevated_5xx_rate', { count: 5, errorRate: 0.9 })
  assert.strictEqual(notEnoughSamples.fires, false)
  const enoughButLowRate = evaluate('elevated_5xx_rate', { count: 25, errorRate: 0.01 })
  assert.strictEqual(enoughButLowRate.fires, false)
  const fires = evaluate('elevated_5xx_rate', { count: 25, errorRate: 0.06 })
  assert.strictEqual(fires.fires, true)
})

t('duplicate_payment_anomaly fires on a single confirmed event (sev1, no dampening)', () => {
  const r = evaluate('duplicate_payment_anomaly', { count: 1 })
  assert.strictEqual(r.fires, true)
  assert.strictEqual(r.severity, 'sev1')
})

t('every alert definition has severity/owner/channel', () => {
  for (const [name, def] of Object.entries(ALERT_DEFINITIONS)) {
    assert(def.severity, `${name} missing severity`)
    assert(def.owner, `${name} missing owner`)
    assert(def.channel, `${name} missing channel`)
  }
})

t('unknown alert rule throws', () => {
  assert.throws(() => evaluate('not_a_real_rule', {}))
})

// ── Metrics emission ─────────────────────────────────────────
t('metrics: counters/gauges/histograms record and snapshot correctly', () => {
  _resetMetrics()
  incrCounter(METRIC.REQUEST_COUNT)
  incrCounter(METRIC.REQUEST_COUNT, 4)
  setGauge(METRIC.DB_POOL_IN_USE, 3)
  recordDuration(METRIC.RESPONSE_TIME_MS, 120)
  recordDuration(METRIC.RESPONSE_TIME_MS, 80)
  const snap = snapshot()
  assert.strictEqual(snap.counters[METRIC.REQUEST_COUNT], 5)
  assert.strictEqual(snap.gauges[METRIC.DB_POOL_IN_USE], 3)
  assert.strictEqual(snap.histograms[METRIC.RESPONSE_TIME_MS].count, 2)
  _resetMetrics()
})

console.log('')
console.log(`${passed} test(s) passed${process.exitCode ? ', SOME FAILED' : ''}`)
if (!process.exitCode) console.log('RESULT: ALL MONITORING/RECOVERY/SUPPORT UNIT TESTS PASSED')
