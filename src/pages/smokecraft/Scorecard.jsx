import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

const HOTSPOTS = [
  {
    label: 'Continue to Passport Stamp',
    x: 10, y: 75, width: 80, height: 20,
    to: '/smokecraft/passport-stamp',
  },
]

export default function Scorecard() {
  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-scorecard-ranking.png"
      alt="Scorecard"
      hotspots={HOTSPOTS}
      route="/smokecraft/scorecard"
    />
  )
}
