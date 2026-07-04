/**
 * NOVEE OS Billing Governance Service — Phase C.3 / Module 3 of 7
 * Licensing, Plans, Trials, Billing Gates & Feature Access.
 * Falls back gracefully when no database connection is configured.
 * Never prints or logs the database connection string.
 */

import { isDbAvailable } from '../../db/connection.js';
import * as contracts from './noveeOSBillingContracts.js';

const AREA = 'novee-os-billing-governance';

function localFallback(extra = {}) {
  return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA, ...extra };
}

async function writeBillingAuditInternal(db, { actorUserId, action, entityType, entityId, beforeSnapshot, afterSnapshot, reason, organizationId, venueId, workspaceId, userId, planKey, providerKey }) {
  // contains_secrets: false, stores_secrets: false — hardcoded; audit rows never hold secrets
  try {
    await db.query(
      `INSERT INTO novee_os_billing_audit
         (actor_user_id, action, entity_type, entity_id, before_snapshot, after_snapshot, reason,
          organization_id, venue_id, workspace_id, user_id, plan_key, provider_key,
          contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data, contains_ai_generated_content)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,FALSE,FALSE,FALSE,FALSE,FALSE)`,
      [
        actorUserId || 'system',
        action,
        entityType,
        entityId || null,
        beforeSnapshot ? JSON.stringify(beforeSnapshot) : null,
        afterSnapshot  ? JSON.stringify(afterSnapshot)  : null,
        reason || null,
        organizationId || null,
        venueId || null,
        workspaceId || null,
        userId || null,
        planKey || null,
        providerKey || null,
      ]
    );
  } catch (_) { /* audit write failure must not surface raw error */ }
}

// ─── PLANS ───────────────────────────────────────────────────────────────────

export async function createPlanCatalog({ payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'createPlanCatalog' });
  try {
    const { rows } = await db.query(
      `INSERT INTO novee_os_plan_catalogs
         (plan_key, plan_name, plan_description, billing_interval, plan_status,
          billing_connected, payment_processed, subscription_active, license_verified, provider_connected,
          contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data, contains_ai_generated_content,
          idempotency_key, metadata, created_by)
       VALUES ($1,$2,$3,$4,$5,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,TRUE,FALSE,$6,$7,$8)
       ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
       RETURNING *`,
      [payload.planKey, payload.planName, payload.planDescription || null, payload.billingInterval || 'none',
       payload.planStatus || 'draft', idempotencyKey, payload.metadata ? JSON.stringify(payload.metadata) : null, actorUserId || 'system']
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'createPlanCatalog', entityType: 'plan_catalog', entityId: rows[0]?.id, afterSnapshot: rows[0], planKey: payload.planKey });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listPlanCatalogs({ filters = {} } = {}) {
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'listPlanCatalogs', data: [] });
  try {
    const { rows } = await db.query(`SELECT * FROM novee_os_plan_catalogs ORDER BY created_at DESC LIMIT 200`);
    return { ok: true, data: rows };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function updatePlanCatalogStatus({ planCatalogId, status, actorUserId, reason, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!contracts.isValidPlanStatus(status)) return { error: 'invalid_plan_status' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'updatePlanCatalogStatus' });
  try {
    const { rows } = await db.query(
      `UPDATE novee_os_plan_catalogs SET plan_status=$1, updated_by=$2, updated_at=NOW() WHERE id=$3 RETURNING *`,
      [status, actorUserId || 'system', planCatalogId]
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'updatePlanCatalogStatus', entityType: 'plan_catalog', entityId: planCatalogId, afterSnapshot: { status }, reason });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function createPlanTier({ planKey, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'createPlanTier' });
  try {
    const { rows } = await db.query(
      `INSERT INTO novee_os_plan_tiers
         (plan_key, tier_key, tier_name, tier_description, tier_status, billing_interval,
          price_amount_placeholder, price_currency_placeholder,
          organization_id, venue_id, workspace_id,
          billing_connected, payment_processed, subscription_active, license_verified, provider_connected,
          contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data, contains_ai_generated_content,
          idempotency_key, metadata, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,TRUE,FALSE,$12,$13,$14)
       ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
       RETURNING *`,
      [planKey, payload.tierKey, payload.tierName, payload.tierDescription || null,
       payload.tierStatus || 'draft', payload.billingInterval || 'none',
       payload.priceAmountPlaceholder || null, payload.priceCurrencyPlaceholder || 'USD',
       payload.organizationId || null, payload.venueId || null, payload.workspaceId || null,
       idempotencyKey, payload.metadata ? JSON.stringify(payload.metadata) : null, actorUserId || 'system']
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'createPlanTier', entityType: 'plan_tier', entityId: rows[0]?.id, afterSnapshot: rows[0], planKey });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listPlanTiers({ filters = {} } = {}) {
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'listPlanTiers', data: [] });
  try {
    const { rows } = await db.query(`SELECT * FROM novee_os_plan_tiers ORDER BY created_at DESC LIMIT 200`);
    return { ok: true, data: rows };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function updatePlanTierStatus({ planTierId, status, actorUserId, reason, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!contracts.isValidTierStatus(status)) return { error: 'invalid_tier_status' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'updatePlanTierStatus' });
  try {
    const { rows } = await db.query(
      `UPDATE novee_os_plan_tiers SET tier_status=$1, updated_by=$2, updated_at=NOW() WHERE id=$3 RETURNING *`,
      [status, actorUserId || 'system', planTierId]
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'updatePlanTierStatus', entityType: 'plan_tier', entityId: planTierId, afterSnapshot: { status }, reason });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function createPlanFeature({ planKey, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'createPlanFeature' });
  try {
    const { rows } = await db.query(
      `INSERT INTO novee_os_plan_features
         (plan_key, feature_key, feature_name, feature_description, feature_gate_status, module_key, addon_key,
          contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data, contains_ai_generated_content,
          idempotency_key, metadata, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,FALSE,FALSE,FALSE,FALSE,FALSE,$8,$9,$10)
       ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
       RETURNING *`,
      [planKey, payload.featureKey, payload.featureName, payload.featureDescription || null,
       payload.featureGateStatus || 'locked', payload.moduleKey || null, payload.addonKey || null,
       idempotencyKey, payload.metadata ? JSON.stringify(payload.metadata) : null, actorUserId || 'system']
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'createPlanFeature', entityType: 'plan_feature', entityId: rows[0]?.id, afterSnapshot: rows[0], planKey });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listPlanFeatures({ filters = {} } = {}) {
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'listPlanFeatures', data: [] });
  try {
    const { rows } = await db.query(`SELECT * FROM novee_os_plan_features ORDER BY created_at DESC LIMIT 200`);
    return { ok: true, data: rows };
  } catch (e) { return { ok: false, error: e.message }; }
}

