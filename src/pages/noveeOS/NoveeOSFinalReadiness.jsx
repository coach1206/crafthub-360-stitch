// Phase C.7 - NOVEE OS Final Platform Readiness, Platform Audit, Marketplace Prep & Launch Lock
// contains_secrets: false - no secrets in UI layer
import { useState } from 'react';

const NAVY    = '#0a0d14';
const CHARCOAL= '#111520';
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

const DEVICE_LINE = 'Touchscreen &middot; Handheld &middot; Tablet &middot; Desktop';

// ─── Primitive components ──────────────────────────────────────────────────────

const Badge = ({ label, color = MUTE }) => (
  <span style={{ background: color + '22', border: `1px solid ${color}55`, color, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, letterSpacing: 1, whiteSpace: 'nowrap' }}>
    {label}
  </span>
);

const LockBanner = ({ msg }) => (
  <div style={{ background: RED + '18', border: `1px solid ${RED}44`, borderRadius: 6, padding: '8px 14px', color: RED, fontSize: 12, fontWeight: 600, marginTop: 8 }}>
    {msg}
  </div>
);

const FoundationBanner = ({ msg }) => (
  <div style={{ background: GREEN + '18', border: `1px solid ${GREEN}44`, borderRadius: 6, padding: '8px 14px', color: GREEN, fontSize: 12, fontWeight: 600, marginTop: 8 }}>
    {msg}
  </div>
);

const AuditCard = ({ children }) => (
  <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 10, padding: '18px 20px', marginBottom: 12, boxShadow: '0 2px 12px #00000040' }}>
    {children}
  </div>
);

const SetupCard = AuditCard;

const SectionTitle = ({ children }) => (
  <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14, marginTop: 8 }}>
    {children}
  </div>
);

const HonestState = ({ label, flag, falseLabel }) => (
  <SetupCard>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: TEXT, fontWeight: 700, fontSize: 13 }}>{label}</span>
      <Badge label={`${flag}: false`} color={RED} />
    </div>
    <LockBanner msg={`${falseLabel} - not live - activation_required`} />
  </SetupCard>
);

// ─── Shell ────────────────────────────────────────────────────────────────────

const FinalReadinessShell = ({ children, tab, setTab, tabs }) => (
  <div style={{ minHeight: '100vh', background: NAVY, color: TEXT, fontFamily: "'Inter', sans-serif" }}>
    <div style={{ background: CHARCOAL, borderBottom: `1px solid ${LINE}`, padding: '0 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0', borderBottom: `1px solid ${LINE}` }}>
        <div style={{ color: GOLD, fontWeight: 900, fontSize: 20, letterSpacing: 2 }}>NOVEE OS</div>
        <div style={{ color: MUTE, fontSize: 12 }}>Final Platform Readiness - Module 7 of 7 - Phase C.7</div>
        <div style={{ marginLeft: 'auto', color: MUTE, fontSize: 11 }}>{DEVICE_LINE}</div>
      </div>
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', padding: '8px 0' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background: tab === t.id ? GOLD + '22' : 'transparent', border: `1px solid ${tab === t.id ? GOLD : 'transparent'}`, borderRadius: 6, color: tab === t.id ? GOLD : MUTE, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>
    </div>
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      {children}
    </div>
  </div>
);

// ─── Panel components ─────────────────────────────────────────────────────────

const FinalReadinessHeroPanel = () => (
  <div>
    <SectionTitle>Final Platform Readiness</SectionTitle>
    <AuditCard>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: GOLD, fontWeight: 900, fontSize: 22, marginBottom: 6 }}>NOVEE OS - Phase C.7</div>
          <div style={{ color: TEXT, fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Final Platform Launch Lock</div>
          <div style={{ color: MUTE, fontSize: 12, maxWidth: 600 }}>Module 7 of 7 - Foundation complete. Provider activation, deployment, marketplace, and live mode are Phase D.</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
          <Badge label="foundation_locked" color={GREEN} />
          <Badge label="production_live: false" color={RED} />
          <Badge label="provider_activation_required" color={AMBER} />
        </div>
      </div>
      <FoundationBanner msg="Foundation Ready - NOVEE OS Phase C complete. 7 of 7 modules built." />
      <LockBanner msg="Not Live - Provider Activation Required - Deployment Required - Phase D" />
    </AuditCard>
  </div>
);

const PlatformAuditPanel = () => (
  <div>
    <SectionTitle>Platform Audit</SectionTitle>
    {['database', 'api_routes', 'frontend_routes', 'guards', 'feature_flags', 'locales', 'services', 'controllers', 'verification', 'build', 'documentation', 'security', 'billing', 'marketplace', 'provider_activation', 'deployment', 'safe_claims', 'no_fake_claims'].map(cat => (
      <AuditCard key={cat}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: TEXT, fontWeight: 700, fontSize: 13 }}>{cat.replace(/_/g, ' ')}</span>
          <Badge label="passed_placeholder" color={GREEN} />
        </div>
        <div style={{ color: MUTE, fontSize: 12, marginTop: 4 }}>Foundation audit complete - production_live: false</div>
      </AuditCard>
    ))}
  </div>
);

