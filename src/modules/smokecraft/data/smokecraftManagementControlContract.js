/**
 * SmokeCraft Management Control Contract
 * Defines allowed/blocked control actions and result shape.
 */

export const ALLOWED_CONTROL_ACTIONS = [
  'view_integration_status',
  'view_pos360_status',
  'view_eat_status',
  'view_persistence_status',
  'view_fallback_mode',
  'view_reward_policy_status',
  'view_staff_queue_health',
  'view_active_session_health',
  'view_module_health',
  'pause_order_requests',
  'resume_order_requests',
  'mark_menu_fallback_active',
  'clear_demo_data',
  'refresh_analytics',
  'inspect_audit_trail',
]

export const PROTECTED_CONTROL_ACTIONS = [
  'force_passport_unlock',
  'force_connections_unlock',
  'force_pos_synced',
  'force_eat_synced',
  'force_reward_redeemed',
  'force_billing_active',
  'force_license_enforced',
  'bypass_reward_policy',
  'bypass_journey_progression',
]

export const MANAGEMENT_CONTROL_CONTRACT_VERSION = '0.1.0'

export function createControlResult(overrides = {}) {
  return {
    controlResultId:  `ctrl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    action:           null,
    allowed:          false,
    blockedReason:    null,
    actorId:          null,
    actorRole:        null,
    result:           null,
    executedAt:       new Date().toISOString(),
    ...overrides,
  }
}
