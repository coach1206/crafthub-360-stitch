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

const DEVICE_LINE = 'Touchscreen &middot; Handheld &middot; Tablet &middot; Desktop';

const TABS = [
  'Overview', 'Provider Registry', 'Stripe', 'Square', 'Manual Invoice',
  'Cash / Offline', 'Future Providers', 'Credential Status', 'Environment Locks',
  'Live Mode Requests', 'Compliance', 'PCI Scope', 'Webhooks', 'Refund Rules',
  'Audit Log', 'Safety Status', 'No-Fake Enforcement', 'Feature Flags',
  'Activation Order', 'Prerequisites', 'Blockers', 'Legal Requirements',
  'Billing Setup', 'Security Requirements', 'Phase D.2 Tracker',
];

const PROVIDERS = [
  { key: 'stripe',              label: 'Stripe',                     status: 'not_started', connected: false, live: false },
  { key: 'square',              label: 'Square',                     status: 'not_started', connected: false, live: false },
  { key: 'manual_invoice',      label: 'Manual Invoice',             status: 'not_started', connected: false, live: false },
  { key: 'cash_offline',        label: 'Cash / Offline',             status: 'not_started', connected: false, live: false },
  { key: 'future_placeholder',  label: 'Future Provider (Placeholder)', status: 'not_started', connected: false, live: false },
];

