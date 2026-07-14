import { useState, useEffect, useCallback } from 'react'
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

const LS_KEY = 'sc_flavor_memory_v1'

// 8 flavor note cards in a horizontal row (y≈29.3–43.5%)
const FLAVOR_ZONES = [
  { id: 'earth',  label: 'Earth',  x: 10.5, y: 29.3, w: 9.7, h: 14.2 },
  { id: 'wood',   label: 'Wood',   x: 21.0, y: 29.3, w: 9.7, h: 14.2 },
  { id: 'spice',  label: 'Spice',  x: 31.5, y: 29.3, w: 9.7, h: 14.2 },
  { id: 'cocoa',  label: 'Cocoa',  x: 42.0, y: 29.3, w: 9.7, h: 14.2 },
  { id: 'coffee', label: 'Coffee', x: 52.5, y: 29.3, w: 9.7, h: 14.2 },
  { id: 'sweet',  label: 'Sweet',  x: 63.0, y: 29.3, w: 9.7, h: 14.2 },
  { id: 'nuts',   label: 'Nuts',   x: 73.5, y: 29.3, w: 9.7, h: 14.2 },
  { id: 'floral', label: 'Floral', x: 84.0, y: 29.3, w: 9.7, h: 14.2 },
]

const EMPTY_STATE = {
  selectedFlavors: [],
  intensity: 3, body: 3, strength: 3,
  aromaNotes: [], pairingRecall: '', personalNotes: '',
  savedAt: null, saveStatus: 'neutral', persistenceMode: null,
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? { ...EMPTY_STATE, ...JSON.parse(raw) } : { ...EMPTY_STATE }
  } catch { return { ...EMPTY_STATE } }
}
function saveLocal(s) {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ ...s, savedAt: s.savedAt || Date.now() })) } catch {}
}

export default function FlavorMemory() {
  const { awardSessionRewards, session } = useGuestSession()
  const { setFlavorMemory } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const [fm, setFm] = useState(loadLocal)
  const [done, setDone] = useState(false)

  useEffect(() => {
    saveLocal(fm)
    setFlavorMemory(fm)
  }, [fm]) // eslint-disable-line react-hooks/exhaustive-deps

  function toggleFlavor(id) {
    triggerHaptic('light')
    setFm(prev => ({
      ...prev,
      selectedFlavors: prev.selectedFlavors.includes(id)
        ? prev.selectedFlavors.filter(x => x !== id)
        : [...prev.selectedFlavors, id],
    }))
  }

  const saveToBackend = useCallback(async (data) => {
    try {
      await fetch('/api/modules/smokecraft/pairing/flavor-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session?.sessionId || 'local-session',
          userId: session?.guestId || 'guest',
          flavorNotes: data.selectedFlavors,
          aromaNotes: data.aromaNotes,
          strengthPerception: data.strength,
          bodyPerception: data.body,
          finishLength: data.intensity,
          memoryTags: data.selectedFlavors,
        }),
      })
    } catch {}
  }, [session])

  const saveToPassport = useCallback(async (data) => {
    try {
      await fetch('/api/passport-360/smokecraft/flavor-memory/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: session?.guestId || 'guest',
          sourceSessionId: session?.sessionId || 'local-session',
          tasteTags: data.selectedFlavors,
          tastingNotes: data.personalNotes,
          flavorProfileSource: 'guest_interactive',
          dataQualityStatus: data.selectedFlavors.length > 0 ? 'valid' : 'empty',
        }),
      })
    } catch {}
  }, [session])

  async function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')

    const snapshot = { ...fm, savedAt: Date.now() }
    setFm(prev => ({ ...prev, savedAt: snapshot.savedAt }))

    try {
      sessionStorage.setItem('smokecraftFlavorMemory', JSON.stringify({
        status: fm.selectedFlavors.length > 0 ? 'guest_input_collected' : 'skipped',
        source: 'interactive',
        backendConnected: true,
        tasteTags: fm.selectedFlavors,
        aromaNotes: fm.aromaNotes,
        strengthPerception: fm.strength,
        bodyPerception: fm.body,
        intensity: fm.intensity,
        pairingRecall: fm.pairingRecall,
        personalNotes: fm.personalNotes,
        savedAt: snapshot.savedAt,
      }))
    } catch {}

    await Promise.all([saveToBackend(snapshot), saveToPassport(snapshot)])
    awardSessionRewards('flavor-memory')
    navigate('/smokecraft/final-third')
  }

  return (
    <>
      <SmokeCraftImageBoundsOverlay
        src={SC_ASSETS.flavorMemory}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt="SmokeCraft Flavor Memory — Capture Your Sensory Experience"
      >
        {FLAVOR_ZONES.map(zone => {
          const active = fm.selectedFlavors.includes(zone.id)
          return (
            <button
              key={zone.id}
              type="button"
              aria-label={`${zone.label} flavor${active ? ' (selected)' : ''}`}
              aria-pressed={active}
              onClick={() => toggleFlavor(zone.id)}
              style={{
                position: 'absolute',
                left: `${zone.x}%`, top: `${zone.y}%`,
                width: `${zone.w}%`, height: `${zone.h}%`,
                pointerEvents: 'auto',
                background: active ? 'rgba(233,193,118,0.18)' : 'transparent',
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
        primary={done ? 'Saving…' : 'Continue to Final Third →'}
        onPrimary={handleContinue}
      />
    </>
  )
}
