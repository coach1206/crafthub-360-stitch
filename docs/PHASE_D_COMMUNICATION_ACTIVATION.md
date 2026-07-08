# Phase D.5 — Communication Activation

## Status: BUILD ONLY — NO REAL MESSAGE DELIVERY

This phase registers communication providers, channels, and message areas. It does not enable live message delivery of any kind.

## Safety Constraints

- Do NOT send real emails, SMS messages, push notifications, vendor messages, guest messages, staff alerts, or security alerts.
- Do NOT claim delivery succeeded unless a real provider response exists.
- Do NOT fake delivery confirmations or provider connections.
- Do NOT store provider API keys, SMTP passwords, or messaging credentials.
- All real delivery flags default to FALSE.
- All provider connected flags default to FALSE.
- Message previews are records only — not sent messages.
- Queue previews are not live delivery queues.
- Delivery attempt records have preview_only: true by default.

## Providers (10)

SendGrid, Mailgun, Twilio, Firebase Cloud Messaging, OneSignal, Manual Email, Manual SMS, In-App Notifications, Staff Alert Center, Future Provider Placeholder

## Channels (10)

Email, SMS, Push Notifications, In-App Notifications, Staff Alerts, Manager Alerts, Guest Messaging, Vendor Messaging, System Alerts, Security Alerts

## Message Areas (20)

Staff Alert, Manager Alert, Guest Message, Vendor Message, Inventory Alert, Payment Alert, POS Order Alert, Reservation Alert, Loyalty Message, Passport Message, SmokeCraft Message, CraftHub Message, E.A.T. Command Alert, Security Alert, System Health Alert, Marketplace Message, Campaign Message, Manual Message, Opt-In Management, Compliance and Risk

## Feature Flags

All real delivery and provider-connected flags default FALSE. Enforcement flags default TRUE.

Key flags locked to FALSE:
- COMMUNICATION_REAL_EMAIL_DELIVERY_ENABLED
- COMMUNICATION_REAL_SMS_DELIVERY_ENABLED
- COMMUNICATION_REAL_PUSH_DELIVERY_ENABLED
- COMMUNICATION_REAL_VENDOR_MESSAGE_DELIVERY_ENABLED
- COMMUNICATION_REAL_GUEST_MESSAGE_DELIVERY_ENABLED
- COMMUNICATION_REAL_STAFF_ALERT_DELIVERY_ENABLED
- COMMUNICATION_AUTO_SEND_ENABLED
- COMMUNICATION_SENDGRID_CONNECTED
- COMMUNICATION_MAILGUN_CONNECTED
- COMMUNICATION_TWILIO_CONNECTED
- COMMUNICATION_FIREBASE_CONNECTED
- COMMUNICATION_ONESIGNAL_CONNECTED
- COMMUNICATION_EXTERNAL_PROVIDER_WEBHOOK_PROCESSING_ENABLED

## API Routes

Mounted at `/api/phase-d/communication-activation`

All POST/PATCH routes require `canAccessPOS3` middleware.

## Database Tables (49)

- communication_provider_registry
- communication_credential_presence_log
- communication_channel_registry
- communication_area_registry
- communication_sendgrid_contracts
- communication_mailgun_contracts
- communication_twilio_contracts
- communication_firebase_contracts
- communication_onesignal_contracts
- communication_manual_email_records
- communication_manual_sms_records
- communication_template_registry
- communication_template_versions
- communication_template_approvals
- communication_message_previews
- communication_queue_previews
- communication_delivery_attempt_records
- communication_delivery_status_records
- communication_recipient_groups
- communication_opt_in_profiles
- communication_opt_out_records
- communication_rate_limit_profiles
- communication_quiet_hour_profiles
- communication_webhook_registry
- communication_webhook_health
- communication_live_delivery_lock
- communication_tenant_mappings
- communication_module_mappings
- communication_compliance_checklist
- communication_risk_flags
- communication_activation_audit
- communication_staff_alert_profiles
- communication_manager_alert_profiles
- communication_guest_message_profiles
- communication_vendor_message_profiles
- communication_inventory_alert_profiles
- communication_payment_alert_profiles
- communication_pos_order_alert_profiles
- communication_reservation_alert_profiles
- communication_loyalty_message_profiles
- communication_passport_message_profiles
- communication_smokecraft_message_profiles
- communication_crafthub_message_profiles
- communication_eat_command_alert_profiles
- communication_security_alert_profiles
- communication_system_health_alert_profiles
- communication_marketplace_message_profiles
- communication_campaign_message_profiles
- communication_manual_message_profiles

## Locales

Supported: en-US, es-DO, es, ht, de, pt

## Readiness Output

```json
{
  "safety_status": "BUILD_ONLY_NO_REAL_DELIVERY",
  "real_email_delivery": false,
  "real_sms_delivery": false,
  "auto_send_enabled": false,
  "sendgrid_connected": false,
  "no_secret_storage": true
}
```
