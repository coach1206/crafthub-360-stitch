import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import * as api from '../../../services/goldenBox/goldenBoxApiClient.js'
import { useGoldenBoxCompetitionDetail } from '../../../hooks/useGoldenBox.js'
import MentorGuidancePanel from '../../../components/smokecraft/goldenBox/MentorGuidancePanel.jsx'
import MediaSlot from '../../../components/smokecraft/goldenBox/MediaSlot.jsx'
import SmokeCraftScreenShell from '../../../components/smokecraft/SmokeCraftScreenShell.jsx'
import { SMOKECRAFT_NAV_DESTINATIONS as NAV } from '../../../constants/smokecraftNavigationRegistry.js'

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

// Holistic Fix 5C-2B-1 — real server-computed/finalized ranking states.
// Never mock winners: this copy only labels a real status string the
// server returned; the ranking rows themselves are always the live
// server response.
const RANKING_STATE_COPY = {
  no_entries: 'No entries have been submitted to this competition yet.',
  awaiting_submissions: 'Awaiting entry submissions — rankings are not available yet.',
  awaiting_judges: 'Entries have been submitted but judges have not yet been assigned.',
  judging_in_progress: 'Judging is still in progress — rankings will be available once all assigned judges submit their scorecards.',
  ready_to_finalize: 'All required scorecards are complete. Rankings below are a live preview — not yet official until finalized.',
  not_finalized: 'Official rankings have not been published yet.',
}

const AWARD_TITLES = { first_place: '1st Place', second_place: '2nd Place', third_place: '3rd Place' }

// Holistic Fix 5C-2B-2 — real award states. 'no_finalized_result' and
// 'awards_pending' are honest waiting states (never a fabricated
// reward); 'not_qualified' means this entry's real placement was
// outside the top three; 'issued' renders the real award row.
const AWARD_STATE_COPY = {
  no_finalized_result: 'Results have not been finalized yet — awards are not available.',
  awards_pending: 'Results are finalized. Awards have not been issued yet.',
  not_qualified: 'This entry did not place in the top three.',
}

