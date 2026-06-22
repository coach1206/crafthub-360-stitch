import { useRef, useState } from 'react'
import { triggerHaptic } from '../../utils/haptics.js'
import {
  ACCEPT_ATTRIBUTE,
  REJECTED_IMAGE_MESSAGE,
  isAllowedSmokeCraftImage,
} from '../../utils/smokecraftImageValidation.js'
import {
  createUploadLink,
  sendUploadLinkByText,
  sendUploadLinkByEmail,
} from '../../services/smokecraft/smokeUploadLinkService.js'

/**
 * Real, functional replacement for the decorative "Mentor Participation"
 * stamp on the Mentor Selection hero. Lets a guest upload a mentor
 * participation photo directly, or request a secure upload link by text or
 * email (delivery is a placeholder — no SMS/email provider is wired up yet).
 */
export default function SmokeCraftPassportUploadCard({ identity, onMediaStateChange }) {
  const fileInputRef = useRef(null)
  const [selectedUploadFile, setSelectedUploadFile] = useState(null)
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('no_upload_yet')
  const [uploadLink, setUploadLink] = useState(null)
  const [uploadDeliveryMethod, setUploadDeliveryMethod] = useState(null)
  const [linkPanel, setLinkPanel] = useState(null) // 'sms' | 'email' | null
  const [contactValue, setContactValue] = useState('')
  const [error, setError] = useState('')

  function emitState(next) {
    onMediaStateChange?.({
      selectedUploadFile: next.selectedUploadFile ?? selectedUploadFile,
      uploadPreviewUrl: next.uploadPreviewUrl ?? uploadPreviewUrl,
      uploadStatus: next.uploadStatus ?? uploadStatus,
      uploadLink: next.uploadLink ?? uploadLink,
      uploadDeliveryMethod: next.uploadDeliveryMethod ?? uploadDeliveryMethod,
    })
  }

  function handleUploadImageClick() {
    triggerHaptic('light')
    fileInputRef.current?.click()
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!isAllowedSmokeCraftImage(file)) {
      setError(REJECTED_IMAGE_MESSAGE)
      triggerHaptic('warning')
      e.target.value = ''
      return
    }

    setError('')
    triggerHaptic('success')
    const previewUrl = URL.createObjectURL(file)
    setSelectedUploadFile(file)
    setUploadPreviewUrl(previewUrl)
    setUploadStatus('image_uploaded')
    setLinkPanel(null)
    // No real backend image storage is wired up yet for SmokeCraft passport
    // media. We keep the file reference + local preview only.
    // TODO: Wire to Supabase/S3/Railway storage once SmokeCraft media storage exists.
    emitState({ selectedUploadFile: file, uploadPreviewUrl: previewUrl, uploadStatus: 'image_uploaded' })
  }

  function openLinkPanel(method) {
    triggerHaptic('light')
    setError('')
    setLinkPanel(method)
    setContactValue('')
  }

  function submitLink() {
    if (!contactValue.trim()) return
    const link = createUploadLink({
      sessionId: identity?.sessionId,
      userId: identity?.userId,
      guestId: identity?.guestId,
      smokeCraftPassportId: identity?.smokeCraftPassportId,
    })
    const result = linkPanel === 'sms'
      ? sendUploadLinkByText(contactValue.trim(), link.uploadLink)
      : sendUploadLinkByEmail(contactValue.trim(), link.uploadLink)

    triggerHaptic('medium')
    setUploadLink(link.uploadLink)
    setUploadDeliveryMethod(linkPanel)
    setUploadStatus('link_created_pending_delivery')
    emitState({
      uploadLink: link.uploadLink,
      uploadDeliveryMethod: linkPanel,
      uploadStatus: 'link_created_pending_delivery',
    })
    setError(result.message)
  }

  const statusLabel = {
    no_upload_yet: 'No upload yet',
    upload_pending: 'Upload pending',
    image_uploaded: 'Mentor participation media uploaded',
    link_created_pending_delivery: 'Upload pending',
    expired: 'Link expired',
  }[uploadStatus] || 'No upload yet'

  return (
    <div className="smokecraft-passport-upload" aria-label="Passport Media Upload">
      <style>{`
        .smokecraft-passport-upload {
          border: 1px solid rgba(233,193,118,0.4);
          border-radius: 16px;
          padding: 18px;
          background: linear-gradient(160deg, rgba(30,22,12,0.92), rgba(8,5,3,0.95));
          box-shadow: 0 0 30px rgba(233,193,118,0.16), inset 0 0 0 1px rgba(233,193,118,0.08);
          max-width: 320px;
        }
        .smokecraft-passport-upload__title {
          margin: 0 0 4px;
          color: #f7efe2;
          font-family: "Playfair Display", Georgia, serif;
          font-size: 17px;
        }
        .smokecraft-passport-upload__subtitle {
          margin: 0 0 12px;
          color: rgba(247,239,226,0.7);
          font-size: 12px;
          line-height: 1.4;
        }
        .smokecraft-passport-upload__status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(233,193,118,0.1);
          color: #e9c176;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .smokecraft-passport-upload__preview {
          width: 100%;
          height: 120px;
          border-radius: 10px;
          object-fit: cover;
          margin-bottom: 12px;
          box-shadow: inset 0 0 0 1px rgba(233,193,118,0.3);
        }
        .smokecraft-passport-upload__actions {
          display: grid;
          gap: 8px;
        }
        .smokecraft-passport-upload__actions button {
          min-height: 44px;
          border-radius: 10px;
          border: 1px solid rgba(233,193,118,0.4);
          background: rgba(233,193,118,0.08);
          color: #e9c176;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          transition: transform 0.15s ease, background 0.18s ease, box-shadow 0.18s ease;
        }
        .smokecraft-passport-upload__actions button:hover {
          background: rgba(233,193,118,0.16);
        }
        .smokecraft-passport-upload__actions button:active {
          transform: scale(0.97);
        }
        .smokecraft-passport-upload__actions button:focus-visible {
          outline: 2px solid rgba(255,225,151,0.85);
          outline-offset: 2px;
        }
        .smokecraft-passport-upload__link-panel {
          margin-top: 10px;
          display: grid;
          gap: 8px;
        }
        .smokecraft-passport-upload__link-panel input {
          min-height: 44px;
          border-radius: 8px;
          border: 1px solid rgba(233,193,118,0.3);
          background: rgba(0,0,0,0.3);
          color: #f7efe2;
          padding: 0 10px;
          font-size: 13px;
        }
        .smokecraft-passport-upload__error {
          margin-top: 10px;
          color: rgba(247,239,226,0.85);
          font-size: 11.5px;
          line-height: 1.4;
        }
      `}</style>

      <h3 className="smokecraft-passport-upload__title">Passport Media Upload</h3>
      <p className="smokecraft-passport-upload__subtitle">
        Upload a mentor participation photo, passport stamp image, or send yourself a secure upload link.
      </p>

      <span className="smokecraft-passport-upload__status">
        <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden="true">verified</span>
        {statusLabel}
      </span>

      {uploadPreviewUrl && (
        <img className="smokecraft-passport-upload__preview" src={uploadPreviewUrl} alt="Uploaded mentor participation preview" />
      )}

      <div className="smokecraft-passport-upload__actions">
        <button type="button" onClick={handleUploadImageClick}>
          <span className="material-symbols-outlined" aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 6, fontSize: 16 }}>upload</span>
          Upload Image
        </button>
        <button type="button" onClick={() => openLinkPanel('sms')}>
          <span className="material-symbols-outlined" aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 6, fontSize: 16 }}>sms</span>
          Text Upload Link
        </button>
        <button type="button" onClick={() => openLinkPanel('email')}>
          <span className="material-symbols-outlined" aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 6, fontSize: 16 }}>mail</span>
          Email Upload Link
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      {linkPanel && (
        <div className="smokecraft-passport-upload__link-panel">
          <input
            type={linkPanel === 'sms' ? 'tel' : 'email'}
            placeholder={linkPanel === 'sms' ? 'Mobile number' : 'Email address'}
            value={contactValue}
            onChange={(e) => setContactValue(e.target.value)}
            aria-label={linkPanel === 'sms' ? 'Mobile number for upload link' : 'Email address for upload link'}
          />
          <button type="button" onClick={submitLink}>Send Upload Link</button>
        </div>
      )}

      {error && <p className="smokecraft-passport-upload__error" role="status">{error}</p>}
    </div>
  )
}
