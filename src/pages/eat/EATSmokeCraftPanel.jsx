import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ReturnToGuestButton from '../../components/staffhandoff/ReturnToGuestButton.jsx'
import { loadGuestResumeState } from '../../services/staffHandoffResumeService.js'
import { syncToEAT } from '../../services/smokecraftHandoffService.js'

const G = '#E9C176'

export default function EATSmokeCraftPanel() {
  const navigate = useNavigate()
  const resumeState = loadGuestResumeState()

  const [staffNote, setStaffNote] = useState('')
  const [syncStatus, setSyncStatus] = useState(null)
  const [syncing, setSyncing] = useState(false)

  const rs = resumeState || {}

  async function handleSync() {
    setSyncing(true)
    try {
      const result = await syncToEAT({
        guestSessionId: rs.guestSessionId || 'guest',
        venueId: rs.venueId || 'novee-grand-lounge',
        syncType: 'staff_note',
        notes: staffNote,
      })
      setSyncStatus(result?.localPreview
        ? { ok: true, localPreview: true, message: 'E.A.T. sync is local-preview only. Backend management sync is not live yet.' }
        : { ok: true, localPreview: false, message: 'Synced to E.A.T. management.' }
      )
    } catch {
      setSyncStatus({ ok: false, message: 'E.A.T. sync is local-preview only. Backend management sync is not live yet.' })
    }
    setSyncing(false)
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <div>
          <div style={styles.headerTitle}>E.A.T. — SmokeCraft Guest Summary</div>
          <div style={styles.headerSub}>Management view · Local Preview Mode</div>
        </div>
        <ReturnToGuestButton compact />
      </div>

      <div style={styles.localNotice}>
        E.A.T. sync is local-preview only. Backend management sync is not live yet.
      </div>

      <div style={styles.body}>
        {/* Guest identity */}
        <section style={styles.section}>
          <div style={styles.sectionTitle}>Guest Session</div>
          <div style={styles.grid2}>
            <Field label="Session ID" value={rs.guestSessionId?.slice(-12) || '—'} mono />
            <Field label="Visit" value={rs.currentVisit ?? '—'} />
            <Field label="Session" value={rs.currentSession ?? '—'} />
            <Field label="Venue" value={rs.venueId || '—'} mono />
          </div>
        </section>

        {/* Scores */}
        <section style={styles.section}>
          <div style={styles.sectionTitle}>Score Overview</div>
          <div style={styles.grid4}>
            <ScoreCard label="Journey XP" value={rs.journeyXP ?? 0} color="#5cb85c" />
            <ScoreCard label="Skill Score" value={rs.skillScore ?? 0} color="#5bc0de" />
            <ScoreCard label="Challenge" value={rs.challengeScore ?? 0} color="#f0ad4e" />
            <ScoreCard label="Loyalty Pts" value={rs.loyaltyPoints ?? 0} color={G} />
          </div>
        </section>

        {/* Progress */}
        <section style={styles.section}>
          <div style={styles.sectionTitle}>Journey Progress</div>
          <div style={styles.grid2}>
            <Field label="Passport Stamps" value={rs.passportStampCount ?? 0} />
            <Field label="Last Unlocked Session" value={rs.lastUnlockedSession ?? '—'} />
            <Field label="Last Unlocked Visit" value={rs.lastUnlockedVisit ?? '—'} />
            <Field label="Completed Steps" value={Array.isArray(rs.completedSteps) ? rs.completedSteps.length : 0} />
          </div>
          {Array.isArray(rs.earnedBadges) && rs.earnedBadges.length > 0 && (
            <div style={styles.badges}>
              {rs.earnedBadges.map(b => (
                <span key={b} style={styles.badge}>{b}</span>
              ))}
            </div>
          )}
        </section>

        {/* Signals */}
        <section style={styles.section}>
          <div style={styles.sectionTitle}>Management Signals</div>
          <div style={styles.signalRow}>
            <Signal label="VIP Candidate" value={rs.journeyXP >= 500 || rs.loyaltyPoints >= 300} />
            <Signal label="High Engagement" value={(rs.completedSteps?.length ?? 0) >= 12} />
            <Signal label="Loyalty Active" value={(rs.loyaltyPoints ?? 0) > 0} />
          </div>
          {rs.journeyXP >= 500 && (
            <div style={styles.vipNote}>VIP candidate signal: guest XP ≥ 500. Recommend follow-up offer.</div>
          )}
        </section>

        {/* Staff note */}
        <section style={styles.section}>
          <div style={styles.sectionTitle}>Staff Note</div>
          <textarea
            value={staffNote}
            onChange={e => setStaffNote(e.target.value)}
            placeholder="Add a note for management (optional)…"
            style={styles.textarea}
            maxLength={500}
          />
          <button onClick={handleSync} disabled={syncing} style={styles.syncBtn}>
            {syncing ? 'Syncing…' : 'Sync to E.A.T. Management'}
          </button>
          {syncStatus && (
            <div style={{ ...styles.syncResult, color: syncStatus.ok ? '#8aba50' : '#e06060' }}>
              {syncStatus.message}
            </div>
          )}
        </section>
      </div>

      <ReturnToGuestButton />
    </div>
  )
}

