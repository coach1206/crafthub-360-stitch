import { useDemoMode } from '../../context/DemoModeContext.jsx'

/**
 * Small fixed banner shown whenever demo mode is bypassing real gating
 * (e.g. VisitLockGuard letting a demo user preview a locked visit).
 * Purely informational — renders nothing outside demo mode.
 */
export default function DemoModeBanner() {
  const { isDemoMode } = useDemoMode()
  if (!isDemoMode) return null

  return (
    <div
      className="fixed top-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-full border font-label-sm text-label-sm uppercase tracking-widest"
      style={{
        padding: '8px 18px',
        background: 'rgba(233,193,118,0.12)',
        borderColor: 'rgba(233,193,118,0.4)',
        color: '#e9c176',
        backdropFilter: 'blur(12px)',
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
      Demo preview only — progression not saved
    </div>
  )
}
