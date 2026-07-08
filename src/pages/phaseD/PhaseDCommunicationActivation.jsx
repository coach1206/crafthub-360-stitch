// contains_secrets: false — no credentials, no API keys, no secrets in UI layer
import React, { useState } from 'react'
import { tPhaseDCommunicationActivation as t } from '../../locales/phaseDCommunicationActivation.js'

const NAVY     = '#0a0d14'
const CHARCOAL = '#111520'
const CARD     = '#161b27'
const LINE     = '#252d3f'
const GOLD     = '#c9952c'
const GOLD2    = '#e8b84b'
const TEXT     = '#e8e4d8'
const MUTE     = '#7a8299'
const RED      = '#c0392b'
const GREEN    = '#27ae60'
const AMBER    = '#e67e22'

const DEVICE_LINE = 'Touchscreen &middot; Handheld &middot; Tablet &middot; Desktop'

const styles = {
  shell:   { minHeight: '100vh', background: NAVY, color: TEXT, fontFamily: 'monospace', padding: '0 0 80px' },
  header:  { background: CHARCOAL, borderBottom: `1px solid ${LINE}`, padding: '18px 28px', display: 'flex', alignItems: 'center', gap: 14 },
  dot:     { width: 10, height: 10, borderRadius: '50%', background: GOLD, flexShrink: 0 },
  title:   { color: GOLD2, fontWeight: 700, fontSize: 18, margin: 0 },
  sub:     { color: MUTE, fontSize: 12, margin: 0 },
  body:    { maxWidth: 1100, margin: '0 auto', padding: '28px 20px' },
  section: { marginBottom: 32 },
  sh:      { color: GOLD, fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, borderBottom: `1px solid ${LINE}`, paddingBottom: 6 },
  grid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 },
  card:    { background: CARD, border: `1px solid ${LINE}`, borderRadius: 6, padding: '14px 16px' },
  label:   { color: MUTE, fontSize: 11, marginBottom: 4 },
  val:     { color: TEXT, fontSize: 13, fontWeight: 600 },
  badge:   (c) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: c + '22', color: c, border: `1px solid ${c}44` }),
  row:     { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
  banner:  { background: RED + '18', border: `1px solid ${RED}55`, borderRadius: 6, padding: '14px 18px', marginBottom: 24 },
  bannerT: { color: RED, fontWeight: 700, fontSize: 13, marginBottom: 8 },
  warn:    { color: TEXT, fontSize: 12, marginBottom: 4 },
  lockBox: { background: CHARCOAL, border: `1px solid ${LINE}`, borderRadius: 6, padding: '14px 16px', marginBottom: 8 },
  lockLbl: { color: MUTE, fontSize: 11, marginBottom: 4 },
  lockVal: { color: RED, fontSize: 13, fontWeight: 700 },
}

const PROVIDERS = [
  { key: 'sendgrid',               label: 'SendGrid',               channel: 'Email' },
  { key: 'mailgun',                label: 'Mailgun',                channel: 'Email' },
  { key: 'twilio',                 label: 'Twilio',                 channel: 'SMS' },
  { key: 'firebase_cloud_messaging',label: 'Firebase Cloud Messaging',channel: 'Push' },
  { key: 'onesignal',              label: 'OneSignal',              channel: 'Push' },
  { key: 'manual_email',           label: 'Manual Email',           channel: 'Email' },
  { key: 'manual_sms',             label: 'Manual SMS',             channel: 'SMS' },
  { key: 'in_app',                 label: 'In-App',                 channel: 'In-App' },
  { key: 'staff_alert_center',     label: 'Staff Alert Center',     channel: 'Internal' },
  { key: 'future_provider',        label: 'Future Provider',        channel: 'TBD' },
]

const CHANNELS = [
  'email', 'sms', 'push_notifications', 'in_app_notifications',
  'staff_alerts', 'manager_alerts', 'guest_messaging',
  'vendor_messaging', 'system_alerts', 'security_alerts',
]

const AREAS = [
  'staff_alert', 'manager_alert', 'guest_message', 'vendor_message',
  'inventory_alert', 'payment_alert', 'pos_order_alert', 'reservation_alert',
  'loyalty_message', 'passport_message', 'smokecraft_message', 'crafthub_message',
  'eat_command_alert', 'security_alert', 'system_health_alert',
  'marketplace_message', 'campaign_message', 'manual_message',
  'opt_in_management', 'compliance_and_risk',
]

