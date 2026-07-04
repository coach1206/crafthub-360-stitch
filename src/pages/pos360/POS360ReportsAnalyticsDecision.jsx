import { useState, useEffect } from 'react'

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

const API = '/api/pos360/reports'

const TABS = [
  'Executive Dashboard', 'Daily Operations', 'Daily Closeout',
  'Payments', 'Staff', 'Guests', 'Loyalty', 'Reservations',
  'Event Packages', 'Inventory Health', 'SmokeCraft',
  'KPI Manager', 'Alerts', 'Report Snapshots',
  'Exports', 'Scheduled Reports', 'BI Providers',
  'E.A.T. Decision Layer', 'Offline Queue'
]

function StatusBadge({ status }) {
  const color = status === 'locked' ? GREEN
    : status === 'open' ? RED
    : status === 'resolved' ? DARK_MUTE
    : status === 'accepted' ? GREEN
    : status === 'rejected' ? RED
    : status === 'placeholder' ? AMBER
    : BLUE
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      background: color + '22', color, border: `1px solid ${color}55`,
      fontSize: 11, fontWeight: 700, letterSpacing: 1
    }}>{(status || '—').toUpperCase()}</span>
  )
}

function Panel({ title, children, accent }) {
  return (
    <div style={{
      background: DARK_CARD, border: `1px solid ${accent || DARK_LINE}`,
      borderRadius: 10, padding: 20, marginBottom: 16
    }}>
      {title && <div style={{ color: accent || GOLD, fontWeight: 700, fontSize: 13, marginBottom: 12, letterSpacing: 1 }}>{title.toUpperCase()}</div>}
      {children}
    </div>
  )
}

function HonestNote({ text }) {
  return (
    <div style={{
      background: AMBER + '11', border: `1px solid ${AMBER}44`, borderRadius: 6,
      padding: '8px 12px', color: AMBER, fontSize: 12, marginBottom: 10
    }}>{text}</div>
  )
}

function HonestEmptyStatePanel({ area }) {
  return (
    <div style={{ color: DARK_MUTE, fontSize: 13, padding: '24px 0', textAlign: 'center' }}>
      No {area} records found. Real data required for this reporting period.
    </div>
  )
}

function HonestRevenueStatePanel() {
  return (
    <Panel accent={AMBER} title="Revenue State">
      <HonestNote text="Revenue figures are unavailable until real order and payment data exists. No fake revenue is shown." />
      <div style={{ color: DARK_MUTE, fontSize: 12 }}>Connect real POS360 order and payment records to unlock revenue reporting.</div>
    </Panel>
  )
}

function HonestExportStatePanel() {
  return (
    <Panel accent={AMBER} title="Export State">
      <HonestNote text="Export has not been completed. No PDF, CSV, or email file has been generated or delivered. export_completed=FALSE." />
    </Panel>
  )
}

function HonestAIStatePanel() {
  return (
    <Panel accent={AMBER} title="E.A.T. AI State">
      <HonestNote text="E.A.T. AI decision insight has not been generated. This is a placeholder only. contains_ai_generated_content=FALSE." />
    </Panel>
  )
}

function PrivateDataProtectionPanel() {
  return (
    <Panel accent={BLUE} title="Private Data Protection">
      <div style={{ color: DARK_TEXT, fontSize: 12 }}>This report area contains protected private data. All access is venue-scoped and audit-logged. exposes_private_data is flagged on all relevant records.</div>
    </Panel>
  )
}

function FinancialDataProtectionPanel() {
  return (
    <Panel accent={BLUE} title="Financial Data Protection">
      <div style={{ color: DARK_TEXT, fontSize: 12 }}>This report area contains protected financial data. All access is venue-scoped and audit-logged. exposes_financial_data is flagged on all relevant records.</div>
    </Panel>
  )
}

