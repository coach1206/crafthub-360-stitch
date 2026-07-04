import { useState } from 'react';

// ─── NOVEE OS Design Tokens ───────────────────────────────────────────────────
const NAVY    = '#0a0d14';
const CHARCOAL = '#111520';
const CARD    = '#161b27';
const LINE    = '#252d3f';
const GOLD    = '#c9952c';
const GOLD2   = '#e8b84b';
const TEXT    = '#e8e4d8';
const MUTE    = '#7a8299';
const RED     = '#c0392b';
const GREEN   = '#27ae60';
const BLUE    = '#2980b9';
const AMBER   = '#e67e22';
const PURPLE  = '#8e44ad';

const DEVICE_LINE = 'Touchscreen · Handheld · Tablet · Desktop';

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { key: 'dashboard',         label: 'Dashboard' },
  { key: 'organizations',     label: 'Organizations' },
  { key: 'org-profile',       label: 'Org Profile' },
  { key: 'venue-groups',      label: 'Venue Groups' },
  { key: 'venues',            label: 'Venues' },
  { key: 'venue-profile',     label: 'Venue Profile' },
  { key: 'workspaces',        label: 'Workspaces' },
  { key: 'memberships',       label: 'Memberships' },
  { key: 'roles',             label: 'Workspace Roles' },
  { key: 'boundaries',        label: 'Access Boundaries' },
  { key: 'business-units',    label: 'Business Units' },
  { key: 'departments',       label: 'Departments' },
  { key: 'locations',         label: 'Locations' },
  { key: 'env-modes',         label: 'Environment Modes' },
  { key: 'demo-live',         label: 'Demo / Live Mode' },
  { key: 'module-ws-avail',   label: 'Module Workspace Avail.' },
  { key: 'module-venue-avail', label: 'Module Venue Avail.' },
  { key: 'module-org-avail',  label: 'Module Org Avail.' },
  { key: 'data-boundary',     label: 'Data Boundaries' },
  { key: 'health',            label: 'Tenant Health' },
  { key: 'readiness',         label: 'Workspace Readiness' },
  { key: 'snapshot',          label: 'Governance Snapshot' },
  { key: 'safe-claims',       label: 'Safe Claims' },
  { key: 'unsafe-claims',     label: 'Unsafe Claims' },
  { key: 'limitations',       label: 'Honest Limitations' },
  { key: 'roadmap',           label: 'Roadmap' },
  { key: 'language',          label: 'Language' },
  { key: 'no-secrets',        label: 'No Secrets' },
  { key: 'private-data',      label: 'Private Data' },
  { key: 'financial-data',    label: 'Financial Data' },
  { key: 'tenant-isolation',  label: 'Tenant Isolation' },
  { key: 'ws-provisioning',   label: 'Workspace Provisioning' },
  { key: 'venue-deployment',  label: 'Venue Deployment' },
  { key: 'live-mode',         label: 'Live Mode' },
  { key: 'provider-state',    label: 'Provider State' },
  { key: 'billing-state',     label: 'Billing State' },
  { key: 'license-state',     label: 'License State' },
  { key: 'empty-state',       label: 'Empty State' },
];

const ROADMAP = [
  { phase: 'C.1', module: 1, title: 'Module Registry & Platform Control', status: 'complete' },
  { phase: 'C.2', module: 2, title: 'Tenant / Venue / Workspace Governance', status: 'current' },
  { phase: 'C.3', module: 3, title: 'Licensing, Plans, Trials & Billing Gates', status: 'next' },
  { phase: 'C.4', module: 4, title: 'User Roles, Permissions & Admin Security', status: 'pending' },
  { phase: 'C.5', module: 5, title: 'CraftHub Launcher & Navigation Shell', status: 'pending' },
  { phase: 'C.6', module: 6, title: 'Venue Onboarding Wizard & Readiness Flow', status: 'pending' },
  { phase: 'C.7', module: 7, title: 'Final Platform Audit & Launch Lock', status: 'pending' },
];

// ─── Shared primitives ────────────────────────────────────────────────────────
const statusColor = s => {
  if (!s) return MUTE;
  if (s.includes('active') || s.includes('complete') || s === 'current') return GREEN;
  if (s.includes('pending') || s.includes('next') || s.includes('placeholder')) return AMBER;
  if (s.includes('draft') || s.includes('not_checked') || s === 'unknown') return MUTE;
  if (s.includes('suspended') || s.includes('blocked') || s.includes('failed')) return RED;
  if (s.includes('disabled') || s.includes('unavailable') || s.includes('removed')) return MUTE;
  return BLUE;
};

function StatusBadge({ status, label }) {
  const color = statusColor(status);
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.04em',
      background: `${color}22`,
      color,
      border: `1px solid ${color}44`,
    }}>{label || status}</span>
  );
}

function GuardBadge({ label = 'canAccessPOS3 REQUIRED', color = RED }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 11,
      fontWeight: 600, letterSpacing: '0.04em',
      background: `${color}22`, color, border: `1px solid ${color}44`,
    }}>{label}</span>
  );
}

function SectionHeader({ title, subtitle, badge }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h2 style={{ color: GOLD, fontSize: 18, fontWeight: 700, letterSpacing: '0.04em', margin: 0 }}>{title}</h2>
        {badge && <GuardBadge label={badge} />}
      </div>
      {subtitle && <p style={{ color: MUTE, fontSize: 13, margin: '6px 0 0' }}>{subtitle}</p>}
    </div>
  );
}

function InfoRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 0', borderBottom: `1px solid ${LINE}` }}>
      <span style={{ color: MUTE, fontSize: 13 }}>{label}</span>
      <span style={{ color: color || TEXT, fontSize: 13, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function BoolRow({ label, value, trueColor = RED, falseColor = GREEN, trueLabel, falseLabel }) {
  const color = value ? trueColor : falseColor;
  const display = value ? (trueLabel || 'YES') : (falseLabel || 'NO');
  return <InfoRow label={label} value={display} color={color} />;
}

function Card({ children, style }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12,
      padding: '20px 24px', marginBottom: 16, ...style }}>{children}</div>
  );
}

