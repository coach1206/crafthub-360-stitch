/* Circular score ring — SVG-based, DESIGN.md Obsidian Glass style */
export default function ScoreRing({ score = 94, max = 100, size = 120, strokeWidth = 8, label = 'Score' }) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const pct = score / max
  const dash = pct * circ
  const cx = size / 2
  const cy = size / 2

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="rgba(122,122,122,0.15)"
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="#D4AF37"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.5))' }}
        />
      </svg>
      {/* Center text */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600, fontSize: size * 0.22, color: '#D4AF37', lineHeight: 1 }}>{score}</span>
        <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: size * 0.09, color: '#7A7A7A', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>{label}</span>
      </div>
    </div>
  )
}
