import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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

const inputStyle = { minHeight: 44, width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 13, boxSizing: 'border-box' }
const labelStyle = { fontSize: 11, color: 'rgba(229,226,225,0.65)', display: 'block', marginBottom: 4 }
const fieldWrap = { marginBottom: 10 }

const BLANK = {
  sku: '', barcode: '', name: '', brand: '', productLine: '', country: '', region: '',
  vitola: '', lengthInches: '', ringGauge: '', wrapper: '', binder: '', filler: '',
  strength: '', body: '', flavorNotes: '', tags: '', smokeTimeMinutes: '', experienceLevel: '',
  priceCents: '', boxPriceCents: '', boxQuantity: '', costCents: '',
  reorderThreshold: '5', humidorZone: '', storageLocation: '', supplierName: '', supplierSku: '',
  primaryImageUrl: '', secondaryImageUrl: '', venueDescription: '', staffNotes: '', initialQuantity: '0',
}

function toPayload(form) {
  const payload = {}
  for (const [k, v] of Object.entries(form)) {
    if (v === '' || v == null) continue
    if (['lengthInches'].includes(k)) payload[k] = Number(v)
    else if (['ringGauge', 'smokeTimeMinutes', 'reorderThreshold', 'boxQuantity', 'initialQuantity'].includes(k)) payload[k] = parseInt(v, 10)
    else if (['priceCents', 'boxPriceCents', 'costCents'].includes(k)) payload[k] = Math.round(Number(v) * 100)
    else if (k === 'flavorNotes' || k === 'tags') payload[k] = String(v).split(',').map(s => s.trim()).filter(Boolean)
    else payload[k] = v
  }
  return payload
}

function fromProduct(p) {
  return {
    sku: p.sku || '', barcode: p.barcode || '', name: p.name || '', brand: p.brand || '',
    productLine: p.product_line || '', country: p.country || '', region: p.region || '',
    vitola: p.vitola || '', lengthInches: p.length_inches ?? '', ringGauge: p.ring_gauge ?? '',
    wrapper: p.wrapper || '', binder: p.binder || '', filler: p.filler || '',
    strength: p.strength || '', body: p.body || '', flavorNotes: (p.flavor_notes || []).join(', '),
    tags: (p.tags || []).join(', '), smokeTimeMinutes: p.smoke_time_minutes ?? '', experienceLevel: p.experience_level || '',
    priceCents: p.price_cents != null ? (p.price_cents / 100).toFixed(2) : '',
    boxPriceCents: p.box_price_cents != null ? (p.box_price_cents / 100).toFixed(2) : '',
    boxQuantity: p.box_quantity ?? '', costCents: p.cost_cents != null ? (p.cost_cents / 100).toFixed(2) : '',
    reorderThreshold: p.reorder_threshold ?? '5', humidorZone: p.humidor_zone || '', storageLocation: p.storage_location || '',
    supplierName: p.supplier_name || '', supplierSku: p.supplier_sku || '', primaryImageUrl: p.primary_image_url || '',
    secondaryImageUrl: p.secondary_image_url || '', venueDescription: p.venue_description || '', staffNotes: p.staff_notes || '',
    initialQuantity: '0',
  }
}

function Field({ id, label, children }) {
  return <div style={fieldWrap}><label htmlFor={id} style={labelStyle}>{label}</label>{children}</div>
}

const MUTATION_TYPES = [
  { value: 'receiving', label: 'Receive Inventory', sign: '+' },
  { value: 'box_opened', label: 'Open Sealed Box', sign: '0' },
  { value: 'stick_added', label: 'Add Loose Sticks', sign: '+' },
  { value: 'stick_removed', label: 'Remove Loose Sticks', sign: '-' },
  { value: 'damage', label: 'Record Damage', sign: '-' },
  { value: 'loss', label: 'Record Loss', sign: '-' },
  { value: 'complimentary', label: 'Record Complimentary', sign: '-' },
  { value: 'return', label: 'Record Return', sign: '+' },
  { value: 'count_correction', label: 'Correct Inventory Count', sign: '=' },
]

