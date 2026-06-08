/**
 * Protected Route — wraps a route element with role/permission checks.
 *
 * Props:
 *   allowedRoles       — array of role strings e.g. ['admin','founder_level_0']
 *   requiredPermission — single permission key e.g. 'access_eat_command'
 *   fallbackRoute      — redirect path (default: '/')
 *   lockedMessage      — custom message on the blocked screen
 *   children           — the protected element
 *
 * Founder Level 0 always passes regardless of allowedRoles / requiredPermission.
 */

import { useSecurity } from '../../context/SecurityContext.jsx'

const GOLD  = '#C9A84C'
const DARK  = '#0a0603'
const CARD  = 'rgba(18,12,5,0.97)'

function AccessRestricted({ message, fallbackRoute = '/' }) {
  return (
    <div style={{
      minHeight:      '100vh',
      background:     DARK,
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '2rem',
      fontFamily:     'Georgia, serif',
    }}>
      {/* Icon */}
      <div style={{ marginBottom: '1.5rem', opacity: 0.5 }}>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '64px', color: GOLD }}
        >
          lock
        </span>
      </div>

      {/* Badge */}
      <div style={{
        background:    'rgba(201,168,76,0.08)',
        border:        `1px solid ${GOLD}44`,
        borderRadius:  '4px',
        padding:       '4px 12px',
        color:         GOLD,
        fontSize:      '10px',
        letterSpacing: '0.2em',
        marginBottom:  '1.5rem',
        textTransform: 'uppercase',
      }}>
        NOVEE OS
      </div>

      {/* Title */}
      <h1 style={{
        color:          GOLD,
        fontSize:       'clamp(1.4rem, 3vw, 2rem)',
        fontWeight:     400,
        letterSpacing:  '0.08em',
        margin:         '0 0 1rem',
        textAlign:      'center',
        textTransform:  'uppercase',
      }}>
        Access Restricted
      </h1>

      {/* Body */}
      <p style={{
        color:      'rgba(201,168,76,0.55)',
        fontSize:   '0.95rem',
        lineHeight: 1.7,
        textAlign:  'center',
        maxWidth:   '400px',
        margin:     '0 0 2rem',
      }}>
        {message || 'This area requires elevated NOVEE OS permissions.'}
      </p>

      {/* Card */}
      <div style={{
        background:   CARD,
        border:       `1px solid ${GOLD}22`,
        borderRadius: '8px',
        padding:      '1.5rem 2rem',
        textAlign:    'center',
        maxWidth:     '360px',
        width:        '100%',
      }}>
        <div style={{ color: 'rgba(201,168,76,0.35)', fontSize: '0.75rem', letterSpacing: '0.12em', marginBottom: '1.25rem' }}>
          WHAT WOULD YOU LIKE TO DO?
        </div>

        {/* Return Home */}
        <a
          href={fallbackRoute}
          style={{
            display:       'block',
            background:    GOLD,
            color:         '#0a0603',
            padding:       '0.75rem 1.5rem',
            borderRadius:  '4px',
            fontFamily:    'Georgia, serif',
            fontSize:      '0.85rem',
            letterSpacing: '0.1em',
            textDecoration: 'none',
            textTransform: 'uppercase',
            marginBottom:  '0.75rem',
            fontWeight:    600,
          }}
        >
          Return Home
        </a>

        {/* Request Access — placeholder for Phase 9 */}
        <button
          onClick={() => alert('Access requests will be available in a future release.')}
          style={{
            display:       'block',
            width:         '100%',
            background:    'transparent',
            border:        `1px solid ${GOLD}44`,
            color:         `${GOLD}88`,
            padding:       '0.75rem 1.5rem',
            borderRadius:  '4px',
            fontFamily:    'Georgia, serif',
            fontSize:      '0.85rem',
            letterSpacing: '0.1em',
            cursor:        'pointer',
            textTransform: 'uppercase',
          }}
        >
          Request Access
        </button>
      </div>
    </div>
  )
}

export default function ProtectedRoute({
  allowedRoles       = [],
  requiredPermission = null,
  fallbackRoute      = '/',
  lockedMessage      = null,
  children,
}) {
  const { role, hasPermission, isFounder } = useSecurity()

  // Founder Level 0 always passes
  if (isFounder()) return children

  let allowed = false
  if (allowedRoles.length > 0) {
    allowed = allowedRoles.includes(role)
  } else if (requiredPermission) {
    allowed = hasPermission(requiredPermission)
  } else {
    // No restriction specified — allow
    allowed = true
  }

  if (!allowed) {
    return <AccessRestricted message={lockedMessage} fallbackRoute={fallbackRoute} />
  }

  return children
}
