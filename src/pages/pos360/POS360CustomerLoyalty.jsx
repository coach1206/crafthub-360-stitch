/**
 * POS360CustomerLoyalty.jsx — Phase B.8
 * Customer, Loyalty, Rewards & Guest Intelligence
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

// ── Shared ────────────────────────────────────────────────────────────────────

function Card({ children, style }) {
  return (
    <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 16, ...style }}>
      {children}
    </div>
  )
}

function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 15 }}>{title}</div>
      {sub && <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function Badge({ label, color }) {
  return (
    <span style={{ background: color || DARK_LINE, color: DARK_TEXT, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
      {label}
    </span>
  )
}

function EmptyState({ message }) {
  return <div style={{ color: DARK_MUTE, fontSize: 13, padding: '12px 0' }}>{message}</div>
}

// ── 1. CustomerSearchPanel ────────────────────────────────────────────────────

function CustomerSearchPanel({ onSelect }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])

  const search = () => {
    // placeholder — real search via /api/pos360/guests?q=...
    setResults([])
  }

  return (
    <Card>
      <SectionHeader title="Guest Search" sub="Search by name, email, phone, or membership number" />
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          value={q} onChange={e => setQ(e.target.value)}
          placeholder="Name, email, phone…"
          style={{ flex: 1, background: DARK_BG, border: `1px solid ${DARK_LINE}`, borderRadius: 4, padding: '6px 10px', color: DARK_TEXT, fontSize: 13 }}
        />
        <button onClick={search} style={{ background: GOLD, color: DARK_BG, border: 'none', borderRadius: 4, padding: '6px 14px', cursor: 'pointer', fontWeight: 700 }}>
          Search
        </button>
      </div>
      {results.length === 0 && <EmptyState message="Guest profile not found." />}
      {results.map(r => (
        <div key={r.id} onClick={() => onSelect(r)} style={{ padding: '8px 0', borderBottom: `1px solid ${DARK_LINE}`, cursor: 'pointer', color: DARK_TEXT }}>
          {r.display_name} · {r.email}
        </div>
      ))}
    </Card>
  )
}

// ── 2. GuestProfilePanel ──────────────────────────────────────────────────────

function GuestProfilePanel({ customer }) {
  if (!customer) return null
  return (
    <Card>
      <img src="/smokecraft-pos360.png" alt="SmokeCraft POS360" style={{ height: 32, marginBottom: 10, opacity: 0.7 }} />
      <SectionHeader title="Guest Profile" sub={`Customer ID: ${customer.id || '—'}`} />
      <div style={{ color: DARK_TEXT, fontSize: 13, lineHeight: 1.7 }}>
        <div><span style={{ color: DARK_MUTE }}>Name: </span>{customer.display_name || '—'}</div>
        <div><span style={{ color: DARK_MUTE }}>Email: </span>{customer.email || '—'}</div>
        <div><span style={{ color: DARK_MUTE }}>Phone: </span>{customer.phone || '—'}</div>
        <div><span style={{ color: DARK_MUTE }}>Language: </span>{customer.preferred_language || 'en-US'}</div>
        <div><span style={{ color: DARK_MUTE }}>Source: </span>{customer.source || 'pos360'}</div>
      </div>
    </Card>
  )
}

// ── 3. GuestIdentityPanel ─────────────────────────────────────────────────────

function GuestIdentityPanel({ customerId }) {
  return (
    <Card>
      <SectionHeader title="Guest Identities" sub="Phone · Email · QR · Barcode · Membership · Anonymous" />
      <EmptyState message="No identities linked. Add phone, email, QR code, or barcode to identify this guest." />
    </Card>
  )
}

// ── 4. LoyaltyProfilePanel ────────────────────────────────────────────────────

function LoyaltyProfilePanel({ customerId }) {
  return (
    <Card>
      <SectionHeader title="Loyalty Profile" sub="Points balance, tier, and enrollment status" />
      <EmptyState message="No loyalty profile is connected for this guest." />
    </Card>
  )
}

// ── 5. PointsLedgerPanel ──────────────────────────────────────────────────────

function PointsLedgerPanel({ customerId }) {
  return (
    <Card>
      <SectionHeader title="Points Ledger" sub="Earn, redeem, adjust, expire, reverse" />
      <EmptyState message="No loyalty profile is connected for this guest." />
    </Card>
  )
}

// ── 6. TierManagementPanel ────────────────────────────────────────────────────

function TierManagementPanel() {
  const defaultTiers = ['Standard', 'Member', 'VIP', 'Elite', 'Founders', 'Custom']
  return (
    <Card>
      <SectionHeader title="Loyalty Tiers" sub="Venue-configurable tiers — not hardcoded" />
      <div style={{ color: DARK_MUTE, fontSize: 12, marginBottom: 10 }}>
        Default tier names (customizable per venue): {defaultTiers.join(', ')}
      </div>
      <EmptyState message="No tiers configured for this venue yet. Create tiers to enable loyalty progression." />
    </Card>
  )
}

// ── 7. RewardsCatalogPanel ────────────────────────────────────────────────────

function RewardsCatalogPanel() {
  return (
    <Card>
      <SectionHeader title="Rewards Catalog" sub="Discount · Free item · Upgrade · Birthday · Referral · Service recovery" />
      <EmptyState message="No rewards are available for this guest." />
    </Card>
  )
}

// ── 8. RewardRedemptionPanel ──────────────────────────────────────────────────

function RewardRedemptionPanel({ customerId }) {
  return (
    <Card>
      <SectionHeader title="Reward Redemption" sub="Apply reward to order · connects to Prompt T (payments)" />
      <EmptyState message="No rewards are available for this guest." />
    </Card>
  )
}

// ── 9. PointsAdjustmentPanel ──────────────────────────────────────────────────

function PointsAdjustmentPanel({ customerId }) {
  return (
    <Card>
      <SectionHeader title="Points Adjustment" sub="Manager approval required" />
      <div style={{ color: AMBER, fontSize: 12, marginBottom: 8 }}>All points adjustments require manager approval before taking effect.</div>
      <EmptyState message="No adjustments pending." />
    </Card>
  )
}

// ── 10. RewardReversalPanel ───────────────────────────────────────────────────

function RewardReversalPanel() {
  return (
    <Card>
      <SectionHeader title="Reward Reversal" sub="Manager approval required" />
      <div style={{ color: AMBER, fontSize: 12, marginBottom: 8 }}>Reward reversals require manager approval.</div>
      <EmptyState message="No reversals pending." />
    </Card>
  )
}

// ── 11. ConsentPrivacyPanel ───────────────────────────────────────────────────

function ConsentPrivacyPanel({ customerId }) {
  return (
    <Card>
      <SectionHeader title="Consent & Privacy" sub="Marketing · Data profiling · Birthday offers · Analytics" />
      <div style={{ color: DARK_MUTE, fontSize: 12, marginBottom: 8 }}>Privacy export and delete hooks are available. All consent preferences are logged.</div>
      <EmptyState message="No consent records on file for this guest." />
    </Card>
  )
}

// ── 12. GuestActivityTimelinePanel ───────────────────────────────────────────

function GuestActivityTimelinePanel({ customerId }) {
  return (
    <Card>
      <SectionHeader title="Activity Timeline" sub="Visits · Orders · Payments · Rewards · Loyalty events" />
      <EmptyState message="No activity on record for this guest." />
    </Card>
  )
}

// ── 13. EATGuestInsightsPanel ─────────────────────────────────────────────────

function EATGuestInsightsPanel({ customerId }) {
  return (
    <Card>
      <SectionHeader title="E.A.T. Guest Insights" sub="Value score · Churn risk · VIP alerts · Upsell signals · Service recovery" />
      <EmptyState message="E.A.T. guest insights are not connected yet." />
    </Card>
  )
}

// ── 14. SmokeCraftGuestPanel ──────────────────────────────────────────────────

function SmokeCraftGuestPanel({ customerId }) {
  return (
    <Card>
      <img src="/smokecraft-pos360.png" alt="SmokeCraft POS360" style={{ height: 28, marginBottom: 8, opacity: 0.65 }} />
      <SectionHeader title="SmokeCraft Guest Intelligence" sub="Passport · Stamps · Connections · Scorecard" />
      <EmptyState message="SmokeCraft guest intelligence is not connected yet." />
    </Card>
  )
}

// ── 15. DuplicateDetectionPanel ───────────────────────────────────────────────

function DuplicateDetectionPanel() {
  return (
    <Card>
      <SectionHeader title="Duplicate Detection" sub="Confidence scoring by phone, email, name signals" />
      <EmptyState message="No duplicate candidates detected." />
    </Card>
  )
}

// ── 16. MergeRequestPanel ─────────────────────────────────────────────────────

function MergeRequestPanel() {
  return (
    <Card>
      <SectionHeader title="Merge Requests" sub="Manager approval required" />
      <div style={{ color: AMBER, fontSize: 12, marginBottom: 8 }}>Customer merge requires manager approval.</div>
      <EmptyState message="No merge requests pending." />
    </Card>
  )
}

// ── 17. ServiceRecoveryPanel ──────────────────────────────────────────────────

function ServiceRecoveryPanel({ customerId }) {
  return (
    <Card>
      <SectionHeader title="Service Recovery" sub="Comp · Reward bonus · Apology note · Manager visit" />
      <EmptyState message="No service recovery actions on record." />
    </Card>
  )
}

// ── 18. GuestLanguageSelector ─────────────────────────────────────────────────

function GuestLanguageSelector({ value, onChange }) {
  const langs = ['en-US', 'es-DO', 'es', 'ht', 'de', 'pt']
  return (
    <Card>
      <SectionHeader title="Guest Language Preference" sub="Used for receipts, loyalty communications, and UI" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {langs.map(l => (
          <button
            key={l}
            onClick={() => onChange(l)}
            style={{ background: value === l ? GOLD : DARK_BG, color: value === l ? DARK_BG : DARK_TEXT, border: `1px solid ${DARK_LINE}`, borderRadius: 4, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}
          >
            {l}
          </button>
        ))}
      </div>
    </Card>
  )
}

// ── 19. GuestOfflineQueuePanel ────────────────────────────────────────────────

function GuestOfflineQueuePanel() {
  return (
    <Card>
      <SectionHeader title="Offline Guest Actions Queue" sub="Connects to Prompt S (offline sync engine)" />
      <EmptyState message="No offline guest actions are queued." />
    </Card>
  )
}

// ── Root Page ─────────────────────────────────────────────────────────────────

export default function POS360CustomerLoyalty() {
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [lang, setLang] = useState('en-US')
  const [activeTab, setActiveTab] = useState('profile')

  const customerId = selectedCustomer?.id

  const tabs = [
    { key: 'profile',   label: 'Profile' },
    { key: 'loyalty',   label: 'Loyalty' },
    { key: 'rewards',   label: 'Rewards' },
    { key: 'insights',  label: 'E.A.T.' },
    { key: 'smokecraft',label: 'SmokeCraft' },
    { key: 'admin',     label: 'Admin' },
  ]

  return (
    <div style={{ background: DARK_BG, minHeight: '100vh', color: DARK_TEXT, fontFamily: 'Inter, sans-serif', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <img src="/smokecraft-pos360.png" alt="SmokeCraft POS360" style={{ height: 40 }} />
        <div>
          <h1 style={{ color: GOLD, fontSize: 22, fontWeight: 700, margin: 0 }}>Customer, Loyalty & Guest Intelligence</h1>
          <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 2 }}>POS360 — Phase B.8</div>
        </div>
      </div>

      <CustomerSearchPanel onSelect={setSelectedCustomer} />

      {!selectedCustomer && (
        <div style={{ marginTop: 16, color: DARK_MUTE, fontSize: 13 }}>
          Search for a guest above to view their profile, loyalty, and rewards.
        </div>
      )}

      {selectedCustomer && (
        <>
          <div style={{ display: 'flex', gap: 8, marginTop: 20, marginBottom: 16, borderBottom: `1px solid ${DARK_LINE}`, paddingBottom: 10 }}>
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{ background: activeTab === t.key ? GOLD : 'transparent', color: activeTab === t.key ? DARK_BG : DARK_MUTE, border: 'none', borderRadius: 4, padding: '5px 14px', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === t.key ? 700 : 400 }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === 'profile' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <GuestProfilePanel customer={selectedCustomer} />
              <GuestIdentityPanel customerId={customerId} />
              <ConsentPrivacyPanel customerId={customerId} />
              <GuestLanguageSelector value={lang} onChange={setLang} />
              <GuestActivityTimelinePanel customerId={customerId} />
              <ServiceRecoveryPanel customerId={customerId} />
            </div>
          )}

          {activeTab === 'loyalty' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <LoyaltyProfilePanel customerId={customerId} />
              <TierManagementPanel />
              <PointsLedgerPanel customerId={customerId} />
              <PointsAdjustmentPanel customerId={customerId} />
            </div>
          )}

          {activeTab === 'rewards' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <RewardsCatalogPanel />
              <RewardRedemptionPanel customerId={customerId} />
              <RewardReversalPanel />
            </div>
          )}

          {activeTab === 'insights' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
              <EATGuestInsightsPanel customerId={customerId} />
            </div>
          )}

          {activeTab === 'smokecraft' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
              <SmokeCraftGuestPanel customerId={customerId} />
            </div>
          )}

          {activeTab === 'admin' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <DuplicateDetectionPanel />
              <MergeRequestPanel />
              <GuestOfflineQueuePanel />
            </div>
          )}
        </>
      )}
    </div>
  )
}
