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

/**
 * Final Third — /smokecraft/final-third (Session 16/17/18)
 *
 * TWO-GENERATION MIGRATION — replaces SmokeCraftImageBoundsOverlay (4
 * focus-card zones + 10 flavor-note zones drawn into the baked image)
 * with the shared live-DOM card system already established across
 * Format / First Third / Second Third. No decorative image used, same
 * as those precedents.
 *
 * IMPORTANT: this is the screen root-caused earlier in this project as
 * the real reason Scorecard capture automation appeared to fail —
 * handleContinue() requires at least one selected note (flavor or
 * focus) or it silently blocks with an inline error. Every flavor
 * button below keeps its exact `aria-label="${label} flavor"` and
 * `data-flavor={id}` attributes so existing capture/verification
 * scripts (which target `button[aria-label="Earth flavor"]`) continue
 * to work unchanged.
 *
 * All logic preserved verbatim: splitNotes/combinedNotesForSave,
 * server-authoritative draft load/retry, debounced autosave with
 * 409-conflict adoption, toggleFlavor/toggleFocus, and the
 * submitTastingObservation-gated handleContinue.
 */

const ENRICHMENT_16 = getEducationalEnrichment(16)

const FOCUS_ITEMS = [
  { id: 'aroma-strength',   label: 'Aroma Strength',   icon: '👃' },
  { id: 'flavor-intensity', label: 'Flavor Intensity',  icon: '🔥' },
  { id: 'burn-quality',     label: 'Burn Quality',      icon: '📏' },
  { id: 'aftertaste',       label: 'Aftertaste',        icon: '👅' },
]

const FLAVOR_ITEMS = [
  { id: 'earth',   label: 'Earth' },
  { id: 'leather', label: 'Leather' },
  { id: 'wood',    label: 'Wood' },
  { id: 'spice',   label: 'Spice' },
  { id: 'coffee',  label: 'Coffee' },
  { id: 'cocoa',   label: 'Cocoa' },
  { id: 'sweet',   label: 'Sweet' },
  { id: 'creamy',  label: 'Creamy' },
  { id: 'nuts',    label: 'Nuts' },
  { id: 'floral',  label: 'Floral' },
]

const EMPTY = { selectedFlavors: [], focusSelected: [], savedAt: null }
const ACTIVITY_KEY = 'final-third'

// The server's tasting-draft vocabulary for final-third is one combined
// notesSelected array — split back into the two client-side groups
// (flavor-wheel ids vs. focus-card ids) using FLAVOR_ITEMS membership,
// mirroring the same split the server enforces during evidence
// submission (see tastingObservationService.js VALID_NOTE_IDS).
function splitNotes(notesSelected) {
  const flavorIds = new Set(FLAVOR_ITEMS.map(z => z.id))
  const selectedFlavors = notesSelected.filter(id => flavorIds.has(id))
  const focusSelected = notesSelected.filter(id => !flavorIds.has(id))
  return { selectedFlavors, focusSelected }
}

