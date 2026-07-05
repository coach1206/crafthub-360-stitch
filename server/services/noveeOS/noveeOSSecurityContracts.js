// Phase C.4 / Module 4 of 7 — NOVEE OS Security Contracts

export const USER_STATUSES        = ['invited_placeholder','active_placeholder','suspended','removed','unavailable'];
export const ROLE_STATUSES        = ['draft','active_placeholder','disabled','deprecated','unavailable'];
export const PERMISSION_STATUSES  = ['draft','active_placeholder','disabled','unavailable'];
export const ASSIGNMENT_STATUSES  = ['pending_placeholder','active_placeholder','revoked','expired','unavailable'];
export const APPROVAL_STATUSES    = ['pending','approved_placeholder','rejected','cancelled','expired','unavailable'];
export const SECURITY_STATUSES    = ['not_configured','configured_placeholder','enforced_external','failed','disabled','unavailable'];
export const DECISION_STATUSES    = ['allowed_placeholder','denied','requires_approval','blocked','unavailable'];
export const REVIEW_STATUSES      = ['draft','in_review','approved_placeholder','rejected','remediation_required','unavailable'];
export const SCOPE_LEVELS         = ['platform','organization','venue_group','venue','workspace','module','route','feature','user','custom'];
export const ROLE_SCOPES          = ['platform_owner','platform_admin','organization_owner','organization_admin','venue_owner','venue_admin','workspace_admin','manager','staff','guest','auditor','support','system','custom'];
export const PERMISSION_GROUPS    = ['platform','modules','tenants','billing','security','pos360','smokecraft','eat','crafthub','reports','integrations','admin','custom'];
export const SENSITIVE_ACTION_TYPES = ['billing_change','license_change','module_activation','module_deactivation','tenant_change','venue_deployment','live_mode_change','user_role_change','permission_change','security_policy_change','provider_connection','data_export','destructive_action','custom'];
export const SECURITY_PROVIDER_KEYS = ['sso_placeholder','mfa_placeholder','device_trust_placeholder','ip_allowlist_placeholder','email_security_placeholder','sms_security_placeholder','identity_provider_placeholder','audit_provider_placeholder','other'];
export const ACCESS_DECISION_TYPES = ['module_access','route_access','feature_access','admin_access','billing_access','venue_access','workspace_access','private_data_access','financial_data_access','custom'];

export const isValidUserStatus          = s => USER_STATUSES.includes(s);
export const isValidRoleStatus          = s => ROLE_STATUSES.includes(s);
export const isValidPermissionStatus    = s => PERMISSION_STATUSES.includes(s);
export const isValidAssignmentStatus    = s => ASSIGNMENT_STATUSES.includes(s);
export const isValidApprovalStatus      = s => APPROVAL_STATUSES.includes(s);
export const isValidSecurityStatus      = s => SECURITY_STATUSES.includes(s);
export const isValidDecisionStatus      = s => DECISION_STATUSES.includes(s);
export const isValidReviewStatus        = s => REVIEW_STATUSES.includes(s);
export const isValidScopeLevel          = s => SCOPE_LEVELS.includes(s);
export const isValidRoleScope           = s => ROLE_SCOPES.includes(s);
export const isValidPermissionGroup     = s => PERMISSION_GROUPS.includes(s);
export const isValidSensitiveActionType = s => SENSITIVE_ACTION_TYPES.includes(s);
export const isValidSecurityProviderKey = s => SECURITY_PROVIDER_KEYS.includes(s);
export const isValidAccessDecisionType  = s => ACCESS_DECISION_TYPES.includes(s);
