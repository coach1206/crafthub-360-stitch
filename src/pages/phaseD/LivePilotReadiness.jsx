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

const API = '/api/phase-d/live-pilot-readiness'

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
  return <span style={{ background: color + '22', color, border: `1px solid ${color}44`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600, marginRight: 6 }}>{label}</span>
}

function StatusDot({ status }) {
  const c = status === 'passed' ? GREEN : status === 'failed' ? RED : status === 'in_progress' ? AMBER : MUTE
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: c, marginRight: 6 }} />
}

// Panel A — Summary
function SummaryPanel({ score, validate }) {
  const s = score?.score || {}
  return (
    <Panel title="A — Pilot Readiness Summary" accent={GOLD}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 14 }}>
        {[
          { label: 'Gates Passed', val: `${s.passedGates ?? '—'}/${s.totalGates ?? '—'}` },
          { label: 'Gate Pass Rate', val: s.gatePassRate != null ? `${s.gatePassRate}%` : '—' },
          { label: 'Modules Ready', val: `${s.readyModules ?? '—'}/${s.totalModules ?? '—'}` },
          { label: 'Pilot Approved', val: 'NO', color: RED },
          { label: 'Go-Live Approved', val: 'NO', color: RED },
          { label: 'Remote Dist.', val: 'DISABLED', color: RED },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: CHARCOAL, borderRadius: 6, padding: '10px 12px' }}>
            <div style={{ color: MUTE, fontSize: 11, marginBottom: 4 }}>{label}</div>
            <div style={{ color: color || TEXT, fontWeight: 700, fontSize: 15 }}>{val}</div>
          </div>
        ))}
      </div>
      <div style={{ color: MUTE, fontSize: 12 }}>Safety Status: <span style={{ color: AMBER }}>{validate?.safety_status || score?.safety_status || 'BUILD_ONLY_NO_LIVE_PILOT'}</span></div>
    </Panel>
  )
}