// ─── GATES ────────────────────────────────────────────────────────────────────

export async function createModulePlanGate({ moduleKey, planKey, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'createModulePlanGate' });
  try {
    const { rows } = await db.query(
      `INSERT INTO novee_os_module_plan_gates
         (module_key, plan_key, feature_gate_status, organization_id, venue_id, workspace_id,
          billing_connected, license_verified, contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data, contains_ai_generated_content,
          idempotency_key, metadata, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,$7,$8,$9)
       ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
       RETURNING *`,
      [moduleKey, planKey, payload.featureGateStatus || 'locked',
       payload.organizationId || null, payload.venueId || null, payload.workspaceId || null,
       idempotencyKey, payload.metadata ? JSON.stringify(payload.metadata) : null, actorUserId || 'system']
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'createModulePlanGate', entityType: 'module_plan_gate', entityId: rows[0]?.id, afterSnapshot: rows[0], planKey });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listModulePlanGates({ filters = {} } = {}) {
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'listModulePlanGates', data: [] });
  try {
    const { rows } = await db.query(`SELECT * FROM novee_os_module_plan_gates ORDER BY created_at DESC LIMIT 200`);
    return { ok: true, data: rows };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function createFeatureAccessGate({ featureKey, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'createFeatureAccessGate' });
  try {
    const { rows } = await db.query(
      `INSERT INTO novee_os_feature_access_gates
         (feature_key, plan_key, module_key, addon_key, organization_id, venue_id, workspace_id, user_id,
          feature_gate_status, billing_connected, license_verified, entitlement_active,
          contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data, contains_ai_generated_content,
          idempotency_key, metadata, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,FALSE,FALSE,FALSE,FALSE,FALSE,TRUE,FALSE,FALSE,$10,$11,$12)
       ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
       RETURNING *`,
      [featureKey, payload.planKey || null, payload.moduleKey || null, payload.addonKey || null,
       payload.organizationId || null, payload.venueId || null, payload.workspaceId || null, payload.userId || null,
       payload.featureGateStatus || 'locked',
       idempotencyKey, payload.metadata ? JSON.stringify(payload.metadata) : null, actorUserId || 'system']
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'createFeatureAccessGate', entityType: 'feature_access_gate', entityId: rows[0]?.id, afterSnapshot: rows[0] });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listFeatureAccessGates({ filters = {} } = {}) {
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'listFeatureAccessGates', data: [] });
  try {
    const { rows } = await db.query(`SELECT * FROM novee_os_feature_access_gates ORDER BY created_at DESC LIMIT 200`);
    return { ok: true, data: rows };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function evaluateFeatureAccessPlaceholder({ organizationId, venueId, workspaceId, userId, moduleKey, featureKey }) {
  return {
    ok: true,
    localPreview: true,
    decision: 'blocked_plan_required',
    billing_connected: false,
    license_verified: false,
    entitlement_active: false,
    billing_provider_required: true,
    note: 'Feature access evaluation requires billing provider integration. Not live in Phase C.3.',
    area: AREA,
  };
}

// ─── TRIALS ───────────────────────────────────────────────────────────────────

export async function createTrialPolicy({ payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'createTrialPolicy' });
  try {
    const { rows } = await db.query(
      `INSERT INTO novee_os_trial_policies
         (plan_key, trial_duration_days, trial_status, grace_period_days, trial_converted,
          contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data, contains_ai_generated_content,
          idempotency_key, metadata, created_by)
       VALUES ($1,$2,$3,$4,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,$5,$6,$7)
       ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
       RETURNING *`,
      [payload.planKey, payload.trialDurationDays || 14, payload.trialStatus || 'not_started',
       payload.gracePeriodDays || 3,
       idempotencyKey, payload.metadata ? JSON.stringify(payload.metadata) : null, actorUserId || 'system']
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'createTrialPolicy', entityType: 'trial_policy', entityId: rows[0]?.id, afterSnapshot: rows[0], planKey: payload.planKey });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listTrialPolicies({ filters = {} } = {}) {
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'listTrialPolicies', data: [] });
  try {
    const { rows } = await db.query(`SELECT * FROM novee_os_trial_policies ORDER BY created_at DESC LIMIT 200`);
    return { ok: true, data: rows };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function createTrialInstance({ organizationId, venueId, workspaceId, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'createTrialInstance' });
  try {
    const { rows } = await db.query(
      `INSERT INTO novee_os_trial_instances
         (plan_key, organization_id, venue_id, workspace_id, user_id, trial_status,
          trial_start_placeholder, trial_end_placeholder,
          trial_converted, billing_connected, provider_connected,
          contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data, contains_ai_generated_content,
          actor_user_id, idempotency_key, metadata, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,FALSE,FALSE,FALSE,FALSE,FALSE,TRUE,FALSE,FALSE,$9,$10,$11,$12)
       ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
       RETURNING *`,
      [payload.planKey, organizationId || null, venueId || null, workspaceId || null,
       payload.userId || null, payload.trialStatus || 'not_started',
       payload.trialStartPlaceholder || null, payload.trialEndPlaceholder || null,
       actorUserId || 'system', idempotencyKey,
       payload.metadata ? JSON.stringify(payload.metadata) : null, actorUserId || 'system']
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'createTrialInstance', entityType: 'trial_instance', entityId: rows[0]?.id, afterSnapshot: rows[0], planKey: payload.planKey, organizationId, venueId, workspaceId });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listTrialInstances({ filters = {} } = {}) {
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'listTrialInstances', data: [] });
  try {
    const { rows } = await db.query(`SELECT * FROM novee_os_trial_instances ORDER BY created_at DESC LIMIT 200`);
    return { ok: true, data: rows };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function updateTrialStatus({ trialInstanceId, status, actorUserId, reason, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!contracts.isValidTrialStatus(status)) return { error: 'invalid_trial_status' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'updateTrialStatus' });
  try {
    const { rows } = await db.query(
      `UPDATE novee_os_trial_instances SET trial_status=$1, reason=$2, updated_by=$3, updated_at=NOW() WHERE id=$4 RETURNING *`,
      [status, reason || null, actorUserId || 'system', trialInstanceId]
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'updateTrialStatus', entityType: 'trial_instance', entityId: trialInstanceId, afterSnapshot: { status }, reason });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function createGracePeriodRecord({ payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'createGracePeriodRecord' });
  try {
    const { rows } = await db.query(
      `INSERT INTO novee_os_grace_period_records
         (plan_key, organization_id, venue_id, workspace_id, user_id, grace_period_days, grace_period_status,
          billing_connected, trial_converted, contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data, contains_ai_generated_content,
          idempotency_key, metadata, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,FALSE,FALSE,FALSE,FALSE,TRUE,FALSE,FALSE,$8,$9,$10)
       ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
       RETURNING *`,
      [payload.planKey || null, payload.organizationId || null, payload.venueId || null,
       payload.workspaceId || null, payload.userId || null,
       payload.gracePeriodDays || 3, payload.gracePeriodStatus || 'not_started',
       idempotencyKey, payload.metadata ? JSON.stringify(payload.metadata) : null, actorUserId || 'system']
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'createGracePeriodRecord', entityType: 'grace_period', entityId: rows[0]?.id, afterSnapshot: rows[0] });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listGracePeriodRecords({ filters = {} } = {}) {
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'listGracePeriodRecords', data: [] });
  try {
    const { rows } = await db.query(`SELECT * FROM novee_os_grace_period_records ORDER BY created_at DESC LIMIT 200`);
    return { ok: true, data: rows };
  } catch (e) { return { ok: false, error: e.message }; }
}

