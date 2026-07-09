import { useState, useEffect } from 'react'

const API = '/api/novee-os/ambi-foundation'

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
const BLUE = '#2980b9'

const styles = {
  page: { background: NAVY, minHeight: '100vh', color: TEXT, fontFamily: 'monospace', padding: '24px' },
  header: { borderBottom: `1px solid ${LINE}`, paddingBottom: '16px', marginBottom: '24px' },
  title: { fontSize: '22px', fontWeight: 700, color: GOLD2, margin: 0 },
  subtitle: { fontSize: '13px', color: MUTE, marginTop: '4px' },
  banner: { background: '#1a0a00', border: `1px solid ${AMBER}`, borderRadius: '6px', padding: '12px 16px', marginBottom: '24px', fontSize: '13px', color: AMBER },
  section: { background: CARD, border: `1px solid ${LINE}`, borderRadius: '8px', padding: '20px', marginBottom: '20px' },
  sectionTitle: { fontSize: '15px', fontWeight: 700, color: GOLD, marginBottom: '14px', borderBottom: `1px solid ${LINE}`, paddingBottom: '8px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' },
  card: { background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: '6px', padding: '14px' },
  cardTitle: { fontSize: '13px', fontWeight: 700, color: TEXT, marginBottom: '8px' },
  row: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' },
  label: { color: MUTE },
  val: { color: TEXT },
  badge: (c) => ({ background: c + '22', color: c, border: `1px solid ${c}44`, borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }),
  safeClaim: { background: '#0a1a0a', border: `1px solid ${GREEN}44`, borderRadius: '4px', padding: '6px 10px', fontSize: '12px', color: GREEN, marginBottom: '4px' },
  unsafeClaim: { background: '#1a0a0a', border: `1px solid ${RED}44`, borderRadius: '4px', padding: '6px 10px', fontSize: '12px', color: RED, marginBottom: '4px' },
  blocker: { background: '#1a0800', border: `1px solid ${RED}44`, borderRadius: '4px', padding: '8px 12px', fontSize: '12px', color: '#e88', marginBottom: '6px' },
  flag: (on) => ({ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '6px 0', borderBottom: `1px solid ${LINE}`, color: on ? GREEN : AMBER }),
  audit: { background: CHARCOAL, borderRadius: '4px', padding: '8px 12px', fontSize: '12px', color: MUTE, marginBottom: '6px', borderLeft: `3px solid ${LINE}` },
  loading: { color: MUTE, fontSize: '13px', padding: '20px 0' },
  scoreBox: { textAlign: 'center', padding: '20px', background: CHARCOAL, borderRadius: '8px', border: `1px solid ${LINE}` },
  scorePct: { fontSize: '48px', fontWeight: 700, color: GOLD2 },
}

function StatusBadge({ status }) {
  const color = {
    draft: MUTE, preview: AMBER, in_review: AMBER, approved: BLUE, active: GREEN,
    blocked: RED, not_started: MUTE, pending: AMBER, failed: RED, expired: RED,
    paired: GREEN, tested: BLUE, deployed: GREEN, verified: GREEN, configured: BLUE,
    simulated: AMBER, not_connected: RED, live: GREEN,
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
        <div style={{ color: MUTE, fontSize: '13px', marginTop: '4px' }}>AMBI Readiness Score</div>
        <div style={{ color: AMBER, fontSize: '11px', marginTop: '6px' }}>Software Foundation Only</div>
      </div>
      <div style={styles.card}>
        <div style={styles.cardTitle}>Foundation Status</div>
        <Row label="Foundation Ready"><BoolCell val={s.foundation_ready} falseLabel="No (build only)" /></Row>
        <Row label="Hardware Ready"><BoolCell val={s.hardware_ready} falseLabel="No" /></Row>
        <Row label="Live Telemetry"><BoolCell val={s.live_telemetry_enabled} falseLabel="Disabled" /></Row>
        <Row label="Live Device Control"><BoolCell val={s.live_device_control_enabled} falseLabel="Disabled" /></Row>
        <Row label="Live Pairing"><BoolCell val={s.live_pairing_enabled} falseLabel="Disabled" /></Row>
        <Row label="Live Automation"><BoolCell val={s.live_automation_enabled} falseLabel="Disabled" /></Row>
        <Row label="Blockers"><span style={{ color: RED }}>{s.blockers_count ?? 0}</span></Row>
        <Row label="Safe Claim"><span style={{ color: GOLD, fontSize: '11px' }}>{s.safe_claim}</span></Row>
      </div>
      <div style={styles.card}>
        <div style={styles.cardTitle}>Counts</div>
        <Row label="Devices">{s.device_count ?? 0}</Row>
        <Row label="Aura States">{s.aura_state_count ?? 0}</Row>
        <Row label="Environment Signals">{s.signal_count ?? 0}</Row>
        <Row label="Providers">{s.provider_count ?? 0}</Row>
        <Row label="Safety Status"><span style={{ color: AMBER, fontSize: '11px' }}>{s.safety_status}</span></Row>
      </div>
    </div>
  )
}

