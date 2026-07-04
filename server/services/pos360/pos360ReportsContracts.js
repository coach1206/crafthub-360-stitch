/**
 * pos360ReportsContracts.js — Phase B.13 Prompt Z
 * Enums and validators for POS360 reports, analytics, dashboards, E.A.T. decision layer.
 */

export const REPORT_TYPES = ['executive','daily_operations','closeout','payments','staff','guests','loyalty','inventory','reservations','private_events','event_packages','smokecraft','eat','custom']
export const KPI_GROUPS = ['revenue','payments','closeout','labor','staff','guests','loyalty','reservations','inventory','private_events','smokecraft','eat','risk','custom']
export const THRESHOLD_TYPES = ['warning','critical','goal','floor','ceiling']
export const COMPARISON_OPERATORS = ['gt','gte','lt','lte','eq','neq']
export const SNAPSHOT_STATUSES = ['draft','generated_placeholder','locked','exported_placeholder','unavailable']
export const DASHBOARD_TYPES = ['owner','executive','manager','staff','operations','finance','inventory','guest','event','eat','custom']
export const WIDGET_TYPES = ['kpi_card','trend_chart','table','alert_list','closeout_summary','staff_summary','guest_summary','inventory_summary','event_summary','eat_decision','custom']
export const ALERT_TYPES = ['inventory_low','refund_spike','void_spike','drawer_over_short','labor_overtime','minimum_spend_exposure','deposit_exposure','reservation_no_show','loyalty_risk','service_recovery','staff_risk','custom']
export const ALERT_SEVERITIES = ['info','warning','critical']
export const ALERT_STATUSES = ['open','acknowledged','dismissed','resolved']
export const DECISION_INSIGHT_TYPES = ['operations_recommendation','revenue_recommendation','labor_recommendation','inventory_recommendation','guest_recommendation','event_recommendation','risk_recommendation','custom']
export const DECISION_STATUSES = ['placeholder','pending_review','accepted','rejected','unavailable']
export const EXPORT_TYPES = ['pdf','csv','print_ready','email_ready','external_bi','custom']
export const EXPORT_STATUSES = ['requested','generated_placeholder','ready_placeholder','sent_external','failed_external','unavailable']
export const SCHEDULED_CADENCES = ['daily','weekly','monthly','custom']
export const DELIVERY_CHANNELS = ['none','email_external','print_ready','external_bi','dashboard_only']
export const SCHEDULE_STATUSES = ['draft','active_placeholder','paused','disabled','unavailable']
export const BI_PROVIDERS = ['looker','powerbi','tableau','metabase','google_sheets','manual_external','other']
export const PROVIDER_STATUSES = ['not_connected','configured_placeholder','connected_external','disabled','error']

export const isValidReportType = v => REPORT_TYPES.includes(v)
export const isValidKpiGroup = v => KPI_GROUPS.includes(v)
export const isValidThresholdType = v => THRESHOLD_TYPES.includes(v)
export const isValidComparisonOperator = v => COMPARISON_OPERATORS.includes(v)
export const isValidSnapshotStatus = v => SNAPSHOT_STATUSES.includes(v)
export const isValidDashboardType = v => DASHBOARD_TYPES.includes(v)
export const isValidWidgetType = v => WIDGET_TYPES.includes(v)
export const isValidAlertType = v => ALERT_TYPES.includes(v)
export const isValidAlertSeverity = v => ALERT_SEVERITIES.includes(v)
export const isValidAlertStatus = v => ALERT_STATUSES.includes(v)
export const isValidDecisionInsightType = v => DECISION_INSIGHT_TYPES.includes(v)
export const isValidDecisionStatus = v => DECISION_STATUSES.includes(v)
export const isValidExportType = v => EXPORT_TYPES.includes(v)
export const isValidExportStatus = v => EXPORT_STATUSES.includes(v)
export const isValidScheduledCadence = v => SCHEDULED_CADENCES.includes(v)
export const isValidDeliveryChannel = v => DELIVERY_CHANNELS.includes(v)
export const isValidScheduleStatus = v => SCHEDULE_STATUSES.includes(v)
export const isValidBiProvider = v => BI_PROVIDERS.includes(v)
export const isValidProviderStatus = v => PROVIDER_STATUSES.includes(v)
