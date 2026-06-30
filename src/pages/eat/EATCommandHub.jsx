import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EatManagementLayout, EatCard, EatBtn, EAT_GOLD, L_NAVY, LightPill } from '../../components/eat/lightTheme.jsx'
import { subscribe, getOpsEvents, SYSTEMS } from '../../services/shared/opsEventBus.js'
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

const STATION_CARDS = [
  { label: 'Kitchen',  to: '/eat/kitchen' },
  { label: 'Bar',      to: '/eat/bar' },
  { label: 'Humidor',  to: '/eat/humidor' },
  { label: 'Floor / Sections', to: '/eat/sections' },
  { label: 'Patio',    to: null, disabledReason: 'Patio is not tracked as a separate section yet — see Sections & Zones' },
  { label: 'Inventory', to: '/eat/inventory' },
  { label: 'Staff',     to: '/eat/staff' },
  { label: 'Reports',   to: '/eat/reports' },
]

const DECISION_HUB_ITEMS = [
  { label: 'Seating / Reservation Flow', to: null, disabledReason: 'Reservations system is not yet built' },
  { label: 'Manager Alerts',             to: null, disabledReason: 'Surfaced below in Active Alerts — dedicated alerts route not yet built' },
  { label: 'Revenue Snapshot',           to: '/eat/reports' },
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
  const pos3Feed = feed.filter((e) => e.sourceSystem === SYSTEMS.POS3 || e.targetSystem === SYSTEMS.POS3)
  const smokecraftFeed = feed.filter((e) => e.sourceSystem === SYSTEMS.SMOKECRAFT || e.targetSystem === SYSTEMS.SMOKECRAFT)
  const lastEventAt = (events) => events.length ? new Date(events[0].createdAt).toLocaleTimeString() : 'No events yet'

  function markReceived(ev) {
    receiveCommand(ev.id); refresh()
  }

  function markCompleted(ev) {
    completeCommand(ev.id); refresh()
  }

  return (
    <EatManagementLayout title="Command Hub" subtitle="Venue-wide overview">
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, overflowX: 'auto' }}>
        {COMMAND_TABS.map((t) => (
          <button
            key={t.label}
            type="button"
            disabled={!t.to}
            title={!t.to ? t.disabledReason : undefined}
            onClick={t.to ? () => navigate(t.to) : undefined}
            style={{
              flexShrink: 0, padding: '9px 14px', borderRadius: 10, border: `1px solid ${t.to ? EAT_GOLD : 'rgba(19,41,75,0.1)'}`,
              background: t.to ? 'rgba(212,168,67,0.12)' : '#f1efe9', color: t.to ? '#9c7320' : '#8b95a3', fontWeight: 700, fontSize: 12.5,
              cursor: t.to ? 'pointer' : 'not-allowed', opacity: t.to ? 1 : 0.7,
            }}
          >{t.label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <EatCard style={{ flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8b95a3', fontWeight: 700 }}>Open Tickets</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: L_NAVY, marginTop: 4 }}>{openTickets}</div>
        </EatCard>
        <EatCard style={{ flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8b95a3', fontWeight: 700 }}>Pending Humidor Requests</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: pendingHumidor ? '#b33b3b' : L_NAVY, marginTop: 4 }}>{pendingHumidor}</div>
        </EatCard>
        <EatCard style={{ flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8b95a3', fontWeight: 700 }}>Active Alerts</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#b33b3b', marginTop: 4 }}>{EAT_ALERTS.length}</div>
        </EatCard>
        <EatCard style={{ flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8b95a3', fontWeight: 700 }}>Total Ops Events</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: L_NAVY, marginTop: 4 }}>{feed.length}</div>
        </EatCard>
      </div>

      <div style={{ fontSize: 11, fontWeight: 800, color: '#9c7320', letterSpacing: '0.08em', marginBottom: 8 }}>STATION QUICK ACCESS</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 18 }}>
        {STATION_CARDS.map((s) => (
          <EatCard key={s.label} onClick={s.to ? () => navigate(s.to) : undefined} title={!s.to ? s.disabledReason : undefined}
            style={{ padding: '12px 14px', opacity: s.to ? 1 : 0.55, cursor: s.to ? 'pointer' : 'not-allowed' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: s.to ? L_NAVY : '#8b95a3' }}>{s.label}</div>
            <div style={{ fontSize: 11, color: '#8b95a3', marginTop: 2 }}>{s.to ? 'Open station →' : 'Not yet built'}</div>
          </EatCard>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 20 }}>
        <EatCard style={{ padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#9c7320', marginBottom: 8 }}>STAFF ASSIGNMENT</div>
          {EAT_STAFF.slice(0, 3).map((s) => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: '#1c2230' }}>
              <span>{s.name} · {s.role}</span>
              <LightPill tone={s.status === 'on-shift' ? 'green' : s.status === 'on-break' ? 'gold' : 'navy'}>{s.status}</LightPill>
            </div>
          ))}
          <button type="button" onClick={() => navigate('/eat/staff')} style={{ background: 'none', border: 'none', color: '#9c7320', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginTop: 6 }}>View Staff →</button>
        </EatCard>
        <EatCard style={{ padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#9c7320', marginBottom: 8 }}>SECTIONS & ZONES</div>
          {EAT_SECTIONS.slice(0, 3).map((s) => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: '#1c2230' }}>
              <span>{s.name} · {s.tables} tables</span>
              <LightPill tone={s.status === 'active' ? 'green' : 'navy'}>{s.status}</LightPill>
            </div>
          ))}
          <button type="button" onClick={() => navigate('/eat/sections')} style={{ background: 'none', border: 'none', color: '#9c7320', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginTop: 6 }}>View Sections →</button>
        </EatCard>
        <EatCard style={{ padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#9c7320', marginBottom: 8 }}>POS3 SYNC</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: '#1c2230' }}>
            <span>Events with POS 3</span><span>{pos3Feed.length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: '#1c2230' }}>
            <span>Last activity</span><span>{lastEventAt(pos3Feed)}</span>
          </div>
          <button type="button" onClick={() => navigate('/eat/pos-control')} style={{ background: 'none', border: 'none', color: '#9c7320', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginTop: 6 }}>Open POS Control →</button>
        </EatCard>
        <EatCard style={{ padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#9c7320', marginBottom: 8 }}>SMOKECRAFT SYNC</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: '#1c2230' }}>
            <span>Events with SmokeCraft</span><span>{smokecraftFeed.length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: '#1c2230' }}>
            <span>Last activity</span><span>{lastEventAt(smokecraftFeed)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: '#1c2230' }}>
            <span>Pending humidor requests</span><span>{pendingHumidor}</span>
          </div>
        </EatCard>
        <EatCard onClick={() => navigate('/eat/humidor')} style={{ padding: 14, cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center' }}>
          <img src="/assets/smokecraft/cropped/humidor-match-hero.jpg" alt="Humidor" style={{ width: 48, height: 64, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#9c7320', marginBottom: 4 }}>HUMIDOR SPOTLIGHT</div>
            <div style={{ fontSize: 12, color: '#1c2230', fontWeight: 700 }}>Cigar requests &amp; stock</div>
            <div style={{ fontSize: 11, color: '#8b95a3', marginTop: 2 }}>Open Humidor →</div>
          </div>
        </EatCard>
      </div>

      <div style={{ marginBottom: 20 }}>
        <EatBtn tone="purple" onClick={() => navigate('/eat/operations')}>Open Operations View</EatBtn>
      </div>

      <div style={{ fontSize: 11, fontWeight: 800, color: '#9c7320', letterSpacing: '0.08em', marginBottom: 8 }}>DECISION HUB</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 20 }}>
        {DECISION_HUB_ITEMS.map((d) => (
          <EatCard key={d.label} onClick={d.to ? () => navigate(d.to) : undefined} title={!d.to ? d.disabledReason : undefined}
            style={{ padding: '12px 14px', opacity: d.to ? 1 : 0.55, cursor: d.to ? 'pointer' : 'not-allowed' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: d.to ? L_NAVY : '#8b95a3' }}>{d.label}</div>
            <div style={{ fontSize: 11, color: '#8b95a3', marginTop: 2 }}>{d.to ? 'Open →' : 'Not yet built'}</div>
          </EatCard>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 16, marginBottom: 16 }}>
        <EatCard>
          <div style={{ fontWeight: 700, marginBottom: 12, color: L_NAVY }}>Live Ops Feed</div>
          {!feed.length && <div style={{ color: '#8b95a3' }}>No ops events yet.</div>}
          {feed.slice(0, 25).map((e) => {
            const actionable = e.targetSystem === 'EAT' && e.status !== 'completed'
            return (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderTop: '1px solid rgba(19,41,75,0.06)' }}>
                <div>
                  <LightPill tone={e.status === 'completed' ? 'green' : 'gold'}>{e.status}</LightPill>
                  <span style={{ marginLeft: 8, fontSize: 13, color: '#1c2230' }}>{e.eventType || e.commandType}</span>
                  <div style={{ fontSize: 11, color: '#8b95a3', marginTop: 2 }}>{e.sourceSystem} → {e.targetSystem}{e.ticketId ? ` · ${e.ticketId}` : ''}{e.payload?.label ? ` · ${e.payload.label}` : ''}</div>
                </div>
                {actionable && e.status === 'pending' && <EatBtn tone="green" onClick={() => markReceived(e)} style={{ padding: '7px 12px', fontSize: 12 }}>Mark Received</EatBtn>}
                {actionable && e.status === 'received' && <EatBtn tone="green" onClick={() => markCompleted(e)} style={{ padding: '7px 12px', fontSize: 12 }}>Mark Completed</EatBtn>}
              </div>
            )
          })}
        </EatCard>
        <EatCard>
          <div style={{ fontWeight: 700, marginBottom: 12, color: L_NAVY }}>Active Alerts</div>
          {EAT_ALERTS.map((a) => (
            <div key={a.id} style={{ padding: '8px 0', borderTop: '1px solid rgba(19,41,75,0.06)' }}>
              <LightPill tone={a.level === 'critical' ? 'red' : a.level === 'warning' ? 'gold' : 'blue'}>{a.level}</LightPill>
              <div style={{ fontSize: 13, marginTop: 4, color: '#1c2230' }}>{a.message}</div>
            </div>
          ))}
        </EatCard>
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
    </EatManagementLayout>
  )
}
