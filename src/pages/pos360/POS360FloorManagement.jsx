/**
 * POS360 Floor Management — Phase B.1
 *
 * Multi-venue hospitality floor management:
 * restaurants, cigar lounges, bars, hotels, clubs, event spaces,
 * casinos, food trucks, stadiums, golf clubs, and more.
 *
 * Visual anchor: /smokecraft-pos360.png
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

// ── Design tokens ─────────────────────────────────────────────────────────────
const DARK_BG   = '#080604'
const DARK_CARD = 'rgba(20,15,8,0.92)'
const DARK_LINE = 'rgba(201,149,44,0.18)'
const DARK_MUTE = 'rgba(243,238,225,0.45)'
const DARK_TEXT = '#f3eee1'
const GOLD      = '#c9952c'
const GOLD_DIM  = 'rgba(201,149,44,0.22)'

// ── Table status color map (venue-configurable in Phase B.2+) ─────────────────
export const STATUS_COLORS = {
  available:           '#2e7d32',
  occupied:            '#1565c0',
  ordered:             '#6a1b9a',
  needs_attention:     '#e65100',
  check_dropped:       '#f9a825',
  payment_pending:     '#ad1457',
  dirty:               '#4e342e',
  reserved:            '#37474f',
  blocked:             '#b71c1c',
  merged:              '#00695c',
  offline_sync_pending:'#5d4037',
}

const STATUS_LABELS = {
  available: 'Available', occupied: 'Occupied', ordered: 'Ordered',
  needs_attention: 'Attention', check_dropped: 'Check Dropped',
  payment_pending: 'Payment', dirty: 'Dirty', reserved: 'Reserved',
  blocked: 'Blocked', merged: 'Merged', offline_sync_pending: 'Offline',
}

// ── API helpers ───────────────────────────────────────────────────────────────
async function apiFetch(path, opts = {}) {
  try {
    const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...opts })
    return res.json()
  } catch {
    return { ok: false, localPreview: true, error: 'network_error' }
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SyncStatusIndicator({ syncing, lastSync, localPreview }) {
  return (
    <div style={S.syncBar}>
      <span style={{ ...S.syncDot, background: localPreview ? '#e65100' : syncing ? GOLD : '#2e7d32' }} />
      <span style={S.syncLabel}>
        {localPreview ? 'Local Preview' : syncing ? 'Syncing…' : lastSync ? `Synced ${new Date(lastSync).toLocaleTimeString()}` : 'Not synced'}
      </span>
    </div>
  )
}

function StatusLegend() {
  return (
    <div style={S.legend}>
      {Object.entries(STATUS_LABELS).map(([key, label]) => (
        <div key={key} style={S.legendItem}>
          <span style={{ ...S.legendDot, background: STATUS_COLORS[key] }} />
          <span style={S.legendText}>{label}</span>
        </div>
      ))}
    </div>
  )
}

function TableCard({ table, selected, onClick }) {
  const color = STATUS_COLORS[table.status] || STATUS_COLORS.available
  return (
    <button
      onClick={() => onClick(table)}
      style={{
        ...S.tableCard,
        borderColor: selected ? GOLD : `${color}88`,
        background: selected
          ? `linear-gradient(160deg, ${color}44, ${color}1a)`
          : `linear-gradient(160deg, ${color}22, ${color}0d)`,
        boxShadow: selected ? `0 0 12px ${color}55` : 'none',
      }}
    >
      <div style={{ ...S.tableNum, color: selected ? GOLD : DARK_TEXT }}>{table.table_number || table.table_name}</div>
      <div style={{ ...S.tableStatus, color: `${color}` }}>{STATUS_LABELS[table.status] || table.status}</div>
      {table.server_name && <div style={S.tableServer}>{table.server_name}</div>}
      {table.is_vip && <span style={S.vipBadge}>VIP</span>}
      {table.seat_count && <div style={S.seatCount}>{table.seat_count}🪑</div>}
    </button>
  )
}

function TableDetailDrawer({ table, venueId, onClose, onStatusChange }) {
  const [intelligence, setIntelligence] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [newStatus, setNewStatus] = useState('')

  useEffect(() => {
    if (!table) return
    setIntelligence(null)
    apiFetch(`/api/pos360/floor/venues/${venueId}/tables/${table.table_id}/intelligence`)
      .then(r => setIntelligence(r.intelligence || null))
  }, [table, venueId])

  async function handleStatusChange() {
    if (!newStatus) return
    setStatusLoading(true)
    const r = await apiFetch(`/api/pos360/floor/venues/${venueId}/tables/${table.table_id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status: newStatus }),
    })
    setStatusLoading(false)
    if (r.ok) { onStatusChange(table.table_id, newStatus); setNewStatus('') }
  }

  if (!table) return null
  const color = STATUS_COLORS[table.status] || STATUS_COLORS.available
  const sc = intelligence?.smokecraft

  return (
    <div style={S.drawer}>
      <div style={S.drawerHeader}>
        <div>
          <div style={{ ...S.drawerTitle, color: GOLD }}>
            {table.table_name}
            {table.is_vip && <span style={S.vipInline}> ★ VIP</span>}
          </div>
          <div style={{ ...S.drawerSub, color: `${color}` }}>{STATUS_LABELS[table.status] || table.status}</div>
        </div>
        <button onClick={onClose} style={S.closeBtn}>✕</button>
      </div>

      {/* Table info grid */}
      <div style={S.infoGrid}>
        <div style={S.infoCell}><div style={S.infoCellLabel}>Seats</div><div style={S.infoCellVal}>{table.seat_count}</div></div>
        <div style={S.infoCell}><div style={S.infoCellLabel}>Server</div><div style={S.infoCellVal}>{table.server_name || '—'}</div></div>
        <div style={S.infoCell}><div style={S.infoCellLabel}>Shape</div><div style={S.infoCellVal}>{table.shape}</div></div>
        <div style={S.infoCell}><div style={S.infoCellLabel}>Type</div><div style={S.infoCellVal}>{table.object_type}</div></div>
      </div>

      {/* Status change */}
      <div style={S.section}>
        <div style={S.sectionTitle}>Change Status</div>
        <div style={S.statusRow}>
          <select value={newStatus} onChange={e => setNewStatus(e.target.value)} style={S.statusSelect}>
            <option value="">Select status…</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button onClick={handleStatusChange} disabled={!newStatus || statusLoading} style={S.actionBtn}>
            {statusLoading ? '…' : 'Apply'}
          </button>
        </div>
      </div>

      {/* SmokeCraft Guest Intelligence */}
      <div style={S.section}>
        <div style={S.sectionTitle}>SmokeCraft Intelligence</div>
        {!sc ? (
          <div style={S.emptyState}>Loading guest intelligence…</div>
        ) : sc.sessionLinked ? (
          <div style={S.scPanel}>
            <div style={S.scRow}><span style={S.scLabel}>Session</span><span style={S.scVal}>{sc.sessionId?.slice(-8)}</span></div>
            <div style={S.scNote}>{sc.message}</div>
          </div>
        ) : (
          <div style={S.emptyState}>{sc.message}</div>
        )}
      </div>

      {/* E.A.T. Recommendations */}
      <div style={S.section}>
        <div style={S.sectionTitle}>E.A.T. Recommendations</div>
        {intelligence?.eatRecommendations?.recommendations?.length ? (
          intelligence.eatRecommendations.recommendations.map((r, i) => (
            <div key={i} style={S.eatRec}>{r.text}</div>
          ))
        ) : (
          <div style={S.emptyState}>{intelligence?.eatRecommendations?.message || 'No recommendations available.'}</div>
        )}
      </div>
    </div>
  )
}

