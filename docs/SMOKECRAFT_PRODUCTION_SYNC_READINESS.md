# SmokeCraft Production Sync Readiness

Module Build 7 of 9 — NOVEE OS SmokeCraft Module

## Overview

This module implements the production-readiness integration layer for SmokeCraft. It covers database persistence detection, provider connector registry, environment variable validation, sync event queue management, integration health reporting, and secret safety enforcement.

## Honest Status Rules

- `productionReady: false` always in this build — no live connectors verified
- `persistenceMode: "memory_fallback"` when no DATABASE_URL is set
- `connectionStatus: "not_connected"` for all provider connectors in this build
- `connected: false` always — connector registry never claims connected without real verification
- Secret values are never sent to the frontend — only presence (boolean) and `[REDACTED]` placeholder

## Architecture

### Data Contracts (`src/modules/smokecraft/data/`)

| File | Purpose |
|------|---------|
| `smokecraftEnvironmentContract.js` | 16 ENV_VARS with `critical`, `category`, `secret` metadata |
| `smokecraftConnectorContract.js` | 10 CONNECTOR_CATEGORIES, CONNECTION_STATUSES, HEALTH_STATUSES |
| `smokecraftProductionSyncContract.js` | 10 SYNC_STATUSES, TARGET_SYSTEMS, MAX_RETRY_ATTEMPTS=3 |
| `smokecraftIntegrationContract.js` | `createIntegrationStatus()` with all subsystem shapes |

### Backend Services (`server/services/smokecraft/`)

| Service | Purpose |
|---------|---------|
| `smokecraftSecretSafetyService.js` | Secret detection, redaction, frontend safety assertion |
| `smokecraftEnvironmentValidationService.js` | ENV_VARS presence validation, never prints values |
| `smokecraftDatabaseReadinessService.js` | Persistence mode detection, honest 3-state result |
| `smokecraftSyncEventStore.js` | In-memory sync event store; guards against false synced claims |
| `smokecraftConnectorAuditService.js` | 9 audit event types; always `containsSecrets: false` |
| `smokecraftProviderConnectorRegistry.js` | 10 connectors; never sets `connected: true` |
| `smokecraftSyncRetryService.js` | Exponential backoff retry; blocks when connector not live |
| `smokecraftProductionSyncQueueService.js` | Queue functions for POS360, E.A.T., Pairing, Venue Menu |
| `smokecraftIntegrationHealthService.js` | Health summary for all 10 systems; `productionReady: false` |
| `smokecraftProductionReadinessService.js` | Production gate; lists all blockers |

### API Routes (`/api/modules/smokecraft/integrations/`)

| Method | Path | Handler |
|--------|------|---------|
| GET | `/status` | Integration system status |
| GET | `/environment` | Env var presence (values stripped) |
| GET | `/database` | Database persistence mode |
| GET | `/connectors` | Connector registry |
| GET | `/health` | Integration health summary |
| GET | `/production-readiness` | Production gate with blockers |
| GET | `/sync/events` | Sync queue status |
| POST | `/sync/queue` | Queue a sync event |
| POST | `/sync/:id/retry` | Retry a sync event |
| GET | `/audit` | Connector audit log |

### Frontend Components (`src/modules/smokecraft/components/`)

| Component | Shows |
|-----------|-------|
| `SmokeCraftIntegrationStatusPanel.jsx` | All 10 integration rows with health chips |
| `SmokeCraftDatabaseReadinessPanel.jsx` | Persistence mode, warnings, memory_fallback alert |
| `SmokeCraftProviderConnectorsPanel.jsx` | 10 connectors with connection status |
| `SmokeCraftProductionSyncPanel.jsx` | Sync queue counts and recent events |
| `SmokeCraftEnvironmentValidationPanel.jsx` | ENV_VARS presence (never values), secret safety notice |

## Sync Event Lifecycle

```
queued → ready → attempting → synced (requires _connectorConfirmed: true)
                           ↘ failed → retry_scheduled → (retry loop up to 3x) → dead_letter
        ↘ blocked_missing_config
        ↘ blocked_not_connected
        ↘ preview_only
```

## Secret Safety

All secret values are redacted before any API response:
- `safeEnvPresence(varName)` returns `{ name, present: boolean, value: '[REDACTED]' }`
- `getEnvironmentStatus` controller strips all values: `{ ...v, value: '[REDACTED]' }`
- `assertNoFrontendSecretExposure()` confirms `containsSecrets: false`
- `detectPotentialSecretLeak(text)` scans for `sk_live`, Bearer tokens, `api_key=` patterns

## Production Readiness Blockers (all active in this build)

1. No DATABASE_URL — running in memory fallback
2. POS360 not connected
3. E.A.T. system not connected
4. Pairing provider not connected — using local_intelligence
5. Venue menu provider not connected — using local_fallback
6. Passport connections not connected
7. Loyalty provider not connected
8. Billing provider — preview_only, no charges
9. Marketplace — not_live_marketplace
10. License — license_not_enforced

## Verify

```bash
npm run verify:smokecraft-production-sync-readiness
```
