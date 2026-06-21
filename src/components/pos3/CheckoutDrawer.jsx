/**
 * CheckoutDrawer — slide-up drawer summarizing the active ticket's items
 * and totals, with a primary action (e.g. Send Ticket).
 */
import { GOLD, PANEL, LINE, Pill } from '../eat/ui.jsx'
import TouchButton from './TouchButton.jsx'

export default function CheckoutDrawer({ open, ticket, totals, onClose, onPrimaryAction, primaryLabel = 'Send Ticket' }) {
  if (!open) return null

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: PANEL, borderTop: `1px solid ${LINE}`, borderRadius: '20px 20px 0 0',
          width: '100%', maxWidth: 480, padding: 20, paddingBottom: 28, maxHeight: '70vh', overflowY: 'auto',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>
          Ticket {ticket?.id} {ticket?.tableId ? `· ${ticket.tableId}` : ''}
        </div>

        {(ticket?.items || []).length === 0 && <div style={{ color: '#8b95a3', padding: '16px 0' }}>No items yet.</div>}

        {(ticket?.items || []).map((i) => (
          <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{i.qty}× {i.name}</div>
              <Pill label={i.destination || i.station} tone={i.destination || i.station} />
            </div>
            <span style={{ color: GOLD, fontWeight: 700 }}>${(i.price * i.qty).toFixed(2)}</span>
          </div>
        ))}

        {totals && (
          <div style={{ marginTop: 14, paddingTop: 10, borderTop: `1px solid ${LINE}` }}>
            <Row l="Subtotal" v={totals.subtotal} />
            <Row l="Tax" v={totals.tax} />
            {totals.tip ? <Row l="Tip" v={totals.tip} /> : null}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: 4 }}>
              <span>Total</span><span style={{ color: GOLD }}>${totals.total.toFixed(2)}</span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <TouchButton tone="neutral" onClick={onClose} style={{ flex: 1 }}>Close</TouchButton>
          {onPrimaryAction && (
            <TouchButton tone="success" onClick={onPrimaryAction} style={{ flex: 2 }}>{primaryLabel}</TouchButton>
          )}
        </div>
      </div>
    </div>
  )
}

const Row = ({ l, v }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#aab3bf', fontSize: 13 }}>
    <span>{l}</span><span>${v.toFixed(2)}</span>
  </div>
)
