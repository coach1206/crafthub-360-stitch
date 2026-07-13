import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const GOLD = '#E9C176'

const OBSERVATIONS = [
  'Flavor development noted',
  'Burn & draw checked',
  'Strength change observed',
  'Ash quality assessed',
]

export default function SecondThird() {
  const { awardSessionRewards, setSecondThirdTasting } = useGuestSession()
  const { journey, setSecondThird } = useSmokeCraftJourney()
  const navigate = useNavigate()
  const [checked, setChecked] = useState(() => journey.secondThird?.notesSelected || [])
  const [done, setDone] = useState(false)

  function toggleItem(item) {
    triggerHaptic('light')
    setChecked(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item])
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
      rating: null, hasRating: false,
      flavorDevelopment: null, strengthChange: null,
      bodyChange: null, ashQuality: null,
      pairingReaction: null, mentorTip: null, mentorName: null,
    }
    setSecondThirdTasting(payload)
    setSecondThird(payload)
    awardSessionRewards('second-third')
    navigate('/smokecraft/flavor-memory')
  }

  return (
    <>
      <SmokeCraftAssetScreen
        src={SC_ASSETS.secondThird}
        alt="SmokeCraft Second Third — Flavor Development"
        classification="DECORATIVE_BACKGROUND"
      />

      {/* Observation checklist */}
      <div style={{
        position: 'fixed',
        bottom: 110, left: 0, right: 0,
        zIndex: 400,
        padding: '0 16px',
        pointerEvents: 'none',
      }}>
        <div style={{
          pointerEvents: 'auto',
          background: 'rgba(10,6,3,0.94)',
          border: '1px solid rgba(233,193,118,0.2)',
          borderRadius: 12,
          padding: '10px 14px',
          maxWidth: 500,
          margin: '0 auto',
        }}>
          <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            Second Third Observations
          </div>
          {OBSERVATIONS.map(obs => (
            <label key={obs} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 8, cursor: 'pointer', minHeight: 44,
              color: checked.includes(obs) ? GOLD : 'rgba(229,226,225,0.7)',
              fontSize: 16, fontFamily: 'Georgia, serif',
            }}>
              <input
                type="checkbox"
                checked={checked.includes(obs)}
                onChange={() => toggleItem(obs)}
                style={{ width: 20, height: 20, accentColor: GOLD, cursor: 'pointer', flexShrink: 0 }}
              />
              {obs}
            </label>
          ))}
        </div>
      </div>

      <SmokeCraftNavBar
        primary="Continue to Flavor Memory →"
        onPrimary={handleContinue}
      />
    </>
  )
}
