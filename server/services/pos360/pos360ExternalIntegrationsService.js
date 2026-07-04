/**
 * POS360 External Integrations Service — POS Overlay Connectors, Provider Contracts,
 * Webhooks, Sync Governance, Data Mapping, Import/Export, SmokeCraft Sync Visibility,
 * E.A.T. Sync Visibility, Data Lineage & Reconciliation.
 * Falls back gracefully when no database connection is configured.
 * Never prints or logs the database connection string.
 */

import { isDbAvailable, query } from '../../db/connection.js';

const AREA = 'pos360-external-integrations';
const LOCAL = (extra = {}) => ({ ok: false, localPreview: true, error: 'database_not_configured', area: AREA, ...extra });

async function auditRecord(vid, actor, action, target_type, target_id, meta = {}) {
  if (!isDbAvailable()) return;
  await query(
    `INSERT INTO pos360_integration_audit
       (venue_id, actor_id, action, target_type, target_id, meta,
        contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data)
     VALUES ($1,$2,$3,$4,$5,$6,FALSE,FALSE,TRUE,TRUE)`,
    [vid, actor, action, target_type, target_id, JSON.stringify(meta)]
  ).catch(() => {});
}

// ── Provider Profiles ────────────────────────────────────────────────────────

export async function listProviderProfiles(vid) {
  if (!isDbAvailable()) return LOCAL({ providers: [] });
  const r = await query('SELECT * FROM pos360_external_provider_profiles WHERE venue_id=$1 ORDER BY created_at DESC', [vid]);
  return { ok: true, providers: r.rows };
}

export async function getProviderProfile(vid, provider_id) {
  if (!isDbAvailable()) return LOCAL({ provider: null });
  const r = await query('SELECT * FROM pos360_external_provider_profiles WHERE id=$1 AND venue_id=$2', [provider_id, vid]);
  return { ok: true, provider: r.rows[0] || null };
}

export async function upsertProviderProfile(vid, actor, data) {
  if (!isDbAvailable()) return LOCAL();
  const { provider_key, provider_type, display_name, idempotency_key } = data;
  if (idempotency_key) {
    const dup = await query('SELECT id FROM pos360_external_provider_profiles WHERE idempotency_key=$1 AND venue_id=$2', [idempotency_key, vid]);
    if (dup.rows.length) return { ok: true, duplicate: true, id: dup.rows[0].id };
  }
  const r = await query(
    `INSERT INTO pos360_external_provider_profiles
       (venue_id, provider_key, provider_type, display_name, provider_connected,
        stores_secrets, contains_secrets, idempotency_key)
     VALUES ($1,$2,$3,$4,FALSE,FALSE,FALSE,$5)
     ON CONFLICT (venue_id, provider_key) DO UPDATE
       SET display_name=EXCLUDED.display_name, updated_at=NOW()
     RETURNING id`,
    [vid, provider_key, provider_type, display_name, idempotency_key || null]
  );
  await auditRecord(vid, actor, 'upsert_provider_profile', 'provider', r.rows[0].id, { provider_key, provider_connected: false, stores_secrets: false });
  return { ok: true, id: r.rows[0].id, provider_connected: false, stores_secrets: false };
}

export async function deleteProviderProfile(vid, actor, provider_id) {
  if (!isDbAvailable()) return LOCAL();
  await query('DELETE FROM pos360_external_provider_profiles WHERE id=$1 AND venue_id=$2', [provider_id, vid]);
  await auditRecord(vid, actor, 'delete_provider_profile', 'provider', provider_id);
  return { ok: true };
}

// ── POS Overlay Connectors ───────────────────────────────────────────────────

export async function listOverlayConnectors(vid) {
  if (!isDbAvailable()) return LOCAL({ connectors: [] });
  const r = await query('SELECT * FROM pos360_pos_overlay_connectors WHERE venue_id=$1 ORDER BY created_at DESC', [vid]);
  return { ok: true, connectors: r.rows };
}

