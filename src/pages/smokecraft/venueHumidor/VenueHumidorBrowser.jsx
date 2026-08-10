import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSmokeCraftJourney } from '../../../context/SmokeCraftJourneyContext.jsx'
import * as api from '../../../services/venueHumidor/venueHumidorCustomerApiClient.js'
import SmokeCraftScreenShell from '../../../components/smokecraft/SmokeCraftScreenShell.jsx'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'
const DANGER = 'rgba(255,150,150,0.9)'
const OK = '#7fd0a3'

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price_low_to_high', label: 'Price: Low to High' },
  { value: 'price_high_to_low', label: 'Price: High to Low' },
  { value: 'strength', label: 'Strength' },
  { value: 'smoking_time', label: 'Smoking Time' },
  { value: 'newest', label: 'Newest' },
]

function availabilityCopy(product) {
  if (product.status === 'sold_out' || product.availability.availableQuantity <= 0) return { label: 'Sold Out', color: DANGER }
  if (product.availability.availableQuantity <= product.reorder_threshold) return { label: `Low Stock — ${product.availability.availableQuantity} left`, color: GOLD }
  return { label: `${product.availability.availableQuantity} available`, color: OK }
}

function CigarCard({ product, onOpen }) {
  const avail = availabilityCopy(product)
  return (
    <button
      type="button" onClick={() => onOpen(product.product_id)}
      style={{ textAlign: 'left', background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14, display: 'grid', gap: 6, cursor: 'pointer', fontFamily: 'inherit', color: CREAM, minHeight: 44 }}
    >
      <div style={{ height: 120, borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {product.primary_image_url
          ? <img src={product.primary_image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 11, color: 'rgba(229,226,225,0.4)' }}>No image</span>}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {product.is_featured && <span style={{ fontSize: 10, textTransform: 'uppercase', color: GOLD, border: `1px solid ${GOLD}`, borderRadius: 8, padding: '2px 6px' }}>Featured</span>}
        {product.is_staff_pick && <span style={{ fontSize: 10, textTransform: 'uppercase', color: OK, border: `1px solid ${OK}`, borderRadius: 8, padding: '2px 6px' }}>Staff Pick</span>}
        {product.is_limited_release && <span style={{ fontSize: 10, textTransform: 'uppercase', color: DANGER, border: `1px solid ${DANGER}`, borderRadius: 8, padding: '2px 6px' }}>Limited Release</span>}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.55)' }}>{product.brand}</div>
      <h3 style={{ margin: 0, color: GOLD, fontSize: 16 }}>{product.name}</h3>
      <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.65)' }}>{product.vitola} · {product.country} · {product.wrapper} wrapper</div>
      <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.65)' }}>Strength: {product.strength?.replace(/_/g, ' ')} · Body: {product.body?.replace(/_/g, ' ')}</div>
      {product.flavor_notes?.length > 0 && <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)' }}>Notes: {product.flavor_notes.join(', ')}</div>}
      {product.smoke_time_minutes && <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)' }}>Est. smoke time: ~{product.smoke_time_minutes} min</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
        <span style={{ fontSize: 16, color: GOLD }}>${(product.price_cents / 100).toFixed(2)}/stick</span>
        <span style={{ fontSize: 11, color: avail.color }}>{avail.label}</span>
      </div>
    </button>
  )
}

const FILTER_FIELDS = [
  { key: 'brand', label: 'Brand' },
  { key: 'country', label: 'Country' },
  { key: 'wrapper', label: 'Wrapper' },
  { key: 'vitola', label: 'Vitola' },
  { key: 'strength', label: 'Strength' },
  { key: 'body', label: 'Body' },
  { key: 'experienceLevel', label: 'Experience Level' },
]

