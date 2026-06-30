import { useNavigate } from 'react-router-dom'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'

export default function HowItWorks() {
  const navigate = useNavigate()

  function handleStart() {
    triggerHaptic('medium')
    navigate('/smokecraft/enroll')
  }

  return (
    <div onClick={handleStart} role="button" tabIndex={0} style={{ cursor: 'pointer' }}>
      <SmokeCraftAssetScreen
        src="/assets/smokecraft-reference/approved/smokecraft-how-it-works.png"
        alt="How SmokeCraft Works"
      />
    </div>
  )
}
