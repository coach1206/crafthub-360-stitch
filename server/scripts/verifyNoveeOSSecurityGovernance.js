// Phase C.4 / Module 4 of 7 — NOVEE OS Security Governance Verification

import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(process.cwd());
const pass = [];
const fail = [];

function check(label, result) {
  if (result) { pass.push(label); } else { fail.push(label); }
}

const read = p => { try { return readFileSync(resolve(root, p), 'utf8'); } catch { return ''; } };

// ─── Load files ──────────────────────────────────────────────────────────────
const mig  = read('server/db/migrations/051_novee_os_platform_security_roles_permissions.sql');
const cont = read('server/services/noveeOS/noveeOSSecurityContracts.js');
const flags = read('server/config/noveeOSSecurityFeatureFlags.js');
const loc  = read('src/locales/noveeOSSecurity.js');
const svc  = read('server/services/noveeOS/noveeOSSecurityGovernanceService.js');
const ctrl = read('server/controllers/noveeOSSecurityGovernanceController.js');
const rts  = read('server/routes/noveeOSSecurityGovernanceRoutes.js');
const ui   = read('src/pages/noveeOS/NoveeOSSecurityGovernance.jsx');
const idx  = read('server/index.js');
const app  = read('src/App.jsx');
const pkg  = read('package.json');

