import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LightShell, LightHeader, LightBottomNav, L_NAVY } from '../../components/eat/lightTheme.jsx'
import {
  TableFloorCanvas, VenueTableObject, SectionTabs, StatusFilterChips,
  VenueCounterCard, TableActionDrawer,
} from '../../components/eat/tableFloor.jsx'
import { getTables, getTickets, getLayoutSections, updateTablePosition, moveTableToSection } from '../../services/pos3/pos3Service.js'

export default function POS3Tables() {
  const navigate = useNavigate()
  const sections = getLayoutSections()
  const [section, setSection] = useState(sections[0])
  const [tables, setTables] = useState(() => getTables())
  const [query, setQuery] = useState('')
  const [activeStatuses, setActiveStatuses] = useState(new Set())
  const [selectedId, setSelectedId] = useState(null)
  const [dropActive, setDropActive] = useState(false)
  const tickets = getTickets()
  const canvasRef = useRef(null)
  const navStripRef = useRef(null)

  const sectionTables = useMemo(() => {
    let list = tables.filter((t) => t.section === section)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter((t) => String(t.tableNumber).includes(q) || (t.serverName || '').toLowerCase().includes(q))
    }
    if (activeStatuses.size) list = list.filter((t) => activeStatuses.has(t.status))
    return list
  }, [tables, section, query, activeStatuses])

  const allSectionTables = tables.filter((t) => t.section === section)
  const counts = {
    open: allSectionTables.filter((t) => t.status === 'open').length,
    occupied: allSectionTables.filter((t) => t.status !== 'open' && t.status !== 'cleaning' && t.status !== 'reserved').length,
    reservations: allSectionTables.filter((t) => t.status === 'reserved' || t.reservationTime).length,
    waitlist: 0,
  }
  const selected = tables.find((t) => t.id === selectedId) || null

  function toggleStatus(s) {
    setActiveStatuses((prev) => {
      const next = new Set(prev)
      next.has(s) ? next.delete(s) : next.add(s)
      return next
    })
  }

  /** Tables dragged past the canvas edge into the section-tab strip move sections. */
  function handleDragEnd(tableId, info) {
    setDropActive(false)
    const canvas = canvasRef.current
    const strip = navStripRef.current
    if (!canvas) return
    const stripRect = strip && strip.getBoundingClientRect()
    if (stripRect && info.point.y < stripRect.bottom && info.point.y > stripRect.top) {
      const tabWidth = stripRect.width / sections.length
      const idx = Math.min(sections.length - 1, Math.max(0, Math.floor((info.point.x - stripRect.left) / tabWidth)))
      const target = sections[idx]
      if (target && target !== section) {
        setTables(moveTableToSection(tableId, target, 10, 15))
        return
      }
    }
    const rect = canvas.getBoundingClientRect()
    const x = Math.min(92, Math.max(0, ((info.point.x - rect.left) / rect.width) * 100))
    const y = Math.min(85, Math.max(0, ((info.point.y - rect.top) / rect.height) * 100))
    setTables(updateTablePosition(tableId, x, y))
  }

  function handleAction(action, table) {
    if (action === 'View Details') { setSelectedId(table.id); return }
    const tkt = tickets.find((k) => k.tableId === table.id && k.status !== 'paid')
    if (action === 'New Order' || action === 'Open Tab') { navigate(tkt ? '/pos3/orders?ticket=' + tkt.id : '/pos3/handheld'); return }
    // Reserve / Move Table / Split Check / Transfer / Add Note: no backend endpoint yet.
    // TODO: wire to a real reservations/billing/transfer service once one exists.
    window.alert(`${action} — local-only action, no backend endpoint connected yet for Table T${table.tableNumber}.`)
  }

  return (
    <LightShell style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 84 }}>
      <LightHeader
        eyebrow="POS 3 · The Vault Lounge"
        title="Tables / Floor"
        subtitle="Drag a table to rearrange — drag onto a section tab to move it"
        right={<span style={{ fontSize: 11, fontWeight: 700, color: '#6b7385' }}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
      />

      <div style={{ padding: '10px 16px 0' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tables or server…"
          style={{
            width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(19,41,75,0.14)',
            fontSize: 13, marginBottom: 8, boxSizing: 'border-box',
          }}
        />
        <StatusFilterChips active={activeStatuses} onToggle={toggleStatus} />
      </div>

      <div ref={navStripRef} style={{ padding: '10px 16px 8px' }}>
        <SectionTabs sections={sections} value={section} onChange={setSection} />
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '0 16px 10px' }}>
        <VenueCounterCard label="Open" value={counts.open} accent="#2f9e5b" />
        <VenueCounterCard label="Occupied" value={counts.occupied} accent="#c0443a" />
        <VenueCounterCard label="Reserved" value={counts.reservations} accent="#7e57c2" />
        <VenueCounterCard label="Waitlist" value={counts.waitlist} accent={L_NAVY} />
      </div>

      <div style={{ margin: '0 16px 16px' }}>
        <TableFloorCanvas section={section} height={320} dropActive={dropActive} canvasRef={canvasRef}>
          {!sectionTables.length && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7385', fontSize: 12, fontWeight: 600 }}>
              No tables match in {section}.
            </div>
          )}
          {sectionTables.map((t) => (
            <VenueTableObject
              key={t.id}
              table={t}
              selected={t.id === selectedId}
              canvasRef={canvasRef}
              onSelect={setSelectedId}
              onDragEnd={handleDragEnd}
            />
          ))}
        </TableFloorCanvas>
      </div>

      {selected && (
        <div style={{ padding: '0 16px 16px' }}>
          <TableActionDrawer table={selected} onClose={() => setSelectedId(null)} onAction={handleAction} />
        </div>
      )}

      <LightBottomNav items={[
        { label: 'Home', icon: 'home', onClick: () => navigate('/pos3') },
        { label: 'Tables', icon: 'table_restaurant', active: true, onClick: () => navigate('/pos3/tables') },
        { label: 'Orders', icon: 'receipt_long', onClick: () => navigate('/pos3/orders') },
        { label: 'Reservations', icon: 'event', disabled: true, disabledReason: 'Reservations module is not yet built' },
        { label: 'Members', icon: 'badge', disabled: true, disabledReason: 'Members module is not yet built' },
        { label: 'Reports', icon: 'bar_chart', disabled: true, disabledReason: 'Reports module is not yet built' },
        { label: 'More', icon: 'more_horiz', onClick: () => navigate('/pos3/settings') },
      ]} />
    </LightShell>
  )
}
