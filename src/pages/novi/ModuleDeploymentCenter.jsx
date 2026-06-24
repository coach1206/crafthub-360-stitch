/**
 * Module Deployment Center — Novi OS, Phase 7/8/9
 *
 * Admin screen showing which CraftHub modules exist, which are standalone,
 * which are ready, and which are not ready, plus a prototype-only vendor
 * assignment / disable / restore workflow added in Phase 8, plus a final
 * Remote Deployment Readiness summary added in Phase 9. Sources module
 * data only from the Phase 6 read-only layer (noviModuleStatusService.js)
 * and writes assignment/disable/audit records only through the Phase 8
 * prototype layer (noviVendorModuleAssignments.js, noviRemoteDisableService.js,
 * noviDeploymentAuditLog.js) — no SmokeCraft/POS3/E.A.T. screen or
 * component is imported, and nothing here performs live deployment,
 * billing, or device control.
 *
 * "Deploy Module" remains permanently disabled — live deployment is not
 * built until a later phase. "Assign Vendor", "Disable Module", and
 * "Restore Module" create local prototype records only, and every
 * resulting action is labeled "Prototype only. No live deployment sent."
 * The Phase 9 Remote Deployment Readiness section sources its
 * billing/device-control/live-deployment-locked facts from the real
 * noviDeploymentSafetyChecklist.js / noviRemoteDeploymentContract.js
 * modules rather than re-describing them — there are no new buttons here.
 *
 * Route-gated to admin/founder_level_0 in App.jsx (the same mechanism
 * that already gates /admin) — see docs/phase-7-novi-deployment-center-audit.md
 * for why "Novi Admin"/"Super Admin" are used as display labels for those
 * two real roles rather than inventing new session roles.
 */

import { useState } from 'react'
import { getAllNoviModules } from '../../services/noviModuleStatusService.js'
import { CONTROL_MODE } from '../../modules/noviModuleRegistry.js'
import { useSecurity } from '../../context/SecurityContext.jsx'
import { listVendors } from '../../modules/vendorModuleAccess.js'
import {
  assignModuleToVendor,
  getAssignments,
} from '../../modules/noviVendorModuleAssignments.js'
import {
  disableModuleForVendor,
  disableModuleGlobally,
  requestRestore,
  getDisableRecords,
  RESTORE_STATUS,
} from '../../services/noviRemoteDisableService.js'
import {
  recordNoviAuditEvent,
  getNoviAuditLog,
  NOVI_AUDIT_ACTION,
  NOVI_AUDIT_STATUS,
} from '../../modules/noviDeploymentAuditLog.js'
import { runDeploymentSafetyChecklist, CHECK_STATUS } from '../../modules/noviDeploymentSafetyChecklist.js'
import { createDeploymentContract } from '../../modules/noviRemoteDeploymentContract.js'

const GOLD   = '#C9A84C'
const DARK   = '#0a0603'
const CARD   = 'rgba(18,12,5,0.97)'
const BORDER = 'rgba(201,168,76,0.18)'
const DIM    = 'rgba(201,168,76,0.45)'
const OK     = '#4CAF50'
const WARN   = '#E0A95A'

const ROLE_DISPLAY_LABEL = {
  admin: 'Novi Admin',
  founder_level_0: 'Super Admin',
}

const PROTOTYPE_NOTICE = 'Prototype only. No live deployment sent.'

function readinessLabel(module) {
  if (module.controlMode === CONTROL_MODE.NOT_READY) return 'Not Ready'
  if (module.readinessStatus === 'ready') return 'Ready'
  return 'Not Ready'
}

function controlModeLabel(module) {
  switch (module.controlMode) {
    case CONTROL_MODE.PLANNED_DEPLOYABLE: return 'Planned Deployable'
    case CONTROL_MODE.NOT_READY: return 'Not Ready'
    case CONTROL_MODE.READ_ONLY: return 'Read Only'
    default: return module.controlMode
  }
}

