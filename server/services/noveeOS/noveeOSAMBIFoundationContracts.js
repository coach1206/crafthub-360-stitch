// Phase E.8 — NOVEE OS AMBI Foundation Contracts
// SOFTWARE FOUNDATION ONLY — no hardware, no telemetry, no medical/biometric/emotion/safety claims

export const ALLOWED_DEVICE_TYPES = [
  'ambient_display', 'lighting_controller', 'audio_controller', 'scent_controller',
  'environmental_sensor', 'presence_sensor', 'access_panel', 'mobile_companion', 'kiosk', 'unknown',
]

export const ALLOWED_DEVICE_STATUSES = ['draft', 'preview', 'in_review', 'approved', 'blocked', 'retired']

export const ALLOWED_PAIRING_STATUSES = ['not_started', 'pending', 'in_progress', 'paired', 'failed', 'expired', 'revoked']

export const ALLOWED_PAIRING_MODES = ['manual', 'qr_reference', 'nfc_reference', 'provisioned', 'admin_override']

export const ALLOWED_FIRMWARE_STATUSES = ['draft', 'pending_test', 'tested', 'approved', 'deployed', 'rollback_available', 'retired']

export const ALLOWED_PROVIDER_TYPES = [
  'device_manufacturer', 'firmware_provider', 'sensor_provider', 'lighting_provider',
  'audio_provider', 'automation_provider', 'installation_partner', 'maintenance_partner', 'internal_demo',
]

export const ALLOWED_PROVIDER_STATUSES = ['draft', 'pending', 'configured', 'verified', 'live', 'suspended', 'retired']

export const ALLOWED_AURA_CATEGORIES = [
  'welcome', 'focus', 'dining', 'lounge', 'cigar', 'music', 'event', 'staff', 'vip', 'closing', 'custom',
]

export const ALLOWED_AURA_STATUSES = ['draft', 'preview', 'in_review', 'approved', 'active', 'archived']

export const ALLOWED_SIGNAL_TYPES = [
  'room_mode', 'occupancy_count_reference', 'time_of_day', 'event_mode', 'staff_mode',
  'guest_preference_reference', 'lighting_scene', 'audio_scene', 'temperature_reference',
  'manual_trigger', 'unknown',
]

export const ALLOWED_CONSENT_TYPES = [
  'guest_experience_preferences', 'staff_operational_preferences', 'venue_environment_preferences',
  'presence_reference', 'access_reference', 'device_interaction', 'data_privacy_acknowledgment',
]

export const ALLOWED_CONSENT_STATUSES = ['pending', 'accepted', 'revoked', 'expired', 'not_required']

export const ALLOWED_PRESENCE_EVENT_TYPES = [
  'manual_check_in', 'staff_mode_change', 'guest_preference_loaded', 'venue_mode_change',
  'area_access_reference', 'device_interaction_reference', 'session_started', 'session_ended',
]

export const FORBIDDEN_FAKE_HARDWARE_CLAIMS = [
  'hardware_ready: true', 'connected: true', 'devices_connected', 'physical_device_live',
  'hardware_verified', 'device_online',
]

export const FORBIDDEN_FAKE_TELEMETRY_CLAIMS = [
  'live_telemetry_enabled: true', 'live_ingestion_enabled: true', 'real_time_data_active',
  'sensor_live', 'telemetry_streaming',
]

export const FORBIDDEN_FAKE_PAIRING_CLAIMS = [
  'live_pairing_enabled: true', 'pairing_complete', 'pairing_token_exposed', 'device_paired_live',
]

export const FORBIDDEN_FAKE_FIRMWARE_CLAIMS = [
  'live_update_enabled: true', 'firmware_deployed_live', 'ota_active',
]

export const FORBIDDEN_FAKE_PROVIDER_CLAIMS = [
  'live_connection_enabled: true', 'provider_verified_live', 'credentials_confirmed',
]

export const FORBIDDEN_MEDICAL_CLAIMS = [
  'health_monitoring', 'medical_diagnosis', 'wellness_tracking', 'therapy',
  'treatment', 'clinical', 'patient', 'symptom', 'medication',
]

