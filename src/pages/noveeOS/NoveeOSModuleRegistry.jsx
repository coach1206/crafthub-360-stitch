import { useState } from 'react';
import { tNoveeOSModules } from '../../locales/noveeOSModules.js';

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

const TABS = [
  'Dashboard', 'Registry', 'Core Modules', 'Craft Modules', 'POS Modules',
  'Management Modules', 'Integration Modules', 'Versions', 'Backend Routes',
  'Frontend Routes', 'Dependencies', 'Permissions', 'Feature Flags',
  'Installations', 'Activation', 'Tenant Availability', 'Venue Availability',
  'Plan Requirements', 'License Requirements', 'Demo/Live Mode',
  'Readiness', 'Health', 'Rollback', 'Platform Snapshot',
  'Safe Claims', 'Unsafe Claims', 'Honest Limitations', 'Roadmap',
  'Language', 'No Secrets', 'Honest Install', 'Honest Activation',
  'Honest Marketplace', 'Honest License', 'Honest Billing',
  'Honest Deployment', 'Empty State',
];

const CORE_MODULES = [
  { key: 'novee-os',              name: 'NOVEE OS',              category: 'core_os',          readiness: 'foundation_ready',            install: 'not_installed',        activation: 'not_active' },
  { key: 'crafthub',              name: 'CraftHub',              category: 'experience_hub',   readiness: 'foundation_ready',            install: 'not_installed',        activation: 'not_active' },
  { key: 'pos360',                name: 'POS360',                category: 'pos',              readiness: 'contract_ready',              install: 'installed_placeholder', activation: 'active_placeholder' },
  { key: 'smokecraft',            name: 'SmokeCraft',            category: 'craft_experience', readiness: 'contract_ready',              install: 'installed_placeholder', activation: 'active_placeholder' },
  { key: 'pourcraft',             name: 'PourCraft',             category: 'craft_experience', readiness: 'provider_activation_required', install: 'not_installed',        activation: 'not_active' },
  { key: 'eat-system',            name: 'E.A.T. System',         category: 'management',       readiness: 'contract_ready',              install: 'installed_placeholder', activation: 'active_placeholder' },
  { key: 'passport-connections',  name: 'Passport / Connections',category: 'loyalty',          readiness: 'contract_ready',              install: 'installed_placeholder', activation: 'active_placeholder' },
  { key: 'loyalty-rewards',       name: 'Loyalty / Rewards',     category: 'loyalty',          readiness: 'contract_ready',              install: 'installed_placeholder', activation: 'active_placeholder' },
  { key: 'venue-admin',           name: 'Venue Admin',           category: 'admin',            readiness: 'contract_ready',              install: 'installed_placeholder', activation: 'active_placeholder' },
  { key: 'inventory',             name: 'Inventory',             category: 'inventory',        readiness: 'provider_activation_required', install: 'not_installed',        activation: 'not_active' },
  { key: 'reports',               name: 'Reports',               category: 'reporting',        readiness: 'contract_ready',              install: 'installed_placeholder', activation: 'active_placeholder' },
  { key: 'external-integrations', name: 'External Integrations', category: 'integration',      readiness: 'provider_activation_required', install: 'installed_placeholder', activation: 'not_active' },
];

const ROADMAP = [
  { phase: 'C.1', module: 1, of: 7, title: 'Module Registry, Platform Control Center & Installable Module Governance', status: 'complete' },
  { phase: 'C.2', module: 2, of: 7, title: 'Tenant, Venue, Organization & Workspace Governance', status: 'pending' },
  { phase: 'C.3', module: 3, of: 7, title: 'Licensing, Plans, Trials, Billing Gates & Feature Access', status: 'pending' },
  { phase: 'C.4', module: 4, of: 7, title: 'User Roles, Permissions, Admin Security & Platform Governance', status: 'pending' },
  { phase: 'C.5', module: 5, of: 7, title: 'CraftHub Main Dashboard, Module Launcher, Navigation Shell & Premium Experience Hub', status: 'pending' },
  { phase: 'C.6', module: 6, of: 7, title: 'Venue Onboarding Wizard, Setup Checklist, Live/Demo Mode Controls & Readiness Flow', status: 'pending' },
  { phase: 'C.7', module: 7, of: 7, title: 'NOVEE OS Final Production Readiness, Platform Audit, Marketplace Prep & Launch Lock', status: 'pending' },
];