const STATUS_COLORS = {
  not_started:                   MUTE,
  credentials_required:          AMBER,
  credentials_present_unverified: AMBER,
  verification_failed:           RED,
  verified_test_mode:            BLUE,
  verified_live_mode_locked:     BLUE,
  live_mode_requested:           AMBER,
  live_mode_approved:            GREEN,
  live_mode_enabled:             GREEN,
};

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
    'No fake payments - all transactions require real verified credentials',
    'Raw card data is NEVER stored on this platform',
    'API secrets are NEVER stored in the application database',
    'Live mode requires explicit approval and real credential verification',
    'No provider is marked connected unless real credentials pass validation',
    'All payment events are auditable and traceable',
    'PCI compliance checks must pass before live mode is enabled',
    'Environment locks enforced - must be explicitly unlocked before live mode',
  ];
  return (
    <div style={{ background: RED + '11', border: `1px solid ${RED}44`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
      <div style={{ color: RED, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>PAYMENT SAFETY ENFORCEMENT - ALL RULES ACTIVE</div>
      {rules.map((r, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 4 }}>
          <span style={{ color: RED, fontSize: 12, marginTop: 1 }}>-</span>
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
      <SectionTitle>Phase D.2 - Payment Provider Activation</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {PROVIDERS.map(p => (
          <div key={p.key} style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: TEXT, fontWeight: 700, fontSize: 14 }}>{p.label}</span>
              <Badge label={p.status.replace(/_/g, ' ')} color={STATUS_COLORS[p.status] || MUTE} />
            </div>
            <InfoRow label="Connected" value={p.connected ? 'YES' : 'NO'} valueColor={p.connected ? GREEN : MUTE} />
            <InfoRow label="Live Mode" value={p.live ? 'ENABLED' : 'DISABLED'} valueColor={p.live ? GREEN : MUTE} />
          </div>
        ))}
      </div>
      <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>Activation Prerequisites</SectionTitle>
        {[
          'Real Stripe or Square account with verified business information',
          'Platform-level KYC / KYB completed with payment processor',
          'Business bank account linked and verified',
          'PCI DSS compliance acknowledgment signed',
          'Legal terms of service accepted for each provider',
          'Platform admin credentials confirmed via MFA',
          'Environment lock explicitly unlocked by authorized admin',
          'All credential fields provided via secure environment variables (not database)',
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <span style={{ color: AMBER }}>-</span>
            <span style={{ color: TEXT, fontSize: 13 }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProviderRegistryPanel() {
  return (
    <div>
      <SectionTitle>Payment Provider Registry</SectionTitle>
      <div style={{ background: RED + '11', border: `1px solid ${RED}33`, borderRadius: 6, padding: 12, marginBottom: 16, fontSize: 12, color: RED }}>
        No provider is marked as connected unless real credentials are present and pass validation. All providers start as not_started.
      </div>
      {PROVIDERS.map(p => (
        <div key={p.key} style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ color: GOLD2, fontWeight: 700, fontSize: 16 }}>{p.label}</span>
            <Badge label={p.status.replace(/_/g, ' ')} color={STATUS_COLORS[p.status] || MUTE} />
          </div>
          <InfoRow label="Provider Key" value={p.key} />
          <InfoRow label="Provider Connected" value="NO" valueColor={MUTE} />
          <InfoRow label="Live Mode Enabled" value="NO" valueColor={MUTE} />
          <InfoRow label="Payment Processing Enabled" value="NO" valueColor={MUTE} />
          <InfoRow label="Credentials Present" value="NO" valueColor={MUTE} />
          <InfoRow label="Credentials Verified" value="NO" valueColor={MUTE} />
          <InfoRow label="Contains Secrets" value="NO" valueColor={GREEN} />
          <InfoRow label="Stores Secrets" value="NO" valueColor={GREEN} />
        </div>
      ))}
    </div>
  );
}

function StripePanel() {
  return (
    <div>
      <SectionTitle>Stripe Activation</SectionTitle>
      <div style={{ background: RED + '11', border: `1px solid ${RED}33`, borderRadius: 6, padding: 12, marginBottom: 16, fontSize: 12, color: RED }}>
        Do NOT enter Stripe secret keys here. Stripe credentials are configured via environment variables only (STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET). This panel tracks activation status only.
      </div>
      <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16 }}>
        <InfoRow label="Current Status" value="not_started" valueColor={MUTE} />
        <InfoRow label="Test Mode" value="Disabled" valueColor={MUTE} />
        <InfoRow label="Live Mode" value="Disabled" valueColor={MUTE} />
        <InfoRow label="Webhook Configured" value="No" valueColor={MUTE} />
        <InfoRow label="Connect Enabled" value="No" valueColor={MUTE} />
        <InfoRow label="Payouts Enabled" value="No" valueColor={MUTE} />
        <InfoRow label="Refunds Enabled" value="No" valueColor={MUTE} />
      </div>
      <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16, marginTop: 12 }}>
        <SectionTitle>Stripe Activation Steps</SectionTitle>
        {[
          '1. Create a Stripe account at stripe.com',
          '2. Complete business verification (KYB)',
          '3. Add STRIPE_SECRET_KEY to environment variables (NOT to database)',
          '4. Add STRIPE_PUBLISHABLE_KEY to environment variables',
          '5. Configure webhook endpoint and add STRIPE_WEBHOOK_SECRET to env',
          '6. Run credential verification check (test mode first)',
          '7. Request live mode unlock from platform admin',
          '8. Receive live mode approval',
          '9. Switch to live credentials via environment variables',
          '10. Enable live mode in provider registry (requires admin approval)',
        ].map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <span style={{ color: BLUE, fontSize: 13 }}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SquarePanel() {
  return (
    <div>
      <SectionTitle>Square Activation</SectionTitle>
      <div style={{ background: RED + '11', border: `1px solid ${RED}33`, borderRadius: 6, padding: 12, marginBottom: 16, fontSize: 12, color: RED }}>
        Do NOT enter Square access tokens here. Square credentials are configured via environment variables only (SQUARE_ACCESS_TOKEN, SQUARE_APPLICATION_ID, SQUARE_LOCATION_ID). This panel tracks activation status only.
      </div>
      <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16 }}>
        <InfoRow label="Current Status" value="not_started" valueColor={MUTE} />
        <InfoRow label="Sandbox Mode" value="Disabled" valueColor={MUTE} />
        <InfoRow label="Live Mode" value="Disabled" valueColor={MUTE} />
        <InfoRow label="Multi-Location" value="Disabled" valueColor={MUTE} />
        <InfoRow label="Payouts Enabled" value="No" valueColor={MUTE} />
        <InfoRow label="Refunds Enabled" value="No" valueColor={MUTE} />
      </div>
    </div>
  );
}

function ManualInvoicePanel() {
  return (
    <div>
      <SectionTitle>Manual Invoice Configuration</SectionTitle>
      <div style={{ background: AMBER + '11', border: `1px solid ${AMBER}33`, borderRadius: 6, padding: 12, marginBottom: 16, fontSize: 12, color: AMBER }}>
        Manual Invoice payments are tracked and audited. No fake invoice completions are allowed. Each invoice must be independently verified as paid before marking complete.
      </div>
      <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16 }}>
        <InfoRow label="Status" value="not_started" valueColor={MUTE} />
        <InfoRow label="Invoice Generation" value="Disabled" valueColor={MUTE} />
        <InfoRow label="Payment Tracking" value="Disabled" valueColor={MUTE} />
        <InfoRow label="Reconciliation" value="Disabled" valueColor={MUTE} />
      </div>
    </div>
  );
}

