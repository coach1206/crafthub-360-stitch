# 04 — Service Worker Audit

## Finding (confirmed this pass, first surfaced by the prior root-cause audit)

`src/main.jsx` (lines 29–33, present before this pass) unconditionally unregisters every service worker on every page load:

```js
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister())
  })
}
```

with the comment "TEMP: unregister any existing service workers so stale cached frontend assets are dropped while we verify the latest build is actually serving live."

## Disposition this pass

**No service worker is actively maintained or registered by this application.** `dist/offline.html` and `manifest.webmanifest` are PWA scaffold artifacts from an earlier/different effort, but nothing in `src/` registers a service worker — the only service-worker-related code is the unregister call above. Per the mandate's own instruction ("If no service worker exists: document that fact; do not add one solely for this fix"), no service worker was added. The existing unregister call is left in place (it is strictly protective — it can only remove a stale registration, never create staleness) and its comment is updated to reflect that it is now a permanent safety net rather than a temporary diagnostic, since the underlying question it was investigating is answered by this pass's broader build-identity work.

## Comment updated

`src/main.jsx`'s comment changed from "TEMP: ... while we verify the latest build is actually serving live" to a permanent explanation, since leaving "TEMP" language in shipped code that is not actually temporary was itself a small disclosed source of confusion.