const card = (title, children, accent = GOLD) => (
  <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
    <div style={{ color: accent, fontWeight: 700, fontSize: 14, letterSpacing: '0.04em', marginBottom: 12, textTransform: 'uppercase' }}>{title}</div>
    {children}
  </div>
);

const row = (label, value, color = TEXT) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${LINE}` }}>
    <span style={{ color: MUTE, fontSize: 12 }}>{label}</span>
    <span style={{ color, fontSize: 12 }}>{String(value)}</span>
  </div>
);

const badge = (label, color) => (
  <span style={{ background: color, color: '#fff', borderRadius: 3, padding: '2px 7px', fontSize: 11, marginRight: 4, letterSpacing: '0.03em', fontWeight: 600 }}>{label}</span>
);

const readinessBadge = r => {
  if (r === 'contract_ready') return badge('Contract Ready', GREEN);
  if (r === 'foundation_ready') return badge('Foundation Ready', BLUE);
  if (r === 'provider_activation_required') return badge('Provider Activation Required', AMBER);
  return badge(r, MUTE);
};

const installBadge = s => {
  if (s === 'installed_placeholder') return badge('Installed (Placeholder)', PURPLE);
  if (s === 'not_installed') return badge('Not Installed', MUTE);
  return badge(s, MUTE);
};

const activationBadge = s => {
  if (s === 'active_placeholder') return badge('Active (Placeholder)', PURPLE);
  if (s === 'not_active') return badge('Not Active', MUTE);
  return badge(s, MUTE);
};

function NoveeOSModuleDashboard({ locale }) {
  return card(tNoveeOSModules('platformControlCenter', locale), (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        {badge('Phase C.1 Complete', GREEN)}
        {badge('Module 1 of 7', BLUE)}
        {badge('12 Core Modules', GOLD)}
        {badge('No Fake Claims', GREEN)}
        {badge('No Secrets', GREEN)}
      </div>
      {row('Total Core Modules', 12)}
      {row('Phase C Modules', 7)}
      {row('Phase C.1 Status', 'complete', GREEN)}
      {row('Platform Status', 'foundation_ready', BLUE)}
      {row('Live Providers Connected', 'false — activation required', AMBER)}
      {row('Marketplace', 'placeholder — not live', AMBER)}
      {row('Billing Connected', 'false', AMBER)}
      {row('Deployment Completed', 'false', AMBER)}
      <div style={{ marginTop: 12, padding: 10, background: '#0d1420', borderRadius: 6, border: `1px solid ${BLUE}` }}>
        <div style={{ color: BLUE, fontSize: 12 }}>NOVEE OS Platform Control Center — Phase C.1 foundation is in place. All 12 core module registrations are confirmed. Live provider activation is required for production operation.</div>
      </div>
    </div>
  ));
}

function ModuleRegistryPanel({ locale }) {
  return card(tNoveeOSModules('moduleRegistry', locale), (
    <div>
      {CORE_MODULES.map(m => (
        <div key={m.key} style={{ padding: '8px 0', borderBottom: `1px solid ${LINE}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: GOLD2, fontWeight: 700, fontSize: 13 }}>{m.name}</span>
            <span style={{ color: MUTE, fontSize: 11 }}>{m.category}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {readinessBadge(m.readiness)}
            {installBadge(m.install)}
            {activationBadge(m.activation)}
          </div>
        </div>
      ))}
    </div>
  ));
}

function CoreModulesPanel({ locale }) {
  const core = CORE_MODULES.filter(m => ['core_os', 'experience_hub'].includes(m.category));
  return card(tNoveeOSModules('coreModules', locale), (
    <div>
      {core.map(m => (
        <div key={m.key} style={{ padding: '8px 0', borderBottom: `1px solid ${LINE}` }}>
          <div style={{ color: GOLD2, fontWeight: 700, fontSize: 13 }}>{m.name}</div>
          <div style={{ color: MUTE, fontSize: 11, marginTop: 2 }}>{m.key}</div>
          <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {readinessBadge(m.readiness)}
            {installBadge(m.install)}
          </div>
        </div>
      ))}
    </div>
  ));
}

