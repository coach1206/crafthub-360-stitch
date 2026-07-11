let _injected = false

export function injectScResponsiveVars() {
  if (_injected || typeof document === 'undefined') return
  _injected = true
  const style = document.createElement('style')
  style.id = 'sc-responsive-vars'
  style.textContent = `
    :root {
      --sc-bottom-nav-h: clamp(64px, 8.5vh, 104px);
      --sc-cta-h: clamp(64px, 7vw, 96px);
      --sc-btn-h: clamp(52px, 5.5vw, 72px);
      --sc-touch-min: clamp(44px, 4.5vw, 64px);
      --sc-safe-pad: clamp(8px, 1.2vw, 20px);
    }
    @media (max-width: 1365px) {
      :root {
        --sc-bottom-nav-h: clamp(64px, 8vh, 80px);
        --sc-cta-h: clamp(60px, 6.5vw, 80px);
        --sc-btn-h: clamp(48px, 5vw, 64px);
        --sc-touch-min: clamp(44px, 4vw, 56px);
        --sc-safe-pad: clamp(6px, 1vw, 14px);
      }
    }
    @media (min-width: 1366px) and (max-width: 1600px) {
      :root {
        --sc-bottom-nav-h: clamp(72px, 8.5vh, 92px);
        --sc-cta-h: clamp(64px, 6.8vw, 88px);
        --sc-btn-h: clamp(52px, 5.2vw, 68px);
        --sc-touch-min: clamp(48px, 4.2vw, 60px);
        --sc-safe-pad: clamp(8px, 1.1vw, 16px);
      }
    }
    @media (min-width: 1601px) {
      :root {
        --sc-bottom-nav-h: clamp(80px, 9vh, 104px);
        --sc-cta-h: clamp(72px, 7vw, 96px);
        --sc-btn-h: clamp(60px, 5.5vw, 72px);
        --sc-touch-min: clamp(56px, 4.5vw, 64px);
        --sc-safe-pad: clamp(12px, 1.2vw, 20px);
      }
    }
  `
  document.head.appendChild(style)
}
