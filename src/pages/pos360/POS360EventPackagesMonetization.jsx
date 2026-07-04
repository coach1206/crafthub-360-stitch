import React, { useState } from 'react'

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

const s = {
  page: { background: DARK_BG, minHeight: '100vh', color: DARK_TEXT, fontFamily: 'system-ui, sans-serif', padding: '0' },
  header: { background: DARK_CARD, borderBottom: `1px solid ${DARK_LINE}`, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  logo: { width: 36, height: 36, borderRadius: 8, objectFit: 'cover' },
  headerTitle: { fontSize: 18, fontWeight: 700, color: DARK_TEXT, margin: 0 },
  headerSub: { fontSize: 12, color: DARK_MUTE, margin: 0 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, padding: 20 },
  card: { background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: 700, color: GOLD, margin: 0 },
  cardSub: { fontSize: 12, color: DARK_MUTE, margin: 0 },
  badge: (color) => ({ display: 'inline-block', background: color + '22', color, border: `1px solid ${color}44`, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }),
  row: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  honestBox: { background: '#1a1400', border: `1px solid ${AMBER}44`, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: AMBER },
  blockedBox: { background: '#1a0800', border: `1px solid ${RED}44`, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: RED },
  greenBox: { background: '#001a06', border: `1px solid ${GREEN}44`, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: GREEN },
  blueBox: { background: '#001020', border: `1px solid ${BLUE}44`, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: BLUE },
  divider: { borderTop: `1px solid ${DARK_LINE}`, margin: '8px 0' },
  label: { fontSize: 11, color: DARK_MUTE, textTransform: 'uppercase', letterSpacing: 1 },
  val: { fontSize: 14, color: DARK_TEXT, fontWeight: 600 },
  navTabs: { display: 'flex', gap: 4, padding: '12px 20px 0', flexWrap: 'wrap' },
  tab: (active) => ({ background: active ? GOLD : 'transparent', color: active ? '#000' : DARK_MUTE, border: `1px solid ${active ? GOLD : DARK_LINE}`, borderRadius: '8px 8px 0 0', padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }),
}

function HonestEmptyStatePanel({ message, icon = '📭' }) {
  return (
    <div style={s.honestBox}>
      <span style={{ marginRight: 6 }}>{icon}</span>{message}
    </div>
  )
}

function HonestPaymentProviderStatePanel() {
  return (
    <div style={s.honestBox}>
      Payment provider is not connected. No charges have been processed. Deposits are tracked as records only.
    </div>
  )
}

function HonestContractProviderStatePanel() {
  return (
    <div style={s.honestBox}>
      Contract provider is not connected. No contract has been sent or signed through this system. Contract status is tracked as a placeholder.
    </div>
  )
}

function EventPackageDashboard({ onNav }) {
  const areas = [
    { key: 'catalog', label: 'Package Catalog', icon: '📦', desc: 'Kitchen, bar, humidor, patio, lounge, room, service, entertainment, custom' },
    { key: 'deposits', label: 'Deposits', icon: '💵', desc: 'Track deposit records and policies. No payment processed.' },
    { key: 'minspend', label: 'Minimum Spend', icon: '📊', desc: 'Set and track minimum spend rules per private event.' },
    { key: 'contracts', label: 'Contract Status', icon: '📋', desc: 'Contract snapshots. No signing via this system.' },
    { key: 'approvals', label: 'Manager Approvals', icon: '✅', desc: 'Discounts, waivers, overrides, custom packages.' },
    { key: 'forecasts', label: 'Inventory Forecast', icon: '🔮', desc: 'Kitchen, bar, humidor demand planning. Not reserved.' },
    { key: 'poslinks', label: 'POS Order Links', icon: '🔗', desc: 'Link POS orders toward minimum spend.' },
    { key: 'insights', label: 'E.A.T. Monetization', icon: '🧠', desc: 'Insight hooks. Not connected yet.' },
    { key: 'offline', label: 'Offline Queue', icon: '📡', desc: 'Queue actions when connectivity is limited.' },
  ]
  return (
    <div>
      <div style={{ padding: '16px 20px 4px', fontSize: 13, color: DARK_MUTE }}>
        POS360 Event Revenue Command Layer — select an area to manage
      </div>
      <div style={s.grid}>
        {areas.map(a => (
          <div key={a.key} style={{ ...s.card, cursor: 'pointer', borderColor: DARK_LINE }}
            onClick={() => onNav(a.key)}>
            <div style={{ fontSize: 24 }}>{a.icon}</div>
            <p style={s.cardTitle}>{a.label}</p>
            <p style={s.cardSub}>{a.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PackageCategoryPanel() {
  const categories = [
    { type: 'kitchen', label: 'Kitchen Packages', icon: '🍽️' },
    { type: 'bar', label: 'Bar Packages', icon: '🍸' },
    { type: 'humidor', label: 'Humidor Packages', icon: '🚬' },
    { type: 'cigar', label: 'Cigar Packages', icon: '💨' },
    { type: 'lounge', label: 'Lounge Packages', icon: '🛋️' },
    { type: 'patio', label: 'Patio Packages', icon: '🌿' },
    { type: 'room', label: 'Room Packages', icon: '🚪' },
    { type: 'service', label: 'Service Packages', icon: '🤵' },
    { type: 'entertainment', label: 'Entertainment Packages', icon: '🎶' },
    { type: 'custom', label: 'Custom Package', icon: '⚙️' },
  ]
  return (
    <div style={s.card}>
      <p style={s.cardTitle}>Package Categories</p>
      <p style={s.cardSub}>Configure which package types are active for this venue.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginTop: 4 }}>
        {categories.map(c => (
          <div key={c.type} style={{ background: DARK_BG, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 18 }}>{c.icon}</span>
            <span style={{ fontSize: 12, color: DARK_TEXT, fontWeight: 600 }}>{c.label}</span>
          </div>
        ))}
      </div>
      <HonestEmptyStatePanel message="No package categories have been created for this venue yet." icon="📦" />
    </div>
  )
}

function PackageCatalogPanel() {
  return (
    <div style={s.card}>
      <p style={s.cardTitle}>Event Package Catalog</p>
      <p style={s.cardSub}>All active packages available for private event selection.</p>
      <div style={s.row}>
        <span style={s.badge(GOLD)}>Flat Fee</span>
        <span style={s.badge(BLUE)}>Per Person</span>
        <span style={s.badge(AMBER)}>Minimum Spend</span>
        <span style={s.badge(DARK_MUTE)}>Custom Quote</span>
      </div>
      <HonestEmptyStatePanel message="No event packages are configured for this venue. Create packages in the Package Builder." icon="📦" />
    </div>
  )
}

function PackageBuilderPanel() {
  return (
    <div style={s.card}>
      <p style={s.cardTitle}>Package Builder</p>
      <p style={s.cardSub}>Build kitchen, bar, humidor, patio, lounge, room, service, entertainment, and custom packages.</p>
      <div style={s.divider} />
      <div style={s.label}>Pricing Model</div>
      <div style={s.row}>
        {['Flat Fee', 'Per Person', 'Tiered', 'Minimum Spend', 'Custom Quote'].map(m => (
          <span key={m} style={s.badge(GOLD)}>{m}</span>
        ))}
      </div>
      <div style={s.label}>Package Requires Manager Approval</div>
      <div style={s.row}>
        <span style={s.badge(AMBER)}>Configurable per package</span>
      </div>
      <HonestEmptyStatePanel message="No packages created. Packages are venue-configurable and not hardcoded." icon="⚙️" />
    </div>
  )
}

function PackageItemPanel() {
  return (
    <div style={s.card}>
      <p style={s.cardTitle}>Package Items</p>
      <p style={s.cardSub}>Configure food, beverage, cigar, humidor, room, staffing, entertainment, and service items per package.</p>
      <div style={s.row}>
        {['Food', 'Beverage', 'Cigar', 'Humidor', 'Room', 'Staffing', 'Entertainment', 'Service'].map(t => (
          <span key={t} style={s.badge(DARK_MUTE)}>{t}</span>
        ))}
      </div>
      <HonestEmptyStatePanel message="No items configured for this package." icon="📋" />
    </div>
  )
}

function PricingRulesPanel() {
  return (
    <div style={s.card}>
      <p style={s.cardTitle}>Pricing Rules</p>
      <p style={s.cardSub}>Guest count, date/time, day of week, season, room, custom, and manager override rules.</p>
      <HonestEmptyStatePanel message="No pricing rules configured. Pricing rules are venue-configurable." icon="📐" />
    </div>
  )
}

function PackageQuotePanel() {
  return (
    <div style={s.card}>
      <p style={s.cardTitle}>Package Quote</p>
      <p style={s.cardSub}>Estimated price for a package based on guest count and pricing rules.</p>
      <div style={s.honestBox}>
        Package quotes are estimates only. No payment has been processed. Final pricing requires manager confirmation.
      </div>
    </div>
  )
}

function PrivateEventPackageSelectionPanel() {
  return (
    <div style={s.card}>
      <p style={s.cardTitle}>Private Event Package Selection</p>
      <p style={s.cardSub}>Select packages for a private event. Links to Prompt V private events.</p>
      <HonestEmptyStatePanel message="No package selections for this event. Select a package from the catalog." icon="🎉" />
    </div>
  )
}

function DepositPolicyPanel() {
  return (
    <div style={s.card}>
      <p style={s.cardTitle}>Deposit Policies</p>
      <p style={s.cardSub}>Flat fee, percent-of-total, per-person, or custom deposit policies.</p>
      <HonestPaymentProviderStatePanel />
      <HonestEmptyStatePanel message="No deposit policies configured." icon="📝" />
    </div>
  )
}

function DepositTrackingPanel() {
  const statuses = [
    { key: 'not_required', label: 'Not Required', color: DARK_MUTE },
    { key: 'pending', label: 'Pending', color: AMBER },
    { key: 'marked_paid_external', label: 'Marked Paid Externally', color: GREEN },
    { key: 'waived', label: 'Waived', color: BLUE },
    { key: 'refunded_external', label: 'Refunded Externally', color: AMBER },
    { key: 'failed', label: 'Failed', color: RED },
    { key: 'cancelled', label: 'Cancelled', color: RED },
  ]
  return (
    <div style={s.card}>
      <p style={s.cardTitle}>Deposit Tracking</p>
      <p style={s.cardSub}>Track deposit records per private event.</p>
      <div style={s.row}>
        {statuses.map(st => <span key={st.key} style={s.badge(st.color)}>{st.label}</span>)}
      </div>
      <HonestPaymentProviderStatePanel />
      <HonestEmptyStatePanel message="No deposit records for this event." icon="💵" />
    </div>
  )
}

function DepositApprovalPanel() {
  return (
    <div style={s.card}>
      <p style={s.cardTitle}>Deposit Approvals</p>
      <p style={s.cardSub}>Manager-level approval for deposit waivers and refunds.</p>
      <div style={s.blockedBox}>
        Deposit waiver and refund require manager approval. No refund has been processed through this system.
      </div>
      <HonestEmptyStatePanel message="No pending deposit approvals." icon="✅" />
    </div>
  )
}

function MinimumSpendPanel() {
  return (
    <div style={s.card}>
      <p style={s.cardTitle}>Minimum Spend</p>
      <p style={s.cardSub}>Set minimum spend requirements per private event.</p>
      <div style={s.row}>
        <span style={s.badge(AMBER)}>Total Event</span>
        <span style={s.badge(DARK_MUTE)}>Food Only</span>
        <span style={s.badge(DARK_MUTE)}>Beverage Only</span>
        <span style={s.badge(DARK_MUTE)}>Package Only</span>
      </div>
      <HonestEmptyStatePanel message="No minimum spend rule set for this event." icon="📊" />
    </div>
  )
}

function MinimumSpendProgressPanel() {
  return (
    <div style={s.card}>
      <p style={s.cardTitle}>Minimum Spend Progress</p>
      <p style={s.cardSub}>Track linked POS orders and manager manual credits toward minimum spend.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={s.row}><span style={s.label}>Minimum:</span><span style={s.val}>—</span></div>
        <div style={s.row}><span style={s.label}>POS Orders Linked:</span><span style={s.val}>$0.00</span></div>
        <div style={s.row}><span style={s.label}>Manual Credit:</span><span style={s.val}>$0.00</span></div>
        <div style={s.row}><span style={s.label}>Remaining:</span><span style={s.val}>—</span></div>
        <div style={s.row}><span style={s.label}>Satisfied:</span><span style={s.badge(RED)}>Not Satisfied</span></div>
      </div>
      <div style={s.honestBox}>
        Minimum spend is not satisfied. No linked POS orders. No manager credit applied.
      </div>
    </div>
  )
}

function ContractTemplatePanel() {
  return (
    <div style={s.card}>
      <p style={s.cardTitle}>Contract Templates</p>
      <p style={s.cardSub}>Manage reusable contract templates for private events.</p>
      <HonestContractProviderStatePanel />
      <HonestEmptyStatePanel message="No contract templates configured." icon="📄" />
    </div>
  )
}

function ContractSnapshotPanel() {
  const statuses = [
    { key: 'draft', label: 'Draft', color: DARK_MUTE },
    { key: 'generated_placeholder', label: 'Generated (Placeholder)', color: AMBER },
    { key: 'sent_external', label: 'Sent Externally', color: BLUE },
    { key: 'viewed_external', label: 'Viewed Externally', color: BLUE },
    { key: 'signed_external', label: 'Signed Externally', color: GREEN },
    { key: 'declined_external', label: 'Declined', color: RED },
    { key: 'expired', label: 'Expired', color: RED },
  ]
  return (
    <div style={s.card}>
      <p style={s.cardTitle}>Contract Snapshots</p>
      <p style={s.cardSub}>Snapshot of terms, cancellation policy, deposit policy, and package selection at time of contract generation.</p>
      <div style={s.row}>
        {statuses.map(st => <span key={st.key} style={s.badge(st.color)}>{st.label}</span>)}
      </div>
      <HonestContractProviderStatePanel />
    </div>
  )
}

function ContractStatusPanel() {
  return (
    <div style={s.card}>
      <p style={s.cardTitle}>Contract Status</p>
      <p style={s.cardSub}>Track contract lifecycle per private event.</p>
      <div style={s.honestBox}>
        Contract signing must be completed through an external contract provider. No contract has been signed through this system.
      </div>
      <HonestEmptyStatePanel message="No contracts for this event." icon="📋" />
    </div>
  )
}

function CancellationPolicyPanel() {
  return (
    <div style={s.card}>
      <p style={s.cardTitle}>Cancellation Policies</p>
      <p style={s.cardSub}>None, flat fee, percent of total, forfeited deposit, or custom cancellation fee policies.</p>
      <HonestEmptyStatePanel message="No cancellation policies configured for this venue." icon="❌" />
    </div>
  )
}

function ApprovalRequestPanel() {
  const types = [
    { key: 'package_discount', label: 'Package Discount' },
    { key: 'custom_package', label: 'Custom Package' },
    { key: 'deposit_waiver', label: 'Deposit Waiver' },
    { key: 'deposit_refund', label: 'Deposit Refund' },
    { key: 'minimum_spend_override', label: 'Minimum Spend Override' },
    { key: 'signed_contract_change', label: 'Signed Contract Change' },
    { key: 'cancellation_fee_waiver', label: 'Cancellation Fee Waiver' },
    { key: 'package_price_override', label: 'Package Price Override' },
  ]
  return (
    <div style={s.card}>
      <p style={s.cardTitle}>Manager Approval Requests</p>
      <p style={s.cardSub}>All protected operations require manager decision before proceeding.</p>
      <div style={s.row}>
        {types.map(t => <span key={t.key} style={s.badge(AMBER)}>{t.label}</span>)}
      </div>
      <div style={s.blockedBox}>
        Protected operations are blocked until a manager approves or rejects the request.
      </div>
      <HonestEmptyStatePanel message="No pending approval requests." icon="✅" />
    </div>
  )
}

function InventoryForecastPanel() {
  return (
    <div style={s.card}>
      <p style={s.cardTitle}>Inventory Forecast</p>
      <p style={s.cardSub}>Demand planning for kitchen, bar, humidor, cigar, staffing, supplies, and room resources.</p>
      <div style={s.honestBox}>
        Inventory forecast only. No inventory has been reserved. Forecasts are planning estimates and do not affect live inventory.
      </div>
      <HonestEmptyStatePanel message="No inventory forecasts for this event." icon="🔮" />
    </div>
  )
}

function KitchenPackageForecastPanel() {
  return (
    <div style={s.card}>
      <p style={s.cardTitle}>Kitchen Package Forecast</p>
      <p style={s.cardSub}>Estimated kitchen demand for event package food items.</p>
      <div style={s.honestBox}>
        Kitchen demand forecast only. No kitchen orders have been placed or confirmed.
      </div>
    </div>
  )
}

function BarPackageForecastPanel() {
  return (
    <div style={s.card}>
      <p style={s.cardTitle}>Bar Package Forecast</p>
      <p style={s.cardSub}>Estimated bar demand for event package beverage items.</p>
      <div style={s.honestBox}>
        Bar demand forecast only. No bar orders have been placed or confirmed.
      </div>
    </div>
  )
}

function HumidorPackageForecastPanel() {
  return (
    <div style={s.card}>
      <p style={s.cardTitle}>Humidor Package Forecast</p>
      <p style={s.cardSub}>Estimated humidor and cigar demand for event packages.</p>
      <div style={s.honestBox}>
        Humidor demand forecast only. No cigar inventory has been reserved.
      </div>
    </div>
  )
}

function POSOrderLinkPanel() {
  return (
    <div style={s.card}>
      <p style={s.cardTitle}>POS Order Links</p>
      <p style={s.cardSub}>Link POS orders from this event to count toward minimum spend tracking.</p>
      <div style={s.honestBox}>
        POS order link integration is not connected yet. Order totals must be confirmed before counting toward minimum spend.
      </div>
      <HonestEmptyStatePanel message="No POS orders linked to this event yet." icon="🔗" />
    </div>
  )
}

function EATMonetizationInsightsPanel() {
  const insightTypes = [
    'Package Revenue', 'Deposit Risk', 'Minimum Spend Risk', 'Event Profitability',
    'Kitchen Demand', 'Bar Demand', 'Humidor Demand', 'Cigar Demand',
    'Staffing Demand', 'Cancellation Risk', 'Service Recovery Risk', 'Upsell Opportunity',
  ]
  return (
    <div style={s.card}>
      <p style={s.cardTitle}>E.A.T. Monetization Insights</p>
      <p style={s.cardSub}>AI-powered event revenue intelligence. Not connected yet.</p>
      <div style={s.row}>
        {insightTypes.map(t => <span key={t} style={s.badge(DARK_MUTE)}>{t}</span>)}
      </div>
      <div style={s.honestBox}>
        E.A.T. monetization insights are not connected yet. No AI content has been generated. Insight hooks are ready for future E.A.T. integration.
      </div>
    </div>
  )
}

function OfflineEventPackageQueuePanel() {
  return (
    <div style={s.card}>
      <p style={s.cardTitle}>Offline Queue</p>
      <p style={s.cardSub}>Package selections, deposit updates, contract status, and manager approvals can be queued when connectivity is limited.</p>
      <div style={s.blueBox}>
        Offline actions are queued for sync. Actions will be replayed when connectivity is restored.
      </div>
      <HonestEmptyStatePanel message="No offline actions queued." icon="📡" />
    </div>
  )
}

function EventPackageLanguageSelector({ current, onChange }) {
  const langs = ['en-US', 'es-DO', 'es', 'ht', 'de', 'pt']
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {langs.map(l => (
        <button key={l} onClick={() => onChange(l)}
          style={{ ...s.badge(current === l ? GOLD : DARK_MUTE), cursor: 'pointer', border: `1px solid ${current === l ? GOLD : DARK_LINE}` }}>
          {l}
        </button>
      ))}
    </div>
  )
}

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'catalog', label: 'Packages' },
  { key: 'deposits', label: 'Deposits' },
  { key: 'minspend', label: 'Min Spend' },
  { key: 'contracts', label: 'Contracts' },
  { key: 'approvals', label: 'Approvals' },
  { key: 'forecasts', label: 'Forecasts' },
  { key: 'poslinks', label: 'POS Links' },
  { key: 'insights', label: 'E.A.T.' },
  { key: 'offline', label: 'Offline' },
]

export default function POS360EventPackagesMonetization() {
  const [tab, setTab] = useState('dashboard')
  const [lang, setLang] = useState('en-US')

  return (
    <div style={s.page}>
      <div style={s.header}>
        <img src="/smokecraft-pos360.png" alt="POS360" style={s.logo} />
        <div>
          <p style={s.headerTitle}>POS360 — Event Packages & Monetization</p>
          <p style={s.headerSub}>Touchscreen · Handheld · Tablet · Desktop · Revenue Command Layer</p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <EventPackageLanguageSelector current={lang} onChange={setLang} />
        </div>
      </div>

      <div style={s.navTabs}>
        {TABS.map(t => (
          <button key={t.key} style={s.tab(tab === t.key)} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 0 }}>
        {tab === 'dashboard' && (
          <EventPackageDashboard onNav={setTab} />
        )}
        {tab === 'catalog' && (
          <div style={s.grid}>
            <PackageCategoryPanel />
            <PackageCatalogPanel />
            <PackageBuilderPanel />
            <PackageItemPanel />
            <PricingRulesPanel />
            <PackageQuotePanel />
            <PrivateEventPackageSelectionPanel />
          </div>
        )}
        {tab === 'deposits' && (
          <div style={s.grid}>
            <DepositPolicyPanel />
            <DepositTrackingPanel />
            <DepositApprovalPanel />
            <HonestPaymentProviderStatePanel />
          </div>
        )}
        {tab === 'minspend' && (
          <div style={s.grid}>
            <MinimumSpendPanel />
            <MinimumSpendProgressPanel />
          </div>
        )}
        {tab === 'contracts' && (
          <div style={s.grid}>
            <ContractTemplatePanel />
            <ContractSnapshotPanel />
            <ContractStatusPanel />
            <CancellationPolicyPanel />
            <HonestContractProviderStatePanel />
          </div>
        )}
        {tab === 'approvals' && (
          <div style={s.grid}>
            <ApprovalRequestPanel />
          </div>
        )}
        {tab === 'forecasts' && (
          <div style={s.grid}>
            <InventoryForecastPanel />
            <KitchenPackageForecastPanel />
            <BarPackageForecastPanel />
            <HumidorPackageForecastPanel />
          </div>
        )}
        {tab === 'poslinks' && (
          <div style={s.grid}>
            <POSOrderLinkPanel />
          </div>
        )}
        {tab === 'insights' && (
          <div style={s.grid}>
            <EATMonetizationInsightsPanel />
          </div>
        )}
        {tab === 'offline' && (
          <div style={s.grid}>
            <OfflineEventPackageQueuePanel />
          </div>
        )}
      </div>

      <div style={{ padding: '12px 20px', borderTop: `1px solid ${DARK_LINE}`, display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: DARK_MUTE }}>
        <span>POS360 Event Packages</span>
        <span>·</span>
        <img src="/smokecraft-pos360.png" alt="" style={{ width: 16, height: 16, borderRadius: 4, verticalAlign: 'middle' }} />
        <span>Revenue Command Layer</span>
        <span>·</span>
        <span>Deposit records only — no payment processed</span>
        <span>·</span>
        <span>Contract placeholder — no signing via this system</span>
        <span>·</span>
        <span>Inventory forecast only — not reserved</span>
      </div>
    </div>
  )
}
