/**
 * CraftHub Onboarding Service — Phase C.6
 * Falls back gracefully when no database connection is configured.
 * Never prints or logs the database connection string.
 * contains_secrets: false, stores_secrets: false — hardcoded; audit rows never hold secrets
 */

import { isDbAvailable } from '../../db/connection.js';
import {
  ONBOARDING_STEP_KEYS,
  MODULE_SETUP_KEYS,
  isValidOnboardingStatus,
  isValidStepStatus,
  isValidSetupStatus,
  isValidReadinessStatus,
  isValidBlockerStatus,
  isValidActivationStatus,
  isValidDemoLiveMode,
  isValidProviderStatus,
  isValidOnboardingStepKey,
  isValidModuleSetupKey,
  isValidBlockerType,
} from './craftHubOnboardingContracts.js';
import { getCraftHubOnboardingFlags } from '../../config/craftHubOnboardingFeatureFlags.js';

const AREA = 'crafthub_onboarding';

const localFallback = (extra = {}) => ({
  ok: false,
  localPreview: true,
  error: 'database_not_configured',
  area: AREA,
  ...extra,
});

const requireIdempotency = (key) =>
  !key ? { ok: false, error: 'idempotency_key_required' } : null;

async function writeAudit(db, actorUserId, action, entityType, entityId, before, after, reason, ikey) {
  // contains_secrets: false, stores_secrets: false — hardcoded; audit rows never hold secrets
  try {
    await db.query(
      `INSERT INTO crafthub_onboarding_audit
        (actor_user_id, action, entity_type, entity_id, before_snapshot, after_snapshot, reason, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (idempotency_key) DO NOTHING`,
      [actorUserId, action, entityType, entityId, JSON.stringify(before || {}), JSON.stringify(after || {}), reason, ikey]
    );
  } catch (_) {
    // non-fatal — audit write failure does not block the operation
  }
}

// ── Default flows ───────────────────────────────────────────────────────────────

export function getDefaultVenueOnboardingFlow() {
  return {
    ok: true,
    flow: {
      area: AREA,
      phase: 'C6',
      module: '6 of 7',
      onboarding_completed: false,
      workspace_provisioned: false,
      venue_deployed: false,
      live_mode_enabled: false,
      status: 'not_started',
      flags: getCraftHubOnboardingFlags(),
      steps: getDefaultOnboardingSteps().steps,
      checklist: getDefaultSetupChecklist().checklist,
      launchReadiness: getDefaultLaunchReadinessChecklist().checklist,
    },
    localPreview: !isDbAvailable(),
  };
}

export function getDefaultOnboardingSteps() {
  return {
    ok: true,
    steps: ONBOARDING_STEP_KEYS.map((key, i) => ({
      step_key: key,
      step_order: i + 1,
      step_status: 'not_started',
      setup_status: 'not_started',
      is_required: true,
      module_installed: false,
      module_activated: false,
      live_mode_enabled: false,
    })),
  };
}

export function getDefaultSetupChecklist() {
  return {
    ok: true,
    checklist: [
      { key: 'org_name_set', label: 'Organization name configured', status: 'not_started', is_required: true },
      { key: 'venue_profile_set', label: 'Venue profile configured', status: 'not_started', is_required: true },
      { key: 'workspace_created', label: 'Workspace created (placeholder)', status: 'not_started', workspace_provisioned: false, is_required: true },
      { key: 'roles_defined', label: 'Roles and permissions defined', status: 'not_started', is_required: true },
      { key: 'modules_selected', label: 'Modules selected', status: 'not_started', module_installed: false, is_required: true },
      { key: 'payment_provider_placeholder', label: 'Payment provider placeholder configured', status: 'not_started', provider_connected: false, is_required: false },
      { key: 'billing_license_placeholder', label: 'Billing and license placeholder configured', status: 'not_started', billing_connected: false, license_verified: false, is_required: false },
      { key: 'inventory_setup', label: 'Inventory setup (placeholder)', status: 'not_started', inventory_sync_enabled: false, is_required: false },
      { key: 'menu_setup', label: 'Menu setup (placeholder)', status: 'not_started', menu_import_completed: false, is_required: false },
      { key: 'staff_invites_placeholder', label: 'Staff invites (placeholder)', status: 'not_started', staff_invite_delivered: false, is_required: false },
      { key: 'readiness_review', label: 'Readiness review completed', status: 'not_started', is_required: true },
    ],
  };
}

