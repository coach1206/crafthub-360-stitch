import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as api from '../../../services/goldenBox/goldenBoxApiClient.js'
import MediaSlot from '../../../components/smokecraft/goldenBox/MediaSlot.jsx'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'
const DANGER = 'rgba(255,150,150,0.9)'
const OK = '#7fd0a3'

// Package 7A — real backend score categories (judgingService.js
// VALID_CATEGORIES). The mandate's own category names (Blend,
// Construction, Draw, Burn, Flavor progression, Balance, Complexity,
// Pairing, Creativity, Presentation) map onto these real, already-live
// categories rather than duplicating the score table with new ones —
// see docs/audits/smokecraft-final-completion/package-7a/05-SCORECARD-MAP.md
// for the full documented mapping.
const CATEGORIES = [
  { key: 'construction', label: 'Construction', why: 'How evenly and securely the cigar is built — firmness, seams, cap security.', good: 'Even firmness along the body, no soft or hard spots, tight seams.', bad: 'Visible soft spots, loose wrapper, uneven cap.' },
  { key: 'draw', label: 'Draw', why: 'Airflow resistance when drawing smoke through the cigar.', good: 'Moderate, even resistance — not tight, not airy.', bad: 'Plugged (too tight) or airy/loose (too easy) draw.' },
  { key: 'burn', label: 'Burn', why: 'How evenly the cigar burns down its length.', good: 'A level, straight burn line requiring few touch-ups.', bad: 'Canoeing, tunneling, or frequent uneven burn.' },
  { key: 'aroma', label: 'Aroma (Blend)', why: 'Cold and lit aroma character of the blend as a whole.', good: 'Aroma consistent with the stated flavor targets.', bad: 'Aroma unrelated to or contradicting the blend story.' },
  { key: 'flavor', label: 'Flavor', why: 'Overall flavor quality and clarity of the blend.', good: 'Clear, identifiable flavor notes matching the presentation.', bad: 'Muddled, harsh, or absent flavor.' },
  { key: 'balance', label: 'Balance', why: 'Whether strength, body, and flavor work together rather than one dominating.', good: 'No single component (e.g. too much ligero) overwhelms the rest.', bad: 'One element dominates unintentionally.' },
  { key: 'complexity', label: 'Complexity', why: 'How many distinct, well-integrated notes the blend presents.', good: 'Multiple identifiable notes that work together.', bad: 'Flat, one-dimensional profile — or, conversely, a chaotic mismatch of unrelated notes.' },
  { key: 'progression', label: 'Flavor Progression', why: 'How the flavor evolves from first to final third.', good: 'A deliberate, coherent progression matching the blend story.', bad: 'No discernible progression, or one that contradicts the stated story.' },
  { key: 'finish', label: 'Finish', why: 'The sensation and flavor that lingers after each puff.', good: 'A clean or deliberately lingering finish appropriate to the blend.', bad: 'An unpleasant, harsh, or absent finish.' },
  { key: 'creativity', label: 'Creativity', why: 'Originality of the blend concept and pairing rationale.', good: 'A distinctive, well-reasoned approach, not a generic combination.', bad: 'Little evident thought behind component choices.' },
  { key: 'rule_compliance', label: 'Presentation (Rule Compliance)', why: 'Whether the entry followed competition requirements and presented a complete, defensible submission.', good: 'All required components present, story and defense clearly written.', bad: 'Missing required components, incomplete or contradictory reasoning.' },
  { key: 'overall_impression', label: 'Overall Impression (incl. Pairing)', why: 'Holistic judgment of the blend, presentation, and pairing rationale together.', good: 'A cohesive, well-defended entry that delivers on its own stated goals.', bad: 'Disjointed choices with no clear connecting thread.' },
]

