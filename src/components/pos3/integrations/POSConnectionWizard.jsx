import { useState } from 'react'
import { Card, Btn, Pill, GOLD } from '../../eat/ui.jsx'
import POSSyncSettings from './POSSyncSettings.jsx'
import POSFieldMapper from './POSFieldMapper.jsx'
import POSImportPreview from './POSImportPreview.jsx'
import { getFieldMappings } from '../../../services/pos3/posFieldMappingService.js'
import {
  saveIntegrationConfig, testConnection, activateSync, getIntegrationConfig,
} from '../../../services/pos3/posSyncService.js'

const STEPS = [
  'Provider Overview',
  'Enter Credentials',
  'Test Connection',
  'Sync Settings',
  'Field Mapping',
  'Run Initial Sync',
  'Activate',
]

/**
 * 7-step wizard: overview -> credentials -> test -> sync settings ->
 * field mapping -> initial sync -> activate. Local-only, no real API calls.
 */
export default function POSConnectionWizard({ provider, onClose, onActivated }) {
  const [step, setStep] = useState(0)
  const [creds, setCreds] = useState({})
  const [testResult, setTestResult] = useState(null)
  const [syncOptions, setSyncOptions] = useState({ menu: true, orders: true, inventory: true, staff: true })
  const [syncResult, setSyncResult] = useState(null)
  const [error, setError] = useState('')

  const mappings = getFieldMappings()

  function next() { setStep((s) => Math.min(s + 1, STEPS.length - 1)) }
  function back() { setStep((s) => Math.max(s - 1, 0)) }

  function handleSaveCreds() {
    saveIntegrationConfig(provider.id, creds)
    next()
  }

  function handleTest() {
    const result = testConnection(provider.id)
    setTestResult(result)
    if (result.success) setError('')
    else setError(`Missing required fields: ${(result.missingFields || []).join(', ')}`)
  }

  function handleActivate() {
    const result = activateSync(provider.id, syncOptions)
    setSyncResult(result)
    if (result.success) {
      next()
      onActivated?.(getIntegrationConfig(provider.id))
    } else {
      setError(result.error || 'Activation failed')
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <Card style={{ width: 640, maxHeight: '88vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Connect {provider.name}</div>
          <Btn tone="gray" style={{ padding: '6px 12px' }} onClick={onClose}>Close</Btn>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {STEPS.map((label, i) => (
            <Pill key={label} label={`${i + 1}. ${label}`} tone={i === step ? 'pending' : i < step ? 'open' : 'info'} />
          ))}
        </div>

        {error && <div style={{ color: '#f0907f', fontSize: 13 }}>{error}</div>}

        {step === 0 && (
          <div>
            <div style={{ fontSize: 13, color: '#cdd5df', marginBottom: 10 }}>{provider.description}</div>
            <div style={{ fontSize: 12.5, color: '#8b95a3', marginBottom: 6 }}>This integration will sync:</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {provider.whatItSyncs.map((w) => <Pill key={w} label={w} tone="info" />)}
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 12.5, color: '#8b95a3' }}>
              Sample/local-only credentials — no real network call will be made.
            </div>
            {(provider.requiredCredentialFields || []).map((f) => (
              <label key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5 }}>
                {f.label}
                <input
                  type="text"
                  value={creds[f.key] || ''}
                  onChange={(e) => setCreds({ ...creds, [f.key]: e.target.value })}
                  style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(212,168,67,0.18)', background: '#0f1419', color: '#e8eef5' }}
                  placeholder={`Sample ${f.label}`}
                />
              </label>
            ))}
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13, color: '#cdd5df' }}>Validate that all required credential fields were provided. No real network call is made.</div>
            <Btn tone="blue" onClick={handleTest}>Test Connection</Btn>
            {testResult && (
              <Pill label={testResult.success ? 'Connection OK' : 'Connection Failed'} tone={testResult.success ? 'open' : 'critical'} />
            )}
          </div>
        )}

        {step === 3 && (
          <POSSyncSettings syncOptions={syncOptions} onChange={setSyncOptions} />
        )}

        {step === 4 && (
          <POSFieldMapper mappings={mappings} />
        )}

        {step === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13, color: '#cdd5df' }}>Run the initial sync using bundled sample data. This activates the provider and marks sync as active.</div>
            <Btn tone="green" onClick={handleActivate}>Run Initial Sync & Activate</Btn>
            {syncResult?.importedCounts && <POSImportPreview importedCounts={syncResult.importedCounts} />}
          </div>
        )}

        {step === 6 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Pill label="Integration Active" tone="open" />
            <div style={{ fontSize: 13, color: '#cdd5df' }}>{provider.name} is now connected and syncing. You can manage it from the provider card.</div>
            {syncResult?.importedCounts && <POSImportPreview importedCounts={syncResult.importedCounts} />}
            <Btn tone="gold" onClick={onClose}>Done</Btn>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <Btn tone="gray" onClick={back} disabled={step === 0}>Back</Btn>
          {step === 1 && <Btn tone="gold" onClick={handleSaveCreds}>Save & Continue</Btn>}
          {step !== 1 && step < STEPS.length - 1 && step !== 5 && <Btn tone="gold" onClick={next} disabled={step === 2 && !testResult?.success}>Next</Btn>}
        </div>
      </Card>
    </div>
  )
}
