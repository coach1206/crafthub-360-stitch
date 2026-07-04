/**
 * pos360SettingsVenueAdminService.js — Phase B.14 Prompt AA
 * POS360 System Settings, Venue Configuration, White-Label Controls,
 * Module Governance, SmokeCraft & E.A.T. Integration Registry & Admin Console service.
 *
 * Falls back gracefully when no database connection is configured.
 * Never prints or logs the database connection string.
 */

import { isDbAvailable, query } from '../../db/connection.js'

const AREA = 'pos360-settings-venue-admin'

const local = () => ({ ok: false, localPreview: true, error: 'database_not_configured', area: AREA })

async function auditRecord({ venueId, actorUserId, action, entityType, entityId, before, after, reason, exposesPrivate = true, exposesFinancial = false }) {
  if (!isDbAvailable()) return
  await query(
    `INSERT INTO pos360_settings_audit (venue_id, actor_user_id, action, entity_type, entity_id, before_snapshot, after_snapshot, reason, contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,FALSE,FALSE,$9,$10)`,
    [venueId, actorUserId, action, entityType, entityId || null, before ? JSON.stringify(before) : null, after ? JSON.stringify(after) : null, reason || null, exposesPrivate, exposesFinancial]
  )
}

// ── Venue Profile ──────────────────────────────────────────────────────────────