function HonestBanner({ text }) {
  return (
    <div style={{ background: `${AMBER}18`, border: `1px solid ${AMBER}44`, borderRadius: 8,
      padding: '10px 16px', marginBottom: 16, color: AMBER, fontSize: 13, fontWeight: 500 }}>
      {text}
    </div>
  );
}

function NotLiveBanner({ text }) {
  return (
    <div style={{ background: `${MUTE}18`, border: `1px solid ${MUTE}44`, borderRadius: 8,
      padding: '10px 16px', marginBottom: 16, color: MUTE, fontSize: 13 }}>
      {text}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TenantGovernanceDashboard() {
  return (
    <div>
      <SectionHeader title="Tenant Governance Dashboard" subtitle="Phase C.2 / Module 2 of 7 — NOVEE OS" />
      <HonestBanner text="This module creates the governance data model. No live tenant isolation, workspace provisioning, or venue deployment is active." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Organizations', value: 'Placeholder Records', color: AMBER },
          { label: 'Venues', value: 'Not Deployed', color: MUTE },
          { label: 'Workspaces', value: 'Not Provisioned', color: MUTE },
          { label: 'Tenant Isolation', value: 'Not Verified', color: RED },
          { label: 'Live Mode', value: 'Disabled', color: MUTE },
          { label: 'Provider', value: 'Not Connected', color: MUTE },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 10,
            padding: '14px 16px' }}>
            <div style={{ color: MUTE, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
              textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
            <div style={{ color, fontSize: 14, fontWeight: 700 }}>{value}</div>
          </div>
        ))}
      </div>
      <Card>
        <div style={{ color: MUTE, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
          textTransform: 'uppercase', marginBottom: 10 }}>Phase C Roadmap</div>
        {ROADMAP.map(r => (
          <div key={r.phase} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0',
            borderBottom: `1px solid ${LINE}` }}>
            <StatusBadge status={r.status} label={r.status.toUpperCase()} />
            <span style={{ color: MUTE, fontSize: 12, minWidth: 60 }}>Phase {r.phase}</span>
            <span style={{ color: r.status === 'current' ? GOLD : r.status === 'complete' ? GREEN : TEXT,
              fontSize: 13 }}>{r.title}</span>
          </div>
        ))}
      </Card>
      <NotLiveBanner text={`Supported devices: ${DEVICE_LINE}`} />
    </div>
  );
}

function OrganizationPanel() {
  return (
    <div>
      <SectionHeader title="Organizations" subtitle="Organization records — placeholder governance layer" badge="canAccessPOS3 REQUIRED" />
      <HonestBanner text="Organizations are stored as placeholder records. Tenant isolation is NOT verified. No live multi-tenancy is active." />
      <Card>
        <InfoRow label="Organization Status Options" value="draft · active_placeholder · suspended · disabled · unavailable" />
        <BoolRow label="Tenant Isolation Verified" value={false} falseLabel="NOT VERIFIED" falseColor={RED} trueColor={GREEN} />
        <BoolRow label="Billing Connected" value={false} falseLabel="NOT CONNECTED" falseColor={MUTE} trueColor={GREEN} />
        <BoolRow label="License Verified" value={false} falseLabel="NOT VERIFIED" falseColor={MUTE} trueColor={GREEN} />
        <BoolRow label="Deployment Completed" value={false} falseLabel="NOT COMPLETED" falseColor={MUTE} trueColor={GREEN} />
        <BoolRow label="Contains Secrets" value={false} falseLabel="NO" falseColor={GREEN} />
        <BoolRow label="Stores Secrets" value={false} falseLabel="NO" falseColor={GREEN} />
        <BoolRow label="Contains AI Generated Content" value={false} falseLabel="NO" falseColor={GREEN} />
      </Card>
      <NotLiveBanner text="Organizations require Phase C.3 licensing and Phase C.4 role enforcement before production use." />
    </div>
  );
}

function OrganizationProfilePanel() {
  return (
    <div>
      <SectionHeader title="Organization Profile" subtitle="Legal name, address, contact — private data scoped to organization" badge="canAccessPOS3 REQUIRED" />
      <HonestBanner text="Organization profiles contain private data. exposes_private_data=TRUE. No secrets are stored." />
      <Card>
        <InfoRow label="exposes_private_data" value="TRUE — contact details, addresses" color={AMBER} />
        <BoolRow label="exposes_financial_data" value={false} falseLabel="FALSE" falseColor={GREEN} />
        <BoolRow label="contains_secrets" value={false} falseLabel="FALSE" falseColor={GREEN} />
        <BoolRow label="stores_secrets" value={false} falseLabel="FALSE" falseColor={GREEN} />
        <BoolRow label="contains_ai_generated_content" value={false} falseLabel="FALSE" falseColor={GREEN} />
      </Card>
    </div>
  );
}

function VenueGroupPanel() {
  return (
    <div>
      <SectionHeader title="Venue Groups" subtitle="Group venues under a common umbrella organization" badge="canAccessPOS3 REQUIRED" />
      <HonestBanner text="Venue groups are placeholder records. No live venue grouping is enforced." />
      <Card>
        <InfoRow label="Scope Level" value="venue_group" />
        <InfoRow label="Governance Status" value="draft · active_placeholder · review_required · blocked · disabled · unavailable" />
        <BoolRow label="Tenant Isolation Verified" value={false} falseLabel="NOT VERIFIED" falseColor={RED} trueColor={GREEN} />
        <BoolRow label="Contains Secrets" value={false} falseLabel="NO" falseColor={GREEN} />
      </Card>
    </div>
  );
}

