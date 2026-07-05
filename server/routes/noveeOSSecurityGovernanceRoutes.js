// Phase C.4 / Module 4 of 7 — NOVEE OS Security Governance Routes
// platformAdminGuardRequired = true

import { Router } from 'express';
import { canAccessPOS3 } from '../middleware/roleMiddleware.js';
import * as ctrl from '../controllers/noveeOSSecurityGovernanceController.js';

const router = Router();

// Platform Users
router.post('/users',                                    canAccessPOS3, ctrl.createPlatformUser);
router.get('/users',                                     ctrl.listPlatformUsers);
router.get('/users/:userId',                             ctrl.getPlatformUser);
router.patch('/users/:userId/status',                    canAccessPOS3, ctrl.updatePlatformUserStatus);
router.post('/users/:userId/profile',                    canAccessPOS3, ctrl.createUserProfile);
router.get('/users/:userId/profile',                     ctrl.getUserProfile);

// Roles
router.post('/roles',                                    canAccessPOS3, ctrl.createRoleCatalogEntry);
router.get('/roles',                                     ctrl.listRoleCatalog);
router.patch('/roles/:roleKey/status',                   canAccessPOS3, ctrl.updateRoleStatus);

// Permissions
router.post('/permissions',                              canAccessPOS3, ctrl.createPermissionCatalogEntry);
router.get('/permissions',                               ctrl.listPermissionCatalog);
router.patch('/permissions/:permissionKey/status',       canAccessPOS3, ctrl.updatePermissionStatus);
router.post('/permission-groups',                        canAccessPOS3, ctrl.createPermissionGroup);
router.get('/permission-groups',                         ctrl.listPermissionGroups);

// Role Permission Assignments
router.post('/roles/:roleKey/permissions/:permissionKey', canAccessPOS3, ctrl.createRolePermissionAssignment);
router.get('/role-permissions',                          ctrl.listRolePermissionAssignments);

// User Role Assignments
router.post('/users/:userId/roles/:roleKey',             canAccessPOS3, ctrl.createUserRoleAssignment);
router.get('/user-roles',                                ctrl.listUserRoleAssignments);
router.patch('/user-roles/:assignmentId/status',         canAccessPOS3, ctrl.updateUserRoleAssignmentStatus);

// User Access Grants
router.post('/users/:userId/access-grants',              canAccessPOS3, ctrl.createUserAccessGrant);
router.get('/access-grants',                             ctrl.listUserAccessGrants);

// Module Permission Rules
router.post('/modules/:moduleKey/permission-rules',      canAccessPOS3, ctrl.createModulePermissionRule);
router.get('/module-permission-rules',                   ctrl.listModulePermissionRules);

// Route Permission Rules
router.post('/routes/permission-rules',                  canAccessPOS3, ctrl.createRoutePermissionRule);
router.get('/route-permission-rules',                    ctrl.listRoutePermissionRules);

// Feature Permission Rules
router.post('/features/:featureKey/permission-rules',    canAccessPOS3, ctrl.createFeaturePermissionRule);
router.get('/feature-permission-rules',                  ctrl.listFeaturePermissionRules);

// Admin Approval Requests
router.post('/admin-approvals',                          canAccessPOS3, ctrl.createAdminApprovalRequest);
router.get('/admin-approvals',                           ctrl.listAdminApprovalRequests);
router.post('/admin-approvals/:approvalRequestId/decision', canAccessPOS3, ctrl.decideAdminApprovalRequest);

// Sensitive Action Requests
router.post('/sensitive-actions',                        canAccessPOS3, ctrl.createSensitiveActionRequest);
router.get('/sensitive-actions',                         ctrl.listSensitiveActionRequests);
router.post('/sensitive-actions/:sensitiveActionRequestId/decision', canAccessPOS3, ctrl.decideSensitiveActionRequest);

// Permission Decisions
router.post('/permission-decisions',                     canAccessPOS3, ctrl.createPermissionDecisionRecord);
router.get('/permission-decisions',                      ctrl.listPermissionDecisionRecords);
router.post('/permission-decisions/evaluate-placeholder', ctrl.evaluatePermissionDecisionPlaceholder);

// Access Denials
router.post('/access-denials',                           canAccessPOS3, ctrl.createAccessDenialRecord);
router.get('/access-denials',                            ctrl.listAccessDenialRecords);

// Session Policies
router.post('/session-policies',                         canAccessPOS3, ctrl.createSessionPolicyPlaceholder);
router.get('/session-policies',                          ctrl.listSessionPolicyPlaceholders);

// MFA Policies
router.post('/mfa-policies',                             canAccessPOS3, ctrl.createMfaPolicyPlaceholder);
router.get('/mfa-policies',                              ctrl.listMfaPolicyPlaceholders);

// SSO Providers
router.post('/sso-providers',                            canAccessPOS3, ctrl.createSsoProviderPlaceholder);
router.get('/sso-providers',                             ctrl.listSsoProviderPlaceholders);

// Device Trust
router.post('/device-trust',                             canAccessPOS3, ctrl.createDeviceTrustPlaceholder);
router.get('/device-trust',                              ctrl.listDeviceTrustPlaceholders);

// IP Allowlist
router.post('/ip-allowlist',                             canAccessPOS3, ctrl.createIpAllowlistPlaceholder);
router.get('/ip-allowlist',                              ctrl.listIpAllowlistPlaceholders);

// Security Events
router.post('/security-events',                          canAccessPOS3, ctrl.createSecurityEventRecord);
router.get('/security-events',                           ctrl.listSecurityEventRecords);

// Governance Reviews
router.post('/governance-reviews',                       canAccessPOS3, ctrl.createGovernanceReviewRecord);
router.get('/governance-reviews',                        ctrl.listGovernanceReviewRecords);
router.patch('/governance-reviews/:reviewId/status',     canAccessPOS3, ctrl.updateGovernanceReviewStatus);

// Snapshots
router.post('/snapshots',                                canAccessPOS3, ctrl.createPlatformSecuritySnapshot);
router.get('/snapshots/latest',                          ctrl.getLatestPlatformSecuritySnapshot);

// Claims / Meta
router.get('/claims/safe',                               ctrl.getSafeSecurityClaims);
router.get('/claims/unsafe',                             ctrl.getUnsafeSecurityClaims);
router.get('/honest-limitations',                        ctrl.getSecurityHonestLimitations);
router.get('/roadmap',                                   ctrl.getSecurityPhaseRoadmap);

export default router;
