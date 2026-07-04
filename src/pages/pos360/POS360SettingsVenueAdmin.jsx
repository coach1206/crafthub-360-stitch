import React, { useState } from 'react'

const DARK_BG = '#080604'
const GOLD = '#c9952c'
const DARK_CARD = '#13110d'
const DARK_LINE = '#2a2520'
const DARK_TEXT = '#f0ead8'
const DARK_MUTE = '#8a7e6a'
const RED = '#c0392b'
const GREEN = '#27ae60'
const BLUE = '#2980b9'
const AMBER = '#e67e22'

const API = '/api/pos360/settings'

const TABS = [
  'Dashboard','Venue Profile','Regional','Operating Rules','Financial Policies',
  'Compliance','Privacy Notices','White Label','Theme Tokens','Modules',
  'Module Governance','Feature Flags','Integrations','Provider Readiness',
  'Admin Console','Settings Views','Change Requests','Approvals',
  'Version History','Rollback','Exports','Offline Queue',
]

const card = { background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 10, padding: 20, marginBottom: 16 }
const badge = (color, label) => (
  <span style={{ background: color, color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, marginLeft: 8 }}>{label}</span>
)

function HonestNote({ text }) {
  return (
    <div style={{ background: '#1a1206', border: `1px solid ${AMBER}`, borderRadius: 6, padding: '8px 14px', color: AMBER, fontSize: 12, marginTop: 8 }}>
      ⚠ {text}
    </div>
  )
}
function LocalPreviewBanner() {
  return (
    <div style={{ background: '#0f0c00', border: `1px solid ${AMBER}`, borderRadius: 6, padding: '8px 14px', color: AMBER, fontSize: 12, marginBottom: 12 }}>
      Local preview — database not connected. No real venue data is loaded.
    </div>
  )
}
function HonestEmptyStatePanel() {
  return (
    <div style={{ ...card, textAlign: 'center', color: DARK_MUTE }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>⚙</div>
      <div style={{ fontWeight: 600, color: DARK_TEXT, marginBottom: 4 }}>No data available yet</div>
      <div style={{ fontSize: 13 }}>Configure venue settings to populate this section.</div>
    </div>
  )
}
function HonestWhiteLabelStatePanel() {
  return (
    <div style={{ ...card, border: `1px solid ${AMBER}` }}>
      <div style={{ fontWeight: 700, color: AMBER, marginBottom: 4 }}>White-Label Status</div>
      <div style={{ color: DARK_TEXT, fontSize: 13 }}>white_label_deployed = <strong>FALSE</strong></div>
      <HonestNote text="White-label deployment is not active. No real brand deployment or custom domain connection has occurred." />
    </div>
  )
}
function HonestIntegrationStatePanel() {
  return (
    <div style={{ ...card, border: `1px solid ${AMBER}` }}>
      <div style={{ fontWeight: 700, color: AMBER, marginBottom: 4 }}>Integration Status</div>
      <div style={{ color: DARK_TEXT, fontSize: 13 }}>integration_connected = <strong>FALSE</strong></div>
      <HonestNote text="No provider connection has been established. All integrations default to not_connected. No secrets stored." />
    </div>
  )
}
function HonestComplianceStatePanel() {
  return (
    <div style={{ ...card, border: `1px solid ${AMBER}` }}>
      <div style={{ fontWeight: 700, color: AMBER, marginBottom: 4 }}>Compliance Status</div>
      <div style={{ color: DARK_TEXT, fontSize: 13 }}>compliance_certified = <strong>FALSE</strong></div>
      <HonestNote text="Compliance certification has not been issued. Tax calculation not enabled. Accounting export not connected." />
    </div>
  )
}
function NoSecretsStoredPanel() {
  return (
    <div style={{ ...card, border: `1px solid ${GREEN}` }}>
      <div style={{ fontWeight: 700, color: GREEN, marginBottom: 4 }}>🔒 No Secrets Stored</div>
      <div style={{ color: DARK_TEXT, fontSize: 13 }}>stores_secrets = <strong>FALSE</strong> · contains_secrets = <strong>FALSE</strong></div>
      <div style={{ color: DARK_MUTE, fontSize: 12, marginTop: 4 }}>No provider credentials, API keys, or secrets are stored in this layer.</div>
    </div>
  )
}
function PrivateDataProtectionPanel() {
  return (
    <div style={{ ...card, border: `1px solid ${BLUE}` }}>
      <div style={{ fontWeight: 700, color: BLUE, marginBottom: 4 }}>🛡 Private Data Protected</div>
      <div style={{ color: DARK_MUTE, fontSize: 13 }}>Venue contact, staff, guest, compliance, and notice records are flagged exposes_private_data=TRUE. Access is guarded by canAccessPOS3.</div>
    </div>
  )
}
function FinancialDataProtectionPanel() {
  return (
    <div style={{ ...card, border: `1px solid ${GOLD}` }}>
      <div style={{ fontWeight: 700, color: GOLD, marginBottom: 4 }}>💰 Financial Data Protected</div>
      <div style={{ color: DARK_MUTE, fontSize: 13 }}>Tax, service charge, refund, void, tip, payment, and accounting policy records are flagged exposes_financial_data=TRUE. Manager approval required for financial setting changes.</div>
    </div>
  )
}

function SettingsDashboard({ setTab }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {TABS.filter(t => t !== 'Dashboard').map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ background: DARK_CARD, border: `1px solid ${DARK_LINE}`, borderRadius: 8, padding: '14px 10px', color: DARK_TEXT, cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: 600, touchAction: 'manipulation' }}>
            {t}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <HonestWhiteLabelStatePanel />
        <HonestIntegrationStatePanel />
        <HonestComplianceStatePanel />
        <NoSecretsStoredPanel />
        <PrivateDataProtectionPanel />
        <FinancialDataProtectionPanel />
      </div>
    </div>
  )
}