function StatusBadge({ children, tone = 'neutral' }) {
  const toneColors = {
    ok: { bg: 'rgba(76,175,80,0.12)', color: OK, border: 'rgba(76,175,80,0.35)' },
    warn: { bg: 'rgba(224,169,90,0.12)', color: WARN, border: 'rgba(224,169,90,0.35)' },
    neutral: { bg: 'rgba(201,168,76,0.10)', color: GOLD, border: BORDER },
  }
  const c = toneColors[tone] ?? toneColors.neutral
  return (
    <span style={{
      display: 'inline-block', background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      borderRadius: '10px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em',
      padding: '2px 8px', marginRight: '6px', marginBottom: '4px',
    }}>
      {children}
    </span>
  )
}

function DisabledActionButton({ label, title }) {
  return (
    <button
      type="button"
      disabled
      title={title ?? 'Coming in Phase 9'}
      aria-disabled="true"
      style={{
        background: 'rgba(100,100,100,0.10)', color: DIM, border: `1px solid ${BORDER}`,
        borderRadius: '6px', fontSize: '11px', padding: '6px 12px', marginRight: '8px',
        marginTop: '8px', cursor: 'not-allowed', opacity: 0.6,
      }}
    >
      {label}
    </button>
  )
}

function PreviewActionButton({ label, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={PROTOTYPE_NOTICE}
      style={{
        background: disabled ? 'rgba(100,100,100,0.10)' : 'rgba(201,168,76,0.10)',
        color: disabled ? DIM : GOLD,
        border: `1px solid ${BORDER}`,
        borderRadius: '6px', fontSize: '11px', padding: '6px 12px', marginRight: '8px',
        marginTop: '8px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
      }}
    >
      {label}
    </button>
  )
}

function ReadinessItem({ label, ready, lockedTone = false }) {
  // For "locked"/"not connected" facts, `ready` means the lock/absence is
  // correctly in place — still rendered with the warn tone, since it is
  // not a deployable-ready state, just an honestly reported one.
  const tone = lockedTone ? (ready ? 'warn' : 'ok') : (ready ? 'ok' : 'warn')
  return (
    <div style={{ marginBottom: '6px' }}>
      <StatusBadge tone={tone}>{label}: {ready ? 'Yes' : 'No'}</StatusBadge>
    </div>
  )
}

