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

const TABS = ['Overview', 'Modules', 'Marketplace', 'Roadmap', 'Connectors', 'Widgets', 'Activity', 'Notifications', 'Onboarding', 'Feature Flags', 'API Keys', 'Preferences', 'Entitlements', 'Audit', 'Platform Health', 'Search'];

const MODULES = [
  { key: 'novee_os_module_registry',    name: 'NOVEE OS Module Registry',         category: 'Platform Core',   status: 'local_preview', phase: 'C1', route: '/novee-os/modules' },
  { key: 'novee_os_tenant_governance',  name: 'Tenant & Venue Governance',         category: 'Platform Core',   status: 'local_preview', phase: 'C2', route: '/novee-os/tenants' },
  { key: 'novee_os_billing_governance', name: 'Billing & Licensing Gates',         category: 'Platform Core',   status: 'local_preview', phase: 'C3', route: '/novee-os/billing' },
  { key: 'novee_os_security_governance',name: 'Security & Permissions Governance', category: 'Platform Core',   status: 'local_preview', phase: 'C4', route: '/novee-os/security' },
  { key: 'pos360_platform',             name: 'POS360 Platform',                   category: 'POS & Ordering',  status: 'local_preview', phase: 'B',  route: '/pos3' },
  { key: 'smokecraft_experience',       name: 'SmokeCraft Experience',             category: 'Experience',      status: 'local_preview', phase: 'A',  route: '/smokecraft' },
  { key: 'pourcraft_beverage',          name: 'PourCraft Beverage',                category: 'Hospitality',     status: 'placeholder',   phase: null, route: null },
  { key: 'eat_ai_system',               name: 'E.A.T. AI System',                  category: 'Hospitality',     status: 'placeholder',   phase: null, route: null },
  { key: 'passport_connections',        name: 'Passport & Connections',            category: 'Loyalty',         status: 'local_preview', phase: 'A',  route: '/passport' },
  { key: 'loyalty_rewards',             name: 'Loyalty & Rewards',                 category: 'Loyalty',         status: 'placeholder',   phase: null, route: null },
  { key: 'venue_admin',                 name: 'Venue Admin',                       category: 'Operations',      status: 'local_preview', phase: 'B',  route: '/venue-admin' },
  { key: 'inventory_management',        name: 'Inventory Management',             category: 'Operations',      status: 'local_preview', phase: 'B',  route: '/inventory' },
  { key: 'reports_analytics',           name: 'Reports & Analytics',              category: 'Analytics',       status: 'local_preview', phase: 'B',  route: '/reports' },
  { key: 'external_integrations',       name: 'External Integrations',            category: 'Integrations',    status: 'local_preview', phase: 'B',  route: '/integrations' },
  { key: 'future_module_placeholder',   name: 'Future Module',                    category: 'Upcoming',        status: 'pending',       phase: null, route: null },
];

const ROADMAP = [
  { key: 'C1', name: 'NOVEE OS Module Registry',              status: 'complete', order: 1 },
  { key: 'C2', name: 'Tenant & Venue Governance',              status: 'complete', order: 2 },
  { key: 'C3', name: 'Billing & Licensing Gates',              status: 'complete', order: 3 },
  { key: 'C4', name: 'Security & Permissions Governance',      status: 'complete', order: 4 },
  { key: 'C5', name: 'CraftHub Dashboard & Module Launcher',   status: 'current',  order: 5 },
  { key: 'C6', name: 'Venue Onboarding Engine',                status: 'next',     order: 6 },
  { key: 'C7', name: 'Final Launch Lock',                      status: 'pending',  order: 7 },
];

const CONNECTORS = [
  { key: 'pos360_sync',        name: 'POS360 Sync',        type: 'pos_sync',       status: 'disconnected', live: false },
  { key: 'smokecraft_sync',    name: 'SmokeCraft Sync',    type: 'experience_sync', status: 'disconnected', live: false },
  { key: 'eat_ai_automation',  name: 'E.A.T. AI Automation', type: 'ai_automation', status: 'disconnected', live: false },
  { key: 'stripe_billing',     name: 'Stripe Billing',     type: 'billing',        status: 'disconnected', live: false },
  { key: 'novee_os_core',      name: 'NOVEE OS Core',      type: 'platform_core',  status: 'disconnected', live: false },
];