function VenueProfilePanel() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const load = async () => {
    setLoading(true)
    try { const r = await fetch(`${API}/venue-profile`); setData(await r.json()) } catch { setData({ localPreview: true }) }
    setLoading(false)
  }
  return (
    <div style={card}>
      <div style={{ fontWeight: 700, color: GOLD, marginBottom: 12 }}>Venue Profile</div>
      <button onClick={load} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>
        {loading ? 'Loading…' : 'Load Venue Profile'}
      </button>
      {data?.localPreview && <LocalPreviewBanner />}
      {data?.venueProfile && (
        <div style={{ color: DARK_TEXT, fontSize: 13 }}>
          <div><b>Name:</b> {data.venueProfile.venue_name}</div>
          <div><b>Type:</b> {data.venueProfile.venue_type}</div>
          <div><b>Email:</b> {data.venueProfile.contact_email || '—'}</div>
        </div>
      )}
      {data?.honest_state && <HonestNote text="No venue profile configured yet." />}
    </div>
  )
}

function RegionalSettingsPanel() {
  const [data, setData] = useState(null)
  const load = async () => {
    try { const r = await fetch(`${API}/regional`); setData(await r.json()) } catch { setData({ localPreview: true }) }
  }
  return (
    <div style={card}>
      <div style={{ fontWeight: 700, color: GOLD, marginBottom: 12 }}>Regional Settings</div>
      <button onClick={load} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>Load Regional</button>
      {data?.localPreview && <LocalPreviewBanner />}
      {data?.regionalSettings && (
        <div style={{ color: DARK_TEXT, fontSize: 13 }}>
          <div><b>Locale:</b> {data.regionalSettings.default_locale}</div>
          <div><b>Timezone:</b> {data.regionalSettings.timezone}</div>
          <div><b>Currency:</b> {data.regionalSettings.currency_code}</div>
        </div>
      )}
      {data?.honest_state && <HonestNote text="No regional settings configured yet." />}
    </div>
  )
}

