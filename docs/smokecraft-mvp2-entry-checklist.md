# SmokeCraft MVP2 — Feature Entry Checklist

Use this checklist before starting any new feature or change to the SmokeCraft
360 guest flow. Every item must be checked before a pull request is opened.

---

## Intake Gate (fill out for every PR)

- [ ] **Route exists** — added to App.jsx under the `/smokecraft` parent route
- [ ] **Session guard** — if journey step, wrapped in `SmokeCraftSessionGuard sessionNumber={N}`
- [ ] **Session number correct** — not duplicated, not skipped, verified in `smokecraftMvp2MasterRegistry.js`
- [ ] **Asset approved** — image lives in `public/assets/smokecraft-reference/approved/` OR is documented in `mvp2-visual-image-registry.md`
- [ ] **Asset loads** — `SmokeCraftAssetScreen` src path returns HTTP 200 in `npm run preview`
- [ ] **NavBar present** — page uses `SmokeCraftNavBar`, not inline fixed buttons
- [ ] **No visible hotspot pills** — no `.sc-cta-pill` or `SmokeCraftHotspotLayer` in production path
- [ ] **Touch targets ≥ 44px** — all buttons pass 44×44 minimum (checked at 390×844)
- [ ] **No overlap** — no interactive controls overlap the NavBar or each other at iPhone 14 viewport
- [ ] **No fake data** — no hardcoded scores, XP, or stats presented as live data
- [ ] **Feature flag** — if controlled by a flag, flag default is correct and documented in `smokecraftFeatureFlagContract.js`
- [ ] **Data contract** — if new data shape introduced, a contract file exists in `src/modules/smokecraft/data/`
- [ ] **e2e coverage** — `e2e-smokecraft-investor-readiness.mjs` updated to cover the new route/step

## Change-Control Rules (must not be violated)

- Do not delete approved images
- Do not rename files in the `approved/` folder
- Do not change the SmokeCraft flow order (session numbers are fixed)
- Do not skip Pairing Lab or Final Review
- Do not replace the image-first design system
- Do not remove live React overlays
- Do not convert pages into static screenshots
- Do not make invisible hotspots visible in production
- Do not hardcode placeholder data if admin configuration should provide it
- Do not fake live hardware, POS, voice, payment, sensor, inventory, or API integrations
- Do not redesign the brand (dark/gold/obsidian style is locked)

## Definition of Done (all must be true before merge)

- [ ] All e2e tests pass: `node e2e-smokecraft-investor-readiness.mjs` → 300/300
- [ ] `npm run build` exits 0
- [ ] No new console errors at the affected routes
- [ ] PR reviewed by at least one other contributor OR self-reviewed with this checklist signed off
- [ ] Commit message references the requirement (e.g., "R14: add performance budget")
