import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGoldenBoxCompetitionDetail, ensureIdentity } from '../../../hooks/useGoldenBox.js'
import * as api from '../../../services/goldenBox/goldenBoxApiClient.js'
import MentorGuidancePanel from '../../../components/smokecraft/goldenBox/MentorGuidancePanel.jsx'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'
const DANGER = 'rgba(255,150,150,0.9)'
const OK = '#7fd0a3'

const RULE_LABELS = {
  required_sessions: 'Required learning sessions',
  min_quiz_score: 'Minimum quiz score',
  min_xp: 'Minimum XP',
  required_badge: 'Required badge',
  required_passport_stamp: 'Required Passport stamp',
  venue_membership: 'Venue membership',
  registration_window: 'Registration window',
  max_entries: 'Entry limit',
  admin_approval: 'Administrator approval',
}

export default function CompetitionDetail() {
  const { competitionId } = useParams()
  const navigate = useNavigate()
  const { state, competition, load, eligibility, eligibilityState, checkEligibility } = useGoldenBoxCompetitionDetail(competitionId)

  useEffect(() => { load() }, [load])

  const handleCreateEntry = async () => {
    await ensureIdentity()
    const result = await api.createEntry(competitionId)
    if (result.ok) navigate(`/smokecraft/golden-box/entries/${result.entry.entry_id}/blend`)
  }

  if (state === 'loading' || state === 'idle') return <div style={{ position: 'fixed', inset: 0, background: NAVY, color: CREAM, padding: 24 }}>Loading competition…</div>
  if (state === 'not-found') return <div style={{ position: 'fixed', inset: 0, background: NAVY, color: DANGER, padding: 24 }}>Competition not found.</div>
  if (state === 'error') return <div style={{ position: 'fixed', inset: 0, background: NAVY, color: DANGER, padding: 24 }}>Unable to load this competition. <button type="button" onClick={load}>Retry</button></div>

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'auto', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM }}>
      <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 900, margin: '0 auto' }}>
        <button type="button" onClick={() => navigate('/smokecraft/golden-box')} style={{ background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', marginBottom: 12, fontFamily: 'inherit' }}>← Golden Box Hub</button>

        <h1 style={{ color: GOLD, fontSize: 'clamp(20px,2.6vw,28px)', margin: '0 0 8px' }}>{competition.title}</h1>
        <p style={{ fontSize: 14, color: 'rgba(229,226,225,0.7)' }}>{competition.description || 'No description provided.'}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 12, margin: '20px 0' }}>
          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)', textTransform: 'uppercase' }}>Scope</div>
            <div style={{ fontSize: 16, color: GOLD }}>{competition.scope}{competition.scope_venue_id ? ` — ${competition.scope_venue_id}` : ''}</div>
          </div>
          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)', textTransform: 'uppercase' }}>Status</div>
            <div style={{ fontSize: 16, color: GOLD }}>{competition.status.replace(/_/g, ' ')}</div>
          </div>
          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)', textTransform: 'uppercase' }}>Submission Deadline</div>
            <div style={{ fontSize: 16, color: GOLD }}>{competition.submission_closes_at ? new Date(competition.submission_closes_at).toLocaleDateString() : 'Not set'}</div>
          </div>
          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)', textTransform: 'uppercase' }}>Judging</div>
            <div style={{ fontSize: 16, color: GOLD }}>{competition.blind_judging ? 'Blind judging' : 'Standard judging'}</div>
          </div>
        </div>

        <div style={{ margin: '16px 0' }}>
          <h2 style={{ fontSize: 15, color: GOLD, textTransform: 'uppercase' }}>Recipe Privacy</h2>
          <p style={{ fontSize: 13, color: 'rgba(229,226,225,0.7)' }}>Your blend recipe stays private to you, assigned judges, and administrators until judging closes.</p>
        </div>

        <div style={{ margin: '16px 0' }}>
          <MentorGuidancePanel guidance="Check your eligibility below before starting your entry — I'll walk you through anything you still need." />
        </div>

        <div style={{ margin: '20px 0' }}>
          <button type="button" onClick={checkEligibility} disabled={eligibilityState === 'loading'} style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit' }}>
            {eligibilityState === 'loading' ? 'Checking…' : 'Check My Eligibility'}
          </button>

          <div role="status" aria-live="polite" style={{ marginTop: 14 }}>
            {eligibilityState === 'error' && <p style={{ color: DANGER }}>Unable to evaluate eligibility right now.</p>}
            {eligibilityState === 'ready' && eligibility && (
              <div style={{ background: GLASS, border: `1px solid ${eligibility.eligible ? OK : DANGER}`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: eligibility.eligible ? OK : DANGER, marginBottom: 8 }}>
                  {eligibility.eligible ? 'You are eligible' : 'Not yet eligible'}
                </div>
                {eligibility.results.length === 0 && <p style={{ fontSize: 13 }}>This competition has no eligibility requirements — open entry.</p>}
                {eligibility.results.map(r => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: `1px solid ${BORDER}`, fontSize: 13 }}>
                    <span>{RULE_LABELS[r.reason?.split(':')[0]] || 'Requirement'}</span>
                    <span style={{ color: r.result === 'eligible' ? OK : DANGER }}>{r.result === 'eligible' ? 'Met' : r.reason}</span>
                  </div>
                ))}
                {eligibility.eligible && (
                  <button type="button" onClick={handleCreateEntry} style={{ marginTop: 14, minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1.5px solid ${OK}`, background: 'transparent', color: OK, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Create My Entry
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