function ReportsLanguageSelector({ locale, setLocale }) {
  const langs = ['en-US', 'es-DO', 'es', 'ht', 'de', 'pt']
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
      {langs.map(l => (
        <button key={l} onClick={() => setLocale(l)} style={{
          background: locale === l ? GOLD + '22' : 'transparent',
          border: `1px solid ${locale === l ? GOLD : DARK_LINE}`,
          color: locale === l ? GOLD : DARK_MUTE,
          borderRadius: 4, padding: '3px 8px', fontSize: 11, cursor: 'pointer'
        }}>{l}</button>
      ))}
    </div>
  )
}

function LocalPreviewBanner() {
  return (
    <Panel accent={AMBER}>
      <HonestNote text="Database not configured. Showing local preview state only. No data has been saved or retrieved." />
      <img src="/smokecraft-pos360.png" alt="SmokeCraft POS360" style={{ height: 36, opacity: 0.5, marginTop: 8 }} />
    </Panel>
  )
}

function ReportsDashboard({ children }) {
  return <div>{children}</div>
}

function ExecutiveDashboardPanel() {
  const [summary, setSummary] = useState(null)
  const [localPreview, setLocalPreview] = useState(false)
  useEffect(() => {
    fetch(`${API}/executive-summary`).then(r => r.json()).then(d => {
      if (d.localPreview) { setLocalPreview(true); return }
      setSummary(d.summary)
    }).catch(() => setLocalPreview(true))
  }, [])
  return (
    <Panel title="Executive Dashboard">
      {localPreview && <LocalPreviewBanner />}
      <HonestRevenueStatePanel />
      {summary && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ background: DARK_BG, borderRadius: 8, padding: '12px 20px', border: `1px solid ${DARK_LINE}` }}>
            <div style={{ color: DARK_MUTE, fontSize: 11 }}>SNAPSHOTS</div>
            <div style={{ color: DARK_TEXT, fontSize: 22, fontWeight: 800 }}>{summary.totalSnapshots}</div>
          </div>
          <div style={{ background: DARK_BG, borderRadius: 8, padding: '12px 20px', border: `1px solid ${RED}44` }}>
            <div style={{ color: DARK_MUTE, fontSize: 11 }}>OPEN ALERTS</div>
            <div style={{ color: RED, fontSize: 22, fontWeight: 800 }}>{summary.openAlerts}</div>
          </div>
          <div style={{ background: DARK_BG, borderRadius: 8, padding: '12px 20px', border: `1px solid ${AMBER}44` }}>
            <div style={{ color: DARK_MUTE, fontSize: 11 }}>PENDING E.A.T.</div>
            <div style={{ color: AMBER, fontSize: 22, fontWeight: 800 }}>{summary.pendingEatInsights}</div>
          </div>
        </div>
      )}
      <div style={{ color: DARK_MUTE, fontSize: 11, marginTop: 12 }}>
        Revenue, profit, order totals, and payment totals require real POS360 order and payment data.
      </div>
    </Panel>
  )
}

function DailyOperationsPanel() {
  const [reports, setReports] = useState([])
  const [localPreview, setLocalPreview] = useState(false)
  useEffect(() => {
    fetch(`${API}/daily-operations`).then(r => r.json()).then(d => {
      if (d.localPreview) { setLocalPreview(true); return }
      setReports(d.reports || [])
    }).catch(() => setLocalPreview(true))
  }, [])
  return (
    <Panel title="Daily Operations">
      {localPreview && <LocalPreviewBanner />}
      <HonestNote text="All amount fields are null until real order and payment records are aggregated. No fake totals." />
      {!localPreview && reports.length === 0 && <HonestEmptyStatePanel area="daily operations report" />}
      {reports.map(r => (
        <div key={r.id} style={{ borderBottom: `1px solid ${DARK_LINE}`, paddingBottom: 8, marginBottom: 8 }}>
          <div style={{ color: DARK_TEXT, fontWeight: 600 }}>{r.report_date}</div>
          <div style={{ color: DARK_MUTE, fontSize: 11 }}>Real data: {r.generated_from_real_data ? 'Yes' : 'No'} · State: {r.honest_state}</div>
        </div>
      ))}
    </Panel>
  )
}

