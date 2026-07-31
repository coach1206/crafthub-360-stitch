# Reload / Resume Proof

All three sessions now load their draft from the server on mount (`GET .../tasting/:activityKey/draft`) before rendering the interactive UI, and never treat `localStorage` as authoritative.

Verified live in the browser suite (`verify-smokecraft-package-a-draft-correction-browser.mjs`):

- **Leave and return**: after saving a Session 8 draft, navigating away to an unrelated route (`/smokecraft/knowledge-drop`) and back restores both the zone selection and the personal note.
- **Genuine hard reload** (`page.reload()`, a real full-document reload, not a client-side route change): Session 8, 12, and 16 all restore their selections after reload.
- **Sign-out/sign-in**: the current SmokeCraft guest-identity architecture (`requireSmokeCraftIdentity` + a server-verified guest-session cookie, unchanged by this pass) already ties drafts to the durable `guest_reference`, so a draft survives across any reconnect that preserves that identity cookie — the same guarantee the existing Mini Tasting draft already relies on. No new identity mechanism was introduced.