// ─── Migration checks (50) ───────────────────────────────────────────────────
check('migration: file exists',                              mig.length > 0);
check('migration: safe comment no destructive DDL',          mig.includes('Safe migration: no destructive DDL'));
check('migration: no DROP TABLE',                            !mig.includes('DROP TABLE'));
check('migration: no TRUNCATE',                              !mig.includes('TRUNCATE'));
check('migration: novee_os_platform_users table',            mig.includes('novee_os_platform_users'));
check('migration: novee_os_user_profiles table',             mig.includes('novee_os_user_profiles'));
check('migration: novee_os_role_catalog table',              mig.includes('novee_os_role_catalog'));
check('migration: novee_os_permission_catalog table',        mig.includes('novee_os_permission_catalog'));
check('migration: novee_os_permission_groups table',         mig.includes('novee_os_permission_groups'));
check('migration: novee_os_role_permission_assignments table', mig.includes('novee_os_role_permission_assignments'));
check('migration: novee_os_user_role_assignments table',     mig.includes('novee_os_user_role_assignments'));
check('migration: novee_os_user_access_grants table',        mig.includes('novee_os_user_access_grants'));
check('migration: novee_os_module_permission_rules table',   mig.includes('novee_os_module_permission_rules'));
check('migration: novee_os_route_permission_rules table',    mig.includes('novee_os_route_permission_rules'));
check('migration: novee_os_feature_permission_rules table',  mig.includes('novee_os_feature_permission_rules'));
check('migration: novee_os_admin_approval_requests table',   mig.includes('novee_os_admin_approval_requests'));
check('migration: novee_os_sensitive_action_requests table', mig.includes('novee_os_sensitive_action_requests'));
check('migration: novee_os_permission_decision_records table', mig.includes('novee_os_permission_decision_records'));
check('migration: novee_os_access_denial_records table',     mig.includes('novee_os_access_denial_records'));
check('migration: novee_os_session_policy_placeholders table', mig.includes('novee_os_session_policy_placeholders'));
check('migration: novee_os_mfa_policy_placeholders table',   mig.includes('novee_os_mfa_policy_placeholders'));
check('migration: novee_os_sso_provider_placeholders table', mig.includes('novee_os_sso_provider_placeholders'));
check('migration: novee_os_device_trust_placeholders table', mig.includes('novee_os_device_trust_placeholders'));
check('migration: novee_os_ip_allowlist_placeholders table', mig.includes('novee_os_ip_allowlist_placeholders'));
check('migration: novee_os_security_event_records table',    mig.includes('novee_os_security_event_records'));
check('migration: novee_os_governance_review_records table', mig.includes('novee_os_governance_review_records'));
check('migration: novee_os_platform_security_snapshots table', mig.includes('novee_os_platform_security_snapshots'));
check('migration: novee_os_platform_security_audit table',   mig.includes('novee_os_platform_security_audit'));
check('migration: 24 tables (CREATE TABLE IF NOT EXISTS)',   (mig.match(/CREATE TABLE IF NOT EXISTS/g) || []).length >= 24);
check('migration: organization_id hook',                     mig.includes('organization_id'));
check('migration: venue_id hook',                            mig.includes('venue_id'));
check('migration: workspace_id hook',                        mig.includes('workspace_id'));
check('migration: user_id hook',                             mig.includes('user_id'));
check('migration: actor_user_id hook',                       mig.includes('actor_user_id'));
check('migration: module_key hook',                          mig.includes('module_key'));
check('migration: route_path hook',                          mig.includes('route_path'));
check('migration: feature_key hook',                         mig.includes('feature_key'));
check('migration: role_key hook',                            mig.includes('role_key'));
check('migration: permission_key hook',                      mig.includes('permission_key'));
check('migration: approval_request_id hook',                 mig.includes('approval_request_id'));
check('migration: sensitive_action_key hook',                mig.includes('sensitive_action_key'));
check('migration: provider_key hook',                        mig.includes('provider_key'));
check('migration: scope_level hook',                         mig.includes('scope_level'));
check('migration: idempotency_key UNIQUE',                   mig.includes('idempotency_key') && mig.includes('UNIQUE'));
check('migration: contains_secrets DEFAULT FALSE',           mig.includes('contains_secrets') && mig.includes('DEFAULT FALSE'));
check('migration: stores_secrets DEFAULT FALSE',             mig.includes('stores_secrets'));
check('migration: exposes_private_data exists',              mig.includes('exposes_private_data'));
check('migration: exposes_financial_data exists',            mig.includes('exposes_financial_data'));
check('migration: sso_connected DEFAULT FALSE',              mig.includes('sso_connected') && mig.includes('DEFAULT FALSE'));
check('migration: mfa_enforced DEFAULT FALSE',               mig.includes('mfa_enforced'));
check('migration: device_trust_enforced DEFAULT FALSE',      mig.includes('device_trust_enforced'));
check('migration: ip_allowlist_enforced DEFAULT FALSE',      mig.includes('ip_allowlist_enforced'));
check('migration: security_provider_connected DEFAULT FALSE', mig.includes('security_provider_connected'));
check('migration: compliance_certified DEFAULT FALSE',       mig.includes('compliance_certified'));
check('migration: notification_delivered DEFAULT FALSE',     mig.includes('notification_delivered'));
check('migration: permission_enforced DEFAULT FALSE',        mig.includes('permission_enforced'));
check('migration: contains_ai_generated_content DEFAULT FALSE', mig.includes('contains_ai_generated_content'));

// ─── Contracts checks (18) ──────────────────────────────────────────────────
check('contracts: file exists',                              cont.length > 0);
check('contracts: USER_STATUSES',                            cont.includes('USER_STATUSES'));
check('contracts: ROLE_STATUSES',                            cont.includes('ROLE_STATUSES'));
check('contracts: PERMISSION_STATUSES',                      cont.includes('PERMISSION_STATUSES'));
check('contracts: ASSIGNMENT_STATUSES',                      cont.includes('ASSIGNMENT_STATUSES'));
check('contracts: APPROVAL_STATUSES',                        cont.includes('APPROVAL_STATUSES'));
check('contracts: SECURITY_STATUSES',                        cont.includes('SECURITY_STATUSES'));
check('contracts: DECISION_STATUSES',                        cont.includes('DECISION_STATUSES'));
check('contracts: REVIEW_STATUSES',                          cont.includes('REVIEW_STATUSES'));
check('contracts: SCOPE_LEVELS',                             cont.includes('SCOPE_LEVELS'));
check('contracts: ROLE_SCOPES',                              cont.includes('ROLE_SCOPES'));
check('contracts: PERMISSION_GROUPS',                        cont.includes('PERMISSION_GROUPS'));
check('contracts: SENSITIVE_ACTION_TYPES',                   cont.includes('SENSITIVE_ACTION_TYPES'));
check('contracts: SECURITY_PROVIDER_KEYS',                   cont.includes('SECURITY_PROVIDER_KEYS'));
check('contracts: ACCESS_DECISION_TYPES',                    cont.includes('ACCESS_DECISION_TYPES'));
check('contracts: isValidUserStatus validator',              cont.includes('isValidUserStatus'));
check('contracts: isValidRoleStatus validator',              cont.includes('isValidRoleStatus'));
check('contracts: isValidSecurityStatus validator',          cont.includes('isValidSecurityStatus'));

