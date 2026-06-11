/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#E9C176',
        'primary-container': '#4E3700',
        'primary-fixed-dim': '#D8B86F',
        secondary: '#DAC1BB',
        surface: '#131314',
        'surface-container-low': '#171515',
        'surface-container-high': '#242120',
        'on-primary': '#201405',
        'on-surface': '#E5E2E3',
        'on-surface-variant': '#BEB7AE',
        outline: '#5C5146',
        'outline-variant': '#4B4036',
      },
      fontFamily: {
        'display-lg': ['Playfair Display', 'Georgia', 'serif'],
        'headline-xl': ['Playfair Display', 'Georgia', 'serif'],
        'headline-md': ['Playfair Display', 'Georgia', 'serif'],
        'label-lg': ['Montserrat', 'sans-serif'],
        'label-sm': ['Montserrat', 'sans-serif'],
        'body-lg': ['Montserrat', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['clamp(2.6rem, 7vw, 5.25rem)', { lineHeight: '1.02' }],
        'headline-xl': ['clamp(2rem, 4.5vw, 3.75rem)', { lineHeight: '1.05' }],
        'headline-md': ['clamp(1.15rem, 2.4vw, 1.75rem)', { lineHeight: '1.2' }],
        'label-lg': ['0.75rem', { lineHeight: '1.2' }],
        'label-sm': ['0.68rem', { lineHeight: '1.2' }],
        'body-lg': ['1.05rem', { lineHeight: '1.65' }],
      },
      spacing: {
        gutter: 'clamp(1rem, 4vw, 2.5rem)',
      },
      maxWidth: {
        'container-max-width': '1440px',
      },
    },
  },
  plugins: [],
}
