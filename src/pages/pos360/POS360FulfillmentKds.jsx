import React, { useState } from 'react';

const DARK_BG = '#080604';
const GOLD = '#c9952c';
const DARK_CARD = '#13110d';
const DARK_LINE = '#2a2520';
const DARK_TEXT = '#f0ead8';
const DARK_MUTE = '#8a7e6a';
const RED = '#c0392b';
const GREEN = '#27ae60';
const BLUE = '#2980b9';
const AMBER = '#e67e22';

const TABS = [
  'Dashboard',
  'Station Profiles',
  'Station Capabilities',
  'Item Routing Rules',
  'Production Tickets',
  'Ticket Items',
  'Kitchen Queue',
  'Bar Queue',
  'Humidor Queue',
  'Expo Queue',
  'Pickup Queue',
  'KDS Queue',
  'Course Fire Controls',
  'Station Assignments',
  'Production Handoff',
  'Item Unavailable',
  'Manager Override',
  'Refire',
  'Rush / Delay',
  'Guest Self-Order Handoff',
  'Server Order Handoff',
  'Humidor Fulfillment',
  'Bar Fulfillment',
  'Kitchen Fulfillment',
  'External KDS',
  'Production Visibility',
  'E.A.T. Visibility',
  'SmokeCraft Visibility',
  'Offline Queue',
  'Honest States',
  'Data Protection',
];

function Badge({ label, color }) {
  return (
    <span style={{ background: DARK_LINE, color: color || DARK_MUTE, fontSize: 11, padding: '2px 8px', borderRadius: 4, marginRight: 4, marginBottom: 4, display: 'inline-block' }}>
      {label}
    </span>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 15, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

function Empty({ msg }) {
  return <div style={{ color: DARK_MUTE, padding: '20px 0', textAlign: 'center', fontSize: 13 }}>{msg}</div>;
}

function FulfillmentDashboard() {
  return (
    <div>
      <Card title="Production Operations Summary">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
          {['Kitchen Queue', 'Bar Queue', 'Humidor Queue', 'Expo Queue', 'Pickup Queue', 'Active Tickets', 'Open Refires', 'Pending Overrides'].map(label => (
            <div key={label} style={{ background: '#1a1510', borderRadius: 6, padding: '12px 16px', border: `1px solid ${DARK_LINE}` }}>
              <div style={{ color: DARK_MUTE, fontSize: 11, marginBottom: 4 }}>{label}</div>
              <div style={{ color: DARK_TEXT, fontSize: 20, fontWeight: 700 }}>—</div>
              <div style={{ color: DARK_MUTE, fontSize: 10 }}>No data yet</div>
            </div>
          ))}
        </div>
        <Badge label="generated_from_real_order: false" />
        <Badge label="external_sync_completed: false" />
        <Badge label="contains_ai_generated_content: false" />
        <Badge label="kds_connected: false" />
        <Badge label="printer_connected: false" />
      </Card>
      <Card title="Order Sources Supported">
        <div style={{ color: DARK_MUTE, fontSize: 13, lineHeight: 1.7 }}>
          Server-entered orders · Guest self-order handoff placeholder · External POS placeholder · Manual entry · Private event orders · SmokeCraft session handoff
        </div>
        <div style={{ color: AMBER, fontSize: 12, marginTop: 8 }}>
          No fake order completion. No fake payment status. Honest placeholder states until real orders connect.
        </div>
      </Card>
      <Card title="Station Types Active">
        <div style={{ color: DARK_MUTE, fontSize: 13 }}>
          Kitchen · Bar · Humidor · Expo · Patio · Pickup · Delivery placeholder · Server station · Custom
        </div>
      </Card>
    </div>
  );
}

function StationProfilesPanel() {
  return (
    <Card title="Production Station Profiles">
      <Badge label="printer_connected: false" />
      <Badge label="kds_connected: false" />
      <Badge label="station_status: draft" />
      <Empty msg="No station profiles configured. printer_connected and kds_connected remain FALSE until external hardware is verified." />
      <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 8 }}>
        Station types: Kitchen · Bar · Humidor · Expo · Patio · Pickup · Delivery placeholder · Server station · Custom
      </div>
    </Card>
  );
}