function DailyCloseoutIntelligencePanel() {
  const [links, setLinks] = useState([])
  const [localPreview, setLocalPreview] = useState(false)
  useEffect(() => {
    fetch(`${API}/daily-closeout-links`).then(r => r.json()).then(d => {
      if (d.localPreview) { setLocalPreview(true); return }
      setLinks(d.links || [])
    }).catch(() => setLocalPreview(true))
  }, [])
  return (
    <Panel title="Daily Closeout Intelligence">
      {localPreview && <LocalPreviewBanner />}
      <HonestNote text="Closeout reporting links to Phase B.11 server/shift/daily closeout records. No fake totals." />
      <FinancialDataProtectionPanel />
      {!localPreview && links.length === 0 && <HonestEmptyStatePanel area="closeout report link" />}
      {links.map(l => (
        <div key={l.id} style={{ borderBottom: `1px solid ${DARK_LINE}`, paddingBottom: 6, marginBottom: 6 }}>
          <div style={{ color: DARK_TEXT, fontSize: 12 }}>Date: {l.report_date}</div>
          <div style={{ color: DARK_MUTE, fontSize: 11 }}>Closeout: {l.daily_closeout_id || '—'} · Server: {l.server_closeout_id || '—'}</div>
        </div>
      ))}
    </Panel>
  )
}

function PaymentAnalyticsPanel() {
  return (
    <Panel title="Payment Analytics">
      <HonestNote text="Payment analytics require real payment records from Phase B.11. No fake payment totals." />
      <FinancialDataProtectionPanel />
      <HonestEmptyStatePanel area="payment analytics" />
    </Panel>
  )
}

function StaffAnalyticsPanel() {
  return (
    <Panel title="Staff Analytics">
      <HonestNote text="Staff analytics require real staff records from Phase B.12. No fake performance data." />
      <PrivateDataProtectionPanel />
      <HonestEmptyStatePanel area="staff analytics" />
    </Panel>
  )
}

function GuestAnalyticsPanel() {
  return (
    <Panel title="Guest Analytics">
      <HonestNote text="Guest analytics require real guest/customer records from Phase B.8. No fake guest data." />
      <PrivateDataProtectionPanel />
      <HonestEmptyStatePanel area="guest analytics" />
    </Panel>
  )
}

function LoyaltyAnalyticsPanel() {
  return (
    <Panel title="Loyalty Analytics">
      <HonestNote text="Loyalty analytics require real loyalty/reward records from Phase B.8. No fake loyalty data." />
      <HonestEmptyStatePanel area="loyalty analytics" />
    </Panel>
  )
}

function ReservationAnalyticsPanel() {
  return (
    <Panel title="Reservation Analytics">
      <HonestNote text="Reservation analytics require real reservation records from Phase B.9. No fake data." />
      <HonestEmptyStatePanel area="reservation analytics" />
    </Panel>
  )
}

function EventPackageAnalyticsPanel() {
  return (
    <Panel title="Event Package Analytics">
      <HonestNote text="Event package analytics require real package/deposit records from Phase B.10. No fake data." />
      <FinancialDataProtectionPanel />
      <HonestEmptyStatePanel area="event package analytics" />
    </Panel>
  )
}

function InventoryHealthPanel() {
  return (
    <Panel title="Inventory Health">
      <HonestNote text="Inventory health requires real inventory records. No fake inventory totals." />
      <HonestEmptyStatePanel area="inventory health" />
    </Panel>
  )
}

function SmokeCraftEngagementPanel() {
  return (
    <Panel title="SmokeCraft Engagement">
      <HonestNote text="SmokeCraft engagement requires real SmokeCraft link records. No fake engagement data." />
      <HonestEmptyStatePanel area="SmokeCraft engagement" />
    </Panel>
  )
}