function VenuePanel() {
  return (
    <div>
      <SectionHeader title="Venues" subtitle="Venue records — physical or virtual locations" badge="canAccessPOS3 REQUIRED" />
      <HonestBanner text="Venues are NOT deployed. venue_deployed=FALSE. live_mode_enabled=FALSE. provider_connected=FALSE." />
      <Card>
        <InfoRow label="Venue Status Options" value="draft · setup_placeholder · active_placeholder · deployed_external · suspended · disabled · unavailable" />
        <BoolRow label="venue_deployed" value={false} falseLabel="NOT DEPLOYED" falseColor={RED} trueColor={GREEN} />
        <BoolRow label="live_mode_enabled" value={false} falseLabel="NOT ENABLED" falseColor={RED} trueColor={GREEN} />
        <BoolRow label="demo_mode_enabled" value={true} trueLabel="TRUE (default)" trueColor={AMBER} falseColor={MUTE} />
        <BoolRow label="provider_connected" value={false} falseLabel="NOT CONNECTED" falseColor={MUTE} trueColor={GREEN} />
        <BoolRow label="billing_connected" value={false} falseLabel="NOT CONNECTED" falseColor={MUTE} trueColor={GREEN} />
        <BoolRow label="license_verified" value={false} falseLabel="NOT VERIFIED" falseColor={MUTE} trueColor={GREEN} />
        <BoolRow label="deployment_completed" value={false} falseLabel="NOT COMPLETED" falseColor={MUTE} trueColor={GREEN} />
        <BoolRow label="contains_secrets" value={false} falseLabel="NO" falseColor={GREEN} />
      </Card>
    </div>
  );
}

function VenueProfilePanel() {
  return (
    <div>
      <SectionHeader title="Venue Profile" subtitle="Venue display name, type, address, contact" badge="canAccessPOS3 REQUIRED" />
      <HonestBanner text="Venue profiles expose private data. exposes_private_data=TRUE." />
      <Card>
        <InfoRow label="exposes_private_data" value="TRUE — addresses, contact" color={AMBER} />
        <BoolRow label="exposes_financial_data" value={false} falseLabel="FALSE" falseColor={GREEN} />
        <BoolRow label="contains_secrets" value={false} falseLabel="FALSE" falseColor={GREEN} />
        <BoolRow label="stores_secrets" value={false} falseLabel="FALSE" falseColor={GREEN} />
      </Card>
    </div>
  );
}

function WorkspacePanel() {
  return (
    <div>
      <SectionHeader title="Workspaces" subtitle="Workspace records — operational boundaries within an org / venue" badge="canAccessPOS3 REQUIRED" />
      <HonestBanner text="Workspaces are NOT provisioned. workspace_provisioned=FALSE. live_mode_enabled=FALSE." />
      <Card>
        <InfoRow label="Workspace Status Options" value="draft · provisioned_placeholder · active_placeholder · live_external · suspended · disabled · unavailable" />
        <BoolRow label="workspace_provisioned" value={false} falseLabel="NOT PROVISIONED" falseColor={RED} trueColor={GREEN} />
        <BoolRow label="live_mode_enabled" value={false} falseLabel="NOT ENABLED" falseColor={RED} trueColor={GREEN} />
        <BoolRow label="demo_mode_enabled" value={true} trueLabel="TRUE (default)" trueColor={AMBER} falseColor={MUTE} />
        <BoolRow label="tenant_isolation_verified" value={false} falseLabel="NOT VERIFIED" falseColor={RED} trueColor={GREEN} />
        <BoolRow label="provider_connected" value={false} falseLabel="NOT CONNECTED" falseColor={MUTE} trueColor={GREEN} />
        <BoolRow label="billing_connected" value={false} falseLabel="NOT CONNECTED" falseColor={MUTE} trueColor={GREEN} />
        <BoolRow label="contains_secrets" value={false} falseLabel="NO" falseColor={GREEN} />
      </Card>
    </div>
  );
}

function WorkspaceMembershipPanel() {
  return (
    <div>
      <SectionHeader title="Workspace Memberships" subtitle="Placeholder membership records — not enforced at live API boundary" badge="canAccessPOS3 REQUIRED" />
      <HonestBanner text="Memberships are invited_placeholder status by default. Not enforced as live access control." />
      <Card>
        <InfoRow label="Default Membership Status" value="invited_placeholder" color={AMBER} />
        <InfoRow label="Status Options" value="invited_placeholder · active_placeholder · suspended · removed · unavailable" />
        <BoolRow label="exposes_private_data" value={true} trueLabel="TRUE — user_id fields" trueColor={AMBER} falseColor={MUTE} />
        <BoolRow label="contains_secrets" value={false} falseLabel="NO" falseColor={GREEN} />
        <BoolRow label="stores_secrets" value={false} falseLabel="NO" falseColor={GREEN} />
      </Card>
    </div>
  );
}

function WorkspaceRolePanel() {
  return (
    <div>
      <SectionHeader title="Workspace Roles" subtitle="Role definitions scoped to workspaces" badge="canAccessPOS3 REQUIRED" />
      <Card>
        <InfoRow label="Role Scope Options" value="platform_owner · organization_admin · venue_owner · workspace_admin · manager · staff · guest · system · custom" />
        <InfoRow label="Scope Level" value="workspace" />
        <InfoRow label="Default Governance Status" value="draft" color={MUTE} />
        <BoolRow label="exposes_private_data" value={false} falseLabel="FALSE" falseColor={GREEN} />
        <BoolRow label="contains_secrets" value={false} falseLabel="NO" falseColor={GREEN} />
      </Card>
    </div>
  );
}

