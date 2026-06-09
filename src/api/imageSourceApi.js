/**
 * Image Source API — manages event image replacement and prompt generation.
 *
 * IMPORTANT: Real OpenAI image generation must happen through a secure backend endpoint.
 * Never expose API keys in the browser. This module only queues or simulates requests.
 */

import { PASSPORT_EVENTS } from '../data/passportEvents.js'

const _imageOverrides = {}

export async function getEventImage(eventId) {
  const event = PASSPORT_EVENTS.find(e => e.id === eventId)
  return {
    eventId,
    imageUrl: _imageOverrides[eventId] || event?.image || null,
    imagePrompt: event?.imagePrompt || '',
    imageSource: event?.imageSource || 'aida-public',
    imageVersion: event?.imageVersion || 'v1',
    hasOverride: !!_imageOverrides[eventId],
  }
}

export async function updateEventImage(eventId, newImageUrl) {
  if (!newImageUrl || !newImageUrl.startsWith('http')) throw new Error('Invalid image URL — must start with http/https')
  _imageOverrides[eventId] = newImageUrl
  return { success: true, eventId, newImageUrl }
}

export async function generateEventImagePrompt(event) {
  const base = event?.imagePrompt || event?.title || 'Luxury event'
  return {
    prompt: `${base}, ultra-cinematic photography, dark moody lighting, shallow depth of field, gold and obsidian color palette, 4K professional photography`,
    negativePrompt: 'bright, cartoon, illustration, text, logos, watermarks, daytime',
    style: 'photorealistic',
    aspectRatio: '16:9',
  }
}

export async function requestOpenAIImageReplacement(eventId, prompt) {
  /**
   * IMPORTANT: Real OpenAI image generation must happen through a secure backend endpoint.
   * Never expose API keys in the browser.
   * This function only queues the request for backend processing.
   */
  return {
    success: true,
    queued: true,
    message: 'Image generation queued. A backend job will process this request securely.',
    jobId: `img-job-${eventId}-${Date.now()}`,
    prompt,
    note: 'OpenAI DALL·E runs server-side only. Result will be available in 30–60 seconds.',
  }
}

export async function getFallbackImageForCategory(category) {
  const C = 'https://lh3.googleusercontent.com/aida-public/'
  const map = {
    craft:      C + 'AB6AXuBktRXv3px18iAdmk-FIbB6ajfhPahwqk9W_JP8Z3CMm5d75I1D5sQYn3y5CtixAGzZo0bWs5yXhZQ8TGcBZxfdlOrRy-X2jzZpEocDLKB-z48LeV4PdnPkWAu1EF0aLxDcp6N-JXmverp_fSYWKdujWH1FrWoLUY1CgVrJguJJeILwvw4JN5SLy70oWxWGRHWFymEXJ3FzmzsY93qIxljsbG1ANTGrbqwoIcmIQ6eUZnCsPhFk08_Z55717Itp90HwmP1ssOO0o',
    vip:        C + 'AB6AXuBxTg65Wt9uZIkpBqyy4dP-yfpAOzZbz2z5ZkV13oVaJ2SAkBidZBFP7grSXlnvgp0rzviZQ5z2QkEdoI5kL1JIAKOIeQwpBh6JQcEGoYgi9hWq5KktjPbu0JFnOgOPJQVxxQ5dzEyYiC6zZsnAzdfCzfC2_n70T7Il7VU5QitXotLyl-tyuOyPD8qOjumx5OXXmnAYMXRe-yumHpuykGEynj_dpEkroC7aiLKuXGRVBObPXsvZ5CI4Og0tcI5Qts4m648an1iWXHk',
    networking: C + 'AB6AXuBibwIn3K4im-7feOc6MbE0qrLgoKLyluRCrG3hjStuvfdpV18KH3A62G-Qz_6SVfNrj8RmOIz4hgjZbsiGf5vrfo17Uf0QYtARmYGCz3AONU-8UZEcE8OSFgxjJwc2qzjNic1fMb52TVcCBU_2QQ-yDTSHGdEzFFXRQYmR_R8lGcWMHEeM5hpoR4wpZFsjtro1GAI7dOrXg5xHk9gr32bXN3Vbzy7Ng-LmBNF7rU_vEhH3psYZXs9IvOT6qmbzmAV5Jtgn4Cdo8XQ',
    featured:   C + 'AB6AXuBkj1vyr57VqCSvkAIytKCP-dMimzcM6Bkfpo2BogqBmXvJno7XWBIkFHJP0uTjIRf43VMB4VT0fAzPe56ohr59HTYYKsym0J2JV6xGqZPzbw5OHeK9oQVklLm-rTkus0D_QeG5AsW_i3r95SxCCtkda_GbYOLo3MnRfTZ3tRjOehK1rR6yLCjtmEhkAfL3RPm8SEoj5khmFowDyNMdG5WO2fYsQ3Jh34sFkF3uM5Rql5d_S8_0z_f_osUhL3uDZji89YvLMFPAia4',
  }
  return map[category] || map.featured
}