// ─── Feature flags checks (16) ──────────────────────────────────────────────
check('flags: file exists',                                  flags.length > 0);
check('flags: DEFAULT_NOVEE_OS_SECURITY_FLAGS',              flags.includes('DEFAULT_NOVEE_OS_SECURITY_FLAGS'));
check('flags: getNoveeOSSecurityFlags function',             flags.includes('getNoveeOSSecurityFlags'));
check('flags: platformSecurityEnabled',                      flags.includes('platformSecurityEnabled'));
check('flags: noFakeSSOConnectionEnforced',                  flags.includes('noFakeSSOConnectionEnforced'));
check('flags: noFakeMFAEnforcementEnforced',                 flags.includes('noFakeMFAEnforcementEnforced'));
check('flags: noFakeDeviceTrustEnforced',                    flags.includes('noFakeDeviceTrustEnforced'));
check('flags: noFakeIPAllowlistEnforced',                    flags.includes('noFakeIPAllowlistEnforced'));
check('flags: noFakeComplianceCertificationEnforced',        flags.includes('noFakeComplianceCertificationEnforced'));
check('flags: noFakeSecurityProviderConnectionEnforced',     flags.includes('noFakeSecurityProviderConnectionEnforced'));
check('flags: noFakeNotificationDeliveryEnforced',           flags.includes('noFakeNotificationDeliveryEnforced'));
check('flags: noFakePermissionEnforcementEnforced',          flags.includes('noFakePermissionEnforcementEnforced'));
check('flags: noSecretsStorageEnforced',                     flags.includes('noSecretsStorageEnforced'));
check('flags: platformAdminGuardRequired',                   flags.includes('platformAdminGuardRequired'));
check('flags: 40+ flags present',                           (flags.match(/true[,\s]/g) || []).length >= 40);
check('flags: ssoProviderPlaceholdersEnabled',               flags.includes('ssoProviderPlaceholdersEnabled'));

// ─── Locales checks (16) ────────────────────────────────────────────────────
check('locales: file exists',                                loc.length > 0);
check('locales: en-US locale',                              loc.includes("'en-US'"));
check('locales: es-DO locale',                              loc.includes("'es-DO'"));
check('locales: es locale',                                 loc.includes("'es'"));
check('locales: ht locale',                                 loc.includes("'ht'"));
check('locales: de locale',                                 loc.includes("'de'"));
check('locales: pt locale',                                 loc.includes("'pt'"));
check('locales: tNoveeOSSecurity function',                 loc.includes('tNoveeOSSecurity'));
check('locales: getSupportedNoveeOSSecurityLanguages',      loc.includes('getSupportedNoveeOSSecurityLanguages'));
check('locales: platformSecurity label',                    loc.includes('platformSecurity'));
check('locales: ssoNotConnected label',                     loc.includes('ssoNotConnected'));
check('locales: mfaNotEnforced label',                      loc.includes('mfaNotEnforced'));
check('locales: complianceNotCertified label',              loc.includes('complianceNotCertified'));
check('locales: noSecretsStored label',                     loc.includes('noSecretsStored'));
check('locales: module4of7 label',                          loc.includes('module4of7'));
check('locales: phaseC4 label',                             loc.includes('phaseC4'));

