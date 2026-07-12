/**
 * SmokeCraft Error Log Viewer (R19)
 *
 * Admin/founder-only view of structured error log entries.
 * Filters by level and category. Refreshes on demand.
 * No PII is shown — entries are pre-scrubbed by the logger.
 */

import { useState, useEffect, useCallback } from 'react'
import { useSecurity } from '../../context/SecurityContext.jsx'
import { meetsMinRole } from '../../config/roleMap.js'

const GOLD  = '#E9C176'
const DARK  = '#0a0603'
const DIM   = 'rgba(229,226,225,0.5)'
const ERROR = '#e57373'
const WARN  = '#ffb74d'
const INFO  = '#64b5f6'
const GREEN = '#81c784'

const LEVEL_COLOR = {
  debug:    DIM,
  info:     INFO,
  warn:     WARN,
  error:    ERROR,
  critical: '#ff5252',
}

const CATEGORIES = [
  'frontend_exception', 'error_boundary', 'api_error', 'contract_rejected',
  'unauthorized_access', 'rate_limit', 'provider_failure', 'navigation', 'feature_flag',
]

export default function ErrorLogViewer() {
  const { role } = useSecurity()
  const isAdmin = meetsMinRole(role, 'admin')

  const [entries, setEntries]     = useState([])
  const [loading, setLoading]     = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [filterLevel, setFilterLevel]     = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [expanded, setExpanded]   = useState(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (filterLevel)    params.set('level', filterLevel)
      if (filterCategory) params.set('category', filterCategory)
      const res = await fetch(`/api/smokecraft/error-log?${params}`, {
        headers: { 'x-novee-role': role },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setEntries(data.entries || [])
    } catch (err) {
      setFetchError(err.message)
    } finally {
      setLoading(false)
    }
  }, [role, filterLevel, filterCategory])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  if (!isAdmin) {
    return (
      <div style={{ padding: 40, color: ERROR, fontFamily: 'Georgia, serif' }}>
        Access denied. Error log viewer requires admin role or higher.
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: DARK, padding: '32px 20px', fontFamily: 'Georgia, serif' }}>
      <h1 style={{ color: GOLD, fontSize: 22, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>
        Error Log Viewer
      </h1>
      <p style={{ color: DIM, fontSize: 13, marginBottom: 20 }}>
        Structured error log — SmokeCraft frontend + backend · Role: {role}
      </p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <select
          value={filterLevel}
          onChange={e => setFilterLevel(e.target.value)}
          style={selectStyle}
        >
          <option value="">All levels</option>
          {['debug','info','warn','error','critical'].map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          style={selectStyle}
        >
          <option value="">All categories</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          onClick={fetchLogs}
          disabled={loading}
          style={{
            padding: '7px 18px', borderRadius: 6, border: `1px solid ${GOLD}`,
            background: 'transparent', color: GOLD, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13,
          }}
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {fetchError && (
        <div style={{ background: '#3b1a1a', border: `1px solid ${ERROR}`, borderRadius: 8, padding: '10px 16px', marginBottom: 16, color: ERROR, fontSize: 13 }}>
          Failed to fetch logs: {fetchError}
        </div>
      )}

      {!loading && !fetchError && entries.length === 0 && (
        <p style={{ color: DIM, fontSize: 13 }}>No log entries found.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map(entry => (
          <div
            key={entry.id}
            onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
            style={{
              background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(233,193,118,0.1)`,
              borderRadius: 8, padding: '10px 14px', cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ color: LEVEL_COLOR[entry.level] || DIM, fontSize: 11, fontWeight: 700, minWidth: 56 }}>
                {entry.level?.toUpperCase()}
              </span>
              <span style={{ color: GOLD, fontSize: 12 }}>{entry.category}</span>
              <span style={{ color: 'rgba(229,226,225,0.8)', fontSize: 12, flex: 1 }}>{entry.message}</span>
              <span style={{ color: DIM, fontSize: 11 }}>{new Date(entry.timestamp).toLocaleString()}</span>
            </div>
            {entry.route && (
              <div style={{ color: DIM, fontSize: 11, marginTop: 2 }}>Route: {entry.route}</div>
            )}
            {expanded === entry.id && (
              <pre style={{
                marginTop: 10, background: 'rgba(0,0,0,0.4)', borderRadius: 6, padding: '10px 12px',
                color: 'rgba(229,226,225,0.75)', fontSize: 11, overflowX: 'auto', whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}>
                {JSON.stringify(entry, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const selectStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: `1px solid rgba(233,193,118,0.3)`,
  borderRadius: 6, padding: '7px 12px', color: GOLD,
  fontSize: 13, fontFamily: 'Georgia, serif', cursor: 'pointer',
}