function StationCapabilitiesPanel() {
  return (
    <Card title="Station Capabilities">
      <Badge label="supported_status: unknown" />
      <Empty msg="No capabilities registered. Supported status remains unknown until explicitly verified." />
      <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 8 }}>
        Capability groups: Food · Beverage · Cigar · Humidor · Expo · Pickup · Patio · Private event · SmokeCraft · Custom
      </div>
    </Card>
  );
}

function ItemRoutingRulesPanel() {
  return (
    <Card title="Item Routing Rules">
      <Empty msg="No routing rules configured. Items route to stations based on category, item tag, modifier, course, prep area, service area, table section, order type, or fulfillment priority." />
      <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 8 }}>
        Rule types: Category · Item tag · Modifier · Course · Prep area · Service area · Table section · Private event · Order type · Fulfillment priority · Custom
      </div>
    </Card>
  );
}

function ProductionTicketsPanel() {
  return (
    <Card title="Production Tickets">
      <Badge label="ticket_status: received_placeholder" />
      <Badge label="generated_from_real_order: false" />
      <Badge label="external_sync_completed: false" />
      <Empty msg="No production tickets. Tickets are created from server orders, guest self-orders, private events, or SmokeCraft sessions. generated_from_real_order: false until a verified order source connects." />
      <div style={{ color: AMBER, fontSize: 12, marginTop: 8 }}>
        Lifecycle: received_placeholder → routed → preparing → ready → served | cancelled | failed | unavailable
      </div>
    </Card>
  );
}

function ProductionTicketItemsPanel() {
  return (
    <Card title="Production Ticket Items">
      <Badge label="item_status: new" />
      <Badge label="inventory_deducted: false" />
      <Empty msg="No ticket items. inventory_deducted remains FALSE — no fake inventory deduction." />
      <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 8 }}>
        Item lifecycle: new → routed → acknowledged → preparing → ready → held → fired → served | cancelled | voided_external | unavailable
      </div>
    </Card>
  );
}

function KitchenQueuePanel() {
  return (
    <Card title="Kitchen Queue">
      <Badge label="queue_type: kitchen" />
      <Badge label="queue_status: queued" />
      <Badge label="inventory_deducted: false" />
      <Empty msg="No kitchen queue items. No fake food inventory deduction unless real inventory connection exists." />
      <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 8 }}>
        Supports: Prep station queue · Cook station queue · Allergy notes · Modifier visibility · Expo handoff
      </div>
    </Card>
  );
}

function BarQueuePanel() {
  return (
    <Card title="Bar Queue">
      <Badge label="queue_type: bar" />
      <Badge label="queue_status: queued" />
      <Badge label="inventory_deducted: false" />
      <Empty msg="No bar queue items. No fake pour inventory deduction unless real inventory connection exists." />
      <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 8 }}>
        Supports: Drink queue · Cocktail station · Wine/spirits · Bottle service · Tab linkage
      </div>
    </Card>
  );
}

function HumidorQueuePanel() {
  return (
    <Card title="Humidor Queue">
      <Badge label="queue_type: humidor" />
      <Badge label="queue_status: queued" />
      <Badge label="inventory_deducted: false" />
      <Empty msg="No humidor queue items. No fake cigar inventory deduction unless real inventory exists." />
      <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 8 }}>
        Supports: Cigar selection · Humidor pick list · Specialist assignment · Pairing recommendation link · SmokeCraft guest link
      </div>
    </Card>
  );
}

function ExpoQueuePanel() {
  return (
    <Card title="Expo Queue">
      <Badge label="queue_type: expo" />
      <Empty msg="No expo queue items." />
      <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 8 }}>Expo coordinates kitchen-to-server handoffs.</div>
    </Card>
  );
}

