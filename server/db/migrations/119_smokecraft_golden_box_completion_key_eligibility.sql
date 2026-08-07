-- UI Handoff Closure gate: adds the 'required_completion_keys' eligibility
-- rule type — checks the real 27-session spine's own completion ledger
-- (smokecraft_session_completions), independent of the optional venue
-- Management Sync journey table 'required_sessions' reads (most guests,
-- with no real venue selected, never populate that table at all).
-- Used to require Session 27 ('session-complete') before Golden Box
-- entry — entryService.createEntry() now genuinely enforces eligibility
-- server-side (previously it created entries unconditionally regardless
-- of any configured rule).
ALTER TABLE golden_box_eligibility_rules DROP CONSTRAINT IF EXISTS golden_box_eligibility_rules_rule_type_check;
ALTER TABLE golden_box_eligibility_rules ADD CONSTRAINT golden_box_eligibility_rules_rule_type_check CHECK (rule_type IN (
  'required_sessions','min_quiz_score','min_xp','required_badge',
  'required_passport_stamp','venue_membership','registration_window',
  'max_entries','admin_approval','required_completion_keys'
));