function WorkspaceAccessBoundaryPanel() {
  return (
    <div>
      <SectionHeader title="Access Boundaries" subtitle="Workspace-scoped access boundary records" badge="canAccessPOS3 REQUIRED" />
      <HonestBanner text="Access boundary records describe intended boundaries. Row-level enforcement requires Phase C.4." />
      <Card>
        <InfoRow label="Boundary Types" value="data_access · route_access · module_access · venue_access · workspace_access · financial_access · private_data_access · admin_access · custom" />
        <BoolRow label="tenant_isolation_verified" value={false} falseLabel="NOT VERIFIED" falseColor={RED} trueColor={GREEN} />
        <BoolRow label="exposes_private_data" value={true} trueLabel="TRUE" trueColor={AMBER} falseColor={MUTE} />
        <BoolRow label="contains_secrets" value={false} falseLabel="NO" falseColor={GREEN} />
      </Card>
    </div>
  );
}

function BusinessUnitPanel() {
  return (
    <div>
      <SectionHeader title="Business Units" subtitle="Business unit records scoped to organization" badge="canAccessPOS3 REQUIRED" />
      <Card>
        <InfoRow label="Scope Level" value="business_unit" />
        <InfoRow label="Governance Status" value="draft (default)" color={MUTE} />
        <BoolRow label="exposes_private_data" value={true} trueLabel="TRUE" trueColor={AMBER} falseColor={MUTE} />
        <BoolRow label="contains_secrets" value={false} falseLabel="NO" falseColor={GREEN} />
      </Card>
    </div>
  );
}

function DepartmentPanel() {
  return (
    <div>
      <SectionHeader title="Departments" subtitle="Department records linked to business units and organizations" badge="canAccessPOS3 REQUIRED" />
      <Card>
        <InfoRow label="Scope Level" value="department" />
        <InfoRow label="Governance Status" value="draft (default)" color={MUTE} />
        <BoolRow label="exposes_private_data" value={true} trueLabel="TRUE" trueColor={AMBER} falseColor={MUTE} />
        <BoolRow label="contains_secrets" value={false} falseLabel="NO" falseColor={GREEN} />
      </Card>
    </div>
  );
}

function LocationPanel() {
  return (
    <div>
      <SectionHeader title="Locations" subtitle="Physical or virtual location records" badge="canAccessPOS3 REQUIRED" />
      <Card>
        <InfoRow label="Scope Level" value="location" />
        <InfoRow label="Hierarchical Links" value="organization · venue · venue_group · business_unit · department" />
        <BoolRow label="exposes_private_data" value={true} trueLabel="TRUE — addresses" trueColor={AMBER} falseColor={MUTE} />
        <BoolRow label="contains_secrets" value={false} falseLabel="NO" falseColor={GREEN} />
      </Card>
    </div>
  );
}

function EnvironmentModePanel() {
  return (
    <div>
      <SectionHeader title="Environment Modes" subtitle="Workspace environment mode records" badge="canAccessPOS3 REQUIRED" />
      <HonestBanner text="Environment modes are placeholder records. live_mode_enabled=FALSE on all records." />
      <Card>
        <InfoRow label="Mode Options" value="demo · local_preview · staging_placeholder · production_placeholder · live_external · unavailable" />
        <BoolRow label="live_mode_enabled" value={false} falseLabel="FALSE (all records)" falseColor={RED} trueColor={GREEN} />
        <BoolRow label="demo_mode_enabled" value={true} trueLabel="TRUE (default)" trueColor={AMBER} falseColor={MUTE} />
        <BoolRow label="provider_connected" value={false} falseLabel="FALSE" falseColor={MUTE} trueColor={GREEN} />
        <BoolRow label="workspace_provisioned" value={false} falseLabel="FALSE" falseColor={RED} trueColor={GREEN} />
        <BoolRow label="venue_deployed" value={false} falseLabel="FALSE" falseColor={RED} trueColor={GREEN} />
        <BoolRow label="contains_secrets" value={false} falseLabel="NO" falseColor={GREEN} />
      </Card>
    </div>
  );
}

function DemoLiveWorkspaceModePanel() {
  return (
    <div>
      <SectionHeader title="Demo / Live Workspace Mode" subtitle="Per-workspace demo vs. live mode records" badge="canAccessPOS3 REQUIRED" />
      <HonestBanner text="Live mode is NOT enabled. live_mode_enabled=FALSE. Provider activation required for live mode." />
      <Card>
        <BoolRow label="live_mode_enabled" value={false} falseLabel="NOT ENABLED" falseColor={RED} trueColor={GREEN} />
        <BoolRow label="demo_mode_enabled" value={true} trueLabel="TRUE (default)" trueColor={AMBER} falseColor={MUTE} />
        <BoolRow label="workspace_provisioned" value={false} falseLabel="FALSE" falseColor={RED} trueColor={GREEN} />
        <BoolRow label="venue_deployed" value={false} falseLabel="FALSE" falseColor={RED} trueColor={GREEN} />
        <BoolRow label="provider_connected" value={false} falseLabel="FALSE" falseColor={MUTE} trueColor={GREEN} />
        <BoolRow label="billing_connected" value={false} falseLabel="FALSE" falseColor={MUTE} trueColor={GREEN} />
        <BoolRow label="contains_secrets" value={false} falseLabel="NO" falseColor={GREEN} />
      </Card>
    </div>
  );
}

function ModuleWorkspaceAvailabilityPanel() {
  return (
    <div>
      <SectionHeader title="Module Workspace Availability" subtitle="Module availability records scoped to workspaces" badge="canAccessPOS3 REQUIRED" />
      <HonestBanner text="Module availability is not_available by default. Availability records do not gate live module functionality in Phase C.2." />
      <Card>
        <InfoRow label="Default Availability Status" value="not_available" color={MUTE} />
        <InfoRow label="Availability Status Options" value="not_available · available_placeholder · enabled_placeholder · disabled · blocked · unavailable" />
        <InfoRow label="Scope Level" value="workspace" />
        <BoolRow label="contains_secrets" value={false} falseLabel="NO" falseColor={GREEN} />
      </Card>
    </div>
  );
}