const PLATFORM_COMPONENTS = [
  'api_gateway', 'database', 'auth_service', 'module_registry', 'billing_service', 'notification_service',
];

const FLAGS = {
  module_installed: false, module_activated: false, marketplace_purchase_completed: false,
  billing_connected: false, license_verified: false, provider_connected: false,
  launch_allowed: false, live_mode_enabled: false, pos360_live: false, smokecraft_live: false,
  pourcraft_live: false, eat_ai_live: false, passport_live: false, loyalty_live: false,
  venue_admin_live: false, inventory_live: false, reports_live: false, external_integrations_live: false,
  sidebar_enabled: false, top_bar_enabled: false, breadcrumb_enabled: false, search_enabled: false,
  notification_center_enabled: false, quick_actions_enabled: false, premium_hub_enabled: false,
  ai_assistant_enabled: false, analytics_live: false, white_label_enabled: false,
  custom_domain_enabled: false, multi_venue_enabled: false, enterprise_sso_enabled: false,
  premium_support_enabled: false, marketplace_enabled: false, marketplace_purchases_enabled: false,
  live_purchase_enabled: false, widget_drag_drop_enabled: false, layout_save_enabled: false,
  live_activity_feed_enabled: false, live_health_monitoring_enabled: false, onboarding_checklist_enabled: false,
  pos360_sync_enabled: false, smokecraft_sync_enabled: false, eat_ai_automation_enabled: false,
  stripe_billing_connector_enabled: false, api_key_creation_enabled: false,
  feature_flag_override_enabled: false, exposes_private_data: true, contains_secrets: false,
  stores_secrets: false, contains_ai_generated_content: false,
};

const statusColor = s => {
  if (s === 'local_preview') return BLUE;
  if (s === 'complete')      return GREEN;
  if (s === 'current')       return GOLD;
  if (s === 'placeholder')   return MUTE;
  if (s === 'pending')       return MUTE;
  if (s === 'next')          return AMBER;
  if (s === 'disconnected')  return RED;
  return MUTE;
};

const Badge = ({ label, color }) => (
  <span style={{ background: color + '22', color, border: `1px solid ${color}55`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
    {label.toUpperCase()}
  </span>
);

const Lock = ({ msg }) => (
  <div style={{ background: RED + '15', border: `1px solid ${RED}44`, borderRadius: 6, padding: '6px 12px', color: RED, fontSize: 12, marginTop: 8 }}>
    {msg || 'activation_required — not live'}
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{ color: GOLD, fontWeight: 800, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14, borderBottom: `1px solid ${LINE}`, paddingBottom: 8 }}>
    {children}
  </div>
);

const Card = ({ children, style }) => (
  <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 10, padding: 18, marginBottom: 14, ...style }}>
    {children}
  </div>
);

