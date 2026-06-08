import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import PassportBottomNav from '../../components/PassportBottomNav.jsx'

const FILL1 = { fontVariationSettings: "'FILL' 1" }

const SCAN_MODES = [
  { id: 'show',    icon: 'qr_code_2',      label: 'Show My QR',       desc: 'Let others scan your passport QR' },
  { id: 'connect', icon: 'people',          label: 'Connect with Member', desc: "Scan someone's QR to link passports" },
  { id: 'venue',   icon: 'location_on',     label: 'Scan Venue QR',    desc: 'Check in at a venue or event table' },
  { id: 'stamp',   icon: 'workspace_premium', label: 'Scan for Stamp', desc: 'Scan an event QR to earn a stamp' },
]

const HOW_STEPS = [
  { icon: 'qr_code_2',      text: 'Open your passport QR on screen' },
  { icon: 'phone_iphone',   text: 'The other member scans your code' },
  { icon: 'verified',       text: 'Connection is verified instantly' },
  { icon: 'workspace_premium', text: 'Both earn a Connection stamp' },
]

// Fake QR pattern using SVG
function FakeQR({ size = 200, color = '#e9c176' }) {
  const cell = size / 21
  // Minimal QR-like pattern (finder patterns + data modules)
  const data = [
    [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,1,0,1,0,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,0,0,0,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,1,1,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0],
    [1,0,1,1,0,0,1,0,0,1,1,0,1,0,0,1,1,0,1,0,1],
    [0,1,0,0,1,1,0,1,1,0,0,1,0,1,1,0,0,1,0,1,0],
    [1,0,1,0,1,0,1,0,0,1,0,0,1,0,1,0,1,0,1,0,1],
    [0,1,0,1,0,1,0,0,1,0,1,1,0,1,0,1,0,1,0,1,0],
    [1,0,1,0,1,0,1,1,0,1,0,0,1,0,1,0,1,0,1,0,1],
    [0,0,0,0,0,0,0,0,1,0,1,1,0,0,0,0,0,0,0,0,0],
    [1,1,1,1,1,1,1,0,0,0,1,0,0,0,1,0,1,0,0,1,1],
    [1,0,0,0,0,0,1,0,1,1,0,1,1,0,1,0,0,1,1,0,0],
    [1,0,1,1,1,0,1,0,0,0,1,0,0,1,0,1,0,0,1,1,0],
    [1,0,1,1,1,0,1,0,1,0,0,1,1,0,1,0,1,0,0,0,1],
    [1,0,1,1,1,0,1,0,0,1,1,0,0,1,0,0,0,1,1,0,0],
    [1,0,0,0,0,0,1,0,1,0,0,1,0,1,1,0,1,0,0,1,0],
    [1,1,1,1,1,1,1,0,0,1,1,0,1,0,0,0,1,1,0,0,1],
  ]
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((row, r) => row.map((v, c) => v ? (
        <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell - 0.5} height={cell - 0.5} fill={color} rx={cell * 0.12} />
      ) : null))}
    </svg>
  )
}

