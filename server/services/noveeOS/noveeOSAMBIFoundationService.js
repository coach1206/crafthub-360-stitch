// Phase E.8 — NOVEE OS AMBI Foundation Service
// SOFTWARE FOUNDATION ONLY — hardware_ready=false, live_telemetry=false, live_control=false

import { isDbAvailable, getDb } from '../../db/connection.js'
import AMBI_FLAGS from '../../config/noveeOSAMBIFoundationFeatureFlags.js'
import {
  DEFAULT_AMBI_DEVICES, DEFAULT_AMBI_FIRMWARE, DEFAULT_AMBI_HARDWARE_PROVIDERS,
  DEFAULT_AMBI_AURA_STATES, DEFAULT_AMBI_ENVIRONMENT_SIGNALS,
  DEFAULT_AMBI_CONSENT_RECORDS, DEFAULT_AMBI_PRESENCE_EVENTS,
  assertNoFakeAMBIHardwareClaims, assertNoFakeAMBITelemetryClaims,
  assertNoFakeAMBIPairingClaims, assertNoFakeAMBIFirmwareClaims,
  assertNoFakeAMBIProviderClaims, assertNoAMBIMedicalClaims,
  assertNoAMBIBiometricClaims, assertNoAMBIEmotionDetectionClaims,
  assertNoAMBISafetyMonitoringClaims, assertNoRawAMBISecrets,
  validateAMBIDevicePayload, validateAMBIPairingPayload,
  validateAMBIFirmwarePayload, validateAMBIHardwareProviderPayload,
  validateAMBIAuraStatePayload, validateAMBIEnvironmentSignalPayload,
  validateAMBIPrivacyConsentPayload, validateAMBIPresenceAccessEventPayload,
} from './noveeOSAMBIFoundationContracts.js'

const localFallback = (area) => ({ ok: false, localPreview: true, error: 'database_not_configured', area })

export async function getAMBIFoundationSummary({ tenantId = null } = {}) {
  return {
    ok: true,
    safety_status: 'BUILD_ONLY_NO_LIVE_AMBI',
    foundation_ready: false,
    hardware_ready: false,
    live_telemetry_enabled: false,
    live_device_control_enabled: false,
    live_pairing_enabled: false,
    live_automation_enabled: false,
    readiness_score: 0,
    blockers_count: 8,
    safe_claim: 'ambi_foundation_exists',
    device_count: DEFAULT_AMBI_DEVICES.length,
    aura_state_count: DEFAULT_AMBI_AURA_STATES.length,
    signal_count: DEFAULT_AMBI_ENVIRONMENT_SIGNALS.length,
    provider_count: DEFAULT_AMBI_HARDWARE_PROVIDERS.length,
    phase: 'E.8',
  }
}

export async function listAMBIDevices({ tenantId = null } = {}) {
  if (!(await isDbAvailable())) return { ok: true, localPreview: true, devices: DEFAULT_AMBI_DEVICES }
  try {
    const d = getDb()
    const q = tenantId
      ? 'SELECT id, device_key, device_name, device_type, device_status, hardware_ready, software_ready, connected, live_telemetry_enabled, live_control_enabled, consent_required, safe_claim, created_at FROM novee_os_ambi_device_registry WHERE tenant_id=$1 ORDER BY created_at DESC'
      : 'SELECT id, device_key, device_name, device_type, device_status, hardware_ready, software_ready, connected, live_telemetry_enabled, live_control_enabled, consent_required, safe_claim, created_at FROM novee_os_ambi_device_registry ORDER BY created_at DESC'
    const res = tenantId ? await d.query(q, [tenantId]) : await d.query(q)
    return { ok: true, devices: res.rows.length ? res.rows : DEFAULT_AMBI_DEVICES }
  } catch (e) { return { ok: true, localPreview: true, devices: DEFAULT_AMBI_DEVICES, error: e.message } }
}

