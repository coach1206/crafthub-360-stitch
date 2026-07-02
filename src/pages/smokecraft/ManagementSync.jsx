import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

export default function ManagementSync() {
  const { awardSessionRewards } = useGuestSession()

  const HOTSPOTS = [
    {
      label: 'Complete SmokeCraft',
      x: 10, y: 75, width: 80, height: 20,
      onClick: () => { triggerHaptic('medium'); awardSessionRewards('management-sync') },
      to: '/smokecraft/session-complete',
    },
  ]

  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-venue-management-sync.png"
      alt="Management Sync"
      hotspots={HOTSPOTS}
      route="/smokecraft/management-sync"
    />
  )
}