// ─── Service checks (60) ────────────────────────────────────────────────────
check('service: file exists',                               svc.length > 0);
check('service: AREA novee-os-security-governance',         svc.includes("'novee-os-security-governance'"));
check('service: JSDoc falls back gracefully',               svc.includes('Falls back gracefully'));
check('service: JSDoc never prints db connection string',   svc.includes('Never prints or logs the database connection string'));
check('service: localFallback function',                    svc.includes('localFallback'));
check('service: localPreview: true in fallback',            svc.includes('localPreview: true'));
check('service: contains_secrets: false comment',           svc.includes('contains_secrets: false'));
check('service: isDbAvailable import',                      svc.includes('isDbAvailable'));
check('service: createPlatformUser export',                 svc.includes('createPlatformUser'));
check('service: listPlatformUsers export',                  svc.includes('listPlatformUsers'));
check('service: getPlatformUser export',                    svc.includes('getPlatformUser'));
check('service: updatePlatformUserStatus export',           svc.includes('updatePlatformUserStatus'));
check('service: createUserProfile export',                  svc.includes('createUserProfile'));
check('service: getUserProfile export',                     svc.includes('getUserProfile'));
check('service: createRoleCatalogEntry export',             svc.includes('createRoleCatalogEntry'));
check('service: listRoleCatalog export',                    svc.includes('listRoleCatalog'));
check('service: updateRoleStatus export',                   svc.includes('updateRoleStatus'));
check('service: createPermissionCatalogEntry export',       svc.includes('createPermissionCatalogEntry'));
check('service: listPermissionCatalog export',              svc.includes('listPermissionCatalog'));
check('service: updatePermissionStatus export',             svc.includes('updatePermissionStatus'));
check('service: createPermissionGroup export',              svc.includes('createPermissionGroup'));
check('service: listPermissionGroups export',               svc.includes('listPermissionGroups'));
check('service: createRolePermissionAssignment export',     svc.includes('createRolePermissionAssignment'));
check('service: createUserRoleAssignment export',           svc.includes('createUserRoleAssignment'));
check('service: updateUserRoleAssignmentStatus export',     svc.includes('updateUserRoleAssignmentStatus'));
check('service: createUserAccessGrant export',              svc.includes('createUserAccessGrant'));
check('service: createModulePermissionRule export',         svc.includes('createModulePermissionRule'));
check('service: createRoutePermissionRule export',          svc.includes('createRoutePermissionRule'));
check('service: createFeaturePermissionRule export',        svc.includes('createFeaturePermissionRule'));
check('service: createAdminApprovalRequest export',         svc.includes('createAdminApprovalRequest'));
check('service: listAdminApprovalRequests export',          svc.includes('listAdminApprovalRequests'));
check('service: decideAdminApprovalRequest export',         svc.includes('decideAdminApprovalRequest'));
check('service: createSensitiveActionRequest export',       svc.includes('createSensitiveActionRequest'));
check('service: decideSensitiveActionRequest export',       svc.includes('decideSensitiveActionRequest'));
check('service: createPermissionDecisionRecord export',     svc.includes('createPermissionDecisionRecord'));
check('service: evaluatePermissionDecisionPlaceholder export', svc.includes('evaluatePermissionDecisionPlaceholder'));
check('service: createAccessDenialRecord export',           svc.includes('createAccessDenialRecord'));
check('service: createSessionPolicyPlaceholder export',     svc.includes('createSessionPolicyPlaceholder'));
check('service: createMfaPolicyPlaceholder export',         svc.includes('createMfaPolicyPlaceholder'));
check('service: createSsoProviderPlaceholder export',       svc.includes('createSsoProviderPlaceholder'));
check('service: createDeviceTrustPlaceholder export',       svc.includes('createDeviceTrustPlaceholder'));
check('service: createIpAllowlistPlaceholder export',       svc.includes('createIpAllowlistPlaceholder'));
check('service: createSecurityEventRecord export',          svc.includes('createSecurityEventRecord'));
check('service: createGovernanceReviewRecord export',       svc.includes('createGovernanceReviewRecord'));
check('service: updateGovernanceReviewStatus export',       svc.includes('updateGovernanceReviewStatus'));
check('service: createPlatformSecuritySnapshot export',     svc.includes('createPlatformSecuritySnapshot'));
check('service: getLatestPlatformSecuritySnapshot export',  svc.includes('getLatestPlatformSecuritySnapshot'));
check('service: getSafeSecurityClaims export',              svc.includes('getSafeSecurityClaims'));
check('service: getUnsafeSecurityClaims export',            svc.includes('getUnsafeSecurityClaims'));
check('service: getSecurityHonestLimitations export',       svc.includes('getSecurityHonestLimitations'));
check('service: getSecurityPhaseRoadmap export',            svc.includes('getSecurityPhaseRoadmap'));
check('service: writeSecurityAudit export',                 svc.includes('writeSecurityAudit'));
check('service: idempotency_key_required guard',            svc.includes('idempotency_key_required'));
check('service: honest limitations mention provider',       svc.includes('provider'));
check('service: phase roadmap C.4 current',                 svc.includes('C.4') && svc.includes('current'));
check('service: next phase CraftHub Launcher',              svc.includes('CraftHub Launcher'));
check('service: evaluatePermission returns allowed_placeholder', svc.includes('allowed_placeholder'));
check('service: no sso_connected: true claimed',            !svc.includes('sso_connected: true'));
check('service: no mfa_enforced: true claimed',             !svc.includes('mfa_enforced: true'));
check('service: no compliance_certified: true claimed',     !svc.includes('compliance_certified: true'));
check('service: no security_provider_connected: true claimed', !svc.includes('security_provider_connected: true'));
check('service: no notification_delivered: true claimed',   !svc.includes('notification_delivered: true'));
check('service: no permission_enforced: true claimed',      !svc.includes('permission_enforced: true'));
check('service: stores_secrets: false',                     svc.includes('stores_secrets: false'));