export const FORBIDDEN_BIOMETRIC_CLAIMS = [
  'biometric_monitoring', 'fingerprint_live', 'retinal', 'dna', 'heart_rate_live',
  'blood_pressure', 'body_temperature_monitoring', 'sleep_tracking',
]

export const FORBIDDEN_EMOTION_DETECTION_CLAIMS = [
  'emotion_detection', 'mood_monitoring', 'stress_detection', 'anxiety_monitoring',
  'sentiment_analysis_live', 'psychological_profiling', 'intoxication_detection',
]

export const FORBIDDEN_SAFETY_MONITORING_CLAIMS = [
  'safety_monitoring_live', 'danger_detection', 'emergency_response_live',
  'fall_detection', 'violence_detection', 'threat_assessment',
]

export const DEFAULT_AMBI_DEVICES = [
  { device_key: 'ambi_ambient_display_01', device_name: 'AMBI Ambient Display (Preview)', device_type: 'ambient_display', device_status: 'draft', hardware_ready: false, software_ready: false, connected: false, live_telemetry_enabled: false, live_control_enabled: false, consent_required: true, safe_claim: 'ambi_device_record_exists' },
  { device_key: 'ambi_lighting_controller_01', device_name: 'AMBI Lighting Controller (Preview)', device_type: 'lighting_controller', device_status: 'draft', hardware_ready: false, software_ready: false, connected: false, live_telemetry_enabled: false, live_control_enabled: false, consent_required: true, safe_claim: 'ambi_device_record_exists' },
  { device_key: 'ambi_audio_controller_01', device_name: 'AMBI Audio Controller (Preview)', device_type: 'audio_controller', device_status: 'draft', hardware_ready: false, software_ready: false, connected: false, live_telemetry_enabled: false, live_control_enabled: false, consent_required: true, safe_claim: 'ambi_device_record_exists' },
  { device_key: 'ambi_scent_controller_01', device_name: 'AMBI Scent Controller (Preview)', device_type: 'scent_controller', device_status: 'draft', hardware_ready: false, software_ready: false, connected: false, live_telemetry_enabled: false, live_control_enabled: false, consent_required: true, safe_claim: 'ambi_device_record_exists' },
  { device_key: 'ambi_presence_sensor_01', device_name: 'AMBI Presence Sensor (Preview)', device_type: 'presence_sensor', device_status: 'draft', hardware_ready: false, software_ready: false, connected: false, live_telemetry_enabled: false, live_control_enabled: false, consent_required: true, safe_claim: 'ambi_device_record_exists' },
  { device_key: 'ambi_kiosk_01', device_name: 'AMBI Kiosk (Preview)', device_type: 'kiosk', device_status: 'draft', hardware_ready: false, software_ready: false, connected: false, live_telemetry_enabled: false, live_control_enabled: false, consent_required: true, safe_claim: 'ambi_device_record_exists' },
]

export const DEFAULT_AMBI_FIRMWARE = [
  { firmware_version_label: '0.0.0-preview', firmware_status: 'draft', update_available: false, update_required: false, update_tested: false, rollback_available: false, live_update_enabled: false, safe_claim: 'ambi_firmware_record_exists' },
]

export const DEFAULT_AMBI_HARDWARE_PROVIDERS = [
  { provider_key: 'ambi_internal_demo', provider_name: 'AMBI Internal Demo (Preview)', provider_type: 'internal_demo', provider_status: 'draft', configured: false, verified: false, live_connection_enabled: false, safe_claim: 'ambi_hardware_provider_record_exists' },
  { provider_key: 'ambi_device_manufacturer_01', provider_name: 'Hardware Manufacturer (TBD)', provider_type: 'device_manufacturer', provider_status: 'draft', configured: false, verified: false, live_connection_enabled: false, safe_claim: 'ambi_hardware_provider_record_exists' },
]

