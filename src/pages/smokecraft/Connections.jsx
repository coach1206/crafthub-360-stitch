import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const NAT_W = 1672
const NAT_H = 941

export default function Connections() {
  const { awardSessionRewards } = useGuestSession()
  const navigate = useNavigate()

  function handleContinue() {
    triggerHaptic('medium')
    awardSessionRewards('connections')
    navigate('/smokecraft/management-sync')
  }

  return (
    <>
      <SmokeCraftImageBoundsOverlay
        src={SC_ASSETS.connections}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt="SmokeCraft Connections — Share & Connect"
      />

      <SmokeCraftNavBar
        primary="Continue to Management Sync →"
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
