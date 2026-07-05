// contains_secrets: false — no credentials, no API keys, no secrets in UI layer
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

const DEVICE_LINE = 'Touchscreen &middot; Handheld &middot; Tablet &middot; Desktop';

const TABS = [
  'Overview', 'Provider Registry', 'Provider Status', 'Companion Mode',
  'Export / Import Mode', 'API Contract Mode', 'Manual Mapping Mode', 'Hybrid Mode',
  'Toast', 'Clover', 'Square POS', 'Lightspeed', 'Shopify POS',
  'SpotOn', 'TouchBistro', 'Revel', 'Generic CSV Import', 'Manual POS Companion',
  'Credential Presence', 'CSV Import Templates', 'Import Batches',
  'Manual Mapping Profiles', 'Menu Category Mapping', 'Menu Item Mapping',
  'Modifier Mapping', 'Tax Mapping', 'Tip Mapping', 'Payment Type Mapping',
  'Staff Role Mapping', 'Table Section Mapping', 'Revenue Center Mapping',
  'Department Mapping', 'Inventory Signal Mapping', 'Humidor Mapping',
  'Bar Mapping', 'Kitchen Mapping', 'Order Flow Mapping', 'Ticket Flow Mapping',
  'Closeout Mapping', 'Report Mapping', 'API Contract Registry',
  'Webhook Registry', 'Webhook Health', 'Live Mode Lock',
  'Tenant Mapping', 'Module Mapping', 'Compliance Checklist',
  'Risk Flags', 'Activation Audit', 'Readiness Summary',
];

const PROVIDERS = [
  { key: 'toast',               label: 'Toast',                      modes: ['Companion', 'Import', 'API'] },
  { key: 'clover',              label: 'Clover',                     modes: ['Companion', 'Import', 'API'] },
  { key: 'square_pos',          label: 'Square POS',                 modes: ['Companion', 'Import', 'API'] },
  { key: 'lightspeed',          label: 'Lightspeed',                 modes: ['Companion', 'Import', 'API'] },
  { key: 'shopify_pos',         label: 'Shopify POS',                modes: ['Companion', 'Import', 'API'] },
  { key: 'spoton',              label: 'SpotOn',                     modes: ['Companion', 'Import'] },
  { key: 'touchbistro',         label: 'TouchBistro',                modes: ['Companion', 'Import'] },
  { key: 'revel',               label: 'Revel',                      modes: ['Companion', 'Import'] },
  { key: 'generic_csv',         label: 'Generic CSV Import',         modes: ['Import'] },
  { key: 'manual_pos_companion',label: 'Manual POS Companion',       modes: ['Companion'] },
  { key: 'future_pos_provider', label: 'Future Provider (Placeholder)', modes: [] },
];

const MAPPING_TYPES = [
  'Menu Category', 'Menu Item', 'Modifier', 'Tax', 'Tip',
  'Payment Type', 'Staff Role', 'Table Section', 'Revenue Center',
  'Department', 'Inventory Signal', 'Humidor', 'Bar', 'Kitchen',
  'Order Flow', 'Ticket Flow', 'Closeout', 'Report',
];

