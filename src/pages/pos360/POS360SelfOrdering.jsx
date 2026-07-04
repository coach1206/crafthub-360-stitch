// POS360 Self-Ordering — Customer Self-Ordering, QR Menus, Handheld POS Flow,
// Table Ordering & Guest Checkout Handoff

import { useState } from 'react';
import { tSelfOrdering, getSupportedSelfOrderingLanguages } from '../../locales/pos360SelfOrdering.js';

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

const DEVICE_LINE = 'Touchscreen · Handheld · Tablet · Desktop';

const TABS = [
  'Dashboard',
  'QR Sessions',
  'Self-Order Carts',
  'Cart Items',
  'Submissions',
  'Handheld Sessions',
  'Handheld Entries',
  'Table Sessions',
  'Checkout Handoffs',
  'QR Code Registry',
  'Menu Snapshots',
  'Age Verification',
  'Modifier Selections',
  'Availability Overrides',
  'SmokeCraft Hooks',
  'E.A.T. Handoffs',
  'Visibility Insights',
  'Operations Summary',
  'Self-Order Offline',
  'Handheld Offline',
  'No Fake Self-Order',
  'No Fake Payment',
  'No Fake KDS',
  'No Fake Inventory',
  'No Fake Age Verify',
  'No Fake E.A.T. AI',
  'No Fake SmokeCraft',
  'No Fake External POS',
  'Private Data',
  'Financial Data',
  'Language Selector',
];

function HonestStatePanel({ label, flag, note, color = RED }) {
  return (
    <div style={{ padding: 24, background: DARK_CARD, borderRadius: 10, border: `1px solid ${DARK_LINE}`, maxWidth: 600 }}>
      <div style={{ color, fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{label}</div>
      <div style={{ color: DARK_MUTE, fontSize: 13, marginBottom: 12 }}>{flag}</div>
      {note && <div style={{ color: DARK_TEXT, fontSize: 13, background: '#1a1610', padding: 10, borderRadius: 6 }}>{note}</div>}
    </div>
  );
}

function SelfOrderDashboard({ locale }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
        {[
          { label: 'Self-Order Carts', val: '—', sub: 'self_order_completed: false' },
          { label: 'Submissions', val: '—', sub: 'kds_accepted: false' },
          { label: 'Payments Captured', val: '—', sub: 'payment_captured: false' },
          { label: 'Inventory Deducted', val: '—', sub: 'inventory_deducted: false' },
          { label: 'Age Verifications', val: '—', sub: 'age_verified: false' },
          { label: 'QR Scans', val: '—', sub: 'external_sync_completed: false' },
        ].map(({ label, val, sub }) => (
          <div key={label} style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 10, padding: 16 }}>
            <div style={{ color: DARK_MUTE, fontSize: 12, marginBottom: 4 }}>{label}</div>
            <div style={{ color: GOLD, fontSize: 26, fontWeight: 700 }}>{val}</div>
            <div style={{ color: DARK_MUTE, fontSize: 11, marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>
      <HonestStatePanel
        label="Self-Ordering — Honest System State"
        flag="self_order_completed=false | payment_captured=false | kds_accepted=false | inventory_deducted=false | age_verified=false"
        note="No self-order is marked complete, no payment is captured, no KDS acceptance is confirmed, no inventory is deducted, no age verification is completed without a real database connection and real transaction data."
        color={AMBER}
      />
    </div>
  );
}

function QrSessionsPanel({ locale }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 16 }}>{tSelfOrdering('qrMenuSessions', locale)}</div>
      <HonestStatePanel
        label="QR Menu Sessions — No Fake Generation"
        flag="generated_from_real_order: false | contains_ai_generated_content: false"
        note="QR sessions are created only when a real table, section, or event context is provided. No sessions are auto-generated or fabricated."
      />
      <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 10, padding: 16 }}>
        <div style={{ color: DARK_MUTE, fontSize: 13 }}>No QR sessions available. Database connection required.</div>
      </div>
    </div>
  );
}

function SelfOrderCartsPanel({ locale }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 16 }}>{tSelfOrdering('selfOrderCarts', locale)}</div>
      <HonestStatePanel
        label="Self-Order Carts — Honest Empty State"
        flag="self_order_completed: false | payment_captured: false | kds_accepted: false | inventory_deducted: false"
        note={tSelfOrdering('honestEmptyState', locale)}
      />
      <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 10, padding: 16 }}>
        <div style={{ color: DARK_MUTE, fontSize: 13 }}>No carts available. Create a cart via POST /api/pos360/self-ordering/carts.</div>
      </div>
    </div>
  );
}

function CartItemsPanel({ locale }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 16 }}>{tSelfOrdering('cartItems', locale)}</div>
      <HonestStatePanel
        label="Cart Items — No Fake Inventory"
        flag="inventory_deducted: false | kds_accepted: false | age_verified: false"
        note="Cart items are stored as-requested. Inventory is not deducted, KDS is not notified, and age verification is not marked complete without a real workflow."
      />
    </div>
  );
}

