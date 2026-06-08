/**
 * Admin — NOVEE OS Administration Screen
 * Accessible to admin and founder_level_0 only.
 * Shows current identity, permissions, system users, and security events.
 */

import { useEffect, useState } from 'react'
import { useSecurity } from '../context/SecurityContext.jsx'
import RoleGate from '../components/security/RoleGate.jsx'
import PermissionGate from '../components/security/PermissionGate.jsx'
import * as adminApi from '../services/adminApiService.js'

// ── Design tokens ─────────────────────────────────────────────
const GOLD    = '#C9A84C'
const DARK    = '#0a0603'
const CARD    = 'rgba(18,12,5,0.97)'
const BORDER  = 'rgba(201,168,76,0.18)'
const DIM     = 'rgba(201,168,76,0.45)'

const ROLE_BADGE = {
  guest:           { bg: 'rgba(100,100,100,0.15)', color: '#888',    label: 'Guest' },
  staff:           { bg: 'rgba(78,205,196,0.12)',  color: '#4ECDC4', label: 'Staff' },
  manager:         { bg: 'rgba(69,183,209,0.12)',  color: '#45B7D1', label: 'Manager' },
  admin:           { bg: 'rgba(150,206,180,0.12)', color: '#96CEB4', label: 'Admin' },
  founder_level_0: { bg: 'rgba(201,168,76,0.15)',  color: GOLD,      label: 'Founder Level 0' },
}

function SectionTitle({ icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: GOLD }}>{icon}</span>
      <span style={{ color: DIM, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  )
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background:   CARD,
      border:       `1px solid ${BORDER}`,
      borderRadius: '8px',
      padding:      '1.5rem',
      ...style,
    }}>
      {children}
    </div>
  )
}

function StatusDot({ active, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: DIM }}>
      <span style={{
        width:        '7px',
        height:       '7px',
        borderRadius: '50%',
        background:   active ? '#4CAF50' : '#555',
        display:      'inline-block',
      }} />
      {label}
    </span>
  )
}

function PermBadge({ permission }) {
  return (
    <span style={{
      background:    'rgba(201,168,76,0.08)',
      border:        `1px solid ${GOLD}33`,
      borderRadius:  '3px',
      color:         `${GOLD}99`,
      fontSize:      '10px',
      letterSpacing: '0.06em',
      padding:       '3px 7px',
      display:       'inline-block',
      margin:        '3px',
    }}>
      {permission}
    </span>
  )
}

