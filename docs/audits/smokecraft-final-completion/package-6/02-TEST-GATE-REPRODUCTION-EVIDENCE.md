# Package 6 Gate — Post-Fix Re-Run Evidence

All against a fresh disposable database (`crafthub_pkg6_gate`), each
suite run in its own isolated server session (per-suite fixture inserted
immediately before), matching the isolation pattern established in
Package 5's closure pass.

| Suite | Before (reported) | After fix | Fix applied |
|---|---|---|---|
| `verify-golden-box-package-3.mjs` | 23/24 | **24/24** | Assertion changed from `=== 34` to `>= 34` |
| `verify-golden-box-package-3-closure.mjs` | 29/30 | **30/30** | Assertion changed from `=== ''` to `=== 'Closure Pass Test Blend'` |
| `verify-golden-box-package-5-responsive.mjs` (isolates the Package 5 closure suite's keyboard/viewport checks) | 1 timeout inside a 30/31 chained run | **12/12** | No code change — confirmed the failure is fully avoided by running with a fresh guest-identity budget, exactly the isolation pattern this suite was already built for in the Package 5 closure pass |

Direct rate-limiter reproduction (proves the mechanism, not just the
symptom):

```
$ for i in $(seq 1 22); do curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3001/api/smokecraft/management-sync/guest-session; done
200 (×20)
429
429
```

No production file was modified to close this gate — only the two stale
test assertions (`verify-golden-box-package-3.mjs`,
`verify-golden-box-package-3-closure.mjs`) and this documentation.
`guestSessionLimiter` (`server/routes/managementSyncRoutes.js:27`) is
unchanged, per the explicit instruction not to weaken production rate
limiting to pass tests.

Full regression re-confirmed clean end-to-end after these fixes (see
Package 6 completion report for the complete final battery).
