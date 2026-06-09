import { useState } from 'react'

const ROLE_OPTIONS = [
  { value: 'staff',           label: 'Staff Access' },
  { value: 'manager',         label: 'Manager Access' },
  { value: 'human_mentor',    label: 'Human Mentor Access' },
  { value: 'developer',       label: 'Developer Diagnostics Access' },
  { value: 'passport_member', label: 'Passport Member Access' },
]

export default function RequestAccessModal({ fromRoute, currentRole, onClose, onSubmitted }) {
  const [form, setForm] = useState({
    name:          '',
    email:         '',
    requestedRole: '',
    reason:        '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.email || !form.requestedRole) {
      setError('Name, email, and requested access level are required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/access-requests', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterName:  form.name.trim(),
          requesterEmail: form.email.trim(),
          currentRole,
          requestedRole:  form.requestedRole,
          requestedRoute: fromRoute || null,
          reason:         form.reason.trim() || null,
        }),
      })
      if (res.ok || res.status === 201) {
        onSubmitted?.()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.message || 'Failed to submit request. Please try again.')
      }
    } catch {
      setError('Network error — please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(12,10,7,0.85)',
      backdropFilter: 'blur(8px)',
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 480,
        background: 'rgba(20,16,12,0.98)',
        border: '1px solid rgba(201,168,76,0.3)',
        borderRadius: 16,
        boxShadow: '0 32px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(201,168,76,0.1)',
        overflow: 'hidden',
      }}>
        {/* Gold accent top */}
        <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #C9A84C, #E8D5A3, #C9A84C, transparent)' }} />

        <div style={{ padding: '32px 36px 28px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <div style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 9,
                letterSpacing: '0.3em',
                color: 'rgba(201,168,76,0.5)',
                marginBottom: 6,
                textTransform: 'uppercase',
              }}>
                NOVEE OS SECURITY LAYER
              </div>
              <h2 style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: 20,
                fontWeight: 700,
                color: '#E8D5A3',
                margin: 0,
                letterSpacing: '0.05em',
              }}>
                REQUEST ACCESS
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                color: 'rgba(245,232,200,0.4)',
                marginTop: -4,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>close</span>
            </button>
          </div>

          <div style={{
            height: 1,
            background: 'rgba(201,168,76,0.12)',
            marginBottom: 24,
          }} />

          <p style={{
            fontSize: 13,
            color: 'rgba(245,232,200,0.55)',
            lineHeight: 1.6,
            margin: '0 0 24px',
            fontFamily: '"Hanken Grotesk", system-ui, sans-serif',
          }}>
            Submit a request to your administrator for elevated access. Your request will be reviewed within 24 hours.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Name */}
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  style={inputStyle}
                  disabled={loading}
                />
              </div>

              {/* Email */}
              <div>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  style={inputStyle}
                  disabled={loading}
                />
              </div>

              {/* Requested access level */}
              <div>
                <label style={labelStyle}>Access Level Requested</label>
                <select
                  value={form.requestedRole}
                  onChange={e => set('requestedRole', e.target.value)}
                  style={{ ...inputStyle, color: form.requestedRole ? '#F5E8C8' : 'rgba(245,232,200,0.35)' }}
                  disabled={loading}
                >
                  <option value="">Select access level…</option>
                  {ROLE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div>
                <label style={labelStyle}>Reason (optional)</label>
                <textarea
                  placeholder="Briefly describe why you need access…"
                  value={form.reason}
                  onChange={e => set('reason', e.target.value)}
                  rows={3}
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    minHeight: 72,
                    fontFamily: '"Hanken Grotesk", system-ui, sans-serif',
                    lineHeight: 1.5,
                  }}
                  disabled={loading}
                />
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(220,60,60,0.1)',
                  border: '1px solid rgba(220,60,60,0.25)',
                  color: 'rgba(255,120,120,0.9)',
                  fontSize: 12,
                  fontFamily: '"Hanken Grotesk", system-ui, sans-serif',
                }}>
                  {error}
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 8,
                    border: '1px solid rgba(201,168,76,0.2)',
                    background: 'transparent',
                    color: 'rgba(245,232,200,0.6)',
                    cursor: 'pointer',
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 10,
                    letterSpacing: '0.1em',
                    fontWeight: 700,
                  }}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 2,
                    height: 44,
                    borderRadius: 8,
                    border: 'none',
                    background: loading
                      ? 'rgba(201,168,76,0.4)'
                      : 'linear-gradient(135deg, #C9A84C, #E8D5A3, #C9A84C)',
                    color: '#0C0A07',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: loading ? 'none' : '0 4px 16px rgba(201,168,76,0.25)',
                  }}
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>
                        autorenew
                      </span>
                      SUBMITTING…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>send</span>
                      SUBMIT REQUEST
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 36px 14px',
          textAlign: 'center',
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 9,
          letterSpacing: '0.12em',
          color: 'rgba(201,168,76,0.2)',
        }}>
          PROFOUND INNOVATIONS LLC · NOVEE OS · SECURE ACCESS REQUEST
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontFamily: '"JetBrains Mono", monospace',
  fontSize: 9,
  letterSpacing: '0.18em',
  color: 'rgba(201,168,76,0.6)',
  marginBottom: 6,
  textTransform: 'uppercase',
}

const inputStyle = {
  width: '100%',
  height: 42,
  padding: '0 14px',
  borderRadius: 8,
  border: '1px solid rgba(201,168,76,0.2)',
  background: 'rgba(201,168,76,0.04)',
  color: '#F5E8C8',
  fontSize: 13,
  fontFamily: '"Hanken Grotesk", system-ui, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}
