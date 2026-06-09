import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useContext } from 'react'
import { SecurityContext } from '../context/SecurityContext.jsx'
import RequestAccessModal from '../components/security/RequestAccessModal.jsx'

const ROLE_LABELS = {
  founder_level_0: 'FOUNDER LEVEL 0',
  admin:           'ADMIN',
  manager:         'MANAGER',
  staff:           'STAFF',
  human_mentor:    'HUMAN MENTOR',
  passport_member: 'PASSPORT MEMBER',
  developer:       'DEVELOPER',
  guest:           'GUEST',
}

export default function AccessDenied() {
  const navigate         = useNavigate()
  const [params]         = useSearchParams()
  const { role }         = useContext(SecurityContext) || {}
  const [showRequest, setShowRequest] = useState(false)
  const [submitted, setSubmitted]     = useState(false)

  const fromRoute    = params.get('from')    || ''
  const requiredRole = params.get('required') || ''
  const currentRole  = ROLE_LABELS[role] || ROLE_LABELS['guest']

  const roleHome = {
    founder_level_0: '/founder',
    admin:           '/admin',
    manager:         '/eat-command',
    staff:           '/pos3',
    human_mentor:    '/mentor-console',
    passport_member: '/passport',
    developer:       '/dev-diagnostics',
  }
  const homeRoute = roleHome[role] || '/'

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#0C0A07',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: '"Hanken Grotesk", system-ui, sans-serif',
    }}>
      {/* Ambient gold glow */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Grain overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity: 0.07,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='1' height='1' x='0' y='0' fill='%23fff' opacity='.08'/%3E%3Crect width='1' height='1' x='2' y='2' fill='%23fff' opacity='.05'/%3E%3C/svg%3E\")",
      }} />

      {/* Horizontal scan line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)',
      }} />
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)',
      }} />

      {/* Main panel */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: 480,
        width: '90%',
        background: 'rgba(20,16,12,0.85)',
        border: '1px solid rgba(201,168,76,0.25)',
        borderRadius: 20,
        backdropFilter: 'blur(20px)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,168,76,0.08), inset 0 1px 0 rgba(201,168,76,0.1)',
        overflow: 'hidden',
      }}>
        {/* Gold top border accent */}
        <div style={{
          height: 2,
          background: 'linear-gradient(90deg, transparent, #C9A84C, #E8D5A3, #C9A84C, transparent)',
        }} />

        <div style={{ padding: '48px 40px 44px' }}>
          {/* Lock icon */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.2)',
              boxShadow: '0 0 30px rgba(201,168,76,0.1)',
            }}>
              <span className="material-symbols-outlined" style={{
                fontSize: 36,
                color: '#C9A84C',
                fontVariationSettings: "'FILL' 0",
              }}>lock</span>
            </div>
          </div>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <div style={{
              fontFamily: '"JetBrains Mono", "Courier New", monospace',
              fontSize: 10,
              letterSpacing: '0.3em',
              color: 'rgba(201,168,76,0.5)',
              marginBottom: 12,
              textTransform: 'uppercase',
            }}>
              NOVEE OS SECURITY LAYER
            </div>
            <h1 style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: 28,
              fontWeight: 700,
              color: '#E8D5A3',
              letterSpacing: '0.05em',
              margin: 0,
              lineHeight: 1.2,
            }}>
              ACCESS RESTRICTED
            </h1>
            <div style={{
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.35), transparent)',
              margin: '16px 0',
            }} />
          </div>

          {/* Role chip */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: 20,
              border: '1px solid rgba(201,168,76,0.3)',
              background: 'rgba(201,168,76,0.06)',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'rgba(201,168,76,0.6)' }}>
                badge
              </span>
              <span style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 10,
                letterSpacing: '0.12em',
                color: 'rgba(201,168,76,0.7)',
              }}>
                CURRENT ROLE: {currentRole}
              </span>
            </div>
          </div>

          {/* Message */}
          <p style={{
            textAlign: 'center',
            color: 'rgba(245,232,200,0.55)',
            fontSize: 14,
            lineHeight: 1.65,
            margin: '0 0 36px',
            fontFamily: '"Hanken Grotesk", system-ui, sans-serif',
          }}>
            Your current role does not permit access to this NOVEE OS command layer.
          </p>

          {/* Divider */}
          <div style={{
            height: 1,
            background: 'rgba(201,168,76,0.1)',
            marginBottom: 28,
          }} />

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Back */}
            <button
              onClick={() => navigate(-1)}
              style={btnStyle('ghost')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
              BACK
            </button>

            {/* Home */}
            <button
              onClick={() => navigate(homeRoute)}
              style={btnStyle('gold')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>home</span>
              HOME
            </button>

            {/* Request Access */}
            {!submitted ? (
              <button
                onClick={() => setShowRequest(true)}
                style={btnStyle('ghost')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>send</span>
                REQUEST ACCESS
              </button>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '12px',
                borderRadius: 10,
                background: 'rgba(201,168,76,0.06)',
                border: '1px solid rgba(201,168,76,0.2)',
                color: 'rgba(201,168,76,0.8)',
                fontSize: 12,
                fontFamily: '"JetBrains Mono", monospace',
                letterSpacing: '0.06em',
              }}>
                ✓ REQUEST SUBMITTED — ADMIN WILL REVIEW
              </div>
            )}
          </div>
        </div>

        {/* Gold bottom border accent */}
        <div style={{
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)',
        }} />

        {/* Footer */}
        <div style={{
          padding: '12px 40px 16px',
          textAlign: 'center',
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 9,
          letterSpacing: '0.15em',
          color: 'rgba(201,168,76,0.25)',
        }}>
          PROFOUND INNOVATIONS LLC · NOVEE OS · SECURE AUTHORIZATION LAYER
        </div>
      </div>

      {/* Request Access Modal */}
      {showRequest && (
        <RequestAccessModal
          fromRoute={fromRoute}
          currentRole={role || 'guest'}
          onClose={() => setShowRequest(false)}
          onSubmitted={() => { setShowRequest(false); setSubmitted(true) }}
        />
      )}
    </div>
  )
}

function btnStyle(variant) {
  const base = {
    width: '100%',
    height: 48,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
    fontFamily: '"JetBrains Mono", "Courier New", monospace',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.12em',
    transition: 'all 0.15s',
    border: 'none',
  }
  if (variant === 'gold') return {
    ...base,
    background: 'linear-gradient(135deg, #C9A84C, #E8D5A3, #C9A84C)',
    color: '#0C0A07',
    boxShadow: '0 4px 20px rgba(201,168,76,0.25)',
  }
  return {
    ...base,
    background: 'transparent',
    border: '1px solid rgba(201,168,76,0.25)',
    color: 'rgba(245,232,200,0.7)',
  }
}