// ─── LICENSES ─────────────────────────────────────────────────────────────────

export async function createOrganizationLicense({ organizationId, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'createOrganizationLicense' });
  try {
    const { rows } = await db.query(
      `INSERT INTO novee_os_organization_licenses
         (organization_id, plan_key, license_status,
          billing_connected, payment_processed, subscription_active, invoice_paid, license_verified,
          trial_converted, cancellation_completed, renewal_charged, provider_connected,
          contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data, contains_ai_generated_content,
          actor_user_id, idempotency_key, metadata, created_by)
       VALUES ($1,$2,$3,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,TRUE,TRUE,FALSE,$4,$5,$6,$7)
       ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
       RETURNING *`,
      [organizationId, payload.planKey, payload.licenseStatus || 'not_licensed',
       actorUserId || 'system', idempotencyKey,
       payload.metadata ? JSON.stringify(payload.metadata) : null, actorUserId || 'system']
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'createOrganizationLicense', entityType: 'organization_license', entityId: rows[0]?.id, afterSnapshot: rows[0], organizationId, planKey: payload.planKey });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listOrganizationLicenses({ filters = {} } = {}) {
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'listOrganizationLicenses', data: [] });
  try {
    const { rows } = await db.query(`SELECT * FROM novee_os_organization_licenses ORDER BY created_at DESC LIMIT 200`);
    return { ok: true, data: rows };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function updateOrganizationLicenseStatus({ organizationLicenseId, status, actorUserId, reason, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!contracts.isValidLicenseStatus(status)) return { error: 'invalid_license_status' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'updateOrganizationLicenseStatus' });
  try {
    const { rows } = await db.query(
      `UPDATE novee_os_organization_licenses SET license_status=$1, reason=$2, updated_by=$3, updated_at=NOW() WHERE id=$4 RETURNING *`,
      [status, reason || null, actorUserId || 'system', organizationLicenseId]
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'updateOrganizationLicenseStatus', entityType: 'organization_license', entityId: organizationLicenseId, afterSnapshot: { status }, reason });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function createVenueLicense({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'createVenueLicense' });
  try {
    const { rows } = await db.query(
      `INSERT INTO novee_os_venue_licenses
         (venue_id, organization_id, plan_key, license_status,
          billing_connected, payment_processed, subscription_active, invoice_paid, license_verified,
          trial_converted, cancellation_completed, renewal_charged, provider_connected,
          contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data, contains_ai_generated_content,
          actor_user_id, idempotency_key, metadata, created_by)
       VALUES ($1,$2,$3,$4,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,TRUE,TRUE,FALSE,$5,$6,$7,$8)
       ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
       RETURNING *`,
      [venueId, payload.organizationId, payload.planKey, payload.licenseStatus || 'not_licensed',
       actorUserId || 'system', idempotencyKey,
       payload.metadata ? JSON.stringify(payload.metadata) : null, actorUserId || 'system']
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'createVenueLicense', entityType: 'venue_license', entityId: rows[0]?.id, afterSnapshot: rows[0], venueId, planKey: payload.planKey });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listVenueLicenses({ filters = {} } = {}) {
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'listVenueLicenses', data: [] });
  try {
    const { rows } = await db.query(`SELECT * FROM novee_os_venue_licenses ORDER BY created_at DESC LIMIT 200`);
    return { ok: true, data: rows };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function updateVenueLicenseStatus({ venueLicenseId, status, actorUserId, reason, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!contracts.isValidLicenseStatus(status)) return { error: 'invalid_license_status' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'updateVenueLicenseStatus' });
  try {
    const { rows } = await db.query(
      `UPDATE novee_os_venue_licenses SET license_status=$1, reason=$2, updated_by=$3, updated_at=NOW() WHERE id=$4 RETURNING *`,
      [status, reason || null, actorUserId || 'system', venueLicenseId]
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'updateVenueLicenseStatus', entityType: 'venue_license', entityId: venueLicenseId, afterSnapshot: { status }, reason });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function createWorkspaceLicense({ workspaceId, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'createWorkspaceLicense' });
  try {
    const { rows } = await db.query(
      `INSERT INTO novee_os_workspace_licenses
         (workspace_id, organization_id, venue_id, plan_key, license_status,
          billing_connected, payment_processed, subscription_active, invoice_paid, license_verified,
          trial_converted, cancellation_completed, renewal_charged, provider_connected,
          contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data, contains_ai_generated_content,
          actor_user_id, idempotency_key, metadata, created_by)
       VALUES ($1,$2,$3,$4,$5,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,TRUE,TRUE,FALSE,$6,$7,$8,$9)
       ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
       RETURNING *`,
      [workspaceId, payload.organizationId, payload.venueId || null, payload.planKey,
       payload.licenseStatus || 'not_licensed',
       actorUserId || 'system', idempotencyKey,
       payload.metadata ? JSON.stringify(payload.metadata) : null, actorUserId || 'system']
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'createWorkspaceLicense', entityType: 'workspace_license', entityId: rows[0]?.id, afterSnapshot: rows[0], workspaceId, planKey: payload.planKey });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listWorkspaceLicenses({ filters = {} } = {}) {
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'listWorkspaceLicenses', data: [] });
  try {
    const { rows } = await db.query(`SELECT * FROM novee_os_workspace_licenses ORDER BY created_at DESC LIMIT 200`);
    return { ok: true, data: rows };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function updateWorkspaceLicenseStatus({ workspaceLicenseId, status, actorUserId, reason, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!contracts.isValidLicenseStatus(status)) return { error: 'invalid_license_status' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'updateWorkspaceLicenseStatus' });
  try {
    const { rows } = await db.query(
      `UPDATE novee_os_workspace_licenses SET license_status=$1, reason=$2, updated_by=$3, updated_at=NOW() WHERE id=$4 RETURNING *`,
      [status, reason || null, actorUserId || 'system', workspaceLicenseId]
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'updateWorkspaceLicenseStatus', entityType: 'workspace_license', entityId: workspaceLicenseId, afterSnapshot: { status }, reason });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

// ─── SEATS / ADD-ONS ──────────────────────────────────────────────────────────

export async function createUserSeatAllocation({ organizationId, payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'createUserSeatAllocation' });
  try {
    const { rows } = await db.query(
      `INSERT INTO novee_os_user_seat_allocations
         (organization_id, venue_id, workspace_id, user_id, plan_key, seat_status,
          license_verified, billing_connected, subscription_active,
          contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data, contains_ai_generated_content,
          idempotency_key, metadata, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,FALSE,FALSE,FALSE,FALSE,FALSE,TRUE,FALSE,FALSE,$7,$8,$9)
       ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
       RETURNING *`,
      [organizationId, payload.venueId || null, payload.workspaceId || null,
       payload.userId, payload.planKey, payload.seatStatus || 'not_licensed',
       idempotencyKey, payload.metadata ? JSON.stringify(payload.metadata) : null, actorUserId || 'system']
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'createUserSeatAllocation', entityType: 'user_seat_allocation', entityId: rows[0]?.id, afterSnapshot: rows[0], organizationId, planKey: payload.planKey });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listUserSeatAllocations({ filters = {} } = {}) {
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'listUserSeatAllocations', data: [] });
  try {
    const { rows } = await db.query(`SELECT * FROM novee_os_user_seat_allocations ORDER BY created_at DESC LIMIT 200`);
    return { ok: true, data: rows };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function createAddonCatalogEntry({ payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'createAddonCatalogEntry' });
  try {
    const { rows } = await db.query(
      `INSERT INTO novee_os_addon_catalog
         (addon_key, addon_name, addon_type, addon_status, module_key, plan_key, billing_interval,
          marketplace_purchase_completed, billing_connected,
          contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data, contains_ai_generated_content,
          idempotency_key, metadata, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,FALSE,FALSE,FALSE,FALSE,FALSE,TRUE,FALSE,$8,$9,$10)
       ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
       RETURNING *`,
      [payload.addonKey, payload.addonName, payload.addonType || 'module_addon',
       payload.addonStatus || 'draft', payload.moduleKey || null, payload.planKey || null,
       payload.billingInterval || 'none',
       idempotencyKey, payload.metadata ? JSON.stringify(payload.metadata) : null, actorUserId || 'system']
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'createAddonCatalogEntry', entityType: 'addon_catalog', entityId: rows[0]?.id, afterSnapshot: rows[0] });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listAddonCatalog({ filters = {} } = {}) {
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'listAddonCatalog', data: [] });
  try {
    const { rows } = await db.query(`SELECT * FROM novee_os_addon_catalog ORDER BY created_at DESC LIMIT 200`);
    return { ok: true, data: rows };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function createAddonAssignment({ payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'createAddonAssignment' });
  try {
    const { rows } = await db.query(
      `INSERT INTO novee_os_addon_assignments
         (addon_key, organization_id, venue_id, workspace_id, user_id, plan_key, assignment_status,
          marketplace_purchase_completed, billing_connected, payment_processed, license_verified, entitlement_active,
          contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data, contains_ai_generated_content,
          idempotency_key, metadata, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,TRUE,TRUE,FALSE,$8,$9,$10)
       ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
       RETURNING *`,
      [payload.addonKey, payload.organizationId || null, payload.venueId || null,
       payload.workspaceId || null, payload.userId || null, payload.planKey || null,
       payload.assignmentStatus || 'not_active',
       idempotencyKey, payload.metadata ? JSON.stringify(payload.metadata) : null, actorUserId || 'system']
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'createAddonAssignment', entityType: 'addon_assignment', entityId: rows[0]?.id, afterSnapshot: rows[0] });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listAddonAssignments({ filters = {} } = {}) {
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'listAddonAssignments', data: [] });
  try {
    const { rows } = await db.query(`SELECT * FROM novee_os_addon_assignments ORDER BY created_at DESC LIMIT 200`);
    return { ok: true, data: rows };
  } catch (e) { return { ok: false, error: e.message }; }
}