export async function upsertOverlayConnector(vid, actor, data) {
  if (!isDbAvailable()) return LOCAL();
  const { provider_id, connector_type, overlay_mode, display_name, idempotency_key } = data;
  if (idempotency_key) {
    const dup = await query('SELECT id FROM pos360_pos_overlay_connectors WHERE idempotency_key=$1 AND venue_id=$2', [idempotency_key, vid]);
    if (dup.rows.length) return { ok: true, duplicate: true, id: dup.rows[0].id };
  }
  const r = await query(
    `INSERT INTO pos360_pos_overlay_connectors
       (venue_id, provider_id, connector_type, overlay_mode, display_name,
        connector_connected, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,FALSE,$6) RETURNING id`,
    [vid, provider_id, connector_type, overlay_mode, display_name, idempotency_key || null]
  );
  await auditRecord(vid, actor, 'upsert_overlay_connector', 'connector', r.rows[0].id, { connector_connected: false });
  return { ok: true, id: r.rows[0].id, connector_connected: false };
}

// ── Capability Registry ──────────────────────────────────────────────────────

export async function listCapabilities(vid, provider_id) {
  if (!isDbAvailable()) return LOCAL({ capabilities: [] });
  const r = await query('SELECT * FROM pos360_provider_capability_registry WHERE venue_id=$1 AND provider_id=$2', [vid, provider_id]);
  return { ok: true, capabilities: r.rows };
}

export async function upsertCapability(vid, actor, data) {
  if (!isDbAvailable()) return LOCAL();
  const { provider_id, capability_group, capability_key, supported_status } = data;
  const r = await query(
    `INSERT INTO pos360_provider_capability_registry
       (venue_id, provider_id, capability_group, capability_key, supported_status)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (venue_id, provider_id, capability_key) DO UPDATE
       SET supported_status=EXCLUDED.supported_status, updated_at=NOW()
     RETURNING id`,
    [vid, provider_id, capability_group, capability_key, supported_status]
  );
  await auditRecord(vid, actor, 'upsert_capability', 'capability', r.rows[0].id);
  return { ok: true, id: r.rows[0].id };
}

// ── Provider Readiness Results ───────────────────────────────────────────────

export async function listReadinessResults(vid, provider_id) {
  if (!isDbAvailable()) return LOCAL({ results: [] });
  const r = await query('SELECT * FROM pos360_provider_readiness_results WHERE venue_id=$1 AND provider_id=$2 ORDER BY created_at DESC', [vid, provider_id]);
  return { ok: true, results: r.rows };
}

export async function insertReadinessResult(vid, actor, data) {
  if (!isDbAvailable()) return LOCAL();
  const { provider_id, readiness_type, check_key, passed, detail } = data;
  const r = await query(
    `INSERT INTO pos360_provider_readiness_results
       (venue_id, provider_id, readiness_type, check_key, passed, detail, contains_secrets)
     VALUES ($1,$2,$3,$4,$5,$6,FALSE) RETURNING id`,
    [vid, provider_id, readiness_type, check_key, passed, detail]
  );
  await auditRecord(vid, actor, 'insert_readiness_result', 'readiness', r.rows[0].id, { contains_secrets: false });
  return { ok: true, id: r.rows[0].id, contains_secrets: false };
}

// ── Credential Metadata ──────────────────────────────────────────────────────

export async function listCredentialMetadata(vid) {
  if (!isDbAvailable()) return LOCAL({ credentials: [] });
  const r = await query('SELECT * FROM pos360_integration_credential_metadata WHERE venue_id=$1', [vid]);
  return { ok: true, credentials: r.rows };
}

export async function upsertCredentialMetadata(vid, actor, data) {
  if (!isDbAvailable()) return LOCAL();
  const { provider_id, credential_type, label, idempotency_key } = data;
  if (idempotency_key) {
    const dup = await query('SELECT id FROM pos360_integration_credential_metadata WHERE idempotency_key=$1 AND venue_id=$2', [idempotency_key, vid]);
    if (dup.rows.length) return { ok: true, duplicate: true, id: dup.rows[0].id };
  }
  const r = await query(
    `INSERT INTO pos360_integration_credential_metadata
       (venue_id, provider_id, credential_type, label, stores_secrets, contains_secrets, idempotency_key)
     VALUES ($1,$2,$3,$4,FALSE,FALSE,$5) RETURNING id`,
    [vid, provider_id, credential_type, label, idempotency_key || null]
  );
  await auditRecord(vid, actor, 'upsert_credential_metadata', 'credential', r.rows[0].id, { stores_secrets: false, contains_secrets: false });
  return { ok: true, id: r.rows[0].id, stores_secrets: false, contains_secrets: false };
}

