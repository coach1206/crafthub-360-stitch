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

const ENRICHMENT_16 = getEducationalEnrichment(16)

const NAT_W = 1448
const NAT_H = 1086

const GOLD = '#E9C176'

// Section 1 — 4 focus cards (stacked vertically, y≈29.4–51.4%)
const FOCUS_ZONES = [
  { id: 'aroma-strength',   label: 'Aroma Strength',   x: 10.0, y: 29.4, w: 80.0, h: 4.8 },
  { id: 'flavor-intensity', label: 'Flavor Intensity', x: 10.0, y: 35.2, w: 80.0, h: 4.8 },
  { id: 'burn-quality',     label: 'Burn Quality',     x: 10.0, y: 41.0, w: 80.0, h: 4.8 },
  { id: 'aftertaste',       label: 'Aftertaste',       x: 10.0, y: 46.8, w: 80.0, h: 4.8 },
]

// Section 2 — 10 flavor note cards (2 rows of 5)
const FLAVOR_ZONES = [
  { id: 'earth',   label: 'Earth',   x: 10.0, y: 57.0, w: 15.0, h: 7.0 },
  { id: 'leather', label: 'Leather', x: 26.5, y: 57.0, w: 15.0, h: 7.0 },
  { id: 'wood',    label: 'Wood',    x: 43.0, y: 57.0, w: 15.0, h: 7.0 },
  { id: 'spice',   label: 'Spice',   x: 59.5, y: 57.0, w: 15.0, h: 7.0 },
  { id: 'coffee',  label: 'Coffee',  x: 76.0, y: 57.0, w: 14.0, h: 7.0 },
  { id: 'cocoa',   label: 'Cocoa',   x: 10.0, y: 65.5, w: 15.0, h: 7.0 },
  { id: 'sweet',   label: 'Sweet',   x: 26.5, y: 65.5, w: 15.0, h: 7.0 },
  { id: 'creamy',  label: 'Creamy',  x: 43.0, y: 65.5, w: 15.0, h: 7.0 },
  { id: 'nuts',    label: 'Nuts',    x: 59.5, y: 65.5, w: 15.0, h: 7.0 },
  { id: 'floral',  label: 'Floral',  x: 76.0, y: 65.5, w: 14.0, h: 7.0 },
]

const EMPTY = { selectedFlavors: [], focusSelected: [], savedAt: null }
const ACTIVITY_KEY = 'final-third'

// The server's tasting-draft vocabulary for final-third is one combined
// notesSelected array — split back into the two client-side groups
// (flavor-wheel ids vs. focus-card ids) using FLAVOR_ZONES membership,
// mirroring the same split the server enforces during evidence
// submission (see tastingObservationService.js VALID_NOTE_IDS).
function splitNotes(notesSelected) {
  const flavorIds = new Set(FLAVOR_ZONES.map(z => z.id))
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

  return (
    <>
      <SmokeCraftImageBoundsOverlay
        src={SC_ASSETS.finalThird}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt="SmokeCraft Final Third — Complete Your Tasting Journey"
      >
        {/* Nav mask */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '12%',
          background: 'linear-gradient(to bottom, transparent, #050505 50%)', pointerEvents: 'none', zIndex: 2 }} />

        {/* Section 1: focus cards */}
        {FOCUS_ZONES.map(zone => {
          const active = (ft.focusSelected || []).includes(zone.id)
          return (
            <button
              key={zone.id}
              type="button"
              aria-label={`${zone.label}${active ? ' (selected)' : ''}`}
              aria-pressed={active}
              onClick={() => toggleFocus(zone.id)}
              style={{
                position: 'absolute',
                left: `${zone.x}%`, top: `${zone.y}%`,
                width: `${zone.w}%`, height: `${zone.h}%`,
                pointerEvents: 'auto',
                background: 'transparent',
                border: active ? `2.5px solid ${GOLD}` : '2.5px solid transparent',
                borderRadius: 3,
                cursor: 'pointer',
                boxSizing: 'border-box',
                padding: 0,
              }}
            >
              {active && (
                <span style={{
                  position: 'absolute', top: 2, right: 6,
                  fontSize: 'clamp(9px,1.0vw,12px)', fontWeight: 700,
                  color: GOLD, lineHeight: 1, pointerEvents: 'none',
                }}>✓</span>
              )}
            </button>
          )
        })}

        {/* Section 2: flavor note cards */}
        {FLAVOR_ZONES.map(zone => {
          const active = ft.selectedFlavors.includes(zone.id)
          return (
            <button
              key={zone.id}
              type="button"
              aria-label={`${zone.label} flavor${active ? ' (selected)' : ''}`}
              aria-pressed={active}
              data-flavor={zone.id}
              onClick={() => toggleFlavor(zone.id)}
              style={{
                position: 'absolute',
                left: `${zone.x}%`, top: `${zone.y}%`,
                width: `${zone.w}%`, height: `${zone.h}%`,
                pointerEvents: 'auto',
                background: 'transparent',
                border: active ? `2.5px solid ${GOLD}` : '2.5px solid transparent',
                borderRadius: 4,
                cursor: 'pointer',
                boxSizing: 'border-box',
                padding: 0,
              }}
            >
              {active && (
                <span style={{
                  position: 'absolute', top: 4, right: 5,
                  fontSize: 'clamp(9px,1.0vw,12px)', fontWeight: 700,
                  color: GOLD, lineHeight: 1, pointerEvents: 'none',
                }}>✓</span>
              )}
            </button>
          )
        })}

        {/* Notes panel */}
        <div style={{
          position: 'absolute', left: '3%', top: '75%', width: '94%', height: '10%',
          background: '#050505', border: '1px solid rgba(233,193,118,0.22)',
          borderRadius: 5, boxSizing: 'border-box',
          padding: 'clamp(4px,0.7vw,8px) clamp(6px,0.9vw,12px)',
          display: 'flex', flexDirection: 'column', gap: 3, pointerEvents: 'auto', zIndex: 3,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 'clamp(7px,0.58vw,8px)', color: 'rgba(233,193,118,0.5)',
              textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Georgia, serif' }}>
              Final Third Observations
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
            value={personalNotes}
            onChange={e => setPersonalNotes(e.target.value)}
            placeholder="Final impressions, aftertaste, would you smoke again…"
            aria-label="Final third personal notes"
            style={{
              flex: 1, resize: 'none', background: 'transparent',
              border: 'none', outline: 'none', color: 'rgba(229,226,225,0.8)',
              fontSize: 'clamp(8px,0.72vw,10px)', fontFamily: 'Georgia, serif', lineHeight: 1.4,
            }}
          />
        </div>
      </SmokeCraftImageBoundsOverlay>

      <SmokeCraftLessonInfoButton
        sessionNumber={16} totalSessions={TOTAL_SESSIONS} phase={4} totalPhases={TOTAL_VISITS}
        title="Flavor Finish" whyItMatters={ENRICHMENT_16?.whyItMatters} goldenBox={ENRICHMENT_16?.goldenBox}
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
        primary={done ? 'Saving…' : 'Continue to Scorecard →'}
        onPrimary={handleContinue}
        primaryDisabled={done}
      />
    </>
  )
}
