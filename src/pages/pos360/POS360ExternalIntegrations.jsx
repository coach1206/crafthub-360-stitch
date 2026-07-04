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
  'Provider Profiles',
  'POS Overlay Connectors',
  'Capability Registry',
  'Readiness Checks',
  'Credential Metadata',
  'Webhook Endpoints',
  'Webhook Intake Log',
  'Sync Job Definitions',
  'Sync Job Runs',
  'Retry Policies',
  'Sync Error Logs',
  'Conflict Records',
  'Reconciliation',
  'Data Mapping Profiles',
  'Data Mapping Rules',
  'Import Batches',
  'Export Batches',
  'Data Lineage',
  'E.A.T. Sync Visibility',
  'SmokeCraft Sync Visibility',
  'Offline Queue',
  'Integration Audit Log',
];

function HonestBadge({ label }) {
  return (
    <span style={{ background: DARK_LINE, color: DARK_MUTE, fontSize: 11, padding: '2px 8px', borderRadius: 4, marginRight: 6 }}>
      {label}
    </span>
  );
}

function SectionCard({ title, children }) {
  return (
    <div style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, marginBottom: 12, fontSize: 15 }}>{title}</div>
      {children}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div style={{ color: DARK_MUTE, padding: '24px 0', textAlign: 'center', fontSize: 13 }}>
      {message}
    </div>
  );
}

function ProviderProfilesPanel() {
  return (
    <SectionCard title="External Provider Profiles">
      <div style={{ marginBottom: 10 }}>
        <HonestBadge label="provider_connected: false" />
        <HonestBadge label="stores_secrets: false" />
        <HonestBadge label="contains_secrets: false" />
      </div>
      <EmptyState message="No provider profiles configured. provider_connected remains FALSE until a verified external connection is established." />
      <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 8 }}>
        Supported providers: Toast · Clover · Square · Lightspeed · Shopify POS · Oracle Micros · NCR · Revel · TouchBistro · Stripe · Adyen · QuickBooks · Xero · Gusto · ADP · Mailchimp · Twilio · SendGrid · OpenTable-style · Looker · PowerBI · Tableau · Manual CSV · E.A.T. · SmokeCraft
      </div>
    </SectionCard>
  );
}

function OverlayConnectorsPanel() {
  return (
    <SectionCard title="POS Overlay Connectors">
      <div style={{ marginBottom: 10 }}>
        <HonestBadge label="connector_connected: false" />
      </div>
      <EmptyState message="No overlay connectors configured. connector_connected remains FALSE until a verified POS overlay connection is active." />
      <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 8 }}>
        Overlay modes: Read-only · Write-through · Bidirectional · Manual
      </div>
    </SectionCard>
  );
}

function CapabilityRegistryPanel() {
  return (
    <SectionCard title="Provider Capability Registry">
      <EmptyState message="No capabilities registered. Select a provider to view its supported capabilities." />
      <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 8 }}>
        Capability groups: Orders · Payments · Menu · Inventory · Customers · Staff · Reservations · Reports · Loyalty · KDS · Webhooks · Sync · Export · Import
      </div>
    </SectionCard>
  );
}

function ReadinessChecksPanel() {
  return (
    <SectionCard title="Provider Readiness Checks">
      <div style={{ marginBottom: 10 }}>
        <HonestBadge label="contains_secrets: false" />
      </div>
      <EmptyState message="No readiness results recorded. Readiness checks do not store secrets — contains_secrets: false." />
    </SectionCard>
  );
}

function CredentialMetadataPanel() {
  return (
    <SectionCard title="Integration Credential Metadata">
      <div style={{ marginBottom: 10 }}>
        <HonestBadge label="stores_secrets: false" />
        <HonestBadge label="contains_secrets: false" />
      </div>
      <EmptyState message="No credential metadata records. Raw credentials are never stored — stores_secrets: false, contains_secrets: false." />
      <div style={{ color: AMBER, fontSize: 12, marginTop: 8 }}>
        Only metadata references (key type, label, expiry) are stored. Actual API keys, tokens, and passwords are never written to this system.
      </div>
    </SectionCard>
  );
}

function WebhookEndpointsPanel() {
  return (
    <SectionCard title="Webhook Endpoint Contracts">
      <div style={{ marginBottom: 10 }}>
        <HonestBadge label="webhook_verified: false" />
        <HonestBadge label="signature_verified: false" />
      </div>
      <EmptyState message="No webhook endpoints configured. webhook_verified remains FALSE until signature verification is confirmed by the external provider." />
      <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 8 }}>
        Webhook types: Inbound · Outbound · Bidirectional
      </div>
    </SectionCard>
  );
}

