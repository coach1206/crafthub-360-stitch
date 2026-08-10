import { useState } from 'react'
import {
  createTicketTapperSpecial,
  updateTicketTapperSpecial,
  endTicketTapperSpecial,
  updateTicketTapperInventory,
  submitSpecialForApproval,
  approveTicketTapperSpecial,
  rejectTicketTapperSpecial,
  publishTicketTapperSpecial,
} from '../../services/smokeCraftTicketTapperSpecialsApi.js'
import { canApproveSpecial, canPublishSpecial, getInitialSpecialStatusForRole, SPECIAL_SUGGESTION_ROLES } from '../../utils/smokeCraftSpecialsEngine.js'

const gold = '#E9C176'
const dark = '#0a0603'
const panel = 'rgba(14,8,4,0.94)'
const border = 'rgba(233,193,118,0.18)'

const ROLES = ['manager', 'bartender', 'cook', 'server', 'owner', 'admin']
const ROLE_LABELS = {
  manager: 'Manager Pick',
  bartender: 'Bartender Pick',
  cook: 'Cook Special',
  server: 'Server Favorite',
  owner: "Owner's Choice",
  admin: 'House Feature',
}
const SPECIAL_TYPES = ['drink_special', 'partner_food_special', 'partner_food_pairing', 'cigar_special', 'vip_pairing', 'happy_hour', 'clearance_special', 'manager_promotion']
const BADGE_LABELS = ['Tonight Only', 'Bartender Pick', 'Cook Special', 'Manager Pick', 'Limited', 'Happy Hour', 'Last Call', 'VIP Only', "Chef's Special", 'House Feature']

const STATUS_COLORS = { active: '#7ddca0', paused: '#ffa94d', ended: '#888', draft: '#aaa' }

function StaffPill({ label }) {
  return (
    <div style={{ fontSize: 10, color: gold, background: 'rgba(233,193,118,0.08)', border: `1px solid rgba(233,193,118,0.2)`, borderRadius: 4, padding: '2px 8px', fontWeight: 700, display: 'inline-block' }}>
      {label}
    </div>
  )
}

function SpecialRow({ special, onAction, venueId, staff }) {
  const status = special.status || 'active'
  const qty = special.inventory?.quantityAvailable ?? '—'
  const isManager = canApproveSpecial(staff?.role)
  const isSuggester = SPECIAL_SUGGESTION_ROLES.includes(staff?.role)
  const approvalStatus = special.approval?.status
  const submittedByMe = special.approval?.submittedBy?.staffId === staff?.staffId

  async function handleAction(action) {
    if (action === 'end') {
      await endTicketTapperSpecial(special.id, { venueId, staff })
    } else if (action === 'approve') {
      await approveTicketTapperSpecial(special.id, { venueId, reviewedBy: staff, approval: { approvalNote: 'Approved for Ticket Tapper.' } })
    } else if (action === 'reject') {
      const reason = window.prompt('Rejection reason (optional):') || 'Rejected by management.'
      await rejectTicketTapperSpecial(special.id, { venueId, reviewedBy: staff, approval: { rejectionReason: reason } })
    } else if (action === 'publish') {
      await publishTicketTapperSpecial(special.id, { venueId, publishedBy: staff })
    } else if (action === 'submit_approval') {
      await submitSpecialForApproval(special.id, { venueId, submittedBy: staff, special })
    } else {
      await updateTicketTapperSpecial(special.id, { venueId, staff, status: action === 'pause' ? 'paused' : 'active', action })
    }
    onAction(action, special.id)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: `1px solid rgba(255,255,255,0.05)`, flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 120 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#E5E2E1' }}>{special.title}</div>
        <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
          {ROLE_LABELS[special.promotedByRole] || special.promotedByRole} · Qty: {qty}
          {special.approval?.submittedBy?.name && ` · by ${special.approval.submittedBy.name}`}
        </div>
        {approvalStatus === 'pending_approval' && (
          <div style={{ fontSize: 10, color: '#ffa94d', marginTop: 2 }}>⏳ Awaiting management approval</div>
        )}
        {approvalStatus === 'rejected' && (
          <div style={{ fontSize: 10, color: '#ff8080', marginTop: 2 }}>✗ Rejected{special.approval?.rejectionReason ? `: ${special.approval.rejectionReason}` : ''}</div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ fontSize: 10, color: STATUS_COLORS[status] || '#aaa', fontWeight: 700, border: `1px solid ${STATUS_COLORS[status] || '#aaa'}`, borderRadius: 4, padding: '2px 7px' }}>
          {status.replace(/_/g, ' ').toUpperCase()}
        </div>

        {/* Suggester: can submit pending drafts */}
        {isSuggester && !isManager && status === 'draft' && (
          <button type="button" onClick={() => handleAction('submit_approval')}
            style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'rgba(233,193,118,0.1)', color: gold, border: `1px solid rgba(233,193,118,0.3)`, cursor: 'pointer', fontWeight: 700 }}>
            Submit for Approval
          </button>
        )}

        {/* Manager actions */}
        {isManager && status === 'pending_approval' && (
          <>
            <button type="button" onClick={() => handleAction('approve')}
              style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'rgba(125,220,160,0.1)', color: '#7ddca0', border: '1px solid rgba(125,220,160,0.3)', cursor: 'pointer', fontWeight: 700 }}>
              Approve
            </button>
            <button type="button" onClick={() => handleAction('reject')}
              style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'rgba(255,107,107,0.08)', color: '#ff8080', border: '1px solid rgba(255,107,107,0.25)', cursor: 'pointer', fontWeight: 700 }}>
              Reject
            </button>
          </>
        )}
        {isManager && status === 'approved' && (
          <button type="button" onClick={() => handleAction('publish')}
            style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: gold, color: dark, border: 'none', cursor: 'pointer', fontWeight: 700 }}>
            Publish Live ⚡
          </button>
        )}
        {isManager && status === 'active' && (
          <button type="button" onClick={() => handleAction('pause')}
            style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'rgba(255,169,77,0.1)', color: '#ffa94d', border: '1px solid rgba(255,169,77,0.3)', cursor: 'pointer', fontWeight: 700 }}>
            Pause
          </button>
        )}
        {isManager && status === 'paused' && (
          <button type="button" onClick={() => handleAction('publish')}
            style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'rgba(125,220,160,0.1)', color: '#7ddca0', border: '1px solid rgba(125,220,160,0.3)', cursor: 'pointer', fontWeight: 700 }}>
            Re-publish
          </button>
        )}
        {isManager && status !== 'ended' && (
          <button type="button" onClick={() => handleAction('end')}
            style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'rgba(255,107,107,0.08)', color: '#ff8080', border: '1px solid rgba(255,107,107,0.25)', cursor: 'pointer', fontWeight: 700 }}>
            End
          </button>
        )}
      </div>
    </div>
  )
}

