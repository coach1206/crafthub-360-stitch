# 12 — Real-Browser Test Results

`verify-smokecraft-required-interaction-package-a-browser.mjs`, real Chromium via Playwright
against the running app (`/opt/pw-browsers/chromium`). **14/14 passed.**

Covers: Session 8 route load with real instructions; empty-submission client-side rejection;
real interaction + draft save + genuine reload + resume; real server-confirmed completion +
navigation; server-side XP total increase after completion; duplicate-click protection (no
duplicate completion record); Session 12 full real flow; Session 16 full real flow; an honest
offline error state (no fake success while offline); no horizontal layout cutoff at desktop and
tablet viewports; submit control remains reachable at tablet size; zero unexpected console
errors across the entire flow.

Raw results: `browser-results.json` (same directory).
