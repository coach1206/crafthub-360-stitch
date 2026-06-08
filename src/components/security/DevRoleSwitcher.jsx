/**
 * Dev Role Switcher — floating role simulator for development only.
 * Renders only when import.meta.env.DEV is true.
 * Uses SecurityContext.setRole() to switch the current prototype role.
 */

import { useState } from 'react'
import { useSecurity } from '../../context/SecurityContext.jsx'
import { ALL_ROLES, ROLE_LABELS, ROLE_LEVELS } from '../../config/roleMap.js'

const ROLE_COLORS = {
  guest:           '#888',
  staff:           '#4ECDC4',
  manager:         '#45B7D1',
  admin:           '#96CEB4',
  founder_level_0: '#C9A84C',
}

export default function DevRoleSwitcher() {
  const [open, setOpen]   = useState(false)
  const { role, setRole } = useSecurity()

  if (!import.meta.env.DEV) return null

  return (
    <div
      style={{
        position:  'fixed',
        bottom:    '1.25rem',
        right:     '1.25rem',
        zIndex:    9999,
        fontFamily: 'monospace',
        fontSize:  '11px',
      }}
    >
      {open && (
        <div style={{
          background:   '#111',
          border:       '1px solid #C9A84C44',
          borderRadius: '8px',
          padding:      '12px',
          marginBottom: '8px',
          minWidth:     '180px',
          boxShadow:    '0 4px 20px rgba(0,0,0,0.8)',
        }}>
          <div style={{ color: '#888', marginBottom: '8px', letterSpacing: '0.08em', fontSize: '10px' }}>
            DEV ROLE SWITCHER
          </div>
          {ALL_ROLES.map(r => (
            <button
              key={r}
              onClick={() => { setRole(r); setOpen(false) }}
              style={{
                display:      'block',
                width:        '100%',
                background:   role === r ? '#1a1a1a' : 'transparent',
                border:       `1px solid ${role === r ? ROLE_COLORS[r] : '#333'}`,
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
              <span style={{ float: 'right', color: '#555' }}>lv{ROLE_LEVELS[r]}</span>
            </button>
          ))}
          <div style={{ borderTop: '1px solid #222', marginTop: '8px', paddingTop: '8px', color: '#555', fontSize: '10px' }}>
            Saved in localStorage
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background:   '#111',
          border:       `1px solid ${ROLE_COLORS[role] || '#555'}`,
          borderRadius: '20px',
          color:        ROLE_COLORS[role] || '#888',
          padding:      '6px 12px',
          cursor:       'pointer',
          letterSpacing: '0.06em',
          boxShadow:    '0 2px 12px rgba(0,0,0,0.6)',
          display:      'flex',
          alignItems:   'center',
          gap:          '6px',
        }}
      >
        <span style={{ fontSize: '9px' }}>●</span>
        {ROLE_LABELS[role]}
      </button>
    </div>
  )
}
