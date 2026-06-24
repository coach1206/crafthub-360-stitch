/**
 * Module Deployment Center — Novi OS, Phase 7
 *
 * Read-only admin screen showing which CraftHub modules exist, which are
 * standalone, which are ready, and which are not ready. Sources data only
 * from the Phase 6 read-only layer (noviModuleStatusService.js,
 * noviModuleSecurityPolicy.js) — no SmokeCraft/POS3/E.A.T. screen or
 * component is imported, and nothing here deploys, bills, or controls a
 * device. All action buttons are visually present but permanently
 * disabled in this phase.
 *
 * Route-gated to admin/founder_level_0 in App.jsx (the same mechanism
 * that already gates /admin) — see docs/phase-7-novi-deployment-center-audit.md
 * for why "Novi Admin"/"Super Admin" are used as display labels for those
 * two real roles rather than inventing new session roles.
 */

import { getAllNoviModules } from '../../services/noviModuleStatusService.js'
import { CONTROL_MODE } from '../../modules/noviModuleRegistry.js'
import { useSecurity } from '../../context/SecurityContext.jsx'

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

function DisabledActionButton({ label }) {
  return (
    <button
      type="button"
      disabled
      title="Coming in Phase 8/9"
      aria-disabled="true"
      style={{
        background: 'rgba(100,100,100,0.10)', color: DIM, border: `1px solid ${BORDER}`,
        borderRadius: '6px', fontSize: '11px', padding: '6px 12px', marginRight: '8px',
        marginTop: '8px', cursor: 'not-allowed', opacity: 0.6,
      }}
    >
      {label} — Coming in Phase 8/9
    </button>
  )
}

function ModuleCard({ module }) {
  const ready = module.controlMode !== CONTROL_MODE.NOT_READY
  const integrations = Object.keys(module.optionalIntegrations ?? {})

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
      <div style={{ color: DIM, fontSize: '11px' }}>
        Optional integrations:{' '}
        {integrations.length > 0 ? (
          integrations.map(id => <StatusBadge key={id} tone="neutral">Optional Integration: {id}</StatusBadge>)
        ) : 'None'}
      </div>

      <div>
        <DisabledActionButton label="Assign Vendor" />
        <DisabledActionButton label="Deploy Module" />
        <DisabledActionButton label="Disable Module" />
        <DisabledActionButton label="View Audit Log" />
      </div>
    </div>
  )
}

export default function ModuleDeploymentCenter() {
  const { role } = useSecurity()
  const modules = getAllNoviModules()
  const displayRole = ROLE_DISPLAY_LABEL[role] ?? role

  return (
    <div style={{ background: DARK, minHeight: '100vh', padding: '2rem', color: '#eee' }}>
      <h1 style={{ color: GOLD, fontSize: '22px', marginBottom: '0.25rem' }}>Module Deployment Center</h1>
      <p style={{ color: DIM, fontSize: '12px', marginBottom: '1.5rem' }}>
        Read-only view of CraftHub modules known to Novi OS. Signed in as: {displayRole}.
      </p>

      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', fontSize: '12px', color: DIM }}>
        <div>This screen is Novi admin / super admin only.</div>
        <div>Deployment actions are not active yet — every action button below is disabled.</div>
        <div>Live vendor assignment, billing, and device control are future phases (8/9).</div>
      </div>

      <div>
        {modules.map(module => (
          <ModuleCard key={module.moduleId} module={module} />
        ))}
      </div>
    </div>
  )
}