function SubmissionsPanel({ locale }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 16 }}>{tSelfOrdering('selfOrderSubmissions', locale)}</div>
      <HonestStatePanel
        label="Order Submissions — No Fake Completion"
        flag="staff_acknowledged: false | kds_accepted: false | self_order_completed: false | payment_captured: false"
        note={tSelfOrdering('noFakeSelfOrder', locale)}
      />
      <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 10, padding: 16 }}>
        <div style={{ color: DARK_MUTE, fontSize: 13 }}>No submissions available.</div>
      </div>
    </div>
  );
}

function HandheldSessionsPanel({ locale }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 16 }}>{tSelfOrdering('handheldPosSessions', locale)}</div>
      <HonestStatePanel
        label="Handheld POS Sessions — No Fake Printer/KDS"
        flag="printer_connected: false | kds_connected: false | external_sync_completed: false"
        note="Handheld sessions track which staff member and device is active. No printer or KDS connection is reported without real hardware."
        color={AMBER}
      />
    </div>
  );
}

function HandheldEntriesPanel({ locale }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 16 }}>{tSelfOrdering('handheldOrderEntries', locale)}</div>
      <HonestStatePanel
        label="Handheld Order Entries — No Fake KDS/Printer"
        flag="kds_sent: false | kds_accepted: false | printer_sent: false | printer_connected: false | inventory_deducted: false"
        note="Orders entered via handheld are recorded. KDS transmission and printer status remain false until real hardware confirms."
      />
    </div>
  );
}

function TableSessionsPanel({ locale }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 16 }}>{tSelfOrdering('tableOrderingSessions', locale)}</div>
      <HonestStatePanel
        label="Table Ordering Sessions — Honest State"
        flag="kds_connected: false | printer_connected: false | inventory_deducted: false | external_sync_completed: false"
        note="Table sessions record cover count and ordering state. No external POS sync or KDS confirmation is fabricated."
        color={BLUE}
      />
    </div>
  );
}

function CheckoutHandoffsPanel({ locale }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 16 }}>{tSelfOrdering('guestCheckoutHandoffs', locale)}</div>
      <HonestStatePanel
        label="Guest Checkout Handoffs — No Fake Payment"
        flag="payment_captured: false | checkout_completed: false | external_sync_completed: false"
        note={tSelfOrdering('noFakePayment', locale)}
      />
    </div>
  );
}

function QrCodeRegistryPanel({ locale }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 16 }}>{tSelfOrdering('qrCodeRegistry', locale)}</div>
      <HonestStatePanel
        label="QR Code Registry — No Secrets"
        flag="contains_secrets: false | stores_secrets: false"
        note="QR code tokens are non-secret venue routing tokens. No credentials or PII are embedded in QR codes."
        color={GREEN}
      />
    </div>
  );
}

function MenuSnapshotsPanel({ locale }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 16 }}>{tSelfOrdering('menuAvailabilitySnapshots', locale)}</div>
      <HonestStatePanel
        label="Menu Availability Snapshots — No Fake Availability"
        flag="inventory_deducted: false | external_sync_completed: false | contains_ai_generated_content: false"
        note={tSelfOrdering('noFakeMenuAvailability', locale)}
      />
    </div>
  );
}

function AgeVerificationPanel({ locale }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 16 }}>{tSelfOrdering('ageVerification', locale)}</div>
      <div style={{ background: DARK_CARD, border: `1px solid ${AMBER}33`, borderRadius: 10, padding: 16, marginBottom: 8 }}>
        <div style={{ color: AMBER, fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Age Gating — Alcohol & Cigar Items</div>
        <div style={{ color: DARK_TEXT, fontSize: 13 }}>{tSelfOrdering('ageGating', locale)}</div>
      </div>
      <HonestStatePanel
        label="Age Verification — No Fake Verification"
        flag="age_verified: false"
        note={tSelfOrdering('noFakeAgeVerify', locale)}
        color={RED}
      />
    </div>
  );
}

function ModifierSelectionsPanel({ locale }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 16 }}>{tSelfOrdering('modifierSelections', locale)}</div>
      <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 10, padding: 16 }}>
        <div style={{ color: DARK_MUTE, fontSize: 13 }}>Modifier selections are stored per cart item. Price adjustments are recorded as-submitted.</div>
      </div>
    </div>
  );
}

function AvailabilityOverridesPanel({ locale }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 16 }}>{tSelfOrdering('menuAvailabilityOverrides', locale)}</div>
      <HonestStatePanel
        label="Availability Overrides — No Fake Inventory"
        flag="external_sync_completed: false"
        note="86'd and sold-out overrides are recorded. No inventory system is updated automatically — external_sync_completed remains false."
        color={AMBER}
      />
    </div>
  );
}

