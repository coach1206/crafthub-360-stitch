/**
 * pos360ReportsAnalyticsDecisionService.js — Phase B.13 Prompt Z
 * POS360 Reports, Analytics, Daily Closeout Intelligence, Executive Dashboards,
 * SmokeCraft Engagement Reports & E.A.T. Decision Layer service.
 *
 * Falls back gracefully when no database connection is configured.
 * Never prints or logs the database connection string.
 */

import { isDbAvailable, query } from '../../db/connection.js'

const AREA = 'pos360-reports-analytics-decision'

const LOCAL = (extra = {}) => ({
  ok: false,
  localPreview: true,
  error: 'database_not_configured',
  area: AREA,
  ...extra,
})

async function auditRecord({ venueId, actorUserId, action, entityType, entityId, beforeSnapshot, afterSnapshot, reason, exposesPrivateData = true, exposesFinancialData = true, containsAiGeneratedContent = false }) {
  if (!isDbAvailable()) return
  await query(
    `INSERT INTO pos360_report_audit
      (venue_id, actor_user_id, action, entity_type, entity_id, before_snapshot, after_snapshot, reason,
       contains_secrets, exposes_private_data, exposes_financial_data, contains_ai_generated_content)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,FALSE,$9,$10,$11)`,
    [venueId, actorUserId, action, entityType, entityId,
     beforeSnapshot ? JSON.stringify(beforeSnapshot) : null,
     afterSnapshot ? JSON.stringify(afterSnapshot) : null,
     reason || null, exposesPrivateData, exposesFinancialData, containsAiGeneratedContent]
  )
}

// ── Report definitions ────────────────────────────────────────────────────────

export async function createReportDefinition({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotencyKey_required' }
  if (!isDbAvailable()) return LOCAL()
  const existing = await query(
    `SELECT id FROM pos360_report_definitions WHERE idempotency_key=$1 AND (venue_id=$2 OR venue_id IS NULL) LIMIT 1`,
    [idempotencyKey, venueId]
  )
  if (existing.rows.length) return { ok: true, duplicate: true, reportDefinitionId: existing.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_report_definitions (venue_id,report_key,report_name,report_type,description,default_sections,active,system_defined,metadata,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
    [venueId, payload.reportKey, payload.reportName, payload.reportType, payload.description || null,
     payload.defaultSections ? JSON.stringify(payload.defaultSections) : null,
     payload.active !== false, payload.systemDefined || false,
     payload.metadata ? JSON.stringify(payload.metadata) : null, actorUserId || null]
  )
  const id = r.rows[0].id
  await auditRecord({ venueId, actorUserId, action: 'create_report_definition', entityType: 'report_definition', entityId: id, afterSnapshot: payload, exposesFinancialData: false, exposesPrivateData: false })
  return { ok: true, reportDefinitionId: id }
}

export async function listReportDefinitions({ venueId, filters = {} }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!isDbAvailable()) return LOCAL({ definitions: [] })
  const r = await query(
    `SELECT * FROM pos360_report_definitions WHERE (venue_id=$1 OR venue_id IS NULL) ORDER BY report_name`,
    [venueId]
  )
  return { ok: true, definitions: r.rows }
}

export async function createKpiDefinition({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotencyKey_required' }
  if (!isDbAvailable()) return LOCAL()
  const r = await query(
    `INSERT INTO pos360_report_kpi_definitions (venue_id,kpi_key,kpi_name,kpi_group,calculation_source,calculation_description,requires_real_data,active,metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [venueId, payload.kpiKey, payload.kpiName, payload.kpiGroup,
     payload.calculationSource || null, payload.calculationDescription || null,
     payload.requiresRealData !== false, payload.active !== false,
     payload.metadata ? JSON.stringify(payload.metadata) : null]
  )
  const id = r.rows[0].id
  await auditRecord({ venueId, actorUserId, action: 'create_kpi_definition', entityType: 'kpi_definition', entityId: id, afterSnapshot: payload, exposesFinancialData: false, exposesPrivateData: false })
  return { ok: true, kpiDefinitionId: id }
}

export async function listKpiDefinitions({ venueId, filters = {} }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!isDbAvailable()) return LOCAL({ kpiDefinitions: [] })
  const r = await query(
    `SELECT * FROM pos360_report_kpi_definitions WHERE (venue_id=$1 OR venue_id IS NULL) ORDER BY kpi_name`,
    [venueId]
  )
  return { ok: true, kpiDefinitions: r.rows }
}

export async function createKpiThreshold({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotencyKey_required' }
  if (!isDbAvailable()) return LOCAL()
  const existing = await query(
    `SELECT id FROM pos360_report_kpi_thresholds WHERE idempotency_key=$1 AND venue_id=$2 LIMIT 1`,
    [idempotencyKey, venueId]
  )
  if (existing.rows.length) return { ok: true, duplicate: true, thresholdId: existing.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_report_kpi_thresholds (venue_id,kpi_key,threshold_type,threshold_value,comparison_operator,active,manager_configured_by,idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [venueId, payload.kpiKey, payload.thresholdType, payload.thresholdValue,
     payload.comparisonOperator, payload.active !== false, actorUserId || null, idempotencyKey]
  )
  const id = r.rows[0].id
  await auditRecord({ venueId, actorUserId, action: 'create_kpi_threshold', entityType: 'kpi_threshold', entityId: id, afterSnapshot: payload, exposesFinancialData: false, exposesPrivateData: false })
  return { ok: true, thresholdId: id }
}

export async function listKpiThresholds({ venueId, filters = {} }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!isDbAvailable()) return LOCAL({ thresholds: [] })
  const r = await query(`SELECT * FROM pos360_report_kpi_thresholds WHERE venue_id=$1 ORDER BY kpi_key`, [venueId])
  return { ok: true, thresholds: r.rows }
}

export async function updateKpiThreshold({ venueId, thresholdId, payload, actorUserId }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!isDbAvailable()) return LOCAL()
  const before = await query(`SELECT * FROM pos360_report_kpi_thresholds WHERE id=$1 AND venue_id=$2 LIMIT 1`, [thresholdId, venueId])
  if (!before.rows.length) return { ok: false, error: 'not_found' }
  await query(
    `UPDATE pos360_report_kpi_thresholds SET threshold_value=$1, active=$2, updated_at=NOW() WHERE id=$3 AND venue_id=$4`,
    [payload.thresholdValue ?? before.rows[0].threshold_value, payload.active ?? before.rows[0].active, thresholdId, venueId]
  )
  await auditRecord({ venueId, actorUserId, action: 'update_kpi_threshold', entityType: 'kpi_threshold', entityId: thresholdId, beforeSnapshot: before.rows[0], afterSnapshot: payload, exposesFinancialData: false, exposesPrivateData: false })
  return { ok: true, thresholdId }
}

// ── Report snapshots ──────────────────────────────────────────────────────────

export async function createReportSnapshotPlaceholder({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotencyKey_required' }
  if (!isDbAvailable()) return LOCAL()
  // Report snapshots do not claim real data exists unless caller explicitly passes generatedFromRealData: true
  const existing = await query(
    `SELECT id FROM pos360_report_snapshots WHERE idempotency_key=$1 AND venue_id=$2 LIMIT 1`,
    [idempotencyKey, venueId]
  )
  if (existing.rows.length) return { ok: true, duplicate: true, reportSnapshotId: existing.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_report_snapshots
      (venue_id,report_definition_id,report_type,report_name,report_date,date_range_start,date_range_end,
       snapshot_status,generated_from_real_data,contains_estimates,snapshot_payload,created_by,idempotency_key,
       exposes_private_data,exposes_financial_data)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'generated_placeholder',$8,$9,$10,$11,$12,$13,$14) RETURNING id`,
    [venueId, payload.reportDefinitionId || null, payload.reportType, payload.reportName,
     payload.reportDate || null, payload.dateRangeStart || null, payload.dateRangeEnd || null,
     payload.generatedFromRealData || false, payload.containsEstimates || false,
     payload.snapshotPayload ? JSON.stringify(payload.snapshotPayload) : null,
     actorUserId || null, idempotencyKey,
     payload.exposesPrivateData !== false, payload.exposesFinancialData !== false]
  )
  const id = r.rows[0].id
  await auditRecord({ venueId, actorUserId, action: 'create_report_snapshot_placeholder', entityType: 'report_snapshot', entityId: id, afterSnapshot: { reportType: payload.reportType, generatedFromRealData: false } })
  return { ok: true, reportSnapshotId: id, honestNote: 'Report snapshot is a placeholder. No real data has been calculated.' }
}

export async function getReportSnapshot({ venueId, reportSnapshotId }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!isDbAvailable()) return LOCAL({ snapshot: null })
  const r = await query(`SELECT * FROM pos360_report_snapshots WHERE id=$1 AND venue_id=$2 LIMIT 1`, [reportSnapshotId, venueId])
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  return { ok: true, snapshot: r.rows[0] }
}

export async function listReportSnapshots({ venueId, filters = {} }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!isDbAvailable()) return LOCAL({ snapshots: [] })
  const r = await query(`SELECT * FROM pos360_report_snapshots WHERE venue_id=$1 ORDER BY created_at DESC`, [venueId])
  return { ok: true, snapshots: r.rows }
}

