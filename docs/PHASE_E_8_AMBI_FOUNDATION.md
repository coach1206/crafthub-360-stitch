# Phase E.8 — NOVEE OS AMBI Foundation

## What Was Built

Phase E.8 creates the AMBI Foundation as a software foundation module for NOVEE OS. This phase establishes device readiness tracking, pairing readiness, firmware readiness, hardware provider readiness, aura state records, environment signal records, privacy/consent tracking, and presence/access event tracking — all as software structures, not live hardware.

**Files created:**
- `server/db/migrations/066_novee_os_ambi_foundation.sql` — 9-table migration
- `server/services/noveeOS/noveeOSAMBIFoundationContracts.js` — allowed types, defaults, assertion helpers, validators
- `server/config/noveeOSAMBIFoundationFeatureFlags.js` — 19 feature flags
- `server/services/noveeOS/noveeOSAMBIFoundationService.js` — 39 async service methods
- `server/controllers/noveeOSAMBIFoundationController.js` — controller with safe wrap pattern
- `server/routes/noveeOSAMBIFoundationRoutes.js` — 43 routes at /api/novee-os/ambi-foundation
- `src/pages/noveeOS/AMBIFoundation.jsx` — 12-panel frontend at /novee-os/ambi-foundation

---

## What Is Still NOT Live

- No physical hardware is connected
- Live device connections disabled (`NOVEE_AMBI_LIVE_DEVICE_CONNECTIONS_ENABLED=false`)
- Live telemetry disabled (`NOVEE_AMBI_LIVE_TELEMETRY_ENABLED=false`)
- Live device control disabled (`NOVEE_AMBI_LIVE_DEVICE_CONTROL_ENABLED=false`)
- Live environment automation disabled (`NOVEE_AMBI_LIVE_ENVIRONMENT_AUTOMATION_ENABLED=false`)
- Live device pairing disabled (`NOVEE_AMBI_LIVE_PAIRING_ENABLED=false`)
- Live firmware updates disabled (`NOVEE_AMBI_LIVE_FIRMWARE_UPDATES_ENABLED=false`)
- Hardware readiness not confirmed (`NOVEE_AMBI_HARDWARE_READY_ENABLED=false`)

---

## What Cannot Be Claimed

- AMBI hardware is ready
- AMBI devices are connected
- AMBI telemetry is live
- AMBI controls physical devices
- AMBI detects emotions
- AMBI detects health conditions
- AMBI performs biometric monitoring
- AMBI performs safety monitoring
- AMBI firmware updates are live
- AMBI provider connections are live

---

## AMBI Software Foundation Explanation

AMBI (Ambient Intelligence) is NOVEE OS's environment platform layer. In Phase E.8, AMBI exists as a software foundation: schemas, registries, contracts, and placeholders are built. No physical hardware is deployed, no telemetry streams, and no devices are controlled. The foundation establishes the data architecture that future hardware integration will build upon.

---

## Device Registry Explanation

The device registry (`novee_os_ambi_device_registry`) tracks what device types AMBI will eventually support:
- ambient_display, lighting_controller, audio_controller, scent_controller
- environmental_sensor, presence_sensor, access_panel, mobile_companion, kiosk

All devices default to: `hardware_ready=FALSE`, `connected=FALSE`, `live_telemetry_enabled=FALSE`, `live_control_enabled=FALSE`. Consent is required before any live device interaction.

---

## Pairing Readiness Explanation

The pairing registry (`novee_os_ambi_device_pairing_registry`) tracks pairing state without exposing raw tokens. The `pairing_token_reference_only` field is never returned in list or get queries. `live_pairing_enabled=FALSE` by default.

---

## Firmware Readiness Explanation

The firmware registry (`novee_os_ambi_firmware_readiness_registry`) tracks firmware version labels, test status, and update availability. `live_update_enabled=FALSE` by default. No OTA updates occur until this is explicitly enabled after full testing and approval.

---

## Hardware Provider Readiness Explanation

The hardware provider registry (`novee_os_ambi_hardware_provider_registry`) tracks third-party or internal hardware manufacturers, firmware providers, sensor providers, and installation partners. `live_connection_enabled=FALSE` and `verified=FALSE` by default. Credentials are stored as reference-only and never exposed in API responses.

---

## Aura State Explanation

Aura states (`novee_os_ambi_aura_state_registry`) are software-defined experience modes: Welcome, Focus, Dining, Lounge, Cigar, Music, Event, VIP, Closing, Custom.

**IMPORTANT**: Aura states are venue experience presets for lighting, audio, and scent coordination. They are NOT:
- Emotional state detectors
- Mood monitoring systems
- Medical or psychological diagnoses
- Biometric profiles
- Stress/anxiety measurement tools
- Intoxication detection systems

All aura states default to `active=FALSE`, `preview_only=TRUE`, `live_automation_enabled=FALSE`.

---

## Environment Signal Explanation

Environment signals (`novee_os_ambi_environment_signal_registry`) are structured inputs that can inform aura state changes: room mode, time of day, event mode, staff mode, etc.

All signals default to `live_ingestion_enabled=FALSE`, `simulated=TRUE`. No real sensor data is ingested in Phase E.8.

---

## Privacy and Consent Explanation

The consent registry (`novee_os_ambi_privacy_consent_registry`) tracks required consents before any AMBI feature is activated. Subject identity uses `subject_reference_only` — never a raw email, name, or identifier.