function CashOfflinePanel() {
  return (
    <div>
      <SectionTitle>Cash / Offline Payment Configuration</SectionTitle>
      <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16 }}>
        <InfoRow label="Status" value="not_started" valueColor={MUTE} />
        <InfoRow label="Cash Drawer Tracking" value="Disabled" valueColor={MUTE} />
        <InfoRow label="Offline Queue" value="Disabled" valueColor={MUTE} />
        <InfoRow label="Sync on Reconnect" value="Disabled" valueColor={MUTE} />
      </div>
    </div>
  );
}

function FutureProvidersPanel() {
  return (
    <div>
      <SectionTitle>Future Provider Placeholders</SectionTitle>
      <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: MUTE, fontSize: 13, marginBottom: 12 }}>Providers reserved for future activation. No credentials, no activation, no live mode.</div>
        {['PayPal', 'Adyen', 'Braintree', 'Authorize.Net', 'Klarna', 'Afterpay'].map((p, i) => (
          <InfoRow key={i} label={p} value="Placeholder - Not Started" valueColor={MUTE} />
        ))}
      </div>
    </div>
  );
}

function CredentialStatusPanel() {
  return (
    <div>
      <SectionTitle>Credential Presence Status</SectionTitle>
      <div style={{ background: RED + '11', border: `1px solid ${RED}33`, borderRadius: 6, padding: 12, marginBottom: 16, fontSize: 12, color: RED }}>
        Credential status tracks PRESENCE only. Raw keys, secrets, and tokens are NEVER stored in the database or this panel.
      </div>
      {PROVIDERS.filter(p => p.key !== 'future_placeholder').map(p => (
        <div key={p.key} style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 14, marginBottom: 10 }}>
          <div style={{ color: GOLD2, fontWeight: 700, marginBottom: 8 }}>{p.label}</div>
          <InfoRow label="Presence Status" value="absent" valueColor={MUTE} />
          <InfoRow label="Stores Raw Keys" value="NO" valueColor={GREEN} />
          <InfoRow label="Stores Card Data" value="NO" valueColor={GREEN} />
          <InfoRow label="Last Checked" value="Never" valueColor={MUTE} />
        </div>
      ))}
    </div>
  );
}

function EnvironmentLocksPanel() {
  return (
    <div>
      <SectionTitle>Environment Locks</SectionTitle>
      <div style={{ background: AMBER + '11', border: `1px solid ${AMBER}33`, borderRadius: 6, padding: 12, marginBottom: 16, fontSize: 12, color: AMBER }}>
        All providers are environment-locked by default. Live mode cannot be enabled while a lock is active. Unlocking requires explicit platform admin approval.
      </div>
      {PROVIDERS.filter(p => p.key !== 'future_placeholder').map(p => (
        <div key={p.key} style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 14, marginBottom: 10 }}>
          <div style={{ color: GOLD2, fontWeight: 700, marginBottom: 8 }}>{p.label}</div>
          <InfoRow label="Lock Status" value="locked" valueColor={AMBER} />
          <InfoRow label="Lock Reason" value="Phase D.2 activation required before live mode" valueColor={MUTE} />
          <InfoRow label="Unlock Requested" value="No" valueColor={MUTE} />
          <InfoRow label="Unlock Approved" value="No" valueColor={MUTE} />
        </div>
      ))}
    </div>
  );
}

function LiveModeRequestsPanel() {
  return (
    <div>
      <SectionTitle>Live Mode Requests</SectionTitle>
      <div style={{ background: RED + '11', border: `1px solid ${RED}33`, borderRadius: 6, padding: 12, marginBottom: 16, fontSize: 12, color: RED }}>
        Live mode requires explicit approval. No provider can be switched to live mode without an approved request on record. All requests are permanently audited.
      </div>
      <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: MUTE, fontSize: 13 }}>No live mode requests on record. Submit a request after credentials are verified in test mode.</div>
      </div>
    </div>
  );
}

