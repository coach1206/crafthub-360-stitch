import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import StaffHandoffButton from '../components/staffhandoff/StaffHandoffButton.jsx'
import { loadGuestResumeState } from '../services/staffHandoffResumeService.js'

export default function StaffPinHandoff() {
  const [params] = useSearchParams()
  const target = params.get('target') === 'eat' ? 'eat' : 'pos'
  const resume = useMemo(() => loadGuestResumeState(), [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#060402',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#E9C176',
      fontFamily: 'Georgia, serif',
    }}>
      <StaffHandoffButton
        startOpen
        allowedDestinations={[target]}
        resumeRouteOverride={resume?.currentRoute || '/smokecraft'}
      />
    </div>
  )
}
