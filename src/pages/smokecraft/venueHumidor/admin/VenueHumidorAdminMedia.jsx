/**
 * Venue Humidor Media and Product Image Management — Production
 * Package 1 of 7. Staff media library / product gallery / upload /
 * approval / missing-image report admin screen. Live, backend-wired —
 * every action below calls a real server endpoint (see
 * venueHumidorAdminApiClient.js media functions and
 * server/routes/venueHumidorRoutes.js).
 */
import { useEffect, useState, useRef } from 'react'
import * as api from '../../../../services/venueHumidor/venueHumidorAdminApiClient.js'
import SmokeCraftScreenShell from '../../../../components/smokecraft/SmokeCraftScreenShell.jsx'
import { useAdminVenueId } from './useAdminVenueId.js'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CHARCOAL = '#171b24'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const DANGER = 'rgba(255,150,150,0.9)'
const OK = '#7fd0a3'

const PURPOSES = ['product_primary', 'product_gallery', 'product_thumbnail', 'browse_card', 'detail_hero', 'venue_hero', 'venue_gallery']
const SOURCE_TYPES = ['venue_uploaded_photography', 'venue_uploaded_venue_photography', 'manufacturer_authorized', 'distributor_authorized', 'smokecraft_master_catalog', 'educational_graphic']

function pill(bg, color) { return { display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 11, background: bg, color, marginRight: 6 } }
function approvalPill(state) {
  const map = { approved: pill('rgba(127,208,163,0.15)', OK), rejected: pill('rgba(255,150,150,0.15)', DANGER), pending_review: pill('rgba(233,193,118,0.15)', GOLD) }
  return map[state] || pill('rgba(255,255,255,0.08)', CREAM)
}