function KPIManagerPanel() {
  const [kpis, setKpis] = useState([])
  const [localPreview, setLocalPreview] = useState(false)
  useEffect(() => {
    fetch(`${API}/kpis`).then(r => r.json()).then(d => {
      if (d.localPreview) { setLocalPreview(true); return }
      setKpis(d.kpiDefinitions || [])
    }).catch(() => setLocalPreview(true))
  }, [])
  return (
    <Panel title="KPI Definitions">
      {localPreview && <LocalPreviewBanner />}
      {!localPreview && kpis.length === 0 && <HonestEmptyStatePanel area="KPI definition" />}
      {kpis.map(k => (
        <div key={k.id} style={{ borderBottom: `1px solid ${DARK_LINE}`, paddingBottom: 6, marginBottom: 6 }}>
          <div style={{ color: DARK_TEXT, fontSize: 12, fontWeight: 600 }}>{k.kpi_name}</div>
          <div style={{ color: DARK_MUTE, fontSize: 11 }}>Group: {k.kpi_group} · Real data: {k.requires_real_data ? 'Yes' : 'No'}</div>
        </div>
      ))}
    </Panel>
  )
}

function KPIThresholdPanel() {
  const [thresholds, setThresholds] = useState([])
  const [localPreview, setLocalPreview] = useState(false)
  useEffect(() => {
    fetch(`${API}/kpi-thresholds`).then(r => r.json()).then(d => {
      if (d.localPreview) { setLocalPreview(true); return }
      setThresholds(d.thresholds || [])
    }).catch(() => setLocalPreview(true))
  }, [])
  return (
    <Panel title="KPI Thresholds">
      {localPreview && <LocalPreviewBanner />}
      {!localPreview && thresholds.length === 0 && <HonestEmptyStatePanel area="KPI threshold" />}
      {thresholds.map(t => (
        <div key={t.id} style={{ borderBottom: `1px solid ${DARK_LINE}`, paddingBottom: 6, marginBottom: 6 }}>
          <div style={{ color: DARK_TEXT, fontSize: 12 }}>{t.kpi_key} {t.comparison_operator} {t.threshold_value}</div>
          <StatusBadge status={t.threshold_type} />
        </div>
      ))}
    </Panel>
  )
}

function AlertRulePanel() {
  const [rules, setRules] = useState([])
  const [localPreview, setLocalPreview] = useState(false)
  useEffect(() => {
    fetch(`${API}/alerts/rules`).then(r => r.json()).then(d => {
      if (d.localPreview) { setLocalPreview(true); return }
      setRules(d.rules || [])
    }).catch(() => setLocalPreview(true))
  }, [])
  return (
    <Panel title="Alert Rules">
      {localPreview && <LocalPreviewBanner />}
      {!localPreview && rules.length === 0 && <HonestEmptyStatePanel area="alert rule" />}
      {rules.map(r => (
        <div key={r.id} style={{ borderBottom: `1px solid ${DARK_LINE}`, paddingBottom: 6, marginBottom: 6 }}>
          <div style={{ color: DARK_TEXT, fontSize: 12, fontWeight: 600 }}>{r.alert_name}</div>
          <div style={{ color: DARK_MUTE, fontSize: 11 }}>{r.alert_type} · {r.severity}</div>
        </div>
      ))}
    </Panel>
  )
}

function AlertEventPanel() {
  const [events, setEvents] = useState([])
  const [localPreview, setLocalPreview] = useState(false)
  useEffect(() => {
    fetch(`${API}/alerts/events`).then(r => r.json()).then(d => {
      if (d.localPreview) { setLocalPreview(true); return }
      setEvents(d.events || [])
    }).catch(() => setLocalPreview(true))
  }, [])
  return (
    <Panel title="Alert Events" accent={RED}>
      {localPreview && <LocalPreviewBanner />}
      {!localPreview && events.length === 0 && <HonestEmptyStatePanel area="alert event" />}
      {events.map(e => (
        <div key={e.id} style={{ borderBottom: `1px solid ${DARK_LINE}`, paddingBottom: 6, marginBottom: 6 }}>
          <div style={{ color: RED, fontSize: 12, fontWeight: 600 }}>{e.alert_type}</div>
          <StatusBadge status={e.alert_status} />
        </div>
      ))}
    </Panel>
  )
}

