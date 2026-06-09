export const VENUES = [
  {
    id: 'venue-grand-lounge',
    name: 'Grand Lounge',
    address: '150 West 46th St',
    city: 'New York',
    state: 'NY',
    activeEventId: 'event-cigar-cognac',
    availableStamps: ['stamp-event-grand-opening', 'stamp-connection-match', 'stamp-collector-night'],
    description: 'An exclusive members lounge specializing in premium cigars, aged spirits, and curated experiences.',
    capacity: 80,
    tier: 'VIP Venue',
  },
  {
    id: 'venue-bottle-house',
    name: 'The Bottle House',
    address: '420 Peachtree St NE',
    city: 'Atlanta',
    state: 'GA',
    activeEventId: 'event-capital-culture',
    availableStamps: ['stamp-vip-dinner', 'stamp-connection-match'],
    description: 'A private wine and spirits club with curated vertical tastings and investment-grade cellars.',
    capacity: 50,
    tier: 'Verified Venue',
  },
]

export function findVenue(id) {
  return VENUES.find(v => v.id === id) || null
}
