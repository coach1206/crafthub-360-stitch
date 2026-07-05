// Phase D.4 — Inventory Activation Command Center
// contains_secrets: false — no credentials, no API keys, no secrets in UI layer
// STATUS: BUILD ONLY. INVENTORY SYNC IS NOT LIVE. VENDOR ORDERS ARE PREVIEWS ONLY.

const NAVY      = '#0a0d14'
const CHARCOAL  = '#111520'
const CARD      = '#161b27'
const LINE      = '#252d3f'
const GOLD      = '#c9952c'
const GOLD2     = '#e8b84b'
const TEXT      = '#e8e4d8'
const MUTE      = '#7a8299'
const RED       = '#c0392b'
const GREEN     = '#27ae60'
const AMBER     = '#e67e22'
const BLUE      = '#2980b9'

const DEVICE_LINE = 'Touchscreen &middot; Handheld &middot; Tablet &middot; Desktop'

const SAFETY_WARNINGS = [
  'Inventory sync is NOT live.',
  'Vendor orders are PREVIEWS ONLY - no real orders are submitted.',
  'Purchase orders are PREVIEWS ONLY.',
  'Low-stock alerts require real inventory counts or imported data.',
  'COGS depends on real cost and sales data - not calculated without input.',
  'External POS inventory signals are mapping records, not live sync.',
  'No vendor secrets or inventory provider credentials are stored.',
  'Live inventory sync is locked until Phase D activation is complete.',
]

const INVENTORY_AREAS = [
  { key: 'humidor', label: 'Humidor Inventory' },
  { key: 'bar', label: 'Bar Inventory' },
  { key: 'kitchen', label: 'Kitchen Inventory' },
  { key: 'retail', label: 'Retail Inventory' },
  { key: 'general_supplies', label: 'General Supplies' },
  { key: 'menu_ingredients', label: 'Menu Ingredients' },
  { key: 'cigar_inventory', label: 'Cigar Inventory' },
  { key: 'bottle_inventory', label: 'Bottle Inventory' },
  { key: 'food_inventory', label: 'Food Inventory' },
  { key: 'merchandise_inventory', label: 'Merchandise Inventory' },
]

const PANELS = [
  'Overview', 'Area Registry', 'Area Status',
  'Humidor Inventory', 'Bar Inventory', 'Kitchen Inventory', 'Retail Inventory',
  'General Supplies', 'Menu Ingredients', 'Cigar Inventory', 'Bottle Inventory',
  'Food Inventory', 'Merchandise Inventory',
  'Locations', 'Storage Zones', 'Item Registry', 'Item Categories', 'Item Variants',
  'Unit Registry', 'Par Level Profiles', 'Reorder Rules', 'Low Stock Rules',
  'Count Sessions', 'Count Session Items', 'Adjustments', 'Transfers', 'Waste / Spoilage',
  'Vendor Registry', 'Vendor Catalog Profiles', 'Vendor Catalog Items',
  'Vendor Order Preview', 'Vendor Order Approval', 'Purchase Order Preview',
  'Import Profiles', 'Import Templates', 'Import Batches', 'Export Profiles',
  'External POS Inventory Signals', 'Humidor Mapping', 'Bar Mapping', 'Kitchen Mapping',
  'Retail Mapping', 'Menu Ingredient Mapping', 'Recipe Mapping',
  'COGS Profiles', 'Shrinkage Profiles', 'Alert Rules', 'Alert Previews',
  'Live Sync Lock', 'Tenant Mapping', 'Module Mapping',
  'Compliance Checklist', 'Risk Flags', 'Activation Audit', 'Inventory Readiness Summary',
]

import { useState } from 'react'