function SafetyBanner() {
  return (
    <div style={styles.banner}>
      <div style={styles.bannerT}>PHASE D.5 — BUILD ONLY — NO REAL MESSAGE DELIVERY</div>
      <div style={styles.warn}>Do NOT send real emails. Do NOT send real SMS messages.</div>
      <div style={styles.warn}>Do NOT send real push notifications. Do NOT send real vendor messages.</div>
      <div style={styles.warn}>Do NOT send real guest messages. Do NOT send real staff alerts.</div>
      <div style={styles.warn}>Do NOT send real security alerts.</div>
      <div style={styles.warn}>Do NOT claim delivery succeeded unless a real provider response exists.</div>
      <div style={styles.warn}>Do NOT fake delivery confirmations. Do NOT fake provider connections.</div>
      <div style={styles.warn}>Do NOT store provider API keys, SMTP passwords, or messaging credentials.</div>
      <div style={styles.warn}>This phase registers providers, channels, and areas — it does NOT activate live delivery.</div>
    </div>
  )
}

function LiveDeliveryLockPanel() {
  const locks = [
    ['COMMUNICATION_REAL_EMAIL_DELIVERY_ENABLED',   false],
    ['COMMUNICATION_REAL_SMS_DELIVERY_ENABLED',     false],
    ['COMMUNICATION_REAL_PUSH_DELIVERY_ENABLED',    false],
    ['COMMUNICATION_REAL_VENDOR_MESSAGE_DELIVERY_ENABLED', false],
    ['COMMUNICATION_REAL_GUEST_MESSAGE_DELIVERY_ENABLED',  false],
    ['COMMUNICATION_REAL_STAFF_ALERT_DELIVERY_ENABLED',    false],
    ['COMMUNICATION_AUTO_SEND_ENABLED',             false],
    ['COMMUNICATION_SENDGRID_CONNECTED',            false],
    ['COMMUNICATION_MAILGUN_CONNECTED',             false],
    ['COMMUNICATION_TWILIO_CONNECTED',              false],
    ['COMMUNICATION_FIREBASE_CONNECTED',            false],
    ['COMMUNICATION_ONESIGNAL_CONNECTED',           false],
    ['COMMUNICATION_EXTERNAL_PROVIDER_WEBHOOK_PROCESSING_ENABLED', false],
  ]
  return (
    <div style={styles.section}>
      <div style={styles.sh}>Live Delivery Lock</div>
      <div style={styles.grid}>
        {locks.map(([flag, val]) => (
          <div key={flag} style={styles.lockBox}>
            <div style={styles.lockLbl}>{flag}</div>
            <div style={styles.lockVal}>{String(val).toUpperCase()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProviderRegistryPanel() {
  return (
    <div style={styles.section}>
      <div style={styles.sh}>Provider Registry (10 providers — none connected)</div>
      <div style={styles.grid}>
        {PROVIDERS.map(p => (
          <div key={p.key} style={styles.card}>
            <div style={styles.row}>
              <div style={styles.dot} />
              <span style={{ color: TEXT, fontWeight: 600, fontSize: 13 }}>{p.label}</span>
            </div>
            <div style={styles.label}>Channel</div>
            <div style={styles.val}>{p.channel}</div>
            <div style={{ marginTop: 8 }}>
              <span style={styles.badge(RED)}>NOT CONNECTED</span>
            </div>
            <div style={{ marginTop: 6 }}>
              <span style={styles.badge(AMBER)}>NO SECRETS STORED</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChannelRegistryPanel() {
  return (
    <div style={styles.section}>
      <div style={styles.sh}>Channel Registry (10 channels)</div>
      <div style={styles.grid}>
        {CHANNELS.map(ch => (
          <div key={ch} style={styles.card}>
            <div style={styles.val}>{ch.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
            <div style={{ marginTop: 8 }}>
              <span style={styles.badge(AMBER)}>REGISTERED — NO LIVE DELIVERY</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AreaRegistryPanel() {
  return (
    <div style={styles.section}>
      <div style={styles.sh}>Message Area Registry (20 areas)</div>
      <div style={styles.grid}>
        {AREAS.map(a => (
          <div key={a} style={styles.card}>
            <div style={styles.val}>{a.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
            <div style={{ marginTop: 8 }}>
              <span style={styles.badge(AMBER)}>BUILD ONLY</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TemplateRegistryPanel() {
  return (
    <div style={styles.section}>
      <div style={styles.sh}>Template Registry</div>
      <div style={styles.grid}>
        {['Template Registry', 'Template Versions', 'Template Approvals'].map(label => (
          <div key={label} style={styles.card}>
            <div style={styles.val}>{label}</div>
            <div style={{ marginTop: 8 }}><span style={styles.badge(GREEN)}>ENABLED</span></div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MessagePreviewPanel() {
  return (
    <div style={styles.section}>
      <div style={styles.sh}>Message & Queue Previews</div>
      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.val}>Message Previews</div>
          <div style={{ marginTop: 4, color: MUTE, fontSize: 11 }}>preview_only: true — NOT sent messages</div>
          <div style={{ marginTop: 8 }}><span style={styles.badge(GREEN)}>ENABLED</span></div>
        </div>
        <div style={styles.card}>
          <div style={styles.val}>Queue Previews</div>
          <div style={{ marginTop: 4, color: MUTE, fontSize: 11 }}>is_real_queue: false — NOT live delivery queues</div>
          <div style={{ marginTop: 8 }}><span style={styles.badge(GREEN)}>ENABLED</span></div>
        </div>
      </div>
    </div>
  )
}

function DeliveryRecordsPanel() {
  return (
    <div style={styles.section}>
      <div style={styles.sh}>Delivery Records</div>
      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.val}>Delivery Attempt Records</div>
          <div style={{ marginTop: 4, color: MUTE, fontSize: 11 }}>real_delivery_attempted: false always</div>
          <div style={{ marginTop: 8 }}><span style={styles.badge(GREEN)}>ENABLED</span></div>
        </div>
        <div style={styles.card}>
          <div style={styles.val}>Delivery Status Records</div>
          <div style={{ marginTop: 4, color: MUTE, fontSize: 11 }}>delivered: false unless real provider response</div>
          <div style={{ marginTop: 8 }}><span style={styles.badge(GREEN)}>ENABLED</span></div>
        </div>
      </div>
    </div>
  )
}

function RecipientOptPanel() {
  return (
    <div style={styles.section}>
      <div style={styles.sh}>Recipients &amp; Opt-In/Out</div>
      <div style={styles.grid}>
        {['Recipient Groups', 'Opt-In Profiles', 'Opt-Out Records'].map(label => (
          <div key={label} style={styles.card}>
            <div style={styles.val}>{label}</div>
            <div style={{ marginTop: 8 }}><span style={styles.badge(GREEN)}>ENABLED</span></div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RateLimitsPanel() {
  return (
    <div style={styles.section}>
      <div style={styles.sh}>Rate Limits &amp; Quiet Hours</div>
      <div style={styles.grid}>
        {['Rate Limit Profiles', 'Quiet Hour Profiles'].map(label => (
          <div key={label} style={styles.card}>
            <div style={styles.val}>{label}</div>
            <div style={{ marginTop: 8 }}><span style={styles.badge(GREEN)}>ENABLED</span></div>
          </div>
        ))}
      </div>
    </div>
  )
}

function WebhookPanel() {
  return (
    <div style={styles.section}>
      <div style={styles.sh}>Webhook Health</div>
      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.val}>Webhook Registry</div>
          <div style={{ marginTop: 8 }}><span style={styles.badge(GREEN)}>ENABLED</span></div>
        </div>
        <div style={styles.card}>
          <div style={styles.val}>Webhook Health</div>
          <div style={{ marginTop: 4, color: MUTE, fontSize: 11 }}>No external webhook processing active</div>
          <div style={{ marginTop: 8 }}><span style={styles.badge(AMBER)}>MONITORING ONLY</span></div>
        </div>
      </div>
    </div>
  )
}

function TenantModulePanel() {
  return (
    <div style={styles.section}>
      <div style={styles.sh}>Tenant &amp; Module Mappings</div>
      <div style={styles.grid}>
        {['Tenant Mappings', 'Module Mappings'].map(label => (
          <div key={label} style={styles.card}>
            <div style={styles.val}>{label}</div>
            <div style={{ marginTop: 8 }}><span style={styles.badge(GREEN)}>ENABLED</span></div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ComplianceRiskPanel() {
  return (
    <div style={styles.section}>
      <div style={styles.sh}>Compliance &amp; Risk</div>
      <div style={styles.grid}>
        {['Compliance Checklist', 'Risk Flags', 'Audit Log'].map(label => (
          <div key={label} style={styles.card}>
            <div style={styles.val}>{label}</div>
            <div style={{ marginTop: 8 }}><span style={styles.badge(GREEN)}>ENABLED</span></div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReadinessSummaryPanel() {
  const checks = [
    ['Real Email Delivery',        false],
    ['Real SMS Delivery',          false],
    ['Real Push Delivery',         false],
    ['Real Vendor Message Delivery', false],
    ['Real Guest Message Delivery',  false],
    ['Real Staff Alert Delivery',    false],
    ['Auto-Send Enabled',          false],
    ['No Secret Storage',          true],
    ['No Fake Delivery',           true],
    ['No Fake Provider Connection',true],
  ]
  return (
    <div style={styles.section}>
      <div style={styles.sh}>Readiness Summary</div>
      <div style={styles.grid}>
        {checks.map(([label, val]) => (
          <div key={label} style={styles.card}>
            <div style={styles.label}>{label}</div>
            <span style={styles.badge(val ? GREEN : RED)}>{val ? 'SAFE / TRUE' : 'FALSE / LOCKED'}</span>
          </div>
        ))}
      </div>
      <div style={{ ...styles.card, marginTop: 16, borderColor: GOLD + '55' }}>
        <div style={{ color: GOLD2, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Phase D Progress</div>
        <div style={{ color: GREEN, fontSize: 12 }}>D.1 — POS360 Activation: COMPLETE</div>
        <div style={{ color: GREEN, fontSize: 12 }}>D.2 — Payment Activation: COMPLETE</div>
        <div style={{ color: GREEN, fontSize: 12 }}>D.3 — Staff &amp; Marketplace Activation: COMPLETE</div>
        <div style={{ color: GREEN, fontSize: 12 }}>D.4 — Inventory Activation: COMPLETE</div>
        <div style={{ color: GOLD2, fontSize: 12, fontWeight: 700 }}>D.5 — Communication Activation: IN PROGRESS</div>
        <div style={{ color: MUTE, fontSize: 12 }}>D.6 — Security Activation: NEXT</div>
        <div style={{ color: MUTE, fontSize: 12 }}>D.7 — Deployment Activation</div>
        <div style={{ color: MUTE, fontSize: 12 }}>D.8 — Live Pilot Readiness</div>
      </div>
      <div style={{ ...styles.card, marginTop: 12, borderColor: RED + '55' }}>
        <div style={{ color: RED, fontWeight: 700, fontSize: 12 }}>
          safety_status: BUILD_ONLY_NO_REAL_DELIVERY
        </div>
      </div>
    </div>
  )
}

function PhaseDCommunicationActivationShell() {
  return (
    <div style={styles.shell}>
      <div style={styles.header}>
        <div style={styles.dot} />
        <div>
          <div style={styles.title}>Phase D.5 — Communication Activation</div>
          <div style={styles.sub} dangerouslySetInnerHTML={{ __html: DEVICE_LINE }} />
        </div>
      </div>
      <div style={styles.body}>
        <SafetyBanner />
        <LiveDeliveryLockPanel />
        <ProviderRegistryPanel />
        <ChannelRegistryPanel />
        <AreaRegistryPanel />
        <TemplateRegistryPanel />
        <MessagePreviewPanel />
        <DeliveryRecordsPanel />
        <RecipientOptPanel />
        <RateLimitsPanel />
        <WebhookPanel />
        <TenantModulePanel />
        <ComplianceRiskPanel />
        <ReadinessSummaryPanel />
      </div>
    </div>
  )
}

function PhaseDCommunicationActivation() {
  return <PhaseDCommunicationActivationShell />
}

export default PhaseDCommunicationActivation
