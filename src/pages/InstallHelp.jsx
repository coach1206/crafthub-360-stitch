/**
 * InstallHelp — Phase 11
 * Manager+ only. Step-by-step PWA / kiosk install instructions.
 * Route: /install-help
 */

import { useNavigate } from 'react-router-dom'

const GOLD = '#C9A84C'
const DARK = '#050505'
const CARD = 'rgba(18,12,5,0.97)'

function PlatformCard({ icon, title, steps }) {
  return (
    <div style={{
      background:    CARD,
      border:        `1px solid ${GOLD}18`,
      borderRadius:  '10px',
      padding:       '1.75rem',
      marginBottom:  '1rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '1.75rem' }}>{icon}</span>
        <h2 style={{ color: GOLD, fontSize: '1rem', fontWeight: 400, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
          {title}
        </h2>
      </div>
      <ol style={{ margin: 0, padding: '0 0 0 1.25rem' }}>
        {steps.map((step, i) => (
          <li key={i} style={{
            color:       'rgba(201,168,76,0.75)',
            fontSize:    '0.88rem',
            lineHeight:  1.75,
            paddingLeft: '0.25rem',
            marginBottom: i < steps.length - 1 ? '0.25rem' : 0,
          }}>
            {step}
          </li>
        ))}
      </ol>
    </div>
  )
}

function Note({ children }) {
  return (
    <div style={{
      background:   'rgba(201,168,76,0.05)',
      border:       `1px solid ${GOLD}18`,
      borderLeft:   `3px solid ${GOLD}55`,
      borderRadius: '0 6px 6px 0',
      padding:      '0.875rem 1rem',
      marginBottom: '1rem',
      color:        'rgba(201,168,76,0.55)',
      fontSize:     '0.82rem',
      lineHeight:   1.7,
    }}>
      {children}
    </div>
  )
}

export default function InstallHelp() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: DARK, color: GOLD, fontFamily: 'Georgia, serif', padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>

        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'transparent', border: 'none', color: `${GOLD}44`, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '0.8rem', letterSpacing: '0.1em', padding: 0, marginBottom: '1.25rem' }}
          >
            ← Back
          </button>
          <div style={{ fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', opacity: 0.4, marginBottom: '0.4rem' }}>
            NOVEE OS · DEPLOYMENT
          </div>
          <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', fontWeight: 400, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
            Install Help
          </h1>
          <p style={{ color: 'rgba(201,168,76,0.4)', fontSize: '0.85rem', marginTop: '0.75rem', lineHeight: 1.7 }}>
            Step-by-step instructions for venue staff installing NOVEE OS on tablets and kiosk hardware.
          </p>
        </div>

        <Note>
          Open the NOVEE OS URL in the device browser before following these steps.
          You need the app URL from your venue manager.
        </Note>

        <PlatformCard
          icon="🍎"
          title="iPad · Safari"
          steps={[
            'Open the NOVEE OS URL in Safari.',
            'Tap the Share button (box with an arrow pointing up) at the bottom of the screen.',
            'Scroll down in the share sheet and tap "Add to Home Screen".',
            'Edit the name if desired, then tap "Add" in the top-right corner.',
            'Find the NOVEE OS icon on your home screen and tap it to launch.',
            'The app opens in full-screen mode without the Safari address bar.',
          ]}
        />

        <PlatformCard
          icon="🤖"
          title="Android Tablet · Chrome"
          steps={[
            'Open the NOVEE OS URL in Chrome.',
            'Tap the three-dot menu (⋮) in the top-right corner.',
            'Tap "Add to Home screen" or "Install app".',
            'Tap "Add" or "Install" in the confirmation dialog.',
            'Tap the NOVEE OS icon on your home screen to launch.',
            'The app opens in standalone mode without the browser address bar.',
          ]}
        />

        <PlatformCard
          icon="🖥️"
          title="Kiosk Browser · Full-Screen Mode"
          steps={[
            'Open the NOVEE OS URL in your chosen kiosk browser (Chrome, Kiosk Browser Lockdown, etc.).',
            'Enable full-screen mode — press F11 on most systems, or use the browser kiosk flag.',
            'For Chrome: launch with --kiosk flag: chrome --kiosk https://your-novee-url.com',
            'Navigate to /kiosk-setup (manager login required) to assign the device type.',
            'Set Device Type to "Guest Kiosk", "Staff Terminal", or "Manager Terminal" as appropriate.',
            'Enable Kiosk Mode in the setup panel — the device will lock to its assigned routes.',
            'Use a staff, manager, or admin PIN to unlock kiosk mode if needed.',
          ]}
        />

        <PlatformCard
          icon="🔐"
          title="Device Assignment"
          steps={[
            'Log in as manager or admin.',
            'Navigate to /kiosk-setup.',
            'Set a unique Device ID (e.g. ipad-bar-01, kiosk-lobby-1).',
            'Set the Venue ID to match your venue (e.g. novee-grand-lounge).',
            'Choose the correct Device Type for the role of this terminal.',
            'Enable Kiosk Mode if the device should be locked to its assigned routes.',
            'Tap Save Configuration. The device will register with the backend.',
          ]}
        />

        <PlatformCard
          icon="🔑"
          title="Staff / Admin Unlock"
          steps={[
            'If a device is in kiosk mode, a "Staff Unlock" button appears on restricted screens.',
            'Tap Staff Unlock and enter a valid staff, manager, or admin PIN.',
            'The device temporarily unlocks for that session.',
            'To fully disable kiosk mode: go to /kiosk-setup and tap "Disable Kiosk Mode".',
          ]}
        />

        <PlatformCard
          icon="🛠️"
          title="Troubleshooting"
          steps={[
            'App shows blank screen: hard-refresh (Cmd+Shift+R / Ctrl+Shift+R) or clear browser cache.',
            'Can\'t reach backend: go to /offline to see what still works locally.',
            'Stuck in boot screen: tap the "Activate" button if it appears after 8 seconds.',
            'PIN rejected: confirm with your manager that the PIN is active and not locked out.',
            'Kiosk mode won\'t disable: use staff unlock, then navigate to /kiosk-setup.',
            'PWA icon missing: ensure you added the app via Safari/Chrome, not a third-party browser.',
            'Contact your NOVEE venue coordinator for additional support.',
          ]}
        />

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/device-status')} style={{ flex: '1 1 160px', background: GOLD, color: DARK, border: 'none', padding: '0.875rem', borderRadius: '6px', fontFamily: 'Georgia, serif', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600, minHeight: '48px' }}>
            Device Status
          </button>
          <button onClick={() => navigate('/')} style={{ flex: '1 1 160px', background: 'transparent', border: `1px solid ${GOLD}25`, color: `${GOLD}66`, padding: '0.875rem', borderRadius: '6px', fontFamily: 'Georgia, serif', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', minHeight: '48px' }}>
            Return Home
          </button>
        </div>

      </div>
    </div>
  )
}
