/**
 * NOVEE OS — Deployment Activation Center (Phase D.7 / Phase E.4)
 * Route: /phase-d/deployment-activation
 * contains_secrets: false
 * No live production deployment. Rollback execution disabled. Honest status only.
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const NAVY     = '#0a0d14'
const CHARCOAL = '#111520'
const CARD     = '#161b27'
const LINE     = '#252d3f'
const GOLD     = '#c9952c'
const GOLD2    = '#e8b84b'
const TEXT     = '#e8e4d8'
const MUTE     = '#7a8299'
const RED      = '#c0392b'
const GREEN    = '#27ae60'
const BLUE     = '#2980b9'
const AMBER    = '#e67e22'

const API = '/api/phase-d/deployment-activation'

function useFetch(path) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  useEffect(() => {
    fetch(API + path)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [path])
  return { data, loading, error }
}

function Badge({ label, color = MUTE }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
      color, border: `1px solid ${color}55`, borderRadius: 10, padding: '2px 8px',
      fontFamily: '"JetBrains Mono", monospace',
    }}>
      {label}
    </span>
  )
}

function Panel({ title, children, accent = LINE }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${accent}`, borderRadius: 12, padding: '20px 22px', marginBottom: 20 }}>
      <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, marginBottom: 14 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function StatRow({ label, value, color = TEXT }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${LINE}` }}>
      <span style={{ fontSize: 12, color: MUTE }}>{label}</span>
      <span style={{ fontSize: 12, color, fontFamily: '"JetBrains Mono", monospace' }}>{String(value)}</span>
    </div>
  )
}

function gateColor(status) {
  if (status === 'passed')           return GREEN
  if (status === 'blocked')          return RED
  if (status === 'missing_evidence') return AMBER
  if (status === 'not_required')     return MUTE
  return BLUE
}

// ── A. Summary ────────────────────────────────────────────────
function SummaryPanel() {
  const { data, loading } = useFetch('/summary')
  const d = data?.data || data || {}
  return (
    <Panel title="A — Deployment Activation Summary" accent={`${GOLD}44`}>
      {loading ? <span style={{ color: MUTE, fontSize: 12 }}>Loading…</span> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Readiness Score',         value: `${d.readiness_score ?? 0}%`,    color: d.readiness_score >= 80 ? GREEN : AMBER },
              { label: 'Deployment Ready',        value: String(d.deployment_ready ?? false), color: RED },
              { label: 'Remote Dist. Ready',      value: String(d.remote_distribution_ready ?? false), color: RED },
              { label: 'Live Production',         value: String(d.live_production_enabled ?? false), color: RED },
              { label: 'Rollback Execution',      value: String(d.rollback_execution_enabled ?? false), color: RED },
              { label: 'Blockers',                value: d.blockers_count ?? '—',          color: d.blockers_count > 0 ? RED : GREEN },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: NAVY, border: `1px solid ${LINE}`, borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 17, fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: 10, color: MUTE, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
          <StatRow label="Safety Status"           value={d.safety_status || 'BUILD_ONLY_NO_LIVE_DEPLOYMENT'} color={AMBER} />
          <StatRow label="Security Gate Required"  value={String(d.security_gate_required ?? true)} color={AMBER} />
          <StatRow label="Security Gate Bypassed"  value={String(d.security_gate_bypassed ?? false)} color={RED} />
          <StatRow label="Packages Tracked"        value={`${d.packages_deployment_ready ?? 0} ready / ${d.total_packages ?? 8} total`} color={MUTE} />
        </>
      )}
    </Panel>
  )
}

// ── B. Environment Registry ───────────────────────────────────
function EnvironmentsPanel() {
  const { data, loading } = useFetch('/environments')
  const envs = data?.data || []
  return (
    <Panel title="B — Deployment Environment Registry">
      {loading ? <span style={{ color: MUTE, fontSize: 12 }}>Loading…</span> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
          {envs.map(e => (
            <div key={e.environment_key} style={{ background: NAVY, border: `1px solid ${LINE}`, borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: TEXT, fontWeight: 600 }}>{e.environment_name}</span>
                <Badge label={e.status || 'pending'} color={e.status === 'pending' ? BLUE : MUTE} />
              </div>
              <div style={{ fontSize: 10, color: MUTE, fontFamily: '"JetBrains Mono", monospace', marginBottom: 8 }}>
                {e.environment_type} · {e.hosting_provider || 'n/a'}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Badge label={`verified: ${e.verified}`}              color={e.verified ? GREEN : RED} />
                <Badge label={`prod-candidate: ${e.production_candidate}`} color={e.production_candidate ? GREEN : RED} />
                <Badge label={e.verification_status || 'pending'}     color={MUTE} />
              </div>
              {e.safe_claim && (
                <div style={{ fontSize: 10, color: MUTE, marginTop: 8, fontFamily: '"JetBrains Mono", monospace' }}>{e.safe_claim}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

// ── C. Gates ──────────────────────────────────────────────────
function GatesPanel() {
  const { data, loading } = useFetch('/gates')
  const gates = data?.data || []
  return (
    <Panel title="C — Deployment Readiness Gates (19 gates)">
      {loading ? <span style={{ color: MUTE, fontSize: 12 }}>Loading…</span> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {gates.map(g => {
            const color = gateColor(g.status)
            return (
              <div key={g.gate_key} style={{ background: NAVY, border: `1px solid ${color}33`, borderRadius: 10, padding: '11px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 3 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: TEXT, fontWeight: 600 }}>{g.gate_name}</span>
                    <Badge label={g.status || 'pending'} color={color} />
                  </div>
                  <div style={{ fontSize: 9, color: MUTE, fontFamily: '"JetBrains Mono", monospace', marginTop: 2 }}>{g.gate_key} · {g.gate_category}</div>
                  {g.blocker_reason && <div style={{ fontSize: 11, color: AMBER, marginTop: 5, lineHeight: 1.4 }}>{g.blocker_reason}</div>}
                  <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                    {g.required_for_deployment && <Badge label="req: deploy" color={MUTE} />}
                    {g.required_for_remote_distribution && <Badge label="req: remote" color={MUTE} />}
                    <Badge label={`evidence: ${g.evidence_present ? 'ok' : 'missing'}`} color={g.evidence_present ? GREEN : RED} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Panel>
  )
}

// ── D. Packages ───────────────────────────────────────────────
function PackagesPanel() {
  const { data, loading } = useFetch('/packages')
  const packages = data?.data || []
  const buildColor = s => s === 'passed' ? GREEN : s === 'failed' ? RED : MUTE
  return (
    <Panel title="D — Deployment Package Registry">
      {loading ? <span style={{ color: MUTE, fontSize: 12 }}>Loading…</span> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          {packages.map(p => (
            <div key={p.package_key} style={{ background: NAVY, border: `1px solid ${LINE}`, borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: TEXT, fontWeight: 600 }}>{p.package_name}</span>
                <Badge label={p.status || 'preview'} color={BLUE} />
              </div>
              <div style={{ fontSize: 10, color: MUTE, fontFamily: '"JetBrains Mono", monospace', marginBottom: 8 }}>
                {p.package_type} · {p.version_label || 'pending'}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Badge label={`build: ${p.build_status}`}       color={buildColor(p.build_status)} />
                <Badge label={`verify: ${p.verification_status}`} color={MUTE} />
                <Badge label={`deploy-ready: ${p.deployment_ready}`} color={p.deployment_ready ? GREEN : RED} />
                <Badge label={`remote-ready: ${p.remote_distribution_ready}`} color={RED} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

// ── E. Rollback Plans ─────────────────────────────────────────
function RollbackPlansPanel() {
  const { data, loading } = useFetch('/rollback-plans')
  const plans = data?.data || []
  return (
    <Panel title="E — Rollback Plans (Execution Disabled)">
      <div style={{ marginBottom: 14, padding: '10px 14px', background: `${RED}11`, border: `1px solid ${RED}33`, borderRadius: 8, fontSize: 12, color: RED }}>
        Rollback execution is DISABLED. Planning records are tracked. Execution belongs to Phase E.6.
      </div>
      {loading ? <span style={{ color: MUTE, fontSize: 12 }}>Loading…</span> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {plans.map(p => (
            <div key={p.plan_key} style={{ background: NAVY, border: `1px solid ${LINE}`, borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: TEXT, fontWeight: 600 }}>{p.plan_name}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Badge label={`available: ${p.rollback_available}`}          color={p.rollback_available ? GREEN : MUTE} />
                  <Badge label={`execution: ${p.rollback_execution_enabled}`}  color={RED} />
                  <Badge label={`tested: ${p.rollback_tested}`}                color={p.rollback_tested ? GREEN : MUTE} />
                </div>
              </div>
              {p.blocker_reason && <div style={{ fontSize: 11, color: AMBER }}>{p.blocker_reason}</div>}
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

// ── F. Blockers ───────────────────────────────────────────────
function BlockersPanel() {
  const { data, loading } = useFetch('/blockers')
  const d = data?.data || data || {}
  const blockers = d.blockers || []
  return (
    <Panel title="F — Active Deployment Blockers" accent={`${RED}44`}>
      {loading ? <span style={{ color: MUTE, fontSize: 12 }}>Loading…</span> : (
        <>
          <div style={{ marginBottom: 14, padding: '10px 14px', background: `${RED}11`, border: `1px solid ${RED}33`, borderRadius: 8, fontSize: 12, color: RED }}>
            {blockers.length} blocker{blockers.length !== 1 ? 's' : ''} preventing deployment and remote distribution.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {blockers.map((b, i) => (
              <div key={i} style={{ fontSize: 12, display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 0', borderBottom: `1px solid ${LINE}` }}>
                <span style={{ color: RED, fontFamily: '"JetBrains Mono", monospace', fontSize: 10, flexShrink: 0, marginTop: 2 }}>✗</span>
                <div>
                  <div style={{ color: TEXT, fontWeight: 600 }}>{b.gate_name}</div>
                  <div style={{ color: MUTE, fontSize: 11, marginTop: 2 }}>{b.reason}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Panel>
  )
}

// ── G. Safe Claims ────────────────────────────────────────────
function SafeClaimsPanel() {
  const { data, loading } = useFetch('/safe-claims')
  const d = data?.data || data || {}
  return (
    <Panel title="G — Safe Deployment Claims">
      {loading ? <span style={{ color: MUTE, fontSize: 12 }}>Loading…</span> : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <div style={{ fontSize: 10, fontFamily: '"JetBrains Mono", monospace', color: GREEN, letterSpacing: '0.14em', marginBottom: 10 }}>CAN CLAIM</div>
            {(d.can_claim || []).map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: TEXT, marginBottom: 7 }}>
                <span style={{ color: GREEN, flexShrink: 0 }}>✓</span>{c}
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 10, fontFamily: '"JetBrains Mono", monospace', color: RED, letterSpacing: '0.14em', marginBottom: 10 }}>CANNOT CLAIM WITHOUT PROOF</div>
            {(d.cannot_claim_without_proof || []).map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: MUTE, marginBottom: 7 }}>
                <span style={{ color: RED, flexShrink: 0 }}>✗</span>{c}
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  )
}

// ── H. Audit Log ──────────────────────────────────────────────
function AuditLogPanel() {
  const { data, loading } = useFetch('/audit-log')
  const events = data?.data || []
  return (
    <Panel title="H — Deployment Audit Log">
      {loading ? <span style={{ color: MUTE, fontSize: 12 }}>Loading…</span> : (
        events.length === 0
          ? <span style={{ fontSize: 12, color: MUTE }}>No audit events yet. Events are written on deployment actions.</span>
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 280, overflowY: 'auto' }}>
              {events.map((e, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: `1px solid ${LINE}`, fontSize: 11 }}>
                  <span style={{ color: MUTE, flexShrink: 0, fontFamily: '"JetBrains Mono", monospace', fontSize: 10 }}>
                    {e.created_at ? new Date(e.created_at).toLocaleTimeString() : '—'}
                  </span>
                  <span style={{ color: e.severity === 'critical' ? RED : MUTE, flexShrink: 0, fontFamily: '"JetBrains Mono", monospace', fontSize: 10, width: 50 }}>
                    {e.severity}
                  </span>
                  <span style={{ color: TEXT }}>{e.summary}</span>
                </div>
              ))}
            </div>
          )
      )}
    </Panel>
  )
}

// ── I. Feature Flags ──────────────────────────────────────────
function FeatureFlagsPanel() {
  const { data, loading } = useFetch('/feature-flags')
  const flags = data?.data?.flags || data?.flags || []
  return (
    <Panel title="I — Deployment Feature Flags">
      {loading ? <span style={{ color: MUTE, fontSize: 12 }}>Loading…</span> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {flags.map(f => (
            <div key={f.flag_key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${LINE}` }}>
              <span style={{ fontSize: 11, fontFamily: '"JetBrains Mono", monospace', color: MUTE }}>{f.flag_key}</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {f.production_impact && <Badge label="prod-impact" color={AMBER} />}
                <span style={{ fontSize: 12, fontFamily: '"JetBrains Mono", monospace', color: f.flag_value ? GREEN : RED }}>
                  {String(f.flag_value)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

// ── Security Gate Dependency ──────────────────────────────────
function SecurityGatePanel() {
  const { data, loading } = useFetch('/security-gate-dependency')
  const d = data?.data || data || {}
  const navigate = useNavigate()
  return (
    <Panel title="Security Gate Dependency — Phase E.3 Required" accent={`${AMBER}44`}>
      {loading ? <span style={{ color: MUTE, fontSize: 12 }}>Loading…</span> : (
        <>
          <StatRow label="Security Gate Required"  value={String(d.security_gate_required ?? true)}  color={AMBER} />
          <StatRow label="Security Gate Bypassed"  value={String(d.security_gate_bypassed ?? false)} color={RED} />
          <StatRow label="Security Gates Required" value={d.security_gates_required ?? 14}           color={MUTE} />
          <StatRow label="Security Gates Passed"   value={d.security_gates_passed ?? 0}              color={MUTE} />
          <div style={{ marginTop: 12, fontSize: 12, color: AMBER, lineHeight: 1.5 }}>{d.message}</div>
          <button
            onClick={() => navigate('/phase-d/security-activation')}
            style={{
              marginTop: 12, fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: GOLD, background: 'transparent',
              border: `1px solid ${GOLD}55`, borderRadius: 20, padding: '7px 16px', cursor: 'pointer',
            }}
          >
            → View Security Activation (Phase E.3)
          </button>
        </>
      )}
    </Panel>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function DeploymentActivation() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100dvh', background: NAVY, color: TEXT, fontFamily: '"Hanken Grotesk", sans-serif' }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 50, height: 64, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 28px',
        background: CHARCOAL, borderBottom: `1px solid ${LINE}`,
      }}>
        <button
          onClick={() => navigate('/novee-os/command-center')}
          style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
            color: MUTE, background: 'transparent', border: `1px solid ${LINE}`, borderRadius: 20, padding: '6px 14px', cursor: 'pointer',
          }}
        >
          ← Command Center
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: GOLD, marginBottom: 2 }}>NOVEE OS — Phase D.7</div>
          <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 18, fontWeight: 700, color: TEXT }}>Deployment Activation Center</div>
        </div>
        <Badge label="BUILD ONLY" color={AMBER} />
      </header>

      <div style={{ background: `${AMBER}11`, borderBottom: `1px solid ${AMBER}33`, padding: '10px 28px' }}>
        <div style={{ fontSize: 10, fontFamily: '"JetBrains Mono", monospace', color: AMBER, letterSpacing: '0.1em', lineHeight: 1.8 }}>
          DEPLOYMENT ACTIVATION — BUILD ONLY &nbsp;|&nbsp;
          No live production deployment &nbsp;|&nbsp;
          Rollback execution DISABLED &nbsp;|&nbsp;
          Remote distribution BLOCKED &nbsp;|&nbsp;
          No fake production proof &nbsp;|&nbsp;
          Secrets never exposed
        </div>
      </div>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 28px 80px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 26, fontWeight: 700, color: GOLD2, margin: '0 0 8px' }}>
            NOVEE OS Deployment Activation
          </h1>
          <p style={{ fontSize: 13, color: MUTE, margin: 0, lineHeight: 1.6 }}>
            Phase D.7 deployment gate — 19 gates, 8 environments, 8 packages, 4 rollback plans.
            Live production deployment is <span style={{ color: RED }}>disabled</span>.
            Rollback execution is <span style={{ color: RED }}>disabled</span>.
            Remote distribution remains <span style={{ color: RED }}>blocked</span>.
          </p>
        </div>

        <SummaryPanel />
        <SecurityGatePanel />
        <EnvironmentsPanel />
        <GatesPanel />
        <PackagesPanel />
        <RollbackPlansPanel />
        <BlockersPanel />
        <SafeClaimsPanel />
        <AuditLogPanel />
        <FeatureFlagsPanel />
      </main>
    </div>
  )
}
