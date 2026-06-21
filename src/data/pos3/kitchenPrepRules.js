/**
 * POS 3 Kitchen Prep Rules — queue-load thresholds used by
 * kitchenQueueService.js / orderReadinessService.js to flag a busy kitchen.
 */

export const KITCHEN_PREP_RULES = {
  stationId: 'kitchen_main',
  queueCapacity: 12,
  busyThreshold: 8,     // queue length at/above this → "busy" warning
  criticalThreshold: 11, // queue length at/above this → near-capacity block-level warning
  avgPrepBufferMinutes: 5,
}

export function getKitchenPrepRules() { return KITCHEN_PREP_RULES }
