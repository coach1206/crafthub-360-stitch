/**
 * POS360 Payments, Tips, Receipts & Settlement UI (Phase B.7)
 * Route: /pos3/payments
 */

import React, { useState, useEffect, useCallback } from 'react'
import { usePOS360VenueContextHook } from '../../utils/pos360VenueContext.js'

// ── Design tokens ──────────────────────────────────────────────────────────────
const DARK_BG    = '#080604'
const GOLD       = '#c9952c'
const DARK_CARD  = '#13110d'
const DARK_LINE  = '#2a2520'
const DARK_TEXT  = '#f0ead8'
const DARK_MUTE  = '#8a7e6a'
const RED        = '#c0392b'
const GREEN      = '#27ae60'
const BLUE       = '#2980b9'
const AMBER      = '#e67e22'

// ── StatusBadge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    paid:          { bg: GREEN },
    partially_paid:{ bg: BLUE },
    failed:        { bg: RED },
    voided:        { bg: '#7d3c98' },
    refunded:      { bg: AMBER },
    pending:       { bg: BLUE },
    offline_queued:{ bg: DARK_MUTE },
    not_started:   { bg: DARK_MUTE },
    settled:       { bg: GREEN },
    review_required:{ bg: AMBER },
    canceled:      { bg: DARK_MUTE },
  }
  const s = map[status] ?? { bg: DARK_MUTE }
  return (
    <span style={{
      background: s.bg, color: '#fff', borderRadius: 4,
      padding: '2px 8px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
    }}>{(status ?? '—').replace(/_/g, ' ')}</span>
  )
}

// ── PaymentsHome ───────────────────────────────────────────────────────────────
function PaymentsHome({ ctx }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 0 20px' }}>
      <img
        src="/smokecraft-pos360.png"
        alt="SmokeCraft POS360"
        style={{ width: 48, height: 48, borderRadius: 8, border: `2px solid ${GOLD}` }}
      />
      <div>
        <div style={{ color: GOLD, fontWeight: 700, fontSize: 20 }}>Payment Center</div>
        <div style={{ color: DARK_MUTE, fontSize: 13 }}>
          Venue: {ctx?.venueName ?? '—'} · POS360 Phase B.7
        </div>
      </div>
    </div>
  )
}

