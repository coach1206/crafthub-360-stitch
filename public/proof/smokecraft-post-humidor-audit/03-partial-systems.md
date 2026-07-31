# Partially Complete Systems

1. **Curriculum educational content depth** — structurally complete
   (all files/assets/sequence/shell adoption verified), but per-session
   "required interaction" is only keyword-confirmed for 3 of 21 slots;
   the remaining 18 may have real interactions under different
   terminology, not yet confirmed. See `10-education-audit.md`.
2. **Curriculum-level (non-Golden-Box) leaderboard tie-breaker rule** —
   confirmed present and tested for Golden Box; not located or verified
   for the curriculum XP leaderboard specifically. See
   `07-game-systems-audit.md`.
3. **Challenge Hub live end-to-end flow** — structural validator
   (`validateSmokecraftChallengeHubAuthority.mjs`) passes as part of the
   build; a fresh live click-through of challenge completion was not
   independently re-walked this pass.
4. **Production hardening** — environment validation, logging hygiene,
   and rate limiting are solid; real payment gateway, real production
   secrets, dependency-vulnerability remediation, and a monitoring/
   alerting layer remain unaddressed. See `16-production-hardening.md`.
5. **Support documentation currency** — 14 documents exist under
   `docs/smokecraft/`; their content was not individually re-reviewed
   for currency against the current codebase this pass.

## Basis

Each item above has real, working evidence for part of its scope and a
specific, disclosed, unverified remainder — none is asserted as either
fully complete or fully broken without the qualifying evidence cited in
its companion audit document.