function OperatingRulesPanel() {
  const [data, setData] = useState(null)
  const load = async () => {
    try { const r = await fetch(`${API}/operating-rules`); setData(await r.json()) } catch { setData({ localPreview: true }) }
  }
  return (
    <div style={card}>
      <div style={{ fontWeight: 700, color: GOLD, marginBottom: 12 }}>Operating Rules</div>
      <div style={{ color: DARK_MUTE, fontSize: 12, marginBottom: 8 }}>Governs orders, payments, tips, reservations, tables, private events, loyalty, inventory, staff, reports, E.A.T., SmokeCraft.</div>
      <button onClick={load} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>Load Rules</button>
      {data?.localPreview && <LocalPreviewBanner />}
      {data?.operatingRules?.length === 0 && <HonestEmptyStatePanel />}
      {data?.operatingRules?.map(r => (
        <div key={r.id} style={{ background: DARK_BG, borderRadius: 6, padding: 8, marginBottom: 6, color: DARK_TEXT, fontSize: 12 }}>
          <b>{r.rule_group}</b> · {r.rule_key}
          {r.requires_manager_approval && badge(AMBER, 'Mgr Approval')}
        </div>
      ))}
    </div>
  )
}

function FinancialPoliciesPanel() {
  const [data, setData] = useState(null)
  const load = async () => {
    try { const r = await fetch(`${API}/financial-policies`); setData(await r.json()) } catch { setData({ localPreview: true }) }
  }
  return (
    <div style={card}>
      <div style={{ fontWeight: 700, color: GOLD, marginBottom: 12 }}>Financial Policies</div>
      <HonestNote text="calculation_enabled=FALSE. No tax calculation or accounting export is active. Manager approval required for all financial policy changes." />
      <button onClick={load} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', margin: '12px 0' }}>Load Policies</button>
      {data?.localPreview && <LocalPreviewBanner />}
      {data?.financialPolicies?.length === 0 && <HonestEmptyStatePanel />}
      {data?.financialPolicies?.map(p => (
        <div key={p.id} style={{ background: DARK_BG, borderRadius: 6, padding: 8, marginBottom: 6, color: DARK_TEXT, fontSize: 12 }}>
          <b>{p.policy_group}</b> · {p.policy_key}
          {badge(RED, 'Mgr Required')}
          {badge(AMBER, 'Calc Disabled')}
        </div>
      ))}
    </div>
  )
}

function ComplianceSettingsPanel() {
  const [data, setData] = useState(null)
  const load = async () => {
    try { const r = await fetch(`${API}/compliance-settings`); setData(await r.json()) } catch { setData({ localPreview: true }) }
  }
  return (
    <div style={card}>
      <div style={{ fontWeight: 700, color: GOLD, marginBottom: 12 }}>Compliance Settings</div>
      <HonestNote text="compliance_certified=FALSE. No compliance certification has been issued." />
      <button onClick={load} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', margin: '12px 0' }}>Load Compliance</button>
      {data?.localPreview && <LocalPreviewBanner />}
      {data?.complianceSettings?.length === 0 && <HonestEmptyStatePanel />}
    </div>
  )
}

function PrivacyNoticesPanel() {
  const [data, setData] = useState(null)
  const load = async () => {
    try { const r = await fetch(`${API}/privacy-notices`); setData(await r.json()) } catch { setData({ localPreview: true }) }
  }
  return (
    <div style={card}>
      <div style={{ fontWeight: 700, color: GOLD, marginBottom: 12 }}>Privacy Notices</div>
      <button onClick={load} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>Load Notices</button>
      {data?.localPreview && <LocalPreviewBanner />}
      {data?.privacyNotices?.length === 0 && <HonestEmptyStatePanel />}
    </div>
  )
}

function WhiteLabelProfilePanel() {
  const [data, setData] = useState(null)
  const load = async () => {
    try { const r = await fetch(`${API}/white-label`); setData(await r.json()) } catch { setData({ localPreview: true }) }
  }
  return (
    <div style={card}>
      <div style={{ fontWeight: 700, color: GOLD, marginBottom: 12 }}>White-Label Profile</div>
      <HonestWhiteLabelStatePanel />
      <button onClick={load} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', margin: '12px 0' }}>Load White-Label</button>
      {data?.localPreview && <LocalPreviewBanner />}
      {data?.whiteLabelProfile && (
        <div style={{ color: DARK_TEXT, fontSize: 13 }}>
          <div><b>Brand:</b> {data.whiteLabelProfile.brand_name}</div>
          <div><b>Status:</b> {data.whiteLabelProfile.white_label_status}</div>
          <div><b>Deployed:</b> {String(data.whiteLabelProfile.white_label_deployed)}</div>
        </div>
      )}
      {data?.honest_state && <HonestNote text="No white-label profile configured. white_label_deployed=FALSE." />}
    </div>
  )
}

