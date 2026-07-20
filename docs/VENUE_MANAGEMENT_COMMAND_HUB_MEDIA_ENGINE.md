# Venue Management Command Hub — Media Engine

See `VENUE_MANAGEMENT_COMMAND_HUB_MEDIA_STORAGE.md` (storage abstraction,
production status) and `VENUE_MANAGEMENT_COMMAND_HUB_MEDIA_SECURITY.md`
(validation/isolation guarantees) for full detail. Summary: upload →
`imageValidation.validateImageBuffer` (MIME sniff + size + dimensions) →
`storageAdapter.upload` (server-generated key, local disk) →
`venue_management_media` row insert, with cleanup-on-DB-failure. Read
path: controlled `/file` route re-checks venue ownership every request.
Usage tracking (`checkMediaUsage`) blocks archiving media currently
assigned to a profile's logo/hero/gallery.
