/**
 * NOVEE OS — Security Activation Center (Phase D.6 / Phase E.3)
 * Route: /phase-d/security-activation
 * contains_secrets: false
 * No live enforcement. No fake certification claims. Honest status only.
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

const API = '/api/phase-d/security-activation'

function useFetch(path) {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)
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

function GateStatusColor(status) {
  if (status === 'passed')          return GREEN
  if (status === 'blocked')         return RED
  if (status === 'missing_evidence') return AMBER
  if (status === 'not_required')    return MUTE
  return BLUE
}

// ── A. Summary Panel ──────────────────────────────────────────
function SummaryPanel() {
  const { data, loading } = useFetch('/summary')
  const d = data?.data || data || {}

  return (
    <Panel title="A — Security Activation Summary" accent={`${GOLD}44`}>
      {loading ? <span style={{ color: MUTE, fontSize: 12 }}>Loading…</span> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Readiness Score', value: `${d.readiness_score ?? 0}%`, color: d.readiness_score >= 80 ? GREEN : AMBER },
              { label: 'Production Ready', value: String(d.production_ready ?? false), color: d.production_ready ? GREEN : RED },
              { label: 'Live Providers', value: String(d.live_provider_connections ?? false), color: RED },
              { label: 'Remote Dist. Allowed', value: String(d.remote_distribution_allowed ?? false), color: RED },
              { label: 'Blockers', value: d.blockers_count ?? '—', color: d.blockers_count > 0 ? RED : GREEN },
              { label: 'Providers Configured', value: `${d.providers_configured ?? 0} / ${d.total_providers ?? 10}`, color: MUTE },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: NAVY, border: `1px solid ${LINE}`, borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 18, fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: 10, color: MUTE, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
          <StatRow label="Safety Status"    value={d.safety_status || 'BUILD_ONLY_NO_LIVE_ENFORCEMENT'} color={AMBER} />
          <StatRow label="Production Enforcement" value={String(d.production_enforcement_enabled ?? false)} color={RED} />
          <StatRow label="Remote Distribution Blocked Reason" value={d.remote_distribution_blocked_reason || 'All gates must pass'} color={MUTE} />
        </>
      )}
    </Panel>
  )
}

// ── B. Providers Panel ────────────────────────────────────────
function ProvidersPanel() {
  const { data, loading } = useFetch('/providers')
  const providers = data?.data || []

  return (
    <Panel title="B — Security Provider Registry">
      {loading ? <span style={{ color: MUTE, fontSize: 12 }}>Loading…</span> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          {providers.map(p => (
            <div key={p.provider_key} style={{ background: NAVY, border: `1px solid ${LINE}`, borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: TEXT, fontWeight: 600 }}>{p.provider_name}</span>
                <Badge label={p.status || 'preview'} color={BLUE} />
              </div>
              <div style={{ fontSize: 10, color: MUTE, fontFamily: '"JetBrains Mono", monospace', marginBottom: 8 }}>{p.provider_type}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Badge label={`configured: ${p.configured}`}            color={p.configured ? GREEN : RED} />
                <Badge label={`live: ${p.live_connection_enabled}`}     color={p.live_connection_enabled ? GREEN : RED} />
                <Badge label={`prod-ready: ${p.production_ready}`}      color={p.production_ready ? GREEN : RED} />
                <Badge label="credential-ref-only"                      color={AMBER} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

// ── C. Gates Panel ────────────────────────────────────────────
function GatesPanel() {
  const { data, loading } = useFetch('/gates')
  const gates = data?.data || []

  return (
    <Panel title="C — Security Activation Gates">
      {loading ? <span style={{ color: MUTE, fontSize: 12 }}>Loading…</span> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {gates.map(g => {
            const color = GateStatusColor(g.status)
            return (
              <div key={g.gate_key} style={{ background: NAVY, border: `1px solid ${color}44`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0, marginTop: 3 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: TEXT, fontWeight: 600 }}>{g.gate_name}</span>
                    <Badge label={g.status || 'pending'} color={color} />
                  </div>
                  <div style={{ fontSize: 10, color: MUTE, fontFamily: '"JetBrains Mono", monospace', marginTop: 3 }}>{g.gate_key}</div>
                  {g.blocker_reason && (
                    <div style={{ fontSize: 11, color: AMBER, marginTop: 6, lineHeight: 1.4 }}>{g.blocker_reason}</div>
                  )}
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    {g.required_for_deployment && <Badge label="req: deployment" color={MUTE} />}
                    {g.required_for_remote_distribution && <Badge label="req: remote-dist" color={MUTE} />}
                    <Badge label={`evidence: ${g.evidence_present ? 'present' : 'missing'}`} color={g.evidence_present ? GREEN : RED} />
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

// ── D. Blockers Panel ─────────────────────────────────────────
function BlockersPanel() {
  const { data, loading } = useFetch('/blockers')
  const d = data?.data || data || {}
  const blockers = d.blockers || []

  return (
    <Panel title="D — Active Security Blockers" accent={`${RED}44`}>
      {loading ? <span style={{ color: MUTE, fontSize: 12 }}>Loading…</span> : (
        <>
          <div style={{ marginBottom: 14, padding: '10px 14px', background: `${RED}11`, border: `1px solid ${RED}33`, borderRadius: 8, fontSize: 12, color: RED }}>
            Remote distribution is BLOCKED. {blockers.length} security gate{blockers.length !== 1 ? 's' : ''} must pass first.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {blockers.map((b, i) => (
              <div key={i} style={{ fontSize: 12, color: AMBER, display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 0', borderBottom: `1px solid ${LINE}` }}>
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

// ── E. Safe Claims Panel ──────────────────────────────────────
function SafeClaimsPanel() {
  const { data, loading } = useFetch('/safe-claims')
  const d = data?.data || data || {}
  const canClaim    = d.can_claim || []
  const cannotClaim = d.cannot_claim_without_proof || []

  return (
    <Panel title="E — Safe Security Claims">
      {loading ? <span style={{ color: MUTE, fontSize: 12 }}>Loading…</span> : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <div style={{ fontSize: 10, fontFamily: '"JetBrains Mono", monospace', color: GREEN, letterSpacing: '0.14em', marginBottom: 10 }}>CAN CLAIM</div>
            {canClaim.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: TEXT, marginBottom: 7 }}>
                <span style={{ color: GREEN, flexShrink: 0 }}>✓</span>{c}
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 10, fontFamily: '"JetBrains Mono", monospace', color: RED, letterSpacing: '0.14em', marginBottom: 10 }}>CANNOT CLAIM WITHOUT PROOF</div>
            {cannotClaim.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: MUTE, marginBottom: 7 }}>
                <span style={{ color: RED, flexShrink: 0 }}>✗</span>{c}
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  )
}

// ── F. Audit Log Panel ────────────────────────────────────────
function AuditLogPanel() {
  const { data, loading } = useFetch('/audit-log')
  const events = data?.data || []

  return (
    <Panel title="F — Security Audit Log">
      {loading ? <span style={{ color: MUTE, fontSize: 12 }}>Loading…</span> : (
        events.length === 0
          ? <span style={{ fontSize: 12, color: MUTE }}>No audit events recorded yet. Events are written on security actions.</span>
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
              {events.map((e, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '7px 0', borderBottom: `1px solid ${LINE}`, fontSize: 11 }}>
                  <span style={{ color: MUTE, flexShrink: 0, fontFamily: '"JetBrains Mono", monospace', fontSize: 10 }}>
                    {e.created_at ? new Date(e.created_at).toLocaleTimeString() : '—'}
                  </span>
                  <span style={{ color: e.severity === 'critical' ? RED : e.severity === 'high' ? AMBER : MUTE, flexShrink: 0, fontFamily: '"JetBrains Mono", monospace', fontSize: 10, width: 50 }}>
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

// ── G. Feature Flags Panel ────────────────────────────────────
function FeatureFlagsPanel() {
  const { data, loading } = useFetch('/feature-flags')
  const flags = data?.data?.flags || data?.flags || []

  return (
    <Panel title="G — Security Feature Flags">
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

// ── Risks Panel ───────────────────────────────────────────────
function RisksPanel() {
  const { data, loading } = useFetch('/risks')
  const risks = data?.data || []
  const severityColor = s => s === 'critical' ? RED : s === 'high' ? AMBER : s === 'medium' ? BLUE : MUTE

  return (
    <Panel title="Risk Registry">
      {loading ? <span style={{ color: MUTE, fontSize: 12 }}>Loading…</span> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {risks.map(r => (
            <div key={r.risk_key} style={{ background: NAVY, border: `1px solid ${LINE}`, borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: TEXT, fontWeight: 600 }}>{r.risk_title}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Badge label={r.severity} color={severityColor(r.severity)} />
                  <Badge label={r.status}   color={r.status === 'open' ? AMBER : GREEN} />
                  {r.blocker && <Badge label="blocker" color={RED} />}
                </div>
              </div>
              <div style={{ fontSize: 11, color: MUTE }}>{r.mitigation_summary}</div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function SecurityActivation() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100dvh', background: NAVY, color: TEXT, fontFamily: '"Hanken Grotesk", sans-serif' }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50, height: 64, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 28px',
        background: CHARCOAL, borderBottom: `1px solid ${LINE}`,
      }}>
        <button
          onClick={() => navigate('/novee-os/command-center')}
          style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
            color: MUTE, background: 'transparent', border: `1px solid ${LINE}`, borderRadius: 20,
            padding: '6px 14px', cursor: 'pointer',
          }}
        >
          ← Command Center
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: GOLD, marginBottom: 2 }}>NOVEE OS — Phase D.6</div>
          <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 18, fontWeight: 700, color: TEXT }}>Security Activation Center</div>
        </div>
        <Badge label="BUILD ONLY" color={AMBER} />
      </header>

      {/* Safety Banner */}
      <div style={{ background: `${AMBER}11`, borderBottom: `1px solid ${AMBER}33`, padding: '10px 28px' }}>
        <div style={{ fontSize: 10, fontFamily: '"JetBrains Mono", monospace', color: AMBER, letterSpacing: '0.1em', lineHeight: 1.8 }}>
          SECURITY ACTIVATION — BUILD ONLY &nbsp;|&nbsp;
          No live enforcement &nbsp;|&nbsp;
          No fake certifications &nbsp;|&nbsp;
          No fake provider connections &nbsp;|&nbsp;
          No secrets exposed &nbsp;|&nbsp;
          Remote distribution BLOCKED
        </div>
      </div>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 28px 80px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 26, fontWeight: 700, color: GOLD2, margin: '0 0 8px' }}>
            NOVEE OS Security Activation
          </h1>
          <p style={{ fontSize: 13, color: MUTE, margin: 0, lineHeight: 1.6 }}>
            Phase D.6 security gate — 14 gates, 10 provider categories, risk registry, evidence tracking.
            Production enforcement is <span style={{ color: RED }}>disabled</span>.
            Remote distribution remains <span style={{ color: RED }}>blocked</span> until all required gates pass.
          </p>
        </div>

        <SummaryPanel />
        <ProvidersPanel />
        <GatesPanel />
        <BlockersPanel />
        <SafeClaimsPanel />
        <RisksPanel />
        <AuditLogPanel />
        <FeatureFlagsPanel />
      </main>
    </div>
  )
}
