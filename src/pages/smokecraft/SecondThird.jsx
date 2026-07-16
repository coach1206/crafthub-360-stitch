import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const NAT_W = 1672
const NAT_H = 941

const GOLD = '#E9C176'

const EXPLORE_ZONES = [
  { id: 'Flavor Development', x:  3.0, y: 25.1, w: 14.5, h: 11.0 },
  { id: 'Body Evolution',     x: 19.0, y: 25.1, w: 14.5, h: 11.0 },
  { id: 'Aroma Depth',        x: 35.0, y: 25.1, w: 14.5, h: 11.0 },
  { id: 'Burn Stability',     x: 51.0, y: 25.1, w: 14.5, h: 11.0 },
  { id: 'Smoke Texture',      x: 67.0, y: 25.1, w: 14.5, h: 11.0 },
  { id: 'Complexity Shift',   x: 83.0, y: 25.1, w: 14.5, h: 11.0 },
]

export default function SecondThird() {
  const { awardSessionRewards, setSecondThirdTasting } = useGuestSession()
  const { journey, setSecondThird } = useSmokeCraftJourney()
  const navigate = useNavigate()

  // Load from canonical journey state
  const [checked,    setChecked]    = useState(() => journey.secondThird?.notesSelected || [])
  const [notes,      setNotes]      = useState(() => journey.secondThird?.personalNotes || '')
  const [saveStatus, setSaveStatus] = useState('idle')
  const [done,       setDone]       = useState(false)

  // Auto-persist every change to canonical journey state
  useEffect(() => {
    setSecondThird({
      status: 'in_progress',
      source: 'local_only',
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
  }, [checked, notes]) // eslint-disable-line react-hooks/exhaustive-deps

  function toggleItem(id) {
    triggerHaptic('light')
    setChecked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function handleSaveDraft() {
    // State already persisted via useEffect; confirm immediately
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
      notesSelected: checked, notesCount: checked.length,
      personalNotes: notes,
      rating: null, hasRating: false,
      flavorDevelopment: null, strengthChange: null,
      bodyChange: null, ashQuality: null,
      pairingReaction: null, mentorTip: null, mentorName: null,
    }
    setSecondThirdTasting(payload)
    setSecondThird(payload)
    awardSessionRewards('second-third')
    navigate('/smokecraft/mentor-commentary')
  }

  return (
    <>
      <SmokeCraftImageBoundsOverlay
        src={SC_ASSETS.secondThird}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt="SmokeCraft Second Third — Flavor Development"
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
          background: 'rgba(5,5,5,0.88)', border: '1px solid rgba(233,193,118,0.22)',
          borderRadius: 5, boxSizing: 'border-box',
          padding: 'clamp(4px,0.7vw,8px) clamp(6px,0.9vw,12px)',
          display: 'flex', flexDirection: 'column', gap: 3, pointerEvents: 'auto', zIndex: 3,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 'clamp(7px,0.58vw,8px)', color: 'rgba(233,193,118,0.5)',
              textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Georgia, serif' }}>
              Second Third Observations
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
            placeholder="How did the cigar evolve? Body, flavors, burn behavior…"
            aria-label="Second third personal notes"
            style={{
              flex: 1, resize: 'none', background: 'transparent',
              border: 'none', outline: 'none', color: 'rgba(229,226,225,0.8)',
              fontSize: 'clamp(8px,0.72vw,10px)', fontFamily: 'Georgia, serif', lineHeight: 1.4,
            }}
          />
        </div>
      </SmokeCraftImageBoundsOverlay>

      <SmokeCraftNavBar
        primary="Continue to Flavor Memory →"
        onPrimary={handleContinue}
      />
    </>
  )
}
