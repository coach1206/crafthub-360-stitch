const hasWebhookSecret = () => !!process.env.WEBHOOK_SECRET

export function getWebhookReadiness() {
  return {
    status: hasWebhookSecret() ? 'webhook_secret_present' : 'webhook_secret_required',
    webhookReady: false,
    webhook_required: true,
    real_time_push_pending: true,
    external_sync_not_live: true,
    liveConsumerActive: false,
    message: 'webhook_consumer_pending · not yet active',
  }
}

export function processWebhookPreview(payload, provider) {
  return {
    status: 'preview_only',
    provider,
    webhookProcessed: false,
    webhook_required: true,
    payloadReceived: !!payload,
    external_sync_not_live: true,
    message: 'webhook_processing_preview_only',
  }
}

export function validateWebhookSignaturePreview(signature, payload) {
  return {
    status: 'preview_only',
    signatureValid: false,
    webhook_secret_required: !hasWebhookSecret(),
    message: 'webhook_signature_validation_preview · not yet active',
  }
}

export function buildWebhookNotLiveResponse() {
  return {
    status: 'webhook_consumer_pending',
    webhook_required: true,
    real_time_push_pending: true,
    external_sync_not_live: true,
    liveConsumerActive: false,
  }
}