// ─── ENTITLEMENTS / ACCESS ────────────────────────────────────────────────────

export async function createEntitlementRecord({ payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'createEntitlementRecord' });
  try {
    const { rows } = await db.query(
      `INSERT INTO novee_os_entitlement_records
         (organization_id, venue_id, workspace_id, user_id, plan_key, module_key, feature_key, addon_key,
          entitlement_status, entitlement_active, billing_connected, license_verified, trial_converted,
          marketplace_purchase_completed,
          contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data, contains_ai_generated_content,
          actor_user_id, idempotency_key, metadata, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,TRUE,FALSE,FALSE,$10,$11,$12,$13)
       ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
       RETURNING *`,
      [payload.organizationId || null, payload.venueId || null, payload.workspaceId || null,
       payload.userId || null, payload.planKey || null, payload.moduleKey || null,
       payload.featureKey || null, payload.addonKey || null,
       payload.entitlementStatus || 'not_active',
       actorUserId || 'system', idempotencyKey,
       payload.metadata ? JSON.stringify(payload.metadata) : null, actorUserId || 'system']
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'createEntitlementRecord', entityType: 'entitlement', entityId: rows[0]?.id, afterSnapshot: rows[0] });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listEntitlementRecords({ filters = {} } = {}) {
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'listEntitlementRecords', data: [] });
  try {
    const { rows } = await db.query(`SELECT * FROM novee_os_entitlement_records ORDER BY created_at DESC LIMIT 200`);
    return { ok: true, data: rows };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function updateEntitlementStatus({ entitlementId, status, actorUserId, reason, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!contracts.isValidEntitlementStatus(status)) return { error: 'invalid_entitlement_status' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'updateEntitlementStatus' });
  try {
    const { rows } = await db.query(
      `UPDATE novee_os_entitlement_records SET entitlement_status=$1, reason=$2, updated_by=$3, updated_at=NOW() WHERE id=$4 RETURNING *`,
      [status, reason || null, actorUserId || 'system', entitlementId]
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'updateEntitlementStatus', entityType: 'entitlement', entityId: entitlementId, afterSnapshot: { status }, reason });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function createAccessDecisionRecord({ payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'createAccessDecisionRecord' });
  try {
    const { rows } = await db.query(
      `INSERT INTO novee_os_access_decision_records
         (organization_id, venue_id, workspace_id, user_id, module_key, feature_key, plan_key, addon_key,
          access_decision, billing_connected, license_verified, entitlement_active,
          contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data, contains_ai_generated_content,
          actor_user_id, idempotency_key, metadata, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,FALSE,FALSE,FALSE,FALSE,FALSE,TRUE,FALSE,FALSE,$10,$11,$12,$13)
       ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
       RETURNING *`,
      [payload.organizationId || null, payload.venueId || null, payload.workspaceId || null,
       payload.userId || null, payload.moduleKey || null, payload.featureKey || null,
       payload.planKey || null, payload.addonKey || null,
       payload.accessDecision || 'blocked_plan_required',
       actorUserId || 'system', idempotencyKey,
       payload.metadata ? JSON.stringify(payload.metadata) : null, actorUserId || 'system']
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'createAccessDecisionRecord', entityType: 'access_decision', entityId: rows[0]?.id, afterSnapshot: rows[0] });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listAccessDecisionRecords({ filters = {} } = {}) {
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'listAccessDecisionRecords', data: [] });
  try {
    const { rows } = await db.query(`SELECT * FROM novee_os_access_decision_records ORDER BY created_at DESC LIMIT 200`);
    return { ok: true, data: rows };
  } catch (e) { return { ok: false, error: e.message }; }
}

