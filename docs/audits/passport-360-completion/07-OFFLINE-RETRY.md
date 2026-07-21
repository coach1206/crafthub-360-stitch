# Phase 7 — Offline, Stale, and Retry Behavior

## Inspection

No PWA/service-worker/offline-queue architecture exists anywhere in this codebase (no `service-worker.js`, no `workbox` dependency, no offline mutation queue). This is a pre-existing fact about the whole application, not specific to Passport.

## What this pass provides

- **Honest offline/error labeling**: `PassportProfile.jsx` distinguishes `loading`/`error`/`offline` states and shows a real, honest banner for each (`"You're offline — Passport data can't be verified right now."` for offline, `"Could not load your real Passport state."` for a generic error) — verified directly via the dedicated suite's error-state check.
- **No client-side write queue**: neither the new sync API client (`passport360ApiClient.js`) nor `PassportProfile.jsx` queues a synchronize call for later retry if offline — a failed request simply surfaces the honest error state described above. This matches the mandate's guidance: *"If only cached viewing exists, state that honestly. If no offline support exists, show an honest connection error. Do not create a shallow queue system in this pass unless directly required."* No queue system was built.
- **Safe retries**: `synchronize()` is naturally safe to retry any number of times (idempotent by design — see `03-SMOKECRAFT-SYNC.md`), so even without a formal retry-queue, a user manually retrying (e.g., reloading the page) after a failed sync cannot create duplicate stamps, duplicate XP, or duplicate sessions.
- **Conflict reconciliation**: not applicable — there is no multi-writer conflict scenario in this design (only the server ever computes stamp/XP values; the client never submits a competing value to reconcile against).
- **Server-authoritative result after reconnect**: confirmed — every `GET` always re-reads live from PostgreSQL; there is no client-cached "last known good" Passport state held in `localStorage` that could grow stale and be mistaken for current truth.

## Conclusion

Cached/offline **viewing** is not currently supported (no last-known-state cache exists) and this is disclosed honestly rather than claimed. Offline **write synchronization** is correctly not claimed anywhere in the UI or API. This matches the mandate's requirement to be honest about the real level of offline support rather than overstating it.
