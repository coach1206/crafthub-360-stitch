/**
 * Dev Role Switcher — Phase 8.5
 * Floating role simulator — visible ONLY when import.meta.env.DEV is true.
 * Shows "DEV MODE ONLY — NOT REAL AUTH" warning.
 * Disabled when user has a real JWT session (shows logout button instead).
 */

import { useState } from 'react'
import { useSecurity } from '../../context/SecurityContext.jsx'
import { useContext }   from 'react'
import { AuthContext }  from '../../context/AuthContext.jsx'
import { ALL_ROLES, ROLE_LABELS, ROLE_LEVELS } from '../../config/roleMap.js'

const ROLE_COLORS = {
  guest:           '#888',
  staff:           '#4ECDC4',
  manager:         '#45B7D1',
  admin:           '#96CEB4',
  founder_level_0: '#C9A84C',
}

export default function DevRoleSwitcher() {
  const [open, setOpen] = useState(false)
  const { role, setRole, isRealSession } = useSecurity()
  const authCtx = useContext(AuthContext)

  if (!import.meta.env.DEV) return null

  const color = ROLE_COLORS[role] || '#888'

  const handleLogout = async () => {
    if (authCtx?.logout) await authCtx.logout()
    setOpen(false)
  }

  return (
    <div style={{
      position:  'fixed',
      bottom:    '1.25rem',
      right:     '1.25rem',
      zIndex:    9999,
      fontFamily: 'monospace',
      fontSize:  '11px',
    }}>
      {open && (
        <div style={{
          background:   '#0d0d0d',
          border:       '1px solid #C9A84C33',
          borderRadius: '8px',
          padding:      '12px',
          marginBottom: '8px',
          minWidth:     '210px',
          boxShadow:    '0 4px 20px rgba(0,0,0,0.9)',
        }}>
          {/* DEV warning banner */}
          <div style={{
            background:    'rgba(204,51,51,0.10)',
            border:        '1px solid rgba(204,51,51,0.3)',
            borderRadius:  '3px',
            color:         'rgba(204,51,51,0.8)',
            fontSize:      '9px',
            letterSpacing: '0.12em',
            padding:       '4px 8px',
            marginBottom:  '10px',
            textAlign:     'center',
          }}>
            DEV MODE ONLY — NOT REAL AUTH
          </div>

          {isRealSession ? (
            // Real JWT session active — show identity + logout
            <>
              <div style={{ color: '#555', fontSize: '10px', letterSpacing: '0.08em', marginBottom: '8px' }}>
                REAL SESSION ACTIVE
              </div>
              <div style={{
                color:         ROLE_COLORS[role] || '#888',
                fontSize:      '12px',
                marginBottom:  '10px',
                letterSpacing: '0.06em',
              }}>
                {ROLE_LABELS[role]}
              </div>
              <button
                onClick={handleLogout}
                style={{
                  display:       'block',
                  width:         '100%',
                  background:    'rgba(204,51,51,0.1)',
                  border:        '1px solid rgba(204,51,51,0.3)',
                  borderRadius:  '4px',
                  color:         'rgba(204,51,51,0.8)',
                  padding:       '6px 8px',
                  cursor:        'pointer',
                  letterSpacing: '0.08em',
                  fontSize:      '11px',
                }}
              >
                Logout
              </button>
            </>
          ) : (
            // Prototype mode — show role switcher
            <>
              <div style={{ color: '#444', letterSpacing: '0.08em', fontSize: '10px', marginBottom: '8px' }}>
                PROTOTYPE ROLE SWITCHER
              </div>
              {ALL_ROLES.map(r => (
                <button
                  key={r}
                  onClick={() => { setRole(r); setOpen(false) }}
                  style={{
                    display:      'block',
                    width:        '100%',
                    background:   role === r ? '#1a1a1a' : 'transparent',
                    border:       `1px solid ${role === r ? ROLE_COLORS[r] : '#2a2a2a'}`,
                    borderRadius: '4px',
                    color:        ROLE_COLORS[r] || '#aaa',
                    padding:      '5px 8px',
                    marginBottom: '4px',
                    cursor:       'pointer',
                    textAlign:    'left',
                    letterSpacing: '0.04em',
                  }}
                >
                  {role === r ? '▶ ' : '  '}{ROLE_LABELS[r]}
                  <span style={{ float: 'right', color: '#444' }}>lv{ROLE_LEVELS[r]}</span>
                </button>
              ))}
            </>
          )}

          <div style={{
            borderTop:     '1px solid #1a1a1a',
            marginTop:     '8px',
            paddingTop:    '8px',
            color:         '#333',
            fontSize:      '9px',
            letterSpacing: '0.08em',
          }}>
            {isRealSession ? 'JWT · HttpOnly cookie' : 'localStorage · prototype only'}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background:   '#0d0d0d',
          border:       `1px solid ${color}`,
          borderRadius: '20px',
          color,
          padding:      '6px 12px',
          cursor:       'pointer',
          letterSpacing: '0.06em',
          boxShadow:    '0 2px 12px rgba(0,0,0,0.7)',
          display:      'flex',
          alignItems:   'center',
          gap:          '6px',
          fontSize:     '11px',
        }}
      >
        <span style={{ fontSize: '8px' }}>{isRealSession ? '🔐' : '●'}</span>
        {ROLE_LABELS[role]}
      </button>
    </div>
  )
}
