import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import SmokeCraftLessonInfoButton from '../../components/smokecraft/SmokeCraftLessonInfoButton.jsx'
import { getEducationalEnrichment } from '../../constants/smokecraftEducationalEnrichment.js'
import { TOTAL_SESSIONS, TOTAL_VISITS } from '../../constants/session.js'
import {
  GOLD, GOLD_DIM, CREAM, BORDER, GLASS,
  heroBannerStyle, pageShellStyle, cardStyle, sectionLabelStyle,
} from '../../constants/smokecraftLiveScreenTokens.js'
import SmokeCraftHeroCrop from '../../components/smokecraft/SmokeCraftHeroCrop.jsx'

/**
 * Second Third — /smokecraft/second-third (Session 12/13)
 *
 * TWO-GENERATION MIGRATION — same conversion as First Third: replaces
 * SmokeCraftImageBoundsOverlay (6 observation zones drawn into the baked
 * image) with the shared live-DOM card system. No decorative image is
 * used, matching the Format/First Third precedent. All logic preserved
 * verbatim.
 */

const ENRICHMENT_12 = getEducationalEnrichment(12)

const EXPLORE_ITEMS = [
  { id: 'Flavor Development', icon: '🍯', desc: 'How the flavor profile is shifting from the opening third.' },
  { id: 'Body Evolution',     icon: '⚖️', desc: 'Whether the body is building, holding, or easing.' },
  { id: 'Aroma Depth',        icon: '🌫️', desc: 'How the aroma has deepened or changed character.' },
  { id: 'Burn Stability',     icon: '🔥', desc: 'Whether the burn line is staying even.' },
  { id: 'Smoke Texture',      icon: '💨', desc: 'The density and feel of the smoke itself.' },
  { id: 'Complexity Shift',   icon: '🎯', desc: 'Any new layers or notes joining the profile.' },
]

const ACTIVITY_KEY = 'second-third'

