import { useMemo, useState } from 'react'
import { ManagementLayout, Card, Pill, useToast, GOLD } from '../components/eat/ui.jsx'
import MediaAssetCard from '../components/eat/MediaAssetCard.jsx'
import MediaFilterBar from '../components/eat/MediaFilterBar.jsx'
import MediaUploadDialog from '../components/eat/MediaUploadDialog.jsx'
import MediaAssignDialog from '../components/eat/MediaAssignDialog.jsx'
import { getAssets, createAsset, getAssignments, createAssignment, getAsset } from '../services/eat/eatMediaLibraryService.js'

export default function EATMediaLibrary() {
  const toast = useToast()
  const [version, setVersion] = useState(0)
  const [type, setType] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [assignTarget, setAssignTarget] = useState(null)

  const assets = useMemo(() => getAssets(), [version])
  const assignments = useMemo(() => getAssignments(), [version])

  const types = useMemo(() => [...new Set(assets.map((a) => a.type))], [assets])
  const categories = useMemo(() => [...new Set(assets.map((a) => a.category))], [assets])
  const statuses = useMemo(() => [...new Set(assets.map((a) => a.status))], [assets])

  const filtered = assets.filter((a) =>
    (!type || a.type === type) && (!category || a.category === category) && (!status || a.status === status))

  return (
    <ManagementLayout title="Media Library / Image Source Manager" subtitle="Manage assets, sources, and target assignments">
      <MediaFilterBar
        type={type} setType={setType} category={category} setCategory={setCategory} status={status} setStatus={setStatus}
        types={types} categories={categories} statuses={statuses} onUploadClick={() => setShowUpload(true)}
      />
      <div style={{ fontSize: 12, color: '#8b95a3', marginBottom: 14 }}>{filtered.length} assets · uploads are session-local previews (object URLs), not persisted to cloud storage.</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 14, marginBottom: 24 }}>
        {filtered.map((a) => <MediaAssetCard key={a.id} asset={a} onAssign={setAssignTarget} />)}
        {filtered.length === 0 && <div style={{ color: '#8b95a3' }}>No assets match these filters.</div>}
      </div>

      <Card>
        <div style={{ fontWeight: 700, marginBottom: 10, color: GOLD }}>Active Assignments</div>
        {!assignments.length && <div style={{ color: '#8b95a3', fontSize: 13 }}>No assignments yet.</div>}
        {assignments.map((as) => {
          const asset = getAsset(as.assetId)
          return (
            <div key={as.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 13 }}>
              <span>{asset?.name || as.assetId}</span>
              <span><Pill label={as.targetSystem} tone="info" /> <span style={{ color: '#8b95a3' }}>{as.targetType} · {as.targetId}</span></span>
            </div>
          )
        })}
      </Card>

      {showUpload && <MediaUploadDialog onClose={() => setShowUpload(false)} onCreate={(data) => { createAsset(data); setShowUpload(false); setVersion((v) => v + 1); toast('Asset added (session-local)') }} />}
      {assignTarget && <MediaAssignDialog asset={assignTarget} onClose={() => setAssignTarget(null)} onAssign={(a) => { createAssignment(a); setAssignTarget(null); setVersion((v) => v + 1); toast('Assignment created') }} />}
    </ManagementLayout>
  )
}
