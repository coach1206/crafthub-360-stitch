import { useState, useEffect, useCallback, useRef } from 'react'
import * as api from '../../services/venueManagement/venueManagementApiClient.js'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CHARCOAL = '#151a24'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'
const DANGER = 'rgba(255,150,150,0.9)'

const NAV_SECTIONS = [
  { key: 'profile', label: 'Venue Profile', available: true },
  { key: 'media', label: 'Branding & Media', available: true },
  { key: 'products', label: 'Products & Cigars', available: false },
  { key: 'menus', label: 'Menus & Pairings', available: false },
  { key: 'events', label: 'Events & Challenges', available: false },
  { key: 'staff', label: 'Staff & Permissions', available: false },
  { key: 'audit', label: 'Audit History', available: false },
]

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${BORDER}`,
  background: 'rgba(255,255,255,0.06)', color: CREAM, fontFamily: 'inherit', fontSize: 14, minHeight: 44, boxSizing: 'border-box',
}
const labelStyle = { display: 'block', fontSize: 12, color: 'rgba(229,226,225,0.65)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.03em' }
const buttonStyle = (active = true) => ({
  padding: '10px 18px', borderRadius: 20, border: `1.5px solid ${GOLD}`, background: active ? 'transparent' : 'rgba(255,255,255,0.03)',
  color: active ? GOLD : 'rgba(233,193,118,0.4)', cursor: active ? 'pointer' : 'not-allowed', fontFamily: 'inherit', minHeight: 44, fontSize: 14,
})
const cardStyle = { background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }

function StatusBadge({ status }) {
  const colors = {
    DRAFT: '#9aa0ab', PENDING_APPROVAL: '#e9c176', APPROVED: '#7fd0a3', PUBLISHED: '#7fd0a3',
    UNPUBLISHED: '#9aa0ab', REJECTED: DANGER, ARCHIVED: '#666',
  }
  return (
    <span style={{ padding: '4px 12px', borderRadius: 14, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', border: `1px solid ${colors[status] || '#666'}`, color: colors[status] || CREAM }}>
      {status || 'NO PROFILE'}
    </span>
  )
}

function VenueProfilePanel({ venueId }) {
  const [state, setState] = useState('loading') // loading|ready|permission-denied|venue-error|error
  const [profile, setProfile] = useState(null)
  const [storageStatus, setStorageStatus] = useState(null)
  const [form, setForm] = useState({})
  const [dirty, setDirty] = useState(false)
  const [saveState, setSaveState] = useState('idle') // idle|saving|saved|failed|stale
  const [validationError, setValidationError] = useState(null)
  const [versions, setVersions] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  const load = useCallback(async () => {
    setState('loading')
    const result = await api.getProfile(venueId)
    if (!result.ok) {
      if (result.status === 401 || result.status === 403) setState('permission-denied')
      else if (result.error === 'venue_not_found' || result.error === 'venue_inactive') setState('venue-error')
      else setState('error')
      return
    }
    setProfile(result.profile)
    setStorageStatus(result.storage)
    setForm(result.profile || {})
    setDirty(false)
    setState('ready')
  }, [venueId])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    setSaveState('saving')
    const result = await api.createProfile(venueId)
    if (!result.ok) { setSaveState('failed'); return }
    setProfile(result.profile); setForm(result.profile); setSaveState('idle')
  }

  const handleSave = async () => {
    if (!profile) return
    setSaveState('saving')
    setValidationError(null)
    if (form.display_name !== undefined && !String(form.display_name || '').trim()) {
      setValidationError('Display name cannot be empty.')
      setSaveState('idle')
      return
    }
    const { id, venue_id, version, status, created_at, updated_at, created_by, updated_by, approved_by, approved_at, published_by, published_at, is_current, rejection_reason, ...editable } = form
    const result = await api.updateProfile(venueId, profile.version, editable)
    if (!result.ok) {
      setSaveState(result.error === 'stale_version' ? 'stale' : 'failed')
      return
    }
    setProfile(result.profile); setForm(result.profile); setDirty(false); setSaveState('saved')
    setTimeout(() => setSaveState('idle'), 2000)
  }

  const runAction = async (fn) => {
    setSaveState('saving')
    const result = await fn(venueId)
    if (!result.ok) { setSaveState('failed'); return }
    setProfile(result.profile); setForm(result.profile); setSaveState('saved')
    setTimeout(() => setSaveState('idle'), 2000)
  }

  const loadHistory = async () => {
    const result = await api.getVersionHistory(venueId)
    if (result.ok) { setVersions(result.versions); setShowHistory(true) }
  }

  const restoreVersion = async (v) => {
    setSaveState('saving')
    const result = await api.restoreVersion(venueId, v)
    if (!result.ok) { setSaveState('failed'); return }
    setProfile(result.profile); setForm(result.profile); setSaveState('saved')
    setTimeout(() => setSaveState('idle'), 2000)
  }

  if (state === 'loading') return <p>Loading venue profile…</p>
  if (state === 'permission-denied') return <p style={{ color: DANGER }}>Permission denied — an active venue membership (manager/admin/owner) is required.</p>
  if (state === 'venue-error') return <p style={{ color: DANGER }}>Venue not found or inactive.</p>
  if (state === 'error') return <p style={{ color: DANGER }}>Unable to load profile. <button type="button" onClick={load} style={buttonStyle()}>Retry</button></p>

  const editable = profile && ['DRAFT', 'REJECTED'].includes(profile.status)

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {!profile && (
        <div style={cardStyle}>
          <p>No profile exists yet for this venue.</p>
          <button type="button" onClick={handleCreate} style={buttonStyle()}>Create Profile</button>
        </div>
      )}

      {profile && (
        <>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <StatusBadge status={profile.status} />
            <span style={{ fontSize: 12, color: 'rgba(229,226,225,0.5)' }}>version {profile.version}</span>
            {storageStatus && (
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 10, border: `1px solid ${storageStatus.provider === 'CONNECTED' ? '#7fd0a3' : DANGER}`, color: storageStatus.provider === 'CONNECTED' ? '#7fd0a3' : DANGER }}>
                Storage: {storageStatus.provider}
              </span>
            )}
          </div>

          <div role="status" aria-live="polite" aria-atomic="true">
            {saveState === 'saving' && <span style={{ color: GOLD }}>Saving…</span>}
            {saveState === 'saved' && <span style={{ color: '#7fd0a3' }}>✓ Saved</span>}
            {saveState === 'failed' && <span style={{ color: DANGER }}>Save failed. <button type="button" onClick={handleSave} style={buttonStyle()}>Retry</button></span>}
            {saveState === 'stale' && <span style={{ color: DANGER }}>Someone else changed this profile since you loaded it. <button type="button" onClick={load} style={buttonStyle()}>Reload latest</button></span>}
          </div>
          {validationError && <div style={{ color: DANGER }}>{validationError}</div>}

          <div style={{ ...cardStyle, display: 'grid', gap: 14 }}>
            <div>
              <label style={labelStyle} htmlFor="vm-display-name">Display Name</label>
              <input id="vm-display-name" style={inputStyle} disabled={!editable} value={form.display_name || ''} onChange={e => { setForm({ ...form, display_name: e.target.value }); setDirty(true) }} />
            </div>
            <div>
              <label style={labelStyle} htmlFor="vm-description">Description</label>
              <textarea id="vm-description" rows={4} style={{ ...inputStyle, minHeight: 90 }} disabled={!editable} value={form.description || ''} onChange={e => { setForm({ ...form, description: e.target.value }); setDirty(true) }} />
            </div>
            <div>
              <label style={labelStyle} htmlFor="vm-hours">Operating Hours (JSON)</label>
              <textarea id="vm-hours" rows={3} style={{ ...inputStyle, minHeight: 70, fontFamily: 'monospace' }} disabled={!editable}
                value={JSON.stringify(form.operating_hours || {})}
                onChange={e => { try { setForm({ ...form, operating_hours: JSON.parse(e.target.value) }); setDirty(true) } catch { /* ignore until valid */ } }} />
            </div>
            <div>
              <label style={labelStyle} htmlFor="vm-amenities">Amenities (comma-separated)</label>
              <input id="vm-amenities" style={inputStyle} disabled={!editable}
                value={Array.isArray(form.amenities) ? form.amenities.join(', ') : ''}
                onChange={e => { setForm({ ...form, amenities: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }); setDirty(true) }} />
            </div>
            <div>
              <label style={labelStyle} htmlFor="vm-access">Accessibility Info</label>
              <input id="vm-access" style={inputStyle} disabled={!editable}
                value={form.accessibility_info?.notes || ''}
                onChange={e => { setForm({ ...form, accessibility_info: { ...form.accessibility_info, notes: e.target.value } }); setDirty(true) }} />
            </div>
            <div>
              <label style={labelStyle} htmlFor="vm-social">Social Links (comma-separated URLs)</label>
              <input id="vm-social" style={inputStyle} disabled={!editable}
                value={Object.values(form.social_links || {}).join(', ')}
                onChange={e => {
                  const urls = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  setForm({ ...form, social_links: Object.fromEntries(urls.map((u, i) => [`link_${i}`, u])) }); setDirty(true)
                }} />
            </div>

            {editable && (
              <button type="button" onClick={handleSave} disabled={!dirty} style={buttonStyle(dirty)}>Save Draft</button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {profile.status === 'DRAFT' && <button type="button" onClick={() => runAction(api.submitForApproval)} style={buttonStyle()}>Submit for Approval</button>}
            {profile.status === 'REJECTED' && <button type="button" onClick={() => runAction(api.submitForApproval)} style={buttonStyle()}>Resubmit for Approval</button>}
            {profile.status === 'PENDING_APPROVAL' && <>
              <button type="button" onClick={() => runAction(api.approveProfile)} style={buttonStyle()}>Approve</button>
              <button type="button" onClick={() => runAction((id) => api.rejectProfile(id, 'Needs revision'))} style={buttonStyle()}>Reject</button>
            </>}
            {profile.status === 'APPROVED' && <button type="button" onClick={() => runAction(api.publishProfile)} style={buttonStyle()}>Publish</button>}
            {profile.status === 'PUBLISHED' && <button type="button" onClick={() => runAction(api.unpublishProfile)} style={buttonStyle()}>Unpublish</button>}
            <button type="button" onClick={loadHistory} style={buttonStyle()}>Version History</button>
          </div>

          {profile.rejection_reason && profile.status === 'REJECTED' && (
            <div style={{ color: DANGER }}>Rejected: {profile.rejection_reason}</div>
          )}

          {showHistory && (
            <div style={cardStyle}>
              <h3 style={{ color: GOLD, margin: '0 0 10px', fontSize: 15 }}>Version History</h3>
              {versions.length === 0 && <p>No versions recorded yet.</p>}
              {versions.map(v => (
                <div key={v.version_number} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${BORDER}` }}>
                  <span>v{v.version_number} — {v.status} — {v.created_by} — {new Date(v.created_at).toLocaleString()}</span>
                  {editable && <button type="button" onClick={() => restoreVersion(v.version_number)} style={buttonStyle()}>Restore</button>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function MediaLibraryPanel({ venueId }) {
  const [state, setState] = useState('loading')
  const [media, setMedia] = useState([])
  const [uploadState, setUploadState] = useState('idle') // idle|uploading|processing|saved|failed
  const [uploadError, setUploadError] = useState(null)
  const fileInputRef = useRef(null)

  const load = useCallback(async () => {
    setState('loading')
    const result = await api.listMedia(venueId)
    if (!result.ok) { setState(result.status === 401 || result.status === 403 ? 'permission-denied' : 'error'); return }
    setMedia(result.media)
    setState('ready')
  }, [venueId])

  useEffect(() => { load() }, [load])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadState('uploading')
    setUploadError(null)
    const base64Data = await api.fileToBase64(file)
    setUploadState('processing')
    const result = await api.uploadMedia(venueId, { filename: file.name, mediaType: 'image', altText: '', base64Data })
    if (!result.ok) {
      setUploadState('failed')
      setUploadError(result.error)
      return
    }
    setUploadState('saved')
    setTimeout(() => setUploadState('idle'), 2000)
    load()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleAltText = async (mediaId, altText) => {
    await api.updateMediaMetadata(venueId, mediaId, altText)
    load()
  }

  const handleArchive = async (mediaId) => {
    const result = await api.archiveMedia(venueId, mediaId)
    if (!result.ok && result.error === 'media_in_use') {
      alert('This image is currently assigned as branding or in the gallery — remove the assignment before archiving.')
      return
    }
    load()
  }

  const handleAssign = async (mediaId, slot) => {
    await api.assignBranding(venueId, slot, mediaId)
    load()
  }

  if (state === 'loading') return <p>Loading media library…</p>
  if (state === 'permission-denied') return <p style={{ color: DANGER }}>Permission denied.</p>
  if (state === 'error') return <p style={{ color: DANGER }}>Unable to load media. <button type="button" onClick={load} style={buttonStyle()}>Retry</button></p>

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={cardStyle}>
        <label style={labelStyle} htmlFor="vm-media-upload">Upload Image (PNG/JPEG/WebP, max 5MB)</label>
        <input id="vm-media-upload" ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleUpload} style={{ color: CREAM }} />
        <div role="status" aria-live="polite" aria-atomic="true" style={{ marginTop: 8 }}>
          {uploadState === 'uploading' && <span style={{ color: GOLD }}>Uploading…</span>}
          {uploadState === 'processing' && <span style={{ color: GOLD }}>Validating image…</span>}
          {uploadState === 'saved' && <span style={{ color: '#7fd0a3' }}>✓ Uploaded</span>}
          {uploadState === 'failed' && <span style={{ color: DANGER }}>Upload failed: {uploadError}</span>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
        {media.length === 0 && <p>No media uploaded yet.</p>}
        {media.map(m => (
          <div key={m.id} style={{ ...cardStyle, padding: 10 }}>
            <img src={m.url} alt={m.alt_text || ''} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, background: CHARCOAL }} />
            <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.6)', margin: '8px 0' }}>{m.width}×{m.height} · {(m.size_bytes / 1024).toFixed(0)}KB {m.in_use && <span style={{ color: GOLD }}> · in use</span>}</div>
            <input
              aria-label={`Alt text for image ${m.id}`}
              placeholder="Alt text"
              defaultValue={m.alt_text || ''}
              onBlur={e => handleAltText(m.id, e.target.value)}
              style={{ ...inputStyle, minHeight: 36, fontSize: 12, marginBottom: 8 }}
            />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => handleAssign(m.id, 'logo')} style={{ ...buttonStyle(), padding: '6px 10px', fontSize: 11, minHeight: 32 }}>Set as Logo</button>
              <button type="button" onClick={() => handleAssign(m.id, 'hero')} style={{ ...buttonStyle(), padding: '6px 10px', fontSize: 11, minHeight: 32 }}>Set as Hero</button>
              <button type="button" onClick={() => handleAssign(m.id, 'gallery')} style={{ ...buttonStyle(), padding: '6px 10px', fontSize: 11, minHeight: 32 }}>Add to Gallery</button>
              <button type="button" onClick={() => handleArchive(m.id)} style={{ ...buttonStyle(), padding: '6px 10px', fontSize: 11, minHeight: 32 }}>Archive</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function VenueManagementCommandHub() {
  const [venueId, setVenueId] = useState('')
  const [loadedVenueId, setLoadedVenueId] = useState('')
  const [section, setSection] = useState('profile')

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'auto', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM }}>
      <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 1100, margin: '0 auto' }}>
        <h1 style={{ color: GOLD, fontSize: 'clamp(18px,2.4vw,26px)', margin: '0 0 4px' }}>Venue Management Command Hub</h1>
        <p style={{ fontSize: 13, color: 'rgba(229,226,225,0.55)', margin: '0 0 20px' }}>Venue profile, branding, and media — venue-scoped, permission-enforced.</p>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <input aria-label="Venue ID" placeholder="Venue ID" value={venueId} onChange={e => setVenueId(e.target.value)} style={{ ...inputStyle, width: 260 }} />
          <button type="button" onClick={() => setLoadedVenueId(venueId)} disabled={!venueId} style={buttonStyle(!!venueId)}>Load Venue</button>
        </div>

        {loadedVenueId && (
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <nav aria-label="Command Hub sections" style={{ minWidth: 200, display: 'grid', gap: 6 }}>
              {NAV_SECTIONS.map(s => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => s.available && setSection(s.key)}
                  aria-current={section === s.key}
                  disabled={!s.available}
                  style={{
                    textAlign: 'left', padding: '10px 14px', borderRadius: 8, minHeight: 44,
                    border: `1px solid ${section === s.key ? GOLD : 'transparent'}`,
                    background: section === s.key ? 'rgba(233,193,118,0.08)' : 'transparent',
                    color: s.available ? CREAM : 'rgba(229,226,225,0.35)',
                    cursor: s.available ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: 14,
                  }}
                >
                  {s.label}{!s.available && ' (coming soon)'}
                </button>
              ))}
            </nav>

            <div style={{ flex: 1, minWidth: 320 }}>
              {section === 'profile' && <VenueProfilePanel venueId={loadedVenueId} />}
              {section === 'media' && <MediaLibraryPanel venueId={loadedVenueId} />}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
