/**
 * Shared venue floor-plan primitives for POS3 Tables and E.A.T. Sections.
 * Premium hospitality look: warm ivory/stone panels, champagne gold accents,
 * navy command areas, CSS-built lounge/patio venue textures (no venue photo
 * assets exist in the repo yet, so textures are gradient/pattern based per
 * the redesign brief's "create CSS-based premium venue texture panels"
 * fallback instruction).
 */
import { motion } from 'framer-motion'

export const STATUS_META = {
  open:         { label: 'Open',          color: '#2f9e5b', bg: 'rgba(47,158,91,0.12)' },
  seated:       { label: 'Seated',        color: '#2a6fd6', bg: 'rgba(42,111,214,0.12)' },
  busy:         { label: 'Busy',          color: '#c0443a', bg: 'rgba(192,68,58,0.12)' },
  reserved:     { label: 'Reserved',      color: '#7e57c2', bg: 'rgba(126,87,194,0.12)' },
  vip:          { label: 'VIP',           color: '#9c7320', bg: 'rgba(201,149,44,0.16)' },
  needsService: { label: 'Needs Service', color: '#b8721c', bg: 'rgba(216,130,30,0.16)' },
  cleaning:     { label: 'Cleaning',      color: '#6b7385', bg: 'rgba(107,115,133,0.14)' },
}

export function TableStatusChip({ status, style }) {
  const m = STATUS_META[status] || STATUS_META.open
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, color: m.color, background: m.bg, borderRadius: 999,
      padding: '3px 8px', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.03em', ...style,
    }}>{m.label}</span>
  )
}

/** Lounge = warm wood/leather/amber glow. Patio = stone/greenery/string-light/firepit glow. */
const SECTION_TEXTURE = {
  Lounge: 'radial-gradient(circle at 20% 20%, rgba(201,149,44,0.16), transparent 55%), radial-gradient(circle at 80% 75%, rgba(154,98,42,0.18), transparent 50%), repeating-linear-gradient(135deg, rgba(120,80,40,0.05) 0px, rgba(120,80,40,0.05) 2px, transparent 2px, transparent 14px), linear-gradient(160deg, #f3e8d4 0%, #e9d8b8 100%)',
  Patio: 'radial-gradient(circle at 15% 15%, rgba(255,221,140,0.30), transparent 8%), radial-gradient(circle at 60% 30%, rgba(255,221,140,0.22), transparent 6%), radial-gradient(circle at 85% 70%, rgba(255,221,140,0.25), transparent 7%), radial-gradient(circle at 30% 80%, rgba(120,150,90,0.18), transparent 45%), repeating-linear-gradient(0deg, rgba(150,150,140,0.07) 0px, rgba(150,150,140,0.07) 1px, transparent 1px, transparent 22px), repeating-linear-gradient(90deg, rgba(150,150,140,0.07) 0px, rgba(150,150,140,0.07) 1px, transparent 1px, transparent 22px), linear-gradient(160deg, #ece7da 0%, #ddd6c4 100%)',
}

export function sectionTexture(section) {
  return SECTION_TEXTURE[section] || 'linear-gradient(160deg, #f5f4f0 0%, #e8e6dd 100%)'
}

const SHAPE_STYLE = {
  round: { borderRadius: '50%' },
  rect: { borderRadius: 10 },
  booth: { borderRadius: '10px 10px 28px 28px' },
}

/**
 * Draggable floor-plan table object. `onSelect` fires on tap (no drag delta);
 * `onDragEnd` fires with the framer-motion drag info for position persistence.
 */
