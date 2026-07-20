import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import * as api from '../../../services/goldenBox/goldenBoxApiClient.js'
import { useGoldenBoxCompetitionDetail } from '../../../hooks/useGoldenBox.js'
import MentorGuidancePanel from '../../../components/smokecraft/goldenBox/MentorGuidancePanel.jsx'
import MediaSlot from '../../../components/smokecraft/goldenBox/MediaSlot.jsx'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'
const DANGER = 'rgba(255,150,150,0.9)'
const OK = '#7fd0a3'

// Package 7A — real entry-status and finalist/winner/disqualified state
// copy, matching the same ENTRY_STATUS_COPY approach used in
// EntryWorkspace.jsx (never fabricated, always driven by the real
// entry.status returned from the server).
const RESULT_STATE_COPY = {
  finalist: { label: 'Finalist', color: GOLD, next: 'Your entry advanced to the finalist round. Await final judging.' },
  winner: { label: 'Winner', color: GOLD, next: 'Congratulations — check your rewards below.' },
  not_selected: { label: 'Not Selected', color: 'rgba(229,226,225,0.6)', next: 'Review the feedback below to sharpen your next entry.' },
  disqualified: { label: 'Disqualified', color: DANGER, next: 'See the disqualification reason below.' },
  under_review: { label: 'Under Review', color: GOLD, next: 'Judges are still reviewing this entry.' },
  submitted: { label: 'Submitted', color: GOLD, next: 'Awaiting judge assignment and review.' },
}

export default function ResultsExperience() {
  const { competitionId } = useParams()
  const [searchParams] = useSearchParams()
  const entryId = searchParams.get('entryId')
  const navigate = useNavigate()
  const { state, competition, load } = useGoldenBoxCompetitionDetail(competitionId)
  const [xpState, setXpState] = useState('idle')
  const [xpHistory, setXpHistory] = useState(null)
  const [entryDetail, setEntryDetail] = useState(null)
  const [resultDetail, setResultDetail] = useState(null)
  const [mentorReviews, setMentorReviews] = useState([])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    setXpState('loading')
    api.getXpHistory().then(result => {
      if (result.ok) { setXpHistory(result); setXpState('ready') } else setXpState('error')
    })
  }, [])

  useEffect(() => {
    if (!entryId) return
    api.getEntry(entryId).then(result => { if (result.ok) setEntryDetail(result.entry) })
    api.getResults(competitionId, entryId).then(result => { if (result.ok) setResultDetail(result.result) })
    api.getMentorReviewsForEntry(entryId).then(result => { if (result.ok) setMentorReviews(result.reviews || []) })
  }, [entryId, competitionId])

  if (state === 'loading' || state === 'idle') return <div style={{ position: 'fixed', inset: 0, background: NAVY, color: CREAM, padding: 24 }}>Loading results…</div>
  if (state === 'error' || state === 'not-found') return <div style={{ position: 'fixed', inset: 0, background: NAVY, color: DANGER, padding: 24 }}>Results unavailable.</div>

  const resultsReleased = ['results_pending', 'completed'].includes(competition.status)
  const resultState = entryDetail ? RESULT_STATE_COPY[entryDetail.status] : null

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'auto', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM }}>
      <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 900, margin: '0 auto' }}>
        <button type="button" onClick={() => navigate('/smokecraft/golden-box')} style={{ background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', marginBottom: 12, fontFamily: 'inherit' }}>← Golden Box Hub</button>

        <MediaSlot assetKey="goldenBoxScoringRounds" alt="Golden Box scoring rounds" caption="Results" style={{ height: 150, borderRadius: 10, marginBottom: 14 }} />
        <h1 style={{ color: GOLD, fontSize: 'clamp(18px,2.4vw,24px)', margin: '0 0 12px' }}>{competition.title} — Results</h1>

        {!resultsReleased ? (
          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
            Judging is not complete yet — results have not been released. Current status: <strong>{competition.status.replace(/_/g, ' ')}</strong>.
          </div>
        ) : (
          <div style={{ background: GLASS, border: `1px solid ${OK}`, borderRadius: 10, padding: 16 }}>
            Results have been released for this competition. Official human-judged scores determine placement; any AI-generated notes are clearly separated as educational only and never factor into placement.
          </div>
        )}

        {resultState && (
          <div style={{ background: GLASS, border: `1px solid ${resultState.color}`, borderRadius: 10, padding: 16, marginTop: 16 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: resultState.color }}>Your Entry Status</div>
            <div style={{ fontSize: 18, color: resultState.color, margin: '4px 0' }}>{resultState.label}</div>
            <p style={{ fontSize: 13 }}>{resultState.next}</p>
            {entryDetail.status === 'disqualified' && resultDetail?.disqualification_reason && (
              <p style={{ fontSize: 12, color: DANGER }}>Reason: {resultDetail.disqualification_reason}</p>
            )}
          </div>
        )}

        <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginTop: 16 }}>
          <h2 style={{ fontSize: 14, color: GOLD, margin: '0 0 8px' }}>Score</h2>
          {resultDetail?.aggregate_score != null ? (
            <>
              <div style={{ fontSize: 22, color: GOLD }}>{Number(resultDetail.aggregate_score).toFixed(1)} / 10</div>
              {resultDetail.placement != null && <div style={{ fontSize: 13, color: OK }}>Placement: #{resultDetail.placement}</div>}
            </>
          ) : (
            <div style={{ fontSize: 13, color: 'rgba(229,226,225,0.6)' }}>Pending — no submitted scorecards counted yet.</div>
          )}
        </div>

        {mentorReviews.length > 0 && (
          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginTop: 16 }}>
            <h2 style={{ fontSize: 14, color: GOLD, margin: '0 0 8px' }}>Mentor Feedback</h2>
            {mentorReviews.map(r => (
              <div key={r.id} style={{ fontSize: 12, marginBottom: 8 }}>
                {r.final_guidance && <div>{r.final_guidance}</div>}
              </div>
            ))}
          </div>
        )}

        <div style={{ margin: '20px 0' }}>
          <MentorGuidancePanel guidance="Whatever the outcome, review the feedback below — every entry is a chance to sharpen your blending instincts for next time." />
        </div>

        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))' }}>
          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)', textTransform: 'uppercase' }}>XP Balance</div>
            <div style={{ fontSize: 22, color: GOLD }}>
              {xpState === 'loading' ? '…' : xpState === 'error' ? 'unavailable' : xpHistory?.balance ?? 0}
            </div>
          </div>
        </div>

        {/* Package 7A — a stable, honest continuation boundary. Rewards
            Center / Skill Tree / Recommended Next Journey do not exist yet
            (Package 7B/7C/7D) — these links lead to the real, existing
            Leaderboard and Rewards/Badges screens, never a fabricated
            destination. */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => navigate('/smokecraft/leaderboard')} style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit' }}>View Leaderboard</button>
          <button type="button" onClick={() => navigate('/smokecraft/rewards')} style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit' }}>View Rewards & Badges</button>
          <button type="button" onClick={() => navigate('/smokecraft/golden-box/competitions')} style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1px solid ${BORDER}`, background: 'transparent', color: CREAM, cursor: 'pointer', fontFamily: 'inherit' }}>Back to Competitions</button>
        </div>
      </div>
    </div>
  )
}
