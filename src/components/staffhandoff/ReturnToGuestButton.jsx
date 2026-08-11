import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearHandoffMeta, loadGuestResumeState } from '../../services/staffHandoffResumeService.js'

export default function ReturnToGuestButton({ variant = 'dark' }) {
  const navigate = useNavigate()
  const [resume, setResume] = useState(null)

  useEffect(() => {
    setResume(loadGuestResumeState())
  }, [])

  if (!resume?.currentRoute) return null

  const light = variant === 'light'

  function returnToGuest() {
    clearHandoffMeta()
    navigate(resume.currentRoute)
  }

  return (
    <button
      type="button"
      onClick={returnToGuest}
      style={{
        background: light ? 'rgba(19,41,75,0.08)' : 'transparent',
        border: light ? '1px solid rgba(19,41,75,0.18)' : '1px solid rgba(212,168,67,0.18)',
        borderRadius: 8,
        color: light ? '#13294b' : '#d4a843',
        fontSize: 12,
        fontWeight: 700,
        padding: '6px 12px',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      Return to Guest
    </button>
  )
}