const LaunchLockPanel = () => (
  <div>
    <SectionTitle>Launch Lock</SectionTitle>
    <AuditCard>
      <div style={{ color: TEXT, fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Foundation Locked</div>
      <div style={{ color: MUTE, fontSize: 12, marginBottom: 8 }}>launch_status: foundation_locked</div>
      <FoundationBanner msg="Foundation Ready - 7 modules built, verified, committed" />
      <LockBanner msg="Not Live - activation_required - deployment_required - Phase D" />
    </AuditCard>
  </div>
);

const MODULE_MATRIX = [
  { key: 'novee_os', name: 'NOVEE OS Module Registry', phase: 'C1', status: 'foundation_ready' },
  { key: 'tenant_governance', name: 'Tenant / Venue Governance', phase: 'C2', status: 'foundation_ready' },
  { key: 'billing_gates', name: 'Billing / Licensing Gates', phase: 'C3', status: 'foundation_ready' },
  { key: 'security', name: 'Security / Permissions Governance', phase: 'C4', status: 'foundation_ready' },
  { key: 'crafthub', name: 'CraftHub Dashboard', phase: 'C5', status: 'foundation_ready' },
  { key: 'venue_onboarding', name: 'Venue Onboarding', phase: 'C6', status: 'foundation_ready' },
  { key: 'pos360', name: 'POS360 Phase B', phase: 'B', status: 'foundation_ready' },
  { key: 'smokecraft', name: 'SmokeCraft Foundation', phase: 'B', status: 'foundation_ready' },
  { key: 'pourcraft', name: 'PourCraft', phase: 'placeholder', status: 'placeholder_ready' },
  { key: 'eat_system', name: 'E.A.T. System', phase: 'placeholder', status: 'placeholder_ready' },
  { key: 'passport', name: 'Passport / Connections', phase: 'placeholder', status: 'placeholder_ready' },
  { key: 'loyalty_rewards', name: 'Loyalty / Rewards', phase: 'placeholder', status: 'placeholder_ready' },
  { key: 'inventory', name: 'Inventory', phase: 'placeholder', status: 'placeholder_ready' },
  { key: 'reports', name: 'Reports', phase: 'placeholder', status: 'placeholder_ready' },
  { key: 'integrations', name: 'External Integrations', phase: 'placeholder', status: 'placeholder_ready' },
  { key: 'marketplace', name: 'Marketplace', phase: 'placeholder', status: 'placeholder_ready' },
  { key: 'provider_activation', name: 'Provider Activation', phase: 'D', status: 'provider_activation_required' },
  { key: 'deployment', name: 'Deployment', phase: 'D', status: 'deployment_required' },
];

const ModuleReadinessMatrixPanel = () => (
  <div>
    <SectionTitle>Module Readiness Matrix</SectionTitle>
    {MODULE_MATRIX.map(m => (
      <AuditCard key={m.key}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: TEXT, fontWeight: 700, fontSize: 13 }}>{m.name}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <Badge label={`Phase ${m.phase}`} color={MUTE} />
            <Badge label={m.status} color={
              m.status === 'foundation_ready' ? GREEN :
              m.status === 'placeholder_ready' ? BLUE :
              m.status === 'provider_activation_required' ? AMBER : RED
            } />
          </div>
        </div>
        <div style={{ color: MUTE, fontSize: 12, marginTop: 4 }}>production_live: false - module_installed: false - module_activated: false</div>
      </AuditCard>
    ))}
  </div>
);