// Panel B — Venue Registry
function VenuePanel({ venues }) {
  const list = venues?.venues || []
  return (
    <Panel title="B — Pilot Venue Registry" accent={BLUE}>
      {list.length === 0 ? <div style={{ color: MUTE, fontSize: 13 }}>No pilot venues registered yet.</div> : list.map(v => (
        <div key={v.id} style={{ borderBottom: `1px solid ${LINE}`, padding: '8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: TEXT, fontWeight: 600, fontSize: 14 }}>{v.venue_name}</div>
            <div style={{ color: MUTE, fontSize: 12 }}>{v.venue_type} · {v.pilot_status}</div>
          </div>
          <Badge label={v.pilot_approved ? 'APPROVED' : 'PENDING'} color={v.pilot_approved ? GREEN : AMBER} />
        </div>
      ))}
      {venues?.localPreview && <div style={{ color: AMBER, fontSize: 12, marginTop: 8 }}>Local preview — database not connected</div>}
    </Panel>
  )
}

// Panel C — Readiness Gates
function GatesPanel({ gates }) {
  const list = gates?.gates || []
  const byCategory = list.reduce((acc, g) => { (acc[g.gate_category] = acc[g.gate_category] || []).push(g); return acc }, {})
  return (
    <Panel title="C — Readiness Gates (22)" accent={GOLD}>
      {Object.entries(byCategory).map(([cat, items]) => (
        <div key={cat} style={{ marginBottom: 12 }}>
          <div style={{ color: MUTE, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{cat}</div>
          {items.map(g => (
            <div key={g.gate_key} style={{ display: 'flex', alignItems: 'center', padding: '5px 0', borderBottom: `1px solid ${LINE}22` }}>
              <StatusDot status={g.gate_status} />
              <span style={{ color: TEXT, fontSize: 13, flex: 1 }}>{g.gate_label}</span>
              {g.blocking && <Badge label="BLOCKING" color={RED} />}
              <Badge label={g.gate_status || 'not_started'} color={g.gate_status === 'passed' ? GREEN : MUTE} />
            </div>
          ))}
        </div>
      ))}
      {list.length === 0 && <div style={{ color: MUTE, fontSize: 13 }}>No gates loaded.</div>}
    </Panel>
  )
}

// Panel D — Module Readiness
function ModulesPanel({ modules }) {
  const list = modules?.modules || []
  return (
    <Panel title="D — Module Readiness (13)" accent={GOLD2}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
        {list.map(m => (
          <div key={m.module_key} style={{ background: CHARCOAL, borderRadius: 6, padding: '10px 12px' }}>
            <div style={{ color: TEXT, fontWeight: 600, fontSize: 13 }}>{m.module_label}</div>
            <div style={{ color: MUTE, fontSize: 11, marginTop: 4 }}>{m.readiness_status || 'not_evaluated'}</div>
            <div style={{ marginTop: 6 }}>
              <Badge label={m.pilot_approved ? 'PILOT OK' : 'NOT APPROVED'} color={m.pilot_approved ? GREEN : AMBER} />
            </div>
          </div>
        ))}
      </div>
      {list.length === 0 && <div style={{ color: MUTE, fontSize: 13 }}>No modules loaded.</div>}
    </Panel>
  )
}

// Panel E — Checklist
function ChecklistPanel({ checklist }) {
  const list = checklist?.checklist || []
  return (
    <Panel title="E — Pilot Checklist" accent={BLUE}>
      {list.length === 0 ? <div style={{ color: MUTE, fontSize: 13 }}>No checklist items yet.</div> : list.map(c => (
        <div key={c.id} style={{ display: 'flex', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${LINE}22` }}>
          <span style={{ color: c.completed ? GREEN : MUTE, fontSize: 16, marginRight: 10 }}>{c.completed ? '✓' : '○'}</span>
          <span style={{ color: TEXT, fontSize: 13, flex: 1 }}>{c.checklist_label}</span>
          <Badge label={c.status} color={c.completed ? GREEN : AMBER} />
        </div>
      ))}
    </Panel>
  )
}

// Panel F — Evidence
function EvidencePanel({ evidence }) {
  const list = evidence?.evidence || []
  return (
    <Panel title="F — Pilot Evidence Registry" accent={MUTE}>
      {list.length === 0 ? <div style={{ color: MUTE, fontSize: 13 }}>No evidence submitted yet.</div> : list.map(e => (
        <div key={e.id} style={{ borderBottom: `1px solid ${LINE}`, padding: '7px 0' }}>
          <div style={{ color: TEXT, fontSize: 13, fontWeight: 600 }}>{e.evidence_label}</div>
          <div style={{ color: MUTE, fontSize: 12 }}>{e.evidence_type} · verified: {e.verified ? 'YES' : 'NO'}</div>
        </div>
      ))}
    </Panel>
  )
}

// Panel G — Blockers
function BlockersPanel({ blockers }) {
  const list = blockers?.blockers || []
  return (
    <Panel title="G — Active Blockers" accent={RED}>
      {list.length === 0
        ? <div style={{ color: GREEN, fontSize: 13 }}>No active blockers detected.</div>
        : list.map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${LINE}22` }}>
            <span style={{ color: RED, marginRight: 8 }}>✕</span>
            <span style={{ color: TEXT, fontSize: 13, flex: 1 }}>[{b.type}] {b.label}</span>
            <Badge label={b.status || `${b.issues} issues`} color={RED} />
          </div>
        ))
      }
    </Panel>
  )
}

// Panel H — Acceptance Registry
function AcceptancePanel({ acceptance }) {
  const list = acceptance?.acceptances || []
  return (
    <Panel title="H — Acceptance Registry" accent={GOLD}>
      {list.length === 0 ? <div style={{ color: MUTE, fontSize: 13 }}>No acceptance records yet.</div> : list.map(a => (
        <div key={a.id} style={{ borderBottom: `1px solid ${LINE}`, padding: '7px 0', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: TEXT, fontSize: 13 }}>{a.acceptance_type}</div>
            <div style={{ color: MUTE, fontSize: 12 }}>{a.acceptance_status}</div>
          </div>
          <Badge label={a.acceptance_approved ? 'APPROVED' : 'PENDING'} color={a.acceptance_approved ? GREEN : AMBER} />
        </div>
      ))}
    </Panel>
  )
}

// Panel I — Safe Claims
function SafeClaimsPanel({ claims }) {
  const safe = claims?.safeClaims || []
  const unsafe = claims?.unsafe || []
  return (
    <Panel title="I — Safe / Unsafe Claims" accent={GREEN}>
      <div style={{ marginBottom: 10 }}>
        <div style={{ color: GREEN, fontWeight: 600, fontSize: 12, marginBottom: 6 }}>SAFE TO SAY</div>
        {safe.map((c, i) => <div key={i} style={{ color: TEXT, fontSize: 13, marginBottom: 4 }}>✓ {c}</div>)}
      </div>
      <div>
        <div style={{ color: RED, fontWeight: 600, fontSize: 12, marginBottom: 6 }}>DO NOT SAY</div>
        {unsafe.map((c, i) => <div key={i} style={{ color: MUTE, fontSize: 12, marginBottom: 3 }}>✕ {c}</div>)}
      </div>
    </Panel>
  )
}

// Panel J — Feature Flags
function FeatureFlagsPanel({ flags }) {
  const f = flags?.flags || {}
  return (
    <Panel title="J — Feature Flag Snapshot" accent={MUTE}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
        {Object.entries(f).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: CHARCOAL, borderRadius: 4, padding: '6px 10px' }}>
            <span style={{ color: MUTE, fontSize: 12 }}>{k}</span>
            <Badge label={String(v)} color={v === true ? GREEN : v === false ? RED : AMBER} />
          </div>
        ))}
      </div>
    </Panel>
  )
}