function CraftModulesPanel({ locale }) {
  const craft = CORE_MODULES.filter(m => m.category === 'craft_experience');
  return card(tNoveeOSModules('craftModules', locale), (
    <div>
      {craft.map(m => (
        <div key={m.key} style={{ padding: '8px 0', borderBottom: `1px solid ${LINE}` }}>
          <div style={{ color: GOLD2, fontWeight: 700, fontSize: 13 }}>{m.name}</div>
          <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {readinessBadge(m.readiness)}
            {installBadge(m.install)}
            {activationBadge(m.activation)}
          </div>
        </div>
      ))}
    </div>
  ));
}

function POSModulesPanel({ locale }) {
  const pos = CORE_MODULES.filter(m => m.category === 'pos');
  return card(tNoveeOSModules('posModules', locale), (
    <div>
      {pos.map(m => (
        <div key={m.key} style={{ padding: '8px 0', borderBottom: `1px solid ${LINE}` }}>
          <div style={{ color: GOLD2, fontWeight: 700, fontSize: 13 }}>{m.name}</div>
          <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {readinessBadge(m.readiness)}
            {installBadge(m.install)}
            {activationBadge(m.activation)}
          </div>
        </div>
      ))}
    </div>
  ));
}

function ManagementModulesPanel({ locale }) {
  const mgmt = CORE_MODULES.filter(m => ['management', 'loyalty', 'admin', 'inventory', 'reporting'].includes(m.category));
  return card(tNoveeOSModules('managementModules', locale), (
    <div>
      {mgmt.map(m => (
        <div key={m.key} style={{ padding: '8px 0', borderBottom: `1px solid ${LINE}` }}>
          <div style={{ color: GOLD2, fontWeight: 700, fontSize: 13 }}>{m.name}</div>
          <div style={{ color: MUTE, fontSize: 11 }}>{m.category}</div>
          <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {readinessBadge(m.readiness)}
            {installBadge(m.install)}
          </div>
        </div>
      ))}
    </div>
  ));
}

function IntegrationModulesPanel({ locale }) {
  const integ = CORE_MODULES.filter(m => m.category === 'integration');
  return card(tNoveeOSModules('integrationModules', locale), (
    <div>
      {integ.map(m => (
        <div key={m.key} style={{ padding: '8px 0', borderBottom: `1px solid ${LINE}` }}>
          <div style={{ color: GOLD2, fontWeight: 700, fontSize: 13 }}>{m.name}</div>
          <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {readinessBadge(m.readiness)}
            {installBadge(m.install)}
            {activationBadge(m.activation)}
          </div>
        </div>
      ))}
    </div>
  ));
}

function ModuleVersionPanel({ locale }) {
  return card(tNoveeOSModules('modules', locale) + ' — Versions', (
    <div>
      {row('Versioning', 'enabled')}
      {row('Current registry version', '0.1.0')}
      {row('Database required for version history', 'true', AMBER)}
      <div style={{ marginTop: 8, color: MUTE, fontSize: 12 }}>Version records require a configured production database. No version history is available in local preview mode.</div>
    </div>
  ));
}

function ModuleBackendRoutesPanel({ locale }) {
  return card(tNoveeOSModules('moduleRoutes', locale) + ' — Backend', (
    <div>
      {row('API Mount', '/api/novee-os/modules')}
      {row('Default registry', 'GET /default-registry')}
      {row('List modules', 'GET /registry')}
      {row('Get module', 'GET /registry/:moduleKey')}
      {row('Register module', 'POST /registry (guarded)')}
      {row('Update status', 'PATCH /registry/:moduleKey/status (guarded)')}
      {row('Guard used', 'canAccessPOS3')}
      {row('platformAdminGuardRequired', 'true', AMBER)}
    </div>
  ));
}

function ModuleFrontendRoutesPanel({ locale }) {
  return card(tNoveeOSModules('moduleRoutes', locale) + ' — Frontend', (
    <div>
      {row('UI Route', 'novee-os/modules')}
      {row('Component', 'NoveeOSModuleRegistry')}
      {row('Registered in App.jsx', 'true', GREEN)}
    </div>
  ));
}

