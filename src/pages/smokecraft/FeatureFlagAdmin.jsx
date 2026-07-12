/**
 * SmokeCraft Feature Flag Administration (R18)
 *
 * Role-restricted: platform administrator or founder only.
 * Venue administrators may toggle venue-scoped flags only.
 *
 * Shows current value, source, environment, scope, and default.
 * Requires confirmation before any change.
 * Records actor, timestamp, old value, new value, and reason in audit log.
 * Supports safe rollback to default.
 * Mutually exclusive flag pairs are enforced.
 */

import { useState, useCallback } from 'react'
import { useSecurity } from '../../context/SecurityContext.jsx'
import { meetsMinRole } from '../../config/roleMap.js'
import { FEATURE_FLAGS, getDefaultFlags } from '../../modules/smokecraft/data/smokecraftFeatureFlagContract.js'

const GOLD  = '#E9C176'
const DARK  = '#0a0603'
const DIM   = 'rgba(229,226,225,0.5)'
const ERROR = '#e57373'
const GREEN = '#81c784'

// Pairs of flags that must not both be true simultaneously
const MUTUALLY_EXCLUSIVE_PAIRS = [
  ['smokecraft.billing.enabled', 'smokecraft.marketplaceListing.enabled'],
]

function isMutuallyExclusiveConflict(flags, key, newValue) {
  if (!newValue) return null
  for (const [a, b] of MUTUALLY_EXCLUSIVE_PAIRS) {
    if (key === a && flags[b]) return `Cannot enable "${a}" while "${b}" is active`
    if (key === b && flags[a]) return `Cannot enable "${b}" while "${a}" is active`
  }
  return null
}

const VENUE_SCOPED_FLAGS = new Set([
  'smokecraft.rewards.enabled',
  'smokecraft.passport.enabled',
  'smokecraft.whiteLabel.enabled',
])