export default function LivePilotReadiness() {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiFetch('/score'),
      apiFetch('/venues'),
      apiFetch('/gates'),
      apiFetch('/modules'),
      apiFetch('/checklist'),
      apiFetch('/evidence'),
      apiFetch('/blockers'),
      apiFetch('/acceptance'),
      apiFetch('/safe-claims'),
      apiFetch('/feature-flags'),
      apiFetch('/validate'),
    ]).then(([score, venues, gates, modules, checklist, evidence, blockers, acceptance, claims, featureFlags, validate]) => {
      setData({ score, venues, gates, modules, checklist, evidence, blockers, acceptance, claims, featureFlags, validate })
      setLoading(false)
    })
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: NAVY, color: TEXT, fontFamily: "'Inter', sans-serif", padding: '0 0 60px' }}>
      {/* Header */}
      <div style={{ background: CHARCOAL, borderBottom: `1px solid ${LINE}`, padding: '28px 32px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div style={{ color: GOLD, fontSize: 22, fontWeight: 800, letterSpacing: 1 }}>NOVEE OS</div>
          <div style={{ color: LINE, fontSize: 20 }}>|</div>
          <div style={{ color: TEXT, fontSize: 18, fontWeight: 600 }}>Live Pilot Readiness Center</div>
          <Badge label="D.8" color={GOLD} />
          <Badge label="BUILD ONLY" color={RED} />
        </div>
        <div style={{ background: RED + '18', border: `1px solid ${RED}44`, borderRadius: 6, padding: '10px 16px', fontSize: 12, color: TEXT, lineHeight: 1.6 }}>
          <strong style={{ color: RED }}>LIVE PILOT READINESS — BUILD ONLY</strong> · No live pilot approved · No go-live approved · Remote distribution DISABLED · No fake pilot approval · Phase E.3 Security + E.4 Deployment required before approval · License keys &amp; provisioning belong to Phase E.6
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, color: MUTE, fontSize: 14 }}>Loading pilot readiness data…</div>
      ) : (
        <div style={{ padding: '24px 32px' }}>
          <SummaryPanel score={data.score} validate={data.validate} />
          <VenuePanel venues={data.venues} />
          <GatesPanel gates={data.gates} />
          <ModulesPanel modules={data.modules} />
          <ChecklistPanel checklist={data.checklist} />
          <EvidencePanel evidence={data.evidence} />
          <BlockersPanel blockers={data.blockers} />
          <AcceptancePanel acceptance={data.acceptance} />
          <SafeClaimsPanel claims={data.claims} />
          <FeatureFlagsPanel flags={data.featureFlags} />
        </div>
      )}
    </div>
  )
}
