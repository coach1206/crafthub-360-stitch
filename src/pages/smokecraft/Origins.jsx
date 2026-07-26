import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'

export default function Origins() {
  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <SmokeCraftAssetScreen
        src="/assets/smokecraft-reference/approved/smokecraft-origins.png"
        alt="Origins"
      />
    </SmokeCraftScreenShell>
  )
}
