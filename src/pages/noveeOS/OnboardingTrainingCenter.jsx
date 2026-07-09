import { useState, useEffect } from 'react'

const API = '/api/novee-os/onboarding-training'

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
const AMBER = '#e67e22'

const styles = {
  page: { background: NAVY, minHeight: '100vh', color: TEXT, fontFamily: 'monospace', padding: '24px' },
  header: { borderBottom: `1px solid ${LINE}`, paddingBottom: '16px', marginBottom: '24px' },
  title: { fontSize: '22px', fontWeight: 700, color: GOLD2, margin: 0 },
  subtitle: { fontSize: '13px', color: MUTE, marginTop: '4px' },
  banner: { background: '#1a0a00', border: `1px solid ${AMBER}`, borderRadius: '6px', padding: '12px 16px', marginBottom: '24px', fontSize: '13px', color: AMBER },
  section: { background: CARD, border: `1px solid ${LINE}`, borderRadius: '8px', padding: '20px', marginBottom: '20px' },
  sectionTitle: { fontSize: '15px', fontWeight: 700, color: GOLD, marginBottom: '14px', borderBottom: `1px solid ${LINE}`, paddingBottom: '8px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' },
  card: { background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: '6px', padding: '14px' },
  cardTitle: { fontSize: '13px', fontWeight: 700, color: TEXT, marginBottom: '8px' },
  row: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' },
  label: { color: MUTE },
  val: { color: TEXT },
  badge: (c) => ({ background: c + '22', color: c, border: `1px solid ${c}44`, borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }),
  safeClaim: { background: '#0a1a0a', border: `1px solid ${GREEN}44`, borderRadius: '4px', padding: '6px 10px', fontSize: '12px', color: GREEN, marginBottom: '4px' },
  unsafeClaim: { background: '#1a0a0a', border: `1px solid ${RED}44`, borderRadius: '4px', padding: '6px 10px', fontSize: '12px', color: RED, marginBottom: '4px' },
  flag: (on) => ({ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '6px 0', borderBottom: `1px solid ${LINE}`, color: on ? GREEN : AMBER }),
  blocker: { background: '#1a0800', border: `1px solid ${RED}44`, borderRadius: '4px', padding: '8px 12px', fontSize: '12px', color: '#e88', marginBottom: '6px' },
  audit: { background: CHARCOAL, borderRadius: '4px', padding: '8px 12px', fontSize: '12px', color: MUTE, marginBottom: '6px', borderLeft: `3px solid ${LINE}` },
  loading: { color: MUTE, fontSize: '13px', padding: '20px 0' },
  scoreBox: { textAlign: 'center', padding: '20px', background: CHARCOAL, borderRadius: '8px', border: `1px solid ${LINE}` },
  scorePct: { fontSize: '48px', fontWeight: 700, color: GOLD2 },
}

function StatusBadge({ status }) {
  const color = {
    draft: MUTE, published: GREEN, not_started: MUTE, in_progress: AMBER,
    completed: GREEN, blocked: RED, needs_review: AMBER, evidence_required: AMBER,
    preview_only: AMBER, pending: AMBER, verified: GREEN, accepted: GREEN, declined: RED,
  }[status?.toLowerCase()] || MUTE
  return <span style={styles.badge(color)}>{status || 'unknown'}</span>
}

function BoolCell({ val, trueLabel = 'Yes', falseLabel = 'No' }) {
  return <span style={{ color: val ? GREEN : RED }}>{val ? trueLabel : falseLabel}</span>
}

function Row({ label, children }) {
  return (
    <div style={styles.row}>
      <span style={styles.label}>{label}</span>
      <span style={styles.val}>{children}</span>
    </div>
  )
}

// Panel A — Summary
function SummaryPanel({ data }) {
  if (!data) return <div style={styles.loading}>Loading summary...</div>
  const s = data.data || {}
  return (
    <div style={styles.grid}>
      <div style={styles.scoreBox}>
        <div style={styles.scorePct}>{s.readiness_score ?? 0}%</div>
        <div style={{ color: MUTE, fontSize: '13px', marginTop: '4px' }}>Readiness Score</div>
      </div>
      <div style={styles.card}>
        <div style={styles.cardTitle}>Onboarding Status</div>
        <Row label="Training Ready"><BoolCell val={s.training_ready} /></Row>
        <Row label="Onboarding Ready"><BoolCell val={s.onboarding_ready} /></Row>
        <Row label="Published"><BoolCell val={false} falseLabel="No (disabled by default)" /></Row>
        <Row label="Remote Dist. Gate"><BoolCell val={s.remote_distribution_gate?.passed} falseLabel="Blocked" /></Row>
        <Row label="Blockers"><span style={{ color: s.blockers_count > 0 ? RED : GREEN }}>{s.blockers_count ?? 0}</span></Row>
        <Row label="Safe Claim"><span style={{ color: GOLD, fontSize: '11px' }}>{s.safe_claim}</span></Row>
      </div>
      <div style={styles.card}>
        <div style={styles.cardTitle}>Counts</div>
        <Row label="Programs">{s.program_count ?? 0}</Row>
        <Row label="Manuals">{s.manual_count ?? 0}</Row>
        <Row label="Lessons">{s.lesson_count ?? 0}</Row>
        <Row label="Checklist Items">{s.checklist_count ?? 0}</Row>
        <Row label="Safety Status"><span style={{ color: AMBER, fontSize: '11px' }}>{s.safety_status}</span></Row>
      </div>
    </div>
  )
}