function ModuleDependenciesPanel({ locale }) {
  return card(tNoveeOSModules('moduleDependencies', locale), (
    <div>
      {row('pos360 requires', 'venue-admin')}
      {row('smokecraft requires', 'pos360')}
      {row('eat-system requires', 'pos360')}
      {row('loyalty-rewards requires', 'venue-admin')}
      {row('external-integrations requires', 'venue-admin')}
      <div style={{ marginTop: 8, color: MUTE, fontSize: 12 }}>Dependency records require a configured production database for persistence.</div>
    </div>
  ));
}

function ModulePermissionsPanel({ locale }) {
  const scopes = ['platform_owner', 'organization_admin', 'venue_owner', 'manager', 'staff', 'guest', 'system', 'custom'];
  return card(tNoveeOSModules('modulePermissions', locale), (
    <div>
      {scopes.map(s => (
        <div key={s} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${LINE}` }}>
          <span style={{ color: TEXT, fontSize: 12 }}>{s}</span>
          {badge('Scope Defined', BLUE)}
        </div>
      ))}
    </div>
  ));
}

function ModuleFeatureFlagsPanel({ locale }) {
  const flags = [
    'noveeOSModuleRegistryEnabled', 'platformControlCenterEnabled', 'moduleVersioningEnabled',
    'noFakeInstallEnforced', 'noFakeActivationEnforced', 'noFakeMarketplacePurchaseEnforced',
    'noFakeLicenseVerificationEnforced', 'noFakeBillingConnectionEnforced',
    'noFakeDeploymentEnforced', 'noFakeProviderConnectionEnforced', 'noSecretsStorageEnforced',
    'platformAdminGuardRequired',
  ];
  return card(tNoveeOSModules('moduleFeatureFlags', locale), (
    <div>
      {flags.map(f => (
        <div key={f} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${LINE}` }}>
          <span style={{ color: TEXT, fontSize: 12 }}>{f}</span>
          {badge('true', GREEN)}
        </div>
      ))}
    </div>
  ));
}

function ModuleInstallationsPanel({ locale }) {
  return card(tNoveeOSModules('installedModules', locale), (
    <div>
      <div style={{ marginBottom: 10, padding: 8, background: '#1a1400', borderRadius: 5, border: `1px solid ${AMBER}` }}>
        <div style={{ color: AMBER, fontSize: 12 }}>Installations are placeholder records only. No live module installation has occurred. Live installation requires Phase C provider activation.</div>
      </div>
      {CORE_MODULES.filter(m => m.install === 'installed_placeholder').map(m => (
        <div key={m.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${LINE}` }}>
          <span style={{ color: TEXT, fontSize: 13 }}>{m.name}</span>
          {badge('Placeholder', PURPLE)}
        </div>
      ))}
    </div>
  ));
}

function ModuleActivationPanel({ locale }) {
  return card(tNoveeOSModules('activationStatus', locale), (
    <div>
      <div style={{ marginBottom: 10, padding: 8, background: '#1a1400', borderRadius: 5, border: `1px solid ${AMBER}` }}>
        <div style={{ color: AMBER, fontSize: 12 }}>Activation states are placeholder records only. No live module activation has occurred. Live activation requires Phase C provider activation.</div>
      </div>
      {CORE_MODULES.filter(m => m.activation === 'active_placeholder').map(m => (
        <div key={m.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${LINE}` }}>
          <span style={{ color: TEXT, fontSize: 13 }}>{m.name}</span>
          {badge('Active (Placeholder)', PURPLE)}
        </div>
      ))}
    </div>
  ));
}

function TenantAvailabilityPanel({ locale }) {
  return card(tNoveeOSModules('modules', locale) + ' — Tenant Availability', (
    <div>
      {row('Tenant availability tracking', 'enabled')}
      {row('Organization ID scoped', 'true')}
      {row('Database required for records', 'true', AMBER)}
      {row('Default availability', 'unavailable', MUTE)}
      <div style={{ marginTop: 8, color: MUTE, fontSize: 12 }}>Full tenant availability requires Phase C.2 Tenant Governance.</div>
    </div>
  ));
}

function VenueAvailabilityPanel({ locale }) {
  return card(tNoveeOSModules('modules', locale) + ' — Venue Availability', (
    <div>
      {row('Venue availability tracking', 'enabled')}
      {row('Venue ID scoped', 'true')}
      {row('Organization ID scoped', 'true')}
      {row('Database required for records', 'true', AMBER)}
      <div style={{ marginTop: 8, color: MUTE, fontSize: 12 }}>Venue availability configuration requires a connected production database.</div>
    </div>
  ));
}

