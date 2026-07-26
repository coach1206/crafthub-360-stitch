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

export default function FirstThird({ onBack, onComplete } = {}) {
  const { awardSessionRewards, setFirstThirdTasting } = useGuestSession()
  const { journey, setFirstThird } = useSmokeCraftJourney()
  const navigate = useNavigate()

  // Load from canonical journey state
  const [checked,    setChecked]    = useState(() => journey.firstThird?.notesSelected || [])
  const [notes,      setNotes]      = useState(() => journey.firstThird?.personalNotes || '')
  const [saveStatus, setSaveStatus] = useState('idle')
  const [done,       setDone]       = useState(false)

  // Auto-persist every change to canonical journey state (no private keys)
  useEffect(() => {
    setFirstThird({
      status: 'in_progress',
      source: 'local_only',
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
  }, [checked, notes]) // eslint-disable-line react-hooks/exhaustive-deps

  function toggleItem(id) {
    triggerHaptic('light')
    setChecked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function handleSaveDraft() {
    // State is already persisted via useEffect; confirm immediately
    setSaveStatus('saved')
    triggerHaptic('light')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }

  function handleContinue() {
    if (done) return
    setDone(true)
    const payload = {
      status: 'observe_confirm_step',
      source: 'local_only',
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
    if (onComplete) {
      onComplete()
      return
    }
    awardSessionRewards('first-third')
    navigate('/smokecraft/flavor-memory')
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
              style={{
                padding: '2px 8px', borderRadius: 4,
                border: `1px solid ${saveStatus === 'saved' ? 'rgba(233,193,118,0.5)' : 'rgba(233,193,118,0.3)'}`,
                background: 'transparent',
                color: saveStatus === 'saved' ? GOLD : 'rgba(229,226,225,0.45)',
                fontSize: 'clamp(7px,0.58vw,8px)', fontFamily: 'Georgia, serif',
                cursor: 'pointer', outline: 'none',
              }}
            >
              {saveStatus === 'saved' ? '✓ Saved' : 'Save Draft'}
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

      <SmokeCraftNavBar
        primary="Continue to Second Third →"
        onPrimary={handleContinue}
      />
    </>
  )
}
