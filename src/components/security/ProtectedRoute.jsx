/**
 * Protected Route — Phase 10 (Auth v2)
 * Route gate with role/permission checks, demo-mode blocking,
 * and context-aware login prompts.
 *
 * Props:
 *   allowedRoles       — array of role strings
 *   requiredPermission — single permission key
 *   fallbackRoute      — redirect path (default: '/')
 *   lockedMessage      — custom message on the blocked screen
 *   loginRoute         — if set, shows a "Sign In" button linking here
 *   loginLabel         — label for the login button (default: 'Sign In')
 *   demoBlocked        — if true and demo mode is active, shows demo-restricted screen
 *   children           — the protected element
 *
 * Founder Level 0 always passes role/permission checks.
 * Demo Mode always blocks demoBlocked routes regardless of role.
 */

import { useState } from 'react'
import { useSecurity }  from '../../context/SecurityContext.jsx'
import { useDemoMode }  from '../../context/DemoModeContext.jsx'
import RequestAccessModal from './RequestAccessModal.jsx'

const GOLD = '#C9A84C'
const DARK = '#0a0603'
const CARD = 'rgba(18,12,5,0.97)'
const DIM  = 'rgba(201,168,76,0.45)'

// ── Blocked screen variants ───────────────────────────────────

function DemoRestricted({ fallbackRoute = '/' }) {
  return (
    <div style={{
      minHeight: '100vh', background: DARK,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '2rem', fontFamily: 'Georgia, serif',
    }}>
      <div style={{ marginBottom: '1.5rem', opacity: 0.4 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 64, color: GOLD }}>visibility_off</span>
      </div>

      <div style={{
        background: 'rgba(201,168,76,0.08)', border: `1px solid ${GOLD}44`,
        borderRadius: 4, padding: '4px 12px', color: GOLD,
        fontSize: 10, letterSpacing: '0.2em', marginBottom: '1.5rem', textTransform: 'uppercase',
      }}>
        DEMO MODE ACTIVE
      </div>

      <h1 style={{
        color: GOLD, fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', fontWeight: 400,
        letterSpacing: '0.08em', margin: '0 0 1rem', textAlign: 'center', textTransform: 'uppercase',
      }}>
        Not Available in Demo
      </h1>

      <p style={{
        color: DIM, fontSize: '0.9rem', lineHeight: 1.7,
        textAlign: 'center', maxWidth: '400px', margin: '0 0 2rem',
      }}>
        This area is restricted to authenticated staff and is not included in the public demo preview.
      </p>

      <div style={{
        background: CARD, border: `1px solid ${GOLD}22`,
        borderRadius: 8, padding: '1.5rem 2rem', textAlign: 'center', maxWidth: 340, width: '100%',
      }}>
        <a
          href={fallbackRoute}
          style={{
            display: 'block', background: GOLD, color: '#0a0603',
            padding: '0.75rem 1.5rem', borderRadius: 4, fontFamily: 'Georgia, serif',
            fontSize: '0.85rem', letterSpacing: '0.1em', textDecoration: 'none',
            textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.75rem',
          }}
        >
          Return to Demo
        </a>
        <div style={{
          fontSize: 10, letterSpacing: '0.12em', color: 'rgba(201,168,76,0.25)',
          fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase',
        }}>
          Exit demo mode from the top-right banner
        </div>
      </div>
    </div>
  )
}