function PlanRequirementPanel({ locale }) {
  return card(tNoveeOSModules('modules', locale) + ' — Plan Requirements', (
    <div>
      <div style={{ marginBottom: 8, color: AMBER, fontSize: 12 }}>Plan requirements are placeholders. Live billing gates require Phase C.3 Licensing & Billing.</div>
      {row('Plan requirement tracking', 'enabled')}
      {row('Default status', 'not_required')}
      {row('Live billing', 'not connected', AMBER)}
    </div>
  ));
}

function LicenseRequirementPanel({ locale }) {
  return card(tNoveeOSModules('licenseRequired', locale), (
    <div>
      <div style={{ marginBottom: 8, color: AMBER, fontSize: 12 }}>License verification is a placeholder. No license has been issued or verified.</div>
      {row('License tracking', 'enabled')}
      {row('license_verified default', 'false', GREEN)}
      {row('Live license verification', 'not available', AMBER)}
    </div>
  ));
}

function DemoLiveModePanel({ locale }) {
  return card(tNoveeOSModules('demoMode', locale) + ' / ' + tNoveeOSModules('liveMode', locale), (
    <div>
      {CORE_MODULES.map(m => (
        <div key={m.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${LINE}` }}>
          <span style={{ color: TEXT, fontSize: 12 }}>{m.name}</span>
          {badge('Demo / Local Preview', BLUE)}
        </div>
      ))}
      <div style={{ marginTop: 8, color: MUTE, fontSize: 12 }}>All modules are in demo/local preview mode. Live mode requires Phase C provider activation.</div>
    </div>
  ));
}

function ModuleReadinessPanel({ locale }) {
  return card(tNoveeOSModules('readinessStatus', locale), (
    <div>
      {CORE_MODULES.map(m => (
        <div key={m.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${LINE}` }}>
          <span style={{ color: TEXT, fontSize: 12 }}>{m.name}</span>
          {readinessBadge(m.readiness)}
        </div>
      ))}
    </div>
  ));
}

