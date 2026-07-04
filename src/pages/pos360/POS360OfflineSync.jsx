/**
 * POS360 Offline Sync UI (Phase B.6)
 * Route: /pos3/sync
 */

import React, { useState, useEffect, useCallback } from 'react'
import { usePOS360VenueContextHook } from '../../utils/pos360VenueContext.js'

// ── Design tokens ──────────────────────────────────────────────────────────────
const DARK_BG    = '#080604'
const GOLD       = '#c9952c'
const DARK_CARD  = '#13110d'
const DARK_LINE  = '#2a2520'
const DARK_TEXT  = '#f0ead8'
const DARK_MUTE  = '#8a7e6a'
const RED        = '#c0392b'
const GREEN      = '#27ae60'
const BLUE       = '#2980b9'
const AMBER      = '#e67e22'

// ── Shared badge helper ────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    queued: { bg: BLUE, label: 'Queued' },
    replaying: { bg: AMBER, label: 'Replaying' },
    replayed: { bg: GREEN, label: 'Replayed' },
    failed: { bg: RED, label: 'Failed' },
    dead_lettered: { bg: '#7d3c98', label: 'Dead Letter' },
    manager_review: { bg: AMBER, label: 'Review' },
    duplicate_blocked: { bg: DARK_MUTE, label: 'Duplicate' },
    canceled: { bg: DARK_MUTE, label: 'Canceled' },
    online: { bg: GREEN, label: 'Online' },
    offline: { bg: RED, label: 'Offline' },
    pending: { bg: BLUE, label: 'Pending' },
    completed: { bg: GREEN, label: 'Completed' },
    paused: { bg: AMBER, label: 'Paused' },
  }
  const s = map[status] ?? { bg: DARK_MUTE, label: status ?? '—' }
  return (
    <span style={{
      background: s.bg,
      color: '#fff',
      borderRadius: 4,
      padding: '2px 8px',
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'uppercase',
    }}>{s.label}</span>
  )
}

// ── OfflineStatusBanner ────────────────────────────────────────────────────────
function OfflineStatusBanner({ isOnline, queueCount }) {
  if (isOnline && !queueCount) return null
  return (
    <div style={{
      background: isOnline ? GREEN : RED,
      color: '#fff',
      padding: '10px 20px',
      borderRadius: 6,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
      fontWeight: 600,
    }}>
      <span>{isOnline ? '✓ Online' : '⚠ Offline Mode'}</span>
      {!isOnline && queueCount > 0 && (
        <span style={{ opacity: 0.85, fontWeight: 400 }}>{queueCount} actions queued</span>
      )}
      {isOnline && queueCount > 0 && (
        <span style={{ opacity: 0.85, fontWeight: 400 }}>Syncing {queueCount} queued actions…</span>
      )}
    </div>
  )
}

// ── LanguageSelector ───────────────────────────────────────────────────────────
function LanguageSelector({ lang, onChange }) {
  const languages = [
    { code: 'en-US', label: 'Language' },
    { code: 'es-DO', label: 'Idioma (es-DO)' },
    { code: 'es',    label: 'Idioma (es)' },
    { code: 'ht',    label: 'Lang (ht)' },
    { code: 'de',    label: 'Sprache' },
    { code: 'pt',    label: 'Idioma (pt)' },
  ]
  return (
    <select
      value={lang}
      onChange={e => onChange(e.target.value)}
      style={{
        background: DARK_CARD,
        border: `1px solid ${DARK_LINE}`,
        color: DARK_TEXT,
        borderRadius: 6,
        padding: '6px 12px',
        fontSize: 13,
        cursor: 'pointer',
      }}
    >
      {languages.map(l => (
        <option key={l.code} value={l.code}>{l.label}</option>
      ))}
    </select>
  )
}