// Panel B — Device Registry
function DevicesPanel({ data }) {
  const items = data?.data?.devices || data?.data || []
  if (!items.length) return <div style={styles.loading}>Loading devices...</div>
  return (
    <div style={styles.grid}>
      {items.map((d, i) => (
        <div key={d.id || i} style={styles.card}>
          <div style={styles.cardTitle}>{d.device_name}</div>
          <Row label="Type">{d.device_type}</Row>
          <Row label="Status"><StatusBadge status={d.device_status} /></Row>
          <Row label="Hardware Ready"><BoolCell val={d.hardware_ready} falseLabel="No" /></Row>
          <Row label="Software Ready"><BoolCell val={d.software_ready} falseLabel="No" /></Row>
          <Row label="Connected"><BoolCell val={d.connected} falseLabel="No" /></Row>
          <Row label="Live Telemetry"><BoolCell val={d.live_telemetry_enabled} falseLabel="Disabled" /></Row>
          <Row label="Live Control"><BoolCell val={d.live_control_enabled} falseLabel="Disabled" /></Row>
          <Row label="Consent Required"><BoolCell val={d.consent_required} /></Row>
          <Row label="Safe Claim"><span style={{ color: GOLD, fontSize: '10px' }}>{d.safe_claim}</span></Row>
        </div>
      ))}
    </div>
  )
}

// Panel C — Device Pairing Readiness
function PairingsPanel({ data }) {
  const items = data?.data?.pairings || data?.data || []
  if (!items.length) return <div style={styles.loading}>No pairing records yet. Raw pairing tokens are never displayed.</div>
  return (
    <div style={styles.grid}>
      {items.map((p, i) => (
        <div key={p.id || i} style={styles.card}>
          <div style={styles.cardTitle}>Pairing Record</div>
          <Row label="Status"><StatusBadge status={p.pairing_status} /></Row>
          <Row label="Mode">{p.pairing_mode}</Row>
          <Row label="Reference">{p.pairing_reference_only || '—'}</Row>
          <Row label="Live Pairing"><BoolCell val={p.live_pairing_enabled} falseLabel="Disabled" /></Row>
          <Row label="Safe Claim"><span style={{ color: GOLD, fontSize: '10px' }}>{p.safe_claim}</span></Row>
          <div style={{ fontSize: '10px', color: MUTE, marginTop: '6px' }}>Raw pairing tokens are never displayed.</div>
        </div>
      ))}
    </div>
  )
}