function ModuleHealthPanel({ locale }) {
  return card(tNoveeOSModules('healthStatus', locale), (
    <div>
      <div style={{ marginBottom: 8, color: AMBER, fontSize: 12 }}>Health checks return placeholder status. No live provider is polled.</div>
      {CORE_MODULES.map(m => (
        <div key={m.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${LINE}` }}>
          <span style={{ color: TEXT, fontSize: 12 }}>{m.name}</span>
          {badge('Healthy (Placeholder)', MUTE)}
        </div>
      ))}
    </div>
  ));
}

function ModuleRollbackPanel({ locale }) {
  return card(tNoveeOSModules('moduleRollback', locale), (
    <div>
      {row('Rollback tracking', 'enabled')}
      {row('Default rollback status', 'not_requested')}
      {row('Rollback records', 'none — no rollbacks requested')}
      <div style={{ marginTop: 8, color: MUTE, fontSize: 12 }}>Rollback records require a configured production database.</div>
    </div>
  ));
}

function PlatformSnapshotPanel({ locale }) {
  return card(tNoveeOSModules('platformSnapshot', locale), (
    <div>
      {row('Total modules', 12)}
      {row('Registered modules', 12)}
      {row('Active (placeholder)', 8)}
      {row('Installed (placeholder)', 8)}
      {row('Platform status', 'foundation_ready', BLUE)}
      {row('Live providers connected', 'false', AMBER)}
      {row('Marketplace enabled', 'false', AMBER)}
      {row('Billing connected', 'false', AMBER)}
      {row('Deployment completed', 'false', AMBER)}
      {row('contains_secrets', 'false', GREEN)}
      {row('stores_secrets', 'false', GREEN)}
    </div>
  ));
}

function SafeModuleClaimsPanel({ locale }) {
  const claims = [
    'NOVEE OS Phase C.1 Module Registry foundation is implemented and build-verified.',
    'All 12 core modules are registered in the in-memory registry.',
    'No module installation is claimed as live.',
    'No module activation is claimed as live.',
    'No marketplace purchase is claimed as completed.',
    'No license is claimed as verified.',
    'No billing is claimed as connected.',
    'No deployment is claimed as completed.',
    'No provider is claimed as connected.',
    'No secrets are stored.',
    'Platform admin guard is required on all write routes.',
    'Idempotency keys are required on all mutations.',
  ];
  return card(tNoveeOSModules('safeClaims', locale), (
    <div>
      {claims.map((c, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: `1px solid ${LINE}` }}>
          <span style={{ color: GREEN }}>+</span>
          <span style={{ color: TEXT, fontSize: 12 }}>{c}</span>
        </div>
      ))}
    </div>
  ));
}

function UnsafeModuleClaimsPanel({ locale }) {
  const claims = [
    'Any module is installed in production.',
    'Any module is activated in production.',
    'Any marketplace purchase has been completed.',
    'Any license has been verified.',
    'Any billing system is connected.',
    'Any deployment is complete.',
    'Any live provider is connected.',
    'Module health checks reflect live provider status.',
    'Tenant isolation is enforced beyond venue/org-scoped records.',
  ];
  return card(tNoveeOSModules('unsafeClaims', locale), (
    <div>
      <div style={{ marginBottom: 8, color: RED, fontSize: 12 }}>These claims must not be made to venues, tenants, or customers.</div>
      {claims.map((c, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: `1px solid ${LINE}` }}>
          <span style={{ color: RED }}>-</span>
          <span style={{ color: TEXT, fontSize: 12 }}>{c}</span>
        </div>
      ))}
    </div>
  ));
}

function HonestModuleLimitationsPanel({ locale }) {
  const lims = [
    'Module installations are placeholders only.',
    'Module activations are placeholders only.',
    'Marketplace is not live.',
    'License verification is not live.',
    'Billing is not connected.',
    'Deployment is not completed.',
    'Health checks return placeholder status.',
    'Tenant isolation requires Phase C.2.',
    'Production database required for persistent records.',
  ];
  return card(tNoveeOSModules('honestLimitations', locale), (
    <div>
      {lims.map((l, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: `1px solid ${LINE}` }}>
          <span style={{ color: AMBER }}>!</span>
          <span style={{ color: TEXT, fontSize: 12 }}>{l}</span>
        </div>
      ))}
    </div>
  ));
}

function ModuleRoadmapPanel({ locale }) {
  return card(tNoveeOSModules('phaseRoadmap', locale), (
    <div>
      {ROADMAP.map(r => (
        <div key={r.phase} style={{ padding: '8px 0', borderBottom: `1px solid ${LINE}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ color: GOLD2, fontWeight: 700, fontSize: 13 }}>Phase {r.phase} / Module {r.module} of {r.of}</span>
            {r.status === 'complete' ? badge('Complete', GREEN) : badge('Pending', MUTE)}
          </div>
          <div style={{ color: MUTE, fontSize: 12 }}>{r.title}</div>
        </div>
      ))}
    </div>
  ));
}

function NoveeOSModuleLanguageSelector({ locale, onLocaleChange }) {
  const locales = ['en-US', 'es-DO', 'es', 'ht', 'de', 'pt'];
  return card('Language / Locale', (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {locales.map(l => (
        <button key={l} onClick={() => onLocaleChange(l)} style={{ background: l === locale ? GOLD : CARD, color: l === locale ? '#000' : TEXT, border: `1px solid ${LINE}`, borderRadius: 4, padding: '6px 14px', cursor: 'pointer', fontSize: 12 }}>{l}</button>
      ))}
    </div>
  ));
}

function NoSecretsStoredPanel({ locale }) {
  return card(tNoveeOSModules('noSecretsStored', locale), (
    <div>
      {row('stores_secrets (all tables)', 'false', GREEN)}
      {row('contains_secrets (all audit entries)', 'false', GREEN)}
      {row('noSecretsStorageEnforced flag', 'true', GREEN)}
      {row('Database connection string logged', 'false', GREEN)}
      {row('API credentials in responses', 'false', GREEN)}
    </div>
  ));
}

