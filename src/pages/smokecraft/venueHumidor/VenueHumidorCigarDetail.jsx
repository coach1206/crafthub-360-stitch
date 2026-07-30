import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSmokeCraftJourney } from '../../../context/SmokeCraftJourneyContext.jsx'
import * as api from '../../../services/venueHumidor/venueHumidorCustomerApiClient.js'
import SmokeCraftScreenShell from '../../../components/smokecraft/SmokeCraftScreenShell.jsx'
import { SMOKECRAFT_NAV_DESTINATIONS as NAV } from '../../../constants/smokecraftNavigationRegistry.js'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'
const DANGER = 'rgba(255,150,150,0.9)'
const OK = '#7fd0a3'

function actionKey(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }

function ActionResult({ state, messages }) {
  if (state === 'idle') return null
  const color = state === 'error' ? DANGER : OK
  return <p role="status" style={{ fontSize: 12, color, marginTop: 6 }}>{messages[state] || messages.default}</p>
}

export default function VenueHumidorCigarDetail() {
  const { cigarId } = useParams()
  const navigate = useNavigate()
  const { journey } = useSmokeCraftJourney()
  const venueId = (journey.selectedVenue && !journey.selectedVenue.skipped) ? journey.selectedVenue.id : null

  const [state, setState] = useState('loading')
  const [product, setProduct] = useState(null)
  const [venue, setVenue] = useState(null)
  const [stickState, setStickState] = useState('idle')
  const [boxState, setBoxState] = useState('idle')
  const [reserveState, setReserveState] = useState('idle')
  const [favoriteState, setFavoriteState] = useState('idle')
  const [isFavorited, setIsFavorited] = useState(false)
  const [unsupportedMessage, setUnsupportedMessage] = useState(null)

  async function load() {
    if (!venueId) { setState('no_venue'); return }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { setState('offline'); return }
    setState('loading')
    const result = await api.getCigarDetail(venueId, cigarId)
    if (!result.ok) {
      setState(result.status === 404 ? 'not_found' : result.status === 401 ? 'session_expired' : 'error')
      return
    }
    setVenue(result.venue)
    setProduct(result.product)
    setState('ready')
    const favResult = await api.listFavorites()
    if (favResult.ok) setIsFavorited(favResult.favorites.some(f => f.product_id === cigarId))
  }
  useEffect(() => { load() }, [venueId, cigarId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAddStick() {
    setStickState('loading')
    const result = await api.createStickHold(venueId, cigarId, actionKey('gb-vh-stick'))
    setStickState(result.ok ? 'hold_created' : (result.error === 'insufficient_inventory' ? 'sold_out' : 'error'))
    if (result.ok) await load()
  }
  async function handlePurchaseBox() {
    setBoxState('loading')
    const result = await api.createBoxHold(venueId, cigarId, actionKey('gb-vh-box'))
    setBoxState(result.ok ? 'hold_created' : (result.error === 'box_purchase_unavailable' ? 'unavailable' : result.error === 'insufficient_inventory' ? 'sold_out' : 'error'))
    if (result.ok) await load()
  }
  async function handleReserve() {
    setReserveState('loading')
    const result = await api.createReservation(venueId, cigarId, 1, actionKey('gb-vh-reserve'))
    setReserveState(result.ok ? 'reservation_created' : (result.error === 'insufficient_inventory' ? 'sold_out' : 'error'))
    if (result.ok) await load()
  }
  async function handleFavorite() {
    setFavoriteState('loading')
    const result = isFavorited ? await api.removeFavorite(venueId, cigarId) : await api.addFavorite(venueId, cigarId)
    if (result.ok) { setIsFavorited(!isFavorited); setFavoriteState('idle') } else setFavoriteState('error')
  }
  async function handleUnsupported(action) {
    const result = action === 'tab' ? await api.requestVenueTab(venueId, cigarId) : await api.requestTableDelivery(venueId, cigarId)
    setUnsupportedMessage(result.body?.message || 'This action is not available yet.')
  }

  if (state === 'loading') return <SmokeCraftScreenShell mode="live" status="loading" loadingMessage="Loading cigar…" />
  if (state === 'offline') return <SmokeCraftScreenShell mode="live" status="offline" onRetry={load} />
  if (state === 'no_venue') return <SmokeCraftScreenShell mode="live" status="empty" emptyMessage="Select a venue first to view this cigar." />
  if (state === 'not_found') return <SmokeCraftScreenShell mode="live" status="empty" emptyMessage="This cigar is not available at your venue." />
  if (state === 'session_expired') return <SmokeCraftScreenShell mode="live" status="error" errorMessage="Your session has expired. Please refresh." />
  if (state === 'error') return <SmokeCraftScreenShell mode="live" status="error" errorMessage="Unable to load this cigar right now." onRetry={load} />

  const available = product.availability.availableQuantity
  const soldOut = product.status === 'sold_out' || available <= 0

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={{ position: 'fixed', inset: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM, paddingBottom: 90 }}>
        <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 900, margin: '0 auto' }}>
          <button type="button" onClick={() => navigate('/smokecraft/venue-humidor')} style={{ minHeight: 44, background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', marginBottom: 12, fontFamily: 'inherit' }}>← Back to Humidor</button>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 14, marginBottom: 16 }}>
            <div style={{ height: 220, borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {product.primary_image_url ? <img src={product.primary_image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 12, color: 'rgba(229,226,225,0.4)' }}>No image</span>}
            </div>
            {product.secondary_image_url && (
              <div style={{ height: 220, borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.04)' }}>
                <img src={product.secondary_image_url} alt={`${product.name} secondary`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            {product.is_featured && <span style={{ fontSize: 10, textTransform: 'uppercase', color: GOLD, border: `1px solid ${GOLD}`, borderRadius: 8, padding: '2px 6px' }}>Featured</span>}
            {product.is_staff_pick && <span style={{ fontSize: 10, textTransform: 'uppercase', color: OK, border: `1px solid ${OK}`, borderRadius: 8, padding: '2px 6px' }}>Staff Pick</span>}
            {product.is_limited_release && <span style={{ fontSize: 10, textTransform: 'uppercase', color: DANGER, border: `1px solid ${DANGER}`, borderRadius: 8, padding: '2px 6px' }}>Limited Release</span>}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.55)' }}>{product.brand}</div>
          <h1 style={{ color: GOLD, fontSize: 'clamp(20px,2.6vw,28px)', margin: '4px 0 12px' }}>{product.name}</h1>

          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 16, display: 'grid', gap: 8, fontSize: 13 }}>
            <div>Vitola: {product.vitola} · Origin: {product.country}</div>
            <div>Wrapper: {product.wrapper} · Binder: {product.binder} · Filler: {product.filler}</div>
            <div>Strength: {product.strength?.replace(/_/g, ' ')} · Body: {product.body?.replace(/_/g, ' ')}</div>
            {product.flavor_notes?.length > 0 && <div>Flavor notes: {product.flavor_notes.join(', ')}</div>}
            <div>Length: {product.length_inches}" · Ring gauge: {product.ring_gauge}</div>
            <div>Est. smoke time: ~{product.smoke_time_minutes} min · Experience level: {product.experience_level}</div>
            {product.venue_description && <div>{product.venue_description}</div>}
            {product.staff_notes && <div style={{ color: GOLD }}>Staff notes: {product.staff_notes}</div>}
          </div>

          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontSize: 22, color: GOLD }}>${(product.price_cents / 100).toFixed(2)}/stick</span>
              {product.box_price_cents && <span style={{ fontSize: 14, color: 'rgba(229,226,225,0.7)' }}>Box of {product.box_quantity}: ${(product.box_price_cents / 100).toFixed(2)}</span>}
            </div>
            <div style={{ fontSize: 13, color: soldOut ? DANGER : (available <= product.reorder_threshold ? GOLD : OK) }}>
              {soldOut ? 'Sold Out' : available <= product.reorder_threshold ? `Low Stock — ${available} available` : `${available} available`}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => navigate(NAV.PAIRING_STANDALONE)} style={{ minHeight: 44, padding: '10px 18px', borderRadius: 20, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit' }}>Find a Pairing</button>
              <button type="button" disabled={soldOut || stickState === 'loading'} onClick={handleAddStick} style={{ minHeight: 44, padding: '10px 18px', borderRadius: 20, border: `1px solid ${BORDER}`, background: 'transparent', color: soldOut ? 'rgba(229,226,225,0.35)' : CREAM, cursor: soldOut ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>Add One Stick</button>
              <button type="button" disabled={!product.box_price_cents || soldOut || boxState === 'loading'} onClick={handlePurchaseBox} style={{ minHeight: 44, padding: '10px 18px', borderRadius: 20, border: `1px solid ${BORDER}`, background: 'transparent', color: (!product.box_price_cents || soldOut) ? 'rgba(229,226,225,0.35)' : CREAM, cursor: (!product.box_price_cents || soldOut) ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>Purchase Box</button>
              <button type="button" disabled={soldOut || reserveState === 'loading'} onClick={handleReserve} style={{ minHeight: 44, padding: '10px 18px', borderRadius: 20, border: `1px solid ${BORDER}`, background: 'transparent', color: soldOut ? 'rgba(229,226,225,0.35)' : CREAM, cursor: soldOut ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>Reserve</button>
              <button type="button" onClick={handleFavorite} style={{ minHeight: 44, padding: '10px 18px', borderRadius: 20, border: `1px solid ${isFavorited ? GOLD : BORDER}`, background: 'transparent', color: isFavorited ? GOLD : CREAM, cursor: 'pointer', fontFamily: 'inherit' }}>{isFavorited ? '★ Saved' : '☆ Save to Favorites'}</button>
            </div>
            <ActionResult state={stickState} messages={{ hold_created: 'Stick held for 15 minutes.', sold_out: 'Sold out.', error: 'Unable to hold this stick right now.' }} />
            <ActionResult state={boxState} messages={{ hold_created: 'Box held for 15 minutes.', unavailable: 'Box purchase is not available for this cigar.', sold_out: 'Not enough stock for a full box.', error: 'Unable to hold this box right now.' }} />
            <ActionResult state={reserveState} messages={{ reservation_created: 'Reserved — a staff member will confirm shortly.', sold_out: 'Not enough stock to reserve.', error: 'Unable to reserve this cigar right now.' }} />
            <ActionResult state={favoriteState} messages={{ error: 'Unable to update favorites right now.' }} />

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
              <button type="button" onClick={() => handleUnsupported('tab')} style={{ minHeight: 44, padding: '10px 18px', borderRadius: 20, border: `1px solid ${BORDER}`, background: 'transparent', color: 'rgba(229,226,225,0.7)', cursor: 'pointer', fontFamily: 'inherit' }}>Add to Venue Tab</button>
              <button type="button" onClick={() => handleUnsupported('table')} style={{ minHeight: 44, padding: '10px 18px', borderRadius: 20, border: `1px solid ${BORDER}`, background: 'transparent', color: 'rgba(229,226,225,0.7)', cursor: 'pointer', fontFamily: 'inherit' }}>Request Table / Seat Delivery</button>
            </div>
            {unsupportedMessage && <p role="alert" style={{ fontSize: 12, color: 'rgba(229,226,225,0.6)' }}>{unsupportedMessage}</p>}
          </div>

          {product.similarCigars?.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h2 style={{ fontSize: 15, color: GOLD }}>Similar Available Cigars</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 10, marginTop: 8 }}>
                {product.similarCigars.map(s => (
                  <button key={s.product_id} type="button" onClick={() => navigate(`/smokecraft/venue-humidor/${s.product_id}`)}
                    style={{ textAlign: 'left', minHeight: 44, background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10, cursor: 'pointer', fontFamily: 'inherit', color: CREAM }}>
                    <div style={{ fontSize: 13, color: GOLD }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.6)' }}>{s.brand} · ${(s.price_cents / 100).toFixed(2)}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </SmokeCraftScreenShell>
  )
}