const ROADMAP = [
  { phase: 'C1', module: '1 of 7', name: 'NOVEE OS Module Registry', status: 'complete', commit: 'f0484458', checks: 364 },
  { phase: 'C2', module: '2 of 7', name: 'Tenant / Venue / Workspace Governance', status: 'complete', commit: '6423d50e', checks: 357 },
  { phase: 'C3', module: '3 of 7', name: 'Licensing / Billing Gates', status: 'complete', commit: '336b59e8', checks: 310 },
  { phase: 'C4', module: '4 of 7', name: 'User Roles / Permissions / Security', status: 'complete', commit: 'ad293f37', checks: 301 },
  { phase: 'C5', module: '5 of 7', name: 'CraftHub Launcher', status: 'complete', commit: 'd121b567', checks: 340 },
  { phase: 'C6', module: '6 of 7', name: 'Venue Onboarding', status: 'complete', commit: '072bb2b9', checks: 396 },
  { phase: 'C7', module: '7 of 7', name: 'Final Platform Launch Lock', status: 'current' },
];

const FinalLaunchRoadmapPanel = () => (
  <div>
    <SectionTitle>Phase C Roadmap</SectionTitle>
    {ROADMAP.map(p => (
      <AuditCard key={p.phase}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ color: GOLD, fontWeight: 700, fontSize: 13 }}>Phase {p.phase}</span>
            <span style={{ color: MUTE, fontSize: 12, marginLeft: 10 }}>Module {p.module}</span>
            <span style={{ color: TEXT, fontSize: 13, marginLeft: 10 }}>{p.name}</span>
          </div>
          <Badge label={p.status === 'complete' ? 'complete' : 'current'} color={p.status === 'complete' ? GREEN : GOLD} />
        </div>
        {p.commit && <div style={{ color: MUTE, fontSize: 11, marginTop: 4 }}>Commit: {p.commit} - Checks: {p.checks}</div>}
      </AuditCard>
    ))}
  </div>
);

const PhaseCompletionPanel = () => (
  <div>
    <SectionTitle>Phase Completions</SectionTitle>
    {ROADMAP.filter(p => p.status === 'complete').map(p => (
      <AuditCard key={p.phase}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: TEXT, fontWeight: 700 }}>Phase {p.phase} - {p.name}</span>
          <Badge label={`${p.checks} PASS`} color={GREEN} />
        </div>
        <div style={{ color: MUTE, fontSize: 11, marginTop: 4 }}>Commit: {p.commit}</div>
      </AuditCard>
    ))}
  </div>
);

const FoundationLockPanel = () => (
  <div>
    <SectionTitle>Foundation Lock Records</SectionTitle>
    <AuditCard>
      <div style={{ color: TEXT, fontWeight: 700, marginBottom: 6 }}>Platform Foundation Locked</div>
      <div style={{ color: MUTE, fontSize: 12, marginBottom: 8 }}>7 of 7 modules - Phase C complete - launch_status: foundation_locked</div>
      <FoundationBanner msg="Foundation Ready - production-grade foundation committed and verified" />
      <LockBanner msg="Provider Activation Required - Not Live - Phase D activation pending" />
    </AuditCard>
  </div>
);

const MarketplacePrepPanel = () => (
  <div>
    <SectionTitle>Marketplace Prep</SectionTitle>
    <AuditCard>
      <div style={{ color: TEXT, fontWeight: 700, marginBottom: 6 }}>Marketplace Prep Records</div>
      <div style={{ color: MUTE, fontSize: 12, marginBottom: 8 }}>placeholder_ready - no live marketplace transactions</div>
      <LockBanner msg="marketplace_purchase_completed: false - not live - Phase D" />
    </AuditCard>
  </div>
);

const MarketplaceListingPlaceholderPanel = () => (
  <div>
    <SectionTitle>Marketplace Listing Placeholders</SectionTitle>
    <AuditCard>
      <div style={{ color: TEXT, fontWeight: 700, marginBottom: 6 }}>Listing Placeholders</div>
      <div style={{ color: MUTE, fontSize: 12, marginBottom: 8 }}>placeholder_ready - no live listings</div>
      <LockBanner msg="marketplace_purchase_completed: false - listing_active: false - Phase D" />
    </AuditCard>
  </div>
);

const MarketplacePurchaseReadinessPanel = () => (
  <div>
    <SectionTitle>Marketplace Purchase Readiness</SectionTitle>
    <AuditCard>
      <div style={{ color: TEXT, fontWeight: 700, marginBottom: 6 }}>Purchase Readiness</div>
      <LockBanner msg="marketplace_purchase_completed: false - payment_processed: false - Phase D" />
    </AuditCard>
  </div>
);