function ReportSnapshotPanel() {
  const [snapshots, setSnapshots] = useState([])
  const [localPreview, setLocalPreview] = useState(false)
  useEffect(() => {
    fetch(`${API}/snapshots`).then(r => r.json()).then(d => {
      if (d.localPreview) { setLocalPreview(true); return }
      setSnapshots(d.snapshots || [])
    }).catch(() => setLocalPreview(true))
  }, [])
  return (
    <Panel title="Report Snapshots">
      {localPreview && <LocalPreviewBanner />}
      <HonestNote text="Snapshots are generated_placeholder status by default. generated_from_real_data=FALSE until real aggregation runs." />
      {!localPreview && snapshots.length === 0 && <HonestEmptyStatePanel area="report snapshot" />}
      {snapshots.map(s => (
        <div key={s.id} style={{ borderBottom: `1px solid ${DARK_LINE}`, paddingBottom: 8, marginBottom: 8 }}>
          <div style={{ color: DARK_TEXT, fontWeight: 600 }}>{s.report_name}</div>
          <div style={{ color: DARK_MUTE, fontSize: 11 }}>Type: {s.report_type} · Real: {s.generated_from_real_data ? 'Yes' : 'No'}</div>
          <StatusBadge status={s.snapshot_status} />
        </div>
      ))}
    </Panel>
  )
}

function SnapshotLockPanel() {
  return (
    <Panel title="Snapshot Locking">
      <HonestNote text="Locking a snapshot freezes it permanently. No recalculation occurs after locking." />
      <div style={{ color: DARK_MUTE, fontSize: 12 }}>Select a snapshot from the Report Snapshots panel to lock it.</div>
    </Panel>
  )
}

function ExportRequestPanel() {
  const [exports, setExports] = useState([])
  const [localPreview, setLocalPreview] = useState(false)
  useEffect(() => {
    fetch(`${API}/exports`).then(r => r.json()).then(d => {
      if (d.localPreview) { setLocalPreview(true); return }
      setExports(d.exportRequests || [])
    }).catch(() => setLocalPreview(true))
  }, [])
  return (
    <Panel title="Export Requests">
      {localPreview && <LocalPreviewBanner />}
      <HonestExportStatePanel />
      {!localPreview && exports.length === 0 && <HonestEmptyStatePanel area="export request" />}
      {exports.map(e => (
        <div key={e.id} style={{ borderBottom: `1px solid ${DARK_LINE}`, paddingBottom: 6, marginBottom: 6 }}>
          <div style={{ color: DARK_TEXT, fontSize: 12 }}>{e.export_type}</div>
          <div style={{ color: DARK_MUTE, fontSize: 11 }}>Completed: {e.export_completed ? 'Yes' : 'No'}</div>
          <StatusBadge status={e.export_status} />
        </div>
      ))}
    </Panel>
  )
}

function ScheduledReportPanel() {
  const [scheduled, setScheduled] = useState([])
  const [localPreview, setLocalPreview] = useState(false)
  useEffect(() => {
    fetch(`${API}/scheduled-reports`).then(r => r.json()).then(d => {
      if (d.localPreview) { setLocalPreview(true); return }
      setScheduled(d.scheduledReports || [])
    }).catch(() => setLocalPreview(true))
  }, [])
  return (
    <Panel title="Scheduled Reports">
      {localPreview && <LocalPreviewBanner />}
      <HonestNote text="Scheduled report delivery has not been sent. delivery_completed=FALSE. No email or external delivery has occurred." />
      {!localPreview && scheduled.length === 0 && <HonestEmptyStatePanel area="scheduled report" />}
      {scheduled.map(s => (
        <div key={s.id} style={{ borderBottom: `1px solid ${DARK_LINE}`, paddingBottom: 6, marginBottom: 6 }}>
          <div style={{ color: DARK_TEXT, fontSize: 12, fontWeight: 600 }}>{s.schedule_name}</div>
          <div style={{ color: DARK_MUTE, fontSize: 11 }}>{s.cadence} · {s.delivery_channel}</div>
          <StatusBadge status={s.schedule_status} />
        </div>
      ))}
    </Panel>
  )
}

