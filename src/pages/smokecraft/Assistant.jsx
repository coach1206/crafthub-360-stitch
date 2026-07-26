import ComingSoon from './ComingSoon.jsx'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'

export default function Assistant() {
  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <ComingSoon
        stepLabel="SmokeCraft Assistant"
        stepNumber={3}
        totalSteps={4}
        stitch={false}
        prevRoute="/smokecraft/enroll"
        nextRoute="/smokecraft/golden-box"
      />
    </SmokeCraftScreenShell>
  )
}