// ── Webhook Endpoints ────────────────────────────────────────────────────────

export async function listWebhookEndpoints(vid) {
  if (!isDbAvailable()) return LOCAL({ endpoints: [] });
  const r = await query('SELECT * FROM pos360_webhook_endpoint_contracts WHERE venue_id=$1 ORDER BY created_at DESC', [vid]);
  return { ok: true, endpoints: r.rows };
}

export async function upsertWebhookEndpoint(vid, actor, data) {
  if (!isDbAvailable()) return LOCAL();
  const { provider_id, webhook_type, endpoint_url, event_types, idempotency_key } = data;
  if (idempotency_key) {
    const dup = await query('SELECT id FROM pos360_webhook_endpoint_contracts WHERE idempotency_key=$1 AND venue_id=$2', [idempotency_key, vid]);
    if (dup.rows.length) return { ok: true, duplicate: true, id: dup.rows[0].id };
  }
  const r = await query(
    `INSERT INTO pos360_webhook_endpoint_contracts
       (venue_id, provider_id, webhook_type, endpoint_url, event_types,
        signature_verified, webhook_verified, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,FALSE,FALSE,$6) RETURNING id`,
    [vid, provider_id, webhook_type, endpoint_url, JSON.stringify(event_types || []), idempotency_key || null]
  );
  await auditRecord(vid, actor, 'upsert_webhook_endpoint', 'webhook_endpoint', r.rows[0].id, { webhook_verified: false, signature_verified: false });
  return { ok: true, id: r.rows[0].id, webhook_verified: false, signature_verified: false };
}

export async function deleteWebhookEndpoint(vid, actor, endpoint_id) {
  if (!isDbAvailable()) return LOCAL();
  await query('DELETE FROM pos360_webhook_endpoint_contracts WHERE id=$1 AND venue_id=$2', [endpoint_id, vid]);
  await auditRecord(vid, actor, 'delete_webhook_endpoint', 'webhook_endpoint', endpoint_id);
  return { ok: true };
}

// ── Webhook Intake Log ───────────────────────────────────────────────────────

export async function listWebhookEvents(vid, filters = {}) {
  if (!isDbAvailable()) return LOCAL({ events: [] });
  const r = await query('SELECT * FROM pos360_webhook_event_intake_log WHERE venue_id=$1 ORDER BY received_at DESC LIMIT 100', [vid]);
  return { ok: true, events: r.rows };
}

export async function insertWebhookEvent(vid, data) {
  if (!isDbAvailable()) return LOCAL();
  const { endpoint_id, event_type, source_system, payload_hash } = data;
  const r = await query(
    `INSERT INTO pos360_webhook_event_intake_log
       (venue_id, endpoint_id, event_type, source_system, payload_hash,
        signature_verified, webhook_verified)
     VALUES ($1,$2,$3,$4,$5,FALSE,FALSE) RETURNING id`,
    [vid, endpoint_id, event_type, source_system, payload_hash]
  );
  return { ok: true, id: r.rows[0].id, webhook_verified: false, signature_verified: false };
}

// ── Sync Job Definitions ─────────────────────────────────────────────────────

export async function listSyncJobDefinitions(vid) {
  if (!isDbAvailable()) return LOCAL({ jobs: [] });
  const r = await query('SELECT * FROM pos360_sync_job_definitions WHERE venue_id=$1 ORDER BY created_at DESC', [vid]);
  return { ok: true, jobs: r.rows };
}

