/**
 * Central glowing POS3 Sync Engine orb for the Integrations Hub hero area.
 * Pulse animation is purely decorative CSS; disabled when reducedMotion is true.
 */
export default function SyncEngineOrb({ connectedCount, totalCount, reducedMotion = false }) {
  return (
    <div style={{ position: 'relative', width: 168, height: 168, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,149,44,0.35) 0%, rgba(201,149,44,0.08) 60%, transparent 75%)',
          animation: reducedMotion ? 'none' : 'syncOrbPulse 3.2s ease-in-out infinite',
        }}
      />
      <div style={{
        width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(160deg, #fff 0%, #f3e6c8 100%)',
        border: '2px solid #c9952c', boxShadow: '0 8px 24px rgba(19,41,75,0.18), inset 0 0 18px rgba(201,149,44,0.18)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1,
      }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#9c7320', letterSpacing: '0.06em' }}>POS3</div>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#13294b' }}>Sync Engine</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#2f9e5b', marginTop: 2 }}>{connectedCount}/{totalCount} Connected</div>
      </div>
      <style>{`@keyframes syncOrbPulse { 0%,100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.08); opacity: 1; } }`}</style>
    </div>
  )
}
