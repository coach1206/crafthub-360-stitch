// Phase C.3 / Module 3 of 7 — NOVEE OS Billing Governance UI

import { useState } from 'react';

const NAVY     = '#0a0d14';
const CHARCOAL = '#111520';
const CARD     = '#161b27';
const LINE     = '#252d3f';
const GOLD     = '#c9952c';
const GOLD2    = '#e8b84b';
const TEXT     = '#e8e4d8';
const MUTE     = '#7a8299';
const RED      = '#c0392b';
const GREEN    = '#27ae60';
const BLUE     = '#2980b9';
const AMBER    = '#e67e22';
const PURPLE   = '#8e44ad';

const DEVICE_LINE = 'Touchscreen · Handheld · Tablet · Desktop';

const badge = (label, color) => (
  <span style={{ background: color + '22', color, border: `1px solid ${color}44`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
    {label}
  </span>
);

const sectionStyle = { background: CARD, border: `1px solid ${LINE}`, borderRadius: 8, padding: '18px 22px', marginBottom: 16 };
const labelStyle   = { color: MUTE, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 };
const valueStyle   = { color: TEXT, fontSize: 14 };
const rowStyle     = { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 };

function PanelHeader({ title, sub, badgeLabel, badgeColor }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: GOLD2, fontWeight: 800, fontSize: 15 }}>{title}</span>
        {badgeLabel && badge(badgeLabel, badgeColor || AMBER)}
      </div>
      {sub && <div style={{ color: MUTE, fontSize: 12, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function PlaceholderRow({ label, value, color }) {
  return (
    <div style={rowStyle}>
      <span style={labelStyle}>{label}</span>
      <span style={{ ...valueStyle, color: color || TEXT }}>{value}</span>
    </div>
  );
}

function BoolGuard({ label, value }) {
  return (
    <div style={rowStyle}>
      <span style={labelStyle}>{label}</span>
      {badge(value ? 'TRUE' : 'FALSE', value ? GREEN : RED)}
    </div>
  );
}

// 1. Plan Catalog Panel
function PlanCatalogPanel() {
  return (
    <div style={sectionStyle}>
      <PanelHeader title="Plan Catalog" sub="Available plans for licensing" badgeLabel="PLACEHOLDER" badgeColor={AMBER} />
      <PlaceholderRow label="Plans" value="free · starter · growth · pro · enterprise · white_label · custom" />
      <PlaceholderRow label="Status" value="available_placeholder" color={AMBER} />
      <BoolGuard label="billing_connected" value={false} />
    </div>
  );
}

// 2. Plan Tiers Panel
function PlanTiersPanel() {
  return (
    <div style={sectionStyle}>
      <PanelHeader title="Plan Tiers" sub="Tier structure within each plan" badgeLabel="PLACEHOLDER" badgeColor={AMBER} />
      <PlaceholderRow label="Tier Status" value="available_placeholder" color={AMBER} />
      <BoolGuard label="billing_connected" value={false} />
    </div>
  );
}

// 3. Plan Features Panel
function PlanFeaturesPanel() {
  return (
    <div style={sectionStyle}>
      <PanelHeader title="Plan Features" sub="Feature definitions per plan tier" badgeLabel="PLACEHOLDER" badgeColor={AMBER} />
      <PlaceholderRow label="Feature Status" value="enabled_placeholder" color={AMBER} />
    </div>
  );
}

// 4. Module Plan Gates Panel
function ModulePlanGatesPanel() {
  return (
    <div style={sectionStyle}>
      <PanelHeader title="Module Plan Gates" sub="Module access controlled by plan tier" badgeLabel="GATED" badgeColor={PURPLE} />
      <PlaceholderRow label="Gate Logic" value="blocked_plan_required" color={RED} />
      <BoolGuard label="billing_connected" value={false} />
    </div>
  );
}

// 5. Feature Access Gates Panel
function FeatureAccessGatesPanel() {
  return (
    <div style={sectionStyle}>
      <PanelHeader title="Feature Access Gates" sub="Fine-grained feature access control" badgeLabel="GATED" badgeColor={PURPLE} />
      <PlaceholderRow label="Decision" value="blocked_plan_required" color={RED} />
      <PlaceholderRow label="Gate Status" value="locked" color={RED} />
    </div>
  );
}

// 6. Trial Policies Panel
function TrialPoliciesPanel() {
  return (
    <div style={sectionStyle}>
      <PanelHeader title="Trial Policies" sub="Trial duration and conversion rules" badgeLabel="PLACEHOLDER" badgeColor={AMBER} />
      <PlaceholderRow label="Trial Status" value="not_started" color={MUTE} />
      <BoolGuard label="trial_converted" value={false} />
    </div>
  );
}

// 7. Trial Instances Panel
function TrialInstancesPanel() {
  return (
    <div style={sectionStyle}>
      <PanelHeader title="Trial Instances" sub="Active and historical trial records" badgeLabel="PLACEHOLDER" badgeColor={AMBER} />
      <PlaceholderRow label="Instance Status" value="not_started" color={MUTE} />
      <BoolGuard label="trial_converted" value={false} />
    </div>
  );
}

// 8. Grace Periods Panel
function GracePeriodsPanel() {
  return (
    <div style={sectionStyle}>
      <PanelHeader title="Grace Periods" sub="Post-expiry access window records" badgeLabel="PLACEHOLDER" badgeColor={AMBER} />
      <PlaceholderRow label="Grace Status" value="pending" color={AMBER} />
    </div>
  );
}

// 9. Organization Licenses Panel
function OrganizationLicensesPanel() {
  return (
    <div style={sectionStyle}>
      <PanelHeader title="Organization Licenses" sub="License records scoped to organizations" badgeLabel="PLACEHOLDER" badgeColor={AMBER} />
      <PlaceholderRow label="License Status" value="license_required_placeholder" color={AMBER} />
      <BoolGuard label="license_verified" value={false} />
    </div>
  );
}

// 10. Venue Licenses Panel
function VenueLicensesPanel() {
  return (
    <div style={sectionStyle}>
      <PanelHeader title="Venue Licenses" sub="License records scoped to venues" badgeLabel="PLACEHOLDER" badgeColor={AMBER} />
      <PlaceholderRow label="License Status" value="license_required_placeholder" color={AMBER} />
      <BoolGuard label="license_verified" value={false} />
    </div>
  );
}

// 11. Workspace Licenses Panel
function WorkspaceLicensesPanel() {
  return (
    <div style={sectionStyle}>
      <PanelHeader title="Workspace Licenses" sub="License records scoped to workspaces" badgeLabel="PLACEHOLDER" badgeColor={AMBER} />
      <PlaceholderRow label="License Status" value="license_required_placeholder" color={AMBER} />
      <BoolGuard label="license_verified" value={false} />
    </div>
  );
}

// 12. User Seat Allocations Panel
function UserSeatAllocationsPanel() {
  return (
    <div style={sectionStyle}>
      <PanelHeader title="User Seat Allocations" sub="Per-plan seat limit tracking" badgeLabel="PLACEHOLDER" badgeColor={AMBER} />
      <PlaceholderRow label="Seats Used" value="0 / 0 (not configured)" color={MUTE} />
    </div>
  );
}

// 13. Addon Catalog Panel
function AddonCatalogPanel() {
  return (
    <div style={sectionStyle}>
      <PanelHeader title="Addon Catalog" sub="Available addon modules and seats" badgeLabel="PLACEHOLDER" badgeColor={AMBER} />
      <PlaceholderRow label="Addon Types" value="module · seat · venue · workspace · storage · support · white_label · custom" />
      <BoolGuard label="billing_connected" value={false} />
    </div>
  );
}

// 14. Addon Assignments Panel
function AddonAssignmentsPanel() {
  return (
    <div style={sectionStyle}>
      <PanelHeader title="Addon Assignments" sub="Addons assigned to orgs/venues/workspaces" badgeLabel="PLACEHOLDER" badgeColor={AMBER} />
      <BoolGuard label="billing_connected" value={false} />
    </div>
  );
}

// 15. Entitlement Records Panel
function EntitlementRecordsPanel() {
  return (
    <div style={sectionStyle}>
      <PanelHeader title="Entitlement Records" sub="Active entitlement grants" badgeLabel="PLACEHOLDER" badgeColor={AMBER} />
      <PlaceholderRow label="Entitlement Status" value="not_active" color={RED} />
      <BoolGuard label="entitlement_active" value={false} />
    </div>
  );
}

// 16. Access Decision Records Panel
function AccessDecisionRecordsPanel() {
  return (
    <div style={sectionStyle}>
      <PanelHeader title="Access Decision Records" sub="Logged access control decisions" badgeLabel="PLACEHOLDER" badgeColor={AMBER} />
      <PlaceholderRow label="Decision Type" value="allowed_placeholder" color={AMBER} />
    </div>
  );
}

// 17. Billing Provider Profiles Panel
function BillingProviderProfilesPanel() {
  return (
    <div style={sectionStyle}>
      <PanelHeader title="Billing Provider Profiles" sub="Payment provider configuration records" badgeLabel="NOT CONNECTED" badgeColor={RED} />
      <PlaceholderRow label="Providers" value="stripe · square · clover · quickbooks · xero · manual_invoice · platform_placeholder · other" />
      <PlaceholderRow label="Status" value="not_connected" color={RED} />
      <BoolGuard label="billing_connected" value={false} />
      <BoolGuard label="provider_connected" value={false} />
    </div>
  );
}

// 18. Billing Customer Metadata Panel
function BillingCustomerMetadataPanel() {
  return (
    <div style={sectionStyle}>
      <PanelHeader title="Billing Customer Metadata" sub="Customer references for external billing" badgeLabel="PLACEHOLDER" badgeColor={AMBER} />
      <PlaceholderRow label="External Customer Ref" value="null (not connected)" color={MUTE} />
      <BoolGuard label="billing_connected" value={false} />
    </div>
  );
}

// 19. Subscription Metadata Panel
function SubscriptionMetadataPanel() {
  return (
    <div style={sectionStyle}>
      <PanelHeader title="Subscription Metadata" sub="Subscription state and interval records" badgeLabel="NOT ACTIVE" badgeColor={RED} />
      <PlaceholderRow label="Sub Status" value="not_started" color={MUTE} />
      <PlaceholderRow label="Interval" value="none" color={MUTE} />
      <BoolGuard label="subscription_active" value={false} />
    </div>
  );
}

// 20. Invoice Metadata Panel
function InvoiceMetadataPanel() {
  return (
    <div style={sectionStyle}>
      <PanelHeader title="Invoice Metadata" sub="Invoice records and payment state" badgeLabel="PLACEHOLDER" badgeColor={AMBER} />
      <PlaceholderRow label="Invoice Status" value="draft_placeholder" color={MUTE} />
      <BoolGuard label="invoice_paid" value={false} />
    </div>
  );
}

// 21. Payment Status Placeholders Panel
function PaymentStatusPlaceholdersPanel() {
  return (
    <div style={sectionStyle}>
      <PanelHeader title="Payment Status Placeholders" sub="Payment processing state — placeholder only" badgeLabel="NOT PROCESSED" badgeColor={RED} />
      <PlaceholderRow label="Payment Status" value="not_processed" color={RED} />
      <BoolGuard label="payment_processed" value={false} />
    </div>
  );
}

// 22. Upgrade/Downgrade Requests Panel
function UpgradeDowngradeRequestsPanel() {
  return (
    <div style={sectionStyle}>
      <PanelHeader title="Upgrade / Downgrade Requests" sub="Plan change request records" badgeLabel="PLACEHOLDER" badgeColor={AMBER} />
      <PlaceholderRow label="Request Status" value="draft" color={MUTE} />
      <BoolGuard label="billing_connected" value={false} />
    </div>
  );
}

// 23. Cancellation Requests Panel
function CancellationRequestsPanel() {
  return (
    <div style={sectionStyle}>
      <PanelHeader title="Cancellation Requests" sub="Subscription cancellation request records" badgeLabel="PLACEHOLDER" badgeColor={AMBER} />
      <PlaceholderRow label="Request Status" value="draft" color={MUTE} />
      <BoolGuard label="cancellation_completed" value={false} />
    </div>
  );
}

// 24. Renewal Reminder Records Panel
function RenewalReminderRecordsPanel() {
  return (
    <div style={sectionStyle}>
      <PanelHeader title="Renewal Reminder Records" sub="Upcoming renewal notification records" badgeLabel="PLACEHOLDER" badgeColor={AMBER} />
      <PlaceholderRow label="Renewal Status" value="pending" color={AMBER} />
      <BoolGuard label="renewal_charged" value={false} />
    </div>
  );
}

// 25. Marketplace Purchase Placeholders Panel
function MarketplacePurchasePlaceholdersPanel() {
  return (
    <div style={sectionStyle}>
      <PanelHeader title="Marketplace Purchase Placeholders" sub="External marketplace purchase records" badgeLabel="PLACEHOLDER" badgeColor={AMBER} />
      <PlaceholderRow label="Purchase Status" value="pending" color={AMBER} />
      <BoolGuard label="marketplace_purchase_completed" value={false} />
    </div>
  );
}

// 26. License Health Checks Panel
function LicenseHealthChecksPanel() {
  return (
    <div style={sectionStyle}>
      <PanelHeader title="License Health Checks" sub="License validity and health records" badgeLabel="PLACEHOLDER" badgeColor={AMBER} />
      <PlaceholderRow label="Health Status" value="unknown" color={MUTE} />
    </div>
  );
}

// 27. Billing Governance Snapshots Panel
function BillingGovernanceSnapshotsPanel() {
  return (
    <div style={sectionStyle}>
      <PanelHeader title="Billing Governance Snapshots" sub="Point-in-time billing state captures" badgeLabel="PLACEHOLDER" badgeColor={AMBER} />
      <PlaceholderRow label="Latest Snapshot" value="none" color={MUTE} />
    </div>
  );
}

// 28. Safe Claims Panel
function SafeClaimsPanel() {
  return (
    <div style={sectionStyle}>
      <PanelHeader title="Safe Billing Claims" sub="What this system genuinely provides" badgeLabel="VERIFIED SAFE" badgeColor={GREEN} />
      <PlaceholderRow label="Claim" value="Plan catalog schema and governance records are created and stored safely." color={GREEN} />
      <PlaceholderRow label="Claim" value="All billing state is tracked as placeholder until a real provider is connected." color={GREEN} />
      <PlaceholderRow label="Claim" value="No secrets, no credentials, no financial data are stored in this layer." color={GREEN} />
      <BoolGuard label="contains_secrets" value={false} />
      <BoolGuard label="stores_secrets" value={false} />
    </div>
  );
}

// 29. Unsafe Claims Panel
function UnsafeClaimsPanel() {
  return (
    <div style={sectionStyle}>
      <PanelHeader title="Unsafe Billing Claims" sub="What this system does NOT provide" badgeLabel="NOT LIVE" badgeColor={RED} />
      <PlaceholderRow label="Not Live" value="Real Stripe connection" color={RED} />
      <PlaceholderRow label="Not Live" value="Real payment processing" color={RED} />
      <PlaceholderRow label="Not Live" value="Real subscription activation" color={RED} />
      <PlaceholderRow label="Not Live" value="Real invoice payment" color={RED} />
      <PlaceholderRow label="Not Live" value="Real license verification" color={RED} />
      <PlaceholderRow label="Not Live" value="Real marketplace purchase" color={RED} />
      <PlaceholderRow label="Not Live" value="Real trial conversion" color={RED} />
      <PlaceholderRow label="Not Live" value="Real cancellation completion" color={RED} />
      <PlaceholderRow label="Not Live" value="Real renewal charge" color={RED} />
      <PlaceholderRow label="Not Live" value="Real entitlement activation beyond placeholder records" color={RED} />
    </div>
  );
}

// 30. Honest Limitations Panel
function HonestLimitationsPanel() {
  return (
    <div style={sectionStyle}>
      <PanelHeader title="Honest Limitations" sub="Transparency about current system boundaries" badgeLabel="HONEST" badgeColor={BLUE} />
      <PlaceholderRow label="Limitation" value="Billing provider must be connected externally before any live transactions can occur." color={AMBER} />
      <PlaceholderRow label="Limitation" value="All subscription, invoice, payment, and entitlement states are placeholder until provider activation." color={AMBER} />
      <PlaceholderRow label="Limitation" value="License verification requires external provider integration." color={AMBER} />
    </div>
  );
}

// 31. Phase Roadmap Panel
function PhaseRoadmapPanel() {
  return (
    <div style={sectionStyle}>
      <PanelHeader title="Phase Roadmap" sub="NOVEE OS implementation progress" badgeLabel="C.3 CURRENT" badgeColor={GOLD} />
      <PlaceholderRow label="C.1" value="Module Registry — COMPLETE" color={GREEN} />
      <PlaceholderRow label="C.2" value="Tenant / Venue / Org / Workspace Governance — COMPLETE" color={GREEN} />
      <PlaceholderRow label="C.3" value="Licensing, Plans, Trials, Billing Gates — CURRENT" color={GOLD2} />
      <PlaceholderRow label="C.4" value="Next Phase — PENDING" color={MUTE} />
      <PlaceholderRow label="C.5–C.7" value="Future Phases — PENDING" color={MUTE} />
    </div>
  );
}

// 32. Billing Audit Panel
function BillingAuditPanel() {
  return (
    <div style={sectionStyle}>
      <PanelHeader title="Billing Audit" sub="Immutable audit trail for billing governance actions" badgeLabel="AUDIT" badgeColor={BLUE} />
      <PlaceholderRow label="Audit Records" value="Stored per governance action. No secrets in audit rows." color={TEXT} />
      <BoolGuard label="contains_secrets" value={false} />
    </div>
  );
}

// 33. Billing Governance Summary Panel
function BillingGovernanceSummaryPanel() {
  return (
    <div style={{ ...sectionStyle, border: `1px solid ${GOLD}44` }}>
      <PanelHeader title="Billing Governance Summary" sub="Phase C.3 / Module 3 of 7 — NOVEE OS" badgeLabel="MODULE 3 OF 7" badgeColor={GOLD} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><span style={labelStyle}>Tables</span><span style={valueStyle}>28</span></div>
        <div><span style={labelStyle}>Feature Flags</span><span style={valueStyle}>46</span></div>
        <div><span style={labelStyle}>Service Methods</span><span style={valueStyle}>70+</span></div>
        <div><span style={labelStyle}>API Routes</span><span style={valueStyle}>80+</span></div>
        <div><span style={labelStyle}>Locales</span><span style={valueStyle}>6</span></div>
        <div><span style={labelStyle}>Live Billing</span>{badge('NOT CONNECTED', RED)}</div>
      </div>
      <div style={{ marginTop: 14, color: MUTE, fontSize: 12, fontFamily: 'monospace' }}>{DEVICE_LINE}</div>
    </div>
  );
}

// Tab navigation
const TABS = [
  { key: 'plans',     label: 'Plans & Tiers' },
  { key: 'licenses',  label: 'Licenses' },
  { key: 'billing',   label: 'Billing' },
  { key: 'requests',  label: 'Requests' },
  { key: 'claims',    label: 'Claims & Audit' },
];

function NoveeOSBillingGovernance() {
  const [tab, setTab] = useState('plans');

  return (
    <div style={{ background: NAVY, minHeight: '100vh', color: TEXT, fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: CHARCOAL, borderBottom: `1px solid ${LINE}`, padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: GOLD2, fontWeight: 900, fontSize: 18, letterSpacing: 1 }}>NOVEE OS — BILLING GOVERNANCE</div>
          <div style={{ color: MUTE, fontSize: 12, marginTop: 3 }}>Phase C.3 / Module 3 of 7 — Licensing, Plans, Trials, Billing Gates & Feature Access</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {badge('NOT CONNECTED', RED)}
          {badge('PLACEHOLDER', AMBER)}
          {badge('MODULE 3 OF 7', GOLD)}
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ background: CHARCOAL, borderBottom: `1px solid ${LINE}`, padding: '0 28px', display: 'flex', gap: 0 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '12px 18px', fontSize: 13, fontWeight: 700,
              color: tab === t.key ? GOLD2 : MUTE,
              borderBottom: tab === t.key ? `2px solid ${GOLD2}` : '2px solid transparent',
              transition: 'color 0.15s'
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '24px 28px', maxWidth: 980 }}>
        <BillingGovernanceSummaryPanel />

        {tab === 'plans' && <>
          <PlanCatalogPanel />
          <PlanTiersPanel />
          <PlanFeaturesPanel />
          <ModulePlanGatesPanel />
          <FeatureAccessGatesPanel />
          <TrialPoliciesPanel />
          <TrialInstancesPanel />
          <GracePeriodsPanel />
        </>}

        {tab === 'licenses' && <>
          <OrganizationLicensesPanel />
          <VenueLicensesPanel />
          <WorkspaceLicensesPanel />
          <UserSeatAllocationsPanel />
          <AddonCatalogPanel />
          <AddonAssignmentsPanel />
          <EntitlementRecordsPanel />
          <AccessDecisionRecordsPanel />
          <LicenseHealthChecksPanel />
        </>}

        {tab === 'billing' && <>
          <BillingProviderProfilesPanel />
          <BillingCustomerMetadataPanel />
          <SubscriptionMetadataPanel />
          <InvoiceMetadataPanel />
          <PaymentStatusPlaceholdersPanel />
          <BillingGovernanceSnapshotsPanel />
        </>}

        {tab === 'requests' && <>
          <UpgradeDowngradeRequestsPanel />
          <CancellationRequestsPanel />
          <RenewalReminderRecordsPanel />
          <MarketplacePurchasePlaceholdersPanel />
        </>}

        {tab === 'claims' && <>
          <SafeClaimsPanel />
          <UnsafeClaimsPanel />
          <HonestLimitationsPanel />
          <BillingAuditPanel />
          <PhaseRoadmapPanel />
        </>}
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${LINE}`, padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: MUTE, fontSize: 11 }}>NOVEE OS · Phase C.3 · Module 3 of 7 · Licensing / Plans / Billing Gates</span>
        <span style={{ color: MUTE, fontSize: 11, fontFamily: 'monospace' }}>{DEVICE_LINE}</span>
      </div>
    </div>
  );
}

export default NoveeOSBillingGovernance;
