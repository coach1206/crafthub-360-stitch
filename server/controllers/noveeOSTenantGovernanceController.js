import * as svc from '../services/noveeOS/noveeOSTenantGovernanceService.js';

const ok500 = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }));
const actor = req => req.user?.id || req.headers['x-actor-id'] || 'system';
const ikey  = req => req.headers['x-idempotency-key'] || req.body?.idempotencyKey;

export const createOrganization             = (req, res) => ok500(res, async () => res.json(await svc.createOrganization({ payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listOrganizations              = (req, res) => ok500(res, async () => res.json(await svc.listOrganizations({ filters: req.query })));
export const getOrganization                = (req, res) => ok500(res, async () => res.json(await svc.getOrganization({ organizationId: req.params.organizationId })));
export const updateOrganizationStatus       = (req, res) => ok500(res, async () => res.json(await svc.updateOrganizationStatus({ organizationId: req.params.organizationId, status: req.body.status, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) })));
export const createOrganizationProfile      = (req, res) => ok500(res, async () => res.json(await svc.createOrganizationProfile({ organizationId: req.params.organizationId, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const getOrganizationProfile         = (req, res) => ok500(res, async () => res.json(await svc.getOrganizationProfile({ organizationId: req.params.organizationId })));

export const createVenueGroup               = (req, res) => ok500(res, async () => res.json(await svc.createVenueGroup({ organizationId: req.params.organizationId, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listVenueGroups                = (req, res) => ok500(res, async () => res.json(await svc.listVenueGroups({ organizationId: req.params.organizationId, filters: req.query })));
export const updateVenueGroupStatus         = (req, res) => ok500(res, async () => res.json(await svc.updateVenueGroupStatus({ venueGroupId: req.params.venueGroupId, status: req.body.status, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) })));

export const createVenue                    = (req, res) => ok500(res, async () => res.json(await svc.createVenue({ organizationId: req.params.organizationId, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listVenues                     = (req, res) => ok500(res, async () => res.json(await svc.listVenues({ organizationId: req.params.organizationId, filters: req.query })));
export const getVenue                       = (req, res) => ok500(res, async () => res.json(await svc.getVenue({ venueId: req.params.venueId })));
export const updateVenueStatus              = (req, res) => ok500(res, async () => res.json(await svc.updateVenueStatus({ venueId: req.params.venueId, status: req.body.status, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) })));
export const createVenueProfile             = (req, res) => ok500(res, async () => res.json(await svc.createVenueProfile({ venueId: req.params.venueId, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const getVenueProfile                = (req, res) => ok500(res, async () => res.json(await svc.getVenueProfile({ venueId: req.params.venueId })));

export const createWorkspace                = (req, res) => ok500(res, async () => res.json(await svc.createWorkspace({ organizationId: req.body.organizationId, venueId: req.body.venueId, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listWorkspaces                 = (req, res) => ok500(res, async () => res.json(await svc.listWorkspaces({ filters: req.query })));
export const getWorkspace                   = (req, res) => ok500(res, async () => res.json(await svc.getWorkspace({ workspaceId: req.params.workspaceId })));
export const updateWorkspaceStatus          = (req, res) => ok500(res, async () => res.json(await svc.updateWorkspaceStatus({ workspaceId: req.params.workspaceId, status: req.body.status, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) })));

export const createWorkspaceMembership      = (req, res) => ok500(res, async () => res.json(await svc.createWorkspaceMembership({ workspaceId: req.params.workspaceId, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listWorkspaceMemberships       = (req, res) => ok500(res, async () => res.json(await svc.listWorkspaceMemberships({ workspaceId: req.params.workspaceId, filters: req.query })));
export const updateWorkspaceMembershipStatus= (req, res) => ok500(res, async () => res.json(await svc.updateWorkspaceMembershipStatus({ membershipId: req.params.membershipId, status: req.body.status, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) })));
export const createWorkspaceRole            = (req, res) => ok500(res, async () => res.json(await svc.createWorkspaceRole({ workspaceId: req.params.workspaceId, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listWorkspaceRoles             = (req, res) => ok500(res, async () => res.json(await svc.listWorkspaceRoles({ workspaceId: req.params.workspaceId, filters: req.query })));

export const createWorkspaceAccessBoundary  = (req, res) => ok500(res, async () => res.json(await svc.createWorkspaceAccessBoundary({ workspaceId: req.params.workspaceId, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listWorkspaceAccessBoundaries  = (req, res) => ok500(res, async () => res.json(await svc.listWorkspaceAccessBoundaries({ workspaceId: req.params.workspaceId, filters: req.query })));
export const createDataBoundaryRecord       = (req, res) => ok500(res, async () => res.json(await svc.createDataBoundaryRecord({ payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listDataBoundaryRecords        = (req, res) => ok500(res, async () => res.json(await svc.listDataBoundaryRecords({ filters: req.query })));

export const createBusinessUnit             = (req, res) => ok500(res, async () => res.json(await svc.createBusinessUnit({ organizationId: req.params.organizationId, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listBusinessUnits              = (req, res) => ok500(res, async () => res.json(await svc.listBusinessUnits({ organizationId: req.params.organizationId, filters: req.query })));
export const createDepartment               = (req, res) => ok500(res, async () => res.json(await svc.createDepartment({ organizationId: req.params.organizationId, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listDepartments                = (req, res) => ok500(res, async () => res.json(await svc.listDepartments({ organizationId: req.params.organizationId, filters: req.query })));
export const createLocation                 = (req, res) => ok500(res, async () => res.json(await svc.createLocation({ organizationId: req.params.organizationId, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listLocations                  = (req, res) => ok500(res, async () => res.json(await svc.listLocations({ organizationId: req.params.organizationId, filters: req.query })));

export const createEnvironmentMode          = (req, res) => ok500(res, async () => res.json(await svc.createEnvironmentMode({ workspaceId: req.params.workspaceId, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listEnvironmentModes           = (req, res) => ok500(res, async () => res.json(await svc.listEnvironmentModes({ filters: req.query })));
export const updateEnvironmentMode          = (req, res) => ok500(res, async () => res.json(await svc.updateEnvironmentMode({ workspaceId: req.params.workspaceId, mode: req.body.mode, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) })));
export const createDemoLiveWorkspaceMode    = (req, res) => ok500(res, async () => res.json(await svc.createDemoLiveWorkspaceMode({ workspaceId: req.params.workspaceId, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listDemoLiveWorkspaceModes     = (req, res) => ok500(res, async () => res.json(await svc.listDemoLiveWorkspaceModes({ filters: req.query })));

export const createModuleWorkspaceAvailability   = (req, res) => ok500(res, async () => res.json(await svc.createModuleWorkspaceAvailability({ workspaceId: req.params.workspaceId, moduleKey: req.params.moduleKey, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listModuleWorkspaceAvailability     = (req, res) => ok500(res, async () => res.json(await svc.listModuleWorkspaceAvailability({ filters: req.query })));
export const createModuleVenueAvailability       = (req, res) => ok500(res, async () => res.json(await svc.createModuleVenueAvailability({ venueId: req.params.venueId, moduleKey: req.params.moduleKey, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listModuleVenueAvailability         = (req, res) => ok500(res, async () => res.json(await svc.listModuleVenueAvailability({ filters: req.query })));
export const createModuleOrganizationAvailability = (req, res) => ok500(res, async () => res.json(await svc.createModuleOrganizationAvailability({ organizationId: req.params.organizationId, moduleKey: req.params.moduleKey, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listModuleOrganizationAvailability  = (req, res) => ok500(res, async () => res.json(await svc.listModuleOrganizationAvailability({ filters: req.query })));

export const createTenantHealthCheck        = (req, res) => ok500(res, async () => res.json(await svc.createTenantHealthCheck({ payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listTenantHealthChecks         = (req, res) => ok500(res, async () => res.json(await svc.listTenantHealthChecks({ filters: req.query })));
export const createWorkspaceReadinessRecord = (req, res) => ok500(res, async () => res.json(await svc.createWorkspaceReadinessRecord({ workspaceId: req.params.workspaceId, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listWorkspaceReadinessRecords  = (req, res) => ok500(res, async () => res.json(await svc.listWorkspaceReadinessRecords({ filters: req.query })));

export const createTenantGovernanceSnapshot   = (req, res) => ok500(res, async () => res.json(await svc.createTenantGovernanceSnapshot({ actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const getLatestTenantGovernanceSnapshot = (req, res) => ok500(res, async () => res.json(await svc.getLatestTenantGovernanceSnapshot()));

export const getSafeTenantClaims            = (req, res) => ok500(res, async () => res.json(svc.getSafeTenantClaims()));
export const getUnsafeTenantClaims          = (req, res) => ok500(res, async () => res.json(svc.getUnsafeTenantClaims()));
export const getTenantHonestLimitations     = (req, res) => ok500(res, async () => res.json(svc.getTenantHonestLimitations()));
export const getTenantPhaseRoadmap          = (req, res) => ok500(res, async () => res.json(svc.getTenantPhaseRoadmap()));
