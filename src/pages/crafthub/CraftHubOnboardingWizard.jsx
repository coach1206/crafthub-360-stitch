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

const ROADMAP = [
  { phase: 'C1', module: '1 of 7', name: 'Module Registry',                    status: 'complete' },
  { phase: 'C2', module: '2 of 7', name: 'Tenant / Venue / Workspace Governance', status: 'complete' },
  { phase: 'C3', module: '3 of 7', name: 'Licensing / Billing Gates',           status: 'complete' },
  { phase: 'C4', module: '4 of 7', name: 'User Roles / Permissions / Security', status: 'complete' },
  { phase: 'C5', module: '5 of 7', name: 'CraftHub Launcher',                   status: 'complete' },
  { phase: 'C6', module: '6 of 7', name: 'Venue Onboarding',                    status: 'current'  },
  { phase: 'C7', module: '7 of 7', name: 'Final Platform Launch Lock',           status: 'next'     },
];

const STEPS = [
  { key: 'organization_setup',         label: 'Organization Setup',               order: 1 },
  { key: 'venue_profile',              label: 'Venue Profile',                    order: 2 },
  { key: 'workspace_setup',            label: 'Workspace Setup',                  order: 3 },
  { key: 'business_units',             label: 'Business Units',                   order: 4 },
  { key: 'departments',                label: 'Departments',                      order: 5 },
  { key: 'locations',                  label: 'Locations',                        order: 6 },
  { key: 'roles_permissions',          label: 'Roles and Permissions',            order: 7 },
  { key: 'staff_invites',              label: 'Staff Invites Placeholder',        order: 8 },
  { key: 'module_selection',           label: 'Module Selection',                 order: 9 },
  { key: 'pos360_setup',               label: 'POS360 Setup',                     order: 10 },
  { key: 'smokecraft_setup',           label: 'SmokeCraft Setup',                 order: 11 },
  { key: 'pourcraft_setup',            label: 'PourCraft Setup',                  order: 12 },
  { key: 'eat_setup',                  label: 'E.A.T. Setup',                     order: 13 },
  { key: 'passport_connections_setup', label: 'Passport Connections Setup',       order: 14 },
  { key: 'loyalty_rewards_setup',      label: 'Loyalty Rewards Setup',            order: 15 },
  { key: 'inventory_setup',            label: 'Inventory Setup',                  order: 16 },
  { key: 'menu_setup',                 label: 'Menu Setup',                       order: 17 },
  { key: 'fulfillment_areas',          label: 'Fulfillment Areas',                order: 18 },
  { key: 'tables_patio',               label: 'Tables and Patio',                 order: 19 },
  { key: 'payment_provider',           label: 'Payment Provider Placeholder',     order: 20 },
  { key: 'billing_license',            label: 'Billing and License Placeholder',  order: 21 },
  { key: 'security_setup',             label: 'Security Placeholder',             order: 22 },
  { key: 'demo_live_mode',             label: 'Demo / Live Mode',                 order: 23 },
  { key: 'readiness_review',           label: 'Readiness Review',                 order: 24 },
  { key: 'launch_precheck',            label: 'Launch Precheck',                  order: 25 },
];

const TABS = [
  'Overview', 'Progress', 'Steps', 'Checklist', 'Modules', 'Blockers',
  'Activation', 'Org Setup', 'Venue Profile', 'Workspace', 'Business Units',
  'Departments', 'Locations', 'Roles', 'Staff Invites', 'POS360',
  'SmokeCraft', 'PourCraft', 'E.A.T.', 'Passport', 'Loyalty',
  'Inventory', 'Menu', 'Fulfillment', 'Tables', 'Payment',
  'Billing', 'Security', 'Demo/Live', 'Readiness', 'Launch',
  'Safe Claims', 'Unsafe Claims', 'Limitations', 'Roadmap', 'Language',
  'No Secrets', 'Completion', 'Workspace State', 'Venue Deploy',
  'Mod Install', 'Mod Activate', 'Provider', 'Billing State',
  'License', 'Staff', 'Menu State', 'Inventory State', 'Live Mode', 'Empty',
];

const sc = s => {
  if (s === 'complete') return GREEN;
  if (s === 'current')  return GOLD;
  if (s === 'next')     return AMBER;
  if (s === 'not_started') return MUTE;
  if (s === 'blocked')  return RED;
  return MUTE;
};

const Badge = ({ label, color = MUTE }) => (
  <span style={{ background: color + '22', color, border: `1px solid ${color}44`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, letterSpacing: 0.8 }}>
    {String(label).toUpperCase()}
  </span>
);

const LockBanner = ({ msg }) => (
  <div style={{ background: RED + '15', border: `1px solid ${RED}44`, borderRadius: 6, padding: '8px 14px', color: RED, fontSize: 12, marginTop: 8 }}>
    {msg || 'activation_required — not live'}
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{ color: GOLD, fontWeight: 800, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12, borderBottom: `1px solid ${LINE}`, paddingBottom: 6 }}>
    {children}
  </div>
);

