import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'
import SmokeCraftMenuButton from '../../components/smokecraft/SmokeCraftMenuButton.jsx'

export default function PairingLab() {
  const { awardSessionRewards } = useGuestSession()

  const HOTSPOTS = [
    {
      label: 'Continue to Visit Complete',
      x: 10, y: 75, width: 80, height: 20,
      onClick: () => { triggerHaptic('medium'); awardSessionRewards('pairing-lab') },
      to: '/smokecraft/visit-complete',
    },
  ]

  return (
    <>
      <SmokeCraftAssetRoute
        src="/assets/smokecraft-reference/approved/smokecraft-pairing-lab.png"
        alt="Pairing Lab"
        hotspots={HOTSPOTS}
        route="/smokecraft/pairing-lab"
      />
      <SmokeCraftMenuButton label="Order Pairing" />
    </>
  )
}