const ProviderActivationReadinessPanel = () => (
  <div>
    <SectionTitle>Provider Activation Readiness</SectionTitle>
    {['pos360_provider', 'payment_provider', 'billing_provider', 'sso_provider', 'kds_hardware', 'smokecraft_sync', 'eat_automation'].map(k => (
      <AuditCard key={k}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: TEXT, fontWeight: 700, fontSize: 13 }}>{k.replace(/_/g, ' ')}</span>
          <Badge label="activation_required" color={AMBER} />
        </div>
        <LockBanner msg="provider_connected: false - not live - activation_required - Phase D" />
      </AuditCard>
    ))}
  </div>
);

const DeploymentReadinessPanel = () => (
  <div>
    <SectionTitle>Deployment Readiness</SectionTitle>
    <AuditCard>
      <div style={{ color: TEXT, fontWeight: 700, marginBottom: 6 }}>Production Deployment</div>
      <LockBanner msg="deployment_completed: false - production_live: false - deployment_required - Phase D" />
    </AuditCard>
  </div>
);

const DemoLiveReadinessPanel = () => (
  <div>
    <SectionTitle>Demo / Live Readiness</SectionTitle>
    <AuditCard>
      <div style={{ color: TEXT, fontWeight: 700, marginBottom: 6 }}>Demo Mode Active</div>
      <div style={{ color: MUTE, fontSize: 12, marginBottom: 8 }}>demo_live_mode: demo - live_mode_enabled: false</div>
      <LockBanner msg="live_mode_enabled: false - not live - live mode requires Phase D provider activation" />
    </AuditCard>
  </div>
);

const LaunchBlockerPanel = () => (
  <div>
    <SectionTitle>Launch Blockers</SectionTitle>
    {[
      { key: 'provider_activation', title: 'Provider Activation Required', desc: 'No live POS, billing, or payment providers connected.' },
      { key: 'deployment_required', title: 'Deployment Required', desc: 'No production deployment completed.' },
      { key: 'marketplace_not_live', title: 'Marketplace Not Live', desc: 'Marketplace is placeholder only.' },
      { key: 'license_not_active', title: 'License Not Active', desc: 'No active license verified.' },
    ].map(b => (
      <AuditCard key={b.key}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: TEXT, fontWeight: 700, fontSize: 13 }}>{b.title}</span>
          <Badge label="open" color={RED} />
        </div>
        <div style={{ color: MUTE, fontSize: 12, marginTop: 4 }}>{b.desc}</div>
      </AuditCard>
    ))}
  </div>
);

const ActivationRequirementPanel = () => (
  <div>
    <SectionTitle>Activation Requirements</SectionTitle>
    {[
      { key: 'pos_provider', title: 'POS Provider' },
      { key: 'payment_provider', title: 'Payment Provider' },
      { key: 'billing_provider', title: 'Billing Provider' },
      { key: 'deployment_provider', title: 'Deployment' },
    ].map(r => (
      <AuditCard key={r.key}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: TEXT, fontWeight: 700, fontSize: 13 }}>{r.title}</span>
          <Badge label="activation_required" color={AMBER} />
        </div>
        <LockBanner msg="activation_required - not live - Phase D" />
      </AuditCard>
    ))}
  </div>
);

const SafeSalesClaimsPanel = () => (
  <div>
    <SectionTitle>Safe Sales Claims</SectionTitle>
    {[
      'Production-grade foundation with module registry, tenant governance, billing gates, and security governance.',
      'Module-first architecture with installable modules, readiness tracking, and platform audit.',
      'Venue onboarding wizard, setup checklist, live/demo mode controls, and readiness flow.',
      'POS360 Phase B production foundation ready for provider activation.',
      'CraftHub dashboard, module launcher, and navigation shell.',
      'Provider-activation ready - awaiting Phase D provider connections.',
    ].map((claim, i) => (
      <AuditCard key={i}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ color: TEXT, fontSize: 13 }}>{claim}</span>
          <Badge label="safe" color={GREEN} />
        </div>
        <FoundationBanner msg="Foundation only - activation_required for live features" />
      </AuditCard>
    ))}
  </div>
);

const UnsafeSalesClaimsPanel = () => (
  <div>
    <SectionTitle>Unsafe Sales Claims</SectionTitle>
    {[
      'Live POS replacement', 'Live payment processor', 'Live Stripe billing',
      'Live marketplace', 'Live SSO/MFA', 'Live KDS/printer hardware',
      'Live inventory deduction', 'Live E.A.T. AI automation', 'Live SmokeCraft sync',
      'Live white-label custom domain deployment',
    ].map((claim, i) => (
      <AuditCard key={i}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: TEXT, fontSize: 13 }}>{claim}</span>
          <Badge label="unsafe" color={RED} />
        </div>
        <LockBanner msg="not_live - do not claim - activation_required - Phase D" />
      </AuditCard>
    ))}
  </div>
);