function ModuleCard({ module, vendorId, vendorName, onAssign, onDisable, onRestore, latestDisableRecord, readOnly = false }) {
  const ready = module.controlMode !== CONTROL_MODE.NOT_READY
  const integrations = Object.keys(module.optionalIntegrations ?? {})
  const canRestore = !readOnly && latestDisableRecord && latestDisableRecord.restoreStatus !== RESTORE_STATUS.RESTORED

  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '1.25rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
        <h3 style={{ color: GOLD, fontSize: '16px', margin: 0 }}>{module.moduleName}</h3>
        <StatusBadge tone={ready ? 'ok' : 'warn'}>{readinessLabel(module)}</StatusBadge>
      </div>

      <div style={{ color: DIM, fontSize: '11px', marginBottom: '0.75rem' }}>
        Source system: {module.sourceSystem} &middot; Version: {module.version ?? 'unknown'}
      </div>

      <div style={{ marginBottom: '0.5rem' }}>
        <StatusBadge tone="neutral">Deployment: {module.deploymentStatus}</StatusBadge>
        <StatusBadge tone="neutral">{controlModeLabel(module)}</StatusBadge>
        <StatusBadge tone={module.standaloneAllowed ? 'ok' : 'warn'}>
          {module.standaloneAllowed ? 'Standalone' : 'Not Standalone'}
        </StatusBadge>
        <StatusBadge tone={module.vendorAssignable ? 'ok' : 'warn'}>
          {module.vendorAssignable ? 'Vendor Assignable' : 'Not Vendor Assignable'}
        </StatusBadge>
        <StatusBadge tone="neutral">Security: {module.securityLevel}</StatusBadge>
      </div>

      <div style={{ color: DIM, fontSize: '11px', marginBottom: '0.25rem' }}>
        Supported environments: {module.supportedEnvironments.join(', ')}
      </div>
      <div style={{ color: DIM, fontSize: '11px', marginBottom: '0.25rem' }}>
        Dependencies: {module.dependencies.length > 0 ? module.dependencies.join(', ') : 'None'}
      </div>
      <div style={{ color: DIM, fontSize: '11px', marginBottom: '0.5rem' }}>
        Optional integrations:{' '}
        {integrations.length > 0 ? (
          integrations.map(id => <StatusBadge key={id} tone="neutral">Optional Integration: {id}</StatusBadge>)
        ) : 'None'}
      </div>

      <div style={{ color: DIM, fontSize: '10px', marginBottom: '0.25rem' }}>{PROTOTYPE_NOTICE}</div>
      <div>
        {readOnly ? (
          <>
            <DisabledActionButton label="Assign Vendor Preview" title="Disabled in Review Mode" />
            <DisabledActionButton label="Deploy Module — Coming in Phase 9" />
            <DisabledActionButton label="Disable Module Preview" title="Disabled in Review Mode" />
            <DisabledActionButton label="Restore Module Preview" title="Disabled in Review Mode" />
          </>
        ) : (
          <>
            <PreviewActionButton
              label="Assign Vendor Preview"
              disabled={!module.vendorAssignable || !vendorId}
              onClick={() => onAssign(module, vendorId, vendorName)}
            />
            <DisabledActionButton label="Deploy Module — Coming in Phase 9" />
            <PreviewActionButton
              label="Disable Module Preview"
              disabled={!vendorId}
              onClick={() => onDisable(module, vendorId, vendorName)}
            />
            <PreviewActionButton
              label="Restore Module Preview"
              disabled={!canRestore}
              onClick={() => onRestore(module, latestDisableRecord)}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default function ModuleDeploymentCenter({ readOnly = false } = {}) {
  const { role } = useSecurity()
  const modules = getAllNoviModules()
  const displayRole = readOnly ? 'Review Mode (no session)' : (ROLE_DISPLAY_LABEL[role] ?? role)
  const vendors = listVendors()

  const [vendorId, setVendorId] = useState(vendors[0]?.vendorId ?? '')
  const [, forceRefresh] = useState(0)

  const vendorName = vendors.find(v => v.vendorId === vendorId)?.vendorName ?? vendorId

  function handleAssign(module, selectedVendorId, selectedVendorName) {
    if (readOnly) return
    const result = assignModuleToVendor({
      vendorId: selectedVendorId,
      vendorName: selectedVendorName,
      moduleId: module.moduleId,
      environment: 'demo',
      assignedBy: role,
      notes: PROTOTYPE_NOTICE,
    })
    recordNoviAuditEvent({
      action: NOVI_AUDIT_ACTION.VENDOR_ASSIGNED_PREVIEW,
      moduleId: module.moduleId,
      vendorId: selectedVendorId,
      actorRole: role,
      status: result.ok ? NOVI_AUDIT_STATUS.SUCCESS : NOVI_AUDIT_STATUS.FAILURE,
      reason: result.ok ? null : result.reason,
      environment: 'demo',
      notes: PROTOTYPE_NOTICE,
    })
    forceRefresh(n => n + 1)
  }

  function handleDisable(module, selectedVendorId, selectedVendorName) {
    if (readOnly) return
    const record = disableModuleForVendor({
      moduleId: module.moduleId,
      vendorId: selectedVendorId,
      reason: 'Prototype preview disable',
      actor: role,
      environment: 'demo',
    })
    recordNoviAuditEvent({
      action: NOVI_AUDIT_ACTION.MODULE_DISABLED_PREVIEW,
      moduleId: module.moduleId,
      vendorId: selectedVendorId,
      actorRole: role,
      status: NOVI_AUDIT_STATUS.SUCCESS,
      reason: record.reason,
      environment: 'demo',
      notes: PROTOTYPE_NOTICE,
    })
    forceRefresh(n => n + 1)
  }

  function handleRestore(module, disableRecord) {
    if (readOnly) return
    if (!disableRecord) return
    requestRestore({ disableRecordId: disableRecord.id, actor: role })
    recordNoviAuditEvent({
      action: NOVI_AUDIT_ACTION.MODULE_RESTORED_PREVIEW,
      moduleId: module.moduleId,
      vendorId: disableRecord.vendorId,
      actorRole: role,
      status: NOVI_AUDIT_STATUS.SUCCESS,
      reason: 'Prototype preview restore request',
      environment: 'demo',
      notes: PROTOTYPE_NOTICE,
    })
    forceRefresh(n => n + 1)
  }

  const assignments = getAssignments()
  const disableRecords = getDisableRecords()
  const auditLog = getNoviAuditLog()
  const latestDisableByModule = Object.fromEntries(
    modules.map(module => [
      module.moduleId,
      [...disableRecords].reverse().find(r => r.moduleId === module.moduleId) ?? null,
    ]),
  )

  const atmosphereModule = modules.find(m => m.moduleId === 'atmosphere')
  const readinessChecklist = runDeploymentSafetyChecklist({
    vendorId, moduleId: 'pos3', role, environment: 'production',
  })
  const deploymentContract = createDeploymentContract({ vendorId, moduleId: 'pos3', deploymentMode: 'production' })

  return (
    <div style={{ background: DARK, minHeight: '100vh', padding: '2rem', color: '#eee', fontFamily: 'Georgia, serif' }}>
      {readOnly && (
        <div style={{
          background: 'rgba(224,169,90,0.12)', border: `1px solid ${WARN}`, color: WARN,
          borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.5rem',
          fontSize: '13px', fontWeight: 700, letterSpacing: '0.02em', textAlign: 'center',
        }}>
          Review Mode Only — No Live Deployment Controls
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
        <img
          src="/assets/novi/crafthub-gauge-badge.png"
          alt=""
          style={{ width: 40, height: 20, objectFit: 'cover', borderRadius: '4px', border: `1px solid ${BORDER}`, flexShrink: 0 }}
        />
        <h1 style={{ color: GOLD, fontSize: '22px', margin: 0, fontFamily: 'Georgia, serif' }}>Module Deployment Center</h1>
      </div>
      <p style={{ color: DIM, fontSize: '12px', marginBottom: '1.5rem' }}>
        Read-only view of CraftHub modules known to Novi OS{readOnly ? '' : ', plus prototype-only vendor assignment tools'}. Signed in as: {displayRole}.
      </p>

      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', fontSize: '12px', color: DIM }}>
        <div>This screen is Novi admin / super admin only.</div>
        <div>Vendor assignment, disable, and restore below create local prototype records only — {PROTOTYPE_NOTICE}</div>
        <div>Live deployment, billing, and device control are future phases.</div>
      </div>

      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ color: GOLD, fontSize: '13px', marginBottom: '0.5rem' }}>Preview Vendor</div>
        <select
          value={vendorId}
          onChange={e => setVendorId(e.target.value)}
          disabled={readOnly}
          style={{ background: DARK, color: '#eee', border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '4px 8px', fontSize: '12px', opacity: readOnly ? 0.6 : 1, cursor: readOnly ? 'not-allowed' : 'auto' }}
        >
          {vendors.map(v => (
            <option key={v.vendorId} value={v.vendorId}>{v.vendorName}</option>
          ))}
        </select>
        <div style={{ color: DIM, fontSize: '10px', marginTop: '0.5rem' }}>
          {readOnly
            ? 'Vendor selection and all assignment/disable/restore actions are disabled in Review Mode.'
            : <>Assignment/disable/restore preview actions below apply to this vendor. {PROTOTYPE_NOTICE}</>}
        </div>
      </div>

      <div>
        {modules.map(module => (
          <ModuleCard
            key={module.moduleId}
            module={module}
            vendorId={vendorId}
            vendorName={vendorName}
            onAssign={handleAssign}
            onDisable={handleDisable}
            onRestore={handleRestore}
            latestDisableRecord={latestDisableByModule[module.moduleId]}
            readOnly={readOnly}
          />
        ))}
      </div>

      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
        <h2 style={{ color: GOLD, fontSize: '14px', marginTop: 0, marginBottom: '0.5rem' }}>Currently Assigned Modules (Prototype Preview)</h2>
        {assignments.length === 0 ? (
          <div style={{ color: DIM, fontSize: '11px' }}>No prototype assignments recorded yet.</div>
        ) : (
          assignments.map(a => (
            <div key={a.id} style={{ color: DIM, fontSize: '11px', marginBottom: '4px' }}>
              {a.vendorName ?? a.vendorId} &middot; {a.moduleId} &middot; {a.assignmentStatus} &middot; {a.enabled ? 'enabled' : 'disabled'} &middot; {a.environment}
            </div>
          ))
        )}
      </div>

      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
        <h2 style={{ color: GOLD, fontSize: '14px', marginTop: 0, marginBottom: '0.5rem' }}>Disabled Modules (Prototype Preview)</h2>
        {disableRecords.length === 0 ? (
          <div style={{ color: DIM, fontSize: '11px' }}>No prototype disable records yet.</div>
        ) : (
          disableRecords.map(r => (
            <div key={r.id} style={{ color: DIM, fontSize: '11px', marginBottom: '4px' }}>
              {r.moduleId} &middot; scope: {r.scope} &middot; {r.vendorId ?? 'all vendors'} &middot; restore: {r.restoreStatus}
            </div>
          ))
        )}
      </div>

      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '1rem' }}>
        <h2 style={{ color: GOLD, fontSize: '14px', marginTop: 0, marginBottom: '0.5rem' }}>Audit Trail Preview</h2>
        {auditLog.length === 0 ? (
          <div style={{ color: DIM, fontSize: '11px' }}>No audit events recorded yet.</div>
        ) : (
          [...auditLog].reverse().slice(0, 20).map(entry => (
            <div key={entry.id} style={{ color: DIM, fontSize: '11px', marginBottom: '4px' }}>
              {entry.action} &middot; {entry.moduleId ?? 'n/a'} &middot; {entry.vendorId ?? 'n/a'} &middot; {entry.status} &middot; {entry.actorRole ?? 'unknown'}
            </div>
          ))
        )}
      </div>

      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '1rem', marginTop: '1rem' }}>
        <h2 style={{ color: GOLD, fontSize: '14px', marginTop: 0, marginBottom: '0.25rem' }}>Remote Deployment Readiness</h2>
        <div style={{ color: DIM, fontSize: '10px', marginBottom: '0.75rem' }}>{PROTOTYPE_NOTICE} This section summarizes Phase 8/9 readiness facts — it adds no new actions.</div>
        <ReadinessItem label="Preview Assignment Ready" ready />
        <ReadinessItem label="Remote Disable Preview Ready" ready />
        <ReadinessItem label="Audit Trail Preview Ready" ready={readinessChecklist.checks.auditLogReady === CHECK_STATUS.READY} />
        <ReadinessItem label="Live Deployment Locked" ready={!deploymentContract.liveDeploymentAllowed} lockedTone />
        <ReadinessItem label="Billing Not Connected" ready={readinessChecklist.checks.billingConnected === CHECK_STATUS.NOT_READY} lockedTone />
        <ReadinessItem label="Device Control Not Connected" ready={readinessChecklist.checks.deviceApisConnected === CHECK_STATUS.NOT_READY} lockedTone />
        <ReadinessItem label="Atmosphere Not Ready" ready={atmosphereModule?.controlMode === CONTROL_MODE.NOT_READY} lockedTone />
      </div>
    </div>
  )
}