export default function FinalThird({ onBack, onComplete } = {}) {
  const { awardSessionRewards, setFinalThirdTasting, submitTastingObservation, loadTastingDraft, saveTastingDraft } = useGuestSession()
  const { setFinalThird } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const [phase, setPhase] = useState('loading')
  const [ft, setFt] = useState({ ...EMPTY })
  const [personalNotes, setPersonalNotes] = useState('')
  const [draftVersion, setDraftVersion] = useState(0)
  const [saveStatus, setSaveStatus] = useState('idle')
  const [draftLocked, setDraftLocked] = useState(false)
  const [done, setDone] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    let cancelled = false
    loadTastingDraft(ACTIVITY_KEY).then(result => {
      if (cancelled) return
      if (!result.ok) { setPhase('error'); return }
      const d = result.draftData || {}
      const { selectedFlavors, focusSelected } = splitNotes(d.notesSelected || [])
      setFt({ ...EMPTY, selectedFlavors, focusSelected })
      setPersonalNotes(d.personalNotes || '')
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
      const { selectedFlavors, focusSelected } = splitNotes(d.notesSelected || [])
      setFt({ ...EMPTY, selectedFlavors, focusSelected })
      setPersonalNotes(d.personalNotes || '')
      setDraftVersion(result.version || 0)
      setPhase('ready')
    })
  }

  useEffect(() => {
    if (phase !== 'ready') return
    setFinalThird(ft)
  }, [phase, ft]) // eslint-disable-line react-hooks/exhaustive-deps

  const combinedNotesForSave = [...ft.selectedFlavors, ...(ft.focusSelected || [])]

  useEffect(() => {
    if (phase !== 'ready' || done || draftLocked) return
    const t = setTimeout(() => {
      setSaveStatus('saving')
      saveTastingDraft(ACTIVITY_KEY, { notesSelected: combinedNotesForSave, personalNotes }, draftVersion).then(result => {
        if (result.alreadyCompleted) { setSaveStatus('idle'); setDraftLocked(true); return }
        if (result.conflict) {
          const { selectedFlavors, focusSelected } = splitNotes(result.current.draftData?.notesSelected || [])
          setFt(prev => ({ ...prev, selectedFlavors, focusSelected }))
          setPersonalNotes(result.current.draftData?.personalNotes || '')
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
  }, [phase, ft, personalNotes, done, draftVersion, draftLocked])

  function toggleFlavor(id) {
    triggerHaptic('light')
    setFt(prev => ({
      ...prev,
      selectedFlavors: prev.selectedFlavors.includes(id)
        ? prev.selectedFlavors.filter(x => x !== id)
        : [...prev.selectedFlavors, id],
    }))
  }

  function toggleFocus(id) {
    triggerHaptic('light')
    setFt(prev => ({
      ...prev,
      focusSelected: (prev.focusSelected || []).includes(id)
        ? (prev.focusSelected || []).filter(x => x !== id)
        : [...(prev.focusSelected || []), id],
    }))
  }

  function handleSaveDraft() {
    if (phase !== 'ready' || done || draftLocked) return
    triggerHaptic('light')
    setSaveStatus('saving')
    saveTastingDraft(ACTIVITY_KEY, { notesSelected: combinedNotesForSave, personalNotes }, draftVersion).then(result => {
      if (result.alreadyCompleted) { setSaveStatus('idle'); setDraftLocked(true); return }
      if (result.conflict) {
        const { selectedFlavors, focusSelected } = splitNotes(result.current.draftData?.notesSelected || [])
        setFt(prev => ({ ...prev, selectedFlavors, focusSelected }))
        setPersonalNotes(result.current.draftData?.personalNotes || '')
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
    const combinedNotes = [...ft.selectedFlavors, ...(ft.focusSelected || [])]
    if (combinedNotes.length === 0) {
      setSubmitError('Select at least one observation before continuing.')
      return
    }
    setSubmitError(null)
    setDone(true)
    triggerHaptic('medium')

    const payload = {
      status: ft.selectedFlavors.length > 0 ? 'complete' : 'observe_confirm_step',
      source: 'interactive',
      tasteProfileSource: ft.selectedFlavors.length > 0 ? 'guest_selected' : 'not_collected',
      safeClaim: ft.selectedFlavors.length > 0
        ? 'Guest selected final-third flavor notes'
        : 'Guest confirmed observation — no tasting input captured',
      notesSelected: ft.selectedFlavors,
      notesCount: ft.selectedFlavors.length,
      focusSelected: ft.focusSelected || [],
      overallRating: null,
      hasOverallRating: false,
      finalStrength: null, finalBody: null, finishLength: null,
      drawQuality: null, burnQuality: null, ashColor: null, smokeTexture: null,
      heatHarshness: null, burnFinish: null,
      finalPairingReaction: null, wouldSmokeAgain: null, pairingMatchScore: null,
      personalNotes,
      savedAt: Date.now(),
    }

    setFinalThirdTasting(payload)
    setFinalThird(payload)

    const result = await submitTastingObservation('final-third', combinedNotes, personalNotes)
    if (!result.ok) {
      setDone(false)
      setSubmitError('Unable to save your observations right now. Please try again.')
      return
    }
    if (onComplete) {
      onComplete()
      return
    }
    awardSessionRewards('final-third')
    navigate('/smokecraft/scorecard')
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
        <div style={heroBannerStyle}>
          <div aria-hidden="true" style={{ fontSize: 40 }}>🏁</div>
          <div>
            <div style={{ fontSize: 11, color: GOLD_DIM, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>SmokeCraft 360 — Final Third</div>
            <h1 style={{ margin: '4px 0 6px', color: CREAM, fontSize: 'clamp(26px,3.4vw,36px)' }}>Complete Your Tasting Journey</h1>
            <p style={{ margin: 0, maxWidth: 760, color: 'rgba(229,226,225,.68)', lineHeight: 1.55, fontSize: 'clamp(13px,1.4vw,16px)' }}>
              This is where the cigar reveals its finish. Rate how the experience closed, then select every flavor note you picked up along the way.
            </p>
          </div>
        </div>

        <section style={{ ...cardStyle, padding: 'clamp(18px,2.4vw,26px)' }}>
          <div style={sectionLabelStyle}>Closing Impressions</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
            {FOCUS_ITEMS.map(item => {
              const active = (ft.focusSelected || []).includes(item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`${item.label}${active ? ' (selected)' : ''}`}
                  aria-pressed={active}
                  onClick={() => toggleFocus(item.id)}
                  style={{
                    minHeight: 68, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
                    borderRadius: 10, border: `1px solid ${active ? GOLD : BORDER}`,
                    background: active ? 'rgba(233,193,118,.12)' : GLASS,
                    color: CREAM, cursor: 'pointer', fontFamily: 'Georgia, serif', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 20 }} aria-hidden="true">{item.icon}</span>
                  <span style={{ flex: 1, fontWeight: 700, color: active ? GOLD : CREAM, fontSize: 13.5 }}>{item.label}</span>
                  {active && <span style={{ color: GOLD, fontWeight: 700 }}>✓</span>}
                </button>
              )
            })}
          </div>
        </section>

        <section style={{ ...cardStyle, padding: 'clamp(18px,2.4vw,26px)' }}>
          <div style={sectionLabelStyle}>Flavor Notes — select every note you picked up</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10, marginTop: 12 }}>
            {FLAVOR_ITEMS.map(item => {
              const active = ft.selectedFlavors.includes(item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`${item.label} flavor${active ? ' (selected)' : ''}`}
                  aria-pressed={active}
                  data-flavor={item.id}
                  onClick={() => toggleFlavor(item.id)}
                  style={{
                    minHeight: 56, padding: '10px 8px', borderRadius: 10,
                    border: `1px solid ${active ? GOLD : BORDER}`,
                    background: active ? 'rgba(233,193,118,.14)' : GLASS,
                    color: active ? GOLD : CREAM, cursor: 'pointer', fontFamily: 'Georgia, serif',
                    fontWeight: 700, fontSize: 13, textAlign: 'center',
                  }}
                >
                  {active ? '✓ ' : ''}{item.label}
                </button>
              )
            })}
          </div>
        </section>

        <section style={{ ...cardStyle, padding: 'clamp(18px,2.4vw,26px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={sectionLabelStyle}>Final Third Observations</div>
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
            value={personalNotes}
            onChange={e => setPersonalNotes(e.target.value)}
            placeholder="Final impressions, aftertaste, would you smoke again…"
            aria-label="Final third personal notes"
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
        sessionNumber={16} totalSessions={TOTAL_SESSIONS} phase={4} totalPhases={TOTAL_VISITS}
        title="Flavor Finish" whyItMatters={ENRICHMENT_16?.whyItMatters} goldenBox={ENRICHMENT_16?.goldenBox}
      />

      <SmokeCraftNavBar
        primary={done ? 'Saving…' : 'Continue to Scorecard →'}
        onPrimary={handleContinue}
        primaryDisabled={done}
        secondary="← Back"
        onSecondary={onBack || (() => navigate(-1))}
      />
    </SmokeCraftScreenShell>
  )
}
