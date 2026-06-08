/**
 * Protected Route — Phase 8.5
 * Route gate with role/permission checks and context-aware login prompts.
 *
 * Props:
 *   allowedRoles       — array of role strings
 *   requiredPermission — single permission key
 *   fallbackRoute      — redirect path (default: '/')
 *   lockedMessage      — custom message on the blocked screen
 *   loginRoute         — if set, shows a "Sign In" button linking here
 *   loginLabel         — label for the login button (default: 'Sign In')
 *   children           — the protected element
 *
 * Founder Level 0 always passes.
 */

import { useSecurity } from '../../context/SecurityContext.jsx'

const GOLD  = '#C9A84C'
const DARK  = '#0a0603'
const CARD  = 'rgba(18,12,5,0.97)'
const DIM   = 'rgba(201,168,76,0.45)'

function AccessRestricted({ message, fallbackRoute = '/', loginRoute, loginLabel = 'Sign In' }) {
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
      <div style={{ marginBottom: '1.5rem', opacity: 0.45 }}>
        <span className="material-symbols-outlined" style={{ fontSize: '64px', color: GOLD }}>
          lock
        </span>
      </div>

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

      <h1 style={{
        color:         GOLD,
        fontSize:      'clamp(1.4rem, 3vw, 2rem)',
        fontWeight:    400,
        letterSpacing: '0.08em',
        margin:        '0 0 1rem',
        textAlign:     'center',
        textTransform: 'uppercase',
      }}>
        Access Restricted
      </h1>

      <p style={{
        color:      DIM,
        fontSize:   '0.95rem',
        lineHeight: 1.7,
        textAlign:  'center',
        maxWidth:   '420px',
        margin:     '0 0 2rem',
      }}>
        {message || 'This area requires elevated NOVEE OS permissions.'}
      </p>

      <div style={{
        background:   CARD,
        border:       `1px solid ${GOLD}22`,
        borderRadius: '8px',
        padding:      '1.5rem 2rem',
        textAlign:    'center',
        maxWidth:     '360px',
        width:        '100%',
      }}>
        <div style={{
          color:         'rgba(201,168,76,0.25)',
          fontSize:      '10px',
          letterSpacing: '0.15em',
          marginBottom:  '1.25rem',
        }}>
          WHAT WOULD YOU LIKE TO DO?
        </div>

        {/* Login button — shown when a login route is provided */}
        {loginRoute && (
          <a
            href={loginRoute}
            style={{
              display:        'block',
              background:     GOLD,
              color:          '#0a0603',
              padding:        '0.75rem 1.5rem',
              borderRadius:   '4px',
              fontFamily:     'Georgia, serif',
              fontSize:       '0.85rem',
              letterSpacing:  '0.1em',
              textDecoration: 'none',
              textTransform:  'uppercase',
              marginBottom:   '0.75rem',
              fontWeight:     600,
            }}
          >
            {loginLabel}
          </a>
        )}

        {/* Return Home */}
        <a
          href={fallbackRoute}
          style={{
            display:        'block',
            background:     loginRoute ? 'transparent' : GOLD,
            color:          loginRoute ? `${GOLD}88` : '#0a0603',
            border:         loginRoute ? `1px solid ${GOLD}33` : 'none',
            padding:        '0.75rem 1.5rem',
            borderRadius:   '4px',
            fontFamily:     'Georgia, serif',
            fontSize:       '0.85rem',
            letterSpacing:  '0.1em',
            textDecoration: 'none',
            textTransform:  'uppercase',
            marginBottom:   loginRoute ? '0.75rem' : '0',
            fontWeight:     loginRoute ? 400 : 600,
          }}
        >
          Return Home
        </a>

        {/* Request Access placeholder */}
        <button
          onClick={() => alert('Access requests will be available in a future release.')}
          style={{
            display:       'block',
            width:         '100%',
            background:    'transparent',
            border:        `1px solid ${GOLD}22`,
            color:         `${GOLD}44`,
            padding:       '0.75rem 1.5rem',
            borderRadius:  '4px',
            fontFamily:    'Georgia, serif',
            fontSize:      '0.75rem',
            letterSpacing: '0.1em',
            cursor:        'pointer',
            textTransform: 'uppercase',
            marginTop:     '0.5rem',
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
  loginRoute         = null,
  loginLabel         = 'Sign In',
  children,
}) {
  const { role, hasPermission, isFounder } = useSecurity()

  if (isFounder()) return children

  let allowed = false
  if (allowedRoles.length > 0) {
    allowed = allowedRoles.includes(role)
  } else if (requiredPermission) {
    allowed = hasPermission(requiredPermission)
  } else {
    allowed = true
  }

  if (!allowed) {
    return (
      <AccessRestricted
        message={lockedMessage}
        fallbackRoute={fallbackRoute}
        loginRoute={loginRoute}
        loginLabel={loginLabel}
      />
    )
  }

  return children
}