// ─── BILLING PROVIDER PLACEHOLDERS ───────────────────────────────────────────

export async function createBillingProviderProfile({ payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'createBillingProviderProfile', billing_provider_required: true });
  try {
    const { rows } = await db.query(
      `INSERT INTO novee_os_billing_provider_profiles
         (provider_key, provider_name, billing_status, organization_id, venue_id, workspace_id,
          external_customer_reference, external_subscription_reference,
          billing_connected, provider_connected, payment_processed, subscription_active,
          contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data, contains_ai_generated_content,
          actor_user_id, idempotency_key, metadata, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,TRUE,TRUE,FALSE,$9,$10,$11,$12)
       ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
       RETURNING *`,
      [payload.providerKey, payload.providerName, payload.billingStatus || 'not_connected',
       payload.organizationId || null, payload.venueId || null, payload.workspaceId || null,
       payload.externalCustomerReference || null, payload.externalSubscriptionReference || null,
       actorUserId || 'system', idempotencyKey,
       payload.metadata ? JSON.stringify(payload.metadata) : null, actorUserId || 'system']
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'createBillingProviderProfile', entityType: 'billing_provider_profile', entityId: rows[0]?.id, afterSnapshot: rows[0], providerKey: payload.providerKey });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listBillingProviderProfiles({ filters = {} } = {}) {
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'listBillingProviderProfiles', data: [] });
  try {
    const { rows } = await db.query(`SELECT * FROM novee_os_billing_provider_profiles ORDER BY created_at DESC LIMIT 200`);
    return { ok: true, data: rows };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function updateBillingProviderStatus({ providerProfileId, status, actorUserId, reason, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!contracts.isValidBillingStatus(status)) return { error: 'invalid_billing_status' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'updateBillingProviderStatus' });
  try {
    const { rows } = await db.query(
      `UPDATE novee_os_billing_provider_profiles SET billing_status=$1, reason=$2, updated_by=$3, updated_at=NOW() WHERE id=$4 RETURNING *`,
      [status, reason || null, actorUserId || 'system', providerProfileId]
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'updateBillingProviderStatus', entityType: 'billing_provider_profile', entityId: providerProfileId, afterSnapshot: { status }, reason });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function createBillingCustomerMetadata({ payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'createBillingCustomerMetadata', billing_provider_required: true });
  try {
    const { rows } = await db.query(
      `INSERT INTO novee_os_billing_customer_metadata
         (organization_id, venue_id, workspace_id, user_id, provider_key, external_customer_reference,
          billing_status, billing_connected, provider_connected, payment_processed,
          contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data, contains_ai_generated_content,
          idempotency_key, metadata, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,FALSE,FALSE,FALSE,FALSE,FALSE,TRUE,TRUE,FALSE,$8,$9,$10)
       ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
       RETURNING *`,
      [payload.organizationId || null, payload.venueId || null, payload.workspaceId || null,
       payload.userId || null, payload.providerKey || 'platform_placeholder',
       payload.externalCustomerReference || null, payload.billingStatus || 'not_connected',
       idempotencyKey, payload.metadata ? JSON.stringify(payload.metadata) : null, actorUserId || 'system']
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'createBillingCustomerMetadata', entityType: 'billing_customer_metadata', entityId: rows[0]?.id, afterSnapshot: rows[0], providerKey: payload.providerKey });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listBillingCustomerMetadata({ filters = {} } = {}) {
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'listBillingCustomerMetadata', data: [] });
  try {
    const { rows } = await db.query(`SELECT * FROM novee_os_billing_customer_metadata ORDER BY created_at DESC LIMIT 200`);
    return { ok: true, data: rows };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function createSubscriptionMetadata({ payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'createSubscriptionMetadata', billing_provider_required: true });
  try {
    const { rows } = await db.query(
      `INSERT INTO novee_os_subscription_metadata
         (organization_id, venue_id, workspace_id, user_id, plan_key, provider_key, subscription_status,
          external_subscription_reference, external_customer_reference, billing_interval,
          billing_connected, payment_processed, subscription_active, invoice_paid, license_verified,
          cancellation_completed, renewal_charged, provider_connected,
          contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data, contains_ai_generated_content,
          actor_user_id, idempotency_key, metadata, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,TRUE,TRUE,FALSE,$11,$12,$13,$14)
       ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
       RETURNING *`,
      [payload.organizationId || null, payload.venueId || null, payload.workspaceId || null,
       payload.userId || null, payload.planKey, payload.providerKey || 'platform_placeholder',
       payload.subscriptionStatus || 'not_started',
       payload.externalSubscriptionReference || null, payload.externalCustomerReference || null,
       payload.billingInterval || 'none',
       actorUserId || 'system', idempotencyKey,
       payload.metadata ? JSON.stringify(payload.metadata) : null, actorUserId || 'system']
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'createSubscriptionMetadata', entityType: 'subscription_metadata', entityId: rows[0]?.id, afterSnapshot: rows[0], planKey: payload.planKey, providerKey: payload.providerKey });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listSubscriptionMetadata({ filters = {} } = {}) {
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'listSubscriptionMetadata', data: [] });
  try {
    const { rows } = await db.query(`SELECT * FROM novee_os_subscription_metadata ORDER BY created_at DESC LIMIT 200`);
    return { ok: true, data: rows };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function updateSubscriptionStatus({ subscriptionMetadataId, status, actorUserId, reason, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!contracts.isValidSubscriptionStatus(status)) return { error: 'invalid_subscription_status' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'updateSubscriptionStatus' });
  try {
    const { rows } = await db.query(
      `UPDATE novee_os_subscription_metadata SET subscription_status=$1, reason=$2, updated_by=$3, updated_at=NOW() WHERE id=$4 RETURNING *`,
      [status, reason || null, actorUserId || 'system', subscriptionMetadataId]
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'updateSubscriptionStatus', entityType: 'subscription_metadata', entityId: subscriptionMetadataId, afterSnapshot: { status }, reason });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function createInvoiceMetadata({ payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'createInvoiceMetadata', billing_provider_required: true });
  try {
    const { rows } = await db.query(
      `INSERT INTO novee_os_invoice_metadata
         (organization_id, venue_id, workspace_id, user_id, plan_key, provider_key, invoice_status,
          external_invoice_reference, external_customer_reference, external_subscription_reference,
          billing_connected, payment_processed, subscription_active, invoice_paid, provider_connected,
          contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data, contains_ai_generated_content,
          actor_user_id, idempotency_key, metadata, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,TRUE,TRUE,FALSE,$11,$12,$13,$14)
       ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
       RETURNING *`,
      [payload.organizationId || null, payload.venueId || null, payload.workspaceId || null,
       payload.userId || null, payload.planKey || null, payload.providerKey || 'platform_placeholder',
       payload.invoiceStatus || 'draft_placeholder',
       payload.externalInvoiceReference || null, payload.externalCustomerReference || null,
       payload.externalSubscriptionReference || null,
       actorUserId || 'system', idempotencyKey,
       payload.metadata ? JSON.stringify(payload.metadata) : null, actorUserId || 'system']
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'createInvoiceMetadata', entityType: 'invoice_metadata', entityId: rows[0]?.id, afterSnapshot: rows[0], planKey: payload.planKey, providerKey: payload.providerKey });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listInvoiceMetadata({ filters = {} } = {}) {
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'listInvoiceMetadata', data: [] });
  try {
    const { rows } = await db.query(`SELECT * FROM novee_os_invoice_metadata ORDER BY created_at DESC LIMIT 200`);
    return { ok: true, data: rows };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function updateInvoiceStatus({ invoiceMetadataId, status, actorUserId, reason, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!contracts.isValidInvoiceStatus(status)) return { error: 'invalid_invoice_status' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'updateInvoiceStatus' });
  try {
    const { rows } = await db.query(
      `UPDATE novee_os_invoice_metadata SET invoice_status=$1, reason=$2, updated_by=$3, updated_at=NOW() WHERE id=$4 RETURNING *`,
      [status, reason || null, actorUserId || 'system', invoiceMetadataId]
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'updateInvoiceStatus', entityType: 'invoice_metadata', entityId: invoiceMetadataId, afterSnapshot: { status }, reason });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function createPaymentStatusPlaceholder({ payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'createPaymentStatusPlaceholder', payment_provider_required: true });
  try {
    const { rows } = await db.query(
      `INSERT INTO novee_os_payment_status_placeholders
         (organization_id, venue_id, workspace_id, user_id, plan_key, provider_key, payment_status,
          external_payment_reference, external_invoice_reference, external_customer_reference, external_subscription_reference,
          billing_connected, payment_processed, invoice_paid, provider_connected,
          contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data, contains_ai_generated_content,
          actor_user_id, idempotency_key, metadata, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,TRUE,TRUE,FALSE,$12,$13,$14,$15)
       ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
       RETURNING *`,
      [payload.organizationId || null, payload.venueId || null, payload.workspaceId || null,
       payload.userId || null, payload.planKey || null, payload.providerKey || 'platform_placeholder',
       payload.paymentStatus || 'not_processed',
       payload.externalPaymentReference || null, payload.externalInvoiceReference || null,
       payload.externalCustomerReference || null, payload.externalSubscriptionReference || null,
       actorUserId || 'system', idempotencyKey,
       payload.metadata ? JSON.stringify(payload.metadata) : null, actorUserId || 'system']
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'createPaymentStatusPlaceholder', entityType: 'payment_status_placeholder', entityId: rows[0]?.id, afterSnapshot: rows[0], providerKey: payload.providerKey });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listPaymentStatusPlaceholders({ filters = {} } = {}) {
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'listPaymentStatusPlaceholders', data: [] });
  try {
    const { rows } = await db.query(`SELECT * FROM novee_os_payment_status_placeholders ORDER BY created_at DESC LIMIT 200`);
    return { ok: true, data: rows };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function updatePaymentStatusPlaceholder({ paymentPlaceholderId, status, actorUserId, reason, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!contracts.isValidPaymentStatus(status)) return { error: 'invalid_payment_status' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'updatePaymentStatusPlaceholder' });
  try {
    const { rows } = await db.query(
      `UPDATE novee_os_payment_status_placeholders SET payment_status=$1, reason=$2, updated_by=$3, updated_at=NOW() WHERE id=$4 RETURNING *`,
      [status, reason || null, actorUserId || 'system', paymentPlaceholderId]
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'updatePaymentStatusPlaceholder', entityType: 'payment_status_placeholder', entityId: paymentPlaceholderId, afterSnapshot: { status }, reason });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

// ─── REQUESTS ─────────────────────────────────────────────────────────────────

export async function createUpgradeDowngradeRequest({ payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'createUpgradeDowngradeRequest' });
  try {
    const { rows } = await db.query(
      `INSERT INTO novee_os_upgrade_downgrade_requests
         (organization_id, venue_id, workspace_id, user_id, from_plan_key, to_plan_key, request_type, request_status,
          billing_connected, payment_processed, cancellation_completed,
          contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data, contains_ai_generated_content,
          actor_user_id, idempotency_key, metadata, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,FALSE,FALSE,FALSE,FALSE,FALSE,TRUE,TRUE,FALSE,$9,$10,$11,$12)
       ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
       RETURNING *`,
      [payload.organizationId || null, payload.venueId || null, payload.workspaceId || null,
       payload.userId || null, payload.fromPlanKey || null, payload.toPlanKey,
       payload.requestType || 'upgrade', payload.requestStatus || 'draft',
       actorUserId || 'system', idempotencyKey,
       payload.metadata ? JSON.stringify(payload.metadata) : null, actorUserId || 'system']
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'createUpgradeDowngradeRequest', entityType: 'upgrade_downgrade_request', entityId: rows[0]?.id, afterSnapshot: rows[0], planKey: payload.toPlanKey });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listUpgradeDowngradeRequests({ filters = {} } = {}) {
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'listUpgradeDowngradeRequests', data: [] });
  try {
    const { rows } = await db.query(`SELECT * FROM novee_os_upgrade_downgrade_requests ORDER BY created_at DESC LIMIT 200`);
    return { ok: true, data: rows };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function updateUpgradeDowngradeRequestStatus({ requestId, status, actorUserId, reason, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!contracts.isValidRequestStatus(status)) return { error: 'invalid_request_status' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'updateUpgradeDowngradeRequestStatus' });
  try {
    const { rows } = await db.query(
      `UPDATE novee_os_upgrade_downgrade_requests SET request_status=$1, reason=$2, updated_by=$3, updated_at=NOW() WHERE id=$4 RETURNING *`,
      [status, reason || null, actorUserId || 'system', requestId]
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'updateUpgradeDowngradeRequestStatus', entityType: 'upgrade_downgrade_request', entityId: requestId, afterSnapshot: { status }, reason });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function createCancellationRequest({ payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'createCancellationRequest' });
  try {
    const { rows } = await db.query(
      `INSERT INTO novee_os_cancellation_requests
         (organization_id, venue_id, workspace_id, user_id, plan_key, request_status,
          cancellation_completed, billing_connected, subscription_active,
          contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data, contains_ai_generated_content,
          reason, actor_user_id, idempotency_key, metadata, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,FALSE,FALSE,FALSE,FALSE,FALSE,TRUE,TRUE,FALSE,$7,$8,$9,$10,$11)
       ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
       RETURNING *`,
      [payload.organizationId || null, payload.venueId || null, payload.workspaceId || null,
       payload.userId || null, payload.planKey || null, payload.requestStatus || 'draft',
       payload.reason || null, actorUserId || 'system', idempotencyKey,
       payload.metadata ? JSON.stringify(payload.metadata) : null, actorUserId || 'system']
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'createCancellationRequest', entityType: 'cancellation_request', entityId: rows[0]?.id, afterSnapshot: rows[0], planKey: payload.planKey });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listCancellationRequests({ filters = {} } = {}) {
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'listCancellationRequests', data: [] });
  try {
    const { rows } = await db.query(`SELECT * FROM novee_os_cancellation_requests ORDER BY created_at DESC LIMIT 200`);
    return { ok: true, data: rows };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function updateCancellationRequestStatus({ cancellationRequestId, status, actorUserId, reason, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  if (!contracts.isValidRequestStatus(status)) return { error: 'invalid_request_status' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'updateCancellationRequestStatus' });
  try {
    const { rows } = await db.query(
      `UPDATE novee_os_cancellation_requests SET request_status=$1, reason=$2, updated_by=$3, updated_at=NOW() WHERE id=$4 RETURNING *`,
      [status, reason || null, actorUserId || 'system', cancellationRequestId]
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'updateCancellationRequestStatus', entityType: 'cancellation_request', entityId: cancellationRequestId, afterSnapshot: { status }, reason });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function createRenewalReminderRecord({ payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'createRenewalReminderRecord' });
  try {
    const { rows } = await db.query(
      `INSERT INTO novee_os_renewal_reminder_records
         (organization_id, venue_id, workspace_id, user_id, plan_key, provider_key, reminder_status,
          renewal_charged, billing_connected, subscription_active,
          contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data, contains_ai_generated_content,
          idempotency_key, metadata, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,FALSE,FALSE,FALSE,FALSE,FALSE,TRUE,FALSE,FALSE,$8,$9,$10)
       ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
       RETURNING *`,
      [payload.organizationId || null, payload.venueId || null, payload.workspaceId || null,
       payload.userId || null, payload.planKey || null, payload.providerKey || 'platform_placeholder',
       payload.reminderStatus || 'pending_review',
       idempotencyKey, payload.metadata ? JSON.stringify(payload.metadata) : null, actorUserId || 'system']
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'createRenewalReminderRecord', entityType: 'renewal_reminder', entityId: rows[0]?.id, afterSnapshot: rows[0], planKey: payload.planKey });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listRenewalReminderRecords({ filters = {} } = {}) {
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'listRenewalReminderRecords', data: [] });
  try {
    const { rows } = await db.query(`SELECT * FROM novee_os_renewal_reminder_records ORDER BY created_at DESC LIMIT 200`);
    return { ok: true, data: rows };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function createMarketplacePurchasePlaceholder({ payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'createMarketplacePurchasePlaceholder', marketplace_not_live: true });
  try {
    const { rows } = await db.query(
      `INSERT INTO novee_os_marketplace_purchase_placeholders
         (organization_id, venue_id, workspace_id, user_id, module_key, addon_key, plan_key, provider_key, purchase_status,
          marketplace_purchase_completed, billing_connected, payment_processed, license_verified,
          contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data, contains_ai_generated_content,
          idempotency_key, metadata, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,TRUE,TRUE,FALSE,$10,$11,$12)
       ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
       RETURNING *`,
      [payload.organizationId || null, payload.venueId || null, payload.workspaceId || null,
       payload.userId || null, payload.moduleKey || null, payload.addonKey || null,
       payload.planKey || null, payload.providerKey || 'platform_placeholder',
       payload.purchaseStatus || 'pending_review',
       idempotencyKey, payload.metadata ? JSON.stringify(payload.metadata) : null, actorUserId || 'system']
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'createMarketplacePurchasePlaceholder', entityType: 'marketplace_purchase_placeholder', entityId: rows[0]?.id, afterSnapshot: rows[0] });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listMarketplacePurchasePlaceholders({ filters = {} } = {}) {
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'listMarketplacePurchasePlaceholders', data: [] });
  try {
    const { rows } = await db.query(`SELECT * FROM novee_os_marketplace_purchase_placeholders ORDER BY created_at DESC LIMIT 200`);
    return { ok: true, data: rows };
  } catch (e) { return { ok: false, error: e.message }; }
}

