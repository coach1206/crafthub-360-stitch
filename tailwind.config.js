/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background:                  '#131313',
        surface:                     '#131313',
        'surface-dim':               '#131313',
        'surface-container':         '#201f1f',
        'surface-container-low':     '#1c1b1b',
        'surface-container-high':    '#2a2a2a',
        'surface-container-highest': '#353534',
        'surface-bright':            '#3a3939',
        'on-background':             '#e5e2e1',
        'on-surface':                '#e5e2e1',
        'on-surface-variant':        '#d0c5af',
        primary:                     '#f2ca50',
        'primary-container':         '#d4af37',
        'primary-fixed':             '#ffe088',
        'on-primary':                '#3c2f00',
        'on-primary-container':      '#554300',
        'outline-variant':           '#4d4635',
        'secondary-container':       '#474746',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body:    ['Manrope', 'sans-serif'],
        label:   ['"Space Grotesk"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      keyframes: {
        shimmer: {
          '0%':   { transform: 'translateX(-100%) rotate(45deg)' },
          '100%': { transform: 'translateX(100%) rotate(45deg)' },
        },
        'glow-pulse': {
          '0%':   { boxShadow: '0 0 5px rgba(212,175,55,0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(212,175,55,0.5)' },
        },
      },
      animation: {
        shimmer:     'shimmer 3s infinite linear',
        'glow-pulse': 'glow-pulse 2s infinite alternate',
      },
    },
  },
  plugins: [],
}
