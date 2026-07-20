import { useState } from 'react'
import {
  canOneTapOrderSpecial,
  buildOneTapSpecialOrderItems,
  buildSpecialTrackingEvent,
  updateInventoryAfterSpecialAdd,
} from '../../utils/smokeCraftSpecialsEngine.js'
import {
  trackTicketTapperSpecialTap,
  trackTicketTapperSpecialAdd,
} from '../../services/smokeCraftTicketTapperSpecialsApi.js'

const gold = '#E9C176'
const dark = '#0a0603'
const panel = 'rgba(14,8,4,0.94)'
const border = 'rgba(233,193,118,0.18)'

const ROLE_LABELS = {
  manager: 'Manager Pick',
  bartender: 'Bartender Pick',
  cook: 'Cook Special',
  server: 'Server Favorite',
  owner: "Owner's Choice",
  admin: 'House Feature',
}

const FALLBACK_IMAGE = '/smokecraft/fallbacks/special-placeholder.png'
const CATEGORY_FALLBACKS = {
  partner_food_pairing: '/assets/smokecraft/cropped/pairing-lab-hero.jpg',
  partner_food_special: '/assets/smokecraft/cropped/pairing-lab-hero.jpg',
  drink_special: '/assets/smokecraft/cropped/intake-whiskey-bg.jpg',
  cigar_special: '/assets/smokecraft/cigars/robusto.jpg',
  default: '/assets/smokecraft/cropped/pairing-lab-hero.jpg',
}

function getSpecialFallback(special) {
  return CATEGORY_FALLBACKS[special.specialType] || CATEGORY_FALLBACKS.default
}

function fmt(n) { return `$${(+n || 0).toFixed(2)}` }