export function getDefaultLaunchReadinessChecklist() {
  return {
    ok: true,
    checklist: [
      { key: 'org_ready', label: 'Organization setup', ready: false, blocker: 'configuration_required' },
      { key: 'venue_ready', label: 'Venue profile setup', ready: false, blocker: 'configuration_required' },
      { key: 'workspace_ready', label: 'Workspace provisioned', ready: false, workspace_provisioned: false, blocker: 'activation_required' },
      { key: 'roles_ready', label: 'Roles configured', ready: false, blocker: 'role_required' },
      { key: 'modules_ready', label: 'Modules installed and activated', ready: false, module_installed: false, module_activated: false, blocker: 'activation_required' },
      { key: 'payment_ready', label: 'Payment provider connected', ready: false, provider_connected: false, blocker: 'provider_required' },
      { key: 'billing_ready', label: 'Billing and license verified', ready: false, billing_connected: false, license_verified: false, blocker: 'billing_required' },
      { key: 'venue_deployed', label: 'Venue deployed to production', ready: false, venue_deployed: false, blocker: 'activation_required' },
      { key: 'live_mode', label: 'Live mode enabled', ready: false, live_mode_enabled: false, blocker: 'activation_required' },
    ],
  };
}

// ── Sessions ────────────────────────────────────────────────────────────────────

export async function createOnboardingSession({ payload, actorUserId, idempotencyKey }) {
  const err = requireIdempotency(idempotencyKey);
  if (err) return err;
  if (!isDbAvailable()) return localFallback();
  const { organization_id, venue_id, workspace_id, user_id } = payload;
  const db = (await import('../../db/connection.js')).default;
  const result = await db.query(
    `INSERT INTO crafthub_onboarding_sessions (organization_id, venue_id, workspace_id, user_id, actor_user_id, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
    [organization_id, venue_id, workspace_id, user_id, actorUserId, idempotencyKey]
  );
  await writeAudit(db, actorUserId, 'onboarding_session.created', 'onboarding_session', result.rows[0]?.id, {}, { onboarding_completed: false }, null, idempotencyKey + '_aud');
  return { ok: true, session: result.rows[0] };
}

export async function listOnboardingSessions({ filters = {} }) {
  if (!isDbAvailable()) return localFallback({ sessions: [] });
  const db = (await import('../../db/connection.js')).default;
  const result = await db.query(`SELECT * FROM crafthub_onboarding_sessions ORDER BY created_at DESC LIMIT 50`);
  return { ok: true, sessions: result.rows };
}

export async function updateOnboardingSessionStatus({ onboardingSessionId, status, actorUserId, reason, idempotencyKey }) {
  const err = requireIdempotency(idempotencyKey);
  if (err) return err;
  if (!isDbAvailable()) return localFallback();
  if (!isValidOnboardingStatus(status)) return { ok: false, error: 'invalid_status' };
  const db = (await import('../../db/connection.js')).default;
  const result = await db.query(
    `UPDATE crafthub_onboarding_sessions SET onboarding_status=$1, updated_at=NOW(), updated_by=$2 WHERE id=$3 RETURNING *`,
    [status, actorUserId, onboardingSessionId]
  );
  await writeAudit(db, actorUserId, 'onboarding_session.status_updated', 'onboarding_session', onboardingSessionId, {}, { status }, reason, idempotencyKey);
  return { ok: true, session: result.rows[0] };
}

export async function createOnboardingStep({ payload, actorUserId, idempotencyKey }) {
  const err = requireIdempotency(idempotencyKey);
  if (err) return err;
  if (!isDbAvailable()) return localFallback();
  const { step_key, step_label, step_order, organization_id, venue_id } = payload;
  if (!isValidOnboardingStepKey(step_key)) return { ok: false, error: 'invalid_step_key' };
  const db = (await import('../../db/connection.js')).default;
  const result = await db.query(
    `INSERT INTO crafthub_onboarding_steps (organization_id, venue_id, step_key, step_label, step_order, created_by)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [organization_id, venue_id, step_key, step_label, step_order || 0, actorUserId]
  );
  return { ok: true, step: result.rows[0] };
}

export async function listOnboardingSteps({ filters = {} }) {
  if (!isDbAvailable()) return localFallback({ steps: getDefaultOnboardingSteps().steps });
  const db = (await import('../../db/connection.js')).default;
  const result = await db.query(`SELECT * FROM crafthub_onboarding_steps ORDER BY step_order ASC`);
  if (result.rows.length === 0) return { ok: true, steps: getDefaultOnboardingSteps().steps, source: 'defaults' };
  return { ok: true, steps: result.rows };
}