function CompliancePanel() {
  const checks = [
    { label: 'PCI DSS SAQ Completed', status: 'pending' },
    { label: 'Business KYB Verified', status: 'pending' },
    { label: 'Bank Account Verified', status: 'pending' },
    { label: 'Legal Terms Accepted (Stripe)', status: 'pending' },
    { label: 'Legal Terms Accepted (Square)', status: 'pending' },
    { label: 'Data Residency Requirements Met', status: 'pending' },
    { label: 'Chargeback Policy Defined', status: 'pending' },
    { label: 'Refund Policy Published', status: 'pending' },
  ];
  return (
    <div>
      <SectionTitle>Compliance Checks</SectionTitle>
      {checks.map((c, i) => (
        <div key={i} style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 6, padding: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: TEXT, fontSize: 13 }}>{c.label}</span>
          <Badge label={c.status} color={MUTE} />
        </div>
      ))}
    </div>
  );
}

function PciScopePanel() {
  return (
    <div>
      <SectionTitle>PCI Scope</SectionTitle>
      <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>PCI DSS Requirements</SectionTitle>
        {[
          'Cardholder data is NEVER stored on this platform',
          'All card processing is delegated to PCI-compliant providers (Stripe/Square)',
          'No raw PANs (Primary Account Numbers) in any database field',
          'No CVV/CVC values stored anywhere',
          'No magnetic stripe data stored',
          'Tokenization is handled by the payment processor',
          'Webhook payloads containing card data are not logged',
          'TLS 1.2+ enforced on all payment-related endpoints',
        ].map((req, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <span style={{ color: GREEN, fontSize: 12 }}>-</span>
            <span style={{ color: TEXT, fontSize: 12 }}>{req}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WebhooksPanel() {
  return (
    <div>
      <SectionTitle>Webhook Registry</SectionTitle>
      <div style={{ background: RED + '11', border: `1px solid ${RED}33`, borderRadius: 6, padding: 12, marginBottom: 16, fontSize: 12, color: RED }}>
        Webhook secrets are configured via environment variables. They are NEVER stored in the database or displayed in this panel.
      </div>
      <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16 }}>
        <InfoRow label="Stripe Webhook" value="Not Configured" valueColor={MUTE} />
        <InfoRow label="Square Webhook" value="Not Configured" valueColor={MUTE} />
        <InfoRow label="Webhook Secret Storage" value="Environment Variables Only" valueColor={GREEN} />
      </div>
    </div>
  );
}

function RefundRulesPanel() {
  return (
    <div>
      <SectionTitle>Refund Rules</SectionTitle>
      <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: MUTE, fontSize: 13, marginBottom: 12 }}>No refund rules configured. Rules are applied after providers are activated in test mode.</div>
        <InfoRow label="Stripe Refunds Enabled" value="No" valueColor={MUTE} />
        <InfoRow label="Square Refunds Enabled" value="No" valueColor={MUTE} />
        <InfoRow label="Manual Invoice Refunds" value="No" valueColor={MUTE} />
      </div>
    </div>
  );
}

function AuditLogPanel() {
  return (
    <div>
      <SectionTitle>Payment Provider Audit Log</SectionTitle>
      <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: MUTE, fontSize: 13 }}>No audit events recorded. All payment provider configuration changes will be permanently logged here.</div>
      </div>
    </div>
  );
}

function SafetyStatusPanel() {
  const enforcements = [
    { label: 'No Fake Payment Processing', value: 'ENFORCED', color: GREEN },
    { label: 'No Raw Card Data Storage', value: 'ENFORCED', color: GREEN },
    { label: 'No Secrets in Database', value: 'ENFORCED', color: GREEN },
    { label: 'No Fake Provider Connection', value: 'ENFORCED', color: GREEN },
    { label: 'No Fake Invoice Completion', value: 'ENFORCED', color: GREEN },
    { label: 'Live Mode Approval Gate', value: 'REQUIRED', color: GREEN },
    { label: 'Credential Validation', value: 'REQUIRED', color: GREEN },
    { label: 'Platform Admin Guard', value: 'REQUIRED', color: GREEN },
    { label: 'Audit Trail', value: 'REQUIRED', color: GREEN },
    { label: 'Idempotency Enforcement', value: 'ACTIVE', color: GREEN },
  ];
  return (
    <div>
      <SectionTitle>Payment Safety Status</SectionTitle>
      <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16 }}>
        {enforcements.map((e, i) => (
          <InfoRow key={i} label={e.label} value={e.value} valueColor={e.color} />
        ))}
      </div>
    </div>
  );
}