function BIProviderPanel() {
  const [providers, setProviders] = useState([])
  const [localPreview, setLocalPreview] = useState(false)
  useEffect(() => {
    fetch(`${API}/bi-providers`).then(r => r.json()).then(d => {
      if (d.localPreview) { setLocalPreview(true); return }
      setProviders(d.profiles || [])
    }).catch(() => setLocalPreview(true))
  }, [])
  return (
    <Panel title="BI Providers">
      {localPreview && <LocalPreviewBanner />}
      <HonestNote text="BI provider is not connected. bi_connected=FALSE. stores_secrets=FALSE. No data synced to external BI tool." />
      {!localPreview && providers.length === 0 && <HonestEmptyStatePanel area="BI provider" />}
      {providers.map(p => (
        <div key={p.id} style={{ borderBottom: `1px solid ${DARK_LINE}`, paddingBottom: 8, marginBottom: 8 }}>
          <div style={{ color: DARK_TEXT, fontWeight: 600 }}>{p.provider_name}</div>
          <div style={{ color: DARK_MUTE, fontSize: 11 }}>Connected: {p.bi_connected ? 'Yes' : 'No'} · Secrets: {p.stores_secrets ? 'Yes' : 'No'}</div>
          <StatusBadge status={p.provider_status} />
        </div>
      ))}
    </Panel>
  )
}

function EATDecisionLayerPanel() {
  const [insights, setInsights] = useState([])
  const [summary, setSummary] = useState(null)
  const [localPreview, setLocalPreview] = useState(false)
  useEffect(() => {
    fetch(`${API}/eat/decision-insights`).then(r => r.json()).then(d => {
      if (d.localPreview) { setLocalPreview(true); return }
      setInsights(d.insights || [])
    }).catch(() => setLocalPreview(true))
    fetch(`${API}/eat/decision-summary`).then(r => r.json()).then(d => {
      setSummary(d)
    }).catch(() => {})
  }, [])
  return (
    <Panel title="E.A.T. Decision Layer">
      {localPreview && <LocalPreviewBanner />}
      <HonestAIStatePanel />
      <HonestNote text="E.A.T. decision layer is not connected yet. All recommendations are placeholders. contains_ai_generated_content=FALSE." />
      {summary && !summary.localPreview && (
        <div style={{ color: DARK_MUTE, fontSize: 12, marginBottom: 10 }}>
          {Object.entries(summary.summary || {}).map(([k, v]) => (
            <span key={k} style={{ marginRight: 12 }}>{k}: {v}</span>
          ))}
        </div>
      )}
      {!localPreview && insights.length === 0 && <HonestEmptyStatePanel area="E.A.T. decision insight" />}
      {insights.map(i => (
        <div key={i.id} style={{ borderBottom: `1px solid ${DARK_LINE}`, paddingBottom: 8, marginBottom: 8 }}>
          <div style={{ color: DARK_TEXT, fontSize: 12, fontWeight: 600 }}>{i.insight_title}</div>
          <div style={{ color: DARK_MUTE, fontSize: 11 }}>Type: {i.insight_type} · AI: {i.contains_ai_generated_content ? 'Yes' : 'No'}</div>
          <StatusBadge status={i.decision_status} />
        </div>
      ))}
    </Panel>
  )
}

function EATDecisionReviewPanel() {
  return (
    <Panel title="E.A.T. Decision Review">
      <HonestAIStatePanel />
      <div style={{ color: DARK_MUTE, fontSize: 12 }}>Select an E.A.T. insight from the Decision Layer panel to accept or reject it. No AI recommendation has been generated yet.</div>
    </Panel>
  )
}