// ── PaymentLanguageSelector ────────────────────────────────────────────────────
function PaymentLanguageSelector({ lang, onChange }) {
  const options = [
    { code: 'en-US', label: 'Language' },
    { code: 'es-DO', label: 'Idioma (es-DO)' },
    { code: 'es',    label: 'Idioma (es)' },
    { code: 'ht',    label: 'Lang (ht)' },
    { code: 'de',    label: 'Sprache' },
    { code: 'pt',    label: 'Idioma (pt)' },
  ]
  return (
    <select
      value={lang}
      onChange={e => onChange(e.target.value)}
      style={{
        background: DARK_CARD, border: `1px solid ${DARK_LINE}`,
        color: DARK_TEXT, borderRadius: 6, padding: '6px 12px', fontSize: 13,
      }}
    >
      {options.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
    </select>
  )
}

// ── ProviderStatusPanel ────────────────────────────────────────────────────────
function ProviderStatusPanel() {
  return (
    <div style={{ background: DARK_CARD, border: `1px solid ${AMBER}44`, borderRadius: 8, padding: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Provider Status</div>
      <div style={{ color: AMBER, fontSize: 13, fontWeight: 600 }}>
        No payment provider is connected. No money was processed.
      </div>
      <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 6 }}>
        Connect a payment provider (credit_card, apple_pay, tap_to_pay, etc.) to enable live processing.
      </div>
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src="/smokecraft-pos360.png" alt="" style={{ width: 22, height: 22, borderRadius: 3, opacity: 0.5 }} />
        <span style={{ color: DARK_MUTE, fontSize: 11 }}>PCI-safe — No card data stored</span>
      </div>
    </div>
  )
}

// ── PaymentMethodSelector ──────────────────────────────────────────────────────
function PaymentMethodSelector({ selected, onSelect }) {
  const methods = [
    { key: 'credit_card',    label: 'Credit Card' },
    { key: 'debit_card',     label: 'Debit Card' },
    { key: 'cash',           label: 'Cash' },
    { key: 'apple_pay',      label: 'Apple Pay' },
    { key: 'google_pay',     label: 'Google Pay' },
    { key: 'tap_to_pay',     label: 'Tap to Pay' },
    { key: 'gift_card',      label: 'Gift Card' },
    { key: 'house_account',  label: 'House Account' },
    { key: 'split_payment',  label: 'Split Payment' },
    { key: 'comp_hook',      label: 'Comp' },
  ]
  return (
    <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Payment Method</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {methods.map(m => (
          <button key={m.key} onClick={() => onSelect(m.key)} style={{
            background: selected === m.key ? GOLD : DARK_BG,
            color: selected === m.key ? '#000' : DARK_TEXT,
            border: `1px solid ${selected === m.key ? GOLD : DARK_LINE}`,
            borderRadius: 6, padding: '10px 16px', fontSize: 13,
            fontWeight: selected === m.key ? 700 : 400,
            cursor: 'pointer', minWidth: 110, textAlign: 'center',
          }}>{m.label}</button>
        ))}
      </div>
    </div>
  )
}

// ── TenderEntryPanel ───────────────────────────────────────────────────────────
function TenderEntryPanel({ amount, amountDue, onAmountChange, onSubmit, submitting }) {
  return (
    <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Tender Entry</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: DARK_MUTE, fontSize: 11, marginBottom: 4 }}>Amount Due</div>
          <div style={{ color: DARK_TEXT, fontWeight: 700, fontSize: 22 }}>${Number(amountDue ?? 0).toFixed(2)}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: DARK_MUTE, fontSize: 11, marginBottom: 4 }}>Amount Tendered</div>
          <input
            type="number"
            value={amount}
            onChange={e => onAmountChange(e.target.value)}
            style={{
              background: DARK_BG, border: `1px solid ${DARK_LINE}`, color: DARK_TEXT,
              borderRadius: 6, padding: '8px 12px', fontSize: 18, width: '100%',
            }}
          />
        </div>
      </div>
      {amount > amountDue && (
        <div style={{ color: GREEN, fontSize: 12, marginBottom: 8 }}>
          Change: ${(Number(amount) - Number(amountDue)).toFixed(2)}
        </div>
      )}
      <button onClick={onSubmit} disabled={submitting} style={{
        background: submitting ? DARK_LINE : GOLD,
        color: submitting ? DARK_MUTE : '#000',
        border: 'none', borderRadius: 6, padding: '12px 24px',
        fontWeight: 700, fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer', width: '100%',
      }}>
        {submitting ? 'Processing…' : 'Create Payment Placeholder'}
      </button>
      <div style={{ color: DARK_MUTE, fontSize: 11, marginTop: 8, textAlign: 'center' }}>
        Payment intent created as a placeholder. No money was processed.
      </div>
    </div>
  )
}