function ThemeTokensPanel() {
  const [data, setData] = useState(null)
  const load = async () => {
    try { const r = await fetch(`${API}/theme-tokens`); setData(await r.json()) } catch { setData({ localPreview: true }) }
  }
  return (
    <div style={card}>
      <div style={{ fontWeight: 700, color: GOLD, marginBottom: 12 }}>Theme Tokens</div>
      <div style={{ color: DARK_MUTE, fontSize: 12, marginBottom: 8 }}>Colors · Typography · Spacing · Logo · Receipt · Dashboard · Module Names</div>
      <button onClick={load} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>Load Tokens</button>
      {data?.localPreview && <LocalPreviewBanner />}
      {data?.themeTokens?.length === 0 && <HonestEmptyStatePanel />}
    </div>
  )
}

function ModuleRegistryPanel() {
  const [data, setData] = useState(null)
  const load = async () => {
    try { const r = await fetch(`${API}/modules`); setData(await r.json()) } catch { setData({ localPreview: true }) }
  }
  const MODULES = ['customers','loyalty','reservations','event_packages','payments','staff','reports','inventory','eat','smokecraft','pos_overlay','settings']
  return (
    <div style={card}>
      <div style={{ fontWeight: 700, color: GOLD, marginBottom: 12 }}>Module Registry</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {MODULES.map(m => (
          <span key={m} style={{ background: DARK_BG, border: `1px solid ${DARK_LINE}`, borderRadius: 4, padding: '2px 8px', color: DARK_MUTE, fontSize: 11 }}>{m}</span>
        ))}
      </div>
      <button onClick={load} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>Load Modules</button>
      {data?.localPreview && <LocalPreviewBanner />}
      {data?.modules?.map(m => (
        <div key={m.id} style={{ background: DARK_BG, borderRadius: 6, padding: 8, marginBottom: 6, color: DARK_TEXT, fontSize: 12 }}>
          <b>{m.module_key}</b> · {m.module_name}
          {badge(m.module_status === 'enabled' ? GREEN : DARK_MUTE, m.module_status)}
        </div>
      ))}
    </div>
  )
}

function ModuleGovernancePanel() {
  const [data, setData] = useState(null)
  const load = async () => {
    try { const r = await fetch(`${API}/module-governance`); setData(await r.json()) } catch { setData({ localPreview: true }) }
  }
  return (
    <div style={card}>
      <div style={{ fontWeight: 700, color: GOLD, marginBottom: 12 }}>Module Governance</div>
      <button onClick={load} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>Load Governance Rules</button>
      {data?.localPreview && <LocalPreviewBanner />}
      {data?.moduleGovernanceRules?.length === 0 && <HonestEmptyStatePanel />}
    </div>
  )
}

function FeatureFlagOverridePanel() {
  const [data, setData] = useState(null)
  const load = async () => {
    try { const r = await fetch(`${API}/feature-flag-overrides`); setData(await r.json()) } catch { setData({ localPreview: true }) }
  }
  return (
    <div style={card}>
      <div style={{ fontWeight: 700, color: GOLD, marginBottom: 12 }}>Feature Flag Overrides</div>
      <div style={{ color: DARK_MUTE, fontSize: 12, marginBottom: 8 }}>Venue-level overrides for customers, loyalty, reservations, event_packages, payments, staff, reports, inventory, eat, smokecraft feature flags.</div>
      <button onClick={load} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>Load Overrides</button>
      {data?.localPreview && <LocalPreviewBanner />}
      {data?.featureFlagOverrides?.length === 0 && <HonestEmptyStatePanel />}
      {data?.featureFlagOverrides?.map(f => (
        <div key={f.id} style={{ background: DARK_BG, borderRadius: 6, padding: 8, marginBottom: 6, color: DARK_TEXT, fontSize: 12 }}>
          <b>{f.module_key}</b> · {f.flag_key} = {f.flag_value}
          {badge(f.override_status === 'active' ? GREEN : AMBER, f.override_status)}
        </div>
      ))}
    </div>
  )
}

