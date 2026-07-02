import { useEffect, useState, useCallback } from 'react'
import { Shell, SideNav, TopBar, KpiCard } from '../../components/eat/ui.jsx'
import { subscribe } from '../../services/shared/opsEventBus.js'
import { getQueue, markStarted, markReady, markCompleted } from '../../services/pos3/kitchenQueueService.js'
import { getKitchenPrepRules } from '../../data/pos3/kitchenPrepRules.js'
import StationStatusCard from '../../components/pos3/stations/StationStatusCard.jsx'
import StationQueuePanel from '../../components/pos3/stations/StationQueuePanel.jsx'
import KitchenTicketCard from '../../components/pos3/stations/KitchenTicketCard.jsx'
import { successTap } from '../../services/shared/haptics.js'
import { fetchStationQueue, updateQueueItemStatus } from '../../services/pos3/customerOrderService.js'

export default function KitchenDisplay() {
  const [queue, setQueue] = useState(() => getQueue())
  const [backendEntries, setBackendEntries] = useState([])
  const [syncMode, setSyncMode] = useState('loading')
  const rules = getKitchenPrepRules()

  const refreshBackend = useCallback(async () => {
    const result = await fetchStationQueue('kitchen')
    if (result.ok && result.entries?.length) {
      setBackendEntries(result.entries)
      setSyncMode(result.storageMode || 'backend')
    } else {
      setSyncMode(result.ok ? 'backend_empty' : 'local_only')
    }
  }, [])

  function refresh() { setQueue(getQueue()) }
  useEffect(() => {
    refresh()
    refreshBackend()
    const interval = setInterval(refreshBackend, 15000)
    return () => clearInterval(interval)
  }, [refreshBackend])
  useEffect(() => subscribe(() => refresh()), [])

  async function actBackend(queueId, status) {
    await updateQueueItemStatus(queueId, status)
    refreshBackend()
  }

  function act(fn, id) {
    fn(id)
    try { successTap() } catch {}
    refresh()
  }

  const active = queue.filter((e) => e.status !== 'completed')
  const queued = active.filter((e) => e.status === 'queued')
  const started = active.filter((e) => e.status === 'started')
  const ready = active.filter((e) => e.status === 'ready')

  const backendActive = backendEntries.filter(e => !['completed','cancelled'].includes(e.status))
  const SYNC_LABEL = { postgres: 'Backend Synced', memory_fallback: 'Memory Mode', local_only: 'Local Only', loading: 'Connecting…', backend_empty: 'Backend Connected' }
  const SYNC_COLOR = { postgres: '#7ddca0', memory_fallback: '#E9C176', local_only: '#aaa', loading: '#aaa', backend_empty: '#7ddca0' }

  return (
    <Shell>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <SideNav system="POS3" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <TopBar system="POS3" title="Kitchen Display" subtitle="Touch-first kitchen ticket routing" />
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
              <StationStatusCard name="Main Kitchen" queueLength={active.length} queueCapacity={rules.queueCapacity} busyThreshold={rules.busyThreshold} />
              <KpiCard label="Queued" value={queued.length} />
              <KpiCard label="In Progress" value={started.length} />
              <KpiCard label="Ready" value={ready.length} accent="#7ddca0" />
              <KpiCard label="Backend Orders" value={backendActive.length} accent={SYNC_COLOR[syncMode]} />
              <div style={{ fontSize: 11, color: SYNC_COLOR[syncMode], fontFamily: 'monospace', alignSelf: 'center', padding: '4px 10px', background: 'rgba(0,0,0,0.18)', borderRadius: 6 }}>
                {SYNC_LABEL[syncMode] || syncMode}
              </div>
            </div>
            {backendActive.length > 0 && (
              <div style={{ marginBottom: 16, padding: 12, background: 'rgba(125,220,160,0.08)', borderRadius: 8, border: '1px solid rgba(125,220,160,0.2)' }}>
                <div style={{ fontSize: 11, color: '#7ddca0', fontWeight: 700, marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Backend Queue — {backendActive.length} item{backendActive.length !== 1 ? 's' : ''}
                </div>
                {backendActive.map(e => (
                  <div key={e.queue_id || e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}>
                    <span style={{ flex: 1, color: '#E5E2E1' }}>{e.item_name || e.name} × {e.quantity || 1}</span>
                    <span style={{ color: '#aaa', fontSize: 11 }}>Table {e.table_number || '—'}</span>
                    <span style={{ color: '#E9C176', fontSize: 11, textTransform: 'uppercase' }}>{e.status}</span>
                    {e.status === 'queued' && (
                      <button type="button" onClick={() => actBackend(e.queue_id || e.id, 'in_progress')}
                        style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: '#E9C176', color: '#0a0603', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                        Start
                      </button>
                    )}
                    {e.status === 'in_progress' && (
                      <button type="button" onClick={() => actBackend(e.queue_id || e.id, 'ready')}
                        style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: '#7ddca0', color: '#0a0603', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                        Ready
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

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
