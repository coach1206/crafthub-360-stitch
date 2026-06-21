import { useState } from 'react'
import { Shell, SideNav, TopBar, Card, KpiCard } from '../../components/eat/ui.jsx'
import POSProviderCard from '../../components/pos3/integrations/POSProviderCard.jsx'
import POSConnectionWizard from '../../components/pos3/integrations/POSConnectionWizard.jsx'
import POSSyncStatusPanel from '../../components/pos3/integrations/POSSyncStatusPanel.jsx'
import { getPosProviders } from '../../data/pos3/posProviders.js'
import { getAllConfigs } from '../../services/pos3/posIntegrationService.js'
import { getSyncStatus, getSyncHistory, pauseSync, activateSync } from '../../services/pos3/posSyncService.js'

/**
 * POS 3 External Integration Hub — manage all 13 provider connections.
 * Everything here is local-only sample data; see posSyncService.js.
 */
export default function POSIntegrationHub() {
  const [, setTick] = useState(0)
  const refresh = () => setTick((n) => n + 1)

  const providers = getPosProviders()
  const configs = getAllConfigs()
  const [activeProvider, setActiveProvider] = useState(null)
  const [managingProvider, setManagingProvider] = useState(null)

  const connectedCount = Object.values(configs).filter((c) => c.status === 'connected' || c.status === 'sync_active').length
  const syncActiveCount = Object.values(configs).filter((c) => c.status === 'sync_active').length

  function openProvider(provider) {
    const cfg = configs[provider.id]
    if (cfg && (cfg.status === 'connected' || cfg.status === 'sync_active' || cfg.status === 'needs_credentials')) {
      setManagingProvider(provider)
    } else {
      setActiveProvider(provider)
    }
  }

  function closeWizard() {
    setActiveProvider(null)
    refresh()
  }

  return (
    <Shell>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <SideNav system="POS3" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <TopBar system="POS3" title="External POS Integration Hub" subtitle="Connect, sync, and manage 13 external POS providers — all sample data, no real network calls" />
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <KpiCard label="Total Providers" value={providers.length} />
              <KpiCard label="Connected" value={connectedCount} />
              <KpiCard label="Sync Active" value={syncActiveCount} />
            </div>

            {managingProvider && (
              <ManagePanel
                provider={managingProvider}
                onClose={() => { setManagingProvider(null); refresh() }}
                onReconfigure={() => { setActiveProvider(managingProvider); setManagingProvider(null) }}
              />
            )}

            {!managingProvider && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                {providers.map((p) => (
                  <POSProviderCard key={p.id} provider={p} status={configs[p.id]?.status} onOpen={openProvider} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {activeProvider && (
        <POSConnectionWizard
          provider={activeProvider}
          onClose={closeWizard}
          onActivated={closeWizard}
        />
      )}
    </Shell>
  )
}

function ManagePanel({ provider, onClose, onReconfigure }) {
  const [, setTick] = useState(0)
  const refresh = () => setTick((n) => n + 1)
  const syncStatus = getSyncStatus(provider.id)
  const history = getSyncHistory(provider.id)

  function handlePause() {
    pauseSync(provider.id)
    refresh()
  }
  function handleResume() {
    activateSync(provider.id, syncStatus.syncOptions)
    refresh()
  }

  return (
    <Card style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{provider.name}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onReconfigure} style={{ background: 'none', border: '1px solid rgba(212,168,67,0.3)', color: '#d4a843', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>Reconfigure</button>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: '#cdd5df', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>Back to All Providers</button>
        </div>
      </div>
      <POSSyncStatusPanel syncStatus={syncStatus} history={history} onPause={handlePause} onResume={handleResume} />
    </Card>
  )
}
