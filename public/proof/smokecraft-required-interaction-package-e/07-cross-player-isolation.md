# 07 — Cross-Player Denial / Isolation Proof

`smokecraftPassportStampRoutes.js` never trusts a client-supplied `guestId` — `req.goldenBoxGuestReference` is always derived from `req.smokecraftIdentity` (server-verified, cookie/JWT-backed).

## API proof

- Test 15: a fresh, different guest's `GET /status/:anything` → `claimed: false` (never sees another guest's stamp); `GET /guest/me` → empty `stamps` array; `POST /sessions/passport-stamp/complete` → `400 passport_stamp_evidence_required` (cannot ride on another guest's evidence).
- Test bypass (test 5): a completely separate guest, with a fabricated `guestId` field in the claim body, is still evaluated against ITS OWN real server state, not the spoofed id.

## Browser proof

- "A different guest never sees another guest's claimed stamp" / "A different guest's /guest/me never returns another guest's stamps" — separate Playwright browser contexts (separate cookie jars) confirm isolation end-to-end through the real UI/network stack, not just direct API calls.

## Identity-format consistency

`bridgeIdentity()` now derives `req.goldenBoxGuestReference` using the same `user:<id>` (authenticated) / raw guest id (guest) convention as `playerStateService`'s `ownerGuestReference()` — used for BOTH the Passport-360 claim identity and the `smokecraft_session_completions` lookup, closing a documented identity-format mismatch risk that would otherwise have silently desynced stamp lookups for authenticated (non-guest) users.