export default function VenueHumidorAdminProductForm() {
  const navigate = useNavigate()
  const { cigarId } = useParams()
  const isEdit = !!cigarId
  const [venueId] = useAdminVenueId()

  const [state, setState] = useState(isEdit ? 'loading' : 'ready')
  const [form, setForm] = useState(BLANK)
  const [product, setProduct] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [saveState, setSaveState] = useState('idle')
  const [saveError, setSaveError] = useState(null)

  const [mutationType, setMutationType] = useState('receiving')
  const [mutationQty, setMutationQty] = useState('')
  const [mutationReason, setMutationReason] = useState('')
  const [mutationState, setMutationState] = useState('idle')
  const [mutationError, setMutationError] = useState(null)
  const [mutationSubmittedKey, setMutationSubmittedKey] = useState(null)

  async function load() {
    if (!venueId || !cigarId) { setState(venueId ? 'ready' : 'no_venue'); return }
    setState('loading')
    const result = await api.getAdminProduct(venueId, cigarId)
    if (!result.ok) { setState(result.status === 403 ? 'unauthorized' : result.status === 404 ? 'not_found' : 'error'); return }
    setProduct(result.product)
    setForm(fromProduct(result.product))
    setState('ready')
  }
  useEffect(() => { load() }, [venueId, cigarId]) // eslint-disable-line react-hooks/exhaustive-deps

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

  async function handleSave() {
    if (!venueId) return
    setSaveState('saving')
    setSaveError(null)
    setFieldErrors({})
    const payload = toPayload(form)
    const result = isEdit
      ? await api.updateAdminProduct(venueId, cigarId, payload)
      : await api.createAdminProduct(venueId, payload)
    if (!result.ok) {
      setSaveState('failed')
      setSaveError(result.error)
      if (result.fieldErrors) setFieldErrors(result.fieldErrors)
      return
    }
    setSaveState('saved')
    if (!isEdit) navigate(`/smokecraft/admin/humidor/${result.product.product_id}/edit`)
    else { setProduct(result.product); setForm(fromProduct(result.product)) }
  }

  async function handleMutate() {
    if (mutationState === 'submitting') return
    setMutationState('submitting')
    setMutationError(null)
    const idempotencyKey = `vh-admin-mut-${cigarId}-${mutationType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setMutationSubmittedKey(idempotencyKey)
    const body = { eventType: mutationType, idempotencyKey, reason: mutationReason }
    if (mutationType === 'count_correction') body.correctedQuantity = parseInt(mutationQty, 10)
    else body.quantity = parseInt(mutationQty, 10)
    const result = await api.applyInventoryMutation(venueId, cigarId, body)
    if (!result.ok) { setMutationState('failed'); setMutationError(result.error); return }
    setMutationState('applied')
    setMutationQty('')
    setMutationReason('')
    await load()
  }

  async function handleClassification(patch) {
    const result = await api.updateClassification(venueId, cigarId, patch)
    if (result.ok) { setProduct(result.product) }
  }

  if (state === 'no_venue') return <SmokeCraftScreenShell mode="live" status="empty" emptyMessage="Set a venue ID on the dashboard first." />
  if (state === 'loading') return <SmokeCraftScreenShell mode="live" status="loading" loadingMessage="Loading…" />
  if (state === 'unauthorized') return <SmokeCraftScreenShell mode="live" status="error" errorMessage="You do not have permission to edit this product." />
  if (state === 'not_found') return <SmokeCraftScreenShell mode="live" status="empty" emptyMessage="This cigar could not be found." />
  if (state === 'error') return <SmokeCraftScreenShell mode="live" status="error" errorMessage="Unable to load this product right now." onRetry={load} />

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={{ position: 'fixed', inset: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM, paddingBottom: 90 }}>
        <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 900, margin: '0 auto' }}>
          <button type="button" onClick={() => navigate('/smokecraft/admin/humidor')} style={{ minHeight: 44, background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', marginBottom: 12, fontFamily: 'inherit' }}>← Back to Dashboard</button>
          <h1 style={{ color: GOLD, fontSize: 'clamp(20px,2.6vw,28px)', margin: '0 0 12px' }}>{isEdit ? `Edit: ${product?.name || ''}` : 'New Cigar'}</h1>

          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            <Field id="sku" label="SKU *"><input id="sku" style={inputStyle} value={form.sku} onChange={e => set('sku', e.target.value)} />{fieldErrors.sku && <span role="alert" style={{ color: DANGER, fontSize: 11 }}>{fieldErrors.sku}</span>}</Field>
            <Field id="barcode" label="Barcode"><input id="barcode" style={inputStyle} value={form.barcode} onChange={e => set('barcode', e.target.value)} /></Field>
            <Field id="name" label="Cigar Name *"><input id="name" style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} />{fieldErrors.name && <span role="alert" style={{ color: DANGER, fontSize: 11 }}>{fieldErrors.name}</span>}</Field>
            <Field id="brand" label="Brand"><input id="brand" style={inputStyle} value={form.brand} onChange={e => set('brand', e.target.value)} /></Field>
            <Field id="productLine" label="Line"><input id="productLine" style={inputStyle} value={form.productLine} onChange={e => set('productLine', e.target.value)} /></Field>
            <Field id="country" label="Country"><input id="country" style={inputStyle} value={form.country} onChange={e => set('country', e.target.value)} /></Field>
            <Field id="region" label="Region"><input id="region" style={inputStyle} value={form.region} onChange={e => set('region', e.target.value)} /></Field>
            <Field id="vitola" label="Vitola"><input id="vitola" style={inputStyle} value={form.vitola} onChange={e => set('vitola', e.target.value)} /></Field>
            <Field id="lengthInches" label="Length (in)"><input id="lengthInches" type="number" step="0.25" style={inputStyle} value={form.lengthInches} onChange={e => set('lengthInches', e.target.value)} /></Field>
            <Field id="ringGauge" label="Ring Gauge"><input id="ringGauge" type="number" style={inputStyle} value={form.ringGauge} onChange={e => set('ringGauge', e.target.value)} /></Field>
            <Field id="wrapper" label="Wrapper"><input id="wrapper" style={inputStyle} value={form.wrapper} onChange={e => set('wrapper', e.target.value)} /></Field>
            <Field id="binder" label="Binder"><input id="binder" style={inputStyle} value={form.binder} onChange={e => set('binder', e.target.value)} /></Field>
            <Field id="filler" label="Filler"><input id="filler" style={inputStyle} value={form.filler} onChange={e => set('filler', e.target.value)} /></Field>
            <Field id="strength" label="Strength">
              <select id="strength" style={inputStyle} value={form.strength} onChange={e => set('strength', e.target.value)}>
                <option value="">—</option>
                {['mild', 'mild_medium', 'medium', 'medium_full', 'full'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              {fieldErrors.strength && <span role="alert" style={{ color: DANGER, fontSize: 11 }}>{fieldErrors.strength}</span>}
            </Field>
            <Field id="body" label="Body">
              <select id="body" style={inputStyle} value={form.body} onChange={e => set('body', e.target.value)}>
                <option value="">—</option>
                {['light', 'light_medium', 'medium', 'medium_full', 'full'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
            <Field id="experienceLevel" label="Experience Level">
              <select id="experienceLevel" style={inputStyle} value={form.experienceLevel} onChange={e => set('experienceLevel', e.target.value)}>
                <option value="">—</option>
                {['beginner', 'intermediate', 'experienced'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
            <Field id="smokeTimeMinutes" label="Smoke Time (min)"><input id="smokeTimeMinutes" type="number" style={inputStyle} value={form.smokeTimeMinutes} onChange={e => set('smokeTimeMinutes', e.target.value)} /></Field>
            <Field id="flavorNotes" label="Flavor Notes (comma-separated)"><input id="flavorNotes" style={inputStyle} value={form.flavorNotes} onChange={e => set('flavorNotes', e.target.value)} /></Field>
            <Field id="tags" label="Tags (comma-separated)"><input id="tags" style={inputStyle} value={form.tags} onChange={e => set('tags', e.target.value)} /></Field>
            <Field id="priceCents" label="Stick Price ($) *"><input id="priceCents" type="number" step="0.01" style={inputStyle} value={form.priceCents} onChange={e => set('priceCents', e.target.value)} />{fieldErrors.priceCents && <span role="alert" style={{ color: DANGER, fontSize: 11 }}>{fieldErrors.priceCents}</span>}</Field>
            <Field id="boxPriceCents" label="Box Price ($)"><input id="boxPriceCents" type="number" step="0.01" style={inputStyle} value={form.boxPriceCents} onChange={e => set('boxPriceCents', e.target.value)} /></Field>
            <Field id="boxQuantity" label="Box Quantity"><input id="boxQuantity" type="number" style={inputStyle} value={form.boxQuantity} onChange={e => set('boxQuantity', e.target.value)} /></Field>
            <Field id="costCents" label="Cost ($)"><input id="costCents" type="number" step="0.01" style={inputStyle} value={form.costCents} onChange={e => set('costCents', e.target.value)} /></Field>
            <Field id="reorderThreshold" label="Reorder Point"><input id="reorderThreshold" type="number" style={inputStyle} value={form.reorderThreshold} onChange={e => set('reorderThreshold', e.target.value)} /></Field>
            {!isEdit && <Field id="initialQuantity" label="Initial Quantity"><input id="initialQuantity" type="number" style={inputStyle} value={form.initialQuantity} onChange={e => set('initialQuantity', e.target.value)} /></Field>}
            <Field id="humidorZone" label="Humidor Zone"><input id="humidorZone" style={inputStyle} value={form.humidorZone} onChange={e => set('humidorZone', e.target.value)} /></Field>
            <Field id="storageLocation" label="Storage Location"><input id="storageLocation" style={inputStyle} value={form.storageLocation} onChange={e => set('storageLocation', e.target.value)} /></Field>
            <Field id="supplierName" label="Supplier Name"><input id="supplierName" style={inputStyle} value={form.supplierName} onChange={e => set('supplierName', e.target.value)} /></Field>
            <Field id="supplierSku" label="Supplier SKU"><input id="supplierSku" style={inputStyle} value={form.supplierSku} onChange={e => set('supplierSku', e.target.value)} /></Field>
            <Field id="primaryImageUrl" label="Primary Image URL"><input id="primaryImageUrl" style={inputStyle} value={form.primaryImageUrl} onChange={e => set('primaryImageUrl', e.target.value)} /></Field>
            <Field id="secondaryImageUrl" label="Secondary Image URL"><input id="secondaryImageUrl" style={inputStyle} value={form.secondaryImageUrl} onChange={e => set('secondaryImageUrl', e.target.value)} /></Field>
          </div>

          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <Field id="venueDescription" label="Customer Description"><textarea id="venueDescription" style={{ ...inputStyle, minHeight: 60 }} value={form.venueDescription} onChange={e => set('venueDescription', e.target.value)} /></Field>
            <Field id="staffNotes" label="Staff Notes"><textarea id="staffNotes" style={{ ...inputStyle, minHeight: 60 }} value={form.staffNotes} onChange={e => set('staffNotes', e.target.value)} /></Field>
          </div>

          <button type="button" disabled={saveState === 'saving'} onClick={handleSave}
            style={{ minHeight: 44, padding: '10px 24px', borderRadius: 20, border: `1.5px solid ${OK}`, background: 'transparent', color: OK, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
            {saveState === 'saving' ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Cigar'}
          </button>
          {saveState === 'saved' && <span style={{ marginLeft: 12, color: OK, fontSize: 12 }}>Saved.</span>}
          {saveState === 'failed' && <p role="alert" style={{ color: DANGER, fontSize: 12, marginTop: 8 }}>{saveError}</p>}

          {isEdit && product && (
            <>
              <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, margin: '20px 0' }}>
                <h2 style={{ fontSize: 14, color: GOLD, margin: '0 0 10px' }}>Live Inventory</h2>
                <p style={{ fontSize: 13 }}>Physical: {product.physical_quantity} · Available: {product.availability?.availableQuantity ?? '—'} · Sealed boxes: {product.sealed_box_count} · Opened boxes: {product.opened_box_count}</p>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  <select aria-label="Mutation type" value={mutationType} onChange={e => setMutationType(e.target.value)} style={{ ...inputStyle, flex: '1 1 200px' }}>
                    {MUTATION_TYPES.map(m => <option key={m.value} value={m.value}>{m.label} ({m.sign})</option>)}
                  </select>
                  <input aria-label={mutationType === 'count_correction' ? 'Corrected total quantity' : 'Quantity'} type="number" placeholder={mutationType === 'count_correction' ? 'Corrected total' : 'Quantity'}
                    value={mutationQty} onChange={e => setMutationQty(e.target.value)} style={{ ...inputStyle, flex: '0 1 140px' }} />
                  <input aria-label="Reason" placeholder="Reason (optional)" value={mutationReason} onChange={e => setMutationReason(e.target.value)} style={{ ...inputStyle, flex: '1 1 200px' }} />
                  <button type="button" disabled={mutationState === 'submitting' || !mutationQty} onClick={handleMutate}
                    style={{ minHeight: 44, padding: '8px 16px', borderRadius: 20, border: `1.5px solid ${GOLD}`, background: 'transparent', color: GOLD, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {mutationState === 'submitting' ? 'Applying…' : 'Apply'}
                  </button>
                </div>
                {mutationState === 'applied' && <p style={{ color: OK, fontSize: 12, marginTop: 8 }}>Applied. Physical quantity now {product.physical_quantity}.</p>}
                {mutationState === 'failed' && <p role="alert" style={{ color: DANGER, fontSize: 12, marginTop: 8 }}>{mutationError === 'insufficient_inventory' ? 'That would take inventory below zero — rejected.' : mutationError}</p>}
              </div>

              <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <h2 style={{ width: '100%', fontSize: 14, color: GOLD, margin: '0 0 6px' }}>Status &amp; Classification</h2>
                <button type="button" onClick={() => handleClassification({ isArchived: !product.is_archived })} style={{ minHeight: 40, padding: '6px 14px', borderRadius: 16, border: `1px solid ${BORDER}`, background: 'transparent', color: CREAM, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>{product.is_archived ? 'Restore' : 'Archive'}</button>
                <button type="button" onClick={() => handleClassification({ status: product.status === 'active' ? 'discontinued' : 'active' })} style={{ minHeight: 40, padding: '6px 14px', borderRadius: 16, border: `1px solid ${BORDER}`, background: 'transparent', color: CREAM, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>{product.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                <button type="button" onClick={() => handleClassification({ isCustomerVisible: !product.is_customer_visible })} style={{ minHeight: 40, padding: '6px 14px', borderRadius: 16, border: `1px solid ${BORDER}`, background: 'transparent', color: CREAM, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>{product.is_customer_visible ? 'Hide from Customers' : 'Make Visible'}</button>
                <button type="button" onClick={() => handleClassification({ isFeatured: !product.is_featured })} style={{ minHeight: 40, padding: '6px 14px', borderRadius: 16, border: `1px solid ${BORDER}`, background: 'transparent', color: CREAM, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>{product.is_featured ? 'Remove Featured' : 'Mark Featured'}</button>
                <button type="button" onClick={() => handleClassification({ isStaffPick: !product.is_staff_pick })} style={{ minHeight: 40, padding: '6px 14px', borderRadius: 16, border: `1px solid ${BORDER}`, background: 'transparent', color: CREAM, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>{product.is_staff_pick ? 'Remove Staff Pick' : 'Mark Staff Pick'}</button>
                <button type="button" onClick={() => handleClassification({ isLimitedRelease: !product.is_limited_release })} style={{ minHeight: 40, padding: '6px 14px', borderRadius: 16, border: `1px solid ${BORDER}`, background: 'transparent', color: CREAM, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>{product.is_limited_release ? 'Remove Limited Release' : 'Mark Limited Release'}</button>
                <button type="button" onClick={() => handleClassification({ isVenueExclusive: !product.is_venue_exclusive })} style={{ minHeight: 40, padding: '6px 14px', borderRadius: 16, border: `1px solid ${BORDER}`, background: 'transparent', color: CREAM, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>{product.is_venue_exclusive ? 'Remove Venue Exclusive' : 'Mark Venue Exclusive'}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </SmokeCraftScreenShell>
  )
}