export default function VenueHumidorBrowser() {
  const navigate = useNavigate()
  const { journey } = useSmokeCraftJourney()
  const venueId = (journey.selectedVenue && !journey.selectedVenue.skipped) ? journey.selectedVenue.id : null

  const [venueState, setVenueState] = useState('loading')
  const [venue, setVenue] = useState(null)
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({})
  const [sort, setSort] = useState('recommended')
  const [inStockOnly, setInStockOnly] = useState(true)
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const [staffPickOnly, setStaffPickOnly] = useState(false)
  const [limitedOnly, setLimitedOnly] = useState(false)

  async function load() {
    if (!venueId) { setVenueState('no_venue'); return }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { setVenueState('offline'); return }
    setVenueState('loading')
    const result = await api.browseCatalog(venueId, {
      search, ...filters, sort,
      inStockOnly: inStockOnly ? undefined : 'false',
      featured: featuredOnly || undefined, staffPick: staffPickOnly || undefined, limitedRelease: limitedOnly || undefined,
    })
    if (!result.ok) {
      setVenueState(result.status === 404 ? 'no_venue' : result.status === 401 ? 'session_expired' : 'error')
      return
    }
    setVenue(result.venue)
    setProducts(result.products)
    setVenueState(result.products.length === 0 ? 'empty' : 'ready')
  }

  useEffect(() => { load() }, [venueId, search, filters, sort, inStockOnly, featuredOnly, staffPickOnly, limitedOnly]) // eslint-disable-line react-hooks/exhaustive-deps

  const filterOptions = useMemo(() => {
    const opts = {}
    for (const f of FILTER_FIELDS) opts[f.key] = [...new Set(products.map(p => p[f.key === 'experienceLevel' ? 'experience_level' : f.key]).filter(Boolean))]
    return opts
  }, [products])

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={{ position: 'fixed', inset: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM, paddingBottom: 90 }}>
        <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 1100, margin: '0 auto' }}>
          <button type="button" onClick={() => navigate(-1)} style={{ minHeight: 44, background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', marginBottom: 12, fontFamily: 'inherit' }}>← Back</button>
          <h1 style={{ color: GOLD, fontSize: 'clamp(20px,2.6vw,28px)', margin: '0 0 4px' }}>Venue Humidor</h1>
          {venue && <p style={{ fontSize: 13, color: 'rgba(229,226,225,0.6)', margin: '0 0 16px' }}>{venue.name}</p>}

          {venueState === 'no_venue' && (
            <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 20 }}>
              <p style={{ fontSize: 14 }}>Select a venue first to browse its humidor.</p>
              <button type="button" onClick={() => navigate('/smokecraft/venue-select')} style={{ minHeight: 44, padding: '10px 20px', borderRadius: 20, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit', marginTop: 10 }}>Choose a Venue</button>
            </div>
          )}
          {venueState === 'offline' && (
            <p style={{ fontSize: 14, color: DANGER }}>You appear to be offline. <button type="button" onClick={load} style={{ background: 'transparent', border: 'none', color: GOLD, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit' }}>Retry</button></p>
          )}
          {venueState === 'session_expired' && (
            <p style={{ fontSize: 14, color: DANGER }}>Your session has expired. Please refresh to continue browsing.</p>
          )}
          {venueState === 'error' && (
            <p style={{ fontSize: 14, color: DANGER }}>Unable to load the humidor right now. <button type="button" onClick={load} style={{ background: 'transparent', border: 'none', color: GOLD, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit' }}>Retry</button></p>
          )}

          {venueId && venueState !== 'no_venue' && venueState !== 'offline' && venueState !== 'session_expired' && (
            <>
              <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                <input
                  value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by brand or name"
                  aria-label="Search cigars"
                  style={{ minHeight: 44, padding: '10px 14px', borderRadius: 10, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 14 }}
                />
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {FILTER_FIELDS.map(f => (
                    <select
                      key={f.key} aria-label={f.label} value={filters[f.key] || ''}
                      onChange={e => setFilters(prev => ({ ...prev, [f.key]: e.target.value || undefined }))}
                      style={{ minHeight: 44, padding: '8px 10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 13 }}
                    >
                      <option value="">{f.label}: Any</option>
                      {(filterOptions[f.key] || []).map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  ))}
                  <select aria-label="Sort by" value={sort} onChange={e => setSort(e.target.value)}
                    style={{ minHeight: 44, padding: '8px 10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 13 }}>
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 13 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 44 }}><input type="checkbox" checked={inStockOnly} onChange={e => setInStockOnly(e.target.checked)} /> In stock only</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 44 }}><input type="checkbox" checked={featuredOnly} onChange={e => setFeaturedOnly(e.target.checked)} /> Featured</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 44 }}><input type="checkbox" checked={staffPickOnly} onChange={e => setStaffPickOnly(e.target.checked)} /> Staff Pick</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 44 }}><input type="checkbox" checked={limitedOnly} onChange={e => setLimitedOnly(e.target.checked)} /> Limited Release</label>
                </div>
              </div>

              {venueState === 'loading' && <p style={{ fontSize: 14 }}>Loading cigars…</p>}
              {venueState === 'empty' && <p style={{ fontSize: 14, color: 'rgba(229,226,225,0.6)' }}>No cigars match your search/filters right now.</p>}
              {venueState === 'ready' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 14 }}>
                  {products.map(p => <CigarCard key={p.product_id} product={p} onOpen={(id) => navigate(`/smokecraft/venue-humidor/${id}`)} />)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </SmokeCraftScreenShell>
  )
}
