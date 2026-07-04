/**
 * POS360ReservationsGuestFlow.jsx — Phase B.9
 * Reservations, Waitlist, Table/Patio, Private Events & Guest Flow Intelligence
 */

import React, { useState } from 'react'

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

// ── Shared primitives ─────────────────────────────────────────────────────────

function Card({ children, style }) {
  return (
    <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16, ...style }}>
      {children}
    </div>
  )
}

function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 14 }}>{title}</div>
      {sub && <div style={{ color: DARK_MUTE, fontSize: 11, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function StatusBadge({ label, color }) {
  return (
    <span style={{ background: color || DARK_LINE, color: DARK_TEXT, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
      {label}
    </span>
  )
}

function IntegrationNotConnected({ message }) {
  return (
    <div style={{ color: AMBER, fontSize: 12, padding: '8px 10px', background: '#1a1500', border: `1px solid ${AMBER}44`, borderRadius: 4, marginTop: 6 }}>
      {message}
    </div>
  )
}

// ── 1. ReservationDashboard ───────────────────────────────────────────────────

function ReservationDashboard({ activeTab, setActiveTab }) {
  const tabs = [
    { key: 'reservations', label: 'Reservation Queue' },
    { key: 'waitlist',     label: 'Waitlist' },
    { key: 'tables',       label: 'Table / Patio Map' },
    { key: 'events',       label: 'Private Events' },
    { key: 'flow',         label: 'Guest Flow' },
    { key: 'insights',     label: 'E.A.T. Insights' },
    { key: 'loyalty',      label: 'Loyalty Link' },
    { key: 'smokecraft',   label: 'SmokeCraft Link' },
    { key: 'offline',      label: 'Offline Queue' },
  ]
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingBottom: 12, borderBottom: `1px solid ${DARK_LINE}`, marginBottom: 16 }}>
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => setActiveTab(t.key)}
          style={{
            background: activeTab === t.key ? GOLD : 'transparent',
            color: activeTab === t.key ? DARK_BG : DARK_MUTE,
            border: `1px solid ${activeTab === t.key ? GOLD : DARK_LINE}`,
            borderRadius: 4,
            padding: '5px 12px',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: activeTab === t.key ? 700 : 400,
            whiteSpace: 'nowrap',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ── 2. ReservationCreatePanel ─────────────────────────────────────────────────

function ReservationCreatePanel() {
  const [form, setForm] = useState({ guestName: '', guestPhone: '', partySize: 2, date: '', time: '', source: 'staff' })
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const inp = (label, k, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: 8 }}>
      <label style={{ color: DARK_MUTE, fontSize: 11, display: 'block', marginBottom: 3 }}>{label}</label>
      <input value={form[k]} onChange={e => f(k, e.target.value)} type={type} placeholder={placeholder}
        style={{ width: '100%', background: DARK_BG, border: `1px solid ${DARK_LINE}`, borderRadius: 4, padding: '5px 8px', color: DARK_TEXT, fontSize: 13, boxSizing: 'border-box' }} />
    </div>
  )
  return (
    <Card>
      <SectionHeader title="Create Reservation" sub="Staff / host / manager / API / phone / offline" />
      {inp('Guest Name', 'guestName', 'text', 'Guest name or anonymous')}
      {inp('Phone', 'guestPhone', 'tel', 'Optional')}
      {inp('Party Size', 'partySize', 'number')}
      {inp('Date', 'date', 'date')}
      {inp('Time', 'time', 'time')}
      <div style={{ marginBottom: 8 }}>
        <label style={{ color: DARK_MUTE, fontSize: 11, display: 'block', marginBottom: 3 }}>Source</label>
        <select value={form.source} onChange={e => f('source', e.target.value)}
          style={{ width: '100%', background: DARK_BG, border: `1px solid ${DARK_LINE}`, borderRadius: 4, padding: '5px 8px', color: DARK_TEXT, fontSize: 13 }}>
          {['staff','host','manager','guest_web','kiosk','phone','api','offline'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <button style={{ background: GOLD, color: DARK_BG, border: 'none', borderRadius: 4, padding: '8px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 13, width: '100%' }}>
        Create Reservation
      </button>
      <IntegrationNotConnected message="SMS confirmation is not connected. No message will be sent." />
      <IntegrationNotConnected message="Email confirmation is not connected. No message will be sent." />
    </Card>
  )
}

// ── 3. ReservationListPanel ───────────────────────────────────────────────────

function ReservationListPanel() {
  return (
    <Card>
      <SectionHeader title="Reservation Queue" sub="Pending · Confirmed · Seated · Completed · No Show · Cancelled" />
      <HonestEmptyStatePanel message="No reservations found for this venue." />
    </Card>
  )
}

// ── 4. ReservationDetailPanel ─────────────────────────────────────────────────

function ReservationDetailPanel({ reservation }) {
  if (!reservation) return null
  return (
    <Card>
      <SectionHeader title="Reservation Detail" />
      <div style={{ color: DARK_TEXT, fontSize: 13, lineHeight: 1.7 }}>
        <div><span style={{ color: DARK_MUTE }}>Code: </span>{reservation.reservation_code || '—'}</div>
        <div><span style={{ color: DARK_MUTE }}>Guest: </span>{reservation.guest_name || '—'}</div>
        <div><span style={{ color: DARK_MUTE }}>Party: </span>{reservation.party_size || '—'}</div>
        <div><span style={{ color: DARK_MUTE }}>Date: </span>{reservation.reservation_date || '—'}</div>
        <div><span style={{ color: DARK_MUTE }}>Status: </span><StatusBadge label={reservation.status || 'pending'} color={BLUE} /></div>
      </div>
    </Card>
  )
}

// ── 5. ReservationStatusPanel ─────────────────────────────────────────────────

function ReservationStatusPanel() {
  return (
    <Card>
      <SectionHeader title="Status Updates" sub="Confirm · Seat · Complete · Cancel · No Show" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['Confirm', 'Seat', 'Complete', 'Cancel', 'No Show'].map(s => (
          <button key={s} style={{ background: s === 'Cancel' || s === 'No Show' ? RED : BLUE, color: DARK_TEXT, border: 'none', borderRadius: 4, padding: '6px 14px', cursor: 'pointer', fontSize: 12 }}>
            {s}
          </button>
        ))}
      </div>
    </Card>
  )
}

// ── 6. WaitlistPanel ──────────────────────────────────────────────────────────

function WaitlistPanel() {
  return (
    <Card>
      <SectionHeader title="Waitlist" sub="Waiting · Notified · Seated · Cancelled · No Show" />
      <HonestEmptyStatePanel message="The waitlist is empty." />
      <IntegrationNotConnected message="SMS waitlist notification is not connected. No messages will be sent." />
    </Card>
  )
}

// ── 7. WaitlistCreatePanel ────────────────────────────────────────────────────

function WaitlistCreatePanel() {
  return (
    <Card>
      <SectionHeader title="Add to Waitlist" sub="Walk-in or anonymous guest" />
      <div style={{ color: DARK_MUTE, fontSize: 12, marginBottom: 8 }}>Quoted wait time, party size, preferred section, priority level, and notes are all supported.</div>
      <button style={{ background: GOLD, color: DARK_BG, border: 'none', borderRadius: 4, padding: '7px 18px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
        Add to Waitlist
      </button>
    </Card>
  )
}

// ── 8. WaitlistPriorityPanel ──────────────────────────────────────────────────

function WaitlistPriorityPanel() {
  return (
    <Card>
      <SectionHeader title="Priority Override" sub="Manager approval required for priority level &gt; 5" />
      <div style={{ color: AMBER, fontSize: 12, marginBottom: 8 }}>Manager approval is required for this action.</div>
      <HonestEmptyStatePanel message="No priority override requests pending." />
    </Card>
  )
}

// ── 9. FloorSectionPanel ──────────────────────────────────────────────────────

function FloorSectionPanel() {
  const sections = ['Dining Room', 'Patio', 'Bar', 'Lounge', 'Humidor', 'Private Room', 'Event Space']
  return (
    <Card>
      <SectionHeader title="Floor Sections" sub="Dining · Patio · Bar · Lounge · Humidor · Private Room · Event Space" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {sections.map(s => (
          <div key={s} style={{ background: DARK_BG, border: `1px solid ${DARK_LINE}`, borderRadius: 4, padding: '6px 12px', color: DARK_TEXT, fontSize: 12 }}>{s}</div>
        ))}
      </div>
      <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 8 }}>No sections configured for this venue yet. Add sections to enable table layout.</div>
    </Card>
  )
}

// ── 10. TableMapPanel ─────────────────────────────────────────────────────────

function TableMapPanel() {
  return (
    <Card>
      <SectionHeader title="Table Map" sub="Available · Occupied · Reserved · Dirty · Cleaning · Blocked · Out of Service" />
      <div style={{ background: DARK_BG, border: `1px dashed ${DARK_LINE}`, borderRadius: 6, minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: DARK_MUTE, fontSize: 13, textAlign: 'center' }}>
          <div>No tables have been configured for this venue.</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>Add floor sections and tables to enable the live map.</div>
        </div>
      </div>
    </Card>
  )
}

// ── 11. TableStatusPanel ──────────────────────────────────────────────────────

function TableStatusPanel() {
  const statuses = [
    { label: 'Available', color: GREEN },
    { label: 'Occupied', color: RED },
    { label: 'Reserved', color: BLUE },
    { label: 'Dirty', color: AMBER },
    { label: 'Cleaning', color: DARK_MUTE },
    { label: 'Blocked', color: RED },
    { label: 'Out of Service', color: DARK_LINE },
  ]
  return (
    <Card>
      <SectionHeader title="Table Statuses" sub="Live status for all configured tables" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {statuses.map(s => <StatusBadge key={s.label} label={s.label} color={s.color} />)}
      </div>
      <HonestEmptyStatePanel message="No tables have been configured for this venue." />
    </Card>
  )
}

// ── 12. TableAssignmentPanel ──────────────────────────────────────────────────

function TableAssignmentPanel() {
  return (
    <Card>
      <SectionHeader title="Table Assignment" sub="Assign reservation or walk-in to table · integrates with order flow" />
      <div style={{ color: DARK_MUTE, fontSize: 12, marginBottom: 8 }}>
        Seated guests can be attached to orders via the POS360 order lifecycle (Prompt R).
      </div>
      <HonestEmptyStatePanel message="No tables available to assign. Configure tables first." />
    </Card>
  )
}

// ── 13. PatioManagementPanel ──────────────────────────────────────────────────

function PatioManagementPanel() {
  return (
    <Card>
      <SectionHeader title="Patio Management" sub="Outdoor sections · weather-aware layout" />
      <HonestEmptyStatePanel message="No patio sections configured for this venue." />
    </Card>
  )
}

// ── 14. ServerAssignmentPanel ─────────────────────────────────────────────────

function ServerAssignmentPanel() {
  return (
    <Card>
      <SectionHeader title="Server Assignment" sub="Assign servers to tables or sections" />
      <div style={{ color: DARK_MUTE, fontSize: 12, marginBottom: 8 }}>
        Staff data integration is a hook — no live staff records assumed unless configured.
      </div>
      <HonestEmptyStatePanel message="No server assignments on record." />
    </Card>
  )
}

// ── 15. PrivateEventsPanel ────────────────────────────────────────────────────

function PrivateEventsPanel() {
  return (
    <Card>
      <SectionHeader title="Private Events" sub="Inquiry · Proposed · Hold · Confirmed · Deposit · Completed" />
      <HonestEmptyStatePanel message="No private events on record." />
      <IntegrationNotConnected message="No deposit has been processed. Payment integration is not connected." />
      <IntegrationNotConnected message="No contract was sent. Contract management integration is not connected." />
    </Card>
  )
}

// ── 16. PrivateEventCreatePanel ───────────────────────────────────────────────

function PrivateEventCreatePanel() {
  return (
    <Card>
      <SectionHeader title="New Private Event Inquiry" sub="Kitchen · Bar · Humidor · Cigar · Staff coordination" />
      <div style={{ color: DARK_MUTE, fontSize: 12, marginBottom: 10 }}>
        All private events require manager approval. Kitchen, bar, humidor, and staff coordination notes
        are recorded — no live fulfillment is assumed unless real data exists.
      </div>
      <button style={{ background: GOLD, color: DARK_BG, border: 'none', borderRadius: 4, padding: '7px 18px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
        Create Inquiry
      </button>
    </Card>
  )
}

// ── 17. PrivateEventDepositPanel ──────────────────────────────────────────────

function PrivateEventDepositPanel() {
  return (
    <Card>
      <SectionHeader title="Deposit Tracking" sub="Pending · Paid · Refunded · Waived · Failed" />
      <IntegrationNotConnected message="No deposit has been processed. Payment integration is not connected." />
      <div style={{ color: AMBER, fontSize: 12, marginTop: 8 }}>Deposit reversal requires manager approval.</div>
    </Card>
  )
}

// ── 18. PrivateEventContractPanel ─────────────────────────────────────────────

function PrivateEventContractPanel() {
  return (
    <Card>
      <SectionHeader title="Contract Status" sub="Draft · Sent · Signed · Declined · Expired" />
      <IntegrationNotConnected message="Contract management integration is not connected yet." />
    </Card>
  )
}

// ── 19. GuestFlowTimelinePanel ────────────────────────────────────────────────

function GuestFlowTimelinePanel() {
  return (
    <Card>
      <SectionHeader title="Guest Flow Timeline" sub="Arrivals · Seatings · Completions · No Shows · Cancellations" />
      <HonestEmptyStatePanel message="No guest flow data available." />
    </Card>
  )
}

// ── 20. EATGuestFlowInsightsPanel ─────────────────────────────────────────────

function EATGuestFlowInsightsPanel() {
  return (
    <Card>
      <SectionHeader title="E.A.T. Guest Flow Insights" sub="No-show patterns · VIP arrivals · Party size trends · Turn speed · Service recovery" />
      <IntegrationNotConnected message="E.A.T. guest flow insights are not connected yet." />
      <HonestEmptyStatePanel message="No guest flow data available." />
    </Card>
  )
}

// ── 21. SmokeCraftReservationLinkPanel ────────────────────────────────────────

function SmokeCraftReservationLinkPanel() {
  return (
    <Card>
      <img src="/smokecraft-pos360.png" alt="SmokeCraft POS360" style={{ height: 28, marginBottom: 8, opacity: 0.65 }} />
      <SectionHeader title="SmokeCraft Reservation Link" sub="Link reservations to SmokeCraft guest passport and experience" />
      <IntegrationNotConnected message="SmokeCraft reservation link is not connected yet." />
    </Card>
  )
}

// ── 22. LoyaltyReservationLinkPanel ──────────────────────────────────────────

function LoyaltyReservationLinkPanel() {
  return (
    <Card>
      <SectionHeader title="Loyalty-Linked Reservations" sub="Connect guest profile and loyalty tier to reservation · member pricing · VIP seating" />
      <IntegrationNotConnected message="Loyalty-linked reservations are not active for this venue." />
    </Card>
  )
}

// ── 23. ReservationOfflineQueuePanel ─────────────────────────────────────────

function ReservationOfflineQueuePanel() {
  return (
    <Card>
      <SectionHeader title="Offline Queue" sub="Reservation, waitlist, and table operations queued while offline" />
      <HonestEmptyStatePanel message="No offline reservation actions are queued." />
    </Card>
  )
}

// ── 24. ReservationLanguageSelector ──────────────────────────────────────────

function ReservationLanguageSelector({ value, onChange }) {
  const langs = ['en-US', 'es-DO', 'es', 'ht', 'de', 'pt']
  return (
    <Card>
      <SectionHeader title="Guest-Facing Language" sub="Used for confirmation labels, waitlist notices, and guest flow screens" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {langs.map(l => (
          <button key={l} onClick={() => onChange(l)}
            style={{ background: value === l ? GOLD : DARK_BG, color: value === l ? DARK_BG : DARK_TEXT, border: `1px solid ${DARK_LINE}`, borderRadius: 4, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>
            {l}
          </button>
        ))}
      </div>
    </Card>
  )
}

// ── 25. HonestEmptyStatePanel ─────────────────────────────────────────────────

function HonestEmptyStatePanel({ message }) {
  return (
    <div style={{ color: DARK_MUTE, fontSize: 12, padding: '10px 0' }}>
      {message || 'No data available.'}
    </div>
  )
}

// ── Root Page ─────────────────────────────────────────────────────────────────

export default function POS360ReservationsGuestFlow() {
  const [activeTab, setActiveTab] = useState('reservations')
  const [lang, setLang] = useState('en-US')

  return (
    <div style={{ background: DARK_BG, minHeight: '100vh', color: DARK_TEXT, fontFamily: 'Inter, sans-serif', padding: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <img src="/smokecraft-pos360.png" alt="SmokeCraft POS360" style={{ height: 38 }} />
        <div>
          <h1 style={{ color: GOLD, fontSize: 20, fontWeight: 700, margin: 0 }}>Reservations, Waitlist & Guest Flow</h1>
          <div style={{ color: DARK_MUTE, fontSize: 11, marginTop: 2 }}>POS360 — Phase B.9 · Touchscreen · Handheld · Tablet · Desktop</div>
        </div>
      </div>

      <ReservationDashboard activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'reservations' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          <ReservationCreatePanel />
          <ReservationListPanel />
          <ReservationStatusPanel />
          <ReservationDetailPanel reservation={null} />
          <TableAssignmentPanel />
        </div>
      )}

      {activeTab === 'waitlist' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          <WaitlistCreatePanel />
          <WaitlistPanel />
          <WaitlistPriorityPanel />
        </div>
      )}

      {activeTab === 'tables' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          <FloorSectionPanel />
          <TableMapPanel />
          <TableStatusPanel />
          <PatioManagementPanel />
          <ServerAssignmentPanel />
        </div>
      )}

      {activeTab === 'events' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          <PrivateEventsPanel />
          <PrivateEventCreatePanel />
          <PrivateEventDepositPanel />
          <PrivateEventContractPanel />
        </div>
      )}

      {activeTab === 'flow' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          <GuestFlowTimelinePanel />
        </div>
      )}

      {activeTab === 'insights' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
          <EATGuestFlowInsightsPanel />
        </div>
      )}

      {activeTab === 'loyalty' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
          <LoyaltyReservationLinkPanel />
        </div>
      )}

      {activeTab === 'smokecraft' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
          <SmokeCraftReservationLinkPanel />
        </div>
      )}

      {activeTab === 'offline' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <ReservationOfflineQueuePanel />
          <ReservationLanguageSelector value={lang} onChange={setLang} />
        </div>
      )}
    </div>
  )
}
