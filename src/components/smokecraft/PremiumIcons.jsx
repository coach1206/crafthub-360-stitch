// Local, dependency-free icon set used in place of Google's Material Symbols font
// for any icon that is the *primary* visual identity of a card/badge. These render
// as real vector shapes regardless of network access or font availability — no
// external font, no remote request, no fallback text.

function Svg({ children, size = 22, viewBox = '0 0 24 24', ...rest }) {
  return (
    <svg width={size} height={size} viewBox={viewBox} fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
      {children}
    </svg>
  )
}

export function CheckIcon(props) {
  return (
    <Svg {...props}>
      <path d="M5 12.5L9.5 17L19 7" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function ChevronRightIcon(props) {
  return (
    <Svg {...props}>
      <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function LeafIcon(props) {
  return (
    <Svg {...props}>
      <path d="M5 19c0-7.5 4-13 14-14-1 10-6.5 14-14 14z" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M6 18C9 14 12.5 11 17.5 7.2" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  )
}

export function DropIcon(props) {
  return (
    <Svg {...props}>
      <path d="M12 3.5c3.2 4 6 7.4 6 10.8a6 6 0 11-12 0c0-3.4 2.8-6.8 6-10.8z" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  )
}

export function StoreIcon(props) {
  return (
    <Svg {...props}>
      <path d="M4 9.5L5.2 4h13.6L20 9.5" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M4.5 9.5v9h15v-9" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M9.5 18.5v-5h5v5" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
    </Svg>
  )
}

export function CigarIcon(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="11" width="14" height="4.4" rx="2.2" stroke="currentColor" strokeWidth={1.5} />
      <path d="M17 13.2h2a1.6 1.6 0 010 3.2" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  )
}

export function ScissorsIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="6" cy="6.5" r="2" stroke="currentColor" strokeWidth={1.5} />
      <circle cx="6" cy="17.5" r="2" stroke="currentColor" strokeWidth={1.5} />
      <path d="M7.6 7.8L20 16M7.6 16.2L20 8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  )
}

export function FlameIcon(props) {
  return (
    <Svg {...props}>
      <path d="M12 3.5c1 2 3.5 3.4 3.5 6.6a3.5 3.5 0 11-7 0c0-1 .4-1.7.9-2.4.2 1 .9 1.5 1.4 1 .4-.4.2-1-.2-1.6-.9-1.4-.5-2.6 1.4-3.6z" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" />
    </Svg>
  )
}

export function GrillIcon(props) {
  return (
    <Svg {...props}>
      <ellipse cx="12" cy="9" rx="7.5" ry="3" stroke="currentColor" strokeWidth={1.5} />
      <path d="M6 10.5C6.3 14 9 17 12 17.5M18 10.5c-.3 3.5-3 6.5-6 7" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  )
}

export function InsightsIcon(props) {
  return (
    <Svg {...props}>
      <path d="M4 17l4.5-5 4 3L19 7" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="19" cy="7" r="1.4" fill="currentColor" />
    </Svg>
  )
}

export function CompassIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth={1.5} />
      <path d="M14.8 9.2l-1.6 4.4-4.4 1.6 1.6-4.4z" stroke="currentColor" strokeWidth={1.3} strokeLinejoin="round" />
    </Svg>
  )
}

export function SeedlingIcon(props) {
  return (
    <Svg {...props}>
      <path d="M12 21V12" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
      <path d="M12 12C12 12 6 11 6 6c5 0 6 4 6 6z" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" />
      <path d="M12 12c0 0 6-1 6-6-5 0-6 4-6 6z" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" />
    </Svg>
  )
}

export function FlaskIcon(props) {
  return (
    <Svg {...props}>
      <path d="M9.5 3.5h5M10 3.5v5.8L5.8 17a2 2 0 001.8 3h8.8a2 2 0 001.8-3L14 9.3V3.5" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M8.4 14.5h7.2" stroke="currentColor" strokeWidth={1.3} />
    </Svg>
  )
}

export function DiamondIcon(props) {
  return (
    <Svg {...props}>
      <path d="M5 9l3.5-5.5h7L19 9l-7 11.5z" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M5 9h14M9 3.8L12 9l-3-5.2zM15 3.8L12 9l3-5.2z" stroke="currentColor" strokeWidth={1.1} strokeLinejoin="round" />
    </Svg>
  )
}

export function CrateIcon(props) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="6" width="17" height="13" rx="1.4" stroke="currentColor" strokeWidth={1.5} />
      <path d="M3.5 10.5h17M9 6v4M15 6v4" stroke="currentColor" strokeWidth={1.3} />
    </Svg>
  )
}