export async function getAMBIDevice(id) {
  if (!(await isDbAvailable())) return localFallback('device')
  try {
    const res = await (getDb()).query('SELECT id, device_key, device_name, device_type, device_status, hardware_ready, software_ready, connected, live_telemetry_enabled, live_control_enabled, consent_required, safe_claim FROM novee_os_ambi_device_registry WHERE id=$1', [id])
    return { ok: true, device: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function createAMBIDevicePreview(payload, { actorId = 'system', ikey } = {}) {
  validateAMBIDevicePayload(payload)
  assertNoFakeAMBIHardwareClaims(payload)
  if (!(await isDbAvailable())) return { ok: true, localPreview: true, device: { ...payload, hardware_ready: false, connected: false, live_telemetry_enabled: false, live_control_enabled: false, safe_claim: 'ambi_device_record_exists' } }
  try {
    const d = getDb()
    const res = await d.query(
      `INSERT INTO novee_os_ambi_device_registry (device_key, device_name, device_type, device_status, hardware_ready, software_ready, connected, live_telemetry_enabled, live_control_enabled, consent_required, safe_claim)
       VALUES ($1,$2,$3,$4,FALSE,FALSE,FALSE,FALSE,FALSE,$5,'ambi_device_record_exists')
       ON CONFLICT (device_key) DO NOTHING RETURNING *`,
      [payload.device_key, payload.device_name, payload.device_type || 'unknown', payload.device_status || 'draft', payload.consent_required !== false]
    )
    return { ok: true, device: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function updateAMBIDeviceStatusPreview(id, payload, { actorId = 'system' } = {}) {
  assertNoFakeAMBIHardwareClaims(payload)
  assertNoFakeAMBITelemetryClaims(payload)
  if (!(await isDbAvailable())) return localFallback('device_status')
  try {
    await (getDb()).query('UPDATE novee_os_ambi_device_registry SET device_status=$1, updated_at=now() WHERE id=$2', [payload.device_status || 'draft', id])
    return { ok: true, updated: true }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function listAMBIDevicePairings({ tenantId = null } = {}) {
  if (!(await isDbAvailable())) return { ok: true, localPreview: true, pairings: [] }
  try {
    const d = getDb()
    // pairing_token_reference_only is not selected — tokens never exposed
    const q = tenantId
      ? 'SELECT id, ambi_device_id, pairing_status, pairing_mode, pairing_reference_only, paired_by_reference_only, paired_at, expires_at, live_pairing_enabled, safe_claim FROM novee_os_ambi_device_pairing_registry WHERE tenant_id=$1 ORDER BY created_at DESC'
      : 'SELECT id, ambi_device_id, pairing_status, pairing_mode, pairing_reference_only, paired_by_reference_only, paired_at, expires_at, live_pairing_enabled, safe_claim FROM novee_os_ambi_device_pairing_registry ORDER BY created_at DESC'
    const res = tenantId ? await d.query(q, [tenantId]) : await d.query(q)
    return { ok: true, pairings: res.rows }
  } catch (e) { return { ok: true, localPreview: true, pairings: [], error: e.message } }
}

export async function getAMBIDevicePairing(id) {
  if (!(await isDbAvailable())) return localFallback('pairing')
  try {
    const res = await (getDb()).query('SELECT id, ambi_device_id, pairing_status, pairing_mode, pairing_reference_only, paired_by_reference_only, live_pairing_enabled, safe_claim FROM novee_os_ambi_device_pairing_registry WHERE id=$1', [id])
    return { ok: true, pairing: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function createAMBIDevicePairingPreview(payload, { actorId = 'system', ikey } = {}) {
  validateAMBIPairingPayload(payload)
  assertNoFakeAMBIPairingClaims(payload)
  if (!(await isDbAvailable())) return { ok: true, localPreview: true, pairing: { ...payload, live_pairing_enabled: false, safe_claim: 'ambi_pairing_record_exists' } }
  try {
    const d = getDb()
    const res = await d.query(
      `INSERT INTO novee_os_ambi_device_pairing_registry (ambi_device_id, pairing_status, pairing_mode, pairing_reference_only, live_pairing_enabled, safe_claim, idempotency_key)
       VALUES ($1,$2,$3,$4,FALSE,'ambi_pairing_record_exists',$5)
       ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
      [payload.ambi_device_id || null, payload.pairing_status || 'not_started', payload.pairing_mode || 'manual', payload.pairing_reference_only || null, ikey || null]
    )
    return { ok: true, pairing: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function updateAMBIDevicePairingStatusPreview(id, payload, { actorId = 'system' } = {}) {
  assertNoFakeAMBIPairingClaims(payload)
  if (!(await isDbAvailable())) return localFallback('pairing_status')
  try {
    await (getDb()).query('UPDATE novee_os_ambi_device_pairing_registry SET pairing_status=$1, updated_at=now() WHERE id=$2', [payload.pairing_status || 'not_started', id])
    return { ok: true, updated: true }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function listAMBIFirmwareReadiness({ tenantId = null } = {}) {
  if (!(await isDbAvailable())) return { ok: true, localPreview: true, firmware: DEFAULT_AMBI_FIRMWARE }
  try {
    const d = getDb()
    const q = tenantId
      ? 'SELECT id, ambi_device_id, firmware_version_label, firmware_status, update_available, update_required, update_tested, rollback_available, live_update_enabled, safe_claim FROM novee_os_ambi_firmware_readiness_registry WHERE tenant_id=$1 ORDER BY created_at DESC'
      : 'SELECT id, ambi_device_id, firmware_version_label, firmware_status, update_available, update_required, update_tested, rollback_available, live_update_enabled, safe_claim FROM novee_os_ambi_firmware_readiness_registry ORDER BY created_at DESC'
    const res = tenantId ? await d.query(q, [tenantId]) : await d.query(q)
    return { ok: true, firmware: res.rows.length ? res.rows : DEFAULT_AMBI_FIRMWARE }
  } catch (e) { return { ok: true, localPreview: true, firmware: DEFAULT_AMBI_FIRMWARE, error: e.message } }
}

export async function getAMBIFirmwareReadiness(id) {
  if (!(await isDbAvailable())) return localFallback('firmware')
  try {
    const res = await (getDb()).query('SELECT id, firmware_version_label, firmware_status, update_available, update_required, update_tested, rollback_available, live_update_enabled, safe_claim FROM novee_os_ambi_firmware_readiness_registry WHERE id=$1', [id])
    return { ok: true, firmware: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function createAMBIFirmwareReadinessPreview(payload, { actorId = 'system', ikey } = {}) {
  validateAMBIFirmwarePayload(payload)
  if (!(await isDbAvailable())) return { ok: true, localPreview: true, firmware: { ...payload, live_update_enabled: false, safe_claim: 'ambi_firmware_record_exists' } }
  try {
    const d = getDb()
    const res = await d.query(
      `INSERT INTO novee_os_ambi_firmware_readiness_registry (ambi_device_id, firmware_version_label, firmware_status, live_update_enabled, idempotency_key)
       VALUES ($1,$2,$3,FALSE,$4) ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
      [payload.ambi_device_id || null, payload.firmware_version_label || '0.0.0-preview', payload.firmware_status || 'draft', ikey || null]
    )
    return { ok: true, firmware: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function updateAMBIFirmwareReadinessStatusPreview(id, payload, { actorId = 'system' } = {}) {
  assertNoFakeAMBIFirmwareClaims(payload)
  if (!(await isDbAvailable())) return localFallback('firmware_status')
  try {
    await (getDb()).query('UPDATE novee_os_ambi_firmware_readiness_registry SET firmware_status=$1, updated_at=now() WHERE id=$2', [payload.firmware_status || 'draft', id])
    return { ok: true, updated: true }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function listAMBIHardwareProviders({ tenantId = null } = {}) {
  if (!(await isDbAvailable())) return { ok: true, localPreview: true, providers: DEFAULT_AMBI_HARDWARE_PROVIDERS }
  try {
    const d = getDb()
    // credential_reference_only is excluded from list
    const q = tenantId
      ? 'SELECT id, provider_key, provider_name, provider_type, provider_status, configured, verified, live_connection_enabled, safe_claim FROM novee_os_ambi_hardware_provider_registry WHERE tenant_id=$1 ORDER BY created_at DESC'
      : 'SELECT id, provider_key, provider_name, provider_type, provider_status, configured, verified, live_connection_enabled, safe_claim FROM novee_os_ambi_hardware_provider_registry ORDER BY created_at DESC'
    const res = tenantId ? await d.query(q, [tenantId]) : await d.query(q)
    return { ok: true, providers: res.rows.length ? res.rows : DEFAULT_AMBI_HARDWARE_PROVIDERS }
  } catch (e) { return { ok: true, localPreview: true, providers: DEFAULT_AMBI_HARDWARE_PROVIDERS, error: e.message } }
}

export async function getAMBIHardwareProvider(id) {
  if (!(await isDbAvailable())) return localFallback('provider')
  try {
    const res = await (getDb()).query('SELECT id, provider_key, provider_name, provider_type, provider_status, configured, verified, live_connection_enabled, safe_claim FROM novee_os_ambi_hardware_provider_registry WHERE id=$1', [id])
    return { ok: true, provider: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function createAMBIHardwareProviderPreview(payload, { actorId = 'system', ikey } = {}) {
  validateAMBIHardwareProviderPayload(payload)
  if (!(await isDbAvailable())) return { ok: true, localPreview: true, provider: { ...payload, verified: false, live_connection_enabled: false, safe_claim: 'ambi_hardware_provider_record_exists' } }
  try {
    const d = getDb()
    const res = await d.query(
      `INSERT INTO novee_os_ambi_hardware_provider_registry (provider_key, provider_name, provider_type, provider_status, configured, verified, live_connection_enabled)
       VALUES ($1,$2,$3,$4,FALSE,FALSE,FALSE) ON CONFLICT (provider_key) DO NOTHING RETURNING *`,
      [payload.provider_key, payload.provider_name, payload.provider_type || 'internal_demo', payload.provider_status || 'draft']
    )
    return { ok: true, provider: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function updateAMBIHardwareProviderStatusPreview(id, payload, { actorId = 'system' } = {}) {
  assertNoFakeAMBIProviderClaims(payload)
  if (!(await isDbAvailable())) return localFallback('provider_status')
  try {
    await (getDb()).query('UPDATE novee_os_ambi_hardware_provider_registry SET provider_status=$1, updated_at=now() WHERE id=$2', [payload.provider_status || 'draft', id])
    return { ok: true, updated: true }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function listAMBIAuraStates({ tenantId = null } = {}) {
  if (!(await isDbAvailable())) return { ok: true, localPreview: true, aura_states: DEFAULT_AMBI_AURA_STATES }
  try {
    const d = getDb()
    const q = tenantId
      ? 'SELECT id, aura_key, aura_name, aura_category, state_status, active, preview_only, live_automation_enabled, required_consent, safe_claim FROM novee_os_ambi_aura_state_registry WHERE tenant_id=$1 ORDER BY created_at DESC'
      : 'SELECT id, aura_key, aura_name, aura_category, state_status, active, preview_only, live_automation_enabled, required_consent, safe_claim FROM novee_os_ambi_aura_state_registry ORDER BY created_at DESC'
    const res = tenantId ? await d.query(q, [tenantId]) : await d.query(q)
    return { ok: true, aura_states: res.rows.length ? res.rows : DEFAULT_AMBI_AURA_STATES }
  } catch (e) { return { ok: true, localPreview: true, aura_states: DEFAULT_AMBI_AURA_STATES, error: e.message } }
}

export async function getAMBIAuraState(id) {
  if (!(await isDbAvailable())) return localFallback('aura_state')
  try {
    const res = await (getDb()).query('SELECT id, aura_key, aura_name, aura_category, state_status, active, preview_only, live_automation_enabled, required_consent, safe_claim FROM novee_os_ambi_aura_state_registry WHERE id=$1', [id])
    return { ok: true, aura_state: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function createAMBIAuraStatePreview(payload, { actorId = 'system', ikey } = {}) {
  validateAMBIAuraStatePayload(payload)
  if (!(await isDbAvailable())) return { ok: true, localPreview: true, aura_state: { ...payload, active: false, preview_only: true, live_automation_enabled: false, safe_claim: 'ambi_aura_state_record_exists' } }
  try {
    const d = getDb()
    const res = await d.query(
      `INSERT INTO novee_os_ambi_aura_state_registry (aura_key, aura_name, aura_category, state_status, active, preview_only, live_automation_enabled, required_consent)
       VALUES ($1,$2,$3,$4,FALSE,TRUE,FALSE,$5) ON CONFLICT (aura_key) DO NOTHING RETURNING *`,
      [payload.aura_key, payload.aura_name, payload.aura_category || 'custom', payload.state_status || 'draft', payload.required_consent !== false]
    )
    return { ok: true, aura_state: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function updateAMBIAuraStateStatusPreview(id, payload, { actorId = 'system' } = {}) {
  if (payload.live_automation_enabled === true) throw new Error('live_automation_enabled must remain false in this phase')
  if (!(await isDbAvailable())) return localFallback('aura_status')
  try {
    await (getDb()).query('UPDATE novee_os_ambi_aura_state_registry SET state_status=$1, updated_at=now() WHERE id=$2', [payload.state_status || 'draft', id])
    return { ok: true, updated: true }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function listAMBIEnvironmentSignals({ tenantId = null } = {}) {
  if (!(await isDbAvailable())) return { ok: true, localPreview: true, signals: DEFAULT_AMBI_ENVIRONMENT_SIGNALS }
  try {
    const d = getDb()
    const q = tenantId
      ? 'SELECT id, signal_key, signal_name, signal_type, signal_status, source_type, live_ingestion_enabled, simulated, consent_required, safe_claim FROM novee_os_ambi_environment_signal_registry WHERE tenant_id=$1 ORDER BY created_at DESC'
      : 'SELECT id, signal_key, signal_name, signal_type, signal_status, source_type, live_ingestion_enabled, simulated, consent_required, safe_claim FROM novee_os_ambi_environment_signal_registry ORDER BY created_at DESC'
    const res = tenantId ? await d.query(q, [tenantId]) : await d.query(q)
    return { ok: true, signals: res.rows.length ? res.rows : DEFAULT_AMBI_ENVIRONMENT_SIGNALS }
  } catch (e) { return { ok: true, localPreview: true, signals: DEFAULT_AMBI_ENVIRONMENT_SIGNALS, error: e.message } }
}

export async function getAMBIEnvironmentSignal(id) {
  if (!(await isDbAvailable())) return localFallback('signal')
  try {
    const res = await (getDb()).query('SELECT id, signal_key, signal_name, signal_type, signal_status, source_type, live_ingestion_enabled, simulated, consent_required, safe_claim FROM novee_os_ambi_environment_signal_registry WHERE id=$1', [id])
    return { ok: true, signal: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function createAMBIEnvironmentSignalPreview(payload, { actorId = 'system', ikey } = {}) {
  validateAMBIEnvironmentSignalPayload(payload)
  if (!(await isDbAvailable())) return { ok: true, localPreview: true, signal: { ...payload, live_ingestion_enabled: false, simulated: true, safe_claim: 'ambi_environment_signal_record_exists' } }
  try {
    const d = getDb()
    const res = await d.query(
      `INSERT INTO novee_os_ambi_environment_signal_registry (signal_key, signal_name, signal_type, signal_status, source_type, live_ingestion_enabled, simulated, consent_required)
       VALUES ($1,$2,$3,$4,$5,FALSE,TRUE,$6) ON CONFLICT (signal_key) DO NOTHING RETURNING *`,
      [payload.signal_key, payload.signal_name, payload.signal_type || 'unknown', payload.signal_status || 'draft', payload.source_type || 'manual', payload.consent_required !== false]
    )
    return { ok: true, signal: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function updateAMBIEnvironmentSignalStatusPreview(id, payload, { actorId = 'system' } = {}) {
  assertNoFakeAMBITelemetryClaims(payload)
  if (!(await isDbAvailable())) return localFallback('signal_status')
  try {
    await (getDb()).query('UPDATE novee_os_ambi_environment_signal_registry SET signal_status=$1, updated_at=now() WHERE id=$2', [payload.signal_status || 'draft', id])
    return { ok: true, updated: true }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function listAMBIPrivacyConsent({ tenantId = null } = {}) {
  if (!(await isDbAvailable())) return { ok: true, localPreview: true, consents: DEFAULT_AMBI_CONSENT_RECORDS }
  try {
    const d = getDb()
    // subject_reference_only excluded from list
    const q = tenantId
      ? 'SELECT id, consent_type, consent_status, required_for_feature, accepted_at, revoked_at, evidence_reference, safe_claim FROM novee_os_ambi_privacy_consent_registry WHERE tenant_id=$1 ORDER BY created_at DESC'
      : 'SELECT id, consent_type, consent_status, required_for_feature, accepted_at, revoked_at, evidence_reference, safe_claim FROM novee_os_ambi_privacy_consent_registry ORDER BY created_at DESC'
    const res = tenantId ? await d.query(q, [tenantId]) : await d.query(q)
    return { ok: true, consents: res.rows.length ? res.rows : DEFAULT_AMBI_CONSENT_RECORDS }
  } catch (e) { return { ok: true, localPreview: true, consents: DEFAULT_AMBI_CONSENT_RECORDS, error: e.message } }
}

export async function getAMBIPrivacyConsent(id) {
  if (!(await isDbAvailable())) return localFallback('consent')
  try {
    const res = await (getDb()).query('SELECT id, consent_type, consent_status, required_for_feature, accepted_at, revoked_at, evidence_reference, safe_claim FROM novee_os_ambi_privacy_consent_registry WHERE id=$1', [id])
    return { ok: true, consent: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function createAMBIPrivacyConsentPreview(payload, { actorId = 'system', ikey } = {}) {
  validateAMBIPrivacyConsentPayload(payload)
  assertNoRawAMBISecrets(payload)
  if (!(await isDbAvailable())) return { ok: true, localPreview: true, consent: { ...payload, consent_status: 'pending', safe_claim: 'ambi_consent_record_exists' } }
  try {
    const d = getDb()
    const res = await d.query(
      `INSERT INTO novee_os_ambi_privacy_consent_registry (consent_type, consent_status, required_for_feature, idempotency_key)
       VALUES ($1,'pending',$2,$3) ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
      [payload.consent_type, payload.required_for_feature || null, ikey || null]
    )
    return { ok: true, consent: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function updateAMBIPrivacyConsentStatusPreview(id, payload, { actorId = 'system' } = {}) {
  assertNoRawAMBISecrets(payload)
  if (!(await isDbAvailable())) return localFallback('consent_status')
  try {
    await (getDb()).query('UPDATE novee_os_ambi_privacy_consent_registry SET consent_status=$1, updated_at=now() WHERE id=$2', [payload.consent_status || 'pending', id])
    return { ok: true, updated: true }
  } catch (e) { return { ok: false, error: e.message } }
}

// subject_reference_only is intentionally excluded from all list/get queries — no PII displayed
export async function listAMBIPresenceAccessEvents({ tenantId = null } = {}) {
  if (!(await isDbAvailable())) return { ok: true, localPreview: true, events: DEFAULT_AMBI_PRESENCE_EVENTS }
  try {
    const d = getDb()
    const q = tenantId
      ? 'SELECT id, event_type, event_status, source_type, consent_status, live_tracking_enabled, simulated, safe_claim, created_at FROM novee_os_ambi_presence_access_event_registry WHERE tenant_id=$1 ORDER BY created_at DESC'
      : 'SELECT id, event_type, event_status, source_type, consent_status, live_tracking_enabled, simulated, safe_claim, created_at FROM novee_os_ambi_presence_access_event_registry ORDER BY created_at DESC'
    const res = tenantId ? await d.query(q, [tenantId]) : await d.query(q)
    return { ok: true, events: res.rows.length ? res.rows : DEFAULT_AMBI_PRESENCE_EVENTS }
  } catch (e) { return { ok: true, localPreview: true, events: DEFAULT_AMBI_PRESENCE_EVENTS, error: e.message } }
}

export async function getAMBIPresenceAccessEvent(id) {
  if (!(await isDbAvailable())) return localFallback('presence_event')
  try {
    const res = await (getDb()).query('SELECT id, event_type, event_status, source_type, consent_status, live_tracking_enabled, simulated, safe_claim FROM novee_os_ambi_presence_access_event_registry WHERE id=$1', [id])
    return { ok: true, event: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function createAMBIPresenceAccessEventPreview(payload, { actorId = 'system', ikey } = {}) {
  validateAMBIPresenceAccessEventPayload(payload)
  if (!(await isDbAvailable())) return { ok: true, localPreview: true, event: { ...payload, live_tracking_enabled: false, simulated: true, safe_claim: 'ambi_presence_event_record_exists' } }
  try {
    const d = getDb()
    const res = await d.query(
      `INSERT INTO novee_os_ambi_presence_access_event_registry (event_type, event_status, source_type, consent_status, live_tracking_enabled, simulated, idempotency_key)
       VALUES ($1,$2,$3,'pending',FALSE,TRUE,$4) ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
      [payload.event_type, payload.event_status || 'pending', payload.source_type || 'manual', ikey || null]
    )
    return { ok: true, event: res.rows[0] || null }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function getAMBIReadinessScore({ tenantId = null } = {}) {
  return {
    ok: true,
    score: 0,
    foundation_ready: false,
    hardware_ready: false,
    live_telemetry: false,
    live_control: false,
    notes: 'AMBI is in software foundation phase only. No hardware, telemetry, or live control is active.',
  }
}

export async function getAMBIBlockers({ tenantId = null } = {}) {
  return {
    ok: true,
    blockers: [
      { category: 'hardware', message: 'No AMBI hardware has been provisioned or connected.' },
      { category: 'telemetry', message: 'Live telemetry is disabled by default (NOVEE_AMBI_LIVE_TELEMETRY_ENABLED=false).' },
      { category: 'device_control', message: 'Live device control is disabled by default (NOVEE_AMBI_LIVE_DEVICE_CONTROL_ENABLED=false).' },
      { category: 'pairing', message: 'Live device pairing is disabled by default (NOVEE_AMBI_LIVE_PAIRING_ENABLED=false).' },
      { category: 'firmware', message: 'Live firmware updates are disabled by default (NOVEE_AMBI_LIVE_FIRMWARE_UPDATES_ENABLED=false).' },
      { category: 'automation', message: 'Live environment automation is disabled by default (NOVEE_AMBI_LIVE_ENVIRONMENT_AUTOMATION_ENABLED=false).' },
      { category: 'provider', message: 'No hardware providers are verified or live-connected.' },
      { category: 'consent', message: 'Privacy consent records are pending — required before any live AMBI features are activated.' },
    ],
  }
}

export async function getSafeAMBIClaims() {
  return {
    ok: true,
    can_claim: [
      'AMBI Foundation exists as a software foundation module',
      'AMBI device readiness can be tracked',
      'AMBI pairing readiness can be tracked',
      'AMBI firmware readiness can be tracked',
      'AMBI hardware provider readiness can be tracked',
      'AMBI aura states are software experience modes only — not emotional, medical, or biometric diagnoses',
      'AMBI environment signals are tracked as simulated references, not live sensor data',
      'AMBI privacy/consent records can be tracked',
      'AMBI presence/access events can be tracked as reference-only, not live tracking',
      'AMBI live telemetry and device control remain disabled by default',
    ],
    cannot_claim: [
      'AMBI hardware is ready — not yet provisioned',
      'AMBI devices are connected — no live connections',
      'AMBI telemetry is live — disabled by default',
      'AMBI controls physical devices — live control disabled',
      'AMBI detects emotions — forbidden claim',
      'AMBI detects health conditions — forbidden claim',
      'AMBI performs biometric monitoring — forbidden claim',
      'AMBI performs safety monitoring — forbidden claim',
      'AMBI firmware updates are live — disabled by default',
      'AMBI provider connections are live — no providers verified',
    ],
  }
}

export async function writeAMBIAuditEvent({ tenantId = null, actorId = 'system', actorRole = null, eventType, eventCategory = 'general', severity = 'info', summary, metadata = null, ikey = null } = {}) {
  if (!(await isDbAvailable())) return { ok: true, localPreview: true }
  try {
    await (getDb()).query(
      `INSERT INTO novee_os_ambi_audit_log (tenant_id, actor_id, actor_role, event_type, event_category, severity, summary, metadata_json, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (idempotency_key) DO NOTHING`,
      [tenantId, actorId, actorRole, eventType, eventCategory, severity, summary, metadata ? JSON.stringify(metadata) : null, ikey]
    )
    return { ok: true }
  } catch (e) { return { ok: false, error: e.message } }
}

export async function getAMBIAuditLog({ tenantId = null, limit = 50 } = {}) {
  if (!(await isDbAvailable())) return { ok: true, localPreview: true, events: [] }
  try {
    const d = getDb()
    const q = tenantId
      ? 'SELECT id, actor_id, actor_role, event_type, event_category, severity, summary, created_at FROM novee_os_ambi_audit_log WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT $2'
      : 'SELECT id, actor_id, actor_role, event_type, event_category, severity, summary, created_at FROM novee_os_ambi_audit_log ORDER BY created_at DESC LIMIT $1'
    const res = tenantId ? await d.query(q, [tenantId, limit]) : await d.query(q, [limit])
    return { ok: true, events: res.rows }
  } catch (e) { return { ok: true, localPreview: true, events: [], error: e.message } }
}

export async function getAMBIFeatureFlagSnapshot() {
  return { ok: true, flags: AMBI_FLAGS }
}

export async function validateAMBIFoundationReadiness({ tenantId = null } = {}) {
  return {
    ok: true,
    valid: false,
    foundation_ready: false,
    hardware_ready: false,
    live_telemetry_enabled: false,
    live_device_control_enabled: false,
    notes: 'AMBI Foundation is in build-only phase. Hardware, telemetry, device control, and automation are all disabled.',
    safe_claim: 'ambi_foundation_exists',
  }
}