export default function SecondThird({ onBack, onComplete } = {}) {
  const { awardSessionRewards, setSecondThirdTasting, submitTastingObservation, loadTastingDraft, saveTastingDraft } = useGuestSession()
  const { setSecondThird } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const [phase,      setPhase]      = useState('loading')
  const [checked,    setChecked]    = useState([])
  const [notes,      setNotes]      = useState('')
  const [draftVersion, setDraftVersion] = useState(0)
  const [saveStatus, setSaveStatus] = useState('idle')
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

  useEffect(() => {
    if (phase !== 'ready') return
    setSecondThird({
      status: 'in_progress',
      source: 'server_draft',
      tasteProfileSource: checked.length > 0 ? 'guest_selected' : 'not_collected',
      safeClaim: checked.length > 0
        ? 'Guest confirmed observations — selections captured'
        : 'Guest observing — not yet confirmed',
      notesSelected: checked,
      notesCount: checked.length,
      personalNotes: notes,
      rating: null, hasRating: false,
      flavorDevelopment: null, strengthChange: null,
      bodyChange: null, ashQuality: null,
      pairingReaction: null, mentorTip: null, mentorName: null,
    })
  }, [phase, checked, notes]) // eslint-disable-line react-hooks/exhaustive-deps

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
      notesSelected: checked, notesCount: checked.length,
      personalNotes: notes,
      rating: null, hasRating: false,
      flavorDevelopment: null, strengthChange: null,
      bodyChange: null, ashQuality: null,
      pairingReaction: null, mentorTip: null, mentorName: null,
    }
    setSecondThirdTasting(payload)
    setSecondThird(payload)

    // Force a final, synchronous draft save before submitting evidence —
    // the debounced autosave (1200ms) may not have fired yet if Continue
    // is clicked quickly after a selection, which silently left the
    // server-side draft stale/empty even though real evidence was
    // submitted below, making the selection appear "lost" on revisit.
    // Best-effort — never blocks the real evidence submission.
    saveTastingDraft(ACTIVITY_KEY, { notesSelected: checked, personalNotes: notes }, draftVersion).catch(() => {})

    const result = await submitTastingObservation('second-third', checked, notes)
    if (!result.ok) {
      setDone(false)
      setSubmitError('Unable to save your observations right now. Please try again.')
      return
    }
    if (onComplete) {
      onComplete()
      return
    }
    awardSessionRewards('second-third')
    navigate('/smokecraft/mentor-commentary')
  }

  if (phase === 'loading') {
    return (
      <div role="status" aria-live="polite" style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', background: '#050505', color: 'rgba(229,226,225,.7)', fontFamily: 'Georgia, serif' }}>
        Loading your saved observations…
      </div>
    )
  }
  if (phase === 'error') {
    return (
      <div role="alert" style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: '#050505', color: 'rgba(229,170,100,0.9)', fontFamily: 'Georgia, serif' }}>
        <p style={{ margin: 0 }}>Something went wrong loading your saved observations.</p>
        <button type="button" onClick={handleRetryLoad} style={{ minHeight: 44, padding: '0 18px', borderRadius: 20, border: `1px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={pageShellStyle}>
        <SmokeCraftHeroCrop assetKey="ownerSecondThirdHero" label="The second third of a lit cigar" bgPosition="center" bgSize="cover" />
        <div style={heroBannerStyle}>
          <div aria-hidden="true" style={{ fontSize: 40 }}>🚬</div>
          <div>
            <div style={{ fontSize: 11, color: GOLD_DIM, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>SmokeCraft 360 — Second Third</div>
            <h1 style={{ margin: '4px 0 6px', color: CREAM, fontSize: 'clamp(26px,3.4vw,36px)' }}>Flavor Development</h1>
            <p style={{ margin: 0, maxWidth: 760, color: 'rgba(229,226,225,.68)', lineHeight: 1.55, fontSize: 'clamp(13px,1.4vw,16px)' }}>
              The middle third is where most cigars show their true character. Note how the profile is evolving from the opening third.
            </p>
          </div>
        </div>

        <section style={{ ...cardStyle, padding: 'clamp(18px,2.4vw,26px)' }}>
          <div style={sectionLabelStyle}>Select your observations</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginTop: 14 }}>
            {EXPLORE_ITEMS.map(item => {
              const active = checked.includes(item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`${item.id}${active ? ' (selected)' : ''}`}
                  aria-pressed={active}
                  onClick={() => toggleItem(item.id)}
                  style={{
                    minHeight: 120, padding: 16, textAlign: 'left', borderRadius: 12,
                    border: `1px solid ${active ? GOLD : BORDER}`,
                    background: active ? 'rgba(233,193,118,.12)' : GLASS,
                    color: CREAM, cursor: 'pointer', fontFamily: 'Georgia, serif',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 22 }} aria-hidden="true">{item.icon}</span>
                    {active && <span style={{ color: GOLD, fontWeight: 700 }}>✓</span>}
                  </div>
                  <div style={{ color: GOLD, fontWeight: 700, marginTop: 10, fontSize: 15 }}>{item.id}</div>
                  <p style={{ margin: '6px 0 0', color: 'rgba(229,226,225,.58)', fontSize: 12.5, lineHeight: 1.4 }}>{item.desc}</p>
                </button>
              )
            })}
          </div>
        </section>

        <section style={{ ...cardStyle, padding: 'clamp(18px,2.4vw,26px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={sectionLabelStyle}>Second Third Observations</div>
            <button
              type="button"
              aria-label="Save draft"
              onClick={handleSaveDraft}
              disabled={phase !== 'ready' || done}
              style={{
                minHeight: 36, padding: '4px 14px', borderRadius: 8,
                border: `1px solid ${saveStatus === 'saved' ? GOLD : BORDER}`,
                background: 'transparent',
                color: saveStatus === 'saved' ? GOLD : 'rgba(229,226,225,0.55)',
                fontSize: 12, fontFamily: 'Georgia, serif', cursor: 'pointer',
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
            placeholder="How did the cigar evolve? Body, flavors, burn behavior…"
            aria-label="Second third personal notes"
            rows={4}
            style={{
              width: '100%', boxSizing: 'border-box', marginTop: 12, resize: 'vertical',
              background: '#0d1420', border: `1px solid ${BORDER}`, borderRadius: 8,
              color: 'rgba(229,226,225,0.85)', fontSize: 13.5, fontFamily: 'Georgia, serif',
              lineHeight: 1.5, padding: 12, outline: 'none',
            }}
          />
        </section>

        {submitError && (
          <div role="alert" style={{
            borderRadius: 9, padding: 12, border: '1px solid rgba(255,150,150,.45)',
            background: 'rgba(120,20,20,.35)', color: '#ffdada', fontSize: 13,
          }}>
            {submitError}
          </div>
        )}

        <div style={{ height: 90 }} aria-hidden="true" />
      </div>

      <SmokeCraftLessonInfoButton
        sessionNumber={12} totalSessions={TOTAL_SESSIONS} phase={3} totalPhases={TOTAL_VISITS}
        title="Flavor Evolution" whyItMatters={ENRICHMENT_12?.whyItMatters} goldenBox={ENRICHMENT_12?.goldenBox}
      />

      <SmokeCraftNavBar
        primary={done ? 'Saving…' : 'Continue to Flavor Memory →'}
        onPrimary={handleContinue}
        primaryDisabled={done}
        secondary="← Back"
        onSecondary={onBack || (() => navigate(-1))}
      />
    </SmokeCraftScreenShell>
  )
}