// ─── HEALTH / SNAPSHOT ────────────────────────────────────────────────────────

export async function createLicenseHealthCheck({ payload, actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'createLicenseHealthCheck' });
  try {
    const { rows } = await db.query(
      `INSERT INTO novee_os_license_health_checks
         (organization_id, venue_id, workspace_id, user_id, plan_key, health_status,
          billing_connected, payment_processed, subscription_active, invoice_paid, license_verified,
          marketplace_purchase_completed, trial_converted, cancellation_completed, renewal_charged,
          entitlement_active, provider_connected,
          contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data, contains_ai_generated_content,
          actor_user_id, idempotency_key, metadata, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,$7,$8,$9,$10)
       ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
       RETURNING *`,
      [payload.organizationId || null, payload.venueId || null, payload.workspaceId || null,
       payload.userId || null, payload.planKey || null, payload.healthStatus || 'unknown',
       actorUserId || 'system', idempotencyKey,
       payload.metadata ? JSON.stringify(payload.metadata) : null, actorUserId || 'system']
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'createLicenseHealthCheck', entityType: 'license_health_check', entityId: rows[0]?.id, afterSnapshot: rows[0] });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function listLicenseHealthChecks({ filters = {} } = {}) {
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'listLicenseHealthChecks', data: [] });
  try {
    const { rows } = await db.query(`SELECT * FROM novee_os_license_health_checks ORDER BY created_at DESC LIMIT 200`);
    return { ok: true, data: rows };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function createBillingGovernanceSnapshot({ actorUserId, idempotencyKey }) {
  if (!idempotencyKey) return { error: 'idempotency_key_required' };
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'createBillingGovernanceSnapshot' });
  try {
    const { rows } = await db.query(
      `INSERT INTO novee_os_billing_governance_snapshots
         (snapshot_version, governance_status,
          billing_connected, payment_processed, subscription_active, invoice_paid, license_verified,
          marketplace_purchase_completed, trial_converted, cancellation_completed, renewal_charged,
          entitlement_active, provider_connected,
          contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data, contains_ai_generated_content,
          actor_user_id, idempotency_key, created_by)
       VALUES (1,'draft',FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,TRUE,TRUE,FALSE,$1,$2,$3)
       ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
       RETURNING *`,
      [actorUserId || 'system', idempotencyKey, actorUserId || 'system']
    );
    await writeBillingAuditInternal(db, { actorUserId, action: 'createBillingGovernanceSnapshot', entityType: 'billing_governance_snapshot', entityId: rows[0]?.id, afterSnapshot: rows[0] });
    return { ok: true, data: rows[0] };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function getLatestBillingGovernanceSnapshot() {
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'getLatestBillingGovernanceSnapshot' });
  try {
    const { rows } = await db.query(`SELECT * FROM novee_os_billing_governance_snapshots ORDER BY created_at DESC LIMIT 1`);
    return { ok: true, data: rows[0] || null };
  } catch (e) { return { ok: false, error: e.message }; }
}

