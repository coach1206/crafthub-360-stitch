# Cross-Player Denial Proof

Draft ownership is enforced identically to every other player-state endpoint: `req.smokecraftIdentity` is derived server-side from a verified guest-session cookie (`requireSmokeCraftIdentity` middleware, unchanged by this pass), never from anything the client claims — `ownerGuestReference()` scopes every draft query to that identity's `guest_reference` alone.

Verified live in the API suite (`verify-smokecraft-package-a-draft-correction-api.mjs`, section 4): a second, independent guest client reads its own empty draft for `first-third` — it never sees another guest's saved selection, even though both guests are reading the identical route (`GET /tasting/first-third/draft`) with different identity cookies.
