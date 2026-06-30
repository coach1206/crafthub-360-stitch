import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

const HOTSPOTS = [
  {
    label: 'Continue',
    x: 10, y: 75, width: 80, height: 20,
    to: '/smokecraft/seed-soil',
  },
]

export default function Identity() {
  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-profile-capture.png"
      alt="Profile Capture"
      hotspots={HOTSPOTS}
      route="/smokecraft/identity"
    />
  )
}
