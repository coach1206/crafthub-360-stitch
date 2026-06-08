/**
 * KioskSetup — Phase 11
 * Manager+ only. Configure a device's kiosk mode, type, and assigned module.
 * Route: /kiosk-setup
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useKiosk } from '../context/KioskContext.jsx'
import { getLocalDeviceId } from '../services/deviceConfigService.js'

const GOLD = '#C9A84C'
const DARK = '#050505'
const CARD = 'rgba(18,12,5,0.97)'

const DEVICE_TYPES = [
  { value: 'demo_browser',      label: 'Demo Browser',      desc: 'Full access, no route locking' },
  { value: 'tablet',            label: 'Guest Tablet',      desc: 'Full guest experience' },
  { value: 'kiosk',             label: 'Guest Kiosk',       desc: 'SmokeCraft + Passport only' },
  { value: 'staff_terminal',    label: 'Staff Terminal',    desc: 'POS 3 + staff login' },
  { value: 'manager_terminal',  label: 'Manager Terminal',  desc: 'E.A.T. + POS 3 + admin login' },
  { value: 'founder_terminal',  label: 'Founder Terminal',  desc: 'Full OS access' },
]

function Label({ children }) {
  return (
    <div style={{ color: 'rgba(201,168,76,0.45)', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
      {children}
    </div>
  )
}

function Field({ children }) {
  return <div style={{ marginBottom: '1.5rem' }}>{children}</div>
}

function Input({ value, onChange, placeholder }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width:         '100%',
        background:    'rgba(201,168,76,0.06)',
        border:        `1px solid ${GOLD}25`,
        borderRadius:  '6px',
        color:         GOLD,
        fontFamily:    'Georgia, serif',
        fontSize:      '0.9rem',
        padding:       '0.875rem 1rem',
        outline:       'none',
        boxSizing:     'border-box',
        minHeight:     '52px',
      }}
    />
  )
}

export default function KioskSetup() {
  const navigate          = useNavigate()
  const { config, save, enableKiosk, disableKiosk } = useKiosk()
  const [deviceId,   setDeviceId]   = useState(config.deviceId   || getLocalDeviceId())
  const [deviceName, setDeviceName] = useState(config.deviceName || 'NOVEE Device')
  const [venueId,    setVenueId]    = useState(config.venueId    || 'novee-grand-lounge')
  const [deviceType, setDeviceType] = useState(config.deviceType || 'demo_browser')
  const [kioskMode,  setKioskMode]  = useState(config.kioskMode  || false)
  const [saved,      setSaved]      = useState(false)
  const [syncing,    setSyncing]    = useState(false)

  async function handleSave() {
    setSyncing(true)
    try {
      const payload = { deviceId, deviceName, venueId, deviceType, kioskMode }
      save(payload)

      // Attempt backend sync (non-blocking failure)
      await fetch('/api/device/register', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify(payload),
      }).catch(() => {})

      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSyncing(false)
    }
  }

  function handleEnable() {
    enableKiosk({ deviceId, deviceName, venueId, deviceType })
    navigate('/', { replace: true })
  }

  function handleDisable() {
    disableKiosk()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{
      minHeight:   '100vh',
      background:  DARK,
      color:       GOLD,
      fontFamily:  'Georgia, serif',
      padding:     'clamp(1.5rem, 4vw, 3rem)',
    }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <button
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
            style={{ background: 'transparent', border: 'none', color: `${GOLD}55`, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '0.8rem', letterSpacing: '0.1em', padding: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            ← Back
          </button>
          <div style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', opacity: 0.4, marginBottom: '0.5rem' }}>
            NOVEE OS · DEVICE MANAGEMENT
          </div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 400, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
            Kiosk Setup
          </h1>
        </div>

        {/* Status banner */}
        <div style={{
          background:    config.kioskMode ? 'rgba(201,168,76,0.12)' : 'rgba(201,168,76,0.05)',
          border:        `1px solid ${config.kioskMode ? GOLD + '44' : GOLD + '18'}`,
          borderRadius:  '8px',
          padding:       '1rem 1.25rem',
          marginBottom:  '2rem',
          display:       'flex',
          alignItems:    'center',
          justifyContent:'space-between',
          gap:           '1rem',
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.5, marginBottom: '0.2rem' }}>
              Kiosk Mode
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
              {config.kioskMode ? 'Active' : 'Inactive'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {config.kioskMode ? (
              <button onClick={handleDisable} style={{ background: 'transparent', border: `1px solid ${GOLD}44`, color: GOLD, padding: '0.625rem 1rem', borderRadius: '5px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '0.75rem', letterSpacing: '0.1em', minHeight: '44px' }}>
                Disable
              </button>
            ) : (
              <button onClick={handleEnable} style={{ background: GOLD, color: DARK, border: 'none', padding: '0.625rem 1rem', borderRadius: '5px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '0.75rem', letterSpacing: '0.1em', fontWeight: 600, minHeight: '44px' }}>
                Enable
              </button>
            )}
          </div>
        </div>

        {/* Config card */}
        <div style={{ background: CARD, border: `1px solid ${GOLD}18`, borderRadius: '10px', padding: '2rem', marginBottom: '1.5rem' }}>
          <Field>
            <Label>Device ID</Label>
            <Input value={deviceId} onChange={setDeviceId} placeholder="device-001" />
          </Field>
          <Field>
            <Label>Device Name</Label>
            <Input value={deviceName} onChange={setDeviceName} placeholder="NOVEE Device" />
          </Field>
          <Field>
            <Label>Venue ID</Label>
            <Input value={venueId} onChange={setVenueId} placeholder="novee-grand-lounge" />
          </Field>

          <Field>
            <Label>Device Type</Label>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {DEVICE_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setDeviceType(t.value)}
                  style={{
                    background:    deviceType === t.value ? `${GOLD}18` : 'transparent',
                    border:        `1px solid ${deviceType === t.value ? GOLD + '55' : GOLD + '15'}`,
                    borderRadius:  '6px',
                    color:         deviceType === t.value ? GOLD : `${GOLD}55`,
                    padding:       '0.75rem 1rem',
                    cursor:        'pointer',
                    textAlign:     'left',
                    fontFamily:    'Georgia, serif',
                    fontSize:      '0.85rem',
                    display:       'flex',
                    justifyContent:'space-between',
                    alignItems:    'center',
                    minHeight:     '52px',
                    transition:    'all 0.15s',
                  }}
                >
                  <span>{t.label}</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.55 }}>{t.desc}</span>
                </button>
              ))}
            </div>
          </Field>
        </div>

        <button
          onClick={handleSave}
          disabled={syncing}
          style={{
            display:       'block',
            width:         '100%',
            background:    GOLD,
            color:         DARK,
            border:        'none',
            padding:       '1rem',
            borderRadius:  '6px',
            fontFamily:    'Georgia, serif',
            fontSize:      '0.9rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            cursor:        'pointer',
            fontWeight:    600,
            minHeight:     '52px',
          }}
        >
          {syncing ? 'Saving…' : saved ? '✓ Saved' : 'Save Configuration'}
        </button>

        <button
          onClick={() => navigate('/device-status')}
          style={{
            display:       'block',
            width:         '100%',
            background:    'transparent',
            border:        `1px solid ${GOLD}22`,
            color:         `${GOLD}55`,
            padding:       '0.875rem',
            borderRadius:  '6px',
            fontFamily:    'Georgia, serif',
            fontSize:      '0.8rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor:        'pointer',
            marginTop:     '0.75rem',
            minHeight:     '48px',
          }}
        >
          View Device Status
        </button>
      </div>
    </div>
  )
}