// Panel D — Firmware Readiness
function FirmwarePanel({ data }) {
  const items = data?.data?.firmware || data?.data || []
  if (!items.length) return <div style={styles.loading}>Loading firmware records...</div>
  return (
    <div style={styles.grid}>
      {items.map((f, i) => (
        <div key={f.id || i} style={styles.card}>
          <div style={styles.cardTitle}>Firmware: {f.firmware_version_label}</div>
          <Row label="Status"><StatusBadge status={f.firmware_status} /></Row>
          <Row label="Update Available"><BoolCell val={f.update_available} /></Row>
          <Row label="Update Required"><BoolCell val={f.update_required} /></Row>
          <Row label="Update Tested"><BoolCell val={f.update_tested} /></Row>
          <Row label="Rollback Available"><BoolCell val={f.rollback_available} /></Row>
          <Row label="Live Update"><BoolCell val={f.live_update_enabled} falseLabel="Disabled" /></Row>
          <Row label="Safe Claim"><span style={{ color: GOLD, fontSize: '10px' }}>{f.safe_claim}</span></Row>
        </div>
      ))}
    </div>
  )
}

// Panel E — Hardware Provider Registry
function ProvidersPanel({ data }) {
  const items = data?.data?.providers || data?.data || []
  if (!items.length) return <div style={styles.loading}>Loading hardware providers...</div>
  return (
    <div style={styles.grid}>
      {items.map((p, i) => (
        <div key={p.id || i} style={styles.card}>
          <div style={styles.cardTitle}>{p.provider_name}</div>
          <Row label="Type">{p.provider_type}</Row>
          <Row label="Status"><StatusBadge status={p.provider_status} /></Row>
          <Row label="Configured"><BoolCell val={p.configured} /></Row>
          <Row label="Verified"><BoolCell val={p.verified} /></Row>
          <Row label="Live Connection"><BoolCell val={p.live_connection_enabled} falseLabel="Disabled" /></Row>
          <Row label="Safe Claim"><span style={{ color: GOLD, fontSize: '10px' }}>{p.safe_claim}</span></Row>
          <div style={{ fontSize: '10px', color: MUTE, marginTop: '6px' }}>Credentials are reference-only and never displayed.</div>
        </div>
      ))}
    </div>
  )
}

// Panel F — Aura State Engine
function AuraStatesPanel({ data }) {
  const items = data?.data?.aura_states || data?.data || []
  if (!items.length) return <div style={styles.loading}>Loading aura states...</div>
  return (
    <div>
      <div style={{ fontSize: '11px', color: MUTE, marginBottom: '12px', padding: '8px 12px', background: CHARCOAL, borderRadius: '4px', border: `1px solid ${LINE}` }}>
        Aura states are software experience modes only — not emotional, medical, psychological, or biometric diagnoses.
      </div>
      <div style={styles.grid}>
        {items.map((a, i) => (
          <div key={a.id || i} style={styles.card}>
            <div style={styles.cardTitle}>{a.aura_name}</div>
            <Row label="Category">{a.aura_category}</Row>
            <Row label="Status"><StatusBadge status={a.state_status} /></Row>
            <Row label="Active"><BoolCell val={a.active} falseLabel="No" /></Row>
            <Row label="Preview Only"><BoolCell val={a.preview_only} trueLabel="Yes (preview)" falseLabel="No" /></Row>
            <Row label="Live Automation"><BoolCell val={a.live_automation_enabled} falseLabel="Disabled" /></Row>
            <Row label="Consent Required"><BoolCell val={a.required_consent} /></Row>
            <Row label="Safe Claim"><span style={{ color: GOLD, fontSize: '10px' }}>{a.safe_claim}</span></Row>
          </div>
        ))}
      </div>
    </div>
  )
}