function IntegrationStatusPanel() {
  const [data, setData] = useState(null)
  const load = async () => {
    try { const r = await fetch(`${API}/integrations`); setData(await r.json()) } catch { setData({ localPreview: true }) }
  }
  return (
    <div style={card}>
      <div style={{ fontWeight: 700, color: GOLD, marginBottom: 12 }}>Integration Status Registry</div>
      <HonestIntegrationStatePanel />
      <div style={{ color: DARK_MUTE, fontSize: 12, marginBottom: 8 }}>Tracks: payments · payroll · BI · reservations · SMS · email · printer · kitchen display · accounting · inventory vendor · external POS · E.A.T. · SmokeCraft</div>
      <button onClick={load} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>Load Integrations</button>
      {data?.localPreview && <LocalPreviewBanner />}
      {data?.integrationStatuses?.map(i => (
        <div key={i.id} style={{ background: DARK_BG, borderRadius: 6, padding: 8, marginBottom: 6, color: DARK_TEXT, fontSize: 12 }}>
          <b>{i.provider_name}</b> ({i.provider_type})
          {badge(i.integration_connected ? GREEN : RED, i.integration_connected ? 'Connected' : 'Not Connected')}
        </div>
      ))}
    </div>
  )
}

function ProviderReadinessPanel() {
  const [data, setData] = useState(null)
  const load = async () => {
    try { const r = await fetch(`${API}/provider-readiness`); setData(await r.json()) } catch { setData({ localPreview: true }) }
  }
  return (
    <div style={card}>
      <div style={{ fontWeight: 700, color: GOLD, marginBottom: 12 }}>Provider Readiness Checks</div>
      <div style={{ color: DARK_MUTE, fontSize: 12, marginBottom: 8 }}>configuration · credentials · webhook · data_sync · permissions · compliance</div>
      <button onClick={load} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>Load Checks</button>
      {data?.localPreview && <LocalPreviewBanner />}
      {data?.providerReadinessChecks?.length === 0 && <HonestEmptyStatePanel />}
    </div>
  )
}

function AdminConsoleProfilePanel() {
  const [data, setData] = useState(null)
  const load = async () => {
    try { const r = await fetch(`${API}/admin-console-profiles`); setData(await r.json()) } catch { setData({ localPreview: true }) }
  }
  return (
    <div style={card}>
      <div style={{ fontWeight: 700, color: GOLD, marginBottom: 12 }}>Admin Console Profiles</div>
      <button onClick={load} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>Load Profiles</button>
      {data?.localPreview && <LocalPreviewBanner />}
      {data?.adminConsoleProfiles?.length === 0 && <HonestEmptyStatePanel />}
    </div>
  )
}

function AdminSettingsViewPanel() {
  return (
    <div style={card}>
      <div style={{ fontWeight: 700, color: GOLD, marginBottom: 8 }}>Settings View Log</div>
      <div style={{ color: DARK_MUTE, fontSize: 13 }}>All admin settings reads are audited. exposes_private_data and exposes_financial_data are tracked per view.</div>
      <HonestNote text="Settings view audit records are written on every read of private or financial settings." />
    </div>
  )
}

function SettingsChangeRequestPanel() {
  const [data, setData] = useState(null)
  const load = async () => {
    try { const r = await fetch(`${API}/change-requests`); setData(await r.json()) } catch { setData({ localPreview: true }) }
  }
  return (
    <div style={card}>
      <div style={{ fontWeight: 700, color: GOLD, marginBottom: 12 }}>Settings Change Requests</div>
      <button onClick={load} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>Load Requests</button>
      {data?.localPreview && <LocalPreviewBanner />}
      {data?.settingsChangeRequests?.length === 0 && <HonestEmptyStatePanel />}
      {data?.settingsChangeRequests?.map(c => (
        <div key={c.id} style={{ background: DARK_BG, borderRadius: 6, padding: 8, marginBottom: 6, color: DARK_TEXT, fontSize: 12 }}>
          <b>{c.setting_group}</b> · {c.setting_key}
          {badge(c.change_status === 'applied' ? GREEN : AMBER, c.change_status)}
        </div>
      ))}
    </div>
  )
}

