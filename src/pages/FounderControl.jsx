/**
 * Founder Control — Founder Level 0 exclusive screen.
 * Protected on both frontend (ProtectedRoute) and backend (/api/founder/*).
 *
 * Emergency lock and override actions are prototype-only and clearly marked.
 */

import { useEffect, useState } from 'react'
import { useSecurity } from '../context/SecurityContext.jsx'
import * as founderApi from '../services/founderApiService.js'

// ── Design tokens ─────────────────────────────────────────────
const GOLD   = '#C9A84C'
const DARK   = '#060402'
const CARD   = 'rgba(14,9,3,0.98)'
const BORDER = 'rgba(201,168,76,0.16)'
const DIM    = 'rgba(201,168,76,0.45)'
const RED    = '#cc3333'

function SectionTitle({ icon, label, note }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: GOLD }}>{icon}</span>
      <span style={{ color: DIM, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', flex: 1 }}>
        {label}
      </span>
      {note && (
        <span style={{ fontSize: '9px', letterSpacing: '0.12em', color: '#444', textTransform: 'uppercase' }}>
          {note}
        </span>
      )}
    </div>
  )
}

function Card({ children, style = {}, accent }) {
  return (
    <div style={{
      background:   CARD,
      border:       `1px solid ${accent ? accent + '33' : BORDER}`,
      borderRadius: '8px',
      padding:      '1.5rem',
      ...style,
    }}>
      {children}
    </div>
  )
}

function LockedPlaceholder({ label, description }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#333', marginTop: '2px' }}>lock</span>
      <div>
        <div style={{ color: '#555', fontSize: '12px', letterSpacing: '0.06em', marginBottom: '4px' }}>{label}</div>
        <div style={{ color: '#333', fontSize: '11px', lineHeight: 1.7 }}>{description}</div>
        <div style={{
          marginTop:  '8px',
          fontSize:   '9px',
          color:      '#333',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
        }}>
          Integration wired in Phase 9
        </div>
      </div>
    </div>
  )
}

function PrototypeBanner({ text }) {
  return (
    <div style={{
      background:    'rgba(204,51,51,0.08)',
      border:        `1px solid ${RED}33`,
      borderRadius:  '4px',
      padding:       '6px 12px',
      color:         `${RED}aa`,
      fontSize:      '9px',
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      marginBottom:  '1rem',
    }}>
      ⚠ {text}
    </div>
  )
}