function AccessRestricted({ message, fallbackRoute = '/', loginRoute, loginLabel = 'Sign In', currentRole }) {
  const [showModal, setShowModal]   = useState(false)
  const [submitted, setSubmitted]   = useState(false)

  return (
    <div style={{
      minHeight: '100vh', background: DARK,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '2rem', fontFamily: 'Georgia, serif',
    }}>
      <div style={{ marginBottom: '1.5rem', opacity: 0.45 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 64, color: GOLD }}>lock</span>
      </div>

      <div style={{
        background: 'rgba(201,168,76,0.08)', border: `1px solid ${GOLD}44`,
        borderRadius: 4, padding: '4px 12px', color: GOLD,
        fontSize: 10, letterSpacing: '0.2em', marginBottom: '1.5rem', textTransform: 'uppercase',
      }}>
        NOVEE OS
      </div>

      <h1 style={{
        color: GOLD, fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 400,
        letterSpacing: '0.08em', margin: '0 0 1rem', textAlign: 'center', textTransform: 'uppercase',
      }}>
        Access Restricted
      </h1>

      <p style={{
        color: DIM, fontSize: '0.95rem', lineHeight: 1.7,
        textAlign: 'center', maxWidth: 420, margin: '0 0 2rem',
      }}>
        {message || 'This area requires elevated NOVEE OS permissions.'}
      </p>

      <div style={{
        background: CARD, border: `1px solid ${GOLD}22`,
        borderRadius: 8, padding: '1.5rem 2rem',
        textAlign: 'center', maxWidth: 360, width: '100%',
      }}>
        <div style={{
          color: 'rgba(201,168,76,0.25)', fontSize: 10,
          letterSpacing: '0.15em', marginBottom: '1.25rem',
        }}>
          WHAT WOULD YOU LIKE TO DO?
        </div>

        {loginRoute && (
          <a
            href={loginRoute}
            style={{
              display: 'block', background: GOLD, color: '#0a0603',
              padding: '0.75rem 1.5rem', borderRadius: 4, fontFamily: 'Georgia, serif',
              fontSize: '0.85rem', letterSpacing: '0.1em', textDecoration: 'none',
              textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 600,
            }}
          >
            {loginLabel}
          </a>
        )}

        <a
          href={fallbackRoute}
          style={{
            display: 'block',
            background:     loginRoute ? 'transparent' : GOLD,
            color:          loginRoute ? `${GOLD}88` : '#0a0603',
            border:         loginRoute ? `1px solid ${GOLD}33` : 'none',
            padding:        '0.75rem 1.5rem', borderRadius: 4, fontFamily: 'Georgia, serif',
            fontSize:       '0.85rem', letterSpacing: '0.1em', textDecoration: 'none',
            textTransform:  'uppercase',
            marginBottom:   loginRoute ? '0.75rem' : 0,
            fontWeight:     loginRoute ? 400 : 600,
          }}
        >
          Return Home
        </a>

        {submitted ? (
          <div style={{
            marginTop: '0.75rem', padding: '0.75rem',
            borderRadius: 6, background: 'rgba(201,168,76,0.06)',
            border: `1px solid ${GOLD}22`,
            color: 'rgba(201,168,76,0.6)', fontSize: 11,
            letterSpacing: '0.05em', fontFamily: '"JetBrains Mono", monospace',
          }}>
            Request submitted — an admin will review within 24 hours.
          </div>
        ) : (
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'block', width: '100%', background: 'transparent',
              border: `1px solid ${GOLD}22`, color: `${GOLD}55`,
              padding: '0.75rem 1.5rem', borderRadius: 4, fontFamily: 'Georgia, serif',
              fontSize: '0.75rem', letterSpacing: '0.1em', cursor: 'pointer',
              textTransform: 'uppercase', marginTop: '0.5rem',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${GOLD}44`; e.currentTarget.style.color = `${GOLD}88` }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = `${GOLD}22`; e.currentTarget.style.color = `${GOLD}55` }}
          >
            Request Access
          </button>
        )}
      </div>

      {showModal && (
        <RequestAccessModal
          fromRoute={typeof window !== 'undefined' ? window.location.pathname : null}
          currentRole={currentRole}
          onClose={() => setShowModal(false)}
          onSubmitted={() => { setShowModal(false); setSubmitted(true) }}
        />
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

export default function ProtectedRoute({
  allowedRoles       = [],
  requiredPermission = null,
  fallbackRoute      = '/',
  lockedMessage      = null,
  loginRoute         = null,
  loginLabel         = 'Sign In',
  demoBlocked        = true,
  children,
}) {
  const { role, hasPermission, isFounder } = useSecurity()
  const { isDemoMode, isDemoBlocked }      = useDemoMode()
  const path = typeof window !== 'undefined' ? window.location.pathname : ''

  // Founder master access always passes — checked before demo-mode blocking
  // so founder is never redirected away from internal pages, even in demo.
  // isFounder() resolves through SecurityContext, which prefers the
  // backend-verified JWT session (AuthContext) over any local fallback.
  if (isFounder()) return children

  // Demo mode check — blocks restricted routes regardless of role
  if (isDemoMode && demoBlocked && isDemoBlocked(path)) {
    return <DemoRestricted fallbackRoute={fallbackRoute} />
  }

  // Role / permission check
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
        currentRole={role}
      />
    )
  }

  return children
}
