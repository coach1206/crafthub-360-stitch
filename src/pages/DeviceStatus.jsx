/**
 * DeviceStatus — Phase 11
 * Staff+ only. Shows device config, system health, and deployment checklist.
 * Route: /device-status
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useKiosk } from '../context/KioskContext.jsx'
import SystemHealthBadge from '../components/system/SystemHealthBadge.jsx'
import { useSecurity } from '../context/SecurityContext.jsx'

const GOLD = '#C9A84C'
const DARK = '#050505'
const CARD = 'rgba(18,12,5,0.97)'

function Section({ title, children }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${GOLD}18`, borderRadius: '10px', padding: '1.5rem', marginBottom: '1rem' }}>
      <div style={{ fontSize: '0.6rem', letterSpacing: '0.25em', color: `${GOLD}44`, textTransform: 'uppercase', marginBottom: '1rem' }}>{title}</div>
      {children}
    </div>
  )
}

function Row({ label, value, mono = false }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid rgba(201,168,76,0.07)', fontSize: '0.82rem' }}>
      <span style={{ color: 'rgba(201,168,76,0.45)' }}>{label}</span>
      <span style={{ color: GOLD, fontFamily: mono ? 'monospace' : 'Georgia, serif', fontSize: mono ? '0.75rem' : '0.82rem' }}>{value ?? '—'}</span>
    </div>
  )
}

export default function DeviceStatus() {
  const navigate                    = useNavigate()
  const { config }                  = useKiosk()
  const { role, isFounder }         = useSecurity()
  const [checklist, setChecklist]   = useState(null)
  const [loadingCL, setLoadingCL]   = useState(false)

  const canSeeChecklist = ['manager', 'admin', 'founder_level_0'].includes(role) || isFounder?.()

  useEffect(() => {
    if (!canSeeChecklist) return
    setLoadingCL(true)
    fetch('/api/deployment/checklist', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d?.data) setChecklist(d.data) })
      .catch(() => {})
      .finally(() => setLoadingCL(false))
  }, [canSeeChecklist, role])

  const statusColor = { pass: '#4ade80', warn: '#fbbf24', fail: '#f87171', unknown: `${GOLD}44` }

  return (
    <div style={{ minHeight: '100vh', background: DARK, color: GOLD, fontFamily: 'Georgia, serif', padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'transparent', border: 'none', color: `${GOLD}44`, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '0.8rem', letterSpacing: '0.1em', padding: 0, marginBottom: '1.25rem' }}
          >
            ← Back
          </button>
          <div style={{ fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', opacity: 0.4, marginBottom: '0.4rem' }}>
            NOVEE OS · SYSTEM
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', fontWeight: 400, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
              Device Status
            </h1>
            <SystemHealthBadge />
          </div>
        </div>

        {/* Device Config */}
        <Section title="Device Configuration">
          <Row label="Device ID"   value={config.deviceId   || 'Not assigned'} mono />
          <Row label="Venue ID"    value={config.venueId    || 'Not assigned'} mono />
          <Row label="Device Name" value={config.deviceName} />
          <Row label="Device Type" value={config.deviceType} />
          <Row label="Kiosk Mode"  value={config.kioskMode ? 'Active' : 'Inactive'} />
          <Row label="App Version" value={config.appVersion || '4.2.0'} />
          <Row label="Last Seen"   value={config.lastSeenAt ? new Date(config.lastSeenAt).toLocaleString() : 'Now'} />

          {canSeeChecklist && (
            <button
              onClick={() => navigate('/kiosk-setup')}
              style={{
                marginTop:     '1.25rem',
                background:    'transparent',
                border:        `1px solid ${GOLD}30`,
                color:         `${GOLD}77`,
                padding:       '0.75rem 1.25rem',
                borderRadius:  '6px',
                fontFamily:    'Georgia, serif',
                fontSize:      '0.78rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor:        'pointer',
                minHeight:     '44px',
              }}
            >
              Configure Device →
            </button>
          )}
        </Section>

        {/* System Health */}
        <Section title="System Health">
          <SystemHealthBadge expanded />
        </Section>

        {/* Deployment Checklist — manager+ only */}
        {canSeeChecklist && (
          <Section title="Deployment Checklist">
            {loadingCL && <p style={{ color: `${GOLD}44`, fontSize: '0.8rem' }}>Loading checks…</p>}
            {checklist && (
              <>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Pass',  count: checklist.summary?.pass,  color: '#4ade80' },
                    { label: 'Warn',  count: checklist.summary?.warn,  color: '#fbbf24' },
                    { label: 'Fail',  count: checklist.summary?.fail,  color: '#f87171' },
                  ].map(s => (
                    <div key={s.label} style={{ background: s.color + '11', border: `1px solid ${s.color}33`, borderRadius: '6px', padding: '0.375rem 0.875rem', fontSize: '0.75rem', color: s.color }}>
                      {s.label}: {s.count ?? 0}
                    </div>
                  ))}
                </div>
                {checklist.checks?.map(c => (
                  <div key={c.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.6rem 0', borderBottom: '1px solid rgba(201,168,76,0.07)', gap: '0.75rem' }}>
                    <div>
                      <div style={{ color: `${GOLD}80`, fontSize: '0.78rem' }}>{c.key.replace(/_/g, ' ')}</div>
                      <div style={{ color: `${GOLD}44`, fontSize: '0.68rem', marginTop: '0.15rem' }}>{c.message}</div>
                    </div>
                    <span style={{ color: statusColor[c.status] || statusColor.unknown, fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0 }}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </>
            )}
          </Section>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/install-help')} style={{ flex: '1 1 160px', background: 'transparent', border: `1px solid ${GOLD}25`, color: `${GOLD}66`, padding: '0.875rem', borderRadius: '6px', fontFamily: 'Georgia, serif', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', minHeight: '48px' }}>
            Install Help
          </button>
          <button onClick={() => navigate('/offline')} style={{ flex: '1 1 160px', background: 'transparent', border: `1px solid ${GOLD}25`, color: `${GOLD}66`, padding: '0.875rem', borderRadius: '6px', fontFamily: 'Georgia, serif', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', minHeight: '48px' }}>
            Offline Mode
          </button>
          <button onClick={() => navigate('/')} style={{ flex: '1 1 160px', background: GOLD, color: DARK, border: 'none', padding: '0.875rem', borderRadius: '6px', fontFamily: 'Georgia, serif', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600, minHeight: '48px' }}>
            Return Home
          </button>
        </div>

      </div>
    </div>
  )
}
