# 12 — Root-Cause Findings

## Primary root cause

**Category L — LIVE ENVIRONMENT BLOCKER, compounded by Category H — STORAGE/PERSISTENCE (unhashed static assets).**

This session (and, by its own consistent documentation, every session across this entire operation) has **never had network access to `crafthub360.up.railway.app`, no Railway CLI, and no Railway dashboard credentials.** Every prior pass's local audit has repeatedly found the source code correct — and this pass's fresh re-verification (rebuilt production bundle, re-run route sweep, re-grepped for stale strings, re-traced every state authority) **again finds no live-reachable source defect.** The most defensible conclusion, given the evidence available, is that **the live discrepancies being reported are not proven to originate in source code at all** — they cannot be, because no session has ever been able to observe what is actually deployed and rendered at the production URL.

Two concrete, previously-undocumented, disclosed mechanisms make this plausible rather than merely a shrug:

1. **No proof the fix commits were ever deployed.** `/api/version` (a real endpoint, already built specifically for this purpose) has never been successfully queried by any session. If Railway's auto-deploy failed silently on any one of the many pushed commits, Railway's documented default behavior is to keep serving the last successful build — meaning a user could be looking at code from weeks/passes ago while this repository's `HEAD` has moved far ahead, and no evidence in this repository could reveal that.
2. **Unhashed static image assets with no cache-busting** (`11-PRODUCTION-BUNDLE-AUDIT.md`). Even assuming Railway *did* successfully redeploy every fix commit, any browser or CDN layer that previously cached an image URL by filename (e.g., `/assets/smokecraft/Venue Selection 11.png`) has no signal that the file's bytes changed, because the filename never changes when the approved image is corrected. This is architecturally different from the JS/CSS bundle (which IS content-hashed and therefore cache-safe) — and is a real, fixable gap.

## Secondary root causes

- **Category J — TEST FALSE POSITIVE (procedural, not technical):** every dedicated SmokeCraft Playwright suite in this repository (48 of 58 files) launches a real browser but targets `localhost` exclusively — none has ever been technically able to target production. Every pass has disclosed this honestly in its own final status line (`ENGINEERING COMPLETE — NOT YET LIVE VERIFIED`), but the operation-level pattern of repeated new prompts reporting the same category of live symptom suggests this qualification is not preventing the underlying question ("is this actually fixed for the user") from recurring. This is not a broken test — it is a **structural gap between what can be tested and what needs to be verified**, until live access exists.
- **Category K — DOCUMENTATION/ARCHITECTURE DRIFT (real but non-functional):** three stale session-order arrays (`SMOKECRAFT_FLOW`, `JOURNEY_STEPS`, unused reward `visit` metadata) were found and marked deprecated in the prior pass, re-confirmed still dead this pass. These cannot cause a live symptom (traced to zero real consumers) but could mislead a future engineer into "fixing" the wrong file.
- **Category B — ASSET DEFECT (already found and fixed):** the Venue Selection under-sized header + wrong button label, fixed in the Approved Entry Visual Restoration pass, re-confirmed still fixed this pass.
- **Category F — JOURNEY-STATE DEFECT (already found and fixed):** the original two-uncoordinated-stores defect (Greg Guy/Romeo y Julieta 1875/Carlos Mendoza/63% leaking across journeys), fixed in the Clean-Start pass, re-confirmed this pass via a fresh live-browser "corrupt legacy state" profile test (Profile G: seeded exactly this stale data, confirmed the landing page correctly showed `START SMOKECRAFT JOURNEY` with no leakage into the CTA, no resume to a phantom S27).
- **Category H — STORAGE/PERSISTENCE (suspected, unproven):** whether the client-side "Start New Journey" reset also clears/archives server-side Golden Box/Packaging Studio draft state was not re-verified this pass (would require server-side journey-scoping code this pass's scope did not trace fully) — flagged as an open question, not silently assumed fine.

## Why prior fixes did not solve "the full problem"

Because "the full problem," as reported, has always been a **live** symptom, and every prior fix — genuinely correct, genuinely tested — was only ever verified against **local** infrastructure. A correct local fix does not, by itself, prove the live symptom is gone; it only proves that *if* the fix is deployed and *if* no caching layer intervenes, the symptom should not recur. Neither of those two conditions has ever been confirmable from any session in this operation.

## Why prior tests passed

Because they tested real things, correctly, against the only infrastructure available to them (local dev/preview builds) — not because they were poorly written. See `10-TEST-VALIDITY-AUDIT.md`.

## Why live behavior differed (best-evidence hypothesis, not proven)

Most likely one or both of: (a) Railway was not serving the fix commit at the time it was checked (deployment status genuinely unknown to every session), and/or (b) a cached copy of an unhashed image asset was served from a browser/CDN cache even after a correct redeploy.

## Confirmed defects (this pass)

None new. All previously-fixed defects re-confirmed still fixed. Two new **disclosed, non-code-defect architectural gaps** identified: no build-time commit marker in the frontend bundle; unhashed `public/`-sourced images.

## Suspected but unproven

1. Whether server-side Golden Box/Packaging Studio state is properly archived on Start New Journey (not re-traced this pass).
2. Whether Railway's actual deployment history contains any failed builds that silently kept an old version live (cannot be checked without dashboard access).
3. Whether `www.noveeos.com` and `crafthub360.up.railway.app` serve the same or different builds (cannot be checked — both unreachable from this session).

## Data-risk assessment

**Low.** No defect found in this pass touches server-persisted data (Passport, Golden Box submissions) destructively; the one unproven item (#1 above) is a completeness question (state not archived), not a data-loss or data-corruption risk.
