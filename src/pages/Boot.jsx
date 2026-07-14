import { useState, useEffect, useCallback } from 'react'
import { useNavigate }    from 'react-router-dom'
import { useDemoMode }    from '../context/DemoModeContext.jsx'
import NoveeImageBoundsOverlay from '../components/novee/NoveeImageBoundsOverlay.jsx'
import { NOVEE_ASSETS }   from '../constants/noveeAssets.js'
import { getEntryStatus, openModule, startDemoSession } from '../api/noveeEntryApi.js'

const NAT_W = 1829
const NAT_H = 860

const srOnly = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
}

const NOTICE_STYLE = {
  position: 'absolute',
  bottom: '0.5%',
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'rgba(10,10,12,0.88)',
  color: '#e9c176',
  fontFamily: '"JetBrains Mono", monospace',
  fontSize: 11,
  letterSpacing: '0.08em',
  padding: '6px 16px',
  borderRadius: 6,
  border: '1px solid rgba(212,175,55,0.35)',
  pointerEvents: 'none',
  zIndex: 10,
  maxWidth: '80%',
  textAlign: 'center',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

function Hotspot({ label, onClick, style, disabled }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : onClick}
      style={{
        position: 'absolute',
        background: 'transparent',
        border: '2px solid transparent',
        borderRadius: 6,
        padding: 0,
        cursor: disabled ? 'default' : 'pointer',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        pointerEvents: 'auto',
        opacity: disabled ? 0.45 : 1,
        ...style,
      }}
    >
      <span style={srOnly}>{label}</span>
    </button>
  )
}

// Safe human-readable error from API failure code
function friendlyMessage(code, message) {
  if (code === 'UNAUTHORIZED')    return 'Login required to access this module.'
  if (code === 'MODULE_DISABLED') return 'This module is currently unavailable.'
  if (code === 'MAINTENANCE')     return 'This module is undergoing maintenance.'
  if (code === 'SESSION_EXPIRED') return 'Your session has expired. Please log in again.'
  if (code === 'INVALID_MODULE')  return 'Unknown module.'
  return message || 'Access denied.'
}

export default function Boot() {
  const navigate = useNavigate()
  const { enterDemoMode } = useDemoMode()

  const [status,  setStatus]  = useState(null)   // entry status from backend
  const [notice,  setNotice]  = useState('')      // small in-image notice
  const [loading, setLoading] = useState(false)   // request in-flight

  // Load entry status on mount
  useEffect(() => {
    getEntryStatus()
      .then(({ data }) => setStatus(data))
      .catch(() => {
        // Network unavailable — surface offline notice, allow graceful degradation
        setStatus({ offline: true, modules: {}, demoMode: { available: true, active: false } })
        setNotice('Offline — some modules may be unavailable.')
      })
  }, [])

  const clearNotice = useCallback(() => setNotice(''), [])

  async function handleModuleClick(moduleId) {
    if (loading) return
    clearNotice()

    // Offline graceful fallback — navigate directly (server cannot be reached)
    if (status?.offline) {
      const fallback = { novee: '/home', crafthub: '/crafthub', smokecraft: '/smokecraft' }
      sessionStorage.setItem('novee_booted', '1')
      navigate(fallback[moduleId] || '/')
      return
    }

    setLoading(true)
    try {
      const { ok, data } = await openModule(moduleId)
      if (ok && data.success) {
        sessionStorage.setItem('novee_booted', '1')
        navigate(data.route)
      } else {
        setNotice(friendlyMessage(data.code, data.message))
      }
    } catch {
      setNotice('Unable to reach server. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDemoMode() {
    if (loading) return
    clearNotice()

    // Offline fallback
    if (status?.offline) {
      sessionStorage.setItem('novee_booted', '1')
      enterDemoMode()
      navigate('/home', { replace: true })
      return
    }

    setLoading(true)
    try {
      const { ok, data } = await startDemoSession()
      if (ok && data.success) {
        sessionStorage.setItem('novee_booted', '1')
        // Sync frontend demo context so SmokeCraftSessionGuard/ProtectedRoute
        // UI state matches (server cookie is the authoritative source)
        enterDemoMode()
        navigate('/home', { replace: true })
      } else {
        setNotice(data.message || 'Demo mode is unavailable.')
      }
    } catch {
      // Fallback: allow demo mode even if backend is unreachable
      sessionStorage.setItem('novee_booted', '1')
      enterDemoMode()
      navigate('/home', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  // Derive per-module disabled state from backend status
  const mods = status?.modules || {}
  const noveeDisabled     = status && !status.offline && mods.novee?.authorized     === false
  const crafthubDisabled  = status && !status.offline && mods.crafthub?.authorized  === false
  const smokecraftDisabled = status && !status.offline && mods.smokecraft?.authorized === false

  return (
    <NoveeImageBoundsOverlay
      src={NOVEE_ASSETS.loungeInterface}
      naturalW={NAT_W}
      naturalH={NAT_H}
      alt="NOVEE OS — Private Experience Layer"
    >
      {/* Printed card: ENTER NOVEE OS */}
      <Hotspot
        label="Enter NOVEE OS"
        onClick={() => handleModuleClick('novee')}
        disabled={noveeDisabled || loading}
        style={{ left: '18.9%', top: '26.5%', width: '48.2%', height: '10.8%' }}
      />

      {/* Printed card: ENTER CRAFTHUB 360 */}
      <Hotspot
        label="Enter CraftHub 360"
        onClick={() => handleModuleClick('crafthub')}
        disabled={crafthubDisabled || loading}
        style={{ left: '18.9%', top: '39.5%', width: '48.2%', height: '11.0%' }}
      />

      {/* Printed card: ENTER SMOKECRAFT 360 */}
      <Hotspot
        label="Enter SmokeCraft 360"
        onClick={() => handleModuleClick('smokecraft')}
        disabled={smokecraftDisabled || loading}
        style={{ left: '18.9%', top: '52.6%', width: '48.2%', height: '11.0%' }}
      />

      {/* Printed: DEMO MODE button */}
      <Hotspot
        label="Demo Mode"
        onClick={handleDemoMode}
        disabled={loading}
        style={{ left: '36.7%', top: '65.1%', width: '11.6%', height: '5.5%' }}
      />

      {/* Small accessible status notice — does not cover printed cards */}
      {notice && (
        <div role="alert" aria-live="polite" style={NOTICE_STYLE}>
          {notice}
        </div>
      )}
    </NoveeImageBoundsOverlay>
  )
}
