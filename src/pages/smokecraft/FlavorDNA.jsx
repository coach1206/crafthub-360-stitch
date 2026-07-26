import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'

export default function FlavorDNA() {
  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <SmokeCraftAssetScreen src="/assets/smokecraft-reference/approved/smokecraft-flavor-dna.png" alt="Flavor DNA" />
    </SmokeCraftScreenShell>
  )
}