function SmokecraftHooksPanel({ locale }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 16 }}>{tSelfOrdering('smokecraftHooks', locale)}</div>
      <HonestStatePanel
        label="SmokeCraft Self-Order Hooks — No Fake Sync"
        flag="smokecraft_sync_completed: false | inventory_deducted: false | kds_accepted: false | contains_ai_generated_content: false"
        note={tSelfOrdering('noFakeSmokecraft', locale)}
      />
    </div>
  );
}

function EatHandoffsPanel({ locale }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 16 }}>{tSelfOrdering('eatHandoffs', locale)}</div>
      <HonestStatePanel
        label="E.A.T. Self-Order Handoffs — No Fake Sync / No Fake AI"
        flag="external_sync_completed: false | kds_accepted: false | inventory_deducted: false | contains_ai_generated_content: false"
        note={tSelfOrdering('noFakeEatAi', locale)}
      />
    </div>
  );
}

function VisibilityInsightsPanel({ locale }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 16 }}>{tSelfOrdering('visibilityInsights', locale)}</div>
      <HonestStatePanel
        label="Visibility Insights — No Fake AI"
        flag="contains_ai_generated_content: false | external_sync_completed: false"
        note="Cart abandonment, popular items, and QR scan rate insights are derived from real recorded data only. No AI-generated summaries."
        color={BLUE}
      />
    </div>
  );
}

function OperationsSummaryPanel({ locale }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 16 }}>Operations Summary</div>
      <HonestStatePanel
        label="Operations Summary — Requires Database"
        flag="self_order_completed=false | payment_captured=false | kds_accepted=false | inventory_deducted=false"
        note="Operations summary is available via GET /api/pos360/self-ordering/operations-summary. Returns honest counts — no numbers are fabricated."
        color={AMBER}
      />
    </div>
  );
}

function SelfOrderOfflinePanel({ locale }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 16 }}>Self-Order Offline Queue</div>
      <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 10, padding: 16 }}>
        <div style={{ color: AMBER, fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Offline Queue Active</div>
        <div style={{ color: DARK_TEXT, fontSize: 13 }}>{tSelfOrdering('offlineFallback', locale)}</div>
        <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 8 }}>contains_secrets: false | stores_secrets: false | exposes_private_data: false</div>
      </div>
    </div>
  );
}

function HandheldOfflinePanel({ locale }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 16 }}>Handheld Offline Queue</div>
      <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 10, padding: 16 }}>
        <div style={{ color: AMBER, fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Handheld Offline Queue</div>
        <div style={{ color: DARK_TEXT, fontSize: 13 }}>{tSelfOrdering('offlineFallback', locale)}</div>
        <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 8 }}>contains_secrets: false | stores_secrets: false</div>
      </div>
    </div>
  );
}

function NoFakeSelfOrderPanel({ locale }) {
  return <HonestStatePanel label="No Fake Self-Order Completion" flag="self_order_completed: false" note={tSelfOrdering('noFakeSelfOrder', locale)} />;
}
function NoFakePaymentPanel({ locale }) {
  return <HonestStatePanel label="No Fake Payment" flag="payment_captured: false" note={tSelfOrdering('noFakePayment', locale)} />;
}
function NoFakeKdsPanel({ locale }) {
  return <HonestStatePanel label="No Fake KDS Acceptance" flag="kds_accepted: false" note={tSelfOrdering('noFakeKds', locale)} />;
}
function NoFakeInventoryPanel({ locale }) {
  return <HonestStatePanel label="No Fake Inventory Deduction" flag="inventory_deducted: false" note={tSelfOrdering('noFakeInventory', locale)} />;
}
function NoFakeAgeVerifyPanel({ locale }) {
  return <HonestStatePanel label="No Fake Age Verification" flag="age_verified: false" note={tSelfOrdering('noFakeAgeVerify', locale)} color={AMBER} />;
}
function NoFakeEatAiPanel({ locale }) {
  return <HonestStatePanel label="No Fake E.A.T. AI" flag="contains_ai_generated_content: false" note={tSelfOrdering('noFakeEatAi', locale)} />;
}
function NoFakeSmokecraftPanel({ locale }) {
  return <HonestStatePanel label="No Fake SmokeCraft Sync" flag="smokecraft_sync_completed: false" note={tSelfOrdering('noFakeSmokecraft', locale)} />;
}
function NoFakeExternalPosPanel({ locale }) {
  return <HonestStatePanel label="No Fake External POS Order" flag="external_sync_completed: false" note={tSelfOrdering('noFakeExternalPos', locale)} />;
}

