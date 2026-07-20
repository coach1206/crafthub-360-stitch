import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGoldenBoxCompetitions } from '../../../hooks/useGoldenBox.js'
import MentorGuidancePanel from '../../../components/smokecraft/goldenBox/MentorGuidancePanel.jsx'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'
const DANGER = 'rgba(255,150,150,0.9)'

const statusColor = {
  draft: '#9aa0ab', scheduled: '#9aa0ab', registration_open: '#7fd0a3', registration_closed: '#e9c176',
  active: '#7fd0a3', submission_closed: '#e9c176', judging: '#e9c176', results_pending: '#e9c176',
  completed: '#7fd0a3', cancelled: DANGER, archived: '#666',
}

function CompetitionCard({ c, onOpen }) {
  return (
    <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 18, display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <h3 style={{ margin: 0, color: GOLD, fontSize: 17 }}>{c.title}</h3>
        <span style={{ fontSize: 11, textTransform: 'uppercase', color: statusColor[c.status] || CREAM, border: `1px solid ${statusColor[c.status] || BORDER}`, borderRadius: 10, padding: '2px 8px', height: 'fit-content' }}>{c.status.replace(/_/g, ' ')}</span>
      </div>
      <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.6)' }}>Scope: {c.scope}{c.scope_venue_id ? ` (${c.scope_venue_id})` : ''}</div>
      {c.submission_closes_at && <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.6)' }}>Submission deadline: {new Date(c.submission_closes_at).toLocaleDateString()}</div>}
      <button
        type="button" onClick={() => onOpen(c.id)}
        style={{ marginTop: 6, minHeight: 44, padding: '8px 16px', borderRadius: 18, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit', width: 'fit-content' }}
      >View Competition</button>
    </div>
  )
}

export default function GoldenBoxHub() {
  const navigate = useNavigate()
  const { state, competitions, load } = useGoldenBoxCompetitions()

  useEffect(() => { load() }, [load])

  const open = competitions.filter(c => ['registration_open', 'active'].includes(c.status))
  const upcoming = competitions.filter(c => ['draft', 'scheduled', 'registration_closed'].includes(c.status))
  const inProgress = competitions.filter(c => ['submission_closed', 'judging', 'results_pending'].includes(c.status))
  const completed = competitions.filter(c => c.status === 'completed')

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'auto', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM }}>
      <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 1100, margin: '0 auto' }}>
        <h1 style={{ color: GOLD, fontSize: 'clamp(20px,2.6vw,28px)', margin: '0 0 6px' }}>Golden Box Challenge</h1>
        <p style={{ fontSize: 13, color: 'rgba(229,226,225,0.55)', margin: '0 0 20px' }}>Build, refine, and defend an original cigar blend using everything you've learned.</p>

        <div style={{ marginBottom: 24 }}>
          <MentorGuidancePanel guidance="Ready to put your knowledge to the test? Browse open competitions below and check your eligibility." />
        </div>

        <div role="status" aria-live="polite">
          {state === 'loading' && <p>Loading competitions…</p>}
          {state === 'error' && <p style={{ color: DANGER }}>Unable to load competitions right now. <button type="button" onClick={load} style={{ background: 'transparent', border: `1px solid ${BORDER}`, color: CREAM, borderRadius: 10, padding: '2px 10px', cursor: 'pointer' }}>Retry</button></p>}
        </div>

        {state === 'ready' && (
          <div style={{ display: 'grid', gap: 28 }}>
            <section>
              <h2 style={{ fontSize: 15, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Open for Entry</h2>
              {open.length === 0
                ? <p style={{ color: 'rgba(229,226,225,0.55)', fontSize: 13 }}>No competitions are open for entry right now. Check back soon.</p>
                : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                    {open.map(c => <CompetitionCard key={c.id} c={c} onOpen={(id) => navigate(`/smokecraft/golden-box/competitions/${id}`)} />)}
                  </div>}
            </section>

            <section>
              <h2 style={{ fontSize: 15, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Upcoming</h2>
              {upcoming.length === 0
                ? <p style={{ color: 'rgba(229,226,225,0.55)', fontSize: 13 }}>No upcoming competitions announced yet.</p>
                : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                    {upcoming.map(c => <CompetitionCard key={c.id} c={c} onOpen={(id) => navigate(`/smokecraft/golden-box/competitions/${id}`)} />)}
                  </div>}
            </section>

            {inProgress.length > 0 && (
              <section>
                <h2 style={{ fontSize: 15, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.04em' }}>In Judging</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                  {inProgress.map(c => <CompetitionCard key={c.id} c={c} onOpen={(id) => navigate(`/smokecraft/golden-box/competitions/${id}`)} />)}
                </div>
              </section>
            )}

            {completed.length > 0 && (
              <section>
                <h2 style={{ fontSize: 15, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Results</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                  {completed.map(c => <CompetitionCard key={c.id} c={c} onOpen={(id) => navigate(`/smokecraft/golden-box/results/${id}`)} />)}
                </div>
              </section>
            )}

            {competitions.length === 0 && (
              <p style={{ color: 'rgba(229,226,225,0.55)' }}>No Golden Box competitions exist yet. This is an honest empty state — none have been created by an administrator.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