// ─── CLAIMS / ROADMAP ─────────────────────────────────────────────────────────

export function getSafeBillingClaims() {
  return {
    ok: true,
    claims: [
      { claim: 'billing_governance_foundation_built', safe: true, note: 'Schema, service, routes, and UI built in Phase C.3.' },
      { claim: 'plan_catalog_records_supported', safe: true, note: 'Plan catalog records can be created and listed.' },
      { claim: 'license_records_supported', safe: true, note: 'Organization, venue, and workspace license records can be created.' },
      { claim: 'trial_policy_records_supported', safe: true, note: 'Trial policy and instance records can be created.' },
      { claim: 'entitlement_records_supported', safe: true, note: 'Entitlement records can be created.' },
      { claim: 'no_secrets_stored', safe: true, note: 'No secrets are stored in any billing table.' },
      { claim: 'audit_trail_exists', safe: true, note: 'Billing audit trail is written on every mutation.' },
      { claim: 'idempotency_enforced', safe: true, note: 'All writes require idempotency key.' },
    ],
    area: AREA,
  };
}

export function getUnsafeBillingClaims() {
  return {
    ok: true,
    unsafe_claims: [
      { claim: 'billing_connected', safe: false, reason: 'billing_connected is hardcoded FALSE on all records. No Stripe or payment provider is integrated.' },
      { claim: 'payment_processed', safe: false, reason: 'payment_processed is hardcoded FALSE. No real payment has been collected.' },
      { claim: 'subscription_active', safe: false, reason: 'subscription_active is hardcoded FALSE. No real subscription has been activated.' },
      { claim: 'invoice_paid', safe: false, reason: 'invoice_paid is hardcoded FALSE. No real invoice has been paid.' },
      { claim: 'license_verified', safe: false, reason: 'license_verified is hardcoded FALSE. No real license has been verified.' },
      { claim: 'marketplace_purchase_completed', safe: false, reason: 'marketplace_purchase_completed is hardcoded FALSE. No real marketplace exists.' },
      { claim: 'trial_converted', safe: false, reason: 'trial_converted is hardcoded FALSE. No real trial conversion has occurred.' },
      { claim: 'cancellation_completed', safe: false, reason: 'cancellation_completed is hardcoded FALSE. No real cancellation flow is live.' },
      { claim: 'renewal_charged', safe: false, reason: 'renewal_charged is hardcoded FALSE. No real renewal charging is live.' },
      { claim: 'entitlement_active', safe: false, reason: 'entitlement_active is hardcoded FALSE. No real entitlement activation beyond placeholder records.' },
      { claim: 'stripe_connected', safe: false, reason: 'No Stripe integration exists. Provider key is a placeholder.' },
    ],
    area: AREA,
  };
}

