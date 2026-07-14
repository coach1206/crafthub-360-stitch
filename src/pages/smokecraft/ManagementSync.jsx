import { useState } from 'react'
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

export default function ManagementSync() {
  const { awardSessionRewards, session } = useGuestSession()
  const { journey } = useSmokeCraftJourney()
  const navigate = useNavigate()
  const [done, setDone] = useState(false)

  const cigar   = journey.selectedCigar
  const pairing = journey.pairing
  const flavors = journey.flavorMemory?.selectedFlavors || []

  function handleComplete() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    awardSessionRewards('management-sync')
    navigate('/smokecraft/session-complete')
  }

  return (
    <>
      <SmokeCraftImageBoundsOverlay
        src={SC_ASSETS.managementSync}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt="SmokeCraft Management Sync — Session Summary"
      >
        {/* Journey data in the summary zone */}
        <div style={{
          position: 'absolute',
          left: '5%', top: '30%',
          width: '55%',
          display: 'flex',
          flexDirection: 'column',
          gap: '2%',
          pointerEvents: 'none',
          fontFamily: 'Georgia, serif',
          fontWeight: 600,
          color: GOLD,
          letterSpacing: '0.03em',
          userSelect: 'none',
          fontSize: 'clamp(10px,1.1vw,15px)',
          lineHeight: 1.4,
        }}>
          {cigar?.name   && <span>{cigar.name}</span>}
          {pairing?.recommendation && <span>{pairing.recommendation}</span>}
          {session?.xp   > 0 && <span>{session.xp} XP</span>}
          {flavors.length > 0 && <span>{flavors.join(', ')}</span>}
        </div>
      </SmokeCraftImageBoundsOverlay>

      <SmokeCraftNavBar
        primary={done ? 'Continuing…' : 'Complete SmokeCraft Journey →'}
        onPrimary={handleComplete}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
