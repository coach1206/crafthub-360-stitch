import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import SmokeCraftLessonInfoButton from '../../components/smokecraft/SmokeCraftLessonInfoButton.jsx'
import { getEducationalEnrichment } from '../../constants/smokecraftEducationalEnrichment.js'
import { TOTAL_SESSIONS, TOTAL_VISITS } from '../../constants/session.js'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const ENRICHMENT_8 = getEducationalEnrichment(8)

const NAT_W = 1672
const NAT_H = 941

const GOLD = '#E9C176'

const EXPLORE_ZONES = [
  { id: 'Aroma Opening', x:  3.0, y: 25.1, w: 14.5, h: 11.0 },
  { id: 'Draw Ease',     x: 19.0, y: 25.1, w: 14.5, h: 11.0 },
  { id: 'Body Start',    x: 35.0, y: 25.1, w: 14.5, h: 11.0 },
  { id: 'Flavor Notes',  x: 51.0, y: 25.1, w: 14.5, h: 11.0 },
  { id: 'Burn Line',     x: 67.0, y: 25.1, w: 14.5, h: 11.0 },
  { id: 'Ash Quality',   x: 83.0, y: 25.1, w: 14.5, h: 11.0 },
]

const ACTIVITY_KEY = 'first-third'

export default function FirstThird({ onBack, onComplete } = {}) {
  const { awardSessionRewards, setFirstThirdTasting, submitTastingObservation, loadTastingDraft, saveTastingDraft } = useGuestSession()
  const { setFirstThird } = useSmokeCraftJourney()
  const navigate = useNavigate()

  // Package A draft-persistence correction: the server-authoritative
  // draft (smokecraft_tasting_drafts, same table/route Mini Tasting
  // already uses) is the source of truth on entry — localStorage/journey
  // state is never treated as authority. 'loading' | 'error' | 'ready'.
  const [phase,      setPhase]      = useState('loading')
  const [checked,    setChecked]    = useState([])
  const [notes,      setNotes]      = useState('')
  const [draftVersion, setDraftVersion] = useState(0)
  const [saveStatus, setSaveStatus] = useState('idle') // idle | saving | saved | error | conflict
  // Stops further draft writes once the server reports the session is
  // already completed — deliberately separate from `done` (which only
  // guards the Continue button/submission-in-flight state), so revisiting
  // a completed session never leaves Continue stuck showing "Saving…".
  const [draftLocked, setDraftLocked] = useState(false)
  const [done,       setDone]       = useState(false)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    let cancelled = false
    loadTastingDraft(ACTIVITY_KEY).then(result => {
      if (cancelled) return
      if (!result.ok) { setPhase('error'); return }
      const d = result.draftData || {}
      setChecked(d.notesSelected || [])
      setNotes(d.personalNotes || '')
      setDraftVersion(result.version || 0)
      setPhase('ready')
    })
    return () => { cancelled = true }
  }, [loadTastingDraft])

  function handleRetryLoad() {
    setPhase('loading')
    loadTastingDraft(ACTIVITY_KEY).then(result => {
      if (!result.ok) { setPhase('error'); return }
      const d = result.draftData || {}
      setChecked(d.notesSelected || [])
      setNotes(d.personalNotes || '')
      setDraftVersion(result.version || 0)
      setPhase('ready')
    })
  }

  // Mirror the observation into local journey state too (used for the
  // in-progress zone highlighting only — the server draft above remains
  // the authoritative source read on entry/reload).
  useEffect(() => {
    if (phase !== 'ready') return
    setFirstThird({
      status: 'in_progress',
      source: 'server_draft',
      tasteProfileSource: checked.length > 0 ? 'guest_selected' : 'not_collected',
      safeClaim: checked.length > 0
        ? 'Guest confirmed observations — selections captured'
        : 'Guest observing — not yet confirmed',
      notesSelected: checked,
      notesCount: checked.length,
      personalNotes: notes,
      drawRating: null, hasDrawRating: false,
      strength: null, body: null, smokeOutput: null,
      burnQuality: null, pairingReaction: null,
      mentorTip: null, mentorName: null,
    })
  }, [phase, checked, notes]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced server-authoritative draft save — partial observations
  // only, never completion or XP. A 409 (another tab/device saved
  // first, or the session is already completed) adopts the server's
  // current state rather than silently overwriting it.
  useEffect(() => {
    if (phase !== 'ready' || done || draftLocked) return
    const t = setTimeout(() => {
      setSaveStatus('saving')
      saveTastingDraft(ACTIVITY_KEY, { notesSelected: checked, personalNotes: notes }, draftVersion).then(result => {
        if (result.alreadyCompleted) { setSaveStatus('idle'); setDraftLocked(true); return }
        if (result.conflict) {
          setChecked(result.current.draftData?.notesSelected || [])
          setNotes(result.current.draftData?.personalNotes || '')
          setDraftVersion(result.current.version)
          setSaveStatus('conflict')
          return
        }
        if (!result.ok) { setSaveStatus('error'); return }
        setDraftVersion(result.current.version)
        setSaveStatus('saved')
      })
    }, 1200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, checked, notes, done, draftVersion, draftLocked])

  function toggleItem(id) {
    triggerHaptic('light')
    setChecked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function handleSaveDraft() {
    if (phase !== 'ready' || done || draftLocked) return
    triggerHaptic('light')
    setSaveStatus('saving')
    saveTastingDraft(ACTIVITY_KEY, { notesSelected: checked, personalNotes: notes }, draftVersion).then(result => {
      if (result.alreadyCompleted) { setSaveStatus('idle'); setDraftLocked(true); return }
      if (result.conflict) {
        setChecked(result.current.draftData?.notesSelected || [])
        setNotes(result.current.draftData?.personalNotes || '')
        setDraftVersion(result.current.version)
        setSaveStatus('conflict')
        return
      }
      if (!result.ok) { setSaveStatus('error'); return }
      setDraftVersion(result.current.version)
      setSaveStatus('saved')
    })
  }

  async function handleContinue() {
    if (done) return
    if (checked.length === 0) {
      setSubmitError('Select at least one observation before continuing.')
      return
    }
    setSubmitError(null)
    setDone(true)
    const payload = {
      status: 'observe_confirm_step',
      source: 'server_draft',
      tasteProfileSource: checked.length > 0 ? 'guest_selected' : 'not_collected',
      safeClaim: checked.length > 0
        ? 'Guest confirmed observations — selections captured'
        : 'Guest confirmed observation — no tasting input captured',
      notesSelected: checked,
      notesCount: checked.length,
      personalNotes: notes,
      drawRating: null, hasDrawRating: false,
      strength: null, body: null, smokeOutput: null,
      burnQuality: null, pairingReaction: null,
      mentorTip: null, mentorName: null,
    }
    setFirstThirdTasting(payload)
    setFirstThird(payload)

    // Required-Interaction Closure Package A: real tasting evidence
    // must be recorded server-side BEFORE either completion path below
    // runs — completeSession() (reached via onComplete() -> the
    // canonical SmokeCraftScreenRenderer -> awardSessionRewards(), or
    // via the direct awardSessionRewards() call in the fallback branch)
    // independently re-verifies this evidence exists, so this is a
    // real, server-enforced gate, not a client-trusted claim.
    const result = await submitTastingObservation('first-third', checked, notes)
    if (!result.ok) {
      setDone(false)
      setSubmitError('Unable to save your observations right now. Please try again.')
      return
    }
    if (onComplete) {
      onComplete()
      return
    }
    awardSessionRewards('first-third')
    navigate('/smokecraft/flavor-memory')
  }

  if (phase === 'loading') {
    return (
      <div role="status" aria-live="polite" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', color: 'rgba(229,226,225,0.7)', fontFamily: 'Georgia, serif', fontSize: 14 }}>
        Loading your saved observations…
      </div>
    )
  }
  if (phase === 'error') {
    return (
      <div role="alert" style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: '#050505', color: 'rgba(229,170,100,0.9)', fontFamily: 'Georgia, serif', fontSize: 14 }}>
        <p style={{ margin: 0 }}>Something went wrong loading your saved observations.</p>
        <button type="button" onClick={handleRetryLoad} style={{ background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 20, color: GOLD, fontFamily: 'Georgia, serif', fontSize: 13, padding: '8px 18px', cursor: 'pointer', outline: 'none', minHeight: 40 }}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <>
      <SmokeCraftImageBoundsOverlay
        src={SC_ASSETS.firstThird}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt="SmokeCraft First Third — Discover the Opening Expression"
      >
        {/* Nav mask */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '12%',
          background: 'linear-gradient(to bottom, transparent, #050505 50%)', pointerEvents: 'none', zIndex: 2 }} />

        {EXPLORE_ZONES.map(zone => {
          const active = checked.includes(zone.id)
          return (
            <button
              key={zone.id}
              type="button"
              aria-label={`${zone.id}${active ? ' (selected)' : ''}`}
              aria-pressed={active}
              onClick={() => toggleItem(zone.id)}
              style={{
                position: 'absolute', left: `${zone.x}%`, top: `${zone.y}%`,
                width: `${zone.w}%`, height: `${zone.h}%`,
                pointerEvents: 'auto', background: 'transparent',
                border: active ? `2.5px solid ${GOLD}` : '2.5px solid transparent',
                borderRadius: 4, cursor: 'pointer', boxSizing: 'border-box', padding: 0, outline: 'none',
              }}
            >
              {active && (
                <span style={{ position: 'absolute', top: 4, right: 5, fontSize: 'clamp(9px,1.2vw,14px)',
                  fontWeight: 700, color: GOLD, lineHeight: 1, pointerEvents: 'none' }}>✓</span>
              )}
            </button>
          )
        })}

        {/* Notes panel */}
        <div style={{
          position: 'absolute', left: '3%', top: '80%', width: '94%', height: '16%',
          background: '#050505', // was rgba(5,5,5,0.88) — non-opaque, fixed border: '1px solid rgba(233,193,118,0.22)',
          borderRadius: 5, boxSizing: 'border-box',
          padding: 'clamp(4px,0.7vw,8px) clamp(6px,0.9vw,12px)',
          display: 'flex', flexDirection: 'column', gap: 3, pointerEvents: 'auto', zIndex: 3,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 'clamp(7px,0.58vw,8px)', color: 'rgba(233,193,118,0.5)',
              textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Georgia, serif' }}>
              First Third Observations
            </span>
            <button
              type="button"
              aria-label="Save draft"
              onClick={handleSaveDraft}
              disabled={phase !== 'ready' || done}
              style={{
                padding: '2px 8px', borderRadius: 4,
                border: `1px solid ${saveStatus === 'saved' ? 'rgba(233,193,118,0.5)' : 'rgba(233,193,118,0.3)'}`,
                background: 'transparent',
                color: saveStatus === 'saved' ? GOLD : 'rgba(229,226,225,0.45)',
                fontSize: 'clamp(7px,0.58vw,8px)', fontFamily: 'Georgia, serif',
                cursor: 'pointer', outline: 'none',
              }}
            >
              {saveStatus === 'saving' && 'Saving…'}
              {saveStatus === 'saved' && '✓ Saved'}
              {saveStatus === 'error' && 'Retry Save'}
              {saveStatus === 'conflict' && 'Synced'}
              {saveStatus === 'idle' && 'Save Draft'}
            </button>
          </div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="First impressions, aroma, draw feel, opening flavors…"
            aria-label="First third personal notes"
            style={{
              flex: 1, resize: 'none', background: 'transparent',
              border: 'none', outline: 'none', color: 'rgba(229,226,225,0.8)',
              fontSize: 'clamp(8px,0.72vw,10px)', fontFamily: 'Georgia, serif', lineHeight: 1.4,
            }}
          />
        </div>
      </SmokeCraftImageBoundsOverlay>

      <SmokeCraftLessonInfoButton
        sessionNumber={8} totalSessions={TOTAL_SESSIONS} phase={2} totalPhases={TOTAL_VISITS}
        title="First Draw" whyItMatters={ENRICHMENT_8?.whyItMatters} goldenBox={ENRICHMENT_8?.goldenBox}
      />

      {submitError && (
        <div role="alert" style={{
          position: 'absolute', left: '3%', bottom: '17%', width: '94%', zIndex: 4,
          background: 'rgba(120,20,20,0.9)', border: '1px solid rgba(255,150,150,0.5)',
          borderRadius: 6, padding: '6px 10px', color: '#ffdada',
          fontSize: 'clamp(9px,0.8vw,11px)', fontFamily: 'Georgia, serif',
        }}>
          {submitError}
        </div>
      )}

      <SmokeCraftNavBar
        primary={done ? 'Saving…' : 'Continue to Second Third →'}
        onPrimary={handleContinue}
        primaryDisabled={done}
      />
    </>
  )
}