export default function PassportScan() {
  const navigate    = useNavigate()
  const { session } = useGuestSession()
  const [mode, setMode]         = useState('show')
  const [scanning, setScanning] = useState(false)
  const [linked, setLinked]     = useState(false)
  const [pulse, setPulse]       = useState(false)

  const displayName = session.profile?.firstName
    ? `${session.profile.firstName} ${session.profile.lastName || ''}`.trim()
    : 'Grand Member'

  // Pulse animation for QR
  useEffect(() => {
    const interval = setInterval(() => setPulse(p => !p), 2000)
    return () => clearInterval(interval)
  }, [])

  function simulateScan() {
    setScanning(true)
    setTimeout(() => {
      setScanning(false)
      setLinked(true)
      setTimeout(() => setLinked(false), 3000)
    }, 2200)
  }

  return (
    <div className="min-h-screen font-body-md pb-28 text-on-surface overflow-x-hidden"
      style={{ background: 'linear-gradient(160deg, #050e1a 0%, #0a0805 100%)' }}>

      {/* Gold ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-[120px]"
          style={{ background: 'rgba(233,193,118,0.1)', transition: 'opacity 2s', opacity: pulse ? 0.15 : 0.06 }} />
      </div>

      {/* Top Bar */}
      <header className="sticky top-0 z-50 flex justify-between items-center px-5 backdrop-blur-xl border-b"
        style={{ height: 72, background: 'rgba(5,14,26,0.9)', borderColor: 'rgba(233,193,118,0.15)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/passport')} className="material-symbols-outlined p-2 rounded-full active:bg-white/10 transition-colors"
            style={{ color: '#e9c176', minWidth: 44, minHeight: 44 }}>arrow_back</button>
          <div>
            <p className="font-bold text-[15px] leading-none" style={{ color: '#e9c176', fontFamily: '"Playfair Display", serif' }}>Scan & Connect</p>
            <p className="text-[10px] uppercase tracking-[0.25em] mt-0.5" style={{ color: 'rgba(233,193,118,0.4)' }}>Passport QR Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 rounded-full"
          style={{ height: 36, background: 'rgba(76,175,80,0.12)', border: '1px solid rgba(76,175,80,0.3)' }}>
          <div className="w-2 h-2 rounded-full" style={{ background: '#4caf50', boxShadow: '0 0 6px #4caf50' }} />
          <span className="text-[11px] font-bold" style={{ color: '#4caf50' }}>Active</span>
        </div>
      </header>

      <main className="relative z-10 max-w-lg mx-auto px-4 pt-5 space-y-6">

        {/* ── Mode Selector ─────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2">
          {SCAN_MODES.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.95)'}
              onTouchEnd={e => { e.currentTarget.style.transform = ''; setMode(m.id) }}
              className="rounded-xl p-3 text-left transition-all duration-200 active:scale-95"
              style={{
                background: mode === m.id ? 'rgba(233,193,118,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${mode === m.id ? 'rgba(233,193,118,0.4)' : 'rgba(255,255,255,0.08)'}`,
              }}>
              <span className="material-symbols-outlined mb-1.5 block" style={{ fontSize: 22, color: mode === m.id ? '#e9c176' : 'rgba(255,255,255,0.35)', ...(mode === m.id ? FILL1 : {}) }}>{m.icon}</span>
              <p className="font-bold text-[12px] leading-tight" style={{ color: mode === m.id ? '#e9c176' : 'rgba(255,255,255,0.5)' }}>{m.label}</p>
              <p className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{m.desc}</p>
            </button>
          ))}
        </div>

        {/* ── Show My QR ─────────────────────────────────────── */}
        {mode === 'show' && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-[11px] uppercase tracking-[0.3em]" style={{ color: 'rgba(233,193,118,0.4)' }}>Your Passport QR Code</p>
            <div className="relative">
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-2xl transition-all duration-2000"
                style={{ boxShadow: `0 0 ${pulse ? '40px' : '20px'} rgba(233,193,118,${pulse ? '0.3' : '0.15'})`, transition: 'box-shadow 2s ease' }} />
              <div className="relative rounded-2xl p-5 bg-white"
                style={{ boxShadow: '0 8px 48px rgba(0,0,0,0.6)' }}>
                <FakeQR size={200} color="#0a0805" />
              </div>
              {/* Corner markers */}
              {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map(pos => (
                <div key={pos} className={`absolute ${pos} w-8 h-8 pointer-events-none`} style={{
                  borderColor: '#e9c176',
                  borderStyle: 'solid',
                  borderWidth: pos.includes('top') && pos.includes('left')  ? '3px 0 0 3px' :
                               pos.includes('top') && pos.includes('right') ? '3px 3px 0 0' :
                               pos.includes('bottom') && pos.includes('left') ? '0 0 3px 3px' : '0 3px 3px 0',
                  borderRadius: pos.includes('top') && pos.includes('left')  ? '4px 0 0 0' :
                                pos.includes('top') && pos.includes('right') ? '0 4px 0 0' :
                                pos.includes('bottom') && pos.includes('left') ? '0 0 0 4px' : '0 0 4px 0',
                }} />
              ))}
            </div>

            <div className="text-center">
              <p className="font-bold text-[17px]" style={{ color: '#f0e6d0', fontFamily: '"Playfair Display", serif' }}>{displayName}</p>
              <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>360 Passport · CraftHub Member</p>
            </div>

            <p className="text-[11px] text-center leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)', maxWidth: 280 }}>
              Show this QR to another member or staff member to verify your identity and link passports.
            </p>
          </div>
        )}

        {/* ── Connect / Venue / Stamp modes ──────────────────── */}
        {mode !== 'show' && (
          <div className="flex flex-col items-center gap-5">
            <p className="text-[11px] uppercase tracking-[0.3em] text-center" style={{ color: 'rgba(233,193,118,0.4)' }}>
              {mode === 'connect' ? "Scan a Member's QR" : mode === 'venue' ? 'Scan a Venue QR' : 'Scan a Stamp QR'}
            </p>

            {/* Camera viewport mock */}
            <div className="relative rounded-2xl overflow-hidden"
              style={{ width: 260, height: 260, background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(233,193,118,0.2)' }}>

              {/* Scanning animation */}
              {scanning && (
                <div className="absolute left-0 right-0 h-0.5 animate-bounce z-10"
                  style={{ top: '50%', background: 'linear-gradient(90deg, transparent, #e9c176, transparent)', boxShadow: '0 0 8px #e9c176' }} />
              )}

              {/* Linked success overlay */}
              {linked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20"
                  style={{ background: 'rgba(20,40,20,0.95)' }}>
                  <span className="material-symbols-outlined mb-3" style={{ fontSize: 56, color: '#4caf50', ...FILL1 }}>check_circle</span>
                  <p className="font-bold text-[15px]" style={{ color: '#4caf50' }}>Passport Linked!</p>
                  <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Connection stamp earned</p>
                </div>
              )}

              {/* Corner markers */}
              <div className="absolute inset-8">
                {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map(pos => (
                  <div key={pos} className={`absolute ${pos} w-8 h-8`} style={{
                    borderColor: '#e9c176', borderStyle: 'solid',
                    borderWidth: pos.includes('top') && pos.includes('left')  ? '3px 0 0 3px' :
                                 pos.includes('top') && pos.includes('right') ? '3px 3px 0 0' :
                                 pos.includes('bottom') && pos.includes('left') ? '0 0 3px 3px' : '0 3px 3px 0',
                  }} />
                ))}
              </div>

              {/* Camera icon */}
              {!scanning && !linked && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'rgba(233,193,118,0.2)' }}>photo_camera</span>
                </div>
              )}
            </div>

            <p className="text-[12px] text-center" style={{ color: 'rgba(255,255,255,0.35)', maxWidth: 260 }}>
              Position the QR code within the frame. Scanning happens automatically.
            </p>

            {/* Simulate scan button */}
            <button
              onClick={simulateScan}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
              onTouchEnd={e => { e.currentTarget.style.transform = ''; simulateScan() }}
              disabled={scanning || linked}
              className="flex items-center gap-3 rounded-2xl px-8 font-bold text-[13px] uppercase tracking-wider transition-all active:scale-[0.97]"
              style={{
                height: 64,
                background: scanning || linked ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #e9c176, #c5a059)',
                color: scanning || linked ? 'rgba(255,255,255,0.3)' : '#0a0805',
                boxShadow: (!scanning && !linked) ? '0 4px 24px rgba(233,193,118,0.3)' : 'none',
              }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, ...((!scanning && !linked) ? FILL1 : {}) }}>
                {scanning ? 'hourglass_empty' : linked ? 'check' : 'qr_code_scanner'}
              </span>
              {scanning ? 'Scanning…' : linked ? 'Linked!' : 'Simulate Scan'}
            </button>
          </div>
        )}

        {/* ── How it works ─────────────────────────────────────── */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(233,193,118,0.05)', border: '1px solid rgba(233,193,118,0.12)' }}>
          <p className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: 'rgba(233,193,118,0.4)' }}>How passport scanning works</p>
          <div className="space-y-3">
            {HOW_STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(233,193,118,0.12)', border: '1px solid rgba(233,193,118,0.2)' }}>
                  <span className="text-[10px] font-bold" style={{ color: '#e9c176' }}>{i + 1}</span>
                </div>
                <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 16, color: 'rgba(233,193,118,0.5)' }}>{step.icon}</span>
                <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{step.text}</p>
              </div>
            ))}
          </div>
        </div>

      </main>

      <PassportBottomNav active="scan" />
    </div>
  )
}