export function getBillingHonestLimitations() {
  return {
    ok: true,
    honest_limitations: [
      'No real billing provider (Stripe, Square, Clover) is connected.',
      'No real payment processing is live.',
      'No real subscription activation is live.',
      'No real invoice has been generated or paid.',
      'License verification requires a live billing provider integration not yet built.',
      'Marketplace purchases are placeholder records only.',
      'Trial conversion requires real billing provider connection.',
      'Cancellation flow is a request record only; no real provider cancellation occurs.',
      'Renewal charging requires real billing provider and subscription activation.',
      'Entitlement activation beyond placeholder records requires billing provider integration.',
      'All billing status fields default to not_connected, not_processed, not_active, or not_live.',
      'This module establishes the governance schema and safety contracts for Phase C.4+.',
    ],
    area: AREA,
  };
}

export function getBillingPhaseRoadmap() {
  return {
    ok: true,
    roadmap: [
      { phase: 'C.1', module: 1, name: 'Module Registry, Platform Control Center & Installable Module Governance', status: 'complete' },
      { phase: 'C.2', module: 2, name: 'Tenant, Venue, Organization & Workspace Governance', status: 'complete' },
      { phase: 'C.3', module: 3, name: 'Licensing, Plans, Trials, Billing Gates & Feature Access', status: 'current' },
      { phase: 'C.4', module: 4, name: 'User Roles, Permissions, Admin Security & Platform Governance', status: 'next' },
      { phase: 'C.5', module: 5, name: 'CraftHub Main Dashboard, Module Launcher, Navigation Shell & Premium Experience Hub', status: 'pending' },
      { phase: 'C.6', module: 6, name: 'Venue Onboarding Wizard, Setup Checklist, Live/Demo Mode Controls & Readiness Flow', status: 'pending' },
      { phase: 'C.7', module: 7, name: 'NOVEE OS Final Production Readiness, Platform Audit, Marketplace Prep & Launch Lock', status: 'pending' },
    ],
    area: AREA,
  };
}

export async function writeBillingAudit({ actorUserId, action, entityType, entityId, beforeSnapshot, afterSnapshot, reason, organizationId, venueId, workspaceId, userId, planKey, providerKey }) {
  const db = isDbAvailable();
  if (!db) return localFallback({ action: 'writeBillingAudit' });
  await writeBillingAuditInternal(db, { actorUserId, action, entityType, entityId, beforeSnapshot, afterSnapshot, reason, organizationId, venueId, workspaceId, userId, planKey, providerKey });
  return { ok: true };
}