function WebhookIntakePanel() {
  return (
    <SectionCard title="Webhook Event Intake Log">
      <div style={{ marginBottom: 10 }}>
        <HonestBadge label="webhook_verified: false" />
        <HonestBadge label="signature_verified: false" />
      </div>
      <EmptyState message="No webhook events received. Events are logged with signature_verified: false until verified by provider signature." />
    </SectionCard>
  );
}

function SyncJobDefinitionsPanel() {
  return (
    <SectionCard title="Sync Job Definitions">
      <EmptyState message="No sync job definitions configured. Define source and target systems to register a sync job." />
      <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 8 }}>
        Sync types: Full · Incremental · Delta · Manual · Scheduled
      </div>
    </SectionCard>
  );
}

function SyncJobRunsPanel() {
  return (
    <SectionCard title="Sync Job Runs">
      <div style={{ marginBottom: 10 }}>
        <HonestBadge label="sync_completed: false" />
      </div>
      <EmptyState message="No sync runs recorded. sync_completed remains FALSE — no fake sync success is reported." />
    </SectionCard>
  );
}

function RetryPoliciesPanel() {
  return (
    <SectionCard title="Sync Retry Policies">
      <EmptyState message="No retry policies configured." />
      <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 8 }}>
        Retry strategies: Fixed · Exponential · Linear · None
      </div>
    </SectionCard>
  );
}

function SyncErrorLogsPanel() {
  return (
    <SectionCard title="Sync Error Logs">
      <EmptyState message="No sync errors logged." />
    </SectionCard>
  );
}

function ConflictRecordsPanel() {
  return (
    <SectionCard title="Sync Conflict Records">
      <EmptyState message="No conflict records. Conflicts are logged when source and target values diverge." />
      <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 8 }}>
        Conflict types: Duplicate record · Schema mismatch · Value conflict · Missing reference · Validation error
      </div>
    </SectionCard>
  );
}

function ReconciliationPanel() {
  return (
    <SectionCard title="Sync Reconciliation Records">
      <div style={{ marginBottom: 10 }}>
        <HonestBadge label="reconciliation_completed: false" />
      </div>
      <EmptyState message="No reconciliation records. reconciliation_completed remains FALSE — no fake reconciliation results." />
      <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 8 }}>
        Reconciliation types: Order · Payment · Inventory · Customer · Staff · Menu · Loyalty · Manual
      </div>
    </SectionCard>
  );
}

function DataMappingProfilesPanel() {
  return (
    <SectionCard title="Data Mapping Profiles">
      <EmptyState message="No data mapping profiles configured." />
      <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 8 }}>
        Entity types: Order · Payment · Menu Item · Modifier · Category · Customer · Staff · Table · Inventory · Loyalty · Voucher
      </div>
    </SectionCard>
  );
}

function DataMappingRulesPanel() {
  return (
    <SectionCard title="Data Mapping Rules">
      <EmptyState message="Select a mapping profile to view its rules." />
      <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 8 }}>
        Transform types: Direct · Lookup · Formula · Template · Conditional · Aggregate
      </div>
    </SectionCard>
  );
}

function ImportBatchesPanel() {
  return (
    <SectionCard title="Import Batch Records">
      <div style={{ marginBottom: 10 }}>
        <HonestBadge label="import_completed: false" />
      </div>
      <EmptyState message="No import batches. import_completed remains FALSE — no fake import success is reported." />
      <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 8 }}>
        Import types: Order · Menu · Inventory · Customer · Staff · Loyalty · Voucher · Manual CSV
      </div>
    </SectionCard>
  );
}

function ExportBatchesPanel() {
  return (
    <SectionCard title="Export Batch Records">
      <div style={{ marginBottom: 10 }}>
        <HonestBadge label="export_completed: false" />
      </div>
      <EmptyState message="No export batches. export_completed remains FALSE — no fake export completion is reported." />
      <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 8 }}>
        Export types: Order · Payment · Menu · Inventory · Customer · Staff · Loyalty · Audit · Report · Manual CSV
      </div>
    </SectionCard>
  );
}

function DataLineagePanel() {
  return (
    <SectionCard title="Data Lineage Records">
      <EmptyState message="No data lineage records. Lineage is tracked per entity operation between source and target systems." />
    </SectionCard>
  );
}

