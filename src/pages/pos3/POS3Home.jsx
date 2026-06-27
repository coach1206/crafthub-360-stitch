import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pill, Btn } from '../../components/eat/ui.jsx'
import { LightShell, LightHeader, LightCard, LightBottomNav, L_NAVY } from '../../components/eat/lightTheme.jsx'
import { getTables, getTickets, ticketTotals } from '../../services/pos3/pos3Service.js'
import { subscribe, eventsFor } from '../../services/shared/opsEventBus.js'
import { completeCommand, receiveCommand } from '../../services/shared/opsControlBridge.js'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { getSmokePOSHandoff, markSmokePurchaseVerified, markSmokePurchaseRejected, getDerivedPurchaseState } from '../../services/smokecraft/smokePOSHandoffService.js'
import { loadSmokePurchaseIntents, getSmokeSharedStorageMode, buildSmokeStorageStatusFields } from '../../services/smokecraft/smokeSharedStorageService.js'
import SmokeBackendReadinessPanel from '../../components/smokecraft/SmokeBackendReadinessPanel.jsx'

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
  const occupied = tables.filter((t) => t.status === 'occupied').length
  const posHandoff = getSmokePOSHandoff(session)
  const storageMode = getSmokeSharedStorageMode()
  const sharedIntents = loadSmokePurchaseIntents()
  const queueIsShared = storageMode.backendConnected && sharedIntents.data.length > 0

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
    <LightShell style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 84 }}>
      <LightHeader eyebrow="POS 3 · PM Shift" title="Hospitality Terminal" subtitle="System Online" />

      <div style={{ padding: '14px 16px 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <LightCard style={{ padding: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#8b95a3' }}>OPEN TICKETS</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: L_NAVY }}>{openTickets}</div>
        </LightCard>
        <LightCard style={{ padding: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#8b95a3' }}>OCCUPIED</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: L_NAVY }}>{occupied}</div>
        </LightCard>
        <LightCard style={{ padding: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#8b95a3' }}>INCOMING</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: incoming.length ? '#c43c3c' : L_NAVY }}>{incoming.length}</div>
        </LightCard>
      </div>

      {incoming.length > 0 && (
        <div style={{ padding: '14px 16px 0' }}>
          <LightCard style={{ padding: 14, borderColor: 'rgba(196,60,60,0.3)' }}>
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
          </LightCard>
        </div>
      )}

      <div style={{ padding: '14px 16px 0' }}>
        <LightCard style={{ padding: 14 }}>
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
        </LightCard>
      </div>

      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: L_NAVY }}>FLOOR / TABLE MAP</div>
          <button type="button" onClick={() => navigate('/pos3/tables')} style={{ background: 'none', border: 'none', color: '#2a4d8f', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>View All</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {tables.map((t) => (
            <LightCard key={t.id} onClick={() => navigate('/pos3/tables')} style={{ padding: 10, cursor: 'pointer' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: L_NAVY }}>{t.name}</div>
              <div style={{ fontSize: 11, color: '#8b95a3', margin: '4px 0' }}>{t.section} · {t.guests}/{t.seats}</div>
              <Pill label={t.status} tone={t.status} />
            </LightCard>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: L_NAVY }}>OPEN TICKETS / RECENT ORDERS</div>
          <button type="button" onClick={() => navigate('/pos3/orders')} style={{ background: 'none', border: 'none', color: '#2a4d8f', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>View All</button>
        </div>
        <LightCard style={{ padding: 0 }}>
          {tickets.length === 0 && <div style={{ color: '#8b95a3', fontSize: 12, padding: 14 }}>No open tickets.</div>}
          {tickets.map((t) => (
            <div key={t.id} onClick={() => navigate('/pos3/orders?ticket=' + t.id)} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid rgba(19,41,75,0.06)', cursor: 'pointer' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: L_NAVY }}>{t.id} · {t.tableId}</div>
                <div style={{ fontSize: 11, color: '#8b95a3' }}>{t.server} · {t.items.length} items</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Pill label={t.status} tone={t.status} />
                <div style={{ color: '#9c7320', fontWeight: 700, marginTop: 4, fontSize: 13 }}>${ticketTotals(t).total.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </LightCard>
      </div>

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