// ── ManualSyncButton ───────────────────────────────────────────────────────────
function ManualSyncButton({ onSync, syncing }) {
  return (
    <button
      onClick={onSync}
      disabled={syncing}
      style={{
        background: syncing ? DARK_LINE : GOLD,
        color: syncing ? DARK_MUTE : '#000',
        border: 'none',
        borderRadius: 6,
        padding: '8px 20px',
        fontWeight: 700,
        fontSize: 13,
        cursor: syncing ? 'not-allowed' : 'pointer',
      }}
    >
      {syncing ? 'Syncing…' : 'Sync Now'}
    </button>
  )
}

// ── RetrySyncButton ────────────────────────────────────────────────────────────
function RetrySyncButton({ onRetry, disabled }) {
  return (
    <button
      onClick={onRetry}
      disabled={disabled}
      style={{
        background: disabled ? DARK_LINE : AMBER,
        color: disabled ? DARK_MUTE : '#000',
        border: 'none',
        borderRadius: 6,
        padding: '8px 18px',
        fontWeight: 700,
        fontSize: 13,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      Retry Sync
    </button>
  )
}

// ── EmergencySyncPriorityPanel ─────────────────────────────────────────────────
function EmergencySyncPriorityPanel({ active }) {
  return (
    <div style={{
      background: active ? `${RED}22` : DARK_CARD,
      border: `1px solid ${active ? RED : DARK_LINE}`,
      borderRadius: 8,
      padding: '12px 16px',
    }}>
      <div style={{ color: active ? RED : DARK_MUTE, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
        Emergency Mode {active ? '— ACTIVE' : '— Standby'}
      </div>
      <div style={{ color: DARK_MUTE, fontSize: 12 }}>
        {active
          ? 'Emergency actions are syncing with highest priority.'
          : 'Emergency sync priority is on standby.'}
      </div>
    </div>
  )
}

// ── DeviceSyncHealthPanel ──────────────────────────────────────────────────────
function DeviceSyncHealthPanel({ health }) {
  if (!health) {
    return (
      <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: DARK_MUTE, fontSize: 13 }}>Device Health</div>
        <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 8 }}>No device health data recorded yet.</div>
      </div>
    )
  }
  return (
    <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Device Health</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <div style={{ color: DARK_MUTE, fontSize: 11 }}>Network</div>
          <StatusBadge status={health.networkStatus ?? 'unknown'} />
        </div>
        <div>
          <div style={{ color: DARK_MUTE, fontSize: 11 }}>Health Score</div>
          <div style={{ color: DARK_TEXT, fontWeight: 700 }}>{health.syncHealthScore ?? '—'}</div>
        </div>
        <div>
          <div style={{ color: DARK_MUTE, fontSize: 11 }}>Pending Queue</div>
          <div style={{ color: DARK_TEXT }}>{health.pendingQueueCount ?? 0}</div>
        </div>
        <div>
          <div style={{ color: DARK_MUTE, fontSize: 11 }}>Clock Drift</div>
          <div style={{ color: health.clockDriftDetected ? AMBER : GREEN, fontWeight: 600 }}>
            {health.clockDriftDetected ? `${health.clockDriftMs ?? '?'}ms detected` : 'None'}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── OfflineQueuePanel ──────────────────────────────────────────────────────────
function OfflineQueuePanel({ actions, onCancel }) {
  if (!actions || actions.length === 0) {
    return (
      <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Offline Queue</div>
        <div style={{ color: DARK_MUTE, fontSize: 13 }}>No offline actions are queued for this device.</div>
      </div>
    )
  }
  return (
    <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
        Offline Queue ({actions.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {actions.map(a => (
          <div key={a.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: DARK_BG, borderRadius: 6, padding: '8px 12px',
          }}>
            <div>
              <div style={{ color: DARK_TEXT, fontSize: 13, fontWeight: 600 }}>{a.actionType}</div>
              <div style={{ color: DARK_MUTE, fontSize: 11 }}>{a.entityType} · {a.priority}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <StatusBadge status={a.syncStatus} />
              {a.syncStatus === 'queued' && (
                <button onClick={() => onCancel(a.id)} style={{
                  background: 'transparent', border: `1px solid ${RED}`,
                  color: RED, borderRadius: 4, padding: '2px 8px', fontSize: 11, cursor: 'pointer',
                }}>Cancel</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── SyncBatchPanel ─────────────────────────────────────────────────────────────
function SyncBatchPanel({ batches }) {
  if (!batches || batches.length === 0) {
    return (
      <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Sync Batches</div>
        <div style={{ color: DARK_MUTE, fontSize: 13 }}>No sync batches found.</div>
      </div>
    )
  }
  return (
    <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
        Sync Batches ({batches.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {batches.map(b => (
          <div key={b.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: DARK_BG, borderRadius: 6, padding: '8px 12px',
          }}>
            <div>
              <div style={{ color: DARK_TEXT, fontSize: 12, fontWeight: 600 }}>{b.id?.slice(0, 8)}…</div>
              <div style={{ color: DARK_MUTE, fontSize: 11 }}>{b.actionCount} actions · {b.priority}</div>
            </div>
            <StatusBadge status={b.status} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── SyncActionDetailDrawer ─────────────────────────────────────────────────────
function SyncActionDetailDrawer({ action, onClose }) {
  if (!action) return null
  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, height: '100%', width: 360,
      background: DARK_CARD, borderLeft: `1px solid ${DARK_LINE}`,
      zIndex: 1000, overflowY: 'auto', padding: 24,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ color: GOLD, fontWeight: 700, fontSize: 15 }}>Action Detail</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: DARK_MUTE, cursor: 'pointer', fontSize: 18 }}>✕</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          ['ID', action.id],
          ['Type', action.actionType],
          ['Entity', `${action.entityType} ${action.entityId ?? ''}`],
          ['Priority', action.priority],
          ['Status', action.syncStatus],
          ['Idempotency Key', action.idempotencyKey],
          ['Replay Attempts', action.replayAttemptCount ?? 0],
          ['Clock Drift', action.clockDriftMs ? `${action.clockDriftMs}ms` : 'None'],
          ['High Risk', action.isHighRisk ? 'Yes' : 'No'],
        ].map(([label, val]) => (
          <div key={label}>
            <div style={{ color: DARK_MUTE, fontSize: 11 }}>{label}</div>
            <div style={{ color: DARK_TEXT, fontSize: 13 }}>{val ?? '—'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── ConflictCenter ─────────────────────────────────────────────────────────────
function ConflictCenter({ conflicts, onResolve }) {
  if (!conflicts || conflicts.length === 0) {
    return (
      <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Conflict Center</div>
        <div style={{ color: DARK_MUTE, fontSize: 13 }}>No sync conflicts require review.</div>
      </div>
    )
  }
  return (
    <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
        Conflicts ({conflicts.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {conflicts.map(c => (
          <div key={c.id} style={{
            background: DARK_BG, borderRadius: 6, padding: '10px 12px',
            border: `1px solid ${c.isHighRisk ? RED : DARK_LINE}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: DARK_TEXT, fontSize: 13, fontWeight: 600 }}>{c.conflictType}</div>
              <StatusBadge status={c.conflictStatus} />
            </div>
            <div style={{ color: DARK_MUTE, fontSize: 11, marginTop: 4 }}>
              {c.entityType} {c.entityId ?? ''} · Policy: {c.resolutionPolicy ?? 'pending'}
            </div>
            {c.conflictStatus === 'detected' && (
              <button onClick={() => onResolve(c)} style={{
                marginTop: 8, background: BLUE, color: '#fff', border: 'none',
                borderRadius: 4, padding: '4px 12px', fontSize: 11, cursor: 'pointer',
              }}>Review</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── ConflictDetailDrawer ───────────────────────────────────────────────────────
function ConflictDetailDrawer({ conflict, onClose, onApplyPolicy }) {
  if (!conflict) return null
  const policies = ['server_wins', 'device_wins', 'latest_timestamp_wins', 'manager_review_required', 'dead_letter']
  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, height: '100%', width: 380,
      background: DARK_CARD, borderLeft: `1px solid ${DARK_LINE}`,
      zIndex: 1001, overflowY: 'auto', padding: 24,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ color: GOLD, fontWeight: 700, fontSize: 15 }}>Conflict Resolution</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: DARK_MUTE, cursor: 'pointer', fontSize: 18 }}>✕</button>
      </div>
      <div style={{ color: DARK_MUTE, fontSize: 12, marginBottom: 16 }}>
        Type: {conflict.conflictType} · Entity: {conflict.entityType}
      </div>
      <div style={{ color: DARK_TEXT, fontSize: 13, marginBottom: 12, fontWeight: 600 }}>Apply Resolution Policy</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {policies.map(p => (
          <button key={p} onClick={() => onApplyPolicy(conflict.id, p)} style={{
            background: DARK_BG, border: `1px solid ${DARK_LINE}`, color: DARK_TEXT,
            borderRadius: 6, padding: '8px 12px', textAlign: 'left', cursor: 'pointer', fontSize: 13,
          }}>
            {p.replace(/_/g, ' ')}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── ManagerReviewQueue ─────────────────────────────────────────────────────────
function ManagerReviewQueue({ items, onApprove, onDeny }) {
  if (!items || items.length === 0) {
    return (
      <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Manager Review Queue</div>
        <div style={{ color: DARK_MUTE, fontSize: 13 }}>No items pending manager review.</div>
      </div>
    )
  }
  return (
    <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
        Manager Review ({items.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map(item => (
          <div key={item.id} style={{
            background: DARK_BG, borderRadius: 6, padding: '10px 12px',
          }}>
            <div style={{ color: DARK_TEXT, fontSize: 13, fontWeight: 600 }}>{item.reviewType}</div>
            <div style={{ color: DARK_MUTE, fontSize: 11, marginTop: 2 }}>{item.reason ?? 'High-risk action requires review.'}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => onApprove(item.id)} style={{
                background: GREEN, color: '#fff', border: 'none', borderRadius: 4,
                padding: '4px 12px', fontSize: 11, cursor: 'pointer',
              }}>Approve</button>
              <button onClick={() => onDeny(item.id)} style={{
                background: RED, color: '#fff', border: 'none', borderRadius: 4,
                padding: '4px 12px', fontSize: 11, cursor: 'pointer',
              }}>Deny</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── DeadLetterQueue ────────────────────────────────────────────────────────────
function DeadLetterQueue({ items, onEscalate, onArchive }) {
  if (!items || items.length === 0) {
    return (
      <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Dead-Letter Queue</div>
        <div style={{ color: DARK_MUTE, fontSize: 13 }}>No actions in the dead-letter queue.</div>
      </div>
    )
  }
  return (
    <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
        Dead-Letter Queue ({items.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map(d => (
          <div key={d.id} style={{
            background: DARK_BG, borderRadius: 6, padding: '10px 12px',
            border: `1px solid ${RED}44`,
          }}>
            <div style={{ color: DARK_TEXT, fontSize: 13, fontWeight: 600 }}>{d.actionType}</div>
            <div style={{ color: DARK_MUTE, fontSize: 11, marginTop: 2 }}>{d.failureReason ?? 'Replay failed after max attempts.'}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => onEscalate(d.id)} style={{
                background: AMBER, color: '#000', border: 'none', borderRadius: 4,
                padding: '4px 12px', fontSize: 11, cursor: 'pointer',
              }}>Escalate</button>
              <button onClick={() => onArchive(d.id)} style={{
                background: DARK_LINE, color: DARK_MUTE, border: 'none', borderRadius: 4,
                padding: '4px 12px', fontSize: 11, cursor: 'pointer',
              }}>Archive</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── ReplayLogTimeline ──────────────────────────────────────────────────────────
function ReplayLogTimeline({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Replay Logs</div>
        <div style={{ color: DARK_MUTE, fontSize: 13 }}>No replay logs recorded yet.</div>
      </div>
    )
  }
  return (
    <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
        Replay Logs ({logs.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {logs.map(l => (
          <div key={l.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: DARK_BG, borderRadius: 6, padding: '8px 12px',
          }}>
            <div>
              <div style={{ color: DARK_TEXT, fontSize: 12 }}>Attempt #{l.attemptNumber}</div>
              <div style={{ color: DARK_MUTE, fontSize: 11 }}>{l.failureReason ?? 'No failure reason.'}</div>
            </div>
            <StatusBadge status={l.status} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── EATSyncAlertsPanel ─────────────────────────────────────────────────────────
function EATSyncAlertsPanel({ alerts, onAcknowledge }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>E.A.T. Sync Alerts</div>
        <div style={{ color: DARK_MUTE, fontSize: 13 }}>E.A.T. sync alerts are not connected yet.</div>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/smokecraft-pos360.png" alt="SmokeCraft POS360" style={{ width: 28, height: 28, borderRadius: 4, opacity: 0.5 }} />
          <span style={{ color: DARK_MUTE, fontSize: 11 }}>SmokeCraft · POS360</span>
        </div>
      </div>
    )
  }
  return (
    <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ color: GOLD, fontWeight: 700, fontSize: 13 }}>E.A.T. Sync Alerts ({alerts.length})</div>
        <img src="/smokecraft-pos360.png" alt="" style={{ width: 22, height: 22, borderRadius: 3, opacity: 0.6 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {alerts.map(a => (
          <div key={a.id} style={{
            background: DARK_BG, borderRadius: 6, padding: '10px 12px',
            border: `1px solid ${a.acknowledged ? DARK_LINE : AMBER}44`,
            opacity: a.acknowledged ? 0.6 : 1,
          }}>
            <div style={{ color: DARK_TEXT, fontSize: 13, fontWeight: 600 }}>{a.title}</div>
            <div style={{ color: DARK_MUTE, fontSize: 11, marginTop: 2 }}>{a.body ?? ''}</div>
            {!a.acknowledged && (
              <button onClick={() => onAcknowledge(a.id)} style={{
                marginTop: 6, background: BLUE, color: '#fff', border: 'none',
                borderRadius: 4, padding: '3px 10px', fontSize: 11, cursor: 'pointer',
              }}>Acknowledge</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── SyncPolicyRegistryPanel ────────────────────────────────────────────────────
function SyncPolicyRegistryPanel({ policies }) {
  if (!policies || policies.length === 0) {
    return (
      <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Sync Policy Registry</div>
        <div style={{ color: DARK_MUTE, fontSize: 13 }}>No conflict resolution policies configured.</div>
      </div>
    )
  }
  return (
    <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Sync Policy Registry</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {policies.map(p => (
          <div key={p.id} style={{
            display: 'flex', justifyContent: 'space-between',
            background: DARK_BG, borderRadius: 4, padding: '6px 10px', fontSize: 12,
          }}>
            <span style={{ color: DARK_TEXT }}>{p.conflictType}</span>
            <span style={{ color: DARK_MUTE }}>{p.resolutionPolicy}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── OfflineSyncHome ────────────────────────────────────────────────────────────
function OfflineSyncHome({ ctx }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 0 20px' }}>
      <img
        src="/smokecraft-pos360.png"
        alt="SmokeCraft POS360"
        style={{ width: 48, height: 48, borderRadius: 8, border: `2px solid ${GOLD}` }}
      />
      <div>
        <div style={{ color: GOLD, fontWeight: 700, fontSize: 20 }}>Offline Mode & Sync Engine</div>
        <div style={{ color: DARK_MUTE, fontSize: 13 }}>
          Venue: {ctx?.venueName ?? '—'} · POS360 Phase B.6
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function POS360OfflineSync() {
  const ctx = usePOS360VenueContextHook()

  const [lang, setLang]               = useState('en-US')
  const [syncing, setSyncing]         = useState(false)
  const [isOnline, setIsOnline]       = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)

  const [actions, setActions]         = useState([])
  const [batches, setBatches]         = useState([])
  const [conflicts, setConflicts]     = useState([])
  const [deadLetters, setDeadLetters] = useState([])
  const [replayLogs, setReplayLogs]   = useState([])
  const [eatAlerts, setEatAlerts]     = useState([])
  const [reviewItems, setReviewItems] = useState([])
  const [policies, setPolicies]       = useState([])
  const [deviceHealth, setDeviceHealth] = useState(null)
  const [emergencyActive, setEmergencyActive] = useState(false)

  const [selectedAction, setSelectedAction]   = useState(null)
  const [selectedConflict, setSelectedConflict] = useState(null)

  const [tab, setTab] = useState('queue')

  const localPreview = !ctx?.venueId

  const venueId = ctx?.venueId ?? 'local'

  const fetchAll = useCallback(async () => {
    if (localPreview) return
    try {
      const [a, b, c, d, r, e, m, h] = await Promise.allSettled([
        fetch(`/api/pos360/sync/actions?venueId=${venueId}`).then(r => r.json()),
        fetch(`/api/pos360/sync/batches?venueId=${venueId}`).then(r => r.json()),
        fetch(`/api/pos360/sync/conflicts?venueId=${venueId}`).then(r => r.json()),
        fetch(`/api/pos360/sync/dead-letters?venueId=${venueId}`).then(r => r.json()),
        fetch(`/api/pos360/sync/eat-alerts?venueId=${venueId}`).then(r => r.json()),
        fetch(`/api/pos360/sync/manager-review?venueId=${venueId}`).then(r => r.json()),
        fetch(`/api/pos360/sync/replay-logs?venueId=${venueId}`).then(r => r.json()),
        fetch(`/api/pos360/sync/venue-health?venueId=${venueId}`).then(r => r.json()),
      ])
      if (a.status === 'fulfilled' && Array.isArray(a.value?.actions)) setActions(a.value.actions)
      if (b.status === 'fulfilled' && Array.isArray(b.value?.batches)) setBatches(b.value.batches)
      if (c.status === 'fulfilled' && Array.isArray(c.value?.conflicts)) setConflicts(c.value.conflicts)
      if (d.status === 'fulfilled' && Array.isArray(d.value?.deadLetters)) setDeadLetters(d.value.deadLetters)
      if (r.status === 'fulfilled' && Array.isArray(r.value?.alerts)) setEatAlerts(r.value.alerts)
      if (e.status === 'fulfilled' && Array.isArray(e.value?.items)) setReviewItems(e.value.items)
      if (m.status === 'fulfilled' && Array.isArray(m.value?.logs)) setReplayLogs(m.value.logs)
      if (h.status === 'fulfilled' && h.value?.health) setDeviceHealth(h.value.health)
    } catch { /* network error — stay in current state */ }
  }, [localPreview, venueId])

  useEffect(() => {
    fetchAll()
    const onOnline  = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [fetchAll])

  const handleManualSync = async () => {
    setSyncing(true)
    await new Promise(r => setTimeout(r, 1200))
    await fetchAll()
    setSyncing(false)
  }

  const handleCancelAction = async (actionId) => {
    await fetch(`/api/pos360/sync/actions/${actionId}/cancel`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venueId }),
    })
    await fetchAll()
  }

  const handleAcknowledgeAlert = async (alertId) => {
    await fetch(`/api/pos360/sync/eat-alerts/${alertId}/acknowledge`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venueId }),
    })
    await fetchAll()
  }

  const handleApplyPolicy = async (conflictId, policy) => {
    await fetch(`/api/pos360/sync/conflicts/${conflictId}/apply-policy`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venueId, policy }),
    })
    setSelectedConflict(null)
    await fetchAll()
  }

  const handleApproveReview = async (reviewId) => {
    await fetch(`/api/pos360/sync/manager-review/${reviewId}/approve`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venueId }),
    })
    await fetchAll()
  }

  const handleDenyReview = async (reviewId) => {
    await fetch(`/api/pos360/sync/manager-review/${reviewId}/deny`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venueId }),
    })
    await fetchAll()
  }

  const handleEscalateDead = async (id) => {
    await fetch(`/api/pos360/sync/dead-letters/${id}/escalate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venueId }),
    })
    await fetchAll()
  }

  const handleArchiveDead = async (id) => {
    await fetch(`/api/pos360/sync/dead-letters/${id}/archive`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venueId }),
    })
    await fetchAll()
  }

  const tabs = [
    { id: 'queue',    label: 'Queue' },
    { id: 'batches',  label: 'Batches' },
    { id: 'conflicts',label: 'Conflicts' },
    { id: 'dead',     label: 'Dead Letter' },
    { id: 'review',   label: 'Review' },
    { id: 'eat',      label: 'E.A.T.' },
    { id: 'health',   label: 'Health' },
    { id: 'replay',   label: 'Replay' },
    { id: 'policy',   label: 'Policy' },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: DARK_BG,
      color: DARK_TEXT,
      fontFamily: 'system-ui, sans-serif',
      padding: '24px 28px',
    }}>
      <OfflineSyncHome ctx={ctx} />

      <OfflineStatusBanner isOnline={isOnline} queueCount={actions.filter(a => a.syncStatus === 'queued').length} />

      {localPreview && (
        <div style={{
          background: `${AMBER}22`, border: `1px solid ${AMBER}`, borderRadius: 6,
          padding: '10px 16px', marginBottom: 16, color: AMBER, fontSize: 13,
        }}>
          Running in local/demo mode. Connect a venue to enable live sync.
        </div>
      )}

      {/* Top controls */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <ManualSyncButton onSync={handleManualSync} syncing={syncing} />
        <RetrySyncButton onRetry={handleManualSync} disabled={syncing || !isOnline} />
        <EmergencySyncPriorityPanel active={emergencyActive} />
        <div style={{ marginLeft: 'auto' }}>
          <LanguageSelector lang={lang} onChange={setLang} />
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 4, flexWrap: 'wrap',
        borderBottom: `1px solid ${DARK_LINE}`, marginBottom: 20,
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: tab === t.id ? DARK_CARD : 'transparent',
              border: `1px solid ${tab === t.id ? GOLD : 'transparent'}`,
              borderBottom: 'none',
              borderRadius: '6px 6px 0 0',
              color: tab === t.id ? GOLD : DARK_MUTE,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: tab === t.id ? 700 : 400,
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div style={{ maxWidth: 900 }}>
        {tab === 'queue' && (
          <OfflineQueuePanel actions={actions} onCancel={handleCancelAction} />
        )}
        {tab === 'batches' && (
          <SyncBatchPanel batches={batches} />
        )}
        {tab === 'conflicts' && (
          <ConflictCenter conflicts={conflicts} onResolve={setSelectedConflict} />
        )}
        {tab === 'dead' && (
          <DeadLetterQueue items={deadLetters} onEscalate={handleEscalateDead} onArchive={handleArchiveDead} />
        )}
        {tab === 'review' && (
          <ManagerReviewQueue items={reviewItems} onApprove={handleApproveReview} onDeny={handleDenyReview} />
        )}
        {tab === 'eat' && (
          <EATSyncAlertsPanel alerts={eatAlerts} onAcknowledge={handleAcknowledgeAlert} />
        )}
        {tab === 'health' && (
          <DeviceSyncHealthPanel health={deviceHealth} />
        )}
        {tab === 'replay' && (
          <ReplayLogTimeline logs={replayLogs} />
        )}
        {tab === 'policy' && (
          <SyncPolicyRegistryPanel policies={policies} />
        )}
      </div>

      {/* Drawers */}
      {selectedAction && (
        <SyncActionDetailDrawer action={selectedAction} onClose={() => setSelectedAction(null)} />
      )}
      {selectedConflict && (
        <ConflictDetailDrawer
          conflict={selectedConflict}
          onClose={() => setSelectedConflict(null)}
          onApplyPolicy={handleApplyPolicy}
        />
      )}
    </div>
  )
}
