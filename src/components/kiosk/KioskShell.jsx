/**
 * KioskShell — Phase 11
 * Wraps content when kiosk mode is active.
 * Intercepts blocked routes and shows the "Route Locked" screen.
 */

import { useLocation, useNavigate } from 'react-router-dom'
import { useKiosk, KIOSK_ALLOWED_ROUTES } from '../../context/KioskContext.jsx'
import KioskExitGate from './KioskExitGate.jsx'
import { useState } from 'react'

const GOLD = '#C9A84C'
const DARK = '#050505'

function RouteLocked({ deviceType, onUnlock, onReturn }) {
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
      textAlign:      'center',
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: '64px', color: GOLD, opacity: 0.5, marginBottom: '1.5rem' }}>
        lock
      </span>

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
        NOVEE OS · KIOSK MODE
      </div>

      <h1 style={{
        color:         GOLD,
        fontSize:      'clamp(1.4rem, 3vw, 2rem)',
        fontWeight:    400,
        letterSpacing: '0.08em',
        margin:        '0 0 1rem',
        textTransform: 'uppercase',
      }}>
        Route Locked for This Device
      </h1>

      <p style={{
        color:      'rgba(201,168,76,0.45)',
        fontSize:   '0.95rem',
        lineHeight: 1.7,
        maxWidth:   '420px',
        margin:     '0 0 2.5rem',
      }}>
        This device is assigned to a specific NOVEE OS experience.
        Access to this area is restricted on this terminal.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: '320px' }}>
        <button
          onClick={onReturn}
          style={{
            background:    GOLD,
            color:         DARK,
            border:        'none',
            padding:       '1rem 1.5rem',
            borderRadius:  '6px',
            fontFamily:    'Georgia, serif',
            fontSize:      '0.9rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor:        'pointer',
            fontWeight:    600,
            minHeight:     '52px',
          }}
        >
          Return to Assigned Experience
        </button>

        <button
          onClick={onUnlock}
          style={{
            background:    'transparent',
            color:         `${GOLD}88`,
            border:        `1px solid ${GOLD}33`,
            padding:       '1rem 1.5rem',
            borderRadius:  '6px',
            fontFamily:    'Georgia, serif',
            fontSize:      '0.85rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor:        'pointer',
            minHeight:     '52px',
          }}
        >
          Staff Unlock
        </button>
      </div>
    </div>
  )
}

export default function KioskShell({ children }) {
  const { config, isRouteAllowed } = useKiosk()
  const location = useLocation()
  const navigate  = useNavigate()
  const [showExitGate, setShowExitGate] = useState(false)

  if (!config.kioskMode) return children

  // Check if current route is allowed
  if (!isRouteAllowed(location.pathname)) {
    const map = KIOSK_ALLOWED_ROUTES[config.deviceType]
    const homeRoute = (map && map.length > 0) ? map[0] : '/'

    return (
      <>
        <RouteLocked
          deviceType={config.deviceType}
          onReturn={() => navigate(homeRoute, { replace: true })}
          onUnlock={() => setShowExitGate(true)}
        />
        {showExitGate && (
          <KioskExitGate
            onSuccess={() => { setShowExitGate(false); /* stay on attempted route */ }}
            onCancel={() => setShowExitGate(false)}
          />
        )}
      </>
    )
  }

  return (
    <>
      {children}
      {showExitGate && (
        <KioskExitGate
          onSuccess={() => setShowExitGate(false)}
          onCancel={() => setShowExitGate(false)}
        />
      )}
    </>
  )
}