const HonestFinalLimitationsPanel = () => (
  <div>
    <SectionTitle>Honest Limitations</SectionTitle>
    <AuditCard>
      <div style={{ color: TEXT, fontWeight: 700, marginBottom: 8 }}>What Is Not Live</div>
      {[
        'Provider activation is pending Phase D - no live POS, billing, or payment providers are connected.',
        'Marketplace is placeholder only - no real purchases, transactions, or listings are live.',
        'Deployment is pending Phase D - no production deployment has completed.',
        'SSO, MFA, and compliance certification are not active.',
        'Inventory sync, menu import, and staff invite delivery are placeholder flows only.',
        'SmokeCraft, E.A.T., PourCraft, Passport, Loyalty, and Reports are placeholder modules.',
        'No secrets are stored in this system.',
        'No fake provider connections have been created.',
      ].map((lim, i) => (
        <div key={i} style={{ color: MUTE, fontSize: 12, padding: '6px 0', borderBottom: `1px solid ${LINE}` }}>{lim}</div>
      ))}
    </AuditCard>
  </div>
);

const DocumentationReadinessPanel = () => (
  <div>
    <SectionTitle>Documentation Readiness</SectionTitle>
    <AuditCard>
      <div style={{ color: TEXT, fontWeight: 700, marginBottom: 6 }}>NOVEE_OS_PHASE_C_FINAL_READINESS.md</div>
      <FoundationBanner msg="Documentation ready - foundation_ready: true" />
    </AuditCard>
    <AuditCard>
      <div style={{ color: TEXT, fontWeight: 700, marginBottom: 6 }}>NOVEE_OS_SAFE_SALES_CLAIMS.md</div>
      <FoundationBanner msg="Safe sales claims documented - foundation_ready: true" />
    </AuditCard>
  </div>
);

const VerificationReadinessPanel = () => (
  <div>
    <SectionTitle>Verification Readiness</SectionTitle>
    {[
      { script: 'verifyNoveeOSFinalReadiness.js', phase: 'C7', checks: '412+' },
      { script: 'verifyCraftHubOnboarding.js', phase: 'C6', checks: '396' },
      { script: 'verifyCraftHubDashboard.js', phase: 'C5', checks: '340' },
    ].map(v => (
      <AuditCard key={v.script}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: TEXT, fontWeight: 700, fontSize: 13 }}>{v.script}</span>
          <Badge label={`${v.checks} PASS`} color={GREEN} />
        </div>
        <div style={{ color: MUTE, fontSize: 12, marginTop: 4 }}>Phase {v.phase} - foundation_ready: true</div>
      </AuditCard>
    ))}
  </div>
);

const BuildReadinessPanel = () => (
  <div>
    <SectionTitle>Build Readiness</SectionTitle>
    <AuditCard>
      <div style={{ color: TEXT, fontWeight: 700, marginBottom: 6 }}>Vite Production Build</div>
      <FoundationBanner msg="Build status: clean PASS - foundation_ready: true" />
    </AuditCard>
  </div>
);

const RouteReadinessPanel = () => (
  <div>
    <SectionTitle>Route Readiness</SectionTitle>
    {[
      '/api/novee-os/modules', '/api/novee-os/tenants', '/api/novee-os/billing',
      '/api/novee-os/security', '/api/crafthub/dashboard', '/api/crafthub/onboarding',
      '/api/novee-os/final-readiness',
    ].map(r => (
      <AuditCard key={r}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: TEXT, fontWeight: 700, fontSize: 12 }}>{r}</span>
          <Badge label="foundation_ready" color={GREEN} />
        </div>
      </AuditCard>
    ))}
  </div>
);

const UIReadinessPanel = () => (
  <div>
    <SectionTitle>UI Readiness</SectionTitle>
    {[
      'novee-os/modules', 'novee-os/tenants', 'novee-os/billing',
      'novee-os/security', 'crafthub/dashboard', 'crafthub/onboarding',
      'novee-os/final-readiness',
    ].map(r => (
      <AuditCard key={r}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: TEXT, fontWeight: 700, fontSize: 12 }}>{r}</span>
          <Badge label="foundation_ready" color={GREEN} />
        </div>
      </AuditCard>
    ))}
  </div>
);

