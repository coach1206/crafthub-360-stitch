# Mentor Engine Audit

Evidence: fresh re-run this pass — `verify-smokecraft-hf5b2a-mentor-guidance.mjs`
21/21, `verify-smokecraft-hf5b2b1-mentor-voice-service.mjs` 17/17,
`verify-smokecraft-hf5b2b1-mentor-voice-api.mjs` 16/16,
`verify-smokecraft-hf5b2b2-narration-service.mjs` 13/13,
`verify-smokecraft-hf5b2b2-narration-api.mjs` 14/14,
`scripts/validateSmokecraftMentorGuidanceAuthority.mjs` PASS,
`scripts/validateSmokecraftMentorVoiceSecurity.mjs` PASS (81 checks + 2
validators, all clean, zero drift from historical suite counts).

## Mentor assignment / identity

Real, server-owned selection — `validateSmokecraftMentorGuidanceAuthority.mjs`
confirms `Mentor.jsx` retains exactly one write path for the selected
mentor, with no duplicate mentor-ownership path introduced across the
6-screen wiring that reads it (portrait, name, flag, role fields all
sourced from the one real selection record, not re-derived per screen).

## Guidance content

Confirmed genuinely dynamic and honest, not static presentation: "a
fresh guest with zero activity gets an honest fallback/low-signal
state (never fabricated pairing/quiz data)" — an explicit passing
assertion. Guidance content changes based on real recorded
pairing/quiz/lesson activity, not a canned script.

## Voice integration boundary

`ELEVENLABS_API_KEY` is unset in this environment; the server logs an
explicit, honest fallback: `"mentor voice uses Web Speech API
(prototype mode)"` — confirmed live in this pass's server startup log.
This is a real, disclosed integration boundary, not a silently broken
feature. The voice service's own test suite confirms real behavior
around this boundary: out-of-range playback speed is clamped server-
side (never stored as submitted), and preference isolation is
guest-scoped (`validateSmokecraftMentorVoiceSecurity.mjs`: the
voice-preview cache is keyed by `guest_reference`, never a single
global cache that could leak one learner's guidance text to another).

## Feedback persistence / permissions / auditability

Confirmed via the narration-API suite: "one guest's narration/
preference activity never leaks into or overwrites a different
guest's preferences" — real per-guest isolation, not shared mutable
state. Narration is rejected outright (never fabricated) when no
mentor is selected — confirmed by an explicit passing assertion in the
narration-service suite.

## Classification

**Fully functional**, not static presentation and not mock-driven.
Every claimed capability (assignment, guidance content, voice
preferences, narration) has a real backend-owned write path,
guest-scoped isolation, and a currently-passing dedicated test suite.
The one real, disclosed limitation is the ElevenLabs API key being
unset in this environment, which the system itself already handles
honestly via a documented fallback rather than a silent failure — this
is an environment-configuration item (see `16-production-hardening.md`),
not a functional defect in the mentor engine's own code.
