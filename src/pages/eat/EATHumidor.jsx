import { useEffect, useState } from 'react'
import { ManagementLayout, Pill, Table, Btn, useToast } from '../../components/eat/ui.jsx'
import { getTickets } from '../../services/pos3/pos3Service.js'
import { EAT_INVENTORY } from '../../data/eat/seedData.js'
import { subscribe, eventsFor, STATUS } from '../../services/shared/opsEventBus.js'
import { completeCommand, receiveCommand } from '../../services/shared/opsControlBridge.js'

export default function EATHumidor() {
  const toast = useToast()
  const tickets = getTickets().filter((t) => t.status !== 'paid')
  const humidorItems = tickets.flatMap((t) => t.items.filter((i) => i.station === 'humidor').map((i) => ({ ...i, ticketId: t.id, tableId: t.tableId })))
  const stock = EAT_INVENTORY.filter((i) => i.category === 'Cigars')
  const [requests, setRequests] = useState([])

  useEffect(() => {
    const refresh = () => setRequests(
      eventsFor('EAT').filter((e) => e.status !== STATUS.COMPLETED && (e.commandType === 'CIGAR_REQUESTED' || e.eventType === 'EAT_EVENT_CREATED'))
    )
    refresh()
    return subscribe(() => refresh())
  }, [])

  function resolve(ev) {
    receiveCommand(ev.id); completeCommand(ev.id)
    toast('Humidor request resolved')
    setRequests((r) => r.filter((x) => x.id !== ev.id))
  }

  return (
    <ManagementLayout title="Humidor" subtitle="Cigar orders, requests, and stock">
      <div style={{ marginBottom: 18, fontWeight: 700 }}>Guest Humidor Requests</div>
      <Table
        columns={[{ key: 'label', label: 'Request' }, { key: 'sourceSystem', label: 'From' }, { key: 'actions', label: '' }]}
        rows={requests}
        renderCell={(r, k) => {
          if (k === 'label') return r.payload?.label || r.eventType
          if (k === 'actions') return <Btn tone="green" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => resolve(r)}>Resolve</Btn>
          return r[k]
        }}
      />
      <div style={{ margin: '20px 0 10px', fontWeight: 700 }}>Active Humidor Orders</div>
      <Table
        columns={[{ key: 'name', label: 'Item' }, { key: 'qty', label: 'Qty' }, { key: 'ticketId', label: 'Ticket' }, { key: 'tableId', label: 'Table' }]}
        rows={humidorItems}
        renderCell={(r, k) => r[k]}
      />
      <div style={{ margin: '20px 0 10px', fontWeight: 700 }}>Cigar Stock</div>
      <Table
        columns={[{ key: 'name', label: 'Item' }, { key: 'onHand', label: 'On Hand' }, { key: 'par', label: 'Par' }, { key: 'unit', label: 'Unit' }]}
        rows={stock}
        renderCell={(r, k) => k === 'onHand' ? <Pill label={String(r.onHand)} tone={r.onHand < r.par * 0.4 ? 'critical' : 'open'} /> : r[k]}
      />
    </ManagementLayout>
  )
}