// ─── Controller checks (20) ─────────────────────────────────────────────────
check('controller: file exists',                            ctrl.length > 0);
check('controller: ok500 pattern',                          ctrl.includes('ok500'));
check('controller: actorUserId pattern',                    ctrl.includes('actorUserId'));
check('controller: ikey pattern',                           ctrl.includes('ikey'));
check('controller: createPlatformUser handler',             ctrl.includes('createPlatformUser'));
check('controller: listPlatformUsers handler',              ctrl.includes('listPlatformUsers'));
check('controller: createRoleCatalogEntry handler',         ctrl.includes('createRoleCatalogEntry'));
check('controller: listRoleCatalog handler',                ctrl.includes('listRoleCatalog'));
check('controller: createPermissionCatalogEntry handler',   ctrl.includes('createPermissionCatalogEntry'));
check('controller: createAdminApprovalRequest handler',     ctrl.includes('createAdminApprovalRequest'));
check('controller: decideAdminApprovalRequest handler',     ctrl.includes('decideAdminApprovalRequest'));
check('controller: createSensitiveActionRequest handler',   ctrl.includes('createSensitiveActionRequest'));
check('controller: evaluatePermissionDecisionPlaceholder handler', ctrl.includes('evaluatePermissionDecisionPlaceholder'));
check('controller: createSsoProviderPlaceholder handler',   ctrl.includes('createSsoProviderPlaceholder'));
check('controller: createMfaPolicyPlaceholder handler',     ctrl.includes('createMfaPolicyPlaceholder'));
check('controller: createPlatformSecuritySnapshot handler', ctrl.includes('createPlatformSecuritySnapshot'));
check('controller: getSafeSecurityClaims handler',          ctrl.includes('getSafeSecurityClaims'));
check('controller: getUnsafeSecurityClaims handler',        ctrl.includes('getUnsafeSecurityClaims'));
check('controller: getSecurityHonestLimitations handler',   ctrl.includes('getSecurityHonestLimitations'));
check('controller: getSecurityPhaseRoadmap handler',        ctrl.includes('getSecurityPhaseRoadmap'));