// ── TipSelectionPanel ──────────────────────────────────────────────────────────
function TipSelectionPanel({ subtotal, selectedTip, onSelectTip }) {
  const presets = [
    { label: 'No Tip', pct: 0, amount: 0 },
    { label: '15%',    pct: 15, amount: +(subtotal * 0.15).toFixed(2) },
    { label: '18%',    pct: 18, amount: +(subtotal * 0.18).toFixed(2) },
    { label: '20%',    pct: 20, amount: +(subtotal * 0.20).toFixed(2) },
    { label: '25%',    pct: 25, amount: +(subtotal * 0.25).toFixed(2) },
  ]
  const [customAmt, setCustomAmt] = useState('')
  return (
    <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Select Tip</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {presets.map(p => (
          <button key={p.label} onClick={() => onSelectTip(p.amount, p.pct)} style={{
            background: selectedTip?.pct === p.pct ? GOLD : DARK_BG,
            color: selectedTip?.pct === p.pct ? '#000' : DARK_TEXT,
            border: `1px solid ${selectedTip?.pct === p.pct ? GOLD : DARK_LINE}`,
            borderRadius: 6, padding: '10px 14px', fontSize: 13,
            fontWeight: selectedTip?.pct === p.pct ? 700 : 400, cursor: 'pointer',
          }}>
            <div>{p.label}</div>
            {p.pct > 0 && <div style={{ fontSize: 11, opacity: 0.8 }}>${p.amount}</div>}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="number"
          placeholder="Custom amount"
          value={customAmt}
          onChange={e => setCustomAmt(e.target.value)}
          style={{
            background: DARK_BG, border: `1px solid ${DARK_LINE}`, color: DARK_TEXT,
            borderRadius: 6, padding: '8px 12px', fontSize: 14, flex: 1,
          }}
        />
        <button onClick={() => { onSelectTip(+customAmt, null); setCustomAmt('') }} style={{
          background: BLUE, color: '#fff', border: 'none', borderRadius: 6,
          padding: '8px 16px', fontSize: 13, cursor: 'pointer',
        }}>Set</button>
      </div>
    </div>
  )
}

// ── SignatureCapturePanel ──────────────────────────────────────────────────────
function SignatureCapturePanel({ onCapture, onSkip }) {
  return (
    <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Signature</div>
      <div style={{
        background: DARK_BG, border: `2px dashed ${DARK_LINE}`, borderRadius: 6,
        height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: DARK_MUTE, fontSize: 13, marginBottom: 12,
      }}>
        Signature capture placeholder — connect hardware
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onCapture} style={{
          background: GREEN, color: '#fff', border: 'none', borderRadius: 6,
          padding: '8px 16px', fontSize: 13, cursor: 'pointer', flex: 1,
        }}>Capture</button>
        <button onClick={onSkip} style={{
          background: DARK_LINE, color: DARK_MUTE, border: 'none', borderRadius: 6,
          padding: '8px 16px', fontSize: 13, cursor: 'pointer', flex: 1,
        }}>Skip</button>
      </div>
    </div>
  )
}

// ── ReceiptPreviewPanel ────────────────────────────────────────────────────────
function ReceiptPreviewPanel({ receipt, onEmail, onSMS, onPrint }) {
  if (!receipt) {
    return (
      <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Receipt Preview</div>
        <div style={{ color: DARK_MUTE, fontSize: 13 }}>No receipt generated yet.</div>
      </div>
    )
  }
  return (
    <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Receipt Preview</div>
      <div style={{ fontFamily: 'monospace', fontSize: 12, color: DARK_TEXT, lineHeight: 1.8, marginBottom: 12 }}>
        {[
          ['Subtotal', receipt.subtotal],
          ['Tax', receipt.taxAmount],
          ['Service Charge', receipt.serviceChargeAmount],
          ['Discount', receipt.discountAmount ? `-${receipt.discountAmount}` : null],
          ['Tip', receipt.tipAmount],
          ['Total', receipt.totalAmount],
          ['Paid', receipt.paidAmount],
          ['Balance Due', receipt.balanceDue],
        ].filter(([, v]) => v != null).map(([label, val]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: DARK_MUTE }}>{label}</span>
            <span>${Number(val).toFixed(2)}</span>
          </div>
        ))}
        {receipt.maskedCard && (
          <div style={{ color: DARK_MUTE, marginTop: 6 }}>Card: {receipt.maskedCard}</div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={onEmail} style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 12, cursor: 'pointer' }}>Email</button>
        <button onClick={onSMS}   style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 12, cursor: 'pointer' }}>SMS</button>
        <button onClick={onPrint} style={{ background: DARK_LINE, color: DARK_TEXT, border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 12, cursor: 'pointer' }}>Print</button>
      </div>
    </div>
  )
}