export function StampIcon(props) {
  return (
    <Svg {...props}>
      <rect x="6" y="4" width="12" height="13" rx="1.4" stroke="currentColor" strokeWidth={1.5} />
      <path d="M9 8h6M9 11h6M9 14h4" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" />
      <path d="M8.5 20l3.5-2 3.5 2" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function CardIcon(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="6" width="18" height="12" rx="1.8" stroke="currentColor" strokeWidth={1.5} />
      <circle cx="8" cy="12" r="1.8" stroke="currentColor" strokeWidth={1.3} />
      <path d="M13 10.5h5M13 13.5h5" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" />
    </Svg>
  )
}

export function CrownIcon(props) {
  return (
    <Svg {...props}>
      <path d="M4 17l-1.4-8 4.4 3 3-5.5 3 5.5 4.4-3-1.4 8z" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" />
      <path d="M4 19h16" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  )
}

export function ArrowForwardIcon(props) {
  return (
    <Svg {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function ArrowBackIcon(props) {
  return (
    <Svg {...props}>
      <path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function ChevronDownIcon(props) {
  return (
    <Svg {...props}>
      <path d="M5 9l7 7 7-7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function DeckIcon(props) {
  return (
    <Svg {...props}>
      <path d="M4 8l8-4 8 4M4 8v9M20 8v9M4 17h16" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M8 6.5v10.5M16 6.5v10.5" stroke="currentColor" strokeWidth={1.3} />
    </Svg>
  )
}

export function GlassIcon(props) {
  return (
    <Svg {...props}>
      <path d="M6 4h12l-1.4 9.5a4.6 4.6 0 01-9.2 0z" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M12 13.7V20M8.5 20h7" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  )
}

export function MusicIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="7" cy="17" r="2.4" stroke="currentColor" strokeWidth={1.5} />
      <circle cx="16.5" cy="15" r="2.4" stroke="currentColor" strokeWidth={1.5} />
      <path d="M9.4 17V6l9.5-1.8V13" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" />
    </Svg>
  )
}

export function WeatherIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="9" r="3.4" stroke="currentColor" strokeWidth={1.5} />
      <path d="M13.5 16.5a4 4 0 100-8 4.3 4.3 0 00-1 .12" stroke="currentColor" strokeWidth={1.4} />
      <path d="M9 14.5h9.5a3 3 0 000-6" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" />
    </Svg>
  )
}

export function GroupsIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="8" r="2.6" stroke="currentColor" strokeWidth={1.5} />
      <circle cx="16" cy="9.5" r="2" stroke="currentColor" strokeWidth={1.4} />
      <path d="M4 18c0-3 2.2-5 5-5s5 2 5 5M14.5 13.5c2.3.2 4 1.9 4 4.5" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  )
}

export function MoodIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth={1.5} />
      <path d="M8.2 14c.9 1.4 2.2 2.2 3.8 2.2s2.9-.8 3.8-2.2" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
      <circle cx="8.7" cy="9.5" r="0.9" fill="currentColor" />
      <circle cx="15.3" cy="9.5" r="0.9" fill="currentColor" />
    </Svg>
  )
}

export function EventIcon(props) {
  return (
    <Svg {...props}>
      <rect x="4" y="5.5" width="16" height="14" rx="1.6" stroke="currentColor" strokeWidth={1.5} />
      <path d="M4 9.5h16M8 3.5v3.5M16 3.5v3.5" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
      <circle cx="12" cy="14" r="2" stroke="currentColor" strokeWidth={1.3} />
    </Svg>
  )
}

export function ShieldPersonIcon(props) {
  return (
    <Svg {...props}>
      <path d="M12 3l7 3v6c0 5-3.5 7.8-7 9-3.5-1.2-7-4-7-9V6z" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx="12" cy="10.5" r="2" stroke="currentColor" strokeWidth={1.3} />
      <path d="M8.6 15.2c.7-1.6 2-2.4 3.4-2.4s2.7.8 3.4 2.4" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" />
    </Svg>
  )
}
