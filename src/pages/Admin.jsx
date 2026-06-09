/**
 * Admin — NOVEE OS Administration Screen
 * Phase 9.5: Staff PIN reset + POS 3 sync status panels added.
 * Accessible to admin and founder_level_0 only (manager can use PIN reset via /api route).
 */

import { useEffect, useState, useCallback } from 'react'
import { useSecurity } from '../context/SecurityContext.jsx'
import RoleGate from '../components/security/RoleGate.jsx'
import PermissionGate from '../components/security/PermissionGate.jsx'
import PinResetModal from '../components/admin/PinResetModal.jsx'
import * as adminApi from '../services/adminApiService.js'

// ── Design tokens ─────────────────────────────────────────────
const GOLD    = '#C9A84C'
const DARK    = '#0a0603'
const CARD    = 'rgba(18,12,5,0.97)'
const BORDER  = 'rgba(201,168,76,0.18)'
const DIM     = 'rgba(201,168,76,0.45)'
const ERR     = '#E05A5A'

const ROLE_BADGE = {
  guest:           { bg: 'rgba(100,100,100,0.15)', color: '#888',    label: 'Guest' },
  staff:           { bg: 'rgba(78,205,196,0.12)',  color: '#4ECDC4', label: 'Staff' },
  manager:         { bg: 'rgba(69,183,209,0.12)',  color: '#45B7D1', label: 'Manager' },
  admin:           { bg: 'rgba(150,206,180,0.12)', color: '#96CEB4', label: 'Admin' },
  founder_level_0: { bg: 'rgba(201,168,76,0.15)',  color: GOLD,      label: 'Founder Level 0' },
}

