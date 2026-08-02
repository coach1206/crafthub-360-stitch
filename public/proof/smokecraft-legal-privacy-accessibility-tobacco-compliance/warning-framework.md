# Tobacco Warning Framework

Warnings are stored as versioned `policy_versions` rows (`policy_type='tobacco_warning'`), one per locale/jurisdiction, with `effective_date` and `counsel_review_status`. Current seeded English + Spanish drafts are explicitly marked:

> [COUNSEL REVIEW DRAFT] WARNING: Tobacco products are for adults 21 and older... This placeholder warning text has not been reviewed or approved by legal counsel and must not be treated as final compliant warning language for any jurisdiction.

Both English and Spanish versions exist (`locale='en'` / `'es'`), same `effective_date`, so a translated warning always maps to a real policy version rather than a hand-copied string.

Surfaces this framework is designed to serve (product detail, cart, checkout, receipt, customer status, venue admin, staff fulfillment): the `GET /api/compliance/policies?policyType=tobacco_warning` endpoint returns the current version for a given locale, ready to be rendered as real text (not an image) on each surface. **UI wiring of every one of those seven surfaces is not completed in this pass** — the versioned, server-served warning API is real and tested; front-end placement across all seven listed surfaces is tracked as a known limitation and should be finished as UI work in Package 7 or a dedicated follow-up, not silently claimed done here.
