import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CommandHub } from '../components/commandhub/CommandHub.jsx'
import { useDemoMode } from '../context/DemoModeContext.jsx'
import { useSecurity } from '../context/SecurityContext.jsx'

export default function Home() {
  const navigate = useNavigate()
  const { isDemoMode, enterDemoMode } = useDemoMode()
  const { roleLabel } = useSecurity()

  useEffect(() => {
    document.body.classList.add('leather-texture')
    return () => document.body.classList.remove('leather-texture')
  }, [])

  function handleDemoMode() {
    enterDemoMode()
    navigate('/home', { replace: true })
  }

  return (
    <CommandHub
      navigate={navigate}
      isDemoMode={isDemoMode}
      onDemo={handleDemoMode}
      roleLabel={roleLabel}
    />
  )
}
