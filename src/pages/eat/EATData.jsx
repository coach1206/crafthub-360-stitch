import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EatManagementLayout, EatCard, EatTable, EatBtn, LightPill, L_NAVY } from '../../components/eat/lightTheme.jsx'
import { getOpsEvents, getControlCommands } from '../../services/shared/opsStorage.js'
import { subscribe, SYSTEMS } from '../../services/shared/opsEventBus.js'

const DATA_SOURCES = [
  { key: SYSTEMS.POS3, label: 'POS 3 (handheld orders/tickets)' },
  { key: SYSTEMS.SMOKECRAFT, label: 'SmokeCraft (humidor/cigar requests)' },
  { key: 'INVENTORY', label: 'Inventory' },
  { key: 'STAFF', label: 'Staff' },
  { key: 'REVENUE', label: 'Revenue' },
]

function EmptyDataState({ events }) {
  const navigate = useNavigate()
  const seenSystems = new Set(events.flatMap((e) => [e.sourceSystem, e.targetSystem]))
  return (
    <EatCard style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: L_NAVY }}>No live data yet</div>
      <div style={{ fontSize: 13, color: '#6b7385', marginBottom: 14 }}>
        This view shows raw events as they arrive on the shared ops bus. Waiting for venue sync — events appear here automatically once POS 3, SmokeCraft, or other stations write to the local-first event log.
      </div>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#9c7320', letterSpacing: '0.08em', marginBottom: 8 }}>DATA SOURCES</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        {DATA_SOURCES.map((s) => (
          <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#1c2230' }}>
            <span>{s.label}</span>
            <LightPill tone={seenSystems.has(s.key) ? 'green' : 'navy'}>{seenSystems.has(s.key) ? 'reporting' : 'no events yet'}</LightPill>
          </div>
        ))}
      </div>
      <EatBtn tone="purple" onClick={() => navigate('/eat/operations')} style={{ padding: '7px 12px', fontSize: 12 }}>Open Operations View</EatBtn>
    </EatCard>
  )
}

export default function EATData() {
  const [events, setEvents] = useState([])
  const [commands, setCommands] = useState([])

  useEffect(() => {
    const refresh = () => { setEvents(getOpsEvents().slice(-50).reverse()); setCommands(getControlCommands().slice(-50).reverse()) }
    refresh()
    return subscribe(() => refresh())
  }, [])

  return (
    <EatManagementLayout title="Data" subtitle="Raw ops bus inspection — shared:opsEvents / shared:controlCommands">
      {events.length === 0 && commands.length === 0 && <EmptyDataState events={events} />}
      <EatCard style={{ marginBottom: 12 }}><strong style={{ color: L_NAVY }}>Ops Events ({events.length})</strong></EatCard>
      <EatTable
        columns={[{ key: 'eventType', label: 'Event' }, { key: 'sourceSystem', label: 'From' }, { key: 'targetSystem', label: 'To' }, { key: 'status', label: 'Status' }, { key: 'createdAt', label: 'Time' }]}
        rows={events}
        renderCell={(r, k) => k === 'createdAt' ? new Date(r.createdAt).toLocaleTimeString() : r[k]}
      />
      <EatCard style={{ margin: '20px 0 12px' }}><strong style={{ color: L_NAVY }}>Control Commands ({commands.length})</strong></EatCard>
      <EatTable
        columns={[{ key: 'commandType', label: 'Command' }, { key: 'sourceSystem', label: 'From' }, { key: 'targetSystem', label: 'To' }, { key: 'status', label: 'Status' }, { key: 'createdAt', label: 'Time' }]}
        rows={commands}
        renderCell={(r, k) => k === 'createdAt' ? new Date(r.createdAt).toLocaleTimeString() : r[k]}
      />
    </EatManagementLayout>
  )
}