function HonestInstallStatePanel({ locale }) {
  return card(tNoveeOSModules('installedModules', locale) + ' — Honest State', (
    <div>
      <div style={{ padding: 10, background: '#1a1400', borderRadius: 5, border: `1px solid ${AMBER}`, marginBottom: 10 }}>
        <div style={{ color: AMBER, fontSize: 12 }}>No module is installed in production. All installation records are placeholders. Live installation requires Phase C provider activation and production database.</div>
      </div>
      {row('noFakeInstallEnforced', 'true', GREEN)}
      {row('placeholder_only_not_live returned', 'true', GREEN)}
    </div>
  ));
}

function HonestActivationStatePanel({ locale }) {
  return card(tNoveeOSModules('activationStatus', locale) + ' — Honest State', (
    <div>
      <div style={{ padding: 10, background: '#1a1400', borderRadius: 5, border: `1px solid ${AMBER}`, marginBottom: 10 }}>
        <div style={{ color: AMBER, fontSize: 12 }}>No module is activated in production. All activation states are placeholders. Live activation requires Phase C provider activation.</div>
      </div>
      {row('noFakeActivationEnforced', 'true', GREEN)}
      {row('placeholder_only_not_live returned', 'true', GREEN)}
    </div>
  ));
}

function HonestMarketplaceStatePanel({ locale }) {
  return card(tNoveeOSModules('marketplacePlaceholder', locale), (
    <div>
      <div style={{ padding: 10, background: '#1a0d0d', borderRadius: 5, border: `1px solid ${RED}`, marginBottom: 10 }}>
        <div style={{ color: RED, fontSize: 12 }}>Marketplace is not live. No purchases can be made. No marketplace_purchase_completed records will be set to true.</div>
      </div>
      {row('noFakeMarketplacePurchaseEnforced', 'true', GREEN)}
      {row('marketplace_purchase_completed default', 'false', GREEN)}
    </div>
  ));
}

function HonestLicenseStatePanel({ locale }) {
  return card(tNoveeOSModules('licenseNotVerified', locale), (
    <div>
      <div style={{ padding: 10, background: '#1a0d0d', borderRadius: 5, border: `1px solid ${RED}`, marginBottom: 10 }}>
        <div style={{ color: RED, fontSize: 12 }}>No license has been issued or verified. All license_verified fields default to false.</div>
      </div>
      {row('noFakeLicenseVerificationEnforced', 'true', GREEN)}
      {row('license_verified default', 'false', GREEN)}
    </div>
  ));
}

function HonestBillingStatePanel({ locale }) {
  return card(tNoveeOSModules('billingNotConnected', locale), (
    <div>
      <div style={{ padding: 10, background: '#1a0d0d', borderRadius: 5, border: `1px solid ${RED}`, marginBottom: 10 }}>
        <div style={{ color: RED, fontSize: 12 }}>No billing system is connected. billing_connected defaults to false on all records.</div>
      </div>
      {row('noFakeBillingConnectionEnforced', 'true', GREEN)}
      {row('billing_connected default', 'false', GREEN)}
    </div>
  ));
}

function HonestDeploymentStatePanel({ locale }) {
  return card(tNoveeOSModules('deploymentNotCompleted', locale), (
    <div>
      <div style={{ padding: 10, background: '#1a0d0d', borderRadius: 5, border: `1px solid ${RED}`, marginBottom: 10 }}>
        <div style={{ color: RED, fontSize: 12 }}>No deployment has been completed. deployment_completed defaults to false on all records.</div>
      </div>
      {row('noFakeDeploymentEnforced', 'true', GREEN)}
      {row('deployment_completed default', 'false', GREEN)}
    </div>
  ));
}

function EmptyModuleStatePanel({ locale }) {
  return card(tNoveeOSModules('emptyState', locale) || 'Empty State', (
    <div>
      <div style={{ padding: 16, textAlign: 'center', color: MUTE, fontSize: 13 }}>
        No modules found. Connect a live provider or configure a production database to proceed.
      </div>
      {row('localPreview', 'true', AMBER)}
      {row('error', 'database_not_configured')}
      {row('area', 'novee-os-module-registry')}
    </div>
  ));
}