export async function createVenueProfile({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId) return { ok: false, error: 'venueId required' }
  if (!idempotencyKey) return { ok: false, error: 'idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_venue_profiles WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_venue_profiles (venue_id, venue_name, legal_business_name, venue_type, contact_email, contact_phone, website_url, address_snapshot, active, exposes_private_data, metadata, created_by, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE,TRUE,$9,$10,$11) RETURNING *`,
    [venueId, payload.venueName || '', payload.legalBusinessName || null, payload.venueType || 'restaurant', payload.contactEmail || null, payload.contactPhone || null, payload.websiteUrl || null, payload.addressSnapshot ? JSON.stringify(payload.addressSnapshot) : null, payload.metadata ? JSON.stringify(payload.metadata) : null, actorUserId || null, idempotencyKey]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_venue_profile', entityType: 'pos360_venue_profiles', entityId: String(r.rows[0].id), after: r.rows[0] })
  return { ok: true, venueProfile: r.rows[0] }
}

export async function getVenueProfile({ venueId }) {
  if (!isDbAvailable()) return local()
  if (!venueId) return { ok: false, error: 'venueId required' }
  const r = await query('SELECT * FROM pos360_venue_profiles WHERE venue_id=$1 ORDER BY created_at DESC LIMIT 1', [venueId])
  if (!r.rows.length) return { ok: true, venueProfile: null, honest_state: 'no_venue_profile_configured' }
  return { ok: true, venueProfile: r.rows[0] }
}

export async function updateVenueProfile({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !idempotencyKey) return { ok: false, error: 'venueId and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_venue_profiles WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `UPDATE pos360_venue_profiles SET venue_name=COALESCE($1,venue_name), legal_business_name=COALESCE($2,legal_business_name), venue_type=COALESCE($3,venue_type), contact_email=COALESCE($4,contact_email), updated_by=$5, updated_at=NOW() WHERE venue_id=$6 RETURNING *`,
    [payload.venueName || null, payload.legalBusinessName || null, payload.venueType || null, payload.contactEmail || null, actorUserId || null, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'venue_profile_not_found' }
  await auditRecord({ venueId, actorUserId, action: 'update_venue_profile', entityType: 'pos360_venue_profiles', entityId: String(r.rows[0].id), after: r.rows[0] })
  return { ok: true, venueProfile: r.rows[0] }
}

// ── Regional Settings ──────────────────────────────────────────────────────────

export async function createRegionalSettings({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !idempotencyKey) return { ok: false, error: 'venueId and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_venue_regional_settings WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_venue_regional_settings (venue_id, default_locale, supported_locales, timezone, currency_code, date_format, time_format, measurement_unit, active, created_by, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE,$9,$10) RETURNING *`,
    [venueId, payload.defaultLocale || 'en-US', JSON.stringify(payload.supportedLocales || ['en-US']), payload.timezone || 'UTC', payload.currencyCode || 'USD', payload.dateFormat || 'MM/DD/YYYY', payload.timeFormat || '12h', payload.measurementUnit || 'imperial', actorUserId || null, idempotencyKey]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_regional_settings', entityType: 'pos360_venue_regional_settings', entityId: String(r.rows[0].id), after: r.rows[0] })
  return { ok: true, regionalSettings: r.rows[0] }
}

export async function getRegionalSettings({ venueId }) {
  if (!isDbAvailable()) return local()
  if (!venueId) return { ok: false, error: 'venueId required' }
  const r = await query('SELECT * FROM pos360_venue_regional_settings WHERE venue_id=$1 ORDER BY created_at DESC LIMIT 1', [venueId])
  if (!r.rows.length) return { ok: true, regionalSettings: null, honest_state: 'no_regional_settings_configured' }
  return { ok: true, regionalSettings: r.rows[0] }
}

export async function updateRegionalSettings({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !idempotencyKey) return { ok: false, error: 'venueId and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_venue_regional_settings WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `UPDATE pos360_venue_regional_settings SET default_locale=COALESCE($1,default_locale), timezone=COALESCE($2,timezone), currency_code=COALESCE($3,currency_code), updated_by=$4, updated_at=NOW() WHERE venue_id=$5 RETURNING *`,
    [payload.defaultLocale || null, payload.timezone || null, payload.currencyCode || null, actorUserId || null, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'regional_settings_not_found' }
  await auditRecord({ venueId, actorUserId, action: 'update_regional_settings', entityType: 'pos360_venue_regional_settings', entityId: String(r.rows[0].id), after: r.rows[0] })
  return { ok: true, regionalSettings: r.rows[0] }
}

// ── Operating Rules ────────────────────────────────────────────────────────────

export async function createOperatingRule({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !idempotencyKey) return { ok: false, error: 'venueId and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_venue_operating_rules WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_venue_operating_rules (venue_id, rule_group, rule_key, rule_payload, requires_manager_approval, active, created_by, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,TRUE,$6,$7) RETURNING *`,
    [venueId, payload.ruleGroup || 'orders', payload.ruleKey || '', payload.rulePayload ? JSON.stringify(payload.rulePayload) : null, payload.requiresManagerApproval === true, actorUserId || null, idempotencyKey]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_operating_rule', entityType: 'pos360_venue_operating_rules', entityId: String(r.rows[0].id), after: r.rows[0] })
  return { ok: true, operatingRule: r.rows[0] }
}

export async function listOperatingRules({ venueId, filters = {} }) {
  if (!isDbAvailable()) return local()
  if (!venueId) return { ok: false, error: 'venueId required' }
  const r = await query('SELECT * FROM pos360_venue_operating_rules WHERE venue_id=$1 ORDER BY created_at DESC', [venueId])
  return { ok: true, operatingRules: r.rows }
}

export async function updateOperatingRule({ venueId, operatingRuleId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !operatingRuleId || !idempotencyKey) return { ok: false, error: 'venueId, operatingRuleId, and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_venue_operating_rules WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `UPDATE pos360_venue_operating_rules SET rule_payload=COALESCE($1,rule_payload), requires_manager_approval=COALESCE($2,requires_manager_approval), updated_by=$3, updated_at=NOW() WHERE id=$4 AND venue_id=$5 RETURNING *`,
    [payload.rulePayload ? JSON.stringify(payload.rulePayload) : null, payload.requiresManagerApproval != null ? payload.requiresManagerApproval : null, actorUserId || null, operatingRuleId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'operating_rule_not_found' }
  await auditRecord({ venueId, actorUserId, action: 'update_operating_rule', entityType: 'pos360_venue_operating_rules', entityId: String(r.rows[0].id), after: r.rows[0], exposesFinancial: false })
  return { ok: true, operatingRule: r.rows[0] }
}

// ── Financial Policies ─────────────────────────────────────────────────────────
// Financial policy is a placeholder contract. calculation_enabled=FALSE.
// No tax calculation, no accounting export connection has occurred.

export async function createFinancialPolicy({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !idempotencyKey) return { ok: false, error: 'venueId and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_venue_financial_policies WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_venue_financial_policies (venue_id, policy_group, policy_key, policy_payload, calculation_enabled, external_accounting_connected, requires_manager_approval, exposes_financial_data, created_by, idempotency_key)
     VALUES ($1,$2,$3,$4,FALSE,FALSE,TRUE,TRUE,$5,$6) RETURNING *`,
    [venueId, payload.policyGroup || 'tax', payload.policyKey || '', payload.policyPayload ? JSON.stringify(payload.policyPayload) : null, actorUserId || null, idempotencyKey]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_financial_policy', entityType: 'pos360_venue_financial_policies', entityId: String(r.rows[0].id), after: r.rows[0], exposesFinancial: true })
  return { ok: true, financialPolicy: r.rows[0], honest_note: 'calculation_enabled=FALSE. No tax calculation or accounting export is active.' }
}

export async function listFinancialPolicies({ venueId, filters = {} }) {
  if (!isDbAvailable()) return local()
  if (!venueId) return { ok: false, error: 'venueId required' }
  const r = await query('SELECT * FROM pos360_venue_financial_policies WHERE venue_id=$1 ORDER BY created_at DESC', [venueId])
  return { ok: true, financialPolicies: r.rows }
}

export async function updateFinancialPolicy({ venueId, financialPolicyId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !financialPolicyId || !idempotencyKey) return { ok: false, error: 'venueId, financialPolicyId, and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_venue_financial_policies WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `UPDATE pos360_venue_financial_policies SET policy_payload=COALESCE($1,policy_payload), updated_by=$2, updated_at=NOW() WHERE id=$3 AND venue_id=$4 RETURNING *`,
    [payload.policyPayload ? JSON.stringify(payload.policyPayload) : null, actorUserId || null, financialPolicyId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'financial_policy_not_found' }
  await auditRecord({ venueId, actorUserId, action: 'update_financial_policy', entityType: 'pos360_venue_financial_policies', entityId: String(r.rows[0].id), after: r.rows[0], exposesFinancial: true })
  return { ok: true, financialPolicy: r.rows[0] }
}

// ── Compliance Settings ────────────────────────────────────────────────────────

export async function createComplianceSetting({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !idempotencyKey) return { ok: false, error: 'venueId and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_venue_compliance_settings WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_venue_compliance_settings (venue_id, compliance_group, compliance_key, compliance_payload, compliance_certified, active, exposes_private_data, created_by, idempotency_key)
     VALUES ($1,$2,$3,$4,FALSE,TRUE,TRUE,$5,$6) RETURNING *`,
    [venueId, payload.complianceGroup || 'privacy', payload.complianceKey || '', payload.compliancePayload ? JSON.stringify(payload.compliancePayload) : null, actorUserId || null, idempotencyKey]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_compliance_setting', entityType: 'pos360_venue_compliance_settings', entityId: String(r.rows[0].id), after: r.rows[0] })
  return { ok: true, complianceSetting: r.rows[0], honest_note: 'compliance_certified=FALSE. No compliance certification has been issued.' }
}

export async function listComplianceSettings({ venueId, filters = {} }) {
  if (!isDbAvailable()) return local()
  if (!venueId) return { ok: false, error: 'venueId required' }
  const r = await query('SELECT * FROM pos360_venue_compliance_settings WHERE venue_id=$1 ORDER BY created_at DESC', [venueId])
  return { ok: true, complianceSettings: r.rows }
}

export async function updateComplianceSetting({ venueId, complianceSettingId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !complianceSettingId || !idempotencyKey) return { ok: false, error: 'venueId, complianceSettingId, and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_venue_compliance_settings WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `UPDATE pos360_venue_compliance_settings SET compliance_payload=COALESCE($1,compliance_payload), updated_by=$2, updated_at=NOW() WHERE id=$3 AND venue_id=$4 RETURNING *`,
    [payload.compliancePayload ? JSON.stringify(payload.compliancePayload) : null, actorUserId || null, complianceSettingId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'compliance_setting_not_found' }
  await auditRecord({ venueId, actorUserId, action: 'update_compliance_setting', entityType: 'pos360_venue_compliance_settings', entityId: String(r.rows[0].id), after: r.rows[0] })
  return { ok: true, complianceSetting: r.rows[0] }
}

export async function createPrivacyNotice({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !idempotencyKey) return { ok: false, error: 'venueId and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_venue_privacy_notices WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_venue_privacy_notices (venue_id, notice_type, notice_title, notice_body, locale, active, exposes_private_data, created_by, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,TRUE,TRUE,$6,$7) RETURNING *`,
    [venueId, payload.noticeType || 'privacy_policy', payload.noticeTitle || '', payload.noticeBody || null, payload.locale || 'en-US', actorUserId || null, idempotencyKey]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_privacy_notice', entityType: 'pos360_venue_privacy_notices', entityId: String(r.rows[0].id), after: r.rows[0] })
  return { ok: true, privacyNotice: r.rows[0] }
}

export async function listPrivacyNotices({ venueId, filters = {} }) {
  if (!isDbAvailable()) return local()
  if (!venueId) return { ok: false, error: 'venueId required' }
  const r = await query('SELECT * FROM pos360_venue_privacy_notices WHERE venue_id=$1 ORDER BY created_at DESC', [venueId])
  return { ok: true, privacyNotices: r.rows }
}

// ── White Label ────────────────────────────────────────────────────────────────
// white_label_deployed=FALSE. No real brand deployment has occurred.

export async function createWhiteLabelProfile({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !idempotencyKey) return { ok: false, error: 'venueId and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_white_label_profiles WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_white_label_profiles (venue_id, brand_name, display_name, logo_reference, favicon_reference, custom_domain, custom_domain_status, white_label_status, white_label_deployed, legal_footer_text, receipt_footer_text, dashboard_title, exposes_private_data, metadata, created_by, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,'not_configured','draft',FALSE,$7,$8,$9,TRUE,$10,$11,$12) RETURNING *`,
    [venueId, payload.brandName || '', payload.displayName || '', payload.logoReference || null, payload.faviconReference || null, payload.customDomain || null, payload.legalFooterText || null, payload.receiptFooterText || null, payload.dashboardTitle || null, payload.metadata ? JSON.stringify(payload.metadata) : null, actorUserId || null, idempotencyKey]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_white_label_profile', entityType: 'pos360_white_label_profiles', entityId: String(r.rows[0].id), after: r.rows[0] })
  return { ok: true, whiteLabelProfile: r.rows[0], honest_note: 'white_label_deployed=FALSE. No real white-label deployment or custom domain connection has occurred.' }
}

export async function getWhiteLabelProfile({ venueId }) {
  if (!isDbAvailable()) return local()
  if (!venueId) return { ok: false, error: 'venueId required' }
  const r = await query('SELECT * FROM pos360_white_label_profiles WHERE venue_id=$1 ORDER BY created_at DESC LIMIT 1', [venueId])
  if (!r.rows.length) return { ok: true, whiteLabelProfile: null, honest_state: 'white_label_not_configured', white_label_deployed: false }
  return { ok: true, whiteLabelProfile: r.rows[0] }
}

export async function updateWhiteLabelProfile({ venueId, whiteLabelProfileId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !whiteLabelProfileId || !idempotencyKey) return { ok: false, error: 'venueId, whiteLabelProfileId, and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_white_label_profiles WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `UPDATE pos360_white_label_profiles SET brand_name=COALESCE($1,brand_name), display_name=COALESCE($2,display_name), logo_reference=COALESCE($3,logo_reference), legal_footer_text=COALESCE($4,legal_footer_text), updated_by=$5, updated_at=NOW() WHERE id=$6 AND venue_id=$7 RETURNING *`,
    [payload.brandName || null, payload.displayName || null, payload.logoReference || null, payload.legalFooterText || null, actorUserId || null, whiteLabelProfileId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'white_label_profile_not_found' }
  await auditRecord({ venueId, actorUserId, action: 'update_white_label_profile', entityType: 'pos360_white_label_profiles', entityId: String(r.rows[0].id), after: r.rows[0] })
  return { ok: true, whiteLabelProfile: r.rows[0] }
}

export async function createThemeToken({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !idempotencyKey) return { ok: false, error: 'venueId and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_white_label_theme_tokens WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_white_label_theme_tokens (venue_id, white_label_profile_id, token_group, token_key, token_value, active, created_by, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,TRUE,$6,$7) RETURNING *`,
    [venueId, payload.whiteLabelProfileId || null, payload.tokenGroup || 'colors', payload.tokenKey || '', payload.tokenValue || '', actorUserId || null, idempotencyKey]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_theme_token', entityType: 'pos360_white_label_theme_tokens', entityId: String(r.rows[0].id), after: r.rows[0] })
  return { ok: true, themeToken: r.rows[0] }
}

export async function listThemeTokens({ venueId, filters = {} }) {
  if (!isDbAvailable()) return local()
  if (!venueId) return { ok: false, error: 'venueId required' }
  const r = await query('SELECT * FROM pos360_white_label_theme_tokens WHERE venue_id=$1 ORDER BY created_at DESC', [venueId])
  return { ok: true, themeTokens: r.rows }
}

export async function updateThemeToken({ venueId, themeTokenId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !themeTokenId || !idempotencyKey) return { ok: false, error: 'venueId, themeTokenId, and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_white_label_theme_tokens WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `UPDATE pos360_white_label_theme_tokens SET token_value=COALESCE($1,token_value), active=COALESCE($2,active), updated_by=$3, updated_at=NOW() WHERE id=$4 AND venue_id=$5 RETURNING *`,
    [payload.tokenValue || null, payload.active != null ? payload.active : null, actorUserId || null, themeTokenId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'theme_token_not_found' }
  await auditRecord({ venueId, actorUserId, action: 'update_theme_token', entityType: 'pos360_white_label_theme_tokens', entityId: String(r.rows[0].id), after: r.rows[0] })
  return { ok: true, themeToken: r.rows[0] }
}

// ── Module Registry ────────────────────────────────────────────────────────────

export async function createModuleRegistryEntry({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !idempotencyKey) return { ok: false, error: 'venueId and idempotencyKey required' }
  const r = await query(
    `INSERT INTO pos360_module_registry (venue_id, module_key, module_name, module_status, system_module, metadata)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [venueId, payload.moduleKey || 'custom', payload.moduleName || '', payload.moduleStatus || 'available', payload.systemModule === true, payload.metadata ? JSON.stringify(payload.metadata) : null]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_module_registry_entry', entityType: 'pos360_module_registry', entityId: String(r.rows[0].id), after: r.rows[0] })
  return { ok: true, moduleRegistryEntry: r.rows[0] }
}

export async function listModuleRegistry({ venueId, filters = {} }) {
  if (!isDbAvailable()) return local()
  const r = await query('SELECT * FROM pos360_module_registry WHERE venue_id=$1 OR venue_id IS NULL ORDER BY module_key', [venueId])
  return { ok: true, modules: r.rows }
}

export async function updateModuleStatus({ venueId, moduleRegistryId, status, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !moduleRegistryId || !idempotencyKey) return { ok: false, error: 'venueId, moduleRegistryId, and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_module_registry WHERE id=$1', [moduleRegistryId])
  if (!dup.rows.length) return { ok: false, error: 'module_registry_entry_not_found' }
  const r = await query(
    `UPDATE pos360_module_registry SET module_status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
    [status || 'available', moduleRegistryId]
  )
  await auditRecord({ venueId, actorUserId, action: 'update_module_status', entityType: 'pos360_module_registry', entityId: String(moduleRegistryId), after: { status, reason } })
  return { ok: true, moduleRegistryEntry: r.rows[0] }
}

export async function createModuleGovernanceRule({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !idempotencyKey) return { ok: false, error: 'venueId and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_module_governance_rules WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_module_governance_rules (venue_id, module_key, governance_key, governance_payload, enabled, requires_manager_approval, created_by, idempotency_key)
     VALUES ($1,$2,$3,$4,TRUE,$5,$6,$7) RETURNING *`,
    [venueId, payload.moduleKey || 'custom', payload.governanceKey || '', payload.governancePayload ? JSON.stringify(payload.governancePayload) : null, payload.requiresManagerApproval === true, actorUserId || null, idempotencyKey]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_module_governance_rule', entityType: 'pos360_module_governance_rules', entityId: String(r.rows[0].id), after: r.rows[0] })
  return { ok: true, moduleGovernanceRule: r.rows[0] }
}

export async function listModuleGovernanceRules({ venueId, filters = {} }) {
  if (!isDbAvailable()) return local()
  if (!venueId) return { ok: false, error: 'venueId required' }
  const r = await query('SELECT * FROM pos360_module_governance_rules WHERE venue_id=$1 ORDER BY created_at DESC', [venueId])
  return { ok: true, moduleGovernanceRules: r.rows }
}

export async function createFeatureFlagOverride({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !idempotencyKey) return { ok: false, error: 'venueId and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_feature_flag_overrides WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_feature_flag_overrides (venue_id, module_key, flag_key, flag_value, override_reason, override_status, created_by, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,'draft',$6,$7) RETURNING *`,
    [venueId, payload.moduleKey || 'custom', payload.flagKey || '', String(payload.flagValue ?? ''), payload.overrideReason || null, actorUserId || null, idempotencyKey]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_feature_flag_override', entityType: 'pos360_feature_flag_overrides', entityId: String(r.rows[0].id), after: r.rows[0] })
  return { ok: true, featureFlagOverride: r.rows[0] }
}

export async function listFeatureFlagOverrides({ venueId, filters = {} }) {
  if (!isDbAvailable()) return local()
  if (!venueId) return { ok: false, error: 'venueId required' }
  const r = await query('SELECT * FROM pos360_feature_flag_overrides WHERE venue_id=$1 ORDER BY created_at DESC', [venueId])
  return { ok: true, featureFlagOverrides: r.rows }
}

export async function updateFeatureFlagOverrideStatus({ venueId, overrideId, status, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !overrideId || !idempotencyKey) return { ok: false, error: 'venueId, overrideId, and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_feature_flag_overrides WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `UPDATE pos360_feature_flag_overrides SET override_status=$1, updated_at=NOW() WHERE id=$2 AND venue_id=$3 RETURNING *`,
    [status || 'active', overrideId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'feature_flag_override_not_found' }
  await auditRecord({ venueId, actorUserId, action: 'update_feature_flag_override_status', entityType: 'pos360_feature_flag_overrides', entityId: String(overrideId), after: { status, reason } })
  return { ok: true, featureFlagOverride: r.rows[0] }
}

// ── Integration Status ─────────────────────────────────────────────────────────
// integration_connected=FALSE. No real provider connection has occurred.
// stores_secrets=FALSE. No secrets stored.

export async function createIntegrationStatus({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !idempotencyKey) return { ok: false, error: 'venueId and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_integration_status_registry WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_integration_status_registry (venue_id, provider_key, provider_type, provider_name, integration_status, integration_connected, stores_secrets, contains_secrets, capability_payload, metadata, created_by, idempotency_key)
     VALUES ($1,$2,$3,$4,'not_connected',FALSE,FALSE,FALSE,$5,$6,$7,$8) RETURNING *`,
    [venueId, payload.providerKey || '', payload.providerType || 'payments', payload.providerName || '', payload.capabilityPayload ? JSON.stringify(payload.capabilityPayload) : null, payload.metadata ? JSON.stringify(payload.metadata) : null, actorUserId || null, idempotencyKey]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_integration_status', entityType: 'pos360_integration_status_registry', entityId: String(r.rows[0].id), after: r.rows[0] })
  return { ok: true, integrationStatus: r.rows[0], honest_note: 'integration_connected=FALSE. stores_secrets=FALSE. No provider connection has been established. No secrets are stored.' }
}

export async function listIntegrationStatuses({ venueId, filters = {} }) {
  if (!isDbAvailable()) return local()
  if (!venueId) return { ok: false, error: 'venueId required' }
  const r = await query('SELECT * FROM pos360_integration_status_registry WHERE venue_id=$1 ORDER BY provider_type, created_at DESC', [venueId])
  return { ok: true, integrationStatuses: r.rows }
}

export async function updateIntegrationStatus({ venueId, integrationStatusId, status, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !integrationStatusId || !idempotencyKey) return { ok: false, error: 'venueId, integrationStatusId, and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_integration_status_registry WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `UPDATE pos360_integration_status_registry SET integration_status=$1, last_checked_at=NOW(), updated_by=$2, updated_at=NOW() WHERE id=$3 AND venue_id=$4 RETURNING *`,
    [status || 'not_connected', actorUserId || null, integrationStatusId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'integration_status_not_found' }
  await auditRecord({ venueId, actorUserId, action: 'update_integration_status', entityType: 'pos360_integration_status_registry', entityId: String(integrationStatusId), after: { status, reason } })
  return { ok: true, integrationStatus: r.rows[0] }
}

export async function createProviderReadinessCheck({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !idempotencyKey) return { ok: false, error: 'venueId and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_provider_readiness_checks WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_provider_readiness_checks (venue_id, integration_status_id, provider_key, readiness_type, readiness_status, check_payload, contains_secrets, created_by, idempotency_key)
     VALUES ($1,$2,$3,$4,'not_checked',$5,FALSE,$6,$7) RETURNING *`,
    [venueId, payload.integrationStatusId || null, payload.providerKey || '', payload.readinessType || 'configuration', payload.checkPayload ? JSON.stringify(payload.checkPayload) : null, actorUserId || null, idempotencyKey]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_provider_readiness_check', entityType: 'pos360_provider_readiness_checks', entityId: String(r.rows[0].id), after: r.rows[0] })
  return { ok: true, providerReadinessCheck: r.rows[0] }
}

export async function listProviderReadinessChecks({ venueId, filters = {} }) {
  if (!isDbAvailable()) return local()
  if (!venueId) return { ok: false, error: 'venueId required' }
  const r = await query('SELECT * FROM pos360_provider_readiness_checks WHERE venue_id=$1 ORDER BY created_at DESC', [venueId])
  return { ok: true, providerReadinessChecks: r.rows }
}

export async function updateProviderReadinessStatus({ venueId, readinessCheckId, status, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !readinessCheckId || !idempotencyKey) return { ok: false, error: 'venueId, readinessCheckId, and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_provider_readiness_checks WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `UPDATE pos360_provider_readiness_checks SET readiness_status=$1, checked_by=$2, checked_at=NOW(), updated_at=NOW() WHERE id=$3 AND venue_id=$4 RETURNING *`,
    [status || 'not_checked', actorUserId || null, readinessCheckId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'provider_readiness_check_not_found' }
  await auditRecord({ venueId, actorUserId, action: 'update_provider_readiness_status', entityType: 'pos360_provider_readiness_checks', entityId: String(readinessCheckId), after: { status, reason } })
  return { ok: true, providerReadinessCheck: r.rows[0] }
}

// ── Admin Console ──────────────────────────────────────────────────────────────

export async function createAdminConsoleProfile({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !idempotencyKey) return { ok: false, error: 'venueId and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_admin_console_profiles WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_admin_console_profiles (venue_id, admin_user_id, profile_name, access_groups, active, metadata, created_by, idempotency_key)
     VALUES ($1,$2,$3,$4,TRUE,$5,$6,$7) RETURNING *`,
    [venueId, payload.adminUserId || actorUserId || '', payload.profileName || '', payload.accessGroups ? JSON.stringify(payload.accessGroups) : null, payload.metadata ? JSON.stringify(payload.metadata) : null, actorUserId || null, idempotencyKey]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_admin_console_profile', entityType: 'pos360_admin_console_profiles', entityId: String(r.rows[0].id), after: r.rows[0] })
  return { ok: true, adminConsoleProfile: r.rows[0] }
}

export async function listAdminConsoleProfiles({ venueId, filters = {} }) {
  if (!isDbAvailable()) return local()
  if (!venueId) return { ok: false, error: 'venueId required' }
  const r = await query('SELECT * FROM pos360_admin_console_profiles WHERE venue_id=$1 ORDER BY created_at DESC', [venueId])
  return { ok: true, adminConsoleProfiles: r.rows }
}

export async function recordAdminSettingsView({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !idempotencyKey) return { ok: false, error: 'venueId and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_admin_settings_views WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_admin_settings_views (venue_id, admin_user_id, setting_group, exposes_private_data, exposes_financial_data, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [venueId, actorUserId || '', payload.settingGroup || '', payload.exposesPrivateData === true, payload.exposesFinancialData === true, idempotencyKey]
  )
  return { ok: true, adminSettingsView: r.rows[0] }
}

// ── Settings Change / Approval ─────────────────────────────────────────────────

export async function createSettingsChangeRequest({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !idempotencyKey) return { ok: false, error: 'venueId and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_settings_change_requests WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_settings_change_requests (venue_id, setting_group, setting_key, entity_type, entity_id, previous_snapshot, requested_snapshot, change_status, requested_by, reason, exposes_private_data, exposes_financial_data, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'draft',$8,$9,$10,$11,$12) RETURNING *`,
    [venueId, payload.settingGroup || '', payload.settingKey || '', payload.entityType || '', payload.entityId || null, payload.previousSnapshot ? JSON.stringify(payload.previousSnapshot) : null, payload.requestedSnapshot ? JSON.stringify(payload.requestedSnapshot) : null, actorUserId || '', payload.reason || null, payload.exposesPrivateData !== false, payload.exposesFinancialData === true, idempotencyKey]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_settings_change_request', entityType: 'pos360_settings_change_requests', entityId: String(r.rows[0].id), after: r.rows[0], exposesFinancial: payload.exposesFinancialData === true })
  return { ok: true, settingsChangeRequest: r.rows[0] }
}

export async function listSettingsChangeRequests({ venueId, filters = {} }) {
  if (!isDbAvailable()) return local()
  if (!venueId) return { ok: false, error: 'venueId required' }
  const r = await query('SELECT * FROM pos360_settings_change_requests WHERE venue_id=$1 ORDER BY created_at DESC', [venueId])
  return { ok: true, settingsChangeRequests: r.rows }
}

export async function applySettingsChangeRequest({ venueId, changeRequestId, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !changeRequestId || !idempotencyKey) return { ok: false, error: 'venueId, changeRequestId, and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_settings_change_requests WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `UPDATE pos360_settings_change_requests SET change_status='applied', updated_at=NOW() WHERE id=$1 AND venue_id=$2 RETURNING *`,
    [changeRequestId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'settings_change_request_not_found' }
  await auditRecord({ venueId, actorUserId, action: 'apply_settings_change_request', entityType: 'pos360_settings_change_requests', entityId: String(changeRequestId), after: { change_status: 'applied', reason } })
  return { ok: true, settingsChangeRequest: r.rows[0] }
}

export async function createSettingsApprovalRequest({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !idempotencyKey) return { ok: false, error: 'venueId and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_settings_approval_requests WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_settings_approval_requests (venue_id, change_request_id, protected_setting_type, approval_status, requested_by, before_snapshot, after_snapshot, exposes_private_data, exposes_financial_data, idempotency_key)
     VALUES ($1,$2,$3,'pending',$4,$5,$6,$7,$8,$9) RETURNING *`,
    [venueId, payload.changeRequestId || null, payload.protectedSettingType || 'financial_policy', actorUserId || '', payload.beforeSnapshot ? JSON.stringify(payload.beforeSnapshot) : null, payload.afterSnapshot ? JSON.stringify(payload.afterSnapshot) : null, payload.exposesPrivateData !== false, payload.exposesFinancialData === true, idempotencyKey]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_settings_approval_request', entityType: 'pos360_settings_approval_requests', entityId: String(r.rows[0].id), after: r.rows[0], exposesFinancial: payload.exposesFinancialData === true })
  return { ok: true, settingsApprovalRequest: r.rows[0], honest_note: 'Manager approval required for protected settings change.' }
}

export async function listSettingsApprovalRequests({ venueId, filters = {} }) {
  if (!isDbAvailable()) return local()
  if (!venueId) return { ok: false, error: 'venueId required' }
  const r = await query('SELECT * FROM pos360_settings_approval_requests WHERE venue_id=$1 ORDER BY created_at DESC', [venueId])
  return { ok: true, settingsApprovalRequests: r.rows }
}

export async function decideSettingsApprovalRequest({ venueId, approvalRequestId, managerUserId, decision, reason, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !approvalRequestId || !idempotencyKey) return { ok: false, error: 'venueId, approvalRequestId, and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_settings_approval_requests WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `UPDATE pos360_settings_approval_requests SET approval_status=$1, manager_user_id=$2, decision_reason=$3, decided_at=NOW(), updated_at=NOW() WHERE id=$4 AND venue_id=$5 RETURNING *`,
    [decision || 'approved', managerUserId || null, reason || null, approvalRequestId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'settings_approval_request_not_found' }
  await auditRecord({ venueId, actorUserId: managerUserId, action: 'decide_settings_approval_request', entityType: 'pos360_settings_approval_requests', entityId: String(approvalRequestId), after: { decision, reason } })
  return { ok: true, settingsApprovalRequest: r.rows[0] }
}

// ── Version History ────────────────────────────────────────────────────────────

export async function createSettingsVersionHistory({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !idempotencyKey) return { ok: false, error: 'venueId and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_settings_version_history WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_settings_version_history (venue_id, setting_group, setting_key, version_number, snapshot_payload, changed_by, change_reason, rollback_available, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE,$8) RETURNING *`,
    [venueId, payload.settingGroup || '', payload.settingKey || '', payload.versionNumber || 1, payload.snapshotPayload ? JSON.stringify(payload.snapshotPayload) : null, actorUserId || '', payload.changeReason || null, idempotencyKey]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_settings_version_history', entityType: 'pos360_settings_version_history', entityId: String(r.rows[0].id), after: r.rows[0] })
  return { ok: true, settingsVersionHistory: r.rows[0] }
}

export async function listSettingsVersionHistory({ venueId, filters = {} }) {
  if (!isDbAvailable()) return local()
  if (!venueId) return { ok: false, error: 'venueId required' }
  const r = await query('SELECT * FROM pos360_settings_version_history WHERE venue_id=$1 ORDER BY created_at DESC', [venueId])
  return { ok: true, settingsVersionHistory: r.rows }
}

export async function createSettingsRollbackRecord({ venueId, versionHistoryId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !idempotencyKey) return { ok: false, error: 'venueId and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_settings_rollback_records WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_settings_rollback_records (venue_id, version_history_id, rollback_status, requested_by, reason, idempotency_key)
     VALUES ($1,$2,'requested',$3,$4,$5) RETURNING *`,
    [venueId, versionHistoryId || null, actorUserId || '', payload.reason || null, idempotencyKey]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_settings_rollback_record', entityType: 'pos360_settings_rollback_records', entityId: String(r.rows[0].id), after: r.rows[0] })
  return { ok: true, settingsRollbackRecord: r.rows[0] }
}

export async function decideSettingsRollback({ venueId, rollbackRecordId, managerUserId, decision, reason, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !rollbackRecordId || !idempotencyKey) return { ok: false, error: 'venueId, rollbackRecordId, and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_settings_rollback_records WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `UPDATE pos360_settings_rollback_records SET rollback_status=$1, approved_by=$2, applied_at=CASE WHEN $1='applied' THEN NOW() ELSE NULL END, updated_at=NOW() WHERE id=$3 AND venue_id=$4 RETURNING *`,
    [decision || 'approved', managerUserId || null, rollbackRecordId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'settings_rollback_record_not_found' }
  await auditRecord({ venueId, actorUserId: managerUserId, action: 'decide_settings_rollback', entityType: 'pos360_settings_rollback_records', entityId: String(rollbackRecordId), after: { decision, reason } })
  return { ok: true, settingsRollbackRecord: r.rows[0] }
}

// ── Settings Exports ───────────────────────────────────────────────────────────

export async function createSettingsExportRequest({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !idempotencyKey) return { ok: false, error: 'venueId and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_settings_export_requests WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_settings_export_requests (venue_id, export_type, export_status, export_completed, requested_by, exposes_private_data, exposes_financial_data, idempotency_key)
     VALUES ($1,$2,'requested',FALSE,$3,TRUE,TRUE,$4) RETURNING *`,
    [venueId, payload.exportType || 'json', actorUserId || '', idempotencyKey]
  )
  await auditRecord({ venueId, actorUserId, action: 'create_settings_export_request', entityType: 'pos360_settings_export_requests', entityId: String(r.rows[0].id), after: r.rows[0], exposesFinancial: true })
  return { ok: true, settingsExportRequest: r.rows[0], honest_note: 'export_completed=FALSE. No export file has been generated or delivered.' }
}

export async function listSettingsExportRequests({ venueId, filters = {} }) {
  if (!isDbAvailable()) return local()
  if (!venueId) return { ok: false, error: 'venueId required' }
  const r = await query('SELECT * FROM pos360_settings_export_requests WHERE venue_id=$1 ORDER BY created_at DESC', [venueId])
  return { ok: true, settingsExportRequests: r.rows }
}

export async function markSettingsExportReadyPlaceholder({ venueId, exportRequestId, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !exportRequestId || !idempotencyKey) return { ok: false, error: 'venueId, exportRequestId, and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_settings_export_requests WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `UPDATE pos360_settings_export_requests SET export_status='ready_placeholder', updated_at=NOW() WHERE id=$1 AND venue_id=$2 RETURNING *`,
    [exportRequestId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'settings_export_request_not_found' }
  await auditRecord({ venueId, actorUserId, action: 'mark_settings_export_ready_placeholder', entityType: 'pos360_settings_export_requests', entityId: String(exportRequestId), after: r.rows[0], exposesFinancial: true })
  return { ok: true, settingsExportRequest: r.rows[0] }
}

// ── Offline Queue ──────────────────────────────────────────────────────────────

export async function queueOfflineSettingsAction({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !idempotencyKey) return { ok: false, error: 'venueId and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_settings_offline_queue WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `INSERT INTO pos360_settings_offline_queue (venue_id, action_type, entity_type, payload, sync_status, actor_user_id, idempotency_key)
     VALUES ($1,$2,$3,$4,'pending',$5,$6) RETURNING *`,
    [venueId, payload.actionType || '', payload.entityType || '', payload.payload ? JSON.stringify(payload.payload) : null, actorUserId || null, idempotencyKey]
  )
  return { ok: true, offlineQueueEntry: r.rows[0], honest_note: 'Settings change is queued for sync. Has not been applied yet.' }
}

export async function listOfflineSettingsQueue({ venueId, filters = {} }) {
  if (!isDbAvailable()) return local()
  if (!venueId) return { ok: false, error: 'venueId required' }
  const r = await query('SELECT * FROM pos360_settings_offline_queue WHERE venue_id=$1 ORDER BY created_at DESC', [venueId])
  return { ok: true, offlineSettingsQueue: r.rows }
}

export async function markOfflineSettingsActionSynced({ venueId, offlineActionId, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return local()
  if (!venueId || !offlineActionId || !idempotencyKey) return { ok: false, error: 'venueId, offlineActionId, and idempotencyKey required' }
  const dup = await query('SELECT id FROM pos360_settings_offline_queue WHERE idempotency_key=$1 AND venue_id=$2', [idempotencyKey, venueId])
  if (dup.rows.length) return { duplicate: true, id: dup.rows[0].id }
  const r = await query(
    `UPDATE pos360_settings_offline_queue SET sync_status='synced', synced_at=NOW(), updated_at=NOW() WHERE id=$1 AND venue_id=$2 RETURNING *`,
    [offlineActionId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'offline_settings_action_not_found' }
  return { ok: true, offlineQueueEntry: r.rows[0] }
}
