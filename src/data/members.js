export const MEMBERS = [
  {
    id: 'member-david-harper',
    name: 'David Harper',
    role: 'Founder',
    company: 'North & Co.',
    city: 'Austin',
    state: 'TX',
    matchScore: 94,
    portraitKey: 'member1',
    sharedInterests: ['Luxury Hospitality', 'Brand Strategy', 'Travel'],
    sharedEvent: 'Cigar & Cognac Collectors Night',
    trustStatus: 'Verified Member',
    passportTier: 'Aficionado',
  },
  {
    id: 'member-alicia-chen',
    name: 'Alicia Chen',
    role: 'Hospitality Investor',
    company: 'Nexus Capital',
    city: 'New York',
    state: 'NY',
    matchScore: 91,
    portraitKey: 'member4',
    sharedInterests: ['Events', 'Investment', 'WineCraft'],
    sharedEvent: 'Capital & Culture Private Dinner',
    trustStatus: 'Verified Member',
    passportTier: 'Gold',
  },
  {
    id: 'member-olivia-santos',
    name: 'Olivia Santos',
    role: 'Hospitality Strategist',
    company: 'Independent',
    city: 'Atlanta',
    state: 'GA',
    matchScore: 90,
    portraitKey: 'member5',
    sharedInterests: ['Hospitality', 'Events', 'Strategy'],
    sharedEvent: 'Capital & Culture Private Dinner',
    trustStatus: 'Verified Member',
    passportTier: 'Aficionado',
  },
]

export function findMember(id) {
  return MEMBERS.find(m => m.id === id) || null
}