function ModuleVenueAvailabilityPanel() {
  return (
    <div>
      <SectionHeader title="Module Venue Availability" subtitle="Module availability records scoped to venues" badge="canAccessPOS3 REQUIRED" />
      <HonestBanner text="Module availability is not_available by default at venue scope." />
      <Card>
        <InfoRow label="Default Availability Status" value="not_available" color={MUTE} />
        <InfoRow label="Scope Level" value="venue" />
        <BoolRow label="contains_secrets" value={false} falseLabel="NO" falseColor={GREEN} />
      </Card>
    </div>
  );
}

function ModuleOrganizationAvailabilityPanel() {
  return (
    <div>
      <SectionHeader title="Module Organization Availability" subtitle="Module availability records scoped to organizations" badge="canAccessPOS3 REQUIRED" />
      <HonestBanner text="Module availability is not_available by default at organization scope." />
      <Card>
        <InfoRow label="Default Availability Status" value="not_available" color={MUTE} />
        <InfoRow label="Scope Level" value="organization" />
        <BoolRow label="contains_secrets" value={false} falseLabel="NO" falseColor={GREEN} />
      </Card>
    </div>
  );
}

function DataBoundaryPanel() {
  return (
    <div>
      <SectionHeader title="Data Boundaries" subtitle="Data boundary records across org / venue / workspace scope" badge="canAccessPOS3 REQUIRED" />
      <HonestBanner text="Data boundary records describe intended data access limits. Row-level security enforcement requires Phase C.4." />
      <Card>
        <InfoRow label="Boundary Types" value="data_access · route_access · module_access · venue_access · workspace_access · financial_access · private_data_access · admin_access · custom" />
        <BoolRow label="tenant_isolation_verified" value={false} falseLabel="NOT VERIFIED" falseColor={RED} trueColor={GREEN} />
        <BoolRow label="exposes_private_data" value={true} trueLabel="TRUE" trueColor={AMBER} falseColor={MUTE} />
        <BoolRow label="contains_secrets" value={false} falseLabel="NO" falseColor={GREEN} />
      </Card>
    </div>
  );
}

function TenantHealthPanel() {
  return (
    <div>
      <SectionHeader title="Tenant Health Checks" subtitle="Placeholder health status records — not live infrastructure monitoring" badge="canAccessPOS3 REQUIRED" />
      <HonestBanner text="Health checks return placeholder_health_not_live status. No live infrastructure monitoring in Phase C.2." />
      <Card>
        <InfoRow label="Default Health Status" value="unknown" color={MUTE} />
        <InfoRow label="Health Status Options" value="unknown · healthy_placeholder · degraded · failed · unavailable" />
        <BoolRow label="tenant_isolation_verified" value={false} falseLabel="FALSE" falseColor={RED} trueColor={GREEN} />
        <BoolRow label="workspace_provisioned" value={false} falseLabel="FALSE" falseColor={MUTE} trueColor={GREEN} />
        <BoolRow label="venue_deployed" value={false} falseLabel="FALSE" falseColor={MUTE} trueColor={GREEN} />
        <BoolRow label="contains_secrets" value={false} falseLabel="NO" falseColor={GREEN} />
      </Card>
    </div>
  );
}

function WorkspaceReadinessPanel() {
  return (
    <div>
      <SectionHeader title="Workspace Readiness" subtitle="Readiness status records for workspace governance" badge="canAccessPOS3 REQUIRED" />
      <HonestBanner text="Readiness records default to not_checked. workspace_provisioned=FALSE. Provider activation required." />
      <Card>
        <InfoRow label="Default Readiness Status" value="not_checked" color={MUTE} />
        <InfoRow label="Readiness Status Options" value="not_checked · foundation_ready · configuration_required · provider_activation_required · production_ready_placeholder · incomplete · unavailable" />
        <BoolRow label="workspace_provisioned" value={false} falseLabel="FALSE" falseColor={RED} trueColor={GREEN} />
        <BoolRow label="live_mode_enabled" value={false} falseLabel="FALSE" falseColor={RED} trueColor={GREEN} />
        <BoolRow label="contains_secrets" value={false} falseLabel="NO" falseColor={GREEN} />
      </Card>
    </div>
  );
}

function TenantGovernanceSnapshotPanel() {
  return (
    <div>
      <SectionHeader title="Governance Snapshots" subtitle="Platform-wide governance snapshot records" badge="canAccessPOS3 REQUIRED" />
      <HonestBanner text="Snapshots capture record counts only. No live system health. tenant_isolation_verified=FALSE." />
      <Card>
        <BoolRow label="tenant_isolation_verified" value={false} falseLabel="FALSE" falseColor={RED} trueColor={GREEN} />
        <BoolRow label="any_workspace_provisioned" value={false} falseLabel="FALSE" falseColor={MUTE} trueColor={GREEN} />
        <BoolRow label="any_venue_deployed" value={false} falseLabel="FALSE" falseColor={MUTE} trueColor={GREEN} />
        <BoolRow label="any_live_mode_enabled" value={false} falseLabel="FALSE" falseColor={MUTE} trueColor={GREEN} />
        <BoolRow label="any_provider_connected" value={false} falseLabel="FALSE" falseColor={MUTE} trueColor={GREEN} />
        <BoolRow label="any_billing_connected" value={false} falseLabel="FALSE" falseColor={MUTE} trueColor={GREEN} />
        <BoolRow label="contains_secrets" value={false} falseLabel="NO" falseColor={GREEN} />
      </Card>
    </div>
  );
}

