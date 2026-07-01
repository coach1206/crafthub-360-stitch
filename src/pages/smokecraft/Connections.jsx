import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

const HOTSPOTS = [
  {
    label: 'Continue to Management Sync',
    x: 10, y: 75, width: 80, height: 20,
    to: '/smokecraft/management-sync',
  },
]

export default function Connections() {
  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-passport-connection.png"
      alt="Connections"
      hotspots={HOTSPOTS}
      route="/smokecraft/connections"
    />
  )
}
