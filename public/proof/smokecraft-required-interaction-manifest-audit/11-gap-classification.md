# Gap Classification (Full Table)

See `05-21-session-implementation-audit.md` for the full 21-row table
with routes, backend, persistence, scoring, progression, mentor, tests,
status, and exact gap per session. This document summarizes by
category per mandate §6/§13:

- **A. COMPLETE_AND_VERIFIED (8)**: 1, 7, 11, 14, 21, 22, 24, 27
- **B. COMPLETE_BUT_UNTESTED (1)**: 25
- **C. PARTIAL (8)**: 3, 4, 8, 12, 15, 16, 19, 23
- **D. VISUAL_ONLY (4)**: 2, 5, 6, 10
- **E. WRONG_INTERACTION_TYPE (0)**: none
- **F. MISSING (0)**: none
- **G. BLOCKED (0)**: none
- **H. DUPLICATED_OR_CONFLICTING (0)**: none

No category was collapsed into a simple pass/fail — every session's
individual classification, and the specific reason for it, is recorded
in the canonical manifest (`src/constants/smokecraftRequiredInteractions.js`)
and reproduced in the 21-row audit table.