// Panel B — Programs
function ProgramsPanel({ data }) {
  const items = data?.data?.programs || data?.data || []
  if (!items.length) return <div style={styles.loading}>Loading programs...</div>
  return (
    <div style={styles.grid}>
      {items.map((p, i) => (
        <div key={p.id || i} style={styles.card}>
          <div style={styles.cardTitle}>{p.program_name}</div>
          <Row label="Type">{p.program_type}</Row>
          <Row label="Audience">{p.audience_role}</Row>
          <Row label="Status"><StatusBadge status={p.status} /></Row>
          <Row label="Published"><BoolCell val={p.published} falseLabel="No" /></Row>
          <Row label="Req. Pilot"><BoolCell val={p.required_for_pilot} /></Row>
          <Row label="Req. Remote Dist."><BoolCell val={p.required_for_remote_distribution} /></Row>
          <Row label="Req. Go-Live"><BoolCell val={p.required_for_go_live} /></Row>
          <Row label="Safe Claim"><span style={{ color: GOLD, fontSize: '10px' }}>{p.safe_claim}</span></Row>
        </div>
      ))}
    </div>
  )
}

// Panel C — Manuals
// Required manuals: NOVEE OS Platform Owner Manual, Admin Guide, Venue Owner Onboarding Guide, Manager Training Guide, Staff Training Guide, Guest/User Guide, Remote Module Distribution Guide, Tenant/Venue Provisioning Guide, Licensing + Entitlements Guide, Pilot Readiness Guide, Deployment Readiness Guide, Troubleshooting Guide, CraftHub 360 Setup Guide, SmokeCraft 360 Venue Guide, SmokeCraft 360 Staff Guide, POS360 Staff Guide, E.A.T. 360 Manager Guide, Passport 360 Guide, Safe Sales Claims Guide
function ManualsPanel({ data }) {
  const items = data?.data?.manuals || data?.data || []
  if (!items.length) return <div style={styles.loading}>Loading manuals...</div>
  return (
    <div style={styles.grid}>
      {items.map((m, i) => (
        <div key={m.id || i} style={styles.card}>
          <div style={styles.cardTitle}>{m.manual_title}</div>
          <Row label="Type">{m.manual_type}</Row>
          <Row label="Audience">{m.audience_role}</Row>
          <Row label="Version">{m.version_label}</Row>
          <Row label="Status"><StatusBadge status={m.status} /></Row>
          <Row label="Published"><BoolCell val={m.published} falseLabel="No (disabled)" /></Row>
          <Row label="Full Content Req."><BoolCell val={m.full_content_required} /></Row>
          <Row label="Safe Claim"><span style={{ color: GOLD, fontSize: '10px' }}>{m.safe_claim}</span></Row>
        </div>
      ))}
    </div>
  )
}

