/**
 * PinPad — tactile numeric keypad for PIN entry.
 * Used on AdminLogin and FounderLogin.
 *
 * Props:
 *   value      — current PIN string
 *   onChange   — (newPin: string) => void
 *   maxLength  — max digits (default 8)
 *   disabled   — grays out all keys
 */

const GOLD   = '#C9A84C'
const DARK   = 'rgba(10,6,1,0.97)'
const BORDER = 'rgba(201,168,76,0.18)'

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫']

function Key({ label, onPress, disabled, wide }) {
  const isEmpty = label === ''
  return (
    <button
      type="button"
      onClick={() => !disabled && !isEmpty && onPress(label)}
      disabled={disabled || isEmpty}
      style={{
        aspectRatio:     '1 / 1',
        background:      isEmpty ? 'transparent' :
                         label === '⌫' ? 'rgba(201,168,76,0.04)' :
                         'rgba(201,168,76,0.06)',
        border:          isEmpty ? 'none' : `1px solid ${label === '⌫' ? 'rgba(201,168,76,0.10)' : BORDER}`,
        borderRadius:    '8px',
        color:           isEmpty ? 'transparent' :
                         label === '⌫' ? 'rgba(201,168,76,0.5)' : GOLD,
        cursor:          disabled || isEmpty ? 'default' : 'pointer',
        fontFamily:      'Georgia, serif',
        fontSize:        label === '⌫' ? '18px' : '20px',
        fontWeight:      label === '⌫' ? 400 : 500,
        letterSpacing:   '0.05em',
        transition:      'background 0.1s, transform 0.08s',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        userSelect:      'none',
        WebkitTapHighlightColor: 'transparent',
        minHeight:       '52px',
        opacity:         disabled ? 0.35 : 1,
      }}
      onMouseDown={e => {
        if (!disabled && !isEmpty) e.currentTarget.style.background =
          label === '⌫' ? 'rgba(201,168,76,0.10)' : 'rgba(201,168,76,0.14)'
      }}
      onMouseUp={e => {
        e.currentTarget.style.background =
          isEmpty ? 'transparent' :
          label === '⌫' ? 'rgba(201,168,76,0.04)' : 'rgba(201,168,76,0.06)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background =
          isEmpty ? 'transparent' :
          label === '⌫' ? 'rgba(201,168,76,0.04)' : 'rgba(201,168,76,0.06)'
      }}
      onTouchStart={e => {
        if (!disabled && !isEmpty) e.currentTarget.style.background =
          label === '⌫' ? 'rgba(201,168,76,0.10)' : 'rgba(201,168,76,0.14)'
      }}
      onTouchEnd={e => {
        e.currentTarget.style.background =
          isEmpty ? 'transparent' :
          label === '⌫' ? 'rgba(201,168,76,0.04)' : 'rgba(201,168,76,0.06)'
      }}
    >
      {label}
    </button>
  )
}

export default function PinPad({ value = '', onChange, maxLength = 8, disabled = false }) {
  const handleKey = (key) => {
    if (key === '⌫') {
      onChange(value.slice(0, -1))
    } else {
      if (value.length < maxLength) onChange(value + key)
    }
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Dot display */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            '10px',
        marginBottom:   '16px',
        minHeight:      '20px',
      }}>
        {value.length === 0 ? (
          <span style={{
            color:         'rgba(201,168,76,0.2)',
            fontSize:      '11px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}>
            Enter PIN
          </span>
        ) : (
          Array.from({ length: maxLength <= 4 ? maxLength : Math.max(value.length, 4) }).map((_, i) => (
            <span
              key={i}
              style={{
                width:        i < value.length ? '10px' : '8px',
                height:       i < value.length ? '10px' : '8px',
                borderRadius: '50%',
                background:   i < value.length ? GOLD : 'rgba(201,168,76,0.15)',
                border:       i < value.length ? 'none' : '1px solid rgba(201,168,76,0.25)',
                transition:   'all 0.15s',
                display:      'inline-block',
                flexShrink:   0,
              }}
            />
          ))
        )}
      </div>

      {/* Key grid */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap:                 '8px',
      }}>
        {KEYS.map((k, i) => (
          <Key
            key={i}
            label={k}
            onPress={handleKey}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  )
}
