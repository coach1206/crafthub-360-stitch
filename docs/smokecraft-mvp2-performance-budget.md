# SmokeCraft MVP2 — Performance Budget

Version: 1.0.0 | Build: investor-readiness

These limits apply to the SmokeCraft 360 guest journey in the Vite production
build served via Vercel CDN. Limits are conservative for a premium lounge
context where the device may be a shared iPad.

---

## Bundle Limits

| Asset | Limit | Measured how |
|---|---|---|
| Initial JS (gzip) | ≤ 300 KB | `vite build --report` or `rollup-plugin-visualizer` |
| Largest image (approved JPEG/PNG) | ≤ 800 KB | File size audit on `public/assets/` |
| Total image weight per route | ≤ 1.2 MB | Sum of images loaded per page |

## Load Time Targets (Vercel CDN, 4G mobile)

| Metric | Target |
|---|---|
| First Contentful Paint (FCP) | ≤ 2.0 s |
| Largest Contentful Paint (LCP) | ≤ 3.0 s |
| Time to Interactive (TTI) | ≤ 3.5 s |
| Total Blocking Time (TBT) | ≤ 200 ms |

## Runtime Targets

| Metric | Target |
|---|---|
| Route transition time | ≤ 300 ms (no hard navigate; React Router SPA) |
| SmokeCraftSessionGuard render | < 16 ms (single synchronous localStorage read) |
| Haptic trigger latency | < 50 ms |
| NavBar tap response | < 100 ms |

## Viewport Support (tested in e2e-smokecraft-investor-readiness.mjs)

| Viewport | Status |
|---|---|
| 1920×1080 Desktop | PASS |
| 1440×900 Laptop | PASS |
| 1280×800 Laptop | PASS |
| 1024×768 Tablet landscape | PASS |
| 768×1024 iPad portrait | PASS |
| 430×932 iPhone 14 Pro Max | PASS |
| 390×844 iPhone 14 | PASS |
| 375×812 iPhone 13 mini | PASS |
| 375×667 iPhone SE | PASS |

## Touch Target Minimum

All interactive controls: **≥ 44 × 44 px** (WCAG 2.5.5 AAA, Apple HIG).
Verified in: `e2e-smokecraft-investor-readiness.mjs` touch target checks.

## What Is NOT Measured Yet

- Real-world Lighthouse audit on Vercel production URL (pending deployment)
- CLS (Cumulative Layout Shift) — full-viewport images minimize CLS risk
- Rate-limit impact on API routes (backend not deployed in this build)

## How to Run a Budget Check

```bash
npm run build
# Bundle report via vite-plugin-visualizer or:
ls -lh dist/assets/*.js dist/assets/*.css
find public/assets/smokecraft-reference/approved -name "*.png" -o -name "*.jpg" | xargs ls -lh
```