const TIE_BREAK_LABELS = {
  construction_avg: 'Resolved by higher construction-quality average.',
  blend_quality_avg: 'Resolved by higher blend-quality (aroma) average.',
  presentation_avg: 'Resolved by higher presentation (rule compliance) average.',
  score_variance: 'Resolved by lower score variance (more consistent judging).',
  submission_time: 'Resolved by earlier valid final submission.',
  entry_id_order: 'Resolved by stable entry ordering (final deterministic fallback).',
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
  const [rankingState, setRankingState] = useState('loading')
  const [ranking, setRanking] = useState(null)
  const [finalizeState, setFinalizeState] = useState('idle')
  const [finalizeError, setFinalizeError] = useState(null)
  const [awardState, setAwardState] = useState('loading')
  const [award, setAward] = useState(null)
  const [issueState, setIssueState] = useState('idle')
  const [issueError, setIssueError] = useState(null)

  async function loadAward() {
    if (!entryId) return
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { setAwardState('offline'); return }
    setAwardState('loading')
    const result = await api.getEntryAward(competitionId, entryId)
    if (!result.ok) { setAwardState(result.status === 401 || result.status === 403 ? 'unauthorized' : 'retry'); return }
    setAward(result)
    setAwardState(result.status)
  }

  async function handleIssueAwards() {
    setIssueState('issuing')
    setIssueError(null)
    const idempotencyKey = `gb-issue-awards-${competitionId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const result = await api.issueAwards(competitionId, 1, idempotencyKey)
    if (!result.ok) { setIssueState('failed'); setIssueError(result.error); return }
    setIssueState('issued')
    await loadAward()
  }

  async function loadRanking() {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { setRankingState('offline'); return }
    setRankingState('loading')
    const result = await api.getCompetitionResults(competitionId)
    if (!result.ok) { setRankingState(result.status === 401 || result.status === 403 ? 'unauthorized' : 'retry'); return }
    setRanking(result)
    setRankingState('ready')
  }

  async function handleFinalize() {
    setFinalizeState('finalizing')
    setFinalizeError(null)
    const idempotencyKey = `gb-finalize-${competitionId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const result = await api.finalizeResults(competitionId, 1, idempotencyKey)
    if (!result.ok) { setFinalizeState('failed'); setFinalizeError(result.error); return }
    setFinalizeState('finalized')
    await loadRanking()
  }

  useEffect(() => { load() }, [load])
  useEffect(() => { loadRanking() }, [competitionId]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { loadAward() }, [competitionId, entryId]) // eslint-disable-line react-hooks/exhaustive-deps
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

  if (state === 'loading' || state === 'idle') return <SmokeCraftScreenShell mode="live" status="loading" loadingMessage="Loading results…" />
  if (state === 'error' || state === 'not-found') return <SmokeCraftScreenShell mode="live" status="empty" emptyMessage="Results unavailable." />

  const resultsReleased = ['results_pending', 'completed'].includes(competition.status)
  const resultState = entryDetail ? RESULT_STATE_COPY[entryDetail.status] : null

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
    <div style={{ position: 'fixed', inset: 0, overflow: 'auto', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM }}>
      <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 900, margin: '0 auto' }}>
        <button type="button" onClick={() => navigate(NAV.GOLDEN_BOX)} style={{ background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', marginBottom: 12, fontFamily: 'inherit' }}>← Golden Box Hub</button>

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

        {entryId && (
          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginTop: 16 }}>
            <h2 style={{ fontSize: 14, color: GOLD, margin: '0 0 8px' }}>Your Award</h2>
            {awardState === 'loading' && <p style={{ fontSize: 13 }}>Loading award status…</p>}
            {awardState === 'offline' && (
              <p style={{ fontSize: 13, color: DANGER }}>You appear to be offline. <button type="button" onClick={loadAward} style={{ background: 'transparent', border: 'none', color: GOLD, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit' }}>Retry</button></p>
            )}
            {awardState === 'unauthorized' && <p style={{ fontSize: 13, color: DANGER }}>You are not authorized to view award status for this entry.</p>}
            {awardState === 'retry' && (
              <p style={{ fontSize: 13, color: DANGER }}>Unable to load award status right now. <button type="button" onClick={loadAward} style={{ background: 'transparent', border: 'none', color: GOLD, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit' }}>Retry</button></p>
            )}
            {['no_finalized_result', 'awards_pending', 'not_qualified'].includes(awardState) && (
              <p style={{ fontSize: 13, color: 'rgba(229,226,225,0.6)' }}>{AWARD_STATE_COPY[awardState]}</p>
            )}
            {awardState === 'issued' && award?.award && (
              <div>
                <div style={{ fontSize: 18, color: GOLD }}>{AWARD_TITLES[award.award.award_type] || award.award.award_type}</div>
                <p style={{ fontSize: 12, color: 'rgba(229,226,225,0.6)' }}>Placement #{award.award.placement} · rule {award.award.rule_id} v{award.award.rule_version} · issued {award.award.issued_at ? new Date(award.award.issued_at).toLocaleString() : ''}</p>
                <div style={{ display: 'grid', gap: 6, marginTop: 8, fontSize: 13 }}>
                  <div>XP: {award.award.xp_status === 'issued' ? 'Earned' : 'Not yet available (no approved rule configured)'}</div>
                  <div>Badge: {award.award.badge_status === 'issued' ? 'Earned' : 'Not yet available (no approved badge configured)'}</div>
                  <div>Passport Stamp: {award.award.passport_stamp_status === 'issued' ? 'Earned' : 'Not yet available (no approved stamp configured)'}</div>
                </div>
              </div>
            )}
            {awardState === 'awards_pending' && (
              <div style={{ marginTop: 10 }}>
                <button type="button" disabled={issueState === 'issuing'} onClick={handleIssueAwards}
                  style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: issueState === 'issuing' ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {issueState === 'issuing' ? 'Issuing…' : 'Issue Awards'}
                </button>
                {issueState === 'failed' && <p role="alert" style={{ color: DANGER, fontSize: 12, marginTop: 8 }}>{issueError}</p>}
              </div>
            )}
          </div>
        )}

        <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginTop: 16 }}>
          <h2 style={{ fontSize: 14, color: GOLD, margin: '0 0 8px' }}>Competition Rankings</h2>
          {rankingState === 'loading' && <p style={{ fontSize: 13 }}>Loading rankings…</p>}
          {rankingState === 'offline' && (
            <p style={{ fontSize: 13, color: DANGER }}>You appear to be offline. <button type="button" onClick={loadRanking} style={{ background: 'transparent', border: 'none', color: GOLD, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit' }}>Retry</button></p>
          )}
          {rankingState === 'unauthorized' && <p style={{ fontSize: 13, color: DANGER }}>You are not authorized to view rankings for this competition.</p>}
          {rankingState === 'retry' && (
            <p style={{ fontSize: 13, color: DANGER }}>Unable to load rankings right now. <button type="button" onClick={loadRanking} style={{ background: 'transparent', border: 'none', color: GOLD, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit' }}>Retry</button></p>
          )}
          {rankingState === 'ready' && ranking && (
            <>
              {ranking.status !== 'finalized' && (
                <p style={{ fontSize: 12, color: 'rgba(229,226,225,0.6)', margin: '0 0 10px' }}>{RANKING_STATE_COPY[ranking.status] || 'Rankings are not available yet.'}</p>
              )}
              {ranking.status === 'finalized' && (
                <p style={{ fontSize: 12, color: OK, margin: '0 0 10px' }}>Official, finalized rankings (result version {ranking.finalization?.result_version}, rubric v{ranking.finalization?.rubric_version}).</p>
              )}
              {(ranking.ranked || []).length === 0 ? (
                ranking.status === 'ready_to_finalize' || ranking.status === 'finalized' ? null : (
                  <div style={{ fontSize: 13, color: 'rgba(229,226,225,0.6)' }}>No entries.</div>
                )
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {ranking.ranked.map(r => {
                    const rank = r.rank ?? r.placement
                    const score = r.avgWeightedTotal ?? r.aggregate_score
                    const tieBreak = r.tieBreakReason ?? r.tie_break_reason
                    return (
                      <div key={r.entryId || r.entry_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 12px' }}>
                        <span style={{ fontSize: 13 }}>#{rank} — Entry {(r.entryId || r.entry_id || '').slice(0, 8)}…</span>
                        <span style={{ fontSize: 13, color: GOLD }}>{score != null ? Number(score).toFixed(2) : '—'}</span>
                        {tieBreak && <span style={{ fontSize: 11, color: 'rgba(229,226,225,0.55)' }}>{TIE_BREAK_LABELS[tieBreak] || tieBreak}</span>}
                      </div>
                    )
                  })}
                </div>
              )}
              {ranking.status === 'ready_to_finalize' && (
                <div style={{ marginTop: 14 }}>
                  <button type="button" disabled={finalizeState === 'finalizing'} onClick={handleFinalize}
                    style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: finalizeState === 'finalizing' ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                    {finalizeState === 'finalizing' ? 'Finalizing…' : 'Finalize Results'}
                  </button>
                  {finalizeState === 'failed' && <p role="alert" style={{ color: DANGER, fontSize: 12, marginTop: 8 }}>{finalizeError}</p>}
                </div>
              )}
            </>
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
          <button type="button" onClick={() => navigate(NAV.LEADERBOARD)} style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit' }}>View Leaderboard</button>
          {/* Not NAV.REWARDS (that's /smokecraft/rewards-center, a different
              screen) — this genuinely targets the S25 curriculum Rewards
              screen, confirmed via source read. */}
          <button type="button" onClick={() => navigate('/smokecraft/rewards')} style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit' }}>View Rewards & Badges</button>
          <button type="button" onClick={() => navigate('/smokecraft/golden-box/competitions')} style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1px solid ${BORDER}`, background: 'transparent', color: CREAM, cursor: 'pointer', fontFamily: 'inherit' }}>Back to Competitions</button>
        </div>
      </div>
    </div>
    </SmokeCraftScreenShell>
  )
}