export default function FounderControl() {
  const { user } = useSecurity()

  const [status,    setStatus]    = useState(null)
  const [controls,  setControls]  = useState([])
  const [audit,     setAudit]     = useState([])
  const [locking,   setLocking]   = useState(false)
  const [lockResult, setLockResult] = useState(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      founderApi.getFounderStatus(),
      founderApi.getFounderControls(),
      founderApi.getFounderAudit(15),
    ]).then(([s, c, a]) => {
      if (s?.data)  setStatus(s.data)
      if (c?.data)  setControls(Array.isArray(c.data) ? c.data : [])
      if (a?.data?.events) setAudit(a.data.events)
    }).finally(() => setLoading(false))
  }, [])

  async function handleEmergencyLock() {
    if (!window.confirm(
      'PROTOTYPE MODE\n\nThis will record an emergency lock event.\nNo actual system lockdown will occur.\n\nProceed?'
    )) return

    setLocking(true)
    const result = await founderApi.triggerEmergencyLock('Founder-initiated emergency lock')
    setLockResult(result?.data || result)
    setLocking(false)

    // Refresh status
    const s = await founderApi.getFounderStatus()
    if (s?.data) setStatus(s.data)
  }

  function formatTime(ts) {
    if (!ts) return '—'
    try { return new Date(ts).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) }
    catch { return String(ts) }
  }

  function controlValue(key) {
    const c = controls.find(c => c.control_key === key)
    return c?.control_value || {}
  }

  const locked = status?.systemLocked ?? false

  return (
    <div style={{
      minHeight:  '100vh',
      background: DARK,
      padding:    'clamp(1.5rem, 4vw, 2.5rem)',
      fontFamily: 'Georgia, serif',
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* ── Header ─────────────────────────────────────── */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ color: DIM, fontSize: '10px', letterSpacing: '0.3em', marginBottom: '0.5rem' }}>
            NOVEE OS — EXCLUSIVE ACCESS
          </div>
          <h1 style={{
            color:         GOLD,
            fontSize:      'clamp(1.6rem, 3.5vw, 2.2rem)',
            fontWeight:    400,
            letterSpacing: '0.1em',
            margin:        '0 0 0.25rem',
            textTransform: 'uppercase',
          }}>
            Founder Level 0 Control
          </h1>
          <div style={{ color: '#3a3020', fontSize: '12px', letterSpacing: '0.08em' }}>
            Absolute authority — all controls visible and accessible only to this account
          </div>
        </div>

        {/* ── Identity Badge ──────────────────────────────── */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <div style={{
            display:      'inline-flex',
            alignItems:   'center',
            gap:          '8px',
            background:   'rgba(201,168,76,0.10)',
            border:       `1px solid ${GOLD}66`,
            borderRadius: '20px',
            padding:      '8px 18px',
            color:        GOLD,
            fontSize:     '12px',
            letterSpacing: '0.12em',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>verified</span>
            FOUNDER LEVEL 0
          </div>

          {loading && (
            <span style={{ color: '#444', fontSize: '11px' }}>Loading system status…</span>
          )}

          {status && (
            <>
              <div style={{
                display:      'inline-flex',
                alignItems:   'center',
                gap:          '6px',
                fontSize:     '11px',
                color:        locked ? RED : '#4CAF50',
                background:   locked ? 'rgba(204,51,51,0.08)' : 'rgba(76,175,80,0.08)',
                border:       `1px solid ${locked ? RED : '#4CAF50'}33`,
                borderRadius: '20px',
                padding:      '6px 14px',
              }}>
                <span style={{
                  width:  '7px', height: '7px', borderRadius: '50%',
                  background: locked ? RED : '#4CAF50', display: 'inline-block',
                }} />
                {locked ? 'SYSTEM LOCKED' : 'System Nominal'}
              </div>
              <span style={{ color: '#333', fontSize: '10px', letterSpacing: '0.08em' }}>
                Mode: {status.mode}
              </span>
            </>
          )}
        </div>

        {/* ── Top Grid ────────────────────────────────────── */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap:                 '1.25rem',
          marginBottom:        '1.5rem',
        }}>

          {/* Emergency Lock */}
          <Card accent={RED}>
            <SectionTitle icon="crisis_alert" label="Emergency System Lock" note="Prototype" />
            <PrototypeBanner text="Prototype lock active — does not lock live systems" />
            <p style={{ color: '#555', fontSize: '12px', lineHeight: 1.8, margin: '0 0 1.25rem' }}>
              Triggers a system-wide lock event recorded in security logs.
              In production, this would halt all active sessions and disable non-founder access.
            </p>
            {lockResult && (
              <div style={{
                background:   'rgba(204,51,51,0.07)',
                border:       `1px solid ${RED}22`,
                borderRadius: '4px',
                padding:      '8px 12px',
                color:        `${RED}99`,
                fontSize:     '11px',
                marginBottom: '1rem',
              }}>
                {lockResult.message || 'Lock recorded'}
              </div>
            )}
            <button
              onClick={handleEmergencyLock}
              disabled={locking}
              style={{
                width:         '100%',
                background:    locking ? '#1a0a0a' : 'rgba(204,51,51,0.12)',
                border:        `1px solid ${RED}55`,
                borderRadius:  '4px',
                color:         locking ? '#555' : `${RED}cc`,
                padding:       '10px',
                cursor:        locking ? 'not-allowed' : 'pointer',
                fontFamily:    'Georgia, serif',
                fontSize:      '12px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              {locking ? 'Recording…' : 'Trigger Emergency Lock'}
            </button>
          </Card>

          {/* Revenue Settings */}
          <Card>
            <SectionTitle icon="payments" label="Revenue Settings" note="Locked" />
            <LockedPlaceholder
              label="Pricing & Commission Configuration"
              description="Tier pricing, commission rates, and billing cycle settings. Changes here affect all venue revenue splits."
            />
            <div style={{ marginTop: '1rem' }}>
              <LockedPlaceholder
                label="Current Tier"
                description={`Standard — ${controlValue('revenue_settings')?.commissionRate ?? 0}% commission`}
              />
            </div>
          </Card>

          {/* Integration Control */}
          <Card>
            <SectionTitle icon="hub" label="Integration Control" note="Prototype" />
            {['POS System', 'CRM Platform', 'Analytics Engine'].map(s => (
              <div key={s} style={{
                display:       'flex',
                justifyContent:'space-between',
                alignItems:    'center',
                padding:       '8px 0',
                borderBottom:  `1px solid ${BORDER}`,
                fontSize:      '12px',
              }}>
                <span style={{ color: '#555' }}>{s}</span>
                <span style={{
                  background:    'rgba(100,100,100,0.1)',
                  border:        '1px solid #333',
                  borderRadius:  '3px',
                  color:         '#444',
                  fontSize:      '10px',
                  letterSpacing: '0.1em',
                  padding:       '2px 8px',
                }}>PROTOTYPE</span>
              </div>
            ))}
            <div style={{ marginTop: '1rem', color: '#333', fontSize: '10px', letterSpacing: '0.1em' }}>
              LIVE INTEGRATIONS WIRED IN PHASE 9
            </div>
          </Card>

          {/* Deployment Control */}
          <Card>
            <SectionTitle icon="cloud_upload" label="Deployment Control" note="Prototype" />
            <LockedPlaceholder
              label="Environment Switch"
              description="Toggle between development, staging, and production deployments. Affects all connected venue devices."
            />
            <div style={{
              marginTop:  '1rem',
              display:    'flex',
              gap:        '8px',
              flexWrap:   'wrap',
            }}>
              {['development', 'staging', 'production'].map(env => (
                <div key={env} style={{
                  background:    env === 'development' ? 'rgba(201,168,76,0.08)' : 'transparent',
                  border:        `1px solid ${env === 'development' ? GOLD + '33' : '#222'}`,
                  borderRadius:  '3px',
                  color:         env === 'development' ? GOLD + '88' : '#333',
                  fontSize:      '10px',
                  letterSpacing: '0.1em',
                  padding:       '4px 10px',
                  textTransform: 'uppercase',
                }}>
                  {env}
                </div>
              ))}
            </div>
          </Card>

          {/* License */}
          <Card>
            <SectionTitle icon="license" label="License & Venue" />
            {[
              ['Venue ID',  controlValue('license')?.venueId   || 'novee-grand-lounge'],
              ['Tier',      controlValue('license')?.tier       || 'development'],
              ['Status',    controlValue('license')?.status     || 'prototype'],
              ['Phase',     'Phase 8 — RBAC Foundation'],
            ].map(([key, val]) => (
              <div key={key} style={{
                display:       'flex',
                justifyContent:'space-between',
                padding:       '7px 0',
                borderBottom:  `1px solid ${BORDER}`,
                fontSize:      '12px',
              }}>
                <span style={{ color: '#444', letterSpacing: '0.06em' }}>{key}</span>
                <span style={{ color: DIM, fontFamily: 'monospace', fontSize: '11px' }}>{val}</span>
              </div>
            ))}
          </Card>

          {/* Override Log */}
          <Card>
            <SectionTitle icon="auto_fix_high" label="Override Log" />
            <PrototypeBanner text="Override actions recorded in prototype mode" />
            <p style={{ color: '#444', fontSize: '12px', lineHeight: 1.8, margin: '0 0 1rem' }}>
              Founder overrides of guest sessions, rule exceptions, and manual controls appear here.
            </p>
            <button
              onClick={() => founderApi.triggerFounderOverride(null, 'Manual test override from Founder Control')}
              style={{
                background:    'transparent',
                border:        `1px solid ${GOLD}22`,
                borderRadius:  '4px',
                color:         `${GOLD}55`,
                padding:       '8px 14px',
                cursor:        'pointer',
                fontFamily:    'Georgia, serif',
                fontSize:      '11px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Log Test Override
            </button>
          </Card>
        </div>

        {/* ── Audit Trail ─────────────────────────────────── */}
        <Card>
          <SectionTitle icon="history" label="Audit Trail Preview" />
          {loading ? (
            <div style={{ color: '#444', fontSize: '12px', padding: '1rem 0' }}>Loading audit trail…</div>
          ) : audit.length === 0 ? (
            <div style={{ color: '#444', fontSize: '12px', padding: '1rem 0', lineHeight: 1.8 }}>
              No audit events recorded yet.<br />
              <span style={{ color: '#333' }}>Security events from all routes will appear here.</span>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'monospace' }}>
                <thead>
                  <tr style={{ color: '#333' }}>
                    {['Time', 'Event', 'Actor', 'Role', 'Path'].map(h => (
                      <th key={h} style={{ padding: '4px 10px', fontWeight: 400, textAlign: 'left', letterSpacing: '0.08em', fontSize: '10px' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {audit.map((e, i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
                      <td style={{ padding: '7px 10px', color: '#333' }}>{formatTime(e.created_at)}</td>
                      <td style={{ padding: '7px 10px', color: DIM }}>{e.event_type}</td>
                      <td style={{ padding: '7px 10px', color: '#555' }}>{(e.actor_id || '').slice(0, 16)}</td>
                      <td style={{ padding: '7px 10px', color: '#555' }}>{e.actor_role}</td>
                      <td style={{ padding: '7px 10px', color: '#333' }}>{e.route_path}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ── Footer ───────────────────────────────────────── */}
        <div style={{
          marginTop:  '2rem',
          paddingTop: '1.5rem',
          borderTop:  `1px solid ${BORDER}`,
          display:    'flex',
          gap:        '2rem',
          flexWrap:   'wrap',
          color:      '#2a1c08',
          fontSize:   '11px',
          letterSpacing: '0.1em',
        }}>
          <span>NOVEE OS · Founder Level 0 · Phase 13</span>
          <span>Actor: {user.id || 'unknown'}</span>
          <a href="/founder-demo"    style={{ color: '#2a1c08', textDecoration: 'underline', cursor: 'pointer' }}>Founder Demo</a>
          <a href="/investor-demo"   style={{ color: '#2a1c08', textDecoration: 'underline', cursor: 'pointer' }}>Investor Demo</a>
          <a href="/pilot-onboarding" style={{ color: '#2a1c08', textDecoration: 'underline', cursor: 'pointer' }}>Pilot Onboarding</a>
          <a href="/system-overview" style={{ color: '#2a1c08', textDecoration: 'underline', cursor: 'pointer' }}>System Overview</a>
          <a href="/venue-test"      style={{ color: '#2a1c08', textDecoration: 'underline', cursor: 'pointer' }}>Venue Test Control</a>
          <span style={{ marginLeft: 'auto', color: '#1a1008' }}>This panel is not visible to any other role</span>
        </div>
      </div>
    </div>
  )
}