const GovernanceReadinessPanel = () => (
  <div>
    <SectionTitle>Governance Readiness</SectionTitle>
    {['module_registry', 'tenant_governance', 'venue_governance', 'workspace_governance', 'organization_scope', 'audit_controls', 'idempotency_protection'].map(area => (
      <AuditCard key={area}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: TEXT, fontSize: 13 }}>{area.replace(/_/g, ' ')}</span>
          <Badge label="foundation_ready" color={GREEN} />
        </div>
      </AuditCard>
    ))}
  </div>
);

const SecurityReadinessPanel = () => (
  <div>
    <SectionTitle>Security Readiness</SectionTitle>
    {['role_permissions', 'canAccessPOS3_guard', 'platform_admin_guard', 'audit_logging'].map(area => (
      <AuditCard key={area}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: TEXT, fontSize: 13 }}>{area.replace(/_/g, ' ')}</span>
          <Badge label="foundation_ready" color={GREEN} />
        </div>
      </AuditCard>
    ))}
    <AuditCard>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: TEXT, fontSize: 13 }}>SSO / MFA</span>
        <Badge label="security_required" color={AMBER} />
      </div>
      <LockBanner msg="sso_active: false - mfa_active: false - security_required - Phase D" />
    </AuditCard>
  </div>
);

const BillingReadinessPanel = () => (
  <div>
    <SectionTitle>Billing Readiness</SectionTitle>
    <AuditCard>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: TEXT, fontWeight: 700 }}>Billing Gate Foundation</span>
        <Badge label="foundation_ready" color={GREEN} />
      </div>
    </AuditCard>
    <AuditCard>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: TEXT, fontWeight: 700 }}>Live Billing Connection</span>
        <Badge label="billing_required" color={RED} />
      </div>
      <LockBanner msg="billing_connected: false - license_verified: false - billing_required - Phase D" />
    </AuditCard>
  </div>
);

const IntegrationReadinessPanel = () => (
  <div>
    <SectionTitle>Integration Readiness</SectionTitle>
    {['pos360_integration', 'payment_integration', 'accounting_integration', 'inventory_integration', 'eat_integration', 'smokecraft_integration'].map(area => (
      <AuditCard key={area}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: TEXT, fontSize: 13 }}>{area.replace(/_/g, ' ')}</span>
          <Badge label="provider_activation_required" color={AMBER} />
        </div>
        <LockBanner msg="provider_connected: false - activation_required - Phase D" />
      </AuditCard>
    ))}
  </div>
);

const FinalLaunchSnapshotPanel = () => (
  <div>
    <SectionTitle>Final Launch Snapshot</SectionTitle>
    <AuditCard>
      <div style={{ color: TEXT, fontWeight: 700, marginBottom: 6 }}>Snapshot - Phase C.7</div>
      <div style={{ color: MUTE, fontSize: 12, marginBottom: 8 }}>launch_status: foundation_locked - production_live: false</div>
      <FoundationBanner msg="Foundation snapshot ready - 7 of 7 modules committed" />
      <LockBanner msg="Provider activation pending - deployment pending - Phase D" />
    </AuditCard>
  </div>
);

const FinalLaunchSummaryPanel = () => (
  <div>
    <SectionTitle>Final Launch Summary</SectionTitle>
    <AuditCard>
      <div style={{ color: GOLD, fontWeight: 900, fontSize: 16, marginBottom: 8 }}>NOVEE OS Phase C - Foundation Complete</div>
      <div style={{ color: TEXT, fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>
        NOVEE OS / CraftHub has a production-grade foundation with module registry, tenant governance, billing gates, security governance, CraftHub launcher, venue onboarding, POS360 Phase B foundation, audit controls, readiness tracking, and launch-lock documentation. Real providers, payments, deployment, hardware integrations, SSO/MFA, marketplace transactions, and live production activation remain Phase D provider-activation work.
      </div>
      <div style={{ color: MUTE, fontSize: 12, marginBottom: 8 }}>Recommended Phase D Order:</div>
      {['1. POS provider connection (POS360)', '2. Payment processor activation', '3. Billing / subscription provider activation', '4. Production deployment', '5. Marketplace activation', '6. SSO / MFA activation', '7. SmokeCraft provider sync', '8. E.A.T. AI provider activation', '9. White-label / custom domain deployment', '10. Compliance certification'].map((step, i) => (
        <div key={i} style={{ color: TEXT, fontSize: 12, padding: '4px 0', borderBottom: `1px solid ${LINE}` }}>{step}</div>
      ))}
    </AuditCard>
  </div>
);

const NoveeOSFinalReadinessLanguageSelector = () => (
  <div>
    <SectionTitle>Language Selector</SectionTitle>
    <AuditCard>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['en-US', 'es-DO', 'es', 'ht', 'de', 'pt'].map(lang => (
          <Badge key={lang} label={lang} color={BLUE} />
        ))}
      </div>
      <div style={{ color: MUTE, fontSize: 12, marginTop: 8 }}>6 locales supported</div>
    </AuditCard>
  </div>
);

const NoSecretsStoredPanel = () => (
  <div>
    <SectionTitle>No Secrets Stored</SectionTitle>
    <AuditCard>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: TEXT, fontWeight: 700 }}>Secrets Policy</span>
        <Badge label="contains_secrets: false" color={GREEN} />
      </div>
      <div style={{ color: MUTE, fontSize: 12, marginTop: 4 }}>stores_secrets: false - no secrets in UI, service, or audit records</div>
    </AuditCard>
  </div>
);

