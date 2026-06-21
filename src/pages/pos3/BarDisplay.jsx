import { useEffect, useState } from 'react'
import { Shell, SideNav, TopBar, KpiCard } from '../../components/eat/ui.jsx'
import { subscribe } from '../../services/shared/opsEventBus.js'
import { getQueue, markStarted, markReady, markCompleted } from '../../services/pos3/barQueueService.js'
import { getBarPrepRules } from '../../data/pos3/barPrepRules.js'
import StationStatusCard from '../../components/pos3/stations/StationStatusCard.jsx'
import StationQueuePanel from '../../components/pos3/stations/StationQueuePanel.jsx'
import BarTicketCard from '../../components/pos3/stations/BarTicketCard.jsx'
import { successTap } from '../../services/shared/haptics.js'

export default function BarDisplay() {
  const [queue, setQueue] = useState(() => getQueue())
  const rules = getBarPrepRules()

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
          <TopBar system="POS3" title="Bar Display" subtitle="Touch-first bar ticket routing" />
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <StationStatusCard name="Main Bar" queueLength={active.length} queueCapacity={rules.queueCapacity} busyThreshold={rules.busyThreshold} />
              <KpiCard label="Queued" value={queued.length} />
              <KpiCard label="In Progress" value={started.length} />
              <KpiCard label="Ready" value={ready.length} accent="#7ddca0" />
            </div>

            <StationQueuePanel
              title="Bar Queue"
              entries={active}
              renderCard={(e) => (
                <BarTicketCard
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