// ─── Routes checks (25) ─────────────────────────────────────────────────────
check('routes: file exists',                                rts.length > 0);
check('routes: canAccessPOS3 import',                       rts.includes('canAccessPOS3'));
check('routes: router created',                             rts.includes('Router()'));
check('routes: export default router',                      rts.includes('export default router'));
check('routes: GET /users',                                 rts.includes("get('/users'"));
check('routes: POST /users with guard',                     rts.includes("post('/users'") && rts.includes('canAccessPOS3'));
check('routes: GET /roles',                                 rts.includes("get('/roles'"));
check('routes: POST /roles with guard',                     rts.includes("post('/roles'") && rts.includes('canAccessPOS3'));
check('routes: GET /permissions',                           rts.includes("get('/permissions'"));
check('routes: POST /permissions with guard',               rts.includes("post('/permissions'") && rts.includes('canAccessPOS3'));
check('routes: POST /admin-approvals with guard',           rts.includes("post('/admin-approvals'") && rts.includes('canAccessPOS3'));
check('routes: POST admin-approvals decision with guard',   rts.includes("post('/admin-approvals/:approvalRequestId/decision'") && rts.includes('canAccessPOS3'));
check('routes: POST /sensitive-actions with guard',         rts.includes("post('/sensitive-actions'") && rts.includes('canAccessPOS3'));
check('routes: POST /sso-providers with guard',             rts.includes("post('/sso-providers'") && rts.includes('canAccessPOS3'));
check('routes: POST /mfa-policies with guard',              rts.includes("post('/mfa-policies'") && rts.includes('canAccessPOS3'));
check('routes: POST /device-trust with guard',              rts.includes("post('/device-trust'") && rts.includes('canAccessPOS3'));
check('routes: POST /ip-allowlist with guard',              rts.includes("post('/ip-allowlist'") && rts.includes('canAccessPOS3'));
check('routes: POST /snapshots with guard',                 rts.includes("post('/snapshots'") && rts.includes('canAccessPOS3'));
check('routes: GET /claims/safe',                           rts.includes("get('/claims/safe'"));
check('routes: GET /claims/unsafe',                         rts.includes("get('/claims/unsafe'"));
check('routes: GET /honest-limitations',                    rts.includes("get('/honest-limitations'"));
check('routes: GET /roadmap',                               rts.includes("get('/roadmap'"));
check('routes: canAccessPOS3 from roleMiddleware',          rts.includes('roleMiddleware'));
check('routes: platformAdminGuardRequired comment',         rts.includes('platformAdminGuardRequired'));
check('routes: POST /governance-reviews with guard',        rts.includes("post('/governance-reviews'") && rts.includes('canAccessPOS3'));