function OfflineReportQueuePanel() {
  const [queue, setQueue] = useState([])
  const [localPreview, setLocalPreview] = useState(false)
  useEffect(() => {
    fetch(`${API}/offline-queue`).then(r => r.json()).then(d => {
      if (d.localPreview) { setLocalPreview(true); return }
      setQueue(d.queue || [])
    }).catch(() => setLocalPreview(true))
  }, [])
  return (
    <Panel title="Offline Report Queue">
      {localPreview && <LocalPreviewBanner />}
      <HonestNote text="Report action queued for sync when connection is restored. No data has been submitted offline." />
      {!localPreview && queue.length === 0 && <HonestEmptyStatePanel area="offline queue action" />}
      {queue.map(q => (
        <div key={q.id} style={{ borderBottom: `1px solid ${DARK_LINE}`, paddingBottom: 6, marginBottom: 6 }}>
          <div style={{ color: DARK_TEXT, fontSize: 12 }}>{q.action_type}</div>
          <StatusBadge status={q.sync_status} />
        </div>
      ))}
    </Panel>
  )
}

const PANEL_MAP = {
  'Executive Dashboard': ExecutiveDashboardPanel,
  'Daily Operations': DailyOperationsPanel,
  'Daily Closeout': DailyCloseoutIntelligencePanel,
  'Payments': PaymentAnalyticsPanel,
  'Staff': StaffAnalyticsPanel,
  'Guests': GuestAnalyticsPanel,
  'Loyalty': LoyaltyAnalyticsPanel,
  'Reservations': ReservationAnalyticsPanel,
  'Event Packages': EventPackageAnalyticsPanel,
  'Inventory Health': InventoryHealthPanel,
  'SmokeCraft': SmokeCraftEngagementPanel,
  'KPI Manager': KPIManagerPanel,
  'Alerts': AlertEventPanel,
  'Report Snapshots': ReportSnapshotPanel,
  'Exports': ExportRequestPanel,
  'Scheduled Reports': ScheduledReportPanel,
  'BI Providers': BIProviderPanel,
  'E.A.T. Decision Layer': EATDecisionLayerPanel,
  'Offline Queue': OfflineReportQueuePanel,
}

export default function POS360ReportsAnalyticsDecision() {
  const [activeTab, setActiveTab] = useState('Executive Dashboard')
  const [locale, setLocale] = useState('en-US')
  const ActivePanel = PANEL_MAP[activeTab] || (() => null)

  return (
    <div style={{ minHeight: '100vh', background: DARK_BG, color: DARK_TEXT, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: DARK_CARD, borderBottom: `2px solid ${GOLD}`, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <img src="/smokecraft-pos360.png" alt="SmokeCraft POS360" style={{ height: 44 }} />
        <div>
          <div style={{ color: GOLD, fontWeight: 800, fontSize: 20, letterSpacing: 2 }}>POS360 · REPORTS & ANALYTICS DECISION LAYER</div>
          <div style={{ color: DARK_MUTE, fontSize: 11, letterSpacing: 1 }}>Touchscreen · Handheld · Tablet · Desktop</div>
        </div>
        <img src="/smokecraft-pos360.png" alt="SmokeCraft POS360 logo" style={{ height: 32, marginLeft: 'auto', opacity: 0.4 }} />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '14px 24px', borderBottom: `1px solid ${DARK_LINE}`, background: DARK_CARD }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            background: activeTab === tab ? GOLD + '22' : 'transparent',
            border: `1px solid ${activeTab === tab ? GOLD : DARK_LINE}`,
            color: activeTab === tab ? GOLD : DARK_MUTE,
            borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer',
            fontWeight: activeTab === tab ? 700 : 400
          }}>{tab}</button>
        ))}
      </div>

      <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
        <ReportsLanguageSelector locale={locale} setLocale={setLocale} />
        <ReportsDashboard>
          <ActivePanel />
        </ReportsDashboard>
      </div>
    </div>
  )
}