export async function upsertSyncJobDefinition(vid, actor, data) {
  if (!isDbAvailable()) return LOCAL();
  const { provider_id, module_key, sync_type, source_system, target_system, idempotency_key } = data;
  if (idempotency_key) {
    const dup = await query('SELECT id FROM pos360_sync_job_definitions WHERE idempotency_key=$1 AND venue_id=$2', [idempotency_key, vid]);
    if (dup.rows.length) return { ok: true, duplicate: true, id: dup.rows[0].id };
  }
  const r = await query(
    `INSERT INTO pos360_sync_job_definitions
       (venue_id, provider_id, module_key, sync_type, source_system, target_system, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [vid, provider_id, module_key, sync_type, source_system, target_system, idempotency_key || null]
  );
  await auditRecord(vid, actor, 'upsert_sync_job', 'sync_job', r.rows[0].id);
  return { ok: true, id: r.rows[0].id };
}

// ── Sync Job Runs ────────────────────────────────────────────────────────────

export async function listSyncJobRuns(vid, job_id) {
  if (!isDbAvailable()) return LOCAL({ runs: [] });
  const r = await query('SELECT * FROM pos360_sync_job_runs WHERE venue_id=$1 AND job_id=$2 ORDER BY started_at DESC LIMIT 50', [vid, job_id]);
  return { ok: true, runs: r.rows };
}

export async function insertSyncJobRun(vid, actor, data) {
  if (!isDbAvailable()) return LOCAL();
  const { job_id, run_status, records_attempted, records_succeeded, records_failed } = data;
  const r = await query(
    `INSERT INTO pos360_sync_job_runs
       (venue_id, job_id, run_status, records_attempted, records_succeeded, records_failed, sync_completed)
     VALUES ($1,$2,$3,$4,$5,$6,FALSE) RETURNING id`,
    [vid, job_id, run_status, records_attempted || 0, records_succeeded || 0, records_failed || 0]
  );
  await auditRecord(vid, actor, 'insert_sync_run', 'sync_run', r.rows[0].id, { sync_completed: false });
  return { ok: true, id: r.rows[0].id, sync_completed: false };
}

// ── Retry Policies ───────────────────────────────────────────────────────────

export async function listRetryPolicies(vid) {
  if (!isDbAvailable()) return LOCAL({ policies: [] });
  const r = await query('SELECT * FROM pos360_sync_retry_policies WHERE venue_id=$1', [vid]);
  return { ok: true, policies: r.rows };
}

export async function upsertRetryPolicy(vid, actor, data) {
  if (!isDbAvailable()) return LOCAL();
  const { job_id, retry_strategy, max_retries, base_delay_ms } = data;
  const r = await query(
    `INSERT INTO pos360_sync_retry_policies
       (venue_id, job_id, retry_strategy, max_retries, base_delay_ms)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (venue_id, job_id) DO UPDATE
       SET retry_strategy=EXCLUDED.retry_strategy, max_retries=EXCLUDED.max_retries,
           base_delay_ms=EXCLUDED.base_delay_ms, updated_at=NOW()
     RETURNING id`,
    [vid, job_id, retry_strategy, max_retries || 3, base_delay_ms || 1000]
  );
  await auditRecord(vid, actor, 'upsert_retry_policy', 'retry_policy', r.rows[0].id);
  return { ok: true, id: r.rows[0].id };
}

// ── Sync Error Logs ──────────────────────────────────────────────────────────

export async function listSyncErrors(vid, run_id) {
  if (!isDbAvailable()) return LOCAL({ errors: [] });
  const r = await query('SELECT * FROM pos360_sync_error_logs WHERE venue_id=$1 AND run_id=$2 ORDER BY created_at DESC', [vid, run_id]);
  return { ok: true, errors: r.rows };
}

export async function insertSyncError(vid, data) {
  if (!isDbAvailable()) return LOCAL();
  const { run_id, error_code, error_message, record_ref } = data;
  const r = await query(
    `INSERT INTO pos360_sync_error_logs (venue_id, run_id, error_code, error_message, record_ref)
     VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [vid, run_id, error_code, error_message, record_ref]
  );
  return { ok: true, id: r.rows[0].id };
}

// ── Conflict Records ─────────────────────────────────────────────────────────

export async function listConflictRecords(vid, filters = {}) {
  if (!isDbAvailable()) return LOCAL({ conflicts: [] });
  const r = await query('SELECT * FROM pos360_sync_conflict_records WHERE venue_id=$1 ORDER BY created_at DESC LIMIT 100', [vid]);
  return { ok: true, conflicts: r.rows };
}