// Which roles each actor can reset PINs for
const RESET_SCOPE = {
  manager:         ['staff'],
  admin:           ['staff', 'manager'],
  founder_level_0: ['staff', 'manager', 'admin'],
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

function SyncStatusDot({ status }) {
  const colors = { success: '#4CAF50', failed: ERR, partial: '#D4AF37', started: '#45B7D1' }
  return (
    <span style={{
      display:       'inline-flex',
      alignItems:    'center',
      gap:           '5px',
      fontSize:      '11px',
      color:         colors[status] || '#666',
      letterSpacing: '0.06em',
    }}>
      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: colors[status] || '#555' }} />
      {status || 'unknown'}
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

  // ── Sync state ────────────────────────────────────────────
  const [syncStatus,   setSyncStatus]   = useState(null)
  const [syncLoading,  setSyncLoading]  = useState(false)
  const [syncRunning,  setSyncRunning]  = useState(false)
  const [syncMsg,      setSyncMsg]      = useState('')
  const canViewSync = ['manager','admin','founder_level_0'].includes(role)
  const canRunSync  = ['admin','founder_level_0'].includes(role)

  // ── PIN Reset state ───────────────────────────────────────
  const [resetTarget, setResetTarget] = useState(null)
  const [resetSuccess, setResetSuccess] = useState('')
  const canResetPin = ['manager','admin','founder_level_0'].includes(role)
  const resetScope  = RESET_SCOPE[role] || []

  // ── Data Reset state ──────────────────────────────────────
  const canDataReset = ['admin','founder_level_0'].includes(role)
  const [dataResetPending, setDataResetPending] = useState(null)
  const [dataResetMsg,     setDataResetMsg]     = useState('')
  const [dataResetBusy,    setDataResetBusy]    = useState(false)

  const loadData = useCallback(() => {
    setLoadingUsers(true)
    adminApi.getAdminUsers()
      .then(r => { if (r?.data) setUsers(r.data) })
      .finally(() => setLoadingUsers(false))

    setLoadingEvents(true)
    adminApi.getSecurityEvents({ limit: 20 })
      .then(r => { if (r?.data) setEvents(r.data) })
      .finally(() => setLoadingEvents(false))

    if (canViewSync) {
      setSyncLoading(true)
      adminApi.getPOS3SyncStatus()
        .then(r => { if (r?.success) setSyncStatus(r.data) })
        .catch(() => setSyncStatus(null))
        .finally(() => setSyncLoading(false))
    }
  }, [canViewSync])

  useEffect(() => { loadData() }, [loadData])

  function formatTime(ts) {
    if (!ts) return '—'
    try { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }
    catch { return ts }
  }

  function formatDuration(ms) {
    if (!ms) return '—'
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
  }

  const EVENT_COLORS = {
    'access.denied':   ERR,
    'access.granted':  '#4CAF50',
    'role.changed':    '#45B7D1',
    'founder.':        GOLD,
    'emergency.lock':  '#ff4444',
    'admin.pin-reset': '#D4AF37',
    'admin.':          '#96CEB4',
  }
  function eventColor(type = '') {
    for (const [prefix, color] of Object.entries(EVENT_COLORS)) {
      if (type.startsWith(prefix)) return color
    }
    return '#666'
  }

  const DATA_RESET_ACTIONS = [
    { key: 'ranking-xp',       label: 'Reset Leaderboard XP',     desc: 'Restore all members\' XP to seed values',      fn: adminApi.resetRankingXp,       danger: true  },
    { key: 'ranking-activity', label: 'Clear Activity Log',        desc: 'Remove all runtime activity log entries',       fn: adminApi.resetRankingActivity, danger: false },
    { key: 'ranking-members',  label: 'Reset Member Roster',       desc: 'Restore member list to the original seed data', fn: adminApi.resetRankingMembers,  danger: true  },
    { key: 'travel-concierge', label: 'Clear Concierge Requests',  desc: 'Delete all submitted travel concierge requests',fn: adminApi.resetTravelConcierge, danger: false },
    { key: 'travel-stamps',    label: 'Clear Travel Stamps',       desc: 'Remove all claimed travel stamps for all users',fn: adminApi.resetTravelStamps,    danger: true  },
    { key: 'ticker-feed',      label: 'Flush Ticker Additions',    desc: 'Remove runtime ticker items — seed feed restored', fn: adminApi.resetTickerFeed,  danger: false },
    { key: 'badges',           label: 'Reset Badge Progress',      desc: 'Clear all unlocked badges and unlock history',  fn: adminApi.resetBadges,          danger: true  },
  ]

  async function handleDataReset(action) {
    if (!action) return
    setDataResetBusy(true)
    setDataResetMsg('')
    try {
      const r = await action.fn()
      if (r?.success) {
        setDataResetMsg(`✓ ${r.message || action.label + ' complete'}`)
      } else {
        setDataResetMsg(`✗ ${r?.message || 'Reset failed — check backend.'}`)
      }
    } catch {
      setDataResetMsg('✗ Network error during reset.')
    } finally {
      setDataResetBusy(false)
      setDataResetPending(null)
    }
  }

  async function handleRunSync() {
    if (syncRunning) return
    setSyncRunning(true)
    setSyncMsg('')
    try {
      const r = await adminApi.runPOS3SyncNow('prototype')
      if (r?.success) {
        setSyncMsg(`Sync complete — ${r.data?.status || 'ok'} in ${formatDuration(r.data?.durationMs)}`)
        // Refresh sync status
        const s = await adminApi.getPOS3SyncStatus()
        if (s?.success) setSyncStatus(s.data)
      } else {
        setSyncMsg(r?.message || 'Sync failed.')
      }
    } catch {
      setSyncMsg('Network error running sync.')
    } finally {
      setSyncRunning(false)
    }
  }

  return (
    <div style={{
      minHeight:   '100vh',
      background:  DARK,
      padding:     'clamp(1.5rem, 4vw, 2.5rem)',
      fontFamily:  'Georgia, serif',
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* ── Header ─────────────────────────────────────────── */}
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
            System management — Phase 9.5
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
          <RoleGate allowedRoles={['manager','admin','founder_level_0']}>
            <NavTile icon="science"      label="Venue Test Control" href="/venue-test"       color="#a3e635" />
          </RoleGate>
          <RoleGate allowedRoles={['manager','admin','founder_level_0']}>
            <NavTile icon="storefront"   label="Venue Demo"         href="/venue-demo"        color="#60a5fa" />
          </RoleGate>
          <RoleGate allowedRoles={['admin','founder_level_0']}>
            <NavTile icon="assignment"   label="Pilot Onboarding"   href="/pilot-onboarding"  color="#c084fc" />
          </RoleGate>
          <RoleGate allowedRoles={['manager','admin','founder_level_0']}>
            <NavTile icon="dashboard"    label="System Overview"    href="/system-overview"   color="#fbbf24" />
          </RoleGate>
          <RoleGate allowedRoles={['founder_level_0']}>
            <NavTile icon="shield_lock"  label="Founder Controls"   href="/founder"           color={GOLD} highlight />
          </RoleGate>
        </div>

        {/* ── POS 3 Sync Status (manager+) ─────────────────── */}
        {canViewSync && (
          <Card style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              <SectionTitle icon="sync" label="POS 3 Auto-Sync Status" />
              {canRunSync && (
                <button
                  onClick={handleRunSync}
                  disabled={syncRunning}
                  style={{
                    background:    syncRunning ? 'rgba(201,168,76,0.05)' : 'rgba(201,168,76,0.10)',
                    border:        `1px solid ${GOLD}44`,
                    borderRadius:  '6px',
                    color:         syncRunning ? '#555' : GOLD,
                    padding:       '6px 14px',
                    cursor:        syncRunning ? 'not-allowed' : 'pointer',
                    fontSize:      '11px',
                    letterSpacing: '0.1em',
                    display:       'flex',
                    alignItems:    'center',
                    gap:           '6px',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                    {syncRunning ? 'hourglass_empty' : 'play_arrow'}
                  </span>
                  {syncRunning ? 'Running…' : 'Run Sync Now'}
                </button>
              )}
            </div>

            {syncMsg && (
              <div style={{ color: syncMsg.includes('fail') || syncMsg.includes('error') ? ERR : '#4CAF50', fontSize: '11px', marginBottom: '0.75rem', letterSpacing: '0.04em' }}>
                {syncMsg}
              </div>
            )}

            {syncLoading ? (
              <div style={{ color: '#444', fontSize: '12px' }}>Loading sync status…</div>
            ) : !syncStatus ? (
              <div style={{ color: '#333', fontSize: '12px' }}>Sync status unavailable. Backend may still be initializing.</div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ color: '#444', fontSize: '9px', letterSpacing: '0.15em', marginBottom: '3px' }}>AUTO-SYNC</div>
                    <StatusDot active={syncStatus.autoSyncActive} label={syncStatus.autoSyncActive ? 'Active' : 'Inactive'} />
                  </div>
                  <div>
                    <div style={{ color: '#444', fontSize: '9px', letterSpacing: '0.15em', marginBottom: '3px' }}>INTERVAL</div>
                    <span style={{ color: DIM, fontSize: '12px' }}>{Math.round((syncStatus.intervalMs || 300000) / 60000)} min</span>
                  </div>
                  <div>
                    <div style={{ color: '#444', fontSize: '9px', letterSpacing: '0.15em', marginBottom: '3px' }}>LAST STATUS</div>
                    <SyncStatusDot status={syncStatus.lastResult?.status} />
                  </div>
                  {syncStatus.lastResult && (
                    <div>
                      <div style={{ color: '#444', fontSize: '9px', letterSpacing: '0.15em', marginBottom: '3px' }}>LAST RUN</div>
                      <span style={{ color: '#555', fontSize: '11px' }}>
                        {formatTime(syncStatus.lastResult.timestamp)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Sync history */}
                {syncStatus.history?.length > 0 && (
                  <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    <div style={{ color: '#333', fontSize: '9px', letterSpacing: '0.15em', marginBottom: '6px' }}>RECENT RUNS</div>
                    {syncStatus.history.map((run, i) => (
                      <div key={run.id || i} style={{
                        display:      'flex',
                        gap:          '12px',
                        padding:      '6px 0',
                        borderBottom: `1px solid ${BORDER}`,
                        fontSize:     '11px',
                        flexWrap:     'wrap',
                      }}>
                        <SyncStatusDot status={run.status} />
                        <span style={{ color: '#444', fontFamily: 'monospace' }}>{run.provider_key}</span>
                        <span style={{ color: '#333' }}>{run.sync_type}</span>
                        <span style={{ color: '#444' }}>
                          {run.orders_count ?? '—'}↑ orders ·
                          {run.inventory_count ?? '—'} inv ·
                          {run.tables_count ?? '—'} tables
                        </span>
                        <span style={{ color: '#333', marginLeft: 'auto' }}>
                          {formatDuration(run.duration_ms)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </Card>
        )}

        {/* ── Staff PIN Reset (manager+) ────────────────────── */}
        {canResetPin && (
          <Card style={{ marginBottom: '1.5rem' }}>
            <SectionTitle icon="lock_reset" label="Staff PIN Reset" />

            {resetSuccess && (
              <div style={{ color: '#4CAF50', fontSize: '11px', marginBottom: '0.75rem', letterSpacing: '0.04em' }}>
                ✓ {resetSuccess}
              </div>
            )}

            <div style={{ color: '#444', fontSize: '11px', marginBottom: '1rem', letterSpacing: '0.04em' }}>
              Your role ({ROLE_BADGE[role]?.label}) can reset PINs for:{' '}
              {resetScope.map(r => (
                <span key={r} style={{ color: ROLE_BADGE[r]?.color || DIM, marginRight: '6px' }}>
                  {ROLE_BADGE[r]?.label}
                </span>
              ))}
            </div>

            {loadingUsers ? (
              <div style={{ color: '#444', fontSize: '12px' }}>Loading users…</div>
            ) : users.filter(u => resetScope.includes(u.role)).length === 0 ? (
              <div style={{ color: '#333', fontSize: '12px' }}>No users in your reset scope yet.</div>
            ) : (
              <div style={{
                display:             'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap:                 '0.75rem',
              }}>
                {users
                  .filter(u => resetScope.includes(u.role))
                  .map((u, i) => {
                    const rb = ROLE_BADGE[u.role] || ROLE_BADGE.guest
                    return (
                      <div key={u.user_id || i} style={{
                        background:   'rgba(255,255,255,0.02)',
                        border:       `1px solid ${BORDER}`,
                        borderRadius: '6px',
                        padding:      '12px',
                        display:      'flex',
                        alignItems:   'center',
                        justifyContent: 'space-between',
                        gap:          '0.75rem',
                      }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: DIM, fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {u.display_name || u.email || u.user_id}
                          </div>
                          <div style={{ color: rb.color, fontSize: '10px', letterSpacing: '0.1em', marginTop: '2px', textTransform: 'uppercase' }}>
                            {rb.label}
                          </div>
                        </div>
                        <button
                          onClick={() => { setResetTarget(u); setResetSuccess('') }}
                          style={{
                            background:    'rgba(201,168,76,0.08)',
                            border:        `1px solid ${GOLD}33`,
                            borderRadius:  '5px',
                            color:         GOLD,
                            padding:       '6px 12px',
                            cursor:        'pointer',
                            fontSize:      '10px',
                            letterSpacing: '0.1em',
                            flexShrink:    0,
                          }}
                        >
                          Reset PIN
                        </button>
                      </div>
                    )
                  })}
              </div>
            )}
          </Card>
        )}

        {/* ── Data Reset (admin+) ──────────────────────────── */}
        {canDataReset && (
          <Card style={{ marginBottom: '1.5rem' }}>
            <SectionTitle icon="delete_sweep" label="Data Reset" />

            <div style={{ color: '#555', fontSize: '11px', marginBottom: '1rem', letterSpacing: '0.04em', lineHeight: 1.6 }}>
              Reset individual data stores to their seed state. Changes take effect immediately — no restart needed.
              <span style={{ color: ERR, marginLeft: '6px' }}>Danger actions are irreversible.</span>
            </div>

            {dataResetMsg && (
              <div style={{
                color:         dataResetMsg.startsWith('✓') ? '#4CAF50' : ERR,
                fontSize:      '11px',
                marginBottom:  '1rem',
                letterSpacing: '0.04em',
              }}>
                {dataResetMsg}
              </div>
            )}

            <div style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap:                 '0.75rem',
            }}>
              {DATA_RESET_ACTIONS.map(action => (
                <div key={action.key} style={{
                  background:    'rgba(255,255,255,0.02)',
                  border:        `1px solid ${action.danger ? 'rgba(224,90,90,0.2)' : BORDER}`,
                  borderRadius:  '6px',
                  padding:       '12px',
                  display:       'flex',
                  flexDirection: 'column',
                  gap:           '8px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{
                      fontSize: '15px',
                      color:    action.danger ? ERR : DIM,
                      marginTop: '1px',
                      flexShrink: 0,
                    }}>
                      {action.danger ? 'warning' : 'refresh'}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: action.danger ? '#d97474' : DIM, fontSize: '12px', fontWeight: 500 }}>
                        {action.label}
                      </div>
                      <div style={{ color: '#444', fontSize: '10px', marginTop: '2px', letterSpacing: '0.04em', lineHeight: 1.5 }}>
                        {action.desc}
                      </div>
                    </div>
                  </div>

                  {dataResetPending?.key === action.key ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleDataReset(action)}
                        disabled={dataResetBusy}
                        style={{
                          flex:          1,
                          background:    dataResetBusy ? 'rgba(224,90,90,0.05)' : 'rgba(224,90,90,0.15)',
                          border:        `1px solid ${ERR}55`,
                          borderRadius:  '4px',
                          color:         dataResetBusy ? '#666' : ERR,
                          padding:       '5px 10px',
                          cursor:        dataResetBusy ? 'not-allowed' : 'pointer',
                          fontSize:      '10px',
                          letterSpacing: '0.1em',
                        }}
                      >
                        {dataResetBusy ? 'Resetting…' : 'Confirm Reset'}
                      </button>
                      <button
                        onClick={() => setDataResetPending(null)}
                        disabled={dataResetBusy}
                        style={{
                          background:    'rgba(255,255,255,0.04)',
                          border:        `1px solid ${BORDER}`,
                          borderRadius:  '4px',
                          color:         '#555',
                          padding:       '5px 10px',
                          cursor:        'pointer',
                          fontSize:      '10px',
                          letterSpacing: '0.1em',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setDataResetPending(action); setDataResetMsg('') }}
                      style={{
                        background:    action.danger ? 'rgba(224,90,90,0.08)' : 'rgba(201,168,76,0.08)',
                        border:        `1px solid ${action.danger ? ERR + '33' : GOLD + '33'}`,
                        borderRadius:  '4px',
                        color:         action.danger ? '#d97474' : GOLD,
                        padding:       '5px 10px',
                        cursor:        'pointer',
                        fontSize:      '10px',
                        letterSpacing: '0.1em',
                        textAlign:     'left',
                      }}
                    >
                      {action.label}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

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
          <span>NOVEE OS · Phase 9.5</span>
          <span>Admin Role: {roleLabel}</span>
          <span>Permissions: {permissions.length}</span>
        </div>
      </div>

      {/* ── PIN Reset Modal ───────────────────────────────── */}
      {resetTarget && (
        <PinResetModal
          user={resetTarget}
          onClose={() => setResetTarget(null)}
          onSuccess={(u) => {
            setResetTarget(null)
            setResetSuccess(`PIN reset for ${u.display_name || u.user_id}.`)
          }}
        />
      )}
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