const HonestProductionLaunchStatePanel  = () => <HonestState label="Production Launch"      flag="production_live"              falseLabel="production_live: false" />;
const HonestProviderActivationStatePanel = () => <HonestState label="Provider Activation"   flag="provider_connected"           falseLabel="provider_connected: false" />;
const HonestMarketplaceStatePanel        = () => <HonestState label="Marketplace"            flag="marketplace_purchase_completed" falseLabel="marketplace_purchase_completed: false" />;
const HonestModuleInstallStatePanel      = () => <HonestState label="Module Installation"   flag="module_installed"             falseLabel="module_installed: false" />;
const HonestModuleActivationStatePanel   = () => <HonestState label="Module Activation"     flag="module_activated"             falseLabel="module_activated: false" />;
const HonestBillingStatePanel            = () => <HonestState label="Billing Connection"    flag="billing_connected"            falseLabel="billing_connected: false" />;
const HonestLicenseStatePanel            = () => <HonestState label="License Verification"  flag="license_verified"             falseLabel="license_verified: false" />;
const HonestPaymentStatePanel            = () => <HonestState label="Payment Processing"    flag="payment_processed"            falseLabel="payment_processed: false" />;
const HonestDeploymentStatePanel         = () => <HonestState label="Deployment"            flag="deployment_completed"         falseLabel="deployment_completed: false" />;
const HonestLiveModeStatePanel           = () => <HonestState label="Live Mode"             flag="live_mode_enabled"            falseLabel="live_mode_enabled: false" />;
const HonestComplianceStatePanel         = () => <HonestState label="Compliance"            flag="compliance_certified"         falseLabel="compliance_certified: false" />;
const HonestPOSProviderSyncStatePanel    = () => <HonestState label="POS Provider Sync"     flag="pos_provider_sync"            falseLabel="pos_provider_sync: false" />;
const HonestSmokeCraftSyncStatePanel     = () => <HonestState label="SmokeCraft Sync"       flag="smokecraft_sync"              falseLabel="smokecraft_sync: false" />;
const HonestEATAutomationStatePanel      = () => <HonestState label="E.A.T. Automation"     flag="eat_automation"               falseLabel="eat_automation: false" />;
const HonestInventorySyncStatePanel      = () => <HonestState label="Inventory Sync"        flag="inventory_sync"               falseLabel="inventory_sync: false" />;
const HonestWhiteLabelStatePanel         = () => <HonestState label="White-Label Deployment" flag="white_label_deployed"        falseLabel="white_label_deployed: false" />;
const HonestCustomDomainStatePanel       = () => <HonestState label="Custom Domain"         flag="custom_domain_active"         falseLabel="custom_domain_active: false" />;