function ServerAssignmentPanel({ venueId, sectionId, tableId, onAssign }) {
  const [serverId, setServerId] = useState('')
  const [serverName, setServerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  async function handleAssign() {
    if (!serverId) return
    setLoading(true)
    const r = await apiFetch(`/api/pos360/floor/venues/${venueId}/server-assignments`, {
      method: 'POST',
      body: JSON.stringify({ serverId, serverName, sectionId, tableId, assignmentType: tableId ? 'table' : 'section' }),
    })
    setLoading(false)
    setResult(r.ok ? 'Assigned' : r.error || 'Error')
    if (r.ok && onAssign) onAssign(r.assignment)
  }

  return (
    <div style={S.panel}>
      <div style={S.panelTitle}>Assign Server</div>
      <input placeholder="Server ID" value={serverId} onChange={e => setServerId(e.target.value)} style={S.input} />
      <input placeholder="Server Name" value={serverName} onChange={e => setServerName(e.target.value)} style={S.input} />
      <button onClick={handleAssign} disabled={!serverId || loading} style={S.actionBtn}>{loading ? 'Assigning…' : 'Assign'}</button>
      {result && <div style={S.resultNote}>{result}</div>}
    </div>
  )
}

// ── Floor Map Canvas ──────────────────────────────────────────────────────────

function FloorMapCanvas({ tables, selectedTableId, onTableSelect, onTableMove }) {
  const canvasRef = useRef(null)
  const [dragging, setDragging] = useState(null)

  function handleMouseDown(e, table) {
    e.preventDefault()
    setDragging({ tableId: table.table_id, startX: e.clientX - table.pos_x, startY: e.clientY - table.pos_y })
  }

  function handleMouseMove(e) {
    if (!dragging) return
    const x = e.clientX - dragging.startX
    const y = e.clientY - dragging.startY
    if (onTableMove) onTableMove(dragging.tableId, x, y)
  }

  function handleMouseUp() { setDragging(null) }

  return (
    <div
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={S.canvas}
    >
      {tables.map(t => {
        const color = STATUS_COLORS[t.status] || STATUS_COLORS.available
        const sel = t.table_id === selectedTableId
        return (
          <div
            key={t.table_id}
            onMouseDown={ev => handleMouseDown(ev, t)}
            onClick={() => onTableSelect(t)}
            style={{
              ...S.canvasTable,
              left: t.pos_x,
              top: t.pos_y,
              width: t.width || 80,
              height: t.height || 60,
              borderColor: sel ? GOLD : `${color}88`,
              background: sel ? `${color}44` : `${color}22`,
              boxShadow: sel ? `0 0 14px ${color}66` : `0 2px 8px rgba(0,0,0,0.4)`,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: sel ? GOLD : DARK_TEXT }}>
              {t.table_number || t.table_name}
            </span>
            <span style={{ fontSize: 9, color: `${color}` }}>
              {STATUS_LABELS[t.status] || t.status}
            </span>
            {t.is_vip && <span style={{ fontSize: 9, color: GOLD }}>★</span>}
          </div>
        )
      })}
    </div>
  )
}

// ── Section List ──────────────────────────────────────────────────────────────

function SectionList({ sections, activeSectionId, onSelect, venueId, onSectionCreated }) {
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!newName.trim()) return
    setLoading(true)
    const r = await apiFetch(`/api/pos360/floor/venues/${venueId}/sections`, {
      method: 'POST',
      body: JSON.stringify({ sectionName: newName.trim() }),
    })
    setLoading(false)
    if (r.ok) { setNewName(''); setCreating(false); onSectionCreated(r.section) }
  }

  return (
    <div style={S.sectionList}>
      <div style={S.sectionListHeader}>
        <span style={{ color: GOLD, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}>SECTIONS</span>
        <button onClick={() => setCreating(c => !c)} style={S.miniBtn}>{creating ? '✕' : '+'}</button>
      </div>
      {creating && (
        <div style={{ display: 'flex', gap: 6, padding: '0 8px 8px' }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Section name" style={{ ...S.input, flex: 1 }} onKeyDown={e => e.key === 'Enter' && handleCreate()} />
          <button onClick={handleCreate} disabled={loading} style={S.miniBtn}>{loading ? '…' : '✓'}</button>
        </div>
      )}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        <div
          onClick={() => onSelect(null)}
          style={{ ...S.sectionItem, ...(activeSectionId === null ? S.sectionItemActive : {}) }}
        >
          All Sections
        </div>
        {sections.map(sec => (
          <div
            key={sec.section_id}
            onClick={() => onSelect(sec.section_id)}
            style={{ ...S.sectionItem, ...(activeSectionId === sec.section_id ? S.sectionItemActive : {}) }}
          >
            <span style={{ flex: 1 }}>{sec.section_name}</span>
            {!sec.is_active && <span style={{ fontSize: 10, color: DARK_MUTE }}>archived</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const VENUE_ID = 'novee-grand-lounge'  // In Phase B.2+, read from auth context / URL param

export default function POS360FloorManagement() {
  const navigate = useNavigate()
  const [sections, setSections]         = useState([])
  const [tables, setTables]             = useState([])
  const [selectedTable, setSelectedTable] = useState(null)
  const [activeSectionId, setActiveSectionId] = useState(null)
  const [viewMode, setViewMode]         = useState('grid')   // 'grid' | 'canvas'
  const [syncing, setSyncing]           = useState(false)
  const [lastSync, setLastSync]         = useState(null)
  const [localPreview, setLocalPreview] = useState(false)
  const [notice, setNotice]             = useState(null)
  const [drawerOpen, setDrawerOpen]     = useState(false)
  const [showAssignPanel, setShowAssignPanel] = useState(false)

  const fetchFloorState = useCallback(async () => {
    setSyncing(true)
    const r = await apiFetch(`/api/pos360/floor/venues/${VENUE_ID}/floor-state`)
    setSyncing(false)
    if (r.ok) {
      setSections(r.floorState?.sections ?? [])
      setTables(r.floorState?.tables ?? [])
      setLastSync(r.floorState?.lastSync ?? null)
      setLocalPreview(!!r.localPreview)
    } else {
      setLocalPreview(true)
    }
  }, [])

  useEffect(() => { fetchFloorState() }, [fetchFloorState])

  const visibleTables = activeSectionId
    ? tables.filter(t => t.section_id === activeSectionId)
    : tables

  function handleTableSelect(table) {
    setSelectedTable(table)
    setDrawerOpen(true)
    setShowAssignPanel(false)
  }

  function handleStatusChange(tableId, newStatus) {
    setTables(prev => prev.map(t => t.table_id === tableId ? { ...t, status: newStatus } : t))
    if (selectedTable?.table_id === tableId) setSelectedTable(prev => ({ ...prev, status: newStatus }))
  }

  async function handleTableMove(tableId, posX, posY) {
    setTables(prev => prev.map(t => t.table_id === tableId ? { ...t, pos_x: posX, pos_y: posY } : t))
    await apiFetch(`/api/pos360/floor/venues/${VENUE_ID}/tables/${tableId}/move`, {
      method: 'POST', body: JSON.stringify({ posX, posY }),
    })
  }

  const statusCounts = {}
  for (const t of tables) { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1 }

  return (
    <div style={S.wrap}>
      {/* ── Nav ────────────────────────────────────────────────────────────── */}
      <div style={S.nav}>
        <div style={S.navLeft}>
          <span style={S.navCrown}>♛</span>
          <div>
            <div style={S.navTitle}>POS360</div>
            <div style={S.navSub}>NOVEE OS · Floor Management</div>
          </div>
        </div>
        <div style={S.navRight}>
          <SyncStatusIndicator syncing={syncing} lastSync={lastSync} localPreview={localPreview} />
          <button onClick={fetchFloorState} style={S.iconBtn} title="Refresh">↺</button>
          <button onClick={() => setViewMode(v => v === 'grid' ? 'canvas' : 'grid')} style={S.iconBtn} title="Toggle view">
            {viewMode === 'grid' ? '⊞' : '⊟'}
          </button>
          <button onClick={() => navigate('/pos3')} style={S.iconBtn} title="Back">←</button>
        </div>
      </div>

      {notice && <div style={S.notice}>{notice}</div>}
      {localPreview && <div style={S.previewBanner}>Local Preview Mode — Floor data is not persisted. DATABASE_URL not configured.</div>}

      {/* ── KPI strip ──────────────────────────────────────────────────────── */}
      <div style={S.kpiStrip}>
        {[
          { label: 'Total Tables',  val: tables.length },
          { label: 'Occupied',      val: (statusCounts.occupied || 0) + (statusCounts.ordered || 0) },
          { label: 'Available',     val: statusCounts.available || 0 },
          { label: 'Need Attention',val: (statusCounts.needs_attention || 0) + (statusCounts.check_dropped || 0) + (statusCounts.payment_pending || 0) },
          { label: 'Sections',      val: sections.length },
        ].map(k => (
          <div key={k.label} style={S.kpi}>
            <div style={S.kpiVal}>{k.val}</div>
            <div style={S.kpiLabel}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div style={S.body}>
        {/* Left: section list */}
        <SectionList
          sections={sections}
          activeSectionId={activeSectionId}
          onSelect={setActiveSectionId}
          venueId={VENUE_ID}
          onSectionCreated={sec => setSections(prev => [...prev, sec])}
        />

        {/* Center: floor view */}
        <div style={S.floorArea}>
          <div style={S.floorToolbar}>
            <div style={S.floorLabel}>
              {activeSectionId ? sections.find(s => s.section_id === activeSectionId)?.section_name || 'Section' : 'All Sections'}
              <span style={{ color: DARK_MUTE, marginLeft: 8, fontSize: 12 }}>({visibleTables.length} tables)</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowAssignPanel(p => !p)} style={S.toolbarBtn}>Assign Server</button>
            </div>
          </div>

          {viewMode === 'canvas' ? (
            <FloorMapCanvas
              tables={visibleTables}
              selectedTableId={selectedTable?.table_id}
              onTableSelect={handleTableSelect}
              onTableMove={handleTableMove}
            />
          ) : (
            <div style={S.grid}>
              {visibleTables.length === 0 ? (
                <div style={S.emptyFloor}>
                  <img
                    src="/smokecraft-pos360.png"
                    alt="POS360 SmokeCraft visual reference"
                    style={S.refImage}
                  />
                  <div style={S.emptyMsg}>No tables configured for this venue yet.</div>
                  <div style={{ color: DARK_MUTE, fontSize: 12, maxWidth: 340, textAlign: 'center' }}>
                    Create sections and tables via the API or the table management interface.<br />
                    Reference image above shows the approved POS360 visual direction.
                  </div>
                </div>
              ) : (
                visibleTables.map(t => (
                  <TableCard
                    key={t.table_id}
                    table={t}
                    selected={selectedTable?.table_id === t.table_id}
                    onClick={handleTableSelect}
                  />
                ))
              )}
            </div>
          )}

          {/* Status legend */}
          <StatusLegend />
        </div>

        {/* Right: detail drawer or server panel */}
        {drawerOpen && selectedTable && (
          <TableDetailDrawer
            table={selectedTable}
            venueId={VENUE_ID}
            onClose={() => { setDrawerOpen(false); setSelectedTable(null) }}
            onStatusChange={handleStatusChange}
          />
        )}
        {showAssignPanel && (
          <ServerAssignmentPanel
            venueId={VENUE_ID}
            sectionId={activeSectionId}
            tableId={selectedTable?.table_id}
            onAssign={() => { setShowAssignPanel(false); fetchFloorState() }}
          />
        )}
        {!drawerOpen && !showAssignPanel && (
          <div style={S.rightEmpty}>
            <img
              src="/smokecraft-pos360.png"
              alt="POS360 SmokeCraft reference — select a table"
              style={{ width: '100%', borderRadius: 12, border: `1px solid ${DARK_LINE}`, objectFit: 'cover', maxHeight: 360, objectPosition: 'top' }}
            />
            <div style={{ color: DARK_MUTE, fontSize: 12, textAlign: 'center', padding: '12px 16px' }}>
              Select a table to view details, change status, assign server, or surface SmokeCraft guest intelligence.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  wrap:             { minHeight: '100vh', background: DARK_BG, color: DARK_TEXT, fontFamily: '"Georgia", serif', display: 'flex', flexDirection: 'column' },
  nav:              { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: 'rgba(10,8,4,0.96)', borderBottom: `1px solid ${DARK_LINE}` },
  navLeft:          { display: 'flex', alignItems: 'center', gap: 10 },
  navCrown:         { fontSize: 20, color: GOLD },
  navTitle:         { fontSize: 15, fontWeight: 700, color: GOLD, lineHeight: 1 },
  navSub:           { fontSize: 10, color: DARK_MUTE, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' },
  navRight:         { display: 'flex', alignItems: 'center', gap: 8 },
  syncBar:          { display: 'flex', alignItems: 'center', gap: 5 },
  syncDot:          { width: 7, height: 7, borderRadius: '50%' },
  syncLabel:        { fontSize: 10, color: DARK_MUTE, fontFamily: 'JetBrains Mono, monospace' },
  iconBtn:          { background: 'none', border: `1px solid ${DARK_LINE}`, color: DARK_MUTE, borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 14 },
  notice:           { background: '#1a1a04', borderBottom: '1px solid #5a5a10', color: '#c0b040', padding: '7px 20px', fontSize: 12 },
  previewBanner:    { background: 'rgba(230,81,0,0.12)', borderBottom: '1px solid rgba(230,81,0,0.3)', color: '#ff8f00', padding: '6px 20px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' },
  kpiStrip:         { display: 'flex', gap: 0, borderBottom: `1px solid ${DARK_LINE}` },
  kpi:              { flex: 1, padding: '10px 16px', borderRight: `1px solid ${DARK_LINE}`, textAlign: 'center' },
  kpiVal:           { fontSize: 22, fontWeight: 700, color: GOLD },
  kpiLabel:         { fontSize: 10, color: DARK_MUTE, marginTop: 2, fontFamily: 'JetBrains Mono, monospace' },
  body:             { display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 },

  // Section list
  sectionList:      { width: 180, background: DARK_CARD, borderRight: `1px solid ${DARK_LINE}`, display: 'flex', flexDirection: 'column', flexShrink: 0 },
  sectionListHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 10px 8px', borderBottom: `1px solid ${DARK_LINE}` },
  sectionItem:      { padding: '9px 12px', cursor: 'pointer', fontSize: 13, color: DARK_MUTE, display: 'flex', alignItems: 'center', gap: 4, borderBottom: `1px solid ${DARK_LINE}22` },
  sectionItemActive:{ color: GOLD, background: GOLD_DIM },
  miniBtn:          { background: 'none', border: `1px solid ${DARK_LINE}`, color: GOLD, borderRadius: 4, padding: '2px 6px', cursor: 'pointer', fontSize: 13 },

  // Floor area
  floorArea:        { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  floorToolbar:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: `1px solid ${DARK_LINE}`, background: 'rgba(12,10,6,0.7)' },
  floorLabel:       { fontSize: 13, color: DARK_TEXT, fontWeight: 600 },
  toolbarBtn:       { background: GOLD_DIM, border: `1px solid ${DARK_LINE}`, color: GOLD, borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12 },

  // Grid
  grid:             { flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexWrap: 'wrap', gap: 10, alignContent: 'flex-start' },
  tableCard:        { width: 90, height: 78, borderRadius: 10, border: '2px solid', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, position: 'relative', transition: 'box-shadow 0.15s' },
  tableNum:         { fontSize: 16, fontWeight: 700 },
  tableStatus:      { fontSize: 9, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tableServer:      { fontSize: 9, color: DARK_MUTE },
  seatCount:        { fontSize: 9, color: DARK_MUTE },
  vipBadge:         { position: 'absolute', top: 3, right: 4, fontSize: 8, color: GOLD, background: 'rgba(201,149,44,0.2)', borderRadius: 3, padding: '1px 3px' },

  // Empty floor
  emptyFloor:       { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, minHeight: 400 },
  refImage:         { width: '100%', maxWidth: 340, borderRadius: 12, border: `1px solid ${DARK_LINE}`, objectFit: 'cover', maxHeight: 260, objectPosition: 'top' },
  emptyMsg:         { fontSize: 15, color: DARK_MUTE },

  // Canvas
  canvas:           { flex: 1, position: 'relative', overflow: 'hidden', background: 'rgba(6,5,3,0.95)', cursor: 'default' },
  canvasTable:      { position: 'absolute', borderRadius: 8, border: '2px solid', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, transition: 'box-shadow 0.1s', userSelect: 'none' },

  // Status legend
  legend:           { display: 'flex', flexWrap: 'wrap', gap: 8, padding: '8px 14px', borderTop: `1px solid ${DARK_LINE}`, background: 'rgba(8,6,4,0.8)' },
  legendItem:       { display: 'flex', alignItems: 'center', gap: 4 },
  legendDot:        { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  legendText:       { fontSize: 10, color: DARK_MUTE, fontFamily: 'JetBrains Mono, monospace' },

  // Right panel (empty)
  rightEmpty:       { width: 260, flexShrink: 0, borderLeft: `1px solid ${DARK_LINE}`, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 },

  // Drawer
  drawer:           { width: 300, flexShrink: 0, borderLeft: `1px solid ${DARK_LINE}`, background: DARK_CARD, display: 'flex', flexDirection: 'column', overflowY: 'auto' },
  drawerHeader:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 16px', borderBottom: `1px solid ${DARK_LINE}` },
  drawerTitle:      { fontSize: 16, fontWeight: 700 },
  drawerSub:        { fontSize: 12, fontFamily: 'JetBrains Mono, monospace', marginTop: 2 },
  vipInline:        { color: GOLD, fontSize: 14 },
  closeBtn:         { background: 'none', border: 'none', color: DARK_MUTE, cursor: 'pointer', fontSize: 16, padding: 4 },
  infoGrid:         { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, padding: '12px 16px', borderBottom: `1px solid ${DARK_LINE}` },
  infoCell:         { background: 'rgba(201,149,44,0.04)', padding: '8px 10px', borderRadius: 4 },
  infoCellLabel:    { fontSize: 9, color: DARK_MUTE, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', marginBottom: 3 },
  infoCellVal:      { fontSize: 13, color: DARK_TEXT },
  section:          { padding: '12px 16px', borderBottom: `1px solid ${DARK_LINE}` },
  sectionTitle:     { fontSize: 10, color: GOLD, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 },
  statusRow:        { display: 'flex', gap: 8 },
  statusSelect:     { flex: 1, background: 'rgba(20,15,8,0.95)', border: `1px solid ${DARK_LINE}`, color: DARK_TEXT, borderRadius: 6, padding: '6px 8px', fontSize: 12 },
  actionBtn:        { background: GOLD_DIM, border: `1px solid ${DARK_LINE}`, color: GOLD, borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' },
  emptyState:       { color: DARK_MUTE, fontSize: 12, fontStyle: 'italic' },
  scPanel:          { background: 'rgba(201,149,44,0.05)', borderRadius: 6, padding: '8px 10px' },
  scRow:            { display: 'flex', justifyContent: 'space-between', marginBottom: 4 },
  scLabel:          { fontSize: 11, color: DARK_MUTE, fontFamily: 'JetBrains Mono, monospace' },
  scVal:            { fontSize: 11, color: GOLD, fontFamily: 'JetBrains Mono, monospace' },
  scNote:           { fontSize: 11, color: DARK_MUTE, fontStyle: 'italic', marginTop: 6 },
  eatRec:           { background: 'rgba(21,101,192,0.1)', border: '1px solid rgba(21,101,192,0.2)', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: '#90caf9', marginBottom: 6 },

  // Server panel
  panel:            { width: 260, flexShrink: 0, borderLeft: `1px solid ${DARK_LINE}`, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, background: DARK_CARD },
  panelTitle:       { fontSize: 12, color: GOLD, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em' },
  input:            { background: 'rgba(20,15,8,0.95)', border: `1px solid ${DARK_LINE}`, color: DARK_TEXT, borderRadius: 6, padding: '7px 10px', fontSize: 12, outline: 'none' },
  resultNote:       { fontSize: 11, color: GOLD, fontFamily: 'JetBrains Mono, monospace' },
}