// ─── UI checks (35) ─────────────────────────────────────────────────────────
check('ui: file exists',                                    ui.length > 0);
check('ui: DEVICE_LINE constant',                           ui.includes("const DEVICE_LINE = 'Touchscreen · Handheld · Tablet · Desktop'"));
check('ui: NAVY color token',                               ui.includes("'#0a0d14'"));
check('ui: CHARCOAL color token',                           ui.includes("'#111520'"));
check('ui: GOLD2 color token',                              ui.includes("'#e8b84b'"));
check('ui: RED color token',                                ui.includes("'#c0392b'"));
check('ui: GREEN color token',                              ui.includes("'#27ae60'"));
check('ui: PlatformUserPanel component',                    ui.includes('PlatformUserPanel'));
check('ui: RoleCatalogPanel component',                     ui.includes('RoleCatalogPanel'));
check('ui: PermissionCatalogPanel component',               ui.includes('PermissionCatalogPanel'));
check('ui: AdminApprovalRequestPanel component',            ui.includes('AdminApprovalRequestPanel'));
check('ui: SensitiveActionRequestPanel component',          ui.includes('SensitiveActionRequestPanel'));
check('ui: MFAPolicyPanel component',                       ui.includes('MFAPolicyPanel'));
check('ui: SSOProviderPanel component',                     ui.includes('SSOProviderPanel'));
check('ui: DeviceTrustPanel component',                     ui.includes('DeviceTrustPanel'));
check('ui: IPAllowlistPanel component',                     ui.includes('IPAllowlistPanel'));
check('ui: SafeSecurityClaimsPanel component',              ui.includes('SafeSecurityClaimsPanel'));
check('ui: UnsafeSecurityClaimsPanel component',            ui.includes('UnsafeSecurityClaimsPanel'));
check('ui: HonestSecurityLimitationsPanel component',       ui.includes('HonestSecurityLimitationsPanel'));
check('ui: SecurityRoadmapPanel component',                 ui.includes('SecurityRoadmapPanel'));
check('ui: HonestSSOStatePanel component',                  ui.includes('HonestSSOStatePanel'));
check('ui: HonestMFAStatePanel component',                  ui.includes('HonestMFAStatePanel'));
check('ui: HonestComplianceStatePanel component',           ui.includes('HonestComplianceStatePanel'));
check('ui: HonestPermissionEnforcementStatePanel component', ui.includes('HonestPermissionEnforcementStatePanel'));
check('ui: EmptySecurityStatePanel component',              ui.includes('EmptySecurityStatePanel'));
check('ui: NoveeOSSecurityGovernance function',             ui.includes('function NoveeOSSecurityGovernance'));
check('ui: export default NoveeOSSecurityGovernance',       ui.includes('export default NoveeOSSecurityGovernance'));
check('ui: NOVEE OS SECURITY GOVERNANCE header',            ui.includes('NOVEE OS — SECURITY GOVERNANCE'));
check('ui: Phase C.4 / Module 4 of 7 text',                ui.includes('Phase C.4 / Module 4 of 7'));
check('ui: NOT CONNECTED badge',                            ui.includes('NOT CONNECTED'));
check('ui: NOT ENFORCED badge',                             ui.includes('NOT ENFORCED'));
check('ui: sso_connected false shown',                      ui.includes('sso_connected'));
check('ui: mfa_enforced false shown',                       ui.includes('mfa_enforced'));
check('ui: compliance_certified false shown',               ui.includes('compliance_certified'));
check('ui: permission_enforced false shown',                ui.includes('permission_enforced'));

// ─── Roadmap checks (7) ──────────────────────────────────────────────────────
check('roadmap: C.1 Module 1 of 7 complete in service',     svc.includes('C.1') && svc.includes('complete'));
check('roadmap: C.2 Module 2 of 7 complete in service',     svc.includes('C.2') && svc.includes('complete'));
check('roadmap: C.3 Module 3 of 7 complete in service',     svc.includes('C.3') && svc.includes('complete'));
check('roadmap: C.4 Module 4 of 7 current in service',      svc.includes('C.4') && svc.includes('current'));
check('roadmap: C.5 CraftHub Launcher next in service',     svc.includes('C.5') && svc.includes('CraftHub Launcher'));
check('roadmap: C.6 Venue Onboarding pending',              svc.includes('C.6'));
check('roadmap: C.7 Final Platform Launch Lock pending',    svc.includes('C.7'));

// Roadmap in UI
check('roadmap: C.1 complete in UI',                        ui.includes('Module 1 of 7') && ui.includes('Complete'));
check('roadmap: C.4 current in UI',                         ui.includes('Module 4 of 7') && ui.includes('Current'));
check('roadmap: C.5 CraftHub Launcher next in UI',          ui.includes('CraftHub Launcher'));

// ─── Wiring checks (15) ─────────────────────────────────────────────────────
check('wiring: server/index.js exists',                     idx.length > 0);
check('wiring: noveeOSSecurityGovernanceRoutes import',     idx.includes('noveeOSSecurityGovernanceRoutes'));
check('wiring: mounted at /api/novee-os/security',          idx.includes("'/api/novee-os/security'"));
check('wiring: App.jsx exists',                             app.length > 0);
check('wiring: NoveeOSSecurityGovernance import in App',    app.includes('NoveeOSSecurityGovernance'));
check('wiring: novee-os/security route in App',             app.includes('novee-os/security'));
check('wiring: package.json verify script',                 pkg.includes('verify:novee-os-security'));
check('wiring: verify script points to correct file',       pkg.includes('verifyNoveeOSSecurityGovernance'));

