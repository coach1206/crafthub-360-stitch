import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pill, Btn } from '../../components/eat/ui.jsx'
import { LightShell, LightBottomNav, L_NAVY, L_GOLD } from '../../components/eat/lightTheme.jsx'
import { getTables, getTickets, ticketTotals } from '../../services/pos3/pos3Service.js'
import { subscribe, eventsFor } from '../../services/shared/opsEventBus.js'
import { completeCommand, receiveCommand } from '../../services/shared/opsControlBridge.js'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { getSmokePOSHandoff, markSmokePurchaseVerified, markSmokePurchaseRejected, getDerivedPurchaseState } from '../../services/smokecraft/smokePOSHandoffService.js'
import { loadSmokePurchaseIntents, getSmokeSharedStorageMode, buildSmokeStorageStatusFields } from '../../services/smokecraft/smokeSharedStorageService.js'
import SmokeBackendReadinessPanel from '../../components/smokecraft/SmokeBackendReadinessPanel.jsx'

const TABLE_PHOTO_BY_INDEX = [
  '/assets/pos3/reference-crops/table-05.png',
  '/assets/pos3/reference-crops/table-03.png',
  '/assets/pos3/reference-crops/table-10.png',
  '/assets/pos3/reference-crops/table-07.png',
]

const TABLE_PREVIEW_COUNT = 4

/** Raised, image-backed card shell shared by the home-screen tile sections. Plain div
 * (not LightCard) because LightCard doesn't forward onMouseDown/onMouseUp — needed here
 * for the tactile pressed state. */
