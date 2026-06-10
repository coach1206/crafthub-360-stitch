import ComingSoon from './ComingSoon.jsx'

export default function Assistant() {
  return (
    <ComingSoon
      stepLabel="SmokeCraft Assistant"
      stepNumber={3}
      totalSteps={4}
      stitch={false}
      prevRoute="/smokecraft/enroll"
      nextRoute="/smokecraft/golden-box"
    />
  )
}
