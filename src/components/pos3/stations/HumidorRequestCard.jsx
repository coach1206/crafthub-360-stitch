/**
 * HumidorRequestCard — touch card for a humidor pull request, with
 * Pull/Unavailable/Suggest Substitution/Delivered actions.
 */
import { Pill, GOLD, PANEL2, LINE } from '../../eat/ui.jsx'
import TouchButton from '../TouchButton.jsx'

export default function HumidorRequestCard({ entry, onPulled, onUnavailable, onSuggestSub, onDelivered }) {
  return (
    <div className={`tactile-card touch-pressable ${entry.status === 'unavailable' ? 'humidor-alert' : ''}`} style={{ background: PANEL2, border: `1px solid ${LINE}`, borderRadius: 14, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{entry.qty}× {entry.name}</div>
        <Pill label={entry.status} tone={entry.status === 'pulled' || entry.status === 'delivered' ? 'open' : entry.status === 'unavailable' ? 'critical' : 'pending'} />
      </div>
      <div style={{ fontSize: 11, color: '#8b95a3', marginTop: 4 }}>SKU: {entry.sku}</div>
      {entry.substitution && <div style={{ fontSize: 11, color: GOLD, marginTop: 2 }}>Suggested: {entry.substitution}</div>}
      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
        {entry.status === 'requested' && (
          <>
            <TouchButton tone="success" onClick={() => onPulled(entry.id)} style={{ flex: 1, minHeight: 48, fontSize: 12 }}>Pulled</TouchButton>
            <TouchButton tone="danger" onClick={() => onUnavailable(entry.id)} style={{ flex: 1, minHeight: 48, fontSize: 12 }}>Unavailable</TouchButton>
          </>
        )}
        {entry.status === 'unavailable' && (
          <TouchButton tone="warning" onClick={() => onSuggestSub(entry.id)} style={{ flex: 1, minHeight: 48, fontSize: 12 }}>Suggest Substitution</TouchButton>
        )}
        {entry.status === 'pulled' && (
          <TouchButton tone="primary" onClick={() => onDelivered(entry.id)} style={{ flex: 1, minHeight: 48, fontSize: 12 }}>Delivered</TouchButton>
        )}
        {entry.status === 'delivered' && <div style={{ flex: 1, textAlign: 'center', color: '#7ddca0', fontSize: 12, fontWeight: 600 }}>Done</div>}
      </div>
    </div>
  )
}
