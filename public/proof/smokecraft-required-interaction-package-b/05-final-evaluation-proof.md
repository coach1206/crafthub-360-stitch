# 05 — Final Evaluation Proof

- Missing any one of the 6 required categories is rejected (`400 all_categories_required`) — verified with a 5-category payload (API test section 5).
- An out-of-range value (0, or any value outside 1-5) or an unknown category key is rejected (`400 invalid_category_value`) — API test section 6.
- A complete, valid submission succeeds (`201`) and the response's `overall` field is a server-computed number in `(0, 5]` — never an echo of anything the client sent (API test section 7; the client never sends an `overall` field to this endpoint at all).
- Completion is denied (`400 scorecard_evidence_required`) until real evidence exists — verified for the submitting guest before evidence (section 5), a stranger guest (section 12), and a raw direct-API bypass attempt carrying fabricated `overall`/`passed`/`xpEarned` fields (section 13) — all three are rejected identically, proving evaluation cannot be skipped by any client path.
