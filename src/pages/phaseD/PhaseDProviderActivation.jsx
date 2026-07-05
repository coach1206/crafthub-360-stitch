// Phase D.1 - Provider Activation Roadmap Command Center
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
const DEVICE_LINE = 'Touchscreen &middot; Handheld &middot; Tablet &middot; Desktop';

const TABS = [
  { id: 'hero',          label: 'Overview' },
  { id: 'roadmap',       label: 'Phase D Roadmap' },
  { id: 'categories',    label: 'Provider Categories' },
  { id: 'candidates',    label: 'Provider Candidates' },
  { id: 'order',         label: 'Activation Order' },
  { id: 'dependencies',  label: 'Dependencies' },
  { id: 'credentials',   label: 'Credential Placeholders' },
  { id: 'prerequisites', label: 'Prerequisites' },
  { id: 'blockers',      label: 'Blockers' },
  { id: 'legal',         label: 'Legal Requirements' },
  { id: 'billing',       label: 'Billing Requirements' },
  { id: 'security',      label: 'Security Requirements' },
  { id: 'act-status',    label: 'Activation Status' },
  { id: 'test-status',   label: 'Test Status' },
  { id: 'verif-status',  label: 'Verification Status' },
  { id: 'rollback',      label: 'Rollback' },
  { id: 'failure',       label: 'Failure Records' },
  { id: 'matrix',        label: 'Readiness Matrix' },
  { id: 'safe-claims',   label: 'Safe Claims' },
  { id: 'unsafe-claims', label: 'Unsafe Claims' },
  { id: 'honest',        label: 'Honest Limitations' },
  { id: 'no-secrets',    label: 'No Secrets' },
  { id: 'language',      label: 'Language' },
  { id: 'empty',         label: 'Empty State' },
];

const PHASE_D_ROADMAP = [
  { phase: 'D.1', name: 'Provider Activation Roadmap', status: 'current' },
  { phase: 'D.2', name: 'Payment Provider Activation', status: 'next' },
  { phase: 'D.3', name: 'External POS Provider Activation', status: 'not_started' },
  { phase: 'D.4', name: 'Inventory Provider Activation', status: 'not_started' },
  { phase: 'D.5', name: 'Communication Provider Activation', status: 'not_started' },
  { phase: 'D.6', name: 'Security Provider Activation', status: 'not_started' },
  { phase: 'D.7', name: 'Deployment Activation', status: 'not_started' },
  { phase: 'D.8', name: 'Live Pilot Readiness & Provider Launch Lock', status: 'not_started' },
];

const CATEGORIES = [
  { provider_category: 'payments',           activation_order: 2 },
  { provider_category: 'billing',            activation_order: 3 },
  { provider_category: 'external_pos',       activation_order: 6 },
  { provider_category: 'inventory',          activation_order: 7 },
  { provider_category: 'menu_import',        activation_order: 7 },
  { provider_category: 'bar_inventory',      activation_order: 7 },
  { provider_category: 'kitchen_inventory',  activation_order: 7 },
  { provider_category: 'humidor_inventory',  activation_order: 7 },
  { provider_category: 'kds_printer',        activation_order: 8 },
  { provider_category: 'guest_notifications',activation_order: 5 },
  { provider_category: 'staff_notifications',activation_order: 4 },
  { provider_category: 'email',              activation_order: 4 },
  { provider_category: 'sms',               activation_order: 5 },
  { provider_category: 'sso',               activation_order: 9 },
  { provider_category: 'mfa',               activation_order: 9 },
  { provider_category: 'device_trust',       activation_order: 9 },
  { provider_category: 'ip_allowlist',       activation_order: 9 },
  { provider_category: 'deployment',         activation_order: 1 },
  { provider_category: 'domain',             activation_order: 10 },
  { provider_category: 'white_label',        activation_order: 10 },
  { provider_category: 'custom_domain',      activation_order: 10 },
  { provider_category: 'marketplace',        activation_order: 11 },
  { provider_category: 'smokecraft_sync',    activation_order: 12 },
  { provider_category: 'eat_automation',     activation_order: 13 },
  { provider_category: 'reporting_analytics',activation_order: 11 },
  { provider_category: 'tax_engine',         activation_order: 13 },
  { provider_category: 'payroll_accounting', activation_order: 13 },
  { provider_category: 'manual_fallback',    activation_order: 99 },
];