function PrivateDataPanel({ locale }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 16 }}>Private Data Protection</div>
      <HonestStatePanel
        label="Private Data — Always Flagged"
        flag="exposes_private_data: true on guest/customer records"
        note={tSelfOrdering('privateDataProtected', locale)}
        color={BLUE}
      />
    </div>
  );
}

function FinancialDataPanel({ locale }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 16 }}>Financial Data Protection</div>
      <HonestStatePanel
        label="Financial Data — Always Flagged"
        flag="exposes_financial_data: true on cart/checkout records"
        note={tSelfOrdering('financialDataProtected', locale)}
        color={BLUE}
      />
    </div>
  );
}

function LanguageSelectorPanel({ locale, setLocale }) {
  const langs = getSupportedSelfOrderingLanguages();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 16 }}>Language Selector</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {langs.map(l => (
          <button
            key={l}
            onClick={() => setLocale(l)}
            style={{
              padding: '8px 18px',
              background: locale === l ? GOLD : DARK_CARD,
              color: locale === l ? DARK_BG : DARK_TEXT,
              border: `1px solid ${locale === l ? GOLD : DARK_LINE}`,
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: locale === l ? 700 : 400,
              fontSize: 13,
            }}
          >
            {l}
          </button>
        ))}
      </div>
      <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 14 }}>
        <div style={{ color: DARK_TEXT, fontSize: 13 }}>
          {tSelfOrdering('deviceLine', locale)} — {tSelfOrdering('honestEmptyState', locale)}
        </div>
      </div>
    </div>
  );
}

function POS360SelfOrdering() {
  const [activeTab, setActiveTab] = useState(0);
  const [locale, setLocale] = useState('en-US');

  const panels = [
    <SelfOrderDashboard locale={locale} />,
    <QrSessionsPanel locale={locale} />,
    <SelfOrderCartsPanel locale={locale} />,
    <CartItemsPanel locale={locale} />,
    <SubmissionsPanel locale={locale} />,
    <HandheldSessionsPanel locale={locale} />,
    <HandheldEntriesPanel locale={locale} />,
    <TableSessionsPanel locale={locale} />,
    <CheckoutHandoffsPanel locale={locale} />,
    <QrCodeRegistryPanel locale={locale} />,
    <MenuSnapshotsPanel locale={locale} />,
    <AgeVerificationPanel locale={locale} />,
    <ModifierSelectionsPanel locale={locale} />,
    <AvailabilityOverridesPanel locale={locale} />,
    <SmokecraftHooksPanel locale={locale} />,
    <EatHandoffsPanel locale={locale} />,
    <VisibilityInsightsPanel locale={locale} />,
    <OperationsSummaryPanel locale={locale} />,
    <SelfOrderOfflinePanel locale={locale} />,
    <HandheldOfflinePanel locale={locale} />,
    <NoFakeSelfOrderPanel locale={locale} />,
    <NoFakePaymentPanel locale={locale} />,
    <NoFakeKdsPanel locale={locale} />,
    <NoFakeInventoryPanel locale={locale} />,
    <NoFakeAgeVerifyPanel locale={locale} />,
    <NoFakeEatAiPanel locale={locale} />,
    <NoFakeSmokecraftPanel locale={locale} />,
    <NoFakeExternalPosPanel locale={locale} />,
    <PrivateDataPanel locale={locale} />,
    <FinancialDataPanel locale={locale} />,
    <LanguageSelectorPanel locale={locale} setLocale={setLocale} />,
  ];

  return (
    <div style={{ minHeight: '100vh', background: DARK_BG, color: DARK_TEXT, fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: DARK_CARD, borderBottom: `1px solid ${DARK_LINE}`, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 18 }}>
        <img
          src="/smokecraft-pos360.png"
          alt="SmokeCraft POS360"
          style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 8 }}
          onError={e => { e.currentTarget.style.display = 'none'; }}
        />
        <div>
          <div style={{ color: GOLD, fontWeight: 800, fontSize: 20, letterSpacing: 0.5 }}>
            POS360 — Customer Self-Ordering & Guest Checkout
          </div>
          <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 2 }}>
            {DEVICE_LINE} · QR Menus · Handheld POS · Table Ordering
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <img
            src="/smokecraft-pos360.png"
            alt="POS360"
            style={{ width: 36, height: 36, objectFit: 'contain', opacity: 0.5 }}
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ background: DARK_CARD, borderBottom: `1px solid ${DARK_LINE}`, padding: '0 24px', display: 'flex', gap: 0, overflowX: 'auto' }}>
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === i ? `2px solid ${GOLD}` : '2px solid transparent',
              color: activeTab === i ? GOLD : DARK_MUTE,
              padding: '12px 16px',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: activeTab === i ? 700 : 400,
              whiteSpace: 'nowrap',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div style={{ padding: '28px 28px', maxWidth: 1100 }}>
        {panels[activeTab]}
      </div>
    </div>
  );
}

export default POS360SelfOrdering;
