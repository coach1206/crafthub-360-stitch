import { useState, useEffect } from 'react'

const NAVY = '#0a0d14'
const CHARCOAL = '#111520'
const CARD = '#161b27'
const LINE = '#252d3f'
const GOLD = '#c9952c'
const GOLD2 = '#e8b84b'
const TEXT = '#e8e4d8'
const MUTE = '#7a8299'
const RED = '#c0392b'
const GREEN = '#27ae60'
const BLUE = '#2980b9'
const AMBER = '#e67e22'

const API = '/api/novee-os/remote-distribution'

async function apiFetch(path) {
  try { const r = await fetch(API + path); return r.ok ? r.json() : { ok: false, error: r.statusText } }
  catch (e) { return { ok: false, error: e.message } }
}

function Panel({ title, children, accent = GOLD }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 10, padding: '20px 24px', marginBottom: 18 }}>
      <div style={{ color: accent, fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  )
}

function Badge({ label, color = MUTE }) {
  return <span style={{ background: color + '22', color, border: `1px solid ${color}44`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600, marginRight: 5 }}>{label}</span>
}

function NoItems({ label = 'No records yet.' }) {
  return <div style={{ color: MUTE, fontSize: 13 }}>{label}</div>
}

function LocalPreviewNote() {
  return <div style={{ color: AMBER, fontSize: 12, marginTop: 8 }}>Local preview — database not connected</div>
}

// Panel A — Summary
function SummaryPanel({ summary, score, blockers }) {
  const s = summary?.summary || {}
  const sc = score?.score || {}
  const bCount = blockers?.blockers?.length || 0
  return (
    <Panel title="A — Remote Distribution Summary" accent={GOLD}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 14 }}>
        {[
          { label: 'Live Delivery', val: 'DISABLED', color: RED },
          { label: 'Client Provisioning', val: 'DISABLED', color: RED },
          { label: 'Invite Links', val: 'DISABLED', color: RED },
          { label: 'License Validation', val: 'DISABLED', color: RED },
          { label: 'Remote Activation', val: 'DISABLED', color: RED },
          { label: 'Rollback Execution', val: 'DISABLED', color: RED },
          { label: 'Readiness %', val: sc.readiness_percent != null ? `${sc.readiness_percent}%` : '0%', color: AMBER },
          { label: 'Active Blockers', val: String(bCount), color: bCount > 0 ? RED : GREEN },
          { label: 'Remote Dist. Ready', val: 'NO', color: RED },
          { label: 'Production Ready', val: 'NO', color: RED },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: CHARCOAL, borderRadius: 6, padding: '10px 12px' }}>
            <div style={{ color: MUTE, fontSize: 11, marginBottom: 4 }}>{label}</div>
            <div style={{ color: color || TEXT, fontWeight: 700, fontSize: 14 }}>{val}</div>
          </div>
        ))}
      </div>
      <div style={{ color: MUTE, fontSize: 12 }}>Safety: <span style={{ color: AMBER }}>BUILD_ONLY_NO_LIVE_REMOTE_DISTRIBUTION</span></div>
    </Panel>
  )
}