function RaisedTile({ onClick, children, style }) {
  return (
    <div
      onClick={onClick}
      onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)' }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
      style={{
        background: '#fff', borderRadius: 16, overflow: 'hidden', cursor: onClick ? 'pointer' : 'default',
        border: `1px solid rgba(201,149,44,0.25)`,
        boxShadow: '0 10px 24px rgba(19,41,75,0.16), 0 2px 6px rgba(19,41,75,0.10)',
        transition: 'transform 120ms ease, box-shadow 120ms ease',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** POS3 receiver hook — watches the shared bus for events/commands targeting POS3. */
export function usePos3Incoming() {
  const [items, setItems] = useState([])
  const refresh = () => {
    const evs = eventsFor('POS3')
      .filter((e) => e.status !== 'completed')
      .sort((a, b) => b.createdAt - a.createdAt)
    setItems(evs)
  }
  useEffect(() => {
    refresh()
    return subscribe(() => refresh())
  }, [])
  return [items, refresh]
}

export default function POS3Home() {
  const navigate = useNavigate()
  const tables = getTables()
  const tickets = getTickets().filter((t) => t.status !== 'paid')
  const [incoming, refresh] = usePos3Incoming()
  const { session, update } = useGuestSession()

  const openTickets = tickets.length
  const occupied = tables.filter((t) => t.status !== 'open' && t.status !== 'cleaning').length
  const posHandoff = getSmokePOSHandoff(session)
  const storageMode = getSmokeSharedStorageMode()
  const sharedIntents = loadSmokePurchaseIntents()
  const queueIsShared = storageMode.backendConnected && sharedIntents.data.length > 0
  const now = new Date()

  function markReceived(ev) {
    receiveCommand(ev.id)
    refresh()
  }

  function markCompleted(ev) {
    completeCommand(ev.id)
    refresh()
  }

  function logPosEvent(type, handoff) {
    update(prev => {
      const existingLog = prev.smokeCraft?.eventLog || []
      const derived = getDerivedPurchaseState({ ...prev, smokeCraft: { ...prev.smokeCraft, posHandoff: handoff } })
      const storageFields = buildSmokeStorageStatusFields('pos3_verification_update', handoff.syncResult)
      return {
        ...prev,
        smokeCraft: {
          ...prev.smokeCraft,
          posHandoff: handoff,
          purchaseRewards: derived.purchaseRewards,
          eatHandoff: derived.eatHandoff,
          ...storageFields,
          eventLog: [...existingLog,
            { type, timestamp: Date.now(), payload: { intentId: handoff.intentId } },
            { type: 'SMOKECRAFT_PURCHASE_VERIFICATION_SHARED_UPDATE_ATTEMPTED', timestamp: Date.now(), payload: { intentId: handoff.intentId, result: handoff.syncResult?.status } },
            { type: 'SMOKECRAFT_REMOTE_PURCHASE_VERIFICATION_ATTEMPTED', timestamp: Date.now(), payload: { intentId: handoff.intentId } },
          ].slice(-50),
        },
      }
    })
  }

  function verifySmokeCraftPurchase() {
    logPosEvent('SMOKECRAFT_POS_PURCHASE_VERIFIED', markSmokePurchaseVerified(session, {}))
  }

  function rejectSmokeCraftPurchase() {
    logPosEvent('SMOKECRAFT_POS_PURCHASE_REJECTED', markSmokePurchaseRejected(session, {}))
  }

  return (
    <LightShell style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 84, background: '#f7f6f2' }}>
      <div style={{ background: '#fff', padding: '14px 18px 12px', borderBottom: '1px solid rgba(19,41,75,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 21, fontWeight: 800, color: L_NAVY, letterSpacing: '-0.01em' }}>POS360 <span style={{ fontWeight: 600 }}>System</span></div>
            <div style={{ fontSize: 11, fontWeight: 700, color: L_GOLD, marginTop: 1 }}>Powered by NOVEE OS</div>
          </div>
          <div style={{ position: 'relative', width: 38, height: 38, borderRadius: '50%', background: '#f1efe9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: L_NAVY }}>notifications</span>
            {incoming.length > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, background: '#c43c3c', color: '#fff', borderRadius: 999, fontSize: 10, fontWeight: 700, padding: '1px 5px', minWidth: 16, textAlign: 'center' }}>{incoming.length}</span>
            )}
          </div>
        </div>
        <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700, color: L_NAVY }}>Good Evening, Alex! 👋</div>
        <div style={{ fontSize: 11, color: '#8b95a3', marginTop: 2 }}>
          {now.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · {now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
          <span style={{ color: '#2e9e5a', fontWeight: 700 }}> · Online</span>
        </div>
      </div>

      <div style={{ background: L_NAVY, color: '#fff', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderRadius: '0 0 18px 18px', boxShadow: '0 8px 18px rgba(19,41,75,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/assets/pos3/reference-crops/staff-avatar.png" alt="" style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${L_GOLD}` }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Jordan Smith</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 6 }}>
              Floor Supervisor
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3ddc84', display: 'inline-block' }} />
              On Duty
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" onClick={() => navigate('/pos3/tables')} style={{ background: 'transparent', border: `1px solid rgba(255,255,255,0.3)`, borderRadius: 10, color: '#fff', fontSize: 10, fontWeight: 700, padding: '8px 9px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: L_GOLD }}>qr_code_scanner</span>
            Scan Table
          </button>
          <button type="button" onClick={() => navigate('/pos3/handheld')} style={{ background: 'transparent', border: `1px solid rgba(255,255,255,0.3)`, borderRadius: 10, color: '#fff', fontSize: 10, fontWeight: 700, padding: '8px 9px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: L_GOLD }}>grid_view</span>
            Quick Actions
          </button>
        </div>
      </div>

      <div style={{ padding: '14px 16px 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <RaisedTile style={{ padding: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#8b95a3' }}>OPEN TICKETS</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: L_NAVY }}>{openTickets}</div>
        </RaisedTile>
        <RaisedTile style={{ padding: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#8b95a3' }}>OCCUPIED</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: L_NAVY }}>{occupied}</div>
        </RaisedTile>
        <RaisedTile style={{ padding: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#8b95a3' }}>INCOMING</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: incoming.length ? '#c43c3c' : L_NAVY }}>{incoming.length}</div>
        </RaisedTile>
      </div>

      {incoming.length > 0 && (
        <div style={{ padding: '14px 16px 0' }}>
          <RaisedTile style={{ padding: 14, borderColor: 'rgba(196,60,60,0.3)' }}>
            <div style={{ fontWeight: 700, marginBottom: 10, color: '#c43c3c', fontSize: 13 }}>Incoming Requests (SmokeCraft / E.A.T.)</div>
            {incoming.map((ev) => (
              <div key={ev.id} style={{ padding: '10px 0', borderTop: '1px solid rgba(19,41,75,0.06)' }}>
                <div style={{ marginBottom: 6 }}>
                  <Pill label={ev.status} tone={ev.status} />
                  <span style={{ marginLeft: 8, fontSize: 12 }}>{ev.payload?.label || ev.eventType} · from {ev.sourceSystem}</span>
                </div>
                {ev.status === 'pending' && (
                  <Btn tone="green" onClick={() => markReceived(ev)} style={{ padding: '8px 14px', fontSize: 12, width: '100%' }}>Mark Received</Btn>
                )}
                {ev.status === 'received' && (
                  <Btn tone="green" onClick={() => markCompleted(ev)} style={{ padding: '8px 14px', fontSize: 12, width: '100%' }}>Mark Completed</Btn>
                )}
              </div>
            ))}
          </RaisedTile>
        </div>
      )}

      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: L_NAVY, letterSpacing: '0.04em' }}>MY TABLES</div>
          <button type="button" onClick={() => navigate('/pos3/tables')} style={{ background: 'none', border: 'none', color: '#2a4d8f', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>View All</button>
        </div>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
          {tables.slice(0, TABLE_PREVIEW_COUNT).map((t, i) => (
            <RaisedTile key={t.id} onClick={() => navigate('/pos3/tables')} style={{ minWidth: 140, flex: '0 0 140px' }}>
              <div style={{ position: 'relative', height: 100 }}>
                <img
                  src={TABLE_PHOTO_BY_INDEX[i % TABLE_PHOTO_BY_INDEX.length]}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <div style={{ position: 'absolute', top: 8, right: 8 }}>
                  <Pill label={t.status} tone={t.status} />
                </div>
              </div>
              <div style={{ padding: '9px 10px' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: L_NAVY }}>{t.name}</div>
                <div style={{ fontSize: 11, color: '#8b95a3', margin: '4px 0 0' }}>{t.section} · {t.guests}/{t.seats}</div>
              </div>
            </RaisedTile>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: L_NAVY, letterSpacing: '0.04em' }}>ACTIVE ORDERS</div>
          <button type="button" onClick={() => navigate('/pos3/orders')} style={{ background: 'none', border: 'none', color: '#2a4d8f', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>View All</button>
        </div>
        <RaisedTile style={{ padding: 0 }}>
          {tickets.length === 0 && <div style={{ color: '#8b95a3', fontSize: 12, padding: 14 }}>No open tickets.</div>}
          {tickets.map((t, i) => (
            <div
              key={t.id}
              onClick={() => navigate('/pos3/orders?ticket=' + t.id)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: i < tickets.length - 1 ? '1px solid rgba(19,41,75,0.06)' : 'none', cursor: 'pointer' }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: L_NAVY }}>{t.id} · {t.tableId}</div>
                <div style={{ fontSize: 11, color: '#8b95a3' }}>{t.server} · {t.items.length} items</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Pill label={t.status} tone={t.status} />
                <div style={{ color: '#9c7320', fontWeight: 800, marginTop: 4, fontSize: 13 }}>${ticketTotals(t).total.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </RaisedTile>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        <RaisedTile style={{ padding: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13, color: L_NAVY }}>SmokeCraft Purchase Queue</div>
          <div style={{ fontSize: 11, color: '#8b95a3', marginBottom: 10 }}>
            Local/session-only — a real venue-wide queue requires a backend or shared event store. Showing the current guest session's handoff state.
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            <Pill label={'storage: ' + storageMode.mode.replaceAll('_', ' ')} tone={storageMode.backendConnected ? 'open' : 'pending'} />
            <Pill label={queueIsShared ? 'shared queue' : 'local-only queue'} tone={queueIsShared ? 'open' : 'pending'} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <SmokeBackendReadinessPanel compact />
          </div>
          {!posHandoff.intentId ? (
            <div style={{ fontSize: 13, color: '#8b95a3', padding: '8px 0' }}>No SmokeCraft purchase intent created yet.</div>
          ) : (
            <div style={{ padding: '10px 0', borderTop: '1px solid rgba(19,41,75,0.06)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: L_NAVY }}>{posHandoff.intentId}</div>
              <div style={{ fontSize: 12, color: '#8b95a3', margin: '4px 0' }}>Product: {posHandoff.product || 'Not specified'}</div>
              <span style={{ display: 'inline-flex', gap: 6, marginBottom: 8 }}>
                <Pill label={posHandoff.status} tone={posHandoff.status === 'verified' ? 'open' : posHandoff.status === 'rejected' ? 'critical' : 'pending'} />
                <Pill label={'verification: ' + posHandoff.verificationStatus} tone={posHandoff.verificationStatus === 'verified' ? 'open' : posHandoff.verificationStatus === 'rejected' ? 'critical' : 'pending'} />
              </span>
              {posHandoff.status !== 'verified' && posHandoff.status !== 'rejected' ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn tone="green" onClick={verifySmokeCraftPurchase} style={{ padding: '8px 14px', fontSize: 12, flex: 1 }}>Mark Verified</Btn>
                  <Btn tone="red" onClick={rejectSmokeCraftPurchase} style={{ padding: '8px 14px', fontSize: 12, flex: 1 }}>Reject</Btn>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: '#8b95a3' }}>Needs POS Verification: No</div>
              )}
            </div>
          )}
        </RaisedTile>
      </div>

      <div style={{ height: 16 }} />

      <LightBottomNav items={[
        { label: 'Home', icon: 'home', active: true, onClick: () => navigate('/pos3') },
        { label: 'Tables', icon: 'table_restaurant', onClick: () => navigate('/pos3/tables') },
        { label: 'Orders', icon: 'receipt_long', badge: tickets.length || undefined, onClick: () => navigate('/pos3/orders') },
        { label: 'Messages', icon: 'chat', disabled: true, disabledReason: 'Staff messaging is not yet built' },
        { label: 'More', icon: 'more_horiz', onClick: () => navigate('/pos3/settings') },
      ]} />
    </LightShell>
  )
}