export default function FeatureFlagAdmin() {
  const { role } = useSecurity()
  const isFounder  = meetsMinRole(role, 'founder_level_0')
  const isAdmin    = meetsMinRole(role, 'admin')
  const isVenueAdmin = role === 'admin'

  if (!isAdmin) {
    return (
      <div style={{ padding: 40, color: ERROR, fontFamily: 'Georgia, serif' }}>
        Access denied. Feature flag administration requires administrator role or higher.
      </div>
    )
  }

  const defaults = getDefaultFlags()

  const [flags, setFlags]         = useState(() => ({ ...defaults }))
  const [auditLog, setAuditLog]   = useState([])
  const [pending, setPending]     = useState(null)  // { key, newValue }
  const [reason, setReason]       = useState('')
  const [conflict, setConflict]   = useState(null)
  const [success, setSuccess]     = useState(null)

  function canEdit(key) {
    if (isFounder) return true
    if (isVenueAdmin && VENUE_SCOPED_FLAGS.has(key)) return true
    return false
  }

  function requestChange(key, newValue) {
    const c = isMutuallyExclusiveConflict(flags, key, newValue)
    if (c) { setConflict(c); return }
    setConflict(null)
    setPending({ key, newValue })
    setReason('')
  }

  function confirmChange() {
    if (!pending) return
    const { key, newValue } = pending
    const oldValue = flags[key]
    const entry = {
      id:        `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor:     role,
      key,
      oldValue,
      newValue,
      reason:    reason.trim() || '(no reason given)',
      rollbackTo: oldValue,
    }
    setFlags(prev => ({ ...prev, [key]: newValue }))
    setAuditLog(prev => [entry, ...prev])
    setPending(null)
    setReason('')
    setSuccess(`Flag "${key}" changed to ${newValue}`)
    setTimeout(() => setSuccess(null), 3000)
  }

  function rollback(entry) {
    requestChange(entry.key, entry.rollbackTo)
  }

  return (
    <div style={{ minHeight: '100vh', background: DARK, padding: '32px 20px', fontFamily: 'Georgia, serif' }}>
      <h1 style={{ color: GOLD, fontSize: 22, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>
        Feature Flag Administration
      </h1>
      <p style={{ color: DIM, fontSize: 13, marginBottom: 28 }}>
        Environment: {process.env.NODE_ENV || 'unknown'} · Schema v1.0.0 · Role: {role}
        {!isFounder && ' · Venue-scoped flags only'}
      </p>

      {conflict && (
        <div style={{ background: '#3b1a1a', border: `1px solid ${ERROR}`, borderRadius: 8, padding: '10px 16px', marginBottom: 16, color: ERROR, fontSize: 13 }}>
          Conflict: {conflict}
        </div>
      )}
      {success && (
        <div style={{ background: '#1a3b1a', border: `1px solid ${GREEN}`, borderRadius: 8, padding: '10px 16px', marginBottom: 16, color: GREEN, fontSize: 13 }}>
          {success}
        </div>
      )}

      {/* Confirmation dialog */}
      {pending && (
        <div style={{ background: '#1a1208', border: `1px solid ${GOLD}`, borderRadius: 10, padding: 20, marginBottom: 24 }}>
          <div style={{ color: GOLD, fontWeight: 700, marginBottom: 8 }}>Confirm Change</div>
          <div style={{ color: 'rgba(229,226,225,0.8)', fontSize: 13, marginBottom: 12 }}>
            <b>{pending.key}</b>: {String(flags[pending.key])} → <b>{String(pending.newValue)}</b>
          </div>
          <input
            type="text"
            placeholder="Reason for change (required for audit)"
            value={reason}
            onChange={e => setReason(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(233,193,118,0.3)`,
              borderRadius: 6, padding: '8px 12px', color: GOLD, fontSize: 13,
              fontFamily: 'Georgia, serif', marginBottom: 12,
            }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={confirmChange}
              disabled={!reason.trim()}
              style={{
                padding: '8px 20px', borderRadius: 6, border: 'none',
                background: reason.trim() ? GOLD : 'rgba(233,193,118,0.3)',
                color: DARK, fontWeight: 700, cursor: reason.trim() ? 'pointer' : 'not-allowed',
                fontSize: 13,
              }}
            >
              Confirm
            </button>
            <button
              onClick={() => { setPending(null); setReason('') }}
              style={{
                padding: '8px 20px', borderRadius: 6, border: `1px solid ${GOLD}`,
                background: 'transparent', color: GOLD, cursor: 'pointer', fontSize: 13,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Flag list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
        {Object.entries(FEATURE_FLAGS).map(([key, meta]) => {
          const current  = flags[key]
          const editable = canEdit(key)
          const isVenue  = VENUE_SCOPED_FLAGS.has(key)
          return (
            <div key={key} style={{
              background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(233,193,118,0.12)`,
              borderRadius: 8, padding: '12px 16px',
              opacity: editable ? 1 : 0.6,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <span style={{ color: GOLD, fontSize: 13, fontWeight: 700 }}>{key}</span>
                  {isVenue && <span style={{ marginLeft: 8, fontSize: 10, color: DIM, border: `1px solid ${DIM}`, borderRadius: 4, padding: '1px 5px' }}>venue-scoped</span>}
                  <div style={{ color: DIM, fontSize: 11, marginTop: 2 }}>{meta.description}</div>
                  <div style={{ color: DIM, fontSize: 11, marginTop: 1 }}>
                    Default: {String(meta.default)} · Current: <span style={{ color: current ? GREEN : ERROR }}>{String(current)}</span>
                  </div>
                </div>
                {editable && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => requestChange(key, true)}
                      disabled={current === true}
                      style={{
                        padding: '5px 12px', borderRadius: 5, border: 'none',
                        background: current === true ? GREEN : 'rgba(129,199,132,0.2)',
                        color: current === true ? DARK : GREEN,
                        cursor: current === true ? 'default' : 'pointer', fontSize: 12,
                      }}
                    >Enable</button>
                    <button
                      onClick={() => requestChange(key, false)}
                      disabled={current === false}
                      style={{
                        padding: '5px 12px', borderRadius: 5, border: 'none',
                        background: current === false ? ERROR : 'rgba(229,115,115,0.2)',
                        color: current === false ? DARK : ERROR,
                        cursor: current === false ? 'default' : 'pointer', fontSize: 12,
                      }}
                    >Disable</button>
                    {current !== meta.default && (
                      <button
                        onClick={() => requestChange(key, meta.default)}
                        style={{
                          padding: '5px 12px', borderRadius: 5, border: `1px solid ${DIM}`,
                          background: 'transparent', color: DIM, cursor: 'pointer', fontSize: 12,
                        }}
                      >Reset to default</button>
                    )}
                  </div>
                )}
                {!editable && (
                  <span style={{ color: DIM, fontSize: 11 }}>founder access required</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Audit log */}
      <h2 style={{ color: GOLD, fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Audit Log</h2>
      {auditLog.length === 0 ? (
        <p style={{ color: DIM, fontSize: 13 }}>No changes this session.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {auditLog.map(entry => (
            <div key={entry.id} style={{
              background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(233,193,118,0.1)`,
              borderRadius: 7, padding: '10px 14px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <span style={{ color: GOLD, fontSize: 12, fontWeight: 700 }}>{entry.key}</span>
                  <span style={{ color: DIM, fontSize: 12 }}> · {entry.oldValue.toString()} → {entry.newValue.toString()}</span>
                  <div style={{ color: DIM, fontSize: 11, marginTop: 2 }}>
                    {new Date(entry.timestamp).toLocaleString()} · {entry.actor} · {entry.reason}
                  </div>
                </div>
                <button
                  onClick={() => rollback(entry)}
                  style={{
                    padding: '4px 10px', borderRadius: 5, border: `1px solid ${DIM}`,
                    background: 'transparent', color: DIM, cursor: 'pointer', fontSize: 11,
                  }}
                >Rollback</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