export default function Admin() {
  const { user, role, roleLabel, permissions, isFounder } = useSecurity()
  const badge = ROLE_BADGE[role] || ROLE_BADGE.guest

  const [users,  setUsers]  = useState([])
  const [events, setEvents] = useState([])
  const [loadingUsers,  setLoadingUsers]  = useState(false)
  const [loadingEvents, setLoadingEvents] = useState(false)

  useEffect(() => {
    setLoadingUsers(true)
    adminApi.getAdminUsers()
      .then(r => { if (r?.data) setUsers(r.data) })
      .finally(() => setLoadingUsers(false))

    setLoadingEvents(true)
    adminApi.getSecurityEvents({ limit: 20 })
      .then(r => { if (r?.data) setEvents(r.data) })
      .finally(() => setLoadingEvents(false))
  }, [])

  function formatTime(ts) {
    if (!ts) return '—'
    try { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }
    catch { return ts }
  }

  const EVENT_COLORS = {
    'access.denied':     '#e05',
    'access.granted':    '#4CAF50',
    'role.changed':      '#45B7D1',
    'founder.':          GOLD,
    'emergency.lock':    '#ff4444',
    'admin.':            '#96CEB4',
  }
  function eventColor(type = '') {
    for (const [prefix, color] of Object.entries(EVENT_COLORS)) {
      if (type.startsWith(prefix)) return color
    }
    return '#666'
  }

  return (
    <div style={{
      minHeight:   '100vh',
      background:  DARK,
      padding:     'clamp(1.5rem, 4vw, 2.5rem)',
      fontFamily:  'Georgia, serif',
    }}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ color: DIM, fontSize: '10px', letterSpacing: '0.25em', marginBottom: '0.5rem' }}>
            NOVEE OS
          </div>
          <h1 style={{
            color:         GOLD,
            fontSize:      'clamp(1.4rem, 3vw, 2rem)',
            fontWeight:    400,
            letterSpacing: '0.1em',
            margin:        '0 0 0.25rem',
            textTransform: 'uppercase',
          }}>
            Admin Control
          </h1>
          <div style={{ color: '#444', fontSize: '12px', letterSpacing: '0.08em' }}>
            System management — Phase 8 Security Layer
          </div>
        </div>

        {/* ── Identity Row ─────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <div style={{
            display:      'inline-flex',
            alignItems:   'center',
            gap:          '8px',
            background:   badge.bg,
            border:       `1px solid ${badge.color}44`,
            borderRadius: '20px',
            padding:      '6px 14px',
            color:        badge.color,
            fontSize:     '12px',
            letterSpacing: '0.08em',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>verified_user</span>
            {badge.label}
          </div>

          {user.email && (
            <div style={{
              display:   'inline-flex',
              alignItems: 'center',
              gap:       '6px',
              color:     '#555',
              fontSize:  '12px',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>mail</span>
              {user.email}
            </div>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem' }}>
            <StatusDot active label="Database" />
            <StatusDot active label="Backend" />
            <StatusDot active={isFounder()} label="Founder Gate" />
          </div>
        </div>

        {/* ── Permission Summary ───────────────────────────── */}
        <Card style={{ marginBottom: '1.5rem' }}>
          <SectionTitle icon="key" label="Active Permissions" />
          <div>
            {permissions.length === 0 ? (
              <span style={{ color: '#444', fontSize: '12px' }}>No permissions assigned (guest)</span>
            ) : (
              permissions.map(p => <PermBadge key={p} permission={p} />)
            )}
          </div>
        </Card>

        {/* ── Navigation Tiles ─────────────────────────────── */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap:                 '1rem',
          marginBottom:        '1.5rem',
        }}>
          <PermissionGate permission="access_pos3_manager">
            <NavTile icon="point_of_sale" label="POS 3" href="/pos" color="#4ECDC4" />
          </PermissionGate>
          <PermissionGate permission="access_eat_command">
            <NavTile icon="restaurant" label="E.A.T. Command" href="/eat" color="#45B7D1" />
          </PermissionGate>
          <PermissionGate permission="view_audit_logs">
            <NavTile icon="fact_check" label="Audit Logs" href="#" color="#96CEB4" />
          </PermissionGate>
          <PermissionGate permission="manage_staff">
            <NavTile icon="group" label="Staff Management" href="#" color={DIM} />
          </PermissionGate>
          <PermissionGate permission="manage_integrations">
            <NavTile icon="hub" label="Integrations" href="#" color={DIM} />
          </PermissionGate>
          <RoleGate allowedRoles={['founder_level_0']}>
            <NavTile icon="shield_lock" label="Founder Controls" href="/founder" color={GOLD} highlight />
          </RoleGate>
        </div>

        {/* ── Users + Events (side by side on wide screens) ─ */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))',
          gap:                 '1.5rem',
        }}>

          {/* System Users */}
          <Card>
            <SectionTitle icon="manage_accounts" label="System Users" />
            {loadingUsers ? (
              <div style={{ color: '#444', fontSize: '12px', padding: '1rem 0' }}>Loading users…</div>
            ) : users.length === 0 ? (
              <div style={{ color: '#444', fontSize: '12px', padding: '1rem 0', lineHeight: 1.8 }}>
                No system users recorded yet.<br />
                <span style={{ color: '#333' }}>Users created via POST /api/admin/users will appear here.</span>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ color: '#444', textAlign: 'left' }}>
                    {['User ID', 'Role', 'Status', 'Email'].map(h => (
                      <th key={h} style={{ padding: '4px 8px', fontWeight: 400, letterSpacing: '0.08em', fontSize: '10px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => {
                    const rb = ROLE_BADGE[u.role] || ROLE_BADGE.guest
                    return (
                      <tr key={u.id || i} style={{ borderTop: `1px solid ${BORDER}` }}>
                        <td style={{ padding: '8px', color: DIM, fontFamily: 'monospace', fontSize: '11px' }}>
                          {(u.user_id || '').slice(0, 14)}
                        </td>
                        <td style={{ padding: '8px' }}>
                          <span style={{ color: rb.color, fontSize: '11px' }}>{rb.label}</span>
                        </td>
                        <td style={{ padding: '8px' }}>
                          <StatusDot active={u.status === 'active'} label={u.status} />
                        </td>
                        <td style={{ padding: '8px', color: '#555', fontSize: '11px' }}>
                          {u.email || '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </Card>

          {/* Security Events */}
          <Card>
            <SectionTitle icon="security" label="Recent Security Events" />
            {loadingEvents ? (
              <div style={{ color: '#444', fontSize: '12px', padding: '1rem 0' }}>Loading events…</div>
            ) : events.length === 0 ? (
              <div style={{ color: '#444', fontSize: '12px', padding: '1rem 0', lineHeight: 1.8 }}>
                No security events yet.<br />
                <span style={{ color: '#333' }}>Access grants and denials will appear here.</span>
              </div>
            ) : (
              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {events.map((e, i) => (
                  <div key={i} style={{
                    display:       'flex',
                    gap:           '8px',
                    padding:       '8px 0',
                    borderBottom:  `1px solid ${BORDER}`,
                    alignItems:    'flex-start',
                  }}>
                    <span style={{
                      width:        '7px',
                      height:       '7px',
                      borderRadius: '50%',
                      background:   eventColor(e.event_type),
                      marginTop:    '5px',
                      flexShrink:   0,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: DIM, fontSize: '11px', fontFamily: 'monospace' }}>
                        {e.event_type}
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2px' }}>
                        <span style={{ color: '#444', fontSize: '10px', fontFamily: 'monospace' }}>
                          {e.actor_role}
                        </span>
                        <span style={{ color: '#333', fontSize: '10px' }}>
                          {e.route_path}
                        </span>
                      </div>
                    </div>
                    <span style={{ color: '#333', fontSize: '10px', flexShrink: 0, fontFamily: 'monospace' }}>
                      {formatTime(e.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ── Footer ───────────────────────────────────────── */}
        <div style={{
          marginTop:  '2rem',
          paddingTop: '1.5rem',
          borderTop:  `1px solid ${BORDER}`,
          display:    'flex',
          gap:        '2rem',
          flexWrap:   'wrap',
          color:      '#333',
          fontSize:   '11px',
          letterSpacing: '0.08em',
        }}>
          <span>NOVEE OS · Phase 8</span>
          <span>Admin Role: {roleLabel}</span>
          <span>Permissions: {permissions.length}</span>
        </div>
      </div>
    </div>
  )
}

function NavTile({ icon, label, href, color, highlight = false }) {
  return (
    <a href={href} style={{
      display:        'flex',
      flexDirection:  'column',
      gap:            '0.5rem',
      background:     highlight ? `rgba(201,168,76,0.07)` : CARD,
      border:         `1px solid ${highlight ? GOLD + '44' : BORDER}`,
      borderRadius:   '8px',
      padding:        '1rem 1.25rem',
      textDecoration: 'none',
      transition:     'border-color 0.2s',
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: '22px', color }}>{icon}</span>
      <span style={{ color: color || DIM, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </a>
  )
}
