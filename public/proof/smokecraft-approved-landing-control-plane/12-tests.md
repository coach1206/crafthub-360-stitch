# Test + regression output (Approved Asset Control Plane)

Captured 2026-07-24T21:54:24Z

## New suite
```
  PASS  Pairing opens /smokecraft/pairing
  PASS  no destination control resets the journey
  PASS  destination control does not loop back to Landing

============================================================
RESULT: 62 passed, 0 failed
```

## Regressions
```
verify-smokecraft-canonical-runtime                  19 passed, 0 failed
verify-smokecraft-canonical-journey-authority        25 passed, 0 failed
verify-smokecraft-zero-legacy-runtime                9 passed, 0 failed
verify-smokecraft-zero-old-visuals                   20 passed, 0 failed
verify-smokecraft-approved-entry-visuals             24 passed, 0 failed
verify-smokecraft-27-session-sequence                39 passed, 0 failed
```

## Build / startup / health
```
npm run build -> exit 0 (vite built successfully)
vite preview :5050 /smokecraft -> HTTP 200
backend /api/health -> {"success":true,"status":"ok","service":"NOVEE OS Backend","version":"phase-7","db":"postgres","timestamp":"2026-07-24T21:56:44.013Z"}
```
