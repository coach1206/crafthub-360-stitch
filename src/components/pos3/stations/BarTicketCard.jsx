/**
 * BarTicketCard — same pattern as KitchenTicketCard for bar queue entries.
 */
import { Pill, GOLD, PANEL2, LINE } from '../../eat/ui.jsx'
import TouchButton from '../TouchButton.jsx'

export default function BarTicketCard({ entry, onStart, onReady, onComplete }) {
  return (
    <div className="tactile-card touch-pressable" style={{ background: PANEL2, border: `1px solid ${LINE}`, borderRadius: 14, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{entry.qty}× {entry.name}</div>
        <Pill label={entry.status} tone={entry.status === 'ready' ? 'open' : entry.status === 'started' ? 'pending' : 'info'} />
      </div>
      {entry.modifiers?.length > 0 && (
        <div style={{ fontSize: 11, color: '#8b95a3', marginTop: 4 }}>{entry.modifiers.map((m) => m.label).join(', ')}</div>
      )}
      {entry.note && <div style={{ fontSize: 11, color: GOLD, marginTop: 2 }}>Note: {entry.note}</div>}
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        {entry.status === 'queued' && <TouchButton tone="primary" onClick={() => onStart(entry.id)} style={{ flex: 1, minHeight: 48, fontSize: 12 }}>Start</TouchButton>}
        {entry.status === 'started' && <TouchButton tone="warning" onClick={() => onReady(entry.id)} style={{ flex: 1, minHeight: 48, fontSize: 12 }}>Ready</TouchButton>}
        {entry.status === 'ready' && <TouchButton tone="success" onClick={() => onComplete(entry.id)} style={{ flex: 1, minHeight: 48, fontSize: 12 }}>Complete</TouchButton>}
        {entry.status === 'completed' && <div style={{ flex: 1, textAlign: 'center', color: '#7ddca0', fontSize: 12, fontWeight: 600 }}>Done</div>}
      </div>
    </div>
  )
}
