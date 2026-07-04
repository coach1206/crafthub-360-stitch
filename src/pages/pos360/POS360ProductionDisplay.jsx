/**
 * POS360 Production Display System — UI (Phase B.4)
 * Supports: kitchen, bar, humidor, expo, dessert, coffee, retail, merchandise, gift_shop, custom
 */

import { useState, useEffect, useCallback } from 'react'
import { usePOS360VenueContextHook } from '../../utils/pos360VenueContext.js'

// ── Design tokens ────────────────────────────────────────────────────────────
const DARK_BG   = '#080604'
const GOLD      = '#c9952c'
const DARK_CARD = '#13110d'
const DARK_LINE = '#2a2520'
const DARK_TEXT = '#f0ead8'
const DARK_MUTE = '#8a7e6a'
const RED       = '#c0392b'
const GREEN     = '#27ae60'
const BLUE      = '#2980b9'
const AMBER     = '#e67e22'

const STATUS_COLORS = {
  queued:      DARK_MUTE,
  held:        AMBER,
  fired:       BLUE,
  in_progress: GOLD,
  ready:       GREEN,
  bumped:      AMBER,
  completed:   DARK_MUTE,
  canceled:    RED,
  voided:      RED,
  delayed:     RED,
  escalated:   RED,
}

const STATION_ICONS = {
  kitchen:      '🍳',
  bar:          '🍸',
  humidor:      '🍷',
  expo:         '🎯',
  dessert:      '🍰',
  coffee:       '☕',
  retail:       '🛒',
  merchandise:  '👕',
  gift_shop:    '🎁',
  custom:       '⚙️',
}

// ── Timer bar ────────────────────────────────────────────────────────────────
function TimerBar({ createdAt, thresholdMs = 600000 }) {
  const [elapsed, setElapsed] = useState(Date.now() - new Date(createdAt).getTime())
  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - new Date(createdAt).getTime()), 1000)
    return () => clearInterval(id)
  }, [createdAt])

  const pct   = Math.min(100, (elapsed / thresholdMs) * 100)
  const color = pct < 50 ? GREEN : pct < 80 ? AMBER : RED
  const secs  = Math.floor(elapsed / 1000)
  const label = secs < 60 ? `${secs}s` : `${Math.floor(secs / 60)}m ${secs % 60}s`

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ background: DARK_LINE, borderRadius: 3, height: 4 }}>
        <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: 3, transition: 'width 1s linear' }} />
      </div>
      <span style={{ fontSize: 10, color: DARK_MUTE }}>{label}</span>
    </div>
  )
}

