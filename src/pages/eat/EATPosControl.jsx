import { useState } from 'react'
import { ManagementLayout, Card, Pill, Btn, Table, useToast } from '../../components/eat/ui.jsx'
import { getTables, getTickets, ticketTotals } from '../../services/pos3/pos3Service.js'
import { createCommand } from '../../services/shared/opsControlBridge.js'
import { SYSTEMS } from '../../services/shared/opsEventBus.js'

export default function EATPosControl() {
  const toast = useToast()
  const [, setTick] = useState(0)
  const tables = getTables()
  const tickets = getTickets()

  function send(commandType, extra = {}) {
    createCommand({ sourceSystem: SYSTEMS.EAT, targetSystem: SYSTEMS.POS3, eventType: 'CONTROL_COMMAND', commandType, ...extra })
    toast(`Command "${commandType}" sent to POS 3`)
    setTick((n) => n + 1)
  }

  return (
    <ManagementLayout title="POS Control" subtitle="View and manage live POS 3 state; send control commands">
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <Btn tone="blue" onClick={() => send('REFRESH_TERMINAL')}>Refresh Terminal</Btn>
        <Btn tone="orange" onClick={() => send('PUSH_86_LIST', { payload: { item: 'Arturo Fuente OpusX' } })}>Push 86 List</Btn>
        <Btn tone="purple" onClick={() => send('REQUEST_TABLE_STATUS')}>Request Table Status</Btn>
      </div>

      <div style={{ marginBottom: 18 }}>
        <Card style={{ marginBottom: 12 }}><strong>Tables</strong></Card>
        <Table
          columns={[{ key: 'name', label: 'Table' }, { key: 'section', label: 'Section' }, { key: 'guests', label: 'Guests' }, { key: 'status', label: 'Status' }, { key: 'actions', label: '' }]}
          rows={tables}
          renderCell={(r, k) => k === 'status' ? <Pill label={r.status} tone={r.status} />
            : k === 'guests' ? `${r.guests}/${r.seats}`
            : k === 'actions' ? <Btn tone="gray" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => send('CLAIM_TABLE', { tableId: r.id })}>Claim</Btn>
            : r[k]}
        />
      </div>

      <Card style={{ marginBottom: 12 }}><strong>Tickets</strong></Card>
      <Table
        columns={[{ key: 'id', label: 'Ticket' }, { key: 'tableId', label: 'Table' }, { key: 'server', label: 'Server' }, { key: 'status', label: 'Status' }, { key: 'total', label: 'Total' }, { key: 'actions', label: '' }]}
        rows={tickets}
        renderCell={(r, k) => k === 'status' ? <Pill label={r.status} tone={r.status} />
          : k === 'total' ? `$${ticketTotals(r).total.toFixed(2)}`
          : k === 'actions' ? <Btn tone="red" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => send('VOID_TICKET', { ticketId: r.id, tableId: r.tableId })}>Void</Btn>
          : r[k]}
      />
    </ManagementLayout>
  )
}
