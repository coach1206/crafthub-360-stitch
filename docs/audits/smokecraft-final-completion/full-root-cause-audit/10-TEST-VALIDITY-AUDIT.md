# 10 — Test Validity Audit

## The mandatory question: how could prior tests pass while a live user still saw the wrong result?

**Answer, with evidence (grep run this pass across all 58 `verify-smokecraft-*.mjs` files):**

```
grep -l "chromium.launch" verify-smokecraft-*.mjs | wc -l       → 48 files (real browser automation)
grep -l "localhost:5050\|localhost:5000" verify-smokecraft-*.mjs | wc -l → 47 files (target a local server)
grep -l "crafthub360.up.railway.app" verify-smokecraft-*.mjs | wc -l → 0 files
```

**Every dedicated SmokeCraft test suite in this repository that uses a real browser points at `localhost`, never at the deployed production URL.** This is not a flaw introduced by any one pass — it is the only technically possible choice, since this development environment has never had network access to `crafthub360.up.railway.app` in any pass of this entire operation (re-confirmed `01-DEPLOYMENT-AUDIT.md`). A test cannot verify what it cannot reach.

**This fully explains the repeated pattern:** a pass fixes a real source defect, writes a genuinely real Playwright test against a local preview/dev server, that test genuinely passes (because the fix is genuinely correct in source), the pass reports "ENGINEERING COMPLETE — NOT YET LIVE VERIFIED" (honestly, every single time, verified by re-reading every prior pass's final status line), and then a later prompt reports the same or a related live symptom — because **the live environment was never actually re-checked against the fix**, only asserted as "should now be fixed" based on local evidence. This is not a false-positive in the sense of a broken test asserting something untrue; it is a **scope mismatch between what was tested (local) and what was reported broken (live)**, and every pass has disclosed this honestly in its own final report.

## Per-suite classification (spot check across the 58 files, representative sample)

| Suite | Inspects source text only? | Renders real component? | Traverses real route? | Uses production build? | Asserts image actually visible (not just registered)? | Detects fallback components? | Reports blocked checks as passing? |
|---|---|---|---|---|---|---|---|
| `verify-smokecraft-27-session-sequence.mjs` | Some checks | Yes (48% of checks are live-browser) | Yes — full 27-session sweep | No — preview server (unbuilt-vs-built distinction not tested) | Partially (asset existence on disk, not pixel-visibility) | Not directly | No — explicitly logs `BLOCKED —` and does not count it as a pass (verified this pass by re-reading the script) |
| `verify-smokecraft-approved-entry-visuals.mjs` | Some | Yes | Yes | No | Yes — checks `img.getAttribute('src')` matches the approved filename | Yes — checks the fake-venue-card strings are absent | No |
| `verify-smokecraft-entry-prerequisite-guard.mjs` | Some | Yes | Yes | No | No (not its purpose) | Yes (its core purpose) | No |
| `verify-smokecraft-clean-start-entry-flow.mjs` | Some | Yes | Yes | No | Some | Yes | 1 check explicitly marked `BLOCKED`, not counted as pass |

## Does any test use a stale expected commit hash?

**Yes, structurally, by design and disclosed every time:** every dedicated pass's suite hardcodes that pass's *own* starting commit as an assertion (`git rev-parse HEAD === '<pass-specific-hash>'`). This means **every older dedicated suite will correctly FAIL its own commit-match check once a later pass has moved `HEAD` forward** — this is expected, disclosed behavior (documented in this operation's own recurring notes: "stale-commit-only failures... expected, not real regressions"), not a bug. Confirmed again this pass: none of these are run as part of any "required regression battery" after their own originating pass without this caveat being disclosed.

## Does any test use mocks that conceal the defect?

No mock-based test doubles were found for any SmokeCraft route/component/asset — every dedicated suite either does pure source-text/registry assertions or drives a real Chromium browser against a real running server. No test substitutes a fake DOM or a stubbed image loader that could hide a real rendering defect.

## False-positive test patterns identified, and how to prevent them going forward

1. **Local-only browser testing reported without qualifying it as local-only.** Every pass in this operation has, in fact, qualified this honestly in its final status line (`ENGINEERING COMPLETE — NOT YET LIVE VERIFIED`) — but the *pattern itself* (repeated new prompts reporting the same category of live symptom) suggests the qualification is not surviving into how results are being consumed downstream of this session. **Prevention:** no test change is needed; the fix is procedural — a live-environment check (`01-DEPLOYMENT-AUDIT.md`'s missing piece) must run and pass before any "PASS" status is issued for a live-facing defect, not just an "ENGINEERING COMPLETE" local one.
2. **Asset-registered ≠ asset-rendered ≠ asset-visible-in-production-build.** Already corrected as a stated principle in the blueprint (Approved Entry Visual Restoration pass, rule 3) — re-confirmed this pass to actually be followed in the newer suites (`verify-smokecraft-approved-entry-visuals.mjs` checks `img.src`, not just registry presence).
3. **No suite has ever run against `vite build` + `vite preview` in this operation's SmokeCraft-specific tests** (they use `vite preview` after `npm run build`, which is a production-like build, but the distinction between "production build, local preview" and "actual Railway-deployed production" has not been consistently called out as two different things in every pass's language). **Prevention:** future passes should explicitly label preview-server results as "production-build-equivalent, not live-deployment-equivalent."