function Field({ label, value, mono }) {
  return (
    <div style={fieldStyles.wrap}>
      <div style={fieldStyles.label}>{label}</div>
      <div style={{ ...fieldStyles.value, fontFamily: mono ? '"JetBrains Mono", monospace' : 'inherit' }}>{String(value)}</div>
    </div>
  )
}

function ScoreCard({ label, value, color }) {
  return (
    <div style={{ ...scoreStyles.card, borderColor: color + '33' }}>
      <div style={{ ...scoreStyles.value, color }}>{value}</div>
      <div style={scoreStyles.label}>{label}</div>
    </div>
  )
}

function Signal({ label, value }) {
  return (
    <div style={signalStyles.wrap}>
      <div style={{ ...signalStyles.dot, background: value ? '#5cb85c' : 'rgba(233,193,118,0.15)' }} />
      <span style={signalStyles.label}>{label}</span>
    </div>
  )
}

const styles = {
  wrap: { minHeight: '100vh', background: '#080604', color: '#f0e6d3', fontFamily: '"Georgia", serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 20px', background: '#100c06', borderBottom: `1px solid rgba(233,193,118,0.15)` },
  headerTitle: { fontSize: 16, fontWeight: 600, color: G },
  headerSub: { fontSize: 11, color: 'rgba(233,193,118,0.4)', fontFamily: '"JetBrains Mono", monospace', marginTop: 3 },
  localNotice: { background: '#1a1a04', border: '1px solid #5a5a10', color: '#c0b040', padding: '8px 20px', fontSize: 11, fontFamily: '"JetBrains Mono", monospace' },
  body: { padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 },
  section: { background: 'rgba(233,193,118,0.03)', border: '1px solid rgba(233,193,118,0.1)', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 },
  sectionTitle: { fontSize: 11, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(233,193,118,0.5)' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 },
  badges: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  badge: { background: 'rgba(233,193,118,0.1)', border: '1px solid rgba(233,193,118,0.25)', color: G, padding: '3px 10px', borderRadius: 12, fontSize: 11, fontFamily: '"JetBrains Mono", monospace' },
  signalRow: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  vipNote: { fontSize: 12, color: '#f0ad4e', background: 'rgba(240,173,78,0.08)', border: '1px solid rgba(240,173,78,0.2)', borderRadius: 6, padding: '6px 10px' },
  textarea: { width: '100%', minHeight: 80, background: 'rgba(233,193,118,0.05)', border: '1px solid rgba(233,193,118,0.2)', color: '#f0e6d3', borderRadius: 8, padding: '10px 12px', fontSize: 13, fontFamily: '"Georgia", serif', resize: 'vertical', boxSizing: 'border-box' },
  syncBtn: { background: 'rgba(233,193,118,0.12)', border: `1px solid rgba(233,193,118,0.3)`, color: G, padding: '10px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.06em', alignSelf: 'flex-start' },
  syncResult: { fontSize: 12, fontFamily: '"JetBrains Mono", monospace' },
}

const fieldStyles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 2 },
  label: { fontSize: 10, color: 'rgba(233,193,118,0.4)', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.08em', textTransform: 'uppercase' },
  value: { fontSize: 14, color: '#f0e6d3' },
}

const scoreStyles = {
  card: { background: 'rgba(233,193,118,0.04)', border: '1px solid', borderRadius: 8, padding: '10px 12px', textAlign: 'center' },
  value: { fontSize: 22, fontWeight: 700 },
  label: { fontSize: 10, color: 'rgba(233,193,118,0.45)', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 },
}

const signalStyles = {
  wrap: { display: 'flex', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: '50%' },
  label: { fontSize: 13, color: '#f0e6d3' },
}
