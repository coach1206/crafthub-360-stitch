import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../../../services/goldenBox/goldenBoxApiClient.js'
import MediaSlot from '../../../components/smokecraft/goldenBox/MediaSlot.jsx'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'

const SCORECARD_STATUS_COPY = {
  null: { label: 'Not Started', color: 'rgba(229,226,225,0.5)' },
  draft: { label: 'Draft', color: GOLD },
  submitted: { label: 'Submitted', color: '#7fd0a3' },
  locked: { label: 'Locked', color: '#7fd0a3' },
  amended: { label: 'Amended', color: '#e2c07f' },
  voided: { label: 'Voided', color: '#e2a6a6' },
}

// Package 7A — judge-facing dashboard. Shows only competitions/entries
// actually assigned to the authenticated judge (server-enforced via
// golden_box_judge_assignments, never a client-side filter of "all
// entries"). Blind judging: entrant identity is never included in this
// list (only entry_id/competition/status), matching the same recipe-
// privacy boundary the rest of Golden Box already enforces.
export default function JudgeDashboard() {
  const [state, setState] = useState('loading')
  const [assignments, setAssignments] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    api.getJudgeAssignments().then(result => {
      if (!result.ok) { setState('error'); return }
      setAssignments(result.assignments || [])
      setState('ready')
    })
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'auto', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM }}>
      <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 900, margin: '0 auto' }}>
        <MediaSlot assetKey="goldenBoxJudgingCriteria" alt="Golden Box judging criteria" caption="Judging Criteria" style={{ height: 140, borderRadius: 10, marginBottom: 14 }} />
        <h1 style={{ color: GOLD, fontSize: 'clamp(18px,2.4vw,24px)' }}>Judge Dashboard</h1>
        <p style={{ fontSize: 13, color: 'rgba(229,226,225,0.6)' }}>
          Entries assigned to you for judging. Blind judging: only entry
          and competition identifiers are shown here — no entrant identity.
        </p>

        {state === 'loading' && <p>Loading assignments…</p>}
        {state === 'error' && <p style={{ color: '#e2a6a6' }}>Unable to load assignments. You may not be authorized to judge, or none are assigned yet.</p>}
        {state === 'ready' && assignments.length === 0 && (
          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, fontSize: 13 }}>
            No entries are currently assigned to you.
          </div>
        )}

        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          {assignments.map(a => {
            const statusCopy = SCORECARD_STATUS_COPY[a.scorecard_status] || SCORECARD_STATUS_COPY.null
            return (
              <button
                key={a.entry_id}
                type="button"
                onClick={() => navigate(`/smokecraft/golden-box/judge/entries/${a.entry_id}`)}
                aria-label={`Review entry ${a.entry_id.slice(0, 8)} for ${a.competition_title} — ${statusCopy.label}`}
                style={{
                  textAlign: 'left', minHeight: 72, background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10,
                  padding: 14, color: CREAM, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{a.competition_title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.6)' }}>Entry {a.entry_id.slice(0, 8)}… · Competition status: {a.competition_status}</div>
                </div>
                <span style={{ fontSize: 11, textTransform: 'uppercase', border: `1px solid ${statusCopy.color}`, color: statusCopy.color, borderRadius: 10, padding: '3px 10px', whiteSpace: 'nowrap' }}>
                  {statusCopy.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
