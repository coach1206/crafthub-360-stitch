import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'

export default function FlavorMemory() {
  const navigate = useNavigate()
  const { completeStep, addXP } = useGuestSession()
  const [done, setDone] = useState(false)

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    completeStep('flavor-memory')
    addXP(75)
    navigate('/smokecraft/final-third')
  }

  return (
    <div onClick={handleContinue} role="button" tabIndex={0} style={{ cursor: 'pointer' }}>
      <SmokeCraftAssetScreen
        src="/assets/smokecraft-reference/approved/smokecraft-flavor-memory.png"
        alt="Flavor Memory"
      />
    </div>
  )
}
