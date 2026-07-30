import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as api from '../../../services/venueHumidor/venueHumidorCustomerApiClient.js'
import SmokeCraftScreenShell from '../../../components/smokecraft/SmokeCraftScreenShell.jsx'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'
const DANGER = 'rgba(255,150,150,0.9)'
const OK = '#7fd0a3'

function fmtCents(c) { return `$${((c || 0) / 100).toFixed(2)}` }

export default function VenueHumidorReceipt() {
  const navigate = useNavigate()
  const { orderId } = useParams()
  const [state, setState] = useState('loading')
  const [receipt, setReceipt] = useState(null)

  async function load() {
    setState('loading')
    const result = await api.getMyReceipt(orderId)
    if (!result.ok) {
      setState(result.status === 409 ? 'not_available' : result.status === 404 ? 'not_found' : result.status === 403 ? 'unauthorized' : 'error')
      return
    }
    setReceipt(result.receipt)
    setState('ready')
  }
  useEffect(() => { load() }, [orderId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (state === 'loading') return <SmokeCraftScreenShell mode="live" status="loading" loadingMessage="Loading receipt…" />
  if (state === 'not_available') return <SmokeCraftScreenShell mode="live" status="empty" emptyMessage="A receipt is only available once this order is completed, cancelled, or refunded." />
  if (state === 'not_found') return <SmokeCraftScreenShell mode="live" status="empty" emptyMessage="This order could not be found." />
  if (state === 'unauthorized') return <SmokeCraftScreenShell mode="live" status="error" errorMessage="This receipt does not belong to your account." />
  if (state === 'error') return <SmokeCraftScreenShell mode="live" status="error" errorMessage="Unable to load this receipt right now." onRetry={load} />

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={{ position: 'fixed', inset: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM, paddingBottom: 90 }} className="vh-receipt-container">
        <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 600, margin: '0 auto' }}>
          <div className="vh-receipt-noprint" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <button type="button" onClick={() => navigate(-1)} style={{ minHeight: 44, background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
            <button type="button" onClick={() => window.print()} style={{ minHeight: 44, padding: '8px 16px', borderRadius: 20, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit' }}>Print Receipt</button>
          </div>

          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 20 }}>
            {!receipt.isCompletedSale && (
              <p role="alert" style={{ color: DANGER, fontSize: 13, marginBottom: 12 }}>
                {receipt.status === 'refunded' ? 'This order was completed and later refunded.' : 'This order was cancelled — this is a cancellation record, not a completed sale.'}
                {receipt.cancellationReason && ` (${receipt.cancellationReason})`}
              </p>
            )}
            <h1 style={{ color: GOLD, fontSize: 20, margin: '0 0 4px' }}>{receipt.venueName}</h1>
            {receipt.venueAddress && <p style={{ fontSize: 12, opacity: 0.75, margin: 0 }}>{receipt.venueAddress}{receipt.venueCity ? `, ${receipt.venueCity}` : ''}{receipt.venueState ? `, ${receipt.venueState}` : ''}</p>}

            <div style={{ margin: '16px 0', fontSize: 13, display: 'grid', gap: 4 }}>
              <div>Order #: {receipt.orderNumber}</div>
              <div>Order date: {new Date(receipt.orderDate).toLocaleString()}</div>
              {receipt.completedDate && <div>Completed: {new Date(receipt.completedDate).toLocaleString()}</div>}
              {receipt.cancelledDate && <div>Cancelled: {new Date(receipt.cancelledDate).toLocaleString()}</div>}
              <div>Fulfillment: {receipt.fulfillmentMethod?.replace(/_/g, ' ')}</div>
              <div>Payment status: {receipt.paymentStatus?.replace(/_/g, ' ')}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}`, textAlign: 'left' }}>
                  <th style={{ padding: '4px 0' }}>Item</th>
                  <th style={{ padding: '4px 0', textAlign: 'right' }}>Qty</th>
                  <th style={{ padding: '4px 0', textAlign: 'right' }}>Unit</th>
                  <th style={{ padding: '4px 0', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {receipt.items.map((it, i) => (
                  <tr key={i}>
                    <td style={{ padding: '4px 0' }}>{it.brand} {it.name}</td>
                    <td style={{ padding: '4px 0', textAlign: 'right' }}>{it.quantity}</td>
                    <td style={{ padding: '4px 0', textAlign: 'right' }}>{fmtCents(it.unitPriceCents)}</td>
                    <td style={{ padding: '4px 0', textAlign: 'right' }}>{fmtCents(it.lineTotalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'grid', gap: 4, fontSize: 13, borderTop: `1px solid ${BORDER}`, paddingTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>{fmtCents(receipt.subtotalCents)}</span></div>
              {receipt.discountCents > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Discount</span><span>-{fmtCents(receipt.discountCents)}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tax</span><span>{fmtCents(receipt.taxCents)}</span></div>
              {receipt.serviceChargeCents > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Service charge</span><span>{fmtCents(receipt.serviceChargeCents)}</span></div>}
              {receipt.tipCents > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tip</span><span>{fmtCents(receipt.tipCents)}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: GOLD, fontSize: 16, marginTop: 4 }}><span>Total</span><span>{fmtCents(receipt.totalCents)}</span></div>
            </div>

            <p className="vh-receipt-noprint" style={{ fontSize: 11, opacity: 0.5, marginTop: 16 }}>PDF export is not currently available for Venue Humidor receipts — use Print Receipt above.</p>
          </div>
        </div>
      </div>
      <style>{`@media print { .vh-receipt-noprint { display: none !important; } body { background: white; } }`}</style>
    </SmokeCraftScreenShell>
  )
}
