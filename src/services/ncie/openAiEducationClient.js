/**
 * NCIE OpenAI Education Client
 * Personalizes educational explanation, mentor responses, and analogies using OpenAI.
 * Returns ai_unavailable when VITE_OPENAI_KEY is not configured.
 * NEVER sends payment data, bank data, Stripe tokens, tax IDs, or sensitive venue/vendor records to OpenAI.
 * NEVER uses OpenAI as the source of truth — internal NCIE outlines are always authoritative.
 */

const AI_SAFETY_BLOCKED_FIELDS = [
  'stripeToken', 'stripe_token', 'accessToken', 'access_token', 'refreshToken', 'refresh_token',
  'bankAccount', 'bank_account', 'routingNumber', 'routing_number', 'accountNumber', 'account_number',
  'taxId', 'tax_id', 'ein', 'ssn', 'cardNumber', 'card_number', 'cvv', 'webhookSecret', 'webhook_secret',
  'secretKey', 'secret_key', 'apiKey', 'api_key', 'password', 'privateKey', 'private_key',
  'venuePayoutAccount', 'partnerPayoutAccount',
]

function getOpenAIKey() {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OPENAI_KEY) {
    return import.meta.env.VITE_OPENAI_KEY
  }
  if (typeof process !== 'undefined' && process.env?.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY
  }
  return null
}

function sanitizePayload(payload) {
  if (!payload || typeof payload !== 'object') return payload
  const safe = {}
  for (const [k, v] of Object.entries(payload)) {
    if (AI_SAFETY_BLOCKED_FIELDS.includes(k)) {
      safe[k] = '[REDACTED]'
    } else if (typeof v === 'object' && v !== null) {
      safe[k] = sanitizePayload(v)
    } else {
      safe[k] = v
    }
  }
  return safe
}

function buildEducationSystemPrompt(mentorPersona, topicContext) {
  return [
    mentorPersona ?? 'You are a knowledgeable craft educator.',
    'You are providing educational guidance only.',
    'Do not give financial advice, tax advice, medical advice, or legal advice.',
    'Do not claim to have live AI capability or real-time data.',
    'Do not fabricate facts. The internal NCIE knowledge outline is the source of truth.',
    'Keep responses concise, engaging, and accurate to the verified outline provided.',
    topicContext ? `Topic context: ${topicContext}` : '',
  ].filter(Boolean).join('\n')
}

export async function getAIPersonalizedExplanation({ mentorPersona, topicOutline, userQuestion, topicContext = null, guestContext = {} }) {
  const key = getOpenAIKey()

  if (!key) {
    return {
      ok:          false,
      aiStatus:    'ai_unavailable',
      reason:      'openai_key_not_configured',
      fallback:    topicOutline,
      message:     'OpenAI key not configured. Returning internal outline as fallback. AI personalization is not active.',
    }
  }

  if (!userQuestion) {
    return { ok: false, error: 'user_question_required' }
  }

  const safeGuestContext = sanitizePayload(guestContext)
  const systemPrompt     = buildEducationSystemPrompt(mentorPersona, topicContext)

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user',   content: `Internal outline (source of truth):\n${JSON.stringify(topicOutline)}\n\nGuest question: ${userQuestion}\n\nGuest context: ${JSON.stringify(safeGuestContext)}` },
  ]

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model:       'gpt-4o-mini',
        messages,
        max_tokens:  500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return {
        ok:       false,
        aiStatus: 'ai_error',
        error:    err?.error?.message ?? 'openai_request_failed',
        fallback: topicOutline,
        message:  'OpenAI request failed. Returning internal outline as fallback.',
      }
    }

    const data    = await response.json()
    const content = data?.choices?.[0]?.message?.content ?? ''

    return {
      ok:          true,
      aiStatus:    'ai_response_received',
      content,
      model:       data?.model,
      usage:       data?.usage,
      fallback:    topicOutline,
      disclaimer:  'AI response personalized from internal NCIE outline. The outline is the source of truth, not the AI.',
      message:     'AI personalization successful. Internal outline remains authoritative.',
    }
  } catch (err) {
    return {
      ok:       false,
      aiStatus: 'ai_error',
      error:    err?.message ?? 'network_error',
      fallback: topicOutline,
      message:  'OpenAI request failed. Returning internal outline as fallback.',
    }
  }
}

export function getAIStatus() {
  const key = getOpenAIKey()
  return {
    aiAvailable:   !!key,
    aiStatus:      key ? 'ai_key_present' : 'ai_unavailable',
    aiMode:        'ai_personalization_preview',
    safetyNote:    'Payment data, bank data, Stripe tokens, tax IDs, and sensitive records are never sent to OpenAI.',
    sourceOfTruth: 'Internal NCIE knowledge outlines are always the source of truth. OpenAI personalizes delivery only.',
    message:       key
      ? 'OpenAI key detected. AI personalization available in preview mode.'
      : 'OpenAI key not configured. AI personalization is unavailable. Internal outlines will be used as fallback.',
  }
}