export const DEFAULT_AMBI_AURA_STATES = [
  { aura_key: 'aura_welcome', aura_name: 'Welcome', aura_category: 'welcome', state_status: 'draft', active: false, preview_only: true, live_automation_enabled: false, required_consent: true, safe_claim: 'ambi_aura_state_record_exists' },
  { aura_key: 'aura_focus', aura_name: 'Focus', aura_category: 'focus', state_status: 'draft', active: false, preview_only: true, live_automation_enabled: false, required_consent: true, safe_claim: 'ambi_aura_state_record_exists' },
  { aura_key: 'aura_dining', aura_name: 'Dining', aura_category: 'dining', state_status: 'draft', active: false, preview_only: true, live_automation_enabled: false, required_consent: true, safe_claim: 'ambi_aura_state_record_exists' },
  { aura_key: 'aura_lounge', aura_name: 'Lounge', aura_category: 'lounge', state_status: 'draft', active: false, preview_only: true, live_automation_enabled: false, required_consent: true, safe_claim: 'ambi_aura_state_record_exists' },
  { aura_key: 'aura_cigar', aura_name: 'Cigar', aura_category: 'cigar', state_status: 'draft', active: false, preview_only: true, live_automation_enabled: false, required_consent: true, safe_claim: 'ambi_aura_state_record_exists' },
  { aura_key: 'aura_music', aura_name: 'Music', aura_category: 'music', state_status: 'draft', active: false, preview_only: true, live_automation_enabled: false, required_consent: true, safe_claim: 'ambi_aura_state_record_exists' },
  { aura_key: 'aura_event', aura_name: 'Event', aura_category: 'event', state_status: 'draft', active: false, preview_only: true, live_automation_enabled: false, required_consent: true, safe_claim: 'ambi_aura_state_record_exists' },
  { aura_key: 'aura_vip', aura_name: 'VIP', aura_category: 'vip', state_status: 'draft', active: false, preview_only: true, live_automation_enabled: false, required_consent: true, safe_claim: 'ambi_aura_state_record_exists' },
  { aura_key: 'aura_closing', aura_name: 'Closing', aura_category: 'closing', state_status: 'draft', active: false, preview_only: true, live_automation_enabled: false, required_consent: true, safe_claim: 'ambi_aura_state_record_exists' },
]

export const DEFAULT_AMBI_ENVIRONMENT_SIGNALS = [
  { signal_key: 'signal_room_mode', signal_name: 'Room Mode Signal', signal_type: 'room_mode', signal_status: 'draft', source_type: 'manual', live_ingestion_enabled: false, simulated: true, consent_required: true, safe_claim: 'ambi_environment_signal_record_exists' },
  { signal_key: 'signal_time_of_day', signal_name: 'Time of Day', signal_type: 'time_of_day', signal_status: 'draft', source_type: 'manual', live_ingestion_enabled: false, simulated: true, consent_required: false, safe_claim: 'ambi_environment_signal_record_exists' },
  { signal_key: 'signal_event_mode', signal_name: 'Event Mode', signal_type: 'event_mode', signal_status: 'draft', source_type: 'manual', live_ingestion_enabled: false, simulated: true, consent_required: true, safe_claim: 'ambi_environment_signal_record_exists' },
  { signal_key: 'signal_staff_mode', signal_name: 'Staff Mode', signal_type: 'staff_mode', signal_status: 'draft', source_type: 'manual', live_ingestion_enabled: false, simulated: true, consent_required: true, safe_claim: 'ambi_environment_signal_record_exists' },
]

export const DEFAULT_AMBI_CONSENT_RECORDS = [
  { consent_type: 'data_privacy_acknowledgment', consent_status: 'pending', required_for_feature: 'ambi_foundation', safe_claim: 'ambi_consent_record_exists' },
  { consent_type: 'venue_environment_preferences', consent_status: 'pending', required_for_feature: 'aura_states', safe_claim: 'ambi_consent_record_exists' },
]

export const DEFAULT_AMBI_PRESENCE_EVENTS = [
  { event_type: 'manual_check_in', event_status: 'pending', source_type: 'manual', consent_status: 'pending', live_tracking_enabled: false, simulated: true, safe_claim: 'ambi_presence_event_record_exists' },
]

// Assertion helpers

