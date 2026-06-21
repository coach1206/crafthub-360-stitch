import { useEffect, useState } from 'react'
import { Shell, SideNav, TopBar, KpiCard } from '../../components/eat/ui.jsx'
import { subscribe } from '../../services/shared/opsEventBus.js'
import { getQueue, markStarted, markReady, markCompleted } from '../../services/pos3/kitchenQueueService.js'
import { getKitchenPrepRules } from '../../data/pos3/kitchenPrepRules.js'
import StationStatusCard from '../../components/pos3/stations/StationStatusCard.jsx'
import StationQueuePanel from '../../components/pos3/stations/StationQueuePanel.jsx'
import KitchenTicketCard from '../../components/pos3/stations/KitchenTicketCard.jsx'
import { successTap } from '../../services/shared/haptics.js'

export default function KitchenDisplay() {
  const [queue, setQueue] = useState(() => getQueue())
  const rules = getKitchenPrepRules()

  function refresh() { setQueue(getQueue()) }
  useEffect(() => subscribe(() => refresh()), [])

  function act(fn, id) {
    fn(id)
    try { successTap() } catch {}
    refresh()
  }

  const active = queue.filter((e) => e.status !== 'completed')
  const queued = active.filter((e) => e.status === 'queued')
  const started = active.filter((e) => e.status === 'started')
  const ready = active.filter((e) => e.status === 'ready')

  return (
    <Shell>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <SideNav system="POS3" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <TopBar system="POS3" title="Kitchen Display" subtitle="Touch-first kitchen ticket routing" />
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <StationStatusCard name="Main Kitchen" queueLength={active.length} queueCapacity={rules.queueCapacity} busyThreshold={rules.busyThreshold} />
              <KpiCard label="Queued" value={queued.length} />
              <KpiCard label="In Progress" value={started.length} />
              <KpiCard label="Ready" value={ready.length} accent="#7ddca0" />
            </div>

            <StationQueuePanel
              title="Kitchen Queue"
              entries={active}
              renderCard={(e) => (
                <KitchenTicketCard
                  key={e.id}
                  entry={e}
                  onStart={(id) => act(markStarted, id)}
                  onReady={(id) => act(markReady, id)}
                  onComplete={(id) => act(markCompleted, id)}
                />
              )}
            />
          </div>
        </div>
      </div>
    </Shell>
  )
}
