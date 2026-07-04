/**
 * POS360PaymentsCloseout.jsx — Phase B.11 Prompt X
 * Touchscreen · Handheld · Tablet · Desktop
 */

import React, { useState } from 'react'
import { tPayment, getSupportedPaymentLanguages } from '../../locales/pos360Payments.js'

const DARK_BG = '#080604'
const GOLD = '#c9952c'
const DARK_CARD = '#13110d'
const DARK_LINE = '#2a2520'
const DARK_TEXT = '#f0ead8'
const DARK_MUTE = '#8a7e6a'
const RED = '#c0392b'
const GREEN = '#27ae60'
const BLUE = '#2980b9'
const AMBER = '#e67e22'

const API = '/api/pos360/payments-closeout'

function HonestProviderNote({ locale }) {
  return (
    <div style={{ background: DARK_CARD, border: `1px solid ${AMBER}`, borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: DARK_MUTE }}>
      <img src="/smokecraft-pos360.png" alt="POS360" style={{ height: 18, verticalAlign: 'middle', marginRight: 8 }} />
      {tPayment('payment_provider_not_connected', locale)}<br />
      {tPayment('no_card_data_stored', locale)}
    </div>
  )
}

function HonestEmptyState({ message, locale }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 16px', color: DARK_MUTE, fontSize: 14 }}>
      <img src="/smokecraft-pos360.png" alt="POS360" style={{ height: 32, opacity: 0.4, marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
      {message || tPayment('no_records', locale)}
    </div>
  )
}

function Panel({ title, children, color }) {
  return (
    <div style={{ background: DARK_CARD, border: `1px solid ${color || DARK_LINE}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
      <div style={{ color: color || GOLD, fontWeight: 700, fontSize: 15, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  )
}

function StatusBadge({ status }) {
  const colors = {
    pending: AMBER, approved: GREEN, rejected: RED, open: BLUE, closed: DARK_MUTE,
    manager_approved: GREEN, discrepancy: RED, in_progress: AMBER, submitted: BLUE,
    active: GREEN, inactive: DARK_MUTE, offline: RED, maintenance: AMBER,
    critical: RED, warning: AMBER, info: BLUE,
  }
  return (
    <span style={{ background: colors[status] || DARK_LINE, color: DARK_TEXT, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
      {status?.replace(/_/g, ' ').toUpperCase()}
    </span>
  )
}

// ── Payment Provider Panel ────────────────────────────────────────────────────
function PaymentProviderPanel({ locale }) {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ providerType: 'manual', displayName: '' })

  const load = async () => {
    setLoading(true)
    const r = await fetch(`${API}/provider-profiles`).then(x => x.json())
    setProfiles(r.providerProfiles || [])
    setLoading(false)
  }

  const create = async () => {
    await fetch(`${API}/provider-profiles`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    load()
  }

  return (
    <Panel title="Payment Provider Profiles" color={GOLD}>
      <HonestProviderNote locale={locale} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {['manual','stripe','square','clover','toast','adyen','authorize_net','worldpay'].map(pt => (
          <button key={pt} onClick={() => setForm(f => ({ ...f, providerType: pt }))}
            style={{ background: form.providerType === pt ? GOLD : DARK_LINE, color: DARK_TEXT, border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
            {pt}
          </button>
        ))}
      </div>
      <input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
        placeholder="Display name" style={{ background: DARK_BG, border: `1px solid ${DARK_LINE}`, borderRadius: 6, padding: '6px 10px', color: DARK_TEXT, width: '100%', marginBottom: 8 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={create} style={{ background: GOLD, color: DARK_BG, border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontWeight: 700 }}>Add Profile</button>
        <button onClick={load} style={{ background: DARK_LINE, color: DARK_TEXT, border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer' }}>Refresh</button>
      </div>
      {loading && <div style={{ color: DARK_MUTE, marginTop: 8 }}>{tPayment('loading', locale)}</div>}
      {profiles.length === 0 && !loading && <HonestEmptyState locale={locale} />}
      {profiles.map(p => (
        <div key={p.id} style={{ borderTop: `1px solid ${DARK_LINE}`, marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: DARK_TEXT, fontSize: 13 }}>{p.display_name} <span style={{ color: DARK_MUTE }}>({p.provider_type})</span></span>
          <StatusBadge status={p.is_active ? 'active' : 'inactive'} />
        </div>
      ))}
    </Panel>
  )
}

// ── Terminal Profile Panel ────────────────────────────────────────────────────
function TerminalProfilePanel({ locale }) {
  const [terminals, setTerminals] = useState([])
  const [form, setForm] = useState({ terminalType: 'handheld', displayName: '' })

  const load = async () => {
    const r = await fetch(`${API}/terminal-profiles`).then(x => x.json())
    setTerminals(r.terminalProfiles || [])
  }

  const create = async () => {
    await fetch(`${API}/terminal-profiles`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    load()
  }

  return (
    <Panel title="Terminal Profiles — Handheld · Tablet · Kiosk · Counter · External" color={BLUE}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {['handheld','tablet','kiosk','counter','external','virtual'].map(tt => (
          <button key={tt} onClick={() => setForm(f => ({ ...f, terminalType: tt }))}
            style={{ background: form.terminalType === tt ? BLUE : DARK_LINE, color: DARK_TEXT, border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
            {tt}
          </button>
        ))}
      </div>
      <input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
        placeholder="Terminal display name" style={{ background: DARK_BG, border: `1px solid ${DARK_LINE}`, borderRadius: 6, padding: '6px 10px', color: DARK_TEXT, width: '100%', marginBottom: 8 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={create} style={{ background: BLUE, color: DARK_TEXT, border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontWeight: 700 }}>Add Terminal</button>
        <button onClick={load} style={{ background: DARK_LINE, color: DARK_TEXT, border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer' }}>Refresh</button>
      </div>
      {terminals.length === 0 && <HonestEmptyState locale={locale} />}
      {terminals.map(t => (
        <div key={t.id} style={{ borderTop: `1px solid ${DARK_LINE}`, marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: DARK_TEXT, fontSize: 13 }}>{t.display_name} <span style={{ color: DARK_MUTE }}>({t.terminal_type})</span></span>
          <StatusBadge status={t.terminal_status} />
        </div>
      ))}
    </Panel>
  )
}

// ── Payment Intent Panel ──────────────────────────────────────────────────────
function PaymentIntentPanel({ locale }) {
  const [intents, setIntents] = useState([])
  const [form, setForm] = useState({ amountCents: 0, currencyCode: 'USD' })

  const load = async () => {
    const r = await fetch(`${API}/payment-intents`).then(x => x.json())
    setIntents(r.paymentIntents || [])
  }

  const create = async () => {
    await fetch(`${API}/payment-intents`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    load()
  }

  return (
    <Panel title="Payment Intents" color={GOLD}>
      <div style={{ background: DARK_BG, border: `1px solid ${DARK_LINE}`, borderRadius: 6, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: DARK_MUTE }}>
        {tPayment('no_payment_processed', locale)}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input type="number" value={form.amountCents} onChange={e => setForm(f => ({ ...f, amountCents: Number(e.target.value) }))}
          placeholder="Amount (cents)" style={{ background: DARK_BG, border: `1px solid ${DARK_LINE}`, borderRadius: 6, padding: '6px 10px', color: DARK_TEXT, flex: 1 }} />
        <input value={form.currencyCode} onChange={e => setForm(f => ({ ...f, currencyCode: e.target.value }))}
          placeholder="USD" style={{ background: DARK_BG, border: `1px solid ${DARK_LINE}`, borderRadius: 6, padding: '6px 10px', color: DARK_TEXT, width: 70 }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={create} style={{ background: GOLD, color: DARK_BG, border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontWeight: 700 }}>Create Intent</button>
        <button onClick={load} style={{ background: DARK_LINE, color: DARK_TEXT, border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer' }}>Load</button>
      </div>
      {intents.length === 0 && <HonestEmptyState locale={locale} />}
      {intents.map(i => (
        <div key={i.id} style={{ borderTop: `1px solid ${DARK_LINE}`, marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: DARK_TEXT, fontSize: 13 }}>${(i.amount_cents / 100).toFixed(2)} {i.currency_code}</span>
          <StatusBadge status={i.intent_status} />
        </div>
      ))}
    </Panel>
  )
}

// ── Split Tender Panel ────────────────────────────────────────────────────────
function SplitTenderPanel({ locale }) {
  const [groups, setGroups] = useState([])

  const load = async () => {
    const r = await fetch(`${API}/payment-intents`).then(x => x.json())
    setGroups(r.splitTenderGroups || [])
  }

  return (
    <Panel title={tPayment('split_tender_title', locale)} color={AMBER}>
      <div style={{ color: DARK_MUTE, fontSize: 13, marginBottom: 12 }}>
        Supports cash, card (external), gift card, comp, house account, and custom split tender combinations. No card data stored.
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        {['cash','card_external','gift_card_external','comp','house_account','manual_external','other'].map(tt => (
          <span key={tt} style={{ background: DARK_LINE, color: DARK_TEXT, borderRadius: 4, padding: '3px 10px', fontSize: 12 }}>{tt}</span>
        ))}
      </div>
      <button onClick={load} style={{ background: DARK_LINE, color: DARK_TEXT, border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer' }}>Load Groups</button>
      {groups.length === 0 && <HonestEmptyState locale={locale} />}
    </Panel>
  )
}

// ── Tip Selection Panel ───────────────────────────────────────────────────────
function TipSelectionPanel({ locale }) {
  const [tips, setTips] = useState([])
  const [selectedType, setSelectedType] = useState('no_tip')
  const [customAmount, setCustomAmount] = useState(0)

  const load = async () => {
    const r = await fetch(`${API}/tip-records`).then(x => x.json())
    setTips(r.tipRecords || [])
  }

  const PRESETS = [0, 15, 18, 20, 25]

  return (
    <Panel title={tPayment('tips_title', locale)} color={GREEN}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {PRESETS.map(p => (
          <button key={p} onClick={() => { setSelectedType(p === 0 ? 'no_tip' : 'preset_percent') }}
            style={{ background: DARK_LINE, color: DARK_TEXT, border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
            {p === 0 ? tPayment('no_tip', locale) : `${p}%`}
          </button>
        ))}
        <button onClick={() => setSelectedType('custom_amount')}
          style={{ background: selectedType === 'custom_amount' ? GREEN : DARK_LINE, color: DARK_TEXT, border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer' }}>
          {tPayment('tip_custom', locale)}
        </button>
      </div>
      {selectedType === 'custom_amount' && (
        <input type="number" value={customAmount} onChange={e => setCustomAmount(Number(e.target.value))}
          placeholder="Custom tip amount (cents)" style={{ background: DARK_BG, border: `1px solid ${DARK_LINE}`, borderRadius: 6, padding: '6px 10px', color: DARK_TEXT, width: '100%', marginBottom: 8 }} />
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={load} style={{ background: DARK_LINE, color: DARK_TEXT, border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer' }}>Load Tips</button>
      </div>
      {tips.length === 0 && <HonestEmptyState locale={locale} />}
      {tips.map(t => (
        <div key={t.id} style={{ borderTop: `1px solid ${DARK_LINE}`, marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: DARK_TEXT, fontSize: 13 }}>${(t.tip_amount_cents / 100).toFixed(2)}</span>
          <StatusBadge status={t.tip_selection_type} />
        </div>
      ))}
    </Panel>
  )
}

// ── Signature Panel ───────────────────────────────────────────────────────────
function SignaturePanel({ locale }) {
  return (
    <Panel title={tPayment('signature_title', locale)} color={DARK_MUTE}>
      <div style={{ background: DARK_BG, border: `1px solid ${AMBER}`, borderRadius: 6, padding: '10px 14px', fontSize: 13, color: DARK_MUTE }}>
        {tPayment('no_raw_signature_stored', locale)}
      </div>
      <div style={{ marginTop: 12, color: DARK_TEXT, fontSize: 13 }}>
        Signature metadata (method, timestamp, payment reference) is recorded. No signature image data is captured or stored.
      </div>
    </Panel>
  )
}

// ── Receipt Panel ─────────────────────────────────────────────────────────────
function ReceiptPanel({ locale }) {
  const [receipts, setReceipts] = useState([])
  const [format, setFormat] = useState('print')

  const load = async () => {
    const r = await fetch(`${API}/payment-records`).then(x => x.json())
    setReceipts(r.receiptRecords || [])
  }

  return (
    <Panel title={tPayment('receipt_title', locale)} color={BLUE}>
      <div style={{ background: DARK_BG, border: `1px solid ${AMBER}`, borderRadius: 6, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: DARK_MUTE }}>
        {tPayment('receipt_not_sent', locale)}<br />
        {tPayment('email_not_connected', locale)}<br />
        {tPayment('sms_not_connected', locale)}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        {['print','email','sms','qr','none'].map(f => (
          <button key={f} onClick={() => setFormat(f)}
            style={{ background: format === f ? BLUE : DARK_LINE, color: DARK_TEXT, border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
            {f}
          </button>
        ))}
      </div>
      <button onClick={load} style={{ background: DARK_LINE, color: DARK_TEXT, border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer' }}>Load Receipts</button>
      {receipts.length === 0 && <HonestEmptyState locale={locale} />}
    </Panel>
  )
}

// ── Refund Panel ──────────────────────────────────────────────────────────────
function RefundPanel({ locale }) {
  const [refunds, setRefunds] = useState([])

  const load = async () => {
    const r = await fetch(`${API}/refund-requests`).then(x => x.json())
    setRefunds(r.refundRequests || [])
  }

  return (
    <Panel title="Refunds" color={RED}>
      <div style={{ background: DARK_BG, border: `1px solid ${RED}`, borderRadius: 6, padding: '8px 12px', marginBottom: 12, fontSize: 13, color: RED }}>
        {tPayment('refund_approval_required', locale)}
      </div>
      <button onClick={load} style={{ background: DARK_LINE, color: DARK_TEXT, border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer' }}>Load Refunds</button>
      {refunds.length === 0 && <HonestEmptyState locale={locale} />}
      {refunds.map(r => (
        <div key={r.id} style={{ borderTop: `1px solid ${DARK_LINE}`, marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: DARK_TEXT, fontSize: 13 }}>${(r.refund_amount_cents / 100).toFixed(2)} — {r.refund_reason}</span>
          <StatusBadge status={r.refund_status} />
        </div>
      ))}
    </Panel>
  )
}

// ── Void Panel ────────────────────────────────────────────────────────────────
function VoidPanel({ locale }) {
  return (
    <Panel title="Voids" color={RED}>
      <div style={{ background: DARK_BG, border: `1px solid ${RED}`, borderRadius: 6, padding: '8px 12px', fontSize: 13, color: RED }}>
        {tPayment('void_approval_required', locale)}
      </div>
      <HonestEmptyState message="No void requests." locale={locale} />
    </Panel>
  )
}

// ── Cash Drawer Panel ─────────────────────────────────────────────────────────
function CashDrawerPanel({ locale }) {
  const [drawers, setDrawers] = useState([])
  const [events, setEvents] = useState([])
  const [selectedDrawerId, setSelectedDrawerId] = useState(null)

  const load = async () => {
    const r = await fetch(`${API}/cash-drawers`).then(x => x.json())
    setDrawers(r.cashDrawers || [])
  }

  const loadEvents = async (id) => {
    setSelectedDrawerId(id)
    const r = await fetch(`${API}/cash-drawers/${id}/events`).then(x => x.json())
    setEvents(r.cashDrawerEvents || [])
  }

  return (
    <Panel title={tPayment('cash_drawer_title', locale)} color={AMBER}>
      <button onClick={load} style={{ background: AMBER, color: DARK_BG, border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontWeight: 700 }}>Load Drawers</button>
      {drawers.length === 0 && <HonestEmptyState locale={locale} />}
      {drawers.map(d => (
        <div key={d.id} style={{ borderTop: `1px solid ${DARK_LINE}`, marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: DARK_TEXT, fontSize: 13 }}>{d.display_name} — {d.location_label}</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <StatusBadge status={d.drawer_status} />
            <button onClick={() => loadEvents(d.id)}
              style={{ background: DARK_LINE, color: DARK_TEXT, border: 'none', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontSize: 12 }}>
              Events
            </button>
          </div>
        </div>
      ))}
      {selectedDrawerId && events.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {events.map(e => (
            <div key={e.id} style={{ borderTop: `1px solid ${DARK_LINE}`, paddingTop: 6, marginTop: 6, fontSize: 12, color: DARK_MUTE }}>
              {e.event_type} — ${(e.amount_cents / 100).toFixed(2)} — {e.event_note}
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

// ── Closeout Panel ────────────────────────────────────────────────────────────
function CloseoutPanel({ type, title, color, locale }) {
  const [records, setRecords] = useState([])

  const load = async () => {
    const endpoint = type === 'server' ? 'server-closeouts' : type === 'shift' ? 'shift-closeouts' : 'daily-closeouts'
    const r = await fetch(`${API}/${endpoint}`).then(x => x.json())
    setRecords(r[`${type}Closeouts`] || r.serverCloseouts || r.shiftCloseouts || r.dailyCloseouts || [])
  }

  return (
    <Panel title={title} color={color}>
      <button onClick={load} style={{ background: color, color: DARK_BG, border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, marginBottom: 8 }}>
        Load {title}
      </button>
      {records.length === 0 && <HonestEmptyState locale={locale} />}
      {records.map(r => (
        <div key={r.id} style={{ borderTop: `1px solid ${DARK_LINE}`, marginTop: 8, paddingTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: DARK_TEXT, fontSize: 13 }}>{r.closeout_date}</span>
            <StatusBadge status={r.closeout_status} />
          </div>
          <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 4 }}>
            Cash: ${(r.cash_total_cents / 100).toFixed(2)} | Card: ${(r.card_total_cents / 100).toFixed(2)} | Tips: ${(r.tip_total_cents / 100).toFixed(2)} | Over/Short: ${(r.over_short_amount_cents / 100).toFixed(2)}
          </div>
        </div>
      ))}
    </Panel>
  )
}

// ── Risk Flags Panel ──────────────────────────────────────────────────────────
function RiskFlagsPanel({ locale }) {
  const [flags, setFlags] = useState([])
  const [level, setLevel] = useState('')

  const load = async () => {
    const r = await fetch(`${API}/risk-flags${level ? `?flagLevel=${level}` : ''}`).then(x => x.json())
    setFlags(r.riskFlags || [])
  }

  return (
    <Panel title="Payment Risk Flags" color={RED}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {['', 'info', 'warning', 'critical'].map(l => (
          <button key={l} onClick={() => setLevel(l)}
            style={{ background: level === l ? RED : DARK_LINE, color: DARK_TEXT, border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
            {l || 'All'}
          </button>
        ))}
        <button onClick={load} style={{ background: DARK_LINE, color: DARK_TEXT, border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>Load</button>
      </div>
      {flags.length === 0 && <HonestEmptyState locale={locale} />}
      {flags.map(f => (
        <div key={f.id} style={{ borderTop: `1px solid ${DARK_LINE}`, marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: DARK_TEXT, fontSize: 13 }}>{f.flag_type} — {f.flag_note}</span>
          <StatusBadge status={f.flag_level} />
        </div>
      ))}
    </Panel>
  )
}

// ── EAT Revenue Insights Panel ────────────────────────────────────────────────
function EATRevenueInsightsPanel({ locale }) {
  return (
    <Panel title="E.A.T. Revenue Insight Hooks" color={DARK_MUTE}>
      <div style={{ background: DARK_BG, border: `1px solid ${DARK_LINE}`, borderRadius: 6, padding: '10px 14px', fontSize: 13, color: DARK_MUTE }}>
        {tPayment('eat_revenue_insights_not_connected', locale)}
      </div>
      <div style={{ marginTop: 10, color: DARK_MUTE, fontSize: 12 }}>
        Revenue insight placeholders are stored locally. E.A.T. upstream integration is not connected.
      </div>
    </Panel>
  )
}

// ── Offline Queue Panel ───────────────────────────────────────────────────────
function OfflinePaymentQueuePanel({ locale }) {
  const [queue, setQueue] = useState([])

  const load = async () => {
    const r = await fetch(`${API}/offline-queue`).then(x => x.json())
    setQueue(r.offlineQueue || [])
  }

  return (
    <Panel title="Offline Payment Queue" color={AMBER}>
      <div style={{ color: DARK_MUTE, fontSize: 13, marginBottom: 8 }}>{tPayment('offline_queue_note', locale)}</div>
      <button onClick={load} style={{ background: DARK_LINE, color: DARK_TEXT, border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer' }}>Load Queue</button>
      {queue.length === 0 && <HonestEmptyState locale={locale} />}
      {queue.map(q => (
        <div key={q.id} style={{ borderTop: `1px solid ${DARK_LINE}`, marginTop: 8, paddingTop: 8, fontSize: 12, color: DARK_MUTE }}>
          {q.action_type} — {q.queue_status}
        </div>
      ))}
    </Panel>
  )
}

// ── Language Selector ─────────────────────────────────────────────────────────
function PaymentLanguageSelector({ locale, setLocale }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
      {getSupportedPaymentLanguages().map(l => (
        <button key={l} onClick={() => setLocale(l)}
          style={{ background: locale === l ? GOLD : DARK_LINE, color: locale === l ? DARK_BG : DARK_TEXT, border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12, fontWeight: locale === l ? 700 : 400 }}>
          {l}
        </button>
      ))}
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'providers', label: 'Providers' },
  { id: 'terminals', label: 'Terminals' },
  { id: 'intents', label: 'Intents' },
  { id: 'split', label: 'Split Tender' },
  { id: 'tips', label: 'Tips' },
  { id: 'signatures', label: 'Signatures' },
  { id: 'receipts', label: 'Receipts' },
  { id: 'refunds', label: 'Refunds' },
  { id: 'voids', label: 'Voids' },
  { id: 'drawers', label: 'Cash Drawers' },
  { id: 'server_closeout', label: 'Server Closeout' },
  { id: 'shift_closeout', label: 'Shift Closeout' },
  { id: 'daily_closeout', label: 'Daily Closeout' },
  { id: 'risk', label: 'Risk Flags' },
  { id: 'eat', label: 'E.A.T.' },
  { id: 'offline', label: 'Offline Queue' },
]

export default function POS360PaymentsCloseout() {
  const [tab, setTab] = useState('providers')
  const [locale, setLocale] = useState('en-US')

  return (
    <div style={{ background: DARK_BG, minHeight: '100vh', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <img src="/smokecraft-pos360.png" alt="POS360" style={{ height: 36 }} />
        <div>
          <div style={{ color: GOLD, fontWeight: 800, fontSize: 20 }}>POS360 — Payments, Tips & Closeout</div>
          <div style={{ color: DARK_MUTE, fontSize: 12 }}>Touchscreen · Handheld · Tablet · Desktop</div>
        </div>
      </div>

      <PaymentLanguageSelector locale={locale} setLocale={setLocale} />

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ background: tab === t.id ? GOLD : DARK_CARD, color: tab === t.id ? DARK_BG : DARK_TEXT, border: `1px solid ${tab === t.id ? GOLD : DARK_LINE}`, borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: tab === t.id ? 700 : 400 }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'providers' && <PaymentProviderPanel locale={locale} />}
      {tab === 'terminals' && <TerminalProfilePanel locale={locale} />}
      {tab === 'intents' && <PaymentIntentPanel locale={locale} />}
      {tab === 'split' && <SplitTenderPanel locale={locale} />}
      {tab === 'tips' && <TipSelectionPanel locale={locale} />}
      {tab === 'signatures' && <SignaturePanel locale={locale} />}
      {tab === 'receipts' && <ReceiptPanel locale={locale} />}
      {tab === 'refunds' && <RefundPanel locale={locale} />}
      {tab === 'voids' && <VoidPanel locale={locale} />}
      {tab === 'drawers' && <CashDrawerPanel locale={locale} />}
      {tab === 'server_closeout' && <CloseoutPanel type="server" title="Server Closeout" color={BLUE} locale={locale} />}
      {tab === 'shift_closeout' && <CloseoutPanel type="shift" title="Shift Closeout" color={AMBER} locale={locale} />}
      {tab === 'daily_closeout' && <CloseoutPanel type="daily" title="Daily Closeout" color={GREEN} locale={locale} />}
      {tab === 'risk' && <RiskFlagsPanel locale={locale} />}
      {tab === 'eat' && <EATRevenueInsightsPanel locale={locale} />}
      {tab === 'offline' && <OfflinePaymentQueuePanel locale={locale} />}
    </div>
  )
}