export async function insertConflictRecord(vid, actor, data) {
  if (!isDbAvailable()) return LOCAL();
  const { run_id, conflict_type, local_value, remote_value, record_ref } = data;
  const r = await query(
    `INSERT INTO pos360_sync_conflict_records
       (venue_id, run_id, conflict_type, conflict_status, local_value, remote_value, record_ref)
     VALUES ($1,$2,$3,'open',$4,$5,$6) RETURNING id`,
    [vid, run_id, conflict_type, JSON.stringify(local_value || {}), JSON.stringify(remote_value || {}), record_ref]
  );
  await auditRecord(vid, actor, 'insert_conflict', 'conflict', r.rows[0].id);
  return { ok: true, id: r.rows[0].id };
}

export async function resolveConflict(vid, actor, conflict_id, conflict_status) {
  if (!isDbAvailable()) return LOCAL();
  await query('UPDATE pos360_sync_conflict_records SET conflict_status=$1, updated_at=NOW() WHERE id=$2 AND venue_id=$3', [conflict_status, conflict_id, vid]);
  await auditRecord(vid, actor, 'resolve_conflict', 'conflict', conflict_id, { conflict_status });
  return { ok: true };
}

// ── Reconciliation Records ───────────────────────────────────────────────────

export async function listReconciliationRecords(vid) {
  if (!isDbAvailable()) return LOCAL({ records: [] });
  const r = await query('SELECT * FROM pos360_sync_reconciliation_records WHERE venue_id=$1 ORDER BY created_at DESC', [vid]);
  return { ok: true, records: r.rows };
}

export async function insertReconciliationRecord(vid, actor, data) {
  if (!isDbAvailable()) return LOCAL();
  const { job_id, reconciliation_type, records_matched, records_mismatched, idempotency_key } = data;
  if (idempotency_key) {
    const dup = await query('SELECT id FROM pos360_sync_reconciliation_records WHERE idempotency_key=$1 AND venue_id=$2', [idempotency_key, vid]);
    if (dup.rows.length) return { ok: true, duplicate: true, id: dup.rows[0].id };
  }
  const r = await query(
    `INSERT INTO pos360_sync_reconciliation_records
       (venue_id, job_id, reconciliation_type, records_matched, records_mismatched,
        reconciliation_completed, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,FALSE,$6) RETURNING id`,
    [vid, job_id, reconciliation_type, records_matched || 0, records_mismatched || 0, idempotency_key || null]
  );
  await auditRecord(vid, actor, 'insert_reconciliation', 'reconciliation', r.rows[0].id, { reconciliation_completed: false });
  return { ok: true, id: r.rows[0].id, reconciliation_completed: false };
}

// ── Data Mapping Profiles ────────────────────────────────────────────────────

export async function listMappingProfiles(vid) {
  if (!isDbAvailable()) return LOCAL({ profiles: [] });
  const r = await query('SELECT * FROM pos360_data_mapping_profiles WHERE venue_id=$1 ORDER BY created_at DESC', [vid]);
  return { ok: true, profiles: r.rows };
}

