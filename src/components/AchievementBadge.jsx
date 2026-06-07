/* Hexagonal or circular achievement badge */
export default function AchievementBadge({ icon, label, earned = true, count }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: earned ? 1 : 0.25 }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: earned
          ? 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.08))'
          : 'rgba(122,122,122,0.08)',
        border: `2px solid ${earned ? 'rgba(212,175,55,0.5)' : 'rgba(122,122,122,0.2)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28,
        boxShadow: earned ? '0 0 16px rgba(212,175,55,0.2)' : 'none',
        position: 'relative',
      }}>
        {icon}
        {count !== undefined && (
          <div style={{
            position: 'absolute', top: -4, right: -4,
            background: '#D4AF37', color: '#010101',
            borderRadius: '50%', width: 20, height: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, fontSize: 9,
          }}>{count}</div>
        )}
      </div>
      <span style={{
        fontFamily: '"JetBrains Mono",monospace', fontSize: 9,
        color: earned ? '#D4AF37' : '#7A7A7A',
        letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center',
        maxWidth: 68, lineHeight: 1.3,
      }}>{label}</span>
    </div>
  )
}