export default function VenueHumidorAdminMedia() {
  const [venueId, setVenueId] = useAdminVenueId()
  const [productId, setProductId] = useState('')
  const [gallery, setGallery] = useState([])
  const [venueMedia, setVenueMedia] = useState([])
  const [report, setReport] = useState([])
  const [state, setState] = useState('idle')
  const [message, setMessage] = useState(null)
  const [purpose, setPurpose] = useState('product_gallery')
  const [sourceType, setSourceType] = useState('venue_uploaded_photography')
  const [altText, setAltText] = useState('')
  const [rightsReference, setRightsReference] = useState('')
  const fileRef = useRef(null)
  const [pendingFile, setPendingFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  async function loadGallery() {
    if (!venueId || !productId) return
    const result = await api.listProductGallery(venueId, productId)
    if (result.ok) setGallery(result.gallery)
  }
  async function loadVenueMedia() {
    if (!venueId) return
    const result = await api.listVenueMedia(venueId)
    if (result.ok) setVenueMedia(result.media)
  }
  async function loadReport() {
    if (!venueId) return
    const result = await api.getMissingImageReport(venueId)
    if (result.ok) setReport(result.report)
  }
  useEffect(() => { loadGallery() }, [venueId, productId]) // eslint-disable-line
  useEffect(() => { loadVenueMedia(); loadReport() }, [venueId]) // eslint-disable-line

  function onFilePicked(file) {
    if (!file) return
    setPendingFile(file)
  }
  function onDrop(e) {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    onFilePicked(file)
  }

  async function doUpload() {
    if (!pendingFile || !venueId) return
    setState('uploading'); setMessage(null)
    try {
      const buf = await pendingFile.arrayBuffer()
      const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
      const result = await api.uploadMediaAsset(venueId, {
        productId: productId || undefined, scope: productId ? 'product' : 'venue', purpose, sourceType,
        fileBase64: b64, originalFilename: pendingFile.name, altText, rightsReference: rightsReference || undefined,
      })
      if (!result.ok) { setMessage({ type: 'error', text: `Upload failed: ${result.error}` }); setState('ready'); return }
      setMessage({ type: 'ok', text: `Upload succeeded — asset ${result.asset.assetId.slice(0, 8)}… is pending review.` })
      setPendingFile(null)
      if (fileRef.current) fileRef.current.value = ''
      await loadGallery(); await loadVenueMedia(); await loadReport()
      setState('ready')
    } catch (err) {
      setMessage({ type: 'error', text: `Upload failed: ${err.message}` })
      setState('ready')
    }
  }

  async function doApprove(assetId) {
    const result = await api.approveAsset(venueId, assetId)
    setMessage(result.ok ? { type: 'ok', text: 'Approved.' } : { type: 'error', text: `Approve failed: ${result.error}` })
    await loadGallery(); await loadVenueMedia(); await loadReport()
  }
  async function doReject(assetId) {
    const reason = window.prompt('Rejection reason (required):')
    if (!reason) return
    const result = await api.rejectAsset(venueId, assetId, reason)
    setMessage(result.ok ? { type: 'ok', text: 'Rejected.' } : { type: 'error', text: `Reject failed: ${result.error}` })
    await loadGallery(); await loadVenueMedia(); await loadReport()
  }
  async function doSetPrimary(assetId) {
    const result = await api.setPrimaryAsset(venueId, productId, assetId)
    setMessage(result.ok ? { type: 'ok', text: 'Primary image set.' } : { type: 'error', text: `Set primary failed: ${result.error}` })
    await loadGallery()
  }
  async function doRetire(assetId) {
    const reason = window.prompt('Retirement reason:')
    const result = await api.retireAsset(venueId, assetId, reason || 'staff retirement')
    setMessage(result.ok ? { type: 'ok', text: 'Retired.' } : { type: 'error', text: `Retire failed: ${result.error}` })
    await loadGallery(); await loadVenueMedia(); await loadReport()
  }

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={{ position: 'fixed', inset: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM, paddingBottom: 90 }}>
        <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 1100, margin: '0 auto' }}>
          <h1 style={{ color: GOLD, fontSize: 'clamp(20px,2.6vw,28px)', margin: '0 0 4px' }}>Humidor Media &amp; Product Images — Staff Admin</h1>
          <p style={{ fontSize: 13, opacity: 0.8 }}>Upload, approve, and organize real product and venue photography. Only approved + active images are ever shown to customers.</p>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
            <input aria-label="Venue ID" placeholder="Venue ID" value={venueId} onChange={e => setVenueId(e.target.value)}
              style={{ minHeight: 44, flex: '1 1 200px', padding: '8px 10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 13 }} />
            <input aria-label="Product ID (optional, for product gallery)" placeholder="Product ID (optional)" value={productId} onChange={e => setProductId(e.target.value)}
              style={{ minHeight: 44, flex: '1 1 240px', padding: '8px 10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 13 }} />
          </div>

          {message && (
            <p role="status" style={{ fontSize: 13, color: message.type === 'error' ? DANGER : OK }}>{message.text}</p>
          )}

          <section aria-label="Upload new image" style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16, marginBottom: 20, background: CHARCOAL }}>
            <h2 style={{ color: GOLD, fontSize: 16, margin: '0 0 10px' }}>Upload Image</h2>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              style={{ border: `2px dashed ${dragOver ? GOLD : BORDER}`, borderRadius: 8, padding: 20, textAlign: 'center', marginBottom: 10, background: dragOver ? 'rgba(233,193,118,0.06)' : 'transparent' }}
            >
              <p style={{ fontSize: 13, margin: '0 0 8px' }}>Drag and drop an image here, or</p>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" aria-label="Choose image file"
                onChange={(e) => onFilePicked(e.target.files?.[0])}
                style={{ color: CREAM, fontSize: 13 }} />
              {pendingFile && <p style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>Selected: {pendingFile.name} ({(pendingFile.size / 1024).toFixed(0)} KB) — preview before save</p>}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <label style={{ fontSize: 12 }}>
                Purpose{' '}
                <select aria-label="Image purpose" value={purpose} onChange={e => setPurpose(e.target.value)} style={{ minHeight: 36, background: 'rgba(255,255,255,0.06)', color: CREAM, border: `1px solid ${BORDER}`, borderRadius: 6 }}>
                  {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>
              <label style={{ fontSize: 12 }}>
                Source{' '}
                <select aria-label="Source declaration" value={sourceType} onChange={e => setSourceType(e.target.value)} style={{ minHeight: 36, background: 'rgba(255,255,255,0.06)', color: CREAM, border: `1px solid ${BORDER}`, borderRadius: 6 }}>
                  {SOURCE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              <input aria-label="Alt text" placeholder="Alt text (required for accessibility)" value={altText} onChange={e => setAltText(e.target.value)}
                style={{ minHeight: 40, flex: '1 1 220px', padding: '6px 10px', borderRadius: 6, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 13 }} />
              <input aria-label="Rights reference (required for manufacturer/distributor sources)" placeholder="Rights reference (if manufacturer/distributor)" value={rightsReference} onChange={e => setRightsReference(e.target.value)}
                style={{ minHeight: 40, flex: '1 1 220px', padding: '6px 10px', borderRadius: 6, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 13 }} />
            </div>
            <button type="button" disabled={!pendingFile || state === 'uploading'} onClick={doUpload}
              style={{ minHeight: 44, marginTop: 10, padding: '8px 20px', borderRadius: 20, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: pendingFile ? 'pointer' : 'not-allowed', opacity: pendingFile ? 1 : 0.5, fontFamily: 'inherit' }}>
              {state === 'uploading' ? 'Uploading…' : 'Upload for Review'}
            </button>
          </section>

          {productId && (
            <section aria-label="Product gallery" style={{ marginBottom: 24 }}>
              <h2 style={{ color: GOLD, fontSize: 16 }}>Product Gallery</h2>
              {gallery.length === 0 && <p style={{ fontSize: 13, opacity: 0.7 }}>No gallery images for this product yet.</p>}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {gallery.map(asset => (
                  <div key={asset.assetId} style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 10, width: 220, background: CHARCOAL }}>
                    <div style={{ aspectRatio: '4/3', background: 'rgba(255,255,255,0.04)', borderRadius: 6, marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      <img src={asset.url} alt={asset.altText || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    </div>
                    <p style={{ fontSize: 11, margin: '0 0 4px' }}>
                      <span style={approvalPill(asset.approvalState)}>{asset.approvalState}</span>
                      {asset.isPrimary && <span style={pill('rgba(233,193,118,0.2)', GOLD)}>primary</span>}
                    </p>
                    <p style={{ fontSize: 10, opacity: 0.6, margin: '0 0 8px' }}>{asset.purpose} · {asset.sourceType}</p>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {asset.approvalState === 'pending_review' && <>
                        <button type="button" onClick={() => doApprove(asset.assetId)} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: `1px solid ${OK}`, background: 'transparent', color: OK, cursor: 'pointer' }}>Approve</button>
                        <button type="button" onClick={() => doReject(asset.assetId)} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: `1px solid ${DANGER}`, background: 'transparent', color: DANGER, cursor: 'pointer' }}>Reject</button>
                      </>}
                      {asset.approvalState === 'approved' && !asset.isPrimary && <button type="button" onClick={() => doSetPrimary(asset.assetId)} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: `1px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer' }}>Set Primary</button>}
                      {asset.activeState !== 'retired' && <button type="button" onClick={() => doRetire(asset.assetId)} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: `1px solid ${BORDER}`, background: 'transparent', color: CREAM, cursor: 'pointer' }}>Retire</button>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section aria-label="Missing image report" style={{ marginBottom: 24 }}>
            <h2 style={{ color: GOLD, fontSize: 16 }}>Missing-Image Report</h2>
            {report.length === 0 && <p style={{ fontSize: 13, opacity: 0.7 }}>No products currently flagged.</p>}
            {report.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr style={{ color: GOLD, textAlign: 'left', borderBottom: `1px solid ${BORDER}` }}><th style={{ padding: 6 }}>SKU</th><th>Name</th><th>Brand</th><th>Issue</th></tr></thead>
                  <tbody>
                    {report.map(r => (
                      <tr key={r.productId} style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td style={{ padding: 6 }}>{r.sku}</td><td>{r.name}</td><td>{r.brand}</td>
                        <td style={{ color: DANGER }}>{r.issue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section aria-label="Venue media library">
            <h2 style={{ color: GOLD, fontSize: 16 }}>Venue Media Library ({venueMedia.length})</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {venueMedia.slice(0, 12).map(asset => (
                <div key={asset.assetId} style={{ width: 96, fontSize: 10 }}>
                  <div style={{ aspectRatio: '1/1', background: 'rgba(255,255,255,0.04)', borderRadius: 6, overflow: 'hidden' }}>
                    <img src={asset.url} alt={asset.altText || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  </div>
                  <p style={approvalPill(asset.approvalState)}>{asset.approvalState}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </SmokeCraftScreenShell>
  )
}
