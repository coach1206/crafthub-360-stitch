import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Pill, Btn, GOLD } from '../../components/eat/ui.jsx'
import { LightShell, LightCard, L_NAVY, L_GOLD } from '../../components/eat/lightTheme.jsx'
import { subscribe, getOpsEvents } from '../../services/shared/opsEventBus.js'
import { completeCommand, receiveCommand } from '../../services/shared/opsControlBridge.js'
import { getTickets } from '../../services/pos3/pos3Service.js'
import { EAT_ALERTS, EAT_STAFF, EAT_SECTIONS } from '../../data/eat/seedData.js'
import { getEatOpsSnapshot } from '../../services/eat/eatOpsAnalyticsService.js'
import RevenuePanel from '../../components/eat/RevenuePanel.jsx'
import LiveTicketsPanel from '../../components/eat/LiveTicketsPanel.jsx'
import InventoryImpactPanel from '../../components/eat/InventoryImpactPanel.jsx'
import StaffActivityPanel from '../../components/eat/StaffActivityPanel.jsx'
import SyncStatusPanel from '../../components/staff/SyncStatusPanel.jsx'
import SyncConflictReviewPanel from '../../components/staff/SyncConflictReviewPanel.jsx'
import SyncAuditTimelinePanel from '../../components/staff/SyncAuditTimelinePanel.jsx'

const COMMAND_TABS = [
  { label: 'Floor Plan',       to: null,            disabledReason: 'Floor plan drag/drop editor is not yet built' },
  { label: 'Table Assignment', to: null,            disabledReason: 'Table assignment workflow is not yet built' },
  { label: 'Sections & Zones', to: '/eat/sections' },
  { label: 'Reservations',     to: null,            disabledReason: 'Reservations system is not yet built' },
  { label: 'Staff Assignment', to: '/eat/staff' },
]

/** Re-imported helper so opsEventBus has getOpsEvents */
function useOpsFeed() {
  const [feed, setFeed] = useState([])
  const refresh = () => setFeed([...getOpsEvents()].sort((a, b) => b.createdAt - a.createdAt))
  useEffect(() => { refresh(); return subscribe(() => refresh()) }, [])
  return [feed, refresh]
}

function useEatSnapshot() {
  const [snapshot, setSnapshot] = useState(() => getEatOpsSnapshot())
  const refresh = () => setSnapshot(getEatOpsSnapshot())
  useEffect(() => { refresh(); return subscribe(() => refresh()) }, [])
  return [snapshot, refresh]
}