export async function upsertMappingProfile(vid, actor, data) {
  if (!isDbAvailable()) return LOCAL();
  const { provider_id, entity_type, display_name, idempotency_key } = data;
  if (idempotency_key) {
    const dup = await query('SELECT id FROM pos360_data_mapping_profiles WHERE idempotency_key=$1 AND venue_id=$2', [idempotency_key, vid]);
    if (dup.rows.length) return { ok: true, duplicate: true, id: dup.rows[0].id };
  }
  const r = await query(
    `INSERT INTO pos360_data_mapping_profiles
       (venue_id, provider_id, entity_type, display_name, idempotency_key)
     VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [vid, provider_id, entity_type, display_name, idempotency_key || null]
  );
  await auditRecord(vid, actor, 'upsert_mapping_profile', 'mapping_profile', r.rows[0].id);
  return { ok: true, id: r.rows[0].id };
}

// ── Data Mapping Rules ───────────────────────────────────────────────────────

export async function listMappingRules(vid, profile_id) {
  if (!isDbAvailable()) return LOCAL({ rules: [] });
  const r = await query('SELECT * FROM pos360_data_mapping_rules WHERE venue_id=$1 AND profile_id=$2', [vid, profile_id]);
  return { ok: true, rules: r.rows };
}

export async function upsertMappingRule(vid, actor, data) {
  if (!isDbAvailable()) return LOCAL();
  const { profile_id, source_field, target_field, transform_type } = data;
  const r = await query(
    `INSERT INTO pos360_data_mapping_rules
       (venue_id, profile_id, source_field, target_field, transform_type)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (venue_id, profile_id, source_field, target_field) DO UPDATE
       SET transform_type=EXCLUDED.transform_type, updated_at=NOW()
     RETURNING id`,
    [vid, profile_id, source_field, target_field, transform_type]
  );
  await auditRecord(vid, actor, 'upsert_mapping_rule', 'mapping_rule', r.rows[0].id);
  return { ok: true, id: r.rows[0].id };
}

// ── Import Batches ───────────────────────────────────────────────────────────

export async function listImportBatches(vid) {
  if (!isDbAvailable()) return LOCAL({ batches: [] });
  const r = await query('SELECT * FROM pos360_import_batch_records WHERE venue_id=$1 ORDER BY created_at DESC', [vid]);
  return { ok: true, batches: r.rows };
}

export async function insertImportBatch(vid, actor, data) {
  if (!isDbAvailable()) return LOCAL();
  const { provider_id, import_type, total_records, idempotency_key } = data;
  if (idempotency_key) {
    const dup = await query('SELECT id FROM pos360_import_batch_records WHERE idempotency_key=$1 AND venue_id=$2', [idempotency_key, vid]);
    if (dup.rows.length) return { ok: true, duplicate: true, id: dup.rows[0].id };
  }
  const r = await query(
    `INSERT INTO pos360_import_batch_records
       (venue_id, provider_id, import_type, total_records, import_completed, idempotency_key)
     VALUES ($1,$2,$3,$4,FALSE,$5) RETURNING id`,
    [vid, provider_id, import_type, total_records || 0, idempotency_key || null]
  );
  await auditRecord(vid, actor, 'insert_import_batch', 'import_batch', r.rows[0].id, { import_completed: false });
  return { ok: true, id: r.rows[0].id, import_completed: false };
}

// ── Export Batches ───────────────────────────────────────────────────────────

export async function listExportBatches(vid) {
  if (!isDbAvailable()) return LOCAL({ batches: [] });
  const r = await query('SELECT * FROM pos360_export_batch_records WHERE venue_id=$1 ORDER BY created_at DESC', [vid]);
  return { ok: true, batches: r.rows };
}

export async function insertExportBatch(vid, actor, data) {
  if (!isDbAvailable()) return LOCAL();
  const { provider_id, export_type, total_records, idempotency_key } = data;
  if (idempotency_key) {
    const dup = await query('SELECT id FROM pos360_export_batch_records WHERE idempotency_key=$1 AND venue_id=$2', [idempotency_key, vid]);
    if (dup.rows.length) return { ok: true, duplicate: true, id: dup.rows[0].id };
  }
  const r = await query(
    `INSERT INTO pos360_export_batch_records
       (venue_id, provider_id, export_type, total_records, export_completed, idempotency_key)
     VALUES ($1,$2,$3,$4,FALSE,$5) RETURNING id`,
    [vid, provider_id, export_type, total_records || 0, idempotency_key || null]
  );
  await auditRecord(vid, actor, 'insert_export_batch', 'export_batch', r.rows[0].id, { export_completed: false });
  return { ok: true, id: r.rows[0].id, export_completed: false };
}

// ── Data Lineage Records ─────────────────────────────────────────────────────

export async function listDataLineageRecords(vid, filters = {}) {
  if (!isDbAvailable()) return LOCAL({ lineage: [] });
  const r = await query('SELECT * FROM pos360_data_lineage_records WHERE venue_id=$1 ORDER BY created_at DESC LIMIT 200', [vid]);
  return { ok: true, lineage: r.rows };
}

export async function insertDataLineageRecord(vid, data) {
  if (!isDbAvailable()) return LOCAL();
  const { source_system, target_system, entity_type, entity_id, operation } = data;
  const r = await query(
    `INSERT INTO pos360_data_lineage_records
       (venue_id, source_system, target_system, entity_type, entity_id, operation)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [vid, source_system, target_system, entity_type, entity_id, operation]
  );
  return { ok: true, id: r.rows[0].id };
}