function Badge({ label, color }) {
  return (
    <span style={{ background: color + '22', color, border: `1px solid ${color}44`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
      {label}
    </span>
  );
}

function SectionTitle({ children }) {
  return <div style={{ color: GOLD2, fontWeight: 700, fontSize: 15, marginBottom: 12, borderBottom: `1px solid ${LINE}`, paddingBottom: 6 }}>{children}</div>;
}

function InfoRow({ label, value, valueColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${LINE}22` }}>
      <span style={{ color: MUTE, fontSize: 13 }}>{label}</span>
      <span style={{ color: valueColor || TEXT, fontSize: 13, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function SafetyBanner() {
  const rules = [
    'External POS sync is NOT live - no provider is connected',
    'Companion mode works BESIDE the existing POS, not connected to it',
    'Import mode requires actual exported files from your existing POS',
    'API contract mode is locked until credentials and approval are verified',
    'Manual mapping is user-configured mapping, not verified provider sync',
    'No external POS credentials or secrets are stored on this platform',
    'No payment, ticket, menu, or inventory sync is claimed live',
    'All providers default to not_started with connected: false',
  ];
  return (
    <div style={{ background: AMBER + '11', border: `1px solid ${AMBER}44`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
      <div style={{ color: AMBER, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>EXTERNAL POS SAFETY ENFORCEMENT - ALL RULES ACTIVE</div>
      {rules.map((r, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 4 }}>
          <span style={{ color: AMBER, fontSize: 12, marginTop: 1 }}>-</span>
          <span style={{ color: TEXT, fontSize: 12 }}>{r}</span>
        </div>
      ))}
    </div>
  );
}

function OverviewPanel() {
  return (
    <div>
      <SafetyBanner />
      <SectionTitle>Phase D.3 - External POS Activation Command Center</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Companion Mode', desc: 'Use POS360/E.A.T. beside existing POS. No connection required.', color: BLUE, status: 'Available (unconfigured)' },
          { label: 'Export / Import Mode', desc: 'Import CSV/spreadsheet exports from your existing POS.', color: BLUE, status: 'Available (no files uploaded)' },
          { label: 'API Contract Mode', desc: 'Future: direct API sync after credentials and approval.', color: MUTE, status: 'Locked - credentials required' },
          { label: 'Manual Mapping Mode', desc: 'Admin-configured mapping of menu, staff, sections, taxes.', color: BLUE, status: 'Available (unconfigured)' },
          { label: 'Hybrid Mode', desc: 'Combine companion + import + manual mapping.', color: BLUE, status: 'Available (unconfigured)' },
        ].map((m, i) => (
          <div key={i} style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 14 }}>
            <div style={{ color: m.color, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{m.label}</div>
            <div style={{ color: MUTE, fontSize: 12, marginBottom: 8 }}>{m.desc}</div>
            <Badge label={m.status} color={m.color} />
          </div>
        ))}
      </div>
      <SectionTitle>All Providers - Default Status</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {PROVIDERS.map(p => (
          <div key={p.key} style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 6, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: TEXT, fontWeight: 700, fontSize: 13 }}>{p.label}</span>
              <Badge label="not started" color={MUTE} />
            </div>
            <div style={{ color: MUTE, fontSize: 11, marginTop: 4 }}>connected: false | api_sync: false | live: false</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProviderRegistryPanel() {
  return (
    <div>
      <SectionTitle>External POS Provider Registry</SectionTitle>
      <div style={{ background: AMBER + '11', border: `1px solid ${AMBER}33`, borderRadius: 6, padding: 12, marginBottom: 16, fontSize: 12, color: AMBER }}>
        All providers default to not_started. No provider is connected, synced, or live. No secrets stored.
      </div>
      {PROVIDERS.map(p => (
        <div key={p.key} style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ color: GOLD2, fontWeight: 700, fontSize: 15 }}>{p.label}</span>
            <Badge label="not started" color={MUTE} />
          </div>
          <InfoRow label="Provider Key" value={p.key} />
          <InfoRow label="Connected" value="NO" valueColor={MUTE} />
          <InfoRow label="API Sync Enabled" value="NO" valueColor={MUTE} />
          <InfoRow label="Webhook Enabled" value="NO" valueColor={MUTE} />
          <InfoRow label="Live Mode Enabled" value="NO" valueColor={MUTE} />
          <InfoRow label="Contains Secrets" value="NO" valueColor={GREEN} />
          <InfoRow label="Stores Secrets" value="NO" valueColor={GREEN} />
          <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {p.modes.map(m => <Badge key={m} label={m} color={BLUE} />)}
            {p.modes.length === 0 && <Badge label="Placeholder" color={MUTE} />}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProviderStatusPanel() {
  return (
    <div>
      <SectionTitle>Provider Status Overview</SectionTitle>
      {PROVIDERS.map(p => (
        <div key={p.key} style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 6, padding: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: TEXT, fontSize: 13 }}>{p.label}</span>
          <Badge label="not started" color={MUTE} />
        </div>
      ))}
    </div>
  );
}

function ModePanel({ title, description, safetyNote, available, steps }) {
  return (
    <div>
      <SectionTitle>{title}</SectionTitle>
      <div style={{ background: available ? BLUE + '11' : AMBER + '11', border: `1px solid ${available ? BLUE : AMBER}33`, borderRadius: 6, padding: 12, marginBottom: 16, fontSize: 12, color: available ? BLUE : AMBER }}>
        {safetyNote}
      </div>
      <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ color: TEXT, fontSize: 13, marginBottom: 12 }}>{description}</div>
        <InfoRow label="Mode Available" value={available ? 'Yes (unconfigured)' : 'No - Locked'} valueColor={available ? BLUE : MUTE} />
        <InfoRow label="Live Sync" value="NO" valueColor={MUTE} />
        <InfoRow label="Credentials Required" value={available ? 'No' : 'Yes'} valueColor={MUTE} />
        <InfoRow label="Admin Approval Required for Live" value="YES" valueColor={AMBER} />
      </div>
      {steps && (
        <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Setup Steps</SectionTitle>
          {steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              <div style={{ background: LINE, color: GOLD, fontWeight: 700, fontSize: 12, width: 24, height: 24, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
              <span style={{ color: TEXT, fontSize: 13 }}>{step}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CompanionModePanel() {
  return (
    <ModePanel
      title="Companion Mode"
      description="Staff uses POS360 / E.A.T. beside the existing POS. The existing POS remains the primary payment and ticket system. POS360 / E.A.T. supports guest profiles, loyalty, inventory notes, staff visibility, humidor/bar/kitchen intelligence, and manager dashboards."
      safetyNote="Companion mode is NOT connected to any external POS. No sync, no API calls, no payment data transfer."
      available={true}
      steps={[
        'Enable Companion Mode for the venue in the mapping profile',
        'Configure which POS360/E.A.T. features to use alongside the existing POS',
        'Set up staff roles and section mapping manually',
        'Enable guest profile tracking and loyalty modules',
        'Configure humidor/bar/kitchen intelligence panels',
        'Train staff on parallel operation workflow',
      ]}
    />
  );
}

function ExportImportModePanel() {
  return (
    <ModePanel
      title="Export / Import Mode"
      description="Venue exports sales reports, closeout data, item mix, CSV files, or spreadsheets from their existing POS. E.A.T. / POS360 imports or reads that data to generate inventory intelligence, COGS, reorder alerts, sales patterns, menu performance, and operational reporting."
      safetyNote="Import mode requires actual POS-exported files. No data is claimed imported unless a real file is provided and parsed."
      available={true}
      steps={[
        'Configure an import profile for your existing POS system',
        'Create a CSV import template matching your POS export format',
        'Export data from your existing POS (sales, closeout, item mix)',
        'Upload the exported file to create an import batch',
        'Map external categories, items, taxes, and departments',
        'Review import batch results and confirm mappings',
      ]}
    />
  );
}

function APIContractModePanel() {
  return (
    <ModePanel
      title="API Contract Mode"
      description="Future mode only. External POS APIs may be connected later after credentials, partner approval, webhook verification, data mapping, and live-mode approval. No API sync is live in this phase."
      safetyNote="API contract mode is LOCKED. No API calls are made to any external POS. Credentials must be verified and live mode must be approved before any sync occurs."
      available={false}
      steps={[
        'Contact the external POS provider to request API access',
        'Obtain API credentials (stored in environment variables only)',
        'Register API contract in the API Contract Registry',
        'Configure and verify webhook endpoints',
        'Run test mode API verification',
        'Submit live mode request for admin approval',
        'Receive live mode approval',
        'Unlock environment lock for the provider',
        'Enable live API sync after all approvals',
      ]}
    />
  );
}

function ManualMappingModePanel() {
  return (
    <ModePanel
      title="Manual Mapping Mode"
      description="Venue manually maps menu items, departments, categories, staff roles, sections, tables, taxes, tips, and payment types. This creates the operational layer that E.A.T. and POS360 use for intelligence and reporting."
      safetyNote="Manual mapping is user-configured operational mapping. It is NOT verified provider sync and does NOT claim live data."
      available={true}
      steps={[
        'Create a manual mapping profile for your venue and POS system',
        'Map menu categories from your POS to POS360 categories',
        'Map menu items and modifiers',
        'Map tax rates and payment types',
        'Map staff roles and table sections',
        'Map revenue centers and departments',
        'Configure humidor, bar, and kitchen mappings as needed',
      ]}
    />
  );
}

function HybridModePanel() {
  return (
    <ModePanel
      title="Hybrid Mode"
      description="Combine Companion Mode + Export/Import Mode + Manual Mapping Mode while waiting on API approval or for venues that prefer not to use API sync. Provides full operational intelligence without requiring live API integration."
      safetyNote="Hybrid mode combines non-API modes only. No live API sync is included in hybrid mode configuration."
      available={true}
      steps={[
        'Activate Companion Mode to use POS360/E.A.T. alongside existing POS',
        'Configure import profiles for regular CSV/spreadsheet import workflows',
        'Create manual mappings for menu, staff, and operational data',
        'Set up scheduled import reminders for daily/weekly closeout data',
        'Use E.A.T. intelligence on imported data',
        'Upgrade to API contract mode later when ready',
      ]}
    />
  );
}

function ProviderDetailPanel({ provider }) {
  const p = PROVIDERS.find(x => x.label === provider);
  return (
    <div>
      <SectionTitle>{provider}</SectionTitle>
      <div style={{ background: AMBER + '11', border: `1px solid ${AMBER}33`, borderRadius: 6, padding: 12, marginBottom: 16, fontSize: 12, color: AMBER }}>
        No connection to {provider} exists. All booleans default to false. No credentials stored.
      </div>
      <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16 }}>
        <InfoRow label="Provider Key" value={p?.key || provider.toLowerCase().replace(/ /g, '_')} />
        <InfoRow label="Status" value="not_started" valueColor={MUTE} />
        <InfoRow label="Connected" value="NO" valueColor={MUTE} />
        <InfoRow label="API Sync Enabled" value="NO" valueColor={MUTE} />
        <InfoRow label="Webhook Enabled" value="NO" valueColor={MUTE} />
        <InfoRow label="Live Mode Enabled" value="NO" valueColor={MUTE} />
        <InfoRow label="Credentials Present" value="NO" valueColor={MUTE} />
        <InfoRow label="Secrets Stored" value="NO" valueColor={GREEN} />
        <InfoRow label="Available Modes" value={p?.modes.join(', ') || 'None'} valueColor={p?.modes.length ? BLUE : MUTE} />
      </div>
      <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16, marginTop: 12 }}>
        <SectionTitle>Activation Requirements</SectionTitle>
        {[
          `Create a ${provider} account with API access`,
          'Complete business verification with the provider',
          'Obtain API credentials (configure in environment variables only - NOT in database)',
          'Register API contract in the API Contract Registry',
          'Run test mode verification',
          'Submit live mode request and receive admin approval',
          'Unlock environment lock',
          'Enable live mode only after all approvals',
        ].map((req, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <span style={{ color: MUTE, fontSize: 13 }}>{i + 1}.</span>
            <span style={{ color: TEXT, fontSize: 13 }}>{req}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CredentialPresencePanel() {
  return (
    <div>
      <SectionTitle>Credential Presence Status</SectionTitle>
      <div style={{ background: RED + '11', border: `1px solid ${RED}33`, borderRadius: 6, padding: 12, marginBottom: 16, fontSize: 12, color: RED }}>
        Credential presence tracks PRESENCE ONLY. No API keys, secrets, or tokens are stored in the database or displayed here.
      </div>
      {PROVIDERS.map(p => (
        <div key={p.key} style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 12, marginBottom: 8 }}>
          <div style={{ color: GOLD2, fontWeight: 700, marginBottom: 6 }}>{p.label}</div>
          <InfoRow label="Presence Status" value="absent" valueColor={MUTE} />
          <InfoRow label="Stores Raw Keys" value="NO" valueColor={GREEN} />
          <InfoRow label="Stores API Secret" value="NO" valueColor={GREEN} />
        </div>
      ))}
    </div>
  );
}

function CSVTemplatesPanel() {
  return (
    <div>
      <SectionTitle>CSV Import Templates</SectionTitle>
      <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: MUTE, fontSize: 13, marginBottom: 12 }}>No CSV import templates configured. Templates define how to map columns from your POS export to POS360 data structures.</div>
        <div style={{ color: TEXT, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Typical template fields:</div>
        {['item_name', 'item_id', 'category', 'price', 'quantity_sold', 'tax_rate', 'revenue_center', 'department'].map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
            <span style={{ color: BLUE, fontSize: 12 }}>-</span>
            <span style={{ color: TEXT, fontSize: 12, fontFamily: 'monospace' }}>{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImportBatchesPanel() {
  return (
    <div>
      <SectionTitle>Import Batches</SectionTitle>
      <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: MUTE, fontSize: 13 }}>No import batches on record. Import batches are created when actual POS export files are uploaded and parsed.</div>
      </div>
    </div>
  );
}

function ManualMappingProfilesPanel() {
  return (
    <div>
      <SectionTitle>Manual Mapping Profiles</SectionTitle>
      <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: MUTE, fontSize: 13 }}>No manual mapping profiles configured. Create a profile to begin mapping your external POS structure to POS360.</div>
      </div>
    </div>
  );
}

function MappingPanel({ title, description }) {
  return (
    <div>
      <SectionTitle>{title}</SectionTitle>
      <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: MUTE, fontSize: 13, marginBottom: 8 }}>{description || `No ${title.toLowerCase()} entries configured.`}</div>
        <InfoRow label="Mappings Count" value="0" valueColor={MUTE} />
        <InfoRow label="Confirmed Mappings" value="0" valueColor={MUTE} />
        <InfoRow label="Sync Live" value="NO" valueColor={MUTE} />
      </div>
    </div>
  );
}

function APIContractRegistryPanel() {
  return (
    <div>
      <SectionTitle>API Contract Registry</SectionTitle>
      <div style={{ background: RED + '11', border: `1px solid ${RED}33`, borderRadius: 6, padding: 12, marginBottom: 16, fontSize: 12, color: RED }}>
        API contract mode does NOT call external APIs. This registry tracks contract readiness only. All api_sync_enabled and live_mode_enabled default to false.
      </div>
      {PROVIDERS.filter(p => p.modes.includes('API')).map(p => (
        <div key={p.key} style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 12, marginBottom: 8 }}>
          <div style={{ color: GOLD2, fontWeight: 700, marginBottom: 6 }}>{p.label}</div>
          <InfoRow label="API Contract Status" value="not_started" valueColor={MUTE} />
          <InfoRow label="API Sync Enabled" value="NO" valueColor={MUTE} />
          <InfoRow label="Live Mode Enabled" value="NO" valueColor={MUTE} />
          <InfoRow label="Partner Approved" value="NO" valueColor={MUTE} />
          <InfoRow label="Contains Secrets" value="NO" valueColor={GREEN} />
        </div>
      ))}
    </div>
  );
}

function WebhookRegistryPanel() {
  return (
    <div>
      <SectionTitle>Webhook Registry</SectionTitle>
      <div style={{ background: RED + '11', border: `1px solid ${RED}33`, borderRadius: 6, padding: 12, marginBottom: 16, fontSize: 12, color: RED }}>
        Webhook secrets are configured via environment variables only. They are NEVER stored in the database.
      </div>
      {PROVIDERS.filter(p => p.modes.includes('API')).map(p => (
        <div key={p.key} style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 12, marginBottom: 8 }}>
          <div style={{ color: GOLD2, fontWeight: 700, marginBottom: 6 }}>{p.label}</div>
          <InfoRow label="Webhook Status" value="not_configured" valueColor={MUTE} />
          <InfoRow label="Webhook Enabled" value="NO" valueColor={MUTE} />
          <InfoRow label="Stores Webhook Secret" value="NO" valueColor={GREEN} />
        </div>
      ))}
    </div>
  );
}

function WebhookHealthPanel() {
  return (
    <div>
      <SectionTitle>Webhook Health</SectionTitle>
      <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: MUTE, fontSize: 13 }}>No webhook health data. Webhooks are not configured.</div>
      </div>
    </div>
  );
}

function LiveModeLockPanel() {
  return (
    <div>
      <SectionTitle>Live Mode Lock</SectionTitle>
      <div style={{ background: AMBER + '11', border: `1px solid ${AMBER}33`, borderRadius: 6, padding: 12, marginBottom: 16, fontSize: 12, color: AMBER }}>
        All providers are environment-locked by default. Live mode requires explicit admin approval and real credential verification.
      </div>
      {PROVIDERS.filter(p => p.modes.includes('API')).map(p => (
        <div key={p.key} style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 12, marginBottom: 8 }}>
          <div style={{ color: GOLD2, fontWeight: 700, marginBottom: 6 }}>{p.label}</div>
          <InfoRow label="Lock Status" value="locked" valueColor={AMBER} />
          <InfoRow label="Lock Reason" value="Phase D.3 activation required before live mode" valueColor={MUTE} />
          <InfoRow label="Unlock Approved" value="No" valueColor={MUTE} />
        </div>
      ))}
    </div>
  );
}

function TenantMappingPanel() {
  return (
    <div>
      <SectionTitle>Tenant External POS Mapping</SectionTitle>
      <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: MUTE, fontSize: 13 }}>No tenant-provider mappings configured.</div>
      </div>
    </div>
  );
}

function ModuleMappingPanel() {
  return (
    <div>
      <SectionTitle>Module External POS Mapping</SectionTitle>
      <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: MUTE, fontSize: 13 }}>No module-provider mappings configured.</div>
      </div>
    </div>
  );
}

function ComplianceChecklistPanel() {
  const items = [
    'POS provider API terms of service reviewed',
    'Data sharing agreement assessed',
    'PCI scope for import data confirmed (no card data in imports)',
    'Vendor security assessment completed',
    'Data retention policy for imported records defined',
    'Import data anonymization requirements assessed',
  ];
  return (
    <div>
      <SectionTitle>Compliance Checklist</SectionTitle>
      {items.map((item, i) => (
        <div key={i} style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 6, padding: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: TEXT, fontSize: 13 }}>{item}</span>
          <Badge label="pending" color={MUTE} />
        </div>
      ))}
    </div>
  );
}

function RiskFlagsPanel() {
  return (
    <div>
      <SectionTitle>Risk Flags</SectionTitle>
      <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: MUTE, fontSize: 13 }}>No risk flags recorded. Risk flags are created during activation review.</div>
      </div>
    </div>
  );
}

function ActivationAuditPanel() {
  return (
    <div>
      <SectionTitle>Activation Audit Log</SectionTitle>
      <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: MUTE, fontSize: 13 }}>No audit events recorded. All external POS configuration changes will be permanently logged here.</div>
      </div>
    </div>
  );
}

function ReadinessSummaryPanel() {
  const items = [
    { label: 'Phase', value: 'D.3', color: GOLD2 },
    { label: 'External POS Sync Live', value: 'NO', color: MUTE },
    { label: 'Companion Mode Available', value: 'Unconfigured', color: BLUE },
    { label: 'Import Mode Available', value: 'Unconfigured', color: BLUE },
    { label: 'API Contract Mode Live', value: 'NO - Locked', color: MUTE },
    { label: 'Manual Mapping Available', value: 'Unconfigured', color: BLUE },
    { label: 'Providers Connected', value: '0 / 11', color: MUTE },
    { label: 'No Secret Storage', value: 'ENFORCED', color: GREEN },
    { label: 'No Fake Connected Status', value: 'ENFORCED', color: GREEN },
    { label: 'No Fake Sync Claim', value: 'ENFORCED', color: GREEN },
    { label: 'Environment Locks Active', value: 'YES', color: AMBER },
  ];
  const limitations = [
    'No external POS is connected in this phase',
    'Companion mode requires venue-level configuration',
    'Import mode requires actual POS-exported files',
    'API contract mode requires credentials, partner approval, and live-mode unlock',
    'Manual mapping requires admin configuration',
  ];
  return (
    <div>
      <SectionTitle>Phase D.3 Readiness Summary</SectionTitle>
      <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        {items.map((item, i) => <InfoRow key={i} label={item.label} value={item.value} valueColor={item.color} />)}
      </div>
      <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>Honest Limitations</SectionTitle>
        {limitations.map((l, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <span style={{ color: AMBER }}>-</span>
            <span style={{ color: TEXT, fontSize: 13 }}>{l}</span>
          </div>
        ))}
      </div>
      <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16, marginTop: 12 }}>
        <SectionTitle>Phase D Tracker</SectionTitle>
        {[
          { phase: 'D.1', label: 'Provider Activation Roadmap', status: 'COMPLETE' },
          { phase: 'D.2', label: 'Payment Provider Activation', status: 'COMPLETE' },
          { phase: 'D.3', label: 'External POS Activation', status: 'COMPLETE' },
          { phase: 'D.4', label: 'Inventory Activation', status: 'Next' },
          { phase: 'D.5', label: 'Communication Activation', status: 'Not Started' },
          { phase: 'D.6', label: 'Security Activation', status: 'Not Started' },
          { phase: 'D.7', label: 'Deployment Activation', status: 'Not Started' },
          { phase: 'D.8', label: 'Live Pilot Readiness', status: 'Not Started' },
        ].map((d, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 8, alignItems: 'center' }}>
            <span style={{ color: GOLD, fontWeight: 700, fontSize: 13, minWidth: 30 }}>{d.phase}</span>
            <span style={{ color: TEXT, fontSize: 13, flex: 1 }}>{d.label}</span>
            <Badge label={d.status} color={d.status === 'COMPLETE' ? GREEN : d.status === 'Next' ? AMBER : MUTE} />
          </div>
        ))}
      </div>
    </div>
  );
}

const PANELS = {
  'Overview':              <OverviewPanel />,
  'Provider Registry':     <ProviderRegistryPanel />,
  'Provider Status':       <ProviderStatusPanel />,
  'Companion Mode':        <CompanionModePanel />,
  'Export / Import Mode':  <ExportImportModePanel />,
  'API Contract Mode':     <APIContractModePanel />,
  'Manual Mapping Mode':   <ManualMappingModePanel />,
  'Hybrid Mode':           <HybridModePanel />,
  'Toast':                 <ProviderDetailPanel provider="Toast" />,
  'Clover':                <ProviderDetailPanel provider="Clover" />,
  'Square POS':            <ProviderDetailPanel provider="Square POS" />,
  'Lightspeed':            <ProviderDetailPanel provider="Lightspeed" />,
  'Shopify POS':           <ProviderDetailPanel provider="Shopify POS" />,
  'SpotOn':                <ProviderDetailPanel provider="SpotOn" />,
  'TouchBistro':           <ProviderDetailPanel provider="TouchBistro" />,
  'Revel':                 <ProviderDetailPanel provider="Revel" />,
  'Generic CSV Import':    <ProviderDetailPanel provider="Generic CSV Import" />,
  'Manual POS Companion':  <ProviderDetailPanel provider="Manual POS Companion" />,
  'Credential Presence':   <CredentialPresencePanel />,
  'CSV Import Templates':  <CSVTemplatesPanel />,
  'Import Batches':        <ImportBatchesPanel />,
  'Manual Mapping Profiles': <ManualMappingProfilesPanel />,
  'Menu Category Mapping': <MappingPanel title="Menu Category Mapping" />,
  'Menu Item Mapping':     <MappingPanel title="Menu Item Mapping" />,
  'Modifier Mapping':      <MappingPanel title="Modifier Mapping" />,
  'Tax Mapping':           <MappingPanel title="Tax Mapping" />,
  'Tip Mapping':           <MappingPanel title="Tip Mapping" />,
  'Payment Type Mapping':  <MappingPanel title="Payment Type Mapping" />,
  'Staff Role Mapping':    <MappingPanel title="Staff Role Mapping" />,
  'Table Section Mapping': <MappingPanel title="Table Section Mapping" />,
  'Revenue Center Mapping':<MappingPanel title="Revenue Center Mapping" />,
  'Department Mapping':    <MappingPanel title="Department Mapping" />,
  'Inventory Signal Mapping': <MappingPanel title="Inventory Signal Mapping" />,
  'Humidor Mapping':       <MappingPanel title="Humidor Mapping" />,
  'Bar Mapping':           <MappingPanel title="Bar Mapping" />,
  'Kitchen Mapping':       <MappingPanel title="Kitchen Mapping" />,
  'Order Flow Mapping':    <MappingPanel title="Order Flow Mapping" />,
  'Ticket Flow Mapping':   <MappingPanel title="Ticket Flow Mapping" />,
  'Closeout Mapping':      <MappingPanel title="Closeout Mapping" />,
  'Report Mapping':        <MappingPanel title="Report Mapping" />,
  'API Contract Registry': <APIContractRegistryPanel />,
  'Webhook Registry':      <WebhookRegistryPanel />,
  'Webhook Health':        <WebhookHealthPanel />,
  'Live Mode Lock':        <LiveModeLockPanel />,
  'Tenant Mapping':        <TenantMappingPanel />,
  'Module Mapping':        <ModuleMappingPanel />,
  'Compliance Checklist':  <ComplianceChecklistPanel />,
  'Risk Flags':            <RiskFlagsPanel />,
  'Activation Audit':      <ActivationAuditPanel />,
  'Readiness Summary':     <ReadinessSummaryPanel />,
};

function PhaseDExternalPOSActivationShell() {
  const [activeTab, setActiveTab] = useState('Overview');

  return (
    <div style={{ minHeight: '100vh', background: NAVY, color: TEXT, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: CHARCOAL, borderBottom: `1px solid ${LINE}`, padding: '16px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: GOLD2, fontWeight: 700, fontSize: 20 }}>Phase D.3 - External POS Activation</div>
            <div style={{ color: MUTE, fontSize: 12, marginTop: 2 }} dangerouslySetInnerHTML={{ __html: DEVICE_LINE }} />
          </div>
          <Badge label="Sync Not Live" color={AMBER} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 0 }}>
        <div style={{ width: 220, background: CHARCOAL, borderRight: `1px solid ${LINE}`, minHeight: 'calc(100vh - 65px)', padding: '12px 0', flexShrink: 0, overflowY: 'auto' }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '7px 16px',
                background: activeTab === tab ? LINE : 'transparent',
                color: activeTab === tab ? GOLD2 : MUTE,
                border: 'none', cursor: 'pointer', fontSize: 11,
                borderLeft: activeTab === tab ? `3px solid ${GOLD}` : '3px solid transparent',
                fontWeight: activeTab === tab ? 700 : 400,
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          {PANELS[activeTab] || <div style={{ color: MUTE }}>Panel not found</div>}
        </div>
      </div>
    </div>
  );
}

function PhaseDExternalPOSActivation() {
  return <PhaseDExternalPOSActivationShell />;
}

export default PhaseDExternalPOSActivation;