export async function lockReportSnapshot({ venueId, reportSnapshotId, actorUserId, reason, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotencyKey_required' }
  if (!isDbAvailable()) return LOCAL()
  const before = await query(`SELECT * FROM pos360_report_snapshots WHERE id=$1 AND venue_id=$2 LIMIT 1`, [reportSnapshotId, venueId])
  if (!before.rows.length) return { ok: false, error: 'not_found' }
  if (before.rows[0].snapshot_status === 'locked') return { ok: false, error: 'already_locked' }
  await query(
    `UPDATE pos360_report_snapshots SET snapshot_status='locked', locked_by=$1, locked_at=NOW(), updated_at=NOW() WHERE id=$2 AND venue_id=$3`,
    [actorUserId || null, reportSnapshotId, venueId]
  )
  await auditRecord({ venueId, actorUserId, action: 'lock_report_snapshot', entityType: 'report_snapshot', entityId: reportSnapshotId, beforeSnapshot: { status: before.rows[0].snapshot_status }, afterSnapshot: { status: 'locked' } })
  return { ok: true, reportSnapshotId, locked: true }
}

export async function createReportSnapshotSection({ venueId, reportSnapshotId, payload, actorUserId, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotencyKey_required' }
  if (!isDbAvailable()) return LOCAL()
  const existing = await query(
    `SELECT id FROM pos360_report_snapshot_sections WHERE idempotency_key=$1 AND venue_id=$2 LIMIT 1`,
    [idempotencyKey, venueId]
  )
  if (existing.rows.length) return { ok: true, duplicate: true, sectionId: existing.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_report_snapshot_sections (venue_id,report_snapshot_id,section_key,section_title,section_payload,display_order,idempotency_key,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [venueId, reportSnapshotId, payload.sectionKey, payload.sectionTitle || null,
     payload.sectionPayload ? JSON.stringify(payload.sectionPayload) : null,
     payload.displayOrder || 0, idempotencyKey, actorUserId || null]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_snapshot_section', entityType: 'report_snapshot_section', entityId: r.rows[0].id, afterSnapshot: payload })
  return { ok: true, sectionId: r.rows[0].id }
}

// ── Dashboards ────────────────────────────────────────────────────────────────

export async function createDashboardProfile({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotencyKey_required' }
  if (!isDbAvailable()) return LOCAL()
  const existing = await query(
    `SELECT id FROM pos360_dashboard_profiles WHERE idempotency_key=$1 AND venue_id=$2 LIMIT 1`,
    [idempotencyKey, venueId]
  )
  if (existing.rows.length) return { ok: true, duplicate: true, dashboardProfileId: existing.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_dashboard_profiles (venue_id,dashboard_name,dashboard_type,layout_payload,active,created_by,idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [venueId, payload.dashboardName, payload.dashboardType,
     payload.layoutPayload ? JSON.stringify(payload.layoutPayload) : null,
     payload.active !== false, actorUserId || null, idempotencyKey]
  )
  const id = r.rows[0].id
  await auditRecord({ venueId, actorUserId, action: 'create_dashboard_profile', entityType: 'dashboard_profile', entityId: id, afterSnapshot: payload, exposesFinancialData: false, exposesPrivateData: false })
  return { ok: true, dashboardProfileId: id }
}

export async function listDashboardProfiles({ venueId, filters = {} }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!isDbAvailable()) return LOCAL({ profiles: [] })
  const r = await query(`SELECT * FROM pos360_dashboard_profiles WHERE venue_id=$1 AND active=TRUE ORDER BY dashboard_name`, [venueId])
  return { ok: true, profiles: r.rows }
}

export async function createDashboardWidget({ venueId, dashboardProfileId, payload, actorUserId, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotencyKey_required' }
  if (!isDbAvailable()) return LOCAL()
  const existing = await query(
    `SELECT id FROM pos360_dashboard_widgets WHERE idempotency_key=$1 AND venue_id=$2 LIMIT 1`,
    [idempotencyKey, venueId]
  )
  if (existing.rows.length) return { ok: true, duplicate: true, widgetId: existing.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_dashboard_widgets (venue_id,dashboard_profile_id,widget_key,widget_type,widget_title,data_source,requires_real_data,widget_config,display_order,active,idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
    [venueId, dashboardProfileId, payload.widgetKey, payload.widgetType, payload.widgetTitle || null,
     payload.dataSource || null, payload.requiresRealData !== false,
     payload.widgetConfig ? JSON.stringify(payload.widgetConfig) : null,
     payload.displayOrder || 0, payload.active !== false, idempotencyKey]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_dashboard_widget', entityType: 'dashboard_widget', entityId: r.rows[0].id, afterSnapshot: payload, exposesFinancialData: false, exposesPrivateData: false })
  return { ok: true, widgetId: r.rows[0].id }
}

export async function listDashboardWidgets({ venueId, dashboardProfileId }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!isDbAvailable()) return LOCAL({ widgets: [] })
  const r = await query(
    `SELECT * FROM pos360_dashboard_widgets WHERE venue_id=$1 AND dashboard_profile_id=$2 AND active=TRUE ORDER BY display_order`,
    [venueId, dashboardProfileId]
  )
  return { ok: true, widgets: r.rows }
}

export async function recordDashboardViewEvent({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotencyKey_required' }
  if (!isDbAvailable()) return LOCAL()
  const existing = await query(
    `SELECT id FROM pos360_dashboard_view_events WHERE idempotency_key=$1 AND venue_id=$2 LIMIT 1`,
    [idempotencyKey, venueId]
  )
  if (existing.rows.length) return { ok: true, duplicate: true }
  await query(
    `INSERT INTO pos360_dashboard_view_events (venue_id,dashboard_profile_id,actor_user_id,dashboard_type,view_payload,idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [venueId, payload.dashboardProfileId || null, actorUserId || null, payload.dashboardType || null,
     payload.viewPayload ? JSON.stringify(payload.viewPayload) : null, idempotencyKey]
  )
  return { ok: true }
}

export async function getExecutiveDashboardSummary({ venueId, filters = {} }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!isDbAvailable()) return LOCAL({
    summary: null,
    honestNote: 'Executive dashboard summary is unavailable. Database not configured.',
  })
  // Query only from real data — never fabricate totals
  const snapshots = await query(
    `SELECT COUNT(*) AS total_snapshots FROM pos360_report_snapshots WHERE venue_id=$1`, [venueId]
  )
  const alerts = await query(
    `SELECT COUNT(*) AS open_alerts FROM pos360_alert_events WHERE venue_id=$1 AND alert_status='open'`, [venueId]
  )
  const insights = await query(
    `SELECT COUNT(*) AS pending_insights FROM pos360_eat_decision_insights WHERE venue_id=$1 AND decision_status='pending_review'`, [venueId]
  )
  return {
    ok: true,
    summary: {
      totalSnapshots: parseInt(snapshots.rows[0].total_snapshots),
      openAlerts: parseInt(alerts.rows[0].open_alerts),
      pendingEatInsights: parseInt(insights.rows[0].pending_insights),
    },
    honestNote: 'Revenue, profit, order totals, and payment totals are not shown here. Real data required from POS360 order and payment modules.',
    generatedFromRealData: true,
  }
}

// ── Daily operations / closeout ───────────────────────────────────────────────

export async function createDailyOperationsReportPlaceholder({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotencyKey_required' }
  if (!isDbAvailable()) return LOCAL()
  const existing = await query(
    `SELECT id FROM pos360_daily_operations_reports WHERE idempotency_key=$1 AND venue_id=$2 LIMIT 1`,
    [idempotencyKey, venueId]
  )
  if (existing.rows.length) return { ok: true, duplicate: true, reportId: existing.rows[0].id }
  // All amount fields nullable — no fake totals inserted
  const r = await query(
    `INSERT INTO pos360_daily_operations_reports
      (venue_id,report_date,total_orders_amount,total_payments_amount,total_cash_amount,
       total_card_external_amount,total_tips_amount,total_refunds_amount,total_voids_amount,
       total_comps_amount,total_house_account_amount,labor_minutes,labor_cost_amount,
       reservation_count,waitlist_count,private_event_count,inventory_alert_count,
       generated_from_real_data,honest_state,idempotency_key,exposes_financial_data,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,FALSE,'placeholder',$18,TRUE,$19) RETURNING id`,
    [venueId, payload.reportDate,
     payload.totalOrdersAmount ?? null, payload.totalPaymentsAmount ?? null,
     payload.totalCashAmount ?? null, payload.totalCardExternalAmount ?? null,
     payload.totalTipsAmount ?? null, payload.totalRefundsAmount ?? null,
     payload.totalVoidsAmount ?? null, payload.totalCompsAmount ?? null,
     payload.totalHouseAccountAmount ?? null, payload.laborMinutes ?? null,
     payload.laborCostAmount ?? null, payload.reservationCount ?? null,
     payload.waitlistCount ?? null, payload.privateEventCount ?? null,
     payload.inventoryAlertCount ?? null, idempotencyKey, actorUserId || null]
  )
  const id = r.rows[0].id
  await auditRecord({ venueId, actorUserId, action: 'create_daily_operations_report', entityType: 'daily_operations_report', entityId: id, afterSnapshot: { reportDate: payload.reportDate, generatedFromRealData: false } })
  return {
    ok: true,
    reportId: id,
    honestNote: 'Daily operations report is a placeholder. Revenue, profit, order totals, and payment totals are null until real data is aggregated.',
  }
}

export async function getDailyOperationsReport({ venueId, reportDate }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!isDbAvailable()) return LOCAL({ report: null })
  const r = await query(
    `SELECT * FROM pos360_daily_operations_reports WHERE venue_id=$1 AND report_date=$2 ORDER BY created_at DESC LIMIT 1`,
    [venueId, reportDate]
  )
  if (!r.rows.length) return { ok: true, report: null, honestNote: 'No daily operations report found for this date.' }
  return { ok: true, report: r.rows[0] }
}

export async function listDailyOperationsReports({ venueId, filters = {} }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!isDbAvailable()) return LOCAL({ reports: [] })
  const r = await query(
    `SELECT * FROM pos360_daily_operations_reports WHERE venue_id=$1 ORDER BY report_date DESC`, [venueId]
  )
  return { ok: true, reports: r.rows }
}

export async function createDailyCloseoutReportLink({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotencyKey_required' }
  if (!isDbAvailable()) return LOCAL()
  const existing = await query(
    `SELECT id FROM pos360_daily_closeout_report_links WHERE idempotency_key=$1 AND venue_id=$2 LIMIT 1`,
    [idempotencyKey, venueId]
  )
  if (existing.rows.length) return { ok: true, duplicate: true, linkId: existing.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_daily_closeout_report_links (venue_id,report_snapshot_id,daily_closeout_id,server_closeout_id,shift_closeout_id,cash_drawer_id,report_date,link_payload,idempotency_key,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
    [venueId, payload.reportSnapshotId || null, payload.dailyCloseoutId || null,
     payload.serverCloseoutId || null, payload.shiftCloseoutId || null,
     payload.cashDrawerId || null, payload.reportDate || null,
     payload.linkPayload ? JSON.stringify(payload.linkPayload) : null,
     idempotencyKey, actorUserId || null]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_daily_closeout_link', entityType: 'daily_closeout_report_link', entityId: r.rows[0].id, afterSnapshot: payload })
  return { ok: true, linkId: r.rows[0].id }
}

export async function listDailyCloseoutReportLinks({ venueId, filters = {} }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!isDbAvailable()) return LOCAL({ links: [] })
  const r = await query(`SELECT * FROM pos360_daily_closeout_report_links WHERE venue_id=$1 ORDER BY created_at DESC`, [venueId])
  return { ok: true, links: r.rows }
}

// ── Cross-module report links ─────────────────────────────────────────────────

export async function createStaffPerformanceReportLink({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotencyKey_required' }
  if (!isDbAvailable()) return LOCAL()
  const existing = await query(
    `SELECT id FROM pos360_staff_performance_report_links WHERE idempotency_key=$1 AND venue_id=$2 LIMIT 1`,
    [idempotencyKey, venueId]
  )
  if (existing.rows.length) return { ok: true, duplicate: true, linkId: existing.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_staff_performance_report_links (venue_id,report_snapshot_id,staff_profile_id,date_range_start,date_range_end,link_payload,idempotency_key,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [venueId, payload.reportSnapshotId || null, payload.staffProfileId || null,
     payload.dateRangeStart || null, payload.dateRangeEnd || null,
     payload.linkPayload ? JSON.stringify(payload.linkPayload) : null,
     idempotencyKey, actorUserId || null]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_staff_performance_link', entityType: 'staff_performance_report_link', entityId: r.rows[0].id, afterSnapshot: payload })
  return { ok: true, linkId: r.rows[0].id, honestNote: 'Staff performance data is not fabricated. Real staff records from Phase B.12 required.' }
}

export async function createGuestIntelligenceReportLink({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotencyKey_required' }
  if (!isDbAvailable()) return LOCAL()
  const existing = await query(
    `SELECT id FROM pos360_guest_intelligence_report_links WHERE idempotency_key=$1 AND venue_id=$2 LIMIT 1`,
    [idempotencyKey, venueId]
  )
  if (existing.rows.length) return { ok: true, duplicate: true, linkId: existing.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_guest_intelligence_report_links (venue_id,report_snapshot_id,customer_id,guest_profile_id,date_range_start,date_range_end,link_payload,idempotency_key,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [venueId, payload.reportSnapshotId || null, payload.customerId || null, payload.guestProfileId || null,
     payload.dateRangeStart || null, payload.dateRangeEnd || null,
     payload.linkPayload ? JSON.stringify(payload.linkPayload) : null,
     idempotencyKey, actorUserId || null]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_guest_intelligence_link', entityType: 'guest_intelligence_report_link', entityId: r.rows[0].id, afterSnapshot: payload })
  return { ok: true, linkId: r.rows[0].id, honestNote: 'Guest analytics are not fabricated. Real guest/customer records required.' }
}

export async function createInventoryHealthReportLink({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotencyKey_required' }
  if (!isDbAvailable()) return LOCAL()
  const existing = await query(
    `SELECT id FROM pos360_inventory_health_report_links WHERE idempotency_key=$1 AND venue_id=$2 LIMIT 1`,
    [idempotencyKey, venueId]
  )
  if (existing.rows.length) return { ok: true, duplicate: true, linkId: existing.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_inventory_health_report_links (venue_id,report_snapshot_id,inventory_item_id,vendor_id,date_range_start,date_range_end,link_payload,idempotency_key,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [venueId, payload.reportSnapshotId || null, payload.inventoryItemId || null, payload.vendorId || null,
     payload.dateRangeStart || null, payload.dateRangeEnd || null,
     payload.linkPayload ? JSON.stringify(payload.linkPayload) : null,
     idempotencyKey, actorUserId || null]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_inventory_health_link', entityType: 'inventory_health_report_link', entityId: r.rows[0].id, afterSnapshot: payload })
  return { ok: true, linkId: r.rows[0].id, honestNote: 'Inventory health is not fabricated. Real inventory records required.' }
}

export async function createEventPackageReportLink({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotencyKey_required' }
  if (!isDbAvailable()) return LOCAL()
  const existing = await query(
    `SELECT id FROM pos360_event_package_report_links WHERE idempotency_key=$1 AND venue_id=$2 LIMIT 1`,
    [idempotencyKey, venueId]
  )
  if (existing.rows.length) return { ok: true, duplicate: true, linkId: existing.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_event_package_report_links (venue_id,report_snapshot_id,private_event_id,package_selection_id,reservation_id,waitlist_entry_id,date_range_start,date_range_end,link_payload,idempotency_key,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
    [venueId, payload.reportSnapshotId || null, payload.privateEventId || null,
     payload.packageSelectionId || null, payload.reservationId || null,
     payload.waitlistEntryId || null, payload.dateRangeStart || null,
     payload.dateRangeEnd || null,
     payload.linkPayload ? JSON.stringify(payload.linkPayload) : null,
     idempotencyKey, actorUserId || null]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_event_package_link', entityType: 'event_package_report_link', entityId: r.rows[0].id, afterSnapshot: payload })
  return { ok: true, linkId: r.rows[0].id }
}

export async function createPaymentAnalyticsReportLink({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotencyKey_required' }
  if (!isDbAvailable()) return LOCAL()
  const existing = await query(
    `SELECT id FROM pos360_payment_analytics_report_links WHERE idempotency_key=$1 AND venue_id=$2 LIMIT 1`,
    [idempotencyKey, venueId]
  )
  if (existing.rows.length) return { ok: true, duplicate: true, linkId: existing.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_payment_analytics_report_links (venue_id,report_snapshot_id,payment_record_id,order_id,date_range_start,date_range_end,link_payload,idempotency_key,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [venueId, payload.reportSnapshotId || null, payload.paymentRecordId || null, payload.orderId || null,
     payload.dateRangeStart || null, payload.dateRangeEnd || null,
     payload.linkPayload ? JSON.stringify(payload.linkPayload) : null,
     idempotencyKey, actorUserId || null]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_payment_analytics_link', entityType: 'payment_analytics_report_link', entityId: r.rows[0].id, afterSnapshot: payload })
  return { ok: true, linkId: r.rows[0].id, honestNote: 'Payment totals are not fabricated. Real payment records from Phase B.11 required.' }
}

export async function listCrossModuleReportLinks({ venueId, filters = {} }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!isDbAvailable()) return LOCAL({ links: {} })
  const [staff, guest, inv, evt, pmt] = await Promise.all([
    query(`SELECT COUNT(*) AS cnt FROM pos360_staff_performance_report_links WHERE venue_id=$1`, [venueId]),
    query(`SELECT COUNT(*) AS cnt FROM pos360_guest_intelligence_report_links WHERE venue_id=$1`, [venueId]),
    query(`SELECT COUNT(*) AS cnt FROM pos360_inventory_health_report_links WHERE venue_id=$1`, [venueId]),
    query(`SELECT COUNT(*) AS cnt FROM pos360_event_package_report_links WHERE venue_id=$1`, [venueId]),
    query(`SELECT COUNT(*) AS cnt FROM pos360_payment_analytics_report_links WHERE venue_id=$1`, [venueId]),
  ])
  return {
    ok: true,
    links: {
      staffPerformance: parseInt(staff.rows[0].cnt),
      guestIntelligence: parseInt(guest.rows[0].cnt),
      inventoryHealth: parseInt(inv.rows[0].cnt),
      eventPackage: parseInt(evt.rows[0].cnt),
      paymentAnalytics: parseInt(pmt.rows[0].cnt),
    },
  }
}

// ── Alerts ────────────────────────────────────────────────────────────────────

export async function createAlertRule({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotencyKey_required' }
  if (!isDbAvailable()) return LOCAL()
  const existing = await query(
    `SELECT id FROM pos360_alert_rules WHERE idempotency_key=$1 AND venue_id=$2 LIMIT 1`,
    [idempotencyKey, venueId]
  )
  if (existing.rows.length) return { ok: true, duplicate: true, alertRuleId: existing.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_alert_rules (venue_id,alert_key,alert_name,alert_type,condition_payload,severity,active,manager_configured_by,idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [venueId, payload.alertKey, payload.alertName, payload.alertType,
     payload.conditionPayload ? JSON.stringify(payload.conditionPayload) : null,
     payload.severity || 'info', payload.active !== false, actorUserId || null, idempotencyKey]
  )
  const id = r.rows[0].id
  await auditRecord({ venueId, actorUserId, action: 'create_alert_rule', entityType: 'alert_rule', entityId: id, afterSnapshot: payload, exposesFinancialData: false, exposesPrivateData: false })
  return { ok: true, alertRuleId: id }
}

export async function listAlertRules({ venueId, filters = {} }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!isDbAvailable()) return LOCAL({ rules: [] })
  const r = await query(`SELECT * FROM pos360_alert_rules WHERE venue_id=$1 ORDER BY alert_name`, [venueId])
  return { ok: true, rules: r.rows }
}

export async function updateAlertRule({ venueId, alertRuleId, payload, actorUserId }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!isDbAvailable()) return LOCAL()
  const before = await query(`SELECT * FROM pos360_alert_rules WHERE id=$1 AND venue_id=$2 LIMIT 1`, [alertRuleId, venueId])
  if (!before.rows.length) return { ok: false, error: 'not_found' }
  await query(
    `UPDATE pos360_alert_rules SET active=$1, severity=$2, updated_at=NOW() WHERE id=$3 AND venue_id=$4`,
    [payload.active ?? before.rows[0].active, payload.severity ?? before.rows[0].severity, alertRuleId, venueId]
  )
  await auditRecord({ venueId, actorUserId, action: 'update_alert_rule', entityType: 'alert_rule', entityId: alertRuleId, beforeSnapshot: before.rows[0], afterSnapshot: payload, exposesFinancialData: false, exposesPrivateData: false })
  return { ok: true, alertRuleId }
}

export async function createAlertEvent({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotencyKey_required' }
  if (!isDbAvailable()) return LOCAL()
  const existing = await query(
    `SELECT id FROM pos360_alert_events WHERE idempotency_key=$1 AND venue_id=$2 LIMIT 1`,
    [idempotencyKey, venueId]
  )
  if (existing.rows.length) return { ok: true, duplicate: true, alertEventId: existing.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_alert_events (venue_id,alert_rule_id,alert_type,severity,alert_status,entity_type,entity_id,event_payload,exposes_private_data,exposes_financial_data,idempotency_key)
     VALUES ($1,$2,$3,$4,'open',$5,$6,$7,$8,$9,$10) RETURNING id`,
    [venueId, payload.alertRuleId || null, payload.alertType, payload.severity || 'info',
     payload.entityType || null, payload.entityId || null,
     payload.eventPayload ? JSON.stringify(payload.eventPayload) : null,
     payload.exposesPrivateData !== false, payload.exposesFinancialData !== false, idempotencyKey]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_alert_event', entityType: 'alert_event', entityId: r.rows[0].id, afterSnapshot: payload })
  return { ok: true, alertEventId: r.rows[0].id }
}

export async function listAlertEvents({ venueId, filters = {} }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!isDbAvailable()) return LOCAL({ events: [] })
  const r = await query(
    `SELECT * FROM pos360_alert_events WHERE venue_id=$1 ORDER BY created_at DESC`, [venueId]
  )
  return { ok: true, events: r.rows }
}

export async function acknowledgeAlertEvent({ venueId, alertEventId, actorUserId, reason, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotencyKey_required' }
  if (!isDbAvailable()) return LOCAL()
  await query(
    `UPDATE pos360_alert_events SET alert_status='acknowledged', acknowledged_by=$1, acknowledged_at=NOW(), updated_at=NOW() WHERE id=$2 AND venue_id=$3`,
    [actorUserId || null, alertEventId, venueId]
  )
  await auditRecord({ venueId, actorUserId, action: 'acknowledge_alert_event', entityType: 'alert_event', entityId: alertEventId, afterSnapshot: { status: 'acknowledged', reason } })
  return { ok: true, alertEventId }
}

export async function resolveAlertEvent({ venueId, alertEventId, actorUserId, reason, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotencyKey_required' }
  if (!isDbAvailable()) return LOCAL()
  await query(
    `UPDATE pos360_alert_events SET alert_status='resolved', resolved_by=$1, resolved_at=NOW(), updated_at=NOW() WHERE id=$2 AND venue_id=$3`,
    [actorUserId || null, alertEventId, venueId]
  )
  await auditRecord({ venueId, actorUserId, action: 'resolve_alert_event', entityType: 'alert_event', entityId: alertEventId, afterSnapshot: { status: 'resolved', reason } })
  return { ok: true, alertEventId }
}

// ── E.A.T. Decision Layer ─────────────────────────────────────────────────────

export async function createEatDecisionInsightPlaceholder({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotencyKey_required' }
  if (!isDbAvailable()) return LOCAL()
  const existing = await query(
    `SELECT id FROM pos360_eat_decision_insights WHERE idempotency_key=$1 AND venue_id=$2 LIMIT 1`,
    [idempotencyKey, venueId]
  )
  if (existing.rows.length) return { ok: true, duplicate: true, insightId: existing.rows[0].id }
  // E.A.T. AI insight is NOT generated — contains_ai_generated_content stays FALSE
  const r = await query(
    `INSERT INTO pos360_eat_decision_insights
      (venue_id,insight_type,insight_title,insight_payload,recommended_action_payload,
       decision_status,contains_ai_generated_content,source,honest_state,
       exposes_private_data,exposes_financial_data,idempotency_key)
     VALUES ($1,$2,$3,$4,$5,'placeholder',FALSE,$6,'placeholder',$7,$8,$9) RETURNING id`,
    [venueId, payload.insightType, payload.insightTitle,
     payload.insightPayload ? JSON.stringify(payload.insightPayload) : null,
     payload.recommendedActionPayload ? JSON.stringify(payload.recommendedActionPayload) : null,
     payload.source || 'manual_placeholder',
     payload.exposesPrivateData !== false, payload.exposesFinancialData !== false, idempotencyKey]
  )
  const id = r.rows[0].id
  await auditRecord({ venueId, actorUserId, action: 'create_eat_insight_placeholder', entityType: 'eat_decision_insight', entityId: id, afterSnapshot: { insightType: payload.insightType, containsAiGeneratedContent: false }, containsAiGeneratedContent: false })
  return {
    ok: true,
    insightId: id,
    honestNote: 'E.A.T. AI decision insight has not been generated. This is a placeholder only. contains_ai_generated_content=FALSE.',
  }
}

export async function listEatDecisionInsights({ venueId, filters = {} }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!isDbAvailable()) return LOCAL({ insights: [] })
  const r = await query(
    `SELECT * FROM pos360_eat_decision_insights WHERE venue_id=$1 ORDER BY created_at DESC`, [venueId]
  )
  return { ok: true, insights: r.rows }
}

export async function reviewEatDecisionInsight({ venueId, insightId, actorUserId, decision, reason, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotencyKey_required' }
  if (!['accepted','rejected'].includes(decision)) return { ok: false, error: 'invalid_decision' }
  if (!isDbAvailable()) return LOCAL()
  const before = await query(`SELECT * FROM pos360_eat_decision_insights WHERE id=$1 AND venue_id=$2 LIMIT 1`, [insightId, venueId])
  if (!before.rows.length) return { ok: false, error: 'not_found' }
  await query(
    `UPDATE pos360_eat_decision_insights SET decision_status=$1, reviewed_by=$2, reviewed_at=NOW(), updated_at=NOW() WHERE id=$3 AND venue_id=$4`,
    [decision, actorUserId || null, insightId, venueId]
  )
  await auditRecord({ venueId, actorUserId, action: 'review_eat_insight', entityType: 'eat_decision_insight', entityId: insightId, beforeSnapshot: { status: before.rows[0].decision_status }, afterSnapshot: { decision, reason }, containsAiGeneratedContent: false })
  return { ok: true, insightId, decision }
}

export async function getEatDecisionSummary({ venueId, filters = {} }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!isDbAvailable()) return LOCAL({ summary: null })
  const r = await query(
    `SELECT decision_status, COUNT(*) AS cnt FROM pos360_eat_decision_insights WHERE venue_id=$1 GROUP BY decision_status`,
    [venueId]
  )
  const counts = {}
  r.rows.forEach(row => { counts[row.decision_status] = parseInt(row.cnt) })
  return {
    ok: true,
    summary: counts,
    honestNote: 'E.A.T. AI decision layer is not connected. All insights are placeholders. No AI was invoked.',
  }
}

// ── Exports / Scheduled Reports ───────────────────────────────────────────────

export async function createReportExportRequest({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotencyKey_required' }
  if (!isDbAvailable()) return LOCAL()
  const existing = await query(
    `SELECT id FROM pos360_report_export_requests WHERE idempotency_key=$1 AND venue_id=$2 LIMIT 1`,
    [idempotencyKey, venueId]
  )
  if (existing.rows.length) return { ok: true, duplicate: true, exportRequestId: existing.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_report_export_requests
      (venue_id,report_snapshot_id,export_type,export_status,export_completed,recipient_email,requested_by,exposes_private_data,exposes_financial_data,idempotency_key)
     VALUES ($1,$2,$3,'requested',FALSE,$4,$5,$6,$7,$8) RETURNING id`,
    [venueId, payload.reportSnapshotId || null, payload.exportType, payload.recipientEmail || null,
     actorUserId || null, payload.exposesPrivateData !== false, payload.exposesFinancialData !== false, idempotencyKey]
  )
  const id = r.rows[0].id
  await auditRecord({ venueId, actorUserId, action: 'create_export_request', entityType: 'report_export_request', entityId: id, afterSnapshot: { exportType: payload.exportType, exportCompleted: false } })
  return {
    ok: true,
    exportRequestId: id,
    honestNote: 'Export has not been completed. No PDF, CSV, or email file has been generated or delivered. export_completed=FALSE.',
  }
}

export async function listReportExportRequests({ venueId, filters = {} }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!isDbAvailable()) return LOCAL({ exportRequests: [] })
  const r = await query(`SELECT * FROM pos360_report_export_requests WHERE venue_id=$1 ORDER BY created_at DESC`, [venueId])
  return { ok: true, exportRequests: r.rows }
}

export async function markReportExportReadyPlaceholder({ venueId, exportRequestId, actorUserId, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotencyKey_required' }
  if (!isDbAvailable()) return LOCAL()
  await query(
    `UPDATE pos360_report_export_requests SET export_status='ready_placeholder', updated_at=NOW() WHERE id=$1 AND venue_id=$2`,
    [exportRequestId, venueId]
  )
  await auditRecord({ venueId, actorUserId, action: 'mark_export_ready_placeholder', entityType: 'report_export_request', entityId: exportRequestId, afterSnapshot: { status: 'ready_placeholder', exportCompleted: false } })
  return {
    ok: true,
    exportRequestId,
    honestNote: 'Export status set to ready_placeholder. No actual file was generated. export_completed remains FALSE.',
  }
}

export async function createScheduledReportContract({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotencyKey_required' }
  if (!isDbAvailable()) return LOCAL()
  const existing = await query(
    `SELECT id FROM pos360_scheduled_report_contracts WHERE idempotency_key=$1 AND venue_id=$2 LIMIT 1`,
    [idempotencyKey, venueId]
  )
  if (existing.rows.length) return { ok: true, duplicate: true, scheduledReportId: existing.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_scheduled_report_contracts
      (venue_id,report_definition_id,schedule_name,cadence,delivery_channel,delivery_completed,schedule_status,recipient_payload,exposes_private_data,exposes_financial_data,idempotency_key)
     VALUES ($1,$2,$3,$4,$5,FALSE,'draft',$6,$7,$8,$9) RETURNING id`,
    [venueId, payload.reportDefinitionId || null, payload.scheduleName, payload.cadence,
     payload.deliveryChannel || 'none',
     payload.recipientPayload ? JSON.stringify(payload.recipientPayload) : null,
     payload.exposesPrivateData !== false, payload.exposesFinancialData !== false, idempotencyKey]
  )
  const id = r.rows[0].id
  await auditRecord({ venueId, actorUserId, action: 'create_scheduled_report', entityType: 'scheduled_report_contract', entityId: id, afterSnapshot: { cadence: payload.cadence, deliveryCompleted: false } })
  return {
    ok: true,
    scheduledReportId: id,
    honestNote: 'Scheduled report delivery has not been sent. No email or external delivery has occurred. delivery_completed=FALSE.',
  }
}

export async function listScheduledReportContracts({ venueId, filters = {} }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!isDbAvailable()) return LOCAL({ scheduledReports: [] })
  const r = await query(`SELECT * FROM pos360_scheduled_report_contracts WHERE venue_id=$1 ORDER BY schedule_name`, [venueId])
  return { ok: true, scheduledReports: r.rows }
}

export async function updateScheduledReportStatus({ venueId, scheduledReportId, status, actorUserId, reason, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotencyKey_required' }
  if (!isDbAvailable()) return LOCAL()
  await query(
    `UPDATE pos360_scheduled_report_contracts SET schedule_status=$1, updated_at=NOW() WHERE id=$2 AND venue_id=$3`,
    [status, scheduledReportId, venueId]
  )
  await auditRecord({ venueId, actorUserId, action: 'update_scheduled_report_status', entityType: 'scheduled_report_contract', entityId: scheduledReportId, afterSnapshot: { status, reason, deliveryCompleted: false } })
  return { ok: true, scheduledReportId }
}

// ── BI Providers ──────────────────────────────────────────────────────────────

export async function createBiProviderProfile({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotencyKey_required' }
  if (!isDbAvailable()) return LOCAL()
  const r = await query(
    `INSERT INTO pos360_bi_provider_profiles (venue_id,provider_name,provider_status,provider_reference,capability_payload,bi_connected,stores_secrets,active,metadata)
     VALUES ($1,$2,'not_connected',$3,$4,FALSE,FALSE,TRUE,$5) RETURNING id`,
    [venueId, payload.providerName, payload.providerReference || null,
     payload.capabilityPayload ? JSON.stringify(payload.capabilityPayload) : null,
     payload.metadata ? JSON.stringify(payload.metadata) : null]
  )
  const id = r.rows[0].id
  await auditRecord({ venueId, actorUserId, action: 'create_bi_provider_profile', entityType: 'bi_provider_profile', entityId: id, afterSnapshot: { providerName: payload.providerName, biConnected: false, storesSecrets: false }, exposesFinancialData: false, exposesPrivateData: false })
  return {
    ok: true,
    biProviderProfileId: id,
    honestNote: 'BI provider is not connected. bi_connected=FALSE. stores_secrets=FALSE. No data has been synced.',
  }
}

export async function listBiProviderProfiles({ venueId, filters = {} }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!isDbAvailable()) return LOCAL({ profiles: [] })
  const r = await query(`SELECT * FROM pos360_bi_provider_profiles WHERE venue_id=$1 ORDER BY provider_name`, [venueId])
  return { ok: true, profiles: r.rows }
}

export async function updateBiProviderStatus({ venueId, providerProfileId, status, actorUserId, reason, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotencyKey_required' }
  if (!isDbAvailable()) return LOCAL()
  await query(
    `UPDATE pos360_bi_provider_profiles SET provider_status=$1, updated_at=NOW() WHERE id=$2 AND venue_id=$3`,
    [status, providerProfileId, venueId]
  )
  await auditRecord({ venueId, actorUserId, action: 'update_bi_provider_status', entityType: 'bi_provider_profile', entityId: providerProfileId, afterSnapshot: { status, reason, biConnected: false }, exposesFinancialData: false, exposesPrivateData: false })
  return { ok: true, providerProfileId }
}

// ── Offline queue ─────────────────────────────────────────────────────────────

export async function queueOfflineReportAction({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotencyKey_required' }
  if (!isDbAvailable()) return LOCAL()
  const existing = await query(
    `SELECT id FROM pos360_report_offline_queue WHERE idempotency_key=$1 AND venue_id=$2 LIMIT 1`,
    [idempotencyKey, venueId]
  )
  if (existing.rows.length) return { ok: true, duplicate: true, queueId: existing.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_report_offline_queue (venue_id,actor_user_id,action_type,payload,sync_status,idempotency_key)
     VALUES ($1,$2,$3,$4,'pending',$5) RETURNING id`,
    [venueId, actorUserId || null, payload.actionType, payload.payload ? JSON.stringify(payload.payload) : null, idempotencyKey]
  )
  return { ok: true, queueId: r.rows[0].id, honestNote: 'Report action queued for sync when connection is restored. No data has been submitted.' }
}

export async function listOfflineReportQueue({ venueId, filters = {} }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!isDbAvailable()) return LOCAL({ queue: [] })
  const r = await query(`SELECT * FROM pos360_report_offline_queue WHERE venue_id=$1 ORDER BY created_at DESC`, [venueId])
  return { ok: true, queue: r.rows }
}

export async function markOfflineReportActionSynced({ venueId, offlineActionId, actorUserId, idempotencyKey }) {
  if (!venueId) return { ok: false, error: 'venueId_required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotencyKey_required' }
  if (!isDbAvailable()) return LOCAL()
  await query(
    `UPDATE pos360_report_offline_queue SET sync_status='synced', synced_at=NOW() WHERE id=$1 AND venue_id=$2`,
    [offlineActionId, venueId]
  )
  return { ok: true, offlineActionId }
}
