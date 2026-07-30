import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../../../../services/venueHumidor/venueHumidorAdminApiClient.js'
import SmokeCraftScreenShell from '../../../../components/smokecraft/SmokeCraftScreenShell.jsx'
import { useAdminVenueId } from './useAdminVenueId.js'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'
const DANGER = 'rgba(255,150,150,0.9)'
const OK = '#7fd0a3'

function fmtCents(c) { return `$${((c || 0) / 100).toFixed(2)}` }

export default function VenueHumidorAdminDashboard() {
  const navigate = useNavigate()
  const [venueId, setVenueId] = useAdminVenueId()
  const [state, setState] = useState('loading')
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [errorDetail, setErrorDetail] = useState(null)

  async function load() {
    if (!venueId) { setState('no_venue'); return }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { setState('offline'); return }
    setState('loading')
    const result = await api.listAdminProducts(venueId, { search })
    if (!result.ok) {
      setErrorDetail(result.error)
      setState(result.status === 403 ? 'unauthorized' : result.status === 401 ? 'session_expired' : 'error')
      return
    }
    setProducts(result.products)
    setState(result.products.length === 0 ? 'empty' : 'ready')
  }
  useEffect(() => { load() }, [venueId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={{ position: 'fixed', inset: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM, paddingBottom: 90 }}>
        <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 1100, margin: '0 auto' }}>
          <h1 style={{ color: GOLD, fontSize: 'clamp(20px,2.6vw,28px)', margin: '0 0 4px' }}>Humidor Inventory — Staff Admin</h1>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
            <input aria-label="Venue ID" placeholder="Venue ID" value={venueId} onChange={e => setVenueId(e.target.value)}
              style={{ minHeight: 44, flex: '1 1 200px', padding: '8px 10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 13 }} />
            <input aria-label="Search products" placeholder="Search SKU, name, brand, barcode" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()}
              style={{ minHeight: 44, flex: '2 1 240px', padding: '8px 10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 13 }} />
            <button type="button" onClick={load} style={{ minHeight: 44, padding: '8px 16px', borderRadius: 20, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit' }}>Search</button>
            <button type="button" onClick={() => navigate('/smokecraft/admin/humidor/new')} style={{ minHeight: 44, padding: '8px 16px', borderRadius: 20, border: `1.5px solid ${OK}`, background: 'transparent', color: OK, cursor: 'pointer', fontFamily: 'inherit' }}>+ New Cigar</button>
            <button type="button" onClick={() => navigate('/smokecraft/admin/humidor/inventory-events')} style={{ minHeight: 44, padding: '8px 16px', borderRadius: 20, border: `1.5px solid ${BORDER}`, background: 'transparent', color: CREAM, cursor: 'pointer', fontFamily: 'inherit' }}>Event History</button>
          </div>

          {state === 'no_venue' && <p style={{ fontSize: 13 }}>Enter a venue ID to load its inventory.</p>}
          {state === 'offline' && <p role="alert" style={{ fontSize: 13, color: DANGER }}>You appear to be offline. <button type="button" onClick={load} style={{ color: GOLD, background: 'none', border: 'none', cursor: 'pointer' }}>Retry</button></p>}
          {state === 'session_expired' && <p role="alert" style={{ fontSize: 13, color: DANGER }}>Your session has expired. Please log in again.</p>}
          {state === 'unauthorized' && <p role="alert" style={{ fontSize: 13, color: DANGER }}>You do not have permission to view this venue's inventory ({errorDetail}).</p>}
          {state === 'error' && <p role="alert" style={{ fontSize: 13, color: DANGER }}>Unable to load inventory right now. <button type="button" onClick={load} style={{ color: GOLD, background: 'none', border: 'none', cursor: 'pointer' }}>Retry</button></p>}
          {state === 'loading' && <p style={{ fontSize: 13 }}>Loading…</p>}
          {state === 'empty' && <p style={{ fontSize: 13 }}>No products found for this venue.</p>}

          {state === 'ready' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: GOLD, borderBottom: `1px solid ${BORDER}` }}>
                    <th style={{ padding: 8 }}>Image</th>
                    <th style={{ padding: 8 }}>Brand / Name</th>
                    <th style={{ padding: 8 }}>SKU</th>
                    <th style={{ padding: 8 }}>Vitola</th>
                    <th style={{ padding: 8 }}>Strength</th>
                    <th style={{ padding: 8 }}>Price</th>
                    <th style={{ padding: 8 }}>Sealed</th>
                    <th style={{ padding: 8 }}>Opened</th>
                    <th style={{ padding: 8 }}>Physical</th>
                    <th style={{ padding: 8 }}>Reserved</th>
                    <th style={{ padding: 8 }}>Held</th>
                    <th style={{ padding: 8 }}>Available</th>
                    <th style={{ padding: 8 }}>Reorder Pt</th>
                    <th style={{ padding: 8 }}>Status</th>
                    <th style={{ padding: 8 }}>Visible</th>
                    <th style={{ padding: 8 }}>Zone / Location</th>
                    <th style={{ padding: 8 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.product_id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: 8 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 6, overflow: 'hidden', background: 'rgba(255,255,255,0.04)' }}>
                          {p.primary_image_url && <img src={p.primary_image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                      </td>
                      <td style={{ padding: 8 }}>{p.brand}<br /><strong style={{ color: GOLD }}>{p.name}</strong></td>
                      <td style={{ padding: 8 }}>{p.sku}{p.barcode ? <><br /><span style={{ opacity: 0.6 }}>{p.barcode}</span></> : null}</td>
                      <td style={{ padding: 8 }}>{p.vitola}</td>
                      <td style={{ padding: 8 }}>{p.strength}</td>
                      <td style={{ padding: 8 }}>{fmtCents(p.price_cents)}</td>
                      <td style={{ padding: 8 }}>{p.sealed_box_count}</td>
                      <td style={{ padding: 8 }}>{p.opened_box_count}</td>
                      <td style={{ padding: 8 }}>{p.physical_quantity}</td>
                      <td style={{ padding: 8 }}>{p.availability?.reservedQuantity}</td>
                      <td style={{ padding: 8 }}>{p.availability?.heldQuantity}</td>
                      <td style={{ padding: 8, color: p.isLowStock ? DANGER : OK }}>{p.availability?.availableQuantity}{p.isLowStock ? ' (low)' : ''}</td>
                      <td style={{ padding: 8 }}>{p.reorder_threshold}</td>
                      <td style={{ padding: 8 }}>{p.status}</td>
                      <td style={{ padding: 8 }}>{p.is_customer_visible ? 'Yes' : 'Hidden'}</td>
                      <td style={{ padding: 8 }}>{p.humidor_zone}{p.storage_location ? ` / ${p.storage_location}` : ''}</td>
                      <td style={{ padding: 8 }}>
                        <button type="button" onClick={() => navigate(`/smokecraft/admin/humidor/${p.product_id}/edit`)} style={{ minHeight: 32, padding: '4px 10px', borderRadius: 14, border: `1px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11 }}>Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </SmokeCraftScreenShell>
  )
}