function OverviewPanel() {
  return (
    <div>
      <SectionTitle>CraftHub Dashboard Overview</SectionTitle>
      <Card>
        <div style={{ color: GOLD2, fontWeight: 800, fontSize: 20, marginBottom: 4 }}>CraftHub 360</div>
        <div style={{ color: MUTE, fontSize: 13, marginBottom: 12 }}>Module Launcher · Navigation Shell · Premium Experience Hub</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ background: NAVY, borderRadius: 8, padding: '10px 18px', minWidth: 100 }}>
            <div style={{ color: GOLD2, fontWeight: 800, fontSize: 22 }}>15</div>
            <div style={{ color: MUTE, fontSize: 11 }}>Total Modules</div>
          </div>
          <div style={{ background: NAVY, borderRadius: 8, padding: '10px 18px', minWidth: 100 }}>
            <div style={{ color: BLUE, fontWeight: 800, fontSize: 22 }}>10</div>
            <div style={{ color: MUTE, fontSize: 11 }}>Local Preview</div>
          </div>
          <div style={{ background: NAVY, borderRadius: 8, padding: '10px 18px', minWidth: 100 }}>
            <div style={{ color: MUTE, fontWeight: 800, fontSize: 22 }}>0</div>
            <div style={{ color: MUTE, fontSize: 11 }}>Live / Active</div>
          </div>
          <div style={{ background: NAVY, borderRadius: 8, padding: '10px 18px', minWidth: 100 }}>
            <div style={{ color: AMBER, fontWeight: 800, fontSize: 22 }}>C5</div>
            <div style={{ color: MUTE, fontSize: 11 }}>Current Phase</div>
          </div>
        </div>
        <Lock msg="live_mode_enabled: false — No modules are live. All active modules run in local_preview mode." />
      </Card>
      <Card>
        <div style={{ color: TEXT, fontWeight: 700, marginBottom: 8 }}>Platform Status</div>
        <div style={{ color: MUTE, fontSize: 13 }}>database_not_configured · local_preview · area: crafthub_dashboard</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {PLATFORM_COMPONENTS.map(c => (
            <span key={c} style={{ background: MUTE + '22', color: MUTE, border: `1px solid ${LINE}`, borderRadius: 4, padding: '2px 8px', fontSize: 11 }}>{c}</span>
          ))}
        </div>
      </Card>
      <Card>
        <div style={{ color: TEXT, fontWeight: 700, marginBottom: 8 }}>Device Support</div>
        <div style={{ color: GOLD, fontSize: 13, fontWeight: 600 }}>{DEVICE_LINE}</div>
      </Card>
    </div>
  );
}

function ModulesPanel() {
  return (
    <div>
      <SectionTitle>Module Launcher Registry</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {MODULES.map(m => (
          <Card key={m.key} style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ color: TEXT, fontWeight: 700, fontSize: 14 }}>{m.name}</div>
              <Badge label={m.status} color={statusColor(m.status)} />
            </div>
            <div style={{ color: MUTE, fontSize: 12, marginBottom: 6 }}>{m.category}{m.phase ? ` · Phase ${m.phase}` : ''}</div>
            {m.route
              ? <div style={{ color: BLUE, fontSize: 11 }}>{m.route}</div>
              : <div style={{ color: MUTE, fontSize: 11 }}>route: not_assigned</div>
            }
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              <Badge label="module_installed: false" color={MUTE} />
              <Badge label="live: false" color={MUTE} />
            </div>
            {(m.status === 'placeholder' || m.status === 'pending') &&
              <Lock msg="activation_required — placeholder mode" />
            }
          </Card>
        ))}
      </div>
    </div>
  );
}

function MarketplacePanel() {
  return (
    <div>
      <SectionTitle>Marketplace Catalog</SectionTitle>
      <Card>
        <div style={{ color: TEXT, fontWeight: 700, marginBottom: 8 }}>Marketplace</div>
        <Lock msg="marketplace_enabled: false — marketplace_purchases_enabled: false — live_purchase_enabled: false" />
        <div style={{ color: MUTE, fontSize: 13, marginTop: 10 }}>No marketplace listings available. Real marketplace purchase is not live. Activation required.</div>
      </Card>
      <SectionTitle>Purchases</SectionTitle>
      <Card>
        <div style={{ color: MUTE, fontSize: 13 }}>No purchases found. payment_completed: false.</div>
      </Card>
    </div>
  );
}

function RoadmapPanel() {
  return (
    <div>
      <SectionTitle>Module Roadmap</SectionTitle>
      {ROADMAP.map(r => (
        <Card key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ minWidth: 40, color: GOLD, fontWeight: 800, fontSize: 16 }}>{r.key}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: TEXT, fontWeight: 700 }}>{r.name}</div>
          </div>
          <Badge label={r.status} color={statusColor(r.status)} />
        </Card>
      ))}
    </div>
  );
}

function ConnectorsPanel() {
  return (
    <div>
      <SectionTitle>Integration Connectors</SectionTitle>
      {CONNECTORS.map(c => (
        <Card key={c.key}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: TEXT, fontWeight: 700 }}>{c.name}</div>
              <div style={{ color: MUTE, fontSize: 12 }}>{c.type}</div>
            </div>
            <Badge label={c.status} color={statusColor(c.status)} />
          </div>
          <Lock msg="provider_connected: false — activation_required — not live" />
        </Card>
      ))}
    </div>
  );
}

