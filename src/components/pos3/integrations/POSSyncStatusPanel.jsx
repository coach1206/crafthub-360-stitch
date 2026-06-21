import { Card, Pill, Btn } from '../../eat/ui.jsx'

/** Shows current sync status, last sync time, and pause/resume + history. */
export default function POSSyncStatusPanel({ syncStatus, history, onPause, onResume }) {
  const isActive = syncStatus?.status === 'sync_active'
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontWeight: 700 }}>Sync Status</div>
        <Pill label={syncStatus?.status || 'not_connected'} tone={isActive ? 'open' : 'info'} />
      </div>
      <div style={{ fontSize: 12.5, color: '#8b95a3', marginBottom: 10 }}>
        Last sync: {syncStatus?.lastSyncAt ? new Date(syncStatus.lastSyncAt).toLocaleString() : 'never'}
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        {isActive ? (
          <Btn tone="orange" onClick={onPause}>Pause Sync</Btn>
        ) : (
          <Btn tone="green" onClick={onResume}>Resume / Sync Now</Btn>
        )}
      </div>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>History</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
        {(history || []).slice().reverse().map((h, i) => (
          <div key={i} style={{ fontSize: 12, color: '#cdd5df', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '6px 0' }}>
            {new Date(h.at).toLocaleString()} · {Object.entries(h.importedCounts || {}).map(([k, v]) => `${k}:${v}`).join(', ')}
          </div>
        ))}
        {(!history || history.length === 0) && <div style={{ fontSize: 12, color: '#8b95a3' }}>No sync history yet.</div>}
      </div>
    </Card>
  )
}
