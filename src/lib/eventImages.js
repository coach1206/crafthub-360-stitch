import craftImages from './craftImages.js'

const eventImageMap = {
  cigarCognac: {
    keywords: ['cigar', 'cognac', 'smokecraft', 'collectors', 'smoke', 'tobacco', 'humidor'],
    imageUrl:  craftImages.events.cigarcognac,
    alt:       'Premium cigar with cognac glass in a luxury lounge setting',
    fallback:  craftImages.fallbacks.cigar,
  },
  privateDinner: {
    keywords: ['dinner', 'private', 'capital', 'culture', 'dining', 'exclusive', 'invite', 'invite only', 'founder', 'investor'],
    imageUrl:  craftImages.events.dinner,
    alt:       'Private executive dinner with candlelit table and premium service',
    fallback:  craftImages.fallbacks.food,
  },
  whiskeyTasting: {
    keywords: ['whiskey', 'bourbon', 'scotch', 'tasting', 'barrel', 'spirits', 'single malt', 'society', 'distillery'],
    imageUrl:  craftImages.events.whiskey,
    alt:       'Whiskey tasting flight with premium bottles in a warm barrel room',
    fallback:  craftImages.fallbacks.whiskey,
  },
  businessMixer: {
    keywords: ['business', 'mixer', 'networking', 'kickoff', 'professional', 'connect', 'meetup', 'atrium', 'passport'],
    imageUrl:  craftImages.events.mixer,
    alt:       'Diverse professionals networking at a premium luxury business mixer',
    fallback:  craftImages.fallbacks.lounge,
  },
  craftExperience: {
    keywords: ['craft', 'masterclass', 'pairing', 'tasting', 'pour', 'cocktail', 'beverage'],
    imageUrl:  craftImages.fallbacks.cocktail,
    alt:       'Premium craft beverage experience with expert guidance',
    fallback:  craftImages.fallbacks.lounge,
  },
  lounge: {
    keywords: ['lounge', 'club', 'vip', 'reserve', 'members'],
    imageUrl:  craftImages.fallbacks.lounge,
    alt:       'Premium lounge atmosphere with luxury ambiance',
    fallback:  craftImages.fallbacks.default,
  },
}

function scoreMatch(keywords, text) {
  const lower = text.toLowerCase()
  return keywords.reduce((score, kw) => score + (lower.includes(kw) ? 1 : 0), 0)
}

export function getEventImage(event) {
  const searchText = [
    event.title        || '',
    event.category     || '',
    event.description  || '',
    event.type         || '',
    event.imageCategory|| '',
  ].join(' ')

  if (event.imageCategory && eventImageMap[event.imageCategory]) {
    return eventImageMap[event.imageCategory]
  }

  let bestKey  = 'lounge'
  let bestScore = 0

  for (const [key, entry] of Object.entries(eventImageMap)) {
    const score = scoreMatch(entry.keywords, searchText)
    if (score > bestScore) { bestScore = score; bestKey = key }
  }

  return eventImageMap[bestKey]
}

export default eventImageMap
