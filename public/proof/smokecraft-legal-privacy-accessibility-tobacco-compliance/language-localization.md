# Language / Localization

- Tobacco warning policy versions are stored per-locale (`policy_versions.locale`), with real English (`en`) and Spanish (`es`) draft rows sharing the same `effective_date` and conceptual version — so a translated warning maps to the correct policy version rather than being a disconnected hand-copy.
- No legal text is embedded in an image anywhere in this package — all policy/warning text is stored and served as plain text (`body_markdown` column).
- Fallback language: `consent_records`/`policy_acceptances` default `locale='en'` when not specified — explicit fallback, not silent.
- Translations are explicitly NOT approved by counsel — both language versions carry `counsel_review_status='pending'`.