// ── SplitPaymentPanel ──────────────────────────────────────────────────────────
function SplitPaymentPanel({ split, onAddTender, onComplete }) {
  const [tenderAmount, setTenderAmount] = useState('')
  if (!split) {
    return (
      <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Split Payment</div>
        <div style={{ color: DARK_MUTE, fontSize: 13 }}>No active split payment.</div>
      </div>
    )
  }
  return (
    <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Split Payment</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        {[['Total', split.totalAmount], ['Paid', split.paidAmount], ['Balance', split.balanceDue]].map(([l, v]) => (
          <div key={l}>
            <div style={{ color: DARK_MUTE, fontSize: 11 }}>{l}</div>
            <div style={{ color: l === 'Balance' && v > 0 ? AMBER : DARK_TEXT, fontWeight: 700, fontSize: 16 }}>
              ${Number(v ?? 0).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input type="number" placeholder="Tender amount" value={tenderAmount}
          onChange={e => setTenderAmount(e.target.value)}
          style={{ background: DARK_BG, border: `1px solid ${DARK_LINE}`, color: DARK_TEXT, borderRadius: 6, padding: '8px 12px', fontSize: 14, flex: 1 }}
        />
        <button onClick={() => { onAddTender(+tenderAmount); setTenderAmount('') }} style={{
          background: GOLD, color: '#000', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 700, cursor: 'pointer',
        }}>Add Tender</button>
      </div>
      {Number(split.balanceDue) <= 0 && (
        <button onClick={onComplete} style={{
          background: GREEN, color: '#fff', border: 'none', borderRadius: 6,
          padding: '10px 20px', fontWeight: 700, width: '100%', cursor: 'pointer',
        }}>Complete Split Payment</button>
      )}
    </div>
  )
}

// ── RefundVoidPanel ────────────────────────────────────────────────────────────
function RefundVoidPanel({ payments, onRefund, onVoid }) {
  const [selectedPaymentId, setSelectedPaymentId] = useState('')
  const [reason, setReason] = useState('')
  return (
    <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Refund / Void</div>
      <select value={selectedPaymentId} onChange={e => setSelectedPaymentId(e.target.value)}
        style={{ background: DARK_BG, border: `1px solid ${DARK_LINE}`, color: DARK_TEXT, borderRadius: 6, padding: '8px 12px', width: '100%', marginBottom: 8 }}>
        <option value="">Select payment…</option>
        {(payments ?? []).map(p => (
          <option key={p.id} value={p.id}>${p.amount} — {p.paymentMethod} — {p.paymentStatus}</option>
        ))}
      </select>
      <input placeholder="Reason" value={reason} onChange={e => setReason(e.target.value)}
        style={{ background: DARK_BG, border: `1px solid ${DARK_LINE}`, color: DARK_TEXT, borderRadius: 6, padding: '8px 12px', width: '100%', marginBottom: 8, fontSize: 13 }} />
      <div style={{ color: DARK_MUTE, fontSize: 11, marginBottom: 8 }}>Manager approval required.</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onRefund(selectedPaymentId, reason)} disabled={!selectedPaymentId} style={{
          background: selectedPaymentId ? AMBER : DARK_LINE,
          color: selectedPaymentId ? '#000' : DARK_MUTE,
          border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 700, cursor: selectedPaymentId ? 'pointer' : 'not-allowed', flex: 1,
        }}>Request Refund</button>
        <button onClick={() => onVoid(selectedPaymentId, reason)} disabled={!selectedPaymentId} style={{
          background: selectedPaymentId ? RED : DARK_LINE,
          color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 700,
          cursor: selectedPaymentId ? 'pointer' : 'not-allowed', flex: 1,
        }}>Request Void</button>
      </div>
      <div style={{ color: DARK_MUTE, fontSize: 11, marginTop: 8 }}>
        No real refund was processed. Provider not connected.
      </div>
    </div>
  )
}

// ── ManagerApprovalPanel ───────────────────────────────────────────────────────
function ManagerApprovalPanel({ items, onApprove, onDeny }) {
  if (!items || items.length === 0) {
    return (
      <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Manager Approval</div>
        <div style={{ color: DARK_MUTE, fontSize: 13 }}>No items pending manager approval.</div>
      </div>
    )
  }
  return (
    <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Manager Approval ({items.length})</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(item => (
          <div key={item.id} style={{ background: DARK_BG, borderRadius: 6, padding: '10px 12px', border: `1px solid ${AMBER}44` }}>
            <div style={{ color: DARK_TEXT, fontSize: 13, fontWeight: 600 }}>{item.reviewType ?? item.refundType ?? 'Review'}</div>
            <div style={{ color: DARK_MUTE, fontSize: 11 }}>{item.reason ?? item.refundReason ?? '—'}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => onApprove(item.id)} style={{ background: GREEN, color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>Approve</button>
              <button onClick={() => onDeny(item.id)}    style={{ background: RED,   color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>Deny</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── SettlementBatchPanel ───────────────────────────────────────────────────────
function SettlementBatchPanel({ batches, onCreateBatch, onCloseBatch }) {
  return (
    <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ color: GOLD, fontWeight: 700, fontSize: 13 }}>Settlement Batches</div>
        <button onClick={onCreateBatch} style={{
          background: GOLD, color: '#000', border: 'none', borderRadius: 6,
          padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>Open Batch</button>
      </div>
      {!batches?.length ? (
        <div style={{ color: DARK_MUTE, fontSize: 13 }}>No settlement batches found.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {batches.map(b => (
            <div key={b.id} style={{
              background: DARK_BG, borderRadius: 6, padding: '10px 12px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ color: DARK_TEXT, fontSize: 13, fontWeight: 600 }}>{b.batchName ?? b.id?.slice(0, 8)}</div>
                <div style={{ color: DARK_MUTE, fontSize: 11 }}>{b.batchDate} · {b.paymentCount} payments</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <StatusBadge status={b.batchStatus} />
                {b.batchStatus === 'open' && (
                  <button onClick={() => onCloseBatch(b.id)} style={{
                    background: AMBER, color: '#000', border: 'none', borderRadius: 4,
                    padding: '4px 10px', fontSize: 11, cursor: 'pointer',
                  }}>Close</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── EndOfDayCloseoutPanel ──────────────────────────────────────────────────────
function EndOfDayCloseoutPanel({ closeout }) {
  return (
    <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>End of Day Closeout</div>
      {!closeout ? (
        <div style={{ color: DARK_MUTE, fontSize: 13 }}>No end-of-day closeout recorded yet.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            ['Total Sales', closeout.totalSales],
            ['Total Tips',  closeout.totalTips],
            ['Refunds',     closeout.totalRefunds],
            ['Net Total',   closeout.netTotal],
          ].map(([l, v]) => (
            <div key={l}>
              <div style={{ color: DARK_MUTE, fontSize: 11 }}>{l}</div>
              <div style={{ color: DARK_TEXT, fontWeight: 700 }}>${Number(v ?? 0).toFixed(2)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── CashDrawerPanel ────────────────────────────────────────────────────────────
function CashDrawerPanel({ summary, onPaidIn, onPaidOut, onDrop }) {
  return (
    <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Cash Drawer</div>
      {!summary?.length ? (
        <div style={{ color: DARK_MUTE, fontSize: 13, marginBottom: 12 }}>No cash events recorded.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
          {summary.map(row => (
            <div key={row.event_type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: DARK_MUTE }}>{row.event_type}</span>
              <span style={{ color: DARK_TEXT }}>${Number(row.total ?? 0).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={onPaidIn}  style={{ background: GREEN, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 12, cursor: 'pointer' }}>Paid In</button>
        <button onClick={onPaidOut} style={{ background: RED,   color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 12, cursor: 'pointer' }}>Paid Out</button>
        <button onClick={onDrop}    style={{ background: AMBER, color: '#000', border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 12, cursor: 'pointer' }}>Cash Drop</button>
      </div>
    </div>
  )
}

// ── OfflinePaymentQueuePanel ───────────────────────────────────────────────────
function OfflinePaymentQueuePanel({ summary }) {
  if (!summary || summary.count === 0) {
    return (
      <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Offline Payment Queue</div>
        <div style={{ color: DARK_MUTE, fontSize: 13 }}>No offline payment actions are queued.</div>
      </div>
    )
  }
  return (
    <div style={{ background: DARK_CARD, border: `1px solid ${AMBER}44`, borderRadius: 8, padding: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Offline Payment Queue</div>
      <div style={{ color: AMBER, fontSize: 13 }}>{summary.count} payments queued · ${Number(summary.total ?? 0).toFixed(2)} total</div>
      <div style={{ color: DARK_MUTE, fontSize: 11, marginTop: 4 }}>Connects to Prompt S offline sync engine.</div>
    </div>
  )
}

// ── EATPaymentAlertsPanel ──────────────────────────────────────────────────────
function EATPaymentAlertsPanel({ alerts, onAcknowledge }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>E.A.T. Payment Alerts</div>
        <div style={{ color: DARK_MUTE, fontSize: 13 }}>E.A.T. payment alerts are not connected yet.</div>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/smokecraft-pos360.png" alt="" style={{ width: 22, height: 22, borderRadius: 3, opacity: 0.5 }} />
          <span style={{ color: DARK_MUTE, fontSize: 11 }}>SmokeCraft · POS360</span>
        </div>
      </div>
    )
  }
  return (
    <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ color: GOLD, fontWeight: 700, fontSize: 13 }}>E.A.T. Payment Alerts ({alerts.length})</div>
        <img src="/smokecraft-pos360.png" alt="" style={{ width: 22, height: 22, borderRadius: 3, opacity: 0.6 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {alerts.map(a => (
          <div key={a.id} style={{
            background: DARK_BG, borderRadius: 6, padding: '10px 12px',
            border: `1px solid ${a.acknowledged ? DARK_LINE : AMBER}44`,
            opacity: a.acknowledged ? 0.6 : 1,
          }}>
            <div style={{ color: DARK_TEXT, fontSize: 13, fontWeight: 600 }}>{a.title}</div>
            <div style={{ color: DARK_MUTE, fontSize: 11, marginTop: 2 }}>{a.body ?? ''}</div>
            {!a.acknowledged && (
              <button onClick={() => onAcknowledge(a.id)} style={{
                marginTop: 6, background: BLUE, color: '#fff', border: 'none',
                borderRadius: 4, padding: '3px 10px', fontSize: 11, cursor: 'pointer',
              }}>Acknowledge</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── PaymentAuditTimeline ───────────────────────────────────────────────────────
function PaymentAuditTimeline({ entries }) {
  if (!entries || entries.length === 0) {
    return (
      <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Payment Audit</div>
        <div style={{ color: DARK_MUTE, fontSize: 13 }}>No audit events recorded yet.</div>
      </div>
    )
  }
  return (
    <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Payment Audit ({entries.length})</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {entries.map(e => (
          <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: DARK_BG, borderRadius: 4 }}>
            <div style={{ color: DARK_TEXT, fontSize: 12 }}>{e.action}</div>
            <div style={{ color: DARK_MUTE, fontSize: 11 }}>{e.actorId ?? '—'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function POS360Payments() {
  const ctx = usePOS360VenueContextHook()

  const [lang, setLang]             = useState('en-US')
  const [tab, setTab]               = useState('payment')
  const [payments, setPayments]     = useState([])
  const [batches, setBatches]       = useState([])
  const [eatAlerts, setEatAlerts]   = useState([])
  const [cashSummary, setCashSummary] = useState([])
  const [offlineQueue, setOfflineQueue] = useState(null)
  const [receipt, setReceipt]       = useState(null)
  const [split, setSplit]           = useState(null)
  const [refundItems, setRefundItems] = useState([])
  const [auditEntries, setAuditEntries] = useState([])
  const [closeout, setCloseout]     = useState(null)

  const [selectedMethod, setSelectedMethod] = useState('credit_card')
  const [tenderAmount, setTenderAmount]     = useState('')
  const [selectedTip, setSelectedTip]       = useState(null)
  const [submitting, setSubmitting]         = useState(false)

  const venueId    = ctx?.venueId ?? 'local'
  const localPreview = !ctx?.venueId

  const fetchAll = useCallback(async () => {
    if (localPreview) return
    const [p, b, e, c, o] = await Promise.allSettled([
      fetch(`/api/pos360/payments?venueId=${venueId}`).then(r => r.json()),
      fetch(`/api/pos360/payments/settlement/batches?venueId=${venueId}`).then(r => r.json()),
      fetch(`/api/pos360/payments/eat-alerts?venueId=${venueId}`).then(r => r.json()),
      fetch(`/api/pos360/payments/cash/drawer-summary?venueId=${venueId}`).then(r => r.json()),
      fetch(`/api/pos360/payments/offline/queue-summary?venueId=${venueId}`).then(r => r.json()),
    ])
    if (p.status === 'fulfilled' && Array.isArray(p.value?.payments)) setPayments(p.value.payments)
    if (b.status === 'fulfilled' && Array.isArray(b.value?.batches))  setBatches(b.value.batches)
    if (e.status === 'fulfilled' && Array.isArray(e.value?.alerts))   setEatAlerts(e.value.alerts)
    if (c.status === 'fulfilled' && Array.isArray(c.value?.summary))  setCashSummary(c.value.summary)
    if (o.status === 'fulfilled') setOfflineQueue(o.value)
  }, [localPreview, venueId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleCreatePayment = async () => {
    setSubmitting(true)
    try {
      await fetch(`/api/pos360/payments/intents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId, amount: tenderAmount || 0, paymentMethod: selectedMethod,
          idempotencyKey: `pay-${Date.now()}`, tipAmount: selectedTip?.amount ?? 0,
        }),
      })
      await fetchAll()
    } finally { setSubmitting(false) }
  }

  const handleRefund = async (paymentId, reason) => {
    await fetch(`/api/pos360/payments/refunds`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venueId, paymentId, refundReason: reason, refundType: 'full', idempotencyKey: `ref-${Date.now()}` }),
    })
    await fetchAll()
  }

  const handleVoid = async (paymentId, reason) => {
    await fetch(`/api/pos360/payments/voids`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venueId, paymentId, voidReason: reason }),
    })
    await fetchAll()
  }

  const handleAcknowledgeAlert = async (alertId) => {
    await fetch(`/api/pos360/payments/eat-alerts/${alertId}/acknowledge`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venueId }),
    })
    await fetchAll()
  }

  const handleCloseBatch = async (batchId) => {
    await fetch(`/api/pos360/payments/settlement/batches/${batchId}/close`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venueId }),
    })
    await fetchAll()
  }

  const handleCreateBatch = async () => {
    await fetch(`/api/pos360/payments/settlement/batches`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venueId, batchName: `Batch ${new Date().toLocaleDateString()}` }),
    })
    await fetchAll()
  }

  const tabs = [
    { id: 'payment',    label: 'Payment' },
    { id: 'tips',       label: 'Tips' },
    { id: 'signature',  label: 'Signature' },
    { id: 'receipt',    label: 'Receipt' },
    { id: 'split',      label: 'Split' },
    { id: 'refund',     label: 'Refund/Void' },
    { id: 'manager',    label: 'Approval' },
    { id: 'settlement', label: 'Settlement' },
    { id: 'cash',       label: 'Cash Drawer' },
    { id: 'offline',    label: 'Offline Queue' },
    { id: 'eat',        label: 'E.A.T.' },
    { id: 'provider',   label: 'Provider' },
    { id: 'audit',      label: 'Audit' },
  ]

  return (
    <div style={{
      minHeight: '100vh', background: DARK_BG, color: DARK_TEXT,
      fontFamily: 'system-ui, sans-serif', padding: '24px 28px',
    }}>
      <PaymentsHome ctx={ctx} />

      {localPreview && (
        <div style={{
          background: `${AMBER}22`, border: `1px solid ${AMBER}`, borderRadius: 6,
          padding: '10px 16px', marginBottom: 16, color: AMBER, fontSize: 13,
        }}>
          Running in local/demo mode. Connect a venue to enable live payments.
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ marginLeft: 'auto' }}>
          <PaymentLanguageSelector lang={lang} onChange={setLang} />
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', borderBottom: `1px solid ${DARK_LINE}`, marginBottom: 20 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: tab === t.id ? DARK_CARD : 'transparent',
            border: `1px solid ${tab === t.id ? GOLD : 'transparent'}`,
            borderBottom: 'none', borderRadius: '6px 6px 0 0',
            color: tab === t.id ? GOLD : DARK_MUTE,
            padding: '8px 14px', fontSize: 12,
            fontWeight: tab === t.id ? 700 : 400, cursor: 'pointer',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ maxWidth: 900 }}>
        {tab === 'payment' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <PaymentMethodSelector selected={selectedMethod} onSelect={setSelectedMethod} />
            <TenderEntryPanel
              amount={tenderAmount} amountDue={0}
              onAmountChange={setTenderAmount}
              onSubmit={handleCreatePayment}
              submitting={submitting}
            />
            {payments.length > 0 && (
              <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16 }}>
                <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Recent Payments</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {payments.slice(0, 10).map(p => (
                    <div key={p.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: DARK_BG, borderRadius: 6, padding: '8px 12px',
                    }}>
                      <div>
                        <span style={{ color: DARK_TEXT, fontSize: 13 }}>${p.amount}</span>
                        <span style={{ color: DARK_MUTE, fontSize: 11, marginLeft: 8 }}>{p.paymentMethod}</span>
                      </div>
                      <StatusBadge status={p.paymentStatus} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!payments.length && !localPreview && (
              <div style={{ color: DARK_MUTE, fontSize: 13 }}>No payments found for this venue.</div>
            )}
          </div>
        )}

        {tab === 'tips' && (
          <TipSelectionPanel
            subtotal={50} selectedTip={selectedTip}
            onSelectTip={(amount, pct) => setSelectedTip({ amount, pct })}
          />
        )}

        {tab === 'signature' && (
          <SignatureCapturePanel
            onCapture={() => {}}
            onSkip={() => {}}
          />
        )}

        {tab === 'receipt' && (
          <ReceiptPreviewPanel
            receipt={receipt}
            onEmail={() => {}}
            onSMS={() => {}}
            onPrint={() => {}}
          />
        )}

        {tab === 'split' && (
          <SplitPaymentPanel
            split={split}
            onAddTender={() => {}}
            onComplete={() => {}}
          />
        )}

        {tab === 'refund' && (
          <RefundVoidPanel payments={payments} onRefund={handleRefund} onVoid={handleVoid} />
        )}

        {tab === 'manager' && (
          <ManagerApprovalPanel items={refundItems} onApprove={() => {}} onDeny={() => {}} />
        )}

        {tab === 'settlement' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SettlementBatchPanel batches={batches} onCreateBatch={handleCreateBatch} onCloseBatch={handleCloseBatch} />
            <EndOfDayCloseoutPanel closeout={closeout} />
          </div>
        )}

        {tab === 'cash' && (
          <CashDrawerPanel summary={cashSummary} onPaidIn={() => {}} onPaidOut={() => {}} onDrop={() => {}} />
        )}

        {tab === 'offline' && (
          <OfflinePaymentQueuePanel summary={offlineQueue} />
        )}

        {tab === 'eat' && (
          <EATPaymentAlertsPanel alerts={eatAlerts} onAcknowledge={handleAcknowledgeAlert} />
        )}

        {tab === 'provider' && (
          <ProviderStatusPanel />
        )}

        {tab === 'audit' && (
          <PaymentAuditTimeline entries={auditEntries} />
        )}
      </div>
    </div>
  )
}
