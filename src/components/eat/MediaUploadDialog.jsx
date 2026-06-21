import { useState } from 'react'
import { PANEL, PANEL2, GOLD, Btn } from './ui.jsx'

const inputStyle = {
  width: '100%', background: PANEL2, color: '#e8eef5', border: '1px solid rgba(212,168,67,0.18)',
  borderRadius: 8, padding: '8px 10px', fontSize: 13, marginBottom: 10,
}

export default function MediaUploadDialog({ onClose, onCreate }) {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('other')

  function handleFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setName((n) => n || f.name)
    setPreviewUrl(URL.createObjectURL(f))
  }

  function submit() {
    if (!previewUrl) return
    onCreate({ name: name || 'Untitled Upload', type: file?.type?.startsWith('video') ? 'video' : 'image', category, sourceType: 'upload', status: 'active', previewUrl })
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998 }}>
      <div style={{ background: PANEL, borderRadius: 16, padding: 22, width: 420, border: '1px solid rgba(212,168,67,0.2)' }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: GOLD }}>Upload Media Asset</div>
        <div style={{ fontSize: 12, color: '#f0907f', marginBottom: 14 }}>
          Session-local preview only — not persisted cloud storage. The file stays in this browser tab and is lost on reload.
        </div>
        <input type="file" accept="image/*,video/*" onChange={handleFile} style={{ marginBottom: 12, color: '#cdd5df', fontSize: 13 }} />
        {previewUrl && <img src={previewUrl} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} />}
        <input style={inputStyle} placeholder="Asset name" value={name} onChange={(e) => setName(e.target.value)} />
        <select style={inputStyle} value={category} onChange={(e) => setCategory(e.target.value)}>
          {['branding', 'cigar', 'ambiance', 'menu', 'pairing', 'other'].map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <Btn tone="gray" onClick={onClose}>Cancel</Btn>
          <Btn tone="gold" onClick={submit} disabled={!previewUrl}>Add Asset</Btn>
        </div>
      </div>
    </div>
  )
}
