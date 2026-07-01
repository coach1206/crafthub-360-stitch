import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

const HOTSPOTS = [
  {
    label: 'Continue to Connections',
    x: 10, y: 75, width: 80, height: 20,
    to: '/smokecraft/connections',
  },
]

export default function PassportStamp() {
  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-passport-stamp.png"
      alt="Passport Stamp"
      hotspots={HOTSPOTS}
      route="/smokecraft/passport-stamp"
    />
  )
}
