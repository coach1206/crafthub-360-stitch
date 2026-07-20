import { useState, useEffect, useCallback } from 'react'
import {
  fetchVenueMenu,
  trackPartnerClick,
  trackPartnerFoodAdd,
  submitVenueOrder,
  submitStaffRequest,
} from '../../services/smokeCraftVenueCommerceApi.js'
import {
  SMOKECRAFT_VENUE_PROFILE,
  SMOKECRAFT_CIGARS,
  SMOKECRAFT_DRINKS,
  PARTNER_ESTABLISHMENTS,
  PARTNER_FOODS,
} from '../../data/smokeCraftVenueCommerce.js'
import { calculateSmokeCraftMoneyBridge } from '../../utils/smokeCraftMoneyBridge.js'
import { getActiveTicketTapperSpecials, updateInventoryAfterSpecialAdd } from '../../utils/smokeCraftSpecialsEngine.js'
import { fetchTicketTapperSpecials, fetchTicketTapperInventory } from '../../services/smokeCraftTicketTapperSpecialsApi.js'
import TicketTapperSpecialsStrip from '../../components/smokecraft/TicketTapperSpecialsStrip.jsx'
import StaffSpecialsControlPanel from '../../components/smokecraft/StaffSpecialsControlPanel.jsx'
import { smokeCraftTicketTapperSpecialsSeed } from '../../data/smokeCraftTicketTapperSpecials.js'
import { smokeCraftInventorySeed } from '../../data/smokeCraftInventorySeed.js'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { useDemoMode } from '../../context/DemoModeContext.jsx'

const BG_IMAGE = '/cigar , drink & pairingfood 0rdering.png'
const TABS = ['Smoke', 'Drink', 'Food', 'Partner Network']

const gold = '#E9C176'
const dark = '#0a0603'
const panel = 'rgba(14,8,4,0.92)'
const border = 'rgba(233,193,118,0.18)'

function fmt(n) { return `$${(+n || 0).toFixed(2)}` }

// ── Item Card ─────────────────────────────────────────────────────────────────
function ItemCard({ item, onAdd, inCart }) {
  const [imgErr, setImgErr] = useState(false)
  const fallback = item.item_category?.includes('cigar') || item.item_category === 'house_cigar' || item.item_category === 'featured_cigar'
    ? '/assets/smokecraft/cigars/robusto.jpg'
    : item.item_category === 'liquor' || item.item_category === 'cocktail'
      ? '/assets/smokecraft/cropped/intake-whiskey-bg.jpg'
      : '/assets/smokecraft/cropped/pairing-lab-hero.jpg'

  return (
    <div style={{
      background: panel, border: `1px solid ${border}`, borderRadius: 10, overflow: 'hidden',
      display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      {item.is_special && item.special_label && (
        <div style={{ position: 'absolute', top: 8, left: 8, background: gold, color: dark, fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4, letterSpacing: '0.07em', zIndex: 2 }}>
          {item.special_label}
        </div>
      )}
      <div style={{ height: 110, overflow: 'hidden', background: 'rgba(0,0,0,0.3)' }}>
        <img
          src={imgErr ? fallback : (item.image_url || fallback)}
          onError={() => setImgErr(true)}
          alt={item.item_name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
      <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#E5E2E1', lineHeight: 1.3 }}>{item.item_name}</div>
        {item.description && (
          <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.4, flex: 1 }}>{item.description}</div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ color: gold, fontWeight: 800, fontSize: 14 }}>{fmt(item.price)}</span>
          {item.age_restricted && (
            <span style={{ fontSize: 10, color: '#888', border: '1px solid #555', borderRadius: 3, padding: '1px 5px' }}>21+</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onAdd(item)}
          style={{
            marginTop: 6, width: '100%', padding: '7px 0', borderRadius: 6,
            background: inCart ? 'rgba(233,193,118,0.15)' : gold,
            color: inCart ? gold : dark,
            border: inCart ? `1px solid ${gold}` : 'none',
            fontWeight: 700, fontSize: 12, cursor: 'pointer', letterSpacing: '0.04em',
          }}
        >
          {inCart ? '+ Add Another' : 'Add to Order'}
        </button>
      </div>
    </div>
  )
}

// ── Partner Logo ──────────────────────────────────────────────────────────────
function PartnerLogo({ partner, venueId, tableLabel, onSelect, isActive }) {
  function handleClick() {
    trackPartnerClick({ venueId, tableLabel, partnerId: partner.partnerId, partnerName: partner.name, action: 'logo_click' })
    onSelect(partner)
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        background: isActive ? `rgba(233,193,118,0.12)` : panel,
        border: `1.5px solid ${isActive ? gold : border}`,
        borderRadius: 10, padding: '14px 18px', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 100,
        transition: 'all 0.15s',
      }}
    >
      <span style={{ fontSize: 28 }}>{partner.logoFallback}</span>
      <span style={{ fontSize: 11, color: isActive ? gold : '#ccc', fontWeight: 700, textAlign: 'center' }}>{partner.name}</span>
      <span style={{ fontSize: 10, color: '#888' }}>{partner.cuisine}</span>
    </button>
  )
}