function ScoreInput({ cat, value, onChange, disabled }) {
  return (
    <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <label htmlFor={`score-${cat.key}`} style={{ fontSize: 13, fontWeight: 700 }}>{cat.label}</label>
        <span style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)' }}>0–10</span>
      </div>
      <p style={{ fontSize: 11, color: 'rgba(229,226,225,0.6)', margin: '4px 0' }}>{cat.why}</p>
      <details style={{ fontSize: 11, color: 'rgba(229,226,225,0.55)', marginBottom: 6 }}>
        <summary style={{ cursor: 'pointer', color: GOLD }}>What to look for</summary>
        <div style={{ marginTop: 4 }}><b>Strong:</b> {cat.good}</div>
        <div><b>Weak:</b> {cat.bad}</div>
      </details>
      <input
        id={`score-${cat.key}`} type="number" min={0} max={10} step={0.5}
        value={value?.score ?? ''} disabled={disabled}
        onChange={e => onChange(cat.key, 'score', e.target.value === '' ? null : Number(e.target.value))}
        aria-label={`${cat.label} score, 0 to 10`}
        style={{ minHeight: 44, width: 90, boxSizing: 'border-box', padding: '8px 10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 14 }}
      />
      <textarea
        value={value?.comment ?? ''} disabled={disabled}
        onChange={e => onChange(cat.key, 'comment', e.target.value)}
        placeholder="Comment (optional)"
        aria-label={`${cat.label} comment`}
        style={{ width: '100%', minHeight: 44, resize: 'vertical', boxSizing: 'border-box', marginTop: 6, padding: '8px 10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 12 }}
      />
    </div>
  )
}

export default function JudgeEntryReview() {
  const { entryId } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState('loading')
  const [entry, setEntry] = useState(null)
  const [currentVersion, setCurrentVersion] = useState(null)
  const [components, setComponents] = useState([])
  const [scorecard, setScorecard] = useState(null)
  const [scores, setScores] = useState({}) // { [category]: { score, comment } }
  const [amending, setAmending] = useState(false)
  const [amendReason, setAmendReason] = useState('')
  const [voidReason, setVoidReason] = useState('')
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  async function load() {
    setState('loading')
    const result = await api.getEntryForJudge(entryId)
    if (!result.ok) { setState(result.status === 403 ? 'forbidden' : 'error'); return }
    setEntry(result.entry)
    setCurrentVersion(result.currentVersion)
    setComponents(result.components || [])
    setScorecard(result.scorecard)
    if (result.scorecard?.scores) {
      const next = {}
      for (const s of result.scorecard.scores) next[s.category] = { score: s.score, comment: s.comment }
      setScores(next)
    }
    setState('ready')
  }
  useEffect(() => { load() }, [entryId]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleScoreChange(category, field, value) {
    setScores(prev => ({ ...prev, [category]: { ...prev[category], [field]: value } }))
  }

  const allScored = CATEGORIES.every(c => typeof scores[c.key]?.score === 'number')
  const locked = scorecard && ['submitted', 'locked'].includes(scorecard.status)

  async function handleSubmit() {
    setError(null)
    const payload = CATEGORIES.map(c => ({ category: c.key, score: scores[c.key].score, maxScore: 10, comment: scores[c.key].comment || undefined }))
    const result = await api.submitScorecard(entryId, payload)
    if (!result.ok) { setError(result.error); return }
    setMessage('Scorecard submitted.')
    await load()
  }

  async function handleLock() {
    const result = await api.lockScorecard(scorecard.id)
    if (!result.ok) { setError(result.error); return }
    setMessage('Scorecard locked.')
    await load()
  }

  async function handleAmend() {
    setError(null)
    if (!amendReason) { setError('amend_reason_required'); return }
    const payload = CATEGORIES.map(c => ({ category: c.key, score: scores[c.key].score, maxScore: 10, comment: scores[c.key].comment || undefined }))
    const result = await api.amendScorecard(scorecard.id, payload, amendReason)
    if (!result.ok) { setError(result.error); return }
    setMessage('Amendment recorded — original scorecard preserved for audit.')
    setAmending(false)
    setAmendReason('')
    await load()
  }

  async function handleVoid() {
    setError(null)
    if (!voidReason) { setError('void_reason_required'); return }
    const result = await api.voidScorecard(scorecard.id, voidReason)
    if (!result.ok) { setError(result.error); return }
    setMessage('Scorecard voided.')
    setVoidReason('')
    await load()
  }

  if (state === 'loading') return <div style={{ position: 'fixed', inset: 0, background: NAVY, color: CREAM, padding: 24 }}>Loading entry…</div>
  if (state === 'forbidden') return <div style={{ position: 'fixed', inset: 0, background: NAVY, color: DANGER, padding: 24 }}>You are not authorized to review this entry.</div>
  if (state === 'error') return <div style={{ position: 'fixed', inset: 0, background: NAVY, color: DANGER, padding: 24 }}>Unable to load this entry.</div>

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'auto', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM }}>
      <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 900, margin: '0 auto' }}>
        <button type="button" onClick={() => navigate('/smokecraft/golden-box/judge')} style={{ background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', marginBottom: 12, fontFamily: 'inherit' }}>← Back to Dashboard</button>
        <MediaSlot assetKey="goldenBoxFinalJudgingRubric" alt="Golden Box final judging rubric" caption="Judging Rubric" style={{ height: 140, borderRadius: 10, marginBottom: 14 }} />
        <h1 style={{ color: GOLD, fontSize: 'clamp(18px,2.4vw,24px)' }}>Entry Review</h1>

        <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, color: GOLD, margin: '0 0 8px' }}>Submitted Components</h2>
          {components.map(c => (
            <div key={c.id} style={{ fontSize: 12, color: 'rgba(229,226,225,0.75)', padding: '3px 0' }}>{c.component_type.replace(/_/g, ' ')}: {c.component_value?.name}</div>
          ))}
          {currentVersion?.presentation_payload?.story && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, color: GOLD, textTransform: 'uppercase' }}>Blend Story</div>
              <p style={{ fontSize: 13 }}>{currentVersion.presentation_payload.story}</p>
            </div>
          )}
          {currentVersion?.pairing_selection?.item && (
            <div style={{ fontSize: 13 }}><b>Suggested Pairing:</b> {currentVersion.pairing_selection.item}</div>
          )}
          {currentVersion?.pairing_defense && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, color: GOLD, textTransform: 'uppercase' }}>Defense</div>
              <p style={{ fontSize: 13 }}>{currentVersion.pairing_defense}</p>
            </div>
          )}
          <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.45)', marginTop: 10 }}>
            AI educational analysis, if configured, is displayed separately from official judging and never determines this score.
          </div>
        </div>

        <h2 style={{ fontSize: 15, color: GOLD }}>Golden Box Judging Scorecard</h2>
        {scorecard && <div style={{ fontSize: 12, marginBottom: 10 }}>Status: <b style={{ color: OK }}>{scorecard.status}</b></div>}

        {CATEGORIES.map(cat => (
          <ScoreInput key={cat.key} cat={cat} value={scores[cat.key]} onChange={handleScoreChange} disabled={locked && !amending} />
        ))}

        {error && <p role="alert" style={{ color: DANGER, fontSize: 12 }}>{error}</p>}
        {message && <p role="status" style={{ color: OK, fontSize: 12 }}>{message}</p>}

        {!scorecard || scorecard.status === 'draft' ? (
          <button type="button" disabled={!allScored} onClick={handleSubmit}
            style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1.5px solid ${allScored ? GOLD : BORDER}`, background: 'transparent', color: allScored ? GOLD : 'rgba(229,226,225,0.35)', cursor: allScored ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
            Submit Scorecard
          </button>
        ) : scorecard.status === 'submitted' ? (
          <button type="button" onClick={handleLock} style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit' }}>
            Lock Scorecard
          </button>
        ) : scorecard.status === 'locked' && !amending ? (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setAmending(true)} style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1px solid ${BORDER}`, background: 'transparent', color: CREAM, cursor: 'pointer', fontFamily: 'inherit' }}>Amend</button>
            <div>
              <input value={voidReason} onChange={e => setVoidReason(e.target.value)} placeholder="Reason for voiding" aria-label="Void reason"
                style={{ minHeight: 40, marginRight: 8, padding: '6px 10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit' }} />
              <button type="button" onClick={handleVoid} style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1px solid ${DANGER}`, background: 'transparent', color: DANGER, cursor: 'pointer', fontFamily: 'inherit' }}>Void Scorecard</button>
            </div>
          </div>
        ) : amending ? (
          <div>
            <label htmlFor="amend-reason" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Reason for amendment (required)</label>
            <input id="amend-reason" value={amendReason} onChange={e => setAmendReason(e.target.value)} aria-label="Amendment reason"
              style={{ minHeight: 44, width: '100%', boxSizing: 'border-box', marginBottom: 8, padding: '8px 10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit' }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setAmending(false)} style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1px solid ${BORDER}`, background: 'transparent', color: CREAM, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button type="button" disabled={!amendReason} onClick={handleAmend} style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: amendReason ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>Save Amendment</button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