export function VenueTableObject({ table, selected, onSelect, onDragEnd, canvasRef, size = 118 }) {
  const shape = SHAPE_STYLE[table.shape] || SHAPE_STYLE.rect
  const m = STATUS_META[table.status] || STATUS_META.open
  return (
    <motion.div
      drag
      dragMomentum={false}
      dragConstraints={canvasRef}
      onDragEnd={(e, info) => onDragEnd && onDragEnd(table.id, info)}
      onTap={() => onSelect && onSelect(table.id)}
      style={{
        position: 'absolute', left: `${table.x ?? 10}%`, top: `${table.y ?? 10}%`,
        width: table.shape === 'round' ? 96 : size, minHeight: table.shape === 'round' ? 96 : 92,
        padding: 10, background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(2px)',
        boxShadow: selected ? `0 0 0 3px ${m.color}, 0 6px 16px rgba(19,41,75,0.18)` : '0 3px 10px rgba(19,41,75,0.16)',
        cursor: 'grab', touchAction: 'none', border: `1px solid ${m.color}55`,
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: table.shape === 'round' ? 'center' : 'flex-start',
        textAlign: table.shape === 'round' ? 'center' : 'left',
        ...shape,
      }}
      whileDrag={{ scale: 1.06, boxShadow: '0 10px 24px rgba(19,41,75,0.3)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4, width: '100%' }}>
        <strong style={{ fontSize: 12, color: '#13294b' }}>T{table.tableNumber}</strong>
        {table.vip && <span style={{ fontSize: 9, color: '#9c7320', fontWeight: 800 }}>★</span>}
      </div>
      <TableStatusChip status={table.status} style={{ marginTop: 3 }} />
      <div style={{ fontSize: 10, color: '#6b7385', marginTop: 3 }}>{table.seats} seats · {table.serverInitials || '—'}</div>
      {table.elapsedTime ? <div style={{ fontSize: 10, color: '#6b7385' }}>{table.elapsedTime}</div> : null}
      {table.reservationTime ? <div style={{ fontSize: 10, color: '#7e57c2', fontWeight: 700 }}>Res {table.reservationTime}</div> : null}
    </motion.div>
  )
}

export function TableFloorCanvas({ section, children, height = 460, dropActive, canvasRef }) {
  return (
    <div
      ref={canvasRef}
      style={{
        position: 'relative', height, borderRadius: 16, overflow: 'hidden',
        background: sectionTexture(section),
        border: dropActive ? '2px dashed #c9952c' : '1px solid rgba(19,41,75,0.08)',
        boxShadow: 'inset 0 0 40px rgba(19,41,75,0.06)',
      }}
    >
      {children}
    </div>
  )
}

export function SectionTabs({ sections, value, onChange, counts }) {
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
      {sections.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          style={{
            flexShrink: 0, padding: '8px 16px', borderRadius: 999, fontSize: 12, fontWeight: 800,
            border: `1px solid ${s === value ? '#c9952c' : 'rgba(19,41,75,0.14)'}`,
            background: s === value ? '#c9952c' : '#fff', color: s === value ? '#1c2230' : '#4a5266',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >{s}{counts && counts[s] != null ? ` · ${counts[s]}` : ''}</button>
      ))}
    </div>
  )
}

const STATUS_FILTER_ORDER = ['open', 'seated', 'busy', 'reserved', 'vip', 'needsService', 'cleaning']

export function StatusFilterChips({ active, onToggle }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {STATUS_FILTER_ORDER.map((s) => {
        const m = STATUS_META[s]
        const isOn = active.has(s)
        return (
          <button
            key={s}
            type="button"
            onClick={() => onToggle(s)}
            style={{
              fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 999, cursor: 'pointer',
              border: `1px solid ${isOn ? m.color : 'rgba(19,41,75,0.14)'}`,
              background: isOn ? m.bg : '#fff', color: isOn ? m.color : '#6b7385',
            }}
          >{m.label}</button>
        )
      })}
    </div>
  )
}

export function VenueCounterCard({ label, value, accent = '#13294b' }) {
  return (
    <div style={{ flex: 1, minWidth: 110, background: '#fff', border: '1px solid rgba(19,41,75,0.08)', borderRadius: 12, padding: '10px 12px' }}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8b95a3', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: accent, marginTop: 2 }}>{value}</div>
    </div>
  )
}

