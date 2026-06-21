import { useEffect, useState } from 'react'
import { ManagementLayout, Card, Table } from '../../components/eat/ui.jsx'
import { getOpsEvents, getControlCommands } from '../../services/shared/opsStorage.js'
import { subscribe } from '../../services/shared/opsEventBus.js'

export default function EATData() {
  const [events, setEvents] = useState([])
  const [commands, setCommands] = useState([])

  useEffect(() => {
    const refresh = () => { setEvents(getOpsEvents().slice(-50).reverse()); setCommands(getControlCommands().slice(-50).reverse()) }
    refresh()
    return subscribe(() => refresh())
  }, [])

  return (
    <ManagementLayout title="Data" subtitle="Raw ops bus inspection — shared:opsEvents / shared:controlCommands">
      <Card style={{ marginBottom: 12 }}><strong>Ops Events ({events.length})</strong></Card>
      <Table
        columns={[{ key: 'eventType', label: 'Event' }, { key: 'sourceSystem', label: 'From' }, { key: 'targetSystem', label: 'To' }, { key: 'status', label: 'Status' }, { key: 'createdAt', label: 'Time' }]}
        rows={events}
        renderCell={(r, k) => k === 'createdAt' ? new Date(r.createdAt).toLocaleTimeString() : r[k]}
      />
      <Card style={{ margin: '20px 0 12px' }}><strong>Control Commands ({commands.length})</strong></Card>
      <Table
        columns={[{ key: 'commandType', label: 'Command' }, { key: 'sourceSystem', label: 'From' }, { key: 'targetSystem', label: 'To' }, { key: 'status', label: 'Status' }, { key: 'createdAt', label: 'Time' }]}
        rows={commands}
        renderCell={(r, k) => k === 'createdAt' ? new Date(r.createdAt).toLocaleTimeString() : r[k]}
      />
    </ManagementLayout>
  )
}