// ── E.A.T. Sync Visibility ───────────────────────────────────────────────────

export async function listEatSyncVisibility(vid) {
  if (!isDbAvailable()) return LOCAL({ records: [] });
  const r = await query('SELECT * FROM pos360_eat_sync_visibility_records WHERE venue_id=$1 ORDER BY created_at DESC', [vid]);
  return { ok: true, records: r.rows, contains_ai_generated_content: false };
}

export async function upsertEatSyncVisibility(vid, actor, data) {
  if (!isDbAvailable()) return LOCAL();
  const { module_key, visibility_type, display_label } = data;
  const r = await query(
    `INSERT INTO pos360_eat_sync_visibility_records
       (venue_id, module_key, visibility_type, display_label, contains_ai_generated_content)
     VALUES ($1,$2,$3,$4,FALSE)
     ON CONFLICT (venue_id, module_key, visibility_type) DO UPDATE
       SET display_label=EXCLUDED.display_label, updated_at=NOW()
     RETURNING id`,
    [vid, module_key, visibility_type, display_label]
  );
  await auditRecord(vid, actor, 'upsert_eat_visibility', 'eat_visibility', r.rows[0].id, { contains_ai_generated_content: false });
  return { ok: true, id: r.rows[0].id, contains_ai_generated_content: false };
}

// ── SmokeCraft Sync Visibility ───────────────────────────────────────────────

export async function listSmokecraftSyncVisibility(vid) {
  if (!isDbAvailable()) return LOCAL({ records: [] });
  const r = await query('SELECT * FROM pos360_smokecraft_sync_visibility_records WHERE venue_id=$1 ORDER BY created_at DESC', [vid]);
  return { ok: true, records: r.rows, sync_connected: false };
}

export async function upsertSmokecraftSyncVisibility(vid, actor, data) {
  if (!isDbAvailable()) return LOCAL();
  const { module_key, visibility_type, display_label } = data;
  const r = await query(
    `INSERT INTO pos360_smokecraft_sync_visibility_records
       (venue_id, module_key, visibility_type, display_label, sync_connected)
     VALUES ($1,$2,$3,$4,FALSE)
     ON CONFLICT (venue_id, module_key, visibility_type) DO UPDATE
       SET display_label=EXCLUDED.display_label, updated_at=NOW()
     RETURNING id`,
    [vid, module_key, visibility_type, display_label]
  );
  await auditRecord(vid, actor, 'upsert_smokecraft_visibility', 'smokecraft_visibility', r.rows[0].id, { sync_connected: false });
  return { ok: true, id: r.rows[0].id, sync_connected: false };
}

// ── Integration Offline Queue ────────────────────────────────────────────────

export async function listOfflineQueue(vid) {
  if (!isDbAvailable()) return LOCAL({ items: [] });
  const r = await query('SELECT * FROM pos360_integration_offline_queue WHERE venue_id=$1 AND processed=FALSE ORDER BY created_at ASC', [vid]);
  return { ok: true, items: r.rows };
}

export async function enqueueOfflineItem(vid, data) {
  if (!isDbAvailable()) return LOCAL();
  const { area, operation, payload } = data;
  const r = await query(
    `INSERT INTO pos360_integration_offline_queue (venue_id, area, operation, payload)
     VALUES ($1,$2,$3,$4) RETURNING id`,
    [vid, area, operation, JSON.stringify(payload || {})]
  );
  return { ok: true, id: r.rows[0].id };
}

export async function markOfflineItemProcessed(vid, item_id) {
  if (!isDbAvailable()) return LOCAL();
  await query('UPDATE pos360_integration_offline_queue SET processed=TRUE, processed_at=NOW() WHERE id=$1 AND venue_id=$2', [item_id, vid]);
  return { ok: true };
}

// ── Integration Audit Log ────────────────────────────────────────────────────

export async function listIntegrationAudit(vid, filters = {}) {
  if (!isDbAvailable()) return LOCAL({ entries: [] });
  const r = await query('SELECT * FROM pos360_integration_audit WHERE venue_id=$1 ORDER BY created_at DESC LIMIT 200', [vid]);
  return { ok: true, entries: r.rows };
}