function PickupQueuePanel() {
  return (
    <Card title="Pickup Queue">
      <Badge label="queue_type: pickup" />
      <Empty msg="No pickup queue items." />
    </Card>
  );
}

function KDSQueuePanel() {
  return (
    <Card title="KDS Queue">
      <Badge label="kds_connected: false" />
      <Badge label="external_sync_completed: false" />
      <div style={{ color: AMBER, fontSize: 12, marginBottom: 10 }}>
        KDS not connected yet — kds_connected: false. No fake KDS provider. External sync not completed.
      </div>
      <Empty msg="No KDS queue records. Queue records are created when orders route to stations." />
      <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 8 }}>
        Priorities: Normal · Rush · Delayed · Hold · Refire
      </div>
    </Card>
  );
}

function CourseFireControlPanel() {
  return (
    <Card title="Course Fire Controls">
      <Empty msg="No course fire controls. Fire controls manage multi-course sequencing: Hold · Fire · Refire · Rush · Delay · Course complete." />
      <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 8 }}>
        Manager approval tracked on protected fire actions.
      </div>
    </Card>
  );
}

function StationStaffAssignmentPanel() {
  return (
    <Card title="Station Staff Assignments">
      <Empty msg="No staff assignments. Staff can be assigned to Kitchen, Bar, Humidor, Expo, Server, and Manager roles per station." />
      <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 8 }}>
        Connects to Phase B.12 staff profiles for role-based routing.
      </div>
    </Card>
  );
}

function ProductionHandoffPanel() {
  return (
    <Card title="Production Handoff Records">
      <Badge label="handoff_status: pending" />
      <Empty msg="No handoff records. Handoffs track: Kitchen→Expo · Bar→Server · Humidor→Server · Expo→Server · Server→Guest · Pickup ready · Private event service." />
    </Card>
  );
}

function ItemUnavailablePanel() {
  return (
    <Card title="Item Unavailable Records">
      <Badge label="inventory_deducted: false" />
      <Empty msg="No unavailable items. Staff can report items as unavailable — manager review required for confirmed_placeholder status." />
    </Card>
  );
}

function ManagerOverridePanel() {
  return (
    <Card title="Manager Overrides">
      <Badge label="override_status: pending_manager_approval" />
      <div style={{ color: AMBER, fontSize: 12, marginBottom: 10 }}>
        Manager approval required for: Cancel item · Void item · Refire · Rush · Delay · Reroute · Unavailable · Station reassignment · Comp item
      </div>
      <Empty msg="No manager overrides. All override requests require manager_approved_by before taking effect." />
    </Card>
  );
}

function RefirePanel() {
  return (
    <Card title="Refire Records">
      <Empty msg="No refire records. Refires are tracked per ticket item and station." />
    </Card>
  );
}

function RushDelayPanel() {
  return (
    <Card title="Rush / Delay Records">
      <Empty msg="No rush or delay records. Actions: Rush · Delay · Hold · Release." />
    </Card>
  );
}

function GuestSelfOrderHandoffPanel() {
  return (
    <Card title="Guest Self-Order Handoff">
      <Badge label="generated_from_real_order: false" />
      <Badge label="external_sync_completed: false" />
      <div style={{ color: AMBER, fontSize: 12, marginBottom: 10 }}>
        No fake guest self-order completion. generated_from_real_order: false until a real guest self-order payment engine connects.
      </div>
      <Empty msg="No guest self-order handoffs." />
    </Card>
  );
}

function ServerOrderHandoffPanel() {
  return (
    <Card title="Server Order Handoff">
      <Badge label="generated_from_real_order: false" />
      <Empty msg="No server order handoffs. Connects to Phase B.9 reservations, tables, private events, and Phase B.10 event packages." />
    </Card>
  );
}