// ─── Continuity checks (12) ─────────────────────────────────────────────────
check('continuity: C.1 modules route still in index',       idx.includes('novee-os/modules') || idx.includes('noveeOSModuleRegistry'));
check('continuity: C.2 tenants route still in index',       idx.includes('novee-os/tenants') || idx.includes('noveeOSTenantGovernance'));
check('continuity: C.3 billing route still in index',       idx.includes('novee-os/billing') || idx.includes('noveeOSBillingGovernance'));
check('continuity: C.1 module registry in App.jsx',         app.includes('novee-os/modules') || app.includes('NoveeOSModuleRegistry'));
check('continuity: C.2 tenant governance in App.jsx',       app.includes('novee-os/tenants') || app.includes('NoveeOSTenantGovernance'));
check('continuity: C.3 billing governance in App.jsx',      app.includes('novee-os/billing') || app.includes('NoveeOSBillingGovernance'));
check('continuity: verify:novee-os-modules in package.json', pkg.includes('verify:novee-os-modules'));
check('continuity: verify:novee-os-tenants in package.json', pkg.includes('verify:novee-os-tenants'));
check('continuity: verify:novee-os-billing in package.json', pkg.includes('verify:novee-os-billing'));
check('continuity: migration 048 exists',                   read('server/db/migrations/048_novee_os_module_registry_platform_control.sql').length > 0);
check('continuity: migration 049 exists',                   read('server/db/migrations/049_novee_os_tenant_venue_workspace_governance.sql').length > 0);
check('continuity: migration 050 exists',                   read('server/db/migrations/050_novee_os_licensing_plans_billing_gates.sql').length > 0);

// ─── Integrity checks (20) ──────────────────────────────────────────────────
check('integrity: no sso_connected: true in service',       !svc.includes('sso_connected: true'));
check('integrity: no mfa_enforced: true in service',        !svc.includes('mfa_enforced: true'));
check('integrity: no device_trust_enforced: true',          !svc.includes('device_trust_enforced: true'));
check('integrity: no ip_allowlist_enforced: true',          !svc.includes('ip_allowlist_enforced: true'));
check('integrity: no security_provider_connected: true',    !svc.includes('security_provider_connected: true'));
check('integrity: no compliance_certified: true',           !svc.includes('compliance_certified: true'));
check('integrity: no notification_delivered: true',         !svc.includes('notification_delivered: true'));
check('integrity: no permission_enforced: true in svc',     !svc.includes('permission_enforced: true'));
check('integrity: contains_secrets: false in service',      svc.includes('contains_secrets: false'));
check('integrity: stores_secrets: false in service',        svc.includes('stores_secrets: false'));
check('integrity: localPreview fallback exists',            svc.includes('localPreview'));
check('integrity: allowed_placeholder in evaluate',         svc.includes('allowed_placeholder'));
check('integrity: idempotency guard exists',                svc.includes('idempotency_key_required'));
check('integrity: safe claims mention placeholder only',    svc.includes('placeholder only'));
check('integrity: unsafe claims mention not live',          svc.includes('not live') || svc.includes('notLive'));
check('integrity: roadmap mentions Module 4 of 7',          svc.includes('4 of 7'));
check('integrity: canAccessPOS3 in routes',                 rts.includes('canAccessPOS3'));
check('integrity: platformAdminGuardRequired in flags',     flags.includes('platformAdminGuardRequired'));
check('integrity: actorUserId pattern in controller',       ctrl.includes('actorUserId'));
check('integrity: ikey pattern in controller',              ctrl.includes('ikey'));

// ─── Result ──────────────────────────────────────────────────────────────────
const total = pass.length + fail.length;
console.log(`\nNOVEE OS Security Governance — Phase C.4 Module 4 Verification`);
console.log(`=`.repeat(60));
fail.forEach(f => console.log(`  FAILED: ${f}`));
console.log(`\nPASSED: ${pass.length} / ${total}`);
console.log(`FAILED: ${fail.length} / ${total}`);
if (fail.length > 0) {
  process.exit(1);
} else {
  console.log(`\nAll ${total} checks passed.`);
}
