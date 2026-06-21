/**
 * POS 3 Bar Prep Rules — queue-load thresholds used by
 * barQueueService.js / orderReadinessService.js to flag a busy bar.
 */

export const BAR_PREP_RULES = {
  stationId: 'bar_main',
  queueCapacity: 10,
  busyThreshold: 7,
  criticalThreshold: 9,
  avgPrepBufferMinutes: 2,
}

export function getBarPrepRules() { return BAR_PREP_RULES }