const SetupCard = ({ children, style }) => (
  <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 10, padding: 16, marginBottom: 12, ...style }}>
    {children}
  </div>
);

const HonestState = ({ label, flag, falseLabel }) => (
  <SetupCard>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: TEXT, fontWeight: 700, fontSize: 13 }}>{label}</span>
      <Badge label={`${flag}: false`} color={RED} />
    </div>
    <LockBanner msg={`${falseLabel} — not live — activation_required`} />
  </SetupCard>
);

// ── Shell ─────────────────────────────────────────────────────────────────────

function CraftHubOnboardingShell({ children, activeTab, onTab }) {
  return (
    <div style={{ minHeight: '100vh', background: NAVY, color: TEXT, fontFamily: 'monospace' }}>
      <div style={{ background: CHARCOAL, borderBottom: `1px solid ${LINE}`, padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: GOLD2, fontWeight: 900, fontSize: 17, letterSpacing: 1 }}>VENUE ONBOARDING WIZARD</div>
          <div style={{ color: MUTE, fontSize: 11 }}>Venue Experience · Setup Checklist · Readiness Flow · Phase C.6 / Module 6 of 7</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Badge label="Phase C.6" color={GOLD} />
          <Badge label="Module 6 of 7" color={AMBER} />
          <Badge label="local_preview" color={BLUE} />
          <Badge label="onboarding_completed: false" color={RED} />
        </div>
      </div>
      <div style={{ background: CHARCOAL, borderBottom: `1px solid ${LINE}`, padding: '0 24px', display: 'flex', overflowX: 'auto', gap: 0 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => onTab(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px 13px', color: activeTab === t ? GOLD2 : MUTE, fontWeight: activeTab === t ? 800 : 400, fontSize: 11, borderBottom: activeTab === t ? `2px solid ${GOLD2}` : '2px solid transparent', whiteSpace: 'nowrap' }}>
            {t}
          </button>
        ))}
      </div>
      <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>
        {children}
      </div>
      <div style={{ borderTop: `1px solid ${LINE}`, padding: '10px 24px', background: CHARCOAL, display: 'flex', justifyContent: 'space-between', color: MUTE, fontSize: 11, flexWrap: 'wrap', gap: 8 }}>
        <span>CraftHub Venue Onboarding · Phase C.6 / Module 6 of 7</span>
        <span>{DEVICE_LINE}</span>
        <span>contains_secrets: false · onboarding_completed: false · no_secrets_stored: true</span>
      </div>
    </div>
  );
}

// ── Panels ────────────────────────────────────────────────────────────────────

function OnboardingHeroPanel() {
  return (
    <div>
      <SectionTitle>Venue Experience Setup</SectionTitle>
      <SetupCard>
        <div style={{ color: GOLD2, fontWeight: 900, fontSize: 20, marginBottom: 4 }}>Venue Onboarding Wizard</div>
        <div style={{ color: MUTE, fontSize: 13, marginBottom: 14 }}>Guided setup for venues entering NOVEE OS / CraftHub. 25 setup steps. Placeholder mode.</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[['25', 'Setup Steps'],['12', 'Module Setups'],['0', 'Active'],['0%', 'Complete']].map(([v, l]) => (
            <div key={l} style={{ background: NAVY, borderRadius: 8, padding: '10px 18px', minWidth: 80 }}>
              <div style={{ color: GOLD2, fontWeight: 900, fontSize: 20 }}>{v}</div>
              <div style={{ color: MUTE, fontSize: 11 }}>{l}</div>
            </div>
          ))}
        </div>
        <LockBanner msg="onboarding_completed: false · workspace_provisioned: false · venue_deployed: false · live_mode_enabled: false" />
      </SetupCard>
    </div>
  );
}

