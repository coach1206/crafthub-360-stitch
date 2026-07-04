// Mounted at /api/novee-os/tenants
// platformAdminGuardRequired = true
// All write routes guarded with canAccessPOS3 (closest platform admin guard available in Phase C.2)

import { Router } from 'express';
import { canAccessPOS3 } from '../middleware/roleMiddleware.js';
import * as c from '../controllers/noveeOSTenantGovernanceController.js';

const router = Router();

// ─── READ-ONLY PUBLIC ─────────────────────────────────────────────────────────
router.get('/organizations',                                         c.listOrganizations);
router.get('/organizations/:organizationId',                         c.getOrganization);
router.get('/organizations/:organizationId/profile',                 c.getOrganizationProfile);
router.get('/organizations/:organizationId/venue-groups',            c.listVenueGroups);
router.get('/organizations/:organizationId/venues',                  c.listVenues);
router.get('/organizations/:organizationId/business-units',          c.listBusinessUnits);
router.get('/organizations/:organizationId/departments',             c.listDepartments);
router.get('/organizations/:organizationId/locations',               c.listLocations);
router.get('/venues/:venueId',                                       c.getVenue);
router.get('/venues/:venueId/profile',                               c.getVenueProfile);
router.get('/workspaces',                                            c.listWorkspaces);
router.get('/workspaces/:workspaceId',                               c.getWorkspace);
router.get('/workspaces/:workspaceId/memberships',                   c.listWorkspaceMemberships);
router.get('/workspaces/:workspaceId/roles',                         c.listWorkspaceRoles);
router.get('/workspaces/:workspaceId/access-boundaries',             c.listWorkspaceAccessBoundaries);
router.get('/data-boundaries',                                       c.listDataBoundaryRecords);
router.get('/environment-modes',                                     c.listEnvironmentModes);
router.get('/demo-live-mode',                                        c.listDemoLiveWorkspaceModes);
router.get('/module-workspace-availability',                         c.listModuleWorkspaceAvailability);
router.get('/module-venue-availability',                             c.listModuleVenueAvailability);
router.get('/module-organization-availability',                      c.listModuleOrganizationAvailability);
router.get('/health-checks',                                         c.listTenantHealthChecks);
router.get('/workspace-readiness',                                   c.listWorkspaceReadinessRecords);
router.get('/snapshots/latest',                                      c.getLatestTenantGovernanceSnapshot);
router.get('/claims/safe',                                           c.getSafeTenantClaims);
router.get('/claims/unsafe',                                         c.getUnsafeTenantClaims);
router.get('/claims/honest-limitations',                             c.getTenantHonestLimitations);
router.get('/roadmap',                                               c.getTenantPhaseRoadmap);

// ─── GUARDED WRITES ───────────────────────────────────────────────────────────
router.post('/organizations',                                        canAccessPOS3, c.createOrganization);
router.patch('/organizations/:organizationId/status',                canAccessPOS3, c.updateOrganizationStatus);
router.post('/organizations/:organizationId/profile',                canAccessPOS3, c.createOrganizationProfile);

router.post('/organizations/:organizationId/venue-groups',           canAccessPOS3, c.createVenueGroup);
router.patch('/venue-groups/:venueGroupId/status',                   canAccessPOS3, c.updateVenueGroupStatus);

router.post('/organizations/:organizationId/venues',                 canAccessPOS3, c.createVenue);
router.patch('/venues/:venueId/status',                              canAccessPOS3, c.updateVenueStatus);
router.post('/venues/:venueId/profile',                              canAccessPOS3, c.createVenueProfile);

router.post('/workspaces',                                           canAccessPOS3, c.createWorkspace);
router.patch('/workspaces/:workspaceId/status',                      canAccessPOS3, c.updateWorkspaceStatus);

router.post('/workspaces/:workspaceId/memberships',                  canAccessPOS3, c.createWorkspaceMembership);
router.patch('/memberships/:membershipId/status',                    canAccessPOS3, c.updateWorkspaceMembershipStatus);

router.post('/workspaces/:workspaceId/roles',                        canAccessPOS3, c.createWorkspaceRole);

router.post('/workspaces/:workspaceId/access-boundaries',            canAccessPOS3, c.createWorkspaceAccessBoundary);
router.post('/data-boundaries',                                      canAccessPOS3, c.createDataBoundaryRecord);

router.post('/organizations/:organizationId/business-units',         canAccessPOS3, c.createBusinessUnit);
router.post('/organizations/:organizationId/departments',            canAccessPOS3, c.createDepartment);
router.post('/organizations/:organizationId/locations',              canAccessPOS3, c.createLocation);

router.post('/workspaces/:workspaceId/environment-modes',            canAccessPOS3, c.createEnvironmentMode);
router.patch('/workspaces/:workspaceId/environment-mode',            canAccessPOS3, c.updateEnvironmentMode);
router.post('/workspaces/:workspaceId/demo-live-mode',               canAccessPOS3, c.createDemoLiveWorkspaceMode);

router.post('/workspaces/:workspaceId/modules/:moduleKey/availability',    canAccessPOS3, c.createModuleWorkspaceAvailability);
router.post('/venues/:venueId/modules/:moduleKey/availability',            canAccessPOS3, c.createModuleVenueAvailability);
router.post('/organizations/:organizationId/modules/:moduleKey/availability', canAccessPOS3, c.createModuleOrganizationAvailability);

router.post('/health-checks',                                        canAccessPOS3, c.createTenantHealthCheck);
router.post('/workspaces/:workspaceId/readiness',                    canAccessPOS3, c.createWorkspaceReadinessRecord);
router.post('/snapshots',                                            canAccessPOS3, c.createTenantGovernanceSnapshot);

export default router;
