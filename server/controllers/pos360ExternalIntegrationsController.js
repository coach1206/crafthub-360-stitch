// POS360 External Integrations Controller

import * as svc from '../services/pos360/pos360ExternalIntegrationsService.js';

const ok500 = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }));

const vid = req => req.headers['x-venue-id'] || req.query.venue_id || req.body?.venue_id;
const actor = req => req.headers['x-actor-id'] || req.user?.id || 'unknown';
const tid = req => req.headers['x-transaction-id'] || null;

// Provider Profiles
export const listProviderProfiles = (req, res) => ok500(res, async () => res.json(await svc.listProviderProfiles(vid(req))));
export const getProviderProfile = (req, res) => ok500(res, async () => res.json(await svc.getProviderProfile(vid(req), req.params.id)));
export const upsertProviderProfile = (req, res) => ok500(res, async () => res.json(await svc.upsertProviderProfile(vid(req), actor(req), req.body)));
export const deleteProviderProfile = (req, res) => ok500(res, async () => res.json(await svc.deleteProviderProfile(vid(req), actor(req), req.params.id)));

// Overlay Connectors
export const listOverlayConnectors = (req, res) => ok500(res, async () => res.json(await svc.listOverlayConnectors(vid(req))));
export const upsertOverlayConnector = (req, res) => ok500(res, async () => res.json(await svc.upsertOverlayConnector(vid(req), actor(req), req.body)));

// Capability Registry
export const listCapabilities = (req, res) => ok500(res, async () => res.json(await svc.listCapabilities(vid(req), req.params.provider_id)));
export const upsertCapability = (req, res) => ok500(res, async () => res.json(await svc.upsertCapability(vid(req), actor(req), req.body)));

// Readiness Results
export const listReadinessResults = (req, res) => ok500(res, async () => res.json(await svc.listReadinessResults(vid(req), req.params.provider_id)));
export const insertReadinessResult = (req, res) => ok500(res, async () => res.json(await svc.insertReadinessResult(vid(req), actor(req), req.body)));

// Credential Metadata
export const listCredentialMetadata = (req, res) => ok500(res, async () => res.json(await svc.listCredentialMetadata(vid(req))));
export const upsertCredentialMetadata = (req, res) => ok500(res, async () => res.json(await svc.upsertCredentialMetadata(vid(req), actor(req), req.body)));

// Webhook Endpoints
export const listWebhookEndpoints = (req, res) => ok500(res, async () => res.json(await svc.listWebhookEndpoints(vid(req))));
export const upsertWebhookEndpoint = (req, res) => ok500(res, async () => res.json(await svc.upsertWebhookEndpoint(vid(req), actor(req), req.body)));
export const deleteWebhookEndpoint = (req, res) => ok500(res, async () => res.json(await svc.deleteWebhookEndpoint(vid(req), actor(req), req.params.id)));

// Webhook Intake
export const listWebhookEvents = (req, res) => ok500(res, async () => res.json(await svc.listWebhookEvents(vid(req), req.query)));
export const insertWebhookEvent = (req, res) => ok500(res, async () => res.json(await svc.insertWebhookEvent(vid(req), req.body)));

// Sync Job Definitions
export const listSyncJobDefinitions = (req, res) => ok500(res, async () => res.json(await svc.listSyncJobDefinitions(vid(req))));
export const upsertSyncJobDefinition = (req, res) => ok500(res, async () => res.json(await svc.upsertSyncJobDefinition(vid(req), actor(req), req.body)));

// Sync Job Runs
export const listSyncJobRuns = (req, res) => ok500(res, async () => res.json(await svc.listSyncJobRuns(vid(req), req.params.job_id)));
export const insertSyncJobRun = (req, res) => ok500(res, async () => res.json(await svc.insertSyncJobRun(vid(req), actor(req), req.body)));

// Retry Policies
export const listRetryPolicies = (req, res) => ok500(res, async () => res.json(await svc.listRetryPolicies(vid(req))));
export const upsertRetryPolicy = (req, res) => ok500(res, async () => res.json(await svc.upsertRetryPolicy(vid(req), actor(req), req.body)));