function SettingsApprovalPanel() {
  const [data, setData] = useState(null)
  const load = async () => {
    try { const r = await fetch(`${API}/approval-requests`); setData(await r.json()) } catch { setData({ localPreview: true }) }
  }
  return (
    <div style={card}>
      <div style={{ fontWeight: 700, color: GOLD, marginBottom: 12 }}>Settings Approval Requests</div>
      <HonestNote text="Manager approval required for financial policies, tax settings, refund/void rules, module toggles, white-label identity, data retention, provider status, and compliance settings." />
      <button onClick={load} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', margin: '12px 0' }}>Load Approvals</button>
      {data?.localPreview && <LocalPreviewBanner />}
      {data?.settingsApprovalRequests?.length === 0 && <HonestEmptyStatePanel />}
    </div>
  )
}

function SettingsVersionHistoryPanel() {
  const [data, setData] = useState(null)
  const load = async () => {
    try { const r = await fetch(`${API}/version-history`); setData(await r.json()) } catch { setData({ localPreview: true }) }
  }
  return (
    <div style={card}>
      <div style={{ fontWeight: 700, color: GOLD, marginBottom: 12 }}>Settings Version History</div>
      <button onClick={load} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>Load History</button>
      {data?.localPreview && <LocalPreviewBanner />}
      {data?.settingsVersionHistory?.length === 0 && <HonestEmptyStatePanel />}
      {data?.settingsVersionHistory?.map(v => (
        <div key={v.id} style={{ background: DARK_BG, borderRadius: 6, padding: 8, marginBottom: 6, color: DARK_TEXT, fontSize: 12 }}>
          <b>v{v.version_number}</b> · {v.setting_group} · {v.setting_key}
          {v.rollback_available && badge(BLUE, 'Rollback Available')}
        </div>
      ))}
    </div>
  )
}

function SettingsRollbackPanel() {
  return (
    <div style={card}>
      <div style={{ fontWeight: 700, color: GOLD, marginBottom: 8 }}>Settings Rollback</div>
      <div style={{ color: DARK_MUTE, fontSize: 13 }}>Rollback records reference version history snapshots. Manager approval required to apply a rollback.</div>
      <HonestNote text="Rollback is a controlled operation. rollback_available metadata is tracked per version." />
    </div>
  )
}

function SettingsExportPanel() {
  const [data, setData] = useState(null)
  const load = async () => {
    try { const r = await fetch(`${API}/exports`); setData(await r.json()) } catch { setData({ localPreview: true }) }
  }
  return (
    <div style={card}>
      <div style={{ fontWeight: 700, color: GOLD, marginBottom: 12 }}>Settings Export Requests</div>
      <HonestNote text="export_completed=FALSE. No export file has been generated or delivered." />
      <button onClick={load} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', margin: '12px 0' }}>Load Exports</button>
      {data?.localPreview && <LocalPreviewBanner />}
      {data?.settingsExportRequests?.length === 0 && <HonestEmptyStatePanel />}
    </div>
  )
}

function OfflineSettingsQueuePanel() {
  const [data, setData] = useState(null)
  const load = async () => {
    try { const r = await fetch(`${API}/offline-queue`); setData(await r.json()) } catch { setData({ localPreview: true }) }
  }
  return (
    <div style={card}>
      <div style={{ fontWeight: 700, color: GOLD, marginBottom: 12 }}>Offline Settings Queue</div>
      <HonestNote text="Settings changes queued offline have not been applied. Sync required." />
      <button onClick={load} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', margin: '12px 0' }}>Load Queue</button>
      {data?.localPreview && <LocalPreviewBanner />}
      {data?.offlineSettingsQueue?.length === 0 && <HonestEmptyStatePanel />}
    </div>
  )
}