function NoveeOSModuleRegistry() {
  const [activeTab, setActiveTab] = useState(0);
  const [locale, setLocale] = useState('en-US');

  const renderPanel = () => {
    switch (activeTab) {
      case 0:  return <NoveeOSModuleDashboard locale={locale} />;
      case 1:  return <ModuleRegistryPanel locale={locale} />;
      case 2:  return <CoreModulesPanel locale={locale} />;
      case 3:  return <CraftModulesPanel locale={locale} />;
      case 4:  return <POSModulesPanel locale={locale} />;
      case 5:  return <ManagementModulesPanel locale={locale} />;
      case 6:  return <IntegrationModulesPanel locale={locale} />;
      case 7:  return <ModuleVersionPanel locale={locale} />;
      case 8:  return <ModuleBackendRoutesPanel locale={locale} />;
      case 9:  return <ModuleFrontendRoutesPanel locale={locale} />;
      case 10: return <ModuleDependenciesPanel locale={locale} />;
      case 11: return <ModulePermissionsPanel locale={locale} />;
      case 12: return <ModuleFeatureFlagsPanel locale={locale} />;
      case 13: return <ModuleInstallationsPanel locale={locale} />;
      case 14: return <ModuleActivationPanel locale={locale} />;
      case 15: return <TenantAvailabilityPanel locale={locale} />;
      case 16: return <VenueAvailabilityPanel locale={locale} />;
      case 17: return <PlanRequirementPanel locale={locale} />;
      case 18: return <LicenseRequirementPanel locale={locale} />;
      case 19: return <DemoLiveModePanel locale={locale} />;
      case 20: return <ModuleReadinessPanel locale={locale} />;
      case 21: return <ModuleHealthPanel locale={locale} />;
      case 22: return <ModuleRollbackPanel locale={locale} />;
      case 23: return <PlatformSnapshotPanel locale={locale} />;
      case 24: return <SafeModuleClaimsPanel locale={locale} />;
      case 25: return <UnsafeModuleClaimsPanel locale={locale} />;
      case 26: return <HonestModuleLimitationsPanel locale={locale} />;
      case 27: return <ModuleRoadmapPanel locale={locale} />;
      case 28: return <NoveeOSModuleLanguageSelector locale={locale} onLocaleChange={setLocale} />;
      case 29: return <NoSecretsStoredPanel locale={locale} />;
      case 30: return <HonestInstallStatePanel locale={locale} />;
      case 31: return <HonestActivationStatePanel locale={locale} />;
      case 32: return <HonestMarketplaceStatePanel locale={locale} />;
      case 33: return <HonestLicenseStatePanel locale={locale} />;
      case 34: return <HonestBillingStatePanel locale={locale} />;
      case 35: return <HonestDeploymentStatePanel locale={locale} />;
      case 36: return <EmptyModuleStatePanel locale={locale} />;
      default: return null;
    }
  };

  return (
    <div style={{ background: NAVY, minHeight: '100vh', color: TEXT, fontFamily: 'sans-serif' }}>
      <div style={{ background: CHARCOAL, borderBottom: `1px solid ${LINE}`, padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 36, height: 36, background: GOLD, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 18, height: 18, background: NAVY, borderRadius: 2 }} />
        </div>
        <div>
          <div style={{ color: GOLD, fontWeight: 800, fontSize: 17, letterSpacing: '0.06em' }}>NOVEE OS</div>
          <div style={{ color: MUTE, fontSize: 11, letterSpacing: '0.04em' }}>Module Registry — Platform Control Center</div>
        </div>
        <div style={{ marginLeft: 'auto', color: MUTE, fontSize: 11 }}>{DEVICE_LINE}</div>
      </div>

      <div style={{ display: 'flex', overflowX: 'auto', background: CHARCOAL, borderBottom: `1px solid ${LINE}`, padding: '0 8px' }}>
        {TABS.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)} style={{ background: 'none', border: 'none', borderBottom: i === activeTab ? `2px solid ${GOLD}` : '2px solid transparent', color: i === activeTab ? GOLD : MUTE, padding: '9px 12px', cursor: 'pointer', fontSize: 11, whiteSpace: 'nowrap', letterSpacing: '0.03em' }}>
            {tab}
          </button>
        ))}
      </div>

      <div style={{ padding: 24, maxWidth: 940 }}>
        <NoveeOSModuleLanguageSelector locale={locale} onLocaleChange={setLocale} />
        {renderPanel()}
      </div>
    </div>
  );
}

export default NoveeOSModuleRegistry;
