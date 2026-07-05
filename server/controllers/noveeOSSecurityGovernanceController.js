// Phase C.4 / Module 4 of 7 — NOVEE OS Security Governance Controller

import * as svc from '../services/noveeOS/noveeOSSecurityGovernanceService.js';

const ok500      = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }));
const actorUserId = req => req.user?.id || req.headers['x-actor-id'] || 'system';
const ikey       = req => req.headers['x-idempotency-key'] || req.body?.idempotencyKey;

// Platform Users
export const createPlatformUser         = (req, res) => ok500(res, async () => res.json(await svc.createPlatformUser({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listPlatformUsers          = (req, res) => ok500(res, async () => res.json(await svc.listPlatformUsers({ filters: req.query })));
export const getPlatformUser            = (req, res) => ok500(res, async () => res.json(await svc.getPlatformUser({ userId: req.params.userId })));
export const updatePlatformUserStatus   = (req, res) => ok500(res, async () => res.json(await svc.updatePlatformUserStatus({ ...req.params, ...req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const createUserProfile          = (req, res) => ok500(res, async () => res.json(await svc.createUserProfile({ userId: req.params.userId, payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const getUserProfile             = (req, res) => ok500(res, async () => res.json(await svc.getUserProfile({ userId: req.params.userId })));

// Roles
export const createRoleCatalogEntry     = (req, res) => ok500(res, async () => res.json(await svc.createRoleCatalogEntry({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listRoleCatalog            = (req, res) => ok500(res, async () => res.json(await svc.listRoleCatalog({ filters: req.query })));
export const updateRoleStatus           = (req, res) => ok500(res, async () => res.json(await svc.updateRoleStatus({ ...req.params, ...req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));

// Permissions
export const createPermissionCatalogEntry = (req, res) => ok500(res, async () => res.json(await svc.createPermissionCatalogEntry({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listPermissionCatalog        = (req, res) => ok500(res, async () => res.json(await svc.listPermissionCatalog({ filters: req.query })));
export const updatePermissionStatus       = (req, res) => ok500(res, async () => res.json(await svc.updatePermissionStatus({ ...req.params, ...req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const createPermissionGroup        = (req, res) => ok500(res, async () => res.json(await svc.createPermissionGroup({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listPermissionGroups         = (req, res) => ok500(res, async () => res.json(await svc.listPermissionGroups({ filters: req.query })));

// Assignments
export const createRolePermissionAssignment    = (req, res) => ok500(res, async () => res.json(await svc.createRolePermissionAssignment({ roleKey: req.params.roleKey, permissionKey: req.params.permissionKey, payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listRolePermissionAssignments     = (req, res) => ok500(res, async () => res.json(await svc.listRolePermissionAssignments({ filters: req.query })));
export const createUserRoleAssignment          = (req, res) => ok500(res, async () => res.json(await svc.createUserRoleAssignment({ userId: req.params.userId, roleKey: req.params.roleKey, payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listUserRoleAssignments           = (req, res) => ok500(res, async () => res.json(await svc.listUserRoleAssignments({ filters: req.query })));
export const updateUserRoleAssignmentStatus    = (req, res) => ok500(res, async () => res.json(await svc.updateUserRoleAssignmentStatus({ ...req.params, ...req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const createUserAccessGrant             = (req, res) => ok500(res, async () => res.json(await svc.createUserAccessGrant({ userId: req.params.userId, payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listUserAccessGrants              = (req, res) => ok500(res, async () => res.json(await svc.listUserAccessGrants({ filters: req.query })));

// Permission Rules
export const createModulePermissionRule  = (req, res) => ok500(res, async () => res.json(await svc.createModulePermissionRule({ moduleKey: req.params.moduleKey, payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listModulePermissionRules   = (req, res) => ok500(res, async () => res.json(await svc.listModulePermissionRules({ filters: req.query })));
export const createRoutePermissionRule   = (req, res) => ok500(res, async () => res.json(await svc.createRoutePermissionRule({ routePath: req.body.routePath, payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listRoutePermissionRules    = (req, res) => ok500(res, async () => res.json(await svc.listRoutePermissionRules({ filters: req.query })));
export const createFeaturePermissionRule = (req, res) => ok500(res, async () => res.json(await svc.createFeaturePermissionRule({ featureKey: req.params.featureKey, payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listFeaturePermissionRules  = (req, res) => ok500(res, async () => res.json(await svc.listFeaturePermissionRules({ filters: req.query })));

// Approvals
export const createAdminApprovalRequest        = (req, res) => ok500(res, async () => res.json(await svc.createAdminApprovalRequest({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listAdminApprovalRequests         = (req, res) => ok500(res, async () => res.json(await svc.listAdminApprovalRequests({ filters: req.query })));
export const decideAdminApprovalRequest        = (req, res) => ok500(res, async () => res.json(await svc.decideAdminApprovalRequest({ approvalRequestId: req.params.approvalRequestId, ...req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const createSensitiveActionRequest      = (req, res) => ok500(res, async () => res.json(await svc.createSensitiveActionRequest({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listSensitiveActionRequests       = (req, res) => ok500(res, async () => res.json(await svc.listSensitiveActionRequests({ filters: req.query })));
export const decideSensitiveActionRequest      = (req, res) => ok500(res, async () => res.json(await svc.decideSensitiveActionRequest({ sensitiveActionRequestId: req.params.sensitiveActionRequestId, ...req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));

// Decisions / Denials
export const createPermissionDecisionRecord    = (req, res) => ok500(res, async () => res.json(await svc.createPermissionDecisionRecord({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listPermissionDecisionRecords     = (req, res) => ok500(res, async () => res.json(await svc.listPermissionDecisionRecords({ filters: req.query })));
export const evaluatePermissionDecisionPlaceholder = (req, res) => ok500(res, async () => res.json(await svc.evaluatePermissionDecisionPlaceholder({ ...req.body })));
export const createAccessDenialRecord          = (req, res) => ok500(res, async () => res.json(await svc.createAccessDenialRecord({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listAccessDenialRecords           = (req, res) => ok500(res, async () => res.json(await svc.listAccessDenialRecords({ filters: req.query })));

// Security Placeholders
export const createSessionPolicyPlaceholder    = (req, res) => ok500(res, async () => res.json(await svc.createSessionPolicyPlaceholder({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listSessionPolicyPlaceholders     = (req, res) => ok500(res, async () => res.json(await svc.listSessionPolicyPlaceholders()));
export const createMfaPolicyPlaceholder        = (req, res) => ok500(res, async () => res.json(await svc.createMfaPolicyPlaceholder({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listMfaPolicyPlaceholders         = (req, res) => ok500(res, async () => res.json(await svc.listMfaPolicyPlaceholders()));
export const createSsoProviderPlaceholder      = (req, res) => ok500(res, async () => res.json(await svc.createSsoProviderPlaceholder({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listSsoProviderPlaceholders       = (req, res) => ok500(res, async () => res.json(await svc.listSsoProviderPlaceholders()));
export const createDeviceTrustPlaceholder      = (req, res) => ok500(res, async () => res.json(await svc.createDeviceTrustPlaceholder({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listDeviceTrustPlaceholders       = (req, res) => ok500(res, async () => res.json(await svc.listDeviceTrustPlaceholders()));
export const createIpAllowlistPlaceholder      = (req, res) => ok500(res, async () => res.json(await svc.createIpAllowlistPlaceholder({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listIpAllowlistPlaceholders       = (req, res) => ok500(res, async () => res.json(await svc.listIpAllowlistPlaceholders()));

// Events / Reviews
export const createSecurityEventRecord         = (req, res) => ok500(res, async () => res.json(await svc.createSecurityEventRecord({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listSecurityEventRecords          = (req, res) => ok500(res, async () => res.json(await svc.listSecurityEventRecords({ filters: req.query })));
export const createGovernanceReviewRecord      = (req, res) => ok500(res, async () => res.json(await svc.createGovernanceReviewRecord({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listGovernanceReviewRecords       = (req, res) => ok500(res, async () => res.json(await svc.listGovernanceReviewRecords({ filters: req.query })));
export const updateGovernanceReviewStatus      = (req, res) => ok500(res, async () => res.json(await svc.updateGovernanceReviewStatus({ reviewId: req.params.reviewId, ...req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));

// Snapshots
export const createPlatformSecuritySnapshot    = (req, res) => ok500(res, async () => res.json(await svc.createPlatformSecuritySnapshot({ actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const getLatestPlatformSecuritySnapshot = (req, res) => ok500(res, async () => res.json(await svc.getLatestPlatformSecuritySnapshot()));

// Claims / Meta
export const getSafeSecurityClaims             = (req, res) => ok500(res, async () => res.json(svc.getSafeSecurityClaims()));
export const getUnsafeSecurityClaims           = (req, res) => ok500(res, async () => res.json(svc.getUnsafeSecurityClaims()));
export const getSecurityHonestLimitations      = (req, res) => ok500(res, async () => res.json(svc.getSecurityHonestLimitations()));
export const getSecurityPhaseRoadmap           = (req, res) => ok500(res, async () => res.json(svc.getSecurityPhaseRoadmap()));
