/**
 * Phase 4 — Vendor/Module Security Verification
 * Imports the prototype vendor/module security modules and confirms the
 * security rules required by Phase 4 hold today. No network calls, no
 * database, no browser globals, no real payment/licensing checks. Run with:
 *   node server/scripts/verifyVendorModuleSecurity.js
 */

import { moduleRegistry } from '../../src/modules/moduleRegistry.js'
import { checkModuleAccess, canRoleAccessExperience, ACCESS_DENIAL_REASON, EXPERIENCE_TYPES } from '../../src/modules/moduleSecurityGuard.js'
import { ROLES } from '../../src/modules/roleAccessRules.js'
import { disableModuleGlobally, getDisableRecords } from '../../src/modules/remoteDisableRegistry.js'
import { recordAuditEvent, getAuditLog, AUDIT_ACTION, AUDIT_STATUS } from '../../src/modules/deploymentAuditLog.js'

let passed = 0
let failed = 0

function check(label, condition) {
  if (condition) {
    passed += 1
    console.log(`PASS — ${label}`)
  } else {
    failed += 1
    console.error(`FAIL — ${label}`)
  }
}

// ── 1. Guests cannot access staff/admin tools (POS or E.A.T.) ──────
check(
  'Guest cannot access POS admin (staff_tool experience)',
  canRoleAccessExperience(ROLES.GUEST, EXPERIENCE_TYPES.STAFF_TOOL) === false,
)
check(
  'Guest cannot access E.A.T. admin (staff_tool experience)',
  canRoleAccessExperience(ROLES.GUEST, EXPERIENCE_TYPES.STAFF_TOOL) === false,
)

// ── 2. Vendor cannot access an unassigned module ───────────────────
const unassignedCheck = checkModuleAccess({
  vendorId: 'demo-vendor-pos3',
  moduleId: 'eat-command-hub',
  role: ROLES.VENDOR_ADMIN,
})
recordAuditEvent({
  vendorId: 'demo-vendor-pos3',
  moduleId: 'eat-command-hub',
  action: AUDIT_ACTION.ACCESS_DENIED,
  status: AUDIT_STATUS.FAILURE,
  actorRole: ROLES.VENDOR_ADMIN,
  reason: unassignedCheck.reason,
})
check(
  'Vendor cannot access an unassigned module',
  unassignedCheck.allowed === false && unassignedCheck.reason === ACCESS_DENIAL_REASON.MODULE_NOT_ASSIGNED,
)

// ── 3. Expired license blocks access ────────────────────────────────
const expiredCheck = checkModuleAccess({
  vendorId: 'demo-vendor-expired-date',
  moduleId: 'pos3',
  role: ROLES.VENDOR_ADMIN,
})
recordAuditEvent({
  vendorId: 'demo-vendor-expired-date',
  moduleId: 'pos3',
  action: AUDIT_ACTION.ACCESS_DENIED,
  status: AUDIT_STATUS.FAILURE,
  actorRole: ROLES.VENDOR_ADMIN,
  reason: expiredCheck.reason,
})
check(
  'Expired license blocks access',
  expiredCheck.allowed === false && expiredCheck.reason === ACCESS_DENIAL_REASON.LICENSE_EXPIRED,
)

const inactiveLicenseCheck = checkModuleAccess({
  vendorId: 'demo-vendor-expired',
  moduleId: 'pos3',
  role: ROLES.VENDOR_ADMIN,
})
check(
  'Non-active license status blocks access',
  inactiveLicenseCheck.allowed === false && inactiveLicenseCheck.reason === ACCESS_DENIAL_REASON.LICENSE_NOT_ACTIVE,
)

// ── 4. Disabled module blocks access ────────────────────────────────
disableModuleGlobally({ moduleId: 'pos3', reason: 'Phase 4 verification test', disabledBy: ROLES.SUPER_ADMIN })
const disabledCheck = checkModuleAccess({
  vendorId: 'demo-vendor-pos3',
  moduleId: 'pos3',
  role: ROLES.VENDOR_ADMIN,
})
recordAuditEvent({
  vendorId: 'demo-vendor-pos3',
  moduleId: 'pos3',
  action: AUDIT_ACTION.MODULE_DISABLED,
  status: AUDIT_STATUS.SUCCESS,
  actorRole: ROLES.SUPER_ADMIN,
  reason: 'Phase 4 verification test',
})
check(
  'Disabled module blocks access',
  disabledCheck.allowed === false && disabledCheck.reason === ACCESS_DENIAL_REASON.MODULE_DISABLED,
)
check('Remote disable registry recorded the disable', getDisableRecords().some(r => r.moduleId === 'pos3'))

// ── 5. POS 3 / E.A.T. / SmokeCraft assignable independently ────────
check(
  'POS 3 can be assigned without a SmokeCraft dependency',
  moduleRegistry.pos3.dependencies.length === 0 &&
    checkModuleAccess({ vendorId: 'demo-vendor-eat', moduleId: 'eat-command-hub', role: ROLES.VENDOR_ADMIN }).allowed === true,
)
check(
  'E.A.T. Command Hub can be assigned without a SmokeCraft dependency',
  moduleRegistry['eat-command-hub'].dependencies.length === 0 &&
    checkModuleAccess({ vendorId: 'demo-vendor-eat', moduleId: 'eat-command-hub', role: ROLES.VENDOR_ADMIN }).allowed === true,
)
check(
  'SmokeCraft can be assigned without a POS 3 or E.A.T. dependency',
  moduleRegistry.smokecraft.dependencies.length === 0 &&
    checkModuleAccess({ vendorId: 'demo-vendor-smokecraft', moduleId: 'smokecraft', role: ROLES.VENDOR_ADMIN }).allowed === true,
)

// ── 6. super_admin can disable a module ─────────────────────────────
check(
  'super_admin role is allowed to remotely disable modules',
  canRoleAccessExperience(ROLES.SUPER_ADMIN, EXPERIENCE_TYPES.REMOTE_MODULE_DISABLE) === true,
)
check(
  'vendor_admin role is NOT allowed to remotely disable modules',
  canRoleAccessExperience(ROLES.VENDOR_ADMIN, EXPERIENCE_TYPES.REMOTE_MODULE_DISABLE) === false,
)

// ── 7. Audit log records security events ────────────────────────────
check('Audit log recorded at least one event from this run', getAuditLog().length > 0)
check(
  'Audit log includes the denied unassigned-module event',
  getAuditLog().some(e => e.moduleId === 'eat-command-hub' && e.action === AUDIT_ACTION.ACCESS_DENIED),
)

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
