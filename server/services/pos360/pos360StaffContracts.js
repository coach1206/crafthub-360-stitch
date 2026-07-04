/**
 * pos360StaffContracts.js — Phase B.12 Prompt Y
 * Enums and validators for POS360 staff roles, labor, governance domain.
 */

export const ROLE_TYPES = ['owner','general_manager','manager','host','server','bartender','kitchen','humidor_specialist','cashier','event_coordinator','inventory_manager','auditor','limited_staff','custom']
export const PERMISSION_GROUPS = ['orders','payments','refunds','voids','tips','cash_drawer','closeout','reservations','waitlist','tables','private_events','event_packages','loyalty','inventory','eat','smokecraft','staff','reports','admin','audit']
export const PROTECTED_MANAGER_ACTIONS = ['points_adjustment','reward_reversal','overbooking','blocked_table_assignment','waitlist_priority_override','private_event_approval','package_discount','custom_package','deposit_waiver','deposit_refund','minimum_spend_override','signed_contract_change','refund_request','void_request','tip_adjustment','cash_drawer_adjustment','cash_drawer_over_short_review','closeout_approval','comp_payment','house_account_payment','permission_override','time_clock_correction','schedule_publish','payroll_export_placeholder']
export const ASSIGNMENT_TYPES = ['section','table','reservation','waitlist','private_event','order','payment','cash_drawer','closeout','humidor','bar','kitchen','patio','smokecraft','other']
export const ASSIGNMENT_STATUSES = ['assigned','active','completed','cancelled','transferred']
export const SHIFT_STATUSES = ['draft','scheduled','published_placeholder','acknowledged_external','clocked_in','clocked_out','missed','cancelled']
export const PUBLISH_STATUSES = ['draft','ready_to_publish','published_placeholder','notification_not_connected']
export const AVAILABILITY_PREFERENCES = ['preferred','available','unavailable']
export const TIME_OFF_TYPES = ['vacation','sick','personal','unavailable','other']
export const TIME_OFF_STATUSES = ['pending','approved','denied','cancelled']
export const PUNCH_TYPES = ['clock_in','clock_out','break_start','break_end','missed_punch_placeholder','offline_punch']
export const PUNCH_SOURCES = ['staff','manager','offline','imported','external']
export const PUNCH_STATUSES = ['recorded','pending_review','corrected','rejected','unavailable']
export const CORRECTION_TYPES = ['missed_clock_in','missed_clock_out','break_adjustment','time_adjustment','duplicate_punch','other']
export const CORRECTION_STATUSES = ['pending_manager_approval','approved','rejected','cancelled']
export const LABOR_COST_SOURCES = ['none','manual','imported','external_payroll']
export const LABOR_SUMMARY_STATUSES = ['draft','calculated_placeholder','reviewed','locked']
export const RISK_TYPES = ['excessive_refunds','excessive_voids','large_tip_pattern','drawer_over_short_pattern','missed_punch_pattern','schedule_gap','overtime_risk','permission_override_pattern','manager_override_pattern','other']
export const LABOR_INSIGHT_TYPES = ['coverage_gap','overtime_risk','labor_to_sales_placeholder','tip_performance','table_turn_performance','refund_void_pattern','private_event_staffing_demand','training_need','schedule_efficiency','payroll_export_placeholder']
export const PAYROLL_PROVIDERS = ['gusto','adp','paychex','quickbooks','square_payroll','toast_payroll','manual_external','other']
export const PROVIDER_STATUSES = ['not_connected','configured_placeholder','connected_external','disabled','error']

export const isValidRoleType = v => ROLE_TYPES.includes(v)
export const isValidPermissionGroup = v => PERMISSION_GROUPS.includes(v)
export const isValidProtectedManagerAction = v => PROTECTED_MANAGER_ACTIONS.includes(v)
export const isValidAssignmentType = v => ASSIGNMENT_TYPES.includes(v)
export const isValidAssignmentStatus = v => ASSIGNMENT_STATUSES.includes(v)
export const isValidShiftStatus = v => SHIFT_STATUSES.includes(v)
export const isValidPublishStatus = v => PUBLISH_STATUSES.includes(v)
export const isValidAvailabilityPreference = v => AVAILABILITY_PREFERENCES.includes(v)
export const isValidTimeOffType = v => TIME_OFF_TYPES.includes(v)
export const isValidTimeOffStatus = v => TIME_OFF_STATUSES.includes(v)
export const isValidPunchType = v => PUNCH_TYPES.includes(v)
export const isValidPunchSource = v => PUNCH_SOURCES.includes(v)
export const isValidPunchStatus = v => PUNCH_STATUSES.includes(v)
export const isValidCorrectionType = v => CORRECTION_TYPES.includes(v)
export const isValidCorrectionStatus = v => CORRECTION_STATUSES.includes(v)
export const isValidLaborCostSource = v => LABOR_COST_SOURCES.includes(v)
export const isValidLaborSummaryStatus = v => LABOR_SUMMARY_STATUSES.includes(v)
export const isValidRiskType = v => RISK_TYPES.includes(v)
export const isValidLaborInsightType = v => LABOR_INSIGHT_TYPES.includes(v)
export const isValidPayrollProvider = v => PAYROLL_PROVIDERS.includes(v)
export const isValidProviderStatus = v => PROVIDER_STATUSES.includes(v)
