import { useMemo, useRef, useState } from 'react'
import { EatManagementLayout, EatCard, EAT_GOLD } from '../../components/eat/lightTheme.jsx'
import {
  TableFloorCanvas, VenueTableObject, SectionTabs, StatusFilterChips,
  EatKpiBar, OperationsFeed, StaffCoveragePanel, ReservationQueuePanel,
  TableActionDrawer, BottomSummaryStrip,
} from '../../components/eat/tableFloor.jsx'
import { getTables, getLayoutSections, updateTablePosition, moveTableToSection } from '../../services/pos3/pos3Service.js'

export default function EATSections() {
  const sections = getLayoutSections()
  const [section, setSection] = useState(sections[0])
  const [tables, setTables] = useState(() => getTables())
  const [activeStatuses, setActiveStatuses] = useState(new Set())
  const [selectedId, setSelectedId] = useState(null)
  const canvasRef = useRef(null)
  const tabStripRef = useRef(null)

  const allSectionTables = tables.filter((t) => t.section === section)
  const sectionTables = useMemo(() => {
    let list = allSectionTables
    if (activeStatuses.size) list = list.filter((t) => activeStatuses.has(t.status))
    return list
  }, [allSectionTables, activeStatuses])

  const totalTables = allSectionTables.length
  const openCount = allSectionTables.filter((t) => t.status === 'open').length
  const busyCount = allSectionTables.filter((t) => t.status === 'busy').length
  const reservedCount = allSectionTables.filter((t) => t.status === 'reserved').length
  const avgTurn = '38m'
  const coversToday = allSectionTables.reduce((s, t) => s + (t.guests || 0), 0) * 3
  const revenueToday = allSectionTables.reduce((s, t) => s + (t.checkTotal || 0), 0) * 4
  const selected = tables.find((t) => t.id === selectedId) || null

  function toggleStatus(s) {
    setActiveStatuses((prev) => {
      const next = new Set(prev)
      next.has(s) ? next.delete(s) : next.add(s)
      return next
    })
  }

  function handleDragEnd(tableId, info) {
    const canvas = canvasRef.current
    const strip = tabStripRef.current
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
    const x = Math.min(95, Math.max(0, ((info.point.x - rect.left) / rect.width) * 100))
    const y = Math.min(88, Math.max(0, ((info.point.y - rect.top) / rect.height) * 100))
    setTables(updateTablePosition(tableId, x, y))
  }

  function handleAction(action, table) {
    if (action === 'View Details') { setSelectedId(table.id); return }
    // No backend table-management endpoint exists yet — these stay local/demo
    // handlers until a real reservations/billing/transfer service is wired in.
    window.alert(`${action} — local-only action, no backend endpoint connected yet for Table T${table.tableNumber}.`)
  }

  const opsFeed = [
    ...(allSectionTables.filter((t) => t.needsService).map((t) => `Table T${t.tableNumber} needs service`)),
    ...(allSectionTables.filter((t) => t.reservationTime).map((t) => `Reservation for Table T${t.tableNumber} arriving ${t.reservationTime}`)),
    'Bar ticket pending review',
    'Server reassignment available',
  ]

  const reservationQueue = allSectionTables
    .filter((t) => t.reservationTime)
    .map((t) => ({ time: t.reservationTime, table: t.tableNumber, party: t.seats }))

  return (
    <EatManagementLayout title="Sections" subtitle="Restaurant Operations Command — drag tables to plan or move between sections (layout persists locally until backend table-layout endpoint is connected)">
      <EatKpiBar kpis={[
        { label: 'Tables Total', value: totalTables },
        { label: 'Open', value: openCount, accent: '#2f9e5b' },
        { label: 'Busy', value: busyCount, accent: '#c0443a' },
        { label: 'Reserved', value: reservedCount, accent: '#7e57c2' },
        { label: 'Avg Turn Time', value: avgTurn },
        { label: 'Covers Today', value: coversToday },
        { label: 'Revenue Today', value: `$${revenueToday.toFixed(0)}`, accent: '#9c7320' },
      ]} />

      <div ref={tabStripRef} style={{ marginBottom: 12 }}>
        <SectionTabs sections={sections} value={section} onChange={setSection} counts={Object.fromEntries(sections.map((s) => [s, tables.filter((t) => t.section === s).length]))} />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <StatusFilterChips active={activeStatuses} onToggle={toggleStatus} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {['Floor Plan', 'List View', 'Analytics View', 'More'].map((v, i) => (
            <button key={v} type="button" disabled={i !== 0} title={i !== 0 ? `${v} is not yet built` : undefined} style={{
              fontSize: 11, fontWeight: 700, padding: '7px 12px', borderRadius: 8, cursor: i === 0 ? 'default' : 'not-allowed',
              border: `1px solid ${i === 0 ? EAT_GOLD : 'rgba(19,41,75,0.12)'}`,
              background: i === 0 ? 'rgba(212,168,67,0.12)' : '#fff', color: i === 0 ? '#9c7320' : '#aab3bf',
            }}>{v}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#9c7320', letterSpacing: '0.08em', marginBottom: 8 }}>{section.toUpperCase()} LAYOUT EDITOR</div>
          <EatCard style={{ padding: 0, marginBottom: 0 }}>
            <TableFloorCanvas section={section} height={460} canvasRef={canvasRef}>
              {!sectionTables.length && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7385', fontSize: 13, fontWeight: 600 }}>
                  No tables match in {section}.
                </div>
              )}
              {sectionTables.map((t) => (
                <VenueTableObject
                  key={t.id}
                  table={t}
                  size={150}
                  selected={t.id === selectedId}
                  canvasRef={canvasRef}
                  onSelect={setSelectedId}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </TableFloorCanvas>
          </EatCard>
        </div>

        <div style={{ width: 280, flexShrink: 0 }}>
          {selected && <div style={{ marginBottom: 12 }}><TableActionDrawer table={selected} onClose={() => setSelectedId(null)} onAction={handleAction} /></div>}
          <OperationsFeed items={opsFeed} />
          <StaffCoveragePanel coverage={[
            { label: 'Servers', value: '3 on duty' },
            { label: 'Bartenders', value: '1 on duty' },
            { label: 'Hosts', value: '1 on duty' },
            { label: 'Support', value: '2 on duty' },
          ]} />
          {section === 'Patio' && <ReservationQueuePanel queue={reservationQueue} />}
        </div>
      </div>

      <BottomSummaryStrip stats={[
        { label: 'Sales', value: `$${revenueToday.toFixed(0)}` },
        { label: 'Transactions', value: totalTables },
        { label: 'Covers', value: coversToday },
        { label: 'Avg Check', value: totalTables ? `$${(revenueToday / Math.max(1, totalTables)).toFixed(0)}` : '$0' },
        { label: 'Labor %', value: '28%' },
        { label: 'Prime Time', value: '7–9 PM' },
      ]} />
    </EatManagementLayout>
  )
}
