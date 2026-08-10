import ComingSoon from './ComingSoon.jsx'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'

export default function PairingMastery() {
  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <ComingSoon stepLabel="Spirit Pairing Mastery" stepNumber={18} stitch={false} prevRoute="/smokecraft/terroir" nextRoute="/smokecraft/vitola" referenceImage="/assets/smokecraft-reference/approved/smokecraft-pairing-mastery.png" referenceImageAlt="Spirit Pairing Mastery" />
    </SmokeCraftScreenShell>
  )
}