function InventoryBadge({ special }) {
  const inv = special.inventory
  if (!inv) return null
  const qty = inv.quantityAvailable ?? 99
  const status = inv.inventoryStatus

  if (status === 'sold_out' || qty <= 0) {
    return (
      <div style={{ fontSize: 10, fontWeight: 800, color: '#ff6b6b', background: 'rgba(255,107,107,0.12)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 4, padding: '2px 7px' }}>
        SOLD OUT
      </div>
    )
  }
  if (status === 'low_stock' || qty <= (inv.lowInventoryThreshold ?? 3)) {
    return (
      <div style={{ fontSize: 10, fontWeight: 800, color: '#ffa94d', background: 'rgba(255,169,77,0.12)', border: '1px solid rgba(255,169,77,0.3)', borderRadius: 4, padding: '2px 7px' }}>
        ONLY {qty} LEFT
      </div>
    )
  }
  return null
}

function SpecialCard({ special, inventoryItems, onAdd, venueId, tableLabel, localPreview }) {
  const [imgErr, setImgErr] = useState(false)
  const [adding, setAdding] = useState(false)
  const [toast, setToast] = useState(null)

  const { allowed, reason } = canOneTapOrderSpecial({ special, inventoryItems })
  const isSoldOut = !allowed && reason === 'sold_out'
  const isLowStock = reason === 'low_stock'
  const qty = special.inventory?.quantityAvailable ?? 99

  const imgSrc = imgErr ? getSpecialFallback(special) : (special.media?.imageUrl ? `/${special.media.imageUrl}` : getSpecialFallback(special))

  async function handleTap() {
    // Track tap first
    const tapEvent = buildSpecialTrackingEvent({ special, action: 'special_tap', venueId, tableLabel, orderMode: 'customer_self_order' })
    trackTicketTapperSpecialTap(special.id, { venueId, tableLabel, specialData: special, event: tapEvent })

    if (isSoldOut) {
      const soldOutEvent = buildSpecialTrackingEvent({ special, action: 'special_sold_out_blocked', venueId, tableLabel })
      trackTicketTapperSpecialTap(special.id, { venueId, tableLabel, specialData: special, event: soldOutEvent })
      setToast({ type: 'error', msg: 'This special is sold out.' })
      setTimeout(() => setToast(null), 2500)
      return
    }

    setAdding(true)
    const orderItems = buildOneTapSpecialOrderItems({ special })
    const addEvent = buildSpecialTrackingEvent({ special, action: 'special_added', venueId, tableLabel })
    await trackTicketTapperSpecialAdd(special.id, { venueId, tableLabel, specialData: special, event: addEvent })
    onAdd({ special, orderItems, addEvent })

    const msg = isLowStock
      ? `Only ${qty} left. Added to your order.`
      : 'Special added to your order.'
    setToast({ type: 'success', msg })
    setTimeout(() => setToast(null), 2500)
    setAdding(false)
  }

  const ctaLabel = isSoldOut ? 'Sold Out' : (special.callToAction?.label || 'Add Special')
  const hasDiscount = special.pricing?.discountAmount > 0

  return (
    <div style={{
      position: 'relative',
      background: panel,
      border: `1.5px solid ${isSoldOut ? 'rgba(255,107,107,0.25)' : border}`,
      borderRadius: 14,
      overflow: 'hidden',
      minWidth: 220,
      maxWidth: 260,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: isSoldOut ? 'none' : '0 2px 20px rgba(233,193,118,0.08)',
      opacity: isSoldOut ? 0.75 : 1,
      flexShrink: 0,
    }}>
      {/* Badge row */}
      <div style={{ position: 'absolute', top: 8, left: 8, right: 8, display: 'flex', gap: 5, zIndex: 3, flexWrap: 'wrap' }}>
        {special.media?.badgeLabel && (
          <div style={{ background: gold, color: dark, fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 4, letterSpacing: '0.06em' }}>
            {special.media.badgeLabel}
          </div>
        )}
        <InventoryBadge special={special} />
        {special.moneyBridge?.active && (
          <div style={{ background: 'rgba(233,193,118,0.12)', border: `1px solid rgba(233,193,118,0.4)`, color: gold, fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 4 }}>
            ⟁ BRIDGE
          </div>
        )}
      </div>

      {/* Image */}
      <div style={{ height: 120, overflow: 'hidden', background: 'rgba(0,0,0,0.3)' }}>
        <img
          src={imgSrc}
          onError={() => setImgErr(true)}
          alt={special.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: isSoldOut ? 'grayscale(0.6)' : 'none' }}
        />
      </div>

      {/* Content */}
      <div style={{ padding: '10px 13px 12px', display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
        {/* Role label */}
        {special.promotedByRole && (
          <div style={{ fontSize: 10, color: '#aaa', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {ROLE_LABELS[special.promotedByRole] || special.promotedByRole}
          </div>
        )}

        <div style={{ fontSize: 14, fontWeight: 800, color: '#E5E2E1', lineHeight: 1.25 }}>{special.title}</div>
        <div style={{ fontSize: 11, color: '#888', lineHeight: 1.4 }}>{special.subtitle}</div>

        {/* Pricing */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginTop: 3 }}>
          <span style={{ color: gold, fontWeight: 900, fontSize: 16 }}>{fmt(special.pricing?.specialPrice)}</span>
          {hasDiscount && (
            <span style={{ color: '#666', fontSize: 12, textDecoration: 'line-through' }}>{fmt(special.pricing?.regularPrice)}</span>
          )}
          {hasDiscount && (
            <span style={{ fontSize: 10, color: '#7ddca0', fontWeight: 700 }}>Save {fmt(special.pricing?.discountAmount)}</span>
          )}
        </div>

        {/* Items in bundle */}
        {special.items?.length > 1 && (
          <div style={{ fontSize: 10, color: '#777', lineHeight: 1.5 }}>
            {special.items.map(i => i.name).join(' + ')}
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div style={{
            fontSize: 11, fontWeight: 700,
            color: toast.type === 'success' ? '#7ddca0' : '#ff8080',
            background: toast.type === 'success' ? 'rgba(125,220,160,0.1)' : 'rgba(255,128,128,0.1)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(125,220,160,0.3)' : 'rgba(255,128,128,0.3)'}`,
            borderRadius: 5, padding: '4px 8px',
          }}>
            {toast.msg}
          </div>
        )}

        {/* CTA */}
        <button
          type="button"
          onClick={handleTap}
          disabled={isSoldOut || adding}
          style={{
            marginTop: 4, padding: '9px 0', borderRadius: 8, width: '100%', fontWeight: 800, fontSize: 13,
            cursor: (isSoldOut || adding) ? 'not-allowed' : 'pointer',
            background: isSoldOut ? 'rgba(255,107,107,0.08)' : gold,
            color: isSoldOut ? '#ff8080' : dark,
            border: isSoldOut ? '1px solid rgba(255,107,107,0.3)' : 'none',
            opacity: adding ? 0.7 : 1,
            transition: 'all 0.15s',
          }}
        >
          {adding ? 'Adding…' : ctaLabel}
        </button>
      </div>
    </div>
  )
}

// Injected once; drives the ticker marquee scroll animation.
const TICKER_STYLE_ID = 'sc-ticker-anim'
function ensureTickerStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById(TICKER_STYLE_ID)) return
  const el = document.createElement('style')
  el.id = TICKER_STYLE_ID
  el.textContent = `
    @keyframes sc-ticker-scroll {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    @keyframes sc-ticker-pulse {
      0%, 100% { opacity: 0.5; }
      50%       { opacity: 1; }
    }
    .sc-ticker-track {
      display: flex;
      gap: 14px;
      animation: sc-ticker-scroll 28s linear infinite;
      will-change: transform;
    }
    .sc-ticker-track:hover {
      animation-play-state: paused;
    }
    .sc-ticker-wrapper {
      overflow: hidden;
      -webkit-overflow-scrolling: touch;
      cursor: grab;
      position: relative;
    }
    .sc-ticker-wrapper::before,
    .sc-ticker-wrapper::after {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      width: 40px;
      z-index: 2;
      pointer-events: none;
    }
    .sc-ticker-wrapper::before {
      left: 0;
      background: linear-gradient(90deg, rgba(10,6,3,0.9), transparent);
    }
    .sc-ticker-wrapper::after {
      right: 0;
      background: linear-gradient(270deg, rgba(10,6,3,0.9), transparent);
    }
    .sc-ticker-empty-dot {
      display: inline-block;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: rgba(233,193,118,0.5);
      animation: sc-ticker-pulse 1.8s ease-in-out infinite;
    }
    .sc-ticker-empty-dot:nth-child(2) { animation-delay: 0.3s; }
    .sc-ticker-empty-dot:nth-child(3) { animation-delay: 0.6s; }
  `
  document.head.appendChild(el)
}

function CompactSpecialChip({ special, onAdd, venueId, tableLabel }) {
  const [adding, setAdding] = useState(false)
  const { allowed, reason } = canOneTapOrderSpecial({ special, inventoryItems: [] })
  const isSoldOut = !allowed && reason === 'sold_out'
  const qty = special.inventory?.quantityAvailable ?? 99
  const hasDiscount = special.pricing?.discountAmount > 0

  async function handleTap() {
    const tapEvent = buildSpecialTrackingEvent({ special, action: 'special_tap', venueId, tableLabel, orderMode: 'customer_self_order' })
    trackTicketTapperSpecialTap(special.id, { venueId, tableLabel, specialData: special, event: tapEvent })
    if (isSoldOut) return
    setAdding(true)
    const orderItems = buildOneTapSpecialOrderItems({ special })
    const addEvent = buildSpecialTrackingEvent({ special, action: 'special_added', venueId, tableLabel })
    await trackTicketTapperSpecialAdd(special.id, { venueId, tableLabel, specialData: special, event: addEvent })
    onAdd?.({ special, orderItems, addEvent })
    setAdding(false)
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
      background: panel, border: `1px solid ${isSoldOut ? 'rgba(255,107,107,0.25)' : border}`,
      borderRadius: 10, padding: '6px 10px', minWidth: 200, maxWidth: 260,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#E5E2E1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {special.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ color: gold, fontWeight: 900, fontSize: 13 }}>{fmt(special.pricing?.specialPrice)}</span>
          {hasDiscount && <span style={{ color: '#666', fontSize: 10, textDecoration: 'line-through' }}>{fmt(special.pricing?.regularPrice)}</span>}
        </div>
        <InventoryBadge special={special} />
      </div>
      {!isSoldOut && qty > 0 && (
        <button
          type="button"
          onClick={handleTap}
          disabled={adding}
          aria-label={`Add ${special.title}`}
          style={{
            flexShrink: 0, minWidth: 48, minHeight: 48, borderRadius: 8,
            background: gold, color: dark, border: 'none', fontWeight: 800, fontSize: 12,
            cursor: adding ? 'not-allowed' : 'pointer', opacity: adding ? 0.7 : 1,
          }}
        >
          {adding ? '…' : 'Add'}
        </button>
      )}
    </div>
  )
}

export default function TicketTapperSpecialsStrip({ specials = [], inventoryItems = [], onAddSpecial, venueId, tableLabel, localPreview, venueFeatureSettings = null, compact = false, noVenue = false, unavailable = false }) {
  if (typeof window !== 'undefined') ensureTickerStyles()

  // Hard filter: customers only see status === 'active' AND approval cleared
  // Partner specials also require venue opt-in
  const partnerSpecialsAllowed = venueFeatureSettings?.partnerSpecialsAllowed !== false

  const customerSpecials = specials.filter(s => {
    if (s.status !== 'active') return false
    if (s.approval?.required && s.approval?.status !== 'approved') return false
    if ((s.isPartnerSpecial || s.source === 'partner_network') && !partnerSpecialsAllowed) return false
    return true
  })

  if (compact) {
    const label = noVenue ? 'Select a venue to see specials'
      : unavailable ? 'Specials unavailable right now'
      : customerSpecials.length === 0 ? 'No venue specials available'
      : null

    return (
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ color: gold, fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            ⚡ Venue Specials
          </div>
          {localPreview && (
            <span style={{ fontSize: 9, color: gold, background: 'rgba(233,193,118,0.07)', border: `1px solid rgba(233,193,118,0.2)`, borderRadius: 4, padding: '2px 6px' }}>
              LOCAL PREVIEW
            </span>
          )}
        </div>
        {label ? (
          <div style={{
            height: 56, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px dashed rgba(233,193,118,0.18)', background: 'rgba(233,193,118,0.03)',
            color: 'rgba(233,193,118,0.4)', fontSize: 12, fontWeight: 600,
          }}>
            {label}
          </div>
        ) : (
          <div className="sc-ticker-wrapper">
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' }}>
              {customerSpecials.map(special => (
                <CompactSpecialChip key={special.id} special={special} onAdd={onAddSpecial} venueId={venueId} tableLabel={tableLabel} />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ marginBottom: 22 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(233,193,118,0.4), transparent)' }} />
        <div style={{ color: gold, fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          ⚡ Tonight's Specials
        </div>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(270deg, rgba(233,193,118,0.4), transparent)' }} />
        {localPreview && (
          <span style={{ fontSize: 9, color: gold, background: 'rgba(233,193,118,0.07)', border: `1px solid rgba(233,193,118,0.2)`, borderRadius: 4, padding: '2px 6px', marginLeft: 4 }}>
            LOCAL PREVIEW
          </span>
        )}
      </div>

      {customerSpecials.length === 0 ? (
        /* Placeholder when no active specials are configured */
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          height: 64, borderRadius: 12,
          border: `1px dashed rgba(233,193,118,0.18)`,
          background: 'rgba(233,193,118,0.03)',
          color: 'rgba(233,193,118,0.35)',
          fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          <span className="sc-ticker-empty-dot" />
          <span className="sc-ticker-empty-dot" />
          <span className="sc-ticker-empty-dot" />
          <span style={{ marginLeft: 6 }}>Specials coming soon</span>
        </div>
      ) : (
        /* Auto-scrolling marquee ticker — pauses on hover/touch */
        <div className="sc-ticker-wrapper" style={{ paddingBottom: 6 }}>
          <div className="sc-ticker-track" style={{ paddingRight: 14 }}>
            {/* Duplicate cards so the scroll loops seamlessly */}
            {[...customerSpecials, ...customerSpecials].map((special, idx) => (
              <SpecialCard
                key={`${special.id}-${idx}`}
                special={special}
                inventoryItems={inventoryItems}
                onAdd={onAddSpecial}
                venueId={venueId}
                tableLabel={tableLabel}
                localPreview={localPreview}
              />
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${border}, transparent)`, marginTop: 16 }} />
    </div>
  )
}