function SafetyBanner() {
  return (
    <div style={{ background: '#1a0a00', border: `1px solid ${AMBER}`, borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
      <div style={{ color: AMBER, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
        PHASE D.4 INVENTORY ACTIVATION — BUILD ONLY
      </div>
      {SAFETY_WARNINGS.map((w, i) => (
        <div key={i} style={{ color: TEXT, fontSize: 12, marginBottom: 4 }}>
          <span style={{ color: AMBER, marginRight: 6 }}>!</span>{w}
        </div>
      ))}
    </div>
  )
}

function TabBar({ panels, active, onSelect }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 20 }}>
      {panels.map(p => (
        <button
          key={p}
          onClick={() => onSelect(p)}
          style={{
            background: active === p ? GOLD : LINE,
            color: active === p ? NAVY : TEXT,
            border: 'none', borderRadius: 4, padding: '4px 10px',
            fontSize: 11, cursor: 'pointer', fontWeight: active === p ? 700 : 400,
          }}
        >
          {p}
        </button>
      ))}
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
      {title && <div style={{ color: GOLD2, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>{title}</div>}
      {children}
    </div>
  )
}

function StatusBadge({ label, active = false }) {
  return (
    <span style={{
      background: active ? '#1a3a1a' : '#1a1a2a',
      color: active ? GREEN : MUTE,
      border: `1px solid ${active ? GREEN : LINE}`,
      borderRadius: 4, padding: '2px 8px', fontSize: 11, marginRight: 6,
    }}>
      {label}
    </span>
  )
}

function LockBadge({ label }) {
  return (
    <span style={{
      background: '#1a1000', color: AMBER, border: `1px solid ${AMBER}`,
      borderRadius: 4, padding: '2px 8px', fontSize: 11, marginRight: 6,
    }}>
      LOCKED: {label}
    </span>
  )
}

function OverviewPanel() {
  return (
    <>
      <Card title="Inventory Activation Command Center">
        <div style={{ color: TEXT, fontSize: 13, lineHeight: 1.7 }}>
          Phase D.4 builds the inventory activation contract layer for NOVEE OS, POS360, E.A.T.,
          CraftHub, and SmokeCraft. It establishes safe, honest contracts for humidor, bar, kitchen,
          retail, cigar, bottle, food, merchandise, and general supply inventory across all venue types.
        </div>
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <LockBadge label="Live Inventory Sync" />
          <LockBadge label="Vendor Order Submission" />
          <LockBadge label="Auto Reorder" />
          <LockBadge label="External POS Inventory Sync" />
          <StatusBadge label="Inventory Contracts Active" active />
          <StatusBadge label="Mapping Registry Active" active />
          <StatusBadge label="Preview Mode Active" active />
        </div>
      </Card>
      <Card title="Phase D Tracker">
        {[
          ['D.1', 'Provider Activation Roadmap', true],
          ['D.2', 'Payment Provider Activation', true],
          ['D.3', 'External POS Activation', true],
          ['D.4', 'Inventory Activation', true],
          ['D.5', 'Communication Activation', false, true],
          ['D.6', 'Security Activation', false],
          ['D.7', 'Deployment Activation', false],
          ['D.8', 'Live Pilot Readiness', false],
        ].map(([phase, label, done, next]) => (
          <div key={phase} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ color: MUTE, fontSize: 12, width: 30 }}>{phase}</span>
            <span style={{ color: done ? GREEN : next ? GOLD2 : MUTE, fontSize: 13 }}>{label}</span>
            <span style={{ fontSize: 11, color: done ? GREEN : next ? GOLD : MUTE }}>
              {done ? 'COMPLETE' : next ? 'Next' : 'Not Started'}
            </span>
          </div>
        ))}
      </Card>
      <Card title="46 Database Tables">
        <div style={{ color: MUTE, fontSize: 12 }}>
          Migration 058 creates 46 tables covering all inventory areas, locations, storage zones,
          items, par levels, reorder rules, low stock rules, count sessions, adjustments, transfers,
          waste/spoilage, vendor registry, vendor catalogs, order previews, purchase order previews,
          import/export, POS signal mapping, area mappings, COGS profiles, shrinkage profiles,
          alert rules, live sync requests, tenant/module mapping, compliance checklist, risk flags,
          and activation audit.
        </div>
      </Card>
    </>
  )
}

function AreaRegistryPanel() {
  return (
    <Card title="Inventory Area Registry">
      <div style={{ color: MUTE, fontSize: 12, marginBottom: 12 }}>
        20 inventory areas registered. All default to setup_required status.
        Live sync, vendor ordering, auto reorder, and external POS sync all default to false.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
        {[
          'humidor', 'bar', 'kitchen', 'retail', 'general_supplies',
          'menu_ingredients', 'cigar_inventory', 'bottle_inventory', 'food_inventory',
          'merchandise_inventory', 'vendor_catalogs', 'reorder_rules', 'low_stock_alerts',
          'count_sessions', 'waste_spoilage', 'transfers', 'adjustments', 'import_export',
          'external_pos_inventory_signals', 'readiness_summary',
        ].map(k => (
          <div key={k} style={{ background: LINE, borderRadius: 6, padding: '8px 10px' }}>
            <div style={{ color: TEXT, fontSize: 11 }}>{k}</div>
            <div style={{ color: AMBER, fontSize: 10, marginTop: 2 }}>setup_required</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ color: MUTE, fontSize: 11 }}>API: GET /api/phase-d/inventory-activation/areas</div>
        <div style={{ color: MUTE, fontSize: 11 }}>API: PATCH /api/phase-d/inventory-activation/areas/:areaKey/status (requires canAccessPOS3)</div>
      </div>
    </Card>
  )
}

function AreaStatusPanel() {
  return (
    <Card title="Area Status Contracts">
      <div style={{ color: MUTE, fontSize: 12, marginBottom: 12 }}>
        All areas default to setup_required or not_started. Live sync defaults false.
        Status must be updated through honest activation steps only.
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {[
          'not_started', 'setup_required', 'mapping_required', 'count_required',
          'import_required', 'import_ready', 'import_tested', 'manual_tracking_ready',
          'companion_mode_ready', 'reorder_rule_ready', 'low_stock_rule_ready',
          'vendor_profile_required', 'vendor_profile_ready', 'vendor_order_preview_ready',
          'vendor_order_approval_required', 'live_sync_locked', 'live_sync_requested',
          'live_sync_approved', 'live_sync_enabled', 'disabled', 'blocked', 'failed',
        ].map(s => (
          <span key={s} style={{ background: LINE, color: MUTE, borderRadius: 4, padding: '3px 8px', fontSize: 11 }}>{s}</span>
        ))}
      </div>
    </Card>
  )
}

function InventoryAreaPanel({ areaKey, areaLabel }) {
  return (
    <Card title={areaLabel}>
      <div style={{ color: MUTE, fontSize: 12, marginBottom: 8 }}>
        Area: <span style={{ color: TEXT }}>{areaKey}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          ['Status', 'setup_required', AMBER],
          ['Live Sync', 'LOCKED', RED],
          ['Vendor Ordering', 'LOCKED', RED],
          ['External POS Sync', 'LOCKED', RED],
          ['Auto Reorder', 'LOCKED', RED],
          ['Import Ready', 'Not Configured', MUTE],
        ].map(([label, value, color]) => (
          <div key={label} style={{ background: LINE, borderRadius: 6, padding: '8px 10px' }}>
            <div style={{ color: MUTE, fontSize: 10 }}>{label}</div>
            <div style={{ color: color, fontSize: 12, fontWeight: 600, marginTop: 2 }}>{value}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function LocationsPanel() {
  return (
    <Card title="Inventory Locations">
      <div style={{ color: MUTE, fontSize: 12, marginBottom: 8 }}>
        Location registry for all venue storage areas. No secrets stored.
      </div>
      <div style={{ color: MUTE, fontSize: 11 }}>API: GET/POST /api/phase-d/inventory-activation/locations</div>
      <div style={{ color: MUTE, fontSize: 11 }}>API: PATCH /api/phase-d/inventory-activation/locations/:locationId (requires canAccessPOS3)</div>
    </Card>
  )
}

function StorageZonesPanel() {
  return (
    <Card title="Storage Zones">
      <div style={{ color: MUTE, fontSize: 12, marginBottom: 8 }}>
        Storage zones within locations (humidor, walk-in, bar, kitchen, retail floor, cellar, freezer, cooler, dry storage).
      </div>
      <div style={{ color: MUTE, fontSize: 11 }}>API: GET/POST /api/phase-d/inventory-activation/storage-zones</div>
    </Card>
  )
}

function ItemRegistryPanel() {
  return (
    <Card title="Item Registry">
      <div style={{ color: MUTE, fontSize: 12, marginBottom: 8 }}>
        All inventory items tracked by area_key, category, unit, SKU, and barcode.
        Items are not synced to external systems in Phase D.4.
      </div>
      <div style={{ color: MUTE, fontSize: 11 }}>API: GET/POST /api/phase-d/inventory-activation/items</div>
    </Card>
  )
}

function SimpleListPanel({ title, endpoint, description }) {
  return (
    <Card title={title}>
      <div style={{ color: MUTE, fontSize: 12, marginBottom: 8 }}>{description}</div>
      <div style={{ color: MUTE, fontSize: 11 }}>API: GET/POST /api/phase-d/inventory-activation/{endpoint}</div>
      <div style={{ color: MUTE, fontSize: 11 }}>Write routes require canAccessPOS3.</div>
    </Card>
  )
}

function VendorOrderPreviewPanel() {
  return (
    <Card title="Vendor Order Previews">
      <div style={{ background: '#1a1000', border: `1px solid ${AMBER}`, borderRadius: 6, padding: 10, marginBottom: 10 }}>
        <div style={{ color: AMBER, fontSize: 12, fontWeight: 700 }}>
          VENDOR ORDERS ARE PREVIEWS ONLY
        </div>
        <div style={{ color: TEXT, fontSize: 11, marginTop: 4 }}>
          No real purchase orders are submitted. No real vendor emails are sent.
          All vendor order records have is_real_order=false and order_submitted=false.
          A separate approval gate is required before any real order could be submitted in a future phase.
        </div>
      </div>
      <div style={{ color: MUTE, fontSize: 11 }}>API: GET/POST /api/phase-d/inventory-activation/vendor-order-previews</div>
      <div style={{ color: MUTE, fontSize: 11 }}>API: GET/POST /api/phase-d/inventory-activation/vendor-order-approvals</div>
    </Card>
  )
}

function PurchaseOrderPreviewPanel() {
  return (
    <Card title="Purchase Order Previews">
      <div style={{ background: '#1a1000', border: `1px solid ${AMBER}`, borderRadius: 6, padding: 10, marginBottom: 10 }}>
        <div style={{ color: AMBER, fontSize: 12, fontWeight: 700 }}>
          PURCHASE ORDERS ARE PREVIEWS ONLY
        </div>
        <div style={{ color: TEXT, fontSize: 11, marginTop: 4 }}>
          is_real_po=false. po_submitted=false. No real purchase order is created or transmitted in Phase D.4.
        </div>
      </div>
      <div style={{ color: MUTE, fontSize: 11 }}>API: GET/POST /api/phase-d/inventory-activation/purchase-order-previews</div>
    </Card>
  )
}

function COGSProfilesPanel() {
  return (
    <Card title="COGS Profiles">
      <div style={{ background: '#1a1000', border: `1px solid ${AMBER}`, borderRadius: 6, padding: 10, marginBottom: 10 }}>
        <div style={{ color: AMBER, fontSize: 12, fontWeight: 700 }}>
          COGS DEPENDS ON REAL COST AND SALES DATA
        </div>
        <div style={{ color: TEXT, fontSize: 11, marginTop: 4 }}>
          COGS is not calculated without real imported cost data and real sales data.
          cogs_calculated defaults false. Profiles record data source configuration only
          until actual data is imported or entered.
        </div>
      </div>
      <div style={{ color: MUTE, fontSize: 11 }}>API: GET/POST /api/phase-d/inventory-activation/cogs-profiles</div>
    </Card>
  )
}

function AlertPreviewsPanel() {
  return (
    <Card title="Alert Previews">
      <div style={{ background: '#1a1000', border: `1px solid ${AMBER}`, borderRadius: 6, padding: 10, marginBottom: 10 }}>
        <div style={{ color: AMBER, fontSize: 12, fontWeight: 700 }}>
          LOW-STOCK ALERTS REQUIRE REAL INVENTORY DATA
        </div>
        <div style={{ color: TEXT, fontSize: 11, marginTop: 4 }}>
          Alert previews are rule-based records only. is_real_alert=false.
          Real low-stock alerts require actual count sessions or imported inventory data.
        </div>
      </div>
      <div style={{ color: MUTE, fontSize: 11 }}>API: GET/POST /api/phase-d/inventory-activation/alert-rules</div>
      <div style={{ color: MUTE, fontSize: 11 }}>API: GET/POST /api/phase-d/inventory-activation/alert-previews</div>
    </Card>
  )
}

function ExternalPOSSignalsPanel() {
  return (
    <Card title="External POS Inventory Signals">
      <div style={{ background: '#1a1000', border: `1px solid ${AMBER}`, borderRadius: 6, padding: 10, marginBottom: 10 }}>
        <div style={{ color: AMBER, fontSize: 12, fontWeight: 700 }}>
          POS INVENTORY SIGNALS ARE MAPPING RECORDS ONLY
        </div>
        <div style={{ color: TEXT, fontSize: 11, marginTop: 4 }}>
          External POS inventory signals are mapping configuration records, not live sync.
          live_sync_enabled=false on all records. External POS inventory sync is not active in Phase D.4.
        </div>
      </div>
      <div style={{ color: MUTE, fontSize: 11 }}>API: GET/POST /api/phase-d/inventory-activation/external-pos-signal-mappings</div>
    </Card>
  )
}

function LiveSyncLockPanel() {
  return (
    <Card title="Live Sync Lock">
      <div style={{ background: '#0a0a1a', border: `1px solid ${RED}`, borderRadius: 6, padding: 12, marginBottom: 10 }}>
        <div style={{ color: RED, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
          LIVE INVENTORY SYNC IS LOCKED
        </div>
        <div style={{ color: TEXT, fontSize: 12 }}>
          All live sync requests are gated. approveLiveSyncRequestPreviewOnly does NOT enable live sync.
          Live sync requires: completed D.4 contracts, admin approval, environment lock release,
          and verified external integrations. None of these are active in Phase D.4.
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
        {[
          ['live_sync_processing_enabled', false],
          ['external_pos_sync_processing_enabled', false],
          ['auto_reorder_processing_enabled', false],
          ['vendor_order_submission_enabled', false],
          ['real_vendor_email_enabled', false],
          ['real_purchase_order_enabled', false],
        ].map(([flag, val]) => (
          <div key={flag} style={{ background: LINE, borderRadius: 6, padding: '6px 10px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: MUTE, fontSize: 10 }}>{flag}</span>
            <span style={{ color: val ? GREEN : RED, fontSize: 10, fontWeight: 700 }}>{String(val).toUpperCase()}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10 }}>
        <div style={{ color: MUTE, fontSize: 11 }}>API: GET /api/phase-d/inventory-activation/live-sync-lock/:areaKey</div>
        <div style={{ color: MUTE, fontSize: 11 }}>API: GET/POST /api/phase-d/inventory-activation/live-sync-requests</div>
        <div style={{ color: MUTE, fontSize: 11 }}>API: POST /api/phase-d/inventory-activation/live-sync-requests/:id/approve-preview</div>
      </div>
    </Card>
  )
}

function ReadinessSummaryPanel() {
  return (
    <>
      <Card title="Inventory Readiness Summary">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            ['inventory_sync_live', false],
            ['vendor_ordering_live', false],
            ['auto_reorder_live', false],
            ['external_pos_inventory_sync_live', false],
            ['no_secret_storage', true],
            ['no_fake_sync_claim', true],
            ['no_fake_vendor_order_claim', true],
            ['no_fake_count_claim', true],
            ['environment_locks_active', true],
            ['live_sync_locked', true],
            ['cogs_requires_real_data', true],
            ['low_stock_alerts_require_real_count', true],
          ].map(([k, v]) => (
            <div key={k} style={{ background: LINE, borderRadius: 6, padding: '6px 10px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: MUTE, fontSize: 10 }}>{k}</span>
              <span style={{ color: v ? GREEN : RED, fontSize: 10, fontWeight: 700 }}>{String(v).toUpperCase()}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Phase D Tracker">
        {[
          ['D.1', 'Provider Activation Roadmap', true],
          ['D.2', 'Payment Provider Activation', true],
          ['D.3', 'External POS Activation', true],
          ['D.4', 'Inventory Activation', true],
          ['D.5', 'Communication Activation', false, true],
          ['D.6', 'Security Activation', false],
          ['D.7', 'Deployment Activation', false],
          ['D.8', 'Live Pilot Readiness', false],
        ].map(([phase, label, done, next]) => (
          <div key={phase} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ color: MUTE, fontSize: 12, width: 30 }}>{phase}</span>
            <span style={{ color: done ? GREEN : next ? GOLD2 : MUTE, fontSize: 13 }}>{label}</span>
            <span style={{ fontSize: 11, color: done ? GREEN : next ? GOLD : MUTE }}>
              {done ? 'COMPLETE' : next ? 'Next' : 'Not Started'}
            </span>
          </div>
        ))}
      </Card>
    </>
  )
}

function PhaseDInventoryActivationShell() {
  const [active, setActive] = useState('Overview')

  function renderPanel() {
    switch (active) {
      case 'Overview': return <OverviewPanel />
      case 'Area Registry': return <AreaRegistryPanel />
      case 'Area Status': return <AreaStatusPanel />
      case 'Humidor Inventory': return <InventoryAreaPanel areaKey="humidor" areaLabel="Humidor Inventory" />
      case 'Bar Inventory': return <InventoryAreaPanel areaKey="bar" areaLabel="Bar Inventory" />
      case 'Kitchen Inventory': return <InventoryAreaPanel areaKey="kitchen" areaLabel="Kitchen Inventory" />
      case 'Retail Inventory': return <InventoryAreaPanel areaKey="retail" areaLabel="Retail Inventory" />
      case 'General Supplies': return <InventoryAreaPanel areaKey="general_supplies" areaLabel="General Supplies" />
      case 'Menu Ingredients': return <InventoryAreaPanel areaKey="menu_ingredients" areaLabel="Menu Ingredients" />
      case 'Cigar Inventory': return <InventoryAreaPanel areaKey="cigar_inventory" areaLabel="Cigar Inventory" />
      case 'Bottle Inventory': return <InventoryAreaPanel areaKey="bottle_inventory" areaLabel="Bottle Inventory" />
      case 'Food Inventory': return <InventoryAreaPanel areaKey="food_inventory" areaLabel="Food Inventory" />
      case 'Merchandise Inventory': return <InventoryAreaPanel areaKey="merchandise_inventory" areaLabel="Merchandise Inventory" />
      case 'Locations': return <LocationsPanel />
      case 'Storage Zones': return <StorageZonesPanel />
      case 'Item Registry': return <ItemRegistryPanel />
      case 'Item Categories': return <SimpleListPanel title="Item Categories" endpoint="item-categories" description="Category registry per inventory area." />
      case 'Item Variants': return <SimpleListPanel title="Item Variants" endpoint="item-variants" description="Variant registry per inventory item." />
      case 'Unit Registry': return <SimpleListPanel title="Unit Registry" endpoint="units" description="Units of measure (count, weight, volume, custom)." />
      case 'Par Level Profiles': return <SimpleListPanel title="Par Level Profiles" endpoint="par-levels" description="Par quantity thresholds per item per location." />
      case 'Reorder Rules': return (
        <Card title="Reorder Rules">
          <div style={{ background: '#1a1000', border: `1px solid ${AMBER}`, borderRadius: 6, padding: 10, marginBottom: 10 }}>
            <div style={{ color: AMBER, fontSize: 12, fontWeight: 700 }}>REORDER RULES DO NOT SUBMIT REAL ORDERS</div>
            <div style={{ color: TEXT, fontSize: 11, marginTop: 4 }}>
              auto_reorder_enabled=false. vendor_order_enabled=false. real_order_submission=false.
              Reorder rules define thresholds and quantities only. No vendor orders are triggered automatically.
            </div>
          </div>
          <div style={{ color: MUTE, fontSize: 11 }}>API: GET/POST /api/phase-d/inventory-activation/reorder-rules</div>
        </Card>
      )
      case 'Low Stock Rules': return <SimpleListPanel title="Low Stock Rules" endpoint="low-stock-rules" description="Low stock threshold rules. alert_preview_only=true. requires_real_count=true." />
      case 'Count Sessions': return <SimpleListPanel title="Count Sessions" endpoint="count-sessions" description="Count session records. is_real_count requires actual count_date. Counts are records only without real count input." />
      case 'Count Session Items': return <SimpleListPanel title="Count Session Items" endpoint="count-session-items" description="Individual items within a count session." />
      case 'Adjustments': return <SimpleListPanel title="Adjustments" endpoint="adjustments" description="Manual adjustment records with reason, quantity delta, and actor." />
      case 'Transfers': return <SimpleListPanel title="Transfers" endpoint="transfers" description="Transfer records between locations and zones." />
      case 'Waste / Spoilage': return <SimpleListPanel title="Waste / Spoilage" endpoint="waste-spoilage" description="Waste and spoilage records by area, item, type, and reason." />
      case 'Vendor Registry': return <SimpleListPanel title="Vendor Registry" endpoint="vendors" description="Vendor profiles. No secrets stored. contains_secrets=false, stores_secrets=false on all records." />
      case 'Vendor Catalog Profiles': return <SimpleListPanel title="Vendor Catalog Profiles" endpoint="vendor-catalog-profiles" description="Vendor catalog profile records by area." />
      case 'Vendor Catalog Items': return <SimpleListPanel title="Vendor Catalog Items" endpoint="vendor-catalog-items" description="Individual items within vendor catalogs with pricing and minimum order qty." />
      case 'Vendor Order Preview': return <VendorOrderPreviewPanel />
      case 'Vendor Order Approval': return <SimpleListPanel title="Vendor Order Approval" endpoint="vendor-order-approvals" description="Approval request records for vendor order previews. real_order_gated=true on all records." />
      case 'Purchase Order Preview': return <PurchaseOrderPreviewPanel />
      case 'Import Profiles': return <SimpleListPanel title="Import Profiles" endpoint="import-profiles" description="Import profile configuration for CSV, XLSX, JSON, XML, and POS export formats." />
      case 'Import Templates': return <SimpleListPanel title="Import Templates" endpoint="import-templates" description="Import column map templates per area and format." />
      case 'Import Batches': return <SimpleListPanel title="Import Batches" endpoint="import-batches" description="Import batch records with status and error tracking." />
      case 'Export Profiles': return <SimpleListPanel title="Export Profiles" endpoint="export-profiles" description="Export profile configuration per area and format." />
      case 'External POS Inventory Signals': return <ExternalPOSSignalsPanel />
      case 'Humidor Mapping': return <SimpleListPanel title="Humidor Mapping" endpoint="humidor-mappings" description="Humidor-specific item mapping (vitola, brand, strength, humidity, temperature)." />
      case 'Bar Mapping': return <SimpleListPanel title="Bar Mapping" endpoint="bar-mappings" description="Bar-specific bottle mapping (category, brand, size, spirit type)." />
      case 'Kitchen Mapping': return <SimpleListPanel title="Kitchen Mapping" endpoint="kitchen-mappings" description="Kitchen item mapping (food category, allergens, storage type)." />
      case 'Retail Mapping': return <SimpleListPanel title="Retail Mapping" endpoint="retail-mappings" description="Retail item mapping (category, display location)." />
      case 'Menu Ingredient Mapping': return <SimpleListPanel title="Menu Ingredient Mapping" endpoint="menu-ingredient-mappings" description="Menu item to ingredient quantity mapping." />
      case 'Recipe Mapping': return <SimpleListPanel title="Recipe Mapping" endpoint="recipe-mappings" description="Recipe definition with ingredient list and yield quantity." />
      case 'COGS Profiles': return <COGSProfilesPanel />
      case 'Shrinkage Profiles': return <SimpleListPanel title="Shrinkage Profiles" endpoint="shrinkage-profiles" description="Shrinkage and loss tracking profiles by area and period." />
      case 'Alert Rules': return <SimpleListPanel title="Alert Rules" endpoint="alert-rules" description="Alert rule definitions. alert_preview_only=true. requires_real_data=true." />
      case 'Alert Previews': return <AlertPreviewsPanel />
      case 'Live Sync Lock': return <LiveSyncLockPanel />
      case 'Tenant Mapping': return <SimpleListPanel title="Tenant Mapping" endpoint="tenant-mapping" description="Tenant-to-area inventory mapping configuration." />
      case 'Module Mapping': return <SimpleListPanel title="Module Mapping" endpoint="module-mapping" description="Module-to-area inventory mapping (POS360, E.A.T., CraftHub, SmokeCraft)." />
      case 'Compliance Checklist': return <SimpleListPanel title="Compliance Checklist" endpoint="compliance-checklist" description="Inventory compliance checklist items per area." />
      case 'Risk Flags': return <SimpleListPanel title="Risk Flags" endpoint="risk-flags" description="Inventory risk flag records with severity and resolution tracking." />
      case 'Activation Audit': return <SimpleListPanel title="Activation Audit" endpoint="audit" description="Full audit trail for all inventory activation events. contains_secrets=false on all records." />
      case 'Inventory Readiness Summary': return <ReadinessSummaryPanel />
      default: return <Card title={active}><div style={{ color: MUTE, fontSize: 13 }}>Panel: {active}</div></Card>
    }
  }

  return (
    <div style={{ background: NAVY, minHeight: '100vh', padding: 24, fontFamily: 'monospace' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ color: GOLD, fontWeight: 700, fontSize: 18 }}>Phase D.4 — Inventory Activation</div>
          <div style={{ color: MUTE, fontSize: 12 }} dangerouslySetInnerHTML={{ __html: DEVICE_LINE }} />
        </div>
        <SafetyBanner />
        <TabBar panels={PANELS} active={active} onSelect={setActive} />
        {renderPanel()}
      </div>
    </div>
  )
}

function PhaseDInventoryActivation() {
  return <PhaseDInventoryActivationShell />
}

export default PhaseDInventoryActivation