// Panel G — Environment Signal Registry
function SignalsPanel({ data }) {
  const items = data?.data?.signals || data?.data || []
  if (!items.length) return <div style={styles.loading}>Loading environment signals...</div>
  return (
    <div style={styles.grid}>
      {items.map((s, i) => (
        <div key={s.id || i} style={styles.card}>
          <div style={styles.cardTitle}>{s.signal_name}</div>
          <Row label="Type">{s.signal_type}</Row>
          <Row label="Source">{s.source_type}</Row>
          <Row label="Status"><StatusBadge status={s.signal_status} /></Row>
          <Row label="Live Ingestion"><BoolCell val={s.live_ingestion_enabled} falseLabel="Disabled" /></Row>
          <Row label="Simulated"><BoolCell val={s.simulated} trueLabel="Yes (simulated)" /></Row>
          <Row label="Consent Required"><BoolCell val={s.consent_required} /></Row>
          <Row label="Safe Claim"><span style={{ color: GOLD, fontSize: '10px' }}>{s.safe_claim}</span></Row>
        </div>
      ))}
    </div>
  )
}

// Panel H — Privacy + Consent Registry
function ConsentPanel({ data }) {
  const items = data?.data?.consents || data?.data || []
  if (!items.length) return <div style={styles.loading}>Loading consent records...</div>
  return (
    <div style={styles.grid}>
      {items.map((c, i) => (
        <div key={c.id || i} style={styles.card}>
          <div style={styles.cardTitle}>{c.consent_type?.replace(/_/g, ' ')}</div>
          <Row label="Status"><StatusBadge status={c.consent_status} /></Row>
          <Row label="Required For">{c.required_for_feature || '—'}</Row>
          <Row label="Accepted At">{c.accepted_at ? new Date(c.accepted_at).toLocaleString() : '—'}</Row>
          <Row label="Revoked At">{c.revoked_at ? new Date(c.revoked_at).toLocaleString() : '—'}</Row>
          <Row label="Evidence Ref">{c.evidence_reference || '—'}</Row>
          <Row label="Safe Claim"><span style={{ color: GOLD, fontSize: '10px' }}>{c.safe_claim}</span></Row>
          <div style={{ fontSize: '10px', color: MUTE, marginTop: '6px' }}>Subject identity is reference-only and not displayed.</div>
        </div>
      ))}
    </div>
  )
}

// Panel I — Presence / Access Event Registry
function PresencePanel({ data }) {
  const items = data?.data?.events || data?.data || []
  if (!items.length) return <div style={styles.loading}>No presence/access events yet.</div>
  return (
    <div style={styles.grid}>
      {items.map((e, i) => (
        <div key={e.id || i} style={styles.card}>
          <div style={styles.cardTitle}>{e.event_type?.replace(/_/g, ' ')}</div>
          <Row label="Status"><StatusBadge status={e.event_status} /></Row>
          <Row label="Source">{e.source_type}</Row>
          <Row label="Consent Status"><StatusBadge status={e.consent_status} /></Row>
          <Row label="Live Tracking"><BoolCell val={e.live_tracking_enabled} falseLabel="Disabled" /></Row>
          <Row label="Simulated"><BoolCell val={e.simulated} trueLabel="Yes (simulated)" /></Row>
          <Row label="Safe Claim"><span style={{ color: GOLD, fontSize: '10px' }}>{e.safe_claim}</span></Row>
          <div style={{ fontSize: '10px', color: MUTE, marginTop: '6px' }}>Subject identity is reference-only and not displayed.</div>
        </div>
      ))}
    </div>
  )
}

// Panel J — Blockers
function BlockersPanel({ data }) {
  const blockers = data?.data?.blockers || data?.data || []
  if (!blockers.length) return <div style={{ color: GREEN, fontSize: '13px' }}>No blockers.</div>
  return (
    <div>
      {blockers.map((b, i) => (
        <div key={i} style={styles.blocker}>
          <strong>{b.category?.toUpperCase()}: </strong>{b.message}
        </div>
      ))}
    </div>
  )
}

// Panel K — Safe Claims
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