// Panel D — Lessons
function LessonsPanel({ data }) {
  const items = data?.data?.lessons || data?.data || []
  if (!items.length) return <div style={styles.loading}>Loading lessons...</div>
  const grouped = items.reduce((acc, l) => {
    const cat = l.lesson_category || 'general'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(l)
    return acc
  }, {})
  return (
    <div>
      {Object.entries(grouped).map(([cat, lessons]) => (
        <div key={cat} style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: GOLD, fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cat.replace(/_/g, ' ')}</div>
          <div style={styles.grid}>
            {lessons.map((l, i) => (
              <div key={l.id || i} style={styles.card}>
                <div style={styles.cardTitle}>{l.lesson_title}</div>
                <Row label="Audience">{l.audience_role}</Row>
                <Row label="Sort">{l.sort_order}</Row>
                <Row label="Est. Minutes">{l.estimated_minutes}</Row>
                <Row label="Required"><BoolCell val={l.required} /></Row>
                <Row label="Status"><StatusBadge status={l.status} /></Row>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Panel E — Checklist
function ChecklistPanel({ data }) {
  const items = data?.data?.checklist || data?.data || []
  if (!items.length) return <div style={styles.loading}>Loading checklist...</div>
  return (
    <div>
      {items.map((c, i) => (
        <div key={c.id || i} style={{ ...styles.card, marginBottom: '10px' }}>
          <div style={styles.cardTitle}>{c.checklist_title}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', fontSize: '12px' }}>
            <div><span style={styles.label}>Category: </span>{c.checklist_category}</div>
            <div><span style={styles.label}>Owner: </span>{c.owner_role}</div>
            <div><span style={styles.label}>Required: </span><BoolCell val={c.required} /></div>
            <div><span style={styles.label}>Status: </span><StatusBadge status={c.status} /></div>
            <div><span style={styles.label}>Evidence Req: </span><BoolCell val={c.evidence_required} /></div>
            <div><span style={styles.label}>Evidence Present: </span><BoolCell val={c.evidence_present} /></div>
          </div>
          {c.blocker_reason && <div style={{ color: RED, fontSize: '11px', marginTop: '6px' }}>Blocker: {c.blocker_reason}</div>}
        </div>
      ))}
    </div>
  )
}

// Panel F — Progress
function ProgressPanel({ data }) {
  const items = data?.data?.progress || data?.data || []
  if (!items.length) return <div style={styles.loading}>Loading progress...</div>
  return (
    <div style={styles.grid}>
      {items.map((p, i) => (
        <div key={p.id || i} style={styles.card}>
          <div style={styles.cardTitle}>Progress Record</div>
          <Row label="Trainee Role">{p.trainee_role}</Row>
          <Row label="Progress"><StatusBadge status={p.progress_status} /></Row>
          <Row label="Completion"><StatusBadge status={p.completion_status} /></Row>
          <Row label="Evidence Req."><BoolCell val={p.evidence_required} /></Row>
          <Row label="Evidence Present"><BoolCell val={p.evidence_present} /></Row>
          <Row label="Safe Claim"><span style={{ color: GOLD, fontSize: '10px' }}>{p.safe_claim}</span></Row>
          <div style={{ fontSize: '10px', color: MUTE, marginTop: '6px' }}>Personal details are not displayed here.</div>
        </div>
      ))}
    </div>
  )
}

// Panel G — Evidence
function EvidencePanel({ data }) {
  const items = data?.data?.evidence || data?.data || []
  if (!items.length) return <div style={styles.loading}>Loading evidence...</div>
  return (
    <div style={styles.grid}>
      {items.map((e, i) => (
        <div key={e.id || i} style={styles.card}>
          <div style={styles.cardTitle}>{e.evidence_title}</div>
          <Row label="Type">{e.evidence_type}</Row>
          <Row label="Status"><StatusBadge status={e.evidence_status} /></Row>
          <Row label="Verified By">{e.verified_by || '—'}</Row>
          {e.notes && <div style={{ fontSize: '11px', color: MUTE, marginTop: '6px' }}>{e.notes}</div>}
        </div>
      ))}
    </div>
  )
}

// Panel H — Acceptance
function AcceptancePanel({ data }) {
  const items = data?.data?.acceptance || data?.data || []
  if (!items.length) return <div style={styles.loading}>Loading acceptance records...</div>
  return (
    <div style={styles.grid}>
      {items.map((a, i) => (
        <div key={a.id || i} style={styles.card}>
          <div style={styles.cardTitle}>{a.acceptance_type?.replace(/_/g, ' ')}</div>
          <Row label="Accepted By Role">{a.accepted_by_role}</Row>
          <Row label="Status"><StatusBadge status={a.acceptance_status} /></Row>
          <Row label="Safe Claim"><span style={{ color: GOLD, fontSize: '10px' }}>{a.safe_claim || 'onboarding_acceptance_record_exists'}</span></Row>
          <div style={{ fontSize: '10px', color: MUTE, marginTop: '6px' }}>Accepted-by identity is reference-only and not displayed.</div>
        </div>
      ))}
    </div>
  )
}

// Panel I — Blockers
function BlockersPanel({ data }) {
  const blockers = data?.data?.blockers || data?.data || []
  if (!blockers.length) return <div style={{ color: GREEN, fontSize: '13px', padding: '8px 0' }}>No active blockers found.</div>
  return (
    <div>
      {blockers.map((b, i) => (
        <div key={i} style={styles.blocker}>
          <strong>{b.category || 'Blocker'}: </strong>{b.message || b}
        </div>
      ))}
    </div>
  )
}

// Panel J — Safe Claims
function SafeClaimsPanel({ data }) {
  const d = data?.data || {}
  const canClaim = d.can_claim || []
  const cannotClaim = d.cannot_claim || []
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: GREEN, marginBottom: '10px' }}>CAN CLAIM</div>
        {canClaim.map((c, i) => <div key={i} style={styles.safeClaim}>{c}</div>)}
      </div>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: RED, marginBottom: '10px' }}>CANNOT CLAIM (unless proven)</div>
        {cannotClaim.map((c, i) => <div key={i} style={styles.unsafeClaim}>{c}</div>)}
      </div>
    </div>
  )
}

// Panel K — Audit Log
function AuditLogPanel({ data }) {
  const events = data?.data?.events || data?.data || []
  if (!events.length) return <div style={styles.loading}>No audit events found.</div>
  return (
    <div>
      {events.map((e, i) => (
        <div key={e.id || i} style={styles.audit}>
          <span style={{ color: TEXT }}>{e.event_type}</span>
          {' — '}
          <span style={{ color: MUTE }}>{e.summary}</span>
          {' '}
          <span style={{ color: LINE, fontSize: '10px' }}>{e.created_at ? new Date(e.created_at).toLocaleString() : ''}</span>
        </div>
      ))}
    </div>
  )
}

// Panel L — Feature Flags
function FeatureFlagsPanel({ data }) {
  const flags = data?.data?.flags || {}
  if (!Object.keys(flags).length) return <div style={styles.loading}>Loading flags...</div>
  return (
    <div>
      {Object.entries(flags).map(([k, v]) => (
        <div key={k} style={styles.flag(v)}>
          <span>{k}</span>
          <span style={{ fontWeight: 700 }}>{v ? 'ENABLED' : 'DISABLED'}</span>
        </div>
      ))}
    </div>
  )
}

export default function OnboardingTrainingCenter() {
  const [summary, setSummary] = useState(null)
  const [programs, setPrograms] = useState(null)
  const [manuals, setManuals] = useState(null)
  const [lessons, setLessons] = useState(null)
  const [checklist, setChecklist] = useState(null)
  const [progress, setProgress] = useState(null)
  const [evidence, setEvidence] = useState(null)
  const [acceptance, setAcceptance] = useState(null)
  const [blockers, setBlockers] = useState(null)
  const [safeClaims, setSafeClaims] = useState(null)
  const [auditLog, setAuditLog] = useState(null)
  const [flags, setFlags] = useState(null)

  useEffect(() => {
    const get = (path, set) => fetch(`${API}${path}`).then(r => r.json()).then(set).catch(() => {})
    get('/summary', setSummary)
    get('/programs', setPrograms)
    get('/manuals', setManuals)
    get('/lessons', setLessons)
    get('/checklist', setChecklist)
    get('/progress', setProgress)
    get('/evidence', setEvidence)
    get('/acceptance', setAcceptance)
    get('/blockers', setBlockers)
    get('/safe-claims', setSafeClaims)
    get('/audit-log', setAuditLog)
    get('/feature-flags', setFlags)
  }, [])

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>NOVEE OS — Onboarding + Training Center</h1>
        <div style={styles.subtitle}>Phase E.7 — Build Mode — Publication and completion disabled by default</div>
      </div>

      <div style={styles.banner}>
        ONBOARDING + TRAINING CENTER — BUILD MODE ONLY. Manual publication is disabled. Staff, manager, client, and guest completion are disabled. Remote distribution remains blocked until onboarding and training readiness is verified. No fake completion claims. No raw personal data displayed.
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>A — Onboarding + Training Summary</div>
        <SummaryPanel data={summary} />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>B — Onboarding Program Registry</div>
        <ProgramsPanel data={programs} />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>C — Training Manual Registry</div>
        <ManualsPanel data={manuals} />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>D — Training Lesson Registry</div>
        <LessonsPanel data={lessons} />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>E — Onboarding Checklist</div>
        <ChecklistPanel data={checklist} />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>F — Training Progress</div>
        <ProgressPanel data={progress} />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>G — Evidence Records</div>
        <EvidencePanel data={evidence} />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>H — Acceptance Records</div>
        <AcceptancePanel data={acceptance} />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>I — Blockers</div>
        <BlockersPanel data={blockers} />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>J — Safe Claims</div>
        <SafeClaimsPanel data={safeClaims} />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>K — Onboarding Audit Log</div>
        <AuditLogPanel data={auditLog} />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>L — Feature Flags</div>
        <FeatureFlagsPanel data={flags} />
      </div>
    </div>
  )
}
