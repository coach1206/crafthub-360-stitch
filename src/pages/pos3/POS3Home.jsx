import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shell, SideNav, TopBar, Card, Pill, KpiCard, Btn, GOLD, PANEL2 } from '../../components/eat/ui.jsx'
import { getTables, getTickets, ticketTotals } from '../../services/pos3/pos3Service.js'
import { subscribe, eventsFor } from '../../services/shared/opsEventBus.js'
import { completeCommand, receiveCommand } from '../../services/shared/opsControlBridge.js'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { getSmokePOSHandoff, markSmokePurchaseVerified, markSmokePurchaseRejected, getDerivedPurchaseState } from '../../services/smokecraft/smokePOSHandoffService.js'
import { loadSmokePurchaseIntents, getSmokeSharedStorageMode, buildSmokeStorageStatusFields } from '../../services/smokecraft/smokeSharedStorageService.js'

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
    <Shell>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <SideNav system="POS3" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <TopBar system="POS3" title="POS 3 Hospitality Terminal" subtitle="PM Shift · System Online" />
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <KpiCard label="Open Tickets" value={openTickets} />
              <KpiCard label="Occupied Tables" value={occupied} />
              <KpiCard label="Incoming Requests" value={incoming.length} accent={incoming.length ? '#f0907f' : GOLD} />
            </div>

            {incoming.length > 0 && (
              <Card style={{ marginBottom: 20, borderColor: 'rgba(240,144,127,0.4)' }}>
                <div style={{ fontWeight: 700, marginBottom: 10, color: '#f0907f' }}>Incoming Requests (from SmokeCraft / E.A.T.)</div>
                {incoming.map((ev) => (
                  <div key={ev.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <Pill label={ev.status} tone={ev.status} />
                      <Pill label={ev.commandType || ev.eventType} tone="pending" />
                      <span style={{ marginLeft: 10, fontSize: 13 }}>{ev.payload?.label || ev.eventType} · from {ev.sourceSystem}</span>
                    </div>
                    {ev.status === 'pending' && (
                      <Btn tone="green" onClick={() => markReceived(ev)} style={{ padding: '8px 14px' }}>Mark Received</Btn>
                    )}
                    {ev.status === 'received' && (
                      <Btn tone="green" onClick={() => markCompleted(ev)} style={{ padding: '8px 14px' }}>Mark Completed</Btn>
                    )}
                  </div>
                ))}
              </Card>
            )}

            <Card style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>SmokeCraft Purchase Queue</div>
              <div style={{ fontSize: 11, color: '#8b95a3', marginBottom: 10 }}>
                Local/session-only — a real venue-wide queue requires a backend or shared event store. Showing the current guest session's handoff state.
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                <Pill label={'storage: ' + storageMode.mode.replaceAll('_', ' ')} tone={storageMode.backendConnected ? 'open' : 'pending'} />
                <Pill label={queueIsShared ? 'shared queue' : 'local-only queue'} tone={queueIsShared ? 'open' : 'pending'} />
              </div>
              {!posHandoff.intentId ? (
                <div style={{ fontSize: 13, color: '#8b95a3', padding: '8px 0' }}>No SmokeCraft purchase intent created yet.</div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{posHandoff.intentId}</div>
                    <div style={{ fontSize: 12, color: '#8b95a3', margin: '4px 0' }}>Product: {posHandoff.product || 'Not specified'}</div>
                    <span style={{ display: 'inline-flex', gap: 6 }}>
                      <Pill label={posHandoff.status} tone={posHandoff.status === 'verified' ? 'open' : posHandoff.status === 'rejected' ? 'critical' : 'pending'} />
                      <Pill label={'verification: ' + posHandoff.verificationStatus} tone={posHandoff.verificationStatus === 'verified' ? 'open' : posHandoff.verificationStatus === 'rejected' ? 'critical' : 'pending'} />
                    </span>
                  </div>
                  {posHandoff.status !== 'verified' && posHandoff.status !== 'rejected' ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Btn tone="green" onClick={verifySmokeCraftPurchase} style={{ padding: '8px 14px' }}>Mark Verified</Btn>
                      <Btn tone="red" onClick={rejectSmokeCraftPurchase} style={{ padding: '8px 14px' }}>Reject</Btn>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#8b95a3' }}>Needs POS Verification: No</div>
                  )}
                </div>
              )}
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Card>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>Floor / Table Map</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  {tables.map((t) => (
                    <div key={t.id} onClick={() => navigate('/pos3/tables')} style={{ background: PANEL2, borderRadius: 12, padding: 12, cursor: 'pointer' }}>
                      <div style={{ fontWeight: 700 }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: '#8b95a3', margin: '4px 0' }}>{t.section} · {t.guests}/{t.seats}</div>
                      <Pill label={t.status} tone={t.status} />
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>Open Tickets / Recent Orders</div>
                {tickets.map((t) => (
                  <div key={t.id} onClick={() => navigate('/pos3/orders?ticket=' + t.id)} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{t.id} · {t.tableId}</div>
                      <div style={{ fontSize: 12, color: '#8b95a3' }}>{t.server} · {t.items.length} items</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Pill label={t.status} tone={t.status} />
                      <div style={{ color: GOLD, fontWeight: 700, marginTop: 4 }}>${ticketTotals(t).total.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  )
}