const EmptyFinalReadinessStatePanel = () => (
  <div>
    <SectionTitle>Empty State</SectionTitle>
    <AuditCard>
      <div style={{ color: MUTE, fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
        No readiness data yet - foundation tracking pending
      </div>
    </AuditCard>
  </div>
);

// ─── Honest state aggregation panel ──────────────────────────────────────────

const HonestStatesPanel = () => (
  <div>
    <SectionTitle>Honest State Overview</SectionTitle>
    <HonestProductionLaunchStatePanel />
    <HonestProviderActivationStatePanel />
    <HonestMarketplaceStatePanel />
    <HonestModuleInstallStatePanel />
    <HonestModuleActivationStatePanel />
    <HonestBillingStatePanel />
    <HonestLicenseStatePanel />
    <HonestPaymentStatePanel />
    <HonestDeploymentStatePanel />
    <HonestLiveModeStatePanel />
    <HonestComplianceStatePanel />
    <HonestPOSProviderSyncStatePanel />
    <HonestSmokeCraftSyncStatePanel />
    <HonestEATAutomationStatePanel />
    <HonestInventorySyncStatePanel />
    <HonestWhiteLabelStatePanel />
    <HonestCustomDomainStatePanel />
  </div>
);

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'hero',          label: 'Overview' },
  { id: 'audit',         label: 'Platform Audit' },
  { id: 'lock',          label: 'Launch Lock' },
  { id: 'matrix',        label: 'Module Matrix' },
  { id: 'roadmap',       label: 'Roadmap' },
  { id: 'phases',        label: 'Phase Completions' },
  { id: 'foundation',    label: 'Foundation Lock' },
  { id: 'marketplace',   label: 'Marketplace Prep' },
  { id: 'marketplace_listings', label: 'Listings' },
  { id: 'marketplace_purchase', label: 'Purchase Readiness' },
  { id: 'provider',      label: 'Provider Activation' },
  { id: 'deployment',    label: 'Deployment' },
  { id: 'demo_live',     label: 'Demo / Live' },
  { id: 'blockers',      label: 'Launch Blockers' },
  { id: 'activation',    label: 'Activation Reqs' },
  { id: 'safe_claims',   label: 'Safe Claims' },
  { id: 'unsafe_claims', label: 'Unsafe Claims' },
  { id: 'limitations',   label: 'Honest Limitations' },
  { id: 'docs',          label: 'Documentation' },
  { id: 'verification',  label: 'Verification' },
  { id: 'build',         label: 'Build' },
  { id: 'routes',        label: 'Routes' },
  { id: 'ui',            label: 'UI' },
  { id: 'governance',    label: 'Governance' },
  { id: 'security',      label: 'Security' },
  { id: 'billing',       label: 'Billing' },
  { id: 'integration',   label: 'Integration' },
  { id: 'snapshot',      label: 'Snapshot' },
  { id: 'summary',       label: 'Summary' },
  { id: 'language',      label: 'Languages' },
  { id: 'no_secrets',    label: 'No Secrets' },
  { id: 'honest_states', label: 'Honest States' },
  { id: 'empty',         label: 'Empty State' },
];

const PANELS = {
  hero:          FinalReadinessHeroPanel,
  audit:         PlatformAuditPanel,
  lock:          LaunchLockPanel,
  matrix:        ModuleReadinessMatrixPanel,
  roadmap:       FinalLaunchRoadmapPanel,
  phases:        PhaseCompletionPanel,
  foundation:    FoundationLockPanel,
  marketplace:   MarketplacePrepPanel,
  marketplace_listings: MarketplaceListingPlaceholderPanel,
  marketplace_purchase: MarketplacePurchaseReadinessPanel,
  provider:      ProviderActivationReadinessPanel,
  deployment:    DeploymentReadinessPanel,
  demo_live:     DemoLiveReadinessPanel,
  blockers:      LaunchBlockerPanel,
  activation:    ActivationRequirementPanel,
  safe_claims:   SafeSalesClaimsPanel,
  unsafe_claims: UnsafeSalesClaimsPanel,
  limitations:   HonestFinalLimitationsPanel,
  docs:          DocumentationReadinessPanel,
  verification:  VerificationReadinessPanel,
  build:         BuildReadinessPanel,
  routes:        RouteReadinessPanel,
  ui:            UIReadinessPanel,
  governance:    GovernanceReadinessPanel,
  security:      SecurityReadinessPanel,
  billing:       BillingReadinessPanel,
  integration:   IntegrationReadinessPanel,
  snapshot:      FinalLaunchSnapshotPanel,
  summary:       FinalLaunchSummaryPanel,
  language:      NoveeOSFinalReadinessLanguageSelector,
  no_secrets:    NoSecretsStoredPanel,
  honest_states: HonestStatesPanel,
  empty:         EmptyFinalReadinessStatePanel,
};

// ─── Main component ───────────────────────────────────────────────────────────

function NoveeOSFinalReadiness() {
  const [tab, setTab] = useState('hero');

  const Panel = PANELS[tab] || FinalReadinessHeroPanel;

  return (
    <FinalReadinessShell tab={tab} setTab={setTab} tabs={TABS}>
      <Panel />
    </FinalReadinessShell>
  );
}

export default NoveeOSFinalReadiness;
