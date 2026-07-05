// Phase C.4 / Module 4 of 7 — NOVEE OS Security Governance UI

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

const s = {
  section: { background: CARD, border: `1px solid ${LINE}`, borderRadius: 8, padding: '18px 22px', marginBottom: 14 },
  label:   { color: MUTE, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginRight: 8 },
  value:   { color: TEXT, fontSize: 13 },
  row:     { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 },
};

const badge = (label, color) => (
  <span style={{ background: color + '22', color, border: `1px solid ${color}44`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, letterSpacing: 0.8 }}>
    {label}
  </span>
);

function PanelHead({ title, sub, tag, tagColor }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: GOLD2, fontWeight: 800, fontSize: 14 }}>{title}</span>
        {tag && badge(tag, tagColor || AMBER)}
      </div>
      {sub && <div style={{ color: MUTE, fontSize: 11, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div style={s.row}>
      <span style={s.label}>{label}</span>
      <span style={{ ...s.value, color: color || TEXT }}>{value}</span>
    </div>
  );
}

function BoolGuard({ label, val }) {
  return (
    <div style={s.row}>
      <span style={s.label}>{label}</span>
      {badge(val ? 'TRUE' : 'FALSE', val ? GREEN : RED)}
    </div>
  );
}

// 1
function PlatformUserPanel() {
  return (
    <div style={s.section}>
      <PanelHead title="Platform Users" sub="User records scoped to platform, org, venue, or workspace" tag="PLACEHOLDER" />
      <Row label="Status" value="invited_placeholder" color={AMBER} />
      <BoolGuard label="sso_connected" val={false} />
      <Row label="Note" value="Real user activation requires identity provider integration." color={MUTE} />
    </div>
  );
}

// 2
function UserProfilePanel() {
  return (
    <div style={s.section}>
      <PanelHead title="User Profiles" sub="Extended profile data per platform user" tag="PLACEHOLDER" />
      <Row label="Profile Status" value="not configured" color={MUTE} />
      <BoolGuard label="exposes_private_data" val={true} />
    </div>
  );
}

// 3
function RoleCatalogPanel() {
  return (
    <div style={s.section}>
      <PanelHead title="Role Catalog" sub="Platform, org, venue, and workspace role definitions" tag="PLACEHOLDER" tagColor={PURPLE} />
      <Row label="Role Scopes" value="platform_owner · platform_admin · organization_owner · organization_admin · venue_owner · venue_admin · workspace_admin · manager · staff · guest · auditor · support · system · custom" />
      <Row label="Status" value="draft" color={MUTE} />
      <BoolGuard label="permission_enforced" val={false} />
    </div>
  );
}

// 4
function PermissionCatalogPanel() {
  return (
    <div style={s.section}>
      <PanelHead title="Permission Catalog" sub="Fine-grained permission definitions" tag="PLACEHOLDER" tagColor={PURPLE} />
      <Row label="Groups" value="platform · modules · tenants · billing · security · pos360 · smokecraft · eat · crafthub · reports · integrations · admin · custom" />
      <Row label="Status" value="draft" color={MUTE} />
      <BoolGuard label="permission_enforced" val={false} />
    </div>
  );
}

// 5
function PermissionGroupPanel() {
  return (
    <div style={s.section}>
      <PanelHead title="Permission Groups" sub="Grouped permission sets for role assignment" tag="PLACEHOLDER" />
      <Row label="Status" value="not configured" color={MUTE} />
    </div>
  );
}

// 6
function RolePermissionAssignmentPanel() {
  return (
    <div style={s.section}>
      <PanelHead title="Role Permission Assignments" sub="Maps permissions to roles" tag="PLACEHOLDER" />
      <Row label="Assignment Status" value="active_placeholder" color={AMBER} />
      <BoolGuard label="permission_enforced" val={false} />
    </div>
  );
}

// 7
function UserRoleAssignmentPanel() {
  return (
    <div style={s.section}>
      <PanelHead title="User Role Assignments" sub="Assigns roles to platform users" tag="PLACEHOLDER" />
      <Row label="Assignment Status" value="pending_placeholder" color={AMBER} />
      <BoolGuard label="permission_enforced" val={false} />
    </div>
  );
}

// 8
function UserAccessGrantPanel() {
  return (
    <div style={s.section}>
      <PanelHead title="User Access Grants" sub="Direct access grants to users" tag="PLACEHOLDER" />
      <Row label="Grant Status" value="pending_placeholder" color={AMBER} />
      <BoolGuard label="permission_enforced" val={false} />
    </div>
  );
}

// 9
function ModulePermissionRulePanel() {
  return (
    <div style={s.section}>
      <PanelHead title="Module Permission Rules" sub="Permission rules gating module access" tag="GATED" tagColor={PURPLE} />
      <Row label="Scope" value="module" color={MUTE} />
      <BoolGuard label="permission_enforced" val={false} />
    </div>
  );
}

// 10
function RoutePermissionRulePanel() {
  return (
    <div style={s.section}>
      <PanelHead title="Route Permission Rules" sub="Permission rules gating API routes" tag="GATED" tagColor={PURPLE} />
      <Row label="Scope" value="route" color={MUTE} />
      <BoolGuard label="permission_enforced" val={false} />
    </div>
  );
}

// 11
function FeaturePermissionRulePanel() {
  return (
    <div style={s.section}>
      <PanelHead title="Feature Permission Rules" sub="Permission rules gating feature flags" tag="GATED" tagColor={PURPLE} />
      <Row label="Scope" value="feature" color={MUTE} />
      <BoolGuard label="permission_enforced" val={false} />
    </div>
  );
}

// 12
function AdminApprovalRequestPanel() {
  return (
    <div style={s.section}>
      <PanelHead title="Admin Approval Requests" sub="Approval workflows for admin actions" tag="PLACEHOLDER" />
      <Row label="Approval Status" value="pending" color={AMBER} />
    </div>
  );
}

// 13
function SensitiveActionRequestPanel() {
  return (
    <div style={s.section}>
      <PanelHead title="Sensitive Action Requests" sub="Requests for sensitive platform actions" tag="PLACEHOLDER" />
      <Row label="Actions" value="billing_change · module_activation · tenant_change · live_mode_change · user_role_change · permission_change · security_policy_change · destructive_action" />
      <Row label="Approval Status" value="pending" color={AMBER} />
    </div>
  );
}

// 14
function PermissionDecisionPanel() {
  return (
    <div style={s.section}>
      <PanelHead title="Permission Decisions" sub="Logged access control decisions — placeholder only" tag="PLACEHOLDER" />
      <Row label="Decision" value="allowed_placeholder" color={AMBER} />
      <BoolGuard label="permission_enforced" val={false} />
      <Row label="Note" value="Real enforcement requires provider activation." color={MUTE} />
    </div>
  );
}

// 15
function AccessDenialPanel() {
  return (
    <div style={s.section}>
      <PanelHead title="Access Denial Records" sub="Logged access denial events" tag="PLACEHOLDER" />
      <Row label="Denial Status" value="denied" color={RED} />
    </div>
  );
}

// 16
function SessionPolicyPanel() {
  return (
    <div style={s.section}>
      <PanelHead title="Session Policies" sub="Session management policy records — placeholder" tag="NOT CONFIGURED" tagColor={RED} />
      <BoolGuard label="sso_connected" val={false} />
      <BoolGuard label="security_provider_connected" val={false} />
    </div>
  );
}

// 17
function MFAPolicyPanel() {
  return (
    <div style={s.section}>
      <PanelHead title="MFA Placeholder" sub="Multi-factor authentication policy records — not enforced" tag="NOT ENFORCED" tagColor={RED} />
      <BoolGuard label="mfa_enforced" val={false} />
      <BoolGuard label="security_provider_connected" val={false} />
      <Row label="Note" value="MFA is not enforced. A real MFA provider must be connected." color={MUTE} />
    </div>
  );
}

// 18
function SSOProviderPanel() {
  return (
    <div style={s.section}>
      <PanelHead title="SSO Placeholder" sub="Single sign-on provider records — not connected" tag="NOT CONNECTED" tagColor={RED} />
      <BoolGuard label="sso_connected" val={false} />
      <BoolGuard label="security_provider_connected" val={false} />
      <Row label="Note" value="SSO is not connected. A real identity provider must be configured." color={MUTE} />
    </div>
  );
}

// 19
function DeviceTrustPanel() {
  return (
    <div style={s.section}>
      <PanelHead title="Device Trust Placeholder" sub="Device trust records — not enforced" tag="NOT ENFORCED" tagColor={RED} />
      <BoolGuard label="device_trust_enforced" val={false} />
      <BoolGuard label="security_provider_connected" val={false} />
    </div>
  );
}

// 20
function IPAllowlistPanel() {
  return (
    <div style={s.section}>
      <PanelHead title="IP Allowlist Placeholder" sub="IP allowlist records — not enforced" tag="NOT ENFORCED" tagColor={RED} />
      <BoolGuard label="ip_allowlist_enforced" val={false} />
      <BoolGuard label="security_provider_connected" val={false} />
    </div>
  );
}

// 21
function SecurityEventPanel() {
  return (
    <div style={s.section}>
      <PanelHead title="Security Events" sub="Security event records — notification not delivered" tag="PLACEHOLDER" />
      <Row label="Security Status" value="not_configured" color={RED} />
      <BoolGuard label="notification_delivered" val={false} />
    </div>
  );
}

// 22
function GovernanceReviewPanel() {
  return (
    <div style={s.section}>
      <PanelHead title="Governance Reviews" sub="Platform governance review records" tag="PLACEHOLDER" />
      <Row label="Review Status" value="draft" color={MUTE} />
      <BoolGuard label="compliance_certified" val={false} />
    </div>
  );
}

// 23
function PlatformSecuritySnapshotPanel() {
  return (
    <div style={s.section}>
      <PanelHead title="Security Snapshot" sub="Point-in-time platform security state capture" tag="PLACEHOLDER" />
      <Row label="Latest Snapshot" value="none" color={MUTE} />
      <BoolGuard label="sso_connected" val={false} />
      <BoolGuard label="compliance_certified" val={false} />
    </div>
  );
}

// 24
function SafeSecurityClaimsPanel() {
  return (
    <div style={s.section}>
      <PanelHead title="Safe Security Claims" sub="What this system genuinely provides" tag="VERIFIED SAFE" tagColor={GREEN} />
      <Row label="Claim" value="Role catalog, permission catalog, and governance records are stored safely." color={GREEN} />
      <Row label="Claim" value="All security provider states are placeholder until a real provider is connected." color={GREEN} />
      <Row label="Claim" value="No secrets, credentials, or tokens are stored in this layer." color={GREEN} />
      <Row label="Claim" value="Audit trail is written for every mutation." color={GREEN} />
      <BoolGuard label="contains_secrets" val={false} />
      <BoolGuard label="stores_secrets" val={false} />
    </div>
  );
}

// 25
function UnsafeSecurityClaimsPanel() {
  return (
    <div style={s.section}>
      <PanelHead title="Unsafe Security Claims" sub="What this system does NOT provide" tag="NOT LIVE" tagColor={RED} />
      <Row label="Not Live" value="Real SSO connection" color={RED} />
      <Row label="Not Live" value="Real MFA enforcement" color={RED} />
      <Row label="Not Live" value="Real device trust enforcement" color={RED} />
      <Row label="Not Live" value="Real IP allowlist enforcement" color={RED} />
      <Row label="Not Live" value="Real compliance certification" color={RED} />
      <Row label="Not Live" value="Real SOC2 readiness" color={RED} />
      <Row label="Not Live" value="Real security provider connection" color={RED} />
      <Row label="Not Live" value="Real notification delivery" color={RED} />
      <Row label="Not Live" value="Real full permission enforcement" color={RED} />
    </div>
  );
}

// 26
function HonestSecurityLimitationsPanel() {
  return (
    <div style={s.section}>
      <PanelHead title="Honest Limitations" sub="Transparency about current system boundaries" tag="HONEST" tagColor={BLUE} />
      <Row label="Limitation" value="A real security provider must be connected before SSO, MFA, or device trust can be enforced." color={AMBER} />
      <Row label="Limitation" value="All session policies, MFA policies, SSO, device trust, and IP allowlists are placeholder records only." color={AMBER} />
      <Row label="Limitation" value="Permission enforcement is a placeholder decision layer. Real enforcement requires provider activation." color={AMBER} />
      <Row label="Limitation" value="Compliance certification is not implemented and has not been audited by any external party." color={AMBER} />
      <Row label="Limitation" value="Security event notifications are not delivered. Notification provider integration is required." color={AMBER} />
    </div>
  );
}

// 27
function SecurityRoadmapPanel() {
  return (
    <div style={s.section}>
      <PanelHead title="Phase Roadmap" sub="NOVEE OS implementation progress" tag="C.4 CURRENT" tagColor={GOLD} />
      <Row label="C.1 / Module 1 of 7" value="Module Registry — Complete" color={GREEN} />
      <Row label="C.2 / Module 2 of 7" value="Tenant / Venue / Workspace Governance — Complete" color={GREEN} />
      <Row label="C.3 / Module 3 of 7" value="Licensing / Billing Gates — Complete" color={GREEN} />
      <Row label="C.4 / Module 4 of 7" value="User Roles / Permissions / Security — Current" color={GOLD2} />
      <Row label="C.5 / Module 5 of 7" value="CraftHub Launcher — Next" color={AMBER} />
      <Row label="C.6 / Module 6 of 7" value="Venue Onboarding — Pending" color={MUTE} />
      <Row label="C.7 / Module 7 of 7" value="Final Platform Launch Lock — Pending" color={MUTE} />
    </div>
  );
}

// 28
function NoSecretsStoredPanel() {
  return (
    <div style={s.section}>
      <PanelHead title="No Secrets Stored" sub="Security guarantee: no credentials stored in this layer" tag="CONFIRMED" tagColor={GREEN} />
      <BoolGuard label="contains_secrets" val={false} />
      <BoolGuard label="stores_secrets" val={false} />
    </div>
  );
}

// 29
function PrivateDataProtectionPanel() {
  return (
    <div style={s.section}>
      <PanelHead title="Private Data Protection" sub="User and profile data marked private" tag="PROTECTED" tagColor={BLUE} />
      <BoolGuard label="exposes_private_data" val={true} />
      <Row label="Note" value="All user, profile, role, and access records are scoped as private data." color={MUTE} />
    </div>
  );
}

// 30
function FinancialDataProtectionPanel() {
  return (
    <div style={s.section}>
      <PanelHead title="Financial Data Protection" sub="Financial exposure is FALSE for security governance tables" tag="PROTECTED" tagColor={BLUE} />
      <BoolGuard label="exposes_financial_data" val={false} />
    </div>
  );
}

// 31
function HonestSSOStatePanel() {
  return (
    <div style={s.section}>
      <PanelHead title="SSO State" sub="Honest SSO state — not connected" tag="NOT CONNECTED" tagColor={RED} />
      <BoolGuard label="sso_connected" val={false} />
      <Row label="Required" value="Identity provider integration required for real SSO." color={MUTE} />
    </div>
  );
}

// 32
function HonestMFAStatePanel() {
  return (
    <div style={s.section}>
      <PanelHead title="MFA State" sub="Honest MFA state — not enforced" tag="NOT ENFORCED" tagColor={RED} />
      <BoolGuard label="mfa_enforced" val={false} />
      <Row label="Required" value="MFA provider integration required for real enforcement." color={MUTE} />
    </div>
  );
}

// 33
function HonestDeviceTrustStatePanel() {
  return (
    <div style={s.section}>
      <PanelHead title="Device Trust State" sub="Honest device trust state — not enforced" tag="NOT ENFORCED" tagColor={RED} />
      <BoolGuard label="device_trust_enforced" val={false} />
    </div>
  );
}

// 34
function HonestIPAllowlistStatePanel() {
  return (
    <div style={s.section}>
      <PanelHead title="IP Allowlist State" sub="Honest IP allowlist state — not enforced" tag="NOT ENFORCED" tagColor={RED} />
      <BoolGuard label="ip_allowlist_enforced" val={false} />
    </div>
  );
}

// 35
function HonestComplianceStatePanel() {
  return (
    <div style={s.section}>
      <PanelHead title="Compliance State" sub="Honest compliance state — not certified" tag="NOT CERTIFIED" tagColor={RED} />
      <BoolGuard label="compliance_certified" val={false} />
      <Row label="Note" value="No compliance certification has been obtained." color={MUTE} />
    </div>
  );
}

// 36
function HonestSecurityProviderStatePanel() {
  return (
    <div style={s.section}>
      <PanelHead title="Security Provider State" sub="Honest provider state — not connected" tag="NOT CONNECTED" tagColor={RED} />
      <BoolGuard label="security_provider_connected" val={false} />
    </div>
  );
}

// 37
function HonestNotificationStatePanel() {
  return (
    <div style={s.section}>
      <PanelHead title="Notification State" sub="Honest notification delivery state — not delivered" tag="NOT DELIVERED" tagColor={RED} />
      <BoolGuard label="notification_delivered" val={false} />
      <Row label="Required" value="Notification provider integration required." color={MUTE} />
    </div>
  );
}

// 38
function HonestPermissionEnforcementStatePanel() {
  return (
    <div style={s.section}>
      <PanelHead title="Permission Enforcement State" sub="Placeholder decision records only — not enforced" tag="PLACEHOLDER" tagColor={AMBER} />
      <BoolGuard label="permission_enforced" val={false} />
      <Row label="Note" value="Real enforcement requires security provider and platform activation." color={MUTE} />
    </div>
  );
}

// 39
function NoveeOSSecurityLanguageSelector() {
  const langs = ['en-US', 'es-DO', 'es', 'ht', 'de', 'pt'];
  return (
    <div style={{ ...s.section, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <span style={s.label}>Supported Locales</span>
      {langs.map(l => (
        <span key={l} style={{ background: LINE, color: GOLD2, borderRadius: 4, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{l}</span>
      ))}
    </div>
  );
}

// 40
function EmptySecurityStatePanel() {
  return (
    <div style={{ ...s.section, borderColor: LINE }}>
      <PanelHead title="Empty Security State" sub="Honest empty state — no live records yet" tag="EMPTY" tagColor={MUTE} />
      <Row label="State" value="No security records. Configure provider to begin." color={MUTE} />
    </div>
  );
}

// Summary
function SecurityGovernanceDashboard() {
  return (
    <div style={{ ...s.section, border: `1px solid ${GOLD}44` }}>
      <PanelHead title="Security Governance Summary" sub="Phase C.4 / Module 4 of 7 — NOVEE OS" tag="MODULE 4 OF 7" tagColor={GOLD} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><span style={s.label}>Tables</span><span style={s.value}>24</span></div>
        <div><span style={s.label}>Feature Flags</span><span style={s.value}>42</span></div>
        <div><span style={s.label}>Service Methods</span><span style={s.value}>60+</span></div>
        <div><span style={s.label}>API Routes</span><span style={s.value}>60+</span></div>
        <div><span style={s.label}>Locales</span><span style={s.value}>6</span></div>
        <div><span style={s.label}>Live Security</span>{badge('NOT CONNECTED', RED)}</div>
        <div><span style={s.label}>SSO</span>{badge('NOT CONNECTED', RED)}</div>
        <div><span style={s.label}>MFA</span>{badge('NOT ENFORCED', RED)}</div>
      </div>
      <div style={{ marginTop: 12, color: MUTE, fontSize: 11, fontFamily: 'monospace' }}>{DEVICE_LINE}</div>
    </div>
  );
}

const TABS = [
  { key: 'users',      label: 'Users & Roles' },
  { key: 'permissions', label: 'Permissions' },
  { key: 'approvals',  label: 'Approvals' },
  { key: 'security',   label: 'Security' },
  { key: 'claims',     label: 'Claims & Audit' },
];

function NoveeOSSecurityGovernance() {
  const [tab, setTab] = useState('users');

  return (
    <div style={{ background: NAVY, minHeight: '100vh', color: TEXT, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: CHARCOAL, borderBottom: `1px solid ${LINE}`, padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: GOLD2, fontWeight: 900, fontSize: 18, letterSpacing: 1 }}>NOVEE OS — SECURITY GOVERNANCE</div>
          <div style={{ color: MUTE, fontSize: 12, marginTop: 3 }}>Phase C.4 / Module 4 of 7 — User Roles, Permissions, Admin Security & Platform Governance</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {badge('NOT CONNECTED', RED)}
          {badge('PLACEHOLDER', AMBER)}
          {badge('MODULE 4 OF 7', GOLD)}
        </div>
      </div>

      <div style={{ background: CHARCOAL, borderBottom: `1px solid ${LINE}`, padding: '0 28px', display: 'flex', gap: 0 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '12px 18px', fontSize: 13, fontWeight: 700, color: tab === t.key ? GOLD2 : MUTE, borderBottom: tab === t.key ? `2px solid ${GOLD2}` : '2px solid transparent', transition: 'color 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '24px 28px', maxWidth: 980 }}>
        <SecurityGovernanceDashboard />

        {tab === 'users' && <>
          <PlatformUserPanel />
          <UserProfilePanel />
          <RoleCatalogPanel />
          <UserRoleAssignmentPanel />
          <UserAccessGrantPanel />
        </>}

        {tab === 'permissions' && <>
          <PermissionCatalogPanel />
          <PermissionGroupPanel />
          <RolePermissionAssignmentPanel />
          <ModulePermissionRulePanel />
          <RoutePermissionRulePanel />
          <FeaturePermissionRulePanel />
          <PermissionDecisionPanel />
          <HonestPermissionEnforcementStatePanel />
        </>}

        {tab === 'approvals' && <>
          <AdminApprovalRequestPanel />
          <SensitiveActionRequestPanel />
          <AccessDenialPanel />
          <GovernanceReviewPanel />
          <SecurityEventPanel />
        </>}

        {tab === 'security' && <>
          <HonestSSOStatePanel />
          <HonestMFAStatePanel />
          <HonestDeviceTrustStatePanel />
          <HonestIPAllowlistStatePanel />
          <HonestComplianceStatePanel />
          <HonestSecurityProviderStatePanel />
          <HonestNotificationStatePanel />
          <SessionPolicyPanel />
          <MFAPolicyPanel />
          <SSOProviderPanel />
          <DeviceTrustPanel />
          <IPAllowlistPanel />
          <PlatformSecuritySnapshotPanel />
        </>}

        {tab === 'claims' && <>
          <SafeSecurityClaimsPanel />
          <UnsafeSecurityClaimsPanel />
          <HonestSecurityLimitationsPanel />
          <NoSecretsStoredPanel />
          <PrivateDataProtectionPanel />
          <FinancialDataProtectionPanel />
          <SecurityRoadmapPanel />
          <NoveeOSSecurityLanguageSelector />
          <EmptySecurityStatePanel />
        </>}
      </div>

      <div style={{ borderTop: `1px solid ${LINE}`, padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: MUTE, fontSize: 11 }}>NOVEE OS · Phase C.4 · Module 4 of 7 · User Roles / Permissions / Security</span>
        <span style={{ color: MUTE, fontSize: 11, fontFamily: 'monospace' }}>{DEVICE_LINE}</span>
      </div>
    </div>
  );
}

export default NoveeOSSecurityGovernance;
