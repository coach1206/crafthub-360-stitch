export const BENEFITS = [
  {
    id: 'benefit-vip-lounge',
    name: 'VIP Lounge Access',
    provider: 'Grand Lounge',
    providerLocation: 'New York, NY',
    expiration: 'Tonight',
    expirationDate: 'Jun 14, 2026',
    eligibility: 'Verified Member',
    redemption: 'Show Passport QR at the host stand. Valid for one entry.',
    description: 'Exclusive access to the VIP section of Grand Lounge during tonight\'s Cigar & Cognac event.',
    category: 'Access',
    icon: 'key',
    saved: false,
  },
  {
    id: 'benefit-complimentary-tasting',
    name: 'Complimentary Tasting Flight',
    provider: 'The Bottle House',
    providerLocation: 'Atlanta, GA',
    expiration: 'Jun 22, 2026',
    expirationDate: 'Jun 22, 2026',
    eligibility: 'Aficionado Tier+',
    redemption: 'Present QR at the bar before 8 PM.',
    description: 'A curated 4-pour tasting flight of rare single malts, courtesy of The Bottle House.',
    category: 'Hospitality',
    icon: 'local_bar',
    saved: true,
  },
  {
    id: 'benefit-priority-rsvp',
    name: 'Priority RSVP Access',
    provider: '360 Passport Connections',
    providerLocation: 'All Venues',
    expiration: 'Jul 31, 2026',
    expirationDate: 'Jul 31, 2026',
    eligibility: 'All Verified Members',
    redemption: 'Automatically applied when you RSVP through the app.',
    description: 'First access to RSVP for all 360 Passport events before general release.',
    category: 'Access',
    icon: 'star',
    saved: true,
  },
]

export function findBenefit(id) {
  return BENEFITS.find(b => b.id === id) || null
}
