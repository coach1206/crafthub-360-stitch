import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

const HOTSPOTS = [
  {
    label: 'Complete SmokeCraft',
    x: 10, y: 75, width: 80, height: 20,
    to: '/smokecraft/session-complete',
  },
]

export default function ManagementSync() {
  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-venue-management-sync.png"
      alt="Management Sync"
      hotspots={HOTSPOTS}
      route="/smokecraft/management-sync"
    />
  )
}