// ── Ticket item row ───────────────────────────────────────────────────────────
function TicketItemRow({ item, onStatusChange, readonly }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '6px 0', borderBottom: `1px solid ${DARK_LINE}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ color: DARK_TEXT, fontSize: 13 }}>{item.item_name}</div>
        {item.modifiers?.length > 0 && (
          <div style={{ color: DARK_MUTE, fontSize: 11 }}>{item.modifiers.join(', ')}</div>
        )}
        {item.notes && <div style={{ color: AMBER, fontSize: 11 }}>{item.notes}</div>}
      </div>
      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4,
        background: STATUS_COLORS[item.status] + '30', color: STATUS_COLORS[item.status] }}>
        {item.status}
      </span>
      {!readonly && (
        <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
          {item.status === 'queued' && (
            <button onClick={() => onStatusChange(item.id, 'in_progress')}
              style={btnStyle(BLUE)}>Start</button>
          )}
          {item.status === 'in_progress' && (
            <button onClick={() => onStatusChange(item.id, 'ready')}
              style={btnStyle(GREEN)}>Ready</button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Ticket card ───────────────────────────────────────────────────────────────
function TicketCard({ ticket, onAction, onItemStatusChange }) {
  const [expanded, setExpanded] = useState(false)
  const isRush = ticket.rush_flag || ticket.vip_flags?.vip
  const border = isRush ? `2px solid ${RED}` : `1px solid ${DARK_LINE}`

  return (
    <div style={{ background: DARK_CARD, border, borderRadius: 8, padding: 12, marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: GOLD, fontWeight: 700, fontSize: 15 }}>
            #{ticket.ticket_number ?? ticket.id?.slice(-6)}
            {isRush && <span style={{ color: RED, marginLeft: 6, fontSize: 11 }}>RUSH</span>}
          </div>
          {ticket.table_number && (
            <div style={{ color: DARK_MUTE, fontSize: 12 }}>Table {ticket.table_number}</div>
          )}
          {ticket.server_name && (
            <div style={{ color: DARK_MUTE, fontSize: 12 }}>{ticket.server_name}</div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4,
            background: STATUS_COLORS[ticket.status] + '30', color: STATUS_COLORS[ticket.status] }}>
            {ticket.status}
          </span>
          {ticket.created_at && <TimerBar createdAt={ticket.created_at} />}
        </div>
      </div>

      {ticket.allergy_flags?.length > 0 && (
        <div style={{ marginTop: 6, padding: '4px 8px', background: RED + '20',
          borderRadius: 4, color: RED, fontSize: 11 }}>
          ALLERGY: {ticket.allergy_flags.join(', ')}
        </div>
      )}

      <div style={{ marginTop: 8 }}>
        <button onClick={() => setExpanded(e => !e)}
          style={{ background: 'none', border: 'none', color: DARK_MUTE, fontSize: 12, cursor: 'pointer', padding: 0 }}>
          {ticket.items?.length ?? 0} items {expanded ? '▲' : '▼'}
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: 8 }}>
          {(ticket.items ?? []).map(item => (
            <TicketItemRow key={item.id} item={item}
              onStatusChange={onItemStatusChange} readonly={false} />
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
        {ticket.status === 'fired' && (
          <button onClick={() => onAction(ticket.id, 'start')} style={btnStyle(BLUE)}>Start</button>
        )}
        {ticket.status === 'in_progress' && (
          <button onClick={() => onAction(ticket.id, 'ready')} style={btnStyle(GREEN)}>Ready</button>
        )}
        {ticket.status === 'ready' && (
          <button onClick={() => onAction(ticket.id, 'bump')} style={btnStyle(AMBER)}>Bump</button>
        )}
        {['fired','in_progress','ready'].includes(ticket.status) && (
          <button onClick={() => onAction(ticket.id, 'complete')} style={btnStyle(DARK_MUTE)}>Complete</button>
        )}
        {['fired','in_progress'].includes(ticket.status) && (
          <button onClick={() => onAction(ticket.id, 'escalate')} style={btnStyle(RED)}>Escalate</button>
        )}
      </div>
    </div>
  )
}

// ── Ticket detail drawer ──────────────────────────────────────────────────────
function TicketDetailDrawer({ ticket, onClose }) {
  if (!ticket) return null
  return (
    <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 360,
      background: DARK_CARD, borderLeft: `1px solid ${DARK_LINE}`, zIndex: 50,
      overflowY: 'auto', padding: 20 }}>
      <button onClick={onClose}
        style={{ background: 'none', border: 'none', color: DARK_MUTE, fontSize: 20, cursor: 'pointer' }}>✕</button>
      <h3 style={{ color: GOLD, marginTop: 12 }}>Ticket #{ticket.id?.slice(-6)}</h3>
      <pre style={{ color: DARK_TEXT, fontSize: 11, whiteSpace: 'pre-wrap' }}>
        {JSON.stringify(ticket, null, 2)}
      </pre>
    </div>
  )
}

// ── Hold / Fire control panel ─────────────────────────────────────────────────
function HoldFireControlPanel({ ticketId, venueId, onRefresh }) {
  const [status, setStatus] = useState(null)
  const base = `/api/pos360/production`

  const act = async (endpoint) => {
    const r = await fetch(`${base}${endpoint}`, { method: 'POST' })
    const d = await r.json()
    setStatus(d.ok ? 'Success' : (d.error ?? 'Failed'))
    if (d.ok) onRefresh()
  }

  return (
    <div style={{ padding: 12, background: DARK_CARD, borderRadius: 8, border: `1px solid ${DARK_LINE}` }}>
      <div style={{ color: DARK_TEXT, fontWeight: 600, marginBottom: 10 }}>Hold / Fire Controls</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => act(`/tickets/${ticketId}/fire`)} style={btnStyle(BLUE)}>Fire Order</button>
        <button onClick={() => act(`/tickets/${ticketId}/cancel-hold`)} style={btnStyle(AMBER)}>Cancel Hold</button>
        <button onClick={() => act(`/tickets/${ticketId}/complete`)} style={btnStyle(GREEN)}>Complete</button>
        <button onClick={() => act(`/tickets/${ticketId}/escalate`)} style={btnStyle(RED)}>Escalate</button>
      </div>
      {status && <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 8 }}>{status}</div>}
    </div>
  )
}

// ── Routing status panel ──────────────────────────────────────────────────────
function RoutingStatusPanel({ venueId }) {
  const [rules, setRules] = useState(null)
  useEffect(() => {
    fetch(`/api/pos360/production/routing-rules`)
      .then(r => r.json()).then(d => setRules(d.rules ?? []))
      .catch(() => setRules([]))
  }, [venueId])

  return (
    <div style={{ padding: 12, background: DARK_CARD, borderRadius: 8, border: `1px solid ${DARK_LINE}` }}>
      <div style={{ color: DARK_TEXT, fontWeight: 600, marginBottom: 10 }}>Routing Rules</div>
      {rules === null && <div style={{ color: DARK_MUTE }}>Loading…</div>}
      {rules?.length === 0 && <div style={{ color: DARK_MUTE, fontSize: 12 }}>No routing rules configured.</div>}
      {rules?.map(r => (
        <div key={r.id} style={{ padding: '6px 0', borderBottom: `1px solid ${DARK_LINE}`, fontSize: 12 }}>
          <span style={{ color: GOLD }}>{r.rule_name ?? r.id?.slice(-6)}</span>
          <span style={{ color: DARK_MUTE, marginLeft: 8 }}>{r.station_type}</span>
        </div>
      ))}
    </div>
  )
}

// ── Station status panel ──────────────────────────────────────────────────────
function StationStatusPanel({ station, onSelect, selected }) {
  const icon = STATION_ICONS[station.station_type] ?? '⚙️'
  return (
    <button onClick={() => onSelect(station.id)}
      style={{ background: selected ? GOLD + '20' : DARK_CARD,
        border: `1px solid ${selected ? GOLD : DARK_LINE}`,
        borderRadius: 8, padding: '10px 16px', cursor: 'pointer',
        textAlign: 'left', color: DARK_TEXT, minWidth: 140 }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontWeight: 600, fontSize: 13 }}>{station.station_name}</div>
      <div style={{ color: DARK_MUTE, fontSize: 11 }}>{station.station_type}</div>
      <div style={{ color: station.is_active ? GREEN : RED, fontSize: 10, marginTop: 2 }}>
        {station.is_active ? 'Active' : 'Inactive'}
      </div>
    </button>
  )
}

// ── Station selector ──────────────────────────────────────────────────────────
function StationSelector({ stations, selectedId, onSelect }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '12px 0' }}>
      <button onClick={() => onSelect(null)}
        style={{ background: !selectedId ? GOLD + '20' : DARK_CARD,
          border: `1px solid ${!selectedId ? GOLD : DARK_LINE}`,
          borderRadius: 8, padding: '10px 16px', cursor: 'pointer',
          color: DARK_TEXT, fontSize: 13 }}>
        🎯 All Stations
      </button>
      {stations.map(s => (
        <StationStatusPanel key={s.id} station={s}
          selected={s.id === selectedId} onSelect={onSelect} />
      ))}
    </div>
  )
}

// ── KDS-style displays ────────────────────────────────────────────────────────
function KitchenDisplay({ tickets, onAction, onItemStatusChange }) {
  if (!tickets?.length) return <EmptyState message="No active kitchen tickets." />
  return <TicketGrid tickets={tickets} onAction={onAction} onItemStatusChange={onItemStatusChange} />
}

function BarDisplay({ tickets, onAction, onItemStatusChange }) {
  if (!tickets?.length) return <EmptyState message="No active bar tickets." />
  return <TicketGrid tickets={tickets} onAction={onAction} onItemStatusChange={onItemStatusChange} />
}

function HumidorDisplay({ tickets, onAction, onItemStatusChange }) {
  if (!tickets?.length) return <EmptyState message="No active humidor tickets." />
  return <TicketGrid tickets={tickets} onAction={onAction} onItemStatusChange={onItemStatusChange} />
}

function ExpoDisplay({ tickets, onAction, onItemStatusChange }) {
  if (!tickets?.length) return <EmptyState message="No active expo tickets." />
  return <TicketGrid tickets={tickets} onAction={onAction} onItemStatusChange={onItemStatusChange} />
}

function CustomStationDisplay({ tickets, stationName, onAction, onItemStatusChange }) {
  if (!tickets?.length) return <EmptyState message={`No active tickets for ${stationName ?? 'this station'}.`} />
  return <TicketGrid tickets={tickets} onAction={onAction} onItemStatusChange={onItemStatusChange} />
}

function TicketGrid({ tickets, onAction, onItemStatusChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
      {tickets.map(t => (
        <TicketCard key={t.id} ticket={t} onAction={onAction} onItemStatusChange={onItemStatusChange} />
      ))}
    </div>
  )
}

// ── Rush / Delay queues ───────────────────────────────────────────────────────
function RushDelayQueue({ venueId }) {
  const [rush, setRush]   = useState([])
  const [delay, setDelay] = useState([])

  useEffect(() => {
    fetch(`/api/pos360/production/display/rush`).then(r => r.json()).then(d => setRush(d.tickets ?? []))
    fetch(`/api/pos360/production/display/delayed`).then(r => r.json()).then(d => setDelay(d.tickets ?? []))
  }, [venueId])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
      <div style={{ padding: 12, background: RED + '15', border: `1px solid ${RED}40`, borderRadius: 8 }}>
        <div style={{ color: RED, fontWeight: 600, marginBottom: 8 }}>Rush / Priority ({rush.length})</div>
        {rush.length === 0 && <div style={{ color: DARK_MUTE, fontSize: 12 }}>No rush tickets.</div>}
        {rush.map(t => <div key={t.id} style={{ color: DARK_TEXT, fontSize: 12, padding: '3px 0' }}>
          #{t.ticket_number ?? t.id?.slice(-6)} — {t.status}
        </div>)}
      </div>
      <div style={{ padding: 12, background: AMBER + '15', border: `1px solid ${AMBER}40`, borderRadius: 8 }}>
        <div style={{ color: AMBER, fontWeight: 600, marginBottom: 8 }}>Delayed ({delay.length})</div>
        {delay.length === 0 && <div style={{ color: DARK_MUTE, fontSize: 12 }}>No delayed tickets.</div>}
        {delay.map(t => <div key={t.id} style={{ color: DARK_TEXT, fontSize: 12, padding: '3px 0' }}>
          #{t.ticket_number ?? t.id?.slice(-6)} — {t.status}
        </div>)}
      </div>
    </div>
  )
}

// ── Completed tickets panel ───────────────────────────────────────────────────
function CompletedTicketsPanel({ venueId }) {
  const [tickets, setTickets] = useState([])
  useEffect(() => {
    fetch(`/api/pos360/production/display/completed`)
      .then(r => r.json()).then(d => setTickets(d.tickets ?? []))
      .catch(() => {})
  }, [venueId])

  return (
    <div style={{ padding: 12, background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8 }}>
      <div style={{ color: DARK_TEXT, fontWeight: 600, marginBottom: 10 }}>
        Completed Tickets ({tickets.length})
      </div>
      {tickets.length === 0 && <div style={{ color: DARK_MUTE, fontSize: 12 }}>No recently completed tickets.</div>}
      {tickets.slice(0, 20).map(t => (
        <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between',
          padding: '5px 0', borderBottom: `1px solid ${DARK_LINE}`, fontSize: 12 }}>
          <span style={{ color: GOLD }}>#{t.ticket_number ?? t.id?.slice(-6)}</span>
          <span style={{ color: DARK_MUTE }}>{new Date(t.completed_at ?? t.updated_at).toLocaleTimeString()}</span>
        </div>
      ))}
    </div>
  )
}

// ── SmokeCraft production context panel ───────────────────────────────────────
function SmokeCraftProductionContextPanel({ venueId }) {
  const [ctx, setCtx] = useState(null)
  useEffect(() => {
    fetch(`/api/pos360/production/smokecraft`)
      .then(r => r.json()).then(setCtx).catch(() => {})
  }, [venueId])

  return (
    <div style={{ padding: 12, background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <img src="/smokecraft-pos360.png" alt="SmokeCraft" style={{ height: 28, objectFit: 'contain' }} />
        <span style={{ color: GOLD, fontWeight: 600 }}>SmokeCraft Production Context</span>
      </div>
      {!ctx && <div style={{ color: DARK_MUTE, fontSize: 12 }}>Loading…</div>}
      {ctx?.localPreview && (
        <div style={{ color: DARK_MUTE, fontSize: 12 }}>{ctx.message ?? 'SmokeCraft production context not connected.'}</div>
      )}
      {ctx && !ctx.localPreview && (
        <pre style={{ color: DARK_TEXT, fontSize: 11, whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(ctx, null, 2)}
        </pre>
      )}
    </div>
  )
}

// ── E.A.T. recommendations panel ─────────────────────────────────────────────
function EATProductionRecommendationsPanel({ venueId }) {
  const [rec, setRec] = useState(null)
  useEffect(() => {
    fetch(`/api/pos360/production/eat-recommendations`)
      .then(r => r.json()).then(setRec).catch(() => {})
  }, [venueId])

  return (
    <div style={{ padding: 12, background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8 }}>
      <div style={{ color: GOLD, fontWeight: 600, marginBottom: 10 }}>E.A.T. Production Intelligence</div>
      {!rec && <div style={{ color: DARK_MUTE, fontSize: 12 }}>Loading…</div>}
      {rec?.localPreview && (
        <div style={{ color: DARK_MUTE, fontSize: 12 }}>{rec.message ?? 'E.A.T. production intelligence not connected.'}</div>
      )}
      {rec && !rec.localPreview && (
        <pre style={{ color: DARK_TEXT, fontSize: 11, whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(rec, null, 2)}
        </pre>
      )}
    </div>
  )
}

// ── Analytics preview ─────────────────────────────────────────────────────────
function ProductionAnalyticsPreview({ venueId }) {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch(`/api/pos360/production/analytics/summary`)
      .then(r => r.json()).then(setData).catch(() => {})
  }, [venueId])

  return (
    <div style={{ padding: 12, background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8 }}>
      <div style={{ color: DARK_TEXT, fontWeight: 600, marginBottom: 10 }}>Production Analytics</div>
      {!data && <div style={{ color: DARK_MUTE, fontSize: 12 }}>Loading…</div>}
      {data?.localPreview && <div style={{ color: DARK_MUTE, fontSize: 12 }}>Analytics unavailable — database not configured.</div>}
      {data && !data.localPreview && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {Object.entries(data.summary ?? {}).map(([k, v]) => (
            <div key={k} style={{ textAlign: 'center' }}>
              <div style={{ color: GOLD, fontSize: 22, fontWeight: 700 }}>{v}</div>
              <div style={{ color: DARK_MUTE, fontSize: 10 }}>{k.replace(/_/g, ' ')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Display sync status ───────────────────────────────────────────────────────
function DisplaySyncStatus({ stationId, onSync }) {
  const [syncing, setSyncing] = useState(false)
  const [last, setLast]       = useState(null)

  const doSync = async () => {
    setSyncing(true)
    try {
      const r = await fetch('/api/pos360/production/display/sync', { method: 'POST' })
      const d = await r.json()
      setLast(d.ok ? 'Synced' : 'Sync failed')
      if (onSync) onSync()
    } catch {
      setLast('Sync error')
    }
    setSyncing(false)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button onClick={doSync} disabled={syncing} style={btnStyle(BLUE, syncing)}>
        {syncing ? 'Syncing…' : 'Sync Display'}
      </button>
      {last && <span style={{ color: DARK_MUTE, fontSize: 12 }}>{last}</span>}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ message }) {
  return (
    <div style={{ textAlign: 'center', padding: 40, color: DARK_MUTE }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
      <div style={{ fontSize: 14 }}>{message}</div>
    </div>
  )
}

// ── Button style helper ───────────────────────────────────────────────────────
function btnStyle(color, disabled = false) {
  return {
    background: disabled ? DARK_LINE : color + '25',
    border: `1px solid ${disabled ? DARK_LINE : color}`,
    color: disabled ? DARK_MUTE : color,
    borderRadius: 6, padding: '5px 12px', fontSize: 12,
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}

// ── View tabs ─────────────────────────────────────────────────────────────────
const VIEWS = ['station', 'expo', 'rush', 'completed', 'routing', 'analytics', 'smokecraft']

// ── Main component ─────────────────────────────────────────────────────────────
export default function POS360ProductionDisplay() {
  const venueCtx        = usePOS360VenueContextHook()
  const venueId         = venueCtx?.venueId
  const [stations, setStations] = useState([])
  const [selectedStation, setSelectedStation] = useState(null)
  const [tickets, setTickets]   = useState([])
  const [view, setView]         = useState('station')
  const [detailTicket, setDetailTicket] = useState(null)
  const [loading, setLoading]   = useState(false)

  const fetchStations = useCallback(async () => {
    if (!venueId) return
    try {
      const r = await fetch(`/api/pos360/production/stations`)
      const d = await r.json()
      setStations(d.stations ?? [])
    } catch { setStations([]) }
  }, [venueId])

  const fetchTickets = useCallback(async () => {
    if (!venueId) return
    setLoading(true)
    try {
      const url = selectedStation
        ? `/api/pos360/production/display/station/${selectedStation}`
        : `/api/pos360/production/display/all-stations`
      const r = await fetch(url)
      const d = await r.json()
      setTickets(d.tickets ?? [])
    } catch { setTickets([]) }
    setLoading(false)
  }, [venueId, selectedStation])

  useEffect(() => { fetchStations() }, [fetchStations])
  useEffect(() => { fetchTickets()  }, [fetchTickets])

  const handleTicketAction = async (ticketId, action) => {
    const endpointMap = {
      start:    `/tickets/${ticketId}/status`,
      ready:    `/tickets/${ticketId}/status`,
      bump:     `/tickets/${ticketId}/bump`,
      complete: `/tickets/${ticketId}/complete`,
      escalate: `/tickets/${ticketId}/escalate`,
    }
    const bodyMap = {
      start: { status: 'in_progress' },
      ready: { status: 'ready' },
    }
    try {
      const ep     = endpointMap[action]
      const method = ['bump','complete','escalate'].includes(action) ? 'POST' : 'PATCH'
      await fetch(`/api/pos360/production${ep}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: bodyMap[action] ? JSON.stringify(bodyMap[action]) : undefined,
      })
      fetchTickets()
    } catch { /* silent */ }
  }

  const handleItemStatusChange = async (itemId, status) => {
    await fetch(`/api/pos360/production/items/${itemId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchTickets()
  }

  const selectedStationObj = stations.find(s => s.id === selectedStation)
  const stationType        = selectedStationObj?.station_type ?? 'kitchen'

  if (!venueId) {
    return (
      <div style={{ background: DARK_BG, minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: DARK_MUTE }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔒</div>
          <div>No venue context. Please log in with a venue-assigned account.</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: DARK_BG, minHeight: '100vh', color: DARK_TEXT, fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px', borderBottom: `1px solid ${DARK_LINE}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/smokecraft-pos360.png" alt="POS360" style={{ height: 32, objectFit: 'contain' }} />
          <div>
            <div style={{ color: GOLD, fontWeight: 700, fontSize: 16 }}>Production Display</div>
            <div style={{ color: DARK_MUTE, fontSize: 11 }}>Phase B.4 — Kitchen · Bar · Humidor · Expo · Custom</div>
          </div>
        </div>
        <DisplaySyncStatus onSync={fetchTickets} />
      </div>

      <div style={{ padding: 20 }}>
        {/* Station selector */}
        <StationSelector stations={stations} selectedId={selectedStation} onSelect={setSelectedStation} />

        {/* View tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
          {VIEWS.map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{ ...btnStyle(v === view ? GOLD : DARK_MUTE), fontWeight: v === view ? 700 : 400 }}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {/* Rush/delay banner */}
        {view === 'station' && <RushDelayQueue venueId={venueId} />}

        {/* Main view */}
        {view === 'station' && (
          <>
            {loading && <div style={{ color: DARK_MUTE, padding: 20 }}>Loading tickets…</div>}
            {!loading && !selectedStation && (
              <KitchenDisplay tickets={tickets}
                onAction={handleTicketAction} onItemStatusChange={handleItemStatusChange} />
            )}
            {!loading && selectedStation && stationType === 'bar' && (
              <BarDisplay tickets={tickets}
                onAction={handleTicketAction} onItemStatusChange={handleItemStatusChange} />
            )}
            {!loading && selectedStation && stationType === 'humidor' && (
              <HumidorDisplay tickets={tickets}
                onAction={handleTicketAction} onItemStatusChange={handleItemStatusChange} />
            )}
            {!loading && selectedStation && stationType === 'expo' && (
              <ExpoDisplay tickets={tickets}
                onAction={handleTicketAction} onItemStatusChange={handleItemStatusChange} />
            )}
            {!loading && selectedStation && !['bar','humidor','expo'].includes(stationType) && (
              <CustomStationDisplay tickets={tickets} stationName={selectedStationObj?.station_name}
                onAction={handleTicketAction} onItemStatusChange={handleItemStatusChange} />
            )}
          </>
        )}
        {view === 'expo' && (
          <ExpoDisplay tickets={tickets}
            onAction={handleTicketAction} onItemStatusChange={handleItemStatusChange} />
        )}
        {view === 'rush' && <RushDelayQueue venueId={venueId} />}
        {view === 'completed' && <CompletedTicketsPanel venueId={venueId} />}
        {view === 'routing' && <RoutingStatusPanel venueId={venueId} />}
        {view === 'analytics' && (
          <div style={{ display: 'grid', gap: 16 }}>
            <ProductionAnalyticsPreview venueId={venueId} />
          </div>
        )}
        {view === 'smokecraft' && (
          <div style={{ display: 'grid', gap: 16 }}>
            <SmokeCraftProductionContextPanel venueId={venueId} />
            <EATProductionRecommendationsPanel venueId={venueId} />
          </div>
        )}
      </div>

      {/* Ticket detail drawer */}
      <TicketDetailDrawer ticket={detailTicket} onClose={() => setDetailTicket(null)} />
    </div>
  )
}