function HumidorFulfillmentPanel() {
  return (
    <Card title="Humidor Fulfillment">
      <Badge label="fulfillment_status: queued" />
      <Badge label="inventory_deducted: false" />
      <Empty msg="No humidor fulfillment records. Connects to SmokeCraft session, pairing recommendation, and guest link. inventory_deducted: false." />
    </Card>
  );
}

function BarFulfillmentPanel() {
  return (
    <Card title="Bar Fulfillment">
      <Badge label="fulfillment_status: queued" />
      <Badge label="inventory_deducted: false" />
      <Empty msg="No bar fulfillment records. inventory_deducted: false — no fake pour inventory deduction." />
    </Card>
  );
}

function KitchenFulfillmentPanel() {
  return (
    <Card title="Kitchen Fulfillment">
      <Badge label="fulfillment_status: queued" />
      <Badge label="inventory_deducted: false" />
      <Empty msg="No kitchen fulfillment records. Allergy notes visible. inventory_deducted: false — no fake food inventory deduction." />
    </Card>
  );
}

function ExternalKdsProviderPanel() {
  return (
    <Card title="External KDS Providers">
      <Badge label="provider_connected: false" />
      <Badge label="kds_connected: false" />
      <Badge label="printer_connected: false" />
      <Badge label="stores_secrets: false" />
      <Badge label="contains_secrets: false" />
      <div style={{ color: AMBER, fontSize: 12, marginBottom: 10 }}>
        No external KDS provider is connected. No printer provider is connected. No secrets stored.
      </div>
      <Empty msg="No external KDS provider profiles. Placeholder contracts for Toast KDS, Square KDS, Oracle Micros, NCR, Clover, and custom KDS systems." />
    </Card>
  );
}

function ProductionVisibilityPanel() {
  return (
    <Card title="Production Visibility Insights">
      <Badge label="contains_ai_generated_content: false" />
      <Empty msg="No visibility insights. Insight types: Station bottleneck · Long prep time · Item unavailable · High refire rate · Late order · Service handoff issue · Humidor delay · Bar delay · Kitchen delay." />
      <div style={{ color: AMBER, fontSize: 12, marginTop: 8 }}>
        No E.A.T. AI automation — contains_ai_generated_content: false on all insight records.
      </div>
    </Card>
  );
}

function EATOperationalVisibilityPanel() {
  return (
    <Card title="E.A.T. Operational Visibility">
      <Badge label="contains_ai_generated_content: false" />
      <div style={{ color: AMBER, fontSize: 12, marginBottom: 10 }}>
        E.A.T. AI not connected — no AI-generated operational insights. Visibility hooks are wired but no automation runs without a live E.A.T. AI connection.
      </div>
      <Empty msg="No E.A.T. operational visibility records. Hooks available for: Station bottlenecks · Long prep time · High refire rate · Late orders · Service handoff problems · Item unavailable patterns." />
    </Card>
  );
}

function SmokeCraftHumidorVisibilityPanel() {
  return (
    <Card title="SmokeCraft Humidor Visibility">
      <div style={{ color: AMBER, fontSize: 12, marginBottom: 10 }}>
        SmokeCraft progression locks, stamp rules, and VISIT_STRUCTURE are NOT modified by this panel.
        Humidor fulfillment connects to SmokeCraft session IDs as link references only.
      </div>
      <Empty msg="No SmokeCraft humidor visibility records. SmokeCraft session links are stored as nullable references — no SmokeCraft data is modified." />
    </Card>
  );
}

function OfflineProductionQueuePanel() {
  return (
    <Card title="Offline Production Queue">
      <Empty msg="No offline queue items pending. Station actions, status updates, route changes, and handoffs are queued here when the database is unavailable." />
      <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 8 }}>
        Offline sync does not claim external_sync_completed: true without verification.
      </div>
    </Card>
  );
}

