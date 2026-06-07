/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* True Obsidian base — DESIGN.md */
        obsidian:      '#010101',
        'obs-surface': '#0F0F0F',
        'obs-card':    '#141414',
        /* Warm Gold */
        gold:          '#D4AF37',
        'gold-dim':    '#B8962E',
        'gold-bright': '#F2CA50',
        /* Brushed Titanium */
        titanium:      '#7A7A7A',
        'titanium-dim':'rgba(122,122,122,0.2)',
        /* On-surface */
        'on-base':     '#E5E2E1',
        'on-muted':    '#A09A8E',
      },
      fontFamily: {
        display: ['"Hanken Grotesk"', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        'display-lg': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em' }],
        'headline-lg': ['32px', { lineHeight: '40px' }],
        'headline-md': ['24px', { lineHeight: '32px' }],
        'body-md':  ['16px', { lineHeight: '24px' }],
        'body-sm':  ['14px', { lineHeight: '20px' }],
        'label':    ['12px', { lineHeight: '16px', letterSpacing: '0.1em' }],
        'telemetry':['18px', { lineHeight: '24px' }],
      },
      backdropBlur: { glass: '20px' },
      keyframes: {
        'gold-pulse': {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(212,175,55,0.4)' },
          '50%':      { boxShadow: '0 0 0 6px rgba(212,175,55,0)' },
        },
        'ping-gold': {
          '75%,100%': { transform: 'scale(2)', opacity: '0' },
        },
      },
      animation: {
        'gold-pulse': 'gold-pulse 2s ease-in-out infinite',
        'ping-gold':  'ping-gold 1.5s cubic-bezier(0,0,0.2,1) infinite',
      },
    },
  },
  plugins: [],
}
