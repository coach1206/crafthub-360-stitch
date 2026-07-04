// POS360 External Integrations Routes — mounted at /api/pos360/integrations

import { Router } from 'express';
import { canAccessPOS3 } from '../middleware/roleMiddleware.js';
import * as c from '../controllers/pos360ExternalIntegrationsController.js';

const router = Router();

// Provider Profiles
router.get('/providers', c.listProviderProfiles);
router.get('/providers/:id', c.getProviderProfile);
router.post('/providers', canAccessPOS3, c.upsertProviderProfile);
router.delete('/providers/:id', canAccessPOS3, c.deleteProviderProfile);

// Overlay Connectors
router.get('/connectors', c.listOverlayConnectors);
router.post('/connectors', canAccessPOS3, c.upsertOverlayConnector);

// Capability Registry
router.get('/capabilities/:provider_id', c.listCapabilities);
router.post('/capabilities', canAccessPOS3, c.upsertCapability);

// Readiness Results
router.get('/readiness/:provider_id', c.listReadinessResults);
router.post('/readiness', canAccessPOS3, c.insertReadinessResult);

// Credential Metadata
router.get('/credentials', c.listCredentialMetadata);
router.post('/credentials', canAccessPOS3, c.upsertCredentialMetadata);

// Webhook Endpoints
router.get('/webhooks/endpoints', c.listWebhookEndpoints);
router.post('/webhooks/endpoints', canAccessPOS3, c.upsertWebhookEndpoint);
router.delete('/webhooks/endpoints/:id', canAccessPOS3, c.deleteWebhookEndpoint);

// Webhook Intake
router.get('/webhooks/events', c.listWebhookEvents);
router.post('/webhooks/events', c.insertWebhookEvent);

// Sync Job Definitions
router.get('/sync/jobs', c.listSyncJobDefinitions);
router.post('/sync/jobs', canAccessPOS3, c.upsertSyncJobDefinition);

// Sync Job Runs
router.get('/sync/jobs/:job_id/runs', c.listSyncJobRuns);
router.post('/sync/runs', canAccessPOS3, c.insertSyncJobRun);

// Retry Policies
router.get('/sync/retry-policies', c.listRetryPolicies);
router.post('/sync/retry-policies', canAccessPOS3, c.upsertRetryPolicy);

// Sync Errors
router.get('/sync/runs/:run_id/errors', c.listSyncErrors);
router.post('/sync/errors', c.insertSyncError);

// Conflict Records
router.get('/sync/conflicts', c.listConflictRecords);
router.post('/sync/conflicts', canAccessPOS3, c.insertConflictRecord);
router.patch('/sync/conflicts/:id/resolve', canAccessPOS3, c.resolveConflict);

// Reconciliation
router.get('/sync/reconciliations', c.listReconciliationRecords);
router.post('/sync/reconciliations', canAccessPOS3, c.insertReconciliationRecord);

// Data Mapping Profiles
router.get('/mapping/profiles', c.listMappingProfiles);
router.post('/mapping/profiles', canAccessPOS3, c.upsertMappingProfile);

// Data Mapping Rules
router.get('/mapping/profiles/:profile_id/rules', c.listMappingRules);
router.post('/mapping/rules', canAccessPOS3, c.upsertMappingRule);

// Import Batches
router.get('/import/batches', c.listImportBatches);
router.post('/import/batches', canAccessPOS3, c.insertImportBatch);

// Export Batches
router.get('/export/batches', c.listExportBatches);
router.post('/export/batches', canAccessPOS3, c.insertExportBatch);

// Data Lineage
router.get('/lineage', c.listDataLineageRecords);
router.post('/lineage', c.insertDataLineageRecord);

// E.A.T. Sync Visibility
router.get('/visibility/eat', c.listEatSyncVisibility);
router.post('/visibility/eat', canAccessPOS3, c.upsertEatSyncVisibility);

// SmokeCraft Sync Visibility
router.get('/visibility/smokecraft', c.listSmokecraftSyncVisibility);
router.post('/visibility/smokecraft', canAccessPOS3, c.upsertSmokecraftSyncVisibility);

// Offline Queue
router.get('/offline-queue', c.listOfflineQueue);
router.post('/offline-queue', c.enqueueOfflineItem);
router.patch('/offline-queue/:id/processed', canAccessPOS3, c.markOfflineItemProcessed);

// Audit Log
router.get('/audit', c.listIntegrationAudit);

export default router;