function WidgetsPanel() {
  return (
    <div>
      <SectionTitle>Dashboard Widgets</SectionTitle>
      <Card>
        <div style={{ color: TEXT, fontWeight: 700, marginBottom: 8 }}>Widget Configuration</div>
        <Lock msg="widget_drag_drop_enabled: false — layout_save_enabled: false" />
        <div style={{ color: MUTE, fontSize: 13, marginTop: 10 }}>No widgets configured. Widget drag-drop and layout save are not live.</div>
      </Card>
    </div>
  );
}

function ActivityPanel() {
  return (
    <div>
      <SectionTitle>Activity Feed</SectionTitle>
      <Card>
        <Lock msg="live_activity_feed_enabled: false" />
        <div style={{ color: MUTE, fontSize: 13, marginTop: 10 }}>No activity events. Live activity feed is not enabled.</div>
      </Card>
    </div>
  );
}

function NotificationsPanel() {
  return (
    <div>
      <SectionTitle>Notification Center</SectionTitle>
      <Card>
        <Lock msg="notification_center_enabled: false — live_delivery_enabled: false" />
        <div style={{ color: MUTE, fontSize: 13, marginTop: 10 }}>No notifications. Notification center is not live.</div>
      </Card>
    </div>
  );
}

function OnboardingPanel() {
  const steps = [
    { key: 'configure_tenant', label: 'Configure Tenant', done: false },
    { key: 'connect_billing', label: 'Connect Billing', done: false },
    { key: 'install_first_module', label: 'Install First Module', done: false },
    { key: 'configure_nav', label: 'Configure Navigation Shell', done: false },
    { key: 'invite_team', label: 'Invite Team', done: false },
  ];
  return (
    <div>
      <SectionTitle>Onboarding Checklist</SectionTitle>
      <Card>
        <Lock msg="onboarding_checklist_enabled: false — activation_required" />
        <div style={{ marginTop: 12 }}>
          {steps.map(s => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: `1px solid ${LINE}` }}>
              <div style={{ width: 16, height: 16, borderRadius: 8, border: `2px solid ${MUTE}`, background: 'transparent' }} />
              <div style={{ color: MUTE, fontSize: 13 }}>{s.label}</div>
              <Badge label="pending" color={MUTE} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function FeatureFlagsPanel() {
  return (
    <div>
      <SectionTitle>Feature Flag Overrides</SectionTitle>
      <Card>
        <Lock msg="feature_flag_override_enabled: false — platform_admin_guard_required" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8, marginTop: 14 }}>
          {Object.entries(FLAGS).map(([k, v]) => (
            <div key={k} style={{ background: NAVY, borderRadius: 6, padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: MUTE, fontSize: 11 }}>{k}</span>
              <span style={{ color: v ? GREEN : RED, fontWeight: 700, fontSize: 11 }}>{String(v)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ApiKeysPanel() {
  return (
    <div>
      <SectionTitle>API Keys</SectionTitle>
      <Card>
        <Lock msg="api_key_creation_enabled: false — live_mode_enabled: false — activation_required" />
        <div style={{ color: MUTE, fontSize: 13, marginTop: 10 }}>No API keys found. Real API key creation is not live.</div>
      </Card>
    </div>
  );
}

function PreferencesPanel() {
  return (
    <div>
      <SectionTitle>User Preferences</SectionTitle>
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[['Locale', 'en-US'], ['Timezone', 'UTC'], ['Theme', 'dark'], ['Notifications', 'enabled']].map(([k, v]) => (
            <div key={k} style={{ background: NAVY, borderRadius: 6, padding: '10px 14px' }}>
              <div style={{ color: MUTE, fontSize: 11, marginBottom: 4 }}>{k}</div>
              <div style={{ color: TEXT, fontWeight: 700 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ color: MUTE, fontSize: 12, marginTop: 10 }}>Locales supported: en-US · es-DO · es · ht · de · pt</div>
      </Card>
    </div>
  );
}

function EntitlementsPanel() {
  return (
    <div>
      <SectionTitle>Module Entitlements</SectionTitle>
      <Card>
        <Lock msg="is_active: false — activation_required — live_mode_enabled: false" />
        <div style={{ color: MUTE, fontSize: 13, marginTop: 10 }}>No entitlements granted. Real module entitlement requires platform activation.</div>
        <div style={{ marginTop: 12 }}>
          {MODULES.map(m => (
            <div key={m.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${LINE}` }}>
              <span style={{ color: MUTE, fontSize: 12 }}>{m.name}</span>
              <Badge label="not_granted" color={MUTE} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AuditPanel() {
  return (
    <div>
      <SectionTitle>Audit Log</SectionTitle>
      <Card>
        <div style={{ color: MUTE, fontSize: 12, marginBottom: 8 }}>contains_secrets: false · stores_secrets: false · exposes_private_data: true</div>
        <div style={{ color: MUTE, fontSize: 13 }}>No audit events. Database not configured — local_preview mode.</div>
      </Card>
    </div>
  );
}

function PlatformHealthPanel() {
  return (
    <div>
      <SectionTitle>Platform Health Status</SectionTitle>
      <Card>
        <Lock msg="live_monitoring_enabled: false — all components: unknown" />
        {PLATFORM_COMPONENTS.map(c => (
          <div key={c} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${LINE}` }}>
            <span style={{ color: TEXT, fontSize: 13 }}>{c}</span>
            <Badge label="unknown" color={MUTE} />
          </div>
        ))}
      </Card>
    </div>
  );
}

function SearchPanel() {
  return (
    <div>
      <SectionTitle>Search</SectionTitle>
      <Card>
        <Lock msg="search_enabled: false — live_search_enabled: false" />
        <div style={{ color: MUTE, fontSize: 13, marginTop: 10 }}>Search is not live. Real search requires platform activation.</div>
      </Card>
    </div>
  );
}

const PANELS = {
  Overview:        OverviewPanel,
  Modules:         ModulesPanel,
  Marketplace:     MarketplacePanel,
  Roadmap:         RoadmapPanel,
  Connectors:      ConnectorsPanel,
  Widgets:         WidgetsPanel,
  Activity:        ActivityPanel,
  Notifications:   NotificationsPanel,
  Onboarding:      OnboardingPanel,
  'Feature Flags': FeatureFlagsPanel,
  'API Keys':      ApiKeysPanel,
  Preferences:     PreferencesPanel,
  Entitlements:    EntitlementsPanel,
  Audit:           AuditPanel,
  'Platform Health': PlatformHealthPanel,
  Search:          SearchPanel,
};

function CraftHubDashboard() {
  const [activeTab, setActiveTab] = useState('Overview');
  const Panel = PANELS[activeTab] || OverviewPanel;

  return (
    <div style={{ minHeight: '100vh', background: NAVY, color: TEXT, fontFamily: 'monospace' }}>
      {/* Top Bar */}
      <div style={{ background: CHARCOAL, borderBottom: `1px solid ${LINE}`, padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: GOLD2, fontWeight: 900, fontSize: 18, letterSpacing: 1 }}>CRAFTHUB 360</div>
          <div style={{ color: MUTE, fontSize: 11 }}>Module Launcher · Navigation Shell · Premium Experience Hub</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Badge label="Phase C5" color={GOLD} />
          <Badge label="local_preview" color={BLUE} />
          <Badge label="live_mode: false" color={RED} />
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ background: CHARCOAL, borderBottom: `1px solid ${LINE}`, padding: '0 28px', display: 'flex', overflowX: 'auto', gap: 0 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '12px 16px', color: activeTab === t ? GOLD2 : MUTE, fontWeight: activeTab === t ? 800 : 400, fontSize: 12, borderBottom: activeTab === t ? `2px solid ${GOLD2}` : '2px solid transparent', whiteSpace: 'nowrap' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 28, maxWidth: 1200, margin: '0 auto' }}>
        <Panel />
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${LINE}`, padding: '12px 28px', background: CHARCOAL, display: 'flex', justifyContent: 'space-between', color: MUTE, fontSize: 11 }}>
        <span>CraftHub 360 · NOVEE OS · Phase C.5</span>
        <span>{DEVICE_LINE}</span>
        <span>contains_secrets: false · local_preview: true</span>
      </div>
    </div>
  );
}

export default CraftHubDashboard;