const CANDIDATES = [
  { provider_key: 'stripe',        provider_category: 'payments',     activation_status: 'credentials_required' },
  { provider_key: 'square',        provider_category: 'payments',     activation_status: 'credentials_required' },
  { provider_key: 'twilio',        provider_category: 'sms',          activation_status: 'credentials_required' },
  { provider_key: 'sendgrid',      provider_category: 'email',        activation_status: 'credentials_required' },
  { provider_key: 'auth0',         provider_category: 'sso',          activation_status: 'credentials_required' },
  { provider_key: 'railway',       provider_category: 'deployment',   activation_status: 'configuration_required' },
  { provider_key: 'taxjar',        provider_category: 'tax_engine',   activation_status: 'credentials_required' },
  { provider_key: 'manual_csv',    provider_category: 'manual_fallback', activation_status: 'not_started' },
];

const SAFE_CLAIMS = [
  'Provider activation roadmap foundation built and verified.',
  'Phase D activation order documented and controlled.',
  'No-fake activation controls enforced at all layers.',
  'Credential placeholder system ready - no live credentials stored.',
  'Provider readiness matrix foundation built.',
];

const UNSAFE_CLAIMS = [
  { claim: 'Live provider connected.', reason: 'No provider connected - Phase D activation required.' },
  { claim: 'Live payment processing active.', reason: 'payment_processed: false - Phase D.2 required.' },
  { claim: 'Billing connected.', reason: 'billing_connected: false - Phase D.2 required.' },
  { claim: 'SSO connected.', reason: 'security_provider_connected: false - Phase D.6 required.' },
  { claim: 'Production deployed.', reason: 'deployment_completed: false - Phase D.7 required.' },
  { claim: 'Marketplace transactions live.', reason: 'marketplace_transaction_enabled: false - Phase D.8 required.' },
];

const HONEST_LIMITATIONS = [
  'No provider is connected. Phase D activation is required.',
  'No credentials have been verified. External provider setup required.',
  'No payment processing. Stripe/Square activation is Phase D.2.',
  'No billing connection. Billing activation is Phase D.2.',
  'No external POS sync. POS activation is Phase D.3.',
  'No inventory sync. Inventory activation is Phase D.4.',
  'No email or SMS delivery. Communication activation is Phase D.5.',
  'No SSO or MFA. Security provider activation is Phase D.6.',
  'No deployment completed. Deployment activation is Phase D.7.',
  'No marketplace transactions. Marketplace activation is Phase D.8.',
  'No SmokeCraft sync. SmokeCraft activation is Phase D.8.',
  'No E.A.T. automation. E.A.T. activation is Phase D.8.',
  'No live mode. Live mode requires all Phase D provider activations.',
];

// ─── Shared components ────────────────────────────────────────────────────────

function FoundationBanner({ msg }) {
  return (
    <div style={{ background: '#0d1f14', border: `1px solid ${GREEN}`, borderRadius: 6, padding: '8px 14px', color: GREEN, fontSize: 12, marginBottom: 8 }}>
      Foundation Ready: {msg}
    </div>
  );
}

function LockBanner({ msg }) {
  return (
    <div style={{ background: '#1a0d0d', border: `1px solid ${RED}`, borderRadius: 6, padding: '8px 14px', color: RED, fontSize: 12, marginBottom: 8 }}>
      {msg}
    </div>
  );
}

function SectionTitle({ children }) {
  return <div style={{ color: GOLD, fontWeight: 700, fontSize: 14, marginBottom: 8, borderBottom: `1px solid ${LINE}`, paddingBottom: 4 }}>{children}</div>;
}

function StatusPill({ label, color }) {
  return (
    <span style={{ background: color + '22', border: `1px solid ${color}`, color, borderRadius: 4, fontSize: 11, padding: '2px 8px', fontWeight: 600 }}>
      {label}
    </span>
  );
}

function HonestState({ label, state, detail }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 6, padding: '10px 14px', marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: TEXT, fontWeight: 600, fontSize: 13 }}>{label}</span>
        <StatusPill label={state} color={RED} />
      </div>
      {detail && <div style={{ color: MUTE, fontSize: 11, marginTop: 4 }}>{detail}</div>}
    </div>
  );
}

// ─── Panel components ─────────────────────────────────────────────────────────