export function assertNoFakeAMBIHardwareClaims(payload) {
  const str = JSON.stringify(payload).toLowerCase()
  for (const f of FORBIDDEN_FAKE_HARDWARE_CLAIMS) {
    if (str.includes(f.toLowerCase())) throw new Error(`Fake AMBI hardware claim blocked: ${f}`)
  }
  if (payload.hardware_ready === true) throw new Error('hardware_ready must remain false in this phase')
  if (payload.connected === true) throw new Error('connected must remain false in this phase')
}

export function assertNoFakeAMBITelemetryClaims(payload) {
  const str = JSON.stringify(payload).toLowerCase()
  for (const f of FORBIDDEN_FAKE_TELEMETRY_CLAIMS) {
    if (str.includes(f.toLowerCase())) throw new Error(`Fake AMBI telemetry claim blocked: ${f}`)
  }
  if (payload.live_telemetry_enabled === true) throw new Error('live_telemetry_enabled must remain false in this phase')
}

export function assertNoFakeAMBIPairingClaims(payload) {
  const str = JSON.stringify(payload).toLowerCase()
  for (const f of FORBIDDEN_FAKE_PAIRING_CLAIMS) {
    if (str.includes(f.toLowerCase())) throw new Error(`Fake AMBI pairing claim blocked: ${f}`)
  }
  if (payload.live_pairing_enabled === true) throw new Error('live_pairing_enabled must remain false in this phase')
}

export function assertNoFakeAMBIFirmwareClaims(payload) {
  const str = JSON.stringify(payload).toLowerCase()
  for (const f of FORBIDDEN_FAKE_FIRMWARE_CLAIMS) {
    if (str.includes(f.toLowerCase())) throw new Error(`Fake AMBI firmware claim blocked: ${f}`)
  }
  if (payload.live_update_enabled === true) throw new Error('live_update_enabled must remain false in this phase')
}

export function assertNoFakeAMBIProviderClaims(payload) {
  const str = JSON.stringify(payload).toLowerCase()
  for (const f of FORBIDDEN_FAKE_PROVIDER_CLAIMS) {
    if (str.includes(f.toLowerCase())) throw new Error(`Fake AMBI provider claim blocked: ${f}`)
  }
  if (payload.live_connection_enabled === true) throw new Error('live_connection_enabled must remain false in this phase')
}

export function assertNoAMBIMedicalClaims(payload) {
  const str = JSON.stringify(payload).toLowerCase()
  for (const f of FORBIDDEN_MEDICAL_CLAIMS) {
    if (str.includes(f.toLowerCase())) throw new Error(`AMBI medical claim blocked: ${f}`)
  }
}

export function assertNoAMBIBiometricClaims(payload) {
  const str = JSON.stringify(payload).toLowerCase()
  for (const f of FORBIDDEN_BIOMETRIC_CLAIMS) {
    if (str.includes(f.toLowerCase())) throw new Error(`AMBI biometric claim blocked: ${f}`)
  }
}

export function assertNoAMBIEmotionDetectionClaims(payload) {
  const str = JSON.stringify(payload).toLowerCase()
  for (const f of FORBIDDEN_EMOTION_DETECTION_CLAIMS) {
    if (str.includes(f.toLowerCase())) throw new Error(`AMBI emotion detection claim blocked: ${f}`)
  }
}

export function assertNoAMBISafetyMonitoringClaims(payload) {
  const str = JSON.stringify(payload).toLowerCase()
  for (const f of FORBIDDEN_SAFETY_MONITORING_CLAIMS) {
    if (str.includes(f.toLowerCase())) throw new Error(`AMBI safety monitoring claim blocked: ${f}`)
  }
}

export function assertNoRawAMBISecrets(payload) {
  const forbidden = ['pairing_token', 'device_token', 'api_key', 'secret_key', 'private_key', 'credential_raw']
  const str = JSON.stringify(payload).toLowerCase()
  for (const f of forbidden) {
    if (str.includes(f) && !str.includes('reference_only')) throw new Error(`Raw AMBI secret exposure blocked: ${f}`)
  }
}