export function TableActionDrawer({ table, onClose, onAction, mobile }) {
  if (!table) return null
  const actions = ['New Order', 'Reserve', 'Move Table', 'Split Check', 'Transfer', 'Open Tab', 'Add Note', 'View Details']
  return (
    <div style={{
      position: mobile ? 'fixed' : 'static', bottom: mobile ? 84 : undefined, left: mobile ? 0 : undefined, right: mobile ? 0 : undefined,
      background: '#fff', border: '1px solid rgba(19,41,75,0.1)', borderRadius: mobile ? '16px 16px 0 0' : 16,
      boxShadow: mobile ? '0 -8px 24px rgba(19,41,75,0.18)' : '0 1px 3px rgba(19,41,75,0.06)',
      padding: 16, zIndex: 45,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <strong style={{ fontSize: 15, color: '#13294b' }}>Table T{table.tableNumber}</strong>
        <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#8b95a3', fontSize: 18, cursor: 'pointer' }}>×</button>
      </div>
      <TableStatusChip status={table.status} />
      <div style={{ fontSize: 12, color: '#4a5266', marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <div>Seats: <strong>{table.seats}</strong></div>
        <div>Server: <strong>{table.serverName || 'Unassigned'}</strong></div>
        <div>Elapsed: <strong>{table.elapsedTime || '—'}</strong></div>
        <div>Order #: <strong>{table.orderNumber || '—'}</strong></div>
        <div style={{ gridColumn: '1 / -1' }}>Check Total: <strong>{table.checkTotal ? `$${table.checkTotal.toFixed(2)}` : '—'}</strong></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginTop: 12 }}>
        {actions.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => onAction && onAction(a, table)}
            style={{
              fontSize: 11, fontWeight: 700, padding: '8px 6px', borderRadius: 9, cursor: 'pointer',
              border: '1px solid rgba(19,41,75,0.12)', background: '#f7f6f2', color: '#13294b',
            }}
          >{a}</button>
        ))}
      </div>
    </div>
  )
}

export function EatKpiBar({ kpis }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
      {kpis.map((k) => (
        <VenueCounterCard key={k.label} label={k.label} value={k.value} accent={k.accent} />
      ))}
    </div>
  )
}

export function OperationsFeed({ items }) {
  return (
    <div style={{ background: '#fff', border: '1px solid rgba(19,41,75,0.08)', borderRadius: 14, padding: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#9c7320', letterSpacing: '0.06em', marginBottom: 8 }}>OPERATIONS FEED</div>
      {items.length === 0 ? (
        <div style={{ fontSize: 12, color: '#8b95a3' }}>No active alerts.</div>
      ) : items.map((it, i) => (
        <div key={i} style={{ fontSize: 12, color: '#1c2230', padding: '6px 0', borderTop: i ? '1px solid rgba(19,41,75,0.06)' : 'none' }}>{it}</div>
      ))}
    </div>
  )
}

export function StaffCoveragePanel({ coverage }) {
  return (
    <div style={{ background: '#fff', border: '1px solid rgba(19,41,75,0.08)', borderRadius: 14, padding: 14, marginTop: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#9c7320', letterSpacing: '0.06em', marginBottom: 8 }}>STAFF COVERAGE</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {coverage.map((c) => (
          <div key={c.label} style={{ fontSize: 12, color: '#4a5266' }}>{c.label}: <strong style={{ color: '#13294b' }}>{c.value}</strong></div>
        ))}
      </div>
    </div>
  )
}

export function ReservationQueuePanel({ queue }) {
  return (
    <div style={{ background: '#fff', border: '1px solid rgba(19,41,75,0.08)', borderRadius: 14, padding: 14, marginTop: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#9c7320', letterSpacing: '0.06em', marginBottom: 8 }}>RESERVATION QUEUE</div>
      {queue.length === 0 ? (
        <div style={{ fontSize: 12, color: '#8b95a3' }}>No reservations queued for this section.</div>
      ) : queue.map((r, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#1c2230', padding: '6px 0', borderTop: i ? '1px solid rgba(19,41,75,0.06)' : 'none' }}>
          <span>{r.time}</span><span>Table {r.table}</span><span>{r.party} guests</span>
        </div>
      ))}
    </div>
  )
}

export function BottomSummaryStrip({ stats }) {
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', background: '#13294b', borderRadius: 14, padding: '12px 16px', marginTop: 16 }}>
      {stats.map((s) => (
        <div key={s.label} style={{ color: '#fff' }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.55)' }}>{s.label}</div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{s.value}</div>
        </div>
      ))}
    </div>
  )
}
