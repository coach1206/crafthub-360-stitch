/**
 * NCIE Knowledge Engine
 * Delivers structured learning content for each Craft360 vertical.
 * Content outlines are NOVEE OS internal truth. AI may personalize delivery but cannot override facts.
 */

import { getTaxonomyForCraft, getDomainsForCraft, getTopicsForDomain } from '../../data/ncie/knowledgeTaxonomy.js'
import { getCraftEntry } from '../../data/ncie/craftCatalog.js'

const topicProgressStore = new Map()

export function getCraftKnowledgeMap(moduleId) {
  const craft = getCraftEntry(moduleId)
  if (!craft) return { ok: false, error: 'vertical_not_registered', moduleId }

  const taxonomy = getTaxonomyForCraft(moduleId)
  return {
    ok:            true,
    moduleId,
    displayName:   craft.displayName,
    domains:       taxonomy.domains ?? [],
    knowledgeMode: 'knowledge_available',
    contentStatus: 'internal_outline',
    message:       'Knowledge map generated from NOVEE OS internal outlines. AI may personalize delivery but verified outlines are the source of truth.',
  }
}

export function getTopicContent(moduleId, topicId) {
  const domains = getDomainsForCraft(moduleId)
  let foundTopic = null
  let foundDomain = null

  for (const domain of domains) {
    const topic = domain.topics?.find(t => t.topicId === topicId)
    if (topic) { foundTopic = topic; foundDomain = domain; break }
  }

  if (!foundTopic) {
    return { ok: false, error: 'topic_not_found', moduleId, topicId }
  }

  return {
    ok:            true,
    moduleId,
    domainId:      foundDomain.domainId,
    domainName:    foundDomain.displayName,
    topicId:       foundTopic.topicId,
    topicName:     foundTopic.displayName,
    level:         foundTopic.level,
    contentStatus: 'outline_available',
    aiEnhancement: 'ai_enhancement_preview',
    outline:       getTopicOutline(moduleId, topicId),
    message:       'Topic content returned from internal outline. OpenAI may personalize explanation but internal outline is the source of truth.',
  }
}

function getTopicOutline(moduleId, topicId) {
  const OUTLINES = {
    smokecraft: {
      anatomy: {
        sections: [
          { title: 'The Wrapper', summary: 'The outermost leaf. Sets the first impression, contributes 30-60% of flavor.' },
          { title: 'The Binder', summary: 'Holds the filler together. Contributes body and burn consistency.' },
          { title: 'The Filler', summary: 'The interior blend of leaves. Determines strength and complexity.' },
          { title: 'The Cap', summary: 'The sealed head of the cigar. Cut before smoking.' },
          { title: 'The Foot', summary: 'The open end that is lit.' },
        ],
      },
      flavor_wheel: {
        sections: [
          { title: 'Primary Flavor Families', summary: 'Earth, wood, spice, sweet, creamy, floral, herbal, leather.' },
          { title: 'Strength vs. Body', summary: 'Strength is nicotine impact. Body is flavor complexity and density.' },
          { title: 'Retrohaling', summary: 'Exhaling through the nose to capture volatile aromatic compounds.' },
        ],
      },
      humidor_basics: {
        sections: [
          { title: 'Ideal Conditions', summary: '65-70% relative humidity, 65-70°F temperature.' },
          { title: 'Seasoning Your Humidor', summary: 'Season new wood before loading cigars to prevent moisture absorption.' },
          { title: 'Hygrometer Calibration', summary: 'Use a salt test or digital calibration kit to verify accuracy.' },
        ],
      },
    },
  }

  return OUTLINES[moduleId]?.[topicId] ?? {
    sections: [
      { title: 'Overview', summary: `Core concepts for topic: ${topicId}.` },
      { title: 'Key Principles', summary: 'Principal knowledge nodes. Full content available from certified instructors.' },
    ],
  }
}

export function markTopicStarted(guestId, moduleId, topicId) {
  if (!guestId || !moduleId || !topicId) return { ok: false, error: 'missing_required_fields' }
  const key = `${guestId}:${moduleId}:${topicId}`
  topicProgressStore.set(key, { status: 'in_progress', startedAt: new Date().toISOString() })
  return { ok: true, guestId, moduleId, topicId, status: 'in_progress', storageMode: 'memory_fallback' }
}

export function markTopicCompleted(guestId, moduleId, topicId) {
  if (!guestId || !moduleId || !topicId) return { ok: false, error: 'missing_required_fields' }
  const key = `${guestId}:${moduleId}:${topicId}`
  topicProgressStore.set(key, { status: 'completed', completedAt: new Date().toISOString() })
  return { ok: true, guestId, moduleId, topicId, status: 'completed', xpAwarded: 25, storageMode: 'memory_fallback' }
}

export function getGuestTopicProgress(guestId, moduleId) {
  if (!guestId || !moduleId) return { ok: false, error: 'missing_required_fields' }
  const prefix = `${guestId}:${moduleId}:`
  const completed = []
  const inProgress = []
  for (const [key, val] of topicProgressStore) {
    if (!key.startsWith(prefix)) continue
    const topicId = key.slice(prefix.length)
    if (val.status === 'completed') completed.push(topicId)
    else inProgress.push(topicId)
  }
  return { ok: true, guestId, moduleId, completed, inProgress, storageMode: 'memory_fallback' }
}