// Sync Errors
export const listSyncErrors = (req, res) => ok500(res, async () => res.json(await svc.listSyncErrors(vid(req), req.params.run_id)));
export const insertSyncError = (req, res) => ok500(res, async () => res.json(await svc.insertSyncError(vid(req), req.body)));

// Conflict Records
export const listConflictRecords = (req, res) => ok500(res, async () => res.json(await svc.listConflictRecords(vid(req), req.query)));
export const insertConflictRecord = (req, res) => ok500(res, async () => res.json(await svc.insertConflictRecord(vid(req), actor(req), req.body)));
export const resolveConflict = (req, res) => ok500(res, async () => res.json(await svc.resolveConflict(vid(req), actor(req), req.params.id, req.body.conflict_status)));

// Reconciliation
export const listReconciliationRecords = (req, res) => ok500(res, async () => res.json(await svc.listReconciliationRecords(vid(req))));
export const insertReconciliationRecord = (req, res) => ok500(res, async () => res.json(await svc.insertReconciliationRecord(vid(req), actor(req), req.body)));

// Data Mapping Profiles
export const listMappingProfiles = (req, res) => ok500(res, async () => res.json(await svc.listMappingProfiles(vid(req))));
export const upsertMappingProfile = (req, res) => ok500(res, async () => res.json(await svc.upsertMappingProfile(vid(req), actor(req), req.body)));

// Data Mapping Rules
export const listMappingRules = (req, res) => ok500(res, async () => res.json(await svc.listMappingRules(vid(req), req.params.profile_id)));
export const upsertMappingRule = (req, res) => ok500(res, async () => res.json(await svc.upsertMappingRule(vid(req), actor(req), req.body)));

// Import Batches
export const listImportBatches = (req, res) => ok500(res, async () => res.json(await svc.listImportBatches(vid(req))));
export const insertImportBatch = (req, res) => ok500(res, async () => res.json(await svc.insertImportBatch(vid(req), actor(req), req.body)));

// Export Batches
export const listExportBatches = (req, res) => ok500(res, async () => res.json(await svc.listExportBatches(vid(req))));
export const insertExportBatch = (req, res) => ok500(res, async () => res.json(await svc.insertExportBatch(vid(req), actor(req), req.body)));

// Data Lineage
export const listDataLineageRecords = (req, res) => ok500(res, async () => res.json(await svc.listDataLineageRecords(vid(req), req.query)));
export const insertDataLineageRecord = (req, res) => ok500(res, async () => res.json(await svc.insertDataLineageRecord(vid(req), req.body)));

// E.A.T. Sync Visibility
export const listEatSyncVisibility = (req, res) => ok500(res, async () => res.json(await svc.listEatSyncVisibility(vid(req))));
export const upsertEatSyncVisibility = (req, res) => ok500(res, async () => res.json(await svc.upsertEatSyncVisibility(vid(req), actor(req), req.body)));

// SmokeCraft Sync Visibility
export const listSmokecraftSyncVisibility = (req, res) => ok500(res, async () => res.json(await svc.listSmokecraftSyncVisibility(vid(req))));
export const upsertSmokecraftSyncVisibility = (req, res) => ok500(res, async () => res.json(await svc.upsertSmokecraftSyncVisibility(vid(req), actor(req), req.body)));

// Offline Queue
export const listOfflineQueue = (req, res) => ok500(res, async () => res.json(await svc.listOfflineQueue(vid(req))));
export const enqueueOfflineItem = (req, res) => ok500(res, async () => res.json(await svc.enqueueOfflineItem(vid(req), req.body)));
export const markOfflineItemProcessed = (req, res) => ok500(res, async () => res.json(await svc.markOfflineItemProcessed(vid(req), req.params.id)));

// Audit Log
export const listIntegrationAudit = (req, res) => ok500(res, async () => res.json(await svc.listIntegrationAudit(vid(req), req.query)));
