import { useEffect, useState } from 'react'
import { ManagementLayout, Card, Pill, KpiCard, Btn, GOLD } from '../../components/eat/ui.jsx'
import { subscribe, getOpsEvents } from '../../services/shared/opsEventBus.js'
import { completeCommand, receiveCommand } from '../../services/shared/opsControlBridge.js'
import { getTickets } from '../../services/pos3/pos3Service.js'
import { EAT_ALERTS } from '../../data/eat/seedData.js'
import { getEatOpsSnapshot } from '../../services/eat/eatOpsAnalyticsService.js'
import RevenuePanel from '../../components/eat/RevenuePanel.jsx'
import LiveTicketsPanel from '../../components/eat/LiveTicketsPanel.jsx'
import InventoryImpactPanel from '../../components/eat/InventoryImpactPanel.jsx'
import StaffActivityPanel from '../../components/eat/StaffActivityPanel.jsx'

/** Re-imported helper so opsEventBus has getOpsEvents */
function useOpsFeed() {
  const [feed, setFeed] = useState([])
  const refresh = () => setFeed([...getOpsEvents()].sort((a, b) => b.createdAt - a.createdAt))
  useEffect(() => { refresh(); return subscribe(() => refresh()) }, [])
  return [feed, refresh]
}

function useEatSnapshot() {
  const [snapshot, setSnapshot] = useState(() => getEatOpsSnapshot())
  const refresh = () => setSnapshot(getEatOpsSnapshot())
  useEffect(() => { refresh(); return subscribe(() => refresh()) }, [])
  return [snapshot, refresh]
}

export default function EATCommandHub() {
  const [feed, refresh] = useOpsFeed()
  const [snapshot] = useEatSnapshot()
  const eatTargeted = feed.filter((e) => e.targetSystem === 'EAT')
  const openTickets = getTickets().filter((t) => !['paid'].includes(t.status)).length
  const pendingHumidor = eatTargeted.filter((e) => e.commandType === 'CIGAR_REQUESTED' && e.status !== 'completed').length

  function resolve(ev) {
    receiveCommand(ev.id); completeCommand(ev.id); refresh()
  }

  return (
    <ManagementLayout title="E.A.T. Command Hub" subtitle="Live ops feed across NOVEE / CraftHub / POS3 / SmokeCraft">
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <KpiCard label="Open Tickets" value={openTickets} />
        <KpiCard label="Pending Humidor Requests" value={pendingHumidor} accent={pendingHumidor ? '#f0907f' : GOLD} />
        <KpiCard label="Active Alerts" value={EAT_ALERTS.length} accent="#f0907f" />
        <KpiCard label="Total Ops Events" value={feed.length} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Live Ops Feed</div>
          {!feed.length && <div style={{ color: '#8b95a3' }}>No ops events yet.</div>}
          {feed.slice(0, 25).map((e) => {
            const actionable = e.targetSystem === 'EAT' && e.status !== 'completed'
            return (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <Pill label={e.status} tone={e.status === 'completed' ? 'paid' : 'pending'} />
                  <span style={{ marginLeft: 8, fontSize: 13 }}>{e.eventType || e.commandType}</span>
                  <div style={{ fontSize: 11, color: '#8b95a3', marginTop: 2 }}>{e.sourceSystem} → {e.targetSystem}{e.ticketId ? ` · ${e.ticketId}` : ''}{e.payload?.label ? ` · ${e.payload.label}` : ''}</div>
                </div>
                {actionable && <Btn tone="green" onClick={() => resolve(e)} style={{ padding: '7px 12px', fontSize: 12 }}>Acknowledge</Btn>}
              </div>
            )
          })}
        </Card>
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Active Alerts</div>
          {EAT_ALERTS.map((a) => (
            <div key={a.id} style={{ padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <Pill label={a.level} tone={a.level} />
              <div style={{ fontSize: 13, marginTop: 4 }}>{a.message}</div>
            </div>
          ))}
        </Card>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <RevenuePanel revenueToday={snapshot.revenueToday} destinationBreakdown={snapshot.destinationBreakdown} />
        <LiveTicketsPanel tickets={snapshot.recentTickets} ticketCounts={snapshot.ticketCounts} />
        <InventoryImpactPanel impacts={snapshot.inventoryImpacts} voidsAndComps={snapshot.voidsAndComps} />
        <StaffActivityPanel activity={snapshot.staffActivity} activityCounts={snapshot.staffActivityCounts} />
      </div>
    </ManagementLayout>
  )
}
