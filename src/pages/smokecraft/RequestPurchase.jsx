import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetRoute from '../../components/smokecraft/SmokeCraftAssetRoute.jsx'
import SmokeCraftMenuButton from '../../components/smokecraft/SmokeCraftMenuButton.jsx'
import { useSmokeCraftOrder } from '../../context/SmokeCraftOrderContext.jsx'
import VenueMenuOverlay from '../../components/venue/VenueMenuOverlay.jsx'
import { createPOS360OrderIntent, writePOS360AuditEvent } from '../../services/smokecraftHandoffService.js'

const GOLD = '#E9C176'

export default function RequestPurchase() {
  const { awardSessionRewards, session } = useGuestSession()
  const { setResumeRoute } = useSmokeCraftOrder()
  const [menuOpen, setMenuOpen] = useState(false)
  const [activePromotions, setActivePromotions] = useState([])

  useEffect(() => {
    // Fire-and-forget — fetch active Ticket Tapper promotions from backend for reference
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
    triggerHaptic('medium')
    setResumeRoute('/smokecraft/request-purchase')
    // Fire-and-forget POS360 order intent — never blocks guest screen
    ;(async () => {
      try {
        const result = await createPOS360OrderIntent({
          venueId:     'novee-grand-lounge',
          guestId:     session?.sessionId || null,
          orderSource: 'smokecraft',
          orderType:   'cigar_request',
          orderPayload: { resumeRoute: '/smokecraft/request-purchase' },
        })
        if (result?.backendConnected) {
          await writePOS360AuditEvent({
            venueId:        'novee-grand-lounge',
            guestId:        session?.sessionId || null,
            orderIntentId:  result?.orderIntent?.order_intent_id || null,
            eventType:      'order_intent_created',
            syncStatus:     'ok',
            backendConnected: true,
            summary:        'Guest initiated purchase / pairing request from SmokeCraft',
          })
        }
      } catch {
        // backend failure must never surface to guest
      }
    })()
  }

  const HOTSPOTS = [
    {
      label: 'Order Pairing / Request Purchase',
      x: 10, y: 60, width: 80, height: 18,
      onClick: onOrderPairingTap,
      to: '/smokecraft/menu',
    },
    {
      label: 'Continue to Cut Toast Light',
      x: 10, y: 80, width: 80, height: 15,
      onClick: () => { triggerHaptic('medium'); awardSessionRewards('request-purchase') },
      to: '/smokecraft/cut-toast-light',
    },
  ]

  return (
    <>
      <SmokeCraftAssetRoute
        src="/assets/smokecraft-reference/approved/smokecraft-request-purchase.png"
        alt="Request Purchase"
        hotspots={HOTSPOTS}
        route="/smokecraft/request-purchase"
      />
      <SmokeCraftMenuButton label="Order Pairing" />

      {/* Venue menu entry — floating bottom bar */}
      <div style={{
        position: 'fixed', bottom: 72, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', zIndex: 300, pointerEvents: 'none',
      }}>
        <button
          type="button"
          onClick={() => { triggerHaptic('medium'); setMenuOpen(true) }}
          style={{
            pointerEvents: 'auto',
            background: GOLD, color: '#0a0603',
            border: 'none', borderRadius: 28,
            padding: '13px 28px', fontSize: 14, fontWeight: 700,
            fontFamily: 'Georgia, serif', letterSpacing: '0.08em',
            boxShadow: '0 6px 24px rgba(0,0,0,0.45)',
            cursor: 'pointer',
          }}
        >
          View Venue Menu &amp; Order
        </button>
      </div>

      <VenueMenuOverlay
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        guestSessionId={session?.sessionId}
        tableNumber="SmokeCraft"
        source="customer_self_order"
      />

      {/* Active Ticket Tapper promotions from backend — reference only, no payment */}
      {activePromotions.length > 0 && (
        <div style={{ position: 'fixed', bottom: 130, left: 0, right: 0, zIndex: 200, padding: '0 16px', pointerEvents: 'none' }}>
          <div style={{ maxWidth: 480, margin: '0 auto', background: 'rgba(10,6,3,0.92)', border: '1px solid rgba(233,193,118,0.18)', borderRadius: 10, padding: '8px 12px' }}>
            <div style={{ fontSize: 9, color: '#E9C176', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>
              Tonight's Specials
            </div>
            {activePromotions.slice(0, 2).map(p => (
              <div key={p.promotion_id} style={{ fontSize: 11, color: '#E5E2E1', marginBottom: 2 }}>
                {p.title}{p.special_price ? ` — $${parseFloat(p.special_price).toFixed(2)}` : ''}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