// ── Money Bridge Panel ────────────────────────────────────────────────────────
function MoneyBridgePanel({ bridge }) {
  const [open, setOpen] = useState(false)
  if (!bridge?.moneyBridgeActive) return null

  return (
    <div style={{ background: 'rgba(233,193,118,0.06)', border: `1px solid rgba(233,193,118,0.25)`, borderRadius: 8, marginBottom: 10 }}>
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        style={{ width: '100%', background: 'none', border: 'none', padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span style={{ color: gold, fontSize: 12, fontWeight: 800, letterSpacing: '0.06em' }}>⟁ MONEY BRIDGE ACTIVE</span>
        <span style={{ color: gold, fontSize: 10 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '0 14px 12px', fontSize: 11, color: '#ccc', lineHeight: 1.8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Partner Subtotal</span><span>{fmt(bridge.partnerSubtotal)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>SmokeCraft Commission (10%)</span><span style={{ color: gold }}>{fmt(bridge.smokeCraftTotalCommission)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Venue Referral (5%)</span><span>{fmt(bridge.venueTotalReferral)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Partner Payout (85%)</span><span style={{ color: '#7ddca0' }}>{fmt(bridge.partnerTotalPayout)}</span></div>
          <div style={{ marginTop: 8, fontSize: 10, color: '#666', borderTop: `1px solid ${border}`, paddingTop: 6 }}>
            Revenue attribution is tracked and pending settlement. Not yet deposited or confirmed.
          </div>
        </div>
      )}
    </div>
  )
}

// ── Order Sidebar ─────────────────────────────────────────────────────────────
function OrderSidebar({ cart, onRemove, bridge, localPreview, onOrderDirect, onCallStaff, submitting, submitted, submitResult }) {
  if (cart.length === 0) {
    return (
      <div style={{ background: panel, border: `1px solid ${border}`, borderRadius: 12, padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 30, marginBottom: 8 }}>🍂</div>
        <div style={{ color: '#888', fontSize: 13 }}>Your order is empty</div>
        <div style={{ color: '#666', fontSize: 11, marginTop: 6 }}>Add cigars, drinks, or partner food to begin</div>
      </div>
    )
  }

  return (
    <div style={{ background: panel, border: `1px solid ${border}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${border}` }}>
        <div style={{ color: gold, fontWeight: 800, fontSize: 13, letterSpacing: '0.06em' }}>YOUR ORDER</div>
        {localPreview && (
          <div style={{ fontSize: 10, color: '#E9C176', background: 'rgba(233,193,118,0.08)', padding: '3px 8px', borderRadius: 4, marginTop: 6 }}>
            LOCAL PREVIEW — Backend not connected
          </div>
        )}
      </div>
      <div style={{ maxHeight: 280, overflowY: 'auto', padding: '8px 16px' }}>
        {cart.map((item, idx) => (
          <div key={`${item.item_id}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#E5E2E1', fontWeight: 600 }}>{item.item_name}</div>
              {item.isPartnerItem && <div style={{ fontSize: 10, color: gold }}>via {item.partnerName}</div>}
            </div>
            <div style={{ color: gold, fontSize: 12, fontWeight: 700 }}>{fmt(item.price)}</div>
            <button type="button" onClick={() => onRemove(idx)}
              style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 14, padding: '0 4px' }}>×</button>
          </div>
        ))}
      </div>
      {bridge && (
        <div style={{ padding: '10px 16px', borderTop: `1px solid ${border}`, fontSize: 11, color: '#ccc', lineHeight: 1.8 }}>
          <MoneyBridgePanel bridge={bridge} />
          {bridge.venueSubtotal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Venue Items</span><span>{fmt(bridge.venueSubtotal)}</span></div>
          )}
          {bridge.partnerSubtotal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Partner Food</span><span>{fmt(bridge.partnerSubtotal)}</span></div>
          )}
          {bridge.deliveryFee > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Service & Routing</span><span>{fmt(bridge.deliveryFee)}</span></div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tax (8.5%)</span><span>{fmt(bridge.tax)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: '#E5E2E1', marginTop: 4, paddingTop: 4, borderTop: `1px solid ${border}` }}>
            <span>Total</span><span style={{ color: gold }}>{fmt(bridge.total)}</span>
          </div>
        </div>
      )}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {submitted ? (
          <div style={{ background: 'rgba(125,220,160,0.1)', border: '1px solid rgba(125,220,160,0.3)', borderRadius: 8, padding: 12, fontSize: 12, color: '#7ddca0', textAlign: 'center' }}>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>
              {submitResult?.localPreview ? 'Order Logged (Local Preview)' : 'Order Submitted'}
            </div>
            <div style={{ fontSize: 11, color: '#ccc' }}>
              {SMOKECRAFT_VENUE_PROFILE.paymentNote}
            </div>
            {submitResult?.localPreview && (
              <div style={{ fontSize: 10, color: '#888', marginTop: 4 }}>Not synced to backend — backend unavailable.</div>
            )}
          </div>
        ) : (
          <>
            <button type="button" onClick={onOrderDirect} disabled={submitting}
              style={{ padding: '10px 0', borderRadius: 8, background: gold, color: dark, fontWeight: 800, fontSize: 13, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}>
              {submitting ? 'Placing Order…' : 'Place Order (Customer Direct)'}
            </button>
            <button type="button" onClick={onCallStaff} disabled={submitting}
              style={{ padding: '10px 0', borderRadius: 8, background: 'none', color: gold, fontWeight: 700, fontSize: 12, border: `1px solid ${gold}`, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}>
              Call Staff for Assistance
            </button>
            <div style={{ fontSize: 10, color: '#666', textAlign: 'center', lineHeight: 1.4 }}>
              {SMOKECRAFT_VENUE_PROFILE.paymentNote}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SmokeCraftVenueCommerce({ tableNumber = '1', guestSessionId }) {
  const { journey } = useSmokeCraftJourney()
  const { isDemoMode } = useDemoMode()
  // Real selected-venue source (SmokeCraftJourneyContext, populated by
  // /smokecraft/venue-select). No fallback to a hardcoded venue ID —
  // when no real venue is selected (or the guest chose "skip"), venueId
  // stays null and venue-scoped API calls are not made.
  const venueId = (journey.selectedVenue && !journey.selectedVenue.skipped) ? journey.selectedVenue.id : null
  const tableLabel = `Table ${tableNumber}`
  const [tab, setTab] = useState('Smoke')
  const [menu, setMenu] = useState(null)
  const [localPreview, setLocalPreview] = useState(false)
  const [activePartner, setActivePartner] = useState(null)
  const [cart, setCart] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitResult, setSubmitResult] = useState(null)
  const [imgErr, setImgErr] = useState(false)

  // Ticket Tapper Specials state. Seed data is only used as an initial
  // value in explicit demo mode — in live mode the strip starts empty
  // and only shows what the real API returns.
  const [specialsRaw, setSpecialsRaw] = useState(isDemoMode ? smokeCraftTicketTapperSpecialsSeed.specials : [])
  const [inventoryItems, setInventoryItems] = useState(isDemoMode ? smokeCraftInventorySeed.items : [])
  const [specialsLocalPreview, setSpecialsLocalPreview] = useState(isDemoMode)
  const [specialsUnavailable, setSpecialsUnavailable] = useState(false)
  const [showStaffControls, setShowStaffControls] = useState(false)
  const DEMO_STAFF = { staffId: 'staff-preview', name: 'Preview Staff', role: 'manager' }

  useEffect(() => {
    if (!venueId) {
      setSpecialsRaw(isDemoMode ? smokeCraftTicketTapperSpecialsSeed.specials : [])
      setSpecialsLocalPreview(isDemoMode)
      setSpecialsUnavailable(false)
      return
    }
    // Fetch from legacy local-first API. In live mode, a backend-unavailable
    // response is treated as an honest "unavailable" state, not a silent
    // fallback to seed/demo specials.
    fetchTicketTapperSpecials(venueId).then(res => {
      if (!res.ok) return
      if (!res.localPreview) {
        setSpecialsRaw(res.specials || [])
        setSpecialsLocalPreview(false)
        setSpecialsUnavailable(false)
      } else if (isDemoMode) {
        setSpecialsRaw(res.specials || smokeCraftTicketTapperSpecialsSeed.specials)
        setSpecialsLocalPreview(true)
        setSpecialsUnavailable(false)
      } else {
        setSpecialsRaw([])
        setSpecialsLocalPreview(false)
        setSpecialsUnavailable(true)
      }
    })
    // Supplement with Ticket Tapper promotion backend (real DB when available)
    fetch(`/api/ticket-tapper/promotions/smokecraft/active?venueId=${encodeURIComponent(venueId)}`)
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json?.success && json?.backendConnected && Array.isArray(json?.data?.promotions) && json.data.promotions.length > 0) {
          const backendPromotions = json.data.promotions.map(p => ({
            id: p.promotion_id,
            title: p.title,
            subtitle: p.subtitle || '',
            description: p.description || '',
            specialType: p.promotion_type,
            source: 'backend',
            promotedByRole: p.promoted_by_role || 'manager',
            status: p.status,
            approval: { required: false, status: 'approved' },
            inventory: { quantityAvailable: 99, inventoryStatus: 'available', allowOversell: true },
            pricing: { regularPrice: parseFloat(p.regular_price) || 0, specialPrice: parseFloat(p.special_price) || 0, discountAmount: parseFloat(p.discount_amount) || 0 },
            items: [],
            media: { imageUrl: p.image_path || null, badgeLabel: p.badge_label || null },
            moneyBridge: { active: false },
            callToAction: { label: p.call_to_action || 'Add Special', action: 'one_tap_add' },
          }))
          setSpecialsRaw(prev => {
            const existingIds = new Set(prev.map(s => s.id))
            const newOnes = backendPromotions.filter(p => !existingIds.has(p.id))
            return newOnes.length > 0 ? [...prev, ...newOnes] : prev
          })
          setSpecialsLocalPreview(false)
        }
      })
      .catch(() => {})
    fetchTicketTapperInventory(venueId).then(res => {
      if (res.ok && res.items?.length && (!res.localPreview || isDemoMode)) setInventoryItems(res.items)
    })
  }, [venueId, isDemoMode])

  const activeSpecials = getActiveTicketTapperSpecials({ specials: specialsRaw, inventoryItems })

  function handleSpecialAdd({ special, orderItems, addEvent }) {
    setCart(prev => [...prev, ...orderItems])
    setInventoryItems(prev => updateInventoryAfterSpecialAdd({ inventoryItems: prev, special }))
    // Connect partner items to Money Bridge tracking
    const partnerOrderItems = orderItems.filter(i => i.isPartnerItem)
    if (partnerOrderItems.length > 0) {
      const partnerSubtotal = partnerOrderItems.reduce((s, i) => s + i.price * (i.quantity || 1), 0)
      trackPartnerFoodAdd({
        venueId, tableLabel,
        partnerId: partnerOrderItems[0].partnerId,
        partnerName: partnerOrderItems[0].partnerName,
        item: partnerOrderItems[0],
        moneyBridge: { smokeCraftTotalCommission: partnerSubtotal * 0.10, venueTotalReferral: partnerSubtotal * 0.05 },
      })
    }
  }

  const cigars = menu?.cigars || SMOKECRAFT_CIGARS
  const drinks = menu?.drinks || SMOKECRAFT_DRINKS
  const partners = menu?.partnerEstablishments || PARTNER_ESTABLISHMENTS
  const partnerFoods = menu?.partnerFoods || PARTNER_FOODS

  useEffect(() => {
    fetchVenueMenu(venueId).then(res => {
      if (res.localPreview || res.storageMode === 'memory_fallback') {
        setLocalPreview(true)
        setMenu(null)
      } else {
        setMenu(res)
        setLocalPreview(false)
      }
    })
  }, [venueId])

  const bridge = calculateSmokeCraftMoneyBridge({
    venueItems: cart.filter(i => !i.isPartnerItem),
    partnerItems: cart.filter(i => i.isPartnerItem),
  })

  function addItem(item) {
    setCart(prev => [...prev, { ...item, quantity: 1 }])
    if (item.isPartnerItem) {
      trackPartnerFoodAdd({
        venueId, tableLabel,
        partnerId: item.partnerId,
        partnerName: item.partnerName,
        item,
        moneyBridge: calculateSmokeCraftMoneyBridge({
          venueItems: cart.filter(i => !i.isPartnerItem),
          partnerItems: [...cart.filter(i => i.isPartnerItem), { ...item, quantity: 1 }],
        }),
      })
    }
  }

  function removeItem(idx) {
    setCart(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleOrderDirect() {
    if (cart.length === 0) return
    setSubmitting(true)
    const result = await submitVenueOrder({
      venueId, tableLabel, guestSessionId,
      orderSource: 'customer_self_order',
      cartItems: cart,
      moneyBridge: bridge,
    })
    setSubmitting(false)
    setSubmitResult(result)
    setSubmitted(true)
  }

  async function handleCallStaff() {
    if (cart.length === 0) return
    setSubmitting(true)
    const result = await submitStaffRequest({
      venueId, tableLabel, guestSessionId,
      cartItems: cart,
      staffNote: 'Customer requests staff assistance at ' + tableLabel,
    })
    setSubmitting(false)
    setSubmitResult(result)
    setSubmitted(true)
  }

  function handleSelectPartner(partner) {
    setActivePartner(prev => prev?.partnerId === partner.partnerId ? null : partner)
    if (tab !== 'Partner Network') setTab('Partner Network')
  }

  const partnerFoodFiltered = activePartner
    ? partnerFoods.filter(f => f.partnerId === activePartner.partnerId)
    : partnerFoods

  const inCart = (id) => cart.some(c => c.item_id === id)

  const renderTabContent = () => {
    if (tab === 'Smoke') {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 }}>
          {cigars.map(item => <ItemCard key={item.item_id} item={item} onAdd={addItem} inCart={inCart(item.item_id)} />)}
        </div>
      )
    }
    if (tab === 'Drink') {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 }}>
          {drinks.map(item => <ItemCard key={item.item_id} item={item} onAdd={addItem} inCart={inCart(item.item_id)} />)}
        </div>
      )
    }
    if (tab === 'Food') {
      const venueFood = (menu?.food || [])
      return venueFood.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 }}>
          {venueFood.map(item => <ItemCard key={item.item_id} item={item} onAdd={addItem} inCart={inCart(item.item_id)} />)}
        </div>
      ) : (
        <div style={{ color: '#888', fontSize: 13, padding: 20, textAlign: 'center' }}>
          House food menu not yet configured.<br/>
          <span style={{ color: gold }}>Check Partner Network for food from nearby establishments.</span>
        </div>
      )
    }
    if (tab === 'Partner Network') {
      return (
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>Select a partner to see their menu</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {partners.map(p => (
                <PartnerLogo key={p.partnerId} partner={p} venueId={venueId} tableLabel={tableLabel}
                  onSelect={handleSelectPartner} isActive={activePartner?.partnerId === p.partnerId} />
              ))}
            </div>
          </div>
          {activePartner && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>{activePartner.logoFallback}</span>
                <div>
                  <div style={{ color: gold, fontWeight: 800, fontSize: 14 }}>{activePartner.name}</div>
                  <div style={{ color: '#888', fontSize: 11 }}>{activePartner.description}</div>
                </div>
                {activePartner.websiteUrl && (
                  <button type="button"
                    onClick={() => {
                      trackPartnerClick({ venueId, tableLabel, partnerId: activePartner.partnerId, partnerName: activePartner.name, action: 'website_open' })
                      window.open(activePartner.websiteUrl, '_blank', 'noopener,noreferrer')
                    }}
                    style={{ marginLeft: 'auto', background: 'none', border: `1px solid ${border}`, color: '#aaa', fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}>
                    Visit Website ↗
                  </button>
                )}
              </div>
              {bridge.moneyBridgeActive && (
                <div style={{ fontSize: 11, color: gold, background: 'rgba(233,193,118,0.06)', border: `1px solid rgba(233,193,118,0.2)`, borderRadius: 6, padding: '6px 12px', marginBottom: 10 }}>
                  ⟁ Money Bridge Active — SmokeCraft earns 10% commission on partner food orders
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 }}>
                {partnerFoodFiltered.map(item => (
                  <ItemCard key={item.item_id} item={{ ...item, partnerName: activePartner.name }} onAdd={i => addItem({ ...i, partnerName: activePartner.name })} inCart={inCart(item.item_id)} />
                ))}
              </div>
            </div>
          )}
          {!activePartner && (
            <div style={{ color: '#666', fontSize: 12, padding: '20px 0', textAlign: 'center' }}>
              Select a partner above to browse their menu
            </div>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', background: dark }}>
      {/* Background image */}
      <img
        src={imgErr ? undefined : BG_IMAGE}
        onError={() => setImgErr(true)}
        alt=""
        aria-hidden
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, pointerEvents: 'none' }}
      />
      {/* Overlay */}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,2,1,0.84)', zIndex: 1, pointerEvents: 'none' }} />

      {/* Content layer */}
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1100, margin: '0 auto', padding: '20px 16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ color: gold, fontWeight: 900, fontSize: 22, letterSpacing: '0.04em', lineHeight: 1 }}>
              SmokeCraft 360
            </div>
            <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
              {tableLabel} &nbsp;·&nbsp; Order & Pairing Menu
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {localPreview && (
              <span style={{ fontSize: 10, color: gold, background: 'rgba(233,193,118,0.08)', border: `1px solid rgba(233,193,118,0.2)`, borderRadius: 5, padding: '4px 10px' }}>
                LOCAL PREVIEW
              </span>
            )}
            <div style={{ fontSize: 11, color: '#888', background: panel, border: `1px solid ${border}`, borderRadius: 8, padding: '6px 14px', textAlign: 'right' }}>
              <div style={{ color: '#ccc', fontWeight: 600 }}>{tableLabel}</div>
              <div style={{ color: '#666', fontSize: 10 }}>SmokeCraft 360</div>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {TABS.map(t => (
            <button key={t} type="button" onClick={() => setTab(t)}
              style={{
                padding: '8px 18px', borderRadius: 20,
                background: tab === t ? gold : panel,
                color: tab === t ? dark : '#ccc',
                border: tab === t ? 'none' : `1px solid ${border}`,
                fontWeight: tab === t ? 800 : 500,
                fontSize: 13, cursor: 'pointer',
              }}>
              {t}
              {t === 'Partner Network' && bridge.moneyBridgeActive && (
                <span style={{ marginLeft: 5, background: dark, color: gold, fontSize: 9, padding: '1px 4px', borderRadius: 3, fontWeight: 800 }}>⟁</span>
              )}
            </button>
          ))}
          <button type="button" onClick={() => setShowStaffControls(p => !p)}
            style={{ marginLeft: 'auto', background: 'none', border: `1px solid ${border}`, color: '#888', fontSize: 11, padding: '6px 12px', borderRadius: 16, cursor: 'pointer' }}>
            {showStaffControls ? '✕ Staff Controls' : '⚙ Staff Specials Preview'}
          </button>
        </div>

        {/* Staff Specials Control Panel (preview mode) */}
        {showStaffControls && (
          <div style={{ marginBottom: 20 }}>
            <StaffSpecialsControlPanel
              specials={specialsRaw}
              venueId={venueId}
              staff={DEMO_STAFF}
              localPreview={specialsLocalPreview}
              onSpecialCreated={result => {
                if (result.localPreview) {
                  // Add created special to local state for preview
                  const newSpecial = {
                    id: result.specialId,
                    title: 'New Special (Preview)',
                    status: 'active',
                    priority: 99,
                    promotedByRole: DEMO_STAFF.role,
                    createdBy: DEMO_STAFF,
                    inventory: { quantityAvailable: 10, inventoryStatus: 'available', lowInventoryThreshold: 3, allowOversell: false },
                    pricing: { specialPrice: 0, regularPrice: 0, discountAmount: 0 },
                    items: [],
                    moneyBridge: { active: false },
                    media: { badgeLabel: 'New' },
                    callToAction: { label: 'Add Special', action: 'one_tap_add' },
                    startsAt: new Date().toISOString(),
                    endsAt: null,
                  }
                  setSpecialsRaw(prev => [newSpecial, ...prev])
                }
              }}
              onSpecialUpdated={(action, specialId) => {
                setSpecialsRaw(prev => prev.map(s =>
                  s.id === specialId ? { ...s, status: action === 'end' ? 'ended' : action === 'pause' ? 'paused' : 'active' } : s
                ))
              }}
            />
          </div>
        )}

        {/* Ticket Tapper Real-Time Specials */}
        <TicketTapperSpecialsStrip
          specials={activeSpecials}
          inventoryItems={inventoryItems}
          onAddSpecial={handleSpecialAdd}
          venueId={venueId}
          tableLabel={tableLabel}
          localPreview={specialsLocalPreview}
        />

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>
          {/* Menu area */}
          <div>{renderTabContent()}</div>

          {/* Order sidebar */}
          <div style={{ position: 'sticky', top: 20 }}>
            <OrderSidebar
              cart={cart}
              onRemove={removeItem}
              bridge={bridge}
              localPreview={localPreview}
              onOrderDirect={handleOrderDirect}
              onCallStaff={handleCallStaff}
              submitting={submitting}
              submitted={submitted}
              submitResult={submitResult}
            />
          </div>
        </div>

        {/* Footer note */}
        <div style={{ marginTop: 32, paddingTop: 16, borderTop: `1px solid ${border}`, fontSize: 10, color: '#555', textAlign: 'center', lineHeight: 1.6 }}>
          {SMOKECRAFT_VENUE_PROFILE.paymentNote}
          {localPreview && (
            <span> · Local preview mode — data not persisted to backend.</span>
          )}
        </div>
      </div>
    </div>
  )
}
