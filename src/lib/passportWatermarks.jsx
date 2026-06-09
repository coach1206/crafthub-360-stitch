/* ─────────────────────────────────────────────────────────────
   Passport Watermark Component Library
   All elements are pure SVG/CSS — no external image assets.
   These are meant to sit behind content at very low opacity.
───────────────────────────────────────────────────────────── */

const GOLD = '#B98A36'
const NAVY = '#102B46'

/* ══ Globe ═══════════════════════════════════════════════════ */
export function WmGlobe({ size = 220, opacity = 0.08, color = GOLD }) {
  const cx = size / 2, r = cx - 6
  const lat = [-60,-40,-20,0,20,40,60]
  const lon = [-60,-30,0,30,60]
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ opacity, display:'block', flexShrink:0 }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={1.2}/>
      {/* Latitude lines */}
      {lat.map(deg => {
        const y = cx + (deg/90)*r
        const hw = Math.sqrt(Math.max(0, r*r - (y-cx)*(y-cx)))
        return hw > 2
          ? <line key={`lat${deg}`} x1={cx-hw} y1={y} x2={cx+hw} y2={y}
              stroke={color} strokeWidth={0.5} opacity={0.7}/>
          : null
      })}
      {/* Longitude ellipses */}
      {lon.map(deg => {
        const rx = r * Math.abs(Math.cos(deg * Math.PI/180))
        return rx > 2
          ? <ellipse key={`lon${deg}`} cx={cx} cy={cx} rx={rx} ry={r}
              fill="none" stroke={color} strokeWidth={0.5} opacity={0.7}/>
          : null
      })}
      {/* Center 360 mark */}
      <text x={cx} y={cx+5} textAnchor="middle"
        fontFamily='"JetBrains Mono",monospace' fontSize={size*0.085}
        fontWeight={700} fill={color} opacity={0.8}>360</text>
    </svg>
  )
}

/* ══ Official Seal ════════════════════════════════════════════ */
export function WmSeal({ size = 180, opacity = 0.09, color = GOLD }) {
  const cx = size/2, r1 = cx-4, r2 = cx-12, r3 = cx-22
  const text = '  360 PASSPORT CONNECTIONS · VERIFIED · '
  const chars = text.split('')
  const total = chars.length
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ opacity, display:'block', flexShrink:0 }}>
      {/* Outer rings */}
      <circle cx={cx} cy={cx} r={r1} fill="none" stroke={color} strokeWidth={1.2}/>
      <circle cx={cx} cy={cx} r={r2} fill="none" stroke={color} strokeWidth={0.6}/>
      <circle cx={cx} cy={cx} r={r3} fill="none" stroke={color} strokeWidth={0.5}/>
      {/* Text around ring */}
      <defs>
        <path id={`seal-arc-${size}`} d={`M ${cx-r2*0.9},${cx} a ${r2*0.9},${r2*0.9} 0 1,1 0.001,0`}/>
      </defs>
      <text fontFamily='"JetBrains Mono",monospace' fontSize={size*0.047} fill={color} letterSpacing={1.4}>
        <textPath href={`#seal-arc-${size}`}>{text}</textPath>
      </text>
      {/* Star burst center */}
      {[...Array(8)].map((_,i) => {
        const a = (i * 45) * Math.PI/180
        const x1 = cx + Math.cos(a)*8, y1 = cx + Math.sin(a)*8
        const x2 = cx + Math.cos(a)*(r3-6), y2 = cx + Math.sin(a)*(r3-6)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={0.6} opacity={0.8}/>
      })}
      <circle cx={cx} cy={cx} r={9} fill="none" stroke={color} strokeWidth={0.7}/>
      <text x={cx} y={cx+4} textAnchor="middle"
        fontFamily='"JetBrains Mono",monospace' fontSize={size*0.065} fontWeight={700} fill={color}>360</text>
    </svg>
  )
}

/* ══ Guilloche Security Lines ═════════════════════════════════ */
export function WmGuilloche({ width = 400, height = 80, opacity = 0.05, color = GOLD }) {
  const lines = []
  for (let i = 0; i <= height; i += 6) {
    const amp = 6 + (i % 12)
    const freq = 0.018 + (i * 0.0002)
    let d = `M 0,${i}`
    for (let x = 0; x <= width; x += 4) {
      const y = i + amp * Math.sin(x * freq)
      d += ` L ${x},${y}`
    }
    lines.push(<path key={i} d={d} fill="none" stroke={color} strokeWidth={0.4} opacity={0.8}/>)
  }
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
      style={{ opacity, display:'block', width:'100%', height:height, overflow:'hidden' }}
      preserveAspectRatio="xMidYMid slice">
      {lines}
    </svg>
  )
}

