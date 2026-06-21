/**
 * TicketRail — horizontal rail of open tickets to switch between. Tickets
 * open longer than `warnAfterMinutes` (or held) get a warning-pulse style.
 */
import { GOLD, PANEL2, LINE } from '../eat/ui.jsx'
import { selectionTap } from '../../services/shared/haptics.js'

export default function TicketRail({ tickets = [], activeId, onSelect, onNewTicket, warnAfterMinutes = 15 }) {
  const now = Date.now()

  function isWarning(t) {
    if (t.status === 'held') return true
    const ageMin = (now - (t.createdAt || now)) / 60000
    return ageMin >= warnAfterMinutes
  }

  function select(id) {
    try { selectionTap() } catch {}
    onSelect && onSelect(id)
  }

  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '8px 0' }}>
      {tickets.map((t) => {
        const active = t.id === activeId
        const warn = isWarning(t)
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => select(t.id)}
            style={{
              minHeight: 48,
              flexShrink: 0,
              padding: '10px 16px',
              borderRadius: 12,
              border: active ? `2px solid ${GOLD}` : warn ? '2px solid rgba(217,130,43,0.7)' : `1px solid ${LINE}`,
              background: active ? 'rgba(212,168,67,0.15)' : warn ? 'rgba(217,130,43,0.12)' : PANEL2,
              color: active ? GOLD : warn ? '#f0a85c' : '#cdd5df',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              touchAction: 'manipulation',
              animation: warn ? 'pos3-warn-pulse 1.4s ease-in-out infinite' : 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {t.id}{t.tableId ? ` · ${t.tableId}` : ''}{t.status === 'held' ? ' (held)' : ''}
          </button>
        )
      })}
      {onNewTicket && (
        <button
          type="button"
          onClick={() => { try { selectionTap() } catch {}; onNewTicket() }}
          style={{
            minHeight: 48, flexShrink: 0, padding: '10px 16px', borderRadius: 12,
            border: `1px dashed ${LINE}`, background: 'transparent', color: '#8b95a3',
            fontWeight: 700, fontSize: 13, cursor: 'pointer', touchAction: 'manipulation', whiteSpace: 'nowrap',
          }}
        >
          + New Ticket
        </button>
      )}
      <style>{`@keyframes pos3-warn-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(217,130,43,0.4); } 50% { box-shadow: 0 0 0 6px rgba(217,130,43,0.12); } }`}</style>
    </div>
  )
}
