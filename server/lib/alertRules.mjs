/**
 * SmokeCraft Alert Threshold Evaluation — Production Package 5
 *
 * Pure, unit-testable threshold logic for the alerts documented in
 * public/proof/smokecraft-monitoring-backup-recovery-support/alerts-inventory.md
 * No external delivery is performed here — evaluate() returns a decision
 * object; a real deployment would hand a firing alert to a notification
 * adapter (email/Slack/PagerDuty). That adapter is out of scope without a
 * live account and is documented, not faked.
 *
 * Each rule avoids "noisy single-event" alerts by requiring either a
 * minimum sample count or a sustained window before firing.
 */

export const ALERT_DEFINITIONS = Object.freeze({
  app_unavailable: {
    severity: 'sev1', windowSec: 60, minSamples: 3, owner: 'on-call-engineer',
    channel: 'pagerduty-or-equivalent (not wired — no live account)',
  },
  readiness_failing: {
    severity: 'sev2', windowSec: 120, minSamples: 3, owner: 'on-call-engineer',
    channel: 'pagerduty-or-equivalent (not wired — no live account)',
  },
  db_unavailable: {
    severity: 'sev1', windowSec: 30, minSamples: 2, owner: 'on-call-engineer',
    channel: 'pagerduty-or-equivalent (not wired — no live account)',
  },
  migration_mismatch: {
    severity: 'sev2', windowSec: 0, minSamples: 1, owner: 'release-owner',
    channel: 'slack-deploys (not wired — no live account)',
  },
  elevated_5xx_rate: {
    severity: 'sev2', windowSec: 300, minSamples: 20, threshold: 0.05, owner: 'on-call-engineer',
    channel: 'slack-alerts (not wired — no live account)',
  },
  payment_webhook_failures: {
    severity: 'sev1', windowSec: 600, minSamples: 3, owner: 'payments-owner',
    channel: 'pagerduty-or-equivalent (not wired — no live account)',
  },
  duplicate_payment_anomaly: {
    severity: 'sev1', windowSec: 0, minSamples: 1, owner: 'payments-owner',
    channel: 'pagerduty-or-equivalent (not wired — no live account)',
  },
  inventory_oversell_attempt: {
    severity: 'sev1', windowSec: 0, minSamples: 1, owner: 'inventory-owner',
    channel: 'slack-alerts (not wired — no live account)',
  },
  object_storage_unavailable: {
    severity: 'sev1', windowSec: 60, minSamples: 3, owner: 'on-call-engineer',
    channel: 'pagerduty-or-equivalent (not wired — no live account)',
  },
  image_processing_backlog: {
    severity: 'sev3', windowSec: 900, minSamples: 1, threshold: 50, owner: 'media-owner',
    channel: 'slack-alerts (not wired — no live account)',
  },
  background_job_failure: {
    severity: 'sev2', windowSec: 0, minSamples: 2, owner: 'on-call-engineer',
    channel: 'slack-alerts (not wired — no live account)',
  },
  backup_failure: {
    severity: 'sev1', windowSec: 0, minSamples: 1, owner: 'db-owner',
    channel: 'pagerduty-or-equivalent (not wired — no live account)',
  },
  restore_verification_failure: {
    severity: 'sev1', windowSec: 0, minSamples: 1, owner: 'db-owner',
    channel: 'pagerduty-or-equivalent (not wired — no live account)',
  },
  disk_memory_pressure: {
    severity: 'sev2', windowSec: 300, minSamples: 3, threshold: 0.85, owner: 'on-call-engineer',
    channel: 'slack-alerts (not wired — no live account)',
  },
  abnormal_rate_limit_activity: {
    severity: 'sev3', windowSec: 300, minSamples: 25, owner: 'security-owner',
    channel: 'slack-alerts (not wired — no live account)',
  },
  golden_box_lifecycle_failure: {
    severity: 'sev3', windowSec: 600, minSamples: 3, owner: 'gameplay-owner',
    channel: 'slack-alerts (not wired — no live account)',
  },
  passport_claim_failure_spike: {
    severity: 'sev2', windowSec: 600, minSamples: 10, threshold: 0.10, owner: 'gameplay-owner',
    channel: 'slack-alerts (not wired — no live account)',
  },
})

/**
 * Evaluates a rule against a set of recent samples.
 * @param {string} ruleName - key into ALERT_DEFINITIONS
 * @param {object} input - { count, windowSec, errorRate, value, nowMs, sampleTimestampsMs }
 * @returns {{ fires: boolean, reason: string, severity: string, owner: string, channel: string }}
 */
export function evaluate(ruleName, input = {}) {
  const def = ALERT_DEFINITIONS[ruleName]
  if (!def) throw new Error(`Unknown alert rule: ${ruleName}`)

  const base = { severity: def.severity, owner: def.owner, channel: def.channel }

  // Windowed sample-count rules (e.g. app_unavailable: N failed health
  // checks within windowSec)
  if (Array.isArray(input.sampleTimestampsMs)) {
    const now = input.nowMs ?? Date.now()
    const windowStart = now - def.windowSec * 1000
    const inWindow = input.sampleTimestampsMs.filter((t) => t >= windowStart && t <= now)
    const fires = inWindow.length >= def.minSamples
    return {
      ...base,
      fires,
      reason: fires
        ? `${inWindow.length} events in ${def.windowSec}s window >= threshold ${def.minSamples}`
        : `${inWindow.length} events in ${def.windowSec}s window < threshold ${def.minSamples}`,
    }
  }

  // Rate-based rules (e.g. elevated_5xx_rate, passport_claim_failure_spike)
  if (typeof input.errorRate === 'number' && typeof def.threshold === 'number') {
    const enoughSamples = (input.count ?? 0) >= def.minSamples
    const overThreshold = input.errorRate >= def.threshold
    const fires = enoughSamples && overThreshold
    return {
      ...base,
      fires,
      reason: !enoughSamples
        ? `only ${input.count ?? 0} samples, need >= ${def.minSamples}`
        : `errorRate ${input.errorRate} ${overThreshold ? '>=' : '<'} threshold ${def.threshold}`,
    }
  }

  // Gauge-threshold rules (e.g. disk_memory_pressure, image_processing_backlog)
  if (typeof input.value === 'number' && typeof def.threshold === 'number') {
    const fires = input.value >= def.threshold
    return {
      ...base,
      fires,
      reason: `value ${input.value} ${fires ? '>=' : '<'} threshold ${def.threshold}`,
    }
  }

  // Simple count rules (e.g. duplicate_payment_anomaly: >=1 event fires)
  if (typeof input.count === 'number') {
    const fires = input.count >= def.minSamples
    return {
      ...base,
      fires,
      reason: `count ${input.count} ${fires ? '>=' : '<'} minSamples ${def.minSamples}`,
    }
  }

  return { ...base, fires: false, reason: 'insufficient input to evaluate' }
}

export default { ALERT_DEFINITIONS, evaluate }
