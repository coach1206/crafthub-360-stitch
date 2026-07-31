# 09 — Reload and Resume Proof

Verified live in `verify-smokecraft-required-interaction-package-b-browser.mjs` (real Chromium via Playwright):

- **Leave and return**: after rating 2 of 6 categories and saving, navigating to an unrelated route and back restores the rated categories from the server draft.
- **Genuine hard reload** (`page.reload()`): restores the rated categories from the server draft.
- **Completion survives reload**: after completing the scorecard, navigating away and performing a genuine hard reload, the server confirms `completedSessions` still contains `'scorecard'` (not a localStorage-only claim).
- **Next-step unlock**: completion navigates to the real next route (`/smokecraft/ai-summary`), confirmed via `page.url()`.
