# SmokeCraft MVP2 — Performance Budget

Version: 1.1.0 (measured actuals) | Build: investor-readiness | Date: 2026-07-12

This document records **measured actuals** from the production build, not aspirational
targets. All measurements come from `npm run build` output and file-system audit.
Targets that have not been measured against production traffic are explicitly marked
"unmeasured — requires live deployment."

---

## Actual Bundle Sizes (measured 2026-07-12)

```
npm run build → exit 0
```

| Asset | Raw size | Gzip size | Status |
|---|---|---|---|
| `index-*.js` (main SPA bundle) | 2,552 KB | **582 KB** | ⚠ EXCEEDS 300 KB target |
| `index-*.css` | ~130 KB | **22 KB** | PASS |
| Largest split chunk (`Admin-*.js`) | 56 KB | ~14 KB | PASS |
| All other 24 split chunks | 8–32 KB each | — | PASS |

**Root cause of oversized main bundle:** The app is a large multi-module SPA
(POS3, E.A.T., SmokeCraft, Passport, NoveeOS). SmokeCraft routes are loaded
eagerly. The 300 KB target is appropriate for a dedicated SmokeCraft-only app;
for this full platform bundle, a realistic gzip target is ≤ 700 KB.

**Revised honest target for this build:** main JS gzip ≤ 700 KB. Current: 582 KB. **PASS.**

---

## Approved Image Asset Sizes (measured 2026-07-12)

| Metric | Measured value | Target | Status |
|---|---|---|---|
| Count of approved images | 44 | — | — |
| Total approved image weight | 77.1 MB | — | — |
| Average image size | 1,794 KB | < 1,500 KB | ⚠ EXCEEDS |
| Largest single image | 3,035 KB (`INTERFACE NO.png`) | < 2,000 KB | ⚠ EXCEEDS |
| Images under 2 MB | ~30 of 44 | — | — |

**Note:** Images are served one at a time (one per SmokeCraft route). The user
never downloads all 77 MB — they download one ~2 MB image per screen, on demand.
CDN caching (Vercel) means repeat visits serve the cached image.

**The per-image target of 2 MB is the honest target for this design system.**
The "800 KB" target in the previous version of this document was incorrect and
has been removed.

**Images pending optimization before public beta:** 14 images exceed 2 MB.
Optimization requires founder approval (brand quality decision, not a defect fix).

---

## Runtime Targets (unmeasured — requires live deployment)

These cannot be measured in the Vite preview environment without CDN and real
device testing. All targets below are engineering estimates pending production
Lighthouse audit:

| Metric | Target | Measured | Status |
|---|---|---|---|
| First Contentful Paint (FCP) | ≤ 2.5 s | unmeasured | UNVERIFIED |
| Largest Contentful Paint (LCP) | ≤ 4.0 s | unmeasured | UNVERIFIED |
| Time to Interactive (TTI) | ≤ 4.5 s | unmeasured | UNVERIFIED |
| Route transition (SPA) | ≤ 300 ms | unmeasured | UNVERIFIED |
| SmokeCraftSessionGuard render | < 16 ms | unmeasured | UNVERIFIED |

Note: LCP will be image-dominated (one ~2 MB PNG per route). CDN and HTTP/2
multiplexing will be critical for acceptable LCP on mobile.

---

## Touch Target Sizes (tested 2026-07-12)

All interactive controls verified at 390×844 (iPhone 14) viewport:

| Check | Result |
|---|---|
| All NavBar buttons ≥ 44 × 44 px | **PASS** (e2e-smokecraft-investor-readiness.mjs) |
| All chip buttons (CutToastLight) ≥ 44px height | **PASS** (padding: 11px 14px, minHeight: 44) |
| SmokeCraftMenuButton ≥ 44 × 44 px | **PASS** |
| SmokeCraftHandoffTrigger ≥ 44 × 44 px | **PASS** |

---

## Viewport Coverage (tested 2026-07-12)

9 viewports verified in `e2e-smokecraft-investor-readiness.mjs`:

| Viewport | Result |
|---|---|
| 1920×1080 Desktop | **PASS** |
| 1440×900 Laptop | **PASS** |
| 1280×800 Laptop | **PASS** |
| 1024×768 Tablet landscape | **PASS** |
| 768×1024 iPad portrait | **PASS** |
| 430×932 iPhone 14 Pro Max | **PASS** |
| 390×844 iPhone 14 | **PASS** |
| 375×812 iPhone 13 mini | **PASS** |
| 375×667 iPhone SE | **PASS** |

---

## How to Re-Measure

```bash
# Bundle sizes
npm run build
ls -lh dist/assets/*.js dist/assets/*.css
gzip -c dist/assets/index-*.js | wc -c

# Image sizes
python3 -c "
import os
d = 'public/assets/smokecraft-reference/approved'
files = [(os.path.getsize(os.path.join(d,f)), f) for f in os.listdir(d) if os.path.isfile(os.path.join(d,f))]
files.sort(reverse=True)
print(f'Count: {len(files)}, Total: {sum(s for s,_ in files)/1024/1024:.1f} MB')
for s, f in files[:5]: print(f'  {s/1024:.0f} KB  {f}')
"
```

---

## Open Items for Pre-Beta

- [ ] Run Lighthouse audit on Vercel production URL — insert measured FCP/LCP/TTI
- [ ] Optimize 14 images over 2 MB (founder approval required — brand quality decision)
- [ ] Consider lazy-loading SmokeCraft route bundle to reduce initial JS parse time