function PhaseDHeroPanel() {
  return (
    <div>
      <div style={{ color: GOLD, fontWeight: 900, fontSize: 22, marginBottom: 6 }}>Phase D.1 - Provider Activation Roadmap</div>
      <div style={{ color: MUTE, fontSize: 12, marginBottom: 12 }}>Live Integration Order &amp; No-Fake Activation Control - Module D.1 of 8</div>
      <FoundationBanner msg="Provider activation roadmap foundation built. No provider is live." />
      <LockBanner msg="Provider Activation Required - Credentials Required - Phase D activation pending" />
      <div style={{ color: TEXT, fontSize: 13, lineHeight: 1.6, marginTop: 10 }}>
        This command center controls the order of real provider activation. No provider is connected.
        No credentials are stored. All activation statuses reflect honest readiness state only.
      </div>
      <div style={{ color: MUTE, fontSize: 11, marginTop: 8 }}>
        live_mode_enabled: false - provider_connected: false - payment_processed: false - deployment_completed: false
      </div>
    </div>
  );
}

function ProviderActivationRoadmapPanel() {
  return (
    <div>
      <SectionTitle>Provider Activation Roadmap</SectionTitle>
      <FoundationBanner msg="Roadmap foundation documented and controlled." />
      <LockBanner msg="No provider activated - activation_required for all categories" />
      <div style={{ color: TEXT, fontSize: 12, marginTop: 8 }}>
        The activation roadmap defines the required order of provider activation for Phase D.
        All providers begin at not_started or credentials_required status.
      </div>
    </div>
  );
}

