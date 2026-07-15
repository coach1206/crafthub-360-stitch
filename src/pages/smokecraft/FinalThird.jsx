import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

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

export default function FinalThird() {
  const { awardSessionRewards, setFinalThirdTasting } = useGuestSession()
  const { journey, setFinalThird } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const [ft, setFt] = useState(() => {
    const saved = journey.finalThird
    return saved ? { ...EMPTY, ...saved } : { ...EMPTY }
  })
  const [done, setDone] = useState(false)
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) { initialized.current = true; return }
    setFinalThird(ft)
  }, [ft]) // eslint-disable-line react-hooks/exhaustive-deps

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
      personalNotes: '',
      savedAt: Date.now(),
    }

    setFinalThirdTasting(payload)
    setFinalThird(payload)

    awardSessionRewards('final-third')
    navigate('/smokecraft/scorecard')
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
      </SmokeCraftImageBoundsOverlay>

      <SmokeCraftNavBar
        primary={done ? 'Saving…' : 'Continue to Scorecard →'}
        onPrimary={handleContinue}
      />
    </>
  )
}
