import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'

const HOTSPOTS = [
  {
    label: 'Continue to Intake',
    x: 10, y: 75, width: 80, height: 20,
    to: '/smokecraft/identity',
  },
]

export default function Enroll() {
  return (
    <SmokeCraftAssetRoute
      src="/assets/smokecraft-reference/approved/smokecraft-entry-gate.png"
      alt="Enroll"
      hotspots={HOTSPOTS}
      route="/smokecraft/enroll"
    />
  )
}