function FulfillmentLanguageSelector() {
  const langs = ['en-US', 'es-DO', 'es', 'ht', 'de', 'pt'];
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
      {langs.map(l => (
        <button key={l} style={{ background: DARK_LINE, color: DARK_MUTE, border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>{l}</button>
      ))}
    </div>
  );
}

function PrivateDataProtectionPanel() {
  return (
    <Card title="Private Data Protection">
      <Badge label="exposes_private_data: true (flagged on guest/staff/reservation/table records)" />
      <div style={{ color: DARK_MUTE, fontSize: 13, lineHeight: 1.6, marginTop: 8 }}>
        Guest profiles, staff profiles, reservation data, table assignments, private event details, and order sources are flagged as private data. All audit records reflect exposes_private_data where applicable.
      </div>
    </Card>
  );
}

function FinancialDataProtectionPanel() {
  return (
    <Card title="Financial Data Protection">
      <Badge label="exposes_financial_data: true (flagged on payment/comp/void/package records)" />
      <div style={{ color: DARK_MUTE, fontSize: 13, lineHeight: 1.6, marginTop: 8 }}>
        Payment record IDs, comp records, void records, package selection IDs, and order totals are flagged as financial data. Manager override records involving comps or voids carry exposes_financial_data: true.
      </div>
    </Card>
  );
}

function NoSecretsStoredPanel() {
  return (
    <Card title="No Secrets Stored">
      <Badge label="stores_secrets: false" />
      <Badge label="contains_secrets: false" />
      <div style={{ color: DARK_MUTE, fontSize: 13, marginTop: 8 }}>
        No API keys, printer credentials, KDS tokens, or provider secrets are stored in this system. External KDS provider profiles store only metadata references.
      </div>
    </Card>
  );
}

function HonestKdsStatePanel() {
  return (
    <Card title="KDS Connection State">
      <Badge label="kds_connected: false" color={AMBER} />
      <div style={{ color: AMBER, fontSize: 13, marginTop: 8 }}>
        KDS not connected yet. No KDS hardware connection has been verified. KDS queue records are created as placeholder contracts only.
      </div>
    </Card>
  );
}

function HonestPrinterStatePanel() {
  return (
    <Card title="Printer Connection State">
      <Badge label="printer_connected: false" color={AMBER} />
      <div style={{ color: AMBER, fontSize: 13, marginTop: 8 }}>
        Printer not connected yet. No printer hardware has been verified. No fake print jobs are issued.
      </div>
    </Card>
  );
}

function HonestInventoryStatePanel() {
  return (
    <Card title="Inventory Deduction State">
      <Badge label="inventory_deducted: false" color={AMBER} />
      <div style={{ color: AMBER, fontSize: 13, marginTop: 8 }}>
        Inventory not deducted. No kitchen, bar, or humidor fulfillment record deducts inventory unless a real inventory engine confirms it. inventory_deducted remains FALSE.
      </div>
    </Card>
  );
}

function HonestOrderStatePanel() {
  return (
    <Card title="Order Completion State">
      <Badge label="generated_from_real_order: false" color={AMBER} />
      <Badge label="external_sync_completed: false" color={AMBER} />
      <div style={{ color: AMBER, fontSize: 13, marginTop: 8 }}>
        No fake order completion. Production tickets are placeholder contracts until real order sources connect. external_sync_completed: false on all records. Payment status is never faked.
      </div>
    </Card>
  );
}

function HonestAIStatePanel() {
  return (
    <Card title="E.A.T. AI State">
      <Badge label="contains_ai_generated_content: false" color={AMBER} />
      <div style={{ color: AMBER, fontSize: 13, marginTop: 8 }}>
        No E.A.T. AI automation. No AI-generated production insights. contains_ai_generated_content: false on all visibility insight records.
      </div>
    </Card>
  );
}

function HonestEmptyStatePanel() {
  return (
    <Card title="Honest Empty States">
      <div style={{ color: DARK_MUTE, fontSize: 13, lineHeight: 1.7 }}>
        All panels show honest empty states when data is missing. No fake populated order data. No fake KDS connected state. No fake printer connected state. No fake inventory deducted state. No fake order complete state. No fake staff acknowledgement.
      </div>
    </Card>
  );
}

const PANELS = [
  FulfillmentDashboard, StationProfilesPanel, StationCapabilitiesPanel,
  ItemRoutingRulesPanel, ProductionTicketsPanel, ProductionTicketItemsPanel,
  KitchenQueuePanel, BarQueuePanel, HumidorQueuePanel,
  ExpoQueuePanel, PickupQueuePanel, KDSQueuePanel,
  CourseFireControlPanel, StationStaffAssignmentPanel, ProductionHandoffPanel,
  ItemUnavailablePanel, ManagerOverridePanel, RefirePanel, RushDelayPanel,
  GuestSelfOrderHandoffPanel, ServerOrderHandoffPanel,
  HumidorFulfillmentPanel, BarFulfillmentPanel, KitchenFulfillmentPanel,
  ExternalKdsProviderPanel, ProductionVisibilityPanel,
  EATOperationalVisibilityPanel, SmokeCraftHumidorVisibilityPanel,
  OfflineProductionQueuePanel,
  () => (
    <div>
      <HonestKdsStatePanel />
      <HonestPrinterStatePanel />
      <HonestInventoryStatePanel />
      <HonestOrderStatePanel />
      <HonestAIStatePanel />
      <HonestEmptyStatePanel />
    </div>
  ),
  () => (
    <div>
      <FulfillmentLanguageSelector />
      <PrivateDataProtectionPanel />
      <FinancialDataProtectionPanel />
      <NoSecretsStoredPanel />
    </div>
  ),
];

export default function POS360FulfillmentKds() {
  const [activeTab, setActiveTab] = useState(0);
  const Panel = PANELS[activeTab];

  return (
    <div style={{ minHeight: '100vh', background: DARK_BG, color: DARK_TEXT, fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${DARK_LINE}`, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <img src="/smokecraft-pos360.png" alt="POS360" style={{ width: 36, height: 36, objectFit: 'contain' }} />
        <div>
          <div style={{ color: GOLD, fontWeight: 800, fontSize: 18 }}>POS360 — Kitchen, Bar & Humidor Fulfillment · KDS & Production Governance</div>
          <div style={{ color: DARK_MUTE, fontSize: 12 }}>Touchscreen · Handheld · Tablet · Desktop</div>
        </div>
        <img src="/smokecraft-pos360.png" alt="SmokeCraft POS360" style={{ width: 28, height: 28, objectFit: 'contain', marginLeft: 'auto', opacity: 0.6 }} />
      </div>

      {/* Honest state banner */}
      <div style={{ background: '#1a1208', borderBottom: `1px solid ${DARK_LINE}`, padding: '8px 24px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <Badge label="kds_connected: false" />
        <Badge label="printer_connected: false" />
        <Badge label="inventory_deducted: false" />
        <Badge label="generated_from_real_order: false" />
        <Badge label="external_sync_completed: false" />
        <Badge label="contains_ai_generated_content: false" />
        <Badge label="provider_connected: false" />
        <Badge label="stores_secrets: false" />
      </div>

      {/* Tab bar */}
      <div style={{ borderBottom: `1px solid ${DARK_LINE}`, padding: '0 24px', overflowX: 'auto', display: 'flex' }}>
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            style={{
              background: 'none', border: 'none',
              borderBottom: activeTab === i ? `2px solid ${GOLD}` : '2px solid transparent',
              color: activeTab === i ? GOLD : DARK_MUTE,
              padding: '12px 12px', cursor: 'pointer', fontSize: 12,
              fontWeight: activeTab === i ? 700 : 400, whiteSpace: 'nowrap',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div style={{ padding: 24 }}>
        <Panel />
      </div>
    </div>
  );
}