function SettingsLanguageSelector({ locale, setLocale }) {
  const LANGS = [
    { code: 'en-US', label: 'English (US)' }, { code: 'es-DO', label: 'Español (DO)' },
    { code: 'es', label: 'Español' }, { code: 'ht', label: 'Kreyòl Ayisyen' },
    { code: 'de', label: 'Deutsch' }, { code: 'pt', label: 'Português' },
  ]
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
      {LANGS.map(l => (
        <button key={l.code} onClick={() => setLocale(l.code)}
          style={{ background: locale === l.code ? GOLD : DARK_CARD, color: locale === l.code ? '#000' : DARK_MUTE, border: `1px solid ${DARK_LINE}`, borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>
          {l.label}
        </button>
      ))}
    </div>
  )
}

const PANEL_MAP = {
  'Dashboard': SettingsDashboard,
  'Venue Profile': VenueProfilePanel,
  'Regional': RegionalSettingsPanel,
  'Operating Rules': OperatingRulesPanel,
  'Financial Policies': FinancialPoliciesPanel,
  'Compliance': ComplianceSettingsPanel,
  'Privacy Notices': PrivacyNoticesPanel,
  'White Label': WhiteLabelProfilePanel,
  'Theme Tokens': ThemeTokensPanel,
  'Modules': ModuleRegistryPanel,
  'Module Governance': ModuleGovernancePanel,
  'Feature Flags': FeatureFlagOverridePanel,
  'Integrations': IntegrationStatusPanel,
  'Provider Readiness': ProviderReadinessPanel,
  'Admin Console': AdminConsoleProfilePanel,
  'Settings Views': AdminSettingsViewPanel,
  'Change Requests': SettingsChangeRequestPanel,
  'Approvals': SettingsApprovalPanel,
  'Version History': SettingsVersionHistoryPanel,
  'Rollback': SettingsRollbackPanel,
  'Exports': SettingsExportPanel,
  'Offline Queue': OfflineSettingsQueuePanel,
}

export default function POS360SettingsVenueAdmin() {
  const [tab, setTab] = useState('Dashboard')
  const [locale, setLocale] = useState('en-US')

  const Panel = PANEL_MAP[tab] || HonestEmptyStatePanel

  return (
    <div style={{ background: DARK_BG, minHeight: '100vh', color: DARK_TEXT, fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: DARK_CARD, borderBottom: `1px solid ${DARK_LINE}`, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <img src="/smokecraft-pos360.png" alt="POS360" style={{ height: 32, objectFit: 'contain' }} />
        <div>
          <div style={{ fontWeight: 700, color: GOLD, fontSize: 16 }}>POS360 · System Settings & Admin Console</div>
          <div style={{ color: DARK_MUTE, fontSize: 11 }}>Touchscreen · Handheld · Tablet · Desktop</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <img src="/smokecraft-pos360.png" alt="POS360" style={{ height: 24, objectFit: 'contain', opacity: 0.5 }} />
        </div>
      </div>

      <div style={{ padding: 20 }}>
        <SettingsLanguageSelector locale={locale} setLocale={setLocale} />

        {/* Tab bar */}
        <div style={{ display: 'flex', overflowX: 'auto', gap: 4, marginBottom: 16, paddingBottom: 4 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                background: tab === t ? GOLD : DARK_CARD,
                color: tab === t ? '#000' : DARK_MUTE,
                border: `1px solid ${tab === t ? GOLD : DARK_LINE}`,
                borderRadius: 6, padding: '6px 12px', cursor: 'pointer', whiteSpace: 'nowrap',
                fontSize: 12, fontWeight: tab === t ? 700 : 400, touchAction: 'manipulation',
              }}>
              {t}
            </button>
          ))}
        </div>

        {/* Panel */}
        {tab === 'Dashboard'
          ? <SettingsDashboard setTab={setTab} />
          : <Panel />
        }

        {/* Safety footer */}
        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
          <NoSecretsStoredPanel />
          <PrivateDataProtectionPanel />
          <FinancialDataProtectionPanel />
          <HonestWhiteLabelStatePanel />
          <HonestIntegrationStatePanel />
          <HonestComplianceStatePanel />
        </div>
      </div>
    </div>
  )
}