function VenueSetupWizardPanel() {
  return (
    <div>
      <SectionTitle>Setup Wizard</SectionTitle>
      {STEPS.slice(0, 8).map(s => (
        <SetupCard key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 28, height: 28, borderRadius: 14, border: `2px solid ${LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTE, fontSize: 12, fontWeight: 700 }}>{s.order}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: TEXT, fontWeight: 700, fontSize: 13 }}>{s.label}</div>
            <div style={{ color: MUTE, fontSize: 11 }}>{s.key}</div>
          </div>
          <Badge label="not_started" color={MUTE} />
        </SetupCard>
      ))}
    </div>
  );
}

function SetupChecklistPanel() {
  const items = [
    { key: 'org_name_set', label: 'Organization name configured', status: 'not_started', required: true },
    { key: 'venue_profile_set', label: 'Venue profile configured', status: 'not_started', required: true },
    { key: 'workspace_created', label: 'Workspace created (placeholder)', status: 'not_started', required: true },
    { key: 'roles_defined', label: 'Roles and permissions defined', status: 'not_started', required: true },
    { key: 'modules_selected', label: 'Modules selected', status: 'not_started', required: true },
    { key: 'payment_provider_placeholder', label: 'Payment provider placeholder configured', status: 'not_started', required: false },
    { key: 'billing_license_placeholder', label: 'Billing and license placeholder configured', status: 'not_started', required: false },
    { key: 'inventory_setup', label: 'Inventory setup (placeholder)', status: 'not_started', required: false },
    { key: 'menu_setup', label: 'Menu setup (placeholder)', status: 'not_started', required: false },
    { key: 'staff_invites_placeholder', label: 'Staff invites (placeholder)', status: 'not_started', required: false },
    { key: 'readiness_review', label: 'Readiness review completed', status: 'not_started', required: true },
  ];
  return (
    <div>
      <SectionTitle>Setup Checklist</SectionTitle>
      {items.map(item => (
        <SetupCard key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
          <div style={{ width: 16, height: 16, borderRadius: 8, border: `2px solid ${MUTE}`, background: 'transparent', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <span style={{ color: TEXT, fontSize: 12 }}>{item.label}</span>
            {item.required && <span style={{ color: RED, fontSize: 10, marginLeft: 8 }}>required</span>}
          </div>
          <Badge label="not_started" color={MUTE} />
        </SetupCard>
      ))}
      <LockBanner msg="configuration_required for all checklist items" />
    </div>
  );
}

function OnboardingProgressPanel() {
  return (
    <div>
      <SectionTitle>Onboarding Progress</SectionTitle>
      <SetupCard>
        <div style={{ color: TEXT, fontWeight: 700, marginBottom: 10 }}>Progress Stepper</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {STEPS.map(s => (
            <div key={s.key} style={{ background: NAVY, border: `1px solid ${LINE}`, borderRadius: 4, padding: '4px 8px', fontSize: 10, color: MUTE }}>{s.order}. {s.label.split(' ')[0]}</div>
          ))}
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ background: LINE, borderRadius: 4, height: 8, width: '100%' }}>
            <div style={{ background: GOLD, borderRadius: 4, height: 8, width: '0%' }} />
          </div>
          <div style={{ color: MUTE, fontSize: 11, marginTop: 4 }}>0 / 25 steps · 0% complete · onboarding_completed: false</div>
        </div>
      </SetupCard>
    </div>
  );
}

const mkSimplePanel = (title, details) => () => (
  <div>
    <SectionTitle>{title}</SectionTitle>
    <SetupCard>
      <div style={{ color: TEXT, fontWeight: 700, marginBottom: 8 }}>{title}</div>
      <div style={{ color: MUTE, fontSize: 12, marginBottom: 8 }}>{details}</div>
      <LockBanner msg="configuration_required — activation_required — not live" />
    </SetupCard>
  </div>
);

function OrganizationSetupPanel() {
  return (
    <div>
      <SectionTitle>Organization Setup</SectionTitle>
      <SetupCard>
        <div style={{ color: TEXT, fontWeight: 700, marginBottom: 8 }}>Organization Setup</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          {['Organization Name', 'Organization Type', 'Country', 'Timezone', 'Locale'].map(f => (
            <div key={f} style={{ background: NAVY, borderRadius: 6, padding: '8px 12px' }}>
              <div style={{ color: MUTE, fontSize: 10 }}>{f}</div>
              <div style={{ color: MUTE, fontSize: 12, fontStyle: 'italic' }}>configuration_required</div>
            </div>
          ))}
        </div>
        <LockBanner msg="organization_setup: configuration_required · onboarding_completed: false" />
      </SetupCard>
    </div>
  );
}

function VenueProfileSetupPanel() {
  return (
    <div>
      <SectionTitle>Venue Profile</SectionTitle>
      <SetupCard>
        <div style={{ color: TEXT, fontWeight: 700, marginBottom: 8 }}>Venue Experience Setup</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          {['Venue Name', 'Venue Type', 'Address', 'City', 'Country', 'Timezone'].map(f => (
            <div key={f} style={{ background: NAVY, borderRadius: 6, padding: '8px 12px' }}>
              <div style={{ color: MUTE, fontSize: 10 }}>{f}</div>
              <div style={{ color: MUTE, fontSize: 12, fontStyle: 'italic' }}>configuration_required</div>
            </div>
          ))}
        </div>
        <LockBanner msg="venue_deployed: false · configuration_required" />
      </SetupCard>
    </div>
  );
}

function WorkspaceSetupPanel() {
  return (
    <div>
      <SectionTitle>Workspace Setup</SectionTitle>
      <SetupCard>
        <div style={{ color: TEXT, fontWeight: 700, marginBottom: 8 }}>Workspace Configuration</div>
        <LockBanner msg="workspace_provisioned: false · activation_required — real workspace provisioning is not live" />
        <div style={{ color: MUTE, fontSize: 12, marginTop: 10 }}>Workspace name and type configuration placeholder. workspace_provisioned: false.</div>
      </SetupCard>
    </div>
  );
}

const BusinessUnitSetupPanel   = mkSimplePanel('Business Units',          'organization_id · venue_id · workspace_id scoped · setup_status: not_started');
const DepartmentSetupPanel     = mkSimplePanel('Departments',             'parent_unit_id · department_type · setup_status: not_started');
const LocationSetupPanel       = mkSimplePanel('Locations',               'location_name · location_type · location_address · setup_status: not_started');

function RoleSetupPanel() {
  return (
    <div>
      <SectionTitle>Roles and Permissions</SectionTitle>
      <SetupCard>
        <div style={{ color: TEXT, fontWeight: 700, marginBottom: 8 }}>Role Configuration</div>
        <LockBanner msg="role_required — role_setup: configuration_required — not live" />
        <div style={{ color: MUTE, fontSize: 12, marginTop: 10 }}>Role name, type, and permissions configuration placeholder.</div>
      </SetupCard>
    </div>
  );
}

function StaffInvitePlaceholderPanel() {
  return (
    <div>
      <SectionTitle>Staff Invites Placeholder</SectionTitle>
      <SetupCard>
        <div style={{ color: TEXT, fontWeight: 700, marginBottom: 8 }}>Staff Invites</div>
        <LockBanner msg="staff_invite_delivered: false — real email/SMS delivery is not live — placeholder only" />
        <div style={{ color: MUTE, fontSize: 12, marginTop: 10 }}>Staff invite records are placeholders. No real invite delivery occurs. activation_required.</div>
      </SetupCard>
    </div>
  );
}

function ModuleSelectionPanel() {
  const modules = ['POS360', 'SmokeCraft', 'PourCraft', 'E.A.T. System', 'Passport / Connections', 'Loyalty / Rewards', 'Inventory', 'Menu', 'Fulfillment', 'Tables / Patio', 'Reports', 'Integrations'];
  return (
    <div>
      <SectionTitle>Module Selection</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
        {modules.map(m => (
          <SetupCard key={m} style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: TEXT, fontSize: 12, fontWeight: 700 }}>{m}</span>
              <Badge label="not selected" color={MUTE} />
            </div>
            <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
              <Badge label="module_installed: false" color={MUTE} />
            </div>
          </SetupCard>
        ))}
      </div>
      <LockBanner msg="module_installed: false · module_activated: false · activation_required" />
    </div>
  );
}

function ModuleSetupStatusPanel() {
  return (
    <div>
      <SectionTitle>Module Setup Status</SectionTitle>
      <SetupCard>
        <LockBanner msg="setup_status: not_started · readiness_status: not_ready · all modules" />
        <div style={{ color: MUTE, fontSize: 12, marginTop: 10 }}>All module setup statuses are not_started. module_installed: false · module_activated: false · provider_connected: false · billing_connected: false · license_verified: false · live_mode_enabled: false.</div>
      </SetupCard>
    </div>
  );
}

const POS360SetupPanel               = mkSimplePanel('POS360 Setup',              'module_key: pos360 · module_installed: false · provider_connected: false · live_mode_enabled: false');
const SmokeCraftSetupPanel           = mkSimplePanel('SmokeCraft Setup',          'module_key: smokecraft · module_installed: false · live_mode_enabled: false');
const PourCraftSetupPanel            = mkSimplePanel('PourCraft Setup',           'module_key: pourcraft · module_installed: false · placeholder');
const EATSetupPanel                  = mkSimplePanel('E.A.T. Setup',              'module_key: eat_system · contains_ai_generated_content: false · live_mode_enabled: false');
const PassportConnectionsSetupPanel  = mkSimplePanel('Passport Connections Setup','module_key: passport_connections · module_installed: false');
const LoyaltyRewardsSetupPanel       = mkSimplePanel('Loyalty Rewards Setup',     'module_key: loyalty_rewards · module_installed: false');
const InventorySetupPanel            = mkSimplePanel('Inventory Setup',           'inventory_sync_enabled: false · module_installed: false');
const MenuSetupPanel                 = mkSimplePanel('Menu Setup',                'menu_import_completed: false · module_installed: false');
const FulfillmentAreaSetupPanel      = mkSimplePanel('Fulfillment Areas',         'area_name · area_type · setup_status: not_started');
const TablePatioSetupPanel           = mkSimplePanel('Tables and Patio',          'area_name · table_count: 0 · setup_status: not_started');

function PaymentProviderPlaceholderPanel() {
  return (
    <div>
      <SectionTitle>Payment Provider Placeholder</SectionTitle>
      <SetupCard>
        <div style={{ color: TEXT, fontWeight: 700, marginBottom: 8 }}>Payment Provider Placeholder</div>
        <LockBanner msg="provider_connected: false · payment_processed: false · billing_connected: false · live_mode_enabled: false · contains_secrets: false · stores_secrets: false" />
        <div style={{ color: MUTE, fontSize: 12, marginTop: 10 }}>No real payment provider connected. provider_status: not_connected. activation_required.</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          <Badge label="provider_connected: false" color={RED} />
          <Badge label="payment_processed: false" color={RED} />
          <Badge label="contains_secrets: false" color={GREEN} />
          <Badge label="stores_secrets: false" color={GREEN} />
        </div>
      </SetupCard>
    </div>
  );
}

function BillingLicensePlaceholderPanel() {
  return (
    <div>
      <SectionTitle>Billing and License Placeholder</SectionTitle>
      <SetupCard>
        <div style={{ color: TEXT, fontWeight: 700, marginBottom: 8 }}>Billing and License Placeholder</div>
        <LockBanner msg="billing_connected: false · license_verified: false · payment_processed: false · live_mode_enabled: false" />
        <div style={{ color: MUTE, fontSize: 12, marginTop: 10 }}>No billing plan or license connected. billing_required. license_required. activation_required.</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          <Badge label="billing_connected: false" color={RED} />
          <Badge label="license_verified: false" color={RED} />
          <Badge label="payment_processed: false" color={RED} />
        </div>
      </SetupCard>
    </div>
  );
}

function SecurityPlaceholderPanel() {
  return (
    <div>
      <SectionTitle>Security Placeholder</SectionTitle>
      <SetupCard>
        <div style={{ color: TEXT, fontWeight: 700, marginBottom: 8 }}>Security Configuration Placeholder</div>
        <LockBanner msg="provider_connected: false · live_mode_enabled: false · contains_secrets: false · stores_secrets: false" />
        <div style={{ color: MUTE, fontSize: 12, marginTop: 10 }}>No real security provider connected. security_required. activation_required.</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          <Badge label="contains_secrets: false" color={GREEN} />
          <Badge label="stores_secrets: false" color={GREEN} />
        </div>
      </SetupCard>
    </div>
  );
}

function DemoLiveModeControlPanel() {
  const modes = ['demo', 'local_preview', 'staging_placeholder', 'production_placeholder', 'live_external', 'unavailable'];
  return (
    <div>
      <SectionTitle>Demo / Live Mode Controls</SectionTitle>
      <SetupCard>
        <div style={{ color: TEXT, fontWeight: 700, marginBottom: 10 }}>Current Mode: demo</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {modes.map(m => (
            <div key={m} style={{ background: m === 'demo' ? GOLD + '33' : NAVY, border: `1px solid ${m === 'demo' ? GOLD : LINE}`, borderRadius: 6, padding: '8px 14px', cursor: 'default' }}>
              <span style={{ color: m === 'demo' ? GOLD : MUTE, fontSize: 12, fontWeight: m === 'demo' ? 700 : 400 }}>{m}</span>
            </div>
          ))}
        </div>
        <LockBanner msg="live_external: not enabled — live_mode_enabled: false — activation_required for live mode" />
      </SetupCard>
    </div>
  );
}

function ReadinessScorePanel() {
  const items = [
    { key: 'org_ready', label: 'Organization setup', ready: false, blocker: 'configuration_required' },
    { key: 'venue_ready', label: 'Venue profile setup', ready: false, blocker: 'configuration_required' },
    { key: 'workspace_ready', label: 'Workspace provisioned', ready: false, blocker: 'activation_required' },
    { key: 'roles_ready', label: 'Roles configured', ready: false, blocker: 'role_required' },
    { key: 'modules_ready', label: 'Modules installed and activated', ready: false, blocker: 'activation_required' },
    { key: 'payment_ready', label: 'Payment provider connected', ready: false, blocker: 'provider_required' },
    { key: 'billing_ready', label: 'Billing and license verified', ready: false, blocker: 'billing_required' },
    { key: 'venue_deployed', label: 'Venue deployed to production', ready: false, blocker: 'activation_required' },
    { key: 'live_mode', label: 'Live mode enabled', ready: false, blocker: 'activation_required' },
  ];
  return (
    <div>
      <SectionTitle>Readiness Score</SectionTitle>
      <SetupCard>
        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          <div style={{ background: NAVY, borderRadius: 8, padding: '10px 18px' }}>
            <div style={{ color: RED, fontWeight: 900, fontSize: 24 }}>0%</div>
            <div style={{ color: MUTE, fontSize: 11 }}>Readiness</div>
          </div>
          <div style={{ background: NAVY, borderRadius: 8, padding: '10px 18px' }}>
            <div style={{ color: RED, fontWeight: 900, fontSize: 24 }}>{items.length}</div>
            <div style={{ color: MUTE, fontSize: 11 }}>Open Blockers</div>
          </div>
        </div>
        {items.map(item => (
          <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${LINE}` }}>
            <span style={{ color: MUTE, fontSize: 12 }}>{item.label}</span>
            <Badge label={item.blocker} color={RED} />
          </div>
        ))}
        <LockBanner msg="readiness_status: not_ready — all blockers open — activation_required" />
      </SetupCard>
    </div>
  );
}