export default function EATCommandHub() {
  const navigate = useNavigate()
  const [feed, refresh] = useOpsFeed()
  const [snapshot] = useEatSnapshot()
  const eatTargeted = feed.filter((e) => e.targetSystem === 'EAT')
  const openTickets = getTickets().filter((t) => !['paid'].includes(t.status)).length
  const pendingHumidor = eatTargeted.filter((e) => e.commandType === 'CIGAR_REQUESTED' && e.status !== 'completed').length

  function markReceived(ev) {
    receiveCommand(ev.id); refresh()
  }

  function markCompleted(ev) {
    completeCommand(ev.id); refresh()
  }

  return (
    <LightShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 22px', background: '#fff', borderBottom: '1px solid rgba(19,41,75,0.08)', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src="/assets/eat/crafthub-gauge-badge.png"
            alt=""
            style={{ width: 44, height: 22, objectFit: 'cover', borderRadius: 5, border: '1px solid rgba(19,41,75,0.12)', flexShrink: 0 }}
          />
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: L_NAVY, letterSpacing: '0.02em' }}>E.A.T. SYSTEM <span style={{ fontSize: 11, fontWeight: 700, color: '#8b95a3', marginLeft: 6 }}>POS 3</span></div>
            <div style={{ fontSize: 11, fontWeight: 700, color: L_GOLD, letterSpacing: '0.08em' }}>VENUE COMMAND CENTER</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#1f7a45', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3ddc84', display: 'inline-block' }} /> Online
          </span>
          <Pill label="Sync — Local Data Only" tone="pending" />
          <button type="button" onClick={() => navigate('/system-overview')} style={{ background: 'none', border: '1px solid rgba(19,41,75,0.2)', color: L_NAVY, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Switch Mode</button>
        </div>
      </div>

      <div style={{ padding: '14px 22px 0' }}>
        <img
          src="/assets/eat/cropped/EAT system  UPDATE.png"
          alt=""
          style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 14, border: '1px solid rgba(19,41,75,0.08)' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '12px 22px 0', overflowX: 'auto', background: '#fff', borderBottom: '1px solid rgba(19,41,75,0.08)' }}>
        {COMMAND_TABS.map((t) => (
          <button
            key={t.label}
            type="button"
            disabled={!t.to}
            title={!t.to ? t.disabledReason : undefined}
            onClick={t.to ? () => navigate(t.to) : undefined}
            style={{
              flexShrink: 0, padding: '10px 14px', borderRadius: '10px 10px 0 0', border: 'none',
              borderBottom: t.to ? `3px solid ${L_GOLD}` : '3px solid transparent',
              background: 'transparent', color: t.to ? L_NAVY : '#aab3bf', fontWeight: 700, fontSize: 12.5,
              cursor: t.to ? 'pointer' : 'not-allowed', opacity: t.to ? 1 : 0.55,
            }}
          >{t.label}</button>
        ))}
      </div>

      <div style={{ padding: 22 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <LightCard style={{ flex: 1, minWidth: 140, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8b95a3', fontWeight: 700 }}>Open Tickets</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: L_NAVY, marginTop: 4 }}>{openTickets}</div>
          </LightCard>
          <LightCard style={{ flex: 1, minWidth: 140, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8b95a3', fontWeight: 700 }}>Pending Humidor Requests</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: pendingHumidor ? '#b33b3b' : L_NAVY, marginTop: 4 }}>{pendingHumidor}</div>
          </LightCard>
          <LightCard style={{ flex: 1, minWidth: 140, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8b95a3', fontWeight: 700 }}>Active Alerts</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#b33b3b', marginTop: 4 }}>{EAT_ALERTS.length}</div>
          </LightCard>
          <LightCard style={{ flex: 1, minWidth: 140, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8b95a3', fontWeight: 700 }}>Total Ops Events</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: L_NAVY, marginTop: 4 }}>{feed.length}</div>
          </LightCard>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 20 }}>
          <LightCard style={{ padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: L_NAVY, marginBottom: 8 }}>STAFF ASSIGNMENT</div>
            {EAT_STAFF.slice(0, 3).map((s) => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: '#4a5266' }}>
                <span>{s.name} · {s.role}</span>
                <Pill label={s.status} tone={s.status === 'on-shift' ? 'open' : s.status === 'on-break' ? 'warning' : 'dirty'} />
              </div>
            ))}
            <button type="button" onClick={() => navigate('/eat/staff')} style={{ background: 'none', border: 'none', color: '#2a4d8f', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginTop: 6 }}>View Staff →</button>
          </LightCard>
          <LightCard style={{ padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: L_NAVY, marginBottom: 8 }}>SECTIONS & ZONES</div>
            {EAT_SECTIONS.slice(0, 3).map((s) => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: '#4a5266' }}>
                <span>{s.name} · {s.tables} tables</span>
                <Pill label={s.status} tone={s.status === 'active' ? 'open' : 'dirty'} />
              </div>
            ))}
            <button type="button" onClick={() => navigate('/eat/sections')} style={{ background: 'none', border: 'none', color: '#2a4d8f', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginTop: 6 }}>View Sections →</button>
          </LightCard>
          <LightCard style={{ padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: L_NAVY, marginBottom: 8 }}>SYSTEM STATUS</div>
            {['POS Terminals', 'Kitchen Display', 'Bar Display', 'Humidor Monitor'].map((label) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: '#4a5266' }}>
                <span>{label}</span>
                <span style={{ color: '#1f7a45', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3ddc84', display: 'inline-block' }} /> Online
                </span>
              </div>
            ))}
          </LightCard>
        </div>

        <div style={{ marginBottom: 20 }}>
          <Btn tone="purple" onClick={() => navigate('/eat/operations')}>Open Operations View</Btn>
        </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Live Ops Feed</div>
          {!feed.length && <div style={{ color: '#8b95a3' }}>No ops events yet.</div>}
          {feed.slice(0, 25).map((e) => {
            const actionable = e.targetSystem === 'EAT' && e.status !== 'completed'
            return (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <Pill label={e.status} tone={e.status === 'completed' ? 'paid' : 'pending'} />
                  <span style={{ marginLeft: 8, fontSize: 13 }}>{e.eventType || e.commandType}</span>
                  <div style={{ fontSize: 11, color: '#8b95a3', marginTop: 2 }}>{e.sourceSystem} → {e.targetSystem}{e.ticketId ? ` · ${e.ticketId}` : ''}{e.payload?.label ? ` · ${e.payload.label}` : ''}</div>
                </div>
                {actionable && e.status === 'pending' && <Btn tone="green" onClick={() => markReceived(e)} style={{ padding: '7px 12px', fontSize: 12 }}>Mark Received</Btn>}
                {actionable && e.status === 'received' && <Btn tone="green" onClick={() => markCompleted(e)} style={{ padding: '7px 12px', fontSize: 12 }}>Mark Completed</Btn>}
              </div>
            )
          })}
        </Card>
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Active Alerts</div>
          {EAT_ALERTS.map((a) => (
            <div key={a.id} style={{ padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <Pill label={a.level} tone={a.level} />
              <div style={{ fontSize: 13, marginTop: 4 }}>{a.message}</div>
            </div>
          ))}
        </Card>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <RevenuePanel revenueToday={snapshot.revenueToday} destinationBreakdown={snapshot.destinationBreakdown} />
        <LiveTicketsPanel tickets={snapshot.recentTickets} ticketCounts={snapshot.ticketCounts} />
        <InventoryImpactPanel impacts={snapshot.inventoryImpacts} voidsAndComps={snapshot.voidsAndComps} />
        <StaffActivityPanel activity={snapshot.staffActivity} activityCounts={snapshot.staffActivityCounts} />
        <SyncStatusPanel />
        <SyncConflictReviewPanel />
        <SyncAuditTimelinePanel />
      </div>
      </div>
    </LightShell>
  )
}
