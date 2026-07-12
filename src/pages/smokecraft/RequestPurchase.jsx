import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import SmokeCraftMenuButton from '../../components/smokecraft/SmokeCraftMenuButton.jsx'
import { useSmokeCraftOrder } from '../../context/SmokeCraftOrderContext.jsx'
import VenueMenuOverlay from '../../components/venue/VenueMenuOverlay.jsx'
import { createPOS360OrderIntent, writePOS360AuditEvent } from '../../services/smokecraftHandoffService.js'
import { purchaseRequestStatus } from '../../services/smokecraft/smokecraftTruthfulStatusGuard.js'

const GOLD = '#E9C176'
const DARK = '#0a0603'

const ORDER_PATHS = [
  { id: 'self', label: 'Self-Order', desc: 'Order directly through the app' },
  { id: 'staff', label: 'Request Staff Assistance', desc: 'A team member will assist you' },
]

export default function RequestPurchase() {
  const { awardSessionRewards, session } = useGuestSession()
  const { setResumeRoute } = useSmokeCraftOrder()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [orderPath, setOrderPath] = useState(null)
  const [activePromotions, setActivePromotions] = useState([])
  const [orderRecord, setOrderRecord] = useState(null)
  // R23: derive truthful status from evidence record
  const orderStatus = purchaseRequestStatus(orderRecord)

  useEffect(() => {
    fetch('/api/ticket-tapper/promotions/smokecraft/active?venueId=novee-grand-lounge')
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json?.success && Array.isArray(json?.data?.promotions)) {
          setActivePromotions(json.data.promotions)
        }
      })
      .catch(() => {})
  }, [])

  function onOrderPairingTap() {
    setResumeRoute('/smokecraft/request-purchase')
    ;(async () => {
      try {
        const result = await createPOS360OrderIntent({
          venueId: 'novee-grand-lounge',
          guestId: session?.sessionId || null,
          orderSource: 'smokecraft',
          orderType: 'cigar_request',
          orderPayload: { resumeRoute: '/smokecraft/request-purchase' },
        })
        if (result?.backendConnected) {
          // R23: record evidence so truthful status can show "Ordered"
          setOrderRecord({ requestId: result?.orderIntent?.order_intent_id, saved: true, requestedAt: new Date().toISOString() })
          await writePOS360AuditEvent({
            venueId: 'novee-grand-lounge',
            guestId: session?.sessionId || null,
            orderIntentId: result?.orderIntent?.order_intent_id || null,
            eventType: 'order_intent_created',
            syncStatus: 'ok',
            backendConnected: true,
            summary: 'Guest initiated purchase / pairing request from SmokeCraft',
          })
        }
      } catch {}
    })()
    setMenuOpen(true)
  }

  function handleContinue() {
    awardSessionRewards('request-purchase')
    navigate('/smokecraft/cut-toast-light')
  }

  return (
    <>
      <SmokeCraftAssetScreen
        src="/assets/smokecraft/REQUEST%20PURCHASE.png"
        alt="SmokeCraft Request Purchase — Choose Your Ordering Path"
      />

      {/* Ordering path selector + venue menu button */}
      <div style={{
        position: 'fixed',
        bottom: 110, left: 0, right: 0,
        zIndex: 400,
        padding: '0 16px',
        pointerEvents: 'none',
      }}>
        <div style={{
          pointerEvents: 'auto',
          background: 'rgba(10,6,3,0.94)',
          border: '1px solid rgba(233,193,118,0.2)',
          borderRadius: 12,
          padding: '10px 12px',
          maxWidth: 500,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          {/* Ordering path */}
          <div style={{ fontSize: 10, color: GOLD, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>
            Choose Ordering Path
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {ORDER_PATHS.map(p => {
              const active = orderPath === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { triggerHaptic('light'); setOrderPath(active ? null : p.id) }}
                  style={{
                    flex: 1,
                    background: active ? GOLD : 'transparent',
                    color: active ? DARK : GOLD,
                    border: `1px solid ${active ? GOLD : 'rgba(233,193,118,0.35)'}`,
                    borderRadius: 10,
                    padding: '12px 10px',
                    minHeight: 44,
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: 'Georgia, serif',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  {p.label}
                </button>
              )
            })}
          </div>

          {/* View Venue Menu — real button */}
          <button
            type="button"
            onClick={onOrderPairingTap}
            style={{
              background: 'transparent',
              color: GOLD,
              border: `1px solid rgba(233,193,118,0.4)`,
              borderRadius: 20,
              padding: '9px 20px',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'Georgia, serif',
              letterSpacing: '0.06em',
              cursor: 'pointer',
            }}
          >
            View Venue Menu &amp; Order
          </button>

          {/* Active promotions from backend */}
          {activePromotions.length > 0 && (
            <div style={{ borderTop: '1px solid rgba(233,193,118,0.15)', paddingTop: 6 }}>
              <div style={{ fontSize: 9, color: GOLD, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>
                Tonight's Specials
              </div>
              {activePromotions.slice(0, 2).map(p => (
                <div key={p.promotion_id} style={{ fontSize: 11, color: '#E5E2E1' }}>
                  {p.title}{p.special_price ? ` — $${parseFloat(p.special_price).toFixed(2)}` : ''}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <SmokeCraftNavBar
        primary="Continue to Cut, Toast & Light →"
        onPrimary={handleContinue}
      />

      <SmokeCraftMenuButton label="Order Pairing" />

      <VenueMenuOverlay
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        guestSessionId={session?.sessionId}
        tableNumber="SmokeCraft"
        source="customer_self_order"
      />
    </>
  )
}
