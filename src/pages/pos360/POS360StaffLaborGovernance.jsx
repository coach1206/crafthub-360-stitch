import { useState, useEffect, useCallback } from 'react'

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

const API = '/api/pos360/staff'

const TABS = [
  'Profiles', 'Roles', 'Permissions', 'Assignments',
  'Schedule', 'Shifts', 'Availability', 'Time Off',
  'Time Clock', 'Breaks', 'Labor Summaries',
  'Governance', 'Approvals', 'Risk Flags',
  'Labor Insights', 'Payroll', 'Offline Queue'
]

function StatusBadge({ status }) {
  const color = status === 'active' ? GREEN
    : status === 'approved' ? GREEN
    : status === 'rejected' ? RED
    : status === 'pending' ? AMBER
    : status === 'closed' ? DARK_MUTE
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

function HonestEmptyState({ area }) {
  return (
    <div style={{ color: DARK_MUTE, fontSize: 13, padding: '24px 0', textAlign: 'center' }}>
      No {area} records found for this venue.
    </div>
  )
}

function LocalPreviewBanner() {
  return (
    <Panel accent={AMBER}>
      <HonestNote text="Database not configured. Showing local preview state only. No data has been saved or retrieved." />
      <img src="/smokecraft-pos360.png" alt="SmokeCraft POS360" style={{ height: 40, opacity: 0.5, marginTop: 8 }} />
    </Panel>
  )
}

function StaffProfilesPanel() {
  const [profiles, setProfiles] = useState([])
  const [localPreview, setLocalPreview] = useState(false)
  useEffect(() => {
    fetch(`${API}/profiles`).then(r => r.json()).then(d => {
      if (d.localPreview) { setLocalPreview(true); return }
      setProfiles(d.profiles || [])
    }).catch(() => setLocalPreview(true))
  }, [])
  return (
    <Panel title="Staff Profiles">
      {localPreview && <LocalPreviewBanner />}
      {!localPreview && profiles.length === 0 && <HonestEmptyState area="staff profile" />}
      {profiles.map(p => (
        <div key={p.id} style={{ borderBottom: `1px solid ${DARK_LINE}`, paddingBottom: 10, marginBottom: 10 }}>
          <div style={{ color: DARK_TEXT, fontWeight: 700 }}>{p.display_name || p.staff_code}</div>
          <div style={{ color: DARK_MUTE, fontSize: 12 }}>Code: {p.staff_code} · Lang: {p.preferred_language || 'en-US'}</div>
          <StatusBadge status={p.active ? 'active' : 'inactive'} />
        </div>
      ))}
    </Panel>
  )
}

function StaffRolesPanel() {
  const [roles, setRoles] = useState([])
  const [templates, setTemplates] = useState([])
  const [localPreview, setLocalPreview] = useState(false)
  useEffect(() => {
    fetch(`${API}/roles`).then(r => r.json()).then(d => {
      if (d.localPreview) { setLocalPreview(true); return }
      setRoles(d.roles || [])
    }).catch(() => setLocalPreview(true))
    fetch(`${API}/role-templates`).then(r => r.json()).then(d => {
      setTemplates(d.templates || [])
    }).catch(() => {})
  }, [])
  return (
    <Panel title="Staff Roles & Templates">
      {localPreview && <LocalPreviewBanner />}
      <div style={{ color: DARK_MUTE, fontSize: 12, marginBottom: 8 }}>Role Templates: {templates.length}</div>
      {!localPreview && roles.length === 0 && <HonestEmptyState area="staff role" />}
      {roles.map(r => (
        <div key={r.id} style={{ borderBottom: `1px solid ${DARK_LINE}`, paddingBottom: 8, marginBottom: 8 }}>
          <div style={{ color: DARK_TEXT, fontWeight: 700 }}>{r.role_name}</div>
          <div style={{ color: DARK_MUTE, fontSize: 12 }}>Type: {r.role_type} · Manager: {r.is_manager_role ? 'Yes' : 'No'}</div>
        </div>
      ))}
    </Panel>
  )
}

function PermissionsPanel() {
  const [permissions, setPermissions] = useState([])
  const [localPreview, setLocalPreview] = useState(false)
  useEffect(() => {
    fetch(`${API}/permissions`).then(r => r.json()).then(d => {
      if (d.localPreview) { setLocalPreview(true); return }
      setPermissions(d.permissions || [])
    }).catch(() => setLocalPreview(true))
  }, [])
  return (
    <Panel title="Permissions">
      {localPreview && <LocalPreviewBanner />}
      {!localPreview && permissions.length === 0 && <HonestEmptyState area="permission" />}
      {permissions.slice(0, 20).map(p => (
        <div key={p.permission_key} style={{ borderBottom: `1px solid ${DARK_LINE}`, paddingBottom: 6, marginBottom: 6 }}>
          <div style={{ color: DARK_TEXT, fontSize: 12, fontWeight: 600 }}>{p.permission_key}</div>
          <div style={{ color: DARK_MUTE, fontSize: 11 }}>Group: {p.permission_group} · Mgr: {p.requires_manager_role ? 'Yes' : 'No'}</div>
        </div>
      ))}
    </Panel>
  )
}

function AssignmentsPanel() {
  const [assignments, setAssignments] = useState([])
  const [localPreview, setLocalPreview] = useState(false)
  useEffect(() => {
    fetch(`${API}/assignments`).then(r => r.json()).then(d => {
      if (d.localPreview) { setLocalPreview(true); return }
      setAssignments(d.assignments || [])
    }).catch(() => setLocalPreview(true))
  }, [])
  return (
    <Panel title="Staff Assignments">
      {localPreview && <LocalPreviewBanner />}
      {!localPreview && assignments.length === 0 && <HonestEmptyState area="assignment" />}
      {assignments.map(a => (
        <div key={a.id} style={{ borderBottom: `1px solid ${DARK_LINE}`, paddingBottom: 8, marginBottom: 8 }}>
          <div style={{ color: DARK_TEXT, fontSize: 12 }}>Type: {a.assignment_type}</div>
          <StatusBadge status={a.assignment_status} />
        </div>
      ))}
    </Panel>
  )
}

function SchedulePanel() {
  const [templates, setTemplates] = useState([])
  const [localPreview, setLocalPreview] = useState(false)
  useEffect(() => {
    fetch(`${API}/schedule-templates`).then(r => r.json()).then(d => {
      if (d.localPreview) { setLocalPreview(true); return }
      setTemplates(d.templates || [])
    }).catch(() => setLocalPreview(true))
  }, [])
  return (
    <Panel title="Schedule Templates">
      {localPreview && <LocalPreviewBanner />}
      {!localPreview && templates.length === 0 && <HonestEmptyState area="schedule template" />}
      {templates.map(t => (
        <div key={t.id} style={{ borderBottom: `1px solid ${DARK_LINE}`, paddingBottom: 8, marginBottom: 8 }}>
          <div style={{ color: DARK_TEXT, fontWeight: 600 }}>{t.template_name}</div>
        </div>
      ))}
    </Panel>
  )
}

function ShiftsPanel() {
  const [shifts, setShifts] = useState([])
  const [localPreview, setLocalPreview] = useState(false)
  useEffect(() => {
    fetch(`${API}/shifts`).then(r => r.json()).then(d => {
      if (d.localPreview) { setLocalPreview(true); return }
      setShifts(d.shifts || [])
    }).catch(() => setLocalPreview(true))
  }, [])
  return (
    <Panel title="Scheduled Shifts">
      {localPreview && <LocalPreviewBanner />}
      <HonestNote text="Schedule notifications have not been sent. Publishing is a local placeholder only." />
      {!localPreview && shifts.length === 0 && <HonestEmptyState area="shift" />}
      {shifts.map(s => (
        <div key={s.id} style={{ borderBottom: `1px solid ${DARK_LINE}`, paddingBottom: 8, marginBottom: 8 }}>
          <div style={{ color: DARK_TEXT, fontSize: 12 }}>Date: {s.shift_date} · {s.start_time}–{s.end_time}</div>
          <StatusBadge status={s.shift_status} />
        </div>
      ))}
    </Panel>
  )
}

function AvailabilityPanel() {
  const [availability, setAvailability] = useState([])
  const [localPreview, setLocalPreview] = useState(false)
  useEffect(() => {
    fetch(`${API}/availability`).then(r => r.json()).then(d => {
      if (d.localPreview) { setLocalPreview(true); return }
      setAvailability(d.availability || [])
    }).catch(() => setLocalPreview(true))
  }, [])
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return (
    <Panel title="Staff Availability">
      {localPreview && <LocalPreviewBanner />}
      {!localPreview && availability.length === 0 && <HonestEmptyState area="availability" />}
      {availability.map(a => (
        <div key={a.id} style={{ borderBottom: `1px solid ${DARK_LINE}`, paddingBottom: 6, marginBottom: 6 }}>
          <div style={{ color: DARK_TEXT, fontSize: 12 }}>{days[a.day_of_week]}: {a.available_start_time}–{a.available_end_time}</div>
          <div style={{ color: DARK_MUTE, fontSize: 11 }}>Preference: {a.preference_level}</div>
        </div>
      ))}
    </Panel>
  )
}

function TimeOffPanel() {
  const [requests, setRequests] = useState([])
  const [localPreview, setLocalPreview] = useState(false)
  useEffect(() => {
    fetch(`${API}/time-off`).then(r => r.json()).then(d => {
      if (d.localPreview) { setLocalPreview(true); return }
      setRequests(d.requests || [])
    }).catch(() => setLocalPreview(true))
  }, [])
  return (
    <Panel title="Time Off Requests">
      {localPreview && <LocalPreviewBanner />}
      {!localPreview && requests.length === 0 && <HonestEmptyState area="time off request" />}
      {requests.map(r => (
        <div key={r.id} style={{ borderBottom: `1px solid ${DARK_LINE}`, paddingBottom: 8, marginBottom: 8 }}>
          <div style={{ color: DARK_TEXT, fontSize: 12 }}>{r.request_type}: {r.request_start_date} – {r.request_end_date}</div>
          <StatusBadge status={r.request_status} />
        </div>
      ))}
    </Panel>
  )
}

function TimeClockPanel() {
  const [punches, setPunches] = useState([])
  const [localPreview, setLocalPreview] = useState(false)
  useEffect(() => {
    fetch(`${API}/time-clock`).then(r => r.json()).then(d => {
      if (d.localPreview) { setLocalPreview(true); return }
      setPunches(d.punches || [])
    }).catch(() => setLocalPreview(true))
  }, [])
  return (
    <Panel title="Time Clock Punches">
      {localPreview && <LocalPreviewBanner />}
      <HonestNote text="Time clock is a local record. No external timeclock provider is connected. No wages have been processed." />
      {!localPreview && punches.length === 0 && <HonestEmptyState area="time clock punch" />}
      {punches.map(p => (
        <div key={p.id} style={{ borderBottom: `1px solid ${DARK_LINE}`, paddingBottom: 6, marginBottom: 6 }}>
          <div style={{ color: DARK_TEXT, fontSize: 12 }}>{p.punch_type} @ {p.punch_time}</div>
          <StatusBadge status={p.punch_status} />
        </div>
      ))}
    </Panel>
  )
}

function BreaksPanel() {
  const [breaks, setBreaks] = useState([])
  const [localPreview, setLocalPreview] = useState(false)
  useEffect(() => {
    fetch(`${API}/breaks`).then(r => r.json()).then(d => {
      if (d.localPreview) { setLocalPreview(true); return }
      setBreaks(d.breaks || [])
    }).catch(() => setLocalPreview(true))
  }, [])
  return (
    <Panel title="Break Records">
      {localPreview && <LocalPreviewBanner />}
      {!localPreview && breaks.length === 0 && <HonestEmptyState area="break record" />}
      {breaks.map(b => (
        <div key={b.id} style={{ borderBottom: `1px solid ${DARK_LINE}`, paddingBottom: 6, marginBottom: 6 }}>
          <div style={{ color: DARK_TEXT, fontSize: 12 }}>Type: {b.break_type}</div>
          <StatusBadge status={b.break_status} />
        </div>
      ))}
    </Panel>
  )
}

function LaborSummariesPanel() {
  const [summaries, setSummaries] = useState([])
  const [localPreview, setLocalPreview] = useState(false)
  useEffect(() => {
    fetch(`${API}/labor-summaries`).then(r => r.json()).then(d => {
      if (d.localPreview) { setLocalPreview(true); return }
      setSummaries(d.summaries || [])
    }).catch(() => setLocalPreview(true))
  }, [])
  return (
    <Panel title="Labor Summaries">
      {localPreview && <LocalPreviewBanner />}
      <HonestNote text="Labor cost is a placeholder only. No wage data is connected. No payroll has been processed." />
      {!localPreview && summaries.length === 0 && <HonestEmptyState area="labor summary" />}
      {summaries.map(s => (
        <div key={s.id} style={{ borderBottom: `1px solid ${DARK_LINE}`, paddingBottom: 8, marginBottom: 8 }}>
          <div style={{ color: DARK_TEXT, fontSize: 12 }}>{s.summary_date}: Sched {s.scheduled_minutes}m / Actual {s.actual_minutes}m</div>
          <div style={{ color: DARK_MUTE, fontSize: 11 }}>Payroll connected: {s.payroll_connected ? 'Yes' : 'No'}</div>
          <StatusBadge status={s.summary_status} />
        </div>
      ))}
    </Panel>
  )
}

function GovernancePanel() {
  const [rules, setRules] = useState([])
  const [localPreview, setLocalPreview] = useState(false)
  useEffect(() => {
    fetch(`${API}/governance-rules`).then(r => r.json()).then(d => {
      if (d.localPreview) { setLocalPreview(true); return }
      setRules(d.rules || [])
    }).catch(() => setLocalPreview(true))
  }, [])
  return (
    <Panel title="Manager Governance Rules">
      {localPreview && <LocalPreviewBanner />}
      {!localPreview && rules.length === 0 && <HonestEmptyState area="governance rule" />}
      {rules.map(r => (
        <div key={r.id} style={{ borderBottom: `1px solid ${DARK_LINE}`, paddingBottom: 8, marginBottom: 8 }}>
          <div style={{ color: DARK_TEXT, fontSize: 12 }}>{r.protected_action}</div>
          <div style={{ color: DARK_MUTE, fontSize: 11 }}>Requires approval: {r.requires_manager_approval ? 'Yes' : 'No'}</div>
        </div>
      ))}
    </Panel>
  )
}

function ApprovalsPanel() {
  const [approvals, setApprovals] = useState([])
  const [localPreview, setLocalPreview] = useState(false)
  useEffect(() => {
    fetch(`${API}/approval-requests`).then(r => r.json()).then(d => {
      if (d.localPreview) { setLocalPreview(true); return }
      setApprovals(d.approvals || [])
    }).catch(() => setLocalPreview(true))
  }, [])
  return (
    <Panel title="Manager Approval Requests">
      {localPreview && <LocalPreviewBanner />}
      {!localPreview && approvals.length === 0 && <HonestEmptyState area="approval request" />}
      {approvals.map(a => (
        <div key={a.id} style={{ borderBottom: `1px solid ${DARK_LINE}`, paddingBottom: 8, marginBottom: 8 }}>
          <div style={{ color: DARK_TEXT, fontSize: 12 }}>{a.protected_action} · {a.entity_type}</div>
          <StatusBadge status={a.approval_status} />
        </div>
      ))}
    </Panel>
  )
}

function RiskFlagsPanel() {
  const [flags, setFlags] = useState([])
  const [localPreview, setLocalPreview] = useState(false)
  useEffect(() => {
    fetch(`${API}/risk-flags`).then(r => r.json()).then(d => {
      if (d.localPreview) { setLocalPreview(true); return }
      setFlags(d.flags || [])
    }).catch(() => setLocalPreview(true))
  }, [])
  return (
    <Panel title="Staff Risk Flags" accent={RED}>
      {localPreview && <LocalPreviewBanner />}
      {!localPreview && flags.length === 0 && <HonestEmptyState area="risk flag" />}
      {flags.map(f => (
        <div key={f.id} style={{ borderBottom: `1px solid ${DARK_LINE}`, paddingBottom: 8, marginBottom: 8 }}>
          <div style={{ color: RED, fontSize: 12, fontWeight: 600 }}>{f.risk_type}</div>
          <StatusBadge status={f.risk_status} />
        </div>
      ))}
    </Panel>
  )
}

function LaborInsightsPanel() {
  const [insights, setInsights] = useState([])
  const [summary, setSummary] = useState(null)
  const [localPreview, setLocalPreview] = useState(false)
  useEffect(() => {
    fetch(`${API}/labor-insights`).then(r => r.json()).then(d => {
      if (d.localPreview) { setLocalPreview(true); return }
      setInsights(d.insights || [])
    }).catch(() => setLocalPreview(true))
    fetch(`${API}/labor-intelligence`).then(r => r.json()).then(d => {
      setSummary(d)
    }).catch(() => {})
  }, [])
  return (
    <Panel title="Labor Intelligence & E.A.T. Insights">
      {localPreview && <LocalPreviewBanner />}
      <HonestNote text="E.A.T. labor insights are not connected yet. All insights are placeholders only." />
      {summary && !summary.localPreview && (
        <div style={{ marginBottom: 12, color: DARK_TEXT, fontSize: 12 }}>
          Total staff: {summary.totalProfiles} · Active shifts: {summary.activeShifts} · Pending approvals: {summary.pendingApprovals}
        </div>
      )}
      {!localPreview && insights.length === 0 && <HonestEmptyState area="labor insight" />}
      {insights.map(i => (
        <div key={i.id} style={{ borderBottom: `1px solid ${DARK_LINE}`, paddingBottom: 8, marginBottom: 8 }}>
          <div style={{ color: DARK_TEXT, fontSize: 12 }}>{i.insight_type}</div>
          <div style={{ color: DARK_MUTE, fontSize: 11 }}>State: {i.honest_state}</div>
        </div>
      ))}
    </Panel>
  )
}

function PayrollPanel() {
  const [profiles, setProfiles] = useState([])
  const [localPreview, setLocalPreview] = useState(false)
  useEffect(() => {
    fetch(`${API}/payroll-providers`).then(r => r.json()).then(d => {
      if (d.localPreview) { setLocalPreview(true); return }
      setProfiles(d.profiles || [])
    }).catch(() => setLocalPreview(true))
  }, [])
  return (
    <Panel title="Payroll Provider Profiles">
      {localPreview && <LocalPreviewBanner />}
      <HonestNote text="Payroll provider is not connected. No wages have been processed. No payroll has been processed. This is a local record placeholder only." />
      {!localPreview && profiles.length === 0 && <HonestEmptyState area="payroll provider" />}
      {profiles.map(p => (
        <div key={p.id} style={{ borderBottom: `1px solid ${DARK_LINE}`, paddingBottom: 8, marginBottom: 8 }}>
          <div style={{ color: DARK_TEXT, fontWeight: 600 }}>{p.provider_name}</div>
          <div style={{ color: DARK_MUTE, fontSize: 11 }}>Stores secrets: {p.stores_secrets ? 'Yes' : 'No'}</div>
          <StatusBadge status={p.provider_status} />
        </div>
      ))}
    </Panel>
  )
}

function OfflineQueuePanel() {
  const [queue, setQueue] = useState([])
  const [localPreview, setLocalPreview] = useState(false)
  useEffect(() => {
    fetch(`${API}/offline-queue`).then(r => r.json()).then(d => {
      if (d.localPreview) { setLocalPreview(true); return }
      setQueue(d.queue || [])
    }).catch(() => setLocalPreview(true))
  }, [])
  return (
    <Panel title="Offline Queue">
      {localPreview && <LocalPreviewBanner />}
      <HonestNote text="Action queued for sync when connection is restored. No data has been sent to the server while offline." />
      {!localPreview && queue.length === 0 && <HonestEmptyState area="offline queue" />}
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
  'Profiles': StaffProfilesPanel,
  'Roles': StaffRolesPanel,
  'Permissions': PermissionsPanel,
  'Assignments': AssignmentsPanel,
  'Schedule': SchedulePanel,
  'Shifts': ShiftsPanel,
  'Availability': AvailabilityPanel,
  'Time Off': TimeOffPanel,
  'Time Clock': TimeClockPanel,
  'Breaks': BreaksPanel,
  'Labor Summaries': LaborSummariesPanel,
  'Governance': GovernancePanel,
  'Approvals': ApprovalsPanel,
  'Risk Flags': RiskFlagsPanel,
  'Labor Insights': LaborInsightsPanel,
  'Payroll': PayrollPanel,
  'Offline Queue': OfflineQueuePanel,
}

export default function POS360StaffLaborGovernance() {
  const [activeTab, setActiveTab] = useState('Profiles')
  const ActivePanel = PANEL_MAP[activeTab] || (() => null)

  return (
    <div style={{ minHeight: '100vh', background: DARK_BG, color: DARK_TEXT, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: DARK_CARD, borderBottom: `2px solid ${GOLD}`, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <img src="/smokecraft-pos360.png" alt="SmokeCraft POS360" style={{ height: 44 }} />
        <div>
          <div style={{ color: GOLD, fontWeight: 800, fontSize: 20, letterSpacing: 2 }}>POS360 · STAFF & LABOR GOVERNANCE</div>
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
            borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontWeight: activeTab === tab ? 700 : 400
          }}>{tab}</button>
        ))}
      </div>

      <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
        <ActivePanel />
      </div>
    </div>
  )
}
