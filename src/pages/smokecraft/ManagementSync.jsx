import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const NAT_W = 1448
const NAT_H = 1086

export default function ManagementSync() {
  const { awardSessionRewards } = useGuestSession()
  const navigate = useNavigate()

  function handleComplete() {
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
      />

      <SmokeCraftNavBar
        primary="Complete SmokeCraft Journey →"
        onPrimary={handleComplete}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