function LaunchReadinessPanel() {
  return (
    <div>
      <SectionTitle>Launch Readiness</SectionTitle>
      <SetupCard>
        <div style={{ color: TEXT, fontWeight: 700, marginBottom: 8 }}>Launch Readiness Precheck</div>
        <LockBanner msg="onboarding_completed: false · workspace_provisioned: false · venue_deployed: false · provider_connected: false · billing_connected: false · license_verified: false · live_mode_enabled: false" />
        <div style={{ color: MUTE, fontSize: 12, marginTop: 10 }}>Platform is not ready for launch. All blockers open. activation_required for all live operations.</div>
      </SetupCard>
    </div>
  );
}

function OnboardingBlockerPanel() {
  const blockers = [
    { key: 'org_config', type: 'configuration_missing', label: 'Organization not configured', status: 'open' },
    { key: 'venue_config', type: 'configuration_missing', label: 'Venue profile not configured', status: 'open' },
    { key: 'workspace_activation', type: 'activation_required', label: 'Workspace not provisioned', status: 'open' },
    { key: 'provider_required', type: 'provider_required', label: 'Payment provider not connected', status: 'open' },
    { key: 'billing_required', type: 'billing_required', label: 'Billing not connected', status: 'open' },
    { key: 'license_required', type: 'license_required', label: 'License not verified', status: 'open' },
    { key: 'role_required', type: 'role_required', label: 'Roles not configured', status: 'open' },
  ];
  return (
    <div>
      <SectionTitle>Onboarding Blockers</SectionTitle>
      {blockers.map(b => (
        <SetupCard key={b.key} style={{ padding: '10px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ color: TEXT, fontSize: 12, fontWeight: 700 }}>{b.label}</span>
              <div style={{ color: MUTE, fontSize: 11 }}>{b.type}</div>
            </div>
            <Badge label={b.status} color={RED} />
          </div>
        </SetupCard>
      ))}
    </div>
  );
}

function ActivationRequirementPanel() {
  const reqs = [
    { key: 'workspace_provision', label: 'Workspace Provisioning', type: 'deployment_required', status: 'not_active' },
    { key: 'venue_deploy', label: 'Venue Deployment', type: 'deployment_required', status: 'not_active' },
    { key: 'module_install', label: 'Module Installation', type: 'activation_required', status: 'not_active' },
    { key: 'payment_provider', label: 'Payment Provider Connection', type: 'provider_required', status: 'not_active' },
    { key: 'billing_connect', label: 'Billing Connection', type: 'billing_required', status: 'not_active' },
    { key: 'license_verify', label: 'License Verification', type: 'license_required', status: 'not_active' },
    { key: 'live_mode', label: 'Live Mode Enablement', type: 'activation_required', status: 'not_active' },
  ];
  return (
    <div>
      <SectionTitle>Activation Requirements</SectionTitle>
      {reqs.map(r => (
        <SetupCard key={r.key} style={{ padding: '10px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ color: TEXT, fontSize: 12, fontWeight: 700 }}>{r.label}</span>
              <div style={{ color: MUTE, fontSize: 11 }}>{r.type}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Badge label={r.status} color={RED} />
              <Badge label="live_mode_enabled: false" color={MUTE} />
            </div>
          </div>
        </SetupCard>
      ))}
    </div>
  );
}

function SafeOnboardingClaimsPanel() {
  const claims = [
    'Venue onboarding wizard structure is built and available as placeholder',
    'Setup checklist is defined and available for local preview',
    '25 onboarding steps are defined',
    'Launch readiness flow is present in placeholder mode',
    'Phase C.6 / Module 6 of 7 built as local_preview placeholder',
  ];
  return (
    <div>
      <SectionTitle>Safe Onboarding Claims</SectionTitle>
      <SetupCard>
        <div style={{ color: TEXT, fontWeight: 700, marginBottom: 10 }}>These claims are accurate and safe</div>
        {claims.map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '5px 0', borderBottom: `1px solid ${LINE}` }}>
            <span style={{ color: GREEN, fontSize: 12 }}>✓</span>
            <span style={{ color: TEXT, fontSize: 12 }}>{c}</span>
            <Badge label="placeholder" color={BLUE} />
          </div>
        ))}
      </SetupCard>
    </div>
  );
}

