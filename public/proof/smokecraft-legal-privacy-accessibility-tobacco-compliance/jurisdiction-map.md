# Jurisdiction Map (Discovery)

SmokeCraft 360 is a single-codebase, multi-venue platform. Discovery findings:

- **United States (launch target)**: federal tobacco minimum purchase age is 21 (Tobacco 21, 2019). State/local rules vary materially (age, flavor restrictions, delivery/shipping bans, local licensing). This package adds a `compliance_jurisdictions` table so age minimum, tobacco-sale permission, and fulfillment permissions are configured **per jurisdiction code**, not hardcoded globally.
- **State/local venue requirements**: modeled as jurisdiction rows keyed by state code (e.g. `US-FL` seeded as an example, `status='draft'` — NOT active until a real state is configured and counsel-reviewed). No state is silently treated as pre-approved.
- **Dominican Republic / Caribbean expansion (future)**: seeded as `DR`, `status='disabled'`, `tobacco_sales_allowed=false`. Not launch-targeted. Distinct minimum age (18, placeholder) and full legal review required before any activation — the row exists so the schema doesn't silently assume US rules apply.
- **Default/fallback**: `US-DEFAULT` is the only jurisdiction seeded `status='active'`, and even it is `counsel_review_status='pending'` — operational default only, real per-state configuration and counsel sign-off required before wider launch.

No jurisdiction's rules are applied globally by default; every jurisdiction row is independent and shipping defaults to `false` everywhere.