function SafeTenantClaimsPanel() {
  const claims = [
    'Organization, venue, and workspace records can be created and stored.',
    'Scope-level filtering and organization / venue / workspace scoping is supported.',
    'Workspace memberships and roles are stored as placeholder records.',
    'Data boundary records are stored and scoped to organization / venue / workspace.',
    'Governance snapshots capture counts at the time of snapshot creation.',
    'Audit records are written on every mutation.',
    'All write routes require platform admin access (canAccessPOS3).',
    'No secrets are stored.',
    'Private data fields are correctly flagged.',
    'All boolean guards default to FALSE.',
    'idempotency_key is required on all mutations.',
  ];
  return (
    <div>
      <SectionHeader title="Safe Claims" subtitle="What this module honestly delivers" />
      <Card>
        {claims.map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 0',
            borderBottom: i < claims.length - 1 ? `1px solid ${LINE}` : 'none' }}>
            <span style={{ color: GREEN, fontSize: 14, fontWeight: 700, minWidth: 16 }}>+</span>
            <span style={{ color: TEXT, fontSize: 13 }}>{c}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

function UnsafeTenantClaimsPanel() {
  const unsafe = [
    'Tenant isolation is NOT verified — tenant_isolation_verified=FALSE on all records.',
    'Workspaces are NOT truly provisioned — workspace_provisioned=FALSE on all records.',
    'Venues are NOT deployed — venue_deployed=FALSE on all records.',
    'Live mode is NOT enabled — live_mode_enabled=FALSE on all records.',
    'Providers are NOT connected — provider_connected=FALSE on all records.',
    'Billing is NOT connected — billing_connected=FALSE on all records.',
    'Licenses are NOT verified — license_verified=FALSE on all records.',
    'Deployments are NOT completed — deployment_completed=FALSE on all records.',
    'Workspace memberships are placeholder only — not enforced at API boundary.',
    'Module availability records are placeholder only — not gating live module functionality.',
  ];
  return (
    <div>
      <SectionHeader title="Unsafe Claims" subtitle="What this module does NOT deliver — never claim otherwise" />
      <Card>
        {unsafe.map((u, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 0',
            borderBottom: i < unsafe.length - 1 ? `1px solid ${LINE}` : 'none' }}>
            <span style={{ color: RED, fontSize: 14, fontWeight: 700, minWidth: 16 }}>x</span>
            <span style={{ color: TEXT, fontSize: 13 }}>{u}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

function HonestTenantLimitationsPanel() {
  const limits = [
    'Phase C.2 creates the governance data model only. No live tenant isolation is active.',
    'Workspace provisioning requires Phase C.3 licensing and Phase C.4 role/permission enforcement.',
    'Venue deployment requires real provider activation — not yet available.',
    'Live mode requires real billing, licensing, and provider connections — all pending.',
    'Module availability records do not gate actual module functionality in Phase C.2.',
    'Data boundary records define intended boundaries but do not enforce row-level security.',
    'Governance snapshots reflect record counts only — not live system health.',
    'Health checks return placeholder status only — no live infrastructure monitoring.',
    'Configuration required on all organizations, venues, and workspaces before production use.',
    'Provider activation required before any live deployment.',
  ];
  return (
    <div>
      <SectionHeader title="Honest Limitations" subtitle="Configuration required, activation required, not live — stated clearly" />
      {limits.map((l, i) => (
        <div key={i} style={{ background: `${AMBER}10`, border: `1px solid ${AMBER}33`,
          borderRadius: 8, padding: '10px 14px', marginBottom: 8, color: AMBER, fontSize: 13 }}>{l}</div>
      ))}
    </div>
  );
}

function TenantRoadmapPanel() {
  return (
    <div>
      <SectionHeader title="Phase C Roadmap" subtitle="7 modules — Tenant Governance is Module 2 of 7" />
      {ROADMAP.map(r => (
        <div key={r.phase} style={{ background: CARD, border: `1px solid ${r.status === 'current' ? GOLD : r.status === 'complete' ? GREEN : LINE}`,
          borderRadius: 10, padding: '14px 18px', marginBottom: 10,
          display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ minWidth: 80 }}>
            <div style={{ color: MUTE, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Phase {r.phase}</div>
            <div style={{ color: MUTE, fontSize: 10 }}>Module {r.module} / 7</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: r.status === 'current' ? GOLD : r.status === 'complete' ? GREEN : TEXT,
              fontSize: 14, fontWeight: r.status === 'current' ? 700 : 500, marginBottom: 4 }}>{r.title}</div>
          </div>
          <StatusBadge status={r.status} label={r.status.toUpperCase()} />
        </div>
      ))}
    </div>
  );
}

function NoveeOSTenantLanguageSelector() {
  const langs = ['en-US', 'es-DO', 'es', 'ht', 'de', 'pt'];
  return (
    <div>
      <SectionHeader title="Language Support" subtitle="6 supported locales for Tenant Governance" />
      <Card>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {langs.map(l => (
            <div key={l} style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8,
              padding: '8px 18px', color: TEXT, fontSize: 13, fontWeight: 500 }}>{l}</div>
          ))}
        </div>
        <div style={{ marginTop: 12, color: MUTE, fontSize: 12 }}>
          tNoveeOSTenants(key, locale) — getSupportedNoveeOSTenantLanguages()
        </div>
      </Card>
    </div>
  );
}

function NoSecretsStoredPanel() {
  return (
    <div>
      <SectionHeader title="No Secrets Stored" subtitle="Security guarantee — confirmed across all 22 tables" />
      <Card>
        {[
          'contains_secrets DEFAULT FALSE on all tables',
          'stores_secrets DEFAULT FALSE on all tables',
          'Audit snapshots never include credential, key, or token data',
          'No route accepts or stores secrets',
          'canAccessPOS3 required on all write routes',
          'No secret fields in any migration column',
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 0',
            borderBottom: `1px solid ${LINE}` }}>
            <span style={{ color: GREEN, fontWeight: 700 }}>+</span>
            <span style={{ color: TEXT, fontSize: 13 }}>{s}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

function PrivateDataProtectionPanel() {
  return (
    <div>
      <SectionHeader title="Private Data Protection" subtitle="exposes_private_data flags across all tables" />
      <HonestBanner text="Private data fields (addresses, emails, user_ids) are flagged with exposes_private_data=TRUE." />
      <Card>
        <InfoRow label="Organizations" value="exposes_private_data = TRUE" color={AMBER} />
        <InfoRow label="Organization Profiles" value="exposes_private_data = TRUE" color={AMBER} />
        <InfoRow label="Venues" value="exposes_private_data = TRUE" color={AMBER} />
        <InfoRow label="Venue Profiles" value="exposes_private_data = TRUE" color={AMBER} />
        <InfoRow label="Workspaces" value="exposes_private_data = TRUE" color={AMBER} />
        <InfoRow label="Memberships" value="exposes_private_data = TRUE (user_id)" color={AMBER} />
        <InfoRow label="Environment / Mode tables" value="exposes_private_data = FALSE" color={GREEN} />
        <InfoRow label="Availability tables" value="exposes_private_data = FALSE" color={GREEN} />
      </Card>
    </div>
  );
}

function FinancialDataProtectionPanel() {
  return (
    <div>
      <SectionHeader title="Financial Data Protection" subtitle="exposes_financial_data flags across all tables" />
      <Card>
        {[
          { table: 'All tables (default)', value: 'exposes_financial_data = FALSE', color: GREEN },
          { table: 'Billing connection', value: 'billing_connected = FALSE (no live billing)', color: GREEN },
          { table: 'License verification', value: 'license_verified = FALSE (no live verification)', color: GREEN },
          { table: 'Payment data', value: 'Not stored in Phase C.2 — Phase C.3 required', color: MUTE },
        ].map(({ table, value, color }) => (
          <InfoRow key={table} label={table} value={value} color={color} />
        ))}
      </Card>
    </div>
  );
}

function HonestTenantIsolationStatePanel() {
  return (
    <div>
      <SectionHeader title="Tenant Isolation State" subtitle="Current honest state — not verified" />
      <HonestBanner text="Tenant isolation is NOT verified. tenant_isolation_verified=FALSE on ALL records. No row-level security is active." />
      <Card>
        <BoolRow label="tenant_isolation_verified (organizations)" value={false} falseLabel="FALSE" falseColor={RED} trueColor={GREEN} />
        <BoolRow label="tenant_isolation_verified (venue_groups)" value={false} falseLabel="FALSE" falseColor={RED} trueColor={GREEN} />
        <BoolRow label="tenant_isolation_verified (venues)" value={false} falseLabel="FALSE" falseColor={RED} trueColor={GREEN} />
        <BoolRow label="tenant_isolation_verified (workspaces)" value={false} falseLabel="FALSE" falseColor={RED} trueColor={GREEN} />
        <BoolRow label="tenant_isolation_verified (boundaries)" value={false} falseLabel="FALSE" falseColor={RED} trueColor={GREEN} />
        <BoolRow label="tenant_isolation_verified (health_checks)" value={false} falseLabel="FALSE" falseColor={RED} trueColor={GREEN} />
        <BoolRow label="tenant_isolation_verified (snapshots)" value={false} falseLabel="FALSE" falseColor={RED} trueColor={GREEN} />
        <div style={{ marginTop: 12, color: MUTE, fontSize: 12 }}>
          Full tenant isolation requires Phase C.4 role/permission enforcement.
        </div>
      </Card>
    </div>
  );
}

function HonestWorkspaceProvisioningStatePanel() {
  return (
    <div>
      <SectionHeader title="Workspace Provisioning State" subtitle="Current honest state — not provisioned" />
      <HonestBanner text="Workspaces are NOT provisioned. workspace_provisioned=FALSE on ALL records. Provisioning requires Phase C.3 licensing." />
      <Card>
        <BoolRow label="workspace_provisioned (all records)" value={false} falseLabel="FALSE" falseColor={RED} trueColor={GREEN} />
        <InfoRow label="Status required before provisioning" value="Phase C.3 licensing + Phase C.4 permissions" color={AMBER} />
      </Card>
    </div>
  );
}

function HonestVenueDeploymentStatePanel() {
  return (
    <div>
      <SectionHeader title="Venue Deployment State" subtitle="Current honest state — not deployed" />
      <HonestBanner text="Venues are NOT deployed. venue_deployed=FALSE on ALL records. Real venue deployment requires provider activation." />
      <Card>
        <BoolRow label="venue_deployed (all records)" value={false} falseLabel="FALSE" falseColor={RED} trueColor={GREEN} />
        <InfoRow label="Status required before deployment" value="Provider activation + Phase C.3 billing + Phase C.4 admin" color={AMBER} />
      </Card>
    </div>
  );
}

function HonestLiveModeStatePanel() {
  return (
    <div>
      <SectionHeader title="Live Mode State" subtitle="Current honest state — not enabled" />
      <HonestBanner text="Live mode is NOT enabled on any record. live_mode_enabled=FALSE everywhere. Provider, billing, license, and deployment all required." />
      <Card>
        <BoolRow label="live_mode_enabled (all records)" value={false} falseLabel="FALSE" falseColor={RED} trueColor={GREEN} />
        <InfoRow label="Live mode requires" value="Provider + Billing + License + Deployment — all pending" color={AMBER} />
      </Card>
    </div>
  );
}

function HonestProviderStatePanel() {
  return (
    <div>
      <SectionHeader title="Provider State" subtitle="Current honest state — not connected" />
      <HonestBanner text="No provider is connected. provider_connected=FALSE on all records." />
      <Card>
        <BoolRow label="provider_connected (all records)" value={false} falseLabel="FALSE" falseColor={MUTE} trueColor={GREEN} />
        <InfoRow label="Provider activation" value="Pending — requires Phase C.3 and external provider setup" color={AMBER} />
      </Card>
    </div>
  );
}

function HonestBillingStatePanel() {
  return (
    <div>
      <SectionHeader title="Billing State" subtitle="Current honest state — not connected" />
      <HonestBanner text="Billing is NOT connected. billing_connected=FALSE on all records. No real billing is active." />
      <Card>
        <BoolRow label="billing_connected (all records)" value={false} falseLabel="FALSE" falseColor={MUTE} trueColor={GREEN} />
        <InfoRow label="Billing" value="Pending — Phase C.3 Licensing, Plans, Trials & Billing Gates" color={AMBER} />
      </Card>
    </div>
  );
}

function HonestLicenseStatePanel() {
  return (
    <div>
      <SectionHeader title="License State" subtitle="Current honest state — not verified" />
      <HonestBanner text="License is NOT verified. license_verified=FALSE on all records. Phase C.3 required." />
      <Card>
        <BoolRow label="license_verified (all records)" value={false} falseLabel="FALSE" falseColor={MUTE} trueColor={GREEN} />
        <InfoRow label="License verification" value="Pending — Phase C.3 Licensing & Billing Gates" color={AMBER} />
      </Card>
    </div>
  );
}

function EmptyTenantStatePanel() {
  return (
    <div>
      <SectionHeader title="Empty State" subtitle="Honest empty state for all tenant governance records" />
      <Card>
        <div style={{ textAlign: 'center', padding: '30px 20px' }}>
          <div style={{ color: LINE, fontSize: 32, fontWeight: 700, marginBottom: 12 }}>—</div>
          <div style={{ color: MUTE, fontSize: 14, marginBottom: 8 }}>
            No records found.
          </div>
          <div style={{ color: MUTE, fontSize: 13 }}>
            Add organization, venue, or workspace records to begin governance setup.
          </div>
          <div style={{ marginTop: 16, color: AMBER, fontSize: 12 }}>
            Configuration required · Provider activation required · Not live
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Tab content map ──────────────────────────────────────────────────────────
const PANEL_MAP = {
  dashboard:        TenantGovernanceDashboard,
  organizations:    OrganizationPanel,
  'org-profile':    OrganizationProfilePanel,
  'venue-groups':   VenueGroupPanel,
  venues:           VenuePanel,
  'venue-profile':  VenueProfilePanel,
  workspaces:       WorkspacePanel,
  memberships:      WorkspaceMembershipPanel,
  roles:            WorkspaceRolePanel,
  boundaries:       WorkspaceAccessBoundaryPanel,
  'business-units': BusinessUnitPanel,
  departments:      DepartmentPanel,
  locations:        LocationPanel,
  'env-modes':      EnvironmentModePanel,
  'demo-live':      DemoLiveWorkspaceModePanel,
  'module-ws-avail':   ModuleWorkspaceAvailabilityPanel,
  'module-venue-avail': ModuleVenueAvailabilityPanel,
  'module-org-avail':  ModuleOrganizationAvailabilityPanel,
  'data-boundary':  DataBoundaryPanel,
  health:           TenantHealthPanel,
  readiness:        WorkspaceReadinessPanel,
  snapshot:         TenantGovernanceSnapshotPanel,
  'safe-claims':    SafeTenantClaimsPanel,
  'unsafe-claims':  UnsafeTenantClaimsPanel,
  limitations:      HonestTenantLimitationsPanel,
  roadmap:          TenantRoadmapPanel,
  language:         NoveeOSTenantLanguageSelector,
  'no-secrets':     NoSecretsStoredPanel,
  'private-data':   PrivateDataProtectionPanel,
  'financial-data': FinancialDataProtectionPanel,
  'tenant-isolation':  HonestTenantIsolationStatePanel,
  'ws-provisioning':   HonestWorkspaceProvisioningStatePanel,
  'venue-deployment':  HonestVenueDeploymentStatePanel,
  'live-mode':         HonestLiveModeStatePanel,
  'provider-state':    HonestProviderStatePanel,
  'billing-state':     HonestBillingStatePanel,
  'license-state':     HonestLicenseStatePanel,
  'empty-state':       EmptyTenantStatePanel,
};

// ─── Main component ───────────────────────────────────────────────────────────
function NoveeOSTenantGovernance() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const ActivePanel = PANEL_MAP[activeTab] || EmptyTenantStatePanel;

  return (
    <div style={{ background: NAVY, minHeight: '100vh', fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif", color: TEXT }}>
      {/* Header */}
      <div style={{ background: CHARCOAL, borderBottom: `1px solid ${LINE}`, padding: '18px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD }} />
            <span style={{ color: GOLD, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              NOVEE OS — Phase C.2 / Module 2 of 7
            </span>
          </div>
          <h1 style={{ color: TEXT, fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: '0.02em' }}>
            Tenant, Venue, Organization & Workspace Governance
          </h1>
          <div style={{ color: MUTE, fontSize: 12, marginTop: 4 }}>{DEVICE_LINE}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <StatusBadge status="active_placeholder" label="GOVERNANCE LAYER" />
          <span style={{ color: MUTE, fontSize: 11 }}>Tenant Isolation · Not Verified</span>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background: CHARCOAL, borderBottom: `1px solid ${LINE}`,
        overflowX: 'auto', display: 'flex', padding: '0 16px' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '12px 14px',
            color: activeTab === t.key ? GOLD : MUTE,
            borderBottom: activeTab === t.key ? `2px solid ${GOLD}` : '2px solid transparent',
            fontSize: 12, fontWeight: activeTab === t.key ? 600 : 400,
            whiteSpace: 'nowrap', transition: 'color 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '28px 28px', maxWidth: 960, margin: '0 auto' }}>
        <ActivePanel />
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${LINE}`, padding: '14px 28px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ color: MUTE, fontSize: 11 }}>NOVEE OS Tenant Governance — Phase C.2 / Module 2 of 7</span>
        <span style={{ color: MUTE, fontSize: 11 }}>No live tenant isolation · Placeholder governance layer</span>
      </div>
    </div>
  );
}

export default NoveeOSTenantGovernance;