// Panel B — Deployment Packages
function PackagesPanel({ packages }) {
  const list = packages?.packages || []
  return (
    <Panel title="B — Deployment Package Registry (11)" accent={GOLD2}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
        {list.map((p, i) => (
          <div key={p.package_key || i} style={{ background: CHARCOAL, borderRadius: 6, padding: '12px 14px' }}>
            <div style={{ color: TEXT, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{p.package_name}</div>
            <div style={{ color: MUTE, fontSize: 11, marginBottom: 6 }}>{p.package_type} · {p.version_label}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              <Badge label={p.package_status || 'draft'} color={MUTE} />
              <Badge label={`dist: ${p.remote_distribution_ready ? 'READY' : 'BLOCKED'}`} color={p.remote_distribution_ready ? GREEN : RED} />
              <Badge label={`prod: ${p.production_ready ? 'YES' : 'NO'}`} color={p.production_ready ? GREEN : RED} />
            </div>
            <div style={{ color: MUTE, fontSize: 10, marginTop: 6 }}>security: {p.security_gate_status || 'not_verified'} · deployment: {p.deployment_gate_status || 'not_verified'} · pilot: {p.pilot_gate_status || 'not_verified'}</div>
          </div>
        ))}
      </div>
      {list.length === 0 && <NoItems label="No packages loaded." />}
      {packages?.localPreview && <LocalPreviewNote />}
    </Panel>
  )
}

// Panel C — Client Provisioning
function ProvisioningPanel({ requests }) {
  const list = requests?.requests || []
  return (
    <Panel title="C — Client Provisioning Requests" accent={BLUE}>
      {list.length === 0 ? <NoItems label="No provisioning requests yet." /> : list.map(r => (
        <div key={r.id} style={{ borderBottom: `1px solid ${LINE}`, padding: '8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ color: TEXT, fontWeight: 600, fontSize: 13 }}>{r.client_name}</div>
            <div style={{ color: MUTE, fontSize: 12 }}>{r.client_type}{r.venue_name ? ` · ${r.venue_name}` : ''}</div>
            {r.blocker_reason && <div style={{ color: RED, fontSize: 11, marginTop: 3 }}>Blocker: {r.blocker_reason}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <Badge label={r.approval_status || 'pending'} color={r.approval_status === 'approved' ? GREEN : AMBER} />
            <div style={{ marginTop: 4 }}><Badge label={r.provisioning_status || 'pending'} color={MUTE} /></div>
            <div style={{ color: MUTE, fontSize: 10, marginTop: 2 }}>{r.safe_claim}</div>
          </div>
        </div>
      ))}
      {requests?.localPreview && <LocalPreviewNote />}
    </Panel>
  )
}

// Panel D — Invite Sessions
function InviteSessionsPanel({ sessions }) {
  const list = sessions?.sessions || []
  return (
    <Panel title="D — Invite Sessions (no raw tokens)" accent={MUTE}>
      {list.length === 0 ? <NoItems label="No invite sessions yet." /> : list.map(s => (
        <div key={s.id} style={{ borderBottom: `1px solid ${LINE}`, padding: '8px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: TEXT, fontSize: 13 }}>{s.invite_type} · {s.invite_status}</div>
              <div style={{ color: MUTE, fontSize: 11 }}>remote activation: {s.remote_activation_allowed ? 'YES' : 'NO'}</div>
            </div>
            <Badge label={s.invite_status || 'draft'} color={s.invite_status === 'accepted' ? GREEN : MUTE} />
          </div>
          <div style={{ color: MUTE, fontSize: 10, marginTop: 3 }}>{s.safe_claim}</div>
        </div>
      ))}
      <div style={{ color: AMBER, fontSize: 11, marginTop: 8 }}>Raw invite tokens are never shown here.</div>
      {sessions?.localPreview && <LocalPreviewNote />}
    </Panel>
  )
}

// Panel E — License Keys
function LicenseKeysPanel({ keys }) {
  const list = keys?.keys || []
  return (
    <Panel title="E — License Key Registry (no raw keys)" accent={MUTE}>
      {list.length === 0 ? <NoItems label="No license records yet." /> : list.map(k => (
        <div key={k.id} style={{ borderBottom: `1px solid ${LINE}`, padding: '8px 0', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: TEXT, fontSize: 13 }}>{k.license_type}</div>
            <div style={{ color: MUTE, fontSize: 11 }}>seats: {k.seat_limit} · venues: {k.venue_limit} · validation: {k.validation_status}</div>
          </div>
          <div>
            <Badge label={k.license_status || 'draft'} color={k.license_status === 'active' ? GREEN : MUTE} />
            <div style={{ color: MUTE, fontSize: 10, marginTop: 2 }}>{k.safe_claim}</div>
          </div>
        </div>
      ))}
      <div style={{ color: AMBER, fontSize: 11, marginTop: 8 }}>Raw license keys are never shown here.</div>
      {keys?.localPreview && <LocalPreviewNote />}
    </Panel>
  )
}

// Panel F — Module Activations (13: includes AMBI, Agent X 360, EgoMusic 360 — name-only, not yet built)
function ModuleActivationsPanel({ activations }) {
  const list = activations?.activations || []
  return (
    <Panel title="F — Module Activation Registry (13)" accent={GOLD}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
        {list.map((m, i) => (
          <div key={m.module_key || i} style={{ background: CHARCOAL, borderRadius: 6, padding: '10px 12px' }}>
            <div style={{ color: TEXT, fontWeight: 600, fontSize: 13 }}>{m.module_name}</div>
            <div style={{ color: MUTE, fontSize: 11, marginTop: 3 }}>{m.activation_mode} · {m.activation_status || 'pending'}</div>
            <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Badge label={`client: ${m.activated_for_client ? 'YES' : 'NO'}`} color={m.activated_for_client ? GREEN : RED} />
              <Badge label={`pilot: ${m.activated_for_pilot ? 'YES' : 'NO'}`} color={m.activated_for_pilot ? GREEN : AMBER} />
              <Badge label={`prod: ${m.activated_for_production ? 'YES' : 'NO'}`} color={m.activated_for_production ? GREEN : RED} />
            </div>
            <div style={{ color: MUTE, fontSize: 10, marginTop: 4 }}>remote: {m.remote_activation_allowed ? 'ALLOWED' : 'BLOCKED'}</div>
          </div>
        ))}
      </div>
      {list.length === 0 && <NoItems label="No module activations loaded." />}
      {activations?.localPreview && <LocalPreviewNote />}
    </Panel>
  )
}

// Panel G — Deployment Versions
function VersionsPanel({ versions }) {
  const list = versions?.versions || []
  return (
    <Panel title="G — Deployment Versions" accent={MUTE}>
      {list.length === 0 ? <NoItems label="No deployment versions yet." /> : list.map(v => (
        <div key={v.id} style={{ borderBottom: `1px solid ${LINE}`, padding: '7px 0' }}>
          <div style={{ color: TEXT, fontSize: 13 }}>{v.version_label}</div>
          <div style={{ color: MUTE, fontSize: 11 }}>{v.changelog_summary || 'No changelog'}</div>
          <Badge label={v.version_status || 'draft'} color={MUTE} />
          <Badge label={`prod: ${v.production_ready ? 'YES' : 'NO'}`} color={v.production_ready ? GREEN : RED} />
        </div>
      ))}
    </Panel>
  )
}

// Panel H — Rollback Records
function RollbackPanel({ records }) {
  const list = records?.records || []
  return (
    <Panel title="H — Rollback Records — EXECUTION DISABLED" accent={RED}>
      <div style={{ background: RED + '18', border: `1px solid ${RED}44`, borderRadius: 6, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: TEXT }}>
        <strong style={{ color: RED }}>ROLLBACK EXECUTION IS DISABLED</strong> — rollback_execution_enabled=false by default in Phase E.6. Rollback planning is visible but no execution is permitted.
      </div>
      {list.length === 0 ? <NoItems label="No rollback records yet." /> : list.map((r, i) => (
        <div key={r.id || i} style={{ borderBottom: `1px solid ${LINE}`, padding: '7px 0' }}>
          <div style={{ color: TEXT, fontSize: 13 }}>Target: {r.rollback_target_version || 'not set'}</div>
          <div style={{ color: MUTE, fontSize: 11 }}>status: {r.rollback_status} · execution enabled: {r.rollback_execution_enabled ? 'YES' : 'NO'}</div>
          {r.blocker_reason && <div style={{ color: RED, fontSize: 11 }}>Blocker: {r.blocker_reason}</div>}
        </div>
      ))}
      {records?.localPreview && <LocalPreviewNote />}
    </Panel>
  )
}

// Panel I — Blockers
function BlockersPanel({ blockers }) {
  const list = blockers?.blockers || []
  return (
    <Panel title="I — Blockers Preventing Live Remote Distribution" accent={RED}>
      {list.map((b, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', padding: '5px 0', borderBottom: `1px solid ${LINE}22` }}>
          <span style={{ color: RED, marginRight: 8, marginTop: 1 }}>✕</span>
          <div>
            <div style={{ color: TEXT, fontSize: 13 }}>{b.label}</div>
            <div style={{ color: MUTE, fontSize: 11 }}>[{b.type}] {b.key}{b.phase ? ` · Phase ${b.phase}` : ''}</div>
          </div>
        </div>
      ))}
      {list.length === 0 && <div style={{ color: GREEN, fontSize: 13 }}>No blockers detected.</div>}
    </Panel>
  )
}

// Panel J — Safe Claims
function SafeClaimsPanel({ claims }) {
  const safe = claims?.safeClaims || []
  const unsafe = claims?.unsafeClaims || []
  return (
    <Panel title="J — Safe Claims Panel" accent={GREEN}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ color: GREEN, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>CAN CLAIM</div>
        {safe.map((c, i) => <div key={i} style={{ color: TEXT, fontSize: 13, marginBottom: 4 }}>✓ {c}</div>)}
      </div>
      <div>
        <div style={{ color: RED, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>CANNOT CLAIM UNLESS PROVEN</div>
        {unsafe.map((c, i) => <div key={i} style={{ color: MUTE, fontSize: 12, marginBottom: 3 }}>✕ {c}</div>)}
      </div>
    </Panel>
  )
}

// Panel K — Audit Log
function AuditLogPanel({ logs }) {
  const list = logs?.logs || []
  return (
    <Panel title="K — Remote Distribution Audit Log" accent={MUTE}>
      {list.length === 0 ? <NoItems label="No audit events yet." /> : list.map(l => (
        <div key={l.id} style={{ borderBottom: `1px solid ${LINE}22`, padding: '5px 0', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: TEXT, fontSize: 12 }}>{l.event_type} · {l.summary}</div>
            <div style={{ color: MUTE, fontSize: 11 }}>{l.actor_id} · {l.severity}</div>
          </div>
          <div style={{ color: MUTE, fontSize: 11 }}>{l.created_at ? new Date(l.created_at).toLocaleTimeString() : ''}</div>
        </div>
      ))}
    </Panel>
  )
}

// Panel L — Feature Flags
function FeatureFlagsPanel({ flags }) {
  const f = flags?.flags || {}
  return (
    <Panel title="L — Feature Flag Snapshot" accent={MUTE}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 6 }}>
        {Object.entries(f).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: CHARCOAL, borderRadius: 4, padding: '5px 10px' }}>
            <span style={{ color: MUTE, fontSize: 11 }}>{k}</span>
            <Badge label={String(v)} color={v === true ? GREEN : v === false ? RED : AMBER} />
          </div>
        ))}
      </div>
    </Panel>
  )
}

export default function RemoteModuleDistribution() {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiFetch('/summary'),
      apiFetch('/readiness-score'),
      apiFetch('/blockers'),
      apiFetch('/packages'),
      apiFetch('/provisioning-requests'),
      apiFetch('/invite-sessions'),
      apiFetch('/license-keys'),
      apiFetch('/module-activations'),
      apiFetch('/deployment-versions'),
      apiFetch('/rollback-records'),
      apiFetch('/safe-claims'),
      apiFetch('/audit-log'),
      apiFetch('/feature-flags'),
    ]).then(([summary, score, blockers, packages, requests, sessions, keys, activations, versions, rollbackRecords, claims, logs, featureFlags]) => {
      setData({ summary, score, blockers, packages, requests, sessions, keys, activations, versions, rollbackRecords, claims, logs, featureFlags })
      setLoading(false)
    })
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: NAVY, color: TEXT, fontFamily: "'Inter', sans-serif", padding: '0 0 60px' }}>
      <div style={{ background: CHARCOAL, borderBottom: `1px solid ${LINE}`, padding: '28px 32px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div style={{ color: GOLD, fontSize: 22, fontWeight: 800, letterSpacing: 1 }}>NOVEE OS</div>
          <div style={{ color: LINE, fontSize: 20 }}>|</div>
          <div style={{ color: TEXT, fontSize: 18, fontWeight: 600 }}>Remote Module Distribution</div>
          <Badge label="E.6" color={GOLD} />
          <Badge label="BUILD ONLY" color={RED} />
        </div>
        <div style={{ background: RED + '18', border: `1px solid ${RED}44`, borderRadius: 6, padding: '10px 16px', fontSize: 12, color: TEXT, lineHeight: 1.7 }}>
          <strong style={{ color: RED }}>REMOTE MODULE DISTRIBUTION — BUILD ONLY</strong> · Live delivery DISABLED · Client provisioning DISABLED · Invite links DISABLED · License validation DISABLED · Remote activation DISABLED · Rollback execution DISABLED · All live flags default FALSE · E.3 Security + E.4 Deployment + E.5 Pilot required before any live distribution · No raw tokens or license keys exposed
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, color: MUTE, fontSize: 14 }}>Loading remote distribution data…</div>
      ) : (
        <div style={{ padding: '24px 32px' }}>
          <SummaryPanel summary={data.summary} score={data.score} blockers={data.blockers} />
          <PackagesPanel packages={data.packages} />
          <ProvisioningPanel requests={data.requests} />
          <InviteSessionsPanel sessions={data.sessions} />
          <LicenseKeysPanel keys={data.keys} />
          <ModuleActivationsPanel activations={data.activations} />
          <VersionsPanel versions={data.versions} />
          <RollbackPanel records={data.rollbackRecords} />
          <BlockersPanel blockers={data.blockers} />
          <SafeClaimsPanel claims={data.claims} />
          <AuditLogPanel logs={data.logs} />
          <FeatureFlagsPanel flags={data.featureFlags} />
        </div>
      )}
    </div>
  )
}
