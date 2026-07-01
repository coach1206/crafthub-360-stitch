import { useLocation } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext.jsx'

// Public routes render unconditionally regardless of auth state — this is
// a passive, non-blocking visual confirmation that "/api/auth/me" coming
// back 401 (no session) is expected here, not an error. It never gates
// rendering of its siblings.
const PUBLIC_ROUTES = new Set(['/', '/boot', '/home', '/crafthub'])

export default function PublicSessionNotice() {
  const location = useLocation()
  const authCtx = useContext(AuthContext)

  if (!PUBLIC_ROUTES.has(location.pathname)) return null
  if (authCtx?.isLoading) return null
  if (authCtx?.isAuthenticated) return null

  return (
    <div
      style={{
        position: 'fixed', bottom: 12, right: 12, zIndex: 40,
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '5px 12px', borderRadius: 16,
        background: 'rgba(10,8,5,0.85)', border: '1px solid rgba(212,175,55,0.25)',
        color: 'rgba(212,175,55,0.7)', fontFamily: '"JetBrains Mono", monospace',
        fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
        pointerEvents: 'none',
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(91,143,201,0.8)' }} />
      Public demo mode active
    </div>
  )
}
