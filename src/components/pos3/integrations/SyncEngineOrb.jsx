/**
 * Central POS3 Sync Engine orb for the Integrations Hub Sync Engine panel.
 * Dark dimensional ring with gold rim and glow, matching the approved target
 * image public/smokecraft/images/POS 3 Intergration hub.png.
 * Pulse animation is purely decorative CSS; disabled when reducedMotion is true.
 */
export default function SyncEngineOrb({ connectedCount, totalCount, reducedMotion = false }) {
  return (
    <div style={{ position: 'relative', width: 184, height: 184, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: -16, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,149,44,0.45) 0%, rgba(201,149,44,0.12) 55%, transparent 75%)',
          animation: reducedMotion ? 'none' : 'syncOrbPulse 3.2s ease-in-out infinite',
        }}
      />
      <div style={{
        width: 184, height: 184, borderRadius: '50%',
        background: 'radial-gradient(circle at 50% 35%, #1c2230 0%, #0c0f14 70%)',
        border: '2px solid #c9952c', boxShadow: '0 0 0 6px rgba(201,149,44,0.14), 0 14px 34px rgba(0,0,0,0.55), inset 0 0 26px rgba(201,149,44,0.18)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1, textAlign: 'center', padding: 8,
      }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, color: '#c9952c', letterSpacing: '0.06em' }}>POS3</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.15 }}>SYNC ENGINE</div>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#5fd98a', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5fd98a', display: 'inline-block' }} />
          {connectedCount} CONNECTED
        </div>
        <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Real-time bi-directional sync</div>
      </div>
      <style>{`@keyframes syncOrbPulse { 0%,100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.07); opacity: 1; } }`}</style>
    </div>
  )
}