export async function createOnboardingStepProgress({ onboardingSessionId, stepKey, payload, actorUserId, idempotencyKey }) {
  const err = requireIdempotency(idempotencyKey);
  if (err) return err;
  if (!isDbAvailable()) return localFallback();
  if (!isValidOnboardingStepKey(stepKey)) return { ok: false, error: 'invalid_step_key' };
  const db = (await import('../../db/connection.js')).default;
  const result = await db.query(
    `INSERT INTO crafthub_onboarding_step_progress (onboarding_session_id, step_key, actor_user_id, organization_id, venue_id, workspace_id, user_id, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
    [onboardingSessionId, stepKey, actorUserId, payload.organization_id, payload.venue_id, payload.workspace_id, payload.user_id, idempotencyKey]
  );
  await writeAudit(db, actorUserId, 'step_progress.created', 'step_progress', result.rows[0]?.id, {}, { step_key: stepKey }, null, idempotencyKey + '_aud');
  return { ok: true, progress: result.rows[0] };
}

export async function listOnboardingStepProgress({ filters = {} }) {
  if (!isDbAvailable()) return localFallback({ progress: [] });
  const db = (await import('../../db/connection.js')).default;
  const result = await db.query(`SELECT * FROM crafthub_onboarding_step_progress ORDER BY created_at DESC LIMIT 100`);
  return { ok: true, progress: result.rows };
}

export async function updateOnboardingStepProgressStatus({ stepProgressId, status, actorUserId, reason, idempotencyKey }) {
  const err = requireIdempotency(idempotencyKey);
  if (err) return err;
  if (!isDbAvailable()) return localFallback();
  if (!isValidStepStatus(status)) return { ok: false, error: 'invalid_step_status' };
  const db = (await import('../../db/connection.js')).default;
  const result = await db.query(
    `UPDATE crafthub_onboarding_step_progress SET step_status=$1, updated_at=NOW(), updated_by=$2 WHERE id=$3 RETURNING *`,
    [status, actorUserId, stepProgressId]
  );
  await writeAudit(db, actorUserId, 'step_progress.status_updated', 'step_progress', stepProgressId, {}, { status }, reason, idempotencyKey);
  return { ok: true, progress: result.rows[0] };
}

// ── Checklist / Blockers ────────────────────────────────────────────────────────

export async function createChecklistItem({ payload, actorUserId, idempotencyKey }) {
  const err = requireIdempotency(idempotencyKey);
  if (err) return err;
  if (!isDbAvailable()) return localFallback();
  const { checklist_item_key, item_label, organization_id, venue_id, step_key } = payload;
  const db = (await import('../../db/connection.js')).default;
  const result = await db.query(
    `INSERT INTO crafthub_onboarding_checklist_items (checklist_item_key, item_label, organization_id, venue_id, step_key, actor_user_id, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
    [checklist_item_key, item_label, organization_id, venue_id, step_key, actorUserId, idempotencyKey]
  );
  return { ok: true, item: result.rows[0] };
}

export async function listChecklistItems({ filters = {} }) {
  if (!isDbAvailable()) return localFallback({ items: getDefaultSetupChecklist().checklist });
  const db = (await import('../../db/connection.js')).default;
  const result = await db.query(`SELECT * FROM crafthub_onboarding_checklist_items ORDER BY created_at ASC`);
  if (result.rows.length === 0) return { ok: true, items: getDefaultSetupChecklist().checklist, source: 'defaults' };
  return { ok: true, items: result.rows };
}

export async function updateChecklistItemStatus({ checklistItemId, status, actorUserId, reason, idempotencyKey }) {
  const err = requireIdempotency(idempotencyKey);
  if (err) return err;
  if (!isDbAvailable()) return localFallback();
  const db = (await import('../../db/connection.js')).default;
  const result = await db.query(
    `UPDATE crafthub_onboarding_checklist_items SET item_status=$1, updated_at=NOW(), updated_by=$2 WHERE id=$3 RETURNING *`,
    [status, actorUserId, checklistItemId]
  );
  await writeAudit(db, actorUserId, 'checklist_item.status_updated', 'checklist_item', checklistItemId, {}, { status }, reason, idempotencyKey);
  return { ok: true, item: result.rows[0] };
}

export async function createOnboardingBlocker({ payload, actorUserId, idempotencyKey }) {
  const err = requireIdempotency(idempotencyKey);
  if (err) return err;
  if (!isDbAvailable()) return localFallback();
  if (payload.blocker_type && !isValidBlockerType(payload.blocker_type)) return { ok: false, error: 'invalid_blocker_type' };
  const { blocker_key, blocker_type, blocker_label, organization_id, venue_id, step_key } = payload;
  const db = (await import('../../db/connection.js')).default;
  const result = await db.query(
    `INSERT INTO crafthub_onboarding_blockers (blocker_key, blocker_type, blocker_label, organization_id, venue_id, step_key, actor_user_id, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
    [blocker_key, blocker_type, blocker_label, organization_id, venue_id, step_key, actorUserId, idempotencyKey]
  );
  return { ok: true, blocker: result.rows[0] };
}

export async function listOnboardingBlockers({ filters = {} }) {
  if (!isDbAvailable()) return localFallback({ blockers: [] });
  const db = (await import('../../db/connection.js')).default;
  const result = await db.query(`SELECT * FROM crafthub_onboarding_blockers ORDER BY created_at DESC`);
  return { ok: true, blockers: result.rows };
}

export async function updateOnboardingBlockerStatus({ blockerId, status, actorUserId, reason, idempotencyKey }) {
  const err = requireIdempotency(idempotencyKey);
  if (err) return err;
  if (!isDbAvailable()) return localFallback();
  if (!isValidBlockerStatus(status)) return { ok: false, error: 'invalid_blocker_status' };
  const db = (await import('../../db/connection.js')).default;
  const result = await db.query(
    `UPDATE crafthub_onboarding_blockers SET blocker_status=$1, updated_at=NOW(), updated_by=$2 WHERE id=$3 RETURNING *`,
    [status, actorUserId, blockerId]
  );
  await writeAudit(db, actorUserId, 'blocker.status_updated', 'blocker', blockerId, {}, { status }, reason, idempotencyKey);
  return { ok: true, blocker: result.rows[0] };
}

export async function createActivationRequirement({ payload, actorUserId, idempotencyKey }) {
  const err = requireIdempotency(idempotencyKey);
  if (err) return err;
  if (!isDbAvailable()) return localFallback();
  const { requirement_key, requirement_label, requirement_type, organization_id, venue_id } = payload;
  const db = (await import('../../db/connection.js')).default;
  const result = await db.query(
    `INSERT INTO crafthub_onboarding_activation_requirements (requirement_key, requirement_label, requirement_type, organization_id, venue_id, actor_user_id, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
    [requirement_key, requirement_label, requirement_type, organization_id, venue_id, actorUserId, idempotencyKey]
  );
  return { ok: true, requirement: result.rows[0] };
}

export async function listActivationRequirements({ filters = {} }) {
  if (!isDbAvailable()) return localFallback({ requirements: [] });
  const db = (await import('../../db/connection.js')).default;
  const result = await db.query(`SELECT * FROM crafthub_onboarding_activation_requirements ORDER BY created_at DESC`);
  return { ok: true, requirements: result.rows };
}

// ── Setup records (generic pattern) ─────────────────────────────────────────────

async function createSetupRecord(tableName, stepKey, payload, actorUserId, idempotencyKey) {
  const err = requireIdempotency(idempotencyKey);
  if (err) return err;
  if (!isDbAvailable()) return localFallback();
  const { organization_id, venue_id, workspace_id, user_id } = payload;
  const db = (await import('../../db/connection.js')).default;
  const result = await db.query(
    `INSERT INTO ${tableName} (organization_id, venue_id, workspace_id, user_id, actor_user_id, step_key, metadata, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
    [organization_id, venue_id, workspace_id, user_id, actorUserId, stepKey, JSON.stringify(payload.metadata || {}), idempotencyKey]
  );
  await writeAudit(db, actorUserId, `${tableName}.created`, tableName, result.rows[0]?.id, {}, { step_key: stepKey }, null, idempotencyKey + '_aud');
  return { ok: true, record: result.rows[0] };
}

async function listSetupRecords(tableName, filters = {}) {
  if (!isDbAvailable()) return localFallback({ records: [] });
  const db = (await import('../../db/connection.js')).default;
  const result = await db.query(`SELECT * FROM ${tableName} ORDER BY created_at DESC LIMIT 50`);
  return { ok: true, records: result.rows };
}

export const createOrganizationSetup = ({ payload, actorUserId, idempotencyKey }) => createSetupRecord('crafthub_onboarding_organization_setup', 'organization_setup', payload, actorUserId, idempotencyKey);
export const listOrganizationSetup = ({ filters }) => listSetupRecords('crafthub_onboarding_organization_setup', filters);
export const createVenueSetup = ({ payload, actorUserId, idempotencyKey }) => createSetupRecord('crafthub_onboarding_venue_setup', 'venue_profile', payload, actorUserId, idempotencyKey);
export const listVenueSetup = ({ filters }) => listSetupRecords('crafthub_onboarding_venue_setup', filters);
export const createWorkspaceSetup = ({ payload, actorUserId, idempotencyKey }) => createSetupRecord('crafthub_onboarding_workspace_setup', 'workspace_setup', payload, actorUserId, idempotencyKey);
export const listWorkspaceSetup = ({ filters }) => listSetupRecords('crafthub_onboarding_workspace_setup', filters);
export const createBusinessUnitSetup = ({ payload, actorUserId, idempotencyKey }) => createSetupRecord('crafthub_onboarding_business_units', 'business_units', payload, actorUserId, idempotencyKey);
export const listBusinessUnitSetup = ({ filters }) => listSetupRecords('crafthub_onboarding_business_units', filters);
export const createDepartmentSetup = ({ payload, actorUserId, idempotencyKey }) => createSetupRecord('crafthub_onboarding_departments', 'departments', payload, actorUserId, idempotencyKey);
export const listDepartmentSetup = ({ filters }) => listSetupRecords('crafthub_onboarding_departments', filters);
export const createLocationSetup = ({ payload, actorUserId, idempotencyKey }) => createSetupRecord('crafthub_onboarding_locations', 'locations', payload, actorUserId, idempotencyKey);
export const listLocationSetup = ({ filters }) => listSetupRecords('crafthub_onboarding_locations', filters);
export const createRoleSetup = ({ payload, actorUserId, idempotencyKey }) => createSetupRecord('crafthub_onboarding_role_setup', 'roles_permissions', payload, actorUserId, idempotencyKey);
export const listRoleSetup = ({ filters }) => listSetupRecords('crafthub_onboarding_role_setup', filters);
export const createStaffInvitePlaceholder = ({ payload, actorUserId, idempotencyKey }) => createSetupRecord('crafthub_onboarding_staff_invites', 'staff_invites', payload, actorUserId, idempotencyKey);
export const listStaffInvitePlaceholders = ({ filters }) => listSetupRecords('crafthub_onboarding_staff_invites', filters);

// ── Module setup ─────────────────────────────────────────────────────────────────

export const createModuleSelection = ({ payload, actorUserId, idempotencyKey }) => createSetupRecord('crafthub_onboarding_module_selection', 'module_selection', payload, actorUserId, idempotencyKey);
export const listModuleSelections = ({ filters }) => listSetupRecords('crafthub_onboarding_module_selection', filters);
export const createModuleSetupStatus = ({ moduleKey, payload, actorUserId, idempotencyKey }) => createSetupRecord('crafthub_onboarding_module_setup_status', moduleKey, { ...payload, module_key: moduleKey }, actorUserId, idempotencyKey);
export const listModuleSetupStatuses = ({ filters }) => listSetupRecords('crafthub_onboarding_module_setup_status', filters);
export const createPOS360Setup = ({ payload, actorUserId, idempotencyKey }) => createSetupRecord('crafthub_onboarding_pos360_setup', 'pos360_setup', payload, actorUserId, idempotencyKey);
export const listPOS360Setup = ({ filters }) => listSetupRecords('crafthub_onboarding_pos360_setup', filters);
export const createSmokeCraftSetup = ({ payload, actorUserId, idempotencyKey }) => createSetupRecord('crafthub_onboarding_smokecraft_setup', 'smokecraft_setup', payload, actorUserId, idempotencyKey);
export const listSmokeCraftSetup = ({ filters }) => listSetupRecords('crafthub_onboarding_smokecraft_setup', filters);
export const createPourCraftSetup = ({ payload, actorUserId, idempotencyKey }) => createSetupRecord('crafthub_onboarding_pourcraft_setup', 'pourcraft_setup', payload, actorUserId, idempotencyKey);
export const listPourCraftSetup = ({ filters }) => listSetupRecords('crafthub_onboarding_pourcraft_setup', filters);
export const createEATSetup = ({ payload, actorUserId, idempotencyKey }) => createSetupRecord('crafthub_onboarding_eat_setup', 'eat_setup', payload, actorUserId, idempotencyKey);
export const listEATSetup = ({ filters }) => listSetupRecords('crafthub_onboarding_eat_setup', filters);
export const createPassportConnectionsSetup = ({ payload, actorUserId, idempotencyKey }) => createSetupRecord('crafthub_onboarding_passport_connections_setup', 'passport_connections_setup', payload, actorUserId, idempotencyKey);
export const listPassportConnectionsSetup = ({ filters }) => listSetupRecords('crafthub_onboarding_passport_connections_setup', filters);
export const createLoyaltyRewardsSetup = ({ payload, actorUserId, idempotencyKey }) => createSetupRecord('crafthub_onboarding_loyalty_rewards_setup', 'loyalty_rewards_setup', payload, actorUserId, idempotencyKey);
export const listLoyaltyRewardsSetup = ({ filters }) => listSetupRecords('crafthub_onboarding_loyalty_rewards_setup', filters);
export const createInventorySetup = ({ payload, actorUserId, idempotencyKey }) => createSetupRecord('crafthub_onboarding_inventory_setup', 'inventory_setup', payload, actorUserId, idempotencyKey);
export const listInventorySetup = ({ filters }) => listSetupRecords('crafthub_onboarding_inventory_setup', filters);
export const createMenuSetup = ({ payload, actorUserId, idempotencyKey }) => createSetupRecord('crafthub_onboarding_menu_setup', 'menu_setup', payload, actorUserId, idempotencyKey);
export const listMenuSetup = ({ filters }) => listSetupRecords('crafthub_onboarding_menu_setup', filters);
export const createFulfillmentAreaSetup = ({ payload, actorUserId, idempotencyKey }) => createSetupRecord('crafthub_onboarding_fulfillment_area_setup', 'fulfillment_areas', payload, actorUserId, idempotencyKey);
export const listFulfillmentAreaSetup = ({ filters }) => listSetupRecords('crafthub_onboarding_fulfillment_area_setup', filters);
export const createTablePatioSetup = ({ payload, actorUserId, idempotencyKey }) => createSetupRecord('crafthub_onboarding_table_patio_setup', 'tables_patio', payload, actorUserId, idempotencyKey);
export const listTablePatioSetup = ({ filters }) => listSetupRecords('crafthub_onboarding_table_patio_setup', filters);

// ── Provider placeholders ────────────────────────────────────────────────────────

export async function createPaymentProviderPlaceholder({ payload, actorUserId, idempotencyKey }) {
  const err = requireIdempotency(idempotencyKey);
  if (err) return err;
  if (!isDbAvailable()) return localFallback();
  const db = (await import('../../db/connection.js')).default;
  const result = await db.query(
    `INSERT INTO crafthub_onboarding_payment_provider_placeholders (organization_id, venue_id, workspace_id, user_id, actor_user_id, provider_key, provider_name, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
    [payload.organization_id, payload.venue_id, payload.workspace_id, payload.user_id, actorUserId, payload.provider_key || 'placeholder', payload.provider_name, idempotencyKey]
  );
  return { ok: true, record: result.rows[0], provider_connected: false, payment_processed: false, live_mode_enabled: false };
}

export const listPaymentProviderPlaceholders = ({ filters }) => listSetupRecords('crafthub_onboarding_payment_provider_placeholders', filters);

export async function createBillingLicensePlaceholder({ payload, actorUserId, idempotencyKey }) {
  const err = requireIdempotency(idempotencyKey);
  if (err) return err;
  if (!isDbAvailable()) return localFallback();
  const db = (await import('../../db/connection.js')).default;
  const result = await db.query(
    `INSERT INTO crafthub_onboarding_billing_license_placeholders (organization_id, venue_id, workspace_id, user_id, actor_user_id, billing_plan, license_tier, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
    [payload.organization_id, payload.venue_id, payload.workspace_id, payload.user_id, actorUserId, payload.billing_plan, payload.license_tier, idempotencyKey]
  );
  return { ok: true, record: result.rows[0], billing_connected: false, license_verified: false, live_mode_enabled: false };
}

export const listBillingLicensePlaceholders = ({ filters }) => listSetupRecords('crafthub_onboarding_billing_license_placeholders', filters);

export async function createSecurityPlaceholder({ payload, actorUserId, idempotencyKey }) {
  const err = requireIdempotency(idempotencyKey);
  if (err) return err;
  if (!isDbAvailable()) return localFallback();
  const db = (await import('../../db/connection.js')).default;
  const result = await db.query(
    `INSERT INTO crafthub_onboarding_security_placeholders (organization_id, venue_id, workspace_id, user_id, actor_user_id, security_feature, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
    [payload.organization_id, payload.venue_id, payload.workspace_id, payload.user_id, actorUserId, payload.security_feature, idempotencyKey]
  );
  return { ok: true, record: result.rows[0], provider_connected: false, live_mode_enabled: false };
}

export const listSecurityPlaceholders = ({ filters }) => listSetupRecords('crafthub_onboarding_security_placeholders', filters);

// ── Mode / readiness ──────────────────────────────────────────────────────────────

export async function createDemoLiveModeControl({ payload, actorUserId, idempotencyKey }) {
  const err = requireIdempotency(idempotencyKey);
  if (err) return err;
  if (!isDbAvailable()) return localFallback();
  const mode = payload.demo_live_mode || 'demo';
  if (!isValidDemoLiveMode(mode)) return { ok: false, error: 'invalid_mode' };
  const db = (await import('../../db/connection.js')).default;
  const result = await db.query(
    `INSERT INTO crafthub_onboarding_demo_live_mode_controls (organization_id, venue_id, workspace_id, user_id, actor_user_id, mode_key, demo_live_mode, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
    [payload.organization_id, payload.venue_id, payload.workspace_id, payload.user_id, actorUserId, payload.mode_key || 'default', mode, idempotencyKey]
  );
  return { ok: true, control: result.rows[0], live_mode_enabled: false };
}

export const listDemoLiveModeControls = ({ filters }) => listSetupRecords('crafthub_onboarding_demo_live_mode_controls', filters);

export async function updateDemoLiveModeControl({ modeControlId, mode, actorUserId, reason, idempotencyKey }) {
  const err = requireIdempotency(idempotencyKey);
  if (err) return err;
  if (!isDbAvailable()) return localFallback();
  if (!isValidDemoLiveMode(mode)) return { ok: false, error: 'invalid_mode' };
  const db = (await import('../../db/connection.js')).default;
  const result = await db.query(
    `UPDATE crafthub_onboarding_demo_live_mode_controls SET demo_live_mode=$1, updated_at=NOW(), updated_by=$2, reason=$3 WHERE id=$4 RETURNING *`,
    [mode, actorUserId, reason, modeControlId]
  );
  await writeAudit(db, actorUserId, 'mode_control.updated', 'mode_control', modeControlId, {}, { mode }, reason, idempotencyKey);
  return { ok: true, control: result.rows[0], live_mode_enabled: false };
}

export async function createReadinessScore({ payload, actorUserId, idempotencyKey }) {
  const err = requireIdempotency(idempotencyKey);
  if (err) return err;
  if (!isDbAvailable()) return localFallback();
  const db = (await import('../../db/connection.js')).default;
  const result = await db.query(
    `INSERT INTO crafthub_onboarding_readiness_scores (organization_id, venue_id, workspace_id, user_id, actor_user_id, readiness_status, score_percent, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
    [payload.organization_id, payload.venue_id, payload.workspace_id, payload.user_id, actorUserId, 'not_ready', 0, idempotencyKey]
  );
  return { ok: true, score: result.rows[0], onboarding_completed: false, workspace_provisioned: false, venue_deployed: false, live_mode_enabled: false };
}

export const listReadinessScores = ({ filters }) => listSetupRecords('crafthub_onboarding_readiness_scores', filters);

export async function createLaunchReadinessRecord({ payload, actorUserId, idempotencyKey }) {
  const err = requireIdempotency(idempotencyKey);
  if (err) return err;
  if (!isDbAvailable()) return localFallback();
  const db = (await import('../../db/connection.js')).default;
  const result = await db.query(
    `INSERT INTO crafthub_onboarding_launch_readiness_records (organization_id, venue_id, workspace_id, user_id, actor_user_id, readiness_status, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
    [payload.organization_id, payload.venue_id, payload.workspace_id, payload.user_id, actorUserId, 'not_ready', idempotencyKey]
  );
  return { ok: true, record: result.rows[0], onboarding_completed: false, venue_deployed: false, live_mode_enabled: false };
}

export const listLaunchReadinessRecords = ({ filters }) => listSetupRecords('crafthub_onboarding_launch_readiness_records', filters);

export function evaluateLaunchReadinessPlaceholder({ organizationId, venueId, workspaceId }) {
  return {
    ok: true,
    readiness_status: 'not_ready',
    onboarding_completed: false,
    workspace_provisioned: false,
    venue_deployed: false,
    provider_connected: false,
    billing_connected: false,
    license_verified: false,
    live_mode_enabled: false,
    blockers: ['activation_required', 'provider_required', 'billing_required'],
    message: 'placeholder — real launch readiness evaluation requires activation',
    localPreview: !isDbAvailable(),
  };
}

// ── Claims ────────────────────────────────────────────────────────────────────────

export async function createSafeClaimRecord({ payload, actorUserId, idempotencyKey }) {
  const err = requireIdempotency(idempotencyKey);
  if (err) return err;
  if (!isDbAvailable()) return localFallback();
  const db = (await import('../../db/connection.js')).default;
  const result = await db.query(
    `INSERT INTO crafthub_onboarding_safe_claim_records (claim_key, claim_text, claim_category, organization_id, venue_id, user_id, actor_user_id, is_placeholder, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE,$8) ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
    [payload.claim_key, payload.claim_text, payload.claim_category, payload.organization_id, payload.venue_id, payload.user_id, actorUserId, idempotencyKey]
  );
  return { ok: true, record: result.rows[0] };
}

export const listSafeClaimRecords = ({ filters }) => listSetupRecords('crafthub_onboarding_safe_claim_records', filters);

export async function createUnsafeClaimRecord({ payload, actorUserId, idempotencyKey }) {
  const err = requireIdempotency(idempotencyKey);
  if (err) return err;
  if (!isDbAvailable()) return localFallback();
  const db = (await import('../../db/connection.js')).default;
  const result = await db.query(
    `INSERT INTO crafthub_onboarding_unsafe_claim_records (claim_key, claim_text, claim_reason, organization_id, venue_id, user_id, actor_user_id, is_blocked, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE,$8) ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
    [payload.claim_key, payload.claim_text, payload.claim_reason, payload.organization_id, payload.venue_id, payload.user_id, actorUserId, idempotencyKey]
  );
  return { ok: true, record: result.rows[0] };
}

export const listUnsafeClaimRecords = ({ filters }) => listSetupRecords('crafthub_onboarding_unsafe_claim_records', filters);

export function getSafeOnboardingClaims() {
  return {
    ok: true,
    claims: [
      { key: 'onboarding_structure_built', text: 'Venue onboarding wizard structure is built and available as placeholder', is_placeholder: true },
      { key: 'checklist_available', text: 'Setup checklist is defined and available for local preview', is_placeholder: true },
      { key: 'steps_defined', text: '25 onboarding steps are defined', is_placeholder: true },
      { key: 'readiness_flow_present', text: 'Launch readiness flow is present in placeholder mode', is_placeholder: true },
      { key: 'module_6_of_7_complete', text: 'Phase C.6 / Module 6 of 7 built as local_preview placeholder', is_placeholder: true },
    ],
  };
}

export function getUnsafeOnboardingClaims() {
  return {
    ok: true,
    unsafe_claims: [
      { key: 'onboarding_complete', text: 'Onboarding is complete', reason: 'not live — onboarding_completed: false' },
      { key: 'workspace_provisioned', text: 'Workspace is provisioned', reason: 'not live — workspace_provisioned: false' },
      { key: 'venue_deployed', text: 'Venue is deployed to production', reason: 'not live — venue_deployed: false' },
      { key: 'module_installed', text: 'Module is installed', reason: 'not live — module_installed: false' },
      { key: 'module_activated', text: 'Module is activated', reason: 'not live — module_activated: false' },
      { key: 'provider_connected', text: 'Payment provider is connected', reason: 'not live — provider_connected: false' },
      { key: 'billing_connected', text: 'Billing is connected', reason: 'not live — billing_connected: false' },
      { key: 'license_verified', text: 'License is verified', reason: 'not live — license_verified: false' },
      { key: 'staff_invite_delivered', text: 'Staff invite was delivered', reason: 'not live — staff_invite_delivered: false' },
      { key: 'menu_import_completed', text: 'Menu import completed', reason: 'not live — menu_import_completed: false' },
      { key: 'inventory_sync_enabled', text: 'Inventory sync is enabled', reason: 'not live — inventory_sync_enabled: false' },
      { key: 'live_mode_enabled', text: 'Live mode is enabled', reason: 'not live — live_mode_enabled: false' },
    ],
  };
}

export function getOnboardingHonestLimitations() {
  return {
    ok: true,
    limitations: [
      'Venue onboarding is a placeholder — no real workspace has been provisioned',
      'No real venue has been deployed to production',
      'No real module installation or activation has occurred',
      'No real payment provider has been connected',
      'No real billing or license has been verified',
      'No real staff invite has been delivered',
      'No real menu has been imported',
      'No real inventory sync has been enabled',
      'Live mode is not enabled — all onboarding runs in local_preview or demo mode',
      'Onboarding completion state is placeholder only',
      'configuration_required for all external integrations',
      'activation_required for all live operations',
    ],
    onboarding_completed: false,
    workspace_provisioned: false,
    venue_deployed: false,
    live_mode_enabled: false,
  };
}

export function getOnboardingPhaseRoadmap() {
  return {
    ok: true,
    roadmap: [
      { phase: 'C1', module: '1 of 7', name: 'NOVEE OS Module Registry', status: 'complete' },
      { phase: 'C2', module: '2 of 7', name: 'Tenant / Venue / Workspace Governance', status: 'complete' },
      { phase: 'C3', module: '3 of 7', name: 'Licensing / Billing Gates', status: 'complete' },
      { phase: 'C4', module: '4 of 7', name: 'User Roles / Permissions / Security', status: 'complete' },
      { phase: 'C5', module: '5 of 7', name: 'CraftHub Launcher', status: 'complete' },
      { phase: 'C6', module: '6 of 7', name: 'Venue Onboarding', status: 'current' },
      { phase: 'C7', module: '7 of 7', name: 'Final Platform Launch Lock', status: 'next' },
    ],
  };
}

// ── Snapshots / Audit ─────────────────────────────────────────────────────────────

export async function createOnboardingSnapshot({ actorUserId, idempotencyKey }) {
  const err = requireIdempotency(idempotencyKey);
  if (err) return err;
  if (!isDbAvailable()) return localFallback();
  const db = (await import('../../db/connection.js')).default;
  const state = getDefaultVenueOnboardingFlow();
  const result = await db.query(
    `INSERT INTO crafthub_onboarding_snapshots (actor_user_id, snapshot_version, onboarding_state, contains_secrets, stores_secrets, idempotency_key)
     VALUES ($1,'1.0',$2,FALSE,FALSE,$3) ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
    [actorUserId, JSON.stringify(state), idempotencyKey]
  );
  return { ok: true, snapshot: result.rows[0] };
}

export async function getLatestOnboardingSnapshot() {
  if (!isDbAvailable()) return localFallback({ snapshot: null });
  const db = (await import('../../db/connection.js')).default;
  const result = await db.query(`SELECT * FROM crafthub_onboarding_snapshots ORDER BY created_at DESC LIMIT 1`);
  return { ok: true, snapshot: result.rows[0] || null };
}

export async function writeOnboardingAudit({ actorUserId, action, entityType, entityId, beforeSnapshot, afterSnapshot, reason }) {
  if (!isDbAvailable()) return localFallback();
  const db = (await import('../../db/connection.js')).default;
  await writeAudit(db, actorUserId, action, entityType, entityId, beforeSnapshot, afterSnapshot, reason, `${action}_${entityId}_${Date.now()}`);
  return { ok: true };
}
