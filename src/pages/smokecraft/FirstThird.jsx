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
 * First Third — /smokecraft/first-third (Session 8/9)
 *
 * TWO-GENERATION MIGRATION — replaces SmokeCraftImageBoundsOverlay (6
 * observation zones drawn into the baked image, real controls positioned
 * as percentage hotspots over them) with the same live-DOM card system
 * already established for Format / Cut, Toast & Light. No approved image
 * asset traces specifically to this screen's interaction surface, so —
 * consistent with the Format precedent — no decorative image is used;
 * the hero banner is a pure CSS/token treatment.
 *
 * All logic preserved verbatim: server-authoritative draft load/retry,
 * debounced draft autosave with 409-conflict adoption, toggleItem,
 * handleSaveDraft, submitTastingObservation-gated handleContinue,
 * onComplete/onBack props, and both loading/error phase screens.
 */

const ENRICHMENT_8 = getEducationalEnrichment(8)

const EXPLORE_ITEMS = [
  { id: 'Aroma Opening', icon: '👃', desc: 'The first scent as the cigar lights and settles.' },
  { id: 'Draw Ease',     icon: '💨', desc: 'How freely air and smoke move through the draw.' },
  { id: 'Body Start',    icon: '🔥', desc: 'The initial weight and intensity on the palate.' },
  { id: 'Flavor Notes',  icon: '🍫', desc: 'Whatever specific flavors surface first.' },
  { id: 'Burn Line',     icon: '📏', desc: 'How even and clean the burn line looks.' },
  { id: 'Ash Quality',   icon: '⚪', desc: 'The color and firmness of the forming ash.' },
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

    // Force a final, synchronous draft save before submitting evidence —
    // the debounced autosave (1200ms) may not have fired yet if Continue
    // is clicked quickly after a selection, which silently left the
    // server-side draft stale/empty even though real evidence was
    // submitted below, making the selection appear "lost" on revisit.
    // Best-effort — never blocks the real evidence submission.
    saveTastingDraft(ACTIVITY_KEY, { notesSelected: checked, personalNotes: notes }, draftVersion).catch(() => {})

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
        <SmokeCraftHeroCrop assetKey="ownerFirstThirdHero" label="The first third of a lit cigar" bgPosition="center" bgSize="cover" />
        <div style={heroBannerStyle}>
          <div aria-hidden="true" style={{ fontSize: 40 }}>🚬</div>
          <div>
            <div style={{ fontSize: 11, color: GOLD_DIM, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>SmokeCraft 360 — First Third</div>
            <h1 style={{ margin: '4px 0 6px', color: CREAM, fontSize: 'clamp(26px,3.4vw,36px)' }}>Discover the Opening Expression</h1>
            <p style={{ margin: 0, maxWidth: 760, color: 'rgba(229,226,225,.68)', lineHeight: 1.55, fontSize: 'clamp(13px,1.4vw,16px)' }}>
              As the cigar settles into its opening third, note whatever stands out. Select every observation that applies — there's no single right answer.
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
            <div style={sectionLabelStyle}>First Third Observations</div>
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
            placeholder="First impressions, aroma, draw feel, opening flavors…"
            aria-label="First third personal notes"
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
        sessionNumber={8} totalSessions={TOTAL_SESSIONS} phase={2} totalPhases={TOTAL_VISITS}
        title="First Draw" whyItMatters={ENRICHMENT_8?.whyItMatters} goldenBox={ENRICHMENT_8?.goldenBox}
      />

      <SmokeCraftNavBar
        primary={done ? 'Saving…' : 'Continue to Second Third →'}
        onPrimary={handleContinue}
        primaryDisabled={done}
        secondary="← Back"
        onSecondary={onBack || (() => navigate(-1))}
      />
    </SmokeCraftScreenShell>
  )
}