const BLANK_FORM = {
  title: '', subtitle: '', description: '', specialType: 'drink_special',
  source: 'venue', promotedByRole: 'manager', priority: 1,
  badgeLabel: 'Tonight Only', quantityAvailable: 20, lowInventoryThreshold: 3,
  regularPrice: 0, specialPrice: 0,
  partnerItemName: '', partnerItemId: '', partnerId: '', partnerUnitPrice: 0, commissionEligible: false,
}

export default function StaffSpecialsControlPanel({ specials = [], venueId, staff, onSpecialCreated, onSpecialUpdated, localPreview }) {
  const [activeTab, setActiveTab] = useState('active')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(BLANK_FORM)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(null)

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  const activeSpecials = specials.filter(s => s.status === 'active')
  const pausedSpecials = specials.filter(s => s.status === 'paused')
  const endedSpecials = specials.filter(s => s.status === 'ended')

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    const isPartner = form.source === 'partner_network'
    const items = isPartner
      ? [{ id: form.partnerItemId || `item-${Date.now()}`, type: 'partner_food', name: form.partnerItemName, partnerId: form.partnerId, source: 'partner_network', quantity: 1, unitPrice: parseFloat(form.partnerUnitPrice) || parseFloat(form.specialPrice), commissionEligible: form.commissionEligible }]
      : [{ id: `item-${Date.now()}`, type: form.specialType.includes('drink') ? 'drink' : 'cigar', name: form.title, partnerId: null, source: 'venue', quantity: 1, unitPrice: parseFloat(form.specialPrice), commissionEligible: false }]

    const discountAmount = Math.max(0, parseFloat(form.regularPrice) - parseFloat(form.specialPrice))
    const discountPercent = form.regularPrice > 0 ? roundTo2(discountAmount / form.regularPrice * 100) : 0

    const payload = {
      venueId,
      staff,
      special: {
        title: form.title,
        subtitle: form.subtitle,
        description: form.description,
        specialType: form.specialType,
        source: form.source,
        promotedByRole: form.promotedByRole,
        status: getInitialSpecialStatusForRole(staff?.role),
        priority: parseInt(form.priority) || 1,
        startsAt: new Date().toISOString(),
        endsAt: null,
        inventory: { quantityAvailable: parseInt(form.quantityAvailable) || 0, quantitySold: 0, lowInventoryThreshold: parseInt(form.lowInventoryThreshold) || 3, inventoryStatus: 'available', allowOversell: false },
        pricing: { regularPrice: parseFloat(form.regularPrice) || 0, specialPrice: parseFloat(form.specialPrice) || 0, discountAmount, discountPercent },
        items,
        media: { imageUrl: '', badgeLabel: form.badgeLabel },
        moneyBridge: isPartner
          ? { active: true, partnerIds: [form.partnerId].filter(Boolean), smokeCraftCommissionPercent: 10, venueReferralPercent: 5, settlementStatus: 'pending_preview' }
          : { active: false, partnerIds: [], smokeCraftCommissionPercent: 0, venueReferralPercent: 0, settlementStatus: 'not_partner_related' },
        callToAction: { label: form.specialType.includes('drink') ? 'Add Drink' : form.specialType.includes('food') ? 'Add Food' : 'Add Special', action: 'one_tap_add' },
      },
      createdAt: new Date().toISOString(),
    }

    const result = await createTicketTapperSpecial(payload)
    setSaving(false)
    if (result.ok) {
      setSaved('Special created!')
      setTimeout(() => setSaved(null), 2500)
      setShowCreate(false)
      setForm(BLANK_FORM)
      onSpecialCreated && onSpecialCreated(result)
    }
  }

  function handleAction(action, specialId) {
    onSpecialUpdated && onSpecialUpdated(action, specialId)
  }

  function roundTo2(n) { return Math.round(n * 100) / 100 }

  const tabSpecials = activeTab === 'active' ? activeSpecials : activeTab === 'paused' ? pausedSpecials : endedSpecials

  return (
    <div style={{ background: 'rgba(10,6,3,0.98)', border: `1.5px solid ${border}`, borderRadius: 14, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: gold, fontWeight: 900, fontSize: 14, letterSpacing: '0.06em' }}>STAFF SPECIALS CONTROL</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            <StaffPill label={`${staff?.role || 'staff'} · ${staff?.name || 'Staff'}`} />
            {localPreview && <StaffPill label="LOCAL PREVIEW MODE" />}
          </div>
        </div>
        <button type="button" onClick={() => setShowCreate(p => !p)}
          style={{ background: gold, color: dark, fontWeight: 800, fontSize: 12, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
          {showCreate ? '✕ Cancel' : '+ Create Special'}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} style={{ padding: '16px 18px', borderBottom: `1px solid ${border}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ color: gold, fontWeight: 800, fontSize: 12, marginBottom: 4 }}>New Special</div>
          {[
            ['Title', 'title', 'text', true],
            ['Subtitle', 'subtitle', 'text', false],
            ['Description', 'description', 'text', false],
          ].map(([label, key, type, req]) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <label style={{ fontSize: 10, color: '#aaa', fontWeight: 700 }}>{label}{req ? ' *' : ''}</label>
              <input type={type} required={req} value={form[key]} onChange={e => set(key, e.target.value)}
                style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${border}`, borderRadius: 6, padding: '7px 10px', color: '#E5E2E1', fontSize: 13, outline: 'none' }} />
            </div>
          ))}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <label style={{ fontSize: 10, color: '#aaa', fontWeight: 700 }}>Promoted By Role</label>
              <select value={form.promotedByRole} onChange={e => set('promotedByRole', e.target.value)}
                style={{ background: '#100700', border: `1px solid ${border}`, borderRadius: 6, padding: '7px 10px', color: '#E5E2E1', fontSize: 12 }}>
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <label style={{ fontSize: 10, color: '#aaa', fontWeight: 700 }}>Special Type</label>
              <select value={form.specialType} onChange={e => set('specialType', e.target.value)}
                style={{ background: '#100700', border: `1px solid ${border}`, borderRadius: 6, padding: '7px 10px', color: '#E5E2E1', fontSize: 12 }}>
                {SPECIAL_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <label style={{ fontSize: 10, color: '#aaa', fontWeight: 700 }}>Source</label>
              <select value={form.source} onChange={e => set('source', e.target.value)}
                style={{ background: '#100700', border: `1px solid ${border}`, borderRadius: 6, padding: '7px 10px', color: '#E5E2E1', fontSize: 12 }}>
                <option value="venue">Venue</option>
                <option value="partner_network">Partner Network</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <label style={{ fontSize: 10, color: '#aaa', fontWeight: 700 }}>Badge Label</label>
              <select value={form.badgeLabel} onChange={e => set('badgeLabel', e.target.value)}
                style={{ background: '#100700', border: `1px solid ${border}`, borderRadius: 6, padding: '7px 10px', color: '#E5E2E1', fontSize: 12 }}>
                {BADGE_LABELS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <label style={{ fontSize: 10, color: '#aaa', fontWeight: 700 }}>Regular Price ($)</label>
              <input type="number" min="0" step="0.01" value={form.regularPrice} onChange={e => set('regularPrice', e.target.value)}
                style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${border}`, borderRadius: 6, padding: '7px 10px', color: '#E5E2E1', fontSize: 13 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <label style={{ fontSize: 10, color: '#aaa', fontWeight: 700 }}>Special Price ($)</label>
              <input type="number" min="0" step="0.01" value={form.specialPrice} onChange={e => set('specialPrice', e.target.value)}
                style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${border}`, borderRadius: 6, padding: '7px 10px', color: '#E5E2E1', fontSize: 13 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <label style={{ fontSize: 10, color: '#aaa', fontWeight: 700 }}>Qty Available</label>
              <input type="number" min="0" value={form.quantityAvailable} onChange={e => set('quantityAvailable', e.target.value)}
                style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${border}`, borderRadius: 6, padding: '7px 10px', color: '#E5E2E1', fontSize: 13 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <label style={{ fontSize: 10, color: '#aaa', fontWeight: 700 }}>Low Stock Threshold</label>
              <input type="number" min="0" value={form.lowInventoryThreshold} onChange={e => set('lowInventoryThreshold', e.target.value)}
                style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${border}`, borderRadius: 6, padding: '7px 10px', color: '#E5E2E1', fontSize: 13 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <label style={{ fontSize: 10, color: '#aaa', fontWeight: 700 }}>Priority (1=top)</label>
              <input type="number" min="1" value={form.priority} onChange={e => set('priority', e.target.value)}
                style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${border}`, borderRadius: 6, padding: '7px 10px', color: '#E5E2E1', fontSize: 13 }} />
            </div>
          </div>

          {/* Partner fields */}
          {form.source === 'partner_network' && (
            <div style={{ background: 'rgba(233,193,118,0.04)', border: `1px solid rgba(233,193,118,0.15)`, borderRadius: 8, padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ color: gold, fontSize: 10, fontWeight: 800, gridColumn: '1/-1' }}>⟁ Partner Network Item</div>
              {[
                ['Item Name', 'partnerItemName'],
                ['Item ID', 'partnerItemId'],
                ['Partner ID', 'partnerId'],
                ['Unit Price ($)', 'partnerUnitPrice'],
              ].map(([label, key]) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <label style={{ fontSize: 10, color: '#aaa', fontWeight: 700 }}>{label}</label>
                  <input type={key === 'partnerUnitPrice' ? 'number' : 'text'} value={form[key]} onChange={e => set(key, e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${border}`, borderRadius: 6, padding: '7px 10px', color: '#E5E2E1', fontSize: 13 }} />
                </div>
              ))}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#ccc', cursor: 'pointer', gridColumn: '1/-1' }}>
                <input type="checkbox" checked={form.commissionEligible} onChange={e => set('commissionEligible', e.target.checked)} />
                Commission Eligible (10% SmokeCraft, 5% Venue)
              </label>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="submit" disabled={saving}
              style={{ flex: 1, padding: '10px 0', borderRadius: 8, background: gold, color: dark, fontWeight: 800, fontSize: 13, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Creating…' : 'Create & Activate Special'}
            </button>
          </div>
          {saved && <div style={{ color: '#7ddca0', fontSize: 12, fontWeight: 700, textAlign: 'center' }}>{saved}</div>}
        </form>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${border}` }}>
        {[['active', `Active (${activeSpecials.length})`], ['paused', `Paused (${pausedSpecials.length})`], ['ended', `Ended (${endedSpecials.length})`]].map(([key, label]) => (
          <button key={key} type="button" onClick={() => setActiveTab(key)}
            style={{ flex: 1, padding: '10px 0', background: activeTab === key ? 'rgba(233,193,118,0.07)' : 'none', color: activeTab === key ? gold : '#888', border: 'none', borderBottom: activeTab === key ? `2px solid ${gold}` : '2px solid transparent', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
            {label}
          </button>
        ))}
      </div>

      {/* Specials list */}
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {tabSpecials.length === 0 && (
          <div style={{ color: '#666', fontSize: 12, padding: '20px', textAlign: 'center' }}>No {activeTab} specials</div>
        )}
        {tabSpecials.map(special => (
          <SpecialRow key={special.id} special={special} onAction={handleAction} venueId={venueId} staff={staff} />
        ))}
      </div>

      {localPreview && (
        <div style={{ padding: '8px 14px', borderTop: `1px solid ${border}`, fontSize: 10, color: '#666', textAlign: 'center' }}>
          Local Preview Mode — specials changes not persisted to backend
        </div>
      )}
    </div>
  )
}
