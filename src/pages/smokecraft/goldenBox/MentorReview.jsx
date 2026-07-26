import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as api from '../../../services/goldenBox/goldenBoxApiClient.js'
import MediaSlot from '../../../components/smokecraft/goldenBox/MediaSlot.jsx'
import SmokeCraftScreenShell from '../../../components/smokecraft/SmokeCraftScreenShell.jsx'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'
const OK = '#7fd0a3'
const DANGER = 'rgba(255,150,150,0.9)'

const FIELDS = [
  ['strengths', 'Strengths', 'What is working well in this blend?'],
  ['componentFeedback', 'Component Feedback', 'Thoughts on the seed, wrapper, binder, filler choices.'],
  ['constructionFeedback', 'Construction Feedback', 'Thoughts on construction plan and technique.'],
  ['flavorFeedback', 'Flavor Feedback', 'Does the flavor target make sense given the components?'],
  ['pairingFeedback', 'Pairing Feedback', 'Thoughts on the suggested pairing.'],
  ['presentationFeedback', 'Presentation Feedback', 'Is the blend story clear and well defended?'],
  ['commonMistakes', 'Common Mistakes to Watch', 'Any common mistakes this entry risks.'],
  ['improvementAreas', 'Improvement Areas', 'What could be stronger before submission.'],
  ['questionsForLearner', 'Questions for the Learner', 'Anything you want them to think about further.'],
  ['finalGuidance', 'Final Guidance', 'Overall preparation guidance.'],
]
const READINESS = ['not_ready', 'needs_work', 'ready', 'strong']

// Package 7A — real mentor-review submission, gated by requireMentor
// server-side (role === 'human_mentor' or founder_level_0). This is
// educational guidance, never an official competition score — the
// backend structurally cannot let it enter golden_box_scores.
export default function MentorReview() {
  const { entryId } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState('loading')
  const [fields, setFields] = useState({})
  const [readiness, setReadiness] = useState('')
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.getOwnMentorDraft(entryId).then(result => {
      if (!result.ok) { setState(result.status === 403 ? 'forbidden' : 'error'); return }
      if (result.review) {
        const next = {}
        for (const [key] of FIELDS) {
          const snake = key.replace(/([A-Z])/g, '_$1').toLowerCase()
          if (result.review[snake]) next[key] = result.review[snake]
        }
        setFields(next)
        setReadiness(result.review.readiness_status || '')
      }
      setState('ready')
    })
  }, [entryId])

  async function handleSave() {
    setError(null)
    const result = await api.saveMentorReviewDraft(entryId, { ...fields, readinessStatus: readiness || undefined })
    if (!result.ok) { setError(result.error); return }
    setMessage('Draft saved.')
  }

  async function handleSubmit() {
    setError(null)
    await handleSave()
    const result = await api.submitMentorReview(entryId)
    if (!result.ok) { setError(result.error); return }
    setMessage('Mentor review submitted — now visible to the learner.')
  }

  if (state === 'loading') return <SmokeCraftScreenShell mode="live" status="loading" loadingMessage="Loading…" />
  if (state === 'forbidden') return <SmokeCraftScreenShell mode="live" status="empty" emptyMessage="You are not authorized to submit a mentor review (mentor role required)." />

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
    <div style={{ position: 'fixed', inset: 0, overflow: 'auto', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM }}>
      <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 800, margin: '0 auto' }}>
        <button type="button" onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', marginBottom: 12, fontFamily: 'inherit' }}>← Back</button>
        <MediaSlot assetKey="goldenBoxMasterBlendingEducation" alt="Master blending education" caption="Mentor Guidance" style={{ height: 140, borderRadius: 10, marginBottom: 14 }} />
        <h1 style={{ color: GOLD, fontSize: 'clamp(18px,2.4vw,24px)' }}>Mentor Review</h1>
        <p style={{ fontSize: 12, color: 'rgba(229,226,225,0.6)' }}>Educational guidance only — this is never an official competition score.</p>

        <div role="group" aria-label="Readiness status" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '10px 0' }}>
          {READINESS.map(r => (
            <button key={r} type="button" aria-pressed={readiness === r} onClick={() => setReadiness(r)}
              style={{ minHeight: 40, padding: '6px 14px', borderRadius: 14, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize', fontFamily: 'inherit',
                border: `1px solid ${readiness === r ? GOLD : BORDER}`, background: readiness === r ? 'rgba(233,193,118,0.15)' : 'transparent', color: readiness === r ? GOLD : CREAM }}>
              {r.replace('_', ' ')}
            </button>
          ))}
        </div>

        {FIELDS.map(([key, label, placeholder]) => (
          <div key={key} style={{ marginBottom: 12 }}>
            <label htmlFor={`mr-${key}`} style={{ display: 'block', fontSize: 12, color: 'rgba(229,226,225,0.6)', marginBottom: 4 }}>{label}</label>
            <textarea id={`mr-${key}`} value={fields[key] || ''} onChange={e => setFields(prev => ({ ...prev, [key]: e.target.value }))}
              placeholder={placeholder}
              style={{ width: '100%', minHeight: 70, resize: 'vertical', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 13 }} />
          </div>
        ))}

        {error && <p role="alert" style={{ color: DANGER, fontSize: 12 }}>{error}</p>}
        {message && <p role="status" style={{ color: OK, fontSize: 12 }}>{message}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={handleSave} style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1px solid ${BORDER}`, background: 'transparent', color: CREAM, cursor: 'pointer', fontFamily: 'inherit' }}>Save Draft</button>
          <button type="button" onClick={handleSubmit} style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit' }}>Submit Review</button>
        </div>
      </div>
    </div>
    </SmokeCraftScreenShell>
  )
}