function UnsafeOnboardingClaimsPanel() {
  const claims = [
    { text: 'Onboarding is complete', reason: 'onboarding_completed: false' },
    { text: 'Workspace is provisioned', reason: 'workspace_provisioned: false' },
    { text: 'Venue is deployed', reason: 'venue_deployed: false' },
    { text: 'Module is installed', reason: 'module_installed: false' },
    { text: 'Module is activated', reason: 'module_activated: false' },
    { text: 'Payment provider connected', reason: 'provider_connected: false' },
    { text: 'Billing is connected', reason: 'billing_connected: false' },
    { text: 'License is verified', reason: 'license_verified: false' },
    { text: 'Staff invite delivered', reason: 'staff_invite_delivered: false' },
    { text: 'Menu import completed', reason: 'menu_import_completed: false' },
    { text: 'Inventory sync enabled', reason: 'inventory_sync_enabled: false' },
    { text: 'Live mode is enabled', reason: 'live_mode_enabled: false' },
  ];
  return (
    <div>
      <SectionTitle>Unsafe Onboarding Claims — Not Live</SectionTitle>
      <SetupCard>
        <div style={{ color: RED, fontWeight: 700, marginBottom: 10 }}>These claims are NOT safe — not live</div>
        {claims.map((c, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${LINE}` }}>
            <span style={{ color: RED, fontSize: 12 }}>{c.text}</span>
            <Badge label={c.reason} color={RED} />
          </div>
        ))}
      </SetupCard>
    </div>
  );
}

function HonestOnboardingLimitationsPanel() {
  const limits = [
    'Venue onboarding is a placeholder — no real workspace has been provisioned',
    'No real venue has been deployed to production',
    'No real module installation or activation has occurred',
    'No real payment provider has been connected',
    'No real billing or license has been verified',
    'No real staff invite has been delivered',
    'No real menu has been imported',
    'No real inventory sync has been enabled',
    'Live mode is not enabled — all onboarding runs in local_preview or demo mode',
    'Onboarding completion state is placeholder only',
    'configuration_required for all external integrations',
    'activation_required for all live operations',
  ];
  return (
    <div>
      <SectionTitle>Honest Limitations</SectionTitle>
      <SetupCard>
        {limits.map((l, i) => (
          <div key={i} style={{ color: AMBER, fontSize: 12, padding: '4px 0', borderBottom: `1px solid ${LINE}` }}>{l}</div>
        ))}
      </SetupCard>
    </div>
  );
}

function OnboardingRoadmapPanel() {
  return (
    <div>
      <SectionTitle>Phase Roadmap</SectionTitle>
      {ROADMAP.map(r => (
        <SetupCard key={r.phase} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ minWidth: 36, color: GOLD, fontWeight: 800, fontSize: 14 }}>{r.phase}</div>
          <div style={{ minWidth: 70, color: MUTE, fontSize: 11 }}>{r.module}</div>
          <div style={{ flex: 1, color: TEXT, fontWeight: 700, fontSize: 13 }}>{r.name}</div>
          <Badge label={r.status} color={sc(r.status)} />
        </SetupCard>
      ))}
    </div>
  );
}

function CraftHubOnboardingLanguageSelector() {
  const langs = ['en-US', 'es-DO', 'es', 'ht', 'de', 'pt'];
  return (
    <div>
      <SectionTitle>Language Selector</SectionTitle>
      <SetupCard>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {langs.map(l => (
            <div key={l} style={{ background: l === 'en-US' ? GOLD + '33' : NAVY, border: `1px solid ${l === 'en-US' ? GOLD : LINE}`, borderRadius: 6, padding: '8px 16px', color: l === 'en-US' ? GOLD : MUTE, fontSize: 13, fontWeight: l === 'en-US' ? 700 : 400 }}>
              {l}
            </div>
          ))}
        </div>
        <div style={{ color: MUTE, fontSize: 11, marginTop: 10 }}>6 locales supported: en-US · es-DO · es · ht · de · pt</div>
      </SetupCard>
    </div>
  );
}

function NoSecretsStoredPanel() {
  return (
    <div>
      <SectionTitle>No Secrets Stored</SectionTitle>
      <SetupCard>
        <div style={{ color: GREEN, fontWeight: 700, marginBottom: 10 }}>Security Compliance</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {['contains_secrets: false','stores_secrets: false','no payment credentials stored','no API keys stored in onboarding records','no passwords stored','no provider tokens stored','all audit rows contain_secrets: false'].map(c => (
            <div key={c} style={{ display: 'flex', gap: 10, color: GREEN, fontSize: 12 }}>
              <span>+</span><span>{c}</span>
            </div>
          ))}
        </div>
      </SetupCard>
    </div>
  );
}

const HonestOnboardingCompletionStatePanel  = () => <HonestState label="Onboarding Completion State"   flag="onboarding_completed"   falseLabel="Onboarding is not complete" />;
const HonestWorkspaceProvisioningStatePanel = () => <HonestState label="Workspace Provisioning State"  flag="workspace_provisioned"  falseLabel="Workspace is not provisioned" />;
const HonestVenueDeploymentStatePanel       = () => <HonestState label="Venue Deployment State"        flag="venue_deployed"         falseLabel="Venue is not deployed" />;
const HonestModuleInstallStatePanel         = () => <HonestState label="Module Install State"          flag="module_installed"       falseLabel="No module is installed" />;
const HonestModuleActivationStatePanel      = () => <HonestState label="Module Activation State"       flag="module_activated"       falseLabel="No module is activated" />;
const HonestProviderConnectionStatePanel    = () => <HonestState label="Provider Connection State"     flag="provider_connected"     falseLabel="No payment provider connected" />;
const HonestBillingConnectionStatePanel     = () => <HonestState label="Billing Connection State"      flag="billing_connected"      falseLabel="Billing is not connected" />;
const HonestLicenseVerificationStatePanel   = () => <HonestState label="License Verification State"    flag="license_verified"       falseLabel="License is not verified" />;
const HonestStaffInviteStatePanel           = () => <HonestState label="Staff Invite Delivery State"   flag="staff_invite_delivered" falseLabel="Staff invite was not delivered" />;
const HonestMenuImportStatePanel            = () => <HonestState label="Menu Import State"             flag="menu_import_completed"  falseLabel="Menu import not completed" />;
const HonestInventorySyncStatePanel         = () => <HonestState label="Inventory Sync State"          flag="inventory_sync_enabled" falseLabel="Inventory sync not enabled" />;
const HonestLiveModeStatePanel              = () => <HonestState label="Live Mode State"               flag="live_mode_enabled"      falseLabel="Live mode is not enabled" />;

function EmptyOnboardingStatePanel() {
  return (
    <div>
      <SectionTitle>Empty State</SectionTitle>
      <SetupCard>
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={{ color: MUTE, fontSize: 48, marginBottom: 12, letterSpacing: 8 }}>[ ]</div>
          <div style={{ color: GOLD, fontWeight: 700, fontSize: 14, marginBottom: 6 }}>No Onboarding Data</div>
          <div style={{ color: MUTE, fontSize: 12, marginBottom: 12 }}>No venue onboarding sessions have been started.</div>
          <div style={{ color: MUTE, fontSize: 11 }}>database_not_configured · local_preview · area: crafthub_onboarding</div>
          <div style={{ marginTop: 16 }}>
            <Badge label="empty state" color={MUTE} />
          </div>
        </div>
      </SetupCard>
    </div>
  );
}

const PANELS = {
  'Overview':        OnboardingHeroPanel,
  'Progress':        OnboardingProgressPanel,
  'Steps':           VenueSetupWizardPanel,
  'Checklist':       SetupChecklistPanel,
  'Modules':         ModuleSelectionPanel,
  'Blockers':        OnboardingBlockerPanel,
  'Activation':      ActivationRequirementPanel,
  'Org Setup':       OrganizationSetupPanel,
  'Venue Profile':   VenueProfileSetupPanel,
  'Workspace':       WorkspaceSetupPanel,
  'Business Units':  BusinessUnitSetupPanel,
  'Departments':     DepartmentSetupPanel,
  'Locations':       LocationSetupPanel,
  'Roles':           RoleSetupPanel,
  'Staff Invites':   StaffInvitePlaceholderPanel,
  'POS360':          POS360SetupPanel,
  'SmokeCraft':      SmokeCraftSetupPanel,
  'PourCraft':       PourCraftSetupPanel,
  'E.A.T.':          EATSetupPanel,
  'Passport':        PassportConnectionsSetupPanel,
  'Loyalty':         LoyaltyRewardsSetupPanel,
  'Inventory':       InventorySetupPanel,
  'Menu':            MenuSetupPanel,
  'Fulfillment':     FulfillmentAreaSetupPanel,
  'Tables':          TablePatioSetupPanel,
  'Payment':         PaymentProviderPlaceholderPanel,
  'Billing':         BillingLicensePlaceholderPanel,
  'Security':        SecurityPlaceholderPanel,
  'Demo/Live':       DemoLiveModeControlPanel,
  'Readiness':       ReadinessScorePanel,
  'Launch':          LaunchReadinessPanel,
  'Safe Claims':     SafeOnboardingClaimsPanel,
  'Unsafe Claims':   UnsafeOnboardingClaimsPanel,
  'Limitations':     HonestOnboardingLimitationsPanel,
  'Roadmap':         OnboardingRoadmapPanel,
  'Language':        CraftHubOnboardingLanguageSelector,
  'No Secrets':      NoSecretsStoredPanel,
  'Mod Status':      ModuleSetupStatusPanel,
  'Completion':      HonestOnboardingCompletionStatePanel,
  'Workspace State': HonestWorkspaceProvisioningStatePanel,
  'Venue Deploy':    HonestVenueDeploymentStatePanel,
  'Mod Install':     HonestModuleInstallStatePanel,
  'Mod Activate':    HonestModuleActivationStatePanel,
  'Provider':        HonestProviderConnectionStatePanel,
  'Billing State':   HonestBillingConnectionStatePanel,
  'License':         HonestLicenseVerificationStatePanel,
  'Staff':           HonestStaffInviteStatePanel,
  'Menu State':      HonestMenuImportStatePanel,
  'Inventory State': HonestInventorySyncStatePanel,
  'Live Mode':       HonestLiveModeStatePanel,
  'Empty':           EmptyOnboardingStatePanel,
};

function CraftHubOnboardingWizard() {
  const [activeTab, setActiveTab] = useState('Overview');
  const Panel = PANELS[activeTab] || OnboardingHeroPanel;

  return (
    <CraftHubOnboardingShell activeTab={activeTab} onTab={setActiveTab}>
      <Panel />
    </CraftHubOnboardingShell>
  );
}

export default CraftHubOnboardingWizard;