/* ══ Passport Booklet Outline ═════════════════════════════════ */
export function WmBooklet({ width = 160, height = 120, opacity = 0.07, color = NAVY }) {
  return (
    <svg width={width} height={height} viewBox="0 0 160 120"
      style={{ opacity, display:'block', flexShrink:0 }}>
      {/* Cover */}
      <rect x={8} y={6} width={72} height={108} rx={5} fill="none" stroke={color} strokeWidth={1.2}/>
      <rect x={82} y={6} width={72} height={108} rx={5} fill="none" stroke={color} strokeWidth={1.2}/>
      {/* Spine */}
      <line x1={80} y1={6} x2={80} y2={114} stroke={color} strokeWidth={2}/>
      {/* Lines on left page */}
      {[30,42,54,66,78,90].map(y => (
        <line key={y} x1={16} y1={y} x2={72} y2={y} stroke={color} strokeWidth={0.5} opacity={0.6}/>
      ))}
      {/* Globe on right page */}
      <circle cx={118} cy={60} r={26} fill="none" stroke={color} strokeWidth={0.7}/>
      <ellipse cx={118} cy={60} rx={13} ry={26} fill="none" stroke={color} strokeWidth={0.5}/>
      <ellipse cx={118} cy={60} rx={26} ry={12} fill="none" stroke={color} strokeWidth={0.5}/>
      {/* Stamp mark */}
      <rect x={16} y={10} width={30} height={20} rx={2} fill="none" stroke={color} strokeWidth={0.7}/>
      <text x={31} y={24} textAnchor="middle" fontFamily="monospace" fontSize={7} fill={color} opacity={0.8}>360</text>
    </svg>
  )
}

/* ══ Stamp Ring ═══════════════════════════════════════════════ */
export function WmStampRing({ size = 100, opacity = 0.08, color = GOLD, label = 'VERIFIED' }) {
  const cx = size/2, r1 = cx-4, r2 = cx-12
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ opacity, display:'block', flexShrink:0 }}>
      <circle cx={cx} cy={cx} r={r1} fill="none" stroke={color} strokeWidth={1.3}
        strokeDasharray="4 2"/>
      <circle cx={cx} cy={cx} r={r2} fill="none" stroke={color} strokeWidth={0.7}/>
      <text x={cx} y={cx+3} textAnchor="middle"
        fontFamily='"JetBrains Mono",monospace' fontSize={size*0.11} fontWeight={700} fill={color}>{label}</text>
    </svg>
  )
}

/* ══ Ledger Lines (credential log / activity) ════════════════ */
export function WmLedger({ height = 200, opacity = 0.06, color = GOLD }) {
  const rows = []
  for (let y = 18; y < height; y += 18) {
    rows.push(<line key={y} x1={0} y1={y} x2="100%" y2={y} stroke={color} strokeWidth={0.6}/>)
  }
  return (
    <svg width="100%" height={height} viewBox={`0 0 400 ${height}`}
      preserveAspectRatio="none" style={{ opacity, display:'block', position:'absolute', inset:0 }}>
      {rows}
      {/* Left margin line */}
      <line x1={28} y1={0} x2={28} y2={height} stroke={color} strokeWidth={0.8} opacity={0.7}/>
    </svg>
  )
}

/* ══ Security Dot Grid ════════════════════════════════════════ */
export function WmDotGrid({ opacity = 0.04, color = GOLD }) {
  return (
    <svg width="100%" height="100%" style={{ position:'absolute', inset:0, opacity, pointerEvents:'none' }}>
      <defs>
        <pattern id="dotgrid" x={0} y={0} width={16} height={16} patternUnits="userSpaceOnUse">
          <circle cx={8} cy={8} r={0.9} fill={color}/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dotgrid)"/>
    </svg>
  )
}

/* ══ Rosette / Banknote Center Ornament ══════════════════════ */
export function WmRosette({ size = 80, opacity = 0.07, color = GOLD }) {
  const cx = size/2
  const petals = 12
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ opacity, display:'block', flexShrink:0 }}>
      {[...Array(petals)].map((_,i) => {
        const a = (i/petals)*Math.PI*2
        const x1 = cx + Math.cos(a)*6, y1 = cx + Math.sin(a)*6
        const x2 = cx + Math.cos(a)*(cx-5), y2 = cx + Math.sin(a)*(cx-5)
        const mx = cx + Math.cos(a+Math.PI/petals)*(cx*0.55)
        const my = cx + Math.sin(a+Math.PI/petals)*(cx*0.55)
        return (
          <path key={i}
            d={`M ${x1},${y1} Q ${mx},${my} ${x2},${y2}`}
            fill="none" stroke={color} strokeWidth={0.55}/>
        )
      })}
      <circle cx={cx} cy={cx} r={5} fill="none" stroke={color} strokeWidth={0.8}/>
    </svg>
  )
}

/* ══ Coordinate / Travel Lines ════════════════════════════════ */
export function WmTravelLines({ width = 300, height = 100, opacity = 0.05, color = NAVY }) {
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
      style={{ opacity, display:'block', width:'100%', overflow:'hidden' }}>
      {/* Arc paths */}
      <path d="M 0,80 Q 75,20 150,60 Q 225,90 300,30"
        fill="none" stroke={color} strokeWidth={0.7} strokeDasharray="6 4"/>
      <path d="M 0,40 Q 100,70 200,25 Q 260,10 300,50"
        fill="none" stroke={color} strokeWidth={0.5} strokeDasharray="4 6"/>
      {/* Dot stops */}
      {[30,90,160,240].map(x => (
        <circle key={x} cx={x} cy={x===90?45:x===160?42:x===30?65:38} r={2.5}
          fill="none" stroke={color} strokeWidth={0.8}/>
      ))}
    </svg>
  )
}