function ProviderCategoryPanel() {
  return (
    <div>
      <SectionTitle>Provider Categories</SectionTitle>
      <LockBanner msg="All categories: provider_required - not live" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 8, marginTop: 8 }}>
        {CATEGORIES.map(c => (
          <div key={c.provider_category} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 6, padding: '8px 12px' }}>
            <div style={{ color: TEXT, fontWeight: 600, fontSize: 12 }}>{c.provider_category}</div>
            <div style={{ color: MUTE, fontSize: 11 }}>Order: {c.activation_order} - Not Live</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProviderCandidatePanel() {
  return (
    <div>
      <SectionTitle>Provider Candidates</SectionTitle>
      <LockBanner msg="All candidates: credentials_required or configuration_required - not live" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
        {CANDIDATES.map(c => (
          <div key={c.provider_key} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 6, padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: TEXT, fontWeight: 600, fontSize: 13 }}>{c.provider_key}</div>
              <div style={{ color: MUTE, fontSize: 11 }}>{c.provider_category}</div>
            </div>
            <StatusPill label={c.activation_status} color={AMBER} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivationOrderPanel() {
  const items = [
    { n: 1, key: 'deployment',    phase: 'D.7', note: 'Environment must be live before providers connect' },
    { n: 2, key: 'payments',      phase: 'D.2', note: 'Payments required for billing' },
    { n: 3, key: 'email',         phase: 'D.5', note: 'Email required for staff invites' },
    { n: 4, key: 'sms',           phase: 'D.5', note: 'SMS for guest notifications' },
    { n: 5, key: 'external_pos',  phase: 'D.3', note: 'External POS after comms' },
    { n: 6, key: 'inventory',     phase: 'D.4', note: 'Inventory after POS' },
    { n: 7, key: 'kds_printer',   phase: 'D.4', note: 'Hardware after inventory' },
    { n: 8, key: 'sso_mfa',       phase: 'D.6', note: 'Security after core providers' },
    { n: 9, key: 'marketplace',   phase: 'D.8', note: 'Marketplace after security' },
    { n: 10, key: 'white_label',  phase: 'D.7', note: 'Domain after deployment' },
    { n: 11, key: 'smokecraft',   phase: 'D.8', note: 'SmokeCraft sync last' },
    { n: 12, key: 'eat',          phase: 'D.8', note: 'E.A.T. automation final' },
    { n: 13, key: 'tax',          phase: 'D.8', note: 'Tax with live transactions' },
  ];
  return (
    <div>
      <SectionTitle>Recommended Activation Order</SectionTitle>
      <LockBanner msg="activation_status: not_started for all - no provider activated" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
        {items.map(it => (
          <div key={it.n} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 6, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ color: GOLD, fontWeight: 900, fontSize: 16, minWidth: 28 }}>{it.n}</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: TEXT, fontWeight: 600, fontSize: 12 }}>{it.key}</div>
              <div style={{ color: MUTE, fontSize: 11 }}>{it.note}</div>
            </div>
            <StatusPill label={it.phase} color={BLUE} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProviderDependencyPanel() {
  return (
    <div>
      <SectionTitle>Provider Dependencies</SectionTitle>
      <LockBanner msg="Dependencies tracked - no provider active" />
      <div style={{ color: TEXT, fontSize: 12, marginTop: 8 }}>
        Deployment must complete before any provider can connect. Payments must be active before billing.
        Email must be active before staff invites. SSO/MFA requires deployment and payments active.
      </div>
    </div>
  );
}

function CredentialPlaceholderPanel() {
  return (
    <div>
      <SectionTitle>Credential Placeholders</SectionTitle>
      <LockBanner msg="Credentials Required - no live credentials stored - credentials_received: false" />
      <div style={{ color: TEXT, fontSize: 12, marginTop: 8 }}>
        This system tracks credential placeholder state only. No credentials are stored here.
        Credentials must be provided externally through the provider onboarding process.
      </div>
      <div style={{ color: MUTE, fontSize: 11, marginTop: 6 }}>
        credential_status: not_requested - credentials_received: false - credentials_verified: false
      </div>
      {CANDIDATES.filter(c => c.activation_status === 'credentials_required').map(c => (
        <div key={c.provider_key} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 6, padding: '8px 14px', marginTop: 6 }}>
          <div style={{ color: TEXT, fontWeight: 600, fontSize: 12 }}>{c.provider_key}</div>
          <div style={{ color: AMBER, fontSize: 11 }}>credentials_required - not stored here</div>
        </div>
      ))}
    </div>
  );
}

function ProviderPrerequisitePanel() {
  return (
    <div>
      <SectionTitle>Provider Prerequisites</SectionTitle>
      <LockBanner msg="Prerequisites not met - provider activation required" />
      <div style={{ color: TEXT, fontSize: 12, marginTop: 8 }}>
        All providers require environment deployment, credential provisioning, legal agreements,
        billing approval, and security review before activation. No prerequisites are currently met.
      </div>
    </div>
  );
}

function ProviderBlockerPanel() {
  return (
    <div>
      <SectionTitle>Activation Blockers</SectionTitle>
      <LockBanner msg="Active blockers: no provider can activate without Phase D completion" />
      {[
        'No deployment environment configured.',
        'No credentials received for any provider.',
        'No legal agreements signed.',
        'No billing approval in place.',
        'No security review completed.',
      ].map((b, i) => (
        <div key={i} style={{ background: '#1a0d0d', border: `1px solid ${RED}`, borderRadius: 6, padding: '8px 14px', marginTop: 6 }}>
          <div style={{ color: RED, fontSize: 12, fontWeight: 600 }}>BLOCKER</div>
          <div style={{ color: TEXT, fontSize: 12 }}>{b}</div>
        </div>
      ))}
    </div>
  );
}

function LegalRequirementPanel() {
  return (
    <div>
      <SectionTitle>Legal Requirements</SectionTitle>
      <LockBanner msg="No contracts signed - legal review required before provider activation" />
      <div style={{ color: TEXT, fontSize: 12, marginTop: 8 }}>
        All provider activations require signed service agreements, data processing agreements (DPA),
        and applicable compliance documentation. None are currently signed.
      </div>
    </div>
  );
}

function BillingRequirementPanel() {
  return (
    <div>
      <SectionTitle>Billing Requirements</SectionTitle>
      <LockBanner msg="billing_connected: false - payment_processed: false - Phase D.2 required" />
      <div style={{ color: TEXT, fontSize: 12, marginTop: 8 }}>
        Billing provider must be connected before payment processing can begin.
        All billing requirements remain in not_started state.
      </div>
    </div>
  );
}

function SecurityRequirementPanel() {
  return (
    <div>
      <SectionTitle>Security Requirements</SectionTitle>
      <LockBanner msg="security_provider_connected: false - SSO/MFA activation is Phase D.6" />
      <div style={{ color: TEXT, fontSize: 12, marginTop: 8 }}>
        Security provider activation requires SOC 2, DPA, and platform security review.
        No security provider is connected. SSO and MFA are not active.
      </div>
    </div>
  );
}

function ActivationStatusPanel() {
  return (
    <div>
      <SectionTitle>Activation Status</SectionTitle>
      <LockBanner msg="All providers: not_started or credentials_required - not live" />
      {CANDIDATES.map(c => (
        <HonestState key={c.provider_key} label={c.provider_key} state={c.activation_status} detail={`provider_connected: false - live_mode_enabled: false`} />
      ))}
    </div>
  );
}

function TestStatusPanel() {
  return (
    <div>
      <SectionTitle>Test Status</SectionTitle>
      <LockBanner msg="test_status: not_started for all - no provider ready for testing" />
      <div style={{ color: TEXT, fontSize: 12, marginTop: 8 }}>
        No provider has reached test-ready state. All test statuses are not_started.
        Test plans must be documented before any provider can be tested.
      </div>
    </div>
  );
}

function VerificationStatusPanel() {
  return (
    <div>
      <SectionTitle>Verification Status</SectionTitle>
      <LockBanner msg="verification_status: not_started - verification_completed: false" />
      <div style={{ color: TEXT, fontSize: 12, marginTop: 8 }}>
        No provider verification has been completed. External verification requires a live provider
        in a staging or production environment. No environment is currently deployed.
      </div>
    </div>
  );
}

function RollbackPanel() {
  return (
    <div>
      <SectionTitle>Rollback Records</SectionTitle>
      <LockBanner msg="rollback_status: not_ready - rollback_ready: false for all providers" />
      <div style={{ color: TEXT, fontSize: 12, marginTop: 8 }}>
        Rollback plans must be documented and verified before any provider activation can proceed.
        No rollback plans exist yet.
      </div>
    </div>
  );
}

function FailureRecordPanel() {
  return (
    <div>
      <SectionTitle>Failure Records</SectionTitle>
      <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 6, padding: '14px', textAlign: 'center' }}>
        <div style={{ color: MUTE, fontSize: 12 }}>No failure records. No provider has been activated yet.</div>
      </div>
    </div>
  );
}

function ProviderReadinessMatrixPanel() {
  return (
    <div>
      <SectionTitle>Provider Readiness Matrix</SectionTitle>
      <LockBanner msg="readiness_status: provider_required for all live providers - foundation_ready for manual_fallback" />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${LINE}` }}>
              {['Provider','Category','Readiness','Connected','Creds','Activated','Live Mode'].map(h => (
                <th key={h} style={{ color: MUTE, textAlign: 'left', padding: '6px 8px', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CANDIDATES.map(c => (
              <tr key={c.provider_key} style={{ borderBottom: `1px solid ${LINE}22` }}>
                <td style={{ color: TEXT, padding: '6px 8px' }}>{c.provider_key}</td>
                <td style={{ color: MUTE, padding: '6px 8px' }}>{c.provider_category}</td>
                <td style={{ padding: '6px 8px' }}><StatusPill label="provider_required" color={AMBER} /></td>
                <td style={{ color: RED, padding: '6px 8px' }}>false</td>
                <td style={{ color: RED, padding: '6px 8px' }}>false</td>
                <td style={{ color: RED, padding: '6px 8px' }}>false</td>
                <td style={{ color: RED, padding: '6px 8px' }}>false</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SafeActivationClaimsPanel() {
  return (
    <div>
      <SectionTitle>Safe Activation Claims</SectionTitle>
      <FoundationBanner msg="These claims are safe to make." />
      {SAFE_CLAIMS.map((c, i) => (
        <div key={i} style={{ background: '#0d1f14', border: `1px solid ${GREEN}`, borderRadius: 6, padding: '8px 14px', marginTop: 6, color: GREEN, fontSize: 12 }}>
          {c}
        </div>
      ))}
    </div>
  );
}

function UnsafeActivationClaimsPanel() {
  return (
    <div>
      <SectionTitle>Unsafe Activation Claims</SectionTitle>
      <LockBanner msg="These claims must NOT be made - Phase D activation required." />
      {UNSAFE_CLAIMS.map((c, i) => (
        <div key={i} style={{ background: '#1a0d0d', border: `1px solid ${RED}`, borderRadius: 6, padding: '8px 14px', marginTop: 6 }}>
          <div style={{ color: RED, fontWeight: 700, fontSize: 12 }}>{c.claim}</div>
          <div style={{ color: MUTE, fontSize: 11, marginTop: 2 }}>{c.reason}</div>
        </div>
      ))}
    </div>
  );
}

function HonestActivationLimitationsPanel() {
  return (
    <div>
      <SectionTitle>Honest Limitations</SectionTitle>
      <LockBanner msg="All limitations below are active. Phase D activation required for any live state." />
      {HONEST_LIMITATIONS.map((l, i) => (
        <div key={i} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 6, padding: '8px 14px', marginTop: 6, color: MUTE, fontSize: 12 }}>
          {l}
        </div>
      ))}
    </div>
  );
}

function PhaseDRoadmapPanel() {
  return (
    <div>
      <SectionTitle>Phase D Roadmap</SectionTitle>
      {PHASE_D_ROADMAP.map(p => (
        <div key={p.phase} style={{
          background: p.status === 'current' ? '#0d1a10' : p.status === 'next' ? CARD : CARD,
          border: `1px solid ${p.status === 'current' ? GREEN : p.status === 'next' ? GOLD : LINE}`,
          borderRadius: 6, padding: '10px 14px', marginBottom: 6,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ color: GOLD, fontWeight: 900, minWidth: 40 }}>{p.phase}</div>
          <div style={{ flex: 1, color: TEXT, fontWeight: 600, fontSize: 13 }}>{p.name}</div>
          <StatusPill
            label={p.status === 'current' ? 'Current' : p.status === 'next' ? 'Next' : 'Not Started'}
            color={p.status === 'current' ? GREEN : p.status === 'next' ? GOLD : MUTE}
          />
        </div>
      ))}
    </div>
  );
}

function PhaseDLanguageSelector() {
  const langs = ['en-US', 'es-DO', 'es', 'ht', 'de', 'pt'];
  return (
    <div>
      <SectionTitle>Language Support</SectionTitle>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {langs.map(l => (
          <div key={l} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 6, padding: '6px 14px', color: TEXT, fontSize: 12 }}>{l}</div>
        ))}
      </div>
    </div>
  );
}

function NoSecretsStoredPanel() {
  return (
    <div>
      <SectionTitle>No Secrets Stored</SectionTitle>
      <FoundationBanner msg="contains_secrets: false - stores_secrets: false at all layers." />
      <div style={{ color: TEXT, fontSize: 12, marginTop: 8 }}>
        This system never stores, accepts, or exposes credentials, API keys, tokens, passwords,
        or any other sensitive data. Credential placeholders track state only - not values.
      </div>
    </div>
  );
}

function HonestProviderActivationStatePanel() {
  return <HonestState label="Provider Activation" state="not_live - activation_required" detail="provider_connected: false - Phase D activation required" />;
}
function HonestCredentialVerificationStatePanel() {
  return <HonestState label="Credential Verification" state="not_live - verification_required" detail="credentials_verified: false - external provider setup required" />;
}
function HonestPaymentProcessingStatePanel() {
  return <HonestState label="Payment Processing" state="not_live - activation_required" detail="payment_processed: false - Phase D.2 required" />;
}
function HonestBillingConnectionStatePanel() {
  return <HonestState label="Billing Connection" state="not_live - activation_required" detail="billing_connected: false - Phase D.2 required" />;
}
function HonestExternalPOSSyncStatePanel() {
  return <HonestState label="External POS Sync" state="not_live - activation_required" detail="pos_sync_enabled: false - Phase D.3 required" />;
}
function HonestInventorySyncStatePanel() {
  return <HonestState label="Inventory Sync" state="not_live - activation_required" detail="inventory_sync_enabled: false - Phase D.4 required" />;
}
function HonestNotificationDeliveryStatePanel() {
  return <HonestState label="Notification Delivery" state="not_live - activation_required" detail="notification_delivery_enabled: false - Phase D.5 required" />;
}
function HonestSecurityProviderStatePanel() {
  return <HonestState label="Security Provider" state="not_live - activation_required" detail="security_provider_connected: false - Phase D.6 required" />;
}
function HonestDeploymentStatePanel() {
  return <HonestState label="Deployment" state="not_live - activation_required" detail="deployment_completed: false - Phase D.7 required" />;
}
function HonestMarketplaceTransactionStatePanel() {
  return <HonestState label="Marketplace Transactions" state="not_live - activation_required" detail="marketplace_transaction_enabled: false - Phase D.8 required" />;
}
function HonestLiveModeStatePanel() {
  return <HonestState label="Live Mode" state="not_live - activation_required" detail="live_mode_enabled: false - all Phase D activations required" />;
}

function EmptyProviderActivationStatePanel() {
  return (
    <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 8, padding: 24, textAlign: 'center' }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No Provider Activation Records</div>
      <div style={{ color: MUTE, fontSize: 12 }}>Platform activation is Phase D. No provider is connected.</div>
      <div style={{ color: MUTE, fontSize: 11, marginTop: 6 }}>provider_connected: false - live_mode_enabled: false</div>
    </div>
  );
}

function HonestStatesPanel() {
  return (
    <div>
      <SectionTitle>Honest Provider States</SectionTitle>
      <LockBanner msg="All provider states: not_live - activation_required" />
      <HonestProviderActivationStatePanel />
      <HonestCredentialVerificationStatePanel />
      <HonestPaymentProcessingStatePanel />
      <HonestBillingConnectionStatePanel />
      <HonestExternalPOSSyncStatePanel />
      <HonestInventorySyncStatePanel />
      <HonestNotificationDeliveryStatePanel />
      <HonestSecurityProviderStatePanel />
      <HonestDeploymentStatePanel />
      <HonestMarketplaceTransactionStatePanel />
      <HonestLiveModeStatePanel />
    </div>
  );
}

const PANELS = {
  hero:          <PhaseDHeroPanel />,
  roadmap:       <PhaseDRoadmapPanel />,
  categories:    <ProviderCategoryPanel />,
  candidates:    <ProviderCandidatePanel />,
  order:         <ActivationOrderPanel />,
  dependencies:  <ProviderDependencyPanel />,
  credentials:   <CredentialPlaceholderPanel />,
  prerequisites: <ProviderPrerequisitePanel />,
  blockers:      <ProviderBlockerPanel />,
  legal:         <LegalRequirementPanel />,
  billing:       <BillingRequirementPanel />,
  security:      <SecurityRequirementPanel />,
  'act-status':  <ActivationStatusPanel />,
  'test-status': <TestStatusPanel />,
  'verif-status':<VerificationStatusPanel />,
  rollback:      <RollbackPanel />,
  failure:       <FailureRecordPanel />,
  matrix:        <ProviderReadinessMatrixPanel />,
  'safe-claims': <SafeActivationClaimsPanel />,
  'unsafe-claims':<UnsafeActivationClaimsPanel />,
  honest:        <HonestActivationLimitationsPanel />,
  'no-secrets':  <NoSecretsStoredPanel />,
  language:      <PhaseDLanguageSelector />,
  empty:         <EmptyProviderActivationStatePanel />,
};

function PhaseDProviderActivationShell() {
  const [tab, setTab] = useState('hero');
  return (
    <div style={{ background: NAVY, minHeight: '100vh', color: TEXT, fontFamily: "'Inter','SF Pro Display',sans-serif" }}>
      <div style={{ background: CHARCOAL, borderBottom: `1px solid ${LINE}`, padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: GOLD, fontWeight: 900, fontSize: 16 }}>NOVEE OS - Phase D.1</div>
          <div style={{ color: MUTE, fontSize: 10 }}>Provider Activation Roadmap Command Center</div>
        </div>
        <div style={{ color: MUTE, fontSize: 10 }} dangerouslySetInnerHTML={{ __html: DEVICE_LINE }} />
      </div>
      <div style={{ display: 'flex', height: 'calc(100vh - 50px)' }}>
        <div style={{ width: 200, background: CHARCOAL, borderRight: `1px solid ${LINE}`, overflowY: 'auto', flexShrink: 0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', border: 'none', cursor: 'pointer',
              background: tab === t.id ? CARD : 'transparent',
              color: tab === t.id ? GOLD : MUTE, fontSize: 12, fontWeight: tab === t.id ? 700 : 400,
              borderLeft: tab === t.id ? `3px solid ${GOLD}` : '3px solid transparent',
            }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {PANELS[tab] || <EmptyProviderActivationStatePanel />}
        </div>
      </div>
    </div>
  );
}

function PhaseDProviderActivation() {
  return <PhaseDProviderActivationShell />;
}

export default PhaseDProviderActivation;
