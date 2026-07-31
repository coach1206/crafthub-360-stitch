# 11 — API Test Results

`verify-smokecraft-required-interaction-package-a-api.mjs` against the real running server, zero
mocking. **26/26 passed.**

Covers: identity auto-provisioning; empty/malformed submission rejection; completion blocked
without evidence; successful submission + completion; server-owned XP/progression; duplicate
submission idempotency; duplicate completion idempotency; cross-player isolation (a stranger
cannot see or complete another guest's session); all three sessions' full flows; distinct
per-session vocabulary enforcement (cross-session ids rejected); concurrent submission
exactly-once; malformed payload / missing idempotency key rejection; confirmation that sessions
outside Package A's scope are unaffected.

Raw results: `api-results.json` (same directory).