Consent types include: guest experience preferences, staff operational preferences, venue environment preferences, presence reference, access reference, device interaction, data privacy acknowledgment.

`NOVEE_AMBI_PRIVACY_CONSENT_REQUIRED=true` by default.

---

## Presence/Access Event Explanation

Presence and access events (`novee_os_ambi_presence_access_event_registry`) track venue interactions as reference-only records. Subject identity uses `subject_reference_only`. `live_tracking_enabled=FALSE` and `simulated=TRUE` by default. Events include: manual check-in, staff mode change, guest preference loaded, venue mode change, area access reference, device interaction reference, session started/ended.

---

## Why Hardware Readiness Remains False

Hardware readiness is false because:
1. No AMBI hardware has been procured or provisioned
2. No hardware providers have been verified
3. No installation or commissioning has occurred
4. No device pairing has been tested
5. Firmware has not been developed or tested on real hardware

To enable: set `NOVEE_AMBI_HARDWARE_READY_ENABLED=true` after all hardware gates pass.

---

## Why Live Telemetry Remains False

Live telemetry requires:
1. Physical sensors connected to a live environment
2. Data ingestion pipeline built and tested
3. Privacy consent obtained from venue and guests
4. Security review of telemetry data flows
5. Feature flag enabled after all gates pass

---

## Why Live Device Control Remains False

Live device control requires:
1. Hardware connected and tested
2. Control protocols verified
3. Safety review of automated control flows
4. Consent obtained
5. Pilot testing in a real venue environment

---

## Medical/Biometric/Emotion/Safety Claim Restrictions

AMBI MUST NOT make the following claims:
- Health monitoring or medical diagnosis of any kind
- Biometric identification (fingerprint, retinal, DNA)
- Heart rate, blood pressure, or body temperature monitoring
- Emotion detection, mood tracking, or psychological profiling
- Stress, anxiety, or intoxication detection
- Safety monitoring, fall detection, or threat assessment
- Any claim suggesting AMBI can assess a person's physical or mental state

These are blocked at the contract layer by: `assertNoAMBIMedicalClaims`, `assertNoAMBIBiometricClaims`, `assertNoAMBIEmotionDetectionClaims`, `assertNoAMBISafetyMonitoringClaims`.

---

## Safe Sales Language

- "NOVEE OS includes an AMBI Foundation module — a software platform for venue environment coordination."
- "AMBI tracks device readiness, aura state modes, and privacy consent as software infrastructure."
- "AMBI aura states are software experience presets for venue atmosphere — lighting, audio, and scent coordination."
- "AMBI is in software foundation phase. Hardware, telemetry, and live control are not yet active."

---

## Unsafe Sales Language

- DO NOT say: "AMBI reads your guests' emotions."
- DO NOT say: "AMBI monitors health or wellness."
- DO NOT say: "AMBI detects intoxication or stress."
- DO NOT say: "AMBI performs biometric monitoring."
- DO NOT say: "AMBI devices are live and connected."
- DO NOT say: "AMBI telemetry is streaming."
- DO NOT say: "AMBI controls devices in real time."
- DO NOT say: "AMBI performs safety monitoring."

---

## Admin Usage Guide

1. View `/novee-os/ambi-foundation` to see the full AMBI Foundation state.
2. Panel A shows readiness score and safety status.
3. Panel B shows the device registry (all devices are in software-only draft state).
4. Panel C shows pairing readiness (no live pairing, no raw tokens displayed).
5. Panel D shows firmware readiness (no live updates).
6. Panel E shows hardware provider records (no live connections, no credentials shown).
7. Panel F shows aura state modes (software presets only, no live automation).
8. Panel G shows environment signals (simulated, not live sensor data).
9. Panel H shows privacy consent records (subject identity reference-only).
10. Panel I shows presence/access events (simulated, reference-only).
11. Panel J shows current AMBI blockers.
12. Panel K shows safe vs. unsafe AMBI claims.
13. Panel L shows audit log and feature flags.

---

## Troubleshooting Notes

- If summary returns `localPreview: true`, the database is not connected. The UI falls back to default data.
- If all devices show `hardware_ready: false`, this is expected — no hardware is provisioned.
- If aura states show `preview_only: true`, this is expected — all aura states are preview-only in this phase.
- If consent records show `pending`, this is expected — no consent has been formally obtained.

---

## AMBI Readiness Checklist (Admin Reference)

- [ ] Hardware provider selected and verified
- [ ] Physical devices procured and commissioned
- [ ] Device pairing tested in staging environment
- [ ] Firmware developed and tested on target hardware
- [ ] Privacy consent flow implemented and tested
- [ ] Security review of telemetry data flows complete
- [ ] `NOVEE_AMBI_HARDWARE_READY_ENABLED=true` set after hardware gates pass
- [ ] `NOVEE_AMBI_LIVE_DEVICE_CONNECTIONS_ENABLED=true` set after connection tests pass
- [ ] `NOVEE_AMBI_LIVE_TELEMETRY_ENABLED=true` set after telemetry pipeline is verified
- [ ] `NOVEE_AMBI_LIVE_DEVICE_CONTROL_ENABLED=true` set after safety review passes
- [ ] `NOVEE_AMBI_PRIVACY_CONSENT_REQUIRED=true` remains on throughout