function EatVisibilityPanel() {
  return (
    <SectionCard title="E.A.T. Sync Visibility">
      <div style={{ marginBottom: 10 }}>
        <HonestBadge label="contains_ai_generated_content: false" />
      </div>
      <EmptyState message="No E.A.T. sync visibility records. contains_ai_generated_content: false — no AI-generated data is surfaced here." />
      <div style={{ color: AMBER, fontSize: 12, marginTop: 8 }}>
        E.A.T. module sync visibility is read-only. No AI-generated content is injected.
      </div>
    </SectionCard>
  );
}

function SmokecraftVisibilityPanel() {
  return (
    <SectionCard title="SmokeCraft Sync Visibility">
      <div style={{ marginBottom: 10 }}>
        <HonestBadge label="sync_connected: false" />
      </div>
      <EmptyState message="No SmokeCraft sync visibility records. sync_connected: false — SmokeCraft sync is not active." />
      <div style={{ color: AMBER, fontSize: 12, marginTop: 8 }}>
        SmokeCraft module progression locks, stamp rules, and VISIT_STRUCTURE are NOT modified by this panel.
      </div>
    </SectionCard>
  );
}

function OfflineQueuePanel() {
  return (
    <SectionCard title="Integration Offline Queue">
      <EmptyState message="No offline queue items pending." />
    </SectionCard>
  );
}

function AuditLogPanel() {
  return (
    <SectionCard title="Integration Audit Log">
      <div style={{ marginBottom: 10 }}>
        <HonestBadge label="contains_secrets: false" />
        <HonestBadge label="stores_secrets: false" />
        <HonestBadge label="exposes_private_data: true" />
        <HonestBadge label="exposes_financial_data: true" />
      </div>
      <EmptyState message="No audit entries yet. All audit records are written with contains_secrets: false and stores_secrets: false." />
    </SectionCard>
  );
}

const PANELS = [
  ProviderProfilesPanel,
  OverlayConnectorsPanel,
  CapabilityRegistryPanel,
  ReadinessChecksPanel,
  CredentialMetadataPanel,
  WebhookEndpointsPanel,
  WebhookIntakePanel,
  SyncJobDefinitionsPanel,
  SyncJobRunsPanel,
  RetryPoliciesPanel,
  SyncErrorLogsPanel,
  ConflictRecordsPanel,
  ReconciliationPanel,
  DataMappingProfilesPanel,
  DataMappingRulesPanel,
  ImportBatchesPanel,
  ExportBatchesPanel,
  DataLineagePanel,
  EatVisibilityPanel,
  SmokecraftVisibilityPanel,
  OfflineQueuePanel,
  AuditLogPanel,
];

export default function POS360ExternalIntegrations() {
  const [activeTab, setActiveTab] = useState(0);
  const Panel = PANELS[activeTab];

  return (
    <div style={{ minHeight: '100vh', background: DARK_BG, color: DARK_TEXT, fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${DARK_LINE}`, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <img src="/smokecraft-pos360.png" alt="POS360" style={{ width: 36, height: 36, objectFit: 'contain' }} />
        <div>
          <div style={{ color: GOLD, fontWeight: 800, fontSize: 18 }}>POS360 — External Integrations & Sync Governance</div>
          <div style={{ color: DARK_MUTE, fontSize: 12 }}>Touchscreen · Handheld · Tablet · Desktop</div>
        </div>
        <img src="/smokecraft-pos360.png" alt="SmokeCraft POS360" style={{ width: 28, height: 28, objectFit: 'contain', marginLeft: 'auto', opacity: 0.6 }} />
      </div>

      {/* Honest state banner */}
      <div style={{ background: '#1a1208', borderBottom: `1px solid ${DARK_LINE}`, padding: '8px 24px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <HonestBadge label="provider_connected: false" />
        <HonestBadge label="connector_connected: false" />
        <HonestBadge label="webhook_verified: false" />
        <HonestBadge label="sync_completed: false" />
        <HonestBadge label="import_completed: false" />
        <HonestBadge label="export_completed: false" />
        <HonestBadge label="reconciliation_completed: false" />
        <HonestBadge label="contains_ai_generated_content: false" />
        <HonestBadge label="sync_connected: false" />
        <HonestBadge label="stores_secrets: false" />
      </div>

      {/* Tab Bar */}
      <div style={{ borderBottom: `1px solid ${DARK_LINE}`, padding: '0 24px', overflowX: 'auto', display: 'flex' }}>
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === i ? `2px solid ${GOLD}` : '2px solid transparent',
              color: activeTab === i ? GOLD : DARK_MUTE,
              padding: '12px 14px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: activeTab === i ? 700 : 400,
              whiteSpace: 'nowrap',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Panel Content */}
      <div style={{ padding: '24px' }}>
        <Panel />
      </div>
    </div>
  );
}