// Panel L — Audit Log + Feature Flags
function AuditAndFlagsPanel({ auditData, flagsData }) {
  const events = auditData?.data?.events || []
  const flags = flagsData?.data?.flags || {}
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: GOLD, marginBottom: '10px' }}>AMBI Audit Log</div>
        {events.length === 0
          ? <div style={{ color: MUTE, fontSize: '12px' }}>No audit events recorded yet.</div>
          : events.map((e, i) => (
            <div key={e.id || i} style={styles.audit}>
              <span style={{ color: TEXT }}>{e.event_type}</span> — <span>{e.summary}</span>
              <span style={{ color: LINE, fontSize: '10px', marginLeft: '8px' }}>{e.created_at ? new Date(e.created_at).toLocaleString() : ''}</span>
            </div>
          ))}
      </div>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: GOLD, marginBottom: '10px' }}>Feature Flags</div>
        {Object.entries(flags).map(([k, v]) => (
          <div key={k} style={styles.flag(v)}>
            <span style={{ fontSize: '11px' }}>{k}</span>
            <span style={{ fontWeight: 700, fontSize: '11px' }}>{v ? 'ENABLED' : 'DISABLED'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AMBIFoundation() {
  const [summary, setSummary] = useState(null)
  const [devices, setDevices] = useState(null)
  const [pairings, setPairings] = useState(null)
  const [firmware, setFirmware] = useState(null)
  const [providers, setProviders] = useState(null)
  const [auraStates, setAuraStates] = useState(null)
  const [signals, setSignals] = useState(null)
  const [consent, setConsent] = useState(null)
  const [presence, setPresence] = useState(null)
  const [blockers, setBlockers] = useState(null)
  const [safeClaims, setSafeClaims] = useState(null)
  const [auditLog, setAuditLog] = useState(null)
  const [flags, setFlags] = useState(null)

  useEffect(() => {
    const get = (path, set) => fetch(`${API}${path}`).then(r => r.json()).then(set).catch(() => {})
    get('/summary', setSummary)
    get('/devices', setDevices)
    get('/pairings', setPairings)
    get('/firmware', setFirmware)
    get('/hardware-providers', setProviders)
    get('/aura-states', setAuraStates)
    get('/environment-signals', setSignals)
    get('/privacy-consent', setConsent)
    get('/presence-access-events', setPresence)
    get('/blockers', setBlockers)
    get('/safe-claims', setSafeClaims)
    get('/audit-log', setAuditLog)
    get('/feature-flags', setFlags)
  }, [])

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>NOVEE OS — AMBI Foundation</h1>
        <div style={styles.subtitle}>Phase E.8 — Software Foundation Only — No Hardware, No Live Telemetry, No Device Control</div>
      </div>

      <div style={styles.banner}>
        AMBI FOUNDATION — SOFTWARE FOUNDATION ONLY. No physical hardware is connected. No live telemetry. No live device control. No live pairing. No live firmware updates. No live automation. AMBI aura states are software experience modes — not medical, emotional, biometric, or emergency-response functions. AMBI does not detect emotions, health conditions, or perform any form of wellness or clinical assessment. Privacy consent is required before any live AMBI features are activated.
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>A — AMBI Foundation Summary</div>
        <SummaryPanel data={summary} />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>B — Device Registry</div>
        <DevicesPanel data={devices} />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>C — Device Pairing Readiness</div>
        <PairingsPanel data={pairings} />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>D — Firmware Readiness</div>
        <FirmwarePanel data={firmware} />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>E — Hardware Provider Registry</div>
        <ProvidersPanel data={providers} />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>F — Aura State Engine</div>
        <AuraStatesPanel data={auraStates} />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>G — Environment Signal Registry</div>
        <SignalsPanel data={signals} />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>H — Privacy + Consent Registry</div>
        <ConsentPanel data={consent} />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>I — Presence / Access Event Registry</div>
        <PresencePanel data={presence} />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>J — Blockers</div>
        <BlockersPanel data={blockers} />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>K — Safe Claims</div>
        <SafeClaimsPanel data={safeClaims} />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>L — Audit Log + Feature Flags</div>
        <AuditAndFlagsPanel auditData={auditLog} flagsData={flags} />
      </div>
    </div>
  )
}
