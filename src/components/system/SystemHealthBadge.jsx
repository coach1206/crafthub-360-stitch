/**
 * SystemHealthBadge — Phase 11
 * Compact status indicator shown only on admin/manager/founder/device-status screens.
 * Guests never see this component.
 */

import { useState, useEffect } from 'react'
import { startHealthPolling } from '../../services/healthMonitorService.js'

const STATUS_STYLES = {
  online:       { color: '#4ade80', label: 'Online',        dot: '#4ade80' },
  degraded:     { color: '#fbbf24', label: 'Degraded',      dot: '#fbbf24' },
  offline:      { color: '#f87171', label: 'Offline',       dot: '#f87171' },
  prototype:    { color: '#C9A84C', label: 'Prototype Mode', dot: '#C9A84C' },
  'sync-pending': { color: '#a78bfa', label: 'Sync Pending', dot: '#a78bfa' },
  unknown:      { color: 'rgba(201,168,76,0.35)', label: 'Checking…', dot: 'rgba(201,168,76,0.35)' },
}

/**
 * @param {object} props
 * @param {boolean} [props.expanded] — show all service rows (for DeviceStatus page)
 * @param {number}  [props.pollMs]   — polling interval in ms (default 30 000)
 */
export default function SystemHealthBadge({ expanded = false, pollMs = 30_000 }) {
  const [health, setHealth] = useState(null)

  useEffect(() => {
    const stop = startHealthPolling(setHealth, pollMs)
    return stop
  }, [pollMs])

  const status = health?.overallStatus || 'unknown'
  const style  = STATUS_STYLES[status] || STATUS_STYLES.unknown

  if (!expanded) {
    return (
      <div style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:           '0.4rem',
        background:    'rgba(10,6,3,0.6)',
        border:        `1px solid ${style.dot}33`,
        borderRadius:  '20px',
        padding:       '4px 12px',
        fontFamily:    'monospace',
        fontSize:      '0.65rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color:         style.color,
      }}>
        <span style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: style.dot,
          boxShadow: `0 0 6px ${style.dot}`,
          animation: status === 'online' ? 'novee-pulse 2s infinite' : 'none',
          flexShrink: 0,
        }} />
        {style.label}
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'Georgia, serif' }}>
      <div style={{
        display:       'flex',
        alignItems:    'center',
        gap:           '0.5rem',
        marginBottom:  '0.875rem',
      }}>
        <span style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: style.dot, boxShadow: `0 0 8px ${style.dot}`, flexShrink: 0,
        }} />
        <span style={{ color: style.color, fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          {style.label}
        </span>
        {health?.checkedAt && (
          <span style={{ color: 'rgba(201,168,76,0.3)', fontSize: '0.65rem', marginLeft: 'auto' }}>
            {new Date(health.checkedAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      {health?.checks?.map(c => (
        <div key={c.key} style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
          padding:        '0.5rem 0',
          borderBottom:   '1px solid rgba(201,168,76,0.08)',
          fontSize:       '0.78rem',
        }}>
          <span style={{ color: 'rgba(201,168,76,0.55)' }}>{c.label}</span>
          <span style={{
            color: c.ok ? '#4ade80' : '#f87171',
            fontSize: '0.7rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            {c.ok ? '✓ OK' : '✗ Down'}{c.ms ? ` · ${c.ms}ms` : ''}
          </span>
        </div>
      ))}

      {!health && (
        <p style={{ color: 'rgba(201,168,76,0.3)', fontSize: '0.75rem', textAlign: 'center', padding: '1rem 0' }}>
          Checking services…
        </p>
      )}
    </div>
  )
}
