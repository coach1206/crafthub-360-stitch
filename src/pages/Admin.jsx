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
import LeaderboardMembersPanel from '../components/admin/LeaderboardMembersPanel.jsx'
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

function SectionTitle({ icon, label, badge }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: GOLD }}>{icon}</span>
      <span style={{ color: DIM, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
        {label}
      </span>
      {badge != null && (
        <span style={{
          background:   badge.recent ? 'rgba(201,168,76,0.18)' : 'rgba(100,100,100,0.18)',
          color:        badge.recent ? '#C9A84C'               : '#888',
          border:       `1px solid ${badge.recent ? 'rgba(201,168,76,0.4)' : 'rgba(100,100,100,0.3)'}`,
          borderRadius: '10px',
          fontSize:     '9px',
          fontWeight:   700,
          letterSpacing: '0.05em',
          padding:      '1px 7px',
          lineHeight:   '16px',
        }}>
          {badge.count} {badge.count === 1 ? 'reset' : 'resets'}
        </span>
      )}
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
  const [comingSoonTile, setComingSoonTile] = useState(null)
  const canResetPin = ['manager','admin','founder_level_0'].includes(role)
  const resetScope  = RESET_SCOPE[role] || []

  // ── Data Reset state ──────────────────────────────────────
  const canDataReset = ['admin','founder_level_0'].includes(role)
  const [dataResetPending, setDataResetPending] = useState(null)
  const [dataResetMsg,     setDataResetMsg]     = useState('')
  const [dataResetBusy,    setDataResetBusy]    = useState(false)
  const [resetAuditLog,    setResetAuditLog]    = useState([])
  const [clearAuditBusy,   setClearAuditBusy]   = useState(false)
  const [clearAuditMsg,    setClearAuditMsg]    = useState('')
  const [expandedAuditIds, setExpandedAuditIds] = useState(new Set())

  // ── Reset All state (founder_level_0 only) ────────────────
  const canResetAll      = role === 'founder_level_0'
  const RESET_ALL_PHRASE = 'RESET ALL STORES'
  const [resetAllStep,    setResetAllStep]    = useState(0) // 0=idle 1=confirm 2=results
  const [resetAllPhrase,  setResetAllPhrase]  = useState('')
  const [resetAllBusy,    setResetAllBusy]    = useState(false)
  const [resetAllResults, setResetAllResults] = useState(null)

  // ── Auto-Reset Schedule state (founder_level_0 only) ──────
  const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const [schedule,     setScheduleState] = useState(null)
  const [schedEnabled, setSchedEnabled]  = useState(false)
  const [schedDay,     setSchedDay]      = useState(5)
  const [schedHour,    setSchedHour]     = useState(18)
  const [schedMinute,  setSchedMinute]   = useState(0)
  const [schedBusy,    setSchedBusy]     = useState(false)
  const [schedMsg,     setSchedMsg]      = useState('')

  function loadSchedule() {
    adminApi.getResetSchedule()
      .then(r => {
        if (r?.success && r.data) {
          const s = r.data
          setScheduleState(s)
          setSchedEnabled(!!s.enabled)
          setSchedDay(s.dayOfWeek ?? 5)
          setSchedHour(s.hour ?? 18)
          setSchedMinute(s.minute ?? 0)
        }
      })
      .catch(() => {})
  }

  async function handleSaveSchedule() {
    setSchedBusy(true)
    setSchedMsg('')
    try {
      const r = await adminApi.setResetSchedule({
        enabled:   schedEnabled,
        dayOfWeek: schedDay,
        hour:      schedHour,
        minute:    schedMinute,
      })
      if (r?.success) {
        setScheduleState(r.data)
        setSchedMsg(schedEnabled
          ? `✓ Scheduled — every ${DAY_NAMES[schedDay]} at ${String(schedHour).padStart(2,'0')}:${String(schedMinute).padStart(2,'0')}`
          : '✓ Schedule disabled.')
      } else {
        setSchedMsg(`✗ ${r?.message || 'Failed to save schedule.'}`)
      }
    } catch {
      setSchedMsg('✗ Network error saving schedule.')
    } finally {
      setSchedBusy(false)
      setTimeout(() => setSchedMsg(''), 4000)
    }
  }

  function loadResetAudit() {
    adminApi.getResetAudit(25)
      .then(r => { if (r?.data?.log) setResetAuditLog(r.data.log) })
      .catch(() => {})
  }

  function handleClearAudit() {
    if (!window.confirm('Clear the entire reset history log? This cannot be undone.')) return
    setClearAuditBusy(true)
    setClearAuditMsg('')
    adminApi.clearResetAudit()
      .then(() => {
        setResetAuditLog([])
        setClearAuditMsg('History cleared.')
        setTimeout(() => setClearAuditMsg(''), 3000)
      })
      .catch(() => setClearAuditMsg('Failed to clear history.'))
      .finally(() => setClearAuditBusy(false))
  }

  // ── Access Requests Inbox — T019 ──────────────────────────
  const [accessRequests,   setAccessRequests]   = useState([])
  const [loadingRequests,  setLoadingRequests]  = useState(false)
  const [requestActionId,  setRequestActionId]  = useState(null)
  const [requestActionMsg, setRequestActionMsg] = useState('')

  const PROTOTYPE_ACCESS_REQUESTS = [
    { id: 'AR-001', requester_name: 'Guest #8821',    requested_role: 'passport_member', reason: 'Regular lounge visitor — interested in Passport membership.',       status: 'pending',  created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 'AR-002', requester_name: 'Staff #STF-003', requested_role: 'manager',         reason: 'Promoted to floor manager, needs manager-level POS access.',         status: 'pending',  created_at: new Date(Date.now() - 36000000).toISOString() },
    { id: 'AR-003', requester_name: 'Guest #9102',    requested_role: 'human_mentor',    reason: 'Certified tobacconist, wants to mentor SmokeCraft sessions.',        status: 'pending',  created_at: new Date(Date.now() - 172800000).toISOString() },
    { id: 'AR-004', requester_name: 'Guest #7755',    requested_role: 'passport_member', reason: 'Frequent visitor — has 3 passport stamps already.',                  status: 'approved', created_at: new Date(Date.now() - 259200000).toISOString() },
  ]

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

    // Load access requests
    setLoadingRequests(true)
    fetch('/api/access-requests?status=all', { credentials: 'include' })
      .then(r => r.json())
      .then(body => {
        if (Array.isArray(body?.data) && body.data.length) setAccessRequests(body.data)
        else setAccessRequests(PROTOTYPE_ACCESS_REQUESTS)
      })
      .catch(() => setAccessRequests(PROTOTYPE_ACCESS_REQUESTS))
      .finally(() => setLoadingRequests(false))

    if (canDataReset) loadResetAudit()
    if (canResetAll) loadSchedule()
  }, [canViewSync, canDataReset]) // eslint-disable-line react-hooks/exhaustive-deps

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
        loadResetAudit()
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

  async function handleResetAll() {
    if (resetAllPhrase !== RESET_ALL_PHRASE) return
    setResetAllBusy(true)
    try {
      const r = await adminApi.resetAllStores()
      if (r?.success) {
        setResetAllResults(r.data)
        setResetAllStep(2)
        loadResetAudit()
      } else {
        setResetAllResults({ error: r?.message || 'Reset All failed — check backend.' })
        setResetAllStep(2)
      }
    } catch {
      setResetAllResults({ error: 'Network error during Reset All.' })
      setResetAllStep(2)
    } finally {
      setResetAllBusy(false)
      setResetAllPhrase('')
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
            <NavTile icon="fact_check" label="Audit Logs" color="#96CEB4" onClick={() => setComingSoonTile('Audit Logs')} />
          </PermissionGate>
          <PermissionGate permission="manage_staff">
            <NavTile icon="group" label="Staff Management" color={DIM} onClick={() => setComingSoonTile('Staff Management')} />
          </PermissionGate>
          <PermissionGate permission="manage_integrations">
            <NavTile icon="hub" label="Integrations" color={DIM} onClick={() => setComingSoonTile('Integrations')} />
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
            <SectionTitle
              icon="delete_sweep"
              label="Data Reset"
              badge={resetAuditLog.length > 0 ? {
                count:  resetAuditLog.length,
                recent: resetAuditLog.some(e => {
                  try { return (Date.now() - new Date(e.timestamp).getTime()) < 86_400_000 } catch { return false }
                }),
              } : null}
            />

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

            {/* ── Reset All Stores (founder_level_0 only) ──── */}
            {canResetAll && (
              <div style={{
                marginTop:    '1.5rem',
                border:       `1px solid rgba(224,90,90,0.35)`,
                borderRadius: '8px',
                padding:      '14px 16px',
                background:   'rgba(224,90,90,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: ERR }}>
                    emergency_home
                  </span>
                  <span style={{ color: ERR, fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em' }}>
                    Reset All Stores
                  </span>
                  <span style={{
                    background:    'rgba(224,90,90,0.15)',
                    border:        `1px solid ${ERR}44`,
                    borderRadius:  '3px',
                    color:         ERR,
                    fontSize:      '9px',
                    padding:       '1px 5px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}>
                    founder only
                  </span>
                </div>

                <div style={{ color: '#555', fontSize: '11px', letterSpacing: '0.04em', lineHeight: 1.6, marginBottom: '10px' }}>
                  Runs all 7 resets at once — XP, activity, members, concierge, stamps, ticker, and badges.
                  Use before event nights for a clean slate.
                </div>

                {resetAllStep === 0 && (
                  <button
                    onClick={() => { setResetAllStep(1); setResetAllPhrase(''); setResetAllResults(null) }}
                    style={{
                      background:    'rgba(224,90,90,0.10)',
                      border:        `1px solid ${ERR}44`,
                      borderRadius:  '4px',
                      color:         ERR,
                      padding:       '6px 14px',
                      cursor:        'pointer',
                      fontSize:      '11px',
                      letterSpacing: '0.08em',
                      fontWeight:    500,
                    }}
                  >
                    Reset All Stores…
                  </button>
                )}

                {resetAllStep === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ color: ERR, fontSize: '11px', letterSpacing: '0.04em' }}>
                      Type <strong style={{ fontFamily: 'monospace' }}>{RESET_ALL_PHRASE}</strong> to confirm:
                    </div>
                    <input
                      type="text"
                      value={resetAllPhrase}
                      onChange={e => setResetAllPhrase(e.target.value)}
                      placeholder={RESET_ALL_PHRASE}
                      disabled={resetAllBusy}
                      style={{
                        background:    'rgba(255,255,255,0.04)',
                        border:        `1px solid ${resetAllPhrase === RESET_ALL_PHRASE ? ERR : BORDER}`,
                        borderRadius:  '4px',
                        color:         resetAllPhrase === RESET_ALL_PHRASE ? ERR : DIM,
                        padding:       '6px 10px',
                        fontSize:      '12px',
                        fontFamily:    'monospace',
                        outline:       'none',
                        width:         '100%',
                        boxSizing:     'border-box',
                        letterSpacing: '0.08em',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={handleResetAll}
                        disabled={resetAllBusy || resetAllPhrase !== RESET_ALL_PHRASE}
                        style={{
                          background:    resetAllPhrase === RESET_ALL_PHRASE && !resetAllBusy ? 'rgba(224,90,90,0.18)' : 'rgba(224,90,90,0.05)',
                          border:        `1px solid ${ERR}55`,
                          borderRadius:  '4px',
                          color:         resetAllPhrase === RESET_ALL_PHRASE && !resetAllBusy ? ERR : '#555',
                          padding:       '5px 14px',
                          cursor:        resetAllPhrase === RESET_ALL_PHRASE && !resetAllBusy ? 'pointer' : 'not-allowed',
                          fontSize:      '11px',
                          letterSpacing: '0.08em',
                        }}
                      >
                        {resetAllBusy ? 'Resetting…' : 'Confirm — Reset All'}
                      </button>
                      <button
                        onClick={() => { setResetAllStep(0); setResetAllPhrase('') }}
                        disabled={resetAllBusy}
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
                  </div>
                )}

                {resetAllStep === 2 && resetAllResults && (
                  <div>
                    {resetAllResults.error ? (
                      <div style={{ color: ERR, fontSize: '11px', letterSpacing: '0.04em', marginBottom: '8px' }}>
                        ✗ {resetAllResults.error}
                      </div>
                    ) : (
                      <>
                        <div style={{
                          color:         resetAllResults.summary?.failed === 0 ? '#4CAF50' : ERR,
                          fontSize:      '11px',
                          letterSpacing: '0.04em',
                          marginBottom:  '8px',
                        }}>
                          {resetAllResults.summary?.failed === 0
                            ? `✓ ${resetAllResults.message || 'All stores reset successfully'}`
                            : `⚠ ${resetAllResults.message}`}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {(resetAllResults.results || []).map(r => (
                            <div key={r.store} style={{
                              display:    'flex',
                              alignItems: 'center',
                              gap:        '6px',
                              fontSize:   '10px',
                              color:      r.success ? '#4CAF50' : ERR,
                              letterSpacing: '0.04em',
                            }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>
                                {r.success ? 'check_circle' : 'cancel'}
                              </span>
                              <span>{r.label}</span>
                              {!r.success && r.error && (
                                <span style={{ color: '#555', marginLeft: '4px' }}>— {r.error}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    <button
                      onClick={() => { setResetAllStep(0); setResetAllResults(null) }}
                      style={{
                        marginTop:     '10px',
                        background:    'rgba(255,255,255,0.04)',
                        border:        `1px solid ${BORDER}`,
                        borderRadius:  '4px',
                        color:         '#555',
                        padding:       '4px 10px',
                        cursor:        'pointer',
                        fontSize:      '10px',
                        letterSpacing: '0.1em',
                      }}
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Auto-Reset Schedule (founder_level_0 only) ── */}
            {canResetAll && (
              <div style={{
                marginTop:    '1.5rem',
                border:       `1px solid rgba(201,168,76,0.25)`,
                borderRadius: '8px',
                padding:      '14px 16px',
                background:   'rgba(201,168,76,0.03)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: GOLD }}>
                    schedule
                  </span>
                  <span style={{ color: GOLD, fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em' }}>
                    Auto-Reset Schedule
                  </span>
                  <span style={{
                    background:    'rgba(201,168,76,0.15)',
                    border:        `1px solid ${GOLD}44`,
                    borderRadius:  '3px',
                    color:         GOLD,
                    fontSize:      '9px',
                    padding:       '1px 5px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}>
                    founder only
                  </span>
                </div>

                <div style={{ color: '#555', fontSize: '11px', letterSpacing: '0.04em', lineHeight: 1.6, marginBottom: '10px' }}>
                  Automatically run Reset All before event night — no manual step needed.
                  Fires at the configured day + time every week.
                </div>

                {schedule && (
                  <div style={{
                    fontSize:      '11px',
                    letterSpacing: '0.04em',
                    marginBottom:  '12px',
                    display:       'flex',
                    alignItems:    'center',
                    gap:           '8px',
                    flexWrap:      'wrap',
                  }}>
                    <span style={{
                      display:      'inline-flex',
                      alignItems:   'center',
                      gap:          '4px',
                      background:   schedule.enabled ? 'rgba(76,175,80,0.12)' : 'rgba(100,100,100,0.12)',
                      border:       `1px solid ${schedule.enabled ? '#4CAF5055' : '#55555533'}`,
                      borderRadius: '4px',
                      color:        schedule.enabled ? '#4CAF50' : '#555',
                      padding:      '2px 8px',
                      fontSize:     '10px',
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>
                        {schedule.enabled ? 'check_circle' : 'cancel'}
                      </span>
                      {schedule.enabled
                        ? `Every ${DAY_NAMES[schedule.dayOfWeek]} at ${String(schedule.hour).padStart(2,'0')}:${String(schedule.minute).padStart(2,'0')}`
                        : 'Disabled'}
                    </span>
                    {schedule.lastScheduledRun && (
                      <span style={{ color: '#444', fontSize: '10px' }}>
                        Last run: {(() => { try { return new Date(schedule.lastScheduledRun).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) } catch { return schedule.lastScheduledRun } })()}
                      </span>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <label style={{
                    display:    'flex',
                    alignItems: 'center',
                    gap:        '5px',
                    color:      schedEnabled ? '#4CAF50' : '#555',
                    fontSize:   '11px',
                    cursor:     'pointer',
                    userSelect: 'none',
                  }}>
                    <input
                      type="checkbox"
                      checked={schedEnabled}
                      onChange={e => setSchedEnabled(e.target.checked)}
                      style={{ accentColor: '#4CAF50', width: '13px', height: '13px' }}
                    />
                    Enable
                  </label>

                  <select
                    value={schedDay}
                    onChange={e => setSchedDay(Number(e.target.value))}
                    style={{
                      background:    'rgba(255,255,255,0.04)',
                      border:        `1px solid ${BORDER}`,
                      borderRadius:  '4px',
                      color:         DIM,
                      padding:       '4px 8px',
                      fontSize:      '11px',
                      outline:       'none',
                      cursor:        'pointer',
                    }}
                  >
                    {DAY_NAMES.map((d, i) => (
                      <option key={i} value={i} style={{ background: '#1a1008', color: DIM }}>{d}</option>
                    ))}
                  </select>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <select
                      value={schedHour}
                      onChange={e => setSchedHour(Number(e.target.value))}
                      style={{
                        background:    'rgba(255,255,255,0.04)',
                        border:        `1px solid ${BORDER}`,
                        borderRadius:  '4px',
                        color:         DIM,
                        padding:       '4px 6px',
                        fontSize:      '11px',
                        outline:       'none',
                        cursor:        'pointer',
                        fontFamily:    'monospace',
                      }}
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i} style={{ background: '#1a1008', color: DIM }}>
                          {String(i).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                    <span style={{ color: '#444', fontSize: '11px' }}>:</span>
                    <select
                      value={schedMinute}
                      onChange={e => setSchedMinute(Number(e.target.value))}
                      style={{
                        background:    'rgba(255,255,255,0.04)',
                        border:        `1px solid ${BORDER}`,
                        borderRadius:  '4px',
                        color:         DIM,
                        padding:       '4px 6px',
                        fontSize:      '11px',
                        outline:       'none',
                        cursor:        'pointer',
                        fontFamily:    'monospace',
                      }}
                    >
                      {[0,5,10,15,20,25,30,35,40,45,50,55].map(m => (
                        <option key={m} value={m} style={{ background: '#1a1008', color: DIM }}>
                          {String(m).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleSaveSchedule}
                    disabled={schedBusy}
                    style={{
                      background:    schedBusy ? 'rgba(201,168,76,0.05)' : 'rgba(201,168,76,0.12)',
                      border:        `1px solid ${GOLD}44`,
                      borderRadius:  '4px',
                      color:         schedBusy ? '#555' : GOLD,
                      padding:       '5px 12px',
                      cursor:        schedBusy ? 'not-allowed' : 'pointer',
                      fontSize:      '11px',
                      letterSpacing: '0.06em',
                      fontWeight:    500,
                    }}
                  >
                    {schedBusy ? 'Saving…' : 'Save Schedule'}
                  </button>
                </div>

                {schedMsg && (
                  <div style={{
                    marginTop:     '8px',
                    fontSize:      '11px',
                    color:         schedMsg.startsWith('✓') ? '#4CAF50' : ERR,
                    letterSpacing: '0.04em',
                  }}>
                    {schedMsg}
                  </div>
                )}
              </div>
            )}

            {/* ── Reset History Log ─────────────────────────── */}
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <div style={{ color: '#333', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                  Reset History
                </div>
                {canResetAll && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {clearAuditMsg && (
                      <span style={{ fontSize: '10px', color: clearAuditMsg.startsWith('Failed') ? '#c0392b' : '#27ae60', letterSpacing: '0.04em' }}>
                        {clearAuditMsg}
                      </span>
                    )}
                    <button
                      onClick={handleClearAudit}
                      disabled={clearAuditBusy || resetAuditLog.length === 0}
                      style={{
                        fontSize:      '10px',
                        letterSpacing: '0.08em',
                        padding:       '3px 10px',
                        border:        '1px solid #ccc',
                        borderRadius:  '4px',
                        background:    'transparent',
                        color:         '#555',
                        cursor:        (clearAuditBusy || resetAuditLog.length === 0) ? 'not-allowed' : 'pointer',
                        opacity:       (clearAuditBusy || resetAuditLog.length === 0) ? 0.45 : 1,
                      }}
                    >
                      {clearAuditBusy ? 'Clearing…' : 'Clear History'}
                    </button>
                  </div>
                )}
              </div>
              {resetAuditLog.length === 0 ? (
                <div style={{ color: '#333', fontSize: '11px', letterSpacing: '0.04em' }}>
                  No resets recorded yet.
                </div>
              ) : (
                <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                  {resetAuditLog.map((entry, i) => {
                    const storeLabels = {
                      'ranking-xp':       'Leaderboard XP',
                      'ranking-activity': 'Activity Log',
                      'ranking-members':  'Member Roster',
                      'travel-concierge': 'Concierge Requests',
                      'travel-stamps':    'Travel Stamps',
                      'ticker-feed':      'Ticker Feed',
                      'badges':           'Badge Progress',
                    }
                    const actor = entry.actorName || entry.actorEmail || entry.actorId || 'unknown'
                    const roleLabel = ROLE_BADGE[entry.actorRole]?.label || entry.actorRole
                    let dateStr = '—'
                    try { dateStr = new Date(entry.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) } catch {}

                    const isResetAll = entry.store === 'reset-all'
                    const entryId    = entry.id || i
                    const isExpanded = expandedAuditIds.has(entryId)

                    if (isResetAll) {
                      const subStores  = Array.isArray(entry.stores) ? entry.stores : []
                      const storeCount = subStores.length
                      const failCount  = subStores.filter(s => s.success === false).length
                      return (
                        <div key={entryId} style={{ borderBottom: `1px solid ${BORDER}`, padding: '7px 0', fontSize: '11px' }}>
                          <div
                            onClick={() => setExpandedAuditIds(prev => {
                              const next = new Set(prev)
                              next.has(entryId) ? next.delete(entryId) : next.add(entryId)
                              return next
                            })}
                            style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer', flexWrap: 'wrap' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#444', marginTop: '1px', flexShrink: 0 }}>
                              {isExpanded ? 'expand_less' : 'expand_more'}
                            </span>
                            <span style={{ color: DIM, minWidth: '120px', fontWeight: 600 }}>
                              Reset All
                              <span style={{ fontWeight: 400, marginLeft: '4px' }}>
                                — {storeCount} store{storeCount !== 1 ? 's' : ''}
                                {failCount > 0 && (
                                  <span style={{ color: '#b94040', marginLeft: '4px' }}>({failCount} failed)</span>
                                )}
                              </span>
                            </span>
                            <span style={{ color: '#444', flex: 1, minWidth: '80px' }}>
                              {actor}
                              {entry.actorRole && (
                                <span style={{ color: ROLE_BADGE[entry.actorRole]?.color || '#555', marginLeft: '6px', fontSize: '10px', letterSpacing: '0.06em' }}>
                                  {roleLabel}
                                </span>
                              )}
                            </span>
                            {entry.source === 'scheduled' && (
                              <span style={{
                                background: 'rgba(201,168,76,0.12)', border: `1px solid ${GOLD}44`,
                                borderRadius: '3px', color: GOLD, fontSize: '9px', padding: '1px 5px',
                                letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0,
                              }}>
                                scheduled
                              </span>
                            )}
                            <span style={{ color: '#333', fontFamily: 'monospace', fontSize: '10px', whiteSpace: 'nowrap' }}>
                              {dateStr}
                            </span>
                          </div>
                          {isExpanded && subStores.length > 0 && (
                            <div style={{ marginTop: '5px', paddingLeft: '23px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              {subStores.map((s, si) => (
                                <div key={si} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: s.success === false ? '#b94040' : '#555' }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>
                                    {s.success === false ? 'error' : 'check_circle'}
                                  </span>
                                  {storeLabels[s.key] || s.key}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    }

                    const storeLabel = storeLabels[entry.store] || entry.store
                    return (
                      <div key={entryId} style={{
                        display:       'flex',
                        gap:           '10px',
                        alignItems:    'flex-start',
                        padding:       '7px 0',
                        borderBottom:  `1px solid ${BORDER}`,
                        fontSize:      '11px',
                        flexWrap:      'wrap',
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#444', marginTop: '1px', flexShrink: 0 }}>
                          history
                        </span>
                        <span style={{ color: DIM, minWidth: '120px' }}>{storeLabel}</span>
                        <span style={{ color: '#444', flex: 1, minWidth: '80px' }}>
                          {actor}
                          {entry.actorRole && (
                            <span style={{ color: ROLE_BADGE[entry.actorRole]?.color || '#555', marginLeft: '6px', fontSize: '10px', letterSpacing: '0.06em' }}>
                              {roleLabel}
                            </span>
                          )}
                        </span>
                        {entry.source === 'scheduled' && (
                          <span style={{
                            background:    'rgba(201,168,76,0.12)',
                            border:        `1px solid ${GOLD}44`,
                            borderRadius:  '3px',
                            color:         GOLD,
                            fontSize:      '9px',
                            padding:       '1px 5px',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            whiteSpace:    'nowrap',
                            flexShrink:    0,
                          }}>
                            scheduled
                          </span>
                        )}
                        <span style={{ color: '#333', fontFamily: 'monospace', fontSize: '10px', whiteSpace: 'nowrap' }}>
                          {dateStr}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* ── Leaderboard Members (admin+) ─────────────────── */}
        {canDataReset && (
          <Card style={{ marginBottom: '1.5rem' }}>
            <SectionTitle icon="leaderboard" label="Leaderboard Members" />
            <div style={{ color: '#555', fontSize: '11px', marginBottom: '1rem', letterSpacing: '0.04em', lineHeight: 1.6 }}>
              Manage the Grand Lounge roster. Add new members, edit names or badges, or remove members from the leaderboard.
            </div>
            <LeaderboardMembersPanel />
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

        {/* ── Access Requests Inbox — T019 ─────────────────── */}
        <div style={{ marginTop: '2.5rem' }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: GOLD }}>inbox</span>
              <span style={{ color: DIM, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', flex: 1 }}>
                Access Requests Inbox
              </span>
              {accessRequests.filter(r => r.status === 'pending').length > 0 && (
                <span style={{
                  background: GOLD, color: '#0a0603', borderRadius: 10,
                  fontSize: 8, fontWeight: 700, padding: '2px 7px',
                  fontFamily: '"JetBrains Mono", monospace',
                }}>
                  {accessRequests.filter(r => r.status === 'pending').length} PENDING
                </span>
              )}
            </div>

            {requestActionMsg && (
              <div style={{
                marginBottom: '1rem', padding: '7px 12px', borderRadius: 4,
                background: requestActionMsg.startsWith('✓') ? 'rgba(76,175,80,0.08)' : 'rgba(204,51,51,0.08)',
                border: `1px solid ${requestActionMsg.startsWith('✓') ? '#4caf5044' : '#cc333344'}`,
                color:  requestActionMsg.startsWith('✓') ? '#4caf80' : 'rgba(220,80,80,0.9)',
                fontSize: 11, letterSpacing: '0.06em',
              }}>
                {requestActionMsg}
              </div>
            )}

            {loadingRequests ? (
              <div style={{ color: '#444', fontSize: '12px', padding: '1rem 0' }}>Loading access requests…</div>
            ) : accessRequests.length === 0 ? (
              <div style={{ color: '#444', fontSize: '12px', padding: '0.5rem 0' }}>No access requests on file.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {accessRequests.map(req => {
                  const isPending = req.status === 'pending'
                  const statusColors = { pending: GOLD, approved: '#4caf50', denied: ERR }
                  const sc = statusColors[req.status] || '#666'
                  return (
                    <div key={req.id} style={{
                      padding:      '12px 14px',
                      background:   isPending ? 'rgba(201,168,76,0.04)' : 'rgba(255,255,255,0.01)',
                      border:       `1px solid ${isPending ? 'rgba(201,168,76,0.15)' : BORDER}`,
                      borderRadius: 6,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                        <div>
                          <span style={{ color: GOLD, fontSize: 12, letterSpacing: '0.06em', marginRight: 8 }}>
                            {req.requester_name || req.requester_email || 'Unknown'}
                          </span>
                          <span style={{
                            background: sc + '15', border: `1px solid ${sc}33`,
                            borderRadius: 8, color: sc + 'cc', fontSize: 9,
                            letterSpacing: '0.14em', padding: '2px 7px',
                            fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase',
                          }}>
                            {req.status}
                          </span>
                        </div>
                        <span style={{ color: '#444', fontSize: 10, fontFamily: 'monospace' }}>
                          {req.created_at ? new Date(req.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                        </span>
                      </div>

                      <div style={{ color: '#555', fontSize: 10, fontFamily: 'monospace', marginBottom: req.reason ? 8 : 0 }}>
                        Requesting: <span style={{ color: DIM }}>{req.requested_role}</span>
                      </div>

                      {req.reason && (
                        <div style={{
                          color: '#4a4030', fontSize: 11, lineHeight: 1.6,
                          padding: '6px 10px', background: 'rgba(201,168,76,0.02)',
                          border: `1px solid ${BORDER}`, borderRadius: 4, marginBottom: isPending ? 10 : 0,
                        }}>
                          "{req.reason}"
                        </div>
                      )}

                      {isPending && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            disabled={requestActionId === req.id}
                            onClick={async () => {
                              setRequestActionId(req.id)
                              setRequestActionMsg('')
                              try {
                                const r = await fetch(`/api/access-requests/${req.id}/approve`, { method: 'POST', credentials: 'include' })
                                const b = await r.json()
                                if (b.success) {
                                  setAccessRequests(prev => prev.map(x => x.id === req.id ? { ...x, status: 'approved' } : x))
                                  setRequestActionMsg(`✓ Request approved — ${req.requester_name}.`)
                                } else {
                                  setAccessRequests(prev => prev.map(x => x.id === req.id ? { ...x, status: 'approved' } : x))
                                  setRequestActionMsg(`✓ [Prototype] Marked approved.`)
                                }
                              } catch {
                                setAccessRequests(prev => prev.map(x => x.id === req.id ? { ...x, status: 'approved' } : x))
                                setRequestActionMsg(`✓ [Prototype] Marked approved.`)
                              }
                              setRequestActionId(null)
                            }}
                            style={{
                              padding: '5px 12px', background: 'rgba(76,175,80,0.1)',
                              border: '1px solid rgba(76,175,80,0.3)', borderRadius: 4,
                              color: '#4caf80', fontSize: 10, letterSpacing: '0.12em',
                              cursor: requestActionId === req.id ? 'not-allowed' : 'pointer',
                              textTransform: 'uppercase', fontFamily: 'Georgia, serif',
                            }}
                          >
                            {requestActionId === req.id ? '…' : 'Approve'}
                          </button>
                          <button
                            disabled={requestActionId === req.id}
                            onClick={async () => {
                              setRequestActionId(req.id)
                              setRequestActionMsg('')
                              try {
                                const r = await fetch(`/api/access-requests/${req.id}/deny`, { method: 'POST', credentials: 'include' })
                                const b = await r.json()
                                setAccessRequests(prev => prev.map(x => x.id === req.id ? { ...x, status: 'denied' } : x))
                                setRequestActionMsg(b.success ? `✗ Request denied.` : `✗ [Prototype] Marked denied.`)
                              } catch {
                                setAccessRequests(prev => prev.map(x => x.id === req.id ? { ...x, status: 'denied' } : x))
                                setRequestActionMsg(`✗ [Prototype] Marked denied.`)
                              }
                              setRequestActionId(null)
                            }}
                            style={{
                              padding: '5px 12px', background: 'rgba(204,51,51,0.08)',
                              border: '1px solid rgba(204,51,51,0.25)', borderRadius: 4,
                              color: ERR + 'aa', fontSize: 10, letterSpacing: '0.12em',
                              cursor: requestActionId === req.id ? 'not-allowed' : 'pointer',
                              textTransform: 'uppercase', fontFamily: 'Georgia, serif',
                            }}
                          >
                            Deny
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
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
          <span>NOVEE OS · Phase 10</span>
          <span>Admin Role: {roleLabel}</span>
          <span>Permissions: {permissions.length}</span>
        </div>
      </div>

      {/* ── Coming Soon / Backend Pending Panel ─────────────── */}
      {comingSoonTile && (
        <NavTileComingSoonPanel label={comingSoonTile} onClose={() => setComingSoonTile(null)} />
      )}

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

function NavTile({ icon, label, href, color, highlight = false, onClick }) {
  const tileStyle = {
    display:        'flex',
    flexDirection:  'column',
    gap:            '0.5rem',
    background:     highlight ? `rgba(201,168,76,0.07)` : CARD,
    border:         `1px solid ${highlight ? GOLD + '44' : BORDER}`,
    borderRadius:   '8px',
    padding:        '1rem 1.25rem',
    textDecoration: 'none',
    cursor:         'pointer',
  }

  const inner = (
    <>
      <span className="material-symbols-outlined" style={{ fontSize: '22px', color }}>{icon}</span>
      <span style={{ color: color || DIM, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </>
  )

  const navTileCss = (
    <style>{`
      .admin-nav-tile { transition: border-color 0.2s, background 0.2s, transform 0.1s; }
      .admin-nav-tile:hover { border-color: ${GOLD}88 !important; background: rgba(201,168,76,0.08); }
      .admin-nav-tile:active { transform: scale(0.97); }
      .admin-nav-tile:focus-visible { outline: 2px solid ${GOLD}; outline-offset: 2px; }
    `}</style>
  )

  // No real route yet — render as a real button that opens a Coming Soon /
  // Backend Pending panel rather than a dead href="#" link.
  if (onClick) {
    return (
      <>
        {navTileCss}
        <button
          type="button"
          onClick={onClick}
          aria-label={`${label} — coming soon`}
          className="admin-nav-tile"
          style={{ ...tileStyle, textAlign: 'left', font: 'inherit' }}
        >
          {inner}
        </button>
      </>
    )
  }

  return (
    <>
      {navTileCss}
      <a href={href} aria-label={label} className="admin-nav-tile" style={tileStyle}>
        {inner}
      </a>
    </>
  )
}

function NavTileComingSoonPanel({ label, onClose }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${label} — coming soon`}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10000,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background:   CARD,
          border:       `1px solid ${BORDER}`,
          borderRadius: '12px',
          padding:      'clamp(1.5rem, 4vw, 2rem)',
          width:        '100%',
          maxWidth:     '360px',
          fontFamily:   'Georgia, serif',
          textAlign:    'center',
        }}
        onClick={e => e.stopPropagation()}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '32px', color: GOLD, marginBottom: '0.75rem', display: 'inline-block' }}>
          schedule
        </span>
        <div style={{ color: DIM, fontSize: '9px', letterSpacing: '0.25em', marginBottom: '0.6rem' }}>
          BACKEND PENDING
        </div>
        <div style={{ color: GOLD, fontSize: '15px', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
          {label}
        </div>
        <p style={{ color: '#999', fontSize: '12px', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
          This panel isn't wired to a real backend yet. It will become available once the {label} module is built out.
        </p>
        <button
          type="button"
          onClick={onClose}
          style={{
            background:   'rgba(201,168,76,0.1)',
            border:       `1px solid ${BORDER}`,
            borderRadius: '6px',
            color:        GOLD,
            fontSize:     '11px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding:      '0.6rem 1.5rem',
            cursor:       'pointer',
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}
