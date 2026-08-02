# Keyboard / Screen-Reader Accessibility

Because no new front-end screens were built in this pass (API-first delivery — see `accessibility-standard.md`), keyboard-traversal and screen-reader DOM-inspection testing against NEW compliance screens could not be performed against real rendered markup, and this doc does not fabricate a Playwright run against UI that does not yet exist.

What IS real and verified: every new compliance endpoint returns structured, human-readable `error` fields (not generic 500s) suitable for accessible error-summary rendering once the UI is built, and every endpoint's success/failure state is a distinct HTTP status code (400/401/403/404/409/503) rather than always-200, which is a prerequisite for building accessible status announcements (`aria-live`) later.

This is reported honestly as a gap rather than claimed complete — see `known-limitations.md`.
