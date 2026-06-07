/* Gamified XP / Progress bar */
export default function XPBar({ current = 2400, max = 3000, level = 12, tierLabel = 'FOUNDER', tierColor = '#D4AF37' }) {
  const pct = Math.min((current / max) * 100, 100)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, borderRadius: '50%',
            background: `linear-gradient(135deg, ${tierColor}, rgba(212,175,55,0.4))`,
            border: `1.5px solid ${tierColor}`,
            fontFamily: '"JetBrains Mono",monospace', fontWeight: 700,
            fontSize: 13, color: '#010101',
            boxShadow: `0 0 12px ${tierColor}55`,
          }}>{level}</div>
          <div>
            <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 600, fontSize: 14, color: '#E5E2E1', lineHeight: 1 }}>
              Level {level}
            </div>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: tierColor, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>
              {tierLabel}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600, fontSize: 16, color: tierColor }}>{current.toLocaleString()}</span>
          <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: '#7A7A7A' }}> / {max.toLocaleString()} XP</span>
        </div>
      </div>
      {/* Track */}
      <div style={{
        height: 6, borderRadius: 9999,
        background: 'rgba(122,122,122,0.15)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          borderRadius: 9999,
          background: `linear-gradient(90deg, ${tierColor}99, ${tierColor})`,
          boxShadow: `0 0 8px ${tierColor}88`,
          transition: 'width 1s ease',
        }} />
      </div>
      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A', marginTop: 6, textAlign: 'right', letterSpacing: '0.08em' }}>
        {max - current} XP to Level {level + 1}
      </div>
    </div>
  )
}