export function validateAMBIDevicePayload(payload) {
  if (!payload.device_key) throw new Error('device_key required')
  if (!payload.device_name) throw new Error('device_name required')
  if (payload.device_type && !ALLOWED_DEVICE_TYPES.includes(payload.device_type)) throw new Error(`Invalid device_type: ${payload.device_type}`)
  assertNoFakeAMBIHardwareClaims(payload)
  assertNoFakeAMBITelemetryClaims(payload)
  assertNoAMBIMedicalClaims(payload)
  assertNoAMBIBiometricClaims(payload)
  assertNoAMBIEmotionDetectionClaims(payload)
  assertNoRawAMBISecrets(payload)
  return true
}

export function validateAMBIPairingPayload(payload) {
  if (payload.pairing_status && !ALLOWED_PAIRING_STATUSES.includes(payload.pairing_status)) throw new Error(`Invalid pairing_status`)
  if (payload.pairing_mode && !ALLOWED_PAIRING_MODES.includes(payload.pairing_mode)) throw new Error(`Invalid pairing_mode`)
  assertNoFakeAMBIPairingClaims(payload)
  assertNoRawAMBISecrets(payload)
  return true
}

export function validateAMBIFirmwarePayload(payload) {
  if (!payload.firmware_version_label) throw new Error('firmware_version_label required')
  if (payload.firmware_status && !ALLOWED_FIRMWARE_STATUSES.includes(payload.firmware_status)) throw new Error(`Invalid firmware_status`)
  assertNoFakeAMBIFirmwareClaims(payload)
  return true
}

export function validateAMBIHardwareProviderPayload(payload) {
  if (!payload.provider_key) throw new Error('provider_key required')
  if (!payload.provider_name) throw new Error('provider_name required')
  if (payload.provider_type && !ALLOWED_PROVIDER_TYPES.includes(payload.provider_type)) throw new Error(`Invalid provider_type`)
  assertNoFakeAMBIProviderClaims(payload)
  assertNoRawAMBISecrets(payload)
  return true
}

export function validateAMBIAuraStatePayload(payload) {
  if (!payload.aura_key) throw new Error('aura_key required')
  if (!payload.aura_name) throw new Error('aura_name required')
  if (payload.aura_category && !ALLOWED_AURA_CATEGORIES.includes(payload.aura_category)) throw new Error(`Invalid aura_category`)
  assertNoAMBIMedicalClaims(payload)
  assertNoAMBIBiometricClaims(payload)
  assertNoAMBIEmotionDetectionClaims(payload)
  assertNoAMBISafetyMonitoringClaims(payload)
  return true
}

export function validateAMBIEnvironmentSignalPayload(payload) {
  if (!payload.signal_key) throw new Error('signal_key required')
  if (!payload.signal_name) throw new Error('signal_name required')
  if (payload.signal_type && !ALLOWED_SIGNAL_TYPES.includes(payload.signal_type)) throw new Error(`Invalid signal_type`)
  assertNoFakeAMBITelemetryClaims(payload)
  assertNoAMBIMedicalClaims(payload)
  return true
}

export function validateAMBIPrivacyConsentPayload(payload) {
  if (!payload.consent_type) throw new Error('consent_type required')
  if (payload.consent_type && !ALLOWED_CONSENT_TYPES.includes(payload.consent_type)) throw new Error(`Invalid consent_type`)
  if (payload.consent_status && !ALLOWED_CONSENT_STATUSES.includes(payload.consent_status)) throw new Error(`Invalid consent_status`)
  assertNoRawAMBISecrets(payload)
  return true
}

export function validateAMBIPresenceAccessEventPayload(payload) {
  if (!payload.event_type) throw new Error('event_type required')
  if (payload.event_type && !ALLOWED_PRESENCE_EVENT_TYPES.includes(payload.event_type)) throw new Error(`Invalid event_type`)
  if (payload.live_tracking_enabled === true) throw new Error('live_tracking_enabled must remain false in this phase')
  assertNoAMBIMedicalClaims(payload)
  assertNoAMBIBiometricClaims(payload)
  assertNoAMBIEmotionDetectionClaims(payload)
  assertNoAMBISafetyMonitoringClaims(payload)
  return true
}