function NoFakeEnforcementPanel() {
  const rules = [
    'NEVER process a real payment without live credentials and admin approval',
    'NEVER create live charges in any context without verified live credentials',
    'NEVER store raw card numbers, CVV, or magnetic stripe data',
    'NEVER store API secrets, private keys, or access tokens in the database',
    'NEVER fake a Stripe connection - if Stripe is not configured, status is not_started',
    'NEVER fake a Square connection - if Square is not configured, status is not_started',
    'NEVER mark an invoice as paid unless independent payment verification occurred',
    'NEVER mark a provider as connected unless real credentials pass validation',
    'NEVER skip the environment lock before enabling live mode',
    'NEVER skip the live mode approval gate',
    'NEVER weaken NOVEE OS, Phase D.1, CraftHub, POS360, E.A.T., or SmokeCraft protections',
    'NEVER remove feature flags, auth gates, route guards, or validators',
  ];
  return (
    <div>
      <SectionTitle>No-Fake Activation Enforcement Rules</SectionTitle>
      <div style={{ background: RED + '11', border: `1px solid ${RED}44`, borderRadius: 8, padding: 16 }}>
        {rules.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
            <span style={{ color: RED, fontWeight: 700, fontSize: 14, minWidth: 16 }}>-</span>
            <span style={{ color: TEXT, fontSize: 13 }}>{r}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureFlagsPanel() {
  const flags = [
    { label: 'phaseDPaymentProviderActivationEnabled', value: false },
    { label: 'stripeProviderEnabled', value: false },
    { label: 'squareProviderEnabled', value: false },
    { label: 'manualInvoiceProviderEnabled', value: false },
    { label: 'cashOfflineProviderEnabled', value: false },
    { label: 'stripeLiveModeEnabled', value: false },
    { label: 'squareLiveModeEnabled', value: false },
    { label: 'stripePaymentProcessingEnabled', value: false },
    { label: 'squarePaymentProcessingEnabled', value: false },
    { label: 'taxCollectionEnabled', value: false },
    { label: 'paymentReportingEnabled', value: false },
    { label: 'noFakePaymentProcessingEnforced', value: true },
    { label: 'noRawCardDataStorageEnforced', value: true },
    { label: 'noSecretsInDatabaseEnforced', value: true },
    { label: 'liveModeApprovalGateRequired', value: true },
    { label: 'platformAdminGuardRequired', value: true },
    { label: 'auditTrailRequired', value: true },
    { label: 'idempotencyEnforced', value: true },
  ];
  return (
    <div>
      <SectionTitle>Phase D.2 Feature Flags</SectionTitle>
      <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16 }}>
        {flags.map((f, i) => (
          <InfoRow key={i} label={f.label} value={f.value ? 'TRUE' : 'FALSE'} valueColor={f.value ? (f.label.includes('Enforced') || f.label.includes('Required') || f.label.includes('Enabled') && f.value ? GREEN : GREEN) : MUTE} />
        ))}
      </div>
    </div>
  );
}

function ActivationOrderPanel() {
  const steps = [
    { step: 1, label: 'Complete business KYB / KYC with payment processor' },
    { step: 2, label: 'Link and verify business bank account' },
    { step: 3, label: 'Complete PCI DSS SAQ' },
    { step: 4, label: 'Accept legal terms for each payment provider' },
    { step: 5, label: 'Configure credentials in environment variables (not database)' },
    { step: 6, label: 'Run test mode credential verification' },
    { step: 7, label: 'Submit live mode unlock request to platform admin' },
    { step: 8, label: 'Receive live mode approval from authorized admin' },
    { step: 9, label: 'Unlock environment lock for approved provider' },
    { step: 10, label: 'Switch to live credentials via environment variables' },
    { step: 11, label: 'Enable live mode in provider registry (requires admin confirmation)' },
    { step: 12, label: 'Run post-activation verification and audit sweep' },
  ];
  return (
    <div>
      <SectionTitle>Activation Order</SectionTitle>
      {steps.map(s => (
        <div key={s.step} style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 6, padding: 12, marginBottom: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ background: LINE, color: GOLD, fontWeight: 700, fontSize: 13, width: 28, height: 28, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.step}</div>
          <span style={{ color: TEXT, fontSize: 13 }}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

function PrerequisitesPanel() {
  return (
    <div>
      <SectionTitle>Prerequisites</SectionTitle>
      <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16 }}>
        {[
          'Phase C.1-C.7 NOVEE OS fully deployed and operational',
          'Phase D.1 Provider Roadmap completed and verified',
          'Platform database configured and migrations applied',
          'NOVEE OS authentication and authorization fully operational',
          'POS360 operational for payment point-of-sale integration',
          'Business entity legally established and verified',
          'Tax compliance engine configured (Phase C.x)',
          'Audit logging infrastructure operational',
        ].map((req, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <span style={{ color: AMBER, fontSize: 13 }}>-</span>
            <span style={{ color: TEXT, fontSize: 13 }}>{req}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BlockersPanel() {
  return (
    <div>
      <SectionTitle>Current Blockers</SectionTitle>
      {[
        { label: 'No Stripe credentials configured', severity: 'critical', detail: 'Set STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET in environment' },
        { label: 'No Square credentials configured', severity: 'critical', detail: 'Set SQUARE_ACCESS_TOKEN, SQUARE_APPLICATION_ID, SQUARE_LOCATION_ID in environment' },
        { label: 'PCI DSS compliance not completed', severity: 'critical', detail: 'Complete SAQ before live payment processing' },
        { label: 'Business KYB not verified', severity: 'critical', detail: 'Complete business verification with payment processor' },
        { label: 'Environment locks active on all providers', severity: 'blocking', detail: 'Unlock required before live mode' },
        { label: 'No live mode approval on record', severity: 'blocking', detail: 'Submit and receive approval for live mode request' },
      ].map((b, i) => (
        <div key={i} style={{ background: RED + '11', border: `1px solid ${RED}33`, borderRadius: 8, padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ color: RED, fontWeight: 700, fontSize: 13 }}>{b.label}</span>
            <Badge label={b.severity} color={RED} />
          </div>
          <div style={{ color: MUTE, fontSize: 12 }}>{b.detail}</div>
        </div>
      ))}
    </div>
  );
}

function LegalRequirementsPanel() {
  return (
    <div>
      <SectionTitle>Legal Requirements</SectionTitle>
      <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16 }}>
        {[
          'Stripe Services Agreement accepted',
          'Square Developer Terms of Service accepted',
          'Payment Card Industry Data Security Standard (PCI DSS) SAQ completed',
          'State/country money transmitter licenses assessed',
          'GDPR / CCPA payment data handling compliance verified',
          'Chargeback dispute resolution policy published',
          'Refund policy published and accessible to customers',
          'Privacy policy updated to include payment data handling',
        ].map((req, i) => (
          <InfoRow key={i} label={req} value="Pending" valueColor={AMBER} />
        ))}
      </div>
    </div>
  );
}

function BillingSetupPanel() {
  return (
    <div>
      <SectionTitle>Billing Setup Requirements</SectionTitle>
      <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16 }}>
        {[
          'Stripe account with verified bank account for payouts',
          'Square account with verified bank account for payouts',
          'Platform fee structure defined (if using Stripe Connect)',
          'Tax collection settings configured',
          'Invoice numbering sequence configured',
          'Receipt email template configured',
          'Payout schedule defined (daily / weekly / manual)',
          'Currency settings confirmed (USD default)',
        ].map((req, i) => (
          <InfoRow key={i} label={req} value="Not Configured" valueColor={MUTE} />
        ))}
      </div>
    </div>
  );
}

function SecurityRequirementsPanel() {
  return (
    <div>
      <SectionTitle>Security Requirements</SectionTitle>
      <div style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16 }}>
        {[
          { label: 'TLS 1.2+ enforced on all endpoints', status: 'Required' },
          { label: 'Webhook signature verification active', status: 'Required' },
          { label: 'API key rotation policy defined', status: 'Required' },
          { label: 'MFA required for admin credential changes', status: 'Required' },
          { label: 'Secrets management via environment variables', status: 'Active' },
          { label: 'No secrets in source code or database', status: 'Active' },
          { label: 'Audit log for all payment config changes', status: 'Active' },
          { label: 'Rate limiting on payment endpoints', status: 'Required' },
          { label: 'IP allowlisting for admin operations', status: 'Recommended' },
        ].map((req, i) => (
          <InfoRow key={i} label={req.label} value={req.status} valueColor={req.status === 'Active' ? GREEN : AMBER} />
        ))}
      </div>
    </div>
  );
}

function PhaseDTrackerPanel() {
  const items = [
    { label: 'Migration 056 - Payment Provider Tables', status: 'complete' },
    { label: 'Payment Provider Contracts', status: 'complete' },
    { label: 'Feature Flags', status: 'complete' },
    { label: 'Locales (6 languages)', status: 'complete' },
    { label: 'Payment Provider Service Layer', status: 'complete' },
    { label: 'Payment Provider Controller', status: 'complete' },
    { label: 'Payment Provider Routes', status: 'complete' },
    { label: 'UI - PhaseDPaymentProviderActivation.jsx', status: 'complete' },
    { label: 'Verification Script (400+ checks)', status: 'complete' },
    { label: 'Phase D.1 Provider Roadmap', status: 'complete' },
    { label: 'Real Stripe Credentials', status: 'not_started' },
    { label: 'Real Square Credentials', status: 'not_started' },
    { label: 'Business KYB Verification', status: 'not_started' },
    { label: 'PCI DSS SAQ', status: 'not_started' },
    { label: 'Live Mode Approval', status: 'not_started' },
  ];
  return (
    <div>
      <SectionTitle>Phase D.2 Completion Tracker</SectionTitle>
      {items.map((item, i) => (
        <div key={i} style={{ background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 6, padding: 10, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: TEXT, fontSize: 13 }}>{item.label}</span>
          <Badge label={item.status.replace(/_/g, ' ')} color={item.status === 'complete' ? GREEN : MUTE} />
        </div>
      ))}
    </div>
  );
}

const PANELS = {
  'Overview':              <OverviewPanel />,
  'Provider Registry':     <ProviderRegistryPanel />,
  'Stripe':                <StripePanel />,
  'Square':                <SquarePanel />,
  'Manual Invoice':        <ManualInvoicePanel />,
  'Cash / Offline':        <CashOfflinePanel />,
  'Future Providers':      <FutureProvidersPanel />,
  'Credential Status':     <CredentialStatusPanel />,
  'Environment Locks':     <EnvironmentLocksPanel />,
  'Live Mode Requests':    <LiveModeRequestsPanel />,
  'Compliance':            <CompliancePanel />,
  'PCI Scope':             <PciScopePanel />,
  'Webhooks':              <WebhooksPanel />,
  'Refund Rules':          <RefundRulesPanel />,
  'Audit Log':             <AuditLogPanel />,
  'Safety Status':         <SafetyStatusPanel />,
  'No-Fake Enforcement':   <NoFakeEnforcementPanel />,
  'Feature Flags':         <FeatureFlagsPanel />,
  'Activation Order':      <ActivationOrderPanel />,
  'Prerequisites':         <PrerequisitesPanel />,
  'Blockers':              <BlockersPanel />,
  'Legal Requirements':    <LegalRequirementsPanel />,
  'Billing Setup':         <BillingSetupPanel />,
  'Security Requirements': <SecurityRequirementsPanel />,
  'Phase D.2 Tracker':     <PhaseDTrackerPanel />,
};

function PhaseDPaymentProviderActivationShell() {
  const [activeTab, setActiveTab] = useState('Overview');

  return (
    <div style={{ minHeight: '100vh', background: NAVY, color: TEXT, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: CHARCOAL, borderBottom: `1px solid ${LINE}`, padding: '16px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: GOLD2, fontWeight: 700, fontSize: 20 }}>Phase D.2 - Payment Provider Activation</div>
            <div style={{ color: MUTE, fontSize: 12, marginTop: 2 }} dangerouslySetInnerHTML={{ __html: DEVICE_LINE }} />
          </div>
          <Badge label="Activation Locked" color={AMBER} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 0 }}>
        <div style={{ width: 220, background: CHARCOAL, borderRight: `1px solid ${LINE}`, minHeight: 'calc(100vh - 65px)', padding: '12px 0', flexShrink: 0 }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '8px 16px',
                background: activeTab === tab ? LINE : 'transparent',
                color: activeTab === tab ? GOLD2 : MUTE,
                border: 'none', cursor: 'pointer', fontSize: 12,
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

function PhaseDPaymentProviderActivation() {
  return <PhaseDPaymentProviderActivationShell />;
}

export default PhaseDPaymentProviderActivation;
